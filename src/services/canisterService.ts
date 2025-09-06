import mongoose from "mongoose";
import Canister from "../models/conisters";
import Ingredients from "../models/ingredient";
import VendingMachine from "../models/vendingMModel";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";

// Create Canister
export const createCanister = async (data: any) => {
    const { name, machineId, capacity, currentLevel = 0 } = data;

    if (!name || !machineId || !capacity) {
        throw new Error("name, machineId, and capacity are required");
    }

    

    // Validate capacity and currentLevel
    if (capacity <= 0) {
        throw new Error("Capacity must be greater than 0");
    }

    if (currentLevel < 0 || currentLevel > capacity) {
        throw new Error("Current level must be between 0 and capacity");
    }

    const canister = await Canister.create({ name, machineId, capacity, currentLevel });

   

    // Log the creation
    await AuditLog.create({
        action: AuditAction.CANISTER_CREATED,
        canisterId: canister._id,
        machineId: canister.machineId,
        userId: 'system',
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        meta: {
            name: canister.name,
            capacity: canister.capacity,
            currentLevel: canister.currentLevel
        }
    });

    return canister;
};

// Get all Canisters with pagination
export const getAllCanisters = async (query: any) => {
    return await paginateAndSearch(Canister, query);
};

// Get Canister by ID
export const getCanisterById = async (id: string) => {
    const canister = await Canister.findById(id).populate('ingredientId');
    if (!canister) {
        throw new Error("Canister not found");
    }
    return canister;
};

// Update Canister
export const updateCanister = async (id: string, data: any) => {
    const { name, capacity, currentLevel } = data;

    const existingCanister = await Canister.findById(id);
    if (!existingCanister) {
        throw new Error("Canister not found");
    }

    // Validate capacity and currentLevel
    if (capacity !== undefined && capacity <= 0) {
        throw new Error("Capacity must be greater than 0");
    }

    const newCapacity = capacity !== undefined ? capacity : existingCanister.capacity;
    const newCurrentLevel = currentLevel !== undefined ? currentLevel : existingCanister.currentLevel;

    if (newCurrentLevel < 0 || newCurrentLevel > newCapacity) {
        throw new Error("Current level must be between 0 and capacity");
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (currentLevel !== undefined) updateData.currentLevel = currentLevel;

    const canister = await Canister.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate('ingredientId');

    if (!canister) {
        throw new Error("Failed to update canister");
    }

    // Log the update
    await AuditLog.create({
        action: AuditAction.CANISTER_UPDATED,
        canisterId: canister._id,
        machineId: canister.machineId,
        userId: 'system',
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        previousValue: existingCanister,
        newValue: canister,
        meta: {
            name: canister.name,
            capacity: canister.capacity,
            currentLevel: canister.currentLevel
        }
    });

    return canister;
};

// Delete Canister
export const deleteCanister = async (id: string) => {
    const canister = await Canister.findByIdAndDelete(id);
    if (!canister) {
        throw new Error("Canister not found");
    }

    // Log the deletion
    await AuditLog.create({
        action: AuditAction.CANISTER_DELETED,
        canisterId: canister._id,
        machineId: canister.machineId,
        userId: 'system',
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        meta: {
            name: canister.name,
            capacity: canister.capacity,
            currentLevel: canister.currentLevel
        }
    });

    return canister;
};

// Assign Ingredient to Canister
export const assignIngredientToCanister = async (canisterId: string, ingredientId: string) => {
    const canister = await Canister.findById(canisterId);
    if (!canister) {
        throw new Error("Canister not found");
    }

    const ingredient = await Ingredients.findById(ingredientId);
    if (!ingredient) {
        throw new Error("Ingredient not found");
    }

    // Check if ingredient is already assigned to this canister
    if (canister.ingredientId.includes(ingredientId as any)) {
        throw new Error("Ingredient is already assigned to this canister");
    }

    const updatedCanister = await Canister.findByIdAndUpdate(
        canisterId,
        { $addToSet: { ingredientId } },
        { new: true, runValidators: true }
    ).populate('ingredientId');

    // Log the assignment
    await AuditLog.create({
        action: 'INGREDIENT_ASSIGNED_TO_CANISTER',
        entityType: 'Canister',
        entityId: canisterId,
        details: {
            canisterName: canister.name,
            ingredientId,
            ingredientName: ingredient.name,
            machineId: canister.machineId
        },
        timestamp: new Date()
    });

    return updatedCanister;
};

// Refill Canister
export const refillCanister = async (canisterId: string, refillAmount: number) => {
    if (refillAmount <= 0) {
        throw new Error("Refill amount must be greater than 0");
    }

    const canister = await Canister.findById(canisterId);
    if (!canister) {
        throw new Error("Canister not found");
    }

    const newLevel = canister.currentLevel + refillAmount;
    if (newLevel > canister.capacity) {
        throw new Error(`Refill amount would exceed capacity. Current: ${canister.currentLevel}, Capacity: ${canister.capacity}, Max refill: ${canister.capacity - canister.currentLevel}`);
    }

    const updatedCanister = await Canister.findByIdAndUpdate(
        canisterId,
        { currentLevel: newLevel },
        { new: true, runValidators: true }
    ).populate('ingredientId');

    // Log the refill
    await AuditLog.create({
        action: AuditAction.CANISTER_REFILLED,
        canisterId: canisterId,
        machineId: canister.machineId,
        quantity: refillAmount,
        unit: 'ml', // Default unit, should be configurable
        userId: 'system',
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        previousValue: canister.currentLevel,
        newValue: newLevel,
        meta: {
            canisterName: canister.name,
            refillAmount: refillAmount
        }
    });

    return updatedCanister;
};

// Consume Ingredients from Canisters
export const consumeIngredientsFromCanisters = async (machineId: string, ingredients: any[]) => {
    const session = await mongoose.startSession();
    
    try {
        let result;
        await session.withTransaction(async () => {
            const canisters = await Canister.find({ machineId }).session(session);
            const ingredientToCanister = new Map();
            
            canisters.forEach(canister => {
                if (canister.ingredientId && Array.isArray(canister.ingredientId)) {
                    canister.ingredientId.forEach((ingredient: any) => {
                        ingredientToCanister.set(ingredient._id.toString(), canister);
                    });
                } else if (canister.ingredientId) {
                    ingredientToCanister.set((canister.ingredientId as any)._id.toString(), canister);
                }
            });

            const consumptionResults = [];

            for (const ingredient of ingredients) {
                const { ingredientId, quantity } = ingredient;
                
                const canister = ingredientToCanister.get(ingredientId.toString());
                if (!canister) {
                    throw new Error(`Ingredient not found in any canister: ${ingredientId}`);
                }

                if (canister.currentLevel < quantity) {
                    throw new Error(`Insufficient ingredient in canister. Available: ${canister.currentLevel}, Required: ${quantity}`);
                }

                // Consume ingredient atomically
                const updated = await Canister.findOneAndUpdate(
                    { _id: canister._id, currentLevel: { $gte: quantity } },
                    { $inc: { currentLevel: -quantity } },
                    { new: true, session }
                );

                if (!updated) {
                    throw new Error(`Concurrent consumption detected for canister: ${canister.name}. Please retry.`);
                }

                consumptionResults.push({
                    canisterId: canister._id,
                    canisterName: canister.name,
                    ingredientId,
                    quantity,
                    previousLevel: updated.currentLevel + quantity,
                    newLevel: updated.currentLevel
                });

                // Log ingredient consumption
                await AuditLog.create({
                    action: AuditAction.INGREDIENT_CONSUMED,
                    ingredientId: ingredientId,
                    quantity: quantity,
                    unit: 'ml', // Default unit, should be configurable
                    userId: 'system',
                    ipAddress: '127.0.0.1',
                    userAgent: 'system',
                    previousValue: updated.currentLevel + quantity,
                    newValue: updated.currentLevel,
                    meta: {
                        canisterId: canister._id,
                        canisterName: canister.name,
                        machineId
                    }
                });
            }

            result = consumptionResults;
        });

        return result;
    } catch (error: any) {
        throw new Error(error.message || "Failed to consume ingredients");
    } finally {
        await session.endSession();
    }
};

// Search Canisters
export const searchCanisters = async (searchTerm: string, query: any) => {
    const searchQuery = {
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } }
        ]
    };

    return await paginateAndSearch(Canister, { ...query, search: searchTerm });
};

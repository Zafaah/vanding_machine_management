import mongoose from "mongoose";
import Sales from "../models/sales";
import SlotInventory from "../models/slotInventory";
import VendingMachine from "../models/vendingMModel";
import SKUProduct from "../models/skuProduct";
import Canister from "../models/conisters";
import Recipe from "../models/recipe";
import Ingredients from "../models/ingredient";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import * as forecastService from "./forecastService";

// Generate unique transaction ID
const generateTransactionId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
};

// Check inventory availability before sale
export const checkInventoryAvailability = async (machineId: string, items: any[]) => {
    const inventoryStatus: any[] = [];

    for (const item of items) {
        const { slotId, skuId, quantity, trayId } = item;

        // Get SKU details
        const sku = await SKUProduct.findById(skuId);
        if (!sku) {
            throw new Error(`SKU not found: ${skuId}`);
        }

        // Check current inventory level
        const currentInventory = await SlotInventory.findOne({
            machineId, trayId, slotId, skuId
        });

        if (!currentInventory) {
            throw new Error(`No inventory found for SKU: ${sku.name} in slot ${slotId}`);
        }

        if (currentInventory.quantityOnHand === 0) {
            throw new Error(`SKU: ${sku.name} is out of stock in slot ${slotId}`);
        }

        if (currentInventory.quantityOnHand < quantity) {
            throw new Error(`Insufficient stock for SKU: ${sku.name}. Available: ${currentInventory.quantityOnHand}, Requested: ${quantity}`);
        }

        inventoryStatus.push({
            slotId,
            skuId,
            skuName: sku.name,
            requestedQuantity: quantity,
            availableQuantity: currentInventory.quantityOnHand,
            unitPrice: sku.price,
            totalPrice: sku.price * quantity,
            status: 'AVAILABLE'
        });
    }

    const totalAmount = inventoryStatus.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
        allItemsAvailable: true,
        totalAmount,
        items: inventoryStatus
    };
};

// Process SKU Sale
export const processSKUSale = async (machineId: string, items: any[], paymentMethod: string = 'CASH', customerId?: string) => {
    // Validate machine exists
    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        throw new Error("Machine not found");
    }

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            const transactionId = generateTransactionId();
            const saleItems: any[] = [];
            let totalAmount = 0;

            // First, check inventory availability for all items
            for (const item of items) {
                const { slotId, skuId, quantity, trayId } = item;

                // Get SKU details
                const sku = await SKUProduct.findById(skuId).session(session);
                if (!sku) {
                    throw new Error(`SKU not found: ${skuId}`);
                }

                // Check current inventory level
                const currentInventory = await SlotInventory.findOne({
                    machineId, trayId, slotId, skuId
                }).session(session);

                if (!currentInventory) {
                    throw new Error(`No inventory found for SKU: ${sku.name} in slot ${slotId}`);
                }

                if (currentInventory.quantityOnHand < quantity) {
                    throw new Error(`Insufficient stock for SKU: ${sku.name}. Available: ${currentInventory.quantityOnHand}, Requested: ${quantity}`);
                }
            }

            // If all inventory checks pass, process the sale
            for (const item of items) {
                const { slotId, skuId, quantity, trayId } = item;

                // Get SKU details again
                const sku = await SKUProduct.findById(skuId).session(session);
                if (!sku) {
                    throw new Error(`SKU not found: ${skuId}`);
                }

                // Get current inventory before subtraction
                const currentInventory = await SlotInventory.findOne({
                    machineId, trayId, slotId, skuId
                }).session(session);

                if (!currentInventory) {
                    throw new Error(`Inventory not found for SKU: ${sku.name}`);
                }

                // Atomic inventory decrement - subtract quantity from quantityOnHand
                const updated = await SlotInventory.findOneAndUpdate(
                    { machineId, trayId, slotId, skuId, quantityOnHand: { $gte: quantity } },
                    { $inc: { quantityOnHand: -quantity } },
                    { new: true, session }
                );

                if (!updated) {
                    throw new Error(`Concurrent sale detected for SKU: ${sku.name}. Please retry.`);
                }

                // Log the subtraction for verification
                console.log(`Subtracted ${quantity} from ${currentInventory.quantityOnHand}, new quantity: ${updated.quantityOnHand}`);

                const itemTotal = sku.price * quantity;
                totalAmount += itemTotal;

                saleItems.push({
                    skuId,
                    quantity,
                    unitPrice: sku.price,
                    totalPrice: itemTotal
                });

                // Log individual item sale
                await AuditLog.create({
                    action: AuditAction.SKU_SOLD,
                    machineId,
                    skuId,
                    quantity,
                    unit: 'unit',
                    previousValue: updated.quantityOnHand + quantity,
                    newValue: updated.quantityOnHand,
                    userId: 'system'
                });
            }

            // Create sales record
            const sale = await Sales.create([{
                transactionId,
                machineId,
                saleType: 'SKU',
                items: saleItems,
                totalAmount,
                paymentMethod,
                customerId,
                status: 'COMPLETED'
            }], { session });

            result = sale[0];
        });

        return { transactionId: generateTransactionId() };
    } catch (error: any) {
        throw new Error(error.message || "Failed to process sale");
    } finally {
        await session.endSession();
    }
};

// Process Coffee Sale
export const processCoffeeSale = async (machineId: string, recipeId: string, paymentMethod: string = 'CASH', customerId?: string) => {
    // Validate machine exists
    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        throw new Error("Machine not found");
    }

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            const transactionId = generateTransactionId();

            // Get recipe and validate
            const recipe = await Recipe.findById(recipeId).session(session);
            if (!recipe) {
                throw new Error("Recipe not found");
            }

            if (!recipe.isActive) {
                throw new Error("Recipe is not active");
            }

            // Check canister availability and consume ingredients
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

            // Check availability and consume ingredients
            for (const recipeIngredient of recipe.ingredients) {
                const canister = ingredientToCanister.get(recipeIngredient.ingredientId.toString());
                
                if (!canister) {
                    throw new Error(`Ingredient not available in any canister: ${recipeIngredient.ingredientId}`);
                }

                if (canister.currentLevel < recipeIngredient.quantity) {
                    throw new Error(`Insufficient ingredient in canister. Available: ${canister.currentLevel}, Required: ${recipeIngredient.quantity}`);
                }

                // Consume ingredient atomically
                const updated = await Canister.findOneAndUpdate(
                    { _id: canister._id, currentLevel: { $gte: recipeIngredient.quantity } },
                    { $inc: { currentLevel: -recipeIngredient.quantity } },
                    { new: true, session }
                );

                if (!updated) {
                    throw new Error(`Concurrent consumption detected for canister: ${canister.name}. Please retry.`);
                }

                // Log ingredient consumption
                await AuditLog.create({
                    action: 'INGREDIENT_CONSUMED',
                    machineId,
                    canisterId: canister._id,
                    quantity: recipeIngredient.quantity,
                    unit: recipeIngredient.unit,
                    previousValue: updated.currentLevel + recipeIngredient.quantity,
                    newValue: updated.currentLevel,
                    userId: 'system'
                });
            }

            // Create sales record
            const saleItems = [{
                recipeId,
                quantity: 1,
                unitPrice: recipe.price,
                totalPrice: recipe.price
            }];

            const sale = await Sales.create([{
                transactionId,
                machineId,
                saleType: 'COFFEE',
                items: saleItems,
                totalAmount: recipe.price,
                paymentMethod,
                customerId,
                status: 'COMPLETED'
            }], { session });

            result = sale[0];
        });

        return { transactionId: generateTransactionId() };
    } catch (error: any) {
        throw new Error(error.message || "Failed to process coffee sale");
    } finally {
        await session.endSession();
    }
};

// Re-export forecast functions for backward compatibility
export const calculateCoffeeAvailability = forecastService.calculateCoffeeAvailability;

// Get all sales with pagination
export const getAllSales = async (query: any) => {
    const { page = 1, limit = 10, search, sortBy = 'timestamp', sortOrder = 'desc' } = query;
    
    const searchQuery = search ? { $or: [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'items.skuId': { $regex: search, $options: 'i' } }
    ]} : {};

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [results, total] = await Promise.all([
        Sales.find(searchQuery).sort(sort).skip(skip).limit(Number(limit)),
        Sales.countDocuments(searchQuery)
    ]);

    return {
        results,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
    };
};

// Get sales by machine
export const getSalesByMachine = async (machineId: string, query: any) => {
    const { startDate, endDate, limit = 50 } = query;

    const searchQuery: any = { machineId };

    if (startDate || endDate) {
        searchQuery.timestamp = {};
        if (startDate) searchQuery.timestamp.$gte = new Date(startDate as string);
        if (endDate) searchQuery.timestamp.$lte = new Date(endDate as string);
    }

    const sales = await Sales.find(searchQuery)
        .sort({ timestamp: -1 })
        .limit(Number(limit));

    return sales;
};

// Get sales summary/analytics
export const getSalesSummary = async (query: any) => {
    const { machineId, startDate, endDate } = query;

    const matchStage: any = { status: 'COMPLETED' };
    if (machineId) matchStage.machineId = new mongoose.Types.ObjectId(machineId as string);
    if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = new Date(startDate as string);
        if (endDate) matchStage.timestamp.$lte = new Date(endDate as string);
    }

    const summary = await Sales.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$totalAmount' },
                totalTransactions: { $sum: 1 },
                avgTransactionValue: { $avg: '$totalAmount' },
                skuSales: {
                    $sum: {
                        $cond: [{ $eq: ['$saleType', 'SKU'] }, 1, 0]
                    }
                },
                coffeeSales: {
                    $sum: {
                        $cond: [{ $eq: ['$saleType', 'COFFEE'] }, 1, 0]
                    }
                }
            }
        }
    ]);

    return summary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        avgTransactionValue: 0,
        skuSales: 0,
        coffeeSales: 0
    };
};

// Refund a sale
export const refundSale = async (transactionId: string, reason?: string) => {
    const sale = await Sales.findOne({ transactionId });
    if (!sale) {
        throw new Error("Sale not found");
    }

    if (sale.status === 'REFUNDED') {
        throw new Error("Sale already refunded");
    }

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            // Restore inventory for SKU sales
            if (sale.saleType === 'SKU') {
                for (const item of sale.items) {
                    if (item.skuId) {
                        await AuditLog.create({
                            action: AuditAction.SKU_RESTOCKED,
                            machineId: sale.machineId,
                            skuId: item.skuId,
                            quantity: item.quantity,
                            unit: 'unit',
                            previousValue: null,
                            newValue: item.quantity,
                            userId: 'system'
                        });
                    }
                }
            }

            // Update sale status
            await Sales.findByIdAndUpdate(
                sale._id,
                { status: 'REFUNDED' },
                { session }
            );
        });

        return { success: true };
    } catch (error: any) {
        throw new Error(error.message || "Failed to process refund");
    } finally {
        await session.endSession();
    }
};

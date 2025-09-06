import Ingredients from "../models/ingredient";
import AuditLog from "../models/auditLOg";
import { UnitOfMeasure } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";

// Create Ingredient
export const createIngredient = async (data: any) => {
    const { name, unitOfMeasure, stockLevel, threshold } = data;

    if (!name || !unitOfMeasure || stockLevel === undefined || threshold === undefined) {
        throw new Error("name, unitOfMeasure, stockLevel, and threshold are required");
    }

    // Validate unitOfMeasure
    if (!Object.values(UnitOfMeasure).includes(unitOfMeasure)) {
        throw new Error(`Invalid unitOfMeasure. Must be one of: ${Object.values(UnitOfMeasure).join(', ')}`);
    }

    const existingIngredient = await Ingredients.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingIngredient) {
        throw new Error("Ingredient with this name already exists");
    }

    const ingredient = await Ingredients.create({ name, unitOfMeasure, stockLevel, threshold });

    // Log the creation
    await AuditLog.create({
        action: 'INGREDIENT_CREATED',
        entityType: 'Ingredient',
        entityId: ingredient._id,
        details: {
            name: ingredient.name,
            unitOfMeasure: ingredient.unitOfMeasure,
            stockLevel: ingredient.stockLevel,
            threshold: ingredient.threshold
        },
        timestamp: new Date()
    });

    return ingredient;
};

// Get all Ingredients with pagination
export const getAllIngredients = async (query: any) => {
    return await paginateAndSearch(Ingredients, query);
};

// Get Ingredient by ID
export const getIngredientById = async (id: string) => {
    const ingredient = await Ingredients.findById(id);
    if (!ingredient) {
        throw new Error("Ingredient not found");
    }
    return ingredient;
};

// Update Ingredient
export const updateIngredient = async (id: string, data: any) => {
    const { name, unitOfMeasure, stockLevel, threshold } = data;

    const existingIngredient = await Ingredients.findById(id);
    if (!existingIngredient) {
        throw new Error("Ingredient not found");
    }

    // Check for duplicate name if it's being changed
    if (name && name !== existingIngredient.name) {
        const duplicateName = await Ingredients.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        if (duplicateName) {
            throw new Error("Ingredient with this name already exists");
        }
    }

    // Validate unitOfMeasure if provided
    if (unitOfMeasure && !Object.values(UnitOfMeasure).includes(unitOfMeasure)) {
        throw new Error(`Invalid unitOfMeasure. Must be one of: ${Object.values(UnitOfMeasure).join(', ')}`);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (unitOfMeasure !== undefined) updateData.unitOfMeasure = unitOfMeasure;
    if (stockLevel !== undefined) updateData.stockLevel = stockLevel;
    if (threshold !== undefined) updateData.threshold = threshold;

    const ingredient = await Ingredients.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!ingredient) {
        throw new Error("Failed to update ingredient");
    }

    // Log the update
    await AuditLog.create({
        action: 'INGREDIENT_UPDATED',
        entityType: 'Ingredient',
        entityId: ingredient._id,
        details: {
            name: ingredient.name,
            unitOfMeasure: ingredient.unitOfMeasure,
            stockLevel: ingredient.stockLevel,
            threshold: ingredient.threshold,
            previousValue: existingIngredient,
            newValue: ingredient
        },
        timestamp: new Date()
    });

    return ingredient;
};

// Delete Ingredient
export const deleteIngredient = async (id: string) => {
    const ingredient = await Ingredients.findByIdAndDelete(id);
    if (!ingredient) {
        throw new Error("Ingredient not found");
    }

    // Log the deletion
    await AuditLog.create({
        action: 'INGREDIENT_DELETED',
        entityType: 'Ingredient',
        entityId: ingredient._id,
        details: {
            name: ingredient.name,
            unitOfMeasure: ingredient.unitOfMeasure,
            stockLevel: ingredient.stockLevel,
            threshold: ingredient.threshold
        },
        timestamp: new Date()
    });

    return ingredient;
};

// Update Ingredient Stock
export const updateIngredientStock = async (id: string, stockLevel: number) => {
    const ingredient = await Ingredients.findById(id);
    if (!ingredient) {
        throw new Error("Ingredient not found");
    }

    const previousStockLevel = ingredient.stockLevel;
    const updatedIngredient = await Ingredients.findByIdAndUpdate(
        id,
        { stockLevel },
        { new: true, runValidators: true }
    );

    // Log the stock update
    await AuditLog.create({
        action: 'INGREDIENT_STOCK_UPDATED',
        entityType: 'Ingredient',
        entityId: ingredient._id,
        details: {
            name: ingredient.name,
            previousStockLevel,
            newStockLevel: stockLevel,
            difference: stockLevel - previousStockLevel
        },
        timestamp: new Date()
    });

    return updatedIngredient;
};

// Search Ingredients
export const searchIngredients = async (searchTerm: string, query: any) => {
    return await paginateAndSearch(Ingredients, { ...query, search: searchTerm });
};

import Ingredients from "../models/ingredient";
import AuditLog from "../models/auditLOg";
import { UnitOfMeasure } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";
import Canister from "../models/conisters";
// Create Ingredient
export const createIngredient = async (data: any) => {
    const { ingredientId, name, unitOfMeasure } = data;

    if (!ingredientId || !name || !unitOfMeasure) {
        throw new Error("ingredientId, name, and unitOfMeasure are required");
    }

    // Validate unitOfMeasure
    if (!Object.values(UnitOfMeasure).includes(unitOfMeasure)) {
        throw new Error(`Invalid unitOfMeasure. Must be one of: ${Object.values(UnitOfMeasure).join(', ')}`);
    }

    const existingIngredient = await Ingredients.findOne({
        $or: [
            { ingredientId: { $regex: new RegExp(`^${ingredientId}$`, 'i') } },
            { name: { $regex: new RegExp(`^${name}$`, 'i') } }
        ]
    });

    if (existingIngredient) {
        throw new Error("Ingredient with this ingredientId or name already exists");
    }

    const ingredient = await Ingredients.create({ ingredientId, name, unitOfMeasure });

    // Log the creation
    await AuditLog.create({
        action: 'INGREDIENT_CREATED',
        entityType: 'Ingredient',
        entityId: ingredient._id,
        details: {
            ingredientId: ingredient.ingredientId,
            name: ingredient.name,
            unitOfMeasure: ingredient.unitOfMeasure,
        },
        timestamp: new Date()
    });

    return ingredient;
};

// Get all Ingredients with pagination
export const getAllIngredients = async (query: any) => {
    const result = await paginateAndSearch(Ingredients, query);
    if (result && Array.isArray(result.results)) {
        result.results = await Ingredients.populate(result.results, [
            {
                path: "recipeId"
            }
        ]);
        return result;
    }

    const populated = await Ingredients.populate(result, [
        { path: "recipeId" }
    ]);

    return populated;
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
    const { name, unitOfMeasure ,ingredientId} = data;

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

    if (ingredientId && ingredientId !== existingIngredient.ingredientId) {

        const duplicateIngredientId = await Ingredients.findOne({
            _id: { $ne: id },
            ingredientId: ingredientId
        });
        if (duplicateIngredientId) {
            throw new Error("Ingredient with this ingredientId already exists");
        }
    }

    // Validate unitOfMeasure if provided
    if (unitOfMeasure && !Object.values(UnitOfMeasure).includes(unitOfMeasure)) {
        throw new Error(`Invalid unitOfMeasure. Must be one of: ${Object.values(UnitOfMeasure).join(', ')}`);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (unitOfMeasure !== undefined) updateData.unitOfMeasure = unitOfMeasure;
    if (ingredientId !== undefined) updateData.ingredientId = ingredientId;
    const ingredient = await Ingredients.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    )
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
            ingredientId: ingredient.ingredientId,
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
            unitOfMeasure: ingredient.unitOfMeasure
        },
        timestamp: new Date()
    });

    return ingredient;
};

// Update Ingredient Stock
// Removed warehouse stock tracking (stockLevel/threshold)

// Search Ingredients
export const searchIngredients = async (searchTerm: string, query: any) => {
    return await paginateAndSearch(Ingredients, { ...query, search: searchTerm });
};



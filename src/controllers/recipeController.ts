import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import Recipe from "../models/recipe";
import VendingMachine from "../models/vendingMModel";
import Ingredient from "../models/ingredient";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";
import ingredient from "../models/ingredient";

// Create a new recipe
export const createRecipe = catchAsync(async (req: Request, res: Response) => {
    const { recipeId, name, description = '', price, ingredients, machineId } = req.body;

    if (!recipeId || !name || !price || !ingredients || !machineId) {
        return sendError(res, "recipeId, name, price, ingredients, and machineId are required", 400);
    }

    // Validate machine exists and is coffee type
    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        return sendError(res, "Machine not found", 404);
    }
    if (machine.type !== 'coffee' && machine.type !== 'combo') {
        return sendError(res, "Recipes can only be created for coffee or combo machines", 400);
    }

    // Validate ingredients exist
    const ingredientIds = ingredients.map((ing: any) => ing.ingredientId);
    const existingIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });
    if (existingIngredients.length !== ingredientIds.length) {
        return sendError(res, "One or more ingredients not found", 404);
    }

    // Check for duplicate recipeId
    const existingRecipe = await Recipe.findOne({ recipeId });
    if (existingRecipe) {
        return sendError(res, "Recipe with this recipeId already exists", 409);
    }

    const recipe = await Recipe.create({
        recipeId,
        name,
        description,
        price,
        ingredients,
        machineId
    });
 await ingredient.findByIdAndUpdate(ingredients.ingredientId, { $addToSet: { recipeId: recipe._id } });
    await AuditLog.create({
        action: AuditAction.RECIPE_CREATED,
        recipeId: recipe._id,
        previousValue: null,
        newValue: recipe,
        userId: 'system'
    });

    sendSuccess(res, "Recipe created successfully", recipe, 201);
});

// Get all recipes
export const getAllRecipes = catchAsync(async (req: Request, res: Response) => {
    const recipes = await paginateAndSearch(Recipe, req);
    sendSuccess(res, "Recipes retrieved successfully", recipes);
});

// Get recipe by ID
export const getRecipeById = catchAsync(async (req: Request, res: Response) => {
    const recipe = await Recipe.findById(req.params.id).populate([
        { path: 'machineId', select: 'name type location' },
        { path: 'ingredients.ingredientId', select: 'name unitOfMeasure' }
    ]);
    
    if (!recipe) {
        return sendError(res, "Recipe not found", 404);
    }
    
    sendSuccess(res, "Recipe retrieved successfully", recipe);
});

// Update recipe
export const updateRecipe = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { recipeId, name, description, price, ingredients, isActive } = req.body;

    const recipe = await Recipe.findById(id);
    if (!recipe) {
        return sendError(res, "Recipe not found", 404);
    }

    // Check for recipeId conflict if being updated
    if (recipeId && recipeId !== recipe.recipeId) {
        const existingRecipe = await Recipe.findOne({ 
            _id: { $ne: id },
            recipeId: recipeId
        });
        if (existingRecipe) {
            return sendError(res, "Another recipe with this recipeId already exists", 409);
        }
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
        id,
        { recipeId, name, description, price, ingredients, isActive },
        { new: true, runValidators: true }
    ).populate([
        { path: 'machineId', select: 'name type location' },
        { path: 'ingredients.ingredientId', select: 'name unitOfMeasure' }
    ]);

    await AuditLog.create({
        action: AuditAction.RECIPE_UPDATED,
        recipeId: id,
        previousValue: recipe,
        newValue: updatedRecipe,
        userId: 'system'
    });

    sendSuccess(res, "Recipe updated successfully", updatedRecipe);
});

// Delete recipe
export const deleteRecipe = catchAsync(async (req: Request, res: Response) => {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
        return sendError(res, "Recipe not found", 404);
    }

    await AuditLog.create({
        action: AuditAction.RECIPE_DELETED,
        recipeId: recipe._id,
        previousValue: recipe,
        newValue: null,
        userId: 'system'
    });

    sendSuccess(res, "Recipe deleted successfully", null);
});

// Get recipes by machine
export const getRecipesByMachine = catchAsync(async (req: Request, res: Response) => {
    const { machineId } = req.params;
    const { isActive } = req.query;

    const query: any = { machineId };
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    const recipes = await Recipe.find(query).populate([
        { path: 'machineId', select: 'name type location' },
        { path: 'ingredients.ingredientId', select: 'name unitOfMeasure' }
    ]);

    sendSuccess(res, "Machine recipes retrieved successfully", recipes);
});
import catchAsync from "../middlewares/catchasync";
import { Request, Response } from "express";
import Recipe from "../models/recipe";
import { sendSuccess, sendError } from "../utils/apiResponse";
import logger from "../logging/logger";
import { AuditAction } from "../types/types";
import AuditLog from "../models/auditLOg";
import { paginateAndSearch } from "../utils/apiFeatures";

// Create a new recipe
export const createRecipe = catchAsync(async (req: Request, res: Response) => {
    const { name, ingredients, price, machineId } = req.body;

    // Check if recipe with the same name already exists
    const existingRecipe = await Recipe.findOne({ name });
    if (existingRecipe) {
        return sendError(res, "Recipe with this name already exists", 400);
    }

    const recipe = await Recipe.create({
        name,
        ingredients,
        price,
        machineId
    });

    // Log the creation in audit log
    await AuditLog.create({
        action: AuditAction.RECIPE_CREATED,
        recipeId: recipe._id,
        machineId: recipe.machineId,
        userId: 'system',
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || 'Unknown'
    });

    logger.info(`Recipe created: ${recipe._id}`);
    sendSuccess(res, "Recipe created successfully", recipe, 201);
});

// Get all recipes
export const getAllRecipes = catchAsync(async (req: Request, res: Response) => {
    const recipes = await paginateAndSearch(Recipe, req, [
        { path: 'ingredients.ingredientId', select: 'name unitOfMeasure' },
        { path: 'machineId', select: 'name location' }
    ]);
    sendSuccess(res, "Recipes retrieved successfully", recipes);
});

// Get a single recipe by ID
export const getRecipeById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const recipe = await Recipe.findById(id)
        .populate('ingredients.ingredientId', 'name unitOfMeasure')
        .populate('machineId', 'name location');
        
    if (!recipe) {
        return sendError(res, "Recipe not found", 404);
    }
    
    sendSuccess(res, "Recipe retrieved successfully", recipe);
});

// Update a recipe
export const updateRecipe = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating the _id
    if (updateData._id) {
        delete updateData._id;
    }

    const recipe = await Recipe.findByIdAndUpdate(
        id,
        { ...updateData, isAvailable: undefined }, // Let the pre-save hook handle availability
        { new: true, runValidators: true }
    )
    .populate('ingredients.ingredientId', 'name unitOfMeasure');

    if (!recipe) {
        return sendError(res, "Recipe not found", 404);
    }

    // Force availability check
    await recipe.checkAvailability();

    // Log the update in audit log
    await AuditLog.create({
        action: AuditAction.RECIPE_UPDATED,
        recipeId: recipe._id,
        machineId: recipe.machineId,
        userId: 'system',
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || 'Unknown'
    });

    logger.info(`Recipe updated: ${recipe._id}`);
    sendSuccess(res, "Recipe updated successfully", recipe);
});

// Delete a recipe
export const deleteRecipe = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const recipe = await Recipe.findByIdAndDelete(id);
    
    if (!recipe) {
        return sendError(res, "Recipe not found", 404);
    }

    // Log the deletion in audit log
    await AuditLog.create({
        action: AuditAction.RECIPE_DELETED,
        recipeId: id,
        machineId: recipe.machineId,
        userId: 'system',
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || 'Unknown'
    });

    logger.info(`Recipe deleted: ${id}`);
    sendSuccess(res, "Recipe deleted successfully", null);
});

// Check recipe availability
export const checkRecipeAvailability = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const recipe = await Recipe.findById(id);
    if (!recipe) {
        return sendError(res, "Recipe not found", 404);
    }
    
    const isAvailable = await recipe.checkAvailability();
    
    sendSuccess(res, "Recipe availability checked successfully", { 
        recipeId: recipe._id,
        name: recipe.name,
        isAvailable 
    });
});

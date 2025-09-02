import catchAsync from "../middlewares/catchasync";
import { Request, Response } from "express";
import Ingredient from "../models/ingredient";
import { sendSuccess, sendError } from "../utils/apiResponse";
import logger from "../logging/logger";
import { AuditAction } from "../types/types";
import AuditLog from "../models/auditLOg";
import { paginateAndSearch } from "../utils/apiFeatures";


// Create a new ingredient
export const createIngredient = catchAsync(async (req: Request, res: Response) => {
    const { name, unitOfMeasure, stockLevel, threshold } = req.body;

    // Check if ingredient with the same name already exists
    const existingIngredient = await Ingredient.findOne({ name });
    if (existingIngredient) {
        return sendError(res, "Ingredient with this name already exists", 400);
    }

    const ingredient = await Ingredient.create({
        name,
        unitOfMeasure,
        stockLevel,
        threshold
    });

    // Log the creation in audit log
    await AuditLog.create({
        action: AuditAction.INGREDIENT_CREATED,
        ingredientId: ingredient._id,
        previousValue: null,
        newValue: ingredient,
        userId: 'system',
    });

    logger.info(`Ingredient created: ${ingredient._id}`);
    sendSuccess(res, "Ingredient created successfully", ingredient, 201);
});

// Get all ingredients
export const getAllIngredients = catchAsync(async (req: Request, res: Response) => {
    const ingredients = await paginateAndSearch(Ingredient,req)
    sendSuccess(res, "Ingredients retrieved successfully", ingredients);
});

// Get a single ingredient by ID
export const getIngredientById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const ingredient = await Ingredient.findById(id);
    if (!ingredient) {
        return sendError(res, "Ingredient not found", 404);
    }
    
    sendSuccess(res, "Ingredient retrieved successfully", ingredient);
});

// Update an ingredient
export const updateIngredient = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating the _id
    if (updateData._id) {
        delete updateData._id;
    }

    const ingredient = await Ingredient.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!ingredient) {
        return sendError(res, "Ingredient not found", 404);
    }

    // Log the update in audit log
    await AuditLog.create({
        action: AuditAction.INGREDIENT_UPDATED,
        ingredientId: ingredient._id,
        previousValue: req.body.previousState || {},
        newValue: ingredient,
        userId: 'system',
    });

    logger.info(`Ingredient updated: ${ingredient._id}`);
    sendSuccess(res, "Ingredient updated successfully", ingredient);
});

// Delete an ingredient
export const deleteIngredient = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const ingredient = await Ingredient.findByIdAndDelete(id);
    
    if (!ingredient) {
        return sendError(res, "Ingredient not found", 404);
    }

    // Log the deletion in audit log
    await AuditLog.create({
        action: AuditAction.INGREDIENT_DELETED,
        ingredientId: id,
        previousValue: ingredient,
        newValue: null,
        userId: 'system',
    });

    logger.info(`Ingredient deleted: ${id}`);
    sendSuccess(res, "Ingredient deleted successfully", null);
});

// Update ingredient stock level
export const updateIngredientStock = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, action = 'add' } = req.body; // action can be 'add' or 'subtract'

    if (!quantity || isNaN(quantity) || quantity <= 0) {
        return sendError(res, "Please provide a valid quantity greater than 0", 400);
    }

    const ingredient = await Ingredient.findById(id);
    if (!ingredient) {
        return sendError(res, "Ingredient not found", 404);
    }

    const previousQuantity = ingredient.stockLevel;
    let newQuantity;

    if (action === 'subtract') {
        if (previousQuantity < quantity) {
            return sendError(res, "Insufficient stock", 400);
        }
        newQuantity = previousQuantity - quantity;
    } else {
        newQuantity = previousQuantity + quantity;
    }

    ingredient.stockLevel = newQuantity;
    await ingredient.save();

    // Log the stock update in audit log
    await AuditLog.create({
        action: action === 'subtract' ? AuditAction.INGREDIENT_CONSUMED : AuditAction.INGREDIENT_REFILLED,
        ingredientId: id,
        previousValue: previousQuantity,
        newValue: newQuantity,
        unit: ingredient.unitOfMeasure,
        userId: 'system',
    });

    logger.info(`Ingredient ${action === 'subtract' ? 'consumed' : 'refilled'}: ${id}, Quantity: ${quantity}`);
    sendSuccess(res, `Ingredient stock ${action === 'subtract' ? 'reduced' : 'increased'} successfully`, ingredient);
});

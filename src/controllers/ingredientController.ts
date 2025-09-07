import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import * as ingredientService from "../services/ingredientService";
import Canister from "../models/conisters";

// Create Ingredient
export const createIngredient = catchAsync(async (req: Request, res: Response) => {
    const { canisterId } = req.body;
    
    const ingredient = await ingredientService.createIngredient(req.body);
    
    // Automatically assign ingredient to canister if canisterId is provided
    if (canisterId) {
        await Canister.findByIdAndUpdate(canisterId,
            { $addToSet: { ingredientId: ingredient._id } });
    }
    
    sendSuccess(res, "Ingredient created successfully", ingredient, 201);   
});

// Get all Ingredients
export const getAllIngredients = catchAsync(async (req: Request, res: Response) => {
    const result = await ingredientService.getAllIngredients(req.query);
    sendSuccess(res, "Ingredients retrieved successfully", result);
});

// Get Ingredient by ID
export const getIngredientById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ingredient = await ingredientService.getIngredientById(id);
    sendSuccess(res, "Ingredient retrieved successfully", ingredient);
});

// Update Ingredient
export const updateIngredient = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ingredient = await ingredientService.updateIngredient(id, req.body);
    sendSuccess(res, "Ingredient updated successfully", ingredient);
});

// Delete Ingredient
export const deleteIngredient = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ingredient = await ingredientService.deleteIngredient(id);
    sendSuccess(res, "Ingredient deleted successfully", ingredient);
});

// Removed warehouse stock tracking

// Search Ingredients
export const searchIngredients = catchAsync(async (req: Request, res: Response) => {
    const { q } = req.query;
    
    if (!q) {
        return sendError(res, "Search query is required", 400);
    }
    
    const result = await ingredientService.searchIngredients(q as string, req.query);
    sendSuccess(res, "Ingredients search completed", result);
});
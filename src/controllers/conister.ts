import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import * as canisterService from "../services/canisterService";
import VendingMachine from "../models/vendingMModel";

// Create Canister
export const createCanister = catchAsync(async (req: Request, res: Response) => {
    const { machineId } = req.body;
    const canister = await canisterService.createCanister(req.body);


    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        return sendError(res, "Machine not found", 404);
    }
    // Automatically add canister to the vending machine
    await VendingMachine.findByIdAndUpdate(machineId,
        { $push: { canisters: canister._id } });

    sendSuccess(res, "Canister created successfully", canister, 201);
});

// Get all Canisters
export const getAllCanisters = catchAsync(async (req: Request, res: Response) => {
    const result = await canisterService.getAllCanisters(req.query);
    sendSuccess(res, "Canisters retrieved successfully", result);
});

// Get Canister by ID
export const getCanisterById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canister = await canisterService.getCanisterById(id);
    sendSuccess(res, "Canister retrieved successfully", canister);
});

// Update Canister
export const updateCanister = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canister = await canisterService.updateCanister(id, req.body);
    sendSuccess(res, "Canister updated successfully", canister);
});

// Delete Canister
export const deleteCanister = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canister = await canisterService.deleteCanister(id);
    sendSuccess(res, "Canister deleted successfully", canister);
});

// Assign Ingredient to Canister
export const assignIngredientToCanister = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ingredientId } = req.body;

    if (!ingredientId) {
        return sendError(res, "ingredientId is required", 400);
    }

    const canister = await canisterService.assignIngredientToCanister(id, ingredientId);
    sendSuccess(res, "Ingredient assigned to canister successfully", canister);
});

// Refill Canister
export const refillCanister = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { refillAmount } = req.body;

    if (!refillAmount || refillAmount <= 0) {
        return sendError(res, "refillAmount is required and must be greater than 0", 400);
    }

    const canister = await canisterService.refillCanister(id, refillAmount);
    sendSuccess(res, "Canister refilled successfully", canister);
});

// Consume Ingredients from Canisters
export const consumeIngredientsFromCanisters = catchAsync(async (req: Request, res: Response) => {
    const { machineId, ingredients } = req.body;

    if (!machineId || !ingredients || !Array.isArray(ingredients)) {
        return sendError(res, "machineId and ingredients array are required", 400);
    }

    const result = await canisterService.consumeIngredientsFromCanisters(machineId, ingredients);
    sendSuccess(res, "Ingredients consumed successfully", result);
});

// Search Canisters
export const searchCanisters = catchAsync(async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q) {
        return sendError(res, "Search query is required", 400);
    }

    const result = await canisterService.searchCanisters(q as string, req.query);
    sendSuccess(res, "Canisters search completed", result);
});
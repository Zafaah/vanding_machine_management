import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import * as forecastService from "../services/forecastService";

// Calculate coffee availability for a given machine and recipe
export const calculateCoffeeAvailability = catchAsync(async (req: Request, res: Response) => {
    const { machineId, recipeId } = req.params;

    if (!machineId || !recipeId) {
        return sendError(res, "Machine ID and Recipe ID are required", 400);
    }

    try {
        const result = await forecastService.calculateCoffeeAvailability(machineId, recipeId);
        sendSuccess(res, "Coffee availability calculated successfully", result, 200);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Get forecast for all recipes in a machine
export const getMachineForecast = catchAsync(async (req: Request, res: Response) => {
    const { machineId } = req.params;

    if (!machineId) {
        return sendError(res, "Machine ID is required", 400);
    }

    try {
        const result = await forecastService.getMachineForecast(machineId);
        sendSuccess(res, "Machine forecast retrieved successfully", result, 200);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Get low stock warnings for a machine
export const getLowStockWarnings = catchAsync(async (req: Request, res: Response) => {
    const { machineId } = req.params;
    const { threshold = 20 } = req.query;

    if (!machineId) {
        return sendError(res, "Machine ID is required", 400);
    }

    try {
        const result = await forecastService.getLowStockWarnings(machineId, Number(threshold));
        sendSuccess(res, "Low stock warnings retrieved successfully", result, 200);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});



// Get forecast summary for all machines
export const getAllMachinesForecast = catchAsync(async (req: Request, res: Response) => {
    try {
        const result = await forecastService.getAllMachinesForecast();
        sendSuccess(res, "All machines forecast retrieved successfully", result, 200);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

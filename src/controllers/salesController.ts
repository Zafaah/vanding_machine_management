import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import * as salesService from "../services/salesService";
import Sales from "../models/sales";

// Check inventory availability before sale
export const checkInventoryAvailability = catchAsync(async (req: Request, res: Response) => {
    const { machineId, items } = req.body;

    if (!machineId || !items || !Array.isArray(items) || items.length === 0) {
        return sendError(res, "machineId and items array are required", 400);
    }

    try {
        const result = await salesService.checkInventoryAvailability(machineId, items);
        sendSuccess(res, "Inventory check completed", result, 200);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Process SKU Sale
export const processSKUSale = catchAsync(async (req: Request, res: Response) => {
    const { machineId, items, paymentMethod = 'CASH', customerId } = req.body;

    if (!machineId || !items || !Array.isArray(items) || items.length === 0) {
        return sendError(res, "machineId and items array are required", 400);
    }

    try {
        const result = await salesService.processSKUSale(machineId, items, paymentMethod, customerId);
        sendSuccess(res, "SKU sale processed successfully", result, 200);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Process Coffee Sale
export const processCoffeeSale = catchAsync(async (req: Request, res: Response) => {
    const { machineId, recipeId, paymentMethod = 'CASH', customerId } = req.body;

    if (!machineId || !recipeId) {
        return sendError(res, "machineId and recipeId are required", 400);
    }

    try {
        const result = await salesService.processCoffeeSale(machineId, recipeId, paymentMethod, customerId);
        sendSuccess(res, "Coffee sale processed successfully", result, 200);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Get all sales with pagination
export const getAllSales = catchAsync(async (req: Request, res: Response) => {
    try {
        const sales = await salesService.getAllSales(req.query);

        // Populate references
        const populatedSales = await Sales.populate(sales.results, [
            { path: 'machineId', select: 'name type location' },
            { path: 'items.skuId', select: 'productId name price' },
            { path: 'items.canisterId', select: 'name capacity currentLevel' }
        ]);

        sendSuccess(res, "Sales retrieved successfully", {
            ...sales,
            results: populatedSales
        });
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Get sales by machine
export const getSalesByMachine = catchAsync(async (req: Request, res: Response) => {
    const { machineId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    try {
        const sales = await salesService.getSalesByMachine(machineId, { startDate, endDate, limit });

        // Populate references
        const populatedSales = await Sales.populate(sales, [
            { path: 'machineId', select: 'name type location' },
            { path: 'items.skuId', select: 'productId name price' },
            { path: 'items.canisterId', select: 'name capacity currentLevel' }
        ]);

        sendSuccess(res, "Machine sales retrieved successfully", populatedSales);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Get sales summary/analytics
export const getSalesSummary = catchAsync(async (req: Request, res: Response) => {
    try {
        const summary = await salesService.getSalesSummary(req.query);
        sendSuccess(res, "Sales summary retrieved successfully", summary);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Refund a sale
export const refundSale = catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const { reason } = req.body;

    try {
        await salesService.refundSale(transactionId, reason);
        sendSuccess(res, "Sale refunded successfully", null);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});

// Calculate coffee availability for a given machine and recipe
export const calculateCoffeeAvailability = catchAsync(async (req: Request, res: Response) => {
    const { machineId, recipeId } = req.params;

    if (!machineId || !recipeId) {
        return sendError(res, "Machine ID and Recipe ID are required", 400);
    }

    try {
        const result = await salesService.calculateCoffeeAvailability(machineId, recipeId);
        sendSuccess(res, "Coffee availability calculated successfully", result, 200);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
});
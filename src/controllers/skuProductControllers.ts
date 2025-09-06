import catchAsync from "../middlewares/catchasync";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/apiResponse";
import * as skuProductService from "../services/skuProductService";
import Slots from "../models/slots";

// Create a new SKU Product
export const createSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const { slotId } = req.body;
    const skuProduct = await skuProductService.createSKUProduct(req.body);  

    if (slotId) {
        await Slots.findByIdAndUpdate(slotId,
            { $addToSet: { skuId: skuProduct._id } });
        
        // Add slotId to the response
        const responseData = {
            ...skuProduct.toObject(),
            slotId: slotId
        };
        return sendSuccess(res, "SKU Product created successfully", responseData, 201);
    }
    
    sendSuccess(res, "SKU Product created successfully", skuProduct, 201);
});

// Get all SKU Products
export const getAllSKUProducts = catchAsync(async (req: Request, res: Response) => {
    const result = await skuProductService.getAllSKUProducts(req.query);
    sendSuccess(res, "SKU Products retrieved successfully", result);
});

// Get SKU Product by ID
export const getSKUProductById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const skuProduct = await skuProductService.getSKUProductById(id);
    sendSuccess(res, "SKU Product retrieved successfully", skuProduct);
});

// Update SKU Product
export const updateSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const skuProduct = await skuProductService.updateSKUProduct(id, req.body);
    sendSuccess(res, "SKU Product updated successfully", skuProduct);
});

// Delete SKU Product
export const deleteSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const skuProduct = await skuProductService.deleteSKUProduct(id);
    sendSuccess(res, "SKU Product deleted successfully", skuProduct);
});

// Search SKU Products
export const searchSKUProducts = catchAsync(async (req: Request, res: Response) => {
    const { q } = req.query;
    
    if (!q) {
        return sendError(res, "Search query is required", 400);
    }
    
    const result = await skuProductService.searchSKUProducts(q as string, req.query);
    sendSuccess(res, "SKU Products search completed", result);
});
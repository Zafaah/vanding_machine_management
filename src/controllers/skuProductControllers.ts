import catchAsync from "../middlewares/catchasync";
import { Request, Response } from "express";
import SKUProduct from "../models/skuProduct";
import { sendSuccess, sendError } from "../utils/apiResponse";
import logger from "../logging/logger";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";

// Create a new SKU Product
export const createSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const { name, price, quantity = 0 } = req.body;

    if (!name || !price) {
        return sendError(res, "Name and price are required", 400);
    }

    // Check for existing SKU with same name (case insensitive)
    const existingSKU = await SKUProduct.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingSKU) {
        return sendError(res, "SKU with this name already exists", 409);
    }

    const skuProduct = await SKUProduct.create({
        name,
        price,
        quantity
    });

    logger.info(`SKU Product created with ID: ${skuProduct._id}`);

    await AuditLog.create({
        action: AuditAction.SKU_CREATED,
        skuId: skuProduct._id,
        previousValue: null,
        newValue: skuProduct.quantity,
        userId: 'system'
    });

    sendSuccess(res, "SKU Product created successfully", skuProduct, 201);
});

// Get all SKU Products
export const getAllSKUProducts = catchAsync(async (req: Request, res: Response) => {
    const skuProducts = await paginateAndSearch(SKUProduct,req)
    sendSuccess(res, "SKU Products retrieved successfully", skuProducts);
});

// Get a single SKU Product by ID
export const getSKUProductById = catchAsync(async (req: Request, res: Response) => {
    const skuProduct = await SKUProduct.findById(req.params.id);
    if (!skuProduct) {
        return sendError(res, "SKU Product not found", 404);
    }
    sendSuccess(res, "SKU Product retrieved successfully", skuProduct);
});

// Update an existing SKU Product
export const updateSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, price, unitOfMeasure, quantity } = req.body;

    const skuProduct = await SKUProduct.findById(id);
    if (!skuProduct) {
        return sendError(res, "SKU Product not found", 404);
    }

    // Check for name conflict if name is being updated
    if (name && name !== skuProduct.name) {
        const existingSKU = await SKUProduct.findOne({ 
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        if (existingSKU) {
            return sendError(res, "Another SKU with this name already exists", 409);
        }
    }

    const previousQuantity = skuProduct.quantity;
    
    // Update the SKU Product
    const updatedSKU = await SKUProduct.findByIdAndUpdate(
        id,
        { name, price, unitOfMeasure, quantity },
        { new: true, runValidators: true }
    );

    // Log quantity change in audit log if quantity was updated
    if (quantity !== undefined && quantity !== previousQuantity) {
        await AuditLog.create({
            action: AuditAction.SKU_UPDATED,
            skuId: id,
            previousValue: previousQuantity,
            newValue: quantity,
            userId: 'system'
        });
    }

    logger.info(`SKU Product updated with ID: ${id}`);
    sendSuccess(res, "SKU Product updated successfully", updatedSKU);
});

// Delete an SKU Product
export const deleteSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const skuProduct = await SKUProduct.findByIdAndDelete(req.params.id);
    if (!skuProduct) {
        return sendError(res, "SKU Product not found", 404);
    }

    // Log the deletion in audit log
    await AuditLog.create({
        action: AuditAction.SKU_DELETED,
        skuId: skuProduct._id,
        previousValue: skuProduct.quantity,
        newValue: null,
        userId: 'system'
    });

    logger.info(`SKU Product deleted with ID: ${req.params.id}`);
    sendSuccess(res, "SKU Product deleted successfully", null);
});

// Update SKU Product quantity (for sales/restocking)
export const updateSKUQuantity = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, action = 'add' } = req.body; // action can be 'add' or 'subtract'

    if (!quantity || isNaN(quantity) || quantity <= 0) {
        return sendError(res, "A valid quantity is required", 400);
    }

    const skuProduct = await SKUProduct.findById(id);
    if (!skuProduct) {
        return sendError(res, "SKU Product not found", 404);
    }

    const previousQuantity = skuProduct.quantity;
    let newQuantity = previousQuantity;

    if (action === 'subtract') {
        if (previousQuantity < quantity) {
            return sendError(res, "Insufficient quantity available", 400);
        }
        newQuantity = previousQuantity - quantity;
    } else {
        newQuantity = previousQuantity + quantity;
    }

    const updatedSKU = await SKUProduct.findByIdAndUpdate(
        id,
        { quantity: newQuantity },
        { new: true, runValidators: true }
    );

    // Log the quantity change in audit log
    await AuditLog.create({
        action: action === 'subtract' ? AuditAction.SKU_SOLD : AuditAction.SKU_RESTOCKED,
        skuId: id,
        previousValue: previousQuantity,
        newValue: newQuantity,
        userId: 'system',
        quantity: quantity
    });

    logger.info(`SKU Product quantity updated for ID: ${id}`);
    sendSuccess(res, "SKU Product quantity updated successfully", updatedSKU);
});

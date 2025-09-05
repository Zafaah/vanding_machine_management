import catchAsync from "../middlewares/catchasync";
import { Request, Response } from "express";
import SKUProduct from "../models/skuProduct";
import { sendSuccess, sendError } from "../utils/apiResponse";
import logger from "../logging/logger";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";
import Slots from "../models/slots";

// Create a new SKU Product
export const createSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const { productId, name, description = '', price } = req.body;

    if (!productId || !name || price === undefined) {
        return sendError(res, "productId, name and price are required", 400);
    }

    // Check for existing SKU with same name (case insensitive)
    const existingSKU = await SKUProduct.findOne({ 
        $or: [
            { name: { $regex: new RegExp(`^${name}$`, 'i') } },
            { productId: productId }
        ]
    });
    
    if (existingSKU) {
        return sendError(res, "SKU with this name already exists", 409);
    }

    const skuProduct = await SKUProduct.create({
        productId,
        name,
        description,
        price
    });

    logger.info(`SKU Product created with ID: ${skuProduct._id}`);

    await AuditLog.create({
        action: AuditAction.SKU_CREATED,
        skuId: skuProduct._id,
        previousValue: null,
        newValue: { productId, name, price },
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
    const { productId, name, description, price } = req.body;

    const skuProduct = await SKUProduct.findById(id);
    if (!skuProduct) {
        return sendError(res, "SKU Product not found", 404);
    }

    // Check for name conflict if name is being updated
    if ((name && name !== skuProduct.name) || (productId && productId !== skuProduct.productId)) {
        const existingSKU = await SKUProduct.findOne({ 
            _id: { $ne: id },
            $or: [
                name ? { name: { $regex: new RegExp(`^${name}$`, 'i') } } : undefined,
                productId ? { productId } : undefined
            ].filter(Boolean) as any
        });
        if (existingSKU) {
            return sendError(res, "Another SKU with same name or productId exists", 409);
        }
    }
    
    // Update the SKU Product
    const updatedSKU = await SKUProduct.findByIdAndUpdate(
        id,
        { productId, name, description, price },
        { new: true, runValidators: true }
    );
    await AuditLog.create({
        action: AuditAction.SKU_UPDATED,
        skuId: id,
        previousValue: null,
        newValue: { productId, name, description, price },
        userId: 'system'
    });

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
        previousValue: { productId: (skuProduct as any).productId, name: skuProduct.name, price: skuProduct.price },
        newValue: null,
        userId: 'system'
    });

    logger.info(`SKU Product deleted with ID: ${req.params.id}`);
    sendSuccess(res, "SKU Product deleted successfully", null);
});

// Update SKU Product quantity (for sales/restocking)
// Quantity updates are handled via SlotInventory endpoints now

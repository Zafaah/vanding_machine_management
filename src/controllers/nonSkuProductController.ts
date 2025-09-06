import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import NonSKUProduct from "../models/nonSkuProduct";
import { paginateAndSearch } from "../utils/apiFeatures";

export const createNonSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const { name, unitOfMeasure, stockLevel, threshold } = req.body;
    if (!name || !unitOfMeasure || stockLevel === undefined || threshold === undefined) {
        return sendError(res, "name, unitOfMeasure, stockLevel, threshold are required", 400);
    }

    const exists = await NonSKUProduct.findOne({ name });
    if (exists) return sendError(res, "Non-SKU product with this name already exists", 409);

    const doc = await NonSKUProduct.create({ name, unitOfMeasure, stockLevel, threshold });
    return sendSuccess(res, "Non-SKU product created", doc, 201);
});

export const getAllNonSKUProducts = catchAsync(async (req: Request, res: Response) => {
    const result = await paginateAndSearch(NonSKUProduct, req);
    return sendSuccess(res, "Non-SKU products fetched", result, 200);
});

export const getNonSKUProductById = catchAsync(async (req: Request, res: Response) => {
    const doc = await NonSKUProduct.findById(req.params.id);
    if (!doc) return sendError(res, "Non-SKU product not found", 404);
    return sendSuccess(res, "Non-SKU product fetched", doc, 200);
});

export const updateNonSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const updated = await NonSKUProduct.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updated) return sendError(res, "Non-SKU product not found", 404);
    return sendSuccess(res, "Non-SKU product updated", updated, 200);
});

export const deleteNonSKUProduct = catchAsync(async (req: Request, res: Response) => {
    const removed = await NonSKUProduct.findByIdAndDelete(req.params.id);
    if (!removed) return sendError(res, "Non-SKU product not found", 404);
    return sendSuccess(res, "Non-SKU product deleted", null, 200);
});



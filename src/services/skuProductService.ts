import SKUProduct from "../models/skuProduct";
import Slot from "../models/slots";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";

// Create SKU Product
export const createSKUProduct = async (data: any) => {
    const { slotId, productId, name, description = '', price } = data;

    if (!slotId || !productId || !name || price === undefined) {
        throw new Error("slotId, productId, name and price are required");
    }

    const existingSKU = await SKUProduct.findOne({
        $or: [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }, { productId: productId }]
    });

    if (existingSKU) {
        throw new Error("SKU with this name or productId already exists");
    }

    const skuProduct = await SKUProduct.create({ slotId, productId, name, description, price });

    await Slot.findByIdAndUpdate(slotId, { $push: { skuProduct: skuProduct._id } });

    // Log the creation
    await AuditLog.create({
        action: AuditAction.SKU_CREATED,
        skuId: skuProduct._id,
        productId: skuProduct.productId,
        name: skuProduct.name,
        price: skuProduct.price,
        slotId: skuProduct.slotId,
        userId: 'system'
    });

    return skuProduct;
};

// Get all SKU Products with pagination
export const getAllSKUProducts = async (query: any) => {
    return await paginateAndSearch(SKUProduct, query);
    
};

// Get SKU Product by ID
export const getSKUProductById = async (id: string) => {
    const skuProduct = await SKUProduct.findById(id);
    if (!skuProduct) {
        throw new Error("SKU Product not found");
    }
    return skuProduct;
};

// Update SKU Product
export const updateSKUProduct = async (id: string, data: any) => {
    const { productId, name, description, price } = data;

    const existingSKU = await SKUProduct.findById(id);
    if (!existingSKU) {
        throw new Error("SKU Product not found");
    }

    // Check for duplicate name or productId if they're being changed
    if (name && name !== existingSKU.name) {
        const duplicateName = await SKUProduct.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        if (duplicateName) {
            throw new Error("SKU with this name already exists");
        }
    }

    if (productId && productId !== existingSKU.productId) {
        const duplicateProductId = await SKUProduct.findOne({
            _id: { $ne: id },
            productId: productId
        });
        if (duplicateProductId) {
            throw new Error("SKU with this productId already exists");
        }
    }

    const updateData: any = {};
    if (productId !== undefined) updateData.productId = productId;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;

    const skuProduct = await SKUProduct.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!skuProduct) {
        throw new Error("Failed to update SKU product");
    }

    // Log the update
    await AuditLog.create({
        action: AuditAction.SKU_UPDATED,
        skuId: skuProduct._id,
        productId: skuProduct.productId,
        name: skuProduct.name,
        price: skuProduct.price,
        previousValue: existingSKU,
        newValue: skuProduct,
        userId: 'system'
    });

    return skuProduct;
};

// Delete SKU Product
export const deleteSKUProduct = async (id: string) => {
    const skuProduct = await SKUProduct.findByIdAndDelete(id);
    if (!skuProduct) {
        throw new Error("SKU Product not found");
    }

    // Log the deletion
    await AuditLog.create({
        action: AuditAction.SKU_DELETED,
        skuId: skuProduct._id,
        productId: skuProduct.productId,
        name: skuProduct.name,
        price: skuProduct.price,
        userId: 'system'
    });

    return skuProduct;
};

// Search SKU Products
export const searchSKUProducts = async (searchTerm: string, query: any) => {
    return await paginateAndSearch(SKUProduct, { ...query, search: searchTerm });
};

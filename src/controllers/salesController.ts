import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import Sales from "../models/sales";
import SlotInventory from "../models/slotInventory";
import VendingMachine from "../models/vendingMModel";
import SKUProduct from "../models/skuProduct";
import Canister from "../models/conisters";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";
import mongoose from "mongoose";

// Generate unique transaction ID
const generateTransactionId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
};

// Check inventory availability before sale
export const checkInventoryAvailability = catchAsync(async (req: Request, res: Response) => {
    const { machineId, items } = req.body;

    if (!machineId || !items || !Array.isArray(items) || items.length === 0) {
        return sendError(res, "machineId and items array are required", 400);
    }

    const inventoryStatus: any[] = [];

    for (const item of items) {
        const { slotId, skuId, quantity, trayId } = item;

        if (!slotId || !skuId || !quantity || !trayId) {
            return sendError(res, "slotId, skuId, quantity, and trayId are required for each item", 400);
        }

        // Get SKU details
        const sku = await SKUProduct.findById(skuId);
        if (!sku) {
            return sendError(res, `SKU not found: ${skuId}`, 404);
        }

        // Check current inventory level
        const currentInventory = await SlotInventory.findOne({
            machineId, trayId, slotId, skuId
        });

        if (!currentInventory) {
            return sendError(res, `No inventory found for SKU: ${sku.name} in slot ${slotId}`, 400);
        }

        if (currentInventory.quantityOnHand === 0) {
            return sendError(res, `SKU: ${sku.name} is out of stock in slot ${slotId}`, 400);
        }

        if (currentInventory.quantityOnHand < quantity) {
            return sendError(res, `Insufficient stock for SKU: ${sku.name}. Available: ${currentInventory.quantityOnHand}, Requested: ${quantity}`, 400);
        }

        inventoryStatus.push({
            slotId,
            skuId,
            skuName: sku.name,
            requestedQuantity: quantity,
            availableQuantity: currentInventory.quantityOnHand,
            unitPrice: sku.price,
            totalPrice: sku.price * quantity,
            status: 'AVAILABLE'
        });
    }

    const totalAmount = inventoryStatus.reduce((sum, item) => sum + item.totalPrice, 0);

    sendSuccess(res, "Inventory check completed", {
        allItemsAvailable: true,
        totalAmount,
        items: inventoryStatus
    }, 200);
});

// Process SKU Sale
export const processSKUSale = catchAsync(async (req: Request, res: Response) => {
    const { machineId, items, paymentMethod = 'CASH', customerId } = req.body;

    if (!machineId || !items || !Array.isArray(items) || items.length === 0) {
        return sendError(res, "machineId and items array are required", 400);
    }

    // Validate machine exists
    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        return sendError(res, "Machine not found", 404);
    }

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const transactionId = generateTransactionId();
            const saleItems: any[] = [];
            let totalAmount = 0;

            // First, check inventory availability for all items
            for (const item of items) {
                const { slotId, skuId, quantity, trayId } = item;

                if (!slotId || !skuId || !quantity || !trayId) {
                    throw new Error("slotId, skuId, quantity, and trayId are required for each item");
                }

                // Get SKU details
                const sku = await SKUProduct.findById(skuId).session(session);
                if (!sku) {
                    throw new Error(`SKU not found: ${skuId}`);
                }

                // Check current inventory level
                const currentInventory = await SlotInventory.findOne({
                    machineId, trayId, slotId, skuId
                }).session(session);

                if (!currentInventory) {
                    throw new Error(`No inventory found for SKU: ${sku.name} in slot ${slotId}`);
                }

                if (currentInventory.quantityOnHand < quantity) {
                    throw new Error(`Insufficient stock for SKU: ${sku.name}. Available: ${currentInventory.quantityOnHand}, Requested: ${quantity}`);
                }
            }

            // If all inventory checks pass, process the sale
            for (const item of items) {
                const { slotId, skuId, quantity, trayId } = item;

                // Get SKU details again
                const sku = await SKUProduct.findById(skuId).session(session);
                if (!sku) {
                    throw new Error(`SKU not found: ${skuId}`);
                }

                // Get current inventory before subtraction
                const currentInventory = await SlotInventory.findOne({
                    machineId, trayId, slotId, skuId
                }).session(session);

                if (!currentInventory) {
                    throw new Error(`Inventory not found for SKU: ${sku.name}`);
                }

                // Atomic inventory decrement - subtract quantity from quantityOnHand
                const updated = await SlotInventory.findOneAndUpdate(
                    { machineId, trayId, slotId, skuId, quantityOnHand: { $gte: quantity } },
                    { $inc: { quantityOnHand: -quantity } }, // Subtract quantity from quantityOnHand
                    { new: true, session }
                );

                if (!updated) {
                    throw new Error(`Concurrent sale detected for SKU: ${sku.name}. Please retry.`);
                }

                // Log the subtraction for verification
                console.log(`Subtracted ${quantity} from ${currentInventory.quantityOnHand}, new quantity: ${updated.quantityOnHand}`);

                const itemTotal = sku.price * quantity;
                totalAmount += itemTotal;

                saleItems.push({
                    skuId,
                    quantity,
                    unitPrice: sku.price,
                    totalPrice: itemTotal
                });

                // Log individual item sale
                await AuditLog.create({
                    action: AuditAction.SKU_SOLD,
                    machineId,
                    skuId,
                    quantity,
                    unit: 'unit',
                    previousValue: updated.quantityOnHand + quantity,
                    newValue: updated.quantityOnHand,
                    userId: 'system'
                });
            }

            // Create sales record
            const sale = await Sales.create([{
                transactionId,
                machineId,
                saleType: 'SKU',
                items: saleItems,
                totalAmount,
                paymentMethod,
                customerId,
                status: 'COMPLETED'
            }], { session });

            return sale[0];
        });

        return sendSuccess(res, "SKU sale processed successfully", { transactionId: generateTransactionId() }, 200);
    } catch (error: any) {
        return sendError(res, error.message || "Failed to process sale", 400);
    } finally {
        await session.endSession();
    }
});

// Process Coffee Sale
export const processCoffeeSale = catchAsync(async (req: Request, res: Response) => {
    const { machineId, recipeId, paymentMethod = 'CASH', customerId } = req.body;

    if (!machineId || !recipeId) {
        return sendError(res, "machineId and recipeId are required", 400);
    }

    // Validate machine exists
    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        return sendError(res, "Machine not found", 404);
    }

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const transactionId = generateTransactionId();
            
            // Get recipe and its ingredients (you'll need to implement Recipe model)
            // For now, we'll use the canister consumption logic from the canister controller
            
            // This is a placeholder - you'll need to implement recipe logic
            const saleItems = [{
                canisterId: null, // Will be set based on recipe
                quantity: 1,
                unitPrice: 2.50, // Coffee price
                totalPrice: 2.50
            }];

            // Create sales record
            const sale = await Sales.create([{
                transactionId,
                machineId,
                saleType: 'COFFEE',
                items: saleItems,
                totalAmount: 2.50,
                paymentMethod,
                customerId,
                status: 'COMPLETED'
            }], { session });

            return sale[0];
        });

        return sendSuccess(res, "Coffee sale processed successfully", { transactionId: generateTransactionId() }, 200);
    } catch (error: any) {
        return sendError(res, error.message || "Failed to process coffee sale", 400);
    } finally {
        await session.endSession();
    }
});

// Get all sales with pagination
export const getAllSales = catchAsync(async (req: Request, res: Response) => {
    const sales = await paginateAndSearch(Sales, req);
    
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
});

// Get sales by machine
export const getSalesByMachine = catchAsync(async (req: Request, res: Response) => {
    const { machineId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    const query: any = { machineId };
    
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate as string);
        if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const sales = await Sales.find(query)
        .sort({ timestamp: -1 })
        .limit(Number(limit))
        .populate([
            { path: 'machineId', select: 'name type location' },
            { path: 'items.skuId', select: 'productId name price' },
            { path: 'items.canisterId', select: 'name capacity currentLevel' }
        ]);

    sendSuccess(res, "Machine sales retrieved successfully", sales);
});

// Get sales summary/analytics
export const getSalesSummary = catchAsync(async (req: Request, res: Response) => {
    const { machineId, startDate, endDate } = req.query;

    const matchStage: any = { status: 'COMPLETED' };
    if (machineId) matchStage.machineId = new mongoose.Types.ObjectId(machineId as string);
    if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = new Date(startDate as string);
        if (endDate) matchStage.timestamp.$lte = new Date(endDate as string);
    }

    const summary = await Sales.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$totalAmount' },
                totalTransactions: { $sum: 1 },
                avgTransactionValue: { $avg: '$totalAmount' },
                skuSales: {
                    $sum: {
                        $cond: [{ $eq: ['$saleType', 'SKU'] }, 1, 0]
                    }
                },
                coffeeSales: {
                    $sum: {
                        $cond: [{ $eq: ['$saleType', 'COFFEE'] }, 1, 0]
                    }
                }
            }
        }
    ]);

    sendSuccess(res, "Sales summary retrieved successfully", summary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        avgTransactionValue: 0,
        skuSales: 0,
        coffeeSales: 0
    });
});

// Refund a sale
export const refundSale = catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const { reason } = req.body;

    const sale = await Sales.findOne({ transactionId });
    if (!sale) {
        return sendError(res, "Sale not found", 404);
    }

    if (sale.status === 'REFUNDED') {
        return sendError(res, "Sale already refunded", 400);
    }

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            // Restore inventory for SKU sales
            if (sale.saleType === 'SKU') {
                for (const item of sale.items) {
                    if (item.skuId) {
                        // You'll need to track which slot the item came from
                        // This is a simplified version - you might need to store slot info in sales
                        await AuditLog.create({
                            action: AuditAction.SKU_RESTOCKED,
                            machineId: sale.machineId,
                            skuId: item.skuId,
                            quantity: item.quantity,
                            unit: 'unit',
                            previousValue: null,
                            newValue: item.quantity,
                            userId: 'system'
                        });
                    }
                }
            }

            // Update sale status
            await Sales.findByIdAndUpdate(
                sale._id,
                { status: 'REFUNDED' },
                { session }
            );
        });

        sendSuccess(res, "Sale refunded successfully", null);
    } catch (error: any) {
        return sendError(res, error.message || "Failed to process refund", 400);
    } finally {
        await session.endSession();
    }
});

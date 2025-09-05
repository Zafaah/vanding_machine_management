import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import SlotInventory from "../models/slotInventory";
import VendingMachine from "../models/vendingMModel";
import Trays from "../models/trays";
import Slots from "../models/slots";
import SKUProduct from "../models/skuProduct";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";

export const setSlotInventory = catchAsync(async (req: Request, res: Response) => {
    const { machineId, trayId, slotId, skuId, quantityOnHand } = req.body;

    if (!machineId || !trayId || !slotId || !skuId) {
        return sendError(res, "machineId, trayId, slotId, skuId are required", 400);
    }

    if (quantityOnHand !== undefined && (isNaN(quantityOnHand) || quantityOnHand < 0)) {
        return sendError(res, "quantityOnHand must be a non-negative number", 400);
    }

    // Validate references exist and are related
    const [machine, tray, slot, sku] = await Promise.all([
        VendingMachine.findById(machineId),
        Trays.findById(trayId),
        Slots.findById(slotId),
        SKUProduct.findById(skuId),
    ]);

    if (!machine) return sendError(res, "Machine not found", 404);
    if (!tray || String(tray.machineId) !== String(machineId)) return sendError(res, "Tray not found or not in machine", 404);
    if (!slot || !tray.slot.map(String).includes(String(slotId))) return sendError(res, "Slot not found or not in tray", 404);
    if (!sku) return sendError(res, "SKU not found", 404);

    const inventory = await SlotInventory.findOneAndUpdate(
        { machineId, trayId, slotId, skuId },
        { $set: { quantityOnHand: quantityOnHand ?? 0 } },
        { upsert: true, new: true, runValidators: true }
    ).populate([
        { path: 'machineId', select: 'name type status location' },
        { path: 'trayId', select: 'name' },
        { path: 'slotId', select: 'quantityOnhand' },
        { path: 'skuId', select: 'productId name description price' }
    ]);

   

    return sendSuccess(res, "Inventory set", inventory, 200);
});

export const getSlotInventory = catchAsync(async (req: Request, res: Response) => {
    const { machineId, trayId, slotId, skuId } = req.query as any;

    const query: any = {};
    if (machineId) query.machineId = machineId;
    if (trayId) query.trayId = trayId;
    if (slotId) query.slotId = slotId;
    if (skuId) query.skuId = skuId;

   
    const items = await SlotInventory.find(query).populate([
        { path: 'machineId', select: 'name type status location' },
        { path: 'trayId', select: 'name' },
        { path: 'slotId', select: 'quantityOnhand' },
        { path: 'skuId', select: 'productId name description price' }
    ]);
   

    
    return sendSuccess(res, "Inventory fetched", items, 200);
});

export const sellFromSlot = catchAsync(async (req: Request, res: Response) => {
    const { machineId, trayId, slotId, skuId } = req.body;
    const quantity = Number(req.body.quantity ?? 1);

    if (!machineId || !trayId || !slotId || !skuId) {
        return sendError(res, "machineId, trayId, slotId, skuId are required", 400);
    }
    if (!quantity || quantity <= 0) {
        return sendError(res, "quantity must be a positive integer", 400);
    }

    // Atomic decrement with availability check
    const updated = await SlotInventory.findOneAndUpdate(
        { machineId, trayId, slotId, skuId, quantityOnHand: { $gte: quantity } },
        { $inc: { quantityOnHand: -quantity } },
        { new: true }
    );

    if (!updated) {
        return sendError(res, "Insufficient stock or inventory not found", 400);
    }

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

    return sendSuccess(res, "Sale processed", updated, 200);
});



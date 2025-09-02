import Slots from "../models/slots";
import catchAsync from "../middlewares/catchasync";
import { sendSuccess, sendError } from "../utils/apiResponse";
import logger from "../logging/logger";
import { Request, Response, NextFunction } from "express";
import { paginateAndSearch } from "../utils/apiFeatures";
import Trays from "../models/trays";
import auditLOg from "../models/auditLOg";

// Create Slot
export const createSlot = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { trayId, skuId, quantityOnhand } = req.body;
    if (!trayId || !quantityOnhand) {
        return sendError(res, "trayId, skuId, and quantityOnhand are required", 400);
    }


    const existing = await Slots.findOne({ trayId });
    if (existing) {
        return sendError(res, "Slot with this trayId and skuId already exists", 409);
    }

    const slot = await Slots.create({ trayId, skuId, quantityOnhand });

    await Trays.findByIdAndUpdate(trayId, { $push: { slot: slot._id } });

    await slot.populate("skuId");

    logger.info(`Slot created with ID: ${slot._id}`);
    
    await auditLOg.create({
        action: 'SLOT_CREATED',
        model: "slots",
        machineId: trayId,
        userId: 'system',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { slotId: slot._id, trayId, skuId }
    })

    sendSuccess(res, "Slot created successfully", slot, 201);
});

// Get all slots
export const getAllSlots = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const slots = await paginateAndSearch(Slots,req,"trayId");
    sendSuccess(res, "Slots retrieved successfully", slots);
});

// Get slot by ID
export const getSlotById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const slot = await Slots.findById(id).populate("trayId").populate("skuId");
    if (!slot) {
        return sendError(res, "Slot not found", 404);
    }
    sendSuccess(res, "Slot retrieved successfully", slot);
});

// Update slot
export const updateSlot = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { trayId, skuId, quantityOnhand } = req.body;

    if (trayId && skuId) {
        const existing = await Slots.findOne({ trayId, skuId, _id: { $ne: id } });
        if (existing) {
            return sendError(res, "Slot with this trayId and skuId already exists", 409);
        }
    }

    const slot = await Slots.findByIdAndUpdate(
        id,
        { trayId, skuId, quantityOnhand },
        { new: true, runValidators: true }
    ).populate("trayId").populate("skuId");

    if (!slot) {
        return sendError(res, "Slot not found", 404);
    }
    sendSuccess(res, "Slot updated successfully", slot);
});

// Delete slot
export const deleteSlot = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const slot = await Slots.findByIdAndDelete(id);
    if (!slot) {
        return sendError(res, "Slot not found", 404);
    }
    sendSuccess(res, "Slot deleted successfully", slot);
});
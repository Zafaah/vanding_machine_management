import catchAsync from "../middlewares/catchasync";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { Request, Response, NextFunction } from "express";
import * as slotService from "../services/slotService";

// Create Slot
export const createSlot = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const slot = await slotService.createSlot(req.body, req);
    sendSuccess(res, "Slot created successfully", slot, 201);
});

// Get all slots
export const getAllSlots = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const slots = await slotService.getAllSlots(req.query);
    sendSuccess(res, "Slots retrieved successfully", slots);
});

// Get slot by ID
export const getSlotById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const slot = await slotService.getSlotById(id);
    sendSuccess(res, "Slot retrieved successfully", slot);
});

// Update slot
export const updateSlot = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const slot = await slotService.updateSlot(id, req.body);
    sendSuccess(res, "Slot updated successfully", slot);
});

// Delete slot
export const deleteSlot = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const slot = await slotService.deleteSlot(id);
    sendSuccess(res, "Slot deleted successfully", slot);
});
import { Request, Response } from "express";
import catchAsync from "../middlewares/catchasync";
import { sendError, sendSuccess } from "../utils/apiResponse";
import * as slotInventoryService from "../services/slotInventoryService";

export const setSlotInventory = catchAsync(async (req: Request, res: Response) => {
    const inventory = await slotInventoryService.setSlotInventory(req.body);
    sendSuccess(res, "Inventory set", inventory, 200);
});

export const getSlotInventory = catchAsync(async (req: Request, res: Response) => {
    const items = await slotInventoryService.getSlotInventory(req.query);
    sendSuccess(res, "Inventory fetched", items, 200);
});

export const sellFromSlot = catchAsync(async (req: Request, res: Response) => {
    const updated = await slotInventoryService.sellFromSlot(req.body);
    sendSuccess(res, "Sale processed", updated, 200);
});

export const getInventoryByMachine = catchAsync(async (req: Request, res: Response) => {
    const { machineId } = req.params;
    const items = await slotInventoryService.getInventoryByMachine(machineId);
    sendSuccess(res, "Machine inventory fetched", items, 200);
});

export const getLowStockItems = catchAsync(async (req: Request, res: Response) => {
    const { threshold = 5 } = req.query;
    const items = await slotInventoryService.getLowStockItems(Number(threshold));
    sendSuccess(res, "Low stock items fetched", items, 200);
});

export const updateInventoryQuantity = catchAsync(async (req: Request, res: Response) => {
    const { inventoryId } = req.params;
    const { quantityOnHand } = req.body;
    const inventory = await slotInventoryService.updateInventoryQuantity(inventoryId, quantityOnHand);
    sendSuccess(res, "Inventory quantity updated", inventory, 200);
});

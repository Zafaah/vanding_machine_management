import catchAsync from "../middlewares/catchasync";
import { Request, Response, NextFunction } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import * as trayService from "../services/trayService";

export const createTrays = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tray = await trayService.createTray(req.body, req);
    sendSuccess(res, "Tray created successfully", tray, 201);
});

export const getAllTrays = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const results = await trayService.getAllTrays(req.query);
    sendSuccess(res, "Trays retrieved successfully", results);
});

export const getTrayById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const tray = await trayService.getTrayById(id);
    sendSuccess(res, "Tray retrieved successfully", tray);
});




export const updateTray = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const tray = await trayService.updateTray(id, req.body);
    sendSuccess(res, "Tray updated successfully", tray);
});

export const deleteTray = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const tray = await trayService.deleteTray(id);
    sendSuccess(res, "Tray deleted successfully", tray);
});
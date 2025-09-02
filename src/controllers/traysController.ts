import catchAsync from "../middlewares/catchasync";
import { Request, Response, NextFunction } from "express";
import Trays from "../models/trays";
import { sendError, sendSuccess } from "../utils/apiResponse";
import logger from "../logging/logger";
import auditLOg from "../models/auditLOg";
import { AuditAction } from "../types/types";
import VendingMachine from "../models/vendingMModel";
import { paginateAndSearch } from "../utils/apiFeatures";

export const createTrays = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

   const { name, machineId, slot } = req.body;
   if (!name || !machineId) {
      return sendError(res, "Name and Machine ID are required", 400);
   }

 
   const machine = await VendingMachine.findById(machineId);
   if (!machine) {
      return sendError(res, "Machine not found", 404);
   }
   
   if (machine.type === 'coffee') {
      return sendError(res, "Cannot create trays for coffee machines", 400);
   }

   const existingTray = await Trays.findOne({ name, machineId});
   if (existingTray) {
      return sendError(res, "Tray with this name already exists for the given machine", 409);
   }

   const trays = await Trays.create({ name, machineId, slot });

   await VendingMachine.findByIdAndUpdate(machineId,
      { $push: { trays: trays._id } });

   await trays.populate('slot');

   logger.info(`Tray created with ID: ${trays._id}`);

   await auditLOg.create({
      action: AuditAction.MACHINE_CREATED,
      model: "trays",
      machineId,
      userId: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { trayId: trays._id, name }
   });
   sendSuccess(res, "Tray created successfully", trays, 201);
});

export const getAllTrays = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
   const results = await paginateAndSearch(Trays, req, "name");
   sendSuccess(res, "Trays retrieved successfully", results);
});

export const getTrayById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
   const { id } = req.params;
   const trays = await Trays.findOne({ _id: id });
   if (!trays) {
      return sendError(res, "Tray not found", 404);
   }
   await trays.populate('slot');
   sendSuccess(res, "Tray retrieved successfully", trays);
});




export const updateTray = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
   const { id } = req.params;
   const { name, machineId } = req.body;

   const oldTray = await Trays.findById(id);
   if (!oldTray) {
      return sendError(res, "Tray not found", 404);
   }

   const oldMachineId = oldTray.machineId?.toString();

   const updatedTray = await Trays.findByIdAndUpdate(
      id,
      { name, machineId },
      { new: true }
   );
   if (!updatedTray) {
      return sendError(res, "Tray not found", 404);
   }
   if (machineId && oldMachineId !== machineId) {
      // ka saar trays[] machine-kii hore
      if (oldMachineId) {
         await VendingMachine.findByIdAndUpdate(oldMachineId, {
            $pull: { trays: oldTray._id }
         });
      }
      await VendingMachine.findByIdAndUpdate(machineId, {
         $push: { trays: updatedTray!._id }
      });
   }
   await updatedTray.populate('slot');
   sendSuccess(res, "Tray updated successfully", updatedTray);
});

export const deleteTray = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

   const { id } = req.params;
   const trays = await Trays.findByIdAndDelete(id);
   if (!trays) {
      return sendError(res, "Tray not found", 404);
   }

   await VendingMachine.findByIdAndUpdate(trays.machineId, { $pull: { trays: trays._id } });

   await trays.populate('slot');
   sendSuccess(res, "Tray deleted successfully", trays);
})
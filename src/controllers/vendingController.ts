import catchAsync from "../middlewares/catchasync";
import { sendSuccess, sendError } from "../utils/apiResponse";
import * as machineService from "../services/vendingMachine/machineService";

export const createVendingMachine = catchAsync(async (req, res) => {
   if (!req.body.name || !req.body.location) {
      return sendError(res, "Name and location are required", 400);
   }

   const meta = {
      userId: "system",
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
   };

   const vendingMachine = await machineService.createMachine(req.body, meta);

   sendSuccess(res, "Vending machine created successfully", vendingMachine, 201);
});

export const getAllVendingMachines = catchAsync(async (req, res) => {
   const result = await machineService.getAllMachines(req);
   sendSuccess(res, "Vending machines retrieved successfully", result);
});

export const getVendingMachineById = catchAsync(async (req, res) => {
   const vendingMachine = await machineService.getMachineById(req.params.id);
   if (!vendingMachine) {
      return sendError(res, "Vending machine not found", 404);
   }
   sendSuccess(res, "Vending machine retrieved successfully", vendingMachine);
});

export const updateVendingMachine = catchAsync(async (req, res) => {
   const vendingMachine = await machineService.updateMachine(req.params.id, req.body);
   if (!vendingMachine) {
      return sendError(res, "Vending machine not found", 404);
   }
   sendSuccess(res, "Vending machine updated successfully", vendingMachine);
});

export const deleteVendingMachine = catchAsync(async (req, res) => {
   const vendingMachine = await machineService.deleteMachine(req.params.id);
   if (!vendingMachine) {
      return sendError(res, "Vending machine not found", 404);
   }
   sendSuccess(res, "Vending machine deleted successfully", vendingMachine);
});

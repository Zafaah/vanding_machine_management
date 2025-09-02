import VendingMachine from "../models/vendingMModel";
import catchAsync from "../middlewares/catchasync";
import { sendSuccess, sendError } from "../utils/apiResponse";
import logger from "../logging/logger";
import { AuditAction } from "../types/types";
import auditLog from "../models/auditLOg";
import { paginateAndSearch } from "../utils/apiFeatures";
import { formatVendingMachine } from "../utils/vendingMachineResponse";
import { machineType } from "../types/types";


export const createVendingMachine = catchAsync(async (req, res) => {
   const { name, location, status, type, trays, canisters } = req.body;
   
   if (!name || !location) {
      return sendError(res, "Name and location are required", 400);
   }

   const machineData: any = { name, location, status: status || "active", type };
 
   if (type === machineType.COFFEE) {
     machineData.canisters = canisters;
     // trays ha lagu darin
   } else if (type === machineType.SLOT) {
     machineData.trays = trays;
     // canisters ha lagu darin
   } else if (type === machineType.COMBO) {
     machineData.trays = trays;
     machineData.canisters = canisters;
   }
   const vendingMachine = await VendingMachine.create(machineData);

   logger.info(`Vending machine created with ID: ${vendingMachine._id}`);

   await auditLog.create({
      action: AuditAction.MACHINE_CREATED,
      machineId: vendingMachine._id,
      model: "VendingMachine",
      userId: 'system',
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      meta: {
         machineId: vendingMachine._id,
         name: vendingMachine.name,
         location: vendingMachine.location
      }
   });

   sendSuccess(res, "Vending machine created successfully", formatVendingMachine(vendingMachine), 201);
});


export const getAllVendingMachines = catchAsync(async (req, res) => {
   
   let result = await paginateAndSearch(VendingMachine, req, "trays");

   if (result && Array.isArray(result.results)) {
      result.results = await VendingMachine.populate(result.results, [
         { path: "trays" },
         { path: "canisters" }
      ]);
      const formatted = result.results.map(formatVendingMachine);
      (result as any).results = formatted;
      return sendSuccess(res, "Vending machines retrieved successfully", result);
   }

   const populated = await VendingMachine.populate(result, [
      { path: "trays" },
      { path: "canisters" }
   ]);
   const formatted = Array.isArray(populated)
      ? populated.map(formatVendingMachine)
      : [formatVendingMachine(populated)];
   sendSuccess(res, "Vending machines retrieved successfully", formatted);
});

export const getVendingMachineById = catchAsync(async (req, res) => {
   const { id } = req.params;

   const vendingMachine = await VendingMachine.findById(id).populate("trays").populate("canisters");
   if (!vendingMachine) {
      return sendError(res, "Vending machine not found", 404);
   }

   sendSuccess(res, "Vending machine retrieved successfully", formatVendingMachine(vendingMachine));
});

export const updateVendingMachine = catchAsync(async (req, res) => { 
   const { id } = req.params;
   const { name, location, status, type, trays, canisters } = req.body;
   const vendingMachine = await VendingMachine.findOneAndUpdate({ _id: id }, {
      name,
      location,
      status,
      type
   }, { new: true });

   if (!vendingMachine) {
      return sendError(res, "Vending machine not found", 404);
   }

   sendSuccess(res, "Vending machine updated successfully", vendingMachine);
});

export const deleteVendingMachine = catchAsync(async (req, res) => {
   const { id } = req.params;

   const vendingMachine = await VendingMachine.findByIdAndDelete(id);
   if (!vendingMachine) {
      return sendError(res, "Vending machine not found", 404);
   }

   sendSuccess(res, "Vending machine deleted successfully", vendingMachine);
});

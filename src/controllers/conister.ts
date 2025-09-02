import { log } from "console";
import catchAsync from "../middlewares/catchasync";
import Canister from "../models/conisters";
import VendingMachine from "../models/vendingMModel";
import { sendSuccess } from "../utils/apiResponse";
import logger from "../logging/logger";
import { AuditAction } from "../types/types";
import auditLOg from "../models/auditLOg";
import { Request,Response } from "express";
import { paginateAndSearch } from "../utils/apiFeatures";
import { sendError } from "../utils/apiResponse";


export const createCanister = catchAsync(async (req: Request, res: Response) => {

   const { name, machineId, ingredientId, capacity, currentLevel } = req.body;

   if (!name || !machineId || !capacity || currentLevel === undefined) {
      return res.status(400).json({ status: 'fail', message: 'All fields are required' });
   }

   const machine = await VendingMachine.findById(machineId);
   if (!machine) {
      return sendError(res, "Machine not found", 404);
   }
    
   if (machine.type === 'slot') {
      return sendError(res, "Cannot create canisters for slot machines", 400);
   }

   const existingCanister = await Canister.findOne({ name, machineId });
   if (existingCanister) {
      return sendError(res, "Canister with this name already exists for the given machine", 409);
   }

   const newConister = await Canister.create({
      name,
      machineId,
      ingredientId,
      capacity,
      currentLevel
   });

   await VendingMachine.findByIdAndUpdate(machineId, {
      $push: { canisters: newConister._id }
   });

   await newConister.populate('ingredientId');

   logger.info(`conister created: ${newConister}`);

   await auditLOg.create({
      action: AuditAction.MACHINE_CREATED,
      documentId: newConister._id,
      machineId,
      userId: 'system',
      userAgent: req.headers['user-agent'],
      ingredientId: newConister.ingredientId,
      changes: {
         name: newConister.name,
         capacity: newConister.capacity,
         currentLevel: newConister.currentLevel
      }
   });

   sendSuccess(res, "Canister created successfully", newConister, 201);
});


export const getAllCanisters = catchAsync(async (req, res) => {

   const canisters = await paginateAndSearch(Canister, req, "name");

   sendSuccess(res, "Canisters retrieved successfully", canisters);
});

export const getCanisterById= catchAsync(async(req:Request,res:Response)=>{
   const {id}=req.params;
   const canister=await Canister.findById(id);
   if(!canister){
      return sendError(res,"Canister not found",404);
   }
   await canister.populate('ingredientId');
   sendSuccess(res,"Canister retrieved successfully",canister);
});

export const updateCanister= catchAsync(async(req:Request,res:Response)=>{
   const {id}=req.params;
   const {name,machineId,ingredientId,capacity,currentLevel}=req.body;
   
   const oldCanister=await Canister.findById(id);
   if(!oldCanister){
      return sendError(res,"Canister not found",404);
   }

   const updatedCanister=await Canister.findByIdAndUpdate(id,{name,machineId,ingredientId,capacity,currentLevel},{new:true});
   if(!updatedCanister){
      return sendError(res,"Canister not found",404);
   }
   await updatedCanister.populate('ingredientId');
   sendSuccess(res,"Canister updated successfully",updatedCanister);
});


export const deleteCanister= catchAsync(async(req:Request,res:Response)=>{
   const {id}=req.params;
   const canister=await Canister.findByIdAndDelete(id);
   if(!canister){
      return sendError(res,"Canister not found",404);
   }
   await canister.populate('ingredientId');
   sendSuccess(res,"Canister deleted successfully",canister);
});

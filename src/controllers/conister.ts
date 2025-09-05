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
import mongoose from "mongoose";


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

// Assign an ingredient to a canister (replaces existing assignment)
export const assignIngredientToCanister = catchAsync(async (req: Request, res: Response) => {
   const { id } = req.params;
   const { ingredientId } = req.body;

   if (!ingredientId) return sendError(res, "ingredientId is required", 400);

   const canister = await Canister.findById(id);
   if (!canister) return sendError(res, "Canister not found", 404);

   // Only one ingredient per canister; store as single-element array to respect schema
   canister.ingredientId = [ingredientId] as any;
   await canister.save();
   await canister.populate('ingredientId');

   return sendSuccess(res, "Ingredient assigned to canister", canister, 200);
});

// Refill a canister up to its capacity atomically (cap at capacity)
export const refillCanister = catchAsync(async (req: Request, res: Response) => {
   const { id } = req.params;
   const amount = Number(req.body.amount);
   if (!amount || amount <= 0) return sendError(res, "amount must be a positive number", 400);

   // Use a retry-safe optimistic update to compute delta and avoid race conditions
   for (let attempt = 0; attempt < 2; attempt++) {
      const doc = await Canister.findById(id);
      if (!doc) return sendError(res, "Canister not found", 404);

      const previousLevel = doc.currentLevel;
      const capacity = doc.capacity;
      if (previousLevel >= capacity) {
         return sendSuccess(res, "Canister already full", doc, 200);
      }
      const room = capacity - previousLevel;
      const add = Math.min(room, amount);

      const updated = await Canister.findOneAndUpdate(
         { _id: id, currentLevel: previousLevel },
         { $inc: { currentLevel: add } },
         { new: true }
      );
      if (updated) {
         await auditLOg.create({
            action: AuditAction.CANISTER_REFILLED,
            machineId: updated.machineId,
            canisterId: updated._id as any,
            quantity: add,
            unit: (updated as any).ingredientId?.length ? undefined : undefined,
            previousValue: previousLevel,
            newValue: updated.currentLevel,
            userId: 'system',
         });
         await updated.populate('ingredientId');
         return sendSuccess(res, "Canister refilled", updated, 200);
      }
      // concurrent update happened, retry once
   }
   return sendError(res, "Could not refill canister due to concurrent updates. Please retry.", 409);
});

// Consume from multiple canisters atomically for a coffee sale
// Body: { machineId, consumptions: [{ canisterId, amount }] }
export const consumeCanistersForSale = catchAsync(async (req: Request, res: Response) => {
   const { machineId, consumptions } = req.body as { machineId: string, consumptions: Array<{ canisterId: string, amount: number }> };
   if (!machineId || !Array.isArray(consumptions) || consumptions.length === 0) {
      return sendError(res, "machineId and consumptions are required", 400);
   }

   const session = await mongoose.startSession();
   try {
      await session.withTransaction(async () => {
         // Validate all first
         const canisterIds = consumptions.map(c => c.canisterId);
         const canisters = await Canister.find({ _id: { $in: canisterIds }, machineId }).session(session);
         const canisterMap = new Map(canisters.map(c => [String(c._id), c]));

         for (const { canisterId, amount } of consumptions) {
            if (!amount || amount <= 0) throw new Error("Invalid amount in consumptions");
            const c = canisterMap.get(String(canisterId));
            if (!c) throw new Error("Canister not found or not in machine");
            if (c.currentLevel < amount) throw new Error("Insufficient canister level");
         }

         // Decrement each
         for (const { canisterId, amount } of consumptions) {
            const updated = await Canister.findOneAndUpdate(
               { _id: canisterId, machineId, currentLevel: { $gte: amount } },
               { $inc: { currentLevel: -amount } },
               { new: true, session }
            );
            if (!updated) throw new Error("Concurrent update detected");

            await auditLOg.create({
               action: AuditAction.INGREDIENT_CONSUMED,
               machineId: updated.machineId,
               ingredientId: (updated as any).ingredientId?.[0],
               quantity: amount,
               unit: undefined,
               previousValue: updated.currentLevel + amount,
               newValue: updated.currentLevel,
               userId: 'system',
            });
         }
      });

      return sendSuccess(res, "Coffee sale processed", null, 200);
   } catch (err: any) {
      return sendError(res, err.message || "Failed to process sale", 400);
   } finally {
      await session.endSession();
   }
});

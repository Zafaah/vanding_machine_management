import express from "express";
import { createSlot, deleteSlot, getAllSlots, getSlotById, updateSlot } from "../controllers/slotsControlers";

const slotRouter=express.Router();

slotRouter.route('/')
   .post(createSlot)
   .get(getAllSlots);

slotRouter.route('/:id')
   .get(getSlotById)
   .put(updateSlot)
   .delete(deleteSlot);

export default slotRouter;
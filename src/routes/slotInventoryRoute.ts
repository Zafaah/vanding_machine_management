import express from "express";
import { getSlotInventory, sellFromSlot, setSlotInventory } from "../controllers/slotInventoryController";

const slotInventoryRouter = express.Router();

slotInventoryRouter.post('/', setSlotInventory);
slotInventoryRouter.get('/', getSlotInventory);
slotInventoryRouter.post('/sell', sellFromSlot);

export default slotInventoryRouter;



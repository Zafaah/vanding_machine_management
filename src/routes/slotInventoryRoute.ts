import express from "express";
import { 
    getSlotInventory, 
    sellFromSlot, 
    setSlotInventory,
    getInventoryByMachine,
    getLowStockItems,
    updateInventoryQuantity
} from "../controllers/slotInventoryController";

const slotInventoryRouter = express.Router();

slotInventoryRouter.post('/', setSlotInventory);
slotInventoryRouter.get('/', getSlotInventory);
slotInventoryRouter.post('/sell', sellFromSlot);
slotInventoryRouter.get('/machine/:machineId', getInventoryByMachine);
slotInventoryRouter.get('/low-stock', getLowStockItems);
slotInventoryRouter.put('/:inventoryId', updateInventoryQuantity);

export default slotInventoryRouter;



import express from "express";
import {
    checkInventoryAvailability,
    processSKUSale,
    processCoffeeSale,
    getAllSales,
    getSalesByMachine,
    getSalesSummary,
    refundSale
} from "../controllers/salesController";

const salesRouter = express.Router();

// Check inventory before sale
salesRouter.post('/check-inventory', checkInventoryAvailability);

// Process sales
salesRouter.post('/sku', processSKUSale);
salesRouter.post('/coffee', processCoffeeSale);

// Get sales data
salesRouter.get('/', getAllSales);
salesRouter.get('/machine/:machineId', getSalesByMachine);
salesRouter.get('/summary', getSalesSummary);

// Refund
salesRouter.post('/refund/:transactionId', refundSale);

export default salesRouter;

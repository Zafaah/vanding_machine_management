import express from "express";
import {
    calculateCoffeeAvailability,
    getMachineForecast,
    getLowStockWarnings,
    getAllMachinesForecast
} from "../controllers/forecastController";

const forecastRouter = express.Router();

// Calculate coffee availability
forecastRouter.get('/coffee-availability/:machineId/:recipeId', calculateCoffeeAvailability);

// Get forecast for all recipes in a machine
forecastRouter.get('/machine/:machineId', getMachineForecast);

// Get low stock warnings for a machine
forecastRouter.get('/low-stock/:machineId', getLowStockWarnings);


// Get forecast summary for all machines
forecastRouter.get('/all-machines', getAllMachinesForecast);

export default forecastRouter;

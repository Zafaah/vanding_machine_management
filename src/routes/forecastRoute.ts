import express from "express";
import {
    calculateCoffeeAvailability,
    getMachineForecast,
    getLowStockWarnings,
    getIngredientConsumptionForecast,
    getAllMachinesForecast
} from "../controllers/forecastController";

const forecastRouter = express.Router();

// Calculate coffee availability for a specific recipe
forecastRouter.get('/coffee-availability/:machineId/:recipeId', calculateCoffeeAvailability);

// Get forecast for all recipes in a machine
forecastRouter.get('/machine/:machineId', getMachineForecast);

// Get low stock warnings for a machine
forecastRouter.get('/low-stock/:machineId', getLowStockWarnings);

// Get ingredient consumption forecast
forecastRouter.post('/consumption/:machineId/:recipeId', getIngredientConsumptionForecast);

// Get forecast summary for all machines
forecastRouter.get('/all-machines', getAllMachinesForecast);

export default forecastRouter;

import VendingMachine from "../models/vendingMModel";
import Canister from "../models/conisters";
import Recipe from "../models/recipe";
import Ingredients from "../models/ingredient";
import AuditLog from "../models/auditLOg";



// Calculate coffee availability for a given machine and recipe
export const calculateCoffeeAvailability = async (machineId: string, recipeId: string) => {
    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        throw new Error("Machine not found");
    }

    if (machine.type !== 'coffee' && machine.type !== 'combo') {
        throw new Error("Machine must be coffee or combo type");
    }

    // Get recipe details
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
        throw new Error("Recipe not found");
    }

    if (!recipe.isActive) {
        throw new Error("Recipe is not active");
    }

    // Get all canisters for this machine
    const canisters = await Canister.find({ machineId }).populate('ingredientId');
    
    if (!canisters || canisters.length === 0) {
        throw new Error("No canisters found for this machine");
    }

    // Create a map of ingredient ID to canister for quick lookup
    const ingredientToCanister = new Map();
    canisters.forEach(canister => {
        if (canister.ingredientId && Array.isArray(canister.ingredientId)) {
            canister.ingredientId.forEach((ingredient: any) => {
                ingredientToCanister.set((ingredient._id as any).toString(), canister);
            });
        } else if (canister.ingredientId) {
            ingredientToCanister.set((canister.ingredientId as any)._id.toString(), canister);
        }
    });

    // Get ingredient details for all recipe ingredients
    const ingredientIds = recipe.ingredients.map(ri => ri.ingredientId);
    const ingredients = await Ingredients.find({ _id: { $in: ingredientIds } });
    const ingredientMap = new Map();
    ingredients.forEach((ingredient: any) => {
        ingredientMap.set((ingredient._id as any).toString(), ingredient);
    });

    // Calculate availability for each ingredient
    const ingredientAvailability: any[] = [];
    let maxCupsPossible = Infinity;
    let isOutOfStock = false;
    let limitingIngredient = null;

    for (const recipeIngredient of recipe.ingredients) {
        const canister = ingredientToCanister.get(recipeIngredient.ingredientId.toString());
        const ingredient = ingredientMap.get(recipeIngredient.ingredientId.toString());
        
        if (!canister) {
            // Ingredient not found in any canister
            isOutOfStock = true;
            limitingIngredient = recipeIngredient.ingredientId;
            ingredientAvailability.push({
                ingredientId: recipeIngredient.ingredientId,
                ingredientName: ingredient?.name || 'Unknown Ingredient',
                requiredQuantity: recipeIngredient.quantity,
                requiredUnit: recipeIngredient.unit,
                availableQuantity: 0,
                canisterId: null,
                canisterCapacity: 0,
                currentLevel: 0,
                cupsPossible: 0,
                status: 'NOT_AVAILABLE'
            });
            maxCupsPossible = 0;
            break;
        }

        // Calculate how many cups can be made with this ingredient
        const cupsPossible = Math.floor(canister.currentLevel / recipeIngredient.quantity);
        
        ingredientAvailability.push({
            ingredientId: recipeIngredient.ingredientId,
            ingredientName: ingredient?.name || 'Unknown Ingredient',
            requiredQuantity: recipeIngredient.quantity,
            requiredUnit: recipeIngredient.unit,
            availableQuantity: canister.currentLevel,
            canisterId: canister._id,
            canisterCapacity: canister.capacity,
            currentLevel: canister.currentLevel,
            cupsPossible: cupsPossible,
            status: cupsPossible > 0 ? 'AVAILABLE' : 'INSUFFICIENT'
        });

        // Update max cups possible (limited by the most restrictive ingredient)
        if (cupsPossible < maxCupsPossible) {
            maxCupsPossible = cupsPossible;
            limitingIngredient = recipeIngredient.ingredientId;
        }

        // If any ingredient can't make even 1 cup, mark as out of stock
        if (cupsPossible < 1) {
            isOutOfStock = true;
        }
    }

    const result = {
        machineId,
        machineName: machine.name,
        recipeId,
        recipeName: recipe.name,
        recipePrice: recipe.price,
        maxCupsPossible: isOutOfStock ? 0 : maxCupsPossible,
        isOutOfStock,
        limitingIngredient,
        ingredientAvailability,
        calculation: {
            totalCanisters: canisters.length,
            requiredIngredients: recipe.ingredients.length,
            availableIngredients: ingredientAvailability.filter(ing => ing.status === 'AVAILABLE').length
        }
    };

    // Log the availability check
    await AuditLog.create({
        action: 'COFFEE_AVAILABILITY_CHECKED',
        entityType: 'Recipe',
        entityId: recipeId,
        details: {
            machineId,
            recipeName: recipe.name,
            maxCupsPossible: result.maxCupsPossible,
            isOutOfStock: result.isOutOfStock,
            limitingIngredient: limitingIngredient
        },
        timestamp: new Date()
    });

    return result;
};

// Get forecast for all recipes in a machine
export const getMachineForecast = async (machineId: string) => {
    // Validate machine exists and is coffee type
    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        throw new Error("Machine not found");
    }

    if (machine.type !== 'coffee' && machine.type !== 'combo') {
        throw new Error("Machine must be coffee or combo type");
    }

    // Get all active recipes for this machine
    const recipes = await Recipe.find({ machineId, isActive: true });
    
    if (!recipes || recipes.length === 0) {
        return {
            machineId,
            machineName: machine.name,
            recipes: [],
            summary: {
                totalRecipes: 0,
                availableRecipes: 0,
                outOfStockRecipes: 0
            }
        };
    }

    // Calculate availability for each recipe
    const recipeForecasts = [];
    let availableRecipes = 0;
    let outOfStockRecipes = 0;

    for (const recipe of recipes) {
        try {
            const forecast = await calculateCoffeeAvailability(machineId, (recipe._id as any).toString());
            recipeForecasts.push(forecast);
            
            if (forecast.isOutOfStock) {
                outOfStockRecipes++;
            } else {
                availableRecipes++;
            }
        } catch (error: any) {
            // If individual recipe calculation fails, add error info
            recipeForecasts.push({
                machineId,
                machineName: machine.name,
                recipeId: (recipe._id as any),
                recipeName: recipe.name,
                recipePrice: recipe.price,
                maxCupsPossible: 0,
                isOutOfStock: true,
                error: error.message,
                ingredientAvailability: [],
                calculation: {
                    totalCanisters: 0,
                    requiredIngredients: recipe.ingredients.length,
                    availableIngredients: 0
                }
            });
            outOfStockRecipes++;
        }
    }

    return {
        machineId,
        machineName: machine.name,
        recipes: recipeForecasts,
        summary: {
            totalRecipes: recipes.length,
            availableRecipes,
            outOfStockRecipes
        }
    };
};

// Get low stock warnings for a machine
export const getLowStockWarnings = async (machineId: string, thresholdPercentage: number = 20) => {
    // Validate machine exists
    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        throw new Error("Machine not found");
    }

    // Get all canisters for this machine
    const canisters = await Canister.find({ machineId }).populate('ingredientId');
    
    if (!canisters || canisters.length === 0) {
        return {
            machineId,
            machineName: machine.name,
            warnings: [],
            summary: {
                totalCanisters: 0,
                lowStockCanisters: 0,
                criticalStockCanisters: 0
            }
        };
    }

    const warnings = [];
    let lowStockCount = 0;
    let criticalStockCount = 0;

    for (const canister of canisters) {
        const stockPercentage = (canister.currentLevel / canister.capacity) * 100;
        
        if (stockPercentage <= thresholdPercentage) {
            const warning = {
                canisterId: canister._id,
                canisterName: canister.name,
                currentLevel: canister.currentLevel,
                capacity: canister.capacity,
                stockPercentage: Math.round(stockPercentage * 100) / 100,
                status: stockPercentage <= 5 ? 'CRITICAL' : 'LOW',
                ingredients: canister.ingredientId
            };
            
            warnings.push(warning);
            
            if (warning.status === 'CRITICAL') {
                criticalStockCount++;
            } else {
                lowStockCount++;
            }
        }
    }

    return {
        machineId,
        machineName: machine.name,
        warnings,
        summary: {
            totalCanisters: canisters.length,
            lowStockCanisters: lowStockCount,
            criticalStockCanisters: criticalStockCount
        }
    };
};


// Get forecast summary for all machines
export const getAllMachinesForecast = async () => {
    // Get all coffee and combo machines
    const machines = await VendingMachine.find({ 
        type: { $in: ['coffee', 'combo'] } 
    });

    const machineForecasts = [];
    let totalAvailableRecipes = 0;
    let totalOutOfStockRecipes = 0;

    for (const machine of machines) {
        try {
            const forecast = await getMachineForecast((machine._id as any).toString());
            machineForecasts.push(forecast);
            totalAvailableRecipes += forecast.summary.availableRecipes;
            totalOutOfStockRecipes += forecast.summary.outOfStockRecipes;
        } catch (error: any) {
            machineForecasts.push({
                machineId: (machine._id as any),
                machineName: machine.name,
                error: error.message,
                recipes: [],
                summary: {
                    totalRecipes: 0,
                    availableRecipes: 0,
                    outOfStockRecipes: 0
                }
            });
        }
    }

    return {
        machines: machineForecasts,
        globalSummary: {
            totalMachines: machines.length,
            totalAvailableRecipes,
            totalOutOfStockRecipes,
            overallAvailability: totalAvailableRecipes / (totalAvailableRecipes + totalOutOfStockRecipes) * 100
        }
    };
};

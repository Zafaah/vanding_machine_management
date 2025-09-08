import * as forecast from '../../services/forecastService';

// Mock models used by forecast service
jest.mock('../../models/vendingMModel', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    find: jest.fn()
  }
}));

jest.mock('../../models/conisters', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

jest.mock('../../models/recipe', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    find: jest.fn()
  }
}));

jest.mock('../../models/ingredient', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/auditLOg', () => ({
  __esModule: true,
  default: {
    create: jest.fn()
  }
}));

const VendingMachine = require('../../models/vendingMModel').default;
const Canister = require('../../models/conisters').default;
const Recipe = require('../../models/recipe').default;
const Ingredients = require('../../models/ingredient').default;
const AuditLog = require('../../models/auditLOg').default;

describe('forecastService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateCoffeeAvailability', () => {
    it('computes cups possible and logs audit', async () => {
      const machineId = 'm1';
      const recipeId = 'r1';

      (VendingMachine.findById as jest.Mock).mockResolvedValue({ _id: machineId, name: 'VM 1', type: 'coffee' });

      const recipe = {
        _id: recipeId,
        name: 'Espresso',
        price: 3,
        isActive: true,
        ingredients: [
          { ingredientId: 'ing1', quantity: 10, unit: 'g' },
          { ingredientId: 'ing2', quantity: 100, unit: 'ml' }
        ]
      };
      (Recipe.findById as jest.Mock).mockResolvedValue(recipe);

      const canisters = [
        { _id: 'c1', name: 'Beans', machineId, capacity: 1000, currentLevel: 250, ingredientId: [{ _id: 'ing1', name: 'Beans' }] },
        { _id: 'c2', name: 'Water', machineId, capacity: 2000, currentLevel: 500, ingredientId: { _id: 'ing2', name: 'Water' } }
      ];

      (Canister.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(canisters) });

      (Ingredients.find as jest.Mock).mockResolvedValue([
        { _id: 'ing1', name: 'Beans' },
        { _id: 'ing2', name: 'Water' }
      ]);

      const result = await forecast.calculateCoffeeAvailability(machineId, recipeId);

      expect(result.isOutOfStock).toBe(false);
      // cups limited by water: 500/100 = 5 cups; beans: 250/10 = 25
      expect(result.maxCupsPossible).toBe(5);
      expect(result.ingredientAvailability).toHaveLength(2);
      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'COFFEE_AVAILABILITY_CHECKED' }));
    });

    it('handles missing canister ingredient as out of stock', async () => {
      (VendingMachine.findById as jest.Mock).mockResolvedValue({ _id: 'm1', name: 'VM 1', type: 'coffee' });
      (Recipe.findById as jest.Mock).mockResolvedValue({
        _id: 'r1', name: 'Latte', price: 4, isActive: true,
        ingredients: [{ ingredientId: 'ingX', quantity: 5, unit: 'g' }]
      });

      (Canister.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });
      (Ingredients.find as jest.Mock).mockResolvedValue([]);

      await expect(forecast.calculateCoffeeAvailability('m1', 'r1')).rejects.toThrow('No canisters found for this machine');
    });
  });

  describe('getMachineForecast', () => {
    it('returns forecasts for active recipes', async () => {
      const machineId = 'm2';
      (VendingMachine.findById as jest.Mock).mockResolvedValue({ _id: machineId, name: 'VM 2', type: 'coffee' });
      (Recipe.find as jest.Mock).mockResolvedValue([
        { _id: 'r1', name: 'Espresso', price: 3, isActive: true, ingredients: [] },
        { _id: 'r2', name: 'Americano', price: 3, isActive: true, ingredients: [] }
      ]);

      const spy = jest.spyOn(forecast, 'calculateCoffeeAvailability');
      spy.mockResolvedValueOnce({ isOutOfStock: false, summary: {}, ingredientAvailability: [], maxCupsPossible: 1, machineId, machineName: 'VM 2', recipeId: 'r1', recipeName: 'Espresso', recipePrice: 3, calculation: { totalCanisters: 0, requiredIngredients: 0, availableIngredients: 0 } } as any);
      spy.mockResolvedValueOnce({ isOutOfStock: true, summary: {}, ingredientAvailability: [], maxCupsPossible: 0, machineId, machineName: 'VM 2', recipeId: 'r2', recipeName: 'Americano', recipePrice: 3, calculation: { totalCanisters: 0, requiredIngredients: 0, availableIngredients: 0 } } as any);

      const result = await forecast.getMachineForecast(machineId);

      expect(result.summary.totalRecipes).toBe(2);
      expect(result.summary.availableRecipes).toBe(1);
      expect(result.summary.outOfStockRecipes).toBe(1);
    });
  });

  describe('getLowStockWarnings', () => {
    it('flags low and critical stock canisters', async () => {
      const machineId = 'm3';
      (VendingMachine.findById as jest.Mock).mockResolvedValue({ _id: machineId, name: 'VM 3', type: 'coffee' });

      const canisters = [
        { _id: 'c1', name: 'Beans', capacity: 1000, currentLevel: 40, ingredientId: [] }, // 4% critical
        { _id: 'c2', name: 'Milk', capacity: 1000, currentLevel: 150, ingredientId: [] }, // 15% low
        { _id: 'c3', name: 'Water', capacity: 1000, currentLevel: 800, ingredientId: [] }  // 80% ok
      ];
      (Canister.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(canisters) });

      const res = await forecast.getLowStockWarnings(machineId, 20);
      expect(res.summary.totalCanisters).toBe(3);
      expect(res.summary.criticalStockCanisters).toBe(1);
      expect(res.summary.lowStockCanisters).toBe(1);
      expect(res.warnings).toHaveLength(2);
    });
  });

  describe('getAllMachinesForecast', () => {
    it('aggregates machine forecasts and computes overall availability', async () => {
      (require('../../models/vendingMModel').default.find as jest.Mock).mockResolvedValue([
        { _id: 'm1', name: 'A', type: 'coffee' },
        { _id: 'm2', name: 'B', type: 'coffee' }
      ]);

      jest.spyOn(forecast, 'getMachineForecast').mockResolvedValueOnce({ summary: { availableRecipes: 3, outOfStockRecipes: 1 } } as any)
        .mockResolvedValueOnce({ summary: { availableRecipes: 1, outOfStockRecipes: 3 } } as any);

      const res = await forecast.getAllMachinesForecast();
      expect(res.globalSummary.totalMachines).toBe(2);
      expect(res.globalSummary.totalAvailableRecipes).toBe(4);
      expect(res.globalSummary.totalOutOfStockRecipes).toBe(4);
      expect(res.globalSummary.overallAvailability).toBe(50);
    });
  });
});


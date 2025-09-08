import mongoose from 'mongoose';
import * as forecastService from '../../src/services/forecastService';

// Models to mock
import VendingMachine from '../../src/models/vendingMModel';
import Canister from '../../src/models/conisters';
import Recipe from '../../src/models/recipe';
import Ingredients from '../../src/models/ingredient';
import AuditLog from '../../src/models/auditLOg';

jest.mock('../../src/models/vendingMModel');
jest.mock('../../src/models/conisters');
jest.mock('../../src/models/recipe');
jest.mock('../../src/models/ingredient');
jest.mock('../../src/models/auditLOg');

const objectId = () => new mongoose.Types.ObjectId().toString();

describe('forecastService.calculateCoffeeAvailability', () => {
  const machineId = objectId();
  const recipeId = objectId();

  beforeEach(() => {
    jest.resetAllMocks();
    (AuditLog.create as any) = jest.fn().mockResolvedValue({});
  });

  it('throws when machine not found', async () => {
    (VendingMachine.findById as any).mockResolvedValue(null);
    await expect(forecastService.calculateCoffeeAvailability(machineId, recipeId)).rejects.toThrow('Machine not found');
  });

  it('throws when machine type is invalid', async () => {
    (VendingMachine.findById as any).mockResolvedValue({ _id: machineId, name: 'M1', type: 'slot' });
    await expect(forecastService.calculateCoffeeAvailability(machineId, recipeId)).rejects.toThrow('Machine must be coffee or combo type');
  });

  it('throws when recipe not found', async () => {
    (VendingMachine.findById as any).mockResolvedValue({ _id: machineId, name: 'M1', type: 'coffee' });
    (Recipe.findById as any).mockResolvedValue(null);
    await expect(forecastService.calculateCoffeeAvailability(machineId, recipeId)).rejects.toThrow('Recipe not found');
  });

  it('marks NOT_AVAILABLE when an ingredient has no matching canister', async () => {
    (VendingMachine.findById as any).mockResolvedValue({ _id: machineId, name: 'M1', type: 'coffee' });
    const requiredIngId = objectId();
    const otherIngId = objectId();
    (Recipe.findById as any).mockResolvedValue({ _id: recipeId, name: 'Espresso', price: 100, isActive: true, ingredients: [{ ingredientId: requiredIngId, quantity: 10, unit: 'GRAM' }] });

    // Return a non-empty canister list, but none mapped to requiredIngId
    const someCanister = { _id: objectId(), name: 'C1', capacity: 500, currentLevel: 200, ingredientId: [{ _id: otherIngId }] };
    (Canister.find as any).mockReturnValue({ populate: jest.fn().mockResolvedValue([someCanister]) });

    (Ingredients.find as any).mockResolvedValue([
      { _id: requiredIngId, name: 'Coffee' },
      { _id: otherIngId, name: 'Sugar' },
    ]);

    const result = await forecastService.calculateCoffeeAvailability(machineId, recipeId);
    expect(result.isOutOfStock).toBe(true);
    expect(result.maxCupsPossible).toBe(0);
    expect(result.ingredientAvailability[0].status).toBe('NOT_AVAILABLE');
    expect((AuditLog.create as any)).toHaveBeenCalled();
  });

  it('computes cupsPossible based on limiting ingredient', async () => {
    (VendingMachine.findById as any).mockResolvedValue({ _id: machineId, name: 'M1', type: 'coffee' });
    const ingA = objectId();
    const ingB = objectId();

    (Recipe.findById as any).mockResolvedValue({
      _id: recipeId,
      name: 'Latte',
      price: 150,
      isActive: true,
      ingredients: [
        { ingredientId: ingA, quantity: 30, unit: 'GRAM' },
        { ingredientId: ingB, quantity: 100, unit: 'ML' },
      ],
    });

    const canisterA = { _id: objectId(), name: 'A', capacity: 1000, currentLevel: 120 };
    const canisterB = { _id: objectId(), name: 'B', capacity: 2000, currentLevel: 450 };

    (Canister.find as any).mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        { ...canisterA, ingredientId: [{ _id: ingA }] },
        { ...canisterB, ingredientId: [{ _id: ingB }] },
      ]),
    });

    (Ingredients.find as any).mockResolvedValue([
      { _id: ingA, name: 'Coffee' },
      { _id: ingB, name: 'Milk' },
    ]);

    const result = await forecastService.calculateCoffeeAvailability(machineId, recipeId);
    // cupsPossible for A: floor(120 / 30) = 4
    // cupsPossible for B: floor(450 / 100) = 4
    expect(result.maxCupsPossible).toBe(4);
    expect(result.isOutOfStock).toBe(false);
    expect(result.ingredientAvailability).toHaveLength(2);
    expect((AuditLog.create as any)).toHaveBeenCalled();
  });
});

describe('forecastService.getMachineForecast', () => {
  const machineId = objectId();

  beforeEach(() => {
    jest.resetAllMocks();
    (AuditLog.create as any) = jest.fn().mockResolvedValue({});
  });

  it('returns empty for no recipes', async () => {
    (VendingMachine.findById as any).mockResolvedValue({ _id: machineId, name: 'M1', type: 'coffee' });
    (Recipe.find as any).mockResolvedValue([]);
    const result = await forecastService.getMachineForecast(machineId);
    expect(result.summary.totalRecipes).toBe(0);
    expect(result.recipes).toEqual([]);
  });

  it('aggregates availability across recipes', async () => {
    (VendingMachine.findById as any).mockResolvedValue({ _id: machineId, name: 'M1', type: 'coffee' });
    const recipeA = { _id: objectId(), name: 'Americano', price: 100, isActive: true, ingredients: [] };
    const recipeB = { _id: objectId(), name: 'Mocha', price: 200, isActive: true, ingredients: [] };
    (Recipe.find as any).mockResolvedValue([recipeA, recipeB]);

    const spy = jest.spyOn(forecastService, 'calculateCoffeeAvailability');
    const availLike = (overrides: Partial<any>) => ({
      machineId,
      machineName: 'M1',
      recipeId: overrides.recipeId || objectId(),
      recipeName: 'X',
      recipePrice: 1,
      maxCupsPossible: overrides.maxCupsPossible ?? 0,
      isOutOfStock: overrides.isOutOfStock ?? false,
      limitingIngredient: null,
      ingredientAvailability: [],
      calculation: { totalCanisters: 0, requiredIngredients: 0, availableIngredients: 0 },
    });

    spy
      .mockResolvedValueOnce(availLike({ isOutOfStock: false, maxCupsPossible: 1 }) as any)
      .mockResolvedValueOnce(availLike({ isOutOfStock: true, maxCupsPossible: 0 }) as any);

    const result = await forecastService.getMachineForecast(machineId);
    expect(result.summary.totalRecipes).toBe(2);
    expect(result.summary.availableRecipes).toBe(1);
    expect(result.summary.outOfStockRecipes).toBe(1);
  });
});

describe('forecastService.getLowStockWarnings', () => {
  const machineId = objectId();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns empty when no canisters', async () => {
    (VendingMachine.findById as any).mockResolvedValue({ _id: machineId, name: 'M1' });
    (Canister.find as any).mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });
    const result = await forecastService.getLowStockWarnings(machineId, 20);
    expect(result.summary.totalCanisters).toBe(0);
    expect(result.warnings).toEqual([]);
  });

  it('categorizes LOW vs CRITICAL based on percentage', async () => {
    (VendingMachine.findById as any).mockResolvedValue({ _id: machineId, name: 'M1' });
    const low = { _id: objectId(), name: 'A', capacity: 1000, currentLevel: 150, ingredientId: [] }; // 15%
    const critical = { _id: objectId(), name: 'B', capacity: 1000, currentLevel: 20, ingredientId: [] }; // 2%
    (Canister.find as any).mockReturnValue({ populate: jest.fn().mockResolvedValue([low, critical]) });

    const result = await forecastService.getLowStockWarnings(machineId, 20);
    expect(result.summary.lowStockCanisters).toBe(1);
    expect(result.summary.criticalStockCanisters).toBe(1);
    expect(result.warnings.map((w: any) => w.status).sort()).toEqual(['CRITICAL', 'LOW']);
  });
});

describe('forecastService.getAllMachinesForecast', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('aggregates across machines and computes overall availability', async () => {
    const m1 = { _id: objectId(), name: 'M1', type: 'coffee' };
    const m2 = { _id: objectId(), name: 'M2', type: 'combo' };
    (VendingMachine.find as any).mockResolvedValue([m1, m2]);

    jest.spyOn(forecastService, 'getMachineForecast')
      .mockResolvedValueOnce({ summary: { totalRecipes: 0, availableRecipes: 2, outOfStockRecipes: 1 } } as any)
      .mockResolvedValueOnce({ summary: { totalRecipes: 0, availableRecipes: 1, outOfStockRecipes: 1 } } as any);

    const result = await forecastService.getAllMachinesForecast();
    expect(result.globalSummary.totalMachines).toBe(2);
    expect(result.globalSummary.totalAvailableRecipes).toBe(3);
    expect(result.globalSummary.totalOutOfStockRecipes).toBe(2);
    expect(result.globalSummary.overallAvailability).toBeCloseTo(60, 1);
  });
});


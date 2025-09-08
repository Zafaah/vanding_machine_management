import * as sales from '../../services/salesService';

jest.mock('mongoose', () => ({
  __esModule: true,
  default: { startSession: jest.fn().mockResolvedValue({ withTransaction: (fn: any) => fn(), endSession: jest.fn() }) }
}));

jest.mock('../../models/vendingMModel', () => ({
  __esModule: true,
  default: { findById: jest.fn() }
}));

jest.mock('../../models/skuProduct', () => ({
  __esModule: true,
  default: { findById: jest.fn() }
}));

jest.mock('../../models/slotInventory', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findOneAndUpdate: jest.fn() }
}));

jest.mock('../../models/sales', () => ({
  __esModule: true,
  default: { create: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), findByIdAndUpdate: jest.fn(), findOne: jest.fn(), aggregate: jest.fn() }
}));

jest.mock('../../models/conisters', () => ({
  __esModule: true,
  default: { find: jest.fn(), findOneAndUpdate: jest.fn() }
}));

jest.mock('../../models/recipe', () => ({
  __esModule: true,
  default: { findById: jest.fn() }
}));

jest.mock('../../models/auditLOg', () => ({
  __esModule: true,
  default: { create: jest.fn() }
}));

jest.mock('../../models/ingredient', () => ({
  __esModule: true,
  default: { find: jest.fn() }
}));

const VendingMachine = require('../../models/vendingMModel').default;
const SKUProduct = require('../../models/skuProduct').default;
const SlotInventory = require('../../models/slotInventory').default;
const Sales = require('../../models/sales').default;
const Canister = require('../../models/conisters').default;
const Recipe = require('../../models/recipe').default;

const chainableResolved = (value: any) => ({ session: jest.fn().mockResolvedValue(value) });

describe('salesService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('checkInventoryAvailability', () => {
    it('returns availability and totals', async () => {
      const machineId = 'm1';
      const items = [{ slotId: 's1', skuId: 'sku1', quantity: 2, trayId: 't1' }];

      (require('../../models/skuProduct').default.findById as jest.Mock).mockResolvedValue({ _id: 'sku1', name: 'Chips', price: 10 });
      (require('../../models/slotInventory').default.findOne as jest.Mock).mockResolvedValue({ quantityOnHand: 5 });

      const res = await sales.checkInventoryAvailability(machineId, items);
      expect(res.allItemsAvailable).toBe(true);
      expect(res.totalAmount).toBe(20);
      expect(res.items[0].status).toBe('AVAILABLE');
    });
  });

  describe('processSKUSale', () => {
    it('processes sale and decrements inventory atomically', async () => {
      (VendingMachine.findById as jest.Mock).mockResolvedValue({ _id: 'm1' });
      (SKUProduct.findById as jest.Mock).mockReturnValue(chainableResolved({ _id: 'sku1', name: 'Chips', price: 7 }));
      (SlotInventory.findOne as jest.Mock).mockReturnValue(chainableResolved({ quantityOnHand: 10 }));
      (SlotInventory.findOneAndUpdate as jest.Mock).mockResolvedValue({ quantityOnHand: 3 });
      (Sales.create as jest.Mock).mockResolvedValue([{ _id: 'sale1' }]);

      const res = await sales.processSKUSale('m1', [{ slotId: 's1', skuId: 'sku1', quantity: 7, trayId: 't1' }]);
      expect(res).toHaveProperty('transactionId');
      expect(SlotInventory.findOneAndUpdate).toHaveBeenCalledWith(
        { machineId: 'm1', trayId: 't1', slotId: 's1', skuId: 'sku1', quantityOnHand: { $gte: 7 } },
        { $inc: { quantityOnHand: -7 } },
        expect.objectContaining({ new: true })
      );
    });
  });

  describe('processCoffeeSale', () => {
    it('consumes canister levels per recipe and creates sale', async () => {
      (VendingMachine.findById as jest.Mock).mockResolvedValue({ _id: 'm1' });
      (Recipe.findById as jest.Mock).mockReturnValue(chainableResolved({
        _id: 'r1', price: 5, isActive: true,
        ingredients: [ { ingredientId: 'ing1', quantity: 10, unit: 'g' } ]
      }));
      (Canister.find as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue([
        { _id: 'c1', name: 'Beans', currentLevel: 50, ingredientId: [{ _id: 'ing1' }] }
      ]) });
      (Canister.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'c1', currentLevel: 40 });
      (Sales.create as jest.Mock).mockResolvedValue([{ _id: 'sale1' }]);

      const res = await sales.processCoffeeSale('m1', 'r1');
      expect(res).toHaveProperty('transactionId');
      expect(Canister.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'c1', currentLevel: { $gte: 10 } },
        { $inc: { currentLevel: -10 } },
        expect.objectContaining({ new: true })
      );
    });
  });
});


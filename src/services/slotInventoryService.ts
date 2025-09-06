import SlotInventory from "../models/slotInventory";
import VendingMachine from "../models/vendingMModel";
import Trays from "../models/trays";
import Slots from "../models/slots";
import SKUProduct from "../models/skuProduct";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";

// Set Slot Inventory
export const setSlotInventory = async (data: any) => {
    const { machineId, trayId, slotId, skuId, quantityOnHand } = data;

    if (!machineId || !trayId || !slotId || !skuId) {
        throw new Error("machineId, trayId, slotId, skuId are required");
    }

    if (quantityOnHand !== undefined && (isNaN(quantityOnHand) || quantityOnHand < 0)) {
        throw new Error("quantityOnHand must be a non-negative number");
    }

    // Validate references exist and are related
    const [machine, tray, slot, sku] = await Promise.all([
        VendingMachine.findById(machineId),
        Trays.findById(trayId),
        Slots.findById(slotId),
        SKUProduct.findById(skuId),
    ]);

    if (!machine) throw new Error("Machine not found");
    if (!tray || String(tray.machineId) !== String(machineId)) throw new Error("Tray not found or not in machine");
    if (!slot || !tray.slot.map(String).includes(String(slotId))) throw new Error("Slot not found or not in tray");
    if (!sku) throw new Error("SKU not found");

    const inventory = await SlotInventory.findOneAndUpdate(
        { machineId, trayId, slotId, skuId },
        { $set: { quantityOnHand: quantityOnHand ?? 0 } },
        { upsert: true, new: true, runValidators: true }
    ).populate([
        { path: 'machineId', select: 'name type status location' },
        { path: 'trayId', select: 'name' },
        { path: 'slotId', select: 'quantityOnhand' },
        { path: 'skuId', select: 'productId name description price' }
    ]);

    // Log the inventory update
    await AuditLog.create({
        action: AuditAction.INVENTORY_UPDATED,
        machineId,
        trayId,
        slotId,
        skuId,
        quantityOnHand: quantityOnHand ?? 0,
        userId: 'system'
    });

    return inventory;
};

// Get Slot Inventory
export const getSlotInventory = async (query: any) => {
    const { machineId, trayId, slotId, skuId } = query;

    const filter: any = {};
    if (machineId) filter.machineId = machineId;
    if (trayId) filter.trayId = trayId;
    if (slotId) filter.slotId = slotId;
    if (skuId) filter.skuId = skuId;

    const items = await SlotInventory.find(filter).populate([
        { path: 'machineId', select: 'name type status location' },
        { path: 'trayId', select: 'name' },
        { path: 'slotId', select: 'quantityOnhand' },
        { path: 'skuId', select: 'productId name description price' }
    ]);

    return items;
};

// Sell From Slot
export const sellFromSlot = async (data: any) => {
    const { machineId, trayId, slotId, skuId, quantity = 1 } = data;

    if (!machineId || !trayId || !slotId || !skuId) {
        throw new Error("machineId, trayId, slotId, skuId are required");
    }

    const quantityNum = Number(quantity);
    if (!quantityNum || quantityNum <= 0) {
        throw new Error("quantity must be a positive integer");
    }

    // Atomic decrement with availability check
    const updated = await SlotInventory.findOneAndUpdate(
        { machineId, trayId, slotId, skuId, quantityOnHand: { $gte: quantityNum } },
        { $inc: { quantityOnHand: -quantityNum } },
        { new: true }
    );

    if (!updated) {
        throw new Error("Insufficient stock or inventory not found");
    }

    await AuditLog.create({
        action: AuditAction.SKU_SOLD,
        machineId,
        skuId,
        quantity: quantityNum,
        unit: 'unit',
        previousValue: updated.quantityOnHand + quantityNum,
        newValue: updated.quantityOnHand,
        userId: 'system'
    });

    return updated;
};

// Get Inventory by Machine
export const getInventoryByMachine = async (machineId: string) => {
    const items = await SlotInventory.find({ machineId }).populate([
        { path: 'machineId', select: 'name type status location' },
        { path: 'trayId', select: 'name' },
        { path: 'slotId', select: 'slotNumber' },
        { path: 'skuId', select: 'productId name description price' }
    ]);

    return items;
};

// Get Low Stock Items
export const getLowStockItems = async (threshold: number = 5) => {
    const items = await SlotInventory.find({ 
        quantityOnHand: { $lte: threshold } 
    }).populate([
        { path: 'machineId', select: 'name type status location' },
        { path: 'trayId', select: 'name' },
        { path: 'slotId', select: 'slotNumber' },
        { path: 'skuId', select: 'productId name description price' }
    ]);

    return items;
};

// Update Inventory Quantity
export const updateInventoryQuantity = async (inventoryId: string, quantityOnHand: number) => {
    if (quantityOnHand < 0) {
        throw new Error("quantityOnHand cannot be negative");
    }

    const inventory = await SlotInventory.findByIdAndUpdate(
        inventoryId,
        { quantityOnHand },
        { new: true, runValidators: true }
    ).populate([
        { path: 'machineId', select: 'name type status location' },
        { path: 'trayId', select: 'name' },
        { path: 'slotId', select: 'slotNumber' },
        { path: 'skuId', select: 'productId name description price' }
    ]);

    if (!inventory) {
        throw new Error("Inventory not found");
    }

    // Log the inventory update
    await AuditLog.create({
        action: AuditAction.INVENTORY_UPDATED,
        machineId: inventory.machineId,
        trayId: inventory.trayId,
        slotId: inventory.slotId,
        skuId: inventory.skuId,
        quantityOnHand,
        userId: 'system'
    });

    return inventory;
};

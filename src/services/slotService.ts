import Slots from "../models/slots";
import Trays from "../models/trays";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";

// Create Slot
export const createSlot = async (data: any, req: any) => {
    const { trayId, skuId, slotNumber} = data;
    
    if (!trayId || !skuId || !slotNumber) {
        throw new Error("trayId, skuId are required");
    }

    const existing = await Slots.findOne({ trayId, slotNumber });
    if (existing) {
        throw new Error("Slot with this trayId and slotNumber already exists");
    }

    const slot = await Slots.create({ trayId, skuId, slotNumber });

    await Trays.findByIdAndUpdate(trayId, { $push: { slot: slot._id } });

    await slot.populate("skuId")

    // Log the creation
    await AuditLog.create({
        action: AuditAction.SLOT_CREATED,
        machineId: trayId,
        userId: 'system',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'system',
        meta: { 
            slotId: slot._id, 
            trayId, 
            skuId,
            model: "slots"
        }
    });

    return slot;
};

// Get all Slots with pagination
export const getAllSlots = async (query: any) => {
    const results = await paginateAndSearch(Slots, query, "slotNumber");
    if (results && Array.isArray(results.results)) {
        results.results = await Slots.populate(results.results, [
            {
                path: "skuId"
            }
        ]);
        return results;
    }

    const populated = await Slots.populate(results, [
        { path: "skuId" }
    ]);

    return populated;
};

// Get Slot by ID
export const getSlotById = async (id: string) => {
    const slot = await Slots.findById(id).populate("trayId").populate("skuId");
    if (!slot) {
        throw new Error("Slot not found");
    }
    return slot;
};

// Update Slot
export const updateSlot = async (id: string, data: any) => {
    const { trayId, skuId, slotNumber } = data;

    if (trayId && skuId && slotNumber) {
        const existing = await Slots.findOne({ trayId, skuId, slotNumber, _id: { $ne: id } });
        if (existing) {
            throw new Error("Slot with this trayId and slotNumber already exists");
        }
    }

    const slot = await Slots.findByIdAndUpdate(
        id,
        { trayId, skuId, slotNumber },
        { new: true, runValidators: true }
    ).populate("trayId").populate("skuId");

    if (!slot) {
        throw new Error("Slot not found");
    }
    
    return slot;
};

// Delete Slot
export const deleteSlot = async (id: string) => {
    const slot = await Slots.findByIdAndDelete(id);
    if (!slot) {
        throw new Error("Slot not found");
    }
    return slot;
};

// Search Slots
export const searchSlots = async (searchTerm: string, query: any) => {
    return await paginateAndSearch(Slots, { ...query, search: searchTerm });
};

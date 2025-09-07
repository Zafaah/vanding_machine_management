import Trays from "../models/trays";
import VendingMachine from "../models/vendingMModel";
import AuditLog from "../models/auditLOg";
import { AuditAction } from "../types/types";
import { paginateAndSearch } from "../utils/apiFeatures";

// Create Tray
export const createTray = async (data: any, req: any) => {
    const { name, machineId, slot } = data;

    if (!name || !machineId) {
        throw new Error("Name and Machine ID are required");
    }

    const machine = await VendingMachine.findById(machineId);
    if (!machine) {
        throw new Error("Machine not found");
    }

    if (machine.type === 'coffee') {
        throw new Error("Cannot create trays for coffee machines");
    }

    const existingTray = await Trays.findOne({ name, machineId });
    if (existingTray) {
        throw new Error("Tray with this name already exists for the given machine");
    }

    const tray = await Trays.create({ name, machineId, slot });

    await VendingMachine.findByIdAndUpdate(machineId,
        { $push: { trays: tray._id } });

    await tray.populate('slot');

    // Log the creation
    await AuditLog.create({
        action: AuditAction.MACHINE_CREATED,
        machineId,
        userId: 'system',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'system',
        meta: {
            trayId: tray._id,
            name,
            model: "trays"
        }
    });

    return tray;
};

// Get all Trays with pagination
export const getAllTrays = async (query: any) => {
    const results = await paginateAndSearch(Trays, query, "name");

    if (results && Array.isArray(results.results)) {
        results.results = await Trays.populate(results.results, [
            {
                path: "slot",
                populate: { path: "skuId" }
            }
        ]);
        return results;
    }

    const populated = await Trays.populate(results, [
        { path: "slot" },
    ]);

    return populated;
};

// Get Tray by ID
export const getTrayById = async (id: string) => {
    const tray = await Trays.findOne({ _id: id });
    if (!tray) {
        throw new Error("Tray not found");
    }
    await tray.populate('slot');
    return tray;
};

// Update Tray
export const updateTray = async (id: string, data: any) => {
    const { name, machineId } = data;

    const oldTray = await Trays.findById(id);
    if (!oldTray) {
        throw new Error("Tray not found");
    }

    const oldMachineId = oldTray.machineId?.toString();

    const updatedTray = await Trays.findByIdAndUpdate(
        id,
        { name, machineId },
        { new: true }
    );

    if (!updatedTray) {
        throw new Error("Tray not found");
    }

    if (machineId && oldMachineId !== machineId) {
        // Remove from old machine
        if (oldMachineId) {
            await VendingMachine.findByIdAndUpdate(oldMachineId, {
                $pull: { trays: oldTray._id }
            });
        }
        // Add to new machine
        await VendingMachine.findByIdAndUpdate(machineId, {
            $push: { trays: updatedTray._id }
        });
    }

    await updatedTray.populate('slot');
    return updatedTray;
};

// Delete Tray
export const deleteTray = async (id: string) => {
    const tray = await Trays.findByIdAndDelete(id);
    if (!tray) {
        throw new Error("Tray not found");
    }

    await VendingMachine.findByIdAndUpdate(tray.machineId, {
        $pull: { trays: tray._id }
    });

    await tray.populate('slot');
    return tray;
};

// Search Trays
export const searchTrays = async (searchTerm: string, query: any) => {
    return await paginateAndSearch(Trays, { ...query, search: searchTerm });
};
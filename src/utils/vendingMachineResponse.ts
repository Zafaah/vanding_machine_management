import { IVendingMachine } from "../models/vendingMModel";
export function formatVendingMachine(machine: IVendingMachine) {
    const base = {
        _id: machine._id,
        name: machine.name,
        type: machine.type,
        status: machine.status,
        location: machine.location,
    };

    if (machine.type === "coffee") {
        return {
            ...base,
            canisters: machine.canisters,
            createdAt: machine.createdAt,
            updatedAt: machine.updatedAt,
        };
    }
    if (machine.type === "slot") {
        return {
            ...base,
            trays: machine.trays,
            createdAt: machine.createdAt,
            updatedAt: machine.updatedAt,
        };
    }
    // combo or other types
    return {
        ...base,
        trays: machine.trays,
        canisters: machine.canisters,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
    };
}
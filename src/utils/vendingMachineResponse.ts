import { IVendingMachine } from "../models/vendingMModel";
import { machineType, MachineStatus } from "../types/types";

export interface FormattedVendingMachine {
    _id: string;
    name: string;
    type: machineType;
    status: MachineStatus;
    location: string;
    trays?: any[];       // trays populated object
    canisters?: any[];   // canisters populated object
    createdAt: Date;
    updatedAt: Date;
}

export function formatVendingMachine(machine: IVendingMachine): FormattedVendingMachine {
    const base = {
        _id: machine._id.toString(),
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

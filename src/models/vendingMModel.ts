import mongoose, { Document, Schema } from "mongoose";
import { machineType, MachineStatus } from "../types/types";


export interface IVendingMachine extends Document {
    _id: mongoose.Types.ObjectId;
    updatedAt: any;
    createdAt: any;
    name: string;
    type: machineType;
    status: MachineStatus;
    location: string;
    trays: mongoose.Schema.Types.ObjectId[] 
    canisters: mongoose.Schema.Types.ObjectId[]
}

const VendingMachineSchema = new Schema<IVendingMachine>({
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true,
        lowercase: true
    },
    type: {
        type: String,
        enum: Object.values(machineType),
        required: [true, 'type is required'],
        default: machineType.SLOT
    },
    status: {
        type: String,
        enum: Object.values(MachineStatus),
        required: [true, 'status is required'],
        default: MachineStatus.ACTIVE
    },
    location: {
        type: String,
        required: [true, 'location is required'],
        trim: true,
        lowercase: true,
        unique: true
    },
    trays: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Tray',
        default: undefined,
    },
    canisters: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Canister',
        default: undefined,
    }
}, {
    timestamps: true,
    versionKey: false,
});

VendingMachineSchema.pre('save', function (next) {
    if (this.type === machineType.SLOT && Array.isArray(this.canisters) && this.canisters.length > 0) {
        return next(new Error("Canisters are not allowed for slot machines"));
    }
    if (this.type === machineType.COFFEE && Array.isArray(this.trays) && this.trays.length > 0) {
        return next(new Error("Trays are not allowed for coffee machines"));
    }
    // Combo machines can have both trays and canisters (no validation needed)
    next();
});

VendingMachineSchema.methods.getMachineTypeLabel = function (): string {
    const typeLabels: Record<machineType, string> = {
        [machineType.SLOT]: 'Slot Machine',
        [machineType.COFFEE]: 'Coffee Machine',
        [machineType.COMBO]: 'Combo Machine'
    };
    return typeLabels[this.type as machineType];
};

VendingMachineSchema.methods.isOperational = function (): boolean {
    return this.status === MachineStatus.ACTIVE;
};

VendingMachineSchema.index({ name: 1 }, { unique: true });

const VendingMachine = mongoose.model<IVendingMachine>('VendingMachine', VendingMachineSchema);

export default VendingMachine;
import mongoose, { Document } from "mongoose";
import Ingredient from "./ingredient";

export interface Canister extends Document {
    name: string;
    machineId: mongoose.Schema.Types.ObjectId;
    capacity: number;
    currentLevel: number;
    ingredientId: mongoose.Schema.Types.ObjectId[];
}

const CanisterSchema = new mongoose.Schema<Canister>({
    name: {
        type: String,
        required: [true, 'name is required'],
        lowercase: true,
        trim: true,
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'machineId is required'],
        ref: 'VendingMachine'
    },
    ingredientId: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'Ingredient'
    },
    capacity: {
        type: Number,
        required: [true, 'capacity is required']
    },
    currentLevel: {
        type: Number,
        required: [true, 'currentLevel is required']
    }
}, {
    timestamps: true,
    versionKey: false
});

CanisterSchema.index({ machineId: 1, ingredientId: 1 }, { unique: true });

const Canister = mongoose.model<Canister>('Canister', CanisterSchema);

export default Canister;
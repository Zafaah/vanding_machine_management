import mongoose, { Document } from "mongoose";

export interface Trays extends Document {
    machineId: mongoose.Schema.Types.ObjectId,
    name: String,
    slot: mongoose.Schema.Types.ObjectId[]
}

const TraysSchema = new mongoose.Schema<Trays>({
    name: {
        type: String,
        required: [true, 'name is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'machineId is required'],
        ref: 'VendingMachine'
    },
    slot: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'Slot'
    }
}, {
    timestamps: true,
    versionKey: false
})

const Trays = mongoose.model<Trays>('Tray', TraysSchema)

export default Trays

import mongoose, { Document } from "mongoose";

export interface Slots extends Document {
    slotNumber: string,
    trayId: mongoose.Schema.Types.ObjectId,
    skuId: mongoose.Schema.Types.ObjectId[],
}

const SlotsSchema = new mongoose.Schema<Slots>({
    slotNumber: {
        type: String,
        required: [true, 'slotNumber is required'],
        unique: true
    },
    trayId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'trayId is required'],
        ref: 'Tray'
    },  
    skuId: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'SKUProducts'
    },
}, {
    timestamps: true,
    versionKey: false
})

SlotsSchema.index({ trayId: 1, skuId: 1 }, { unique: false });

const Slots = mongoose.model<Slots>('Slot', SlotsSchema)

export default Slots

    
import mongoose, { Document } from "mongoose";

export interface Slots extends Document {
    trayId: mongoose.Schema.Types.ObjectId,
    quantityOnhand: number,
    skuId: mongoose.Schema.Types.ObjectId[],
}

const SlotsSchema = new mongoose.Schema<Slots>({
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
    quantityOnhand: {
        type: Number,
        required: [true, 'quantityOnhand is required']
    }
}, {
    timestamps: true,
    versionKey: false
})

SlotsSchema.index({ trayId: 1, skuId: 1 }, { unique: false });

const Slots = mongoose.model<Slots>('Slot', SlotsSchema)

export default Slots

    
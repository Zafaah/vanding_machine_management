import mongoose, { Document } from "mongoose";

export interface SlotInventory extends Document {
    machineId: mongoose.Schema.Types.ObjectId;
    trayId: mongoose.Schema.Types.ObjectId;
    slotId: mongoose.Schema.Types.ObjectId;
    skuId: mongoose.Schema.Types.ObjectId;
    quantityOnHand: number;
}

const SlotInventorySchema = new mongoose.Schema<SlotInventory>({
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendingMachine',
        required: [true, 'machineId is required']
    },
    trayId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tray',
        required: [true, 'trayId is required']
    },
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: [true, 'slotId is required']
    },
    skuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SKUProducts',
        required: [true, 'skuId is required']
    },
    quantityOnHand: {
        type: Number,
        required: [true, 'quantityOnHand is required'],
        min: [0, 'quantityOnHand cannot be negative'],
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

// Unique per machine + tray + slot + sku
SlotInventorySchema.index({ machineId: 1, trayId: 1, slotId: 1, skuId: 1 }, { unique: true });

const SlotInventory = mongoose.model<SlotInventory>('SlotInventory', SlotInventorySchema);

export default SlotInventory;



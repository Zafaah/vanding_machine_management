import mongoose, { Document } from "mongoose";

export interface Alert extends Document {
	machineId: mongoose.Schema.Types.ObjectId;
	trayId?: mongoose.Schema.Types.ObjectId;
	slotId?: mongoose.Schema.Types.ObjectId;
	skuId?: mongoose.Schema.Types.ObjectId;
	entityType: "SLOT_INVENTORY" | "CANISTER" | "RECIPE";
	severity: "LOW" | "CRITICAL";
	message: string;
	resolved: boolean;
	meta?: Record<string, any>;
}

const AlertSchema = new mongoose.Schema<Alert>({
	machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendingMachine', required: true },
	trayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tray' },
	slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
	skuId: { type: mongoose.Schema.Types.ObjectId, ref: 'SKUProducts' },
	entityType: { type: String, enum: ["SLOT_INVENTORY", "CANISTER", "RECIPE"], required: true },
	severity: { type: String, enum: ["LOW", "CRITICAL"], required: true },
	message: { type: String, required: true },
	resolved: { type: Boolean, default: false },
	meta: { type: Object },
}, {
	timestamps: true,
	versionKey: false
});

AlertSchema.index({ machineId: 1, trayId: 1, slotId: 1, skuId: 1, entityType: 1, resolved: 1 });

const Alert = mongoose.model<Alert>('Alert', AlertSchema);

export default Alert;


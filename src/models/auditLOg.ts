import mongoose, { Document } from "mongoose";
import { AuditAction } from "../types/types";

export interface AuditLog extends Document {
  action: AuditAction;
  machineId?: mongoose.Schema.Types.ObjectId;
  skuId?: mongoose.Schema.Types.ObjectId;
  ingredientId?: mongoose.Schema.Types.ObjectId;
  recipeId?: mongoose.Schema.Types.ObjectId;
  canisterId?: mongoose.Schema.Types.ObjectId;
  quantity?: number;
  unit?: string;
  previousValue?: any;
  newValue?: any;
  userId: string;
  ipAddress: string;
  userAgent: string;
  meta?: any;
}

const AuditLogSchema = new mongoose.Schema<AuditLog>({
  action: {
    type: String,
    enum: Object.values(AuditAction),
    required: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendingMachine',
    required: function (this: AuditLog) {
      return [AuditAction.MACHINE_CREATED, AuditAction.SKU_SOLD, AuditAction.CANISTER_REFILLED].includes(this.action);
    }
  },
  skuId: { type: mongoose.Schema.Types.ObjectId, ref: 'SKUProduct' },
  ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  canisterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canister' },
  quantity: { type: Number },
  unit: { type: String },
  previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  userId: { type: String, required: true, default: 'system' },
  ipAddress: { type: String, required: true, default: '127.0.0.1' },
  userAgent: { type: String, required: true, default: 'system' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
AuditLogSchema.index({ machineId: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

// Helper for pre-save validation
function assertFields(fields: string[], actionName: string, doc: AuditLog, next: Function) {
  for (const field of fields) {
    if (!doc[field as keyof AuditLog]) {
      return next(new Error(`${field} is required for ${actionName}`));
    }
  }
  next();
}

AuditLogSchema.pre('save', function (next) {
  switch (this.action) {
    case AuditAction.SKU_SOLD:
      return assertFields(['skuId', 'quantity', 'unit', 'machineId'], 'SKU_SOLD', this, next);
    case AuditAction.CANISTER_REFILLED:
      return assertFields(['canisterId', 'quantity', 'unit', 'machineId'], 'CANISTER_REFILLED', this, next);
    case AuditAction.INGREDIENT_CONSUMED:
      return assertFields(['ingredientId', 'quantity', 'unit'], 'INGREDIENT_CONSUMED', this, next);
    case AuditAction.MACHINE_CREATED:
      return assertFields(['machineId'], 'MACHINE_CREATED', this, next);
    case AuditAction.RECIPE_OUT_OF_STOCK:
      return assertFields(['recipeId'], 'RECIPE_OUT_OF_STOCK', this, next);
    default:
      next();
  }
});

export default mongoose.model<AuditLog>('AuditLog', AuditLogSchema);

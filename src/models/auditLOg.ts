import mongoose from "mongoose";
import { AuditAction, Timestamped, EntityRelations } from "../types/types";

export interface AuditLog extends Timestamped, EntityRelations {
    action: AuditAction;
    machineId: mongoose.Schema.Types.ObjectId;
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
        required: true
    },
    skuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SKUProduct'
    },
    ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient'
    },
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
    },
    canisterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Canister'
    },
    quantity: {
        type: Number
    },
    unit: {
        type: String
    },
    previousValue: {
        type: mongoose.Schema.Types.Mixed
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed
    },
    userId: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

AuditLogSchema.index({ machineId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

AuditLogSchema.pre('save', function(next) {
    switch (this.action) {
      case AuditAction.SKU_SOLD:
        if (!this.skuId || !this.quantity || !this.unit) {
          return next(new Error('skuId, quantity, and unit are required for SKU_SOLD'));
        }
        break;
      case AuditAction.CANISTER_REFILLED:
        if (!this.canisterId || !this.quantity || !this.unit) {
          return next(new Error('canisterId, quantity, and unit are required for CANISTER_REFILLED'));
        }
        break;
      case AuditAction.INGREDIENT_CONSUMED:
        if (!this.ingredientId || !this.quantity || !this.unit) {
          return next(new Error('ingredientId, quantity, and unit are required for INGREDIENT_CONSUMED'));
        }
        break;
      case AuditAction.MACHINE_CREATED:
        if (!this.machineId) {
          return next(new Error('machineId is required for MACHINE_CREATED'));
        }
        break;
      case AuditAction.RECIPE_OUT_OF_STOCK:
        if (!this.recipeId) {
          return next(new Error('recipeId is required for RECIPE_OUT_OF_STOCK'));
        }
        break;
    }
    next();
  });
  


export default mongoose.model<AuditLog>('AuditLog', AuditLogSchema);
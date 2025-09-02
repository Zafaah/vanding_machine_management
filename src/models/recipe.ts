import mongoose, { Document } from "mongoose";
import { RecipeIngredient } from "../types/types";
import { AuditAction } from "../types/types";
import AuditLog from "./auditLOg";

export interface Recipe extends Document {
    name: string;
    ingredients: RecipeIngredient[];
    price: number;
    isAvailable: boolean;
    machineId: mongoose.Schema.Types.ObjectId;
    checkAvailability(): Promise<boolean>;
}

const RecipeSchema = new mongoose.Schema<Recipe>({
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true,
        unique: true
    },
    ingredients: [{
        ingredientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: [true, 'ingredientId is required']
        },
        quantity: {
            type: Number,
            required: [true, 'quantity is required']
        }
    }],
    price: {
        type: Number,
        required: [true, 'price is required']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendingMachine',
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

RecipeSchema.index({ name: 1 }, { unique: true });

RecipeSchema.pre('save', async function(next) {
    // Check if recipe is available based on ingredient stock levels
    const ingredients = await Promise.all(
        this.ingredients.map(async (ingredient) => {
            const stock = await mongoose.model('Ingredient').findById(ingredient.ingredientId);
            return stock?.stockLevel >= ingredient.quantity;
        })
    );

    this.isAvailable = ingredients.every(Boolean);

    // Create audit log for recipe creation/update
    await AuditLog.create({
        action: this.isNew ? AuditAction.MACHINE_CREATED : AuditAction.RECIPE_OUT_OF_STOCK,
        recipeId: this._id,
        machineId: this.machineId,
        userId: 'system',
        ipAddress: '127.0.0.1',
        userAgent: 'System Audit'
    });

    next();
});

RecipeSchema.methods.checkAvailability = async function() {
    const ingredients = await Promise.all(
        this.ingredients.map(async (ingredient:RecipeIngredient) => {
            const stock = await mongoose.model('Ingredient').findById(ingredient.ingredientId);
            return stock?.stockLevel >= ingredient.quantity;
        })
    );

    const isAvailable = ingredients.every(Boolean);
    if (isAvailable !== this.isAvailable) {
        this.isAvailable = isAvailable;
        await this.save();
        
        // Create audit log for availability change
        await AuditLog.create({
            action: isAvailable ? AuditAction.RECIPE_OUT_OF_STOCK : AuditAction.RECIPE_OUT_OF_STOCK,
            recipeId: this._id,
            machineId: this.machineId,
            userId: 'system',
            ipAddress: '127.0.0.1',
            userAgent: 'System Audit'
        });
    }

    return isAvailable;
};

const Recipe = mongoose.model<Recipe>('Recipe', RecipeSchema);
export default Recipe;
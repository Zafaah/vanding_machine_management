import mongoose, { Document } from "mongoose";
import { UnitOfMeasure } from "../types/types";

export interface RecipeIngredient {
    ingredientId: mongoose.Schema.Types.ObjectId;
    quantity: number;
    unit: UnitOfMeasure;
}

export interface Recipe extends Document {
    recipeId: string;
    name: string;
    description?: string;
    price: number;
    ingredients: RecipeIngredient[];
    machineId: mongoose.Schema.Types.ObjectId;
    isActive: boolean;
}

const RecipeIngredientSchema = new mongoose.Schema<RecipeIngredient>({
    ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: [true, 'ingredientId is required']
    },
    quantity: {
        type: Number,
        required: [true, 'quantity is required'],
        min: [0, 'quantity cannot be negative']
    },
    unit: {
        type: String,
        enum: Object.values(UnitOfMeasure),
        required: [true, 'unit is required']
    }
}, { _id: false });

const RecipeSchema = new mongoose.Schema<Recipe>({
    recipeId: {
        type: String,
        required: [true, 'recipeId is required'],
        trim: true
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    price: {
        type: Number,
        required: [true, 'price is required'],
        min: [0, 'price cannot be negative']
    },
    ingredients: [RecipeIngredientSchema],
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendingMachine',
        required: [true, 'machineId is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes
RecipeSchema.index({ recipeId: 1 }, { unique: true });
RecipeSchema.index({ machineId: 1, isActive: 1 });

const Recipe = mongoose.model<Recipe>('Recipe', RecipeSchema);

export default Recipe;
import { UnitOfMeasure } from "../types/types";
import mongoose, { Document, Schema, model } from "mongoose";

export interface Ingredient extends Document {
    ingredientId: string;
    name: string;
    unitOfMeasure: string;
}

const IngredientSchema = new Schema<Ingredient>({   
    ingredientId: {
        type: String,
        required: [true, 'ingredientId is required'],
        trim: true,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true,
        unique: true
    },
    unitOfMeasure: {
        type: String,
        enum: Object.values(UnitOfMeasure),
        required: [true, 'unitOfMeasure is required']
    }
}, { 
    timestamps: true,
    strict: true, // Reject unknown fields
    strictQuery: true // Reject unknown query fields
});

// Create and export the model
const Ingredients = model<Ingredient>('Ingredient', IngredientSchema);
export default Ingredients;
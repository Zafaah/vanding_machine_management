import { UnitOfMeasure } from "../types/types";
import { Document, Schema, model } from "mongoose";

export interface Ingredient extends Document {
    name: string;
    unitOfMeasure: string;
    stockLevel: number;
    threshold: number;
}

const IngredientSchema = new Schema<Ingredient>({
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
    },
    stockLevel: {
        type: Number,
        required: [true, 'stockLevel is required']
    },
    threshold: {
        type: Number,
        required: [true, 'threshold is required']
    }
}, { timestamps: true });

// Create and export the model
const Ingredients = model<Ingredient>('Ingredient', IngredientSchema);
export default Ingredients;
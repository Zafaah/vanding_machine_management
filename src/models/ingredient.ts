import { Timestamped, EntityRelations,UnitOfMeasure } from "../types/types";
import mongoose from "mongoose";
export interface Ingredient extends Timestamped, EntityRelations {
    name:String,
    unitOfMeasure:String,
    stockLevel:Number,
    threshold:Number

};

const IngredientSchema=new mongoose.Schema<Ingredient>({
    name:{
        type:String,
        required:[true,'name is required'],
        trim:true,
        unique:true
    },
    unitOfMeasure:{
        type:String,
        enum: Object.values(UnitOfMeasure),
        required:[true,'unitOfMeasure is required']
    },
    stockLevel:{
        type:Number,
        required:[true,'stockLevel is required']
    },
    threshold:{
        type:Number,
        required:[true,'threshold is required']
    }
},{
    timestamps:true,
    versionKey:false
})

const Ingredient=mongoose.model<Ingredient>('Ingredient',IngredientSchema)

export default Ingredient

    
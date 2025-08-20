import mongoose from "mongoose";
import { Timestamped, EntityRelations } from "../types/types";

export interface Canister extends Timestamped, EntityRelations {
    name:String,
    machineId:mongoose.Schema.Types.ObjectId,
    ingredientId:mongoose.Schema.Types.ObjectId,
    capacity:number,
    currentLevel:number    
};

const CanisterSchema=new mongoose.Schema<Canister>({
    name:{
        type:String,
        required:[true, 'name is required'],
        lowercase:true,
        trim:true,
    },
    machineId:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,'machineId is required'],
        ref:'VendingMachine'
    },
    ingredientId:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,'ingredientId is required'],
        ref:'Ingredient'
    },
    capacity:{
        type:Number,
        required:[true,'capacity is required']
    },
    currentLevel:{
        type:Number,
        required:[true,'currentLevel is required']
    }
},{
    timestamps:true,
    versionKey:false
})

CanisterSchema.index({ machineId: 1, ingredientId: 1 }, { unique: true });

const Canister=mongoose.model<Canister>('Canister',CanisterSchema)

export default Canister
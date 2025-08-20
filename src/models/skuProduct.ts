
import mongoose from "mongoose";
import { Timestamped ,EntityRelations,UnitOfMeasure } from "../types/types";
import AuditLog from "./auditLOg";
import { AuditAction } from "../types/types";
export interface SKUProduct extends Timestamped, EntityRelations {
    name:String,
    price: number,
    unitOfMeasure:UnitOfMeasure,
    quantity?:number    
};

const SKUProductSchema=new mongoose.Schema<SKUProduct>({
    name:{
        type:String,
        required:[true,'name is required'],
        trim:true,
        unique:true
    },
    price:{
        type:Number,
        required:[true,'price is required']
    },
    unitOfMeasure:{
        type:String,
        enum: Object.values(UnitOfMeasure),
        required:[true,'unitOfMeasure is required']
    },
    quantity:{
        type:Number,
        required:[true,'quantity is required']
    }
},{
    timestamps:true,
    versionKey:false
})

SKUProductSchema.methods.logSale= async function( quantity:number){
    await AuditLog.create({
        action: AuditAction.SKU_SOLD,
        skuId: this._id,
        quantity: quantity,
        unit: this.unitOfMeasure,
        previousValue: this.quantity,
        newValue: this.quantity - quantity,
        userId: 'system'
    })
}

const SKUProduct = mongoose.model('SKUProduct',SKUProductSchema)
 
export default SKUProduct

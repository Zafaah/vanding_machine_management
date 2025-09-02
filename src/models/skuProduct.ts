import mongoose, { Document } from "mongoose";
import AuditLog from "./auditLOg";
import { AuditAction } from "../types/types";
export interface SKUProduct extends Document {
    name:String,
    price: number
    quantity:number    
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
        previousValue: this.quantity,
        newValue: this.quantity - quantity,
        userId: 'system'
    })
}

const SKUProduct = mongoose.model('SKUProducts',SKUProductSchema)
 
export default SKUProduct

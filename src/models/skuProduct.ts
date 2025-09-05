import mongoose, { Document, ObjectId } from "mongoose";
import AuditLog from "./auditLOg";
import { AuditAction } from "../types/types";
export interface SKUProduct extends Document {
    productId: string;
    name: String;
    description?: string;
    price: number;
};

const SKUProductSchema = new mongoose.Schema<SKUProduct>({
    productId: {
        type: String,
        required: [true, 'productId is required'],
        trim: true,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    price: {
        type: Number,
        required: [true,'price is required']
    },
    
}, {
    timestamps: true,
    versionKey: false
})

// No per-SKU quantity here; quantity is tracked per slot in SlotInventory

const SKUProduct = mongoose.model('SKUProducts',SKUProductSchema)
 
export default SKUProduct

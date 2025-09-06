import mongoose, { Document, ObjectId } from "mongoose";

export interface SKUProduct extends Document {
    slotId: mongoose.Schema.Types.ObjectId;
    productId: string;
    name: String;
    description?: string;
    price: number;
};

const SKUProductSchema = new mongoose.Schema<SKUProduct>({
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'slotId is required'],
        ref: 'Slot'
    },
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
    }
}, {
    timestamps: true,
    versionKey: false
})

// No per-SKU quantity here; quantity is tracked per slot in SlotInventory

const SKUProduct = mongoose.model('SKUProducts',SKUProductSchema)
 
export default SKUProduct

import mongoose, { Document } from "mongoose";

export interface Sales extends Document {
    transactionId: string;
    machineId: mongoose.Schema.Types.ObjectId;
    saleType: 'SKU' | 'COFFEE';
    items: Array<{
        skuId?: mongoose.Schema.Types.ObjectId;
        canisterId?: mongoose.Schema.Types.ObjectId;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    totalAmount: number;
    paymentMethod: 'CASH' | 'CARD' | 'DIGITAL';
    status: 'COMPLETED' | 'FAILED' | 'REFUNDED';
    customerId?: string;
    timestamp: Date;
}

const SalesSchema = new mongoose.Schema<Sales>({
    transactionId: {
        type: String,
        required: [true, 'transactionId is required'],
        trim: true
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendingMachine',
        required: [true, 'machineId is required']
    },
    saleType: {
        type: String,
        enum: ['SKU', 'COFFEE'],
        required: [true, 'saleType is required']
    },
    items: [{
        skuId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SKUProducts'
        },
        canisterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Canister'
        },
        quantity: {
            type: Number,
            required: [true, 'quantity is required'],
            min: [1, 'quantity must be at least 1']
        },
        unitPrice: {
            type: Number,
            required: [true, 'unitPrice is required'],
            min: [0, 'unitPrice cannot be negative']
        },
        totalPrice: {
            type: Number,
            required: [true, 'totalPrice is required'],
            min: [0, 'totalPrice cannot be negative']
        }
    }],
    totalAmount: {
        type: Number,
        required: [true, 'totalAmount is required'],
        min: [0, 'totalAmount cannot be negative']
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'DIGITAL'],
        required: [true, 'paymentMethod is required'],
        default: 'CASH'
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'FAILED', 'REFUNDED'],
        required: [true, 'status is required'],
        default: 'COMPLETED'
    },
    customerId: {
        type: String,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better query performance
SalesSchema.index({ transactionId: 1 }, { unique: true });
SalesSchema.index({ machineId: 1, timestamp: -1 });
SalesSchema.index({ saleType: 1, timestamp: -1 });
SalesSchema.index({ status: 1, timestamp: -1 });

const Sales = mongoose.model<Sales>('Sales', SalesSchema);

export default Sales;

import mongoose from "mongoose";
import { Timestamped, EntityRelations, machineType, MachineStatus} from "../types/types";


export interface VendingMachine extends Timestamped, EntityRelations  {
    name:string;
    type : machineType;
    status : MachineStatus;
    location : string;
    trays: mongoose.Schema.Types.ObjectId[];
    canisters: mongoose.Schema.Types.ObjectId[];
}

const VendingMachineSchema= new mongoose.Schema<VendingMachine>({
    name:{
        type:String,
        required:[true,'name is required'],
        trim:true,
        lowercase:true,
        unique:true
    },
    type:{
        type:String,
        enum:  Object.values(machineType),
        required:[true,'type is required'],
        default:machineType.SLOT
    },
    status:{
        type:String,
        enum: Object.values(MachineStatus),
        required:[true,'status is required'],
        default:MachineStatus.ACTIVE
    },
    location:{
        type:String,
        required:[true,'location is required'],
        trim:true,
        lowercase:true,
        unique:true
    },
    trays:{
        type:[mongoose.Schema.Types.ObjectId],
        required:[true,'trays is required'],
        ref:'Tray'
    },
    canisters:{
        type:[mongoose.Schema.Types.ObjectId],
        required:[true,'canisters is required'],
        ref:'Canister'
    }
},{
    timestamps: true,
    versionKey: false,
}
)

VendingMachineSchema.pre('save',function(next){
    if(this.type==machineType.SLOT  && this.canisters.length>0){
        return next(new Error('canisters are not allowed for slot machine'));
    }
    if(this.type==machineType.COFFEE  && this.trays.length>0){
        return next(new Error('trays are not allowed for coffee machine'));
    }
    if(this.type==machineType.COMBO  && (this.trays.length===0 || this.canisters.length===0)){
        return next(new Error('combo machine must have at least one tray or one canister'));
    }

    next();
})

VendingMachineSchema.index({ name: 1 }, { unique: true });

const VendingMachine = mongoose.model('vendingMachine',VendingMachineSchema)

export default VendingMachine
import { Timestamped, EntityRelations } from "../types/types";
import mongoose from "mongoose";

export interface Trays extends Timestamped, EntityRelations {
    machineId:mongoose.Schema.Types.ObjectId,
    name:String,
    slots:mongoose.Schema.Types.ObjectId[]
}

const TraysSchema=new mongoose.Schema<Trays>({
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
    slots:{
        type:[mongoose.Schema.Types.ObjectId],
        required:[true,'slots is required'],
        ref:'Slot'
    }
},{
    timestamps:true,
    versionKey:false
})

const Trays=mongoose.model<Trays>('Tray',TraysSchema)

export default Trays

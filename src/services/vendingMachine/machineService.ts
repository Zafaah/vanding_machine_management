import VendingMachine, { IVendingMachine } from "../../models/vendingMModel";
import { machineType, AuditAction } from "../../types/types";
import auditLog from "../../models/auditLOg";
import { paginateAndSearch } from "../../utils/apiFeatures";
import { formatVendingMachine } from "../../utils/vendingMachineResponse";

export async function createMachine(data: any, meta: any): Promise<IVendingMachine> {
   const { name, location, status, type, trays, canisters } = data;

   const machineData: any = { name, location, status: status || "active", type };

   if (type === machineType.COFFEE) {
      machineData.canisters = canisters;
   } else if (type === machineType.SLOT) {
      machineData.trays = trays;
   } else if (type === machineType.COMBO) {
      machineData.trays = trays;
      machineData.canisters = canisters;
   }

   const vendingMachine = await VendingMachine.create(machineData);

   // log
   await auditLog.create({
      action: AuditAction.MACHINE_CREATED,
      machineId: vendingMachine._id,
      model: "VendingMachine",
      ...meta,
      meta: {
         machineId: vendingMachine._id,
         name: vendingMachine.name,
         location: vendingMachine.location,
      },
   });

   return vendingMachine;
}

export async function getAllMachines(req: any) {
   const result = await paginateAndSearch(VendingMachine, req, "trays");

   if (Array.isArray(result.results)) {
      const populated   = await VendingMachine.populate(result.results, [
         {
            path: "trays",
            populate: { path: "slot", populate: { path: "skuId" } },
         },
         { path: "canisters" },
      ]);
      return{
         ...result,
         results: populated.map(formatVendingMachine)
      }
   }
   return {
      ...result,
      results: []
   };
}

export async function getMachineById(id: string) {
   const vendingMachine = await VendingMachine.findById(id)
      .populate("trays")
      .populate("canisters");
   return vendingMachine ? formatVendingMachine(vendingMachine) : null;
}

export async function updateMachine(id: string, data: any) {
   return VendingMachine.findOneAndUpdate({ _id: id }, data, { new: true });
}

export async function deleteMachine(id: string) {
   return VendingMachine.findByIdAndDelete(id);
}


export enum machineType{
    SLOT= 'slot',
    COFFEE= 'coffee',
    COMBO= 'combo',
    
}

export enum MachineStatus {
    ACTIVE = 'active',
    MAINTENANCE = 'maintenance',
    OUT_OF_SERVICE = 'out_of_service'
  }
  
  export enum UnitOfMeasure {
    ML = 'ml',
    GRAMS = 'grams',
    PUMPS = 'pumps',
    ITEMS = 'items'
  }
  
  export enum AuditAction {
    MACHINE_CREATED = 'MACHINE_CREATED',
    MACHINE_UPDATED = 'MACHINE_UPDATED',
    SKU_SOLD = 'SKU_SOLD',
    INGREDIENT_CONSUMED = 'INGREDIENT_CONSUMED',
    CANISTER_REFILLED = 'CANISTER_REFILLED',
    RECIPE_OUT_OF_STOCK = 'RECIPE_OUT_OF_STOCK'
  }
  
  /* ======= CORE INTERFACES ======= */
  export interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface EntityRelations {
    id: string;
    _id: string;
  }
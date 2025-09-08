## API Documentation (Summary)

Base URL: `/api`

Authentication: None (assumed internal/admin API). Add auth middleware as needed.

### Vending Machines
- `GET /vending` — List machines (query supported)
- `POST /vending` — Create machine { name, location, type }
- `GET /vending/:id` — Get machine
- `PUT /vending/:id` — Update machine
- `DELETE /vending/:id` — Delete machine

### Trays
- `GET /trays` — List trays
- `POST /trays` — Create tray
- `GET /trays/:id` — Get tray
- `PUT /trays/:id` — Update tray
- `DELETE /trays/:id` — Delete tray

### Slots
- `GET /slots` — List slots
- `POST /slots` — Create slot
- `GET /slots/:id` — Get slot
- `PUT /slots/:id` — Update slot
- `DELETE /slots/:id` — Delete slot

### SKU Products
- `GET /sku` — List SKUs
- `POST /sku` — Create SKU (optionally bind to slotId)
- `GET /sku/:id` — Get SKU
- `PUT /sku/:id` — Update SKU
- `DELETE /sku/:id` — Delete SKU

### Ingredients
- `GET /ingredients` — List ingredients
- `POST /ingredients` — Create ingredient (optionally with canisterId to auto-link)
- `GET /ingredients/:id` — Get ingredient
- `PUT /ingredients/:id` — Update ingredient
- `DELETE /ingredients/:id` — Delete ingredient

### Canisters (conisters)
- `GET /conisters` — List canisters
- `POST /conisters` — Create canister
- `GET /conisters/:id` — Get canister
- `PUT /conisters/:id` — Update canister
- `DELETE /conisters/:id` — Delete canister
- `POST /conisters/:id/assign` — Assign ingredient to canister
- `POST /conisters/:id/refill` — Refill canister

### Slot Inventory
- `POST /slot-inventory` — Upsert inventory for a slot
- `GET /slot-inventory` — List inventory (filters: machineId, trayId, slotId, skuId)
- `POST /slot-inventory/sell` — Decrement inventory atomically
- `GET /slot-inventory/machine/:machineId` — Inventory by machine
- `GET /slot-inventory/low-stock?threshold=5` — Items at/below threshold
- `PUT /slot-inventory/:inventoryId` — Set quantityOnHand

### Sales
- `POST /sales/check-inventory` — Validate SKU availability before sale
- `GET /sales/coffee-availability/:machineId/:recipeId` — Per-recipe cups possible
- `POST /sales/sku` — Process SKU sale
- `POST /sales/coffee` — Process coffee sale (consumes canisters)
- `GET /sales` — List sales (paginated)
- `GET /sales/machine/:machineId` — Sales for a machine
- `GET /sales/summary` — Sales analytics
- `POST /sales/refund/:transactionId` — Mark sale refunded

### Recipes
- `GET /recipes` — List recipes
- `POST /recipes` — Create recipe
- `GET /recipes/:id` — Get recipe (populated)
- `PUT /recipes/:id` — Update recipe
- `DELETE /recipes/:id` — Delete recipe
- `GET /recipes/machine/:machineId` — Recipes for a machine

### Forecast
- `GET /forecast/coffee-availability/:machineId/:recipeId` — Cups possible for recipe
- `GET /forecast/machine/:machineId` — All recipe forecasts for machine
- `GET /forecast/low-stock/:machineId?threshold=20` — Canister low stock warnings
- `GET /forecast/all-machines` — Global forecast summary

Refer to `openapi.yaml` for request/response schemas and examples.


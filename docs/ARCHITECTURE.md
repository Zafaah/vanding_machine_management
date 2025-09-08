## Architecture Overview

This service models a vending ecosystem with two inventory domains:
- SKU inventory for traditional trays/slots
- Ingredient/canister inventory for coffee recipes

### Components
- Node.js/Express (TypeScript): HTTP API layer, validation, error handling
- MongoDB (Mongoose): Primary datastore for machines, trays, slots, SKUs, ingredients, canisters, sales, audit logs
- Redis: Provisioned for background jobs and caching (future; BullMQ dependency present but not used yet)
- Caddy: Reverse proxy and TLS termination; routes `/api/*` to the Node app
- Docker Compose: Orchestrates services: app, mongo, redis, caddy

### Container Topology
- `app` (Node): listens on `PORT` (default 8000)
- `mongo`: MongoDB 6 with volume `mongo_data`
- `redis`: Redis 7 with volume `redis_data`
- `caddy`: public ports 80/443, proxies `/api/*` -> `vending_app:8000`

### Configuration
- `.env`: `PORT`, `MONGO_URI` (default `mongodb://mongo:27017/vending-machines` in Docker)
- `src/config/db.ts`: connects to MongoDB using `MONGO_URI`
- `Caddyfile`: reverse proxy and structured logs

### Domain Model (high-level)
- VendingMachine: name, location, type, canisters[], trays[]
- Trays: belong to machine, contain slots
- Slots: belong to tray, can hold an SKU
- SKUProduct: basic packaged product with price
- Ingredient: unitOfMeasure and metadata
- Canister: ingredient association(s), capacity, currentLevel
- SlotInventory: per machine/tray/slot/SKU quantityOnHand
- Recipe: for coffee, with array of { ingredientId, quantity, unit }
- Sales: transaction record for SKU or coffee sales
- AuditLog: append-only records of important state changes

### Key Flows
1) SKU Sale (Atomic)
   - Validate machine and inventory
   - In a MongoDB session/transaction, for each item:
     - `SlotInventory.findOneAndUpdate({ ... , quantityOnHand: { $gte: n } }, { $inc: { quantityOnHand: -n } })`
     - Append `AuditLog` with before/after
   - Create `Sales` document and commit transaction

2) Coffee Sale (Atomic)
   - Validate machine and active recipe
   - Resolve recipe ingredients -> canisters map
   - In a MongoDB session/transaction, for each ingredient:
     - `Canister.findOneAndUpdate({ _id, currentLevel: { $gte: q } }, { $inc: { currentLevel: -q } })`
     - Append `AuditLog`
   - Create `Sales` document and commit transaction

3) Forecasting & Availability
   - For a recipe, compute cups possible: `floor(canister.currentLevel / required.quantity)` for each ingredient
   - The minimum across ingredients limits max cups; missing ingredient => 0
   - Machine-level forecast aggregates over active recipes
   - Low stock warnings based on percentage of capacity

### Auditing
- Every critical mutation (inventory update, canister refill/consume, SKU sold) produces an `AuditLog` with previous/new values and context

### Background Jobs (Planned)
- Redis and BullMQ are present in dependencies; not yet wired-up. Future tasks:
  - Refill reminders based on low stock
  - Sales aggregation rollups
  - Webhook notifications

### Security & Ops
- Add authentication/authorization middleware as needed
- Consider rate limiting and CORS restrictions for production
- Backups: persist Mongo and Redis volumes; add backup cron jobs as needed


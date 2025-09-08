## Vending Machines API

Production-ready Node.js/TypeScript service for managing vending machines, SKU inventory, coffee recipes, and sales with atomic updates and auditing. Containerized with Docker and fronted by Caddy. Backed by MongoDB; Redis is provisioned for future background jobs.

### Features
- CRUD for vending machines, trays, slots, SKU products, ingredients, and canisters
- Coffee recipe management and availability/forecasting
- Atomic inventory decrements for sales and ingredient consumption
- Auditing for key actions (sales, inventory updates, canister ops)
- Caddy reverse proxy for `/api/*`

### Tech Stack
- Node.js + Express + TypeScript
- MongoDB (Mongoose)
- Redis (provisioned, future: BullMQ)
- Caddy reverse proxy
- Docker + docker-compose

---

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Environment
Create a `.env` file  Defaults are sensible for docker-compose.

```
PORT=8000
MONGO_URI=mongodb://mongo:27017/vending-machines
```

### Run (Docker)
```
docker compose up --build
```
- API: http://localhost/api/... (via Caddy)
- App container exposes port 8000 internally
- MongoDB on localhost:27017 (container: `mongo`)

### Run locally (without Docker)
1. Ensure MongoDB is running locally on `mongodb://localhost:27017/vending-machines` or set `MONGO_URI`.
2. Install deps:
```
npm install
```
3. Start dev server:
```
npm run dev
```
Server runs on http://localhost:8000

---

## Scripts
- `npm run dev`: Start with ts-node + nodemon
- `npm run build`: Compile TypeScript to `dist/`
- `npm start`: Run compiled server

---

## API Overview
Base path: `/api`

- `/trays` CRUD
- `/conisters` CRUD, assign ingredient, refill
- `/vending` CRUD
- `/slots` CRUD
- `/sku` CRUD
- `/slot-inventory` set/get/sell/low-stock/update
- `/sales` check-inventory, coffee-availability, process SKU/coffee sale, refund, list, machine filter, summary
- `/recipes` CRUD, `GET /recipes/machine/:machineId`
- `/ingredients` CRUD
- `/forecast` coffee-availability, machine forecast, low stock warnings, all-machines summary

See `docs/API.md` and `docs/openapi.yaml` for details.

---

## Testing
Jest + Supertest are configured as devDependencies. Add tests under `__tests__/` and run:
```
npm test
```

---

## Docker Details
- `docker-compose.yml` builds the app and starts MongoDB, Redis, and Caddy
- `Caddyfile` proxies `/api/*` to `vending_app:8000`
- Volumes persist MongoDB and Redis data

---

## Development Notes
- Env vars used: `PORT`, `MONGO_URI`
- Logging via request middleware and controllers/services
- Errors flow through `globalError` handler

---

## Folder Structure
```
src/
  config/        # env + db connect
  controllers/   # request handlers
  routes/        # express routers (mounted under /api)
  services/      # business logic
  models/        # mongoose schemas
  middlewares/   # validation, logging, errors
  utils/         # helpers (api response, features)
  logging/       # logger
  server.ts      # app bootstrap
```

---

## Health Check
```
GET /
200 OK: "Hello World"
```


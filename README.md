# Hyperlocal Kirana Marketplace — First Prototype

A modular-monolith REST API prototype for the platform described in the PRD
(v2.0): a hyperlocal commerce platform connecting customers with nearby
kirana (neighborhood) retailers, with a shared backend across Android, Web,
future iOS, and an Admin Portal.

This prototype focuses on proving out the **module boundaries, RBAC model,
and the customer→shopkeeper→delivery order workflow** end-to-end using an
in-memory data store — no external database required. Every module lives in
its own folder and only talks to shared state through `src/data/db.js`, so
swapping the in-memory store for Postgres/Mongo later doesn't change any
module's public API.

## Why these choices

- **Modular monolith, not microservices yet.** The PRD calls for a
  "microservice-ready backend" — this prototype gets the module boundaries
  right first (auth, catalog, shops, orders, delivery, payments, ...) so
  each can be extracted into its own service later without a rewrite.
- **In-memory store.** Fastest way to validate the API surface and workflow
  logic; every module's data access goes through `src/data/db.js`, which is
  the only file that would change when swapping in a real database.
- **JWT + role array on the user.** Matches PRD Section 2's "single
  authentication system" + "a user may have one or more roles" (Section 3).

## Project structure

```
src/
  app.js                 # wires all module routers together
  server.js               # boots the HTTP server (+ seeds demo data)
  config/
    roles.js              # ROLES enum + module-level RBAC access matrix
  data/
    db.js                 # in-memory "database"
    seed.js                # demo users/shop/products + printable JWTs
  middleware/
    authenticate.js        # verifies JWT, attaches req.user
    authorize.js            # role-gate for a route (API-level RBAC)
    validate.js              # minimal required-field body validation
    errorHandler.js           # centralized error + 404 handling
  utils/
    ApiError.js, asyncHandler.js, response.js
  modules/                 # one folder per PRD functional module
    auth/                    # OTP + password login, registration, JWT issuing
    users/                    # profile + delivery addresses
    catalog/                   # central platform-owned product catalog
    shops/                      # shop discovery/CRUD + shopkeeper price/availability
    cart/                        # shopping cart with fee/tax breakdown
    orders/                       # the 10-step order workflow state machine
    delivery/                      # delivery partner dashboard & pickup/delivery flow
    payments/                       # payment initiation, COD confirmation
    settlements/                     # shopkeeper/delivery partner settlement cycles
    notifications/                    # in-app notification events
    reports/                           # role-specific analytics (shopkeeper/delivery/admin)
    admin/                              # users/roles, cities, localities, coupons, config, audit log
```

Each module follows the same three-file pattern:

- `routes.js` — Express router: auth + role gates + input validation, then delegates
- `controller.js` — translates HTTP req/res to service calls
- `service.js` — the actual business logic, framework-agnostic

## RBAC model (PRD Section 2 & 3)

- **UI level**: out of scope for this backend-only prototype, but the same
  `roles.js` matrix is what a frontend would use to decide which
  menus/screens to render.
- **API level**: every request passes through `authenticate` (verifies the
  JWT) then `authorize(...roles)` on routes that need it. Unauthorized
  requests are rejected with `403` even if the caller has a valid token for
  a different role — this is enforced per-route, not just per-module, so it
  holds even if someone bypasses a UI.

## The order workflow (PRD Section 6)

Implemented as an explicit state machine in `modules/orders/statuses.js`:

```
placed → under_review → (revised → confirmed | confirmed) → packed
        → delivery_assigned → out_for_delivery → delivered → completed
```

with `cancelled` reachable from most states. Every transition is validated
against this graph in `modules/orders/service.js`, so illegal jumps
(e.g. packing an order that hasn't been confirmed) return a `409`.

## Running it

```bash
cp .env.example .env
npm install
npm start
```

On boot the server seeds one demo user per role (customer, shopkeeper,
delivery partner, area manager, support executive, finance executive,
super admin), a sample shop, and two catalog products — and prints a ready
to use JWT for each role to the console. Copy any of those into an
`Authorization: Bearer <token>` header to try the API immediately.

Disable auto-seeding with `SEED_ON_BOOT=false` in `.env`.

## Try the core flow with curl

```bash
# grab a token from the server's boot log, e.g.
export CUSTOMER=<customer JWT from console>
export SHOPKEEPER=<shopkeeper JWT from console>

curl localhost:4000/api/catalog -H "Authorization: Bearer $CUSTOMER"

curl -X POST localhost:4000/api/cart/items \
  -H "Authorization: Bearer $CUSTOMER" -H "Content-Type: application/json" \
  -d '{"shopId":"<shop id from console>","shopProductId":"<shopProduct id from console>","quantity":2}'

curl -X POST localhost:4000/api/orders \
  -H "Authorization: Bearer $CUSTOMER" -H "Content-Type: application/json" \
  -d '{"deliveryOption":"home_delivery","paymentMethod":"upi"}'

curl -X POST localhost:4000/api/orders/<order id>/review -H "Authorization: Bearer $SHOPKEEPER"
```

## What's intentionally out of scope for this first prototype

Per PRD Section 16 ("Future Enhancements") and general prototype scope:

- Live GPS tracking, AI recommendations, loyalty/subscriptions, voice
  search, multi-language, dynamic delivery pricing — all explicitly listed
  as future enhancements in the PRD.
- Real payment gateway / SMS / push integration — `payments` and
  `notifications` are mocked but structured so a real provider slots in
  behind the same service functions.
- Persistent database, automated backups, HTTPS termination, and other
  Non-Functional Requirements (PRD Section 15) that are infrastructure
  concerns for deployment, not application logic.
- Web/Android/iOS clients — this prototype is the REST API only, which per
  PRD Section 2 is meant to be shared by all of them.

## Next steps toward a fuller build

1. Swap `src/data/db.js` for a real database (module APIs don't change).
2. Add automated tests per module (the service layer is framework-agnostic
   and easy to unit test as-is).
3. Wire real OTP/SMS, push, and payment gateway providers behind the
   existing `notifications` and `payments` services.
4. Add refunds/replacements flow referenced in Settlement & Support modules.

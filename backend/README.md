# Cricket Auction Backend

Express + TypeScript backend for the cricket auction platform.

Features include:
- Cookie-based JWT auth with admin authorization checks
- Player, team, and auction workflow APIs
- Auction settings management (season, purse, ordering algorithm, exchange toggle)
- Redis-backed token blacklist (logout/session invalidation)
- Prisma + PostgreSQL data layer

## Tech Stack
- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Redis
- JWT + HTTP-only cookies

## Project Structure
```text
backend/
  src/
    index.ts                       # Server bootstrap, middleware, routes
    routes/
      auth.route.ts                # /api/auth/*
      auction.route.ts             # /api/auction/*
    controller/
      auth.controller.ts
      auction.controller.ts
    middleware/
      authMiddleware.ts            # Validates auth_token cookie
      rateLimitMiddleware.ts       # Present, currently not enabled
    config/
      redis.ts                     # Redis client + connection
    db/
      prisma.ts                    # Prisma singleton
  prisma/
    schema.prisma
    migrations/
    seed.ts                        # Resets player auction state
```

## Prerequisites
- Node.js 20+
- PostgreSQL database
- Redis instance

## Environment Variables
Create `backend/.env` with:

```env
PORT=8000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
DIRECT_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
JWT_SECRET=<strong-random-secret>

ORIGIN=http://localhost:3000
PRODUCTION_ORIGIN=
PRODUCTION_ORIGIN_2=

REDIS_HOST=<host>
REDIS_PORT=6379
REDIS_PASSWORD=<password>
REDIS_TLS=true
```

Notes:
- `ORIGIN` / `PRODUCTION_ORIGIN*` are used by CORS allowlist.
- `auth_token` cookie is set as `httpOnly`, `sameSite: strict`, `secure` in production.

## Install & Run
```bash
cd backend
npm install
```

### Database setup
```bash
npx prisma generate
npx prisma migrate deploy
```

Optional (local iterative development):
```bash
npx prisma migrate dev
```

### Start server
```bash
npm run dev
```

Server default URL: `http://localhost:8000`

## Scripts
- `npm run dev` - Build TypeScript and start compiled server
- `npm run dev:watch` - Hot reload with `tsx` + nodemon
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled output
- `npm run seed` - Reset all players to fresh auction state (`isSold=false`, `isUnsold=false`, no team)

## Health Endpoints
- `GET /` -> `Auction Backend is running!`
- `GET /health` -> `OK`

## Auth Model
- Login returns user info and sets `auth_token` cookie.
- Protected routes use `authMiddleware` (reads cookie, verifies JWT, checks Redis blacklist).
- Admin-only operations are enforced in controller via `ensureAdmin`.
- Logout blacklists current token in Redis until JWT expiry and clears cookie.

## API Routes

### Auth (`/api/auth`)
- `POST /admin/login`
- `POST /user/login`
- `POST /admin/register`
- `POST /user/register`
- `GET /me`
- `POST /logout`

### Auction (`/api/auction`)

Public:
- `GET /players` - Returns `{ players, teams }`
- `GET /teams`
- `GET /teams/:id`
- `GET /settings`

Protected (auth required):
- `GET /next-player`
- `GET /summary`
- `GET /search?q=...`

Admin-only (auth + ADMIN role):
- `POST /players`
- `PUT /players/:id`
- `DELETE /players/:id`
- `PUT /players/sell`
- `PUT /players/:id/unsold`
- `PUT /players/unsold-all`
- `POST /players/exchange`
- `POST /teams`
- `PUT /teams/:id`
- `DELETE /teams/:id`
- `PUT /settings`

## Key Business Rules
- Selling validates team purse and max players per team.
- Updating sold player handles purse adjustments (same team or transfer case).
- Mark unsold refunds sold price to previous team when applicable.
- Bulk unsold refunds all sold players and clears assignments.
- Exchange is only allowed when `isExchangeAllowed=true` in settings.
- Allowed player base prices are constrained by `AuctionSettings.allowedBasePrices`.
- Next player ordering supports:
  - Base price order: `ASC | DESC | NONE`
  - Role order: `NO_ORDER | BATSMAN_FIRST | BOWLER_FIRST | ALLROUNDER_FIRST`

## Auction Settings Schema Compatibility
`auction.controller.ts` includes a compatibility helper (`ensureAuctionSettingsSchema`) that:
- Adds missing settings columns if not present
- Ensures row with `id=1` exists

This is a fallback for environments where migrations are delayed; migrations are still the recommended path.

## Troubleshooting

### `P1001: Can't reach database server`
- Check `DATABASE_URL`/`DIRECT_URL`
- Ensure your DB host is reachable from your network

### `AuctionSettings table/column does not exist`
- Run migrations:
  ```bash
  npx prisma migrate deploy
  npx prisma generate
  ```

### `Unauthorized: Invalid token`
- Ensure frontend sends cookies (`withCredentials: true`)
- Ensure CORS origin list includes frontend URL
- Clear stale cookies and login again

### Transaction timeout / transaction not found errors
- This code already includes retry logic (`runTransactionWithRetry`) for retryable transaction failures.
- If persistent, reduce DB latency and avoid long-running operations in one transaction.

## Security Notes
- Use strong `JWT_SECRET`
- Use production TLS and secure cookie settings
- Restrict CORS origins in production
- Avoid exposing database credentials in logs

## Development Tips
- Use `npm run dev:watch` while iterating controller logic.
- Keep Prisma schema + migrations in sync with deployed DB.
- If frontend assumes new response fields, update both controller and frontend types together.

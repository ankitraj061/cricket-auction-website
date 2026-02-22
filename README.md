# Cricket Auction Platform

Monorepo containing both applications:
- `frontend/` - Next.js UI
- `backend/` - Express + Prisma API

This platform supports admin-driven cricket auction operations including players/teams management, live auction flow, auction settings, and cookie-based authentication.

## Repository Layout
```text
cricket-auction/
  frontend/   # Next.js app
  backend/    # Express API + Prisma + Redis
```

## Quick Start (Local)

## 1. Start Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Backend runs on: `http://localhost:8000`

## 2. Start Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

## Environment Setup
Configure environment files before running:
- `backend/.env` (database, jwt, redis, cors origins)
- `frontend/.env` (`NEXT_PUBLIC_API_URL`)

See detailed variable lists in:
- `backend/README.md`
- `frontend/README.md`

## Documentation
- Frontend guide: `frontend/README.md`
- Backend guide: `backend/README.md`

## Main Features
- Admin login/logout with secure cookie session
- Players CRUD + sale management + mark unsold + exchange
- Teams CRUD + team detail pages
- Auction settings (purse limits, allowed base prices, ordering algorithms, exchange toggle)
- Live auction room (next player, bidding controls, summary panel, search)

## Common Issues
- `401 Unauthorized`: check cookie auth + CORS origins + frontend API URL
- Prisma migration errors: run `npx prisma migrate deploy`
- DB connectivity errors (`P1001`): verify database URL/network access

For deeper troubleshooting, use module docs:
- `frontend/README.md`
- `backend/README.md`
# cricket-auction-website

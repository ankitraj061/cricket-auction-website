# Cricket Auction Frontend

Next.js frontend for the cricket auction platform. This app provides:
- Admin authentication (cookie-based session via backend)
- Auction control room (live bidding, sell/unsold, search)
- Players management (CRUD, sale edits, unsold actions, exchange)
- Teams management (CRUD, team details)
- Season auction settings management

## Tech Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS v4
- Framer Motion
- Radix UI primitives
- Axios (`withCredentials: true`)
- Sonner toasts

## Project Structure
```text
frontend/
  app/
    auction/page.tsx            # Live auction room
    players/page.tsx            # Players listing + admin actions
    players/create/page.tsx     # Create player form
    teams/page.tsx              # Teams listing + admin actions
    teams/[id]/page.tsx         # Team details page
    team/create/page.tsx        # Create team form
    auth/admin/login/page.tsx   # Admin login
    contexts/AuthContext.tsx    # Auth state + /api/auth/me bootstrap
    client/axiosClient.ts       # Axios instance (cookie-based)
    globals.css                 # Global theme tokens + utilities
  components/
    PlayerCard.tsx
    TeamCard.tsx
    AuctionCard.tsx
    SellDialog.tsx
    ui/
      universal-loader.tsx      # Reusable loader
  lib/
    uiTokens.ts                 # Shared button/form/dialog style tokens
```

## Prerequisites
- Node.js 20+
- Backend API running (default: `http://localhost:8000`)

## Environment Variables
Create `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Install & Run
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Scripts
- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Authentication Model
- Frontend does **not** store JWT in localStorage.
- Backend sets an HTTP-only `auth_token` cookie.
- Axios is configured with `withCredentials: true` in `app/client/axiosClient.ts`.
- Auth bootstrap call: `GET /api/auth/me` in `AuthContext`.

## Main Routes
- `/` - Home dashboard + quick actions + auction settings modal
- `/auth/admin/login` - Admin login
- `/players` - Players list, filters, admin actions
- `/players/create` - Create player page
- `/teams` - Teams list, admin actions
- `/teams/[id]` - Team details and squad
- `/team/create` - Create team page
- `/auction` - Live auction page

## API Usage (Frontend)
Common API calls used by this app:
- Auth:
  - `GET /api/auth/me`
  - `POST /api/auth/admin/login`
  - `POST /api/auth/logout`
- Auction settings:
  - `GET /api/auction/settings`
  - `PUT /api/auction/settings`
- Players:
  - `GET /api/auction/players`
  - `POST /api/auction/players`
  - `PUT /api/auction/players/:id`
  - `DELETE /api/auction/players/:id`
  - `PUT /api/auction/players/sell`
  - `PUT /api/auction/players/:id/unsold`
  - `PUT /api/auction/players/unsold-all`
  - `POST /api/auction/players/exchange`
- Teams:
  - `GET /api/auction/teams`
  - `GET /api/auction/teams/:id`
  - `POST /api/auction/teams`
  - `PUT /api/auction/teams/:id`
  - `DELETE /api/auction/teams/:id`
- Auction runtime:
  - `GET /api/auction/next-player`
  - `GET /api/auction/summary`
  - `GET /api/auction/search?q=...`

## UI Consistency Conventions
- Use tokens from `lib/uiTokens.ts` for buttons/forms/dialog styles.
- Use global surface utilities from `app/globals.css`:
  - `theme-page-bg`
  - `theme-card`
  - `theme-card-strong`
  - `theme-grid-overlay`
- Prefer `UniversalLoader` for non-skeleton loading states.
- Keep skeletons for dense pages where layout preview is useful (e.g. auction page).

## Common Development Notes
- If API calls fail with `401` while logged in, verify:
  1. Backend CORS origin allows `http://localhost:3000`
  2. Browser has `auth_token` cookie
  3. `NEXT_PUBLIC_API_URL` points to correct backend host
- If you change API response shapes, update TypeScript types in:
  - `app/types/type.ts`
  - local page-level interfaces

## Troubleshooting
### Frontend starts but cannot call API
- Check `.env` has correct `NEXT_PUBLIC_API_URL`
- Check backend is running and accessible on that URL

### Auth appears to fail after login
- Clear cookies and login again
- Ensure backend and frontend domains/ports match CORS allowlist

### Lint warnings for `<img>`
- Some components still use `<img>` intentionally.
- Prefer `next/image` for optimized image loading when possible.

## Recommended Workflow
1. Start backend first
2. Start frontend
3. Login as admin
4. Configure auction settings
5. Create teams and players
6. Run auction flow

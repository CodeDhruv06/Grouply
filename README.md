# GoldenLeaf — A FinTech Project

A full‑stack fintech app with modern UI, real‑time analytics, AI assistance, peer transfers with cashback, bill splitting, and a responsive right‑side navigation. Built with React + Vite on the frontend and Node.js + Express + MongoDB on the backend.

## Features

- Authentication: signup/login with JWT, user profile (/api/v1/user/me)
- Theming: light/dark with persistent toggle (localStorage + html.dark)
- Navigation: desktop right‑side sidebar + mobile top bar with icons
- Dashboard: stat cards, line + pie charts (Recharts), AI insights (Gemini)
- Transfers: send money between users; instant feedback and success toast
- Cashback: per‑transaction cashback with rule‑based boosts and a cashback wallet
- Split bills: groups and bills endpoints scaffolded for shared expenses
- Voice AI: speech‑to‑text chat with text‑to‑speech responses (AI page)
- Profile: animated background, virtual card, QR spot, finance score bar
- Backend hardening: helmet, CORS, input validation (zod pending in some routes)

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, Recharts, React Router, Axios, React Icons/Lucide
- Backend: Node.js, Express, MongoDB/Mongoose, JSON Web Tokens (JWT), Helmet, CORS, Morgan
- AI: Google Gemini API via a backend proxy with caching and rate limiting

## Monorepo Layout

```
GoldenLeaf - A FinTech Project/
├─ Backend/                 # Express API
├─ GoldenLeaf/              # React + Vite frontend app
└─ my-app/                  # (Optional) Next.js sandbox
```

## Quick Start (Windows PowerShell)

Prerequisites:
- Node.js 18+ and npm
- A MongoDB connection string (Atlas or local)
- A Google Gemini API key (https://ai.google.dev/)

1) Backend setup

```powershell
cd "C:\Users\Administrator\Desktop\projects\GoldenLeaf - A FinTech Project\Backend"
npm install
# Create .env (place alongside index.js)
@"
PORT=5000
JWT_SECRET=your-strong-secret
MONGO_URI=your-mongodb-connection-string
GEMINI_API_KEY=your-gemini-api-key
"@ | Out-File -Encoding UTF8 .env

# Run API
node index.js
# API will listen on http://localhost:5000
```

2) Frontend setup

```powershell
cd "C:\Users\Administrator\Desktop\projects\GoldenLeaf - A FinTech Project\GoldenLeaf"
npm install
# Optional: set a custom API URL
# @"`nVITE_API_URL=http://localhost:5000`n"@ | Out-File -Encoding UTF8 .env

npm run dev
# Vite dev server will print a local URL to open in the browser
```

## Environment Variables

Backend (.env):
- PORT: default 5000
- JWT_SECRET: required for token signing
- MONGO_URI: your MongoDB URI
- GEMINI_API_KEY: your Google Gemini API key

Frontend (.env):
- VITE_API_URL: override API base (defaults to http://localhost:5000)

## API Overview

Base path: http://localhost:5000/api/v1

- Auth
  - POST /user/signup — create account (email, password, name)
  - POST /user/login — authenticate and receive JWT
  - GET /user/me — current user profile (Authorization: Bearer <token>)

- Payments
  - POST /payments/send — body: { senderEmail, recipientEmail, amount, note }
    - Returns: { message, transaction, cashback, rule, balances }

- Dashboard
  - GET /dashboard/:email — summary for charts and cards
    - Returns: { balance, cashbackBalance, spentThisMonth, cashbackThisMonth, savedThisMonth, categoryData, trendData }

- AI (Gemini)
  - POST /gemini/generate — body: { prompt, email?, force? }
    - In‑memory cache (6h TTL) and per‑user/ip cooldown (60s)
    - On upstream 429, returns a helpful note and any cached suggestion

- Split (scaffold)
  - /split/... — group and bill splitting endpoints (in progress)

- Health
  - GET /health — service check

## Data Model (MongoDB)

- user
  - email, password, name, balance
  - cashbackBalance — accumulated cashback wallet
  - tapLinkId, qrCodeId (auto‑generated)

- transaction
  - senderId, receiverId, amount, note, status, timestamp
  - cashbackAmount, cashbackRule

- group, bill, reminder, Link — used by split‑bill, reminders, and link/QR features

## Frontend Routes

- / — Landing
- /home — Home
- /dashboard — Charts + stat cards + AI suggestion
- /ai — Voice + text AI assistant
- /transfer — Send money (shows earned cashback)
- /about — About page
- /login, /signup — Auth screens
- /profile — Animated profile with virtual card

## Theming

- Theme is stored in localStorage ("theme" = light|dark) and mirrored on the <html> element via the "dark" class.
- Most pages include a theme toggle and listen for changes to sync UI in real time.

## Cashback Rules (MVP)

- Base: 1% for spends ≥ ₹100
- Category boost: 2% if note includes Food/Dining keywords (e.g., "food", "zomato", "swiggy")
- Cap: ₹200 per transaction
- Credited to sender.cashbackBalance; not immediately added to spendable balance

Customize rules: edit Backend/Routes/payments.js (RULES object and matching logic).

## AI Quotas & Caching

- Backend caches Gemini suggestions for 6 hours per unique prompt and enforces a 60‑second cooldown per user/IP.
- Dashboard also uses a localStorage cache and a short local cooldown.
- On upstream rate limits (429), the API returns a note and serves any cached suggestion available.

## Troubleshooting

- Port 5000 already in use
  - Another instance is running. Stop it or change PORT in .env.
- Gemini 429 RESOURCE_EXHAUSTED
  - Free tier quota exceeded; try later or upgrade. Cached tips will still show when available.
- Mic not working (AI page)
  - Allow microphone permissions; Chrome/Edge on desktop recommended.
- CORS issues
  - Backend enables CORS for dev. Ensure VITE_API_URL points at backend origin.
- Mongo connection errors
  - Verify MONGO_URI and network/firewall. Check that your IP is whitelisted in Atlas.

## Scripts

Backend (in Backend/):
```powershell
npm run start   # node index.js
npm run dev     # node --watch index.js (if configured)
```

Frontend (in GoldenLeaf/):
```powershell
npm run dev     # start Vite dev server
npm run build   # production build
npm run preview # preview built app
```

## Security & Next Steps

- Hash passwords with bcrypt (signup/login) and enforce strong password policy
- Protect more routes with JWT middleware
- Add input validation to all routes (e.g., zod schemas)
- Add unit/integration tests (Jest/Supertest) for API and components
- Add rate limiting on sensitive endpoints

## License

TBD. Add a license that matches your intended usage (e.g., MIT, Apache‑2.0, or proprietary).

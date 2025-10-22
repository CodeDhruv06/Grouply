# GoldenLeaf Backend (Auth API)

A minimal Express-based JWT auth API for login/signup. Uses a JSON file as a simple local DB for development.

## Endpoints
- POST /api/auth/signup { name, email, password }
- POST /api/auth/login { email, password }
- POST /api/auth/refresh { refreshToken }
- GET  /api/auth/me  (Authorization: Bearer <token>)
- GET  /health

## Setup
1. Copy `.env.example` to `.env` and edit secrets as needed.
2. Install dependencies.
3. Run the server.

## Commands
```powershell
# From the Backend folder
npm install
npm run dev
```

## Notes
- This is for local/dev. For production, swap `src/db/jsondb.js` with a real DB (Mongo, Postgres) and store hashed passwords properly (already uses bcrypt) and rotate secrets.
- CORS is enabled for all origins by default; restrict as needed.

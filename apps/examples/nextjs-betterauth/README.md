# Orbit Auth Example (Next.js)

This is a simple Next.js app that authenticates against the Orbit Auth server using OAuth.

> This example is for development/testing. It assumes you have the auth server running locally.

## Run locally

### 1) Configure env

Copy `.env.example` to `.env.local` and set:

- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET` (optional for public clients)
- `OAUTH_DISCOVERY_URL` (local: `http://localhost:5000/.well-known/openid-configuration`)
- `NEXT_PUBLIC_AUTH_BASE_URL` (local: `http://localhost:5000`)

### 2) Start dev server

```bash
cd apps/examples/nextjs-betterauth
bun install
npm run dev
```

Open `http://localhost:3000`.

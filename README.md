# Orbit Auth (Early Alpha)

Orbit Auth is a self-hosted authentication server + OAuth 2.1 provider built on **TanStack Start** and **Better Auth**, with an SDK and example clients.

> [!WARNING]
> Early alpha / proof of concept.
> Do not use in production.
>
> Details: see [ALPHA.md](./ALPHA.md).

## What’s in this repo

- `apps/auth`: the auth server (TanStack Start admin dashboard, OAuth provider, user management)
- `packages/auth-sdk`: Orbit Auth SDK (core + React helpers)
- `apps/examples/nextjs-betterauth`: Next.js example client
- `apps/examples/react`: React (Vite) example client
- `apps/docs`: documentation site

## Quickstart (local)

### 1) Install dependencies

```bash
bun install
```

### 2) Configure the auth server

Copy `apps/auth/.env.example` to `apps/auth/.env.local`.

Required:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` (use a long random value)
- `BETTER_AUTH_URL` (local: `http://localhost:5000`)

Optional:

- `TRUSTED_ORIGINS` (comma-separated origins allowed to call the auth server)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for Google sign-in)

### 3) Migrate + seed

From `apps/auth`:

```bash
bun run db:migrate
bun run seed
```

### 4) Run the auth server

From repo root:

```bash
bun run dev:auth
```

Open:

- Auth server: `http://localhost:5000`
- Admin: `http://localhost:5000/admin`
- Global settings: `http://localhost:5000/admin/settings`

### 5) Create an OAuth client

In the auth server admin UI:

- Admin → OAuth Clients → Create Client

### 6) Run an example client

#### Next.js example

```bash
bun run dev:example-nextjs-betterauth
```

#### React example

```bash
bun run dev:example-react
```

## Docs

Start the docs site:

```bash
bun run dev:docs
```

## Contributing / Security

- See [CONTRIBUTING.md](./CONTRIBUTING.md)
- See [SECURITY.md](./SECURITY.md)

## Known limitations (alpha)

- Breaking changes may happen without notice
- Branding is limited (name + show/hide built-in logo; no uploads yet)
- Social providers require host-level env configuration (no dashboard secrets yet)

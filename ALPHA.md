# Orbit Auth — Alpha Status

Orbit Auth is currently an **early alpha** proof of concept.

**Do not use this project in production** (even if it appears to work).

## What “alpha” means here

- Breaking changes can happen without notice (APIs, database schema, UI)
- Security hardening is incomplete
- Upgrade and migration paths are not guaranteed
- Behavior and defaults may change frequently

## Data and security expectations

- Treat your database as non-stable: schema and data layout may change
- Avoid storing real user data
- Never commit secrets (`.env*` files are ignored by git)
- Prefer host-level secret managers for credentials (Vercel env, SST secrets, VPS env, etc.)

## Feature maturity

Some features are intentionally incomplete or simplified:

- Social providers (like Google) require server-side env configuration
- Branding is limited (name + show/hide built-in logo; no uploads yet)
- Admin UX and access control is evolving
- Observability (auditing, metrics) is minimal

## Feedback

- Bugs: open an issue with a minimal reproduction
- Security issues: see [SECURITY.md](./SECURITY.md)


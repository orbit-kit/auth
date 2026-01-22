# Contributing

Thanks for helping improve Orbit Auth.

## Local development

### Prerequisites

- Bun (recommended for the monorepo)
- Node.js (some workspace scripts use `npm`)
- Postgres (for `apps/auth`)

### Install

```bash
bun install
```

### Run the auth server

```bash
npm run dev:auth
```

### Run docs

```bash
npm run dev:docs
```

### Run example clients

```bash
npm run dev:example-nextjs-betterauth
npm run dev:example-react
```

## Code quality

Typecheck:

```bash
npm run check-types
```

Build:

```bash
npm run build
```

## Pull requests

- Keep PRs small and focused
- Include screenshots for UI changes
- Avoid committing secrets (`.env*` files are ignored)


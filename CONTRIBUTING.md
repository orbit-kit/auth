# Contributing

Thanks for helping improve Orbit Auth.

## Local development

### Prerequisites

- Bun
- Postgres (for `apps/auth`)

### Install

```bash
bun install
```

### Run the auth server

```bash
bun run dev:auth
```

### Run docs

```bash
bun run dev:docs
```

### Run example clients

```bash
bun run dev:example-nextjs-betterauth
bun run dev:example-react
```

## Code quality

Typecheck:

```bash
bun run check-types
```

Build:

```bash
bun run build
```

## Pull requests

- Keep PRs small and focused
- Include screenshots for UI changes
- Avoid committing secrets (`.env*` files are ignored)

# Releasing (alpha)

This project is early alpha; releases are lightweight.

## Pre-flight checklist

- Run typecheck: `npm run check-types`
- Run build: `npm run build`
- Verify docs build: `npm run build --filter=./apps/docs` (or `cd apps/docs && npm run build`)
- Scan for secrets: ensure no `.env*` is committed and no credentials appear in docs

## Versioning

Use pre-release versions for alpha (example: `0.1.0-alpha.1`).


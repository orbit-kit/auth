# Releasing (alpha)

This project is early alpha; releases are lightweight.

## Pre-flight checklist

- Run typecheck: `bun run check-types`
- Run build: `bun run build`
- Verify docs build: `cd apps/docs && bun run build`
- Scan for secrets: ensure no `.env*` is committed and no credentials appear in docs

## Versioning

Use pre-release versions for alpha (example: `0.1.0-alpha.1`).

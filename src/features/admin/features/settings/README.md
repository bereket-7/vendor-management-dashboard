# Settings module

List-only admin module with mock data until NestJS settings endpoints exist.

## Env

- `NEXT_PUBLIC_USE_MOCK=true` — in-memory list (no silent fallback when unset)

## When NestJS is ready

1. Implement `GET /api/admin/settings/`.
2. Unset `NEXT_PUBLIC_USE_MOCK`.
3. Extend with edit flows following [Groups](../groups/README.md).

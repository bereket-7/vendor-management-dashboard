# Roles module

List-only admin module with mock data until NestJS role endpoints exist.

## Env

- `NEXT_PUBLIC_USE_MOCK=true` — in-memory list (no silent fallback when unset)

## When NestJS is ready

1. Implement `GET /api/admin/roles/`.
2. Unset `NEXT_PUBLIC_USE_MOCK`.
3. Extend with CRUD following [Groups](../groups/README.md).

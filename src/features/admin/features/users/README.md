# Users module

List-only admin module with mock data until NestJS user endpoints exist.

## Env

- `NEXT_PUBLIC_USE_MOCK=true` — in-memory list (no silent fallback when unset)

## Structure

Follows the Groups module layout: `dto/`, `types/`, `service/api/`, `service/mappers/`, `service/queries/`, `pages/`, `components/`.

## When NestJS is ready

1. Implement `GET /api/admin/users/` matching [`user.endpoints.ts`](service/api/user.endpoints.ts).
2. Unset `NEXT_PUBLIC_USE_MOCK`.
3. Extend with create/edit following [Groups](../groups/README.md).

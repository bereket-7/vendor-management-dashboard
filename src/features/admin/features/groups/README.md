# Groups module

Reference implementation of the modular feature standard (`src/features/<domain>/features/<feature>/`).

## Layers

| Layer          | Location                                      | Rules                                        |
| -------------- | --------------------------------------------- | -------------------------------------------- |
| UI             | `pages/`, `components/`, `hooks/`             | Consumes `GroupModel` only — never DTOs      |
| Application    | `service/queries/`, `mutations/`, `commands/` | Orchestrates use cases; TanStack Query today |
| Infrastructure | `service/api/`, `dto/`                        | Transport + raw API shapes                   |
| Domain         | `types/`, `validation/`, `service/mappers/`   | Stable contracts + Zod                       |

## Data flow

### Read (current)

1. `group.api.list()` fetches DTOs from the API, or mock data when `NEXT_PUBLIC_USE_MOCK_GROUPS=true` (no silent fallback when unset).
2. `group.mapper` validates/maps to `GroupModel`.
3. UI reads via `useGroupsList()` / `useGroup(groupId)` (Dexie live query when offline layer is enabled).

### Read (when Dexie is added)

1. Query hydrates remote DTOs → mapper → Dexie cache.
2. UI reads from Dexie live query only.
3. Expose `isInitialLoading`, `isRefreshing`, `hasSyncErrors` (already on list hook).

### Write (current)

1. Form → `groupBusinessSchema` → `CreateGroupCommand` → `GroupCreateDto`.
2. `createGroupCommand` → API.
3. Invalidate TanStack Query keys.

### Write (when sync queue is added)

1. Optimistic insert with `syncStatus: pending`.
2. Enqueue sync job in `group.command.ts`.
3. Reconcile local/server IDs in sync worker.

## Routes

- `/[locale]/admin/groups` — list
- `/[locale]/admin/groups/create` — create
- `/[locale]/admin/groups/[groupId]` — detail (ID-driven, not row pass-through)
- `/[locale]/admin/groups/[groupId]/edit` — edit

## Env

- `NEXT_PUBLIC_USE_MOCK_GROUPS=true` — use mock data instead of the API (no silent fallback when unset)

## Tests

```bash
pnpm test -- group
```

## API contract

Live Django: `GET/POST/PATCH/DELETE /api/v1/identity-groups/` via `vendorCoreApi` / `groupApi` (JWT).  
Mock: `NEXT_PUBLIC_USE_MOCK_GROUPS=true`.

Deprecated Nest scaffold path `/api/admin/identity-groups/` — do not use.

See monorepo [`docs/api/dashboard-endpoints.md`](../../../../../../docs/api/dashboard-endpoints.md).


## Offline (Dexie)

- IndexedDB cache + sync queue under `offline/` and `src/lib/offline/`
- Commands write optimistically; sync worker calls `group.api` when online

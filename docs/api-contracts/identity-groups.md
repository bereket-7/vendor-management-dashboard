# Identity Groups API contract

NestJS (or any REST backend) should implement these endpoints so the Next.js frontend can disable mocks (`NEXT_PUBLIC_USE_MOCK_GROUPS` unset).

**Implemented on Django:** `GET/POST/PATCH/DELETE /api/v1/identity-groups/` — dashboard `groupApi` uses `vendorCoreFetch` + JWT. Nest `/api/admin/identity-groups/` is deprecated.

Base URL: `{NEXT_PUBLIC_VENDOR_CORE_API_URL}` (e.g. `http://localhost:8010`) for live cutover.

Auth: JWT Bearer from `POST /api/v1/authentication/token/` (session cookie Nest path is legacy).


## Endpoints

| Method   | Path                               | Frontend usage |
| -------- | ---------------------------------- | -------------- |
| `GET`    | `/api/admin/identity-groups/`      | List groups    |
| `GET`    | `/api/admin/identity-groups/{id}/` | Group detail   |
| `POST`   | `/api/admin/identity-groups/`      | Create group   |
| `PATCH`  | `/api/admin/identity-groups/{id}/` | Update group   |
| `DELETE` | `/api/admin/identity-groups/{id}/` | Delete group   |

Source: [`src/features/admin/features/groups/service/api/group.endpoints.ts`](../../src/features/admin/features/groups/service/api/group.endpoints.ts)

## List response

Either a JSON array of group objects, or a paginated wrapper:

```json
{
	"results": [
		/* ApiIdentityGroupDto[] */
	],
	"count": 2
}
```

## ApiIdentityGroupDto (read)

| Field             | Type                                    | Notes                         |
| ----------------- | --------------------------------------- | ----------------------------- |
| `id`              | string \| number                        | Required in responses         |
| `name`            | string                                  | Required                      |
| `description`     | string \| null                          |                               |
| `membership_mode` | `"enumerated"` \| `"definitional"`      |                               |
| `members`         | array                                   | See member DTO below          |
| `characteristics` | array                                   | See characteristic DTO below  |
| `period_start`    | ISO date string \| null                 |                               |
| `period_end`      | ISO date string \| null                 |                               |
| `is_active`       | boolean                                 | Default `true`                |
| `sync_status`     | `"synced"` \| `"pending"` \| `"failed"` | Optional; used for offline UI |
| `updated_at`      | ISO datetime string                     |                               |

### Member (read)

| Field          | Type              |
| -------------- | ----------------- |
| `id`           | string (optional) |
| `external_id`  | string \| null    |
| `display_name` | string            |
| `role`         | string \| null    |

### Characteristic (read)

| Field      | Type                                              |
| ---------- | ------------------------------------------------- |
| `id`       | string (optional)                                 |
| `key`      | string                                            |
| `operator` | `"eq"` \| `"neq"` \| `"in"` \| `"gte"` \| `"lte"` |
| `value`    | string \| number \| string[]                      |

## GroupCreateDto (write — POST)

| Field             | Type                        | Required |
| ----------------- | --------------------------- | -------- |
| `name`            | string                      | yes      |
| `description`     | string \| null              | no       |
| `membership_mode` | string                      | yes      |
| `members`         | ApiGroupMemberDto[]         | no       |
| `characteristics` | ApiGroupCharacteristicDto[] | no       |
| `period_start`    | string \| null              | no       |
| `period_end`      | string \| null              | no       |

## GroupUpdateDto (write — PATCH)

Partial `GroupCreateDto`.

## Errors

Return standard HTTP status codes. JSON error body should be parseable by the frontend [`ApiError`](../../src/lib/api/errors.ts) helper (message + optional field errors).

## Frontend cutover

1. Implement endpoints on NestJS matching this contract.
2. Set `NEXT_PUBLIC_API_URL` to the backend.
3. Remove or comment out `NEXT_PUBLIC_USE_MOCK_GROUPS` in `.env`.
4. Run admin Groups smoke: list → create → edit → delete.

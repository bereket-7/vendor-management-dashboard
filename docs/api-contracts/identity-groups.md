# Identity Groups API contract

**Live source of truth:** Django `/api/v1/identity-groups/` (JWT).  
Dashboard `groupApi` calls vendor-core when `NEXT_PUBLIC_USE_MOCK=false`. Nest `/api/admin/identity-groups/` is optional legacy.

Base URL: `{NEXT_PUBLIC_VENDOR_CORE_API_URL}` (e.g. `http://localhost:8010`) for live cutover.

Auth: JWT Bearer from `POST /api/v1/authentication/token/`.

## Endpoints

| Method   | Path                               | Frontend usage |
| -------- | ---------------------------------- | -------------- |
| `GET`    | `/api/v1/identity-groups/`         | List groups    |
| `GET`    | `/api/v1/identity-groups/{id}/`    | Group detail   |
| `POST`   | `/api/v1/identity-groups/`         | Create group   |
| `PATCH`  | `/api/v1/identity-groups/{id}/`    | Update group   |
| `DELETE` | `/api/v1/identity-groups/{id}/`    | Delete group   |

Source: [`src/features/admin/features/groups/service/api/group.endpoints.ts`](../../src/features/admin/features/groups/service/api/group.endpoints.ts) + [`vendorCoreApi`](../../src/lib/vendor-core/api.ts)

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

1. Point `NEXT_PUBLIC_VENDOR_CORE_API_URL` at Django vendor-core.
2. Set `NEXT_PUBLIC_USE_MOCK=false`.
3. Authenticate via `VendorCoreGate` (Django JWT).
4. Run admin Groups smoke: list → create → edit → delete.

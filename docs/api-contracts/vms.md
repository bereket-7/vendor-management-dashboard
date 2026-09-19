# VMS API contracts

**Live source of truth:** Django vendor-management-core `/api/v1/*` (JWT).  
NestJS `/api/admin/*` stubs remain optional for a future Nest cutover (`NEXT_PUBLIC_USE_NEST=true`).

Frontend uses `NEXT_PUBLIC_USE_MOCK` + [`src/features/shared/vms/mock-store.ts`](../../src/features/shared/vms/mock-store.ts) when mocks are on. When mocks are off, [`vmsApi`](../../src/features/shared/vms/api.ts) and [`vendorCoreApi`](../../src/lib/vendor-core/api.ts) call Django through `/api/vendor-core/*`.

## Resources (Django `/api/v1`)

| Resource               | Methods    | Notes                                          |
| ---------------------- | ---------- | ---------------------------------------------- |
| `/vendors/`            | GET, POST  | List + create                                  |
| `/vendors/:id/`        | GET, PATCH | Detail + status updates (incl. soft terminate) |
| `/vendors/invite/`     | POST       | Invite flow                                    |
| `/categories/`         | GET        | Taxonomy                                       |
| `/onboarding/`         | GET        | Queue                                          |
| `/onboarding/:id/`     | GET, PATCH | Checklist / approve / reject                   |
| `/documents/`          | GET, POST  | Optional `?vendor_id=`                         |
| `/documents/:id/`      | GET, PATCH |                                                |
| `/certificates/`       | GET        | Compliance board                               |
| `/contracts/`          | GET, POST  |                                                |
| `/contracts/:id/`      | GET, PATCH |                                                |
| `/rfx/`                | GET, POST  | RFI/RFP/RFQ                                    |
| `/rfx/:id/`            | GET, PATCH |                                                |
| `/rfx/:id/bids/`       | GET, POST  | Vendor bids                                    |
| `/purchase-orders/`    | GET, POST  |                                                |
| `/purchase-orders/:id/`| GET, PATCH |                                                |
| `/invoices/`           | GET, POST  |                                                |
| `/invoices/:id/`       | GET, PATCH |                                                |
| `/approvals/`          | GET        | Unified inbox                                  |
| `/approvals/:id/`      | PATCH      | Decide                                         |
| `/scorecards/`         | GET        | Performance                                    |
| `/notifications/`      | GET        | Ops notifications                              |
| `/notifications/:id/`  | PATCH      | Mark read                                      |
| `/vendor/me/`          | GET        | Current vendor org                             |
| `/vendor/team/`        | GET        | Vendor members                                 |
| `/identity-groups/`    | GET, POST  | Admin groups                                   |
| `/identity-groups/:id/`| GET, PATCH, DELETE |                                         |
| `/roles/`              | GET        |                                                |
| `/settings/`           | GET        |                                                |

Nest-oriented aliases under `/api/admin/...` match the same resource names if Nest is enabled.

## Auth

- **Django:** SimpleJWT (`POST /api/v1/authentication/token/`). Dashboard `VendorCoreGate` stores the access token.
- **Nest (optional):** Better Auth sessions. Roles on user: buyer set vs `vendor_*`. Nest must enforce ABAC; frontend policies are UI-only.

## Status enums

See [`src/features/shared/vms/types.ts`](../../src/features/shared/vms/types.ts).

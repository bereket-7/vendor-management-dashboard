# VMS API contracts (NestJS cutover stubs)

Frontend currently uses `NEXT_PUBLIC_USE_MOCK` + [`src/features/shared/vms/mock-store.ts`](../../src/features/shared/vms/mock-store.ts). Replace `vmsApi` remote paths when NestJS is ready.

## Resources

| Resource               | Methods    | Notes                                          |
| ---------------------- | ---------- | ---------------------------------------------- |
| `/vendors`             | GET, POST  | List + create                                  |
| `/vendors/:id`         | GET, PATCH | Detail + status updates                        |
| `/vendors/invite`      | POST       | `{ legalName, email, categories[] }` → invited |
| `/categories`          | GET        | Taxonomy                                       |
| `/onboarding`          | GET        | Queue                                          |
| `/onboarding/:id`      | GET, PATCH | Checklist / approve / reject                   |
| `/documents`           | GET, POST  | Optional `?vendorId=`                          |
| `/certificates`        | GET        | Compliance board                               |
| `/contracts`           | GET, POST  |                                                |
| `/contracts/:id`       | GET, PATCH | Approve → active                               |
| `/rfx`                 | GET, POST  | RFI/RFP/RFQ                                    |
| `/rfx/:id`             | GET, PATCH | Publish / award                                |
| `/rfx/:id/bids`        | GET, POST  | Vendor bids                                    |
| `/purchase-orders`     | GET, POST  |                                                |
| `/purchase-orders/:id` | GET, PATCH | Ack / receive                                  |
| `/invoices`            | GET, POST  |                                                |
| `/invoices/:id`        | GET, PATCH | Match / dispute / approve                      |
| `/approvals`           | GET        | Unified inbox                                  |
| `/approvals/:id`       | PATCH      | Decide                                         |
| `/scorecards`          | GET        | Performance                                    |
| `/notifications`       | GET        | Vendor portal                                  |
| `/vendor/me`           | GET        | Current vendor org                             |
| `/vendor/team`         | GET        | Vendor members                                 |

## Auth

Better Auth sessions. Roles on user: buyer set vs `vendor_*`. NestJS must enforce ABAC; frontend policies are UI-only.

## Status enums

See [`src/features/shared/vms/types.ts`](../../src/features/shared/vms/types.ts).

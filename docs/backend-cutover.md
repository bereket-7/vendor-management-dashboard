# Backend cutover checklist

When Django vendor-core (and optional NestJS) APIs are ready, switch the frontend from mocks to live data with **one env var**. Fixture source files are **not deleted** — they become inactive when the toggle is off.

## Source of truth

**Live contract:** Django [`services/vendor-management-core`](../../../services/vendor-management-core) under `/api/v1/*` (JWT SimpleJWT).

NestJS (`/api/auth/*`, `/api/admin/*`) remains **optional** (`NEXT_PUBLIC_USE_NEST=true`). It is **not** on [`https://api.vm.tillahealth.com`](https://api.vm.tillahealth.com). Prefer Django paths via the vendor-core client for procurement, identity groups, notifications, certificates, and claims lists.

REST shape (collection + detail):

| Action | Path |
|--------|------|
| List / create | `GET` / `POST` `/api/v1/<resource>/` |
| Retrieve / update | `GET` / `PATCH` `/api/v1/<resource>/{id}/` |
| Special actions | e.g. `/connections/{id}/test/`, `/errors/{id}/retry/` |

Do **not** use legacy `/list/` or `/create/` suffixes — those are not registered on Django.

## 1. Environment

### Django vendor-core live (recommended)

```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_USE_NEST=false
NEXT_PUBLIC_VENDOR_CORE_API_URL=https://api.vm.tillahealth.com
# or http://localhost:8010 for local Django
```

Browser calls go through the same-origin proxy at `/api/vendor-core/*` when the upstream host is remote (avoids CORS). Live screens prompt for a Django JWT user.

### NestJS + vendor-core both live

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://app.your-domain.com
NEXT_PUBLIC_URL=https://app.your-domain.com
NEXT_PUBLIC_VENDOR_CORE_API_URL=https://vendor-core.your-domain.com
NEXT_PUBLIC_USE_NEST=true
NEXT_PUBLIC_USE_MOCK=false
```

### Fixtures only (default)

```env
NEXT_PUBLIC_USE_MOCK=true
```

Smoke test:

```bash
pnpm test:vendor-core
VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm test:vendor-core
```

Seed Phase‑1 demo data (vendors/accounts/connections/jobs) when create APIs exist:

```bash
VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core
```

Note: `/seed/` endpoints and claim-line writes are **not** on current Django — seed scripts that call them will report 501 / not deployed.

## 2. Verify contracts

- Django OpenAPI: `{VENDOR_CORE}/docs/` (admin session)
- Postman: `services/vendor-management-core/postman/vendor_management_core_all_apis.postman_collection.json`
- Frontend client: [`src/lib/vendor-core/api.ts`](../src/lib/vendor-core/api.ts)
- Identity groups: Django `/api/v1/identity-groups/` (see [identity-groups.md](./api-contracts/identity-groups.md))
- VMS procurement: Django `/api/v1/{onboarding,documents,contracts,rfx,…}/` (see [vms.md](./api-contracts/vms.md))

## 3. Smoke tests

| Flow         | Route                                                   |
| ------------ | ------------------------------------------------------- |
| Login        | `/{locale}/auth/login`                                  |
| Groups list  | `/{locale}/admin/groups`                                |
| Integration  | `/{locale}/admin/integration` (vendor-core JWT)         |
| Vendors      | `/{locale}/admin/vendors`                               |
| Notifications| `/{locale}/admin/notifications`                         |
| Claims list  | `/{locale}/admin/claim-encounter/claims`                |

## 4. UI prototypes (no Django HTTP yet)

Nav items marked `prototype: true` (sidebar shows a **UI** badge) still use fixtures or empty live states:

- Command Center, Automations, SLA Monitoring, Vendor Comparison
- Reports, Edge Server Data, Master Data Entry, Error Correction
- Claims regulatory / program-monitoring pages
- Outbound vendor files, Acceptance Analytics (claims)

Backend models may exist (e.g. ops `activity_event`, `automation_rule`) without routes.

## 5. Soft-delete note

Vendor “delete” in live mode maps to `PATCH /vendors/{id}/` with `status=terminated`. Hard-delete is not exposed. Restore maps to `status=prospect`.

## 6. Rollback

Set `NEXT_PUBLIC_USE_MOCK=true` and restart to isolate frontend issues without changing code.

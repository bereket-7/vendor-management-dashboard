# Backend cutover checklist

When your NestJS (and optional Django vendor-core) APIs are ready, switch the frontend from mocks to live data with **one env var**. Fixture source files are **not deleted** — they become inactive when the toggle is off.

## 1. Environment

### NestJS + vendor-core both live

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://app.your-domain.com
NEXT_PUBLIC_URL=https://app.your-domain.com
NEXT_PUBLIC_VENDOR_CORE_API_URL=https://vendor-core.your-domain.com

# Single switch — turns off all mocks (auth, VMS, identity, feature APIs)
NEXT_PUBLIC_USE_MOCK=false
```

### Vendor-core only (current staging)

[`https://api.vm.tillahealth.com`](https://api.vm.tillahealth.com) is **Django vendor-core** (JWT + `/api/v1/*`).  
Django admin UI: [`/admin/`](https://api.vm.tillahealth.com/admin/) — do **not** put `/admin/` in the API base URL.  
NestJS (`/api/auth/*`, `/api/admin/*`) is **not** on this host.

```env
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_VENDOR_CORE_API_URL=https://api.vm.tillahealth.com
```

A remote `NEXT_PUBLIC_VENDOR_CORE_API_URL` enables Integration Intake **and** the
integration nav screens (Vendors, File monitoring/history, Processing status,
Schedules, Errors, Audit) against Django while Nest/VMS stay mocked.

Live screens prompt for a Django JWT user (same credentials as Django admin).
Browser calls go through the same-origin proxy at `/api/vendor-core/*` (avoids CORS).

Smoke test:

```bash
pnpm test:vendor-core
VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm test:vendor-core
```

Seed Phase‑1 demo data from frontend mocks (vendors/accounts/connections/jobs/sample files) into the API DB — **no backend deploy**:

```bash
VENDOR_CORE_USER=… VENDOR_CORE_PASSWORD=… pnpm seed:vendor-core
```

## 2. Verify contracts

- [Identity groups](./api-contracts/identity-groups.md) — required for admin Groups CRUD
- [VMS domain](./api-contracts/vms.md) — vendors, onboarding, RFX, contracts, POs, invoices
- Users: `GET /api/admin/users/`
- Roles: `GET /api/admin/roles/`
- Settings: `GET /api/admin/settings/`
- Feature modules: `GET /api/admin/<module>/` (members, providers, file-management, claim-encounter, …)

## 3. Smoke tests

| Flow         | Route                                                   |
| ------------ | ------------------------------------------------------- |
| Login        | `/{locale}/auth/login`                                  |
| Groups list  | `/{locale}/admin/groups`                                |
| Create group | `/{locale}/admin/groups/create`                         |
| Edit group   | `/{locale}/admin/groups/{id}/edit`                      |
| Delete group | From groups table                                       |
| Integration  | `/{locale}/admin/integration` (vendor-core JWT)         |
| Offline sync | Create while offline → reconnect → pending badge clears |

## 4. CORS and auth

See [api-contracts/README.md](./api-contracts/README.md) for CORS and Better Auth trusted origins.

## 5. Rollback

Set `NEXT_PUBLIC_USE_MOCK=true` and restart to isolate frontend issues without changing code.

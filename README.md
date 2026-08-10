# Tilla VMS

Admin-only enterprise **Vendor Management System**. Data and auth run on **mocks by default** — no NestJS backend required.

Open [http://localhost:3006/en](http://localhost:3006/en) for the dashboard.

## Getting started

```bash
cp .env.example .env
pnpm install
pnpm dev -p 3006
```

### Mock vs live (one switch)

| Variable               | Role                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_USE_MOCK` | `true` = fixtures on; `false` = live APIs (fixtures stay in source) |

```env
# Demo / local UI without backends
NEXT_PUBLIC_USE_MOCK=true

# Live NestJS + local vendor-core
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_VENDOR_CORE_API_URL=http://localhost:8010

# Staging vendor-core (Nest can stay mocked only if USE_MOCK=true)
# Admin UI: https://api.vm.tillahealth.com/admin/
NEXT_PUBLIC_VENDOR_CORE_API_URL=https://api.vm.tillahealth.com
```

Toggle mocks without deleting fixture files — set `NEXT_PUBLIC_USE_MOCK` and restart `pnpm dev`.
Remote vendor-core browser traffic is proxied via `/api/vendor-core/*`. Smoke: `pnpm test:vendor-core`.

Optional: `NEXT_PUBLIC_DEV_ADMIN=true` for client ABAC admin role while developing.

## Modules

Dashboard, Vendors, Members, Providers, Integration Intake, File ops, Claims & Encounters, Reports, Users/Roles/Groups/Settings, and more.

See [docs/vms-ia.md](docs/vms-ia.md) and [docs/backend-cutover.md](docs/backend-cutover.md).

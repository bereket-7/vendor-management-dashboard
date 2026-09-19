# FE/BE alignment notes (vendor-core)

## Implemented in this cut

1. Frontend `vendorCoreEndpoints` use Django REST collection/detail paths (no `/list|/create|/update` suffixes).
2. Procurement, certificates, notifications, identity groups, categories, claim vendor-files / responses / exceptions call Django when `NEXT_PUBLIC_USE_MOCK=false`.
3. Vendor soft-delete → `PATCH` status `terminated`; restore → `prospect`. Hard-delete and seed/write claim APIs throw 501 until backend adds them.
4. Nav `prototype: true` marks UI-only surfaces (regulatory, program monitoring, EDGE, automations, etc.).

## Remaining backend gaps (by design)

| Gap | UI | Suggested next API |
|-----|----|--------------------|
| Activity feed | Command Center | `GET /activities/` |
| Automation rules | Automations | `GET/POST /automations/` |
| Claim line writes | Claims CRUD | `POST/PATCH /claim-lines/` |
| Member/provider create+seed | Seed buttons | create + optional seed endpoints |
| Hard-delete vendors | Vendor menu | dedicated delete if product requires |
| Regulatory / EDGE / HEDIS | Claims regulatory nav | new domains |

Models may already exist under `core/ops`, `core/compliance`, `core/files` without HTTP routes.

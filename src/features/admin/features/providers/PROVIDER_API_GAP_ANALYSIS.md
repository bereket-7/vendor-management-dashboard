# Provider API — backend surface vs frontend wiring

**Date:** 2026-09-01  
**Backend ref:** remote `vendor-management-core` `core/providers/` (no local backend changes)  
**Frontend:** `vendor-management` provider feature  
**Detail-page gaps:** see [PROVIDER_DETAIL_FRONTEND_GAPS.md](./PROVIDER_DETAIL_FRONTEND_GAPS.md)

---

## Integrated (live)

| Area | Status |
|------|--------|
| List + dashboard stats | Wired |
| Create / update / status / delete / restore (list) | Wired |
| Detail: profile, summary, tabs (locations, identifiers, networks, credentials, exceptions, vendor-sources) | Wired |
| **Claims analytics** (`monthly-volume`, `rejection-reasons`, `recent/list`) | **Wired** in `getProviderDetail()` |
| Summary trend % (`claims_trend_pct`, etc.) | **Wired** from `GET …/summary/` |
| Vendor-sources `data_sent`, `frequency`, `status` | **Wired** in `mapVendorSources()` |

---

## Remote-backend dependency (not local)

| Area | Status |
|------|--------|
| List row `claims12m` / `paid12m` / `rejection_rate` | **Not on list API** — `providersToSummaries()` shows `0` until remote backend adds list KPI embed |

---

## Client available (no dedicated UI yet)

| Endpoint group | Client (`vendorCoreApi`) |
|----------------|--------------------------|
| Sub-resource CRUD (locations, networks, credentials, exceptions) | `create/update/delete*` methods |
| Identifier delete | `deleteProviderIdentifier` |
| Hard delete provider / roster | `hardDeleteProvider`, `hardDeleteProviderRoster` |
| Roster providers list | `listProviderRosterProviders` |

Detail tabs remain read-only; see [PROVIDER_DETAIL_FRONTEND_GAPS.md](./PROVIDER_DETAIL_FRONTEND_GAPS.md) for frontend-only follow-ups.

---

## Optional follow-ups (frontend only)

- Demographics mapping on detail (`preferred_name`, `preferred_language`, `race`, `ethnicity`)
- Inline edit UI for tab sub-resources
- Roster drill-down drawer using `listProviderRosterProviders`
- Restore / hard-delete on detail page
- Seed button on Providers page (mutation exists)

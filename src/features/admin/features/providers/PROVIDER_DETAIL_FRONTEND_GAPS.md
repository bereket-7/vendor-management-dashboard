# Provider detail page — frontend gap analysis

**Date:** 2026-09-03 (updated)  
**Scope:** `ProviderDetailPage.tsx` and its data path only (not Vendor entity pages).  
**Policy:** Integrate against **remote** `vendor-management-core` APIs. **No local backend changes.**

**Related:** [PROVIDER_API_GAP_ANALYSIS.md](./PROVIDER_API_GAP_ANALYSIS.md)

---

## Done (2026-09-03)

| Area                                                          | Where to check                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| List KPI cards (`…/stats/`)                                   | `/admin/providers` — Total / Active / Pending / Termed / Inactive       |
| Seed demo button                                              | `/admin/providers` header (live mode)                                   |
| Demographics preferred name / language / race / ethnicity     | Detail → **Demographics**                                               |
| Identifiers / Locations / Networks / Credentials / Exceptions | Detail tabs — pill **Add** + row **Edit** / trash **Delete**            |
| Section CRUD (wizard chrome, 1 step)                          | `/admin/providers/:id/edit?section=locations` (+ optional `&itemId=`)   |
| Claims analytics (read)                                       | Detail → **Claims & Encounters**, **Rejection Trends**, Overview charts |
| Partial load banner                                           | Detail — amber banner if a tab fetch fails                              |
| Restore / hard delete                                         | Detail → **Lifecycle** menu                                             |

---

## Still open / non-goals

| Gap                                      | Notes                                                  |
| ---------------------------------------- | ------------------------------------------------------ |
| List row `claims12m` / `paid12m` often 0 | Remote list serializer has no KPI embed — wait on BE   |
| Roster drill-down drawer                 | `listProviderRosterProviders` client exists; no UI yet |
| Export / Provider Summary menus          | Toast stubs only                                       |
| Enrollment tab write                     | Use **Edit** page / profile PATCH                      |

---

## Files touched

- `pages/provider-detail-actions.tsx`, `pages/provider-section-editor.tsx`
- `pages/ProviderDetailPage.tsx`, `pages/ProviderEditPage.tsx`, `pages/ProvidersPage.tsx`
- `feature/api/providersApi.ts`, `feature/queries/useProvidersQuery.ts`
- `live-providers.ts`, `mock-data.ts`
- `src/lib/vendor-core/types.ts`, `api.ts`

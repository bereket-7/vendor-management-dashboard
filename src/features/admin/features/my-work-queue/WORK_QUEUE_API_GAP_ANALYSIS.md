# TPA/TPV Tracking — Frontend / Backend Integration Gaps

**Date:** 2026-08-31 (updated after backend `3628536`)  
**Audience:** Backend + frontend teams  
**Frontend:** `src/features/admin/features/my-work-queue/`  
**Backend app:** `core/work_queue/`  
**Routes:** `/admin/my-work-queue`, `/admin/my-work-queue/[caseId]`

The My Work Queue UI is **live-only** and wired to `vendor-core` APIs. Backend commit `3628536` (`feat: enhance audit and vendor management features`) ships progress, escalation, and extended KPIs. This document tracks **remaining** gaps after the latest frontend wiring pass.

---

## Summary

| Area                                                               | Frontend                        | Backend (`3628536`)                   | Status             |
| ------------------------------------------------------------------ | ------------------------------- | ------------------------------------- | ------------------ |
| List / detail / CRUD / status / assign / registration              | **Done**                        | Supported                             | **Ready**          |
| SFTP / EDI progress read + save                                    | **Done**                        | PATCH + JSON storage on case          | **Ready**          |
| Escalation field, filter, manual set                               | **Done**                        | Field + filter + `POST …/escalation/` | **Ready**          |
| Extended KPIs (`escalations`, `sftp_completion`, `edi_completion`) | **Done**                        | `GET work-queue/kpis/`                | **Ready**          |
| CSV import + import error dialog                                   | **Done**                        | `POST work-queue/import/`             | **Ready**          |
| Documents list / upload / delete (detail tab)                      | **Done**                        | Upload + list + soft-delete           | **Ready**          |
| EDI Analyst Progress + Escalation Summary panels                   | Client rollups (first 100 rows) | No aggregate endpoint                 | **Optional**       |
| Wave-scoped SFTP/EDI summary cards                                 | Client rollup when wave ≠ all   | Global KPIs only                      | **Optional**       |
| Whitelist update, mark-\* shortcuts, case delete                   | Not in UI                       | Endpoints exist                       | **Optional**       |
| List filters: `whitelist_status`, `current_stage`, `vendor_id`     | Not in UI                       | Supported on list API                 | **Optional**       |
| Responsive mobile table                                            | Partial                         | N/A                                   | P2 (frontend only) |

---

## Live mode today

| Feature                           | Behavior                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| Progress bars (list + detail)     | From API `sftp_progress` / `edi_progress`; empty template only when backend returns no milestones |
| Save SFTP / EDI progress          | Detail tabs → `PATCH …/sftp-progress/update/` / `…/edi-progress/update/`                          |
| Escalation column + filter        | API `escalation_status` on rows; list filter passes `escalation_status` query param               |
| KPI “Escalations” card            | From `kpis.escalations`                                                                           |
| Top SFTP/EDI summary (wave = all) | From `kpis.sftp_completion` / `edi_completion` when present                                       |
| Manual escalation                 | Migration tab → `POST …/escalation/` on save                                                      |
| Documents                         | Detail **Documents** tab: list, upload, remove                                                    |
| Analyst / escalation panels       | Roll up first 100 cases client-side; status-estimated note hidden when any row has milestone data |

---

## Backend capabilities (shipped)

`MigrationCase` + `core/work_queue/` APIs include:

| Capability                    | Method   | Path                                                                            |
| ----------------------------- | -------- | ------------------------------------------------------------------------------- |
| Progress read (list + detail) | —        | `sftp_progress`, `edi_progress` on case DTO                                     |
| SFTP progress update          | PATCH    | `/api/v1/migration-cases/<uuid:id>/sftp-progress/update/`                       |
| EDI progress update           | PATCH    | `/api/v1/migration-cases/<uuid:id>/edi-progress/update/`                        |
| Escalation read + filter      | GET list | `escalation_status` field + query filter                                        |
| Escalation manual set         | POST     | `/api/v1/migration-cases/<uuid:id>/escalation/`                                 |
| Extended KPIs                 | GET      | `/api/v1/work-queue/kpis/` (`escalations`, `sftp_completion`, `edi_completion`) |
| Documents list                | GET      | `/api/v1/migration-cases/<uuid:id>/documents/list/`                             |
| Document upload               | POST     | `…/documents/upload/`                                                           |
| Document soft-delete          | POST     | `…/documents/<uuid:doc_id>/delete/`                                             |

**List query params supported:** `search`, `migration_status`, `assigned_to_id`, `vendor_id`, `wave`, `whitelist_status`, `current_stage`, `escalation_status`, `limit`, `offset`, ordering.

---

## Frontend integration map

| Backend API                     | Frontend file                                                             | Status                                      |
| ------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| `GET migration-cases/list/`     | `MyWorkQueuePage` — server pagination + filters incl. `escalation_status` | Wired                                       |
| `GET migration-cases/<id>/`     | `WorkQueueDetailPage`                                                     | Wired                                       |
| `PATCH …/sftp-progress/update/` | Detail SFTP tab                                                           | Wired                                       |
| `PATCH …/edi-progress/update/`  | Detail EDI tab                                                            | Wired                                       |
| `POST …/escalation/`            | Migration tab escalation picker                                           | Wired                                       |
| `GET work-queue/kpis/`          | KPI cards + top progress summary                                          | Wired                                       |
| `GET …/documents/list/`         | Detail Documents tab                                                      | Wired                                       |
| `POST …/documents/upload/`      | List feed upload + detail Documents tab                                   | Wired                                       |
| `POST …/documents/<id>/delete/` | Detail Documents tab                                                      | Wired                                       |
| `POST …/whitelist/`             | —                                                                         | **Not wired**                               |
| `POST …/mark-*`                 | —                                                                         | **Not wired** (generic status used instead) |
| `POST …/delete/` (case)         | —                                                                         | **Not wired**                               |

---

## Remaining optional gaps

### Backend (nice-to-have)

- Analyst-level or wave-scoped KPI / progress summary endpoint (avoid client rollups over limit-100 list)
- Document restore / hard-delete UI if admins need recycle bin

### Frontend (nice-to-have)

- Whitelist status update via `POST …/whitelist/`
- Dedicated mark-\* lifecycle buttons (or remove unused mutations in `useWorkQueueQuery.ts`)
- Case soft-delete / restore on detail page
- List filters for `whitelist_status`, `current_stage`, `vendor_id`
- Mobile card layout for main table (P2)

---

## Integration test matrix

| #   | Test                   | Pass criteria                                                  |
| --- | ---------------------- | -------------------------------------------------------------- |
| 1   | Register new TPA/TPV   | Dialog submit → case in list → detail opens                    |
| 2   | Assign analyst         | Migration tab → save → list shows analyst name                 |
| 3   | Update SFTP milestones | Detail SFTP tab → save → list bar updates → persists refresh   |
| 4   | Update EDI milestones  | Blocked until SFTP 100%; then save works                       |
| 5   | Status change          | Bulk + detail status → KPI cards update                        |
| 6   | Escalation filter      | Set escalation on case → server filter → KPI escalations count |
| 7   | Search / pagination    | Server returns filtered page; counts match                     |
| 8   | No mock overlay        | Live mode: progress/escalation from API                        |
| 9   | Import CSV             | Import flow + row errors dialog                                |
| 10  | History                | Progress/status changes in events tab                          |
| 11  | Documents              | Upload on detail → list shows file → remove works              |

---

## Key frontend files

| File                                           | Role                                            |
| ---------------------------------------------- | ----------------------------------------------- |
| `pages/MyWorkQueuePage.tsx`                    | Dashboard, server filters, KPIs, registration   |
| `pages/WorkQueueDetailPage.tsx`                | Tabs incl. documents, progress save, escalation |
| `feature/mappers/workQueueMappers.ts`          | DTO → UI row; API escalation + progress         |
| `feature/api/workQueueApi.ts`                  | Feature API layer                               |
| `work-queue-analyst-escalation.ts`             | Analyst/escalation panel rollups (client)       |
| `components/work-queue-analyst-escalation.tsx` | Analyst + escalation UI panels                  |

---

## Open questions for product

1. Should **whitelist** / **last communication** stay on the case, or map fully to SFTP milestones?
2. Wave-scoped summary cards: client rollup OK or need backend KPI filter by `wave`?
3. Who can manually set escalation vs server-only auto-derive?
4. Should case delete/restore be exposed in the admin UI?

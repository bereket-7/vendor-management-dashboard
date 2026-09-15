# Inbound Vendor Files — backend gaps (missing endpoints)

**Audience:** Backend (`vendor-management-core`) implementers  
**Date:** 2026-09-12 (updated after FE wire of Accept/Reject / summary / export / reprocess / events / exception assign-resolve)

**Policy:** After the FE live-wire pass, this doc lists **only** what core still lacks for product-complete Inbound Vendor Files. Do **not** rebuild endpoints already wired on FE.

**Ops — Accept/Reject live 404 on remote:** If FE posts UUID accept/reject and `api.vm.tillahealth.com` returns 404 while list/detail work, that is a **deploy lag**, not a missing FE or missing local-core API. See full issue analysis + smoke checklist:

→ [`CLAIM_VENDOR_FILE_ACCEPT_REJECT_DEPLOY.md`](./CLAIM_VENDOR_FILE_ACCEPT_REJECT_DEPLOY.md)

**EDI segment viewer:** live download only (no Magellan fixture fallback) — [`EDI_LIVE_DOWNLOAD.md`](./EDI_LIVE_DOWNLOAD.md)

---

## FE wire update (2026-09-12) — review + queue + intake actions live

| Endpoint                                                  | Status for Inbound UI                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------- |
| `POST /api/v1/claim-vendor-files/{id}/accept/`            | **Wired on FE** — whole-file accept on review page                  |
| `POST /api/v1/claim-vendor-files/{id}/reject/`            | **Wired on FE** — whole-file reject (`reasons[]` strings + `notes`) |
| `GET /api/v1/claim-vendor-files/summary/`                 | **Wired on FE** — inbound queue KPI strip                           |
| `GET /api/v1/claim-vendor-files/export/csv/`              | **Wired on FE** — Export CSV on inbound queue                       |
| `POST /api/v1/inbound-files/{id}/reprocess/`              | **Wired on FE** — detail + review action bar                        |
| `GET /api/v1/inbound-files/{id}/events/`                  | **Wired on FE** — events panel on detail + review                   |
| `POST /api/v1/claim-exceptions/{id}/assign/`              | **Wired on FE** — Exceptions workbench assign / in-progress         |
| `POST /api/v1/claim-exceptions/{id}/resolve/`             | **Wired on FE** — Exceptions workbench resolve                      |
| `GET /api/v1/inbound-files/{id}/download/`                | **Wired on FE** — EDI viewer body                                   |
| `POST /api/v1/submission-batches/{id}/generate-outbound/` | BE exists; outbound package **list** KPIs still gap                 |

**Accept/Reject note:** BE is **file-level** (`notes` / `reasons` + `notes`). FE live buttons match that. Per-claim-line accept/reject remains mock-only.

---

## Purpose

Inbound Vendor Files UI now reads **and** writes:

- `GET /claim-vendor-files/list/` + `/{id}/` + `summary/` + `export/csv/`
- `POST /claim-vendor-files/{id}/accept|reject/`
- `GET /inbound-files/` + `/{id}/` + `download/` + `events/` + `POST …/reprocess/`
- `GET /intake/completion/edi/` + `GET /monitoring/` (best-effort KPI context)
- `GET /claim-exceptions/list/` + `POST …/assign|resolve/`
- `GET /claim-lines/list/?vendor_file_id=`

Still open BE work is mostly **serializer enrichment**, **outbound package list KPIs**, and optional **claim-line-level** review APIs if product needs them.

---

## Already wired on FE — do not rebuild

| Endpoint                                           | FE use                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET /claim-vendor-files/list/`                    | Inbound queue table, chips                                                                                  |
| `GET /claim-vendor-files/{id}/`                    | File detail + review header                                                                                 |
| `GET /claim-vendor-files/summary/`                 | Queue KPI strip                                                                                             |
| `GET /claim-vendor-files/export/csv/`              | Export CSV button                                                                                           |
| `POST /claim-vendor-files/{id}/accept/`            | Review Accept file                                                                                          |
| `POST /claim-vendor-files/{id}/reject/`            | Review Reject with reasons                                                                                  |
| `GET /inbound-files/` · `GET /inbound-files/{id}/` | Filename / stage / vendor enrich                                                                            |
| `GET /inbound-files/{id}/download/`                | EDI viewer body (live only; **no** fixture fallback — see [`EDI_LIVE_DOWNLOAD.md`](./EDI_LIVE_DOWNLOAD.md)) |
| `POST /inbound-files/{id}/reprocess/`              | Detail + review Reprocess                                                                                   |
| `GET /inbound-files/{id}/events/`                  | Detail + review Events panel                                                                                |
| `GET /intake/completion/edi/`                      | Best-effort snapshot field                                                                                  |
| `GET /monitoring/`                                 | Best-effort snapshot field                                                                                  |
| `GET /claim-lines/list/?vendor_file_id=`           | Claims on detail/review                                                                                     |
| `GET /claim-exceptions/list/`                      | Open exception count + Exceptions page live list                                                            |
| `POST /claim-exceptions/{id}/assign/`              | Assign / mark in progress                                                                                   |
| `POST /claim-exceptions/{id}/resolve/`             | Mark resolved                                                                                               |

---

## Remaining BE gaps

### P1 — List / detail field enrichment (serializer extend OK)

FE already maps what exists; sparse fields hurt UX:

| FE wants                      | Today                                    | Suggested                                                    |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `vendor` display name         | Often `—` unless batch embed             | Vendor compact on list/detail                                |
| `original_filename`           | Via second hop to inbound-file           | Include on vendor-file DTO when `source_inbound_file_id` set |
| `reviewStatus`                | Derived from `status` + `rejected_count` | Explicit `review_status` enum                                |
| Wait / SLA                    | FE uses `created_at`                     | `received_at` / `queued_at` if different from create         |
| `reviewed_at` / `reviewed_by` | May be sparse                            | Set/expose by accept/reject actions                          |

Extending serializers preferred over new endpoints when fields already live on models or cheap joins.

### P2 — Optional claim-line-level review

Product mock still supports selecting claim lines for accept/reject. Live BE is whole-file only. If product needs line-level:

```text
POST /api/v1/claim-vendor-files/{id}/accept/   # optional claim_line_ids[]
POST /api/v1/claim-vendor-files/{id}/reject/   # optional claim_line_ids[]
```

### P2 — Outbound package list KPIs

Inbound KPI cards **Accepted out** / **Denied out** show `—` in live with hint _“Outbound packages not in core yet.”_

Core has `POST /submission-batches/{id}/generate-outbound/` (generate, not list). If product still needs queue cards:

```text
GET /api/v1/claim-outbound-packages/list/   # or direction=outbound on vendor-files
GET /api/v1/claim-outbound-packages/{id}/
```

### Explicit non-goals

| Item                                    | Reality                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| `POST /claim-vendor-files/seed/`        | FE may call; **no** matching route (only `claim-lines/seed/`). Opposite gap. |
| Dedicated `GET …/stats/` or `…/facets/` | Prefer existing **`summary/`** — do not invent parallel stats.               |
| Legacy `integrations.InboundFile`       | No public API                                                                |

---

## Priority summary

| Priority | Work                                                                       |
| -------- | -------------------------------------------------------------------------- |
| **P1**   | Enrich vendor, filename, review_status, review audit fields on serializers |
| **P2**   | Optional claim-line-level accept/reject; outbound package **list** KPIs    |

---

## Explicit non-goals (this FE pass)

- Rebuilding Accept/Reject / summary / export / exception assign-resolve (already wired)
- Inventing `stats/` when `summary/` exists
- Rewriting Claims workbench / Responses pages beyond exception writes

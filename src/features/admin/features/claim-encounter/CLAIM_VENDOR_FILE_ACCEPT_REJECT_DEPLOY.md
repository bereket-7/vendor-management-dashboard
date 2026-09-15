# Claim vendor file Accept / Reject — remote 404 deploy gap

**Audience:** Backend / ops (`vendor-management-core` deploy)  
**Date:** 2026-09-12  
**Related:** [`INBOUND_VENDOR_FILES_BACKEND_GAPS.md`](./INBOUND_VENDOR_FILES_BACKEND_GAPS.md) · FE review page wires these routes already

---

## Symptom

Live MFC review **Accept** / **Reject** fail with upstream **404**, e.g.:

```text
POST https://api.vm.tillahealth.com/api/v1/claim-vendor-files/{uuid}/accept/
POST https://api.vm.tillahealth.com/api/v1/claim-vendor-files/{uuid}/reject/
```

Example UUID that loads on list/detail but 404s on accept:

`4e3c7293-e26a-4efc-bf43-47bfc516a3ed`

FE toast (via Next vendor-core proxy) looks like:

> Upstream returned 404 for …/claim-vendor-files/{uuid}/accept/. Deploy the matching vendor-management-core endpoint…

**Important:** Same UUID **does** load via `GET /claim-vendor-files/{uuid}/` and list. Claims app is mounted; **action routes are missing on the deployed API build** (or blocked before Django).

---

## Not the problem

| Hypothesis                                   | Why ruled out                                                                                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| FE sends `reference_id` (`VM-CVF-…`) in path | Fixed — live Accept/Reject use `file.id` (UUID). Path above already uses UUID.                                         |
| Wrong OpenAPI / path shape                   | Local core mounts `…/<uuid:id>/accept/` and `…/reject/` under `claim-vendor-files/`.                                   |
| Missing service logic in repo                | `claim_vendor_file_accept` / `claim_vendor_file_reject` exist in core `main` (commits `3b86b5d`, `d7f107c`, Sep 2026). |
| FE “needs rebuild” for Accept                | No further Accept/Reject FE change required once remote ships routes.                                                  |

---

## Root cause

**Deploy lag / stale image** on `api.vm.tillahealth.com` vs `vendor-management-core` `main` that already includes Accept / Reject.

```text
FE (.env → api.vm.tillahealth.com)
  → POST /api/v1/claim-vendor-files/{uuid}/accept/
  → remote API 404 (route not on running build)
```

Local / current repo **has** the endpoints:

| Layer    | Location                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------- |
| URLs     | `core/claims/urls.py` — `<uuid:id>/accept/` · `<uuid:id>/reject/`                                         |
| APIs     | `ClaimVendorFileAcceptApi` / `ClaimVendorFileRejectApi` in `core/claims/apis/claim_vendor_file/action.py` |
| Services | `claim_vendor_file_accept` / `claim_vendor_file_reject` in `core/claims/services/claim_vendor_file.py`    |

Less likely (verify after redeploy if still 404): reverse-proxy allowing only GET on that prefix.

---

## What BE / ops must fix

1. **Confirm running revision** includes Accept/Reject (`d7f107c` / `ClaimVendorFileAcceptApi`):
   - image tag / release / Sentry release, **or**
   - on the running host: `manage.py show_urls | grep claim-vendor-file-accept` (or equivalent URL dump).
2. **Redeploy** `vendor-management-core` from current `main` (or cherry-pick Accept/Reject + summary/export onto the release branch if it lags).
3. **Smoke** (authenticated; needs `CLAIMS_UPDATE`):

   ```bash
   # Accept
   curl -X POST "$API/api/v1/claim-vendor-files/$UUID/accept/" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"notes":"smoke accept"}'
   # expect 200

   # Reject
   curl -X POST "$API/api/v1/claim-vendor-files/$UUID/reject/" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reasons":["MFC-OTHER"],"notes":"smoke reject"}'
   # expect 200
   ```

4. **Permissions:** Accept/Reject require `CLAIMS_UPDATE` (list uses `CLAIMS_LIST`). Wrong perm is usually **403**, not 404 — still check after routes exist.
5. **Optional FE local test:** point FE at a local core that has the routes:

   ```text
   NEXT_PUBLIC_VENDOR_CORE_API_URL=http://localhost:8010
   ```

   (see `vendor-management/.env.example`)

---

## Contract (must match FE)

| Action | Method / path                                    | Body                                                        |
| ------ | ------------------------------------------------ | ----------------------------------------------------------- |
| Accept | `POST /api/v1/claim-vendor-files/{uuid}/accept/` | optional `notes` (file-level)                               |
| Reject | `POST /api/v1/claim-vendor-files/{uuid}/reject/` | `reasons: string[]` and/or `notes` (≥1 required by service) |

Path param: **UUID only** (`<uuid:id>`). Display `reference_id` (`VM-CVF-…`) is not valid in this URL converter.

Related queue endpoints (also on core `main`; confirm same deploy ships them):

- `GET /api/v1/claim-vendor-files/summary/`
- `GET /api/v1/claim-vendor-files/export/csv/`

---

## EDI segments + right inspector (FE data source)

**Full discovery write-up:** [`EDI_LIVE_DOWNLOAD.md`](./EDI_LIVE_DOWNLOAD.md)

**Live API (only):** `GET /api/v1/inbound-files/{uuid}/download/` — inbound-file UUID from `source_inbound_file_id`.

**Not a separate BE “segments” API.** Review/detail EDI UI is client-side X12 parse of one raw string.

### How raw body is loaded

[`loadVendorFileEdiBody`](./feature/api/claimEncounterApi.ts) (keep in sync with code):

1. **`isMockEnabled()`** → static fixture only (`837I` Magellan sample / `835`).
2. **Live** → require `sourceInboundFileId` → `vendorCoreApi.downloadInboundFile` (`GET /api/v1/inbound-files/{uuid}/download/`). **No fixture fallback.**
3. Live failures throw; [`EdiViewerLoader`](./edi/EdiViewer.tsx) shows `error.message` in a red panel.

### Segments list (center)

[`EdiViewer`](./edi/EdiViewer.tsx) runs `parseX12(raw)` in the browser and renders segments. No per-segment backend call.

### Right “segment detail” panel

Same parsed document: when user selects a segment, inspector shows that segment’s elements (`selected.elements`). Message _“Select a segment to inspect elements.”_ means nothing selected yet — not a failed API.

### Seed / demo screenshots

Older screenshots with MedStar / JAMES DOE were **fixture fallback**, not seeded vendor-file EDI. Live mode no longer shows that silently.

**BE implication for true live EDI:** ensure seeded / ingested inbound files have downloadable body content so `GET /inbound-files/{id}/download/` returns non-empty X12; otherwise FE shows an **error** in the EDI panel.

---

## Sign-off checklist

- [ ] Running `api.vm.tillahealth.com` (or target env) revision includes Accept/Reject URL names
- [ ] Smoke POST accept → 200 on a reviewable vendor file
- [ ] Smoke POST reject → 200 with reasons/notes
- [ ] FE Accept/Reject against that env succeeds (no proxy 404 toast)
- [ ] (Optional) Inbound download returns real EDI so segment viewer shows X12 (live has no fixture fallback)

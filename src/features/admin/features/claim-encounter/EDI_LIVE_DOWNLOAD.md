# EDI segment viewer — FE ↔ live API alignment

**Audience:** FE + BE  
**Date:** 2026-09-12  
**Source of truth:** [`loadVendorFileEdiBody`](./feature/api/claimEncounterApi.ts) (current code). Keep this doc in sync with that function.

---

## Short answer

| Question                        | Answer (matches FE today)                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Magellan / JAMES DOE on screen? | That was **`public/edi/837I_Magellan_sample.txt`** after a **silent live fallback** (removed).     |
| Live API?                       | **Yes:** `GET /api/v1/inbound-files/{uuid}/download/`                                              |
| Integrated?                     | **Yes** on file detail + review via `loadVendorFileEdiBody` → `vendorCoreApi.downloadInboundFile`. |
| Live fixture fallback?          | **No.** Live never loads Magellan/835 fixtures.                                                    |
| Mock mode (`isMockEnabled()`)?  | **Yes** — fixtures only.                                                                           |

---

## FE call chain (exact)

```text
ClaimFileDetailPage / ClaimFileReviewPage
  → useCallback load() → loadVendorFileEdiBody({
        sourceInboundFileId: file.sourceInboundFileId,
        ediFixture: file.ediFixture,       // used in mock only
        transactionType: "837" | "835",
     })
  → EdiViewerLoader({ load })
       success → EdiViewer(raw) → parseX12 → segments + right inspector
       failure → red error box with Error.message
```

| UI          | File                                                               | Loader                                      |
| ----------- | ------------------------------------------------------------------ | ------------------------------------------- |
| File detail | [`pages/ClaimFileDetailPage.tsx`](./pages/ClaimFileDetailPage.tsx) | `EdiViewerLoader` + `loadVendorFileEdiBody` |
| MFC review  | [`pages/ClaimFileReviewPage.tsx`](./pages/ClaimFileReviewPage.tsx) | same                                        |

`sourceInboundFileId` comes from vendor-file mapper [`mapClaimVendorFileDto`](./feature/api/claimEncounterApi.ts):

- `row.source_inbound_file_id` **or** `row.inbound_file_id` → string UUID
- else `null`

Mapped DTO also sets `ediFixture: "837I"` always; **live ignores it**.

---

## Live endpoint (only body source when mock off)

```http
GET /api/v1/inbound-files/{uuid}/download/
```

| Piece       | Code                                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Path helper | `vendorCoreEndpoints.inboundFileDownload(id)` → `/api/v1/inbound-files/${id}/download/` in [`api.ts`](../../../lib/vendor-core/api.ts) |
| Client      | `vendorCoreApi.downloadInboundFile(id)` → blob → `.text`                                                                               |
| BE          | `vendor-management-core/core/intake/urls.py` — `InboundFileDownloadApi`                                                                |

**Path id:** inbound-file UUID (`sourceInboundFileId`).  
**Not** claim-vendor-file UUID alone, **not** `VM-CVF-…` / `fileId`.

There is **no** `…/segments/` or element-detail API. Inspector = `selected.elements` from client `parseX12` in [`edi/EdiViewer.tsx`](./edi/EdiViewer.tsx).

---

## `loadVendorFileEdiBody` behavior (aligned to code)

### Mock (`isMockEnabled() === true`)

1. Resolve fixture key: `file.ediFixture` or `fixtureKeyForTransaction(transactionType)` → `"837I"` \| `"835"`.
2. `loadEdiFixture` → [`public/edi/837I_Magellan_sample.txt`](../../../../public/edi/837I_Magellan_sample.txt) or `835_P_sample.txt`.

### Live (`isMockEnabled() === false`)

| Condition                           | Result                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `!sourceInboundFileId`              | **throw** `"No linked inbound file (source_inbound_file_id). EDI download unavailable for this vendor file."` |
| Download returns empty/whitespace   | **throw** `` `Inbound file ${id} download returned an empty body.` ``                                         |
| Download / network / upstream error | **throw** `` `Failed to download inbound EDI (${id}): ${detail}` ``                                           |
| Non-empty text                      | **return** that string (shown as segments)                                                                    |

No `return loadEdiFixture(...)` on the live path.

### UI on throw

[`EdiViewerLoader`](./edi/EdiViewer.tsx) catches and renders:

```tsx
<div className="… text-destructive">{error.message}</div>
```

User sees that message instead of Magellan segments.

---

## Flow diagram

```text
isMockEnabled?
  yes → fixture file → parseX12 → segments
  no  → need sourceInboundFileId
          missing → error panel
          present → GET …/inbound-files/{uuid}/download/
                      empty/fail → error panel
                      OK → parseX12 → segments + inspector
```

---

## Verify against running FE

1. Mock **off**. Open file detail/review for a vendor file.
2. Network: `GET …/api/v1/inbound-files/{sourceInboundFileId}/download/` (via Next proxy if used).
3. **200 + X12** → segment list from that body (not MedStar Magellan sample).
4. **No `sourceInboundFileId` / 404 / empty** → red error text matching strings above — **not** Magellan.

---

## BE / seed (so live panel has content)

1. Claim vendor file must expose `source_inbound_file_id` (or `inbound_file_id`).
2. That inbound file must return non-empty X12 from download.

Related Accept/Reject deploy notes: [`CLAIM_VENDOR_FILE_ACCEPT_REJECT_DEPLOY.md`](./CLAIM_VENDOR_FILE_ACCEPT_REJECT_DEPLOY.md).

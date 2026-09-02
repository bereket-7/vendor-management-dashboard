# My Work Queue — Backend Fix Plan (List API 500)

**Date:** 2026-08-31  
**Audience:** Backend team (`vendor-management-core`)  
**Frontend reporter:** `vendor-management` — no backend write access  
**Backend commit under test:** `3628536` (`feat: enhance audit and vendor management features`)

---

## Symptom (what users see)

On `/admin/my-work-queue`:

| UI area                                | Expected           | Actual                                                         |
| -------------------------------------- | ------------------ | -------------------------------------------------------------- |
| Top KPI cards (Assigned, Connected, …) | Counts             | **Works** — e.g. 19 assigned                                   |
| Main TPA/TPV table                     | Rows               | **Empty** — “No TPA/TPV records match your filters”, 0 entries |
| EDI Analyst Progress panel             | Analyst rows       | **Blank**                                                      |
| Escalation Summary cards               | Counts             | **All 0**                                                      |
| SFTP/EDI summary (top)                 | May show from KPIs | Partial — KPI endpoint OK                                      |

Data **exists** (KPIs prove 19 cases). List-driven UI cannot load it.

---

## Root cause (confirmed from frontend dev logs)

Next.js proxy logs (`pnpm dev -p 3002`):

```text
GET /api/vendor-core/api/v1/work-queue/kpis              → 200
GET /api/vendor-core/api/v1/migration-cases/list?limit=100&offset=0 → 500
GET /api/vendor-core/api/v1/migration-cases/list?limit=20&offset=0  → 500
```

- **KPI endpoint** uses simple DB counts → works.
- **List endpoint** fails with **HTTP 500** → frontend gets no rows.

Frontend calls list twice on this page:

1. Paginated table — `limit=20`, filters
2. Summary rollup — `limit=100` for analyst / escalation panels

Both fail → table + side panels empty.

Frontend error banner may appear above KPIs (`rowsPageQ.error.message`); empty table copy (“No migration cases yet”) is misleading when list fails but KPIs succeed.

---

## Likely backend bug

**File:** `core/work_queue/serializers/migration_case.py`  
**Classes:** `MigrationCaseListOutputSerializer`, `MigrationCaseDetailOutputSerializer`

### Problem

Progress fields were added in commit `3628536` using this pattern:

1. Declare `sftp_progress` / `edi_progress` as nested `MigrationCaseTrackProgressOutputSerializer()` fields on the serializer.
2. Override `to_representation()` to call `super().to_representation(instance)` then `_append_progress_fields()`.

**But** on the model, `sftp_progress` and `edi_progress` are **raw JSON storage**, not API output shape:

```python
# core/work_queue/models/migration_case/migration_case.py
sftp_progress = models.JSONField(default=dict, blank=True)  # e.g. {"completed": {}, "notes": "", ...}
edi_progress = models.JSONField(default=dict, blank=True)
```

Storage shape (input to `build_progress_output`):

```json
{
	"completed": {},
	"notes": "",
	"updated_at": null,
	"updated_by_id": null
}
```

API output shape (`MigrationCaseTrackProgressOutputSerializer`):

```json
{
  "percent": 0,
  "current_milestone_key": null,
  "current_milestone_label": null,
  "last_updated_at": null,
  "milestones": [ ... ],
  "notes": "",
  "updated_by": null,
  "updated_at": null
}
```

When `super().to_representation(instance)` runs, DRF tries to serialize model JSON through the nested output serializer **before** `_append_progress_fields()` can transform it. Raw storage lacks required fields (`percent`, `milestones`, …) → serialization/validation error → **500**.

`_append_progress_fields()` (via `build_progress_output`) would produce the correct shape, but it never gets a chance if `super()` throws first.

**Detail endpoint** (`GET migration-cases/<id>/`) likely has the same bug if hit after progress fields shipped.

---

## Recommended fix (P0)

**Goal:** Never pass raw JSON storage through `MigrationCaseTrackProgressOutputSerializer` in `super().to_representation()`.

### Option A — Remove progress fields from declared serializer fields (minimal)

In `MigrationCaseListOutputSerializer` and `MigrationCaseDetailOutputSerializer`:

- **Remove** these lines from the field list:
  ```python
  sftp_progress = MigrationCaseTrackProgressOutputSerializer()
  edi_progress = MigrationCaseTrackProgressOutputSerializer()
  ```
- Keep `escalation_status = serializers.CharField()` (model column — safe for `super()`).
- Keep `to_representation()` → `_append_progress_fields()` as today.

`_append_progress_fields()` already sets `sftp_progress` / `edi_progress` using `build_progress_output()`.

Optional hardening: run built payload through `MigrationCaseTrackProgressOutputSerializer(payload).data` inside `_append_progress_fields` so wire shape stays validated.

### Option B — SerializerMethodField (explicit, OpenAPI-friendly)

```python
sftp_progress = serializers.SerializerMethodField()
edi_progress = serializers.SerializerMethodField()

def get_sftp_progress(self, instance):
    return MigrationCaseTrackProgressOutputSerializer(
        build_progress_output(
            track=PROGRESS_TRACK_SFTP,
            storage=instance.sftp_progress or {},
            updated_by=self._resolve_updated_by(instance, track="sftp"),
        )
    ).data
```

Same for EDI. Remove duplicate logic from `_append_progress_fields` or drop the mixin override.

**Recommend Option A** — smallest diff, matches existing mixin.

---

## Files to touch

| File                                                            | Change                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `core/work_queue/serializers/migration_case.py`                 | Fix list + detail output serializers (P0)                       |
| `core/work_queue/tests/serializers/test_migration_case_list.py` | **Add** — serialize a case with empty + populated progress (P0) |
| `core/work_queue/apis/migration_case/crud.py`                   | No change expected                                              |
| `core/work_queue/progress.py`                                   | No change expected                                              |

---

## Verification (backend)

### 1. Reproduce failure (before fix)

```bash
# Authenticated request — use session/JWT from local admin
curl -s -o /tmp/list.json -w "%{http_code}\n" \
  -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/migration-cases/list/?limit=5&offset=0"
# Expect: 500 today
```

Check Django logs / Sentry for traceback pointing at `MigrationCaseTrackProgressOutputSerializer` or missing `percent` / `milestones`.

### 2. After fix

```bash
# List returns 200 with envelope { result: { count, results: [...] } }
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/migration-cases/list/?limit=5&offset=0" | jq '.result.results[0].sftp_progress.percent'

# Detail also 200
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/migration-cases/<uuid>/" | jq '.result.sftp_progress.milestones | length'
```

### 3. Automated test (suggested)

```python
def test_migration_case_list_output_serializes_empty_progress(db, migration_case_factory, api_user):
    case = migration_case_factory(sftp_progress={}, edi_progress={})
    data = MigrationCaseListOutputSerializer(case).data
    assert data["sftp_progress"]["percent"] == 0
    assert len(data["sftp_progress"]["milestones"]) == 6  # SFTP catalog length
    assert data["edi_progress"]["percent"] == 0
```

### 4. Cache note

`MigrationCaseListApi` uses `@cache_api_response(namespace="migration_case:list")`. After deploy, flush that cache namespace (or restart Redis) so clients do not briefly see cached 500 responses.

---

## Frontend verification (after backend deploy)

No frontend code change required for the 500 fix. Refresh My Work Queue:

| Check                  | Pass                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| Main table shows cases | Rows match KPI total (modulo filters)                                           |
| Pagination footer      | Non-zero count                                                                  |
| EDI Analyst Progress   | Rows per assigned analyst                                                       |
| Escalation Summary     | Counts from first 100 cases (may still be 0 if all `escalation_status: "none"`) |
| Detail page            | Opens without 500                                                               |

---

## Secondary notes (not blockers for empty table)

### Escalation Summary all zeros

After list works, escalation cards may still show **0** if every case has `escalation_status: "none"` in DB. Frontend no longer client-derives escalation (uses API field only). Product may want backend auto-derive on status/progress change, or manual set via `POST …/escalation/`.

### Misleading empty-state copy (frontend-only, optional)

When `rowsPageQ.error` is set, page currently may also show “No migration cases yet.” Frontend can tighten that in a follow-up — not a substitute for fixing list 500.

---

## Implementation checklist for backend PR

- [ ] Remove or replace nested `sftp_progress` / `edi_progress` field binding on list + detail output serializers
- [ ] Confirm `_append_progress_fields` / `build_progress_output` still populate wire fields
- [ ] Add serializer test(s) for empty and partial progress storage
- [ ] Manually hit list + detail — both 200
- [ ] Flush `migration_case:list` API cache after deploy
- [ ] Notify frontend — re-test My Work Queue dashboard

---

## References

- Gap analysis (integration status): `WORK_QUEUE_API_GAP_ANALYSIS.md`
- Backend list API: `core/work_queue/apis/migration_case/crud.py` — `MigrationCaseListApi`
- Progress builder: `core/work_queue/progress.py` — `build_progress_output`
- Frontend list consumer: `pages/MyWorkQueuePage.tsx` — `useWorkQueueRowsPageQuery`, `useWorkQueueRowsQuery`

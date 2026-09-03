# Backend gaps — Members, Providers, TPA/TPV

**Updated:** 2026-09-03
**Frontend:** `vendor-management-dashboard`
**Backend:** `vendor-management-core` → `core/members`, `core/providers`, `core/work_queue`
**Product spec (§3.1–3.2):** "TPV and TPA Additional Tabs"

Scope of this document: things the dashboard **already renders or already submits** that the API
cannot serve today. Everything here is a backend ticket.

Out of scope, deliberately:

- Endpoints that exist but the UI hasn't wired up yet (`POST /migration-cases/<id>/assign/`,
  `GET /provider-rosters/<id>/providers/list/`, member other-status CRUD, …). Those are frontend
  tickets and are tracked in the per-feature gap files.
- Anything the UI does not currently show. No speculative endpoints.

Each row names the screen, what the UI does today to cope, and what the API needs to return or accept.

---

# 1. Members

Frontend: `src/features/admin/features/members/`
Backend: `core/members/`

The Member 360 is the most complete of the three areas — detail tabs, exports, family links,
accumulators, exceptions and claims are all live. The gaps are concentrated in the **directory**
(filters and list columns) and in a handful of **fields the UI shows but nothing populates**.

## 1.1 NewTech Member ID / Family ID — no field exists anywhere — P1

The single largest gap in this area. `newtech` does not appear anywhere in `core/` — no model field,
no serializer field, no filter.

The dashboard treats it as a first-class identifier:

| Surface | File |
|---------|------|
| Create wizard — Identity step | `pages/MemberFormWizard.tsx:718-731` |
| Edit form | `pages/member-write-form.tsx:258-277` |
| Directory filter panel | `pages/MembersPage.tsx:819-836` |
| Detail identity header | `pages/MemberDetailPage.tsx:1350-1357` |
| Detail Identifiers table | `pages/MemberDetailPage.tsx:3061-3074` |

What happens today: the wizard and edit form POST/PATCH `newtech_member_id` and
`newtech_family_id`; DRF's plain `Serializer` drops both silently, so **the values never persist**.
On read the mapper reads `row.newtech_member_id` (`map-member-core.ts:181-194`), gets `undefined`,
and falls back to a hardcoded demo constant `"12345678"`. The directory sends the two filters as
query params, the API ignores them, and `filterLiveNewTechRows()` (`MembersPage.tsx:198-218`)
re-filters the *current page only* client-side — so paging past page 1 silently drops matches.

Needed:

- Fields on `Member` (or `MemberDemographics`) — `newtech_member_id`, `newtech_family_id`,
  `CharField(max_length=64, blank=True, db_index=True)`.
- Accepted on `MemberCreateInputSerializer` / `MemberUpdateInputSerializer`.
- Returned on both `MemberListOutputSerializer` and `MemberDetailOutputSerializer`.
- `newtech_member_id` / `newtech_family_id` filters (icontains) on `/members/list/` **and**
  `/members/stats/`, plus inclusion in the `search` Q-object.

## 1.2 Eligibility date-range filters — P1

`MemberFilter` and `MemberListQuerySerializer` support `coverage_effective_from/to` and
`coverage_term_from/to`. The directory's **Term from / Term to** inputs mean the *eligibility status*
term date, not the plan coverage term date — there is no matching param, so `MembersPage.tsx:781-796`
renders a warning banner telling the user results may be wrong.

Add to `/members/list/` and `/members/stats/` (both the query serializer and `get_members()`):

| Param | Maps to |
|-------|---------|
| `status_term_from` / `status_term_to` | `eligibility__status_term_date` |
| `eligibility_effective_from` / `eligibility_effective_to` | `eligibility__status_effective_date` |

Once these ship the banner and the `hasUnsupportedLiveFilters` branch come out.

## 1.3 List DTO is missing columns the directory wants — P2

`MemberListOutputSerializer` exposes `coverage_effective_date` but not the term dates or the group
identifier. The directory can *filter* by `group_id` but cannot *display* it, and term-date columns
are impossible without an N+1 detail fetch per row.

Add to the list output: `status_effective_date`, `status_term_date`, `coverage_term_date`, `group_id`.

## 1.4 Filter dropdown values require fetching every member — P2

The Plan and Account Group dropdowns are populated by `useMemberSummariesList()`, which walks
**every page** of `/members/list/` on mount just to collect distinct values
(`MembersPage.tsx:485-505`). On a real tenant this is a full table scan on page load.

Needed: a facet endpoint, e.g.

```http
GET /api/v1/members/facets/?fields=plan_name,account_group
```

returning distinct values (scoped by the same filters as the list), so the UI stops paging the whole
directory.

## 1.5 Change events are never written for API edits — P2

`MemberChangeEvent` rows are only created by `member_upsert.py:182` (file ingest) and
`member_seed.py:426`. `member_update()` writes nothing. So for any member edited through the
dashboard, `GET /members/<id>/change-events/list/` comes back empty, and the frontend quietly
substitutes fabricated events — `membersApi.ts:519-524` returns `buildMockMemberChangeEvents()`
whenever the live list is empty. That mock data is indistinguishable from real audit history in the UI.

Needed: emit `MemberChangeEvent` rows from `member_update` (and the nested demographics / eligibility /
plan / employment updates) with the same `category` / `field_name` / `old_value` / `new_value` shape
the ingest path uses. The frontend fallback gets deleted in the same change.

## 1.6 Family link rows carry relationship only — P2

`MemberFamilyLink` stores `relationship_code` and `relationship_label`. The Family / Dependents tab
renders a table with Person Code, Student Status, Disability Status, and per-dependent Coverage Level /
Effective / Term. Person code and coverage columns are copied from the **subscriber**, and student /
disability are hardcoded `"—"` (`MemberDetailPage.tsx:709-744`).

Needed on the link row (or as an embedded dependent compact on
`GET /members/<id>/family-links/list/`): `dependent_person_code`, `student_status`,
`disability_status`, `coverage_level`, `coverage_effective_date`, `coverage_term_date`.

If student/disability aren't tracked in the source 834, say so and we'll drop the columns.

## 1.7 Plan history has no actor — P3

`MemberPlanHistory` has `change_reason` but no `changed_by`. The Plan History table's "Changed By"
column is hardcoded `—` (`MemberDetailPage.tsx:4041`). Add `changed_by` (FK to user, or a source
string for ingest-driven rows) or we remove the column.

## 1.8 Vendor / Source History is synthesized — P3

The Vendor / Source History tab's six KPI cards are computed client-side from
`/source-records/list/`, with `recordsProcessed` hardcoded to `1` per record and `frequency` set to
the record's effective date (`member-detail-actions.tsx:150-164`). The numbers are not meaningful.

Needed: either a real feed-history endpoint per member, or `records_processed` / `frequency` /
`file_status` on the source-record list rows so the rollup is honest.

## 1.9 SSN presentation — needs a decision, not necessarily code — P3

Only `ssn_last4` is on the wire (`ssn_encrypted` is stored but never serialized — correct). The
detail header renders `123-45-{ssnLast4}` (`MemberDetailPage.tsx:1365-1367`), i.e. it **invents**
the first five digits.

Either the API returns a pre-masked `ssn_masked` string, or we change the UI to show `•••-••-1234`.
Backend decision needed either way; today it displays a plausible-looking fake SSN.

---

# 2. Providers

Frontend: `src/features/admin/features/providers/`
Backend: `core/providers/`

Detail-page reads are in good shape — profile, summary KPIs, monthly volume, rejection reasons,
recent activity, vendor sources and all five sub-resource tabs are live with full CRUD. The gaps are
almost entirely on the **directory list endpoint**, which is thin enough that the frontend
compensates by loading the entire table and doing the work in the browser.

## 2.1 List rows have no KPI figures — P1

`ProviderListOutputSerializer` returns identity fields only. `claims12m`, `paid12m`,
`rejection_rate`, `encounters12m`, `billed12m` and `net_payment12m` exist **only** on
`ProviderSummaryOutputSerializer` (`serializers/provider_tabs.py:190-195`), which is a per-provider
detail call.

The directory table has "Claims (12m)" and "Paid (12m)" columns. `live-providers.ts:456-461`
defaults every one of them to `0`, so the columns read zero for every provider in live mode.

Needed: embed the 12-month KPI block on `GET /providers/list/` rows (aggregate once per page, not per
row), or add a bulk endpoint the list can join against:

```http
GET /api/v1/providers/summary/bulk/?ids=<uuid>,<uuid>,…
```

## 2.2 List rows have no profile data — P1

Specialty, practice name, practice address, phone, provider type and years in practice all live on
`ProviderProfile` and are not embedded on list rows. The directory shows Provider (+ subspecialty),
Specialty, Practice (+ phone) and Type columns anyway.

To fill them the frontend currently:

- maps taxonomy codes to specialty labels through a hardcoded `TAXONOMY_LABELS` table
  (`live-providers.ts:25-36`),
- **parses `raw_object_id`** for seed metadata to recover specialty and practice name
  (`live-providers.ts:331-340`),
- hardcodes `yearsInPractice: 0` and `practiceAddress: "—"` (`live-providers.ts:445-447`).

Needed: a `profile` compact on list rows — `specialty`, `subspecialty`, `provider_type`,
`practice_name`, `practice_city`, `practice_state`, `phone`, `years_in_practice`,
`taxonomy_description`.

## 2.3 No search on the provider list — P1

`ProviderFilter` offers `npi`, `name`, `taxonomy`, `entity_type`, `status` as individual icontains
filters. There is no unified `search`, and no `specialty` filter.

Consequence: `listProviders()` calls `listAllPages()` — it fetches **every provider**, then filters,
sorts and paginates in the browser (`ProvidersPage.tsx`, client-side pagination). The search box
matches across name, NPI, Tax ID, UPIN, Medicaid ID, specialty and practice, none of which the API
can do.

Needed on `GET /providers/list/`:

| Param | Behaviour |
|-------|-----------|
| `search` | name, NPI, reference_id, profile specialty, profile practice_name, and `ProviderIdentifier.value` (covers Tax ID / UPIN / Medicaid) |
| `specialty` | iexact against `profile__specialty` |

Plus a facet endpoint (or distinct-values param) for the Specialty dropdown, which is currently built
from whatever rows happen to be loaded.

## 2.4 Ordering choices are narrower than the FilterSet — P2

`ProviderFilter.order_by` supports `name`, `npi`, `status`, `effective_date`
(`filters.py:19-29`), but `ProviderListQuerySerializer` inherits `ListOrderingMixin`, whose choices
are only `created_at` / `updated_at` / `deleted_at`. The valid values are unreachable, so the
directory table has no column sorting at all.

Needed: widen the query serializer's `order_by` choices to match the FilterSet.

## 2.5 No export or document endpoints — P2

Members has `/members/list/export/csv/`, `/members/<id>/export/csv|pdf/`, `/members/<id>/print/` and
three `/documents/*/pdf/` endpoints. Providers has none.

The UI ships the buttons anyway, wired to toasts:

- `ProviderDetailPage.tsx:967-971` — "Export CSV" / "Export PDF" → `toast.success("Exported CSV")`,
  nothing is downloaded.
- `ProviderDetailPage.tsx:944-951` — "One-page summary" / "Enrollment packet" → `toast.message(…)`.
- `ProvidersPage.tsx:599-602` — list Export button has no handler at all.

Needed, mirroring the members implementation:

```http
GET /api/v1/providers/list/export/csv/          # same query params as list
GET /api/v1/providers/<id>/export/csv/
GET /api/v1/providers/<id>/export/pdf/
GET /api/v1/providers/<id>/documents/summary/pdf/
GET /api/v1/providers/<id>/documents/enrollment-packet/pdf/
```

## 2.6 Recent activity rows have no member identity — P2

`ProviderRecentActivityListOutputSerializer` declares `member_id` and `member_name` and always
returns `""` — `ClaimLine` is joined by NPI and carries no member linkage. The Claims & Encounters
tab renders a Member column that is empty for every row.

Either resolve the member from the claim line and populate the fields, or drop them from the
serializer so we can remove the column instead of shipping a dead one.

## 2.7 Credential status is never recalculated — P3

`ProviderCredential.status` is a stored enum (`complete` / `expiring` / `expired` / `pending`) set at
write time. Nothing re-evaluates it against `expiration_date`, and there is no scheduled task in
`core/providers/`. The Credentialing tab's "Action required" panel therefore derives expiring/expired
in the browser from the raw dates, which will disagree with `status` the day after any credential
lapses.

Needed: a periodic job (Celery beat, same pattern as `work_queue_auto_escalate_stale_cases_task`)
that transitions `complete → expiring → expired` on the stored status.

---

# 3. TPA/TPV

Frontend: `src/features/admin/features/my-work-queue/`
Backend: `core/work_queue/`

Most of the earlier work-queue backlog has shipped: SFTP/EDI milestone progress, the progress-summary
and analyst-stats endpoints, blocker fields with a transition action, the blockers list, and
auto-escalation via Celery are all live. `work-queue-gaps.md` and `WORK_QUEUE_API_GAP_ANALYSIS.md`
are stale on those points.

What's left is mostly one shape of problem: **the registration wizard collects more state than the
model has fields for, so the frontend stuffs it into `metadata`.** Anything in `metadata` is
unfilterable, unvalidated, invisible to reporting, and silently divergent between the wizard and the
detail tabs.

## 3.1 Fields living in `metadata` that need promoting — P1

Source of truth for the value sets below: **"TPV and TPA Additional Tabs"** (product spec). These are
the four detail-page tabs whose dropdowns have no backing field. The registration wizard collects the
same four and writes them into `metadata` via `mergeCaseMetadata()`
(`lib/work-queue-detail-tabs.ts:272-277`), so registration and detail are describing state the API
cannot store, filter, or report on.

**Registration and detail must use identical value sets.** Today they agree only because both read
the same frontend constants; once these become real fields, the enum is the contract.

### 3.1.1 Status tab — `operational_status`

| Field | Values | Rule |
|-------|--------|------|
| Status | Not Started · In Progress · Completed | Overall operational status of the TPA/TPV |

This is **not** `migration_status` (7 values, migration lifecycle) and not `current_stage` (8 values).
It is a separate three-state rollup. When metadata is absent the UI back-derives it from
`migration_status` (`lib/work-queue-detail-tabs.ts:159-165`), which produces a different answer than
what the analyst selected.

```python
class OperationalStatus(models.TextChoices):
    NOT_STARTED = "not_started", _("Not Started")
    IN_PROGRESS = "in_progress", _("In Progress")
    COMPLETED = "completed", _("Completed")
```

Field on `MigrationCase`, on create + update input, on list + detail output, and as a list filter
(the tracking table shows it as a column — see §3.2).

### 3.1.2 IP Whitelisting tab — `whitelist_status` value realignment

| Field | Values | Rule |
|-------|--------|------|
| IP Whitelisting | Not Required · Not Started · In Progress · Completed | Current whitelisting stage. Spec is explicit that the table column is labelled **"IP Whitelisting"** |

This is not simply "add a fourth value" — the existing vocabulary disagrees on two of the three it
already has:

| Spec value | `WhitelistStatus` today | Action |
|------------|-------------------------|--------|
| Not Required | — | add `not_required` |
| Not Started | `not_started` | keep |
| In Progress | `pending` | rename to `in_progress` (or alias) |
| Completed | `complete` | rename to `completed` (or alias) |

Today the fourth state has nowhere to go, so the UI stores it in
`metadata.ip_whitelisting_not_required` and writes back a lossy three-value `whitelist_status`. Any
case marked "Not Required" therefore shows the wrong pill in the tracking table.

If renaming stored values is unattractive, keep the keys and fix the labels — but the API must accept
and return all four states on `POST …/whitelist/`, the case DTO, and the list filter choices.

### 3.1.3 Escalation tab — four fields, three of them missing

| Field | Values | Rule |
|-------|--------|------|
| Escalated | No · Yes | If Yes, analyst **must** provide Escalation Reason, Escalated To and Escalation Status |
| Escalation Reason | No Response from TPA/TPV · SFTP Blocker · Credentials Not Received · IP Whitelisting Delay · Configuration Blocker · Testing Failure · Other | Required when Escalated = Yes |
| Escalated To | Internal Team · IT · Management · TPA/TPV · Other | Required when Escalated = Yes. Where the issue was sent for resolution |
| Escalation Status | Submitted · In Progress · Resolved | Current state of the escalation |

**Escalated** — no boolean on the model; currently `metadata.escalated`. Add `escalated`
(`BooleanField`, default `False`), or derive it from a non-null `escalation_status` and state that
explicitly so the UI can stop tracking it separately.

**Escalation Reason** — `BlockerReason` covers five of seven:

| Spec value | `BlockerReason` today |
|------------|----------------------|
| No Response from TPA/TPV | `second_contact_no_response` — key and label are narrower than the spec; relabel to "No response from TPA/TPV" |
| SFTP Blocker | `sftp_blocker` |
| Credentials Not Received | `credentials_not_received` |
| IP Whitelisting Delay | `ip_whitelist_delay` |
| Configuration Blocker | `configuration_blocker` |
| Testing Failure | `testing_failure` |
| **Other** | **missing — add `other`** |

**Escalated To** — no field. This is a **category enum, not a user reference**:

```python
class EscalatedTo(models.TextChoices):
    INTERNAL_TEAM = "internal_team", _("Internal Team")
    IT = "it", _("IT")
    MANAGEMENT = "management", _("Management")
    VENDOR = "vendor", _("TPA/TPV")
    OTHER = "other", _("Other")
```

**Escalation Status** — the spec's three values do not map onto the existing `EscalationStatus`
enum, which is a different concept (`none`, `escalation_required`, `attention`, `escalated`,
`resolved` — partly auto-derived by `derive_escalation_status()` and the auto-escalation task).

Recommendation: keep the existing enum as the **system-derived** signal that drives KPIs, blockers
and auto-escalation, and add a separate **analyst-entered** field for the spec's workflow:

```python
class EscalationWorkflowStatus(models.TextChoices):
    SUBMITTED = "submitted", _("Submitted")
    IN_PROGRESS = "in_progress", _("In Progress")
    RESOLVED = "resolved", _("Resolved")
```

If instead the two should be merged, that needs a product decision — say so and we'll collapse the
UI to one field. As written, the tracking table shows **both** "Escalated" and "Escalation Status"
as separate columns, which implies they stay distinct.

All four accepted on `POST …/blocker/transition/` and on create; all four returned on the case DTO
and the blockers list rows. The conditional-requirement rule (Escalated = Yes ⇒ reason, escalated-to
and status required) should be enforced in the service, not only in the wizard.

### 3.1.4 EDI Analyst tab

| Field | Values | Rule |
|-------|--------|------|
| Assigned EDI Analyst | Active EDI Analyst list | **Every TPA/TPV must have one.** Authorized users assign or reassign **from the Status tab** |
| Assignment Date | Auto-generated timestamp | Captured on assign and on every reassign |
| Assigned By | Auto-generated user | Who made the assignment |
| Previous Analyst | System-generated | On reassign, retained **in History** for audit |

`assigned_to` is the migration owner and is a different person. The EDI analyst is metadata-only
today (`edi_analyst_id`, `edi_analyst_name`, `edi_analyst_assigned_at`, `assigned_by`, `previous_*`).

Needed:

- `edi_analyst` FK to `users.User`, plus `edi_analyst_assigned_at` and `edi_analyst_assigned_by` FK
  — the last two set by the service, never accepted from the client.
- `POST /api/v1/migration-cases/<id>/edi-analyst/` `{ edi_analyst_id }`, mirroring the existing
  `…/assign/` action.
- On reassign, write a `MigrationCaseEvent` (`event_type="assignment"`, already exists) naming the
  previous and new analyst — that satisfies "retain the previous analyst in History" without a
  `previous_analyst` column, and the History tab renders it for free.
- **Required on create.** Service-level validation, since the spec says every TPA/TPV must have one.
- **"Active EDI Analyst list"** — `GET /users/list/` has no `role` and no `is_active` filter
  (`core/users/serializers/user.py:185-207`), so the analyst pickers on the wizard and detail page
  currently list *every* user. Add `role` and `is_active` filters, and confirm the role name that
  identifies an EDI analyst.

Note the spec puts assign/reassign **on the Status tab**; the dashboard currently has a separate
"EDI Analyst" tab. That's a frontend change we'll make once the field exists.

## 3.2 Tracking table columns — P1

The spec's dashboard table (same doc) is the current table plus escalation, with two renames:

| # | Column | Backing field | Status |
|---|--------|---------------|--------|
| 1 | TPA/TPV | `name`, `code`, `vendor_type` | live |
| 2 | Server | `server_type` | live |
| 3 | Email | `primary_email` | live |
| 4 | SFTP Progress | `sftp_progress.percent` | live |
| 5 | EDI Progress | `edi_progress.percent` | live |
| 6 | IP Whitelisting | `whitelist_status` | **needs 4 values — §3.1.2** |
| 7 | Status | `operational_status` | **missing — §3.1.1** |
| 8 | EDI Analyst | `edi_analyst` | **missing — §3.1.4** |
| 9 | Escalated | `escalated` | **missing — §3.1.3** |
| 10 | Escalation Status | `escalation_workflow_status` | **missing — §3.1.3** |
| 11 | Updated | `updated_at` | live |
| 12 | Actions | — | live |

Renames on the frontend side: the "Analyst" column becomes **EDI Analyst** (a different field from
`assigned_to`), and "IP Whitelist" becomes **IP Whitelisting** — the spec calls the column name out
explicitly. The current table also carries Wave, Last Comm and Notes columns which the spec's layout
drops; that's a frontend decision, not a backend one.

Every one of columns 6–10 needs a matching **list filter**, since the KPI cards and the filter bar
operate on the same columns.

## 3.3 Milestones cannot be marked in-progress — P1

`normalize_milestone_input()` and `build_progress_storage()` (`core/work_queue/progress.py:77-120`,
`213-226`) store `{completed: {key: date}}`. A milestone is either complete (has a date) or not
present. `compute_track_percent()` takes the weight of the last completed milestone.

The wizard's Connectivity step presents each of the 6 SFTP and 4 EDI milestones as a three-state
control — `not_started` / `in_progress` / `complete` — and the submit path **discards every
`in_progress` selection**, sending only the completed keys. An analyst who marks four milestones
in-progress and none complete submits a case that the backend records as 0%.

Needed: a per-milestone state on the stored payload (`state` alongside `completed_at`, or a
`started_at` date), reflected in `build_milestones_payload()` and accepted by the progress PATCH
input. Percentage weighting rules for in-progress milestones are a product call — the simplest option
is that in-progress does not contribute to `percent` but is preserved and displayed.

## 3.4 KPI cards ignore the table's filters — P1

The list page's six KPI cards, the SFTP/EDI progress overview and the analyst panel all call the
capability endpoints, which validate through `WorkQueueFilterQuerySerializer` — seven params:
`assigned_to_id`, `wave`, `migration_status`, `vendor_type`, `escalation_status`, `blocker_status`,
`search`.

The list endpoint accepts those plus `vendor_id`, `whitelist_status`, `current_stage`, `server_type`,
`code`, `name`, `reference_id`, `is_visible`, `is_deleted`.

So filtering the table by whitelist status or current stage leaves the KPI cards showing global
counts. The cards are clickable filters, which makes the mismatch worse — clicking a card filters the
table but the card's own number doesn't move.

Needed: `WorkQueueFilterQuerySerializer` accepts the same param set as
`MigrationCaseListQuerySerializer`, and `/work-queue/kpis/`, `/work-queue/progress-summary/` and
`/work-queue/analyst-stats/` all honour them.

## 3.5 Wave values are hardcoded in the UI — P2

`MyWorkQueuePage.tsx:432-437` hardcodes the wave dropdown to `["1","2","3","4"]`. `wave` is a
`PositiveSmallIntegerField` with no upper bound, so wave 5 becomes invisible in the filter the day
someone creates it.

Needed: distinct waves from the API — either a small facet endpoint or a `waves[]` array on
`/work-queue/kpis/`.

## 3.6 Ordering choices are narrower than the FilterSet — P2

Same shape as the providers issue. `MigrationCaseFilter.order_by` supports `name`, `code`, `wave`,
`migration_status`, `last_communication_at`; `MigrationCaseListQuerySerializer` only allows
`created_at` / `updated_at` / `deleted_at` through `ListOrderingMixin`. The 15-column table has no
sorting because the useful values are unreachable.

Needed: widen the query serializer's choices to match.

## 3.7 `assigned_to_id` is rejected on update — P2

`migration_case_update()` explicitly pops `assigned_to_id` (`# assigned_to is action-only`). It is
accepted on create and on `POST …/assign/` only. The detail page's Information and Contacts saves go
through `PATCH …/update/`, so there is no path to reassign a case from the tab where the analyst is
displayed.

Either accept `assigned_to_id` on the update input (emitting the same `assignment` event the action
does), or confirm the action-only contract is deliberate and we'll add a dedicated reassign control
that calls `POST …/assign/`.

## 3.8 Wizard drafts are browser-local — P3

"Save draft" writes the entire six-step wizard state to `localStorage` under
`work-queue-tpa-tpv-registration-draft` (`WorkQueueCreatePage.tsx:83-103`). Drafts don't survive a
different browser or machine, and aren't visible to anyone else.

Optional, only if product wants shared drafts: a draft resource, or accept partial cases with a
`draft` migration status.

## 3.9 `source_system` and `last_synced_at` — P3

Read from `metadata` aliases on the detail page. Low value until there's an integration writing them;
noted so they aren't forgotten if the metadata cleanup happens.

---

# Suggested order

1. **Members `newtech_*` fields** — data is being submitted and silently dropped today; the UI shows
   a hardcoded constant in its place. Highest risk of someone trusting a wrong number.
2. **TPA/TPV tab fields from the spec** (§3.1) — operational status, the four IP-whitelisting values,
   the escalation quartet and the EDI analyst. These are the values registration and the detail tabs
   both need, and they unblock the tracking table columns in §3.2.
3. **Milestone in-progress** (§3.3) — same reason: the wizard collects state that never lands.
4. **Providers list enrichment** (§2.1, §2.2) + **search** (§2.3) — unblocks removing the
   fetch-everything client-side directory, which is the worst scaling problem of the three areas.
5. **Members eligibility filters** (§1.2) + **list DTO fields** (§1.3) — removes the "results may be
   wrong" banner.
6. **KPI filter parity** (§3.4) — cheap, and the mismatch is user-visible on every filter change.
7. **Change events on member update** (§1.5) — removes fabricated audit history from the UI.
8. Ordering choices (§2.4, §3.6), facets (§1.4, §2.3, §3.5), exports (§2.5) — independent, any order.
8. P3 items last.

# Acceptance checklist

### Members
- [ ] `newtech_member_id` / `newtech_family_id` — model, create/update input, list + detail output, list + stats filters, search
- [ ] `status_term_from/to`, `eligibility_effective_from/to` on list + stats
- [ ] List output: `status_effective_date`, `status_term_date`, `coverage_term_date`, `group_id`
- [ ] Facet values for plan name + account group
- [ ] `MemberChangeEvent` emitted from `member_update` and nested section updates
- [ ] Family link dependent detail (person code, coverage, student/disability — or confirm not tracked)
- [ ] `changed_by` on plan history — or confirm the column goes
- [ ] Source-record feed metrics, or a real vendor-history endpoint
- [ ] SSN masking decision

### Providers
- [ ] 12-month KPIs on list rows (or bulk summary endpoint)
- [ ] Profile compact on list rows
- [ ] `search` + `specialty` filters on list; specialty facet
- [ ] `order_by` choices widened to match `ProviderFilter`
- [ ] List CSV export, detail CSV/PDF export, summary + enrollment packet PDFs
- [ ] Recent-activity member identity — populate or remove
- [ ] Scheduled credential expiry status transitions

### TPA/TPV — spec tabs (§3.1)
- [ ] `operational_status` — `not_started` / `in_progress` / `completed`; create, update, list, detail, filter
- [ ] `whitelist_status` — all four spec values incl. `not_required`; whitelist action, DTO, filter
- [ ] `escalated` boolean (or documented derivation from escalation status)
- [ ] `BlockerReason` — add `other`, relabel `second_contact_no_response` to "No response from TPA/TPV"
- [ ] `escalated_to` enum — Internal Team / IT / Management / TPA/TPV / Other
- [ ] `escalation_workflow_status` enum — Submitted / In Progress / Resolved, kept distinct from derived `escalation_status`
- [ ] Service validation: Escalated = Yes requires reason + escalated-to + status
- [ ] `edi_analyst` FK + `edi_analyst_assigned_at` + `edi_analyst_assigned_by`, service-set
- [ ] `POST …/edi-analyst/` assign/reassign action, writing an `assignment` event with the previous analyst
- [ ] EDI analyst required on create
- [ ] `role` + `is_active` filters on `GET /users/list/` for the active analyst picker
- [ ] All five new/changed fields exposed as list filters (tracking table columns 6–10)

### TPA/TPV — other
- [ ] Milestone in-progress state on progress storage, output and PATCH input
- [ ] Capability endpoints accept the full list filter set
- [ ] Distinct waves exposed
- [ ] `order_by` choices widened to match `MigrationCaseFilter`
- [ ] `assigned_to_id` on update — accept, or confirm action-only

# Frontend cleanup once these land

| Backend change | Frontend removal |
|----------------|------------------|
| `newtech_*` fields | `filterLiveNewTechRows()`, demo constants in `member-id-normalize.ts` |
| Eligibility filters | Unsupported-filter banner, `hasUnsupportedLiveFilters` |
| Change events on update | `buildMockMemberChangeEvents` fallback in `membersApi.ts:519-524` |
| Provider list KPIs + profile | `TAXONOMY_LABELS` map and `parseSeedMeta()` in `live-providers.ts` |
| Provider search | `listAllPages()` in `listProviders`, client-side filter and pagination |
| Provider exports | Toast stubs in `ProviderDetailPage.tsx:944-971` |
| TPA/TPV field promotion | `mergeCaseMetadata()` and the derive helpers in `lib/work-queue-detail-tabs.ts:159-177` |
| Whitelist four values | Four-state-to-three-state mapping in the wizard and detail tab |
| `edi_analyst` field | Move assign/reassign onto the Status tab per spec; drop the hand-rolled `previous_*` audit in metadata |
| `role` filter on users | Unfiltered `listUsers()` call behind the analyst pickers |
| KPI filter parity | Unfiltered-KPI fallback query on `MyWorkQueuePage` |

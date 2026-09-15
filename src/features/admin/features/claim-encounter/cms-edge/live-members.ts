import type {
	CmsEdgeMemberListRow,
	MemberCmsStatus,
	MemberRelationship,
	MemberValidationResult,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { CMS_EDGE_MEMBER_DETAIL } from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import type { MemberDetailDto, MemberListDto } from "@/lib/vendor-core/types";

function dash(value: string | null | undefined): string {
	if (value == null || value === "") return "—";
	return String(value);
}

/** Reject faker prose / multi-word junk that leaks into ID fields. */
function isPlausibleIdentifier(value?: string | null): boolean {
	const v = value?.trim();
	if (!v) return false;
	if (/\s/.test(v)) return false;
	if (v.length > 64) return false;
	return true;
}

function pickIdentifier(
	...candidates: Array<string | null | undefined>
): string {
	for (const candidate of candidates) {
		if (isPlausibleIdentifier(candidate)) return candidate!.trim();
	}
	return "—";
}

function formatDate(value: string | null | undefined): string {
	if (!value) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
}

function formatZip(value?: string | null): string {
	const v = value?.trim();
	if (!v) return "—";
	if (/^\d{5}(-\d{4})?$/.test(v)) return v;
	return "—";
}

function formatLocation(dto: MemberListDto): string {
	const zip = formatZip(dto.postal_code);
	const city = dto.city?.trim();
	const state = dto.state?.trim();
	const place = [city, state].filter(Boolean).join(", ");
	if (place && zip !== "—") return `${place} ${zip}`;
	if (place) return place;
	return zip;
}

function formatPlan(value?: string | null): string {
	const v = value?.trim();
	if (!v) return "—";
	const words = v.split(/\s+/);
	const healthcare =
		/\b(PPO|HMO|EPO|POS|Plus|Care|Plan|MDH|DHCF|Medicaid|Medicare|Exchange)\b/i.test(
			v
		) || /\d/.test(v);
	if (words.length >= 4 && !healthcare) return "—";
	if (words.length >= 3 && !healthcare && v.length > 28) return "—";
	return v;
}

function mapRelationship(code?: string): MemberRelationship {
	const v = (code ?? "").toUpperCase();
	if (v === "01" || v === "SPOUSE" || v.includes("SP")) return "Spouse";
	if (v === "19" || v === "CHILD" || v.includes("CH")) return "Child";
	return "Subscriber";
}

function mapSex(gender?: string): "M" | "F" | "—" {
	const v = (gender ?? "").toUpperCase().trim();
	if (!v) return "—";
	if (v.startsWith("F")) return "F";
	if (v.startsWith("M")) return "M";
	return "—";
}

function mapCmsStatus(dto: MemberListDto): MemberCmsStatus {
	const status =
		`${dto.status ?? ""} ${dto.eligibility_status ?? ""}`.toLowerCase();
	if (status.includes("term") || status.includes("inact")) {
		return "Accepted (Terminated)";
	}
	if (status.includes("pend")) return "Needs Review";
	if (status.includes("error") || status.includes("reject")) return "Error";
	if (!formatPlan(dto.plan_name) || formatPlan(dto.plan_name) === "—") {
		return "Unmapped Plan ID";
	}
	return "CMS Ready";
}

function memberName(dto: MemberListDto): string {
	const fromParts = [dto.first_name, dto.last_name]
		.map((p) => p?.trim())
		.filter(
			(p): p is string => typeof p === "string" && p.split(/\s+/).length <= 2
		);
	if (fromParts.length) return fromParts.join(" ");

	const display = dto.display_name?.trim();
	if (display && display.split(/\s+/).length <= 3) return display;

	return pickIdentifier(dto.cardholder_id, dto.external_id, dto.id);
}

/** Map vendor-core member list DTOs → EDGE members table rows. */
export function memberListDtosToRows(
	rows: MemberListDto[]
): CmsEdgeMemberListRow[] {
	return rows.map((dto) => {
		const start = formatDate(dto.coverage_effective_date);
		const planId = formatPlan(dto.plan_name);
		const zipCode = formatZip(dto.postal_code);
		const cmsStatus = mapCmsStatus(dto);
		return {
			id: dto.id,
			name: memberName(dto),
			uniqueEnrolleeId: pickIdentifier(
				dto.newtech_member_id,
				dto.external_id,
				dto.alternate_id,
				dto.cardholder_id,
				dto.reference_id,
				dto.id
			),
			subscriberId: pickIdentifier(
				dto.newtech_family_id,
				dto.cardholder_id,
				dto.reference_id
			),
			relationship: mapRelationship(dto.relationship_code),
			dateOfBirth: formatDate(dto.date_of_birth),
			sex: mapSex(dto.gender),
			zipCode,
			location: formatLocation(dto),
			hiosIssuerId: "—",
			planId,
			coveragePeriod: start === "—" ? "—" : `${start} – present`,
			premium: Number(dto.paid_ytd ?? 0) || 0,
			cmsStatus,
			coverageType: dash(dto.plan_type || dto.lob || "Medical"),
			errorType: cmsStatus === "Error" ? "Eligibility" : null,
		};
	});
}

export function deriveMemberEdgeKpis(rows: CmsEdgeMemberListRow[]) {
	const total = rows.length;
	const ready = rows.filter((r) => r.cmsStatus === "CMS Ready").length;
	const errors = rows.filter(
		(r) =>
			r.cmsStatus === "Error" ||
			r.cmsStatus === "Validation Error" ||
			r.cmsStatus === "Unmapped Plan ID" ||
			Boolean(r.errorType)
	).length;
	const mismatches = rows.filter(
		(r) => r.cmsStatus === "Coverage Mismatch"
	).length;
	const unmapped = rows.filter(
		(r) => r.cmsStatus === "Unmapped Plan ID"
	).length;

	return [
		{
			id: "total",
			label: "Total Members",
			value: total.toLocaleString("en-US"),
			tone: "text-slate-700 bg-slate-500/10",
			valueClassName: "text-foreground",
			icon: "users" as const,
		},
		{
			id: "ready",
			label: "CMS Ready",
			value: ready.toLocaleString("en-US"),
			tone: "text-emerald-700 bg-emerald-500/10",
			valueClassName: "text-emerald-800",
			icon: "check" as const,
		},
		{
			id: "errors",
			label: "Validation Errors",
			value: errors.toLocaleString("en-US"),
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "alert" as const,
		},
		{
			id: "mismatch",
			label: "Coverage Mismatches",
			value: mismatches.toLocaleString("en-US"),
			tone: "text-amber-800 bg-amber-500/10",
			valueClassName: "text-amber-800",
			icon: "circleAlert" as const,
		},
		{
			id: "unmapped",
			label: "Unmapped Plan IDs",
			value: unmapped.toLocaleString("en-US"),
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "text-violet-700",
			icon: "link" as const,
		},
	];
}

/** Map GET /members/stats/ into EDGE members KPI strip (global counts). */
export function memberStatsToEdgeKpis(stats: {
	total: number;
	active: number;
	pending: number;
	termed: number;
	inactive: number;
}): ReturnType<typeof deriveMemberEdgeKpis> {
	return [
		{
			id: "total",
			label: "Total Members",
			value: stats.total.toLocaleString("en-US"),
			tone: "text-slate-700 bg-slate-500/10",
			valueClassName: "text-foreground",
			icon: "users" as const,
		},
		{
			id: "ready",
			label: "Active",
			value: stats.active.toLocaleString("en-US"),
			tone: "text-emerald-700 bg-emerald-500/10",
			valueClassName: "text-emerald-800",
			icon: "check" as const,
		},
		{
			id: "errors",
			label: "Pending",
			value: stats.pending.toLocaleString("en-US"),
			tone: "text-amber-800 bg-amber-500/10",
			valueClassName: "text-amber-800",
			icon: "alert" as const,
		},
		{
			id: "mismatch",
			label: "Termed",
			value: stats.termed.toLocaleString("en-US"),
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "circleAlert" as const,
		},
		{
			id: "unmapped",
			label: "Inactive",
			value: stats.inactive.toLocaleString("en-US"),
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "text-violet-700",
			icon: "link" as const,
		},
	];
}

export function deriveMemberValidationSummary(rows: CmsEdgeMemberListRow[]) {
	const missingSub = rows.filter(
		(r) => !r.subscriberId || r.subscriberId === "—"
	).length;
	const invalidDates = rows.filter(
		(r) => !r.coveragePeriod || r.coveragePeriod === "—"
	).length;
	const invalidPlan = rows.filter(
		(r) => r.cmsStatus === "Unmapped Plan ID" || !r.planId || r.planId === "—"
	).length;
	const needsReview = rows.filter(
		(r) =>
			r.cmsStatus === "Needs Review" ||
			r.cmsStatus === "Error" ||
			r.cmsStatus === "Validation Error" ||
			r.cmsStatus === "Coverage Mismatch"
	).length;

	return [
		{
			id: "missing-sub",
			label: "Missing Subscriber ID",
			value: missingSub.toLocaleString("en-US"),
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "userX" as const,
		},
		{
			id: "invalid-dates",
			label: "Missing Coverage Dates",
			value: invalidDates.toLocaleString("en-US"),
			tone: "text-amber-700 bg-amber-500/10",
			valueClassName: "text-amber-700",
			icon: "calendar" as const,
		},
		{
			id: "invalid-plan",
			label: "Unmapped / Invalid Plan",
			value: invalidPlan.toLocaleString("en-US"),
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "text-violet-700",
			icon: "tag" as const,
		},
		{
			id: "needs-review",
			label: "Needs Review",
			value: needsReview.toLocaleString("en-US"),
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "text-sky-700",
			icon: "copy" as const,
		},
	];
}

export function deriveMemberFilterOptions(rows: CmsEdgeMemberListRow[]) {
	const uniq = (values: string[]) => [
		"All",
		...Array.from(new Set(values.filter(Boolean))).sort(),
	];

	return {
		status: uniq(rows.map((r) => r.cmsStatus)),
		coverageType: uniq(
			rows.map((r) => r.coverageType).filter((v) => v !== "—")
		),
		planId: uniq(rows.map((r) => r.planId).filter((v) => v !== "—")),
		relationship: uniq(rows.map((r) => r.relationship)),
		errorType: uniq(
			rows.map((r) => r.errorType).filter((v): v is string => Boolean(v))
		),
	};
}

export type CmsEdgeMemberDetailView = {
	id: string;
	name: string;
	uniqueEnrolleeId: string;
	cmsStatus: MemberCmsStatus;
	summary: { label: string; value: string; tone?: "default" | "success" }[];
	identification: { label: string; value: string }[];
	enrollmentPeriods: {
		id: string;
		planId: string;
		coverageStart: string;
		coverageEnd: string;
		monthlyPremium: string;
		ehb: string;
		federalAptc: string;
		stateSubsidy: string;
		ichra: string;
		cmsStatus: MemberCmsStatus;
	}[];
	validationHistory: {
		id: string;
		date: string;
		rule: string;
		result: MemberValidationResult;
		message: string;
		sourceFile: string;
		reviewedBy: string;
	}[];
	family: {
		id: string;
		name: string;
		role: string;
		uniqueEnrolleeId: string;
		primary?: boolean;
	}[];
	currentValidation: {
		passed: number;
		warnings: number;
		errors: number;
		alert: string | null;
	};
	submissionHistory: {
		id: string;
		submissionType: string;
		reportingPeriod: string;
		submittedDate: string;
		status: string;
		fileName: string;
	}[];
	/** Best-effort source-record label for View Source Record action. */
	sourceRecordLabel?: string | null;
	/** Compact accumulator KPI line when summary API returns data. */
	accumulatorNote?: string | null;
};

/** Adapt fixture member detail → live view shape (explicit mock mode only). */
export function memberMockDetailToView(
	detail: typeof CMS_EDGE_MEMBER_DETAIL = CMS_EDGE_MEMBER_DETAIL,
	overrideId?: string
): CmsEdgeMemberDetailView {
	return {
		id: overrideId ?? detail.id,
		name: detail.name,
		uniqueEnrolleeId: detail.uniqueEnrolleeId,
		cmsStatus: detail.cmsStatus,
		summary: detail.summary.map((s) => ({
			label: s.label,
			value: s.value,
			tone: s.tone,
		})),
		identification: detail.identification.map((f) => ({
			label: f.label,
			value: f.value,
		})),
		enrollmentPeriods: detail.enrollmentPeriods.map((ep) => ({
			id: ep.id,
			planId: ep.planId,
			coverageStart: ep.coverageStart,
			coverageEnd: ep.coverageEnd,
			monthlyPremium: ep.monthlyPremium,
			ehb: ep.ehb,
			federalAptc: ep.federalAptc,
			stateSubsidy: ep.stateSubsidy,
			ichra: ep.ichra,
			cmsStatus: ep.cmsStatus,
		})),
		validationHistory: detail.validationHistory.map((vh) => ({
			id: vh.id,
			date: vh.date,
			rule: vh.rule,
			result: vh.result,
			message: vh.message,
			sourceFile: vh.sourceFile,
			reviewedBy: vh.reviewedBy,
		})),
		family: detail.family.map((m) => ({
			id: m.id,
			name: m.name,
			role: m.role,
			uniqueEnrolleeId: m.uniqueEnrolleeId,
			primary: m.primary,
		})),
		currentValidation: {
			passed: detail.currentValidation.passed,
			warnings: detail.currentValidation.warnings,
			errors: detail.currentValidation.errors,
			alert: detail.currentValidation.alert,
		},
		submissionHistory: detail.submissionHistory.map((sh) => ({
			id: sh.id,
			submissionType: sh.submissionType,
			reportingPeriod: sh.reportingPeriod,
			submittedDate: sh.submittedDate,
			status: sh.status,
			fileName: sh.fileName,
		})),
	};
}

/** Map member detail DTO → EDGE member detail view (sparse EDGE-only fields → —). */
export function memberDetailDtoToView(
	dto: MemberDetailDto
): CmsEdgeMemberDetailView {
	const listRow = memberListDtosToRows([dto])[0]!;
	const family = (dto.family_members ?? []).map((raw, i) => {
		const m = raw as Record<string, unknown>;
		const relationship = String(m.relationship_code ?? m.relationship ?? "—");
		return {
			id: String(m.id ?? `fam-${i}`),
			name: String(m.display_name ?? m.first_name ?? "—"),
			role: relationship,
			uniqueEnrolleeId: pickIdentifier(
				String(m.cardholder_id ?? ""),
				String(m.external_id ?? "")
			),
			primary: i === 0,
		};
	});

	const coverageStatus = dash(dto.eligibility_status || dto.status);
	const coverageTone = coverageStatus.toLowerCase().includes("active")
		? "success"
		: "default";

	return {
		id: dto.id,
		name: listRow.name,
		uniqueEnrolleeId: listRow.uniqueEnrolleeId,
		cmsStatus: listRow.cmsStatus,
		summary: [
			{ label: "Relationship", value: listRow.relationship },
			{ label: "DOB", value: listRow.dateOfBirth },
			{ label: "Sex", value: listRow.sex },
			{ label: "Location", value: listRow.location },
			{ label: "Current Plan", value: listRow.planId },
			{
				label: "Coverage Status",
				value: coverageStatus,
				tone: coverageTone as "default" | "success",
			},
		],
		identification: [
			{ label: "Unique Enrollee ID", value: listRow.uniqueEnrolleeId },
			{ label: "Subscriber ID", value: listRow.subscriberId },
			{
				label: "Subscriber Indicator",
				value: listRow.relationship === "Subscriber" ? "Y" : "N",
			},
			{ label: "Relationship", value: listRow.relationship },
			{ label: "Date of Birth", value: listRow.dateOfBirth },
			{ label: "Sex", value: listRow.sex },
			{ label: "ZIP Code", value: listRow.zipCode },
			{ label: "Race / Ethnicity", value: dash(dto.race || dto.ethnicity) },
			{
				label: "Source Vendor",
				value: dash(dto.vendor_source || dto.source_system),
			},
			{
				label: "Source Member ID",
				value: pickIdentifier(dto.external_id, dto.cardholder_id),
			},
		],
		enrollmentPeriods: [
			{
				id: `${dto.id}-ep-0`,
				planId: listRow.planId,
				coverageStart: formatDate(dto.coverage_effective_date),
				coverageEnd: "—",
				monthlyPremium: "—",
				ehb: "—",
				federalAptc: "—",
				stateSubsidy: "—",
				ichra: "—",
				cmsStatus: listRow.cmsStatus,
			},
		],
		validationHistory: [],
		family,
		currentValidation: {
			passed: 0,
			warnings: 0,
			errors: 0,
			alert: null,
		},
		submissionHistory: [],
	};
}

export type MemberDetailEnrichment = {
	planHistory?: Record<string, unknown>[];
	eligibilityHistory?: Record<string, unknown>[];
	exceptions?: Record<string, unknown>[];
	familyLinks?: Record<string, unknown>[];
	sourceRecords?: Record<string, unknown>[];
	changeEvents?: Record<string, unknown>[];
	memberClaims?: Record<string, unknown>[];
	accumulatorSummary?: Record<string, unknown> | null;
};

function mapMemberValidationResult(
	raw: string | undefined
): MemberValidationResult {
	const s = (raw ?? "").toLowerCase();
	if (s.includes("pass")) return "Passed";
	if (s.includes("correct")) return "Corrected";
	if (s.includes("warn") || s.includes("pend")) return "Warning";
	if (s.includes("fail") || s.includes("error") || s.includes("open")) {
		return "Failed";
	}
	return "Warning";
}

function mapMemberValidationHistory(
	rows: Record<string, unknown>[]
): CmsEdgeMemberDetailView["validationHistory"] {
	return rows.map((r, i) => ({
		id: String(r.id ?? `vh-${i}`),
		date: formatDate(
			String(
				r.start_detected ??
					r.detected_at ??
					r.created_at ??
					r.status_effective_date ??
					""
			)
		),
		rule: String(r.exception_type ?? r.rule_code ?? r.code ?? r.rule ?? "—"),
		result: mapMemberValidationResult(String(r.status ?? r.result ?? "")),
		message: String(r.description ?? r.message ?? r.detail ?? "—"),
		sourceFile: String(r.source ?? r.source_file ?? r.source_system ?? "—"),
		reviewedBy: String(r.verified_by ?? r.resolved_by ?? r.reviewed_by ?? "—"),
	}));
}

function mapMemberEnrollmentPeriods(
	dto: MemberDetailDto,
	listRow: CmsEdgeMemberListRow,
	planHistory: Record<string, unknown>[]
): CmsEdgeMemberDetailView["enrollmentPeriods"] {
	const sources =
		planHistory.length > 0
			? planHistory
			: (dto.plan_history ?? []).length > 0
				? (dto.plan_history ?? [])
				: dto.plan_coverage
					? [dto.plan_coverage]
					: [];

	if (sources.length === 0) {
		return [
			{
				id: `${dto.id}-ep-0`,
				planId: listRow.planId,
				coverageStart: formatDate(dto.coverage_effective_date),
				coverageEnd: "—",
				monthlyPremium: "—",
				ehb: "—",
				federalAptc: "—",
				stateSubsidy: "—",
				ichra: "—",
				cmsStatus: listRow.cmsStatus,
			},
		];
	}

	return sources.map((r, i) => {
		const planCoverage = r as Record<string, unknown>;
		const planId = formatPlan(
			String(
				planCoverage.plan_name ??
					planCoverage.plan_id ??
					planCoverage.plan_code ??
					""
			)
		);
		const cmsStatus = mapCmsStatus({
			...dto,
			plan_name: planId !== "—" ? planId : dto.plan_name,
			status: String(planCoverage.status ?? dto.status ?? ""),
			eligibility_status: String(
				planCoverage.eligibility_status ?? dto.eligibility_status ?? ""
			),
		} as MemberListDto);

		return {
			id: String(planCoverage.id ?? `${dto.id}-ep-${i}`),
			planId,
			coverageStart: formatDate(
				String(
					planCoverage.start_date ??
						planCoverage.coverage_effective_date ??
						dto.coverage_effective_date ??
						""
				)
			),
			coverageEnd: formatDate(
				String(planCoverage.end_date ?? planCoverage.coverage_term_date ?? "")
			),
			monthlyPremium: dash(
				String(planCoverage.monthly_premium ?? planCoverage.premium ?? "")
			),
			ehb: dash(String(planCoverage.ehb_premium ?? planCoverage.ehb ?? "")),
			federalAptc: dash(
				String(planCoverage.federal_aptc ?? planCoverage.aptc ?? "")
			),
			stateSubsidy: dash(String(planCoverage.state_subsidy ?? "")),
			ichra:
				planCoverage.ichra === true || planCoverage.ichra === "true"
					? "true"
					: planCoverage.ichra === false || planCoverage.ichra === "false"
						? "false"
						: dash(String(planCoverage.ichra ?? "")),
			cmsStatus,
		};
	});
}

/** Map member detail DTO + nested API slices → EDGE member detail view. */
export function memberDetailDtoToViewEnriched(
	dto: MemberDetailDto,
	enrichment: MemberDetailEnrichment = {}
): CmsEdgeMemberDetailView {
	const base = memberDetailDtoToView(dto);
	const listRow = memberListDtosToRows([dto])[0]!;
	const planHistory =
		enrichment.planHistory ??
		(dto.plan_history as Record<string, unknown>[] | undefined) ??
		[];
	const exceptionRows =
		enrichment.exceptions ??
		(dto.exceptions as Record<string, unknown>[] | undefined) ??
		[];
	const validationHistory = mapMemberValidationHistory(exceptionRows);
	const passed = validationHistory.filter((v) => v.result === "Passed").length;
	const warnings = validationHistory.filter(
		(v) => v.result === "Warning"
	).length;
	const errors = validationHistory.filter((v) => v.result === "Failed").length;

	const familyFromLinks = (enrichment.familyLinks ?? []).map((r, i) => {
		const subscriberId = String(r.subscriber_id ?? "");
		const viewingAsSubscriber = subscriberId === String(dto.id);
		const counterpart = viewingAsSubscriber
			? {
					id: r.dependent_id,
					first_name: r.dependent_first_name,
					last_name: r.dependent_last_name,
					cardholder_id: r.dependent_cardholder_id,
					person_code: r.dependent_person_code,
					external_id: r.dependent_external_id,
				}
			: {
					id: r.subscriber_id,
					first_name: r.subscriber_first_name,
					last_name: r.subscriber_last_name,
					cardholder_id: r.subscriber_cardholder_id,
					person_code: r.subscriber_person_code,
					external_id: r.subscriber_external_id,
				};
		const nested = (r.dependent ?? r.member ?? {}) as Record<string, unknown>;
		const name = String(
			[counterpart.first_name, counterpart.last_name]
				.filter(Boolean)
				.join(" ") ||
				nested.display_name ||
				[nested.first_name, nested.last_name].filter(Boolean).join(" ") ||
				r.dependent_name ||
				"—"
		);
		const role = viewingAsSubscriber
			? String(
					r.relationship_label ?? r.relationship_code ?? r.relationship ?? "—"
				)
			: "Subscriber";
		return {
			id: String(r.id ?? counterpart.id ?? `fam-link-${i}`),
			name: name.trim() || "—",
			role,
			uniqueEnrolleeId: pickIdentifier(
				String(counterpart.cardholder_id ?? nested.cardholder_id ?? ""),
				String(counterpart.external_id ?? nested.external_id ?? ""),
				String(counterpart.id ?? "")
			),
			primary: viewingAsSubscriber ? i === 0 : true,
		};
	});

	const sourceRecords = enrichment.sourceRecords ?? [];
	const primarySource = sourceRecords[0];
	const sourceRecordLabel = primarySource
		? String(
				primarySource.original_filename ??
					primarySource.source_system ??
					primarySource.id ??
					"Source record"
			)
		: null;

	const changeEvents = enrichment.changeEvents ?? [];
	const eligibilityHistory = enrichment.eligibilityHistory ?? [];
	const submissionHistory = [
		...changeEvents.map((r, i) => ({
			id: String(r.id ?? `ce-${i}`),
			submissionType: String(r.category ?? r.field_name ?? "Change event"),
			reportingPeriod: dash(String(r.field_name ?? "")),
			submittedDate: formatDate(String(r.created_at ?? "")),
			status: "Recorded",
			fileName:
				[r.old_value, r.new_value]
					.filter((v) => v != null && String(v) !== "")
					.map(String)
					.join(" → ") || "—",
		})),
		...eligibilityHistory.map((r, i) => ({
			id: String(r.id ?? `eh-${i}`),
			submissionType: "Eligibility history",
			reportingPeriod: formatDate(
				String(r.status_effective_date ?? r.effective_date ?? "")
			),
			submittedDate: formatDate(String(r.created_at ?? r.updated_at ?? "")),
			status: String(r.status ?? r.eligibility_status ?? "—"),
			fileName: String(r.source ?? r.source_file ?? r.plan_name ?? "—"),
		})),
	];

	const claims = enrichment.memberClaims ?? [];
	const claimNote =
		claims.length > 0
			? `${claims.length} linked member claim${claims.length === 1 ? "" : "s"}`
			: null;

	const acc = enrichment.accumulatorSummary;
	const accumulatorNote = acc
		? String(
				acc.current_plan_name
					? `Accumulators: ${acc.current_plan_name}`
					: "Accumulator summary available"
			)
		: null;

	const alertParts = [
		errors > 0
			? `${errors} open validation exception${errors === 1 ? "" : "s"}`
			: warnings > 0
				? `${warnings} validation warning${warnings === 1 ? "" : "s"}`
				: null,
		claimNote,
		accumulatorNote,
	].filter(Boolean);

	const identificationExtra: { label: string; value: string }[] = [];
	if (claims[0]) {
		identificationExtra.push({
			label: "Recent Member Claim",
			value: String(claims[0].claim_number ?? claims[0].id ?? "—"),
		});
	}

	return {
		...base,
		family: familyFromLinks.length > 0 ? familyFromLinks : base.family,
		enrollmentPeriods: mapMemberEnrollmentPeriods(dto, listRow, planHistory),
		validationHistory,
		submissionHistory,
		sourceRecordLabel,
		accumulatorNote,
		identification: [...base.identification, ...identificationExtra],
		currentValidation: {
			passed,
			warnings,
			errors,
			alert: alertParts.length ? alertParts.join(" · ") : null,
		},
	};
}

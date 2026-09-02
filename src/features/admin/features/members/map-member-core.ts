/**
 * Map vendor-core Member 360 (snake_case) → dashboard MemberSummary / MemberDetail.
 * Keep UI types unchanged; fill gaps with safe empty defaults.
 */
import {
	fixNewtechId,
	getDemoMemberOverlay,
	normalizeMemberWireIds,
} from "@/features/admin/features/members/member-id-normalize";
import type {
	AccumulatorAmountTriple,
	AccumulatorKpi,
	AccumulatorRow,
	AccumulatorSummary,
	AccumulatorTableRow,
	AccumulatorTransaction,
	DependentRow,
	EligibilityExceptionRow,
	EligibilityHistoryRow,
	EligibilityStatus,
	ExceptionStatus,
	MemberAlert,
	MemberClaimRow,
	MemberDetail,
	MemberStatus,
	MemberSummary,
	OtherStatusRow,
	PlanHistoryRow,
	VendorSourceRow,
} from "@/features/admin/features/members/mock-data";
import { buildMockAccumulatorTransactions } from "@/features/admin/features/members/mock-data";
import { isMembersMockEnabled } from "@/lib/mock-mode";
import type {
	AccumulatorRowDetailDto,
	AccumulatorRowListDto,
	MemberAccumulatorAmountDto,
	MemberAccumulatorKpiDto,
	MemberAccumulatorSummaryDto,
	MemberAccumulatorTableRowDto,
	MemberAccumulatorTransactionDto,
	MemberCreateBody,
	MemberDetailDto,
	MemberListDto,
	MemberWriteBody,
	PharmacyClaimRowDetailDto,
	PharmacyClaimRowListDto,
} from "@/lib/vendor-core/types";

function str(v: unknown, fallback = ""): string {
	if (v == null) return fallback;
	return String(v);
}

function num(v: unknown, fallback = 0): number {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim() !== "") {
		const n = Number(v);
		return Number.isFinite(n) ? n : fallback;
	}
	return fallback;
}

function dateStr(v: unknown, fallback = "—"): string {
	if (v == null || v === "") return fallback;
	const s = String(v);
	return s.length >= 10 ? s.slice(0, 10) : s;
}

function mapGender(raw: string | undefined): MemberSummary["gender"] {
	const g = (raw || "").trim().toLowerCase();
	if (g === "m" || g === "male") return "Male";
	if (g === "f" || g === "female") return "Female";
	if (g === "other") return "Other";
	if (!g) return "Unknown";
	return "Unknown";
}

function mapMemberStatus(raw: string | undefined): MemberStatus {
	const s = (raw || "").trim().toLowerCase();
	if (s === "active" || s === "eligible") return "active";
	if (s === "pending") return "pending";
	if (s === "inactive" || s === "ineligible") return "inactive";
	if (s === "termed" || s === "terminated") return "termed";
	return "inactive";
}

function mapEligibilityLabel(
	raw: string | undefined
): MemberSummary["eligibilityLabel"] {
	const s = (raw || "").trim();
	if (s === "Active" || s === "Inactive" || s === "Pending" || s === "Termed") {
		return s;
	}
	const lower = s.toLowerCase();
	if (lower === "active" || lower === "eligible") return "Active";
	if (lower === "pending") return "Pending";
	if (lower === "inactive" || lower === "ineligible") return "Inactive";
	if (lower === "termed" || lower === "terminated") return "Termed";
	return undefined;
}

function mapEligibilityStatus(raw: string | undefined): EligibilityStatus {
	const s = (raw || "").trim().toLowerCase();
	if (s === "eligible" || s === "active") return "eligible";
	if (s === "pending") return "pending";
	if (s === "ineligible" || s === "inactive") return "ineligible";
	if (s === "termed" || s === "terminated") return "termed";
	return "ineligible";
}

function mapProgram(raw: string | undefined): MemberSummary["program"] {
	const p = (raw || "").trim().toUpperCase();
	if (p === "MDH" || p === "DHCF" || p === "BHP") return p;
	return "DHCF";
}

function mapClaimType(kind: string | undefined): MemberClaimRow["type"] {
	const k = (kind || "").toLowerCase();
	if (k === "pharmacy") return "Pharmacy";
	if (k === "dental") return "Dental";
	if (k === "vision") return "Vision";
	if (k === "encounter") return "Encounter";
	return "Medical";
}

function mapClaimStatus(raw: string | undefined): MemberClaimRow["status"] {
	const s = (raw || "").toLowerCase();
	if (s === "paid") return "paid";
	if (s === "denied") return "denied";
	if (s === "partial") return "partial";
	return "pending";
}

function mapExceptionStatus(raw: string | undefined): ExceptionStatus {
	const s = (raw || "").toLowerCase();
	if (s === "resolved") return "resolved";
	if (s === "in_progress" || s === "in-progress") return "in_progress";
	return "open";
}

function mapRelationship(
	code: string | undefined
): DependentRow["relationship"] {
	const c = (code || "").toLowerCase();
	if (c === "self" || c === "18" || c === "1") return "Self";
	if (c.includes("spouse") || c === "01" || c === "2") return "Spouse";
	if (c.includes("daughter") || c === "19") return "Daughter";
	if (c.includes("son") || c === "19s") return "Son";
	return "Other";
}

function mapComms(
	raw: string | undefined
): MemberDetail["communicationPreference"] {
	const s = (raw || "").toLowerCase();
	if (s === "email") return "Email";
	if (s === "mail") return "Mail";
	if (s === "sms" || s === "text") return "SMS";
	return "Phone";
}

export function memberListDtoToSummary(row: MemberListDto): MemberSummary {
	const nestedVendor = (row as MemberListDto & { vendor?: unknown }).vendor;
	const nestedVendorId =
		nestedVendor && typeof nestedVendor === "object"
			? str((nestedVendor as { id?: unknown }).id)
			: "";
	const rawCardholderId = str(row.cardholder_id || row.reference_id || row.id);
	const personCode = str(row.person_code, "01");
	const ids = normalizeMemberWireIds({
		cardholderId: rawCardholderId,
		personCode,
		externalId: str(row.external_id),
		alternateId: str(row.alternate_id),
	});
	const demoOverlay = getDemoMemberOverlay({
		cardholderId: rawCardholderId,
		personCode,
		externalId: str(row.external_id),
		alternateId: str(row.alternate_id),
		newtechMemberId: str(row.newtech_member_id),
		newtechFamilyId: str(row.newtech_family_id),
	});
	return {
		id: str(row.id),
		memberId: (demoOverlay?.memberId ?? ids.cardholderId).slice(0, 64),
		vendorId: str(row.vendor_id) || nestedVendorId || undefined,
		alternateId: demoOverlay?.alternateId ?? (ids.alternateId || undefined),
		newtechMemberId:
			demoOverlay?.newtechMemberId ??
			(fixNewtechId(str(row.newtech_member_id)) || undefined),
		newtechFamilyId:
			demoOverlay?.newtechFamilyId ??
			(fixNewtechId(str(row.newtech_family_id)) || undefined),
		firstName: demoOverlay?.firstName ?? str(row.first_name, "—"),
		middleName: demoOverlay ? undefined : str(row.middle_name) || undefined,
		lastName: demoOverlay?.lastName ?? str(row.last_name, "—"),
		dob: demoOverlay?.dob ?? dateStr(row.date_of_birth),
		gender: demoOverlay?.gender ?? mapGender(row.gender),
		ssnLast4: demoOverlay?.ssnLast4 ?? str(row.ssn_last4, "****"),
		phone: str(row.phone, "—"),
		email: demoOverlay?.email ?? str(row.email),
		addressLine1: str(row.address_line1, "—"),
		addressLine2: str(row.address_line2) || undefined,
		city: str(row.city, "—"),
		state: str(row.state, "—"),
		zip: str(row.postal_code, "—"),
		status: mapMemberStatus(row.status),
		eligibilityLabel: mapEligibilityLabel(
			row.eligibility_label || row.eligibility_status
		),
		accountGroup: str(row.account_group || row.group_name) || undefined,
		program: mapProgram(row.program),
		planName: str(row.plan_name, "—"),
		planType: str(row.plan_type, "—"),
		lob: str(row.lob, "—"),
		pcpName: str(row.pcp_name, "—"),
		pcpNpi: str(row.pcp_npi, "—"),
		memberSince: dateStr(row.member_since),
		coverageEffectiveDate: row.coverage_effective_date
			? dateStr(row.coverage_effective_date)
			: undefined,
		lastClaimDate: row.last_claim_date ? dateStr(row.last_claim_date) : null,
		claimsYtd: num(row.claims_ytd),
		paidYtd: num(row.paid_ytd),
		vendorSource: str(row.vendor_source || row.source_system, "—"),
	};
}

export function mapEligibilityHistory(
	rows: Record<string, unknown>[] | undefined
): EligibilityHistoryRow[] {
	return (rows ?? []).map((r) => ({
		id: str(r.id),
		startDate: dateStr(r.start_date),
		endDate: r.end_date ? dateStr(r.end_date) : null,
		status: mapEligibilityStatus(str(r.status)),
		source: str(r.source, "—"),
		groupCaseId: str(r.group_case_id, "—"),
		reason: str(r.reason, "—"),
		verifiedBy: str(r.verified_by, "—"),
	}));
}

export function mapPlanHistory(
	rows: Record<string, unknown>[] | undefined
): PlanHistoryRow[] {
	return (rows ?? []).map((r) => ({
		id: str(r.id),
		planName: str(r.plan_name, "—"),
		planType: str(r.plan_type, "—"),
		planId: str(r.plan_id || r.plan_code, "—"),
		carrier: str(r.carrier, "—"),
		startDate: dateStr(r.start_date),
		endDate: r.end_date ? dateStr(r.end_date) : null,
		changeReason: str(r.change_reason, "—"),
	}));
}

export function mapDependents(
	rows: Record<string, unknown>[] | undefined
): DependentRow[] {
	return (rows ?? []).map((r) => {
		const rawCardholderId = str(r.cardholder_id);
		const personCode = str(r.person_code, "02");
		const ids = normalizeMemberWireIds({
			cardholderId: rawCardholderId,
			personCode,
			externalId: str(r.external_id),
			alternateId: str(r.alternate_id),
		});
		const demoOverlay = getDemoMemberOverlay({
			cardholderId: rawCardholderId,
			personCode,
			externalId: str(r.external_id),
			alternateId: str(r.alternate_id),
		});
		return {
			id: str(r.id),
			name: demoOverlay
				? `${demoOverlay.firstName} ${demoOverlay.lastName}`
				: [str(r.first_name), str(r.last_name)].filter(Boolean).join(" ") ||
					"—",
			relationship: mapRelationship(str(r.relationship_code)),
			dob: demoOverlay?.dob ?? dateStr(r.date_of_birth),
			gender: demoOverlay?.gender ?? mapGender(str(r.gender)),
			coverageStatus: mapMemberStatus(str(r.status)),
			memberId: demoOverlay?.memberId ?? (ids.cardholderId || undefined),
			pcpName: str(r.pcp_name) || undefined,
			planName: str(r.plan_name) || undefined,
		};
	});
}

/** `GET …/family-links/list/` rows → household cards. */
export function mapFamilyLinks(
	rows: Record<string, unknown>[] | undefined
): DependentRow[] {
	return (rows ?? []).map((r) => {
		const code = str(r.relationship_code);
		const label = str(r.relationship_label);
		const rawCardholderId = str(r.dependent_cardholder_id);
		const demoOverlay = getDemoMemberOverlay({
			cardholderId: rawCardholderId,
			personCode: "02",
		});
		return {
			id: str(r.id),
			name: demoOverlay
				? `${demoOverlay.firstName} ${demoOverlay.lastName}`
				: [str(r.dependent_first_name), str(r.dependent_last_name)]
						.filter(Boolean)
						.join(" ") || "—",
			relationship: mapRelationship(label || code),
			relationshipCode: code || undefined,
			relationshipLabel: label || undefined,
			dob: demoOverlay?.dob ?? dateStr(r.dependent_date_of_birth),
			gender: demoOverlay?.gender ?? "—",
			coverageStatus: mapMemberStatus(str(r.dependent_status)),
			memberId: demoOverlay?.memberId ?? (rawCardholderId || undefined),
			dependentId: str(r.dependent_id) || undefined,
		};
	});
}

export type MemberFamilyLinkDetail = {
	id: string;
	subscriberId: string;
	dependentId: string;
	relationshipCode: string;
	relationshipLabel: string;
	dependentCardholderId: string;
	dependentFirstName: string;
	dependentLastName: string;
	dependentStatus: string;
	createdAt: string;
};

export function mapFamilyLinkDetail(
	row: Record<string, unknown>
): MemberFamilyLinkDetail {
	return {
		id: str(row.id),
		subscriberId: str(row.subscriber_id),
		dependentId: str(row.dependent_id),
		relationshipCode: str(row.relationship_code),
		relationshipLabel: str(row.relationship_label),
		dependentCardholderId: str(row.dependent_cardholder_id),
		dependentFirstName: str(row.dependent_first_name),
		dependentLastName: str(row.dependent_last_name),
		dependentStatus: str(row.dependent_status),
		createdAt: row.created_at ? String(row.created_at) : "—",
	};
}

export function mapClaims(
	rows: Record<string, unknown>[] | undefined
): MemberClaimRow[] {
	return (rows ?? []).map((r) => ({
		id: str(r.id),
		dos: dateStr(r.service_date),
		claimNumber: str(r.claim_number, "—"),
		type: mapClaimType(str(r.claim_kind)),
		provider: str(
			r.provider_name || r.rendering_provider_name || r.billing_provider_name,
			"—"
		),
		billed: num(r.billed_amount),
		paid: num(r.paid_amount),
		status: mapClaimStatus(str(r.status)),
	}));
}

export function mapAccumulators(
	rows: Record<string, unknown>[] | undefined
): AccumulatorRow[] {
	return (rows ?? []).map((r) => ({
		id: str(r.id),
		label: str(r.label, "—"),
		individual: num(r.individual),
		family: num(r.family),
		remaining: num(r.remaining),
		limit: num(r.limit),
	}));
}

const EMPTY_AMOUNT: AccumulatorAmountTriple = {
	applied: null,
	remaining: null,
	total: null,
};

function mapAmountTriple(raw: unknown): AccumulatorAmountTriple {
	if (!raw || typeof raw !== "object") return { ...EMPTY_AMOUNT };
	const o = raw as MemberAccumulatorAmountDto;
	return {
		applied: o.applied == null ? null : num(o.applied),
		remaining: o.remaining == null ? null : num(o.remaining),
		total: o.total == null ? null : num(o.total),
	};
}

function mapAccumulatorTableRow(
	r: MemberAccumulatorTableRowDto | Record<string, unknown>
): AccumulatorTableRow {
	const row = r as MemberAccumulatorTableRowDto & Record<string, unknown>;
	const levelRaw = str(row.level).toLowerCase();
	const catRaw = str(row.category).toLowerCase();
	return {
		id: str(row.id),
		category: catRaw === "pharmacy" ? "pharmacy" : "medical",
		planId: str(row.plan_id, "—"),
		accountGroupId: str(row.account_group_id, "—"),
		internalMemberId: str(row.internal_member_id, "—"),
		internalFamilyId: str(row.internal_family_id, "—"),
		accumulatorType: str(row.accumulator_type, "—"),
		level: levelRaw === "family" ? "family" : "individual",
		deductible: mapAmountTriple(row.deductible),
		oop: mapAmountTriple(row.oop),
		benefitMax: mapAmountTriple(row.benefit_max),
		planYearAmount:
			row.plan_year_amount == null ? null : num(row.plan_year_amount),
		planYearStart: row.plan_year_start ? dateStr(row.plan_year_start) : null,
		planYearEnd: row.plan_year_end ? dateStr(row.plan_year_end) : null,
		resetDate: row.reset_date ? dateStr(row.reset_date) : null,
		sourceAccumulatorId: row.source_accumulator_id
			? str(row.source_accumulator_id)
			: null,
	};
}

function mapAccumulatorKpi(k: MemberAccumulatorKpiDto): AccumulatorKpi {
	return {
		key: str(k.key),
		label: str(k.label),
		individualApplied: num(k.individual_applied),
		individualTotal:
			k.individual_total == null ? null : num(k.individual_total),
		familyApplied: num(k.family_applied),
		familyTotal: k.family_total == null ? null : num(k.family_total),
	};
}

function mapAccumulatorTransaction(
	t: MemberAccumulatorTransactionDto | Record<string, unknown>
): AccumulatorTransaction {
	const row = t as MemberAccumulatorTransactionDto;
	const levelRaw = str(row.level).toLowerCase();
	return {
		id: str(row.id),
		date: dateStr(row.date),
		planId: str(row.plan_id, "—"),
		accumulatorType: str(row.accumulator_type, "—"),
		level: levelRaw === "family" ? "family" : "individual",
		serviceDate: row.service_date ? dateStr(row.service_date) : null,
		description: str(row.description, "—"),
		amount: num(row.amount),
		individualAmount: num(row.individual_amount),
		familyAmount: num(row.family_amount),
		source: str(row.source, "—"),
	};
}

/** Map flat `accumulator-rows` list item → Accumulators tab transaction. */
export function mapAccumulatorFileRowToTransaction(
	row: AccumulatorRowListDto | AccumulatorRowDetailDto,
	planId = "—"
): AccumulatorTransaction {
	const ded = num(row.amount_applied_to_deductible);
	const oop = num(row.amount_applied_to_oop);
	const paid = num(row.plan_paid_amount);
	const amount = ded || oop || paid;
	const name =
		[row.patient_first_name, row.patient_last_name]
			.map((p) => str(p).trim())
			.filter(Boolean)
			.join(" ") || "—";
	const type = ded
		? "Deductible"
		: oop
			? "Out-of-Pocket"
			: paid
				? "Plan Paid"
				: "—";
	const dos = row.date_of_service ? dateStr(row.date_of_service) : null;
	const created =
		"created_at" in row && row.created_at ? dateStr(row.created_at) : "—";
	return {
		id: str(row.id),
		date: dos || created,
		planId,
		accumulatorType: type,
		level: "individual",
		serviceDate: dos,
		description: name,
		amount,
		individualAmount: amount,
		familyAmount: 0,
		source: "Accumulator File",
	};
}

/** Map flat `pharmacy-claim-rows` list item → Accumulators tab transaction. */
export function mapPharmacyClaimRowToTransaction(
	row: PharmacyClaimRowListDto | PharmacyClaimRowDetailDto,
	planId = "—"
): AccumulatorTransaction {
	const paid = num(row.total_amount_paid);
	const patientPay = num(row.patient_pay_amount);
	const amount = paid || patientPay;
	const drug = str(row.drug_name).trim();
	const claimNo = str(row.claim_no).trim();
	const name =
		[row.patient_first_name, row.patient_last_name]
			.map((p) => str(p).trim())
			.filter(Boolean)
			.join(" ") || "—";
	const description =
		[drug || null, claimNo ? `Claim ${claimNo}` : null, name]
			.filter(Boolean)
			.join(" · ") || "—";
	const dos = row.date_of_service ? dateStr(row.date_of_service) : null;
	const created =
		"created_at" in row && row.created_at ? dateStr(row.created_at) : "—";
	return {
		id: str(row.id),
		date: dos || created,
		planId,
		accumulatorType: "Pharmacy",
		level: "individual",
		serviceDate: dos,
		description,
		amount,
		individualAmount: amount,
		familyAmount: 0,
		source: "Pharmacy Claim",
	};
}

/** Merge + sort recent txs by date desc. */
export function mergeRecentAccumulatorTransactions(
	...groups: AccumulatorTransaction[][]
): AccumulatorTransaction[] {
	return groups.flat().sort((a, b) => str(b.date).localeCompare(str(a.date)));
}

/** Map BE `accumulator_summary` (or partial) → UI AccumulatorSummary. */
export function mapAccumulatorSummary(
	raw: MemberAccumulatorSummaryDto | Record<string, unknown> | undefined | null
): AccumulatorSummary | undefined {
	if (!raw || typeof raw !== "object") return undefined;
	const s = raw as MemberAccumulatorSummaryDto;
	const medical = (s.medical_rows ?? []).map(mapAccumulatorTableRow);
	const pharmacy = (s.pharmacy_rows ?? []).map(mapAccumulatorTableRow);
	const kpis = (s.kpis ?? []).map(mapAccumulatorKpi);
	const tx = (s.recent_transactions ?? []).map(mapAccumulatorTransaction);
	if (
		medical.length === 0 &&
		pharmacy.length === 0 &&
		kpis.length === 0 &&
		tx.length === 0 &&
		!s.current_plan_name
	) {
		return undefined;
	}
	return {
		currentPlanName: str(s.current_plan_name, "—"),
		effectiveDate: s.effective_date ? dateStr(s.effective_date) : null,
		asOfDate: s.as_of_date ? dateStr(s.as_of_date) : null,
		kpis,
		medicalRows: medical,
		pharmacyRows: pharmacy,
		recentTransactions: tx,
	};
}

function classifyAccumulatorLabel(label: string): {
	category: "medical" | "pharmacy";
	bucket: "deductible" | "oop" | "benefit_max";
	typeLabel: string;
} {
	const lower = label.toLowerCase();
	const category: "medical" | "pharmacy" =
		lower.includes("pharmacy") || lower.includes("rx") ? "pharmacy" : "medical";
	let bucket: "deductible" | "oop" | "benefit_max" = "deductible";
	if (
		lower.includes("oop") ||
		lower.includes("out-of-pocket") ||
		lower.includes("out of pocket")
	) {
		bucket = "oop";
	} else if (lower.includes("benefit") || lower.includes("max")) {
		bucket = "benefit_max";
	} else if (lower.includes("deductible")) {
		bucket = "deductible";
	}
	const prefix = category === "pharmacy" ? "Pharmacy" : "Medical";
	const suffix =
		bucket === "oop"
			? "Out-of-Pocket"
			: bucket === "benefit_max"
				? "Benefit Max"
				: "Deductible";
	return { category, bucket, typeLabel: `${prefix} ${suffix}` };
}

function reshapeFlatToTableRows(
	flat: AccumulatorRow[],
	ctx: {
		planId: string;
		accountGroupId: string;
		internalMemberId: string;
		internalFamilyId: string;
		planYearStart: string | null;
		planYearEnd: string | null;
		resetDate: string | null;
	}
): { medical: AccumulatorTableRow[]; pharmacy: AccumulatorTableRow[] } {
	const medical: AccumulatorTableRow[] = [];
	const pharmacy: AccumulatorTableRow[] = [];
	for (const a of flat) {
		const { category, bucket, typeLabel } = classifyAccumulatorLabel(a.label);
		const make = (
			level: "individual" | "family",
			applied: number
		): AccumulatorTableRow => {
			const levelTotal =
				level === "individual"
					? a.limit || null
					: a.limit > 0
						? a.limit * 2
						: null;
			const remaining =
				levelTotal != null
					? Math.max(0, levelTotal - applied)
					: level === "individual"
						? a.remaining
						: null;
			const triple: AccumulatorAmountTriple = {
				applied,
				remaining,
				total: levelTotal,
			};
			return {
				id: `${a.id}-${level}`,
				category,
				planId: ctx.planId,
				accountGroupId: ctx.accountGroupId,
				internalMemberId: ctx.internalMemberId,
				internalFamilyId: ctx.internalFamilyId,
				accumulatorType: typeLabel,
				level,
				deductible: bucket === "deductible" ? triple : EMPTY_AMOUNT,
				oop: bucket === "oop" ? triple : EMPTY_AMOUNT,
				benefitMax: bucket === "benefit_max" ? triple : EMPTY_AMOUNT,
				planYearAmount: applied,
				planYearStart: ctx.planYearStart,
				planYearEnd: ctx.planYearEnd,
				resetDate: ctx.resetDate,
				sourceAccumulatorId: a.id,
			};
		};
		const ind = make("individual", a.individual);
		const fam = make("family", a.family);
		if (category === "medical") {
			medical.push(ind, fam);
		} else {
			pharmacy.push(ind, fam);
		}
	}
	return { medical, pharmacy };
}

function findFlatBucket(
	flat: AccumulatorRow[],
	category: "medical" | "pharmacy",
	bucket: "deductible" | "oop" | "benefit_max"
): AccumulatorRow | undefined {
	return flat.find((a) => {
		const c = classifyAccumulatorLabel(a.label);
		return c.category === category && c.bucket === bucket;
	});
}

function kpiFromFlat(
	key: string,
	label: string,
	row: AccumulatorRow | undefined,
	fallbackInd?: number,
	fallbackFam?: number,
	fallbackIndTotal?: number | null,
	fallbackFamTotal?: number | null
): AccumulatorKpi {
	if (row) {
		const indTotal = row.limit || null;
		const famTotal = row.limit > 0 ? row.limit * 2 : null;
		return {
			key,
			label,
			individualApplied: row.individual,
			individualTotal: indTotal,
			familyApplied: row.family,
			familyTotal: famTotal,
		};
	}
	return {
		key,
		label,
		individualApplied: fallbackInd ?? 0,
		individualTotal: fallbackIndTotal ?? null,
		familyApplied: fallbackFam ?? 0,
		familyTotal: fallbackFamTotal ?? null,
	};
}

/**
 * Build Accumulators tab summary from BE summary DTO, or reshape legacy flat
 * accumulators + member context.
 * Live (mock off): no demo KPI / transaction fillers — empty MAC → zeros + [].
 * Mock on: keep demo KPI fallbacks + mock recent transactions for UI polish.
 */
export function buildAccumulatorSummaryForMember(
	member: Pick<
		MemberDetail,
		| "planName"
		| "planCode"
		| "planId"
		| "accountGroup"
		| "groupName"
		| "groupId"
		| "memberId"
		| "coverageStart"
		| "coverageEnd"
		| "dataAsOf"
		| "paidYtd"
		| "accumulators"
		| "vendorSource"
		| "accumulatorSummary"
	>,
	rawSummary?: MemberAccumulatorSummaryDto | Record<string, unknown> | null
): AccumulatorSummary {
	const useDemoFill = isMembersMockEnabled();
	const mapped = mapAccumulatorSummary(rawSummary ?? undefined);
	if (
		mapped &&
		(mapped.medicalRows.length > 0 || mapped.pharmacyRows.length > 0)
	) {
		if (mapped.recentTransactions.length === 0 && useDemoFill) {
			mapped.recentTransactions = buildMockAccumulatorTransactions({
				planId: mapped.medicalRows[0]?.planId || member.planCode || "PLAN_A",
				vendorSource: member.vendorSource || "Claims Feed",
				asOfDate: mapped.asOfDate || member.dataAsOf || "2026-01-20",
			});
		}
		return mapped;
	}
	if (member.accumulatorSummary) {
		return member.accumulatorSummary;
	}

	const planId =
		member.planCode?.trim() ||
		member.planId?.trim() ||
		(useDemoFill ? "PLAN_A" : "—");
	const accountGroupId =
		member.groupId?.trim() ||
		member.accountGroup?.trim() ||
		member.groupName?.trim() ||
		"—";
	const internalMemberId = member.memberId?.trim() || "—";
	const internalFamilyId = `FAM${internalMemberId.replace(/\D/g, "").slice(-8).padStart(8, "0") || "00000001"}`;
	const year = (
		member.coverageStart || new Date().getFullYear().toString()
	).slice(0, 4);
	const planYearStart = `${year}-01-01`;
	const planYearEnd = member.coverageEnd?.slice(0, 10) || `${year}-12-31`;
	const flat = member.accumulators ?? [];
	const { medical, pharmacy } = reshapeFlatToTableRows(flat, {
		planId,
		accountGroupId,
		internalMemberId,
		internalFamilyId,
		planYearStart,
		planYearEnd,
		resetDate: planYearEnd,
	});

	const medDed = findFlatBucket(flat, "medical", "deductible");
	const medOop = findFlatBucket(flat, "medical", "oop");
	const medMax = findFlatBucket(flat, "medical", "benefit_max");
	const rxDed = findFlatBucket(flat, "pharmacy", "deductible");
	const rxOop = findFlatBucket(flat, "pharmacy", "oop");
	const rxMax = findFlatBucket(flat, "pharmacy", "benefit_max");

	const kpis: AccumulatorKpi[] = useDemoFill
		? [
				kpiFromFlat(
					"medical_deductible",
					"Medical Deductible",
					medDed,
					125,
					250,
					1000,
					2000
				),
				kpiFromFlat(
					"medical_oop",
					"Medical Out-of-Pocket",
					medOop,
					250,
					750,
					5000,
					10000
				),
				kpiFromFlat(
					"medical_benefit_max",
					"Medical Benefit Max",
					medMax,
					250,
					750,
					10000,
					20000
				),
				kpiFromFlat(
					"pharmacy_deductible",
					"Pharmacy Deductible",
					rxDed,
					25,
					50,
					500,
					1000
				),
				kpiFromFlat(
					"pharmacy_oop",
					"Pharmacy Out-of-Pocket",
					rxOop,
					150,
					450,
					2000,
					4000
				),
				kpiFromFlat(
					"pharmacy_benefit_max",
					"Pharmacy Benefit Max",
					rxMax,
					250,
					750,
					10000,
					20000
				),
				{
					key: "total_paid",
					label: "Total Amount Paid",
					individualApplied: member.paidYtd ?? 0,
					individualTotal: null,
					familyApplied: Math.round((member.paidYtd ?? 0) * 2.75),
					familyTotal: null,
				},
			]
		: [
				kpiFromFlat("medical_deductible", "Medical Deductible", medDed),
				kpiFromFlat("medical_oop", "Medical Out-of-Pocket", medOop),
				kpiFromFlat("medical_benefit_max", "Medical Benefit Max", medMax),
				kpiFromFlat("pharmacy_deductible", "Pharmacy Deductible", rxDed),
				kpiFromFlat("pharmacy_oop", "Pharmacy Out-of-Pocket", rxOop),
				kpiFromFlat("pharmacy_benefit_max", "Pharmacy Benefit Max", rxMax),
				{
					key: "total_paid",
					label: "Total Amount Paid",
					individualApplied: member.paidYtd ?? 0,
					individualTotal: null,
					familyApplied: 0,
					familyTotal: null,
				},
			];

	const recentTransactions = useDemoFill
		? buildMockAccumulatorTransactions({
				planId,
				vendorSource: member.vendorSource || "Claims Feed",
				asOfDate: member.dataAsOf || "2026-01-20",
			})
		: [];

	return {
		currentPlanName: member.planName?.trim() || "—",
		effectiveDate: member.coverageStart || null,
		asOfDate: member.dataAsOf || null,
		kpis,
		medicalRows: medical,
		pharmacyRows: pharmacy,
		recentTransactions,
	};
}

export function mapVendorHistory(
	rows: Record<string, unknown>[] | undefined
): VendorSourceRow[] {
	return (rows ?? []).map((r) => {
		const st = str(r.status).toLowerCase();
		return {
			id: str(r.id),
			vendor: str(r.vendor, "—"),
			fileFeedType: str(r.file_feed_type, "Eligibility"),
			lastReceived: r.last_received ? String(r.last_received) : "—",
			status:
				st === "failed" ? "failed" : st === "warning" ? "warning" : "success",
			frequency: str(r.frequency, "—"),
			recordsProcessed: num(r.records_processed),
			direction:
				str(r.direction).toLowerCase() === "outbound" ? "Outbound" : "Inbound",
		};
	});
}

export function mapExceptions(
	rows: Record<string, unknown>[] | undefined
): EligibilityExceptionRow[] {
	return (rows ?? []).map((r) => ({
		id: str(r.id),
		exceptionType: str(r.exception_type, "—"),
		description: str(r.description, "—"),
		startDetected: r.start_detected ? String(r.start_detected) : "—",
		status: mapExceptionStatus(str(r.status)),
		source: str(r.source, "—"),
		resolution: str(r.resolution, "—"),
	}));
}

export function mapOtherStatuses(
	rows: Record<string, unknown>[] | undefined
): OtherStatusRow[] {
	return (rows ?? []).map((r) => ({
		id: str(r.id),
		slot: str(r.status_slot, "—"),
		status: str(r.status, "—"),
		detail: str(r.status_detail, "—"),
		effectiveStart: r.effective_start ? dateStr(r.effective_start) : null,
		effectiveEnd: r.effective_end ? dateStr(r.effective_end) : null,
	}));
}

export type MemberChangeEventRow = {
	id: string;
	changeDate: string;
	changeType: "Update" | "Add" | "Remove";
	category: string;
	fieldName: string;
	fieldReason?: string;
	oldValue: string;
	newValue: string;
	reason: string;
	changedBy: string;
	source: string;
	effectiveDate: string;
	createdAt?: string;
};

function formatChangeDate(value: unknown): string {
	if (!value) return "—";
	const raw = String(value);
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return raw;
	return d.toLocaleString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function formatEffectiveDate(value: unknown): string {
	if (!value) return "—";
	const raw = String(value);
	if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
		const [y, m, day] = raw.slice(0, 10).split("-");
		return `${m}/${day}/${y}`;
	}
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return raw;
	return d.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
}

function asChangeType(value: unknown): MemberChangeEventRow["changeType"] {
	const v = str(value).toLowerCase();
	if (v === "add" || v === "create") return "Add";
	if (v === "remove" || v === "delete") return "Remove";
	return "Update";
}

export function mapChangeEvents(
	rows: Record<string, unknown>[] | undefined
): MemberChangeEventRow[] {
	const fieldLabels: Record<string, string> = {
		newtech_member_id: "NewTech Member ID",
		newtech_family_id: "NewTech Family ID",
		external_id: "External ID",
		alternate_id: "Alternate ID",
		cardholder_id: "Cardholder ID",
	};
	return (rows ?? []).map((r) => {
		const rawField = str(r.field_name, "—");
		return {
			id: str(r.id),
			changeDate: formatChangeDate(r.change_date ?? r.created_at),
			changeType: asChangeType(r.change_type ?? r.action),
			category: str(r.category, "Other"),
			fieldName: fieldLabels[rawField] ?? rawField,
			fieldReason: r.field_reason ? str(r.field_reason) : undefined,
			oldValue: str(r.old_value, "—"),
			newValue: str(r.new_value, "—"),
			reason: str(r.reason, "—"),
			changedBy: str(r.changed_by ?? r.actor, "—"),
			source: str(r.source ?? r.source_system, "—"),
			effectiveDate: formatEffectiveDate(r.effective_date),
			createdAt: r.created_at ? String(r.created_at) : undefined,
		};
	});
}

export function mapSourceRecordList(
	rows: Record<string, unknown>[] | undefined
): {
	id: string;
	sourceSystem: string;
	originalFilename: string;
	fileReceivedAt: string;
	recordStatus: string;
	recordEffectiveDate: string;
	changeSummary: string;
}[] {
	return (rows ?? []).map((r) => ({
		id: str(r.id),
		sourceSystem: str(r.source_system, "—"),
		originalFilename: str(r.original_filename, "—"),
		fileReceivedAt: r.file_received_at ? String(r.file_received_at) : "—",
		recordStatus: str(r.record_status, "—"),
		recordEffectiveDate: dateStr(r.record_effective_date),
		changeSummary: str(r.change_summary, "—"),
	}));
}

export function mapAlerts(
	rows: Record<string, unknown>[] | undefined
): MemberAlert[] {
	return (rows ?? []).map((r) => {
		const sev = str(r.severity).toLowerCase();
		return {
			id: str(r.id),
			severity: sev === "error" ? "error" : sev === "info" ? "info" : "warning",
			title: str(r.title, "Alert"),
			hrefLabel: str(r.href_label, "View"),
		};
	});
}

export function memberDetailDtoToDetail(row: MemberDetailDto): MemberDetail {
	const base = memberListDtoToSummary(row);
	const rawCardholderId = str(row.cardholder_id || row.reference_id || row.id);
	const personCode = str(row.person_code, "01");
	const demo = (row.demographics ?? {}) as Record<string, unknown>;
	const demoOverlay = getDemoMemberOverlay({
		cardholderId: rawCardholderId,
		personCode,
		externalId: str(row.external_id),
		alternateId: str(demo.alternate_id ?? row.alternate_id),
		newtechMemberId: str(row.newtech_member_id),
		newtechFamilyId: str(row.newtech_family_id),
	});
	const elig = (row.eligibility ?? {}) as Record<string, unknown>;
	const plan = (row.plan_coverage ?? {}) as Record<string, unknown>;
	const group = (row.employment_group ?? {}) as Record<string, unknown>;
	const latest = (row.latest_source ?? {}) as Record<string, unknown>;

	const detail: MemberDetail = {
		...base,
		eligibilityStatus: mapEligibilityStatus(
			str(row.eligibility_status || elig.status)
		),
		coverageStart: dateStr(
			plan.coverage_effective_date ?? row.coverage_effective_date
		),
		coverageEnd: plan.coverage_term_date
			? dateStr(plan.coverage_term_date)
			: null,
		planId: str(plan.plan_code || plan.plan_name, "—"),
		planCode: str(plan.plan_code) || undefined,
		benefitPackage: str(plan.benefit_package) || undefined,
		coverageLevelCode: str(plan.coverage_level_code) || undefined,
		coverageLevel: str(plan.coverage_level) || undefined,
		secondaryCoverage: elig.secondary_coverage ? "Yes" : "No",
		statusEffectiveDate: elig.status_effective_date
			? dateStr(elig.status_effective_date)
			: undefined,
		statusTermDate: elig.status_term_date
			? dateStr(elig.status_term_date)
			: null,
		enrollmentDate: elig.enrollment_date
			? dateStr(elig.enrollment_date)
			: undefined,
		disenrollmentDate: elig.disenrollment_date
			? dateStr(elig.disenrollment_date)
			: null,
		lastEligibilityUpdate: row.last_eligibility_update
			? String(row.last_eligibility_update)
			: undefined,
		groupId: str(group.group_id) || undefined,
		groupName:
			str(group.group_name || row.group_name || row.account_group) || undefined,
		clientId: str(group.client_id) || undefined,
		accountType: str(group.account_type) || undefined,
		accountStatus:
			str(group.account_status).toLowerCase() === "inactive"
				? "Inactive"
				: str(group.account_status)
					? "Active"
					: undefined,
		memberType: str(group.member_type) || undefined,
		personCode: str(row.person_code) || undefined,
		relationshipCode: str(row.relationship_code) || undefined,
		externalId: demoOverlay?.externalId || undefined,
		newtechMemberId:
			demoOverlay?.newtechMemberId ??
			(fixNewtechId(str(row.newtech_member_id)) || undefined),
		newtechFamilyId:
			demoOverlay?.newtechFamilyId ??
			(fixNewtechId(str(row.newtech_family_id)) || undefined),
		employeeType: str(group.employee_type) || undefined,
		sourceSystem: str(row.source_system || latest.source_system) || undefined,
		sourceFileName: str(latest.original_filename) || undefined,
		sourceFileReceived: latest.file_received_at
			? String(latest.file_received_at)
			: undefined,
		recordStatus: str(latest.record_status) || undefined,
		changeDetected: str(latest.change_summary) || undefined,
		preferredName:
			demoOverlay?.preferredName ??
			(str(row.preferred_name || demo.preferred_name) || null),
		preferredLanguage: str(
			row.preferred_language || demo.preferred_language,
			"—"
		),
		race: demoOverlay ? "Ethiopian" : str(row.race || demo.race, "—"),
		ethnicity: demoOverlay
			? "Ethiopian"
			: str(row.ethnicity || demo.ethnicity, "—"),
		communicationPreference: mapComms(
			str(row.communication_preference || demo.communication_preference)
		),
		emergencyContactName: str(
			row.emergency_contact_name || demo.emergency_contact_name,
			"—"
		),
		emergencyContactPhone: str(
			row.emergency_contact_phone || demo.emergency_contact_phone,
			"—"
		),
		emergencyContactRelation: str(
			row.emergency_contact_relation || demo.emergency_contact_relation,
			"—"
		),
		mailingAddressLine1: str(
			row.mailing_address_line1 || demo.mailing_address_line1,
			"—"
		),
		mailingAddressLine2:
			str(row.mailing_address_line2 || demo.mailing_address_line2) || undefined,
		mailingCity: str(row.mailing_city || demo.mailing_city, "—"),
		mailingState: str(row.mailing_state || demo.mailing_state, "—"),
		mailingZip: str(row.mailing_postal_code || demo.mailing_postal_code, "—"),
		dataAsOf: row.data_as_of
			? String(row.data_as_of)
			: row.updated_at
				? String(row.updated_at)
				: "—",
		alerts: mapAlerts(row.alerts),
		eligibilityHistory: mapEligibilityHistory(row.eligibility_history),
		planHistory: mapPlanHistory(row.plan_history),
		dependents: mapDependents(row.family_members),
		claims: mapClaims(row.claims),
		encounters: mapClaims(row.encounters),
		accumulators: mapAccumulators(row.accumulators),
		vendorHistory: mapVendorHistory(row.vendor_history),
		exceptions: mapExceptions(row.exceptions),
		otherStatuses: mapOtherStatuses(row.other_statuses),
	};
	detail.accumulatorSummary = buildAccumulatorSummaryForMember(
		detail,
		row.accumulator_summary
	);
	return detail;
}

function dashToEmpty(v: string | undefined | null): string {
	if (!v || v === "—") return "";
	return v;
}

/** Prefill PATCH body from mapped Member 360 (core snake_case write shape). */
export function memberToWriteBody(member: MemberDetail): MemberWriteBody {
	return {
		cardholder_id: dashToEmpty(member.memberId),
		person_code: dashToEmpty(member.personCode),
		external_id: dashToEmpty(member.externalId),
		newtech_member_id: dashToEmpty(member.newtechMemberId),
		newtech_family_id: dashToEmpty(member.newtechFamilyId),
		relationship_code: dashToEmpty(member.relationshipCode),
		first_name: dashToEmpty(member.firstName),
		middle_name: dashToEmpty(member.middleName),
		last_name: dashToEmpty(member.lastName),
		status: member.status,
		source_system: dashToEmpty(member.sourceSystem),
		program: member.program,
		lob: dashToEmpty(member.lob),
		plan_type: dashToEmpty(member.planType),
		pcp_name: dashToEmpty(member.pcpName),
		pcp_npi: dashToEmpty(member.pcpNpi),
		member_since: dashToEmpty(member.memberSince) || null,
		demographics: {
			date_of_birth: dashToEmpty(member.dob) || null,
			gender:
				member.gender === "Male"
					? "M"
					: member.gender === "Female"
						? "F"
						: member.gender === "Other"
							? "O"
							: "",
			ssn_last4: dashToEmpty(member.ssnLast4).replace(/\*/g, ""),
			alternate_id: dashToEmpty(member.alternateId),
			address_line1: dashToEmpty(member.addressLine1),
			address_line2: dashToEmpty(member.addressLine2),
			city: dashToEmpty(member.city),
			state: dashToEmpty(member.state),
			postal_code: dashToEmpty(member.zip),
			phone: dashToEmpty(member.phone),
			email: dashToEmpty(member.email),
			preferred_name: dashToEmpty(member.preferredName),
			preferred_language: dashToEmpty(member.preferredLanguage),
			race: dashToEmpty(member.race),
			ethnicity: dashToEmpty(member.ethnicity),
			communication_preference: String(
				member.communicationPreference ?? ""
			).toLowerCase(),
			emergency_contact_name: dashToEmpty(member.emergencyContactName),
			emergency_contact_phone: dashToEmpty(member.emergencyContactPhone),
			emergency_contact_relation: dashToEmpty(member.emergencyContactRelation),
			mailing_address_line1: dashToEmpty(member.mailingAddressLine1),
			mailing_address_line2: dashToEmpty(member.mailingAddressLine2),
			mailing_city: dashToEmpty(member.mailingCity),
			mailing_state: dashToEmpty(member.mailingState),
			mailing_postal_code: dashToEmpty(member.mailingZip),
		},
		eligibility: {
			status:
				member.eligibilityStatus === "eligible"
					? "active"
					: member.eligibilityStatus === "pending"
						? "pending"
						: member.eligibilityStatus === "termed"
							? "terminated"
							: "inactive",
			status_effective_date: dashToEmpty(member.statusEffectiveDate) || null,
			status_term_date: dashToEmpty(member.statusTermDate) || null,
			enrollment_date: dashToEmpty(member.enrollmentDate) || null,
			disenrollment_date: dashToEmpty(member.disenrollmentDate) || null,
			secondary_coverage: member.secondaryCoverage === "Yes",
		},
		plan_coverage: {
			plan_name: dashToEmpty(member.planName),
			plan_code: dashToEmpty(member.planCode),
			benefit_package: dashToEmpty(member.benefitPackage),
			coverage_level_code: dashToEmpty(member.coverageLevelCode),
			coverage_level: dashToEmpty(member.coverageLevel),
			coverage_effective_date: dashToEmpty(member.coverageStart) || null,
			coverage_term_date: dashToEmpty(member.coverageEnd) || null,
		},
		employment_group: {
			group_id: dashToEmpty(member.groupId),
			group_name: dashToEmpty(member.groupName),
			client_id: dashToEmpty(member.clientId),
			account_type: dashToEmpty(member.accountType),
			account_status: member.accountStatus?.toLowerCase(),
			member_type: dashToEmpty(member.memberType),
			employee_type: dashToEmpty(member.employeeType),
		},
	};
}

const DATE_KEYS = new Set([
	"member_since",
	"date_of_birth",
	"status_effective_date",
	"status_term_date",
	"enrollment_date",
	"disenrollment_date",
	"coverage_effective_date",
	"coverage_term_date",
]);

/** Coerce blank date strings → null; drop undefined. Prevents DRF DateField 400s. */
export function sanitizeMemberWriteBody(
	body: MemberWriteBody | MemberCreateBody | Record<string, unknown>
): Record<string, unknown> {
	function cleanValue(key: string, value: unknown): unknown {
		if (value === undefined) return undefined;
		if (DATE_KEYS.has(key) && (value === "" || value === undefined)) {
			return null;
		}
		if (value && typeof value === "object" && !Array.isArray(value)) {
			const nested: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
				const cleaned = cleanValue(k, v);
				if (cleaned !== undefined) nested[k] = cleaned;
			}
			return nested;
		}
		return value;
	}

	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(body)) {
		const cleaned = cleanValue(key, value);
		if (cleaned !== undefined) out[key] = cleaned;
	}
	return out;
}

import type {
	CmsEdgePharmacyClaimRow,
	PharmacyClaimCmsStatus,
	PharmacyClaimDetailCmsStatus,
	PharmacyClaimNetwork,
	PharmacyClaimTransaction,
	PharmacyClaimValidationResult,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import type {
	PharmacyClaimRowDetailDto,
	PharmacyClaimRowListDto,
} from "@/lib/vendor-core/types";

export type CmsEdgePharmacyClaimDetailView = {
	id: string;
	claimId: string;
	cmsStatus: PharmacyClaimDetailCmsStatus;
	transaction: PharmacyClaimTransaction;
	sourceFileName: string;
	summary: {
		label: string;
		value: string;
		icon: "user" | "id" | "pill" | "calendar" | "dollar";
	}[];
	claimInfoLeft: { label: string; value: string }[];
	claimInfoRight: { label: string; value: string }[];
	drugInfoLeft: { label: string; value: string }[];
	drugInfoRight: { label: string; value: string }[];
	financial: {
		allowedCost: string;
		planPaid: string;
		memberResponsibility: string;
		difference: string;
		equation: string;
		status: string;
	};
	transactionHistory: {
		id: string;
		transaction: string;
		claimId: string;
		originalClaimId: string;
		processedDate: string;
		allowedCost: string;
		planPaid: string;
		cmsStatus: PharmacyClaimDetailCmsStatus;
	}[];
	validationHistory: {
		id: string;
		date: string;
		rule: string;
		result: PharmacyClaimValidationResult;
		message: string;
		sourceFile: string;
		reviewedBy: string;
	}[];
	cmsValidation: {
		passed: number;
		warnings: number;
		errors: number;
		checks: { id: string; label: string; result: string }[];
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
};

function dash(value: string | number | null | undefined): string {
	if (value == null || value === "") return "—";
	return String(value);
}

function formatCurrency(value: number | null | undefined): string {
	if (value == null || Number.isNaN(Number(value))) return "—";
	return Number(value).toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	});
}

function formatDate(value: string | null | undefined): string {
	if (!value) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
}

function formatDateLong(value: string | null | undefined): string {
	if (!value) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function mapTransaction(
	isReversed: boolean | undefined
): PharmacyClaimTransaction {
	return isReversed ? "Void" : "Original";
}

function mapListCmsStatus(
	row: PharmacyClaimRowListDto
): PharmacyClaimCmsStatus {
	if (!row.product_id?.trim()) return "Error";
	return "Ready";
}

function mapDetailCmsStatus(
	row: PharmacyClaimRowDetailDto
): PharmacyClaimDetailCmsStatus {
	if (!row.product_id?.trim()) return "Error";
	if (row.is_reversed) return "Warning";
	return "CMS Ready";
}

/** Map vendor-core pharmacy claim row list DTOs into EDGE table rows. */
export function pharmacyClaimRowListDtosToRows(
	rows: PharmacyClaimRowListDto[]
): CmsEdgePharmacyClaimRow[] {
	return rows.map((row) => {
		const planPaid = Number(row.total_amount_paid ?? 0);
		const memberPay = Number(row.patient_pay_amount ?? 0);
		const allowed = planPaid + memberPay;

		return {
			id: row.id,
			claimId: row.claim_no || row.reference_id || row.id,
			enrolleeId: row.cardholder_id || "—",
			ndc: row.product_id || "—",
			fillDate: formatDate(row.date_of_service),
			rxReference: row.reference_id || "—",
			fillNo: 1,
			daysSupply: Number(row.days_supply ?? 0),
			dispensingNpi: row.service_provider_id?.trim() || "—",
			network: "Retail" as PharmacyClaimNetwork,
			allowedCost: allowed,
			planPaid,
			transaction: mapTransaction(row.is_reversed),
			cmsStatus: mapListCmsStatus(row),
		};
	});
}

/** Map vendor-core pharmacy claim detail (+ optional source filename) into EDGE detail view. */
export function pharmacyClaimRowDetailDtoToView(
	row: PharmacyClaimRowDetailDto,
	sourceFileName = "—"
): CmsEdgePharmacyClaimDetailView {
	const planPaid = Number(row.total_amount_paid ?? 0);
	const memberPay = Number(row.patient_pay_amount ?? 0);
	const allowed = planPaid + memberPay;
	const transaction = mapTransaction(row.is_reversed);
	const cmsStatus = mapDetailCmsStatus(row);
	const claimId = row.claim_no || row.reference_id || row.id;
	const originalClaimId = row.original_claim_no?.trim() || "—";
	const ndc = row.product_id || "—";
	const fillDate = formatDate(row.date_of_service);
	const planPaidFmt = formatCurrency(planPaid);
	const memberFmt = formatCurrency(memberPay);
	const allowedFmt = formatCurrency(allowed);
	const diff = Math.abs(allowed - (planPaid + memberPay));
	const balanced = diff < 0.01;

	const ndcOk = Boolean(row.product_id?.trim());
	const daysOk =
		row.days_supply != null && row.days_supply > 0 && row.days_supply <= 365;
	const npiOk = Boolean(row.service_provider_id?.trim());

	const checks = [
		{
			id: "c1",
			label: "NDC Format",
			result: ndcOk ? "Passed" : "Failed",
		},
		{
			id: "c2",
			label: "Days Supply",
			result: daysOk
				? "Passed"
				: row.days_supply == null
					? "Warning"
					: "Failed",
		},
		{
			id: "c3",
			label: "Dispensing Provider NPI",
			result: npiOk ? "Passed" : "Warning",
		},
		{
			id: "c4",
			label: "Financial Balance",
			result: balanced ? "Passed" : "Warning",
		},
		{
			id: "c5",
			label: "Reversal Flag",
			result: row.is_reversed ? "Warning" : "Passed",
		},
	];
	const passed = checks.filter((c) => c.result === "Passed").length;
	const warnings = checks.filter((c) => c.result === "Warning").length;
	const errors = checks.filter((c) => c.result === "Failed").length;

	return {
		id: row.id,
		claimId,
		cmsStatus,
		transaction,
		sourceFileName,
		summary: [
			{
				label: "Unique Enrollee ID",
				value: dash(row.cardholder_id),
				icon: "user",
			},
			{
				label: "Plan ID",
				value: dash(row.group_id || row.client_id),
				icon: "id",
			},
			{ label: "NDC", value: ndc, icon: "pill" },
			{
				label: "Fill Date",
				value: formatDateLong(row.date_of_service),
				icon: "calendar",
			},
			{ label: "Allowed Cost", value: allowedFmt, icon: "dollar" },
			{ label: "Plan Paid", value: planPaidFmt, icon: "dollar" },
		],
		claimInfoLeft: [
			{ label: "Claim ID", value: claimId },
			{ label: "Original Claim ID", value: originalClaimId },
			{ label: "Record ID", value: dash(row.reference_id) },
			{ label: "Unique Enrollee ID", value: dash(row.cardholder_id) },
			{
				label: "Claim Processed Date/Time",
				value: formatDate(row.claim_date),
			},
			{ label: "Issuer Claim Paid Date", value: "—" },
		],
		claimInfoRight: [
			{ label: "Fill Date", value: fillDate },
			{
				label: "Prescription Reference Number",
				value: dash(row.reference_id),
			},
			{ label: "Fill Number", value: "1" },
			{
				label: "Dispensing Status Code",
				value: dash(row.transaction_response_status) || "—",
			},
			{
				label: "Void/Replace Code",
				value: row.is_reversed ? "1 - Void" : "0 - Original",
			},
			{ label: "Plan ID", value: dash(row.group_id || row.client_id) },
			{ label: "HIOS Issuer ID", value: dash(row.client_id) },
		],
		drugInfoLeft: [
			{ label: "Product Service ID / NDC", value: ndc },
			{ label: "Drug Name", value: dash(row.drug_name) },
			{ label: "Days Supply", value: dash(row.days_supply) },
			{ label: "Quantity Dispensed", value: dash(row.quantity_dispensed) },
			{
				label: "Dispensing Provider NPI",
				value: dash(row.service_provider_id),
			},
		],
		drugInfoRight: [
			{ label: "Provider Name", value: "—" },
			{ label: "Provider ID Qualifier", value: "NPI" },
			{ label: "Pharmacy Network Indicator", value: "—" },
			{ label: "Pharmacy Type", value: "—" },
			{ label: "Prescriber NPI", value: dash(row.prescriber_id) },
		],
		financial: {
			allowedCost: allowedFmt,
			planPaid: planPaidFmt,
			memberResponsibility: memberFmt,
			difference: formatCurrency(diff),
			equation: `${allowedFmt} = ${planPaidFmt} + ${memberFmt}`,
			status: balanced ? "Balanced" : "Review",
		},
		transactionHistory: [
			{
				id: `${row.id}-txn`,
				transaction,
				claimId,
				originalClaimId,
				processedDate: formatDate(row.claim_date ?? row.date_of_service),
				allowedCost: allowedFmt,
				planPaid: planPaidFmt,
				cmsStatus,
			},
		],
		validationHistory: [
			{
				id: "vh-ndc",
				date: formatDate(row.updated_at ?? row.created_at),
				rule: "NDC Format",
				result: (ndcOk ? "Passed" : "Failed") as PharmacyClaimValidationResult,
				message: ndcOk
					? "NDC is present on the claim row."
					: "NDC / product_id is missing.",
				sourceFile: sourceFileName,
				reviewedBy: "System",
			},
			{
				id: "vh-days",
				date: formatDate(row.updated_at ?? row.created_at),
				rule: "Days Supply",
				result: (daysOk
					? "Passed"
					: "Warning") as PharmacyClaimValidationResult,
				message: daysOk
					? "Days supply is within expected range."
					: "Days supply missing or out of range.",
				sourceFile: sourceFileName,
				reviewedBy: "System",
			},
			{
				id: "vh-fin",
				date: formatDate(row.updated_at ?? row.created_at),
				rule: "Financial Balance",
				result: (balanced
					? "Passed"
					: "Warning") as PharmacyClaimValidationResult,
				message: balanced
					? "Allowed cost equals plan paid plus member responsibility."
					: "Financial amounts need review.",
				sourceFile: sourceFileName,
				reviewedBy: "System",
			},
		],
		cmsValidation: {
			passed,
			warnings,
			errors,
			checks,
			alert: row.is_reversed
				? "Claim is marked reversed (void)."
				: !ndcOk
					? "NDC is missing on this pharmacy claim row."
					: null,
		},
		submissionHistory: [
			{
				id: "sh-file",
				submissionType: "Pharmacy Claim File",
				reportingPeriod: "—",
				submittedDate: formatDate(row.created_at),
				status: "Ingested",
				fileName: sourceFileName,
			},
		],
	};
}

/** Group flat pharmacy claim rows by claim_no into claim headers + claim lines. */
export type CmsEdgePharmacyClaimGroup = CmsEdgePharmacyClaimRow & {
	groupKey: string;
	lines: CmsEdgePharmacyClaimRow[];
};

export function groupPharmacyClaimsByClaimNo(
	rows: CmsEdgePharmacyClaimRow[]
): CmsEdgePharmacyClaimGroup[] {
	const buckets = new Map<string, CmsEdgePharmacyClaimRow[]>();

	for (const row of rows) {
		const key = (row.claimId || row.id).trim() || row.id;
		const list = buckets.get(key) ?? [];
		list.push(row);
		buckets.set(key, list);
	}

	const groups: CmsEdgePharmacyClaimGroup[] = [];
	for (const [groupKey, lines] of buckets) {
		const primary =
			lines.find((r) => r.transaction === "Original") ?? lines[0]!;
		groups.push({
			...primary,
			groupKey,
			lines: [...lines].sort((a, b) => a.fillDate.localeCompare(b.fillDate)),
		});
	}

	return groups.sort((a, b) => b.fillDate.localeCompare(a.fillDate));
}

/** Derive page-level KPI strip counts from the current result set. */
export function derivePharmacyClaimKpis(rows: CmsEdgePharmacyClaimRow[]) {
	const total = rows.length;
	const ready = rows.filter((r) => r.cmsStatus === "Ready").length;
	const errors = rows.filter((r) => r.cmsStatus === "Error").length;
	const voids = rows.filter(
		(r) => r.transaction === "Void" || r.transaction === "Replacement"
	).length;
	const members = new Set(rows.map((r) => r.enrolleeId).filter(Boolean)).size;
	const pct = total > 0 ? ((ready / total) * 100).toFixed(2) : "0.00";

	return [
		{
			id: "total",
			label: "Total Pharmacy Claims",
			value: total.toLocaleString("en-US"),
			hint: "Current page results" as string | null,
			hintClassName: "text-muted-foreground",
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "text-foreground",
			icon: "file" as const,
		},
		{
			id: "ready",
			label: "CMS Ready",
			value: ready.toLocaleString("en-US"),
			hint: `${pct}% of page`,
			hintClassName: "text-emerald-700",
			tone: "text-emerald-700 bg-emerald-500/10",
			valueClassName: "text-emerald-700",
			icon: "check" as const,
		},
		{
			id: "errors",
			label: "Validation Errors",
			value: errors.toLocaleString("en-US"),
			hint: "Derived (missing NDC)",
			hintClassName: "text-red-600",
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "alert" as const,
		},
		{
			id: "voids",
			label: "Voids / Replacements",
			value: voids.toLocaleString("en-US"),
			hint: null as string | null,
			hintClassName: "",
			tone: "text-slate-700 bg-slate-500/10",
			valueClassName: "text-foreground",
			icon: "ban" as const,
		},
		{
			id: "members",
			label: "Unique Enrollees",
			value: members.toLocaleString("en-US"),
			hint: "On current page",
			hintClassName: "text-muted-foreground",
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "text-foreground",
			icon: "user" as const,
		},
	];
}

export function derivePharmacyFilterOptions(rows: CmsEdgePharmacyClaimRow[]) {
	const uniq = (values: string[]) => [
		"All",
		...Array.from(new Set(values.filter(Boolean))).sort(),
	];

	return {
		cmsStatus: uniq(rows.map((r) => r.cmsStatus)),
		transaction: uniq(rows.map((r) => r.transaction)),
		network: uniq(rows.map((r) => r.network)),
		hasIssues: ["All", "Has issues", "No issues"] as const,
	};
}

export function pharmacyRowHasIssues(row: CmsEdgePharmacyClaimRow): boolean {
	if (row.cmsStatus !== "Ready") return true;
	if (!row.ndc || row.ndc === "—") return true;
	if (
		!row.dispensingNpi ||
		row.dispensingNpi === "—" ||
		!/^\d{10}$/.test(row.dispensingNpi)
	) {
		return true;
	}
	return false;
}

/** Live filter-tab badge counts (replaces hard-coded mock badges). */
export function derivePharmacyFilterTabBadges(rows: CmsEdgePharmacyClaimRow[]) {
	return {
		errors: rows.filter((r) => r.cmsStatus === "Error").length,
		warnings: rows.filter((r) => r.cmsStatus === "Warning").length,
		voids: rows.filter(
			(r) => r.transaction === "Void" || r.transaction === "Replacement"
		).length,
	};
}

/** Lightweight validation summary cards derived from current rows. */
export function derivePharmacyValidationSummary(
	rows: CmsEdgePharmacyClaimRow[]
) {
	const invalidNdc = rows.filter(
		(r) => !r.ndc || r.ndc === "—" || r.ndc.trim() === ""
	).length;
	const missingDays = rows.filter(
		(r) => !r.daysSupply || r.daysSupply <= 0
	).length;
	const invalidNpi = rows.filter(
		(r) =>
			!r.dispensingNpi ||
			r.dispensingNpi === "—" ||
			!/^\d{10}$/.test(r.dispensingNpi)
	).length;
	const financialMismatch = rows.filter((r) => {
		const allowed = Number(r.allowedCost ?? 0);
		const paid = Number(r.planPaid ?? 0);
		return allowed > 0 && paid > allowed + 0.01;
	}).length;

	return [
		{
			id: "invalid-ndc",
			label: "Invalid NDC",
			count: invalidNdc,
			icon: "ban" as const,
			tone: "text-red-700 bg-red-500/10",
		},
		{
			id: "missing-days",
			label: "Missing Days Supply",
			count: missingDays,
			icon: "calendar" as const,
			tone: "text-amber-800 bg-amber-500/10",
		},
		{
			id: "invalid-npi",
			label: "Invalid Dispensing Provider NPI",
			count: invalidNpi,
			icon: "user" as const,
			tone: "text-violet-700 bg-violet-500/10",
		},
		{
			id: "financial",
			label: "Financial Mismatch",
			count: financialMismatch,
			icon: "dollar" as const,
			tone: "text-sky-700 bg-sky-500/10",
		},
	];
}

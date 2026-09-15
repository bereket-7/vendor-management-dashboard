import type {
	CmsEdgeMedicalClaimRow,
	MedicalClaimCmsStatus,
	MedicalClaimTransaction,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import type { ClaimLineDto } from "@/lib/vendor-core/types";

export type CmsEdgeMedicalClaimLine = {
	id: string;
	lineNumber: number;
	serviceDate: string;
	procedureCode: string;
	revenueCode: string;
	allowed: number;
	planPaid: number;
	status: string;
	/** claim_reference_id — used for workbench detail route */
	claimReferenceId: string;
};

export type CmsEdgeMedicalClaimGroup = CmsEdgeMedicalClaimRow & {
	/** Stable group key (claim_reference_id + vendor_file) */
	groupKey: string;
	lines: CmsEdgeMedicalClaimLine[];
};

function num(value: number | string | null | undefined): number {
	if (value == null || value === "") return 0;
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
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

function mapStatus(status?: string | null): MedicalClaimCmsStatus {
	const v = (status ?? "").toLowerCase();
	if (v.includes("deny") || v.includes("reject") || v.includes("error")) {
		return "Error";
	}
	if (v.includes("warn") || v.includes("pending") || v.includes("partial")) {
		return "Warning";
	}
	return "Ready";
}

function mapTransaction(status?: string | null): MedicalClaimTransaction {
	const v = (status ?? "").toLowerCase();
	if (v.includes("void") || v.includes("reverse")) return "Void";
	if (v.includes("replace")) return "Replacement";
	return "Original";
}

function formTypeFromLine(line: ClaimLineDto): string {
	const proc = (line.procedure_code ?? "").toUpperCase();
	if (line.revenue_code) return "Institutional";
	if (proc.startsWith("D")) return "Dental";
	if (proc.startsWith("J")) return "Pharmacy";
	return "Professional";
}

function lineFromDto(dto: ClaimLineDto): CmsEdgeMedicalClaimLine {
	return {
		id: dto.id,
		lineNumber: dto.line_number ?? 1,
		serviceDate: formatDate(dto.service_date),
		procedureCode: dto.procedure_code?.trim() || "—",
		revenueCode: dto.revenue_code?.trim() || "—",
		allowed: num(dto.allowed_amount ?? dto.billed_amount),
		planPaid: num(dto.paid_amount),
		status: dto.status?.trim() || "—",
		claimReferenceId: dto.claim_reference_id || dto.claim_id || dto.id,
	};
}

/** Group vendor-core claim lines into CMS EDGE medical claim rows + nested lines. */
export function claimLineDtosToMedicalClaimGroups(
	dtos: ClaimLineDto[]
): CmsEdgeMedicalClaimGroup[] {
	const buckets = new Map<string, ClaimLineDto[]>();

	for (const dto of dtos) {
		const claimRef = dto.claim_reference_id || dto.claim_id || dto.id;
		const file = dto.vendor_file_id ?? "";
		const key = `${file}::${claimRef}`;
		const list = buckets.get(key) ?? [];
		list.push(dto);
		buckets.set(key, list);
	}

	const groups: CmsEdgeMedicalClaimGroup[] = [];

	for (const [groupKey, lines] of buckets) {
		const sorted = [...lines].sort(
			(a, b) => (a.line_number ?? 0) - (b.line_number ?? 0)
		);
		const first = sorted[0]!;
		const claimId =
			first.claim_reference_id ||
			first.claim_id ||
			first.reference_id ||
			first.id;
		const allowed = sorted.reduce(
			(sum, row) => sum + num(row.allowed_amount ?? row.billed_amount),
			0
		);
		const planPaid = sorted.reduce((sum, row) => sum + num(row.paid_amount), 0);
		const dates = sorted
			.map((row) => row.service_date)
			.filter((d): d is string => Boolean(d))
			.sort();
		const anyError = sorted.some((row) => mapStatus(row.status) === "Error");
		const anyWarn = sorted.some((row) => mapStatus(row.status) === "Warning");

		groups.push({
			id: first.id,
			groupKey,
			claimId,
			enrolleeId: "—",
			formType: formTypeFromLine(first),
			statementFrom: formatDate(dates[0] ?? first.service_date),
			statementThrough: formatDate(
				dates[dates.length - 1] ?? first.service_date
			),
			billingNpi: "—",
			primaryDiagnosis: "—",
			allowedAmount: allowed,
			planPaid,
			transaction: mapTransaction(first.status),
			cmsStatus: anyError ? "Error" : anyWarn ? "Warning" : "Ready",
			lines: sorted.map(lineFromDto),
		});
	}

	return groups.sort((a, b) => b.claimId.localeCompare(a.claimId));
}

/** Mock list → groups with a single synthetic line so expand UI still works. */
export function medicalMockRowsToGroups(
	rows: CmsEdgeMedicalClaimRow[]
): CmsEdgeMedicalClaimGroup[] {
	return rows.map((row) => ({
		...row,
		groupKey: row.id,
		lines: [
			{
				id: `${row.id}-line-1`,
				lineNumber: 1,
				serviceDate: row.statementFrom,
				procedureCode: "—",
				revenueCode: "—",
				allowed: row.allowedAmount,
				planPaid: row.planPaid,
				status: row.cmsStatus,
				claimReferenceId: row.claimId,
			},
		],
	}));
}

export function deriveMedicalClaimFilterOptions(
	groups: CmsEdgeMedicalClaimGroup[]
) {
	const uniq = (values: string[]) => [
		"All",
		...Array.from(new Set(values.filter(Boolean))).sort(),
	];

	return {
		cmsStatus: uniq(groups.map((g) => g.cmsStatus)),
		transaction: uniq(groups.map((g) => g.transaction)),
		formType: uniq(groups.map((g) => g.formType)),
		enrolleeId: uniq(groups.map((g) => g.enrolleeId).filter((v) => v !== "—")),
		billingNpi: uniq(groups.map((g) => g.billingNpi).filter((v) => v !== "—")),
	};
}

export function deriveMedicalValidationSummary(
	groups: CmsEdgeMedicalClaimGroup[]
) {
	const total = groups.length;
	const pct = (n: number) =>
		total > 0 ? `${((n / total) * 100).toFixed(2)}% of page` : "0% of page";

	const procRevMismatch = groups.filter((g) =>
		g.lines.some(
			(line) =>
				line.revenueCode !== "—" &&
				line.procedureCode !== "—" &&
				g.formType === "Professional"
		)
	).length;
	const invalidDx = groups.filter(
		(g) => !g.primaryDiagnosis || g.primaryDiagnosis === "—"
	).length;
	const missingNpi = groups.filter(
		(g) => !g.billingNpi || g.billingNpi === "—"
	).length;
	const financialMismatch = groups.filter(
		(g) => g.allowedAmount > 0 && g.planPaid > g.allowedAmount + 0.01
	).length;
	const voidLink = groups.filter(
		(g) =>
			(g.transaction === "Void" || g.transaction === "Replacement") &&
			g.cmsStatus === "Error"
	).length;

	return [
		{
			id: "proc-rev",
			label: "Procedure/Revenue Mismatch",
			value: procRevMismatch.toLocaleString("en-US"),
			hint: pct(procRevMismatch),
			tone: "text-amber-700 bg-amber-500/10",
			valueClassName: "text-amber-700",
			icon: "alert" as const,
		},
		{
			id: "invalid-dx",
			label: "Invalid Diagnosis Code",
			value: invalidDx.toLocaleString("en-US"),
			hint: pct(invalidDx),
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "text-violet-700",
			icon: "ban" as const,
		},
		{
			id: "missing-npi",
			label: "Missing Rendering NPI",
			value: missingNpi.toLocaleString("en-US"),
			hint: pct(missingNpi),
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "user" as const,
		},
		{
			id: "financial",
			label: "Financial Mismatch",
			value: financialMismatch.toLocaleString("en-US"),
			hint: pct(financialMismatch),
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "text-sky-700",
			icon: "dollar" as const,
		},
		{
			id: "void-link",
			label: "Void/Replacement Link Error",
			value: voidLink.toLocaleString("en-US"),
			hint: pct(voidLink),
			tone: "text-teal-700 bg-teal-500/10",
			valueClassName: "text-teal-700",
			icon: "link" as const,
		},
	];
}

export function deriveMedicalClaimKpis(groups: CmsEdgeMedicalClaimGroup[]) {
	const total = groups.length;
	const ready = groups.filter((g) => g.cmsStatus === "Ready").length;
	const errors = groups.filter((g) => g.cmsStatus === "Error").length;
	const voids = groups.filter(
		(g) => g.transaction === "Void" || g.transaction === "Replacement"
	).length;
	const lineCount = groups.reduce((sum, g) => sum + g.lines.length, 0);
	const pct = total > 0 ? ((ready / total) * 100).toFixed(2) : "0.00";

	return [
		{
			id: "total",
			label: "Total Medical Claims",
			value: total.toLocaleString("en-US"),
			hint: `${lineCount.toLocaleString("en-US")} claim lines` as string | null,
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
			hint: "Derived from line status",
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
			id: "lines",
			label: "Claim Lines",
			value: lineCount.toLocaleString("en-US"),
			hint: "On current page",
			hintClassName: "text-muted-foreground",
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "text-foreground",
			icon: "user" as const,
		},
	];
}

export type CmsEdgeMedicalClaimDetailView = {
	id: string;
	claimId: string;
	cmsStatus: string;
	transaction: string;
	formType: string;
	summary: { label: string; value: string; icon: string }[];
	headerLeft: { label: string; value: string }[];
	headerRight: { label: string; value: string }[];
	lines: {
		id: string;
		line: number;
		serviceFrom: string;
		serviceTo: string;
		revenueCode: string;
		procedureCode: string;
		modifiers: string;
		placeOfService: string;
		renderingNpi: string;
		allowed: number;
		planPaid: number;
		validation: string;
	}[];
	lineTotals: { allowed: number; planPaid: number };
	sourceFileName?: string | null;
	vendorFileId?: string | null;
};

/** Build EDGE medical claim detail from sibling claim-line DTOs. */
export function claimLineDtosToMedicalClaimDetailView(
	lines: ClaimLineDto[]
): CmsEdgeMedicalClaimDetailView | null {
	if (!lines.length) return null;
	const groups = claimLineDtosToMedicalClaimGroups(lines);
	const group = groups[0]!;
	const sorted = [...lines].sort(
		(a, b) => (a.line_number ?? 0) - (b.line_number ?? 0)
	);

	return {
		id: group.id,
		claimId: group.claimId,
		cmsStatus:
			group.cmsStatus === "Ready"
				? "CMS Ready"
				: group.cmsStatus === "Error"
					? "Error"
					: "Warning",
		transaction: group.transaction,
		formType: group.formType,
		summary: [
			{ label: "Unique Enrollee ID", value: group.enrolleeId, icon: "user" },
			{ label: "Form Type", value: group.formType, icon: "file" },
			{ label: "Statement From", value: group.statementFrom, icon: "calendar" },
			{
				label: "Statement Through",
				value: group.statementThrough,
				icon: "calendar",
			},
			{
				label: "Total Allowed",
				value: group.allowedAmount.toLocaleString("en-US", {
					style: "currency",
					currency: "USD",
				}),
				icon: "dollar",
			},
			{
				label: "Plan Paid",
				value: group.planPaid.toLocaleString("en-US", {
					style: "currency",
					currency: "USD",
				}),
				icon: "dollar",
			},
		],
		headerLeft: [
			{ label: "Claim ID", value: group.claimId },
			{ label: "Original Claim ID", value: "—" },
			{ label: "Form Type", value: group.formType },
			{ label: "Transaction", value: group.transaction },
			{ label: "Billing NPI", value: group.billingNpi },
		],
		headerRight: [
			{ label: "Primary Diagnosis", value: group.primaryDiagnosis },
			{ label: "Statement From", value: group.statementFrom },
			{ label: "Statement Through", value: group.statementThrough },
			{ label: "CMS Status", value: group.cmsStatus },
			{ label: "Line Count", value: String(group.lines.length) },
		],
		lines: sorted.map((dto) => ({
			id: dto.id,
			line: dto.line_number ?? 1,
			serviceFrom: formatDate(dto.service_date),
			serviceTo: formatDate(dto.service_date),
			revenueCode: dto.revenue_code?.trim() || "—",
			procedureCode: dto.procedure_code?.trim() || "—",
			modifiers: "—",
			placeOfService: "—",
			renderingNpi: "—",
			allowed: num(dto.allowed_amount ?? dto.billed_amount),
			planPaid: num(dto.paid_amount),
			validation: mapStatus(dto.status) === "Error" ? "Error" : "Passed",
		})),
		lineTotals: {
			allowed: group.allowedAmount,
			planPaid: group.planPaid,
		},
		vendorFileId: sorted[0]?.vendor_file_id ?? null,
		sourceFileName: null,
	};
}

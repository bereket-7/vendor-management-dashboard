import type { ComplianceProgramPageConfig } from "./config";
import type { ComplianceProgramRow } from "./mock-data";

export type ComplianceFilterChip = {
	key: string;
	label: string;
	count: number;
	activeClassName: string;
};

function chipToneForStatus(status: string): string {
	if (
		/accept|complete|paid|ready|validated|active|on track|reconcil|submitted|met|clean|authorized|billed|on track/i.test(
			status
		)
	) {
		return "bg-emerald-600 text-white border-emerald-600";
	}
	if (
		/pending|review|draft|open|upcoming|due soon|in progress|suspected|gap|at risk|warning|appeal/i.test(
			status
		)
	) {
		return "bg-amber-500 text-white border-amber-500";
	}
	if (
		/reject|exception|overdue|denied|finding|late|cap alert|remediating|discharged|closed/i.test(
			status
		)
	) {
		return "bg-red-600 text-white border-red-600";
	}
	return "bg-sky-600 text-white border-sky-600";
}

/** Page-specific status chips (All + up to 4 statuses). */
export function filterChipsForPage(
	config: ComplianceProgramPageConfig,
	rows: ComplianceProgramRow[]
): ComplianceFilterChip[] {
	const chips: ComplianceFilterChip[] = [
		{
			key: "all",
			label: "All",
			count: rows.length,
			activeClassName: "bg-primary text-primary-foreground border-primary",
		},
	];

	const statuses = (config.statusOptions ?? []).slice(0, 4);
	for (const status of statuses) {
		chips.push({
			key: status,
			label: status.toUpperCase(),
			count: rows.filter((row) => row.status === status).length,
			activeClassName: chipToneForStatus(status),
		});
	}

	return chips;
}

export function filterPlaceholder(config: ComplianceProgramPageConfig): string {
	switch (config.slug) {
		case "cms-edge":
			return "Search batches, control numbers, vendors…";
		case "medicaid-encounter-reporting":
			return "Search encounter files, members, vendors…";
		case "medicare-reporting":
			return "Search reports, CARC codes, vendors…";
		case "risk-adjustment":
			return "Search members, HCC profiles, owners…";
		case "hedis-quality":
			return "Search measures, vendors, attestation…";
		case "audit-management":
			return "Search audits, findings, owners…";
		case "compliance-calendar":
			return "Search deadlines, filings, owners…";
		case "esrd-dialysis":
			return "Search dialysis cases, facilities…";
		case "dme":
			return "Search authorizations, suppliers…";
		case "home-health":
			return "Search episodes, OASIS files…";
		case "hospice":
			return "Search elections, cap alerts…";
		case "ltss":
			return "Search authorizations, service units…";
		case "behavioral-health":
			return "Search encounters, carve-out vendors…";
		default:
			return `Search ${config.rowNoun}s…`;
	}
}

export function filterExportLabel(config: ComplianceProgramPageConfig): string {
	switch (config.slug) {
		case "cms-edge":
			return "Export Batches";
		case "compliance-calendar":
			return "Export Calendar";
		case "audit-management":
			return "Export Audits";
		default:
			return `Export ${config.title.split("/")[0]?.trim() ?? "Queue"}`;
	}
}

export function filterRows(
	rows: ComplianceProgramRow[],
	filters: { vendor: string; status: string; search: string }
): ComplianceProgramRow[] {
	const q = filters.search.trim().toLowerCase();
	return rows.filter((row) => {
		if (filters.vendor !== "all" && row.vendor !== filters.vendor) return false;
		if (filters.status !== "all" && row.status !== filters.status) return false;
		if (!q) return true;
		const hay = [row.referenceId, row.title, row.vendor, row.owner, row.period]
			.join(" ")
			.toLowerCase();
		return hay.includes(q);
	});
}

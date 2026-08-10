import type { ProgramFileType } from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";

import type { ComplianceProgramPageConfig } from "./config";

export type ComplianceProgramRow = {
	id: string;
	referenceId: string;
	title: string;
	vendor: string;
	program: ProgramFileType;
	period: string;
	status: string;
	metricLabel: string;
	metricValue: string;
	dueDate: string;
	lastUpdated: string;
	owner: string;
};

const OWNERS = [
	"Sarah Nguyen",
	"Marcus Chen",
	"Ava Patel",
	"Noah Brooks",
	"Harper Diaz",
];

const PERIODS = ["2026-Q2", "2026-Q3", "Jul 2026", "Aug 2026", "CY 2026"];

const FALLBACK_VENDORS = [
	"UST Healthcare",
	"Availity",
	"Change Healthcare",
	"Optum",
	"Cigna",
];

function hashSlug(slug: string) {
	let n = 0;
	for (let i = 0; i < slug.length; i += 1) {
		n = (n + slug.charCodeAt(i) * (i + 1)) % 997;
	}
	return n;
}

function pickStatus(config: ComplianceProgramPageConfig, index: number) {
	const options = config.statusOptions ?? [];
	if (options.length === 0) return "Pending";
	return options[index % options.length]!;
}

function vendorName(index: number, slug: string) {
	const vendors = VENDOR_NAMES.length > 0 ? VENDOR_NAMES : FALLBACK_VENDORS;
	return vendors[(index + hashSlug(slug)) % vendors.length]!;
}

function metricForPage(config: ComplianceProgramPageConfig, index: number) {
	const base = 40 + ((hashSlug(config.slug) + index * 17) % 260);
	switch (config.section) {
		case "regulatory_compliance":
			if (config.slug === "compliance-calendar") {
				return { label: "Days to due", value: String(3 + (index % 14)) };
			}
			if (config.slug === "hedis-quality") {
				return { label: "Rate", value: `${72 + (index % 24)}%` };
			}
			if (config.slug === "risk-adjustment") {
				return { label: "HCCs", value: String(2 + (index % 6)) };
			}
			return { label: "Records", value: String(base) };
		default:
			if (config.slug === "dme" || config.slug === "ltss") {
				return { label: "Units", value: String(4 + (index % 18)) };
			}
			return { label: "Amount", value: `$${(base * 125).toLocaleString("en-US")}` };
	}
}

function titleForPage(config: ComplianceProgramPageConfig, index: number) {
	const seq = index + 1;
	const prefix = config.title.split("/")[0]?.trim() ?? config.title;
	switch (config.slug) {
		case "cms-edge":
			return `EDGE Batch ${20260700 + seq}`;
		case "medicaid-encounter-reporting":
			return `Medicaid Encounter File ${seq}`;
		case "medicare-reporting":
			return `Medicare Report ${seq}`;
		case "risk-adjustment":
			return `Member Risk Profile ${440000 + seq}`;
		case "hedis-quality":
			return `HEDIS Measure Set ${seq}`;
		case "audit-management":
			return `Audit Request ${seq}`;
		case "compliance-calendar":
			return `Regulatory Filing Window ${seq}`;
		case "esrd-dialysis":
			return `Dialysis Case ${seq}`;
		case "dme":
			return `DME Authorization ${9000 + seq}`;
		case "home-health":
			return `Home Health Episode ${seq}`;
		case "hospice":
			return `Hospice Election ${seq}`;
		case "ltss":
			return `LTSS Authorization ${8800 + seq}`;
		case "behavioral-health":
			return `BH Encounter ${seq}`;
		default:
			return `${prefix} Item ${seq}`;
	}
}

function referenceForPage(config: ComplianceProgramPageConfig, index: number) {
	const seq = String(index + 1).padStart(4, "0");
	const code = config.slug.slice(0, 3).toUpperCase();
	return `${code}-${2026}${seq}`;
}

export function rowsForComplianceProgramPage(
	config: ComplianceProgramPageConfig,
	program: ProgramFileType
): ComplianceProgramRow[] {
	const count = 10 + (hashSlug(config.slug) % 4);
	return Array.from({ length: count }, (_, index) => {
		const metric = metricForPage(config, index);
		const day = 10 + ((index + hashSlug(config.slug)) % 18);
		return {
			id: `${config.slug}-${index + 1}`,
			referenceId: referenceForPage(config, index),
			title: titleForPage(config, index),
			vendor: vendorName(index, config.slug),
			program,
			period: PERIODS[index % PERIODS.length]!,
			status: pickStatus(config, index),
			metricLabel: metric.label,
			metricValue: metric.value,
			dueDate: `2026-08-${String(day).padStart(2, "0")}`,
			lastUpdated: `2026-07-${String(day).padStart(2, "0")} 14:${String(
				(index * 7) % 60
			).padStart(2, "0")}`,
			owner: OWNERS[index % OWNERS.length]!,
		};
	});
}

export function statsForRows(
	rows: ComplianceProgramRow[],
	config: ComplianceProgramPageConfig
) {
	const total = rows.length;
	const acceptedLike = rows.filter((row) =>
		/accept|complete|active|on track|reconcil|paid|submitted|met|clean|ready/i.test(
			row.status
		)
	).length;
	const pendingLike = rows.filter((row) =>
		/pending|review|draft|open|upcoming|due soon|in progress|suspected|gap|at risk|warning/i.test(
			row.status
		)
	).length;
	const riskLike = rows.filter((row) =>
		/reject|exception|overdue|denied|finding|late|cap alert|remediating/i.test(
			row.status
		)
	).length;

	return [
		{ label: config.kpiLabels[0], value: total },
		{ label: config.kpiLabels[1], value: acceptedLike },
		{ label: config.kpiLabels[2], value: pendingLike },
		{ label: config.kpiLabels[3], value: riskLike },
	];
}

import type { VendorAccountRow } from "@/features/admin/features/vendors/vendor-types";
import type { AccountDto, AccountOpsSummaryDto } from "@/lib/vendor-core/types";

const LOB_LABELS: Record<string, VendorAccountRow["lineOfBusiness"]> = {
	commercial: "Commercial",
	medicare: "Medicare",
	medicaid: "Medicaid",
	marketplace: "Marketplace",
};

const LOB_API: Record<VendorAccountRow["lineOfBusiness"], string> = {
	Commercial: "commercial",
	Medicare: "medicare",
	Medicaid: "medicaid",
	Marketplace: "marketplace",
};

const ACCOUNT_STATUSES = new Set<VendorAccountRow["status"]>([
	"healthy",
	"warning",
	"error",
	"inactive",
]);

function mapLob(raw?: string | null): VendorAccountRow["lineOfBusiness"] {
	const key = (raw ?? "commercial").toLowerCase();
	return LOB_LABELS[key] ?? "Commercial";
}

function mapStatus(
	raw?: string | null,
	active?: boolean,
	healthScore?: number
): VendorAccountRow["status"] {
	if (active === false) return "inactive";
	const value = (raw ?? "").toLowerCase();
	if (
		value &&
		value !== "inactive" &&
		value !== "active" &&
		ACCOUNT_STATUSES.has(value as VendorAccountRow["status"])
	) {
		return value as VendorAccountRow["status"];
	}
	if (healthScore != null) {
		if (healthScore < 60) return "error";
		if (healthScore < 80) return "warning";
	}
	return "healthy";
}

function mapFeedStatus(
	raw?: string | null
): VendorAccountRow["eligibility"] {
	const value = (raw ?? "none").toLowerCase();
	if (value === "success" || value === "warning" || value === "error") {
		return value;
	}
	return "none";
}

function formatWhen(iso?: string | null): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(undefined, {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

/** Map vendor-core account DTO → accounts tab row. */
export function accountDtoToRow(dto: AccountDto): VendorAccountRow {
	const healthScore =
		dto.health_score ??
		(dto.active === false
			? 40
			: dto.status === "error"
				? 55
				: dto.status === "warning"
					? 72
					: 90);
	const status = mapStatus(dto.status, dto.active, healthScore);

	return {
		id: dto.id,
		name: dto.name ?? dto.account_code,
		accountId: dto.account_code,
		lineOfBusiness: mapLob(dto.line_of_business),
		status,
		healthScore,
		lastFileReceived: "—",
		lastInboundAt: null,
		lastFileType: "—",
		eligibility: mapFeedStatus(dto.eligibility_feed_status),
		medical: mapFeedStatus(dto.medical_feed_status),
		pharmacy: mapFeedStatus(dto.pharmacy_feed_status),
		accumulator: mapFeedStatus(dto.accumulator_feed_status),
		payerId: dto.payer_id ?? "—",
		timezone: dto.timezone ?? "UTC",
		openIssues: 0,
		active: dto.active !== false && status !== "inactive",
	};
}

/** Merge ops-summary KPIs onto account rows. */
export function mergeAccountOpsSummary(
	row: VendorAccountRow,
	summary?: AccountOpsSummaryDto
): VendorAccountRow {
	if (!summary) return row;
	const mergedHealthScore = summary.health_score ?? row.healthScore;
	return {
		...row,
		healthScore: mergedHealthScore,
		status: mapStatus(row.status, row.active, mergedHealthScore),
		lastFileReceived: formatWhen(summary.last_inbound_at),
		lastInboundAt: summary.last_inbound_at ?? null,
		lastFileType: summary.last_file_type ?? row.lastFileType,
		eligibility: mapFeedStatus(
			summary.eligibility_status ?? summary.eligibility_feed_status
		),
		medical: mapFeedStatus(summary.medical_status ?? summary.medical_feed_status),
		pharmacy: mapFeedStatus(
			summary.pharmacy_status ?? summary.pharmacy_feed_status
		),
		accumulator: mapFeedStatus(
			summary.accumulator_status ?? summary.accumulator_feed_status
		),
		openIssues: summary.open_issue_count ?? row.openIssues,
	};
}

export function accountRowLobToApi(
	lob: VendorAccountRow["lineOfBusiness"]
): string {
	return LOB_API[lob];
}

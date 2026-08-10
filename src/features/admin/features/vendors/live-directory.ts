import type {
	VendorDirectoryRow,
	VendorListHealth,
	VendorListStatus,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import type {
	AccountDto,
	ConnectionDto,
	InboundFileDto,
	IntakeJobDto,
	VendorDto,
} from "@/lib/vendor-core/types";

const AVATAR_BG = [
	"bg-[#13446c]",
	"bg-[#0f766e]",
	"bg-[#7c3aed]",
	"bg-[#b45309]",
	"bg-[#be123c]",
	"bg-[#0369a1]",
	"bg-[#4338ca]",
	"bg-[#15803d]",
] as const;

function mapListStatus(status: string): VendorListStatus {
	const s = status.toLowerCase();
	if (s === "suspended" || s === "terminated" || s === "inactive") {
		return "inactive";
	}
	// Keep prospects/onboarding visible under Active unless explicitly at risk
	if (s === "onboarding") return "at_risk";
	if (s === "prospect" || s === "invited" || s === "under_review") {
		return "active";
	}
	return "active";
}

function mapHealth(
	metaHealth: string,
	connFailed: boolean,
	connWarning: boolean
): VendorListHealth {
	if (connFailed || metaHealth === "critical") return "critical";
	if (connWarning || metaHealth === "warning") return "warning";
	return "healthy";
}

function relativeFromIso(iso: string | null | undefined): {
	absolute: string;
	relative: string;
} {
	if (!iso) {
		return { absolute: "—", relative: "—" };
	}
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) {
		return { absolute: iso, relative: "—" };
	}
	const absolute = d.toLocaleString(undefined, {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	const startOfYesterday = new Date(startOfToday);
	startOfYesterday.setDate(startOfYesterday.getDate() - 1);
	if (d >= startOfToday) return { absolute, relative: "Today" };
	if (d >= startOfYesterday) return { absolute, relative: "Yesterday" };
	return { absolute, relative: "Older" };
}

/** Map remote vendor-core records into the original Vendors list row shape. */
export function liveVendorsToDirectoryRows(
	vendors: VendorDto[],
	connections: ConnectionDto[],
	jobs: IntakeJobDto[],
	accounts: AccountDto[] = [],
	files: InboundFileDto[] = []
): VendorDirectoryRow[] {
	const latestFileByVendor = new Map<string, string>();
	for (const f of files) {
		const vid = f.vendor_id;
		if (!vid || !f.created_at) continue;
		const prev = latestFileByVendor.get(vid);
		if (!prev || f.created_at > prev) latestFileByVendor.set(vid, f.created_at);
	}

	const accountCount = new Map<string, number>();
	for (const a of accounts) {
		if (!a.vendor_id) continue;
		accountCount.set(a.vendor_id, (accountCount.get(a.vendor_id) ?? 0) + 1);
	}

	return vendors.map((v, index) => {
		const meta = (v.metadata ?? {}) as Record<string, unknown>;
		const vendorConns = connections.filter((c) => c.vendor_id === v.id);
		const vendorJobs = jobs.filter(
			(j) => j.vendor_id === v.id && j.status !== "disabled"
		);
		const failed = vendorConns.some(
			(c) =>
				c.status === "failed" ||
				c.health?.current_status === "failed" ||
				Boolean(c.health?.last_error)
		);
		const warning = vendorConns.some(
			(c) => c.status === "testing" || c.status === "draft"
		);
		const { absolute, relative } = relativeFromIso(
			latestFileByVendor.get(v.id)
		);
		const name = v.name || v.legal_name || "—";
		return {
			id: v.id,
			name,
			vendorCode: v.code || v.vendor_code || "—",
			vendorType: String(meta.vendor_type ?? v.tier ?? "Vendor"),
			status: mapListStatus(v.status),
			linkedAccounts: accountCount.get(v.id) ?? 0,
			activeJobs: vendorJobs.length,
			lastFileReceived: absolute,
			lastFileRelative: relative,
			health: mapHealth(String(meta.health ?? ""), failed, warning),
			mark: name.trim().charAt(0).toUpperCase() || "V",
			avatarBg: AVATAR_BG[index % AVATAR_BG.length]!,
			createdAt: v.created_at,
		};
	});
}

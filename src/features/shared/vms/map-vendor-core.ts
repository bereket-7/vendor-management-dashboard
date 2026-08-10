import type { VendorDto } from "@/lib/vendor-core/types";

import type { VendorModel, VendorStatus } from "./types";

const VENDOR_STATUSES = new Set<VendorStatus>([
	"prospect",
	"invited",
	"onboarding",
	"under_review",
	"active",
	"suspended",
	"offboarded",
]);

function mapStatus(raw: string): VendorStatus {
	if (raw === "terminated") return "offboarded";
	if (VENDOR_STATUSES.has(raw as VendorStatus)) return raw as VendorStatus;
	return "active";
}

/** Map vendor-core VendorDto → VMS VendorModel used by dashboard / shared queries. */
export function vendorDtoToModel(v: VendorDto): VendorModel {
	const now = new Date().toISOString();
	const meta = (v.metadata ?? {}) as Record<string, unknown>;
	const vendorType = meta.vendor_type != null ? String(meta.vendor_type) : null;
	return {
		id: v.id,
		legalName: v.legal_name || v.name,
		tradeName: v.trade_name ?? null,
		status: mapStatus(v.status),
		categories: vendorType ? [vendorType] : [],
		tags: v.vendor_code ? [v.vendor_code] : [],
		country: v.country ?? "",
		city: v.city ?? "",
		taxId: null,
		website: null,
		description: null,
		contacts: [],
		riskLevel: "low",
		riskScore: 0,
		onboardingProgress: v.status === "active" ? 100 : 40,
		createdAt: v.created_at ?? now,
		updatedAt: v.updated_at ?? now,
	};
}

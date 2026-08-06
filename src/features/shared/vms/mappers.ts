/**
 * Map Django `/api/v1` VMS payloads (snake_case) → dashboard VendorModel shapes.
 */
import type { PaginatedResult } from "@/lib/vendor-core/types";

import type {
	RiskLevel,
	VendorCategoryModel,
	VendorContact,
	VendorModel,
	VendorStatus,
} from "./types";

export function unwrapPage<T>(res: PaginatedResult<T> | T[]): T[] {
	return Array.isArray(res) ? res : (res.results ?? []);
}

type DjangoVendor = {
	id: string;
	legal_name?: string;
	trade_name?: string | null;
	status?: string;
	categories?: Array<{ id?: string; name?: string; code?: string } | string>;
	country?: string;
	city?: string;
	tax_id?: string | null;
	website?: string | null;
	description?: string | null;
	contacts?: Array<{
		id: string;
		name: string;
		email: string;
		phone?: string | null;
		role?: string;
		is_primary?: boolean;
	}>;
	risk_level?: string;
	risk_score?: number | string;
	onboarding_progress?: number;
	created_at?: string;
	updated_at?: string;
	tags?: string[];
};

function mapStatus(status?: string): VendorStatus {
	const allowed: VendorStatus[] = [
		"prospect",
		"invited",
		"onboarding",
		"under_review",
		"active",
		"suspended",
		"offboarded",
	];
	if (status && (allowed as string[]).includes(status)) {
		return status as VendorStatus;
	}
	if (status === "approved" || status === "pending_approval") return "under_review";
	if (status === "draft") return "prospect";
	return "prospect";
}

function mapRisk(level?: string): RiskLevel {
	const allowed: RiskLevel[] = ["low", "medium", "high", "critical"];
	if (level && (allowed as string[]).includes(level)) return level as RiskLevel;
	return "medium";
}

export function mapDjangoVendor(row: DjangoVendor): VendorModel {
	const contacts: VendorContact[] = (row.contacts ?? []).map((c) => ({
		id: String(c.id),
		name: c.name,
		email: c.email,
		phone: c.phone ?? null,
		role: c.role ?? "Contact",
		isPrimary: Boolean(c.is_primary),
	}));
	const categories = (row.categories ?? []).map((c) =>
		typeof c === "string" ? c : (c.name ?? c.code ?? String(c.id ?? ""))
	);
	return {
		id: String(row.id),
		legalName: row.legal_name ?? "",
		tradeName: row.trade_name ?? null,
		status: mapStatus(row.status),
		categories,
		tags: row.tags ?? [],
		country: row.country ?? "",
		city: row.city ?? "",
		taxId: row.tax_id ?? null,
		website: row.website ?? null,
		description: row.description ?? null,
		contacts,
		riskLevel: mapRisk(row.risk_level),
		riskScore: Number(row.risk_score ?? 0),
		onboardingProgress: Number(row.onboarding_progress ?? 0),
		createdAt: row.created_at ?? new Date().toISOString(),
		updatedAt: row.updated_at ?? new Date().toISOString(),
	};
}

export function mapDjangoCategory(row: {
	id: string;
	name: string;
	code: string;
	description?: string | null;
	parent?: string | null;
	vendor_count?: number;
}): VendorCategoryModel {
	return {
		id: String(row.id),
		name: row.name,
		code: row.code,
		description: row.description ?? null,
		parentId: row.parent ? String(row.parent) : null,
		vendorCount: row.vendor_count ?? 0,
	};
}

export function vendorToCreatePayload(input: {
	legalName: string;
	tradeName?: string | null;
	status?: string;
	country?: string;
	city?: string;
	categories?: string[];
}) {
	return {
		vendor_code: `VND-${Date.now().toString(36).toUpperCase()}`,
		legal_name: input.legalName,
		trade_name: input.tradeName ?? null,
		status: input.status ?? "prospect",
		country: input.country || "US",
		city: input.city || "Unknown",
	};
}

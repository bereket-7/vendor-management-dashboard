/**
 * Map Django `/api/v1` VMS payloads (snake_case) → dashboard VendorModel shapes.
 */
import type { PaginatedResult } from "@/lib/vendor-core/types";

import type {
	ApprovalRequestModel,
	BidModel,
	CertificateModel,
	ContractModel,
	DocumentModel,
	InvoiceModel,
	NotificationModel,
	OnboardingCaseModel,
	PurchaseOrderModel,
	RfxModel,
	RiskLevel,
	ScorecardModel,
	VendorCategoryModel,
	VendorContact,
	VendorModel,
	VendorStatus,
	VendorTeamMember,
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
	if (status === "approved" || status === "pending_approval")
		return "under_review";
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

function str(value: unknown, fallback = ""): string {
	if (value == null) return fallback;
	return String(value);
}

function num(value: unknown, fallback = 0): number {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

export function mapDjangoOnboarding(
	row: Record<string, unknown>
): OnboardingCaseModel {
	const statusRaw = str(row.status, "in_progress");
	const status: OnboardingCaseModel["status"] =
		statusRaw === "not_started" ||
		statusRaw === "in_progress" ||
		statusRaw === "submitted" ||
		statusRaw === "changes_requested" ||
		statusRaw === "approved" ||
		statusRaw === "rejected"
			? statusRaw
			: statusRaw === "complete" || statusRaw === "completed"
				? "approved"
				: statusRaw === "pending"
					? "submitted"
					: "in_progress";
	return {
		id: str(row.id),
		vendorId: str(row.vendor),
		vendorName: str(row.vendor_name ?? row.vendor, "Vendor"),
		status,
		progress: num(row.progress_percent),
		checklist: [],
		submittedAt: row.started_at ? str(row.started_at) : null,
		reviewedAt: row.completed_at ? str(row.completed_at) : null,
		reviewerNote: row.rejection_reason ? str(row.rejection_reason) : null,
		updatedAt: str(row.updated_at, new Date().toISOString()),
	};
}

export function mapDjangoDocument(row: Record<string, unknown>): DocumentModel {
	return {
		id: str(row.id),
		vendorId: str(row.vendor),
		vendorName: str(row.vendor_name ?? "Vendor"),
		type: str(row.document_type, "other") as DocumentModel["type"],
		name: str(row.title),
		status: str(row.status, "pending") as DocumentModel["status"],
		uploadedAt: str(row.created_at, new Date().toISOString()),
		expiresAt: row.expires_at ? str(row.expires_at) : null,
		visibility: "both",
		fileSizeKb:
			row.size_bytes != null
				? Math.round(num(row.size_bytes) / 1024)
				: undefined,
		version: row.version != null ? num(row.version) : undefined,
		uploadedBy: row.uploaded_by ? str(row.uploaded_by) : undefined,
		reviewedBy: row.reviewed_by ? str(row.reviewed_by) : null,
		reviewedAt: row.reviewed_at ? str(row.reviewed_at) : null,
		description: row.rejection_reason ? str(row.rejection_reason) : null,
		checksum: row.checksum_sha256 ? str(row.checksum_sha256) : null,
		history: [],
	};
}

export function mapDjangoCertificate(
	row: Record<string, unknown>
): CertificateModel {
	const statusRaw = str(row.status, "valid");
	const status: CertificateModel["status"] =
		statusRaw === "expired" || statusRaw === "expiring" || statusRaw === "valid"
			? statusRaw
			: statusRaw === "revoked"
				? "expired"
				: "valid";
	return {
		id: str(row.id),
		vendorId: str(row.vendor),
		vendorName: str(row.vendor_name ?? "Vendor"),
		name: str(row.certification_type ?? row.certificate_number, "Certificate"),
		issuer: str(row.certifying_body, "Unknown"),
		expiresAt: str(row.expires_at, new Date().toISOString()),
		status,
		riskFlag: status !== "valid",
	};
}

export function mapDjangoContract(row: Record<string, unknown>): ContractModel {
	return {
		id: str(row.id),
		number: str(row.contract_number),
		title: str(row.title),
		vendorId: str(row.vendor),
		vendorName: str(row.vendor_name ?? "Vendor"),
		status: str(row.status, "draft") as ContractModel["status"],
		value: num(row.total_contract_value),
		currency: str(row.currency, "USD"),
		startDate: str(row.effective_date, new Date().toISOString().slice(0, 10)),
		endDate: str(row.expiration_date, new Date().toISOString().slice(0, 10)),
		slaSummary: null,
		updatedAt: str(row.updated_at, new Date().toISOString()),
	};
}

export function mapDjangoRfx(row: Record<string, unknown>): RfxModel {
	const typeRaw = str(row.rfx_type, "RFP").toUpperCase();
	const type: RfxModel["type"] =
		typeRaw === "RFI" || typeRaw === "RFP" || typeRaw === "RFQ"
			? typeRaw
			: "RFP";
	return {
		id: str(row.id),
		number: str(row.reference_number),
		title: str(row.title),
		type,
		status: str(row.status, "draft") as RfxModel["status"],
		category: str(row.category ?? ""),
		closesAt: str(row.bid_submission_deadline, new Date().toISOString()),
		invitedVendorIds: [],
		bidCount: 0,
		budget: null,
		currency: "USD",
		description: str(row.description),
		updatedAt: str(row.updated_at, new Date().toISOString()),
	};
}

export function mapDjangoBid(
	row: Record<string, unknown>,
	rfxId?: string
): BidModel {
	return {
		id: str(row.id),
		rfxId: str(row.rfx ?? rfxId),
		rfxTitle: str(row.rfx_title ?? ""),
		vendorId: str(row.vendor),
		vendorName: str(row.vendor_name ?? "Vendor"),
		amount: num(row.amount ?? row.total_amount),
		currency: str(row.currency, "USD"),
		status: str(row.status, "submitted") as BidModel["status"],
		notes: row.notes ? str(row.notes) : null,
		submittedAt: row.submitted_at ? str(row.submitted_at) : null,
	};
}

export function mapDjangoPurchaseOrder(
	row: Record<string, unknown>
): PurchaseOrderModel {
	return {
		id: str(row.id),
		number: str(row.po_number ?? row.number),
		vendorId: str(row.vendor),
		vendorName: str(row.vendor_name ?? "Vendor"),
		contractId: row.contract ? str(row.contract) : null,
		rfxId: row.rfx ? str(row.rfx) : null,
		status: str(row.status, "draft") as PurchaseOrderModel["status"],
		currency: str(row.currency, "USD"),
		total: num(row.total_amount ?? row.total),
		lines: [],
		orderedAt: str(row.ordered_at ?? row.created_at, new Date().toISOString()),
		acknowledgedAt: row.acknowledged_at ? str(row.acknowledged_at) : null,
		updatedAt: str(row.updated_at, new Date().toISOString()),
	};
}

export function mapDjangoInvoice(row: Record<string, unknown>): InvoiceModel {
	return {
		id: str(row.id),
		number: str(row.invoice_number ?? row.number),
		vendorId: str(row.vendor),
		vendorName: str(row.vendor_name ?? "Vendor"),
		poId: row.purchase_order ? str(row.purchase_order) : null,
		poNumber: row.po_number ? str(row.po_number) : null,
		status: str(row.status, "submitted") as InvoiceModel["status"],
		amount: num(row.amount ?? row.total_amount),
		currency: str(row.currency, "USD"),
		matchScore: row.match_score != null ? num(row.match_score) : null,
		submittedAt: row.submitted_at ? str(row.submitted_at) : null,
		dueDate: str(
			row.due_date ?? row.updated_at,
			new Date().toISOString().slice(0, 10)
		),
		updatedAt: str(row.updated_at, new Date().toISOString()),
	};
}

export function mapDjangoApproval(
	row: Record<string, unknown>
): ApprovalRequestModel {
	const typeRaw = str(row.request_type ?? row.type, "contract");
	const type: ApprovalRequestModel["type"] =
		typeRaw === "onboarding" ||
		typeRaw === "contract" ||
		typeRaw === "purchase_order" ||
		typeRaw === "invoice"
			? typeRaw
			: "contract";
	return {
		id: str(row.id),
		type,
		title: str(row.title ?? row.subject, "Approval"),
		entityId: str(row.entity_id ?? row.related_entity_id ?? row.id),
		vendorName: str(row.vendor_name ?? ""),
		status: str(row.status, "pending") as ApprovalRequestModel["status"],
		requestedBy: str(row.requested_by ?? ""),
		requestedAt: str(row.created_at, new Date().toISOString()),
	};
}

export function mapDjangoScorecard(
	row: Record<string, unknown>
): ScorecardModel {
	return {
		id: str(row.id),
		vendorId: str(row.vendor),
		vendorName: str(row.vendor_name ?? "Vendor"),
		period: str(row.period ?? row.period_label, "Current"),
		otif: num(row.otif ?? row.delivery_score),
		quality: num(row.quality ?? row.quality_score),
		responsiveness: num(row.responsiveness ?? row.delivery_score),
		compliance: num(row.compliance ?? row.compliance_score),
		overall: num(row.overall ?? row.overall_score ?? row.score),
		updatedAt: str(row.updated_at, new Date().toISOString()),
	};
}

export function mapDjangoNotification(
	row: Record<string, unknown>
): NotificationModel {
	return {
		id: str(row.id),
		title: str(row.subject),
		body: str(row.body_preview),
		read: str(row.status) === "read" || Boolean(row.read_at),
		href: row.related_entity_id
			? `/admin/${str(row.related_entity_type ?? "activity")}/${str(row.related_entity_id)}`
			: null,
		createdAt: str(row.created_at, new Date().toISOString()),
	};
}

export function mapDjangoTeamMember(
	row: Record<string, unknown>
): VendorTeamMember {
	const roleRaw = str(row.role, "vendor_viewer");
	const role: VendorTeamMember["role"] =
		roleRaw === "vendor_admin" ||
		roleRaw === "vendor_bidder" ||
		roleRaw === "vendor_finance" ||
		roleRaw === "vendor_viewer"
			? roleRaw
			: "vendor_viewer";
	return {
		id: str(row.id),
		name: str(row.name ?? row.display_name ?? row.email),
		email: str(row.email),
		role,
		isActive: row.is_active !== false,
	};
}

import type {
	ApprovalRequestModel,
	ApprovalStatus,
	ApprovalType,
	BidModel,
	BidStatus,
	CertificateModel,
	DocumentModel,
	DocumentStatus,
	DocumentType,
	InvoiceModel,
	InvoiceStatus,
	NotificationModel,
	OnboardingCaseModel,
	OnboardingStatus,
	PoLineItem,
	PoStatus,
	PurchaseOrderModel,
	RfxModel,
	RfxStatus,
	RfxType,
	ScorecardModel,
} from "./types";

function str(v: unknown, fallback = ""): string {
	if (v == null) return fallback;
	return String(v);
}

function num(v: unknown, fallback = 0): number {
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

function iso(v: unknown): string {
	if (!v) return new Date().toISOString();
	return String(v);
}

function fileExtFromMime(mime: string, title: string): string {
	const map: Record<string, string> = {
		"application/pdf": "pdf",
		"image/png": "png",
		"image/jpeg": "jpg",
		"image/gif": "gif",
		"image/webp": "webp",
	};
	if (map[mime]) return map[mime];
	const match = title.match(/\.([a-z0-9]+)$/i);
	return match?.[1]?.toLowerCase() ?? "";
}

function vendorNameOf(id: string, names?: Map<string, string>): string {
	return names?.get(id) ?? "";
}

const DOC_TYPE_IN: Record<string, DocumentType> = {
	w9: "w9",
	insurance_certificate: "insurance",
	insurance: "insurance",
	business_license: "business_license",
	msa: "contract",
	sow: "contract",
	nda: "contract",
	tax_certificate: "tax_certificate",
	other: "other",
};

const DOC_TYPE_OUT: Record<DocumentType, string> = {
	tax_certificate: "other",
	insurance: "insurance_certificate",
	business_license: "business_license",
	contract: "msa",
	w9: "w9",
	other: "other",
};

const DOC_STATUS_IN: Record<string, DocumentStatus> = {
	pending_review: "pending",
	pending: "pending",
	approved: "approved",
	rejected: "rejected",
	expired: "expired",
};

const DOC_STATUS_OUT: Record<DocumentStatus, string> = {
	pending: "pending_review",
	approved: "approved",
	rejected: "rejected",
	expired: "expired",
};

const ONBOARDING_IN: Record<string, OnboardingStatus> = {
	not_started: "not_started",
	in_progress: "in_progress",
	pending_internal_review: "submitted",
	pending_vendor: "changes_requested",
	completed: "approved",
	rejected: "rejected",
};

const ONBOARDING_OUT: Record<OnboardingStatus, string> = {
	not_started: "not_started",
	in_progress: "in_progress",
	submitted: "pending_internal_review",
	changes_requested: "pending_vendor",
	approved: "completed",
	rejected: "rejected",
};

const RFX_TYPE_IN: Record<string, RfxType> = {
	rfi: "RFI",
	rfp: "RFP",
	rfq: "RFQ",
};

const RFX_STATUS_IN: Record<string, RfxStatus> = {
	draft: "draft",
	published: "published",
	open_for_bids: "published",
	in_evaluation: "evaluating",
	awarded: "awarded",
	cancelled: "cancelled",
};

const RFX_STATUS_OUT: Record<RfxStatus, string> = {
	draft: "draft",
	published: "published",
	closed: "open_for_bids",
	evaluating: "in_evaluation",
	awarded: "awarded",
	cancelled: "cancelled",
};

const BID_STATUS_IN: Record<string, BidStatus> = {
	draft: "draft",
	submitted: "submitted",
	under_review: "submitted",
	shortlisted: "submitted",
	awarded: "awarded",
	rejected: "rejected",
	withdrawn: "withdrawn",
};

const PO_STATUS_IN: Record<string, PoStatus> = {
	draft: "draft",
	pending_approval: "pending_approval",
	approved: "sent",
	issued: "sent",
	acknowledged: "acknowledged",
	partially_received: "partially_received",
	received: "received",
	closed: "received",
	cancelled: "cancelled",
};

const PO_STATUS_OUT: Record<PoStatus, string> = {
	draft: "draft",
	pending_approval: "pending_approval",
	sent: "issued",
	acknowledged: "acknowledged",
	partially_received: "partially_received",
	received: "received",
	cancelled: "cancelled",
};

const INVOICE_STATUS_IN: Record<string, InvoiceStatus> = {
	received: "draft",
	pending_match: "submitted",
	matched: "matched",
	exception: "exception",
	pending_approval: "submitted",
	approved: "approved",
	scheduled: "approved",
	paid: "paid",
	disputed: "disputed",
	rejected: "exception",
	void: "exception",
	draft: "draft",
	submitted: "submitted",
};

const INVOICE_STATUS_OUT: Record<InvoiceStatus, string> = {
	draft: "received",
	submitted: "pending_match",
	matched: "matched",
	exception: "exception",
	approved: "approved",
	disputed: "disputed",
	paid: "paid",
};

const APPROVAL_TYPE_IN: Record<string, ApprovalType> = {
	onboarding: "onboarding",
	onboarding_case: "onboarding",
	contract: "contract",
	purchase_order: "purchase_order",
	invoice: "invoice",
};

const APPROVAL_STATUS_IN: Record<string, ApprovalStatus> = {
	pending: "pending",
	approved: "approved",
	rejected: "rejected",
	escalated: "pending",
	delegated: "pending",
	changes_requested: "changes_requested",
};

export function documentDtoToModel(
	raw: Record<string, unknown>,
	names?: Map<string, string>
): DocumentModel {
	const vendorId = str(raw.vendor_id);
	const typeKey = str(raw.document_type);
	const statusKey = str(raw.status);
	return {
		id: str(raw.id),
		vendorId,
		vendorName: vendorNameOf(vendorId, names),
		name: str(raw.title, "Document"),
		type: DOC_TYPE_IN[typeKey] ?? "other",
		status: DOC_STATUS_IN[statusKey] ?? "pending",
		expiresAt: raw.expires_at ? str(raw.expires_at) : null,
		uploadedAt: iso(raw.created_at),
		visibility: "both",
		fileSizeKb: Math.round(num(raw.size_bytes) / 1024),
		fileExtension: fileExtFromMime(str(raw.mime_type), str(raw.title)),
		version: num(raw.version, 1),
		uploadedBy: raw.uploaded_by_id ? str(raw.uploaded_by_id) : undefined,
		reviewedBy: raw.reviewed_by_id ? str(raw.reviewed_by_id) : null,
		reviewedAt: raw.reviewed_at ? str(raw.reviewed_at) : null,
		checksum: str(raw.checksum_sha256) || null,
	};
}

export function documentModelToCreateInput(
	doc: Partial<DocumentModel> & { vendorId: string; name: string }
): Record<string, unknown> {
	const checksum = (doc.checksum ?? "").replace(/[^a-fA-F0-9]/g, "");
	const sha = checksum.length === 64 ? checksum : "0".repeat(64);
	return {
		vendor_id: doc.vendorId,
		document_type: DOC_TYPE_OUT[doc.type ?? "other"] ?? "other",
		title: doc.name,
		storage_key: `vms/${doc.vendorId}/${doc.name}`,
		checksum_sha256: sha,
		mime_type: "application/octet-stream",
		size_bytes: (doc.fileSizeKb ?? 0) * 1024,
		status: DOC_STATUS_OUT[doc.status ?? "pending"],
		expires_at: doc.expiresAt ?? null,
	};
}

export function documentModelToUpdateInput(
	patch: Partial<DocumentModel>
): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (patch.name != null) body.title = patch.name;
	if (patch.type != null) body.document_type = DOC_TYPE_OUT[patch.type];
	if (patch.status != null) body.status = DOC_STATUS_OUT[patch.status];
	if (patch.expiresAt !== undefined) body.expires_at = patch.expiresAt;
	if (patch.vendorId != null) body.vendor_id = patch.vendorId;
	return body;
}

export function onboardingDtoToModel(
	raw: Record<string, unknown>,
	names?: Map<string, string>
): OnboardingCaseModel {
	const vendorId = str(raw.vendor_id);
	const status = ONBOARDING_IN[str(raw.status)] ?? "in_progress";
	const progress = num(raw.progress_percent);
	return {
		id: str(raw.id),
		vendorId,
		vendorName: vendorNameOf(vendorId, names),
		status,
		progress,
		checklist: [],
		submittedAt: raw.started_at ? str(raw.started_at) : null,
		reviewedAt: raw.completed_at ? str(raw.completed_at) : null,
		reviewerNote: raw.rejection_reason ? str(raw.rejection_reason) : null,
		updatedAt: iso(raw.updated_at),
	};
}

export function onboardingStatusToApi(status: OnboardingStatus): string {
	return ONBOARDING_OUT[status] ?? "in_progress";
}

export function certificateDtoToModel(
	raw: Record<string, unknown>,
	names?: Map<string, string>
): CertificateModel {
	const vendorId = str(raw.vendor_id);
	const apiStatus = str(raw.status);
	const status: CertificateModel["status"] =
		apiStatus === "expired" || apiStatus === "revoked"
			? "expired"
			: apiStatus === "expiring_soon"
				? "expiring"
				: apiStatus === "pending_verification"
					? "pending"
					: "valid";
	return {
		id: str(raw.id),
		vendorId,
		vendorName: vendorNameOf(vendorId, names),
		name: str(raw.certification_type, "Certificate").replace(/_/g, " "),
		issuer: str(raw.certifying_body, "—"),
		expiresAt: str(raw.expires_at, iso(null)),
		status,
		riskFlag: status !== "valid",
	};
}

export function rfxDtoToModel(
	raw: Record<string, unknown>,
	bidCount = 0
): RfxModel {
	const typeKey = str(raw.rfx_type);
	const statusKey = str(raw.status);
	return {
		id: str(raw.id),
		number: str(raw.reference_number),
		title: str(raw.title),
		type: RFX_TYPE_IN[typeKey] ?? "RFP",
		status: RFX_STATUS_IN[statusKey] ?? "draft",
		category: str(raw.category_id),
		closesAt: iso(raw.bid_submission_deadline),
		invitedVendorIds: [],
		bidCount,
		budget: null,
		currency: "USD",
		description: str(raw.description),
		updatedAt: iso(raw.updated_at),
	};
}

export function rfxModelToCreateInput(
	input: Omit<RfxModel, "id" | "updatedAt" | "bidCount">
): Record<string, unknown> {
	const typeMap: Record<RfxType, string> = {
		RFI: "rfi",
		RFP: "rfp",
		RFQ: "rfq",
	};
	return {
		reference_number: input.number,
		title: input.title,
		rfx_type: typeMap[input.type] ?? "rfp",
		status: RFX_STATUS_OUT[input.status] ?? "draft",
		description: input.description,
		bid_submission_deadline: input.closesAt,
	};
}

export function rfxModelToUpdateInput(
	patch: Partial<RfxModel>
): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (patch.number != null) body.reference_number = patch.number;
	if (patch.title != null) body.title = patch.title;
	if (patch.description != null) body.description = patch.description;
	if (patch.closesAt != null) body.bid_submission_deadline = patch.closesAt;
	if (patch.status != null) body.status = RFX_STATUS_OUT[patch.status];
	if (patch.type != null) {
		body.rfx_type = { RFI: "rfi", RFP: "rfp", RFQ: "rfq" }[patch.type];
	}
	return body;
}

export function bidDtoToModel(
	raw: Record<string, unknown>,
	rfxTitle = ""
): BidModel {
	const vendorId = str(raw.vendor_id);
	return {
		id: str(raw.id),
		rfxId: str(raw.rfx_id),
		rfxTitle,
		vendorId,
		vendorName: "",
		amount: num(raw.total_amount),
		currency: str(raw.currency, "USD"),
		status: BID_STATUS_IN[str(raw.status)] ?? "submitted",
		notes: null,
		submittedAt: raw.submitted_at ? str(raw.submitted_at) : null,
	};
}

export function purchaseOrderDtoToModel(
	raw: Record<string, unknown>,
	names?: Map<string, string>
): PurchaseOrderModel {
	const vendorId = str(raw.vendor_id);
	const total = num(raw.total_amount);
	const status = PO_STATUS_IN[str(raw.status)] ?? "draft";
	return {
		id: str(raw.id),
		number: str(raw.po_number),
		vendorId,
		vendorName: vendorNameOf(vendorId, names),
		contractId: raw.contract_id ? str(raw.contract_id) : null,
		rfxId: null,
		status,
		currency: str(raw.currency, "USD"),
		total,
		lines: decodePoLines(raw, total, status),
		orderedAt: iso(raw.issued_at ?? raw.created_at),
		acknowledgedAt: raw.acknowledged_at
			? iso(raw.acknowledged_at)
			: status === "acknowledged"
				? iso(raw.updated_at)
				: null,
		updatedAt: iso(raw.updated_at),
	};
}

function decodePoLines(
	raw: Record<string, unknown>,
	total: number,
	status: PoStatus
): PoLineItem[] {
	const received = status === "received" || status === "partially_received";
	const packed = str(raw.cost_center);
	const match = packed.match(/^(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)(?:\|(.*))?$/);
	if (match) {
		const quantity = Number(match[1]);
		const unitPrice = Number(match[2]);
		return [
			{
				id: `${str(raw.id)}-line-1`,
				description: match[3]?.trim() || "PO line",
				quantity,
				unitPrice,
				receivedQty: received ? quantity : 0,
			},
		];
	}
	if (total > 0) {
		return [
			{
				id: `${str(raw.id)}-line-1`,
				description: packed || "Order total",
				quantity: 1,
				unitPrice: total,
				receivedQty: received ? 1 : 0,
			},
		];
	}
	return [];
}

function encodePoLine(line: {
	quantity: number;
	unitPrice: number;
	description: string;
}): string {
	const prefix = `${line.quantity}*${line.unitPrice}|`;
	return (prefix + (line.description || "PO line")).slice(0, 50);
}

export function purchaseOrderModelToCreateInput(
	input: Omit<PurchaseOrderModel, "id" | "updatedAt" | "acknowledgedAt">
): Record<string, unknown> {
	const line = input.lines[0];
	return {
		po_number: input.number,
		vendor_id: input.vendorId,
		contract_id: input.contractId,
		status: PO_STATUS_OUT[input.status] ?? "draft",
		subtotal_amount: input.total,
		tax_amount: 0,
		total_amount: input.total,
		currency: input.currency || "USD",
		cost_center: line ? encodePoLine(line) : undefined,
	};
}

export function purchaseOrderModelToUpdateInput(
	patch: Partial<PurchaseOrderModel>
): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (patch.number != null) body.po_number = patch.number;
	if (patch.vendorId != null) body.vendor_id = patch.vendorId;
	if (patch.contractId !== undefined) body.contract_id = patch.contractId;
	if (patch.status != null) body.status = PO_STATUS_OUT[patch.status];
	if (patch.total != null) {
		body.total_amount = patch.total;
		body.subtotal_amount = patch.total;
	}
	if (patch.currency != null) body.currency = patch.currency;
	return body;
}

export function invoiceDtoToModel(
	raw: Record<string, unknown>,
	names?: Map<string, string>,
	poNumbers?: Map<string, string>
): InvoiceModel {
	const vendorId = str(raw.vendor_id);
	const poId = raw.purchase_order_id ? str(raw.purchase_order_id) : null;
	return {
		id: str(raw.id),
		number: str(raw.invoice_number),
		vendorId,
		vendorName: vendorNameOf(vendorId, names),
		poId,
		poNumber: poId ? (poNumbers?.get(poId) ?? null) : null,
		status: INVOICE_STATUS_IN[str(raw.status)] ?? "submitted",
		amount: num(raw.total_amount),
		currency: str(raw.currency, "USD"),
		matchScore: str(raw.status) === "matched" ? 100 : null,
		submittedAt: iso(raw.created_at),
		dueDate: str(raw.due_date),
		updatedAt: iso(raw.updated_at),
	};
}

export function invoiceModelToCreateInput(
	input: Omit<InvoiceModel, "id" | "updatedAt">
): Record<string, unknown> {
	return {
		invoice_number: input.number,
		vendor_id: input.vendorId,
		purchase_order_id: input.poId,
		status: INVOICE_STATUS_OUT[input.status] ?? "received",
		invoice_date: (input.submittedAt ?? new Date().toISOString()).slice(0, 10),
		due_date: input.dueDate.slice(0, 10),
		subtotal_amount: input.amount,
		tax_amount: 0,
		total_amount: input.amount,
		currency: input.currency || "USD",
	};
}

export function invoiceModelToUpdateInput(
	patch: Partial<InvoiceModel>
): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (patch.number != null) body.invoice_number = patch.number;
	if (patch.vendorId != null) body.vendor_id = patch.vendorId;
	if (patch.poId !== undefined) body.purchase_order_id = patch.poId;
	if (patch.status != null) body.status = INVOICE_STATUS_OUT[patch.status];
	if (patch.amount != null) {
		body.total_amount = patch.amount;
		body.subtotal_amount = patch.amount;
	}
	if (patch.dueDate != null) body.due_date = patch.dueDate.slice(0, 10);
	if (patch.currency != null) body.currency = patch.currency;
	return body;
}

export function approvalDtoToModel(
	raw: Record<string, unknown>
): ApprovalRequestModel {
	const entity = str(raw.entity_type);
	return {
		id: str(raw.id),
		type: APPROVAL_TYPE_IN[entity] ?? "contract",
		title: `${entity.replace(/_/g, " ")} ${str(raw.entity_id).slice(0, 8)}`,
		entityId: str(raw.entity_id),
		vendorName: "",
		status: APPROVAL_STATUS_IN[str(raw.status)] ?? "pending",
		requestedAt: iso(raw.created_at),
		requestedBy: str(raw.requested_by_id, "—"),
	};
}

export function approvalUiStatusToDecision(
	status: ApprovalStatus
): "approved" | "rejected" | "changes_requested" | null {
	if (status === "pending") return null;
	if (status === "approved") return "approved";
	if (status === "rejected") return "rejected";
	return "changes_requested";
}

export function scorecardDtoToModel(
	raw: Record<string, unknown>,
	names?: Map<string, string>
): ScorecardModel {
	const vendorId = str(raw.vendor_id);
	const overall = num(raw.overall_score);
	return {
		id: str(raw.id),
		vendorId,
		vendorName: vendorNameOf(vendorId, names),
		period: `${str(raw.period_start)} – ${str(raw.period_end)}`,
		otif: overall,
		quality: overall,
		responsiveness: overall,
		compliance: overall,
		overall,
		updatedAt: iso(raw.updated_at),
	};
}

export function notificationDtoToModel(
	raw: Record<string, unknown>
): NotificationModel {
	const read = Boolean(raw.read_at) || str(raw.status) === "read";
	return {
		id: str(raw.id),
		title: str(raw.subject, "Notification"),
		body: str(raw.body_preview),
		read,
		href: raw.related_entity_id
			? `/${str(raw.related_entity_type)}/${str(raw.related_entity_id)}`
			: null,
		createdAt: iso(raw.created_at),
	};
}

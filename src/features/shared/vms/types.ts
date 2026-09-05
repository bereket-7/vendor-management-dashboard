/** Shared VMS domain models used by buyer admin and vendor portal. */

export type VendorStatus =
	| "prospect"
	| "invited"
	| "onboarding"
	| "under_review"
	| "active"
	| "suspended"
	| "offboarded";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type VendorContact = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	role: string;
	isPrimary: boolean;
};

export type VendorModel = {
	id: string;
	legalName: string;
	tradeName: string | null;
	status: VendorStatus;
	categories: string[];
	tags: string[];
	country: string;
	city: string;
	taxId: string | null;
	website: string | null;
	description: string | null;
	contacts: VendorContact[];
	riskLevel: RiskLevel;
	riskScore: number;
	onboardingProgress: number;
	createdAt: string;
	updatedAt: string;
};

export type VendorCategoryModel = {
	id: string;
	name: string;
	code: string;
	description: string | null;
	parentId: string | null;
	vendorCount: number;
};

export type OnboardingStatus =
	| "not_started"
	| "in_progress"
	| "submitted"
	| "changes_requested"
	| "approved"
	| "rejected";

export type OnboardingChecklistItem = {
	id: string;
	label: string;
	completed: boolean;
	required: boolean;
};

export type OnboardingCaseModel = {
	id: string;
	vendorId: string;
	vendorName: string;
	status: OnboardingStatus;
	progress: number;
	checklist: OnboardingChecklistItem[];
	submittedAt: string | null;
	reviewedAt: string | null;
	reviewerNote: string | null;
	updatedAt: string;
};

export type DocumentType =
	| "tax_certificate"
	| "insurance"
	| "business_license"
	| "contract"
	| "w9"
	| "other";

export type DocumentStatus = "pending" | "approved" | "rejected" | "expired";

export type DocumentHistoryEntry = {
	id: string;
	at: string;
	actor: string;
	action: string;
	note?: string;
};

export type DocumentModel = {
	id: string;
	vendorId: string;
	vendorName: string;
	name: string;
	type: DocumentType;
	status: DocumentStatus;
	expiresAt: string | null;
	uploadedAt: string;
	visibility: "buyer" | "vendor" | "both";
	fileSizeKb?: number;
	fileExtension?: string;
	version?: number;
	uploadedBy?: string;
	reviewedBy?: string | null;
	reviewedAt?: string | null;
	description?: string | null;
	tags?: string[];
	contractNumber?: string | null;
	checksum?: string | null;
	issuer?: string | null;
	documentNumber?: string | null;
	history?: DocumentHistoryEntry[];
};

export type CertificateModel = {
	id: string;
	vendorId: string;
	vendorName: string;
	name: string;
	issuer: string;
	expiresAt: string;
	status: "valid" | "expiring" | "expired" | "pending";
	riskFlag: boolean;
};

export type ContractStatus =
	| "draft"
	| "pending_approval"
	| "active"
	| "expired"
	| "terminated";

export type ContractTermStatus = "completed" | "current" | "upcoming";

export type ContractTermPeriod = {
	id: string;
	label: string;
	startDate: string;
	endDate: string;
	status: ContractTermStatus;
};

export type ContractRateLine = {
	id: string;
	serviceCode: string;
	description: string;
	contractedRate: number;
	unit: string;
};

export type ContractSlaMetric = {
	id: string;
	name: string;
	target: string;
	/** Visual accent for list icons: emerald | sky | amber | violet | rose */
	tone?: "emerald" | "sky" | "amber" | "violet" | "rose";
};

export type ContractDocumentItem = {
	id: string;
	name: string;
	type: string;
	uploadedOn: string;
	fileExtension?: string;
	vendorId?: string;
};

export type ContractModel = {
	id: string;
	number: string;
	title: string;
	vendorId: string;
	vendorName: string;
	status: ContractStatus;
	value: number;
	currency: string;
	startDate: string;
	endDate: string;
	slaSummary: string | null;
	updatedAt: string;
	/** Presentation fields used by the contract detail dashboard */
	vendorType?: string;
	contractType?: string;
	paymentModel?: string;
	paymentTerms?: string;
	governingLaw?: string | null;
	executedOn?: string | null;
	accountManager?: string | null;
	notes?: string | null;
	terms?: ContractTermPeriod[];
	rateSchedule?: ContractRateLine[];
	slaMetrics?: ContractSlaMetric[];
	documents?: ContractDocumentItem[];
};

export type RfxType = "RFI" | "RFP" | "RFQ";
export type RfxStatus =
	| "draft"
	| "published"
	| "closed"
	| "evaluating"
	| "awarded"
	| "cancelled";

export type RfxModel = {
	id: string;
	number: string;
	title: string;
	type: RfxType;
	status: RfxStatus;
	category: string;
	closesAt: string;
	invitedVendorIds: string[];
	bidCount: number;
	budget: number | null;
	currency: string;
	description: string;
	updatedAt: string;
};

export type BidStatus =
	| "draft"
	| "submitted"
	| "withdrawn"
	| "awarded"
	| "rejected";

export type BidModel = {
	id: string;
	rfxId: string;
	rfxTitle: string;
	vendorId: string;
	vendorName: string;
	amount: number;
	currency: string;
	status: BidStatus;
	notes: string | null;
	submittedAt: string | null;
};

export type PoStatus =
	| "draft"
	| "pending_approval"
	| "sent"
	| "acknowledged"
	| "partially_received"
	| "received"
	| "cancelled";

export type PoLineItem = {
	id: string;
	description: string;
	quantity: number;
	unitPrice: number;
	receivedQty: number;
};

export type PurchaseOrderModel = {
	id: string;
	number: string;
	vendorId: string;
	vendorName: string;
	contractId: string | null;
	rfxId: string | null;
	status: PoStatus;
	currency: string;
	total: number;
	lines: PoLineItem[];
	orderedAt: string;
	acknowledgedAt: string | null;
	updatedAt: string;
};

export type InvoiceStatus =
	| "draft"
	| "submitted"
	| "matched"
	| "exception"
	| "approved"
	| "disputed"
	| "paid";

export type InvoiceModel = {
	id: string;
	number: string;
	vendorId: string;
	vendorName: string;
	poId: string | null;
	poNumber: string | null;
	status: InvoiceStatus;
	amount: number;
	currency: string;
	matchScore: number | null;
	submittedAt: string | null;
	dueDate: string;
	updatedAt: string;
};

export type ApprovalType =
	| "onboarding"
	| "contract"
	| "purchase_order"
	| "invoice";

export type ApprovalStatus =
	| "pending"
	| "approved"
	| "rejected"
	| "changes_requested";

export type ApprovalRequestModel = {
	id: string;
	type: ApprovalType;
	title: string;
	entityId: string;
	vendorName: string;
	status: ApprovalStatus;
	requestedAt: string;
	requestedBy: string;
};

export type ScorecardModel = {
	id: string;
	vendorId: string;
	vendorName: string;
	period: string;
	otif: number;
	quality: number;
	responsiveness: number;
	compliance: number;
	overall: number;
	updatedAt: string;
};

export type ActivityEventModel = {
	id: string;
	vendorId: string | null;
	entityType: string;
	entityId: string;
	action: string;
	actor: string;
	createdAt: string;
};

export type NotificationModel = {
	id: string;
	title: string;
	body: string;
	read: boolean;
	href: string | null;
	createdAt: string;
};

export type VendorTeamMember = {
	id: string;
	name: string;
	email: string;
	role: "vendor_admin" | "vendor_bidder" | "vendor_finance" | "vendor_viewer";
	isActive: boolean;
};

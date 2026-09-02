import { apiClient } from "@/lib/api/client";
import {
	buildAcceptPath,
	createVendorInvite,
	saveVendorInviteFromServer,
} from "@/lib/auth/vendor-invites";
import {
	isMockEnabled,
	isNestApiEnabled,
	withMockOrRemote,
} from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import {
	VendorCoreApiError,
	getStoredAccessToken,
	isVendorCoreLive,
} from "@/lib/vendor-core/client";
import type { VendorCategoryDto, VendorTeamMemberDto } from "@/lib/vendor-core/types";

import { vendorDtoToModel } from "./map-vendor-core";
import { CURRENT_VENDOR_ID, vmsStore } from "./mock-store";
import type {
	ActivityEventModel,
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
	ScorecardModel,
	VendorCategoryModel,
	VendorModel,
	VendorTeamMember,
} from "./types";

/** NestJS admin paths — see docs/api-contracts/vms.md */
const vmsPaths = {
	vendors: "/api/admin/vendors/",
	vendor: (id: string) => `/api/admin/vendors/${id}/`,
	invite: "/api/admin/vendors/invite/",
	categories: "/api/admin/categories/",
	onboarding: "/api/admin/onboarding/",
	onboardingDetail: (id: string) => `/api/admin/onboarding/${id}/`,
	documents: "/api/admin/documents/",
	document: (id: string) => `/api/admin/documents/${id}/`,
	certificates: "/api/admin/certificates/",
	contracts: "/api/admin/contracts/",
	contract: (id: string) => `/api/admin/contracts/${id}/`,
	rfx: "/api/admin/rfx/",
	rfxDetail: (id: string) => `/api/admin/rfx/${id}/`,
	rfxBids: (id: string) => `/api/admin/rfx/${id}/bids/`,
	bids: "/api/admin/bids/",
	purchaseOrders: "/api/admin/purchase-orders/",
	purchaseOrder: (id: string) => `/api/admin/purchase-orders/${id}/`,
	invoices: "/api/admin/invoices/",
	invoice: (id: string) => `/api/admin/invoices/${id}/`,
	approvals: "/api/admin/approvals/",
	approval: (id: string) => `/api/admin/approvals/${id}/`,
	scorecards: "/api/admin/scorecards/",
	activities: "/api/admin/activities/",
	notifications: "/api/admin/notifications/",
	notificationRead: (id: string) => `/api/admin/notifications/${id}/read/`,
	team: "/api/admin/vendor/team/",
	me: "/api/admin/vendor/me/",
} as const;

async function mockDelay<T>(value: T): Promise<T> {
	await new Promise((r) => setTimeout(r, 80));
	return value;
}

async function unwrapList<T>(
	res: T[] | { results?: T[] | null }
): Promise<T[]> {
	return Array.isArray(res) ? res : (res.results ?? []);
}

async function listVendorsFromVendorCore(): Promise<VendorModel[]> {
	if (!getStoredAccessToken()) return [];
	try {
		const page = await vendorCoreApi.listVendors();
		return (page.results ?? []).map(vendorDtoToModel);
	} catch (err) {
		if (
			err instanceof VendorCoreApiError &&
			(err.status === 401 || err.status === 403)
		) {
			return [];
		}
		throw err;
	}
}

async function getVendorFromVendorCore(id: string): Promise<VendorModel> {
	const dto = await vendorCoreApi.getVendor(id);
	return vendorDtoToModel(dto);
}

function mapTeamMember(row: VendorTeamMemberDto): VendorTeamMember {
	const role = row.role as VendorTeamMember["role"];
	const allowed: VendorTeamMember["role"][] = [
		"vendor_admin",
		"vendor_bidder",
		"vendor_finance",
		"vendor_viewer",
	];
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		role: allowed.includes(role) ? role : "vendor_viewer",
		isActive: row.is_active,
	};
}

function mapCategory(row: VendorCategoryDto): VendorCategoryModel {
	return {
		id: row.id,
		name: row.name,
		code: row.code,
		description: row.description ?? null,
		parentId: row.parent_id,
		vendorCount: 0,
	};
}

export const vmsApi = {
	async listVendors() {
		if (isMockEnabled()) return mockDelay(vmsStore.listVendors());
		if (isVendorCoreLive()) return listVendorsFromVendorCore();
		if (isNestApiEnabled()) {
			return apiClient<VendorModel[] | { results?: VendorModel[] }>(
				vmsPaths.vendors
			).then(unwrapList);
		}
		return [];
	},
	async getVendor(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getVendor(id));
		if (isVendorCoreLive()) return getVendorFromVendorCore(id);
		if (isNestApiEnabled()) {
			return apiClient<VendorModel>(vmsPaths.vendor(id));
		}
		throw new Error("Vendor API unavailable");
	},
	async createVendor(
		input: Parameters<typeof vmsStore.createVendor>[0] & {
			vendorCode?: string;
			standardPaymentTermsDays?: number;
			defaultCurrency?: string;
			riskScore?: number;
		}
	): Promise<VendorModel> {
		if (isMockEnabled()) return mockDelay(vmsStore.createVendor(input));
		if (isVendorCoreLive()) {
			const code =
				input.vendorCode?.trim() ||
				input.tags?.[0]?.trim() ||
				`VND-${Date.now().toString().slice(-8)}`;
			const dto = await vendorCoreApi.createVendor({
				vendor_code: code,
				legal_name: input.legalName,
				trade_name: input.tradeName ?? undefined,
				country: input.country || "US",
				city: input.city || "Unknown",
				status:
					input.status === "offboarded"
						? "terminated"
						: input.status === "invited" || input.status === "under_review"
							? "prospect"
							: input.status === "active" ||
								  input.status === "onboarding" ||
								  input.status === "prospect" ||
								  input.status === "suspended"
								? input.status
								: "active",
				description: input.description ?? undefined,
				website: input.website ?? undefined,
				tax_id: input.taxId ?? undefined,
				risk_level: input.riskLevel,
				risk_score: input.riskScore ?? undefined,
				tags: input.tags ?? [],
				standard_payment_terms_days:
					input.standardPaymentTermsDays ?? undefined,
				default_currency: input.defaultCurrency ?? undefined,
			});
			return vendorDtoToModel(dto);
		}
		if (isNestApiEnabled()) {
			return apiClient<VendorModel>(vmsPaths.vendors, {
				method: "POST",
				body: JSON.stringify(input),
			});
		}
		throw new Error("Vendor create unavailable");
	},
	async updateVendor(id: string, patch: Partial<VendorModel>) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateVendor(id, patch));
		if (isVendorCoreLive()) {
			const body: Record<string, unknown> = {};
			if (patch.legalName !== undefined) body.legal_name = patch.legalName;
			if (patch.tradeName !== undefined) body.trade_name = patch.tradeName;
			if (patch.country !== undefined) body.country = patch.country;
			if (patch.city !== undefined) body.city = patch.city;
			if (patch.status !== undefined) {
				body.status =
					patch.status === "offboarded"
						? "terminated"
						: patch.status === "invited" || patch.status === "under_review"
							? "prospect"
							: patch.status === "active" ||
								  patch.status === "onboarding" ||
								  patch.status === "prospect" ||
								  patch.status === "suspended"
								? patch.status
								: "prospect";
			}
			const dto = await vendorCoreApi.updateVendor(id, body);
			return vendorDtoToModel(dto);
		}
		if (isNestApiEnabled()) {
			return apiClient<VendorModel>(vmsPaths.vendor(id), {
				method: "PATCH",
				body: JSON.stringify(patch),
			});
		}
		throw new Error("Vendor update unavailable");
	},
	async deleteVendor(id: string) {
		if (isMockEnabled()) {
			await mockDelay(undefined);
			return;
		}
		if (isVendorCoreLive()) {
			await vendorCoreApi.deleteVendor(id);
			return;
		}
		throw new Error("Vendor delete unavailable");
	},
	async hardDeleteVendor(id: string) {
		if (isMockEnabled()) {
			await mockDelay(undefined);
			return;
		}
		if (isVendorCoreLive()) {
			await vendorCoreApi.hardDeleteVendor(id);
			return;
		}
		throw new Error("Vendor hard delete unavailable");
	},
	async restoreVendor(id: string) {
		if (isMockEnabled()) {
			return mockDelay(vmsStore.getVendor(id));
		}
		if (isVendorCoreLive()) {
			const dto = await vendorCoreApi.restoreVendor(id);
			return vendorDtoToModel(dto);
		}
		throw new Error("Vendor restore unavailable");
	},
	async inviteVendor(data: {
		legalName: string;
		email: string;
		categories: string[];
		note?: string;
	}): Promise<{
		vendor: VendorModel;
		invite: {
			token: string;
			expiresAt: string;
			acceptPath: string;
			emailDelivery: "link_only";
		};
	}> {
		const contactName = data.email.split("@")[0] ?? data.email;
		const contacts = [
			{
				id: `c-${Date.now()}`,
				name: contactName,
				email: data.email,
				phone: null,
				role: "Primary",
				isPrimary: true,
			},
		];

		let vendor: VendorModel;

		if (isMockEnabled()) {
			vendor = await mockDelay(
				vmsStore.createVendor({
					legalName: data.legalName,
					tradeName: null,
					status: "invited",
					categories: data.categories,
					tags: [],
					country: "",
					city: "",
					taxId: null,
					website: null,
					description: data.note?.trim() || null,
					riskLevel: "medium",
					contacts,
				})
			);
		} else if (isVendorCoreLive()) {
			const inviteDto = await vendorCoreApi.inviteVendor({
				legal_name: data.legalName,
				email: data.email,
				categories: data.categories,
			});
			if (!inviteDto.vendor_id) {
				throw new Error("Vendor invite did not return a vendor id.");
			}
			const dto = await vendorCoreApi.getVendor(inviteDto.vendor_id);
			vendor = vendorDtoToModel(dto);
			const persisted = saveVendorInviteFromServer({
				token: inviteDto.token,
				vendorId: inviteDto.vendor_id,
				legalName: inviteDto.legal_name,
				email: inviteDto.email,
				categories: inviteDto.categories,
				expiresAt: inviteDto.expires_at,
				note: data.note,
				createdAt: inviteDto.created_at,
			});
			return {
				vendor,
				invite: {
					token: persisted.token,
					expiresAt: persisted.expiresAt,
					acceptPath: buildAcceptPath(persisted.token),
					emailDelivery: "link_only",
				},
			};
		} else if (isNestApiEnabled()) {
			vendor = await apiClient<VendorModel>(vmsPaths.invite, {
				method: "POST",
				body: JSON.stringify(data),
			});
		} else {
			throw new Error("Vendor invite unavailable");
		}

		const invite = createVendorInvite({
			vendorId: vendor.id,
			legalName: vendor.legalName,
			email: data.email,
			categories: data.categories,
			note: data.note,
		});

		return {
			vendor,
			invite: {
				token: invite.token,
				expiresAt: invite.expiresAt,
				acceptPath: buildAcceptPath(invite.token),
				emailDelivery: "link_only",
			},
		};
	},
	async listCategories() {
		if (isMockEnabled()) return mockDelay(vmsStore.listCategories());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listVendorCategories();
			return (page.results ?? []).map(mapCategory);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.listCategories()),
			() =>
				apiClient<VendorCategoryModel[] | { results?: VendorCategoryModel[] }>(
					vmsPaths.categories
				).then(unwrapList)
		);
	},
	async listOnboarding() {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listOnboarding()),
			() =>
				apiClient<OnboardingCaseModel[] | { results?: OnboardingCaseModel[] }>(
					vmsPaths.onboarding
				).then(unwrapList)
		);
	},
	async getOnboarding(id: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.getOnboarding(id)),
			() => apiClient<OnboardingCaseModel>(vmsPaths.onboardingDetail(id))
		);
	},
	async updateOnboarding(id: string, patch: Partial<OnboardingCaseModel>) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.updateOnboarding(id, patch)),
			() =>
				apiClient<OnboardingCaseModel>(vmsPaths.onboardingDetail(id), {
					method: "PATCH",
					body: JSON.stringify(patch),
				})
		);
	},
	async listDocuments(vendorId?: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listDocuments(vendorId)),
			() =>
				apiClient<DocumentModel[] | { results?: DocumentModel[] }>(
					vmsPaths.documents,
					vendorId ? { params: { vendorId } } : undefined
				).then(unwrapList)
		);
	},
	async getDocument(id: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.getDocument(id)),
			() => apiClient<DocumentModel>(vmsPaths.document(id))
		);
	},
	async updateDocument(id: string, patch: Partial<DocumentModel>) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.updateDocument(id, patch)),
			() =>
				apiClient<DocumentModel>(vmsPaths.document(id), {
					method: "PATCH",
					body: JSON.stringify(patch),
				})
		);
	},
	async addDocument(doc: Parameters<typeof vmsStore.addDocument>[0]) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.addDocument(doc)),
			() =>
				apiClient<DocumentModel>(vmsPaths.documents, {
					method: "POST",
					body: JSON.stringify(doc),
				})
		);
	},
	async listCertificates() {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listCertificates()),
			() =>
				apiClient<CertificateModel[] | { results?: CertificateModel[] }>(
					vmsPaths.certificates
				).then(unwrapList)
		);
	},
	async listContracts(vendorId?: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listContracts(vendorId)),
			() =>
				apiClient<ContractModel[] | { results?: ContractModel[] }>(
					vmsPaths.contracts,
					vendorId ? { params: { vendorId } } : undefined
				).then(unwrapList)
		);
	},
	async getContract(id: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.getContract(id)),
			() => apiClient<ContractModel>(vmsPaths.contract(id))
		);
	},
	async createContract(input: Omit<ContractModel, "id" | "updatedAt">) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.createContract(input)),
			() =>
				apiClient<ContractModel>(vmsPaths.contracts, {
					method: "POST",
					body: JSON.stringify(input),
				})
		);
	},
	async updateContract(id: string, patch: Partial<ContractModel>) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.updateContract(id, patch)),
			() =>
				apiClient<ContractModel>(vmsPaths.contract(id), {
					method: "PATCH",
					body: JSON.stringify(patch),
				})
		);
	},
	async listRfx() {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listRfx()),
			() =>
				apiClient<RfxModel[] | { results?: RfxModel[] }>(vmsPaths.rfx).then(
					unwrapList
				)
		);
	},
	async getRfx(id: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.getRfx(id)),
			() => apiClient<RfxModel>(vmsPaths.rfxDetail(id))
		);
	},
	async createRfx(input: Omit<RfxModel, "id" | "updatedAt" | "bidCount">) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.createRfx(input)),
			() =>
				apiClient<RfxModel>(vmsPaths.rfx, {
					method: "POST",
					body: JSON.stringify(input),
				})
		);
	},
	async updateRfx(id: string, patch: Partial<RfxModel>) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.updateRfx(id, patch)),
			() =>
				apiClient<RfxModel>(vmsPaths.rfxDetail(id), {
					method: "PATCH",
					body: JSON.stringify(patch),
				})
		);
	},
	async listBids(rfxId?: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listBids(rfxId)),
			() =>
				rfxId
					? apiClient<BidModel[] | { results?: BidModel[] }>(
							vmsPaths.rfxBids(rfxId)
						).then(unwrapList)
					: apiClient<BidModel[] | { results?: BidModel[] }>(
							vmsPaths.bids
						).then(unwrapList)
		);
	},
	async submitBid(input: Omit<BidModel, "id" | "submittedAt" | "status">) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.submitBid(input)),
			() =>
				apiClient<BidModel>(vmsPaths.rfxBids(input.rfxId), {
					method: "POST",
					body: JSON.stringify(input),
				})
		);
	},
	async listPurchaseOrders(vendorId?: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listPurchaseOrders(vendorId)),
			() =>
				apiClient<PurchaseOrderModel[] | { results?: PurchaseOrderModel[] }>(
					vmsPaths.purchaseOrders,
					{
						params: vendorId ? { vendorId } : undefined,
					}
				).then(unwrapList)
		);
	},
	async getPurchaseOrder(id: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.getPurchaseOrder(id)),
			() => apiClient<PurchaseOrderModel>(vmsPaths.purchaseOrder(id))
		);
	},
	async createPurchaseOrder(
		input: Omit<PurchaseOrderModel, "id" | "updatedAt" | "acknowledgedAt">
	) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.createPurchaseOrder(input)),
			() =>
				apiClient<PurchaseOrderModel>(vmsPaths.purchaseOrders, {
					method: "POST",
					body: JSON.stringify(input),
				})
		);
	},
	async updatePurchaseOrder(id: string, patch: Partial<PurchaseOrderModel>) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.updatePurchaseOrder(id, patch)),
			() =>
				apiClient<PurchaseOrderModel>(vmsPaths.purchaseOrder(id), {
					method: "PATCH",
					body: JSON.stringify(patch),
				})
		);
	},
	async listInvoices(vendorId?: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listInvoices(vendorId)),
			() =>
				apiClient<InvoiceModel[] | { results?: InvoiceModel[] }>(
					vmsPaths.invoices,
					vendorId ? { params: { vendorId } } : undefined
				).then(unwrapList)
		);
	},
	async getInvoice(id: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.getInvoice(id)),
			() => apiClient<InvoiceModel>(vmsPaths.invoice(id))
		);
	},
	async createInvoice(input: Omit<InvoiceModel, "id" | "updatedAt">) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.createInvoice(input)),
			() =>
				apiClient<InvoiceModel>(vmsPaths.invoices, {
					method: "POST",
					body: JSON.stringify(input),
				})
		);
	},
	async updateInvoice(id: string, patch: Partial<InvoiceModel>) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.updateInvoice(id, patch)),
			() =>
				apiClient<InvoiceModel>(vmsPaths.invoice(id), {
					method: "PATCH",
					body: JSON.stringify(patch),
				})
		);
	},
	async listApprovals() {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listApprovals()),
			() =>
				apiClient<
					ApprovalRequestModel[] | { results?: ApprovalRequestModel[] }
				>(vmsPaths.approvals).then(unwrapList)
		);
	},
	async updateApproval(
		id: string,
		status: "approved" | "rejected" | "changes_requested" | "pending"
	) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.updateApproval(id, status)),
			() =>
				apiClient<ApprovalRequestModel>(vmsPaths.approval(id), {
					method: "PATCH",
					body: JSON.stringify({ status }),
				})
		);
	},
	async listScorecards() {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listScorecards()),
			() =>
				apiClient<ScorecardModel[] | { results?: ScorecardModel[] }>(
					vmsPaths.scorecards
				).then(unwrapList)
		);
	},
	async listActivities(vendorId?: string) {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listActivities(vendorId)),
			() =>
				apiClient<ActivityEventModel[] | { results?: ActivityEventModel[] }>(
					vmsPaths.activities,
					{
						params: vendorId ? { vendorId } : undefined,
					}
				).then(unwrapList)
		);
	},
	async listNotifications() {
		return withMockOrRemote(
			() => mockDelay(vmsStore.listNotifications()),
			() =>
				apiClient<NotificationModel[] | { results?: NotificationModel[] }>(
					vmsPaths.notifications
				).then(unwrapList)
		);
	},
	async markNotificationRead(id: string) {
		return withMockOrRemote(
			() => {
				vmsStore.markNotificationRead(id);
				return mockDelay(true);
			},
			() =>
				apiClient<boolean>(vmsPaths.notificationRead(id), {
					method: "POST",
				})
		);
	},
	async listTeam() {
		if (isMockEnabled()) return mockDelay(vmsStore.listTeam());
		if (isVendorCoreLive()) {
			const rows = await vendorCoreApi.listVendorTeam();
			return rows.map(mapTeamMember);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.listTeam()),
			() =>
				apiClient<VendorTeamMember[] | { results?: VendorTeamMember[] }>(
					vmsPaths.team
				).then(unwrapList)
		);
	},
	async getCurrentVendor() {
		if (isMockEnabled()) return mockDelay(vmsStore.getVendor(CURRENT_VENDOR_ID));
		if (isVendorCoreLive()) {
			const dto = await vendorCoreApi.getVendorMe();
			return vendorDtoToModel(dto);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.getVendor(CURRENT_VENDOR_ID)),
			() => apiClient<VendorModel>(vmsPaths.me)
		);
	},
	currentVendorId: CURRENT_VENDOR_ID,
	/** Whether this client is serving mock fixtures. */
	get isMock() {
		return isMockEnabled();
	},
};

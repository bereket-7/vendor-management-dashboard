import { apiClient } from "@/lib/api/client";
import { buildAcceptPath, createVendorInvite } from "@/lib/auth/vendor-invites";
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

import { vendorDtoToModel } from "./map-vendor-core";
import {
	mapDjangoApproval,
	mapDjangoBid,
	mapDjangoCategory,
	mapDjangoCertificate,
	mapDjangoContract,
	mapDjangoDocument,
	mapDjangoInvoice,
	mapDjangoNotification,
	mapDjangoOnboarding,
	mapDjangoPurchaseOrder,
	mapDjangoRfx,
	mapDjangoScorecard,
	mapDjangoTeamMember,
} from "./mappers";
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

/** Result of inviteVendor — vendor record plus shareable invite link fields. */
export type VendorInviteResult = {
	vendor: VendorModel;
	invite: {
		token: string;
		expiresAt: string;
		acceptPath: string;
	};
};

function inviteDtoToVendorModel(dto: {
	id: string;
	legal_name: string;
	email: string;
	categories: string[];
	vendor_id: string | null;
	created_at: string;
	expires_at: string;
}): VendorModel {
	const now = dto.created_at || new Date().toISOString();
	return {
		id: dto.vendor_id ?? dto.id,
		legalName: dto.legal_name,
		tradeName: null,
		status: "invited",
		categories: dto.categories ?? [],
		tags: [],
		country: "",
		city: "",
		taxId: null,
		website: null,
		description: null,
		contacts: [
			{
				id: `c-${dto.id}`,
				name: dto.email.split("@")[0] ?? dto.email,
				email: dto.email,
				phone: null,
				role: "Primary",
				isPrimary: true,
			},
		],
		riskLevel: "medium",
		riskScore: 0,
		onboardingProgress: 0,
		createdAt: now,
		updatedAt: now,
	};
}

function toInviteResult(
	vendor: VendorModel,
	invite: { token: string; expiresAt: string; acceptPath?: string }
): VendorInviteResult {
	return {
		vendor,
		invite: {
			token: invite.token,
			expiresAt: invite.expiresAt,
			acceptPath: invite.acceptPath ?? buildAcceptPath(invite.token),
		},
	};
}

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
		input: Parameters<typeof vmsStore.createVendor>[0]
	): Promise<VendorModel> {
		if (isMockEnabled()) return mockDelay(vmsStore.createVendor(input));
		if (isVendorCoreLive()) {
			const code =
				input.tags?.[0]?.trim() || `VND-${Date.now().toString().slice(-8)}`;
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
				metadata: {
					...(input.categories?.length
						? { vendor_type: input.categories[0] }
						: {}),
					...(input.description ? { description: input.description } : {}),
				},
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
	}): Promise<VendorInviteResult> {
		if (isMockEnabled()) {
			const vendor = await mockDelay(
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
					description: null,
					riskLevel: "medium",
					contacts: [
						{
							id: `c-${Date.now()}`,
							name: data.email.split("@")[0] ?? data.email,
							email: data.email,
							phone: null,
							role: "Primary",
							isPrimary: true,
						},
					],
				})
			);
			const invite = createVendorInvite({
				vendorId: vendor.id,
				legalName: data.legalName,
				email: data.email,
				categories: data.categories,
				note: data.note,
			});
			return toInviteResult(vendor, {
				token: invite.token,
				expiresAt: invite.expiresAt,
				acceptPath: buildAcceptPath(invite.token),
			});
		}
		if (isVendorCoreLive()) {
			const dto = await vendorCoreApi.inviteVendor({
				legal_name: data.legalName,
				email: data.email,
				categories: data.categories,
			});
			return toInviteResult(inviteDtoToVendorModel(dto), {
				token: dto.token,
				expiresAt: dto.expires_at,
				acceptPath: buildAcceptPath(dto.token),
			});
		}
		if (isNestApiEnabled()) {
			const vendor = await apiClient<VendorModel>(vmsPaths.invite, {
				method: "POST",
				body: JSON.stringify(data),
			});
			const invite = createVendorInvite({
				vendorId: vendor.id,
				legalName: data.legalName,
				email: data.email,
				categories: data.categories,
				note: data.note,
			});
			return toInviteResult(vendor, {
				token: invite.token,
				expiresAt: invite.expiresAt,
				acceptPath: buildAcceptPath(invite.token),
			});
		}
		throw new Error("Vendor invite unavailable");
	},
	async listCategories() {
		if (isMockEnabled()) return mockDelay(vmsStore.listCategories());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listCategories();
			return (page.results ?? []).map((row) =>
				mapDjangoCategory(row as Parameters<typeof mapDjangoCategory>[0])
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<
				VendorCategoryModel[] | { results?: VendorCategoryModel[] }
			>(vmsPaths.categories).then(unwrapList);
		}
		return [];
	},
	async listOnboarding() {
		if (isMockEnabled()) return mockDelay(vmsStore.listOnboarding());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listOnboarding();
			return (page.results ?? []).map(mapDjangoOnboarding);
		}
		if (isNestApiEnabled()) {
			return apiClient<
				OnboardingCaseModel[] | { results?: OnboardingCaseModel[] }
			>(vmsPaths.onboarding).then(unwrapList);
		}
		return [];
	},
	async getOnboarding(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getOnboarding(id));
		if (isVendorCoreLive()) {
			return mapDjangoOnboarding(await vendorCoreApi.getOnboardingCase(id));
		}
		if (isNestApiEnabled()) {
			return apiClient<OnboardingCaseModel>(vmsPaths.onboardingDetail(id));
		}
		throw new Error("Onboarding API unavailable");
	},
	async updateOnboarding(id: string, patch: Partial<OnboardingCaseModel>) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateOnboarding(id, patch));
		if (isVendorCoreLive()) {
			const body: Record<string, unknown> = {};
			if (patch.status !== undefined) body.status = patch.status;
			if (patch.progress !== undefined) body.progress_percent = patch.progress;
			if (patch.reviewerNote !== undefined)
				body.rejection_reason = patch.reviewerNote;
			return mapDjangoOnboarding(
				await vendorCoreApi.updateOnboardingCase(id, body)
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<OnboardingCaseModel>(vmsPaths.onboardingDetail(id), {
				method: "PATCH",
				body: JSON.stringify(patch),
			});
		}
		throw new Error("Onboarding update unavailable");
	},
	async listDocuments(vendorId?: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.listDocuments(vendorId));
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listDocuments(
				vendorId ? { vendor_id: vendorId } : undefined
			);
			return (page.results ?? []).map(mapDjangoDocument);
		}
		if (isNestApiEnabled()) {
			return apiClient<DocumentModel[] | { results?: DocumentModel[] }>(
				vmsPaths.documents,
				vendorId ? { params: { vendorId } } : undefined
			).then(unwrapList);
		}
		return [];
	},
	async getDocument(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getDocument(id));
		if (isVendorCoreLive()) {
			return mapDjangoDocument(await vendorCoreApi.getDocument(id));
		}
		if (isNestApiEnabled()) {
			return apiClient<DocumentModel>(vmsPaths.document(id));
		}
		throw new Error("Document API unavailable");
	},
	async updateDocument(id: string, patch: Partial<DocumentModel>) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateDocument(id, patch));
		if (isVendorCoreLive()) {
			const body: Record<string, unknown> = {};
			if (patch.name !== undefined) body.title = patch.name;
			if (patch.status !== undefined) body.status = patch.status;
			if (patch.type !== undefined) body.document_type = patch.type;
			if (patch.expiresAt !== undefined) body.expires_at = patch.expiresAt;
			return mapDjangoDocument(await vendorCoreApi.updateDocument(id, body));
		}
		if (isNestApiEnabled()) {
			return apiClient<DocumentModel>(vmsPaths.document(id), {
				method: "PATCH",
				body: JSON.stringify(patch),
			});
		}
		throw new Error("Document update unavailable");
	},
	async addDocument(doc: Parameters<typeof vmsStore.addDocument>[0]) {
		if (isMockEnabled()) return mockDelay(vmsStore.addDocument(doc));
		if (isVendorCoreLive()) {
			const sizeBytes = (doc.fileSizeKb ?? 0) * 1024;
			return mapDjangoDocument(
				await vendorCoreApi.createDocument({
					vendor_id: doc.vendorId,
					document_type: doc.type,
					title: doc.name,
					storage_key: `vms/${doc.vendorId}/${encodeURIComponent(doc.name)}`,
					checksum_sha256:
						doc.checksum && /^[a-f0-9]{64}$/i.test(doc.checksum)
							? doc.checksum
							: "0".repeat(64),
					mime_type: "application/octet-stream",
					size_bytes: sizeBytes,
					status: doc.status,
					expires_at: doc.expiresAt,
				})
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<DocumentModel>(vmsPaths.documents, {
				method: "POST",
				body: JSON.stringify(doc),
			});
		}
		throw new Error("Document create unavailable");
	},
	async listCertificates() {
		if (isMockEnabled()) return mockDelay(vmsStore.listCertificates());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listCertificates();
			return (page.results ?? []).map(mapDjangoCertificate);
		}
		if (isNestApiEnabled()) {
			return apiClient<CertificateModel[] | { results?: CertificateModel[] }>(
				vmsPaths.certificates
			).then(unwrapList);
		}
		return [];
	},
	async listContracts(vendorId?: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.listContracts(vendorId));
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listContracts(
				vendorId ? { vendor_id: vendorId } : undefined
			);
			return (page.results ?? []).map(mapDjangoContract);
		}
		if (isNestApiEnabled()) {
			return apiClient<ContractModel[] | { results?: ContractModel[] }>(
				vmsPaths.contracts,
				vendorId ? { params: { vendorId } } : undefined
			).then(unwrapList);
		}
		return [];
	},
	async getContract(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getContract(id));
		if (isVendorCoreLive()) {
			return mapDjangoContract(await vendorCoreApi.getContract(id));
		}
		if (isNestApiEnabled()) {
			return apiClient<ContractModel>(vmsPaths.contract(id));
		}
		throw new Error("Contract API unavailable");
	},
	async createContract(input: Omit<ContractModel, "id" | "updatedAt">) {
		if (isMockEnabled()) return mockDelay(vmsStore.createContract(input));
		if (isVendorCoreLive()) {
			return mapDjangoContract(
				await vendorCoreApi.createContract({
					vendor_id: input.vendorId,
					contract_number: input.number,
					title: input.title,
					contract_type: input.contractType ?? "msa",
					status: input.status,
					effective_date: input.startDate,
					expiration_date: input.endDate,
					total_contract_value: input.value,
					currency: input.currency,
				})
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<ContractModel>(vmsPaths.contracts, {
				method: "POST",
				body: JSON.stringify(input),
			});
		}
		throw new Error("Contract create unavailable");
	},
	async updateContract(id: string, patch: Partial<ContractModel>) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateContract(id, patch));
		if (isVendorCoreLive()) {
			const body: Record<string, unknown> = {};
			if (patch.title !== undefined) body.title = patch.title;
			if (patch.status !== undefined) body.status = patch.status;
			if (patch.number !== undefined) body.contract_number = patch.number;
			if (patch.value !== undefined) body.total_contract_value = patch.value;
			if (patch.currency !== undefined) body.currency = patch.currency;
			if (patch.startDate !== undefined) body.effective_date = patch.startDate;
			if (patch.endDate !== undefined) body.expiration_date = patch.endDate;
			return mapDjangoContract(await vendorCoreApi.updateContract(id, body));
		}
		if (isNestApiEnabled()) {
			return apiClient<ContractModel>(vmsPaths.contract(id), {
				method: "PATCH",
				body: JSON.stringify(patch),
			});
		}
		throw new Error("Contract update unavailable");
	},
	async listRfx() {
		if (isMockEnabled()) return mockDelay(vmsStore.listRfx());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listRfx();
			return (page.results ?? []).map(mapDjangoRfx);
		}
		if (isNestApiEnabled()) {
			return apiClient<RfxModel[] | { results?: RfxModel[] }>(
				vmsPaths.rfx
			).then(unwrapList);
		}
		return [];
	},
	async getRfx(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getRfx(id));
		if (isVendorCoreLive()) {
			return mapDjangoRfx(await vendorCoreApi.getRfx(id));
		}
		if (isNestApiEnabled()) {
			return apiClient<RfxModel>(vmsPaths.rfxDetail(id));
		}
		throw new Error("RFX API unavailable");
	},
	async createRfx(input: Omit<RfxModel, "id" | "updatedAt" | "bidCount">) {
		if (isMockEnabled()) return mockDelay(vmsStore.createRfx(input));
		if (isVendorCoreLive()) {
			return mapDjangoRfx(
				await vendorCoreApi.createRfx({
					reference_number: input.number,
					title: input.title,
					rfx_type: input.type.toLowerCase(),
					status: input.status,
					description: input.description,
					bid_submission_deadline: input.closesAt,
				})
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<RfxModel>(vmsPaths.rfx, {
				method: "POST",
				body: JSON.stringify(input),
			});
		}
		throw new Error("RFX create unavailable");
	},
	async updateRfx(id: string, patch: Partial<RfxModel>) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateRfx(id, patch));
		if (isVendorCoreLive()) {
			const body: Record<string, unknown> = {};
			if (patch.title !== undefined) body.title = patch.title;
			if (patch.status !== undefined) body.status = patch.status;
			if (patch.description !== undefined) body.description = patch.description;
			if (patch.closesAt !== undefined)
				body.bid_submission_deadline = patch.closesAt;
			if (patch.number !== undefined) body.reference_number = patch.number;
			if (patch.type !== undefined) body.rfx_type = patch.type.toLowerCase();
			return mapDjangoRfx(await vendorCoreApi.updateRfx(id, body));
		}
		if (isNestApiEnabled()) {
			return apiClient<RfxModel>(vmsPaths.rfxDetail(id), {
				method: "PATCH",
				body: JSON.stringify(patch),
			});
		}
		throw new Error("RFX update unavailable");
	},
	async listBids(rfxId?: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.listBids(rfxId));
		if (isVendorCoreLive()) {
			if (!rfxId) return [];
			const page = await vendorCoreApi.listRfxBids(rfxId);
			return (page.results ?? []).map((row) => mapDjangoBid(row, rfxId));
		}
		if (isNestApiEnabled()) {
			return rfxId
				? apiClient<BidModel[] | { results?: BidModel[] }>(
						vmsPaths.rfxBids(rfxId)
					).then(unwrapList)
				: apiClient<BidModel[] | { results?: BidModel[] }>(vmsPaths.bids).then(
						unwrapList
					);
		}
		return [];
	},
	async submitBid(input: Omit<BidModel, "id" | "submittedAt" | "status">) {
		if (isMockEnabled()) return mockDelay(vmsStore.submitBid(input));
		if (isVendorCoreLive()) {
			return mapDjangoBid(
				await vendorCoreApi.createRfxBid(input.rfxId, {
					vendor: input.vendorId,
					amount: input.amount,
					currency: input.currency,
					notes: input.notes,
				}),
				input.rfxId
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<BidModel>(vmsPaths.rfxBids(input.rfxId), {
				method: "POST",
				body: JSON.stringify(input),
			});
		}
		throw new Error("Bid submit unavailable");
	},
	async listPurchaseOrders(vendorId?: string) {
		if (isMockEnabled())
			return mockDelay(vmsStore.listPurchaseOrders(vendorId));
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listPurchaseOrders(
				vendorId ? { vendor_id: vendorId } : undefined
			);
			return (page.results ?? []).map(mapDjangoPurchaseOrder);
		}
		if (isNestApiEnabled()) {
			return apiClient<
				PurchaseOrderModel[] | { results?: PurchaseOrderModel[] }
			>(vmsPaths.purchaseOrders, {
				params: vendorId ? { vendorId } : undefined,
			}).then(unwrapList);
		}
		return [];
	},
	async getPurchaseOrder(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getPurchaseOrder(id));
		if (isVendorCoreLive()) {
			return mapDjangoPurchaseOrder(await vendorCoreApi.getPurchaseOrder(id));
		}
		if (isNestApiEnabled()) {
			return apiClient<PurchaseOrderModel>(vmsPaths.purchaseOrder(id));
		}
		throw new Error("Purchase order API unavailable");
	},
	async createPurchaseOrder(
		input: Omit<PurchaseOrderModel, "id" | "updatedAt" | "acknowledgedAt">
	) {
		if (isMockEnabled()) return mockDelay(vmsStore.createPurchaseOrder(input));
		if (isVendorCoreLive()) {
			return mapDjangoPurchaseOrder(
				await vendorCoreApi.createPurchaseOrder({
					vendor: input.vendorId,
					po_number: input.number,
					status: input.status,
					currency: input.currency,
					total_amount: input.total,
					contract: input.contractId,
					rfx: input.rfxId,
				})
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<PurchaseOrderModel>(vmsPaths.purchaseOrders, {
				method: "POST",
				body: JSON.stringify(input),
			});
		}
		throw new Error("Purchase order create unavailable");
	},
	async updatePurchaseOrder(id: string, patch: Partial<PurchaseOrderModel>) {
		if (isMockEnabled())
			return mockDelay(vmsStore.updatePurchaseOrder(id, patch));
		if (isVendorCoreLive()) {
			const body: Record<string, unknown> = {};
			if (patch.status !== undefined) body.status = patch.status;
			if (patch.total !== undefined) body.total_amount = patch.total;
			if (patch.currency !== undefined) body.currency = patch.currency;
			if (patch.number !== undefined) body.po_number = patch.number;
			return mapDjangoPurchaseOrder(
				await vendorCoreApi.updatePurchaseOrder(id, body)
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<PurchaseOrderModel>(vmsPaths.purchaseOrder(id), {
				method: "PATCH",
				body: JSON.stringify(patch),
			});
		}
		throw new Error("Purchase order update unavailable");
	},
	async listInvoices(vendorId?: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.listInvoices(vendorId));
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listInvoices(
				vendorId ? { vendor_id: vendorId } : undefined
			);
			return (page.results ?? []).map(mapDjangoInvoice);
		}
		if (isNestApiEnabled()) {
			return apiClient<InvoiceModel[] | { results?: InvoiceModel[] }>(
				vmsPaths.invoices,
				vendorId ? { params: { vendorId } } : undefined
			).then(unwrapList);
		}
		return [];
	},
	async getInvoice(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getInvoice(id));
		if (isVendorCoreLive()) {
			return mapDjangoInvoice(await vendorCoreApi.getInvoice(id));
		}
		if (isNestApiEnabled()) {
			return apiClient<InvoiceModel>(vmsPaths.invoice(id));
		}
		throw new Error("Invoice API unavailable");
	},
	async createInvoice(input: Omit<InvoiceModel, "id" | "updatedAt">) {
		if (isMockEnabled()) return mockDelay(vmsStore.createInvoice(input));
		if (isVendorCoreLive()) {
			return mapDjangoInvoice(
				await vendorCoreApi.createInvoice({
					vendor: input.vendorId,
					invoice_number: input.number,
					status: input.status,
					amount: input.amount,
					currency: input.currency,
					purchase_order: input.poId,
					due_date: input.dueDate,
				})
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<InvoiceModel>(vmsPaths.invoices, {
				method: "POST",
				body: JSON.stringify(input),
			});
		}
		throw new Error("Invoice create unavailable");
	},
	async updateInvoice(id: string, patch: Partial<InvoiceModel>) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateInvoice(id, patch));
		if (isVendorCoreLive()) {
			const body: Record<string, unknown> = {};
			if (patch.status !== undefined) body.status = patch.status;
			if (patch.amount !== undefined) body.amount = patch.amount;
			if (patch.currency !== undefined) body.currency = patch.currency;
			if (patch.number !== undefined) body.invoice_number = patch.number;
			if (patch.dueDate !== undefined) body.due_date = patch.dueDate;
			return mapDjangoInvoice(await vendorCoreApi.updateInvoice(id, body));
		}
		if (isNestApiEnabled()) {
			return apiClient<InvoiceModel>(vmsPaths.invoice(id), {
				method: "PATCH",
				body: JSON.stringify(patch),
			});
		}
		throw new Error("Invoice update unavailable");
	},
	async listApprovals() {
		if (isMockEnabled()) return mockDelay(vmsStore.listApprovals());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listApprovals();
			return (page.results ?? []).map(mapDjangoApproval);
		}
		if (isNestApiEnabled()) {
			return apiClient<
				ApprovalRequestModel[] | { results?: ApprovalRequestModel[] }
			>(vmsPaths.approvals).then(unwrapList);
		}
		return [];
	},
	async updateApproval(
		id: string,
		status: "approved" | "rejected" | "changes_requested" | "pending"
	) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateApproval(id, status));
		if (isVendorCoreLive()) {
			return mapDjangoApproval(
				await vendorCoreApi.updateApproval(id, { status })
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<ApprovalRequestModel>(vmsPaths.approval(id), {
				method: "PATCH",
				body: JSON.stringify({ status }),
			});
		}
		throw new Error("Approval update unavailable");
	},
	async listScorecards() {
		if (isMockEnabled()) return mockDelay(vmsStore.listScorecards());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listScorecards();
			return (page.results ?? []).map(mapDjangoScorecard);
		}
		if (isNestApiEnabled()) {
			return apiClient<ScorecardModel[] | { results?: ScorecardModel[] }>(
				vmsPaths.scorecards
			).then(unwrapList);
		}
		return [];
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
		if (isMockEnabled()) return mockDelay(vmsStore.listNotifications());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listNotifications();
			return (page.results ?? []).map(mapDjangoNotification);
		}
		if (isNestApiEnabled()) {
			return apiClient<NotificationModel[] | { results?: NotificationModel[] }>(
				vmsPaths.notifications
			).then(unwrapList);
		}
		return [];
	},
	async markNotificationRead(id: string) {
		if (isMockEnabled()) {
			vmsStore.markNotificationRead(id);
			return mockDelay(true);
		}
		if (isVendorCoreLive()) {
			await vendorCoreApi.markNotificationRead(id);
			return true;
		}
		if (isNestApiEnabled()) {
			return apiClient<boolean>(vmsPaths.notificationRead(id), {
				method: "POST",
			});
		}
		return false;
	},
	async listTeam() {
		if (isMockEnabled()) return mockDelay(vmsStore.listTeam());
		if (isVendorCoreLive()) {
			const rows = await vendorCoreApi.listVendorTeam();
			return rows.map((row) =>
				mapDjangoTeamMember(row as unknown as Record<string, unknown>)
			);
		}
		if (isNestApiEnabled()) {
			return apiClient<VendorTeamMember[] | { results?: VendorTeamMember[] }>(
				vmsPaths.team
			).then(unwrapList);
		}
		return [];
	},
	async getCurrentVendor() {
		if (isMockEnabled())
			return mockDelay(vmsStore.getVendor(CURRENT_VENDOR_ID));
		if (isVendorCoreLive()) {
			const raw = await vendorCoreApi.getVendorMe();
			const legalName = String(raw.legal_name ?? raw.name ?? "");
			const code = String(raw.vendor_code ?? "");
			return vendorDtoToModel({
				id: String(raw.id ?? ""),
				vendor_code: code,
				legal_name: legalName,
				trade_name: raw.trade_name != null ? String(raw.trade_name) : null,
				status: String(raw.status ?? "prospect"),
				country: raw.country != null ? String(raw.country) : undefined,
				city: raw.city != null ? String(raw.city) : undefined,
				metadata:
					raw.metadata && typeof raw.metadata === "object"
						? (raw.metadata as Record<string, unknown>)
						: {},
				code,
				name: legalName,
			});
		}
		if (isNestApiEnabled()) {
			return apiClient<VendorModel>(vmsPaths.me);
		}
		throw new Error("Current vendor API unavailable");
	},
	currentVendorId: CURRENT_VENDOR_ID,
	/** Whether this client is serving mock fixtures. */
	get isMock() {
		return isMockEnabled();
	},
	async awardRfx(id: string, bidId: string) {
		if (!isVendorCoreLive()) {
			throw new Error("Awarding an RFX requires the live API.");
		}
		return mapDjangoRfx(
			(await vendorCoreApi.awardRfx(id, { bid_id: bidId })) as Record<
				string,
				unknown
			>
		);
	},

	async seedCertificates() {
		if (!isVendorCoreLive()) {
			throw new Error("Certificate seed requires the live API.");
		}
		const types = [
			"iso_9001",
			"iso_27001",
			"soc_2_type_ii",
			"hipaa_attestation",
			"hitrust",
			"pci_dss",
			"business_license",
			"w9_on_file",
		] as const;
		const bodies = [
			"ISO",
			"AICPA",
			"HITRUST Alliance",
			"PCI SSC",
			"State licensing board",
			"Internal attestation",
		];
		const apiStatuses = [
			"valid",
			"expiring_soon",
			"expired",
			"pending_verification",
			"valid",
		] as const;
		const expiryOffsets = [180, 18, -40, 365, 12];

		const isoDate = (offsetDays: number) => {
			const d = new Date();
			d.setDate(d.getDate() + offsetDays);
			return d.toISOString().slice(0, 10);
		};

		const vendors = (await vendorCoreApi.listVendors()).results ?? [];
		const existing = await vendorCoreApi.listCertificates({ limit: 100 });
		const haveVendor = new Set(
			(existing.results ?? []).map((row) => String(row.vendor_id ?? ""))
		);
		let offset = 100;
		const total = existing.count ?? haveVendor.size;
		while (haveVendor.size < total) {
			const page = await vendorCoreApi.listCertificates({
				limit: 100,
				offset,
			});
			for (const row of page.results ?? []) {
				haveVendor.add(String(row.vendor_id ?? ""));
			}
			if (!(page.results ?? []).length) break;
			offset += 100;
		}

		let created = 0;
		let index = 0;
		for (const vendor of vendors) {
			if (haveVendor.has(vendor.id)) {
				index += 1;
				continue;
			}
			const slot = index % types.length;
			try {
				await vendorCoreApi.createCertificate({
					vendor_id: vendor.id,
					certification_type: types[slot],
					certifying_body: bodies[slot % bodies.length],
					certificate_number: `CERT-${String(index + 1).padStart(4, "0")}`,
					issued_at: isoDate(-400),
					expires_at: isoDate(
						expiryOffsets[slot % expiryOffsets.length] ?? 180
					),
					status: apiStatuses[slot % apiStatuses.length],
				});
				created += 1;
			} catch (createErr) {
				if (
					createErr instanceof VendorCoreApiError &&
					(createErr.status === 400 || createErr.status === 409)
				) {
					index += 1;
					continue;
				}
				throw createErr;
			}
			index += 1;
		}
		return { created, vendor_count: vendors.length };
	},

	async seedInvoices() {
		if (!isVendorCoreLive()) {
			throw new Error("Invoice seed requires the live API.");
		}
		const isoDate = (offsetDays: number) => {
			const d = new Date();
			d.setDate(d.getDate() + offsetDays);
			return d.toISOString().slice(0, 10);
		};
		const statuses = [
			"received",
			"pending_match",
			"exception",
			"matched",
		] as const;
		const vendors = (await vendorCoreApi.listVendors()).results ?? [];
		const pos =
			(await vendorCoreApi.listPurchaseOrders({ limit: 100 })).results ?? [];
		const existing = await vendorCoreApi.listInvoices({ limit: 100 });
		const havePo = new Set(
			(existing.results ?? [])
				.map((row) => String(row.purchase_order_id ?? ""))
				.filter(Boolean)
		);
		const haveVendor = new Set(
			(existing.results ?? []).map((row) => String(row.vendor_id ?? ""))
		);

		let created = 0;
		let index = 0;
		for (const po of pos) {
			const poId = String(po.id ?? "");
			if (!poId || havePo.has(poId)) {
				index += 1;
				continue;
			}
			const amount = Number(po.total_amount ?? 0) || 1000;
			try {
				await vendorCoreApi.createInvoice({
					invoice_number: `INV-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`,
					vendor_id: po.vendor_id,
					purchase_order_id: poId,
					status: statuses[index % statuses.length],
					invoice_date: isoDate(-14),
					due_date: isoDate(16),
					subtotal_amount: amount,
					tax_amount: 0,
					total_amount: amount,
					currency: po.currency || "USD",
				});
				created += 1;
				haveVendor.add(String(po.vendor_id ?? ""));
			} catch (createErr) {
				if (
					createErr instanceof VendorCoreApiError &&
					(createErr.status === 400 || createErr.status === 409)
				) {
					index += 1;
					continue;
				}
				throw createErr;
			}
			index += 1;
		}
		for (const vendor of vendors) {
			if (haveVendor.has(vendor.id)) continue;
			try {
				await vendorCoreApi.createInvoice({
					invoice_number: `INV-${new Date().getFullYear()}-V${String(index + 1).padStart(3, "0")}`,
					vendor_id: vendor.id,
					status: statuses[index % statuses.length],
					invoice_date: isoDate(-7),
					due_date: isoDate(23),
					subtotal_amount: 2500,
					tax_amount: 0,
					total_amount: 2500,
					currency: "USD",
				});
				created += 1;
			} catch (createErr) {
				if (
					createErr instanceof VendorCoreApiError &&
					(createErr.status === 400 || createErr.status === 409)
				) {
					continue;
				}
				throw createErr;
			}
			index += 1;
		}
		return { created, vendor_count: vendors.length };
	},

	async seedOnboarding(_force = false) {
		if (!isVendorCoreLive()) {
			throw new Error("Onboarding seed requires the live API.");
		}
		// Use only deployed routes (create + list). Do not depend on /onboarding/seed/.
		const vendors = (await vendorCoreApi.listVendors()).results ?? [];
		const existing = await vendorCoreApi.listOnboardingCases({ limit: 100 });
		const haveVendor = new Set(
			(existing.results ?? []).map((row) => String(row.vendor_id ?? ""))
		);
		// Paginate existing if more than one page
		let offset = 100;
		const total = existing.count ?? haveVendor.size;
		while (haveVendor.size < total) {
			const page = await vendorCoreApi.listOnboardingCases({
				limit: 100,
				offset,
			});
			for (const row of page.results ?? []) {
				haveVendor.add(String(row.vendor_id ?? ""));
			}
			if (!(page.results ?? []).length) break;
			offset += 100;
		}

		let created = 0;
		for (const vendor of vendors) {
			if (haveVendor.has(vendor.id)) continue;
			try {
				await vendorCoreApi.createOnboardingCase({ vendor_id: vendor.id });
				created += 1;
			} catch (createErr) {
				if (
					createErr instanceof VendorCoreApiError &&
					(createErr.status === 400 || createErr.status === 409)
				) {
					continue;
				}
				throw createErr;
			}
		}
		return {
			created,
			files_written: 0,
			vendor_count: vendors.length,
		};
	},

	async updateCertificate(
		id: string,
		patch: {
			status?:
				| "valid"
				| "revoked"
				| "expired"
				| "expiring_soon"
				| "pending_verification";
		}
	) {
		if (!isVendorCoreLive()) {
			throw new Error("Certificate updates require the live API.");
		}
		const row = await vendorCoreApi.updateCertificate(id, patch);
		return mapDjangoCertificate(row as Record<string, unknown>);
	},
};

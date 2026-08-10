import { apiClient } from "@/lib/api/client";
import { isMockEnabled, isNestApiEnabled, withMockOrRemote } from "@/lib/mock-mode";
import {
	VendorCoreApiError,
	getStoredAccessToken,
	isVendorCoreLive,
} from "@/lib/vendor-core/client";
import { vendorCoreApi } from "@/lib/vendor-core/api";

import { vendorDtoToModel } from "./map-vendor-core";
import { CURRENT_VENDOR_ID, vmsStore } from "./mock-store";
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
	}) {
		if (isMockEnabled()) {
			return mockDelay(
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
		}
		if (isVendorCoreLive()) {
			const dto = await vendorCoreApi.inviteVendor({
				legal_name: data.legalName,
				email: data.email,
				categories: data.categories,
			});
			return vendorDtoToModel(dto);
		}
		if (isNestApiEnabled()) {
			return apiClient<VendorModel>(vmsPaths.invite, {
				method: "POST",
				body: JSON.stringify(data),
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
			return apiClient<VendorCategoryModel[] | { results?: VendorCategoryModel[] }>(
				vmsPaths.categories
			).then(unwrapList);
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
			return apiClient<OnboardingCaseModel[] | { results?: OnboardingCaseModel[] }>(
				vmsPaths.onboarding
			).then(unwrapList);
		}
		return [];
	},
	async getOnboarding(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getOnboarding(id));
		if (isVendorCoreLive()) {
			return mapDjangoOnboarding(await vendorCoreApi.getOnboarding(id));
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
				await vendorCoreApi.updateOnboarding(id, body)
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
			return mapDjangoDocument(
				await vendorCoreApi.createDocument({
					vendor: doc.vendorId,
					document_type: doc.type,
					title: doc.name,
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
					vendor: input.vendorId,
					contract_number: input.number,
					title: input.title,
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
			return apiClient<RfxModel[] | { results?: RfxModel[] }>(vmsPaths.rfx).then(
				unwrapList
			);
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
		if (isMockEnabled()) return mockDelay(vmsStore.listPurchaseOrders(vendorId));
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listPurchaseOrders(
				vendorId ? { vendor_id: vendorId } : undefined
			);
			return (page.results ?? []).map(mapDjangoPurchaseOrder);
		}
		if (isNestApiEnabled()) {
			return apiClient<PurchaseOrderModel[] | { results?: PurchaseOrderModel[] }>(
				vmsPaths.purchaseOrders,
				{ params: vendorId ? { vendorId } : undefined }
			).then(unwrapList);
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
			const page = await vendorCoreApi.listVendorTeam();
			return (page.results ?? []).map(mapDjangoTeamMember);
		}
		if (isNestApiEnabled()) {
			return apiClient<VendorTeamMember[] | { results?: VendorTeamMember[] }>(
				vmsPaths.team
			).then(unwrapList);
		}
		return [];
	},
	async getCurrentVendor() {
		if (isMockEnabled()) return mockDelay(vmsStore.getVendor(CURRENT_VENDOR_ID));
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
				country: raw.country != null ? String(raw.country) : null,
				city: raw.city != null ? String(raw.city) : null,
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
};

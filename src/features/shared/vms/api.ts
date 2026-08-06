import { vendorCoreEndpoints } from "@/lib/vendor-core/api";
import { vendorCoreFetch } from "@/lib/vendor-core/client";
import type { PaginatedResult } from "@/lib/vendor-core/types";

import { CURRENT_VENDOR_ID, vmsStore } from "./mock-store";
import {
	mapDjangoCategory,
	mapDjangoVendor,
	unwrapPage,
	vendorToCreatePayload,
} from "./mappers";
import type {
	BidModel,
	ContractModel,
	DocumentModel,
	InvoiceModel,
	OnboardingCaseModel,
	PurchaseOrderModel,
	RfxModel,
	VendorModel,
} from "./types";
import { isVmsMockEnabled } from "./use-mock";

async function mockDelay<T>(value: T): Promise<T> {
	await new Promise((r) => setTimeout(r, 80));
	return value;
}

async function remoteListVendors(): Promise<VendorModel[]> {
	const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
		vendorCoreEndpoints.vendors
	);
	return unwrapPage(page).map((row) => mapDjangoVendor(row as never));
}

async function remoteGetVendor(id: string): Promise<VendorModel> {
	const row = await vendorCoreFetch<Record<string, unknown>>(
		vendorCoreEndpoints.vendorDetail(id)
	);
	return mapDjangoVendor(row as never);
}

export const vmsApi = {
	async listVendors() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listVendors());
		return remoteListVendors();
	},
	async getVendor(id: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.getVendor(id));
		return remoteGetVendor(id);
	},
	async createVendor(
		input: Parameters<typeof vmsStore.createVendor>[0]
	): Promise<VendorModel> {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.createVendor(input));
		const created = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.vendors,
			{
				method: "POST",
				body: JSON.stringify(vendorToCreatePayload(input)),
			}
		);
		return mapDjangoVendor(created as never);
	},
	async updateVendor(id: string, patch: Partial<VendorModel>) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.updateVendor(id, patch));
		const body: Record<string, unknown> = {};
		if (patch.legalName !== undefined) body.legal_name = patch.legalName;
		if (patch.tradeName !== undefined) body.trade_name = patch.tradeName;
		if (patch.status !== undefined) body.status = patch.status;
		if (patch.country !== undefined) body.country = patch.country;
		if (patch.city !== undefined) body.city = patch.city;
		const updated = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.vendorDetail(id),
			{ method: "PATCH", body: JSON.stringify(body) }
		);
		return mapDjangoVendor(updated as never);
	},
	async inviteVendor(data: {
		legalName: string;
		email: string;
		categories: string[];
	}) {
		if (isVmsMockEnabled()) {
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
		const created = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.vendorInvite,
			{
				method: "POST",
				body: JSON.stringify({
					legal_name: data.legalName,
					email: data.email,
					categories: data.categories,
				}),
			}
		);
		return mapDjangoVendor(created as never);
	},
	async listCategories() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listCategories());
		const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.categories
		);
		return unwrapPage(page).map((row) => mapDjangoCategory(row as never));
	},
	async listOnboarding() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listOnboarding());
		const page = await vendorCoreFetch<PaginatedResult<OnboardingCaseModel>>(
			vendorCoreEndpoints.onboarding
		);
		return unwrapPage(page);
	},
	async getOnboarding(id: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.getOnboarding(id));
		return vendorCoreFetch<OnboardingCaseModel>(
			vendorCoreEndpoints.onboardingDetail(id)
		);
	},
	async updateOnboarding(id: string, patch: Partial<OnboardingCaseModel>) {
		if (isVmsMockEnabled())
			return mockDelay(vmsStore.updateOnboarding(id, patch));
		return vendorCoreFetch<OnboardingCaseModel>(
			vendorCoreEndpoints.onboardingDetail(id),
			{ method: "PATCH", body: JSON.stringify(patch) }
		);
	},
	async listDocuments(vendorId?: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listDocuments(vendorId));
		const page = await vendorCoreFetch<PaginatedResult<DocumentModel>>(
			vendorCoreEndpoints.documents,
			{ params: vendorId ? { vendor_id: vendorId } : undefined }
		);
		return unwrapPage(page);
	},
	async getDocument(id: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.getDocument(id));
		return vendorCoreFetch<DocumentModel>(vendorCoreEndpoints.documentDetail(id));
	},
	async updateDocument(id: string, patch: Partial<DocumentModel>) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.updateDocument(id, patch));
		return vendorCoreFetch<DocumentModel>(
			vendorCoreEndpoints.documentDetail(id),
			{ method: "PATCH", body: JSON.stringify(patch) }
		);
	},
	async addDocument(doc: Parameters<typeof vmsStore.addDocument>[0]) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.addDocument(doc));
		return vendorCoreFetch<DocumentModel>(vendorCoreEndpoints.documents, {
			method: "POST",
			body: JSON.stringify(doc),
		});
	},
	async listCertificates() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listCertificates());
		const page = await vendorCoreFetch<PaginatedResult<unknown>>(
			vendorCoreEndpoints.certificates
		);
		return unwrapPage(page) as ReturnType<typeof vmsStore.listCertificates>;
	},
	async listContracts(vendorId?: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listContracts(vendorId));
		const page = await vendorCoreFetch<PaginatedResult<ContractModel>>(
			vendorCoreEndpoints.contracts,
			{ params: vendorId ? { vendor_id: vendorId } : undefined }
		);
		return unwrapPage(page);
	},
	async getContract(id: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.getContract(id));
		return vendorCoreFetch<ContractModel>(
			vendorCoreEndpoints.contractDetail(id)
		);
	},
	async createContract(input: Omit<ContractModel, "id" | "updatedAt">) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.createContract(input));
		return vendorCoreFetch<ContractModel>(vendorCoreEndpoints.contracts, {
			method: "POST",
			body: JSON.stringify(input),
		});
	},
	async updateContract(id: string, patch: Partial<ContractModel>) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.updateContract(id, patch));
		return vendorCoreFetch<ContractModel>(
			vendorCoreEndpoints.contractDetail(id),
			{ method: "PATCH", body: JSON.stringify(patch) }
		);
	},
	async listRfx() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listRfx());
		const page = await vendorCoreFetch<PaginatedResult<RfxModel>>(
			vendorCoreEndpoints.rfx
		);
		return unwrapPage(page);
	},
	async getRfx(id: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.getRfx(id));
		return vendorCoreFetch<RfxModel>(vendorCoreEndpoints.rfxDetail(id));
	},
	async createRfx(input: Omit<RfxModel, "id" | "updatedAt" | "bidCount">) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.createRfx(input));
		return vendorCoreFetch<RfxModel>(vendorCoreEndpoints.rfx, {
			method: "POST",
			body: JSON.stringify(input),
		});
	},
	async updateRfx(id: string, patch: Partial<RfxModel>) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.updateRfx(id, patch));
		return vendorCoreFetch<RfxModel>(vendorCoreEndpoints.rfxDetail(id), {
			method: "PATCH",
			body: JSON.stringify(patch),
		});
	},
	async listBids(rfxId?: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listBids(rfxId));
		if (!rfxId) return [];
		const page = await vendorCoreFetch<PaginatedResult<BidModel>>(
			vendorCoreEndpoints.rfxBids(rfxId)
		);
		return unwrapPage(page);
	},
	async submitBid(input: Omit<BidModel, "id" | "submittedAt" | "status">) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.submitBid(input));
		return vendorCoreFetch<BidModel>(vendorCoreEndpoints.rfxBids(input.rfxId), {
			method: "POST",
			body: JSON.stringify(input),
		});
	},
	async listPurchaseOrders(vendorId?: string) {
		if (isVmsMockEnabled())
			return mockDelay(vmsStore.listPurchaseOrders(vendorId));
		const page = await vendorCoreFetch<PaginatedResult<PurchaseOrderModel>>(
			vendorCoreEndpoints.purchaseOrders,
			{ params: vendorId ? { vendor_id: vendorId } : undefined }
		);
		return unwrapPage(page);
	},
	async getPurchaseOrder(id: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.getPurchaseOrder(id));
		return vendorCoreFetch<PurchaseOrderModel>(
			vendorCoreEndpoints.purchaseOrderDetail(id)
		);
	},
	async createPurchaseOrder(
		input: Omit<PurchaseOrderModel, "id" | "updatedAt" | "acknowledgedAt">
	) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.createPurchaseOrder(input));
		return vendorCoreFetch<PurchaseOrderModel>(
			vendorCoreEndpoints.purchaseOrders,
			{ method: "POST", body: JSON.stringify(input) }
		);
	},
	async updatePurchaseOrder(id: string, patch: Partial<PurchaseOrderModel>) {
		if (isVmsMockEnabled())
			return mockDelay(vmsStore.updatePurchaseOrder(id, patch));
		return vendorCoreFetch<PurchaseOrderModel>(
			vendorCoreEndpoints.purchaseOrderDetail(id),
			{ method: "PATCH", body: JSON.stringify(patch) }
		);
	},
	async listInvoices(vendorId?: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listInvoices(vendorId));
		const page = await vendorCoreFetch<PaginatedResult<InvoiceModel>>(
			vendorCoreEndpoints.invoices,
			{ params: vendorId ? { vendor_id: vendorId } : undefined }
		);
		return unwrapPage(page);
	},
	async getInvoice(id: string) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.getInvoice(id));
		return vendorCoreFetch<InvoiceModel>(vendorCoreEndpoints.invoiceDetail(id));
	},
	async createInvoice(input: Omit<InvoiceModel, "id" | "updatedAt">) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.createInvoice(input));
		return vendorCoreFetch<InvoiceModel>(vendorCoreEndpoints.invoices, {
			method: "POST",
			body: JSON.stringify(input),
		});
	},
	async updateInvoice(id: string, patch: Partial<InvoiceModel>) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.updateInvoice(id, patch));
		return vendorCoreFetch<InvoiceModel>(vendorCoreEndpoints.invoiceDetail(id), {
			method: "PATCH",
			body: JSON.stringify(patch),
		});
	},
	async listApprovals() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listApprovals());
		const page = await vendorCoreFetch<PaginatedResult<unknown>>(
			vendorCoreEndpoints.approvals
		);
		return unwrapPage(page) as ReturnType<typeof vmsStore.listApprovals>;
	},
	async updateApproval(
		id: string,
		status: "approved" | "rejected" | "changes_requested" | "pending"
	) {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.updateApproval(id, status));
		return vendorCoreFetch(vendorCoreEndpoints.approvalDetail(id), {
			method: "PATCH",
			body: JSON.stringify({ status }),
		});
	},
	async listScorecards() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listScorecards());
		const page = await vendorCoreFetch<PaginatedResult<unknown>>(
			vendorCoreEndpoints.scorecards
		);
		return unwrapPage(page) as ReturnType<typeof vmsStore.listScorecards>;
	},
	async listActivities(vendorId?: string) {
		return mockDelay(vmsStore.listActivities(vendorId));
	},
	async listNotifications() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listNotifications());
		const page = await vendorCoreFetch<PaginatedResult<unknown>>(
			vendorCoreEndpoints.notifications
		);
		return unwrapPage(page) as ReturnType<typeof vmsStore.listNotifications>;
	},
	async markNotificationRead(id: string) {
		if (isVmsMockEnabled()) {
			vmsStore.markNotificationRead(id);
			return mockDelay(true);
		}
		await vendorCoreFetch(`${vendorCoreEndpoints.notifications}${id}/`, {
			method: "PATCH",
			body: JSON.stringify({ read: true }),
		});
		return true;
	},
	async listTeam() {
		if (isVmsMockEnabled()) return mockDelay(vmsStore.listTeam());
		const page = await vendorCoreFetch<PaginatedResult<unknown>>(
			vendorCoreEndpoints.vendorTeam
		);
		return unwrapPage(page) as ReturnType<typeof vmsStore.listTeam>;
	},
	async getCurrentVendor() {
		if (isVmsMockEnabled())
			return mockDelay(vmsStore.getVendor(CURRENT_VENDOR_ID));
		const row = await vendorCoreFetch<Record<string, unknown>>(
			vendorCoreEndpoints.vendorMe
		);
		return mapDjangoVendor(row as never);
	},
	currentVendorId: CURRENT_VENDOR_ID,
};

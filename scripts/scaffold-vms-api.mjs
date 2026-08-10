#!/usr/bin/env node
/**
 * Scaffolds VMS feature modules (pages, api, queries, mutations, routes).
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function write(rel, content) {
	const full = path.join(root, rel);
	fs.mkdirSync(path.dirname(full), { recursive: true });
	if (!fs.existsSync(full) || process.env.FORCE === "1") {
		fs.writeFileSync(full, content);
		console.log("wrote", rel);
	}
}

function routePage(importPath, exportName) {
	return `import { ${exportName} } from "${importPath}";

export default function Page() {
	return <${exportName} />;
}
`;
}

// ── Shared API helper pattern factory ─────────────────────────────
write(
	"src/features/shared/vms/use-mock.ts",
	`import { isMockEnabled } from "@/lib/mock-mode";

/** @deprecated Prefer \`isMockEnabled\` from \`@/lib/mock-mode\`. */
export function isVmsMockEnabled() {
	return isMockEnabled();
}
`
);

write(
	"src/features/shared/vms/api.ts",
	`import { CURRENT_VENDOR_ID, vmsStore } from "./mock-store";
import type {
	BidModel,
	ContractModel,
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

export const vmsApi = {
	async listVendors() {
		if (!isVmsMockEnabled()) throw new Error("VMS API not configured");
		return mockDelay(vmsStore.listVendors());
	},
	async getVendor(id: string) {
		if (!isVmsMockEnabled()) throw new Error("VMS API not configured");
		return mockDelay(vmsStore.getVendor(id));
	},
	async createVendor(
		input: Parameters<typeof vmsStore.createVendor>[0]
	): Promise<VendorModel> {
		return mockDelay(vmsStore.createVendor(input));
	},
	async updateVendor(id: string, patch: Partial<VendorModel>) {
		return mockDelay(vmsStore.updateVendor(id, patch));
	},
	async inviteVendor(data: {
		legalName: string;
		email: string;
		categories: string[];
	}) {
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
						id: \`c-\${Date.now()}\`,
						name: data.email.split("@")[0],
						email: data.email,
						phone: null,
						role: "Primary",
						isPrimary: true,
					},
				],
			})
		);
	},
	async listCategories() {
		return mockDelay(vmsStore.listCategories());
	},
	async listOnboarding() {
		return mockDelay(vmsStore.listOnboarding());
	},
	async getOnboarding(id: string) {
		return mockDelay(vmsStore.getOnboarding(id));
	},
	async updateOnboarding(id: string, patch: Partial<OnboardingCaseModel>) {
		return mockDelay(vmsStore.updateOnboarding(id, patch));
	},
	async listDocuments(vendorId?: string) {
		return mockDelay(vmsStore.listDocuments(vendorId));
	},
	async addDocument(doc: Parameters<typeof vmsStore.addDocument>[0]) {
		return mockDelay(vmsStore.addDocument(doc));
	},
	async listCertificates() {
		return mockDelay(vmsStore.listCertificates());
	},
	async listContracts(vendorId?: string) {
		return mockDelay(vmsStore.listContracts(vendorId));
	},
	async getContract(id: string) {
		return mockDelay(vmsStore.getContract(id));
	},
	async createContract(input: Omit<ContractModel, "id" | "updatedAt">) {
		return mockDelay(vmsStore.createContract(input));
	},
	async updateContract(id: string, patch: Partial<ContractModel>) {
		return mockDelay(vmsStore.updateContract(id, patch));
	},
	async listRfx() {
		return mockDelay(vmsStore.listRfx());
	},
	async getRfx(id: string) {
		return mockDelay(vmsStore.getRfx(id));
	},
	async createRfx(input: Omit<RfxModel, "id" | "updatedAt" | "bidCount">) {
		return mockDelay(vmsStore.createRfx(input));
	},
	async updateRfx(id: string, patch: Partial<RfxModel>) {
		return mockDelay(vmsStore.updateRfx(id, patch));
	},
	async listBids(rfxId?: string) {
		return mockDelay(vmsStore.listBids(rfxId));
	},
	async submitBid(input: Omit<BidModel, "id" | "submittedAt" | "status">) {
		return mockDelay(vmsStore.submitBid(input));
	},
	async listPurchaseOrders(vendorId?: string) {
		return mockDelay(vmsStore.listPurchaseOrders(vendorId));
	},
	async getPurchaseOrder(id: string) {
		return mockDelay(vmsStore.getPurchaseOrder(id));
	},
	async createPurchaseOrder(
		input: Omit<PurchaseOrderModel, "id" | "updatedAt" | "acknowledgedAt">
	) {
		return mockDelay(vmsStore.createPurchaseOrder(input));
	},
	async updatePurchaseOrder(id: string, patch: Partial<PurchaseOrderModel>) {
		return mockDelay(vmsStore.updatePurchaseOrder(id, patch));
	},
	async listInvoices(vendorId?: string) {
		return mockDelay(vmsStore.listInvoices(vendorId));
	},
	async getInvoice(id: string) {
		return mockDelay(vmsStore.getInvoice(id));
	},
	async createInvoice(input: Omit<InvoiceModel, "id" | "updatedAt">) {
		return mockDelay(vmsStore.createInvoice(input));
	},
	async updateInvoice(id: string, patch: Partial<InvoiceModel>) {
		return mockDelay(vmsStore.updateInvoice(id, patch));
	},
	async listApprovals() {
		return mockDelay(vmsStore.listApprovals());
	},
	async updateApproval(
		id: string,
		status: "approved" | "rejected" | "changes_requested" | "pending"
	) {
		return mockDelay(vmsStore.updateApproval(id, status));
	},
	async listScorecards() {
		return mockDelay(vmsStore.listScorecards());
	},
	async listActivities(vendorId?: string) {
		return mockDelay(vmsStore.listActivities(vendorId));
	},
	async listNotifications() {
		return mockDelay(vmsStore.listNotifications());
	},
	async markNotificationRead(id: string) {
		vmsStore.markNotificationRead(id);
		return mockDelay(true);
	},
	async listTeam() {
		return mockDelay(vmsStore.listTeam());
	},
	async getCurrentVendor() {
		return mockDelay(vmsStore.getVendor(CURRENT_VENDOR_ID));
	},
	currentVendorId: CURRENT_VENDOR_ID,
};
`
);

write(
	"src/features/shared/vms/queries.ts",
	`"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { vmsApi } from "./api";
import type {
	ContractModel,
	InvoiceModel,
	OnboardingCaseModel,
	PurchaseOrderModel,
	RfxModel,
	VendorModel,
} from "./types";

export const vmsKeys = {
	all: ["vms"] as const,
	vendors: () => [...vmsKeys.all, "vendors"] as const,
	vendor: (id: string) => [...vmsKeys.vendors(), id] as const,
	categories: () => [...vmsKeys.all, "categories"] as const,
	onboarding: () => [...vmsKeys.all, "onboarding"] as const,
	onboardingCase: (id: string) => [...vmsKeys.onboarding(), id] as const,
	documents: (vendorId?: string) =>
		[...vmsKeys.all, "documents", vendorId ?? "all"] as const,
	certificates: () => [...vmsKeys.all, "certificates"] as const,
	contracts: (vendorId?: string) =>
		[...vmsKeys.all, "contracts", vendorId ?? "all"] as const,
	contract: (id: string) => [...vmsKeys.all, "contract", id] as const,
	rfx: () => [...vmsKeys.all, "rfx"] as const,
	rfxDetail: (id: string) => [...vmsKeys.rfx(), id] as const,
	bids: (rfxId?: string) => [...vmsKeys.all, "bids", rfxId ?? "all"] as const,
	pos: (vendorId?: string) =>
		[...vmsKeys.all, "pos", vendorId ?? "all"] as const,
	po: (id: string) => [...vmsKeys.all, "po", id] as const,
	invoices: (vendorId?: string) =>
		[...vmsKeys.all, "invoices", vendorId ?? "all"] as const,
	invoice: (id: string) => [...vmsKeys.all, "invoice", id] as const,
	approvals: () => [...vmsKeys.all, "approvals"] as const,
	scorecards: () => [...vmsKeys.all, "scorecards"] as const,
	activities: (vendorId?: string) =>
		[...vmsKeys.all, "activities", vendorId ?? "all"] as const,
	notifications: () => [...vmsKeys.all, "notifications"] as const,
	team: () => [...vmsKeys.all, "team"] as const,
	currentVendor: () => [...vmsKeys.all, "current-vendor"] as const,
};

export function useVendorsList() {
	const q = useQuery({
		queryKey: vmsKeys.vendors(),
		queryFn: () => vmsApi.listVendors(),
	});
	return {
		vendors: q.data ?? [],
		isLoading: q.isLoading,
		error: q.error,
		refetch: q.refetch,
	};
}

export function useVendor(id: string | undefined) {
	const q = useQuery({
		queryKey: vmsKeys.vendor(id ?? ""),
		queryFn: () => vmsApi.getVendor(id!),
		enabled: !!id,
	});
	return {
		vendor: q.data ?? null,
		isLoading: q.isLoading,
		error: q.error,
	};
}

export function useCategoriesList() {
	const q = useQuery({
		queryKey: vmsKeys.categories(),
		queryFn: () => vmsApi.listCategories(),
	});
	return { categories: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useOnboardingList() {
	const q = useQuery({
		queryKey: vmsKeys.onboarding(),
		queryFn: () => vmsApi.listOnboarding(),
	});
	return { cases: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useOnboardingCase(id: string | undefined) {
	const q = useQuery({
		queryKey: vmsKeys.onboardingCase(id ?? ""),
		queryFn: () => vmsApi.getOnboarding(id!),
		enabled: !!id,
	});
	return { caseItem: q.data ?? null, isLoading: q.isLoading, error: q.error };
}

export function useDocumentsList(vendorId?: string) {
	const q = useQuery({
		queryKey: vmsKeys.documents(vendorId),
		queryFn: () => vmsApi.listDocuments(vendorId),
	});
	return { documents: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useCertificatesList() {
	const q = useQuery({
		queryKey: vmsKeys.certificates(),
		queryFn: () => vmsApi.listCertificates(),
	});
	return {
		certificates: q.data ?? [],
		isLoading: q.isLoading,
		error: q.error,
	};
}

export function useContractsList(vendorId?: string) {
	const q = useQuery({
		queryKey: vmsKeys.contracts(vendorId),
		queryFn: () => vmsApi.listContracts(vendorId),
	});
	return { contracts: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useContract(id: string | undefined) {
	const q = useQuery({
		queryKey: vmsKeys.contract(id ?? ""),
		queryFn: () => vmsApi.getContract(id!),
		enabled: !!id,
	});
	return { contract: q.data ?? null, isLoading: q.isLoading, error: q.error };
}

export function useRfxList() {
	const q = useQuery({
		queryKey: vmsKeys.rfx(),
		queryFn: () => vmsApi.listRfx(),
	});
	return { events: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useRfx(id: string | undefined) {
	const q = useQuery({
		queryKey: vmsKeys.rfxDetail(id ?? ""),
		queryFn: () => vmsApi.getRfx(id!),
		enabled: !!id,
	});
	return { rfx: q.data ?? null, isLoading: q.isLoading, error: q.error };
}

export function useBidsList(rfxId?: string) {
	const q = useQuery({
		queryKey: vmsKeys.bids(rfxId),
		queryFn: () => vmsApi.listBids(rfxId),
	});
	return { bids: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function usePurchaseOrdersList(vendorId?: string) {
	const q = useQuery({
		queryKey: vmsKeys.pos(vendorId),
		queryFn: () => vmsApi.listPurchaseOrders(vendorId),
	});
	return { orders: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function usePurchaseOrder(id: string | undefined) {
	const q = useQuery({
		queryKey: vmsKeys.po(id ?? ""),
		queryFn: () => vmsApi.getPurchaseOrder(id!),
		enabled: !!id,
	});
	return { order: q.data ?? null, isLoading: q.isLoading, error: q.error };
}

export function useInvoicesList(vendorId?: string) {
	const q = useQuery({
		queryKey: vmsKeys.invoices(vendorId),
		queryFn: () => vmsApi.listInvoices(vendorId),
	});
	return { invoices: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useInvoice(id: string | undefined) {
	const q = useQuery({
		queryKey: vmsKeys.invoice(id ?? ""),
		queryFn: () => vmsApi.getInvoice(id!),
		enabled: !!id,
	});
	return { invoice: q.data ?? null, isLoading: q.isLoading, error: q.error };
}

export function useApprovalsList() {
	const q = useQuery({
		queryKey: vmsKeys.approvals(),
		queryFn: () => vmsApi.listApprovals(),
	});
	return { approvals: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useScorecardsList() {
	const q = useQuery({
		queryKey: vmsKeys.scorecards(),
		queryFn: () => vmsApi.listScorecards(),
	});
	return { scorecards: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useActivitiesList(vendorId?: string) {
	const q = useQuery({
		queryKey: vmsKeys.activities(vendorId),
		queryFn: () => vmsApi.listActivities(vendorId),
	});
	return { activities: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useNotificationsList() {
	const q = useQuery({
		queryKey: vmsKeys.notifications(),
		queryFn: () => vmsApi.listNotifications(),
	});
	return {
		notifications: q.data ?? [],
		isLoading: q.isLoading,
		error: q.error,
	};
}

export function useTeamList() {
	const q = useQuery({
		queryKey: vmsKeys.team(),
		queryFn: () => vmsApi.listTeam(),
	});
	return { members: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useCurrentVendor() {
	const q = useQuery({
		queryKey: vmsKeys.currentVendor(),
		queryFn: () => vmsApi.getCurrentVendor(),
	});
	return { vendor: q.data ?? null, isLoading: q.isLoading, error: q.error };
}

export function useInvalidateVms() {
	const qc = useQueryClient();
	return () => qc.invalidateQueries({ queryKey: vmsKeys.all });
}

export function useInviteVendorMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (data: {
			legalName: string;
			email: string;
			categories: string[];
		}) => vmsApi.inviteVendor(data),
		onSuccess: invalidate,
	});
}

export function useCreateVendorMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (data: Parameters<typeof vmsApi.createVendor>[0]) =>
			vmsApi.createVendor(data),
		onSuccess: invalidate,
	});
}

export function useUpdateVendorMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: Partial<VendorModel> }) =>
			vmsApi.updateVendor(id, patch),
		onSuccess: invalidate,
	});
}

export function useUpdateOnboardingMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: ({
			id,
			patch,
		}: {
			id: string;
			patch: Partial<OnboardingCaseModel>;
		}) => vmsApi.updateOnboarding(id, patch),
		onSuccess: invalidate,
	});
}

export function useApprovalMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: ({
			id,
			status,
		}: {
			id: string;
			status: "approved" | "rejected" | "changes_requested";
		}) => vmsApi.updateApproval(id, status),
		onSuccess: invalidate,
	});
}

export function useCreateContractMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (data: Omit<ContractModel, "id" | "updatedAt">) =>
			vmsApi.createContract(data),
		onSuccess: invalidate,
	});
}

export function useUpdateContractMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: ({
			id,
			patch,
		}: {
			id: string;
			patch: Partial<ContractModel>;
		}) => vmsApi.updateContract(id, patch),
		onSuccess: invalidate,
	});
}

export function useCreateRfxMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (data: Omit<RfxModel, "id" | "updatedAt" | "bidCount">) =>
			vmsApi.createRfx(data),
		onSuccess: invalidate,
	});
}

export function useUpdateRfxMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: Partial<RfxModel> }) =>
			vmsApi.updateRfx(id, patch),
		onSuccess: invalidate,
	});
}

export function useSubmitBidMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (
			data: Omit<Parameters<typeof vmsApi.submitBid>[0], never>
		) => vmsApi.submitBid(data),
		onSuccess: invalidate,
	});
}

export function useCreatePoMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (
			data: Omit<PurchaseOrderModel, "id" | "updatedAt" | "acknowledgedAt">
		) => vmsApi.createPurchaseOrder(data),
		onSuccess: invalidate,
	});
}

export function useUpdatePoMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: ({
			id,
			patch,
		}: {
			id: string;
			patch: Partial<PurchaseOrderModel>;
		}) => vmsApi.updatePurchaseOrder(id, patch),
		onSuccess: invalidate,
	});
}

export function useCreateInvoiceMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (data: Omit<InvoiceModel, "id" | "updatedAt">) =>
			vmsApi.createInvoice(data),
		onSuccess: invalidate,
	});
}

export function useUpdateInvoiceMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: ({
			id,
			patch,
		}: {
			id: string;
			patch: Partial<InvoiceModel>;
		}) => vmsApi.updateInvoice(id, patch),
		onSuccess: invalidate,
	});
}

export function useAddDocumentMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (data: Parameters<typeof vmsApi.addDocument>[0]) =>
			vmsApi.addDocument(data),
		onSuccess: invalidate,
	});
}

export function useMarkNotificationReadMutation() {
	const invalidate = useInvalidateVms();
	return useMutation({
		mutationFn: (id: string) => vmsApi.markNotificationRead(id),
		onSuccess: invalidate,
	});
}
`
);

console.log("shared api/queries done");

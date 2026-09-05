import { contractDtoToModel } from "@/features/admin/features/contracts/feature/mappers/contractCoreMappers";
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
import type {
	VendorCategoryDto,
	VendorTeamMemberDto,
} from "@/lib/vendor-core/types";

import {
	approvalDtoToModel,
	approvalUiStatusToDecision,
	bidDtoToModel,
	certificateDtoToModel,
	documentDtoToModel,
	documentModelToCreateInput,
	documentModelToUpdateInput,
	invoiceDtoToModel,
	invoiceModelToCreateInput,
	invoiceModelToUpdateInput,
	notificationDtoToModel,
	onboardingDtoToModel,
	onboardingStatusToApi,
	purchaseOrderDtoToModel,
	purchaseOrderModelToCreateInput,
	purchaseOrderModelToUpdateInput,
	rfxDtoToModel,
	rfxModelToCreateInput,
	rfxModelToUpdateInput,
	scorecardDtoToModel,
} from "./map-procurement-core";
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

async function vendorNameMap(): Promise<Map<string, string>> {
	try {
		const page = await vendorCoreApi.listVendors();
		return new Map(
			(page.results ?? []).map((v) => [v.id, v.legal_name || v.name || ""])
		);
	} catch {
		return new Map();
	}
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
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			const page = await vendorCoreApi.listOnboardingCases({ limit: 100 });
			return (page.results ?? []).map((row) =>
				onboardingDtoToModel(row, names)
			);
		}
		return [];
	},
	async getOnboarding(id: string) {
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			return onboardingDtoToModel(
				await vendorCoreApi.getOnboardingCase(id),
				names
			);
		}
		return null;
	},
	async updateOnboarding(id: string, patch: Partial<OnboardingCaseModel>) {
		if (!isVendorCoreLive()) {
			throw new Error("Onboarding updates require the live API.");
		}
		const names = await vendorNameMap();
		if (patch.status === "submitted") {
			return onboardingDtoToModel(
				await vendorCoreApi.submitOnboardingCase(id),
				names
			);
		}
		if (patch.status === "approved") {
			return onboardingDtoToModel(
				await vendorCoreApi.approveOnboardingCase(id),
				names
			);
		}
		if (patch.status === "rejected") {
			return onboardingDtoToModel(
				await vendorCoreApi.rejectOnboardingCase(id, {
					rejection_reason: patch.reviewerNote ?? "",
				}),
				names
			);
		}
		const body: Record<string, unknown> = {};
		if (patch.status) body.status = onboardingStatusToApi(patch.status);
		if (patch.progress != null) body.progress_percent = patch.progress;
		if (patch.reviewerNote != null) body.rejection_reason = patch.reviewerNote;
		return onboardingDtoToModel(
			await vendorCoreApi.updateOnboardingCase(id, body),
			names
		);
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
	async listDocuments(vendorId?: string) {
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			const page = await vendorCoreApi.listDocuments({
				vendor_id: vendorId,
				limit: 100,
			});
			return (page.results ?? []).map((row) =>
				documentDtoToModel(row as unknown as Record<string, unknown>, names)
			);
		}
		return [];
	},
	async getDocument(id: string) {
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			const row = await vendorCoreApi.getDocument(id);
			return documentDtoToModel(
				row as unknown as Record<string, unknown>,
				names
			);
		}
		return null;
	},
	async updateDocument(id: string, patch: Partial<DocumentModel>) {
		if (!isVendorCoreLive()) {
			throw new Error("Document updates require the live API.");
		}
		const names = await vendorNameMap();
		const row = await vendorCoreApi.updateDocument(
			id,
			documentModelToUpdateInput(patch)
		);
		return documentDtoToModel(row as unknown as Record<string, unknown>, names);
	},
	async addDocument(doc: Parameters<typeof vmsStore.addDocument>[0]) {
		if (!isVendorCoreLive()) {
			throw new Error("Document create requires the live API.");
		}
		const names = await vendorNameMap();
		const row = await vendorCoreApi.createDocument(
			documentModelToCreateInput({
				vendorId: doc.vendorId,
				name: doc.name,
				type: doc.type,
				status: doc.status,
				expiresAt: doc.expiresAt,
				fileSizeKb: doc.fileSizeKb,
				checksum: doc.checksum,
			}) as import("@/lib/vendor-core/types").ProcurementDocumentCreateInput
		);
		return documentDtoToModel(row as unknown as Record<string, unknown>, names);
	},
	async listCertificates() {
		if (!isVendorCoreLive()) return [];
		const names = await vendorNameMap();
		const page = await vendorCoreApi.listCertificates({ limit: 100 });
		return (page.results ?? []).map((row) => certificateDtoToModel(row, names));
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
		const names = await vendorNameMap();
		const row = await vendorCoreApi.updateCertificate(id, patch);
		return certificateDtoToModel(row, names);
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
	async listContracts(vendorId?: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.listContracts(vendorId));
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listContracts({
				vendor_id: vendorId,
				limit: 100,
			});
			return (page.results ?? []).map(contractDtoToModel);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.getContract(id));
		if (isVendorCoreLive())
			return contractDtoToModel(await vendorCoreApi.getContract(id));
		return withMockOrRemote(
			() => mockDelay(vmsStore.getContract(id)),
			() => apiClient<ContractModel>(vmsPaths.contract(id))
		);
	},
	async createContract(input: Omit<ContractModel, "id" | "updatedAt">) {
		if (isMockEnabled()) return mockDelay(vmsStore.createContract(input));
		if (isVendorCoreLive()) {
			const dto = await vendorCoreApi.createContract({
				vendor_id: input.vendorId,
				contract_number: input.number,
				title: input.title,
				contract_type: input.contractType ?? "msa",
				status: input.status,
				effective_date: input.startDate,
				expiration_date: input.endDate,
				total_contract_value: input.value,
				currency: input.currency,
			});
			return contractDtoToModel(dto);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.updateContract(id, patch));
		if (isVendorCoreLive()) {
			const dto = await vendorCoreApi.updateContract(id, {
				title: patch.title,
				status: patch.status,
				effective_date: patch.startDate,
				expiration_date: patch.endDate,
				total_contract_value: patch.value,
				currency: patch.currency,
				contract_number: patch.number,
			});
			return contractDtoToModel(dto);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.listRfx());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listRfx({ limit: 100 });
			return (page.results ?? []).map((row) => rfxDtoToModel(row));
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.listRfx()),
			() =>
				apiClient<RfxModel[] | { results?: RfxModel[] }>(vmsPaths.rfx).then(
					unwrapList
				)
		);
	},
	async getRfx(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getRfx(id));
		if (isVendorCoreLive()) {
			const row = await vendorCoreApi.getRfx(id);
			const bids = await vendorCoreApi.listRfxBids(id, { limit: 100 });
			return rfxDtoToModel(row, bids.results?.length ?? 0);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.getRfx(id)),
			() => apiClient<RfxModel>(vmsPaths.rfxDetail(id))
		);
	},
	async createRfx(input: Omit<RfxModel, "id" | "updatedAt" | "bidCount">) {
		if (isMockEnabled()) return mockDelay(vmsStore.createRfx(input));
		if (isVendorCoreLive()) {
			return rfxDtoToModel(
				await vendorCoreApi.createRfx(rfxModelToCreateInput(input))
			);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.createRfx(input)),
			() =>
				apiClient<RfxModel>(vmsPaths.rfx, {
					method: "POST",
					body: JSON.stringify(input),
				})
		);
	},
	async awardRfx(id: string, bidId: string) {
		if (!isVendorCoreLive()) {
			throw new Error("Awarding an RFX requires the live API.");
		}
		return rfxDtoToModel(await vendorCoreApi.awardRfx(id, { bid_id: bidId }));
	},
	async updateRfx(id: string, patch: Partial<RfxModel>) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateRfx(id, patch));
		if (isVendorCoreLive()) {
			if (patch.status === "published") {
				return rfxDtoToModel(await vendorCoreApi.publishRfx(id));
			}
			return rfxDtoToModel(
				await vendorCoreApi.updateRfx(id, rfxModelToUpdateInput(patch))
			);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.listBids(rfxId));
		if (isVendorCoreLive()) {
			if (!rfxId) return [];
			const names = await vendorNameMap();
			const rfx = await vendorCoreApi.getRfx(rfxId);
			const page = await vendorCoreApi.listRfxBids(rfxId, { limit: 100 });
			return (page.results ?? []).map((row) => {
				const bid = bidDtoToModel(row, String(rfx.title ?? ""));
				bid.vendorName = names.get(bid.vendorId) || bid.vendorName;
				return bid;
			});
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.submitBid(input));
		if (isVendorCoreLive()) {
			const row = await vendorCoreApi.createRfxBid(input.rfxId, {
				vendor_id: input.vendorId,
				total_amount: input.amount,
				currency: input.currency,
				status: "submitted",
			});
			return bidDtoToModel(row, input.rfxTitle);
		}
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
		if (isMockEnabled())
			return mockDelay(vmsStore.listPurchaseOrders(vendorId));
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			const page = await vendorCoreApi.listPurchaseOrders({
				vendor_id: vendorId,
				limit: 100,
			});
			return (page.results ?? []).map((row) =>
				purchaseOrderDtoToModel(row, names)
			);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.listPurchaseOrders(vendorId)),
			() =>
				apiClient<PurchaseOrderModel[] | { results?: PurchaseOrderModel[] }>(
					vmsPaths.purchaseOrders,
					{ params: vendorId ? { vendorId } : undefined }
				).then(unwrapList)
		);
	},
	async getPurchaseOrder(id: string) {
		if (isMockEnabled()) return mockDelay(vmsStore.getPurchaseOrder(id));
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			return purchaseOrderDtoToModel(
				await vendorCoreApi.getPurchaseOrder(id),
				names
			);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.getPurchaseOrder(id)),
			() => apiClient<PurchaseOrderModel>(vmsPaths.purchaseOrder(id))
		);
	},
	async createPurchaseOrder(
		input: Omit<PurchaseOrderModel, "id" | "updatedAt" | "acknowledgedAt">
	) {
		if (isMockEnabled()) return mockDelay(vmsStore.createPurchaseOrder(input));
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			return purchaseOrderDtoToModel(
				await vendorCoreApi.createPurchaseOrder(
					purchaseOrderModelToCreateInput(input)
				),
				names
			);
		}
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
		if (isMockEnabled())
			return mockDelay(vmsStore.updatePurchaseOrder(id, patch));
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			if (patch.status === "acknowledged") {
				return purchaseOrderDtoToModel(
					await vendorCoreApi.acknowledgePurchaseOrder(id),
					names
				);
			}
			if (patch.status === "received") {
				return purchaseOrderDtoToModel(
					await vendorCoreApi.receivePurchaseOrder(id),
					names
				);
			}
			return purchaseOrderDtoToModel(
				await vendorCoreApi.updatePurchaseOrder(
					id,
					purchaseOrderModelToUpdateInput(patch)
				),
				names
			);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.listInvoices(vendorId));
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			const [page, pos] = await Promise.all([
				vendorCoreApi.listInvoices({ vendor_id: vendorId, limit: 100 }),
				vendorCoreApi.listPurchaseOrders({ limit: 100 }),
			]);
			const poNumbers = new Map(
				(pos.results ?? []).map((row) => [
					String(row.id ?? ""),
					String(row.po_number ?? ""),
				])
			);
			return (page.results ?? []).map((row) =>
				invoiceDtoToModel(row, names, poNumbers)
			);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.getInvoice(id));
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			const [row, pos] = await Promise.all([
				vendorCoreApi.getInvoice(id),
				vendorCoreApi.listPurchaseOrders({ limit: 100 }),
			]);
			const poNumbers = new Map(
				(pos.results ?? []).map((item) => [
					String(item.id ?? ""),
					String(item.po_number ?? ""),
				])
			);
			return invoiceDtoToModel(row, names, poNumbers);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.getInvoice(id)),
			() => apiClient<InvoiceModel>(vmsPaths.invoice(id))
		);
	},
	async createInvoice(input: Omit<InvoiceModel, "id" | "updatedAt">) {
		if (isMockEnabled()) return mockDelay(vmsStore.createInvoice(input));
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			return invoiceDtoToModel(
				await vendorCoreApi.createInvoice(invoiceModelToCreateInput(input)),
				names
			);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.createInvoice(input)),
			() =>
				apiClient<InvoiceModel>(vmsPaths.invoices, {
					method: "POST",
					body: JSON.stringify(input),
				})
		);
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
	async updateInvoice(id: string, patch: Partial<InvoiceModel>) {
		if (isMockEnabled()) return mockDelay(vmsStore.updateInvoice(id, patch));
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			if (patch.status === "matched") {
				return invoiceDtoToModel(await vendorCoreApi.matchInvoice(id), names);
			}
			if (patch.status === "disputed") {
				return invoiceDtoToModel(await vendorCoreApi.disputeInvoice(id), names);
			}
			if (patch.status === "approved") {
				return invoiceDtoToModel(await vendorCoreApi.approveInvoice(id), names);
			}
			return invoiceDtoToModel(
				await vendorCoreApi.updateInvoice(id, invoiceModelToUpdateInput(patch)),
				names
			);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.listApprovals());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listApprovals({ limit: 100 });
			return (page.results ?? []).map(approvalDtoToModel);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.updateApproval(id, status));
		if (isVendorCoreLive()) {
			const decision = approvalUiStatusToDecision(status);
			if (decision) {
				return approvalDtoToModel(
					await vendorCoreApi.decideApproval(id, { decision })
				);
			}
			return approvalDtoToModel(
				await vendorCoreApi.updateApproval(id, { status: "pending" })
			);
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.listScorecards());
		if (isVendorCoreLive()) {
			const names = await vendorNameMap();
			const page = await vendorCoreApi.listScorecards({ limit: 100 });
			return (page.results ?? []).map((row) => scorecardDtoToModel(row, names));
		}
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
		if (isMockEnabled()) return mockDelay(vmsStore.listNotifications());
		if (isVendorCoreLive()) {
			const page = await vendorCoreApi.listNotifications({ limit: 100 });
			return (page.results ?? []).map(notificationDtoToModel);
		}
		return withMockOrRemote(
			() => mockDelay(vmsStore.listNotifications()),
			() =>
				apiClient<NotificationModel[] | { results?: NotificationModel[] }>(
					vmsPaths.notifications
				).then(unwrapList)
		);
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
		if (isMockEnabled())
			return mockDelay(vmsStore.getVendor(CURRENT_VENDOR_ID));
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

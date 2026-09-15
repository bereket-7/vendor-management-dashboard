/** CMS EDGE analytics + pharmacy / medical claim live reads. */
import { isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import { VendorCoreApiError } from "@/lib/vendor-core/client";
import type { PharmacyClaimRowListQuery } from "@/lib/vendor-core/types";

import {
	type CmsEdgeMedicalClaimDetailView,
	type CmsEdgeMedicalClaimGroup,
	claimLineDtosToMedicalClaimDetailView,
	claimLineDtosToMedicalClaimGroups,
	deriveMedicalClaimKpis,
	medicalMockRowsToGroups,
} from "../../live-medical-claims";
import {
	type CmsEdgeMemberDetailView,
	deriveMemberEdgeKpis,
	memberDetailDtoToViewEnriched,
	memberListDtosToRows,
	memberMockDetailToView,
	memberStatsToEdgeKpis,
} from "../../live-members";
import {
	type CmsEdgePharmacyClaimDetailView,
	derivePharmacyClaimKpis,
	pharmacyClaimRowDetailDtoToView,
	pharmacyClaimRowListDtosToRows,
} from "../../live-pharmacy-claims";
import {
	type CmsEdgeProviderDetailView,
	deriveProviderEdgeKpis,
	providerDtoToDetailViewEnriched,
	providerDtosToRows,
	providerMockDetailToView,
	providerStatsToEdgeKpis,
} from "../../live-providers";
import {
	type CmsEdgeSupplementalDxDetailView,
	claimDiagnosisDtoToDetailView,
	claimDiagnosisDtosToRows,
	deriveSupplementalDxKpis,
	normalizeClaimDiagnosis,
} from "../../live-supplemental-diagnoses";
import * as mock from "../../mock-data";
import type {
	CmsEdgeMemberListRow,
	CmsEdgePharmacyClaimRow,
	CmsEdgeProviderListRow,
	CmsEdgeSupplementalDxRow,
} from "../../mock-data";

/** Backend LimitOffsetPagination.max_limit for pharmacy claim rows. */
const PHARMACY_ROW_MAX_LIMIT = 50;
const PHARMACY_LIST_TIMEOUT_MS = 15_000;
const LIST_LIMIT = 50;

function formatCmsEdgeDate(value: unknown): string {
	if (value == null || value === "") return "—";
	const d = new Date(String(value));
	if (Number.isNaN(d.getTime())) return String(value);
	return d.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export async function listAuditRequests() {
	if (isMockEnabled()) return mock.CMS_EDGE_AUDIT_REQUESTS;
	try {
		const page = await vendorCoreApi.listCmsEdgeAuditRequests({
			limit: 50,
			offset: 0,
		});
		return (page.results ?? []).map((row) => ({
			id: row.id,
			auditType: row.request_type || row.title || "Audit",
			requestDate: formatCmsEdgeDate(row.created_at),
			relatedSubmission: row.reference_id || "—",
			auditPeriod: row.reporting_period || "—",
			dueDate: row.due_date ?? "—",
			status: mapAuditStatus(row.status),
			priority: "Medium" as mock.AuditPriority,
			requestedRecords: 0,
		}));
	} catch {
		return [];
	}
}

function mapAuditStatus(raw: string): mock.AuditRequestStatus {
	const s = raw.toLowerCase();
	if (s.includes("overdue")) return "Overdue";
	if (s.includes("complete") || s.includes("done") || s.includes("closed"))
		return "Completed";
	return "In Progress";
}

export async function listAuditReports() {
	if (isMockEnabled()) return mock.CMS_EDGE_AUDIT_REPORTS;
	return [];
}

export async function listSubmissionHistory() {
	if (isMockEnabled()) return mock.CMS_EDGE_SUBMISSION_HISTORY;
	try {
		const page = await vendorCoreApi.listCmsEdgeSubmissions({
			limit: 100,
			offset: 0,
		});
		return (page.results ?? []).map((row): mock.SubmissionHistoryRow => {
			const fileType = mapSubmissionFileType(row.file_type);
			const environment = mapSubmissionEnvironment(row.environment);
			const status = mapSubmissionStatus(row.status);
			return {
				id: row.reference_id || row.id,
				fileType,
				environment,
				reportingPeriod: row.reporting_period || "—",
				submittedDateTime: formatCmsEdgeDate(
					row.submitted_at ?? row.created_at
				),
				status,
				records: row.record_count ?? 0,
				submittedBy: row.owner || "—",
			};
		});
	} catch {
		return [];
	}
}

export async function listCmsResponses() {
	if (isMockEnabled()) return mock.CMS_EDGE_RESPONSES_LIST;
	try {
		const page = await vendorCoreApi.listCmsEdgeCmsResponses({
			limit: 100,
			offset: 0,
		});
		return (page.results ?? []).map(
			(row): mock.CmsResponseRow => ({
				id: row.id,
				responseFile: row.filename || row.reference_id,
				responseType: mapCmsResponseType(row.response_type),
				fileType: "Medical",
				environment: "Production",
				relatedSubmission: row.submission_id ?? "—",
				reportingPeriod: row.reporting_period || "—",
				dateReceived: formatCmsEdgeDate(row.received_at ?? row.created_at),
				status: mapCmsResponseStatus(row.status),
				accepted: Math.max(0, (row.error_count ?? 0) === 0 ? 1 : 0),
				rejected: row.error_count ?? 0,
			})
		);
	} catch {
		return [];
	}
}

export async function listDocumentLibrary() {
	if (isMockEnabled()) return mock.CMS_EDGE_DOCUMENT_LIBRARY;
	try {
		const page = await vendorCoreApi.listCmsEdgeDocuments({
			limit: 100,
			offset: 0,
		});
		return (page.results ?? []).map(
			(row): mock.DocumentLibraryRow => ({
				id: row.id,
				name: row.title || row.reference_id,
				fileKind: "pdf",
				documentType: row.document_type || "Document",
				relatedSubmission: "—",
				reportingPeriod: row.reporting_period || "—",
				dateUploaded: formatCmsEdgeDate(row.created_at),
				fileSize: "—",
				status: "Available",
				retentionUntil: "—",
			})
		);
	} catch {
		return [];
	}
}

export async function listValidationRuns() {
	if (isMockEnabled()) return mock.CMS_EDGE_INTERNAL_FILE_VALIDATION;
	try {
		const page = await vendorCoreApi.listCmsEdgeValidationRuns({
			limit: 100,
			offset: 0,
		});
		return (page.results ?? []).map((row) => ({
			id: row.id,
			fileName: `${row.kind || "validation"} · ${row.scope || row.reference_id}`,
			fileType: row.kind || "Validation",
			reportingPeriod: row.reporting_period || "—",
			submittedDate: formatCmsEdgeDate(row.started_at ?? row.created_at),
			records: row.passed_count + row.warning_count + row.error_count,
			status: (row.error_count > 0
				? "Failed"
				: "Passed") as mock.InternalFileValidationStatus,
			errors: row.error_count,
			warnings: row.warning_count,
			relatedSubmission: row.reference_id || "—",
		}));
	} catch {
		return [];
	}
}

function mapSubmissionFileType(raw: string): mock.SubmissionFileType {
	const s = raw.toLowerCase();
	if (s.includes("enroll")) return "Enrollment";
	if (s.includes("pharm")) return "Pharmacy";
	if (s.includes("sdr") || s.includes("supp")) return "Supplemental Diagnosis";
	return "Medical";
}

function mapSubmissionEnvironment(raw: string): mock.SubmissionEnvironment {
	const s = raw.toLowerCase();
	if (s.includes("prod")) return "Production";
	if (s.includes("valid")) return "Validation";
	return "Test";
}

function mapSubmissionStatus(raw: string): mock.SubmissionStatus {
	const s = raw.toLowerCase();
	if (s.includes("accept")) return "Accepted";
	if (s.includes("fail") || s.includes("reject")) return "Failed";
	if (s.includes("process")) return "Processing";
	return "Processing";
}

function mapCmsResponseType(raw: string): mock.CmsResponseType {
	const s = raw.toLowerCase();
	if (s.includes("error")) return "Error Report";
	if (s.includes("valid")) return "Validation Response";
	return "Acceptance Report";
}

function mapCmsResponseStatus(raw: string): mock.CmsResponseStatus {
	const s = raw.toLowerCase();
	if (s.includes("pend")) return "Pending";
	if (s.includes("error") || s.includes("fail")) return "Error";
	return "Completed";
}

export type ListPharmacyClaimsParams = {
	claim_no?: string;
	cardholder_id?: string;
	search?: string;
	limit?: number;
	offset?: number;
};

export type ListPharmacyClaimsResult = {
	items: CmsEdgePharmacyClaimRow[];
	total: number;
	kpis: ReturnType<typeof derivePharmacyClaimKpis>;
	source: "live" | "mock";
};

function pharmacyMockRows(): CmsEdgePharmacyClaimRow[] {
	return [...mock.CMS_EDGE_PHARMACY_CLAIMS_LIST];
}

export function forcePharmacyFixtureMode(_enabled: boolean) {
	/* no-op — live-only pharmacy reads */
}

function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	label: string
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`${label} timed out after ${ms}ms`));
		}, ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(err) => {
				clearTimeout(timer);
				reject(err);
			}
		);
	});
}

function clampPharmacyLimit(limit?: number): number {
	const n = Number(limit ?? PHARMACY_ROW_MAX_LIMIT);
	if (!Number.isFinite(n) || n < 1) return PHARMACY_ROW_MAX_LIMIT;
	return Math.min(Math.floor(n), PHARMACY_ROW_MAX_LIMIT);
}

export async function listPharmacyClaims(
	params: ListPharmacyClaimsParams = {}
): Promise<ListPharmacyClaimsResult> {
	if (isMockEnabled()) {
		const items = pharmacyMockRows();
		return {
			items,
			total: items.length,
			kpis: derivePharmacyClaimKpis(items),
			source: "mock",
		};
	}

	const query: PharmacyClaimRowListQuery = {
		limit: clampPharmacyLimit(params.limit),
		offset: params.offset ?? 0,
		// Backend ListOrderingMixin uses `order_by`, not `ordering`.
		order_by: "-created_at",
	};

	const search = params.search?.trim();
	if (params.claim_no) {
		query.claim_no = params.claim_no;
	} else if (params.cardholder_id) {
		query.cardholder_id = params.cardholder_id;
	} else if (search) {
		if (/^clm|pcl|rx|claim/i.test(search) || search.includes("-")) {
			query.claim_no = search;
		} else {
			query.cardholder_id = search;
		}
	}

	try {
		const page = await withTimeout(
			vendorCoreApi.listPharmacyClaimRows(query),
			PHARMACY_LIST_TIMEOUT_MS,
			"Pharmacy claim rows list"
		);
		const fileIds = new Set(
			(page.results ?? [])
				.map((r) => r.file_id)
				.filter((id): id is string => Boolean(id))
		);
		const filesPage = await vendorCoreApi
			.listPharmacyClaimFiles({ limit: 50, offset: 0 })
			.catch(() => ({
				results: [] as { id: string; original_filename: string }[],
			}));
		const fileNameById = new Map(
			(filesPage.results ?? [])
				.filter((f) => fileIds.has(f.id))
				.map((f) => [f.id, f.original_filename] as const)
		);
		const items = pharmacyClaimRowListDtosToRows(page.results ?? []).map(
			(row, index) => {
				const fileId = page.results?.[index]?.file_id;
				const fileName = fileId ? fileNameById.get(fileId) : undefined;
				if (!fileName) return row;
				return {
					...row,
					rxReference:
						row.rxReference && row.rxReference !== "—"
							? row.rxReference
							: fileName,
				};
			}
		);
		return {
			items,
			total: page.count ?? items.length,
			kpis: derivePharmacyClaimKpis(items),
			source: "live",
		};
	} catch {
		return {
			items: [],
			total: 0,
			kpis: derivePharmacyClaimKpis([]),
			source: "live",
		};
	}
}

export async function getPharmacyClaim(
	id: string
): Promise<CmsEdgePharmacyClaimDetailView | null> {
	if (isMockEnabled()) {
		const mockMatch = mock.CMS_EDGE_PHARMACY_CLAIMS_LIST.find(
			(row) => row.id === id
		);
		return {
			...mock.CMS_EDGE_PHARMACY_CLAIM_DETAIL,
			id: mockMatch?.id ?? mock.CMS_EDGE_PHARMACY_CLAIM_DETAIL.id,
			claimId:
				mockMatch?.claimId ?? mock.CMS_EDGE_PHARMACY_CLAIM_DETAIL.claimId,
			sourceFileName: "BHP_PHARM_MOCK.dat",
		} as unknown as CmsEdgePharmacyClaimDetailView;
	}

	try {
		const row = await withTimeout(
			vendorCoreApi.getPharmacyClaimRow(id),
			PHARMACY_LIST_TIMEOUT_MS,
			"Pharmacy claim row detail"
		);
		let sourceFileName = "—";
		if (row.file_id) {
			try {
				const file = await vendorCoreApi.getPharmacyClaimFile(row.file_id);
				sourceFileName = file.original_filename || file.reference_id || "—";
			} catch {
				sourceFileName = "—";
			}
		}
		return pharmacyClaimRowDetailDtoToView(row, sourceFileName);
	} catch {
		return null;
	}
}

export type ListMedicalClaimsParams = {
	limit?: number;
	offset?: number;
};

export type ListMedicalClaimsResult = {
	items: CmsEdgeMedicalClaimGroup[];
	total: number;
	kpis: ReturnType<typeof deriveMedicalClaimKpis>;
};

export async function listMedicalClaims(
	params?: ListMedicalClaimsParams
): Promise<ListMedicalClaimsResult> {
	if (isMockEnabled()) {
		const items = medicalMockRowsToGroups(mock.CMS_EDGE_MEDICAL_CLAIMS_LIST);
		return {
			items,
			total: items.length,
			kpis: deriveMedicalClaimKpis(items),
		};
	}

	const page = await vendorCoreApi.listClaimLinesPage({
		limit: Math.min(params?.limit ?? LIST_LIMIT, LIST_LIMIT),
		offset: params?.offset ?? 0,
		order_by: "-created_at",
	});
	const items = claimLineDtosToMedicalClaimGroups(page.results ?? []);
	return {
		items,
		total: page.count ?? items.length,
		kpis: deriveMedicalClaimKpis(items),
	};
}

export async function seedPharmacyClaims(body?: {
	vendor_id?: string;
	count?: number;
	force?: boolean;
}) {
	if (isMockEnabled()) {
		return {
			created: 0,
			skipped: true,
			existing_rows: mock.CMS_EDGE_PHARMACY_CLAIMS_LIST.length,
			source: "mock" as const,
		};
	}

	try {
		const result = await withTimeout(
			vendorCoreApi.seedPharmacyClaimRows(body),
			PHARMACY_LIST_TIMEOUT_MS,
			"Pharmacy claim seed"
		);
		return { ...result, source: "live" as const };
	} catch (err) {
		const missing =
			err instanceof VendorCoreApiError &&
			(err.status === 404 || err.status === 405);
		if (missing) {
			return {
				created: 0,
				skipped: true,
				existing_rows: 0,
				source: "live" as const,
			};
		}
		throw err;
	}
}

export type ListMembersResult = {
	items: CmsEdgeMemberListRow[];
	total: number;
	kpis: ReturnType<typeof deriveMemberEdgeKpis>;
	source: "live" | "mock";
};

export async function listEdgeMembers(params?: {
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<ListMembersResult> {
	if (isMockEnabled()) {
		const items = [...mock.CMS_EDGE_MEMBERS_LIST];
		return {
			items,
			total: items.length,
			kpis: deriveMemberEdgeKpis(items),
			source: "mock",
		};
	}
	try {
		const page = await withTimeout(
			vendorCoreApi.listMembersPage({
				limit: Math.min(params?.limit ?? LIST_LIMIT, LIST_LIMIT),
				offset: params?.offset ?? 0,
				search: params?.search,
				order_by: "-updated_at",
			}),
			PHARMACY_LIST_TIMEOUT_MS,
			"Members list"
		);
		const items = memberListDtosToRows(page.results ?? []);
		const stats = await vendorCoreApi
			.getMemberDashboardStats()
			.catch(() => null);
		return {
			items,
			total: page.count ?? items.length,
			kpis: stats ? memberStatsToEdgeKpis(stats) : deriveMemberEdgeKpis(items),
			source: "live",
		};
	} catch (error) {
		throw error instanceof Error ? error : new Error("Failed to load members");
	}
}

export async function getEdgeMember(
	id: string
): Promise<CmsEdgeMemberDetailView | null> {
	if (isMockEnabled()) {
		return memberMockDetailToView(mock.CMS_EDGE_MEMBER_DETAIL, id);
	}
	try {
		const [
			dto,
			planHistoryPage,
			eligibilityHistoryPage,
			exceptionsPage,
			familyPage,
			sourcePage,
			claimsPage,
			changeEventsPage,
			accumulatorSummary,
		] = await Promise.all([
			withTimeout(
				vendorCoreApi.getMember(id),
				PHARMACY_LIST_TIMEOUT_MS,
				"Member detail"
			),
			vendorCoreApi
				.listMemberPlanHistory(id)
				.catch(() => ({ results: [] as Record<string, unknown>[] })),
			vendorCoreApi
				.listMemberEligibilityHistory(id)
				.catch(() => ({ results: [] as Record<string, unknown>[] })),
			vendorCoreApi
				.listMemberExceptions(id)
				.catch(() => ({ results: [] as Record<string, unknown>[] })),
			vendorCoreApi
				.listMemberFamilyLinks(id)
				.catch(() => ({ results: [] as Record<string, unknown>[] })),
			vendorCoreApi
				.listMemberSourceRecords(id)
				.catch(() => ({ results: [] as Record<string, unknown>[] })),
			vendorCoreApi
				.listMemberClaims(id)
				.catch(() => ({ results: [] as Record<string, unknown>[] })),
			vendorCoreApi
				.listMemberChangeEvents(id)
				.catch(() => ({ results: [] as Record<string, unknown>[] })),
			vendorCoreApi.getMemberAccumulatorSummary(id).catch(() => null),
		]);
		const exceptionRows =
			(exceptionsPage.results?.length
				? exceptionsPage.results
				: (dto.exceptions as Record<string, unknown>[] | undefined)) ?? [];
		return memberDetailDtoToViewEnriched(dto, {
			planHistory: planHistoryPage.results ?? [],
			eligibilityHistory: eligibilityHistoryPage.results ?? [],
			exceptions: exceptionRows,
			familyLinks: familyPage.results ?? [],
			sourceRecords: sourcePage.results ?? [],
			memberClaims: claimsPage.results ?? [],
			changeEvents: changeEventsPage.results ?? [],
			accumulatorSummary:
				(accumulatorSummary as Record<string, unknown> | null) ?? null,
		});
	} catch {
		return null;
	}
}

export async function exportEdgeMembersCsv() {
	return vendorCoreApi.exportMemberListCsv();
}

export async function exportEdgeMemberDetailCsv(memberId: string) {
	return vendorCoreApi.exportMemberDetailCsv(memberId);
}

export async function getEdgeMemberFacets() {
	if (isMockEnabled()) return { plan_name: [] as string[] };
	return vendorCoreApi
		.getMemberFacets()
		.catch(() => ({ plan_name: [] as string[] }));
}

export type ListProvidersResult = {
	items: CmsEdgeProviderListRow[];
	total: number;
	kpis: ReturnType<typeof deriveProviderEdgeKpis>;
	source: "live" | "mock";
};

export async function listEdgeProviders(params?: {
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<ListProvidersResult> {
	if (isMockEnabled()) {
		const items = [...mock.CMS_EDGE_PROVIDERS_LIST];
		return {
			items,
			total: items.length,
			kpis: deriveProviderEdgeKpis(items),
			source: "mock",
		};
	}
	const page = await withTimeout(
		vendorCoreApi.listProvidersPage({
			limit: Math.min(params?.limit ?? LIST_LIMIT, LIST_LIMIT),
			offset: params?.offset ?? 0,
			name: params?.search,
			order_by: "-updated_at",
		}),
		PHARMACY_LIST_TIMEOUT_MS,
		"Providers list"
	);
	const items = providerDtosToRows(page.results ?? []);
	const stats = await vendorCoreApi
		.getProviderDashboardStats()
		.catch(() => null);
	return {
		items,
		total: page.count ?? items.length,
		kpis: stats
			? providerStatsToEdgeKpis(stats)
			: deriveProviderEdgeKpis(items),
		source: "live",
	};
}

export async function exportEdgeProvidersCsv() {
	return vendorCoreApi.exportProviderListCsv();
}

export async function getEdgeProviderFacets() {
	if (isMockEnabled()) return { specialty: [] as string[] };
	return vendorCoreApi
		.getProviderFacets()
		.catch(() => ({ specialty: [] as string[] }));
}

export async function getEdgeProvider(
	id: string
): Promise<CmsEdgeProviderDetailView | null> {
	if (isMockEnabled()) {
		return providerMockDetailToView(mock.CMS_EDGE_PROVIDER_DETAIL, id);
	}
	try {
		const [
			dto,
			profile,
			summary,
			recentClaims,
			exceptionsPage,
			identifiersPage,
			networksPage,
			locationsPage,
			credentialsPage,
			vendorSourcesPage,
		] = await Promise.all([
			withTimeout(
				vendorCoreApi.getProvider(id),
				PHARMACY_LIST_TIMEOUT_MS,
				"Provider detail"
			),
			vendorCoreApi.getProviderProfile(id).catch(() => null),
			vendorCoreApi.getProviderSummary(id).catch(() => null),
			vendorCoreApi
				.listProviderRecentActivity(id, { kind: "claim", limit: 25 })
				.catch(() => []),
			vendorCoreApi.listProviderExceptions(id).catch(() => ({ results: [] })),
			vendorCoreApi.listProviderIdentifiers(id).catch(() => ({ results: [] })),
			vendorCoreApi.listProviderNetworks(id).catch(() => ({ results: [] })),
			vendorCoreApi.listProviderLocations(id).catch(() => ({ results: [] })),
			vendorCoreApi.listProviderCredentials(id).catch(() => ({ results: [] })),
			vendorCoreApi
				.listProviderVendorSources(id)
				.catch(() => ({ results: [] })),
		]);
		return providerDtoToDetailViewEnriched(dto, {
			profile,
			summary,
			recentClaims: recentClaims ?? [],
			exceptions: exceptionsPage.results ?? [],
			identifiers: identifiersPage.results ?? [],
			networks: networksPage.results ?? [],
			locations: locationsPage.results ?? [],
			credentials: credentialsPage.results ?? [],
			vendorSources: vendorSourcesPage.results ?? [],
		});
	} catch {
		return null;
	}
}

export async function getMedicalClaim(
	id: string
): Promise<CmsEdgeMedicalClaimDetailView | null> {
	if (isMockEnabled()) {
		const base = mock.CMS_EDGE_MEDICAL_CLAIM_DETAIL;
		return {
			id: base.id,
			claimId: base.claimId,
			cmsStatus: String(base.cmsStatus),
			transaction: String(base.transaction),
			formType: "Professional",
			summary: base.summary.map((s) => ({
				label: s.label,
				value: s.value,
				icon: s.icon,
			})),
			headerLeft: base.headerLeft.map((f) => ({
				label: f.label,
				value: f.value,
			})),
			headerRight: base.headerRight.map((f) => ({
				label: f.label,
				value: f.value,
			})),
			lines: base.lines.map((l) => ({
				id: l.id,
				line: l.line,
				serviceFrom: l.serviceFrom,
				serviceTo: l.serviceTo,
				revenueCode: l.revenueCode,
				procedureCode: l.procedureCode,
				modifiers: l.modifiers,
				placeOfService: l.placeOfService,
				renderingNpi: l.renderingNpi,
				allowed: l.allowed,
				planPaid: l.planPaid,
				validation: String(l.validation),
			})),
			lineTotals: base.lineTotals,
		};
	}

	try {
		const anchor = await withTimeout(
			vendorCoreApi.getClaimLine(id),
			PHARMACY_LIST_TIMEOUT_MS,
			"Claim line detail"
		);
		const claimRef = anchor.claim_reference_id || anchor.claim_id || anchor.id;
		let siblings: Awaited<
			ReturnType<typeof vendorCoreApi.listClaimLinesPage>
		>["results"] = [];

		try {
			const page = await vendorCoreApi.listClaimLinesPage({
				claim_reference_id: claimRef,
				limit: 100,
			});
			siblings = (page.results ?? []).filter((row) => {
				const sameFile =
					!anchor.vendor_file_id ||
					!row.vendor_file_id ||
					row.vendor_file_id === anchor.vendor_file_id;
				return sameFile;
			});
		} catch {
			const page = await vendorCoreApi.listClaimLines();
			siblings = (page.results ?? []).filter((row) => {
				const ref = row.claim_reference_id || row.claim_id || row.id;
				const sameFile =
					!anchor.vendor_file_id ||
					!row.vendor_file_id ||
					row.vendor_file_id === anchor.vendor_file_id;
				return ref === claimRef && sameFile;
			});
		}

		const view = claimLineDtosToMedicalClaimDetailView(
			siblings.length ? siblings : [anchor]
		);
		if (!view) return null;
		const vendorFileId = view.vendorFileId || anchor.vendor_file_id;
		if (vendorFileId) {
			const file = await vendorCoreApi
				.getClaimVendorFile(vendorFileId)
				.catch(() => null);
			if (file) {
				view.sourceFileName = String(
					file.original_filename ??
						file.reference_id ??
						file.transaction_set_control_number ??
						vendorFileId
				);
			}
		}
		return view;
	} catch {
		return null;
	}
}

export type ListSupplementalDxResult = {
	items: CmsEdgeSupplementalDxRow[];
	total: number;
	kpis: ReturnType<typeof deriveSupplementalDxKpis>;
	source: "live" | "mock";
};

export async function listSupplementalDiagnoses(params?: {
	limit?: number;
	offset?: number;
}): Promise<ListSupplementalDxResult> {
	if (isMockEnabled()) {
		const items = [...mock.CMS_EDGE_SUPPLEMENTAL_DX_LIST];
		return {
			items,
			total: items.length,
			kpis: deriveSupplementalDxKpis(items),
			source: "mock",
		};
	}
	try {
		const [dxPage, claims] = await Promise.all([
			withTimeout(
				vendorCoreApi.listClaimDiagnoses({
					limit: Math.min(params?.limit ?? LIST_LIMIT, LIST_LIMIT),
					offset: params?.offset ?? 0,
				}),
				PHARMACY_LIST_TIMEOUT_MS,
				"Claim diagnoses list"
			),
			listMedicalClaims({ limit: LIST_LIMIT, offset: 0 }).catch(() => ({
				items: [] as CmsEdgeMedicalClaimGroup[],
			})),
		]);
		const known = new Set(claims.items.map((g) => g.claimId).filter(Boolean));
		const items = claimDiagnosisDtosToRows(
			(dxPage.results ?? []).map((r) =>
				normalizeClaimDiagnosis(r as Record<string, unknown>)
			),
			known
		);
		return {
			items,
			total: dxPage.count ?? items.length,
			kpis: deriveSupplementalDxKpis(items),
			source: "live",
		};
	} catch {
		return {
			items: [],
			total: 0,
			kpis: deriveSupplementalDxKpis([]),
			source: "live",
		};
	}
}

export async function getSupplementalDiagnosis(
	id: string
): Promise<CmsEdgeSupplementalDxDetailView | null> {
	if (isMockEnabled()) {
		const base = mock.CMS_EDGE_SUPPLEMENTAL_DX_DETAIL;
		return {
			id: base.id,
			recordId: base.recordId,
			cmsStatus: String(base.cmsStatus),
			transaction: String(base.transaction),
			summary: base.summary.map((s) => ({
				label: s.label,
				value: s.value,
				icon: s.icon,
			})),
			recordInfoLeft: base.recordInfoLeft.map((f) => ({
				label: f.label,
				value: f.value,
			})),
			recordInfoRight: base.recordInfoRight.map((f) => ({
				label: f.label,
				value: f.value,
			})),
		};
	}
	try {
		const raw = await withTimeout(
			vendorCoreApi.getClaimDiagnosis(id),
			PHARMACY_LIST_TIMEOUT_MS,
			"Claim diagnosis detail"
		);
		return claimDiagnosisDtoToDetailView(
			normalizeClaimDiagnosis(raw as Record<string, unknown>)
		);
	} catch {
		return null;
	}
}

export type OverviewEntitySnapshot = {
	id: string;
	title: string;
	description: string;
	icon: "members" | "providers" | "claims";
	stats: {
		label: string;
		value: string;
		tone: "default" | "success" | "danger";
	}[];
	cta: string;
	tabId: "members-enrollment" | "providers" | "claims";
};

/** Compose Overview entity cards from live list counts (KPI strip stays mock). */
export async function getOverviewEntitySnapshot(): Promise<
	OverviewEntitySnapshot[]
> {
	if (isMockEnabled()) {
		return mock.CMS_EDGE_OVERVIEW_ENTITIES.map((e) => ({
			id: e.id,
			title: e.title,
			description: e.description,
			icon: e.icon,
			stats: e.stats.map((s) => ({ ...s })),
			cta: e.cta,
			tabId: e.tabId as OverviewEntitySnapshot["tabId"],
		}));
	}

	const [memberStats, providerStats, medical, pharmacy] = await Promise.all([
		vendorCoreApi.getMemberDashboardStats().catch(() => null),
		vendorCoreApi.getProviderDashboardStats().catch(() => null),
		listMedicalClaims({ limit: LIST_LIMIT }).catch(() => null),
		listPharmacyClaims({ limit: LIST_LIMIT }).catch(() => null),
	]);

	const memberTotal = memberStats?.total ?? 0;
	const memberReady = memberStats?.active ?? 0;
	const memberErrors =
		(memberStats?.pending ?? 0) + (memberStats?.inactive ?? 0);

	const providerTotal = providerStats?.total ?? 0;
	const providerValid = providerStats?.active ?? 0;
	const providerInvalid =
		(providerStats?.pending ?? 0) + (providerStats?.termed ?? 0);

	const medicalTotal = medical?.total ?? 0;
	const pharmacyTotal = pharmacy?.total ?? 0;
	const claimErrors =
		(medical?.items.filter((g) => g.cmsStatus === "Error").length ?? 0) +
		(pharmacy?.items.filter((r) => r.cmsStatus === "Error").length ?? 0);

	return [
		{
			id: "members",
			title: "Members & Enrollment",
			description: "Enrollment records and coverage periods",
			icon: "members",
			stats: [
				{
					label: "Total Records",
					value: memberTotal.toLocaleString("en-US"),
					tone: "default",
				},
				{
					label: "Active",
					value: memberReady.toLocaleString("en-US"),
					tone: "success",
				},
				{
					label: "Pending / Inactive",
					value: memberErrors.toLocaleString("en-US"),
					tone: "danger",
				},
			],
			cta: "View Members",
			tabId: "members-enrollment",
		},
		{
			id: "providers",
			title: "Providers",
			description: "Billing, rendering, and dispensing identifiers",
			icon: "providers",
			stats: [
				{
					label: "Total Providers",
					value: providerTotal.toLocaleString("en-US"),
					tone: "default",
				},
				{
					label: "Active",
					value: providerValid.toLocaleString("en-US"),
					tone: "success",
				},
				{
					label: "Pending / Termed",
					value: providerInvalid.toLocaleString("en-US"),
					tone: "danger",
				},
			],
			cta: "View Providers",
			tabId: "providers",
		},
		{
			id: "claims",
			title: "Claims",
			description: "Medical, pharmacy, and supplemental diagnosis records",
			icon: "claims",
			stats: [
				{
					label: "Medical",
					value: medicalTotal.toLocaleString("en-US"),
					tone: "default",
				},
				{
					label: "Pharmacy",
					value: pharmacyTotal.toLocaleString("en-US"),
					tone: "default",
				},
				{
					label: "Claim Errors",
					value: claimErrors.toLocaleString("en-US"),
					tone: "danger",
				},
			],
			cta: "View Claims",
			tabId: "claims",
		},
	];
}

export type OverviewExceptionRow = {
	id: string;
	type: string;
	count: number;
	severity: "High" | "Medium";
	owner: string;
};

export type OverviewActivityRow = {
	id: string;
	activity: string;
	fileType: string;
	environment: string;
	status: "Completed" | "In Progress";
	date: string;
	owner: string;
};

export type OverviewLivePanels = {
	exceptions: OverviewExceptionRow[];
	activity: OverviewActivityRow[];
};

function formatOverviewDate(value: unknown): string {
	if (value == null || value === "") return "—";
	const d = new Date(String(value));
	if (Number.isNaN(d.getTime())) return String(value);
	return d.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function mapExceptionSeverity(raw: unknown): "High" | "Medium" {
	const s = String(raw ?? "").toLowerCase();
	if (s.includes("high") || s.includes("crit") || s.includes("error")) {
		return "High";
	}
	return "Medium";
}

function mapActivityStatus(raw: unknown): "Completed" | "In Progress" {
	const s = String(raw ?? "").toLowerCase();
	if (
		s.includes("progress") ||
		s.includes("pend") ||
		s.includes("process") ||
		s.includes("open")
	) {
		return "In Progress";
	}
	return "Completed";
}

/** Prefer CMS EDGE overview activity + exceptions APIs. */
export async function getOverviewLivePanels(): Promise<OverviewLivePanels> {
	if (isMockEnabled()) {
		return {
			exceptions: mock.CMS_EDGE_OVERVIEW_EXCEPTIONS.map((r) => ({ ...r })),
			activity: mock.CMS_EDGE_OVERVIEW_ACTIVITY.map((r) => ({ ...r })),
		};
	}

	const [exceptionsPage, activityPage] = await Promise.all([
		vendorCoreApi
			.listCmsEdgeOverviewExceptions({ limit: 50, offset: 0 })
			.catch(() => null),
		vendorCoreApi
			.listCmsEdgeOverviewActivity({ limit: 20, offset: 0 })
			.catch(() => null),
	]);

	if (exceptionsPage || activityPage) {
		return {
			exceptions: (exceptionsPage?.results ?? []).map((row) => ({
				id: row.id,
				type: row.exception_type || "Exception",
				count: row.count ?? 0,
				severity: mapExceptionSeverity(row.severity),
				owner: row.owner || "—",
			})),
			activity: (activityPage?.results ?? []).map((row) => ({
				id: row.id,
				activity: row.event_type || "Activity",
				fileType: row.file_name || "—",
				environment: row.environment || "—",
				status: mapActivityStatus(row.status),
				date: formatOverviewDate(row.occurred_at),
				owner: row.owner || "—",
			})),
		};
	}

	return { exceptions: [], activity: [] };
}

export type OverviewKpiLive = {
	id: string;
	label: string;
	value: string;
	hint: string;
	tone: string;
	valueClassName: string;
	hintClassName: string;
	icon: (typeof mock.CMS_EDGE_OVERVIEW_KPI_CARDS)[number]["icon"];
};

export type OverviewWorkflowLive = {
	id: string;
	label: string;
	status: string;
	state: mock.OverviewWorkflowState;
	icon: (typeof mock.CMS_EDGE_OVERVIEW_WORKFLOW)[number]["icon"];
};

export type OverviewConfigLive = {
	id: string;
	label: string;
	value: string;
	icon: (typeof mock.CMS_EDGE_OVERVIEW_CONFIG)[number]["icon"];
};

export type OverviewShell = {
	kpis: OverviewKpiLive[];
	workflow: OverviewWorkflowLive[];
	config: OverviewConfigLive[];
};

const WORKFLOW_ICON_BY_KEY: Record<
	string,
	(typeof mock.CMS_EDGE_OVERVIEW_WORKFLOW)[number]["icon"]
> = {
	source: "database",
	source_data: "database",
	validation: "shieldCheck",
	cms_validation: "shieldCheck",
	generation: "fileUp",
	file_generation: "fileUp",
	submission: "send",
	response: "mail",
	cms_response: "mail",
	reconciliation: "scale",
};

function mapWorkflowState(raw: string): mock.OverviewWorkflowState {
	const s = raw.toLowerCase();
	if (s.includes("complete") || s.includes("done") || s.includes("accept"))
		return "completed";
	if (s.includes("progress") || s.includes("active") || s.includes("generat"))
		return "in_progress";
	return "pending";
}

export async function getOverviewShell(): Promise<OverviewShell> {
	if (isMockEnabled()) {
		return {
			kpis: mock.CMS_EDGE_OVERVIEW_KPI_CARDS.map((k) => ({ ...k })),
			workflow: mock.CMS_EDGE_OVERVIEW_WORKFLOW.map((s) => ({ ...s })),
			config: mock.CMS_EDGE_OVERVIEW_CONFIG.map((c) => ({ ...c })),
		};
	}

	const [stats, workflow, settings, periods] = await Promise.all([
		vendorCoreApi.getCmsEdgeOverviewStats().catch(() => null),
		vendorCoreApi.getCmsEdgeOverviewWorkflow().catch(() => null),
		vendorCoreApi.getCmsEdgeSettings().catch(() => null),
		vendorCoreApi
			.listCmsEdgeReportingPeriods({ limit: 20, offset: 0 })
			.catch(() => null),
	]);

	const currentPeriod =
		periods?.results?.find((p) => p.is_current) ?? periods?.results?.[0];
	const periodLabel =
		stats?.reporting_period ||
		settings?.current_reporting_period ||
		currentPeriod?.label ||
		currentPeriod?.code ||
		"—";

	const readiness = stats?.data_readiness_pct;
	const kpis: OverviewKpiLive[] = [
		{
			id: "period",
			label: "Reporting Period",
			value: periodLabel,
			hint:
				currentPeriod?.start_date && currentPeriod?.end_date
					? `${currentPeriod.start_date} – ${currentPeriod.end_date}`
					: "CMS EDGE reporting period",
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "",
			hintClassName: "",
			icon: "calendar",
		},
		{
			id: "readiness",
			label: "Data Readiness",
			value: readiness == null ? "—" : `${Number(readiness).toFixed(1)}%`,
			hint:
				readiness == null ? "Unavailable" : readiness >= 95 ? "High" : "Review",
			tone: "text-emerald-700 bg-emerald-500/10",
			valueClassName: "",
			hintClassName:
				readiness != null && readiness >= 95
					? "font-semibold text-emerald-700"
					: "",
			icon: "pie",
		},
		{
			id: "files-required",
			label: "Files Required",
			value: stats ? String(stats.files_required) : "—",
			hint: "Submission Files",
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "",
			hintClassName: "",
			icon: "file",
		},
		{
			id: "files-generated",
			label: "Files Generated",
			value: stats ? String(stats.files_generated) : "—",
			hint: "EDGE packages",
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "",
			hintClassName: "",
			icon: "fileOut",
		},
		{
			id: "submission",
			label: "Submission Status",
			value: stats?.submission_status || "—",
			hint: "Current cycle",
			tone: "text-amber-700 bg-amber-500/10",
			valueClassName: "",
			hintClassName: "",
			icon: "send",
		},
		{
			id: "errors",
			label: "Critical Errors",
			value: stats ? String(stats.critical_errors) : "—",
			hint: "Blocking issues",
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "",
			hintClassName: "",
			icon: "shield",
		},
		{
			id: "recon",
			label: "Reconciliation",
			value:
				stats == null ? "—" : `${Number(stats.reconciliation_pct).toFixed(1)}%`,
			hint: "Accepted packages",
			tone: "text-emerald-700 bg-emerald-500/10",
			valueClassName: "",
			hintClassName: "",
			icon: "hourglass",
		},
	];

	const workflowStages: OverviewWorkflowLive[] = (workflow?.stages ?? []).map(
		(stage, index) => {
			const key = stage.key.toLowerCase();
			const icon =
				WORKFLOW_ICON_BY_KEY[key] ??
				mock.CMS_EDGE_OVERVIEW_WORKFLOW[
					index % mock.CMS_EDGE_OVERVIEW_WORKFLOW.length
				]?.icon ??
				"database";
			const state = mapWorkflowState(stage.status);
			return {
				id: stage.key || `stage-${index}`,
				label: stage.label,
				status:
					state === "completed"
						? "Completed"
						: state === "in_progress"
							? "In Progress"
							: "Pending",
				state,
				icon,
			};
		}
	);

	const enabledTypes = [
		settings?.medical_enabled ? "Medical" : null,
		settings?.pharmacy_enabled ? "Pharmacy" : null,
		settings?.enrollment_enabled ? "Enrollment" : null,
		settings?.sdr_enabled ? "SDR" : null,
	].filter(Boolean);

	const config: OverviewConfigLive[] = [
		{
			id: "hios",
			label: "HIOS Issuer ID",
			value: settings?.hios_issuer_id || "—",
			icon: "hash",
		},
		{
			id: "zone",
			label: "Execution Zone",
			value: settings?.environment || "—",
			icon: "globe",
		},
		{
			id: "year",
			label: "Reporting Period",
			value: periodLabel,
			icon: "calendar",
		},
		{
			id: "plans",
			label: "Enabled File Types",
			value: enabledTypes.length ? String(enabledTypes.length) : "—",
			icon: "list",
		},
	];

	return { kpis, workflow: workflowStages, config };
}

async function resolveClaimHeaderId(opts: {
	claimReferenceId?: string | null;
	vendorFileId?: string | null;
}): Promise<string | null> {
	const claim_reference_id = opts.claimReferenceId?.trim();
	if (!claim_reference_id) return null;
	const page = await vendorCoreApi.listClaimHeaders({
		claim_reference_id,
		vendor_file_id: opts.vendorFileId?.trim() || undefined,
		limit: 5,
		offset: 0,
	});
	return page.results?.[0]?.id ?? null;
}

export async function voidMedicalClaimHeader(opts: {
	claimReferenceId?: string | null;
	vendorFileId?: string | null;
}): Promise<void> {
	if (isMockEnabled()) return;
	const headerId = await resolveClaimHeaderId(opts);
	if (!headerId) {
		throw new Error(
			"No claim header found for this claim reference — cannot void."
		);
	}
	await vendorCoreApi.voidClaimHeader(headerId);
}

export async function replaceMedicalClaimHeader(opts: {
	claimReferenceId?: string | null;
	vendorFileId?: string | null;
}): Promise<void> {
	if (isMockEnabled()) return;
	const headerId = await resolveClaimHeaderId(opts);
	if (!headerId) {
		throw new Error(
			"No claim header found for this claim reference — cannot replace."
		);
	}
	await vendorCoreApi.replaceClaimHeader(headerId);
}

export async function voidPharmacyClaim(rowId: string): Promise<void> {
	if (isMockEnabled()) return;
	await vendorCoreApi.voidPharmacyClaimRow(rowId);
}

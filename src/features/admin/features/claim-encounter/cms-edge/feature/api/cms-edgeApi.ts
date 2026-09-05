/** CMS EDGE reporting live reads + pharmacy / medical claim live reads. */
import { isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import { isVendorCoreLive } from "@/lib/vendor-core/client";
import type { PharmacyClaimRowListQuery } from "@/lib/vendor-core/types";
import {
	fetchCmsEdgeAdjustments,
	fetchCmsEdgeCorrections,
	fetchCmsEdgeException,
	fetchCmsEdgeExceptions,
	fetchCmsEdgeOverview,
	fetchCmsEdgeReconciliation,
	fetchCmsEdgeReconciliationOverview,
	fetchCmsEdgeReconciliations,
	fetchCmsEdgeResponse,
	fetchCmsEdgeResponses,
	fetchCmsEdgeSubmission,
	fetchCmsEdgeSubmissions,
	fetchCmsEdgeValidation,
	fetchCmsEdgeValidations,
} from "@/lib/vendor-reporting/cms-edge";

import {
	type CmsEdgeMedicalClaimGroup,
	claimLineDtosToMedicalClaimGroups,
	deriveMedicalClaimKpis,
	medicalMockRowsToGroups,
} from "../../live-medical-claims";
import {
	type CmsEdgePharmacyClaimDetailView,
	derivePharmacyClaimKpis,
	pharmacyClaimRowDetailDtoToView,
	pharmacyClaimRowListDtosToRows,
} from "../../live-pharmacy-claims";
import * as mock from "../../mock-data";
import type {
	CmsEdgeExceptionDetail,
	CmsEdgePharmacyClaimRow,
	CmsEdgeReconciliationDetail,
	CmsEdgeResponseDetail,
	CmsEdgeSubmissionDetail,
	CmsResponseRow,
	CorrectionRow,
	ExceptionRow,
	ReconciliationDatasetRow,
	SubmissionHistoryRow,
	VoidReplacementRow,
} from "../../mock-data";
import {
	buildCorrectionQueueCounts,
	buildExceptionKpis,
	buildReconKpisFromRows,
	buildReportingOverviewDashboard,
	mapEdgeAdjustmentToVoidRow,
	mapEdgeCorrectionToRow,
	mapEdgeExceptionToDetail,
	mapEdgeExceptionToRow,
	mapEdgeReconciliationToDetail,
	mapEdgeReconciliationToRow,
	mapEdgeResponseToDetail,
	mapEdgeResponseToRow,
	mapEdgeSubmissionToDetail,
	mapEdgeSubmissionToHistoryRow,
	mapOverviewKpis,
	mapReconciliationOverviewKpis,
	mapUiSeverityToApi,
	mapUiStatusToApi,
	periodLabelToApiParam,
} from "../mappers/cms-edgeLiveMappers";

function isLiveReportingEnabled() {
	return !isMockEnabled() && isVendorCoreLive();
}

export async function listAuditRequests() {
	if (isMockEnabled()) return mock.CMS_EDGE_AUDIT_REQUESTS;
	return [];
}

export async function listAuditReports() {
	if (isMockEnabled()) return mock.CMS_EDGE_AUDIT_REPORTS;
	return [];
}

export async function listDocumentLibrary() {
	if (isMockEnabled()) return mock.CMS_EDGE_DOCUMENT_LIBRARY;
	return [];
}

export async function listSubmissionHistory(filters?: {
	reportingPeriod?: string;
	environment?: string;
	status?: mock.SubmissionStatus;
	fileType?: mock.SubmissionFileType;
}): Promise<SubmissionHistoryRow[]> {
	if (isMockEnabled()) {
		const periodLabel = filters?.reportingPeriod
			? normalizePeriodLabelForMock(filters.reportingPeriod)
			: null;
		return mock.CMS_EDGE_SUBMISSION_HISTORY.filter((row) => {
			if (periodLabel && row.reportingPeriod !== periodLabel) return false;
			if (
				filters?.environment &&
				filters.environment !== "all" &&
				row.environment !== filters.environment
			) {
				return false;
			}
			if (filters?.fileType && row.fileType !== filters.fileType) return false;
			if (filters?.status && row.status !== filters.status) return false;
			return true;
		});
	}
	if (!isLiveReportingEnabled()) return [];

	const apiStatus = filters?.status
		? mapUiStatusToApi(filters.status)
		: undefined;
	const rows = await fetchCmsEdgeSubmissions({
		reportingPeriod: filters?.reportingPeriod
			? periodLabelToApiParam(filters.reportingPeriod)
			: undefined,
		environment:
			filters?.environment && filters.environment !== "all"
				? filters.environment
				: undefined,
		status: apiStatus,
	});

	let mapped = rows.map(mapEdgeSubmissionToHistoryRow);
	if (filters?.fileType) {
		mapped = mapped.filter((row) => row.fileType === filters.fileType);
	}
	return mapped;
}

function normalizePeriodLabelForMock(period: string): string {
	const slugMatch = /^q([1-4])-(\d{4})$/i.exec(period.trim());
	if (slugMatch) return `Q${slugMatch[1]} ${slugMatch[2]}`;
	return period.trim();
}

export async function getSubmissionDetail(
	id: string
): Promise<CmsEdgeSubmissionDetail | null> {
	if (isMockEnabled()) return mock.getCmsEdgeSubmissionDetail(id);
	if (!isLiveReportingEnabled()) return null;
	try {
		const dto = await fetchCmsEdgeSubmission(id);
		return mapEdgeSubmissionToDetail(dto);
	} catch {
		return null;
	}
}

export async function listCmsResponses(filters?: {
	reportingPeriod?: string;
	status?: mock.CmsResponseStatus;
	fileType?: mock.CmsResponseFileType;
	responseType?: mock.CmsResponseType;
}): Promise<CmsResponseRow[]> {
	if (isMockEnabled()) {
		const periodLabel = filters?.reportingPeriod
			? normalizePeriodLabelForMock(filters.reportingPeriod)
			: null;
		return mock.CMS_EDGE_RESPONSES_LIST.filter((row) => {
			if (periodLabel && row.reportingPeriod !== periodLabel) return false;
			if (filters?.fileType && row.fileType !== filters.fileType) return false;
			if (filters?.responseType && row.responseType !== filters.responseType) {
				return false;
			}
			if (filters?.status && row.status !== filters.status) return false;
			return true;
		});
	}
	if (!isLiveReportingEnabled()) return [];

	const [responses, submissions] = await Promise.all([
		fetchCmsEdgeResponses({
			reportingPeriod: filters?.reportingPeriod
				? periodLabelToApiParam(filters.reportingPeriod)
				: undefined,
			status: filters?.status,
		}),
		fetchCmsEdgeSubmissions({
			reportingPeriod: filters?.reportingPeriod
				? periodLabelToApiParam(filters.reportingPeriod)
				: undefined,
		}),
	]);

	const byId = new Map(submissions.map((item) => [item.id, item]));
	let mapped = responses.map((dto) =>
		mapEdgeResponseToRow(dto, byId.get(dto.submissionId) ?? null)
	);
	if (filters?.status) {
		mapped = mapped.filter((row) => row.status === filters.status);
	}
	if (filters?.fileType) {
		mapped = mapped.filter((row) => row.fileType === filters.fileType);
	}
	if (filters?.responseType) {
		mapped = mapped.filter((row) => row.responseType === filters.responseType);
	}
	return mapped;
}

export async function getResponseDetail(
	id: string
): Promise<CmsEdgeResponseDetail | null> {
	if (isMockEnabled()) return mock.getCmsEdgeResponseDetail(id);
	if (!isLiveReportingEnabled()) return null;
	try {
		const dto = await fetchCmsEdgeResponse(id);
		let submission = null;
		try {
			submission = await fetchCmsEdgeSubmission(dto.submissionId);
		} catch {
			submission = null;
		}
		return mapEdgeResponseToDetail(dto, submission);
	} catch {
		return null;
	}
}

export async function getCmsEdgeReportingOverview(reportingPeriod?: string) {
	const periodLabel = reportingPeriod
		? normalizePeriodLabelForMock(reportingPeriod)
		: "Q2 2027";

	if (isMockEnabled()) {
		return {
			kpis: mock.CMS_EDGE_SUBMISSION_KPIS,
			health: mock.CMS_EDGE_REPORTING_OVERVIEW_HEALTH,
			cards: mock.CMS_EDGE_REPORTING_OVERVIEW_KPIS,
			pipeline: mock.CMS_EDGE_REPORTING_OVERVIEW_PIPELINE,
			attention: mock.CMS_EDGE_REPORTING_OVERVIEW_ATTENTION,
			activity: mock.CMS_EDGE_REPORTING_OVERVIEW_ACTIVITY,
			tabBadges: mock.CMS_EDGE_REPORTING_TAB_BADGES,
			source: "mock" as const,
		};
	}

	const emptyDashboard = {
		kpis: { total: 0, accepted: 0, inProgress: 0, failed: 0, records: 0 },
		health: {
			...mock.CMS_EDGE_REPORTING_OVERVIEW_HEALTH,
			acceptanceRate: 0,
			status: "No Data",
			lastSync: "—",
			deadlineLabel: `${periodLabel} EDGE due Jul 15`,
		},
		cards: mock.CMS_EDGE_REPORTING_OVERVIEW_KPIS.map((card) => ({
			...card,
			value: 0,
			hint: "No live data",
			delta: "—",
			deltaTone: "neutral" as const,
		})),
		pipeline: mock.CMS_EDGE_REPORTING_OVERVIEW_PIPELINE.map((step) => ({
			...step,
			detail: "Awaiting data",
			state: "pending" as const,
		})),
		attention: [] as typeof mock.CMS_EDGE_REPORTING_OVERVIEW_ATTENTION,
		activity: [] as typeof mock.CMS_EDGE_REPORTING_OVERVIEW_ACTIVITY,
		tabBadges: {
			exceptions: 0,
			reconciliation: 0,
		} as typeof mock.CMS_EDGE_REPORTING_TAB_BADGES,
		source: "empty" as const,
	};

	if (!isLiveReportingEnabled()) return emptyDashboard;

	const period = reportingPeriod
		? periodLabelToApiParam(reportingPeriod)
		: undefined;

	const [dto, responses, exceptions, reconOverview] = await Promise.all([
		fetchCmsEdgeOverview(period),
		fetchCmsEdgeResponses(),
		listExceptions({ reportingPeriod }),
		fetchCmsEdgeReconciliationOverview({
			reportingPeriod: period,
			environment: "Production",
		}).catch(() => null),
	]);

	const reconKpis = reconOverview
		? mapReconciliationOverviewKpis(reconOverview)
		: { sourceRecords: 0, submitted: 0, cmsAccepted: 0, variance: 0 };

	const dashboard = buildReportingOverviewDashboard({
		overview: dto,
		responses,
		exceptions,
		reconKpis,
		periodLabel,
	});

	const reconAttention =
		reconOverview?.statusMix
			?.filter((item) => item.name !== "Balanced")
			.reduce((sum, item) => sum + (item.value ?? 0), 0) ??
		(reconKpis.variance > 0 ? 1 : 0);

	return {
		kpis: mapOverviewKpis(dto),
		overview: dto,
		...dashboard,
		tabBadges: {
			submissions: dashboard.cards.find((card) => card.id === "submissions")
				?.value,
			"cms-responses": dashboard.cards.find(
				(card) => card.id === "cms-responses"
			)?.value,
			exceptions: dashboard.cards.find((card) => card.id === "exceptions")
				?.value,
			reconciliation: reconAttention,
		},
		source: "live" as const,
	};
}

export async function listExceptions(filters?: {
	reportingPeriod?: string;
	status?: mock.ExceptionStatus;
	severity?: mock.ExceptionSeverity;
	dataset?: mock.ExceptionDataset;
	errorType?: mock.ExceptionErrorType;
}): Promise<ExceptionRow[]> {
	if (isMockEnabled()) {
		const periodLabel = filters?.reportingPeriod
			? normalizePeriodLabelForMock(filters.reportingPeriod)
			: null;
		return mock.CMS_EDGE_EXCEPTIONS_LIST.filter((row) => {
			if (periodLabel && row.reportingPeriod !== periodLabel) return false;
			if (filters?.status && row.status !== filters.status) return false;
			if (filters?.severity && row.severity !== filters.severity) return false;
			if (filters?.dataset && row.dataset !== filters.dataset) return false;
			if (filters?.errorType && row.errorType !== filters.errorType)
				return false;
			return true;
		});
	}
	if (!isLiveReportingEnabled()) return [];

	const period = filters?.reportingPeriod
		? periodLabelToApiParam(filters.reportingPeriod)
		: undefined;
	const apiSeverity = filters?.severity
		? mapUiSeverityToApi(filters.severity)
		: undefined;

	const [exceptions, validations, corrections] = await Promise.all([
		fetchCmsEdgeExceptions({
			status: filters?.status,
			severity: apiSeverity,
		}),
		fetchCmsEdgeValidations({ reportingPeriod: period }),
		fetchCmsEdgeCorrections({ reportingPeriod: period }),
	]);

	const validationById = new Map(validations.map((item) => [item.id, item]));
	const correctionByException = new Map<string, (typeof corrections)[number]>();
	for (const correction of corrections) {
		if (!correction.exceptionId) continue;
		if (!correctionByException.has(correction.exceptionId)) {
			correctionByException.set(correction.exceptionId, correction);
		}
	}

	const periodValidationIds = period
		? new Set(validations.map((item) => item.id))
		: null;

	let mapped = exceptions
		.filter((dto) =>
			periodValidationIds ? periodValidationIds.has(dto.validationId) : true
		)
		.map((dto) =>
			mapEdgeExceptionToRow(
				dto,
				validationById.get(dto.validationId) ?? null,
				correctionByException.get(dto.id) ?? null
			)
		);

	if (filters?.status) {
		mapped = mapped.filter((row) => row.status === filters.status);
	}
	if (filters?.severity) {
		mapped = mapped.filter((row) => row.severity === filters.severity);
	}
	if (filters?.dataset) {
		mapped = mapped.filter((row) => row.dataset === filters.dataset);
	}
	if (filters?.errorType) {
		mapped = mapped.filter((row) => row.errorType === filters.errorType);
	}
	return mapped;
}

export async function listCorrections(filters?: {
	reportingPeriod?: string;
	dataset?: mock.ExceptionDataset;
}): Promise<CorrectionRow[]> {
	if (isMockEnabled()) {
		const periodLabel = filters?.reportingPeriod
			? normalizePeriodLabelForMock(filters.reportingPeriod)
			: null;
		return mock.CMS_EDGE_CORRECTIONS_LIST.filter((row) => {
			if (periodLabel && row.reportingPeriod !== periodLabel) return false;
			if (filters?.dataset && row.dataset !== filters.dataset) return false;
			return true;
		});
	}
	if (!isLiveReportingEnabled()) return [];

	const rows = await fetchCmsEdgeCorrections({
		reportingPeriod: filters?.reportingPeriod
			? periodLabelToApiParam(filters.reportingPeriod)
			: undefined,
		dataset: filters?.dataset,
	});
	let mapped = rows.map(mapEdgeCorrectionToRow);
	if (filters?.dataset) {
		mapped = mapped.filter((row) => row.dataset === filters.dataset);
	}
	return mapped;
}

export async function listVoidReplacements(filters?: {
	reportingPeriod?: string;
	dataset?: mock.ExceptionDataset;
}): Promise<VoidReplacementRow[]> {
	if (isMockEnabled()) {
		const periodLabel = filters?.reportingPeriod
			? normalizePeriodLabelForMock(filters.reportingPeriod)
			: null;
		return mock.CMS_EDGE_VOID_REPLACEMENTS_LIST.filter((row) => {
			if (periodLabel && row.reportingPeriod !== periodLabel) return false;
			if (filters?.dataset && row.dataset !== filters.dataset) return false;
			return true;
		});
	}
	if (!isLiveReportingEnabled()) return [];

	const rows = await fetchCmsEdgeAdjustments({
		reportingPeriod: filters?.reportingPeriod
			? periodLabelToApiParam(filters.reportingPeriod)
			: undefined,
		dataset: filters?.dataset,
	});
	let mapped = rows.map(mapEdgeAdjustmentToVoidRow);
	if (filters?.dataset) {
		mapped = mapped.filter((row) => row.dataset === filters.dataset);
	}
	return mapped;
}

export async function getExceptionWorkbench(filters?: {
	reportingPeriod?: string;
	status?: mock.ExceptionStatus;
	severity?: mock.ExceptionSeverity;
	dataset?: mock.ExceptionDataset;
	errorType?: mock.ExceptionErrorType;
}) {
	const [allExceptions, corrections, voids] = await Promise.all([
		listExceptions({
			reportingPeriod: filters?.reportingPeriod,
			dataset: filters?.dataset,
		}),
		listCorrections({
			reportingPeriod: filters?.reportingPeriod,
			dataset: filters?.dataset,
		}),
		listVoidReplacements({
			reportingPeriod: filters?.reportingPeriod,
			dataset: filters?.dataset,
		}),
	]);

	let exceptions = allExceptions;
	if (filters?.status) {
		exceptions = exceptions.filter((row) => row.status === filters.status);
	}
	if (filters?.severity) {
		exceptions = exceptions.filter((row) => row.severity === filters.severity);
	}
	if (filters?.errorType) {
		exceptions = exceptions.filter(
			(row) => row.errorType === filters.errorType
		);
	}

	return {
		exceptions,
		corrections,
		voids,
		kpis: buildExceptionKpis(allExceptions, corrections),
		correctionQueue: buildCorrectionQueueCounts(corrections),
	};
}

export async function getExceptionDetail(
	id: string
): Promise<CmsEdgeExceptionDetail | null> {
	if (isMockEnabled()) return mock.getCmsEdgeExceptionDetail(id);
	if (!isLiveReportingEnabled()) return null;
	try {
		const dto = await fetchCmsEdgeException(id);
		let validation = null;
		try {
			validation = await fetchCmsEdgeValidation(dto.validationId);
		} catch {
			validation = null;
		}
		let submission = null;
		if (validation?.submissionId) {
			try {
				submission = await fetchCmsEdgeSubmission(validation.submissionId);
			} catch {
				submission = null;
			}
		}
		const period = validation?.reportingPeriod;
		const [corrections, adjustments] = await Promise.all([
			fetchCmsEdgeCorrections(period ? { reportingPeriod: period } : undefined),
			fetchCmsEdgeAdjustments(period ? { reportingPeriod: period } : undefined),
		]);
		return mapEdgeExceptionToDetail(dto, {
			validation,
			submission,
			corrections,
			adjustments,
		});
	} catch {
		return null;
	}
}

export async function listReconciliations(filters?: {
	reportingPeriod?: string;
	environment?: mock.ReconciliationEnvironment | "all";
	status?: mock.ReconciliationStatus;
	dataset?: string;
}): Promise<ReconciliationDatasetRow[]> {
	if (isMockEnabled()) {
		const periodLabel = filters?.reportingPeriod
			? normalizePeriodLabelForMock(filters.reportingPeriod)
			: null;
		return mock.CMS_EDGE_RECON_DATASETS.filter((row) => {
			if (periodLabel && row.reportingPeriod !== periodLabel) return false;
			if (
				filters?.environment &&
				filters.environment !== "all" &&
				row.environment !== filters.environment
			) {
				return false;
			}
			if (filters?.status && row.status !== filters.status) return false;
			if (filters?.dataset && row.dataset !== filters.dataset) return false;
			return true;
		});
	}
	if (!isLiveReportingEnabled()) return [];

	const rows = await fetchCmsEdgeReconciliations({
		reportingPeriod: filters?.reportingPeriod
			? periodLabelToApiParam(filters.reportingPeriod)
			: undefined,
		environment:
			filters?.environment && filters.environment !== "all"
				? filters.environment
				: undefined,
		status: filters?.status,
		dataset: filters?.dataset,
	});
	return rows.map(mapEdgeReconciliationToRow);
}

export async function getReconciliationWorkbench(filters?: {
	reportingPeriod?: string;
	environment?: mock.ReconciliationEnvironment | "all";
}) {
	const rows = await listReconciliations({
		reportingPeriod: filters?.reportingPeriod,
		environment: filters?.environment,
	});

	if (isMockEnabled()) {
		return { rows, kpis: mock.CMS_EDGE_RECON_KPIS };
	}

	if (!isLiveReportingEnabled()) {
		return { rows, kpis: buildReconKpisFromRows(rows) };
	}

	try {
		const overview = await fetchCmsEdgeReconciliationOverview({
			reportingPeriod: filters?.reportingPeriod
				? periodLabelToApiParam(filters.reportingPeriod)
				: undefined,
			environment:
				filters?.environment && filters.environment !== "all"
					? filters.environment
					: undefined,
		});
		return { rows, kpis: mapReconciliationOverviewKpis(overview) };
	} catch {
		return { rows, kpis: buildReconKpisFromRows(rows) };
	}
}

export async function getReconciliationDetail(
	id: string
): Promise<CmsEdgeReconciliationDetail | null> {
	if (isMockEnabled()) return mock.getCmsEdgeReconciliationDetail(id);
	if (!isLiveReportingEnabled()) return null;
	try {
		const dto = await fetchCmsEdgeReconciliation(id);
		return mapEdgeReconciliationToDetail(dto);
	} catch {
		return null;
	}
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
};

export async function listPharmacyClaims(
	params: ListPharmacyClaimsParams = {}
): Promise<ListPharmacyClaimsResult> {
	if (isMockEnabled()) {
		const items = [...mock.CMS_EDGE_PHARMACY_CLAIMS_LIST];
		return {
			items,
			total: items.length,
			kpis: derivePharmacyClaimKpis(items),
		};
	}

	const query: PharmacyClaimRowListQuery = {
		limit: params.limit ?? 100,
		offset: params.offset ?? 0,
		ordering: "-created_at",
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

	const page = await vendorCoreApi.listPharmacyClaimRows(query);
	const items = pharmacyClaimRowListDtosToRows(page.results ?? []);
	return {
		items,
		total: page.count ?? items.length,
		kpis: derivePharmacyClaimKpis(items),
	};
}

export async function getPharmacyClaim(
	id: string
): Promise<CmsEdgePharmacyClaimDetailView | null> {
	if (isMockEnabled()) {
		const base = mock.CMS_EDGE_PHARMACY_CLAIM_DETAIL;
		const match = mock.CMS_EDGE_PHARMACY_CLAIMS_LIST.find(
			(row) => row.id === id
		);
		return {
			...base,
			id: match?.id ?? base.id,
			claimId: match?.claimId ?? base.claimId,
			sourceFileName: "BHP_PHARM_MOCK.dat",
		} as unknown as CmsEdgePharmacyClaimDetailView;
	}

	const row = await vendorCoreApi.getPharmacyClaimRow(id);
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
}

export type ListMedicalClaimsResult = {
	items: CmsEdgeMedicalClaimGroup[];
	total: number;
	kpis: ReturnType<typeof deriveMedicalClaimKpis>;
};

export async function listMedicalClaims(): Promise<ListMedicalClaimsResult> {
	if (isMockEnabled()) {
		const items = medicalMockRowsToGroups(mock.CMS_EDGE_MEDICAL_CLAIMS_LIST);
		return {
			items,
			total: items.length,
			kpis: deriveMedicalClaimKpis(items),
		};
	}

	const page = await vendorCoreApi.listClaimLines();
	const items = claimLineDtosToMedicalClaimGroups(page.results ?? []);
	return {
		items,
		total: items.length,
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
		};
	}
	return vendorCoreApi.seedPharmacyClaimRows(body);
}

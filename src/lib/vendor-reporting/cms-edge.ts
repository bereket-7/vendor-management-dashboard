/**
 * CMS EDGE endpoints on vendor-reporting (same gateway as vendor-core).
 * Paths are routed by nginx to the reporting service.
 */
import { vendorCoreFetch } from "@/lib/vendor-core/client";
import type { PaginatedResult } from "@/lib/vendor-core/types";

export type EdgeSubmissionDto = {
	id: string;
	submissionType: string;
	environment: string;
	reportingPeriod: string;
	fileName: string;
	submittedAt: string | null;
	status: string;
	records: number;
	submittedBy: string;
	acceptedPercent: number | null;
	rejectedPercent: number | null;
	warnings: number;
	totals: Record<string, unknown>;
	cmsResponses: unknown;
	notes: unknown;
	objectKey?: string;
	createdAt: string;
	updatedAt?: string;
};

export type EdgeResponseDto = {
	id: string;
	submissionId: string;
	responseFile: string;
	responseType: string;
	receivedAt: string | null;
	status: string;
	records: number;
	accepted?: number;
	rejected?: number;
	warnings?: number;
	fileSize: string;
	fileFormat: string;
	description: string;
	objectKey?: string;
	notes?: unknown;
	files?: Array<{
		name?: string;
		kind?: string;
		size?: string;
		format?: string;
	}>;
	reportingPeriod?: string;
	environment?: string;
	submissionType?: string;
};

export type EdgeValidationDto = {
	id: string;
	submissionId: string;
	validationFile: string;
	reportingPeriod: string;
	validatedAt: string | null;
	status: string;
	totalRecords: number;
	accepted: number;
	rejected: number;
	warnings: number;
	recordTypes: unknown;
};

export type EdgeValidationExceptionDto = {
	id: string;
	status: string;
	owner: string;
	validationId: string;
	errorCode: string;
	recordType: string;
	dataset?: string;
	recordId?: string;
	errorType?: string;
	description: string;
	severity: string;
	occurredAt: string | null;
	fieldPath?: string;
	expectedValue?: string;
	actualValue?: string;
	remediation?: string;
	notes?: unknown;
	reportingPeriod?: string;
};

export type EdgeCorrectionDto = {
	id: string;
	exceptionId: string | null;
	dataset: string;
	recordId: string;
	changeSummary: string;
	owner: string;
	status: string;
	reportingPeriod: string;
	submissionId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type EdgeAdjustmentDto = {
	id: string;
	action: string;
	originalRecordId: string;
	dataset: string;
	reason: string;
	owner: string;
	status: string;
	submittedAt: string | null;
	reportingPeriod: string;
	submissionId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type EdgeReconciliationDto = {
	id: string;
	dataset: string;
	sourceRecords: number;
	fileGenerated: number;
	submitted: number;
	cmsAccepted: number;
	cmsRejected: number;
	variance: number;
	status: string;
	reportingPeriod: string;
	environment: string;
	relatedSubmissionId?: string | null;
	runId?: string;
	summary?: string;
	notes?: unknown;
	varianceReasons?: Array<{
		id?: string;
		label: string;
		count: number;
		tone?: string;
	}>;
	createdAt: string;
	updatedAt: string;
};

export type EdgeReconciliationOverviewDto = {
	kpis: {
		sourceRecords: number;
		fileGenerated: number;
		submitted: number;
		cmsAccepted: number;
		cmsRejected: number;
		variance: number;
	};
	statusMix: { name: string; value: number }[];
};

export type CmsEdgeOverviewDto = {
	reportingPeriod: string | null;
	kpis: {
		submissions: number;
		accepted: number;
		pending: number;
		rejected: number;
		records: number;
		warehouseClaimLines: number;
		warehouseBatches: number;
		responses?: number;
		openExceptions?: number;
		criticalExceptions?: number;
		reconVariance?: number;
	};
	statusMix: { name: string; value: number }[];
	health?: {
		status: string;
		acceptanceRate: number;
		daysToDeadline: number;
		deadlineLabel: string;
		environment: string;
		lastSync: string;
	};
	recentSubmissions: Array<{
		id: string;
		submissionType: string;
		reportingPeriod: string;
		fileName: string;
		status: string;
		records: number;
		submittedBy: string;
		submittedAt?: string | null;
		createdAt?: string;
		environment?: string;
	}>;
	reconciliation?: EdgeReconciliationOverviewDto;
};

const endpoints = {
	overview: "/api/v1/cms-edge/overview/",
	submissionsList: "/api/v1/cms-edge-submissions/list/",
	submissionDetail: (id: string) => `/api/v1/cms-edge-submissions/${id}/`,
	submissionResubmit: (id: string) =>
		`/api/v1/cms-edge-submissions/${id}/resubmit/`,
	submissionDownload: (id: string) =>
		`/api/v1/cms-edge-submissions/${id}/download/`,
	responsesList: "/api/v1/cms-edge-responses/list/",
	responseDetail: (id: string) => `/api/v1/cms-edge-responses/${id}/`,
	responseDownload: (id: string) =>
		`/api/v1/cms-edge-responses/${id}/download/`,
	validationsList: "/api/v1/cms-edge-validations/list/",
	validationDetail: (id: string) => `/api/v1/cms-edge-validations/${id}/`,
	exceptionsList: "/api/v1/cms-edge-validation-exceptions/list/",
	exceptionDetail: (id: string) =>
		`/api/v1/cms-edge-validation-exceptions/${id}/`,
	exceptionResolve: (id: string) =>
		`/api/v1/cms-edge-validation-exceptions/${id}/resolve/`,
	correctionsList: "/api/v1/cms-edge-corrections/list/",
	adjustmentsList: "/api/v1/cms-edge-adjustments/list/",
	reconciliationsList: "/api/v1/cms-edge-reconciliations/list/",
	reconciliationDetail: (id: string) =>
		`/api/v1/cms-edge-reconciliations/${id}/`,
	reconciliationOverview: "/api/v1/cms-edge-reconciliations/overview/",
	reconciliationMarkReviewed: (id: string) =>
		`/api/v1/cms-edge-reconciliations/${id}/mark-reviewed/`,
} as const;

async function listAllPages<T>(
	fetchPage: (params: {
		limit: number;
		offset: number;
	}) => Promise<PaginatedResult<T>>
): Promise<T[]> {
	const results: T[] = [];
	let offset = 0;
	const pageSize = 100;
	for (;;) {
		const page = await fetchPage({ limit: pageSize, offset });
		const chunk = page.results ?? [];
		results.push(...chunk);
		offset += chunk.length;
		if (!chunk.length) break;
		if (typeof page.count === "number" && offset >= page.count) break;
		if (chunk.length < pageSize) break;
	}
	return results;
}

export async function fetchCmsEdgeOverview(reportingPeriod?: string) {
	return vendorCoreFetch<CmsEdgeOverviewDto>(endpoints.overview, {
		params: reportingPeriod
			? { reporting_period: reportingPeriod, reportingPeriod }
			: undefined,
	});
}

export async function fetchCmsEdgeSubmissions(filters?: {
	reportingPeriod?: string;
	environment?: string;
	status?: string;
	submissionType?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<EdgeSubmissionDto>>(
			endpoints.submissionsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					reporting_period: filters?.reportingPeriod,
					reportingPeriod: filters?.reportingPeriod,
					environment: filters?.environment,
					status: filters?.status,
					submission_type: filters?.submissionType,
					submissionType: filters?.submissionType,
				},
			}
		)
	);
}

export async function fetchCmsEdgeSubmission(id: string) {
	return vendorCoreFetch<EdgeSubmissionDto>(endpoints.submissionDetail(id));
}

export async function fetchCmsEdgeResponses(filters?: {
	reportingPeriod?: string;
	status?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<EdgeResponseDto>>(endpoints.responsesList, {
			params: {
				limit: page.limit,
				offset: page.offset,
				reporting_period: filters?.reportingPeriod,
				reportingPeriod: filters?.reportingPeriod,
				status: filters?.status,
			},
		})
	);
}

export async function fetchCmsEdgeResponse(id: string) {
	return vendorCoreFetch<EdgeResponseDto>(endpoints.responseDetail(id));
}

export async function fetchCmsEdgeValidations(filters?: {
	reportingPeriod?: string;
	status?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<EdgeValidationDto>>(
			endpoints.validationsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					reporting_period: filters?.reportingPeriod,
					reportingPeriod: filters?.reportingPeriod,
					status: filters?.status,
				},
			}
		)
	);
}

export async function fetchCmsEdgeValidation(id: string) {
	return vendorCoreFetch<EdgeValidationDto>(endpoints.validationDetail(id));
}

export async function fetchCmsEdgeExceptions(filters?: {
	status?: string;
	severity?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<EdgeValidationExceptionDto>>(
			endpoints.exceptionsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					status: filters?.status,
					severity: filters?.severity,
				},
			}
		)
	);
}

export async function fetchCmsEdgeException(id: string) {
	return vendorCoreFetch<EdgeValidationExceptionDto>(
		endpoints.exceptionDetail(id)
	);
}

export async function fetchCmsEdgeCorrections(filters?: {
	reportingPeriod?: string;
	status?: string;
	dataset?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<EdgeCorrectionDto>>(
			endpoints.correctionsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					reporting_period: filters?.reportingPeriod,
					reportingPeriod: filters?.reportingPeriod,
					status: filters?.status,
					dataset: filters?.dataset,
				},
			}
		)
	);
}

export async function fetchCmsEdgeAdjustments(filters?: {
	reportingPeriod?: string;
	status?: string;
	dataset?: string;
	action?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<EdgeAdjustmentDto>>(
			endpoints.adjustmentsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					reporting_period: filters?.reportingPeriod,
					reportingPeriod: filters?.reportingPeriod,
					status: filters?.status,
					dataset: filters?.dataset,
					action: filters?.action,
				},
			}
		)
	);
}

export async function fetchCmsEdgeReconciliations(filters?: {
	reportingPeriod?: string;
	environment?: string;
	status?: string;
	dataset?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<EdgeReconciliationDto>>(
			endpoints.reconciliationsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					reporting_period: filters?.reportingPeriod,
					reportingPeriod: filters?.reportingPeriod,
					environment: filters?.environment,
					status: filters?.status,
					dataset: filters?.dataset,
				},
			}
		)
	);
}

export async function fetchCmsEdgeReconciliation(id: string) {
	return vendorCoreFetch<EdgeReconciliationDto>(
		endpoints.reconciliationDetail(id)
	);
}

export async function fetchCmsEdgeReconciliationOverview(filters?: {
	reportingPeriod?: string;
	environment?: string;
}) {
	return vendorCoreFetch<EdgeReconciliationOverviewDto>(
		endpoints.reconciliationOverview,
		{
			params: {
				// Backend overview currently reads camelCase reportingPeriod.
				reporting_period: filters?.reportingPeriod,
				reportingPeriod: filters?.reportingPeriod,
				environment: filters?.environment,
			},
		}
	);
}

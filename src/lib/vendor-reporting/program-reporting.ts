/**
 * Program reporting (Medicare / Medicaid) endpoints on vendor-management-core.
 */
import { vendorCoreFetch } from "@/lib/vendor-core/client";
import type { PaginatedResult } from "@/lib/vendor-core/types";

export type ProgramTypeDto = "medicare" | "medicaid";

export type ProgramOverviewDto = {
	programType: ProgramTypeDto;
	reportingPeriod: string | null;
	kpis: Record<string, unknown>;
	warehouse: { claimLines: number; batches: number; responses: number };
	acceptanceTrend: Array<{
		period: string;
		records: number;
		accepted: number;
		rejected: number;
	}>;
	rejectionDonut: Array<{ name: string; value: number }>;
	medicareExtras: {
		pdeOpen: number;
		pdeVariance: number;
		pbpCount: number;
		auditsOpen: number;
	} | null;
	recentSubmissions: Array<Record<string, unknown>>;
	recentResponses: Array<Record<string, unknown>>;
	exceptions: Array<Record<string, unknown>>;
};

export type ProgramSubmissionDto = {
	id: string;
	programType: ProgramTypeDto;
	reportType: string;
	batch: string;
	fileName: string;
	reportingPeriod: string;
	state: string;
	submittedAt: string | null;
	status: string;
	records: number;
	submittedBy: string;
	submissionKind: string;
	pbp: string;
};

export type ProgramResponseDto = {
	id: string;
	programType: ProgramTypeDto;
	submissionId: string | null;
	responseFile: string;
	receivedAt: string | null;
	status: string;
	records: number;
	errors: number;
	warnings: number;
};

export type ProgramAuditDto = {
	id: string;
	programType: ProgramTypeDto;
	activity: string;
	findingSeverity: string;
	status: string;
	occurredAt: string | null;
	details: Record<string, unknown>;
};

export type ProgramExceptionDto = {
	id: string;
	programType: ProgramTypeDto;
	errorCode: string;
	description: string;
	severity: string;
	state: string;
	submissionBatch: string;
	encounterCount: number;
	status: string;
};

export type ProgramDocumentDto = {
	id: string;
	programType: ProgramTypeDto;
	name: string;
	fileKind: string;
	documentType: string;
	reportingPeriod: string;
	state: string;
	uploadedAt: string | null;
	status: string;
	fileSize: string;
};

export type PdeReconciliationDto = {
	id: string;
	pbp: string;
	reconciliationType: string;
	recordsSubmitted: number;
	cmsAccepted: number;
	variance: number;
	status: string;
	reportingPeriod: string;
};

const endpoints = {
	overview: "/api/v1/program-reporting/overview/",
	submissionsList: "/api/v1/program-submissions/list/",
	responsesList: "/api/v1/program-responses/list/",
	auditsList: "/api/v1/program-audits/list/",
	exceptionsList: "/api/v1/program-exceptions/list/",
	exceptionUpdate: (id: string) => `/api/v1/program-exceptions/${id}/update/`,
	documentsList: "/api/v1/program-documents/list/",
	pdeList: "/api/v1/pde-reconciliations/list/",
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

export async function fetchProgramReportingOverview(filters?: {
	programType?: ProgramTypeDto;
	reportingPeriod?: string;
}) {
	return vendorCoreFetch<ProgramOverviewDto>(endpoints.overview, {
		params: {
			program_type: filters?.programType,
			programType: filters?.programType,
			reporting_period: filters?.reportingPeriod,
			reportingPeriod: filters?.reportingPeriod,
		},
	});
}

export async function fetchProgramSubmissions(filters?: {
	programType?: ProgramTypeDto;
	status?: string;
	reportingPeriod?: string;
	state?: string;
	search?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<ProgramSubmissionDto>>(
			endpoints.submissionsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					program_type: filters?.programType,
					programType: filters?.programType,
					status: filters?.status,
					reporting_period: filters?.reportingPeriod,
					reportingPeriod: filters?.reportingPeriod,
					state: filters?.state,
					search: filters?.search,
				},
			}
		)
	);
}

export async function fetchProgramResponses(filters?: {
	programType?: ProgramTypeDto;
	status?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<ProgramResponseDto>>(
			endpoints.responsesList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					program_type: filters?.programType,
					programType: filters?.programType,
					status: filters?.status,
				},
			}
		)
	);
}

export async function fetchProgramAudits(filters?: {
	programType?: ProgramTypeDto;
	status?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<ProgramAuditDto>>(endpoints.auditsList, {
			params: {
				limit: page.limit,
				offset: page.offset,
				program_type: filters?.programType,
				programType: filters?.programType,
				status: filters?.status,
			},
		})
	);
}

export async function fetchProgramExceptions(filters?: {
	programType?: ProgramTypeDto;
	severity?: string;
	status?: string;
	state?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<ProgramExceptionDto>>(
			endpoints.exceptionsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					program_type: filters?.programType,
					programType: filters?.programType,
					severity: filters?.severity,
					status: filters?.status,
					state: filters?.state,
				},
			}
		)
	);
}

export async function updateProgramException(
	id: string,
	body: Partial<{
		status: string;
		severity: string;
		description: string;
		errorCode: string;
		state: string;
		submissionBatch: string;
		encounterCount: number;
		programType: ProgramTypeDto;
	}>
) {
	return vendorCoreFetch<ProgramExceptionDto>(endpoints.exceptionUpdate(id), {
		method: "PATCH",
		body: JSON.stringify(body),
	});
}

export async function fetchProgramDocuments(filters?: {
	programType?: ProgramTypeDto;
	reportingPeriod?: string;
	status?: string;
	state?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<ProgramDocumentDto>>(
			endpoints.documentsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					program_type: filters?.programType,
					programType: filters?.programType,
					reporting_period: filters?.reportingPeriod,
					reportingPeriod: filters?.reportingPeriod,
					status: filters?.status,
					state: filters?.state,
				},
			}
		)
	);
}

export async function fetchPdeReconciliations(filters?: {
	status?: string;
	reportingPeriod?: string;
}) {
	return listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<PdeReconciliationDto>>(endpoints.pdeList, {
			params: {
				limit: page.limit,
				offset: page.offset,
				status: filters?.status,
				reporting_period: filters?.reportingPeriod,
				reportingPeriod: filters?.reportingPeriod,
			},
		})
	);
}

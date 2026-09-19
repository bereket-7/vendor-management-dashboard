/**
 * Compliance calendar endpoints on vendor-management-core (reporting app).
 */
import { vendorCoreFetch } from "@/lib/vendor-core/client";
import type { PaginatedResult } from "@/lib/vendor-core/types";

export type ComplianceObligationDto = {
	id: string;
	title: string;
	program: string;
	obligationType: string;
	frequency: string;
	dueDate: string | null;
	internalDueDate: string | null;
	status: string;
	owner: string;
	sourceModule: string;
	reportingPeriod: string;
	regulatoryAgency: string;
	priority: string;
	regulatoryReference: string;
	description: string;
	notes: string;
	relatedSubmission: string;
	latestResponse: string;
	openIssues: number;
	documents: unknown;
	activity: unknown;
	daysToDue: number;
	createdAt?: string;
	updatedAt?: string;
};

export type ComplianceCalendarOverviewDto = {
	kpis: {
		total: number;
		upcoming: number;
		overdue: number;
		completed: number;
		atRisk: number;
	};
	events: Array<{ date: string; program: string; count: number }>;
	upcomingDeadlines: Array<{
		id: string;
		title: string;
		program: string;
		obligationType: string;
		dueDate: string | null;
		status: string;
		daysToDue: number;
	}>;
};

export type ComplianceObligationWrite = {
	title?: string;
	program?: string;
	obligationType?: string;
	frequency?: string;
	dueDate?: string | null;
	internalDueDate?: string | null;
	status?: string;
	owner?: string;
	sourceModule?: string;
	reportingPeriod?: string;
	regulatoryAgency?: string;
	priority?: string;
	regulatoryReference?: string;
	description?: string;
	notes?: string;
	relatedSubmission?: string;
	latestResponse?: string;
	openIssues?: number;
	documents?: unknown;
	activity?: unknown;
};

const endpoints = {
	overview: "/api/v1/compliance-calendar/overview/",
	obligationsList: "/api/v1/compliance-obligations/list/",
	obligationDetail: (id: string) => `/api/v1/compliance-obligations/${id}/`,
	obligationCreate: "/api/v1/compliance-obligations/create/",
	obligationUpdate: (id: string) =>
		`/api/v1/compliance-obligations/${id}/update/`,
} as const;

async function listAllPages<T>(
	fetchPage: (params: {
		limit: number;
		offset: number;
	}) => Promise<PaginatedResult<T>>
): Promise<{ items: T[]; count: number }> {
	const results: T[] = [];
	let offset = 0;
	const pageSize = 100;
	let count = 0;
	for (;;) {
		const page = await fetchPage({ limit: pageSize, offset });
		count = typeof page.count === "number" ? page.count : count;
		const chunk = page.results ?? [];
		results.push(...chunk);
		offset += chunk.length;
		if (!chunk.length) break;
		if (typeof page.count === "number" && offset >= page.count) break;
		if (chunk.length < pageSize) break;
	}
	return { items: results, count: count || results.length };
}

export async function fetchComplianceCalendarOverview() {
	return vendorCoreFetch<ComplianceCalendarOverviewDto>(endpoints.overview);
}

export async function fetchComplianceObligations(filters?: {
	program?: string;
	status?: string;
	search?: string;
	limit?: number;
	offset?: number;
}) {
	if (filters?.limit != null || filters?.offset != null) {
		return vendorCoreFetch<PaginatedResult<ComplianceObligationDto>>(
			endpoints.obligationsList,
			{
				params: {
					limit: filters.limit ?? 100,
					offset: filters.offset ?? 0,
					program: filters.program,
					status: filters.status,
					search: filters.search,
				},
			}
		);
	}
	const { items, count } = await listAllPages((page) =>
		vendorCoreFetch<PaginatedResult<ComplianceObligationDto>>(
			endpoints.obligationsList,
			{
				params: {
					limit: page.limit,
					offset: page.offset,
					program: filters?.program,
					status: filters?.status,
					search: filters?.search,
				},
			}
		)
	);
	return {
		count,
		limit: items.length,
		offset: 0,
		next: null,
		previous: null,
		results: items,
	} satisfies PaginatedResult<ComplianceObligationDto>;
}

export async function fetchComplianceObligation(id: string) {
	return vendorCoreFetch<ComplianceObligationDto>(
		endpoints.obligationDetail(id)
	);
}

export async function createComplianceObligation(
	body: ComplianceObligationWrite
) {
	return vendorCoreFetch<ComplianceObligationDto>(endpoints.obligationCreate, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateComplianceObligation(
	id: string,
	body: ComplianceObligationWrite
) {
	return vendorCoreFetch<ComplianceObligationDto>(
		endpoints.obligationUpdate(id),
		{
			method: "PATCH",
			body: JSON.stringify(body),
		}
	);
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import {
	getPartDKpis,
	listPartDReconciliations,
	listPartDResponses,
	listPartDSubmissions,
} from "../api/medicare-reportingApi";

const domain = "medicare-reporting";

export * from "../types/medicare-reportingModel";

export function useMedicareReportingPartDSubmissionsQuery(
	reportingPeriod?: string
) {
	return useQuery({
		queryKey: featureQueryKey(
			domain,
			"partDSubmissions",
			reportingPeriod ?? null
		),
		queryFn: async () => {
			const items = await listPartDSubmissions(reportingPeriod);
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useMedicareReportingPartDSubmissionsList(
	reportingPeriod?: string
) {
	const query = useMedicareReportingPartDSubmissionsQuery(reportingPeriod);
	return { ...query, partDSubmissions: query.data?.items ?? [] };
}

export function useMedicareReportingPartDKpisQuery(reportingPeriod?: string) {
	return useQuery({
		queryKey: featureQueryKey(domain, "partDKpis", reportingPeriod ?? null),
		queryFn: () => getPartDKpis(reportingPeriod),
	});
}

export function useMedicareReportingPartDReconciliationsQuery(
	reportingPeriod?: string
) {
	return useQuery({
		queryKey: featureQueryKey(
			domain,
			"partDReconciliations",
			reportingPeriod ?? null
		),
		queryFn: async () => {
			const items = await listPartDReconciliations(reportingPeriod);
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useMedicareReportingPartDResponsesQuery(
	reportingPeriod?: string
) {
	return useQuery({
		queryKey: featureQueryKey(
			domain,
			"partDResponses",
			reportingPeriod ?? null
		),
		queryFn: async () => {
			const items = await listPartDResponses(reportingPeriod);
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

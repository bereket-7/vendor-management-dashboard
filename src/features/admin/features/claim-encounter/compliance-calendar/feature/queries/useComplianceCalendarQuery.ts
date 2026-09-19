"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import type { ComplianceObligationWrite } from "@/lib/vendor-reporting/compliance-calendar";

import {
	createObligation,
	getCalendarBundle,
	getObligationDetail,
	listObligations,
	listUpcomingDeadlines,
	updateObligation,
	type ObligationListFilters,
} from "../api/compliance-calendarApi";

const domain = "compliance-calendar";

export * from "../types/compliance-calendarModel";

export function useComplianceCalendarBundleQuery(view: {
	year: number;
	monthIndex: number;
}) {
	return useQuery({
		queryKey: featureQueryKey(domain, "bundle", view),
		queryFn: () => getCalendarBundle(view),
	});
}

export function useComplianceCalendarObligationsQuery(
	filters?: ObligationListFilters
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "obligations", filters ?? null),
		queryFn: async () => listObligations(filters),
	});
}

export function useComplianceCalendarObligationsList(
	filters?: ObligationListFilters
) {
	const query = useComplianceCalendarObligationsQuery(filters);
	return { ...query, obligations: query.data?.items ?? [] };
}

export function useComplianceCalendarUpcomingDeadlinesQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "upcomingDeadlines"),
		queryFn: async () => {
			const items = await listUpcomingDeadlines();
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useComplianceCalendarUpcomingDeadlinesList() {
	const query = useComplianceCalendarUpcomingDeadlinesQuery();
	return { ...query, upcomingDeadlines: query.data?.items ?? [] };
}

export function useComplianceObligationDetailQuery(id: string, enabled = true) {
	return useQuery({
		queryKey: featureQueryKey(domain, "obligation-detail", id),
		queryFn: () => getObligationDetail(id),
		enabled: Boolean(id) && enabled,
	});
}

export function useCreateComplianceObligationMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: ComplianceObligationWrite) => createObligation(body),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: [domain] });
		},
	});
}

export function useUpdateComplianceObligationMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: ComplianceObligationWrite;
		}) => updateObligation(id, body),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: [domain] });
		},
	});
}

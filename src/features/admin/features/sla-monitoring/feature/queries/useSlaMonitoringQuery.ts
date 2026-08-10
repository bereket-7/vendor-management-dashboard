"use client";

import { useQuery } from "@tanstack/react-query";

import { getSlaMonitoring, listSlaMonitoring } from "../api/slaMonitoringApi";
import { toSlaMonitoringModel } from "../mappers/slaMonitoringMappers";

export function useSlaMonitoringQuery() {
	return useQuery({
		queryKey: ["admin", "sla-monitoring", "list"],
		queryFn: async () => {
			const res = await listSlaMonitoring();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toSlaMonitoringModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useSlaMonitoringDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "sla-monitoring", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getSlaMonitoring(String(id));
			return toSlaMonitoringModel(row);
		},
		retry: false,
	});
}

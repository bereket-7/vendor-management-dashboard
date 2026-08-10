"use client";

import { useQuery } from "@tanstack/react-query";

import { getPerformance, listPerformance } from "../api/performanceApi";
import { toPerformanceModel } from "../mappers/performanceMappers";

export function usePerformanceQuery() {
	return useQuery({
		queryKey: ["admin", "performance", "list"],
		queryFn: async () => {
			const res = await listPerformance();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toPerformanceModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function usePerformanceDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "performance", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getPerformance(String(id));
			return toPerformanceModel(row);
		},
		retry: false,
	});
}

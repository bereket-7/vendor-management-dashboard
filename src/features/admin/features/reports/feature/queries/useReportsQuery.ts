"use client";

import { useQuery } from "@tanstack/react-query";

import { getReports, listReports } from "../api/reportsApi";
import { toReportsModel } from "../mappers/reportsMappers";

export function useReportsQuery() {
	return useQuery({
		queryKey: ["admin", "reports", "list"],
		queryFn: async () => {
			const res = await listReports();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toReportsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useReportsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "reports", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getReports(String(id));
			return toReportsModel(row);
		},
		retry: false,
	});
}

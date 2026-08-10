"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboard, listDashboard } from "../api/dashboardApi";
import { toDashboardModel } from "../mappers/dashboardMappers";

export function useDashboardQuery() {
	return useQuery({
		queryKey: ["admin", "dashboard", "list"],
		queryFn: async () => {
			const res = await listDashboard();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toDashboardModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useDashboardDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "dashboard", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getDashboard(String(id));
			return toDashboardModel(row);
		},
		retry: false,
	});
}

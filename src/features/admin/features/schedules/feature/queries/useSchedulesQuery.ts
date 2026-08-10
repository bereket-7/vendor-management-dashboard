"use client";

import { useQuery } from "@tanstack/react-query";

import { getSchedules, listSchedules } from "../api/schedulesApi";
import { toSchedulesModel } from "../mappers/schedulesMappers";

export function useSchedulesQuery() {
	return useQuery({
		queryKey: ["admin", "schedules", "list"],
		queryFn: async () => {
			const res = await listSchedules();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toSchedulesModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useSchedulesDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "schedules", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getSchedules(String(id));
			return toSchedulesModel(row);
		},
		retry: false,
	});
}

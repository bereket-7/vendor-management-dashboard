"use client";

import { useQuery } from "@tanstack/react-query";

import { getExports, listExports } from "../api/exportsApi";
import { toExportsModel } from "../mappers/exportsMappers";

export function useExportsQuery() {
	return useQuery({
		queryKey: ["admin", "exports", "list"],
		queryFn: async () => {
			const res = await listExports();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toExportsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useExportsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "exports", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getExports(String(id));
			return toExportsModel(row);
		},
		retry: false,
	});
}

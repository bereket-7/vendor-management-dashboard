"use client";

import { useQuery } from "@tanstack/react-query";

import { getFileHistory, listFileHistory } from "../api/fileHistoryApi";
import { toFileHistoryModel } from "../mappers/fileHistoryMappers";

export function useFileHistoryQuery() {
	return useQuery({
		queryKey: ["admin", "file-history", "list"],
		queryFn: async () => {
			const res = await listFileHistory();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toFileHistoryModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useFileHistoryDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "file-history", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getFileHistory(String(id));
			return toFileHistoryModel(row);
		},
		retry: false,
	});
}

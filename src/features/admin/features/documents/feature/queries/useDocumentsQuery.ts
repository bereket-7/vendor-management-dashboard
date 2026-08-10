"use client";

import { useQuery } from "@tanstack/react-query";

import { getDocuments, listDocuments } from "../api/documentsApi";
import { toDocumentsModel } from "../mappers/documentsMappers";

export function useDocumentsQuery() {
	return useQuery({
		queryKey: ["admin", "documents", "list"],
		queryFn: async () => {
			const res = await listDocuments();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toDocumentsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useDocumentsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "documents", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getDocuments(String(id));
			return toDocumentsModel(row);
		},
		retry: false,
	});
}

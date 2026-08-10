"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getFileManagement,
	listFileManagement,
} from "../api/fileManagementApi";
import { toFileManagementModel } from "../mappers/fileManagementMappers";

export function useFileManagementQuery() {
	return useQuery({
		queryKey: ["admin", "file-management", "list"],
		queryFn: async () => {
			const res = await listFileManagement();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toFileManagementModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useFileManagementDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "file-management", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getFileManagement(String(id));
			return toFileManagementModel(row);
		},
		retry: false,
	});
}

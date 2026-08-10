"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getErrorManagement,
	listErrorManagement,
} from "../api/errorManagementApi";
import { toErrorManagementModel } from "../mappers/errorManagementMappers";

export function useErrorManagementQuery() {
	return useQuery({
		queryKey: ["admin", "error-management", "list"],
		queryFn: async () => {
			const res = await listErrorManagement();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toErrorManagementModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useErrorManagementDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "error-management", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getErrorManagement(String(id));
			return toErrorManagementModel(row);
		},
		retry: false,
	});
}

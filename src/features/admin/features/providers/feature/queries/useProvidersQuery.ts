"use client";

import { useQuery } from "@tanstack/react-query";

import { getProviders, listProviders } from "../api/providersApi";
import { toProvidersModel } from "../mappers/providersMappers";

export function useProvidersQuery() {
	return useQuery({
		queryKey: ["admin", "providers", "list"],
		queryFn: async () => {
			const res = await listProviders();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toProvidersModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useProvidersDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "providers", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getProviders(String(id));
			return toProvidersModel(row);
		},
		retry: false,
	});
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { getContracts, listContracts } from "../api/contractsApi";
import { toContractsModel } from "../mappers/contractsMappers";

export function useContractsQuery() {
	return useQuery({
		queryKey: ["admin", "contracts", "list"],
		queryFn: async () => {
			const res = await listContracts();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toContractsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useContractsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "contracts", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getContracts(String(id));
			return toContractsModel(row);
		},
		retry: false,
	});
}

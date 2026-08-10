"use client";

import { useQuery } from "@tanstack/react-query";

import { getVendors, listVendors } from "../api/vendorsApi";
import { toVendorsModel } from "../mappers/vendorsMappers";

export function useVendorsQuery() {
	return useQuery({
		queryKey: ["admin", "vendors", "list"],
		queryFn: async () => {
			const res = await listVendors();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toVendorsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useVendorsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "vendors", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getVendors(String(id));
			return toVendorsModel(row);
		},
		retry: false,
	});
}

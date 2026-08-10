"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getVendorComparison,
	listVendorComparison,
} from "../api/vendorComparisonApi";
import { toVendorComparisonModel } from "../mappers/vendorComparisonMappers";

export function useVendorComparisonQuery() {
	return useQuery({
		queryKey: ["admin", "vendor-comparison", "list"],
		queryFn: async () => {
			const res = await listVendorComparison();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toVendorComparisonModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useVendorComparisonDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "vendor-comparison", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getVendorComparison(String(id));
			return toVendorComparisonModel(row);
		},
		retry: false,
	});
}

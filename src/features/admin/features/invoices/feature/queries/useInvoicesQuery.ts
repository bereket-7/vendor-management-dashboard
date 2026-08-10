"use client";

import { useQuery } from "@tanstack/react-query";

import { getInvoices, listInvoices } from "../api/invoicesApi";
import { toInvoicesModel } from "../mappers/invoicesMappers";

export function useInvoicesQuery() {
	return useQuery({
		queryKey: ["admin", "invoices", "list"],
		queryFn: async () => {
			const res = await listInvoices();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toInvoicesModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useInvoicesDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "invoices", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getInvoices(String(id));
			return toInvoicesModel(row);
		},
		retry: false,
	});
}

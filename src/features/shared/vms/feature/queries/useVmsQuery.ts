"use client";

import { useQuery } from "@tanstack/react-query";

import { getVms, listVms } from "../api/vmsApi";
import { toVmsModel } from "../mappers/vmsMappers";

export function useVmsQuery() {
	return useQuery({
		queryKey: ["admin", "vms", "list"],
		queryFn: async () => {
			const res = await listVms();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toVmsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useVmsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "vms", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getVms(String(id));
			return toVmsModel(row);
		},
		retry: false,
	});
}

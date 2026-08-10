"use client";

import { useQuery } from "@tanstack/react-query";

import { getSourcing, listSourcing } from "../api/sourcingApi";
import { toSourcingModel } from "../mappers/sourcingMappers";

export function useSourcingQuery() {
	return useQuery({
		queryKey: ["admin", "sourcing", "list"],
		queryFn: async () => {
			const res = await listSourcing();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toSourcingModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useSourcingDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "sourcing", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getSourcing(String(id));
			return toSourcingModel(row);
		},
		retry: false,
	});
}

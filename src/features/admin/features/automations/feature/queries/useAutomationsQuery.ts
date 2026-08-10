"use client";

import { useQuery } from "@tanstack/react-query";

import { getAutomations, listAutomations } from "../api/automationsApi";
import { toAutomationsModel } from "../mappers/automationsMappers";

export function useAutomationsQuery() {
	return useQuery({
		queryKey: ["admin", "automations", "list"],
		queryFn: async () => {
			const res = await listAutomations();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toAutomationsModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useAutomationsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "automations", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getAutomations(String(id));
			return toAutomationsModel(row);
		},
		retry: false,
	});
}

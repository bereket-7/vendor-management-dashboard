"use client";

import { useQuery } from "@tanstack/react-query";

import { getCompliance, listCompliance } from "../api/complianceApi";
import { toComplianceModel } from "../mappers/complianceMappers";

export function useComplianceQuery() {
	return useQuery({
		queryKey: ["admin", "compliance", "list"],
		queryFn: async () => {
			const res = await listCompliance();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toComplianceModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useComplianceDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "compliance", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getCompliance(String(id));
			return toComplianceModel(row);
		},
		retry: false,
	});
}

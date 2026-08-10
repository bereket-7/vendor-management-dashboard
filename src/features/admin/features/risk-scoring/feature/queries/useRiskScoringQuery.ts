"use client";

import { useQuery } from "@tanstack/react-query";

import { getRiskScoring, listRiskScoring } from "../api/riskScoringApi";
import { toRiskScoringModel } from "../mappers/riskScoringMappers";

export function useRiskScoringQuery() {
	return useQuery({
		queryKey: ["admin", "risk-scoring", "list"],
		queryFn: async () => {
			const res = await listRiskScoring();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toRiskScoringModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useRiskScoringDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "risk-scoring", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getRiskScoring(String(id));
			return toRiskScoringModel(row);
		},
		retry: false,
	});
}

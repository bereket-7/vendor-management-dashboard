"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getClaimEncounter,
	listClaimEncounter,
} from "../api/claimEncounterApi";
import { toClaimEncounterModel } from "../mappers/claimEncounterMappers";

export function useClaimEncounterQuery() {
	return useQuery({
		queryKey: ["admin", "claim-encounter", "list"],
		queryFn: async () => {
			const res = await listClaimEncounter();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toClaimEncounterModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useClaimEncounterDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "claim-encounter", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getClaimEncounter(String(id));
			return toClaimEncounterModel(row);
		},
		retry: false,
	});
}

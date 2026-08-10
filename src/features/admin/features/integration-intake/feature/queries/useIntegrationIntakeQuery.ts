"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getIntegrationIntake,
	listIntegrationIntake,
} from "../api/integrationIntakeApi";
import { toIntegrationIntakeModel } from "../mappers/integrationIntakeMappers";

export function useIntegrationIntakeQuery() {
	return useQuery({
		queryKey: ["admin", "integration-intake", "list"],
		queryFn: async () => {
			const res = await listIntegrationIntake();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toIntegrationIntakeModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useIntegrationIntakeDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "integration-intake", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getIntegrationIntake(String(id));
			return toIntegrationIntakeModel(row);
		},
		retry: false,
	});
}

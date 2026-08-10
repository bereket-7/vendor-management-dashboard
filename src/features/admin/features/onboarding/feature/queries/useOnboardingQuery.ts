"use client";

import { useQuery } from "@tanstack/react-query";

import { getOnboarding, listOnboarding } from "../api/onboardingApi";
import { toOnboardingModel } from "../mappers/onboardingMappers";

export function useOnboardingQuery() {
	return useQuery({
		queryKey: ["admin", "onboarding", "list"],
		queryFn: async () => {
			const res = await listOnboarding();
			const rows = res.results ?? [];
			return {
				items: rows.map((row, index) => toOnboardingModel(row, index)),
				total: res.count ?? rows.length,
			};
		},
		retry: false,
	});
}

export function useOnboardingDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["admin", "onboarding", "detail", id ?? ""],
		enabled: Boolean(id),
		queryFn: async () => {
			const row = await getOnboarding(String(id));
			return toOnboardingModel(row);
		},
		retry: false,
	});
}

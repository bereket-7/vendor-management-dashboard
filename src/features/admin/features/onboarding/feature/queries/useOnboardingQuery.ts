"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import {
	getOnboarding,
	listOnboarding,
	seedOnboarding,
	updateOnboarding,
} from "../api/onboardingApi";
import type { OnboardingUpdateDto } from "../dto/onboardingDto";
import { toOnboardingModel } from "../mappers/onboardingMappers";

const domain = "onboarding";

export function useOnboardingQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "list"),
		queryFn: async () => {
			const items = (await listOnboarding()).map(toOnboardingModel);
			return { items, total: items.length };
		},
	});
}

export function useOnboardingDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: featureQueryKey(domain, "detail", id ?? ""),
		enabled: Boolean(id),
		queryFn: async () => toOnboardingModel(await getOnboarding(String(id))),
	});
}

export function useUpdateOnboardingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: OnboardingUpdateDto }) =>
			updateOnboarding(id, patch),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
			queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "detail", variables.id),
			});
		},
	});
}

export function useSeedOnboardingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (force?: boolean) => seedOnboarding(force),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
			queryClient.invalidateQueries({ queryKey: featureQueryKey("documents") });
		},
	});
}

export function useOnboardingList() {
	const query = useOnboardingQuery();
	return { ...query, cases: query.data?.items ?? [] };
}

export function useOnboardingCase(id: string | null | undefined) {
	const query = useOnboardingDetailQuery(id);
	return { ...query, caseItem: query.data };
}

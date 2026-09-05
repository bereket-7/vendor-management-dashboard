"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import {
	awardSourcing,
	createSourcing,
	getSourcing,
	listSourcing,
	listSourcingBids,
	submitSourcingBid,
	updateSourcing,
} from "../api/sourcingApi";
import type { SourcingCreateDto, SourcingUpdateDto } from "../dto/sourcingDto";
import { toSourcingModel } from "../mappers/sourcingMappers";

const domain = "sourcing";

export function useSourcingQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "list"),
		queryFn: async () => {
			const items = (await listSourcing()).map(toSourcingModel);
			return { items, total: items.length };
		},
	});
}

export function useSourcingDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: featureQueryKey(domain, "detail", id ?? ""),
		enabled: Boolean(id),
		queryFn: async () => toSourcingModel(await getSourcing(String(id))),
	});
}

export function useCreateSourcingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: SourcingCreateDto) => createSourcing(input),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) }),
	});
}

export function useUpdateSourcingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: SourcingUpdateDto }) =>
			updateSourcing(id, patch),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
			queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "detail", variables.id),
			});
		},
	});
}

export function useAwardSourcingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, bidId }: { id: string; bidId: string }) =>
			awardSourcing(id, bidId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
			queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "detail", variables.id),
			});
			queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "bids", variables.id),
			});
		},
	});
}

export function useSubmitBidMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: submitSourcingBid,
		onSuccess: (bid) => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
			queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "bids", bid.rfxId),
			});
		},
	});
}

export function useRfxList() {
	const query = useSourcingQuery();
	return { ...query, events: query.data?.items ?? [] };
}

export function useRfx(id: string | null | undefined) {
	const query = useSourcingDetailQuery(id);
	return { ...query, rfx: query.data ?? null };
}

export function useBidsList(rfxId?: string) {
	const query = useQuery({
		queryKey: featureQueryKey(domain, "bids", rfxId ?? "all"),
		enabled: Boolean(rfxId),
		queryFn: () => listSourcingBids(rfxId),
	});
	return { ...query, bids: query.data ?? [] };
}

export const useCreateRfxMutation = useCreateSourcingMutation;
export const useUpdateRfxMutation = useUpdateSourcingMutation;
export const useAwardRfxMutation = useAwardSourcingMutation;

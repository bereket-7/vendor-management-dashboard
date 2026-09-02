"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import {
	createContracts,
	getContracts,
	listContracts,
	updateContracts,
} from "../api/contractsApi";
import {
	type CreateProcurementDocumentInput,
	createProcurementDocument,
	listProcurementDocuments,
} from "../api/documentsApi";
import type {
	ContractsCreateDto,
	ContractsUpdateDto,
} from "../dto/contractsDto";
import { toContractsModel } from "../mappers/contractsMappers";

const domain = "contracts";

export function useContractsQuery(vendorId?: string) {
	return useQuery({
		queryKey: featureQueryKey(domain, "list", vendorId ?? "all"),
		queryFn: async () => {
			const items = (await listContracts(vendorId)).map(toContractsModel);
			return { items, total: items.length };
		},
	});
}

export function useContractsDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: featureQueryKey(domain, "detail", id ?? ""),
		enabled: Boolean(id),
		queryFn: async () => toContractsModel(await getContracts(String(id))),
	});
}

export function useCreateContractsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: ContractsCreateDto) => createContracts(input),
		onSuccess: (_, input) => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
			queryClient.invalidateQueries({ queryKey: featureQueryKey("vendors") });
			if (input.vendorId) {
				queryClient.invalidateQueries({
					queryKey: featureQueryKey("vendors", "detail-bundle", input.vendorId),
				});
			}
		},
	});
}

export function useUpdateContractsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: ContractsUpdateDto }) =>
			updateContracts(id, patch),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
			queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "detail", variables.id),
			});
		},
	});
}

export function useContractsList(vendorId?: string) {
	const query = useContractsQuery(vendorId);
	const items = query.data?.items ?? [];
	const contracts = vendorId
		? items.filter((contract) => contract.vendorId === vendorId)
		: items;
	return { ...query, contracts };
}

export function useProcurementDocumentsQuery(
	vendorId?: string,
	enabled = true
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "documents", vendorId ?? "all"),
		queryFn: () => listProcurementDocuments(vendorId),
		enabled,
	});
}

export function useProcurementDocumentsList(vendorId?: string, enabled = true) {
	const query = useProcurementDocumentsQuery(vendorId, enabled);
	return { ...query, documents: query.data ?? [] };
}

export function useCreateProcurementDocumentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateProcurementDocumentInput) =>
			createProcurementDocument(input),
		onSuccess: (_, input) => {
			queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "documents"),
			});
			queryClient.invalidateQueries({
				queryKey: featureQueryKey("vendors", "detail-bundle", input.vendorId),
			});
		},
	});
}

export function useContract(id: string | null | undefined) {
	const query = useContractsDetailQuery(id);
	return { ...query, contract: query.data };
}

export const useCreateContractMutation = useCreateContractsMutation;
export const useUpdateContractMutation = useUpdateContractsMutation;

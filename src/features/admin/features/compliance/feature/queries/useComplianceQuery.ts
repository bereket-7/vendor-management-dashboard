"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import {
	type CertificateApiStatus,
	listCompliance,
	seedCompliance,
	updateCompliance,
} from "../api/complianceApi";
import { toComplianceModel } from "../mappers/complianceMappers";

const domain = "compliance";

export function useComplianceQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "list"),
		queryFn: async () => {
			const items = (await listCompliance()).map(toComplianceModel);
			return { items, total: items.length };
		},
	});
}

export function useCertificatesList() {
	const query = useComplianceQuery();
	return { ...query, certificates: query.data?.items ?? [] };
}

export function useSeedComplianceMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => seedCompliance(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
		},
	});
}

export function useUpdateComplianceMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			status,
		}: {
			id: string;
			status: CertificateApiStatus;
		}) => updateCompliance(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
		},
	});
}

export const useComplianceDetailQuery = useComplianceQuery;

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import {
	createInvoices,
	getInvoices,
	listInvoices,
	seedInvoices,
	updateInvoices,
} from "../api/invoicesApi";
import type { InvoicesCreateDto, InvoicesUpdateDto } from "../dto/invoicesDto";
import { toInvoicesModel } from "../mappers/invoicesMappers";

const domain = "invoices";

export function useInvoicesQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "list"),
		queryFn: async () => {
			const items = (await listInvoices()).map(toInvoicesModel);
			return { items, total: items.length };
		},
	});
}

export function useInvoicesDetailQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: featureQueryKey(domain, "detail", id ?? ""),
		enabled: Boolean(id),
		queryFn: async () => toInvoicesModel(await getInvoices(String(id))),
	});
}

export function useCreateInvoicesMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: InvoicesCreateDto) => createInvoices(input),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) }),
	});
}

export function useSeedInvoicesMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => seedInvoices(),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) }),
	});
}

export function useUpdateInvoicesMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: InvoicesUpdateDto }) =>
			updateInvoices(id, patch),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
			queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "detail", variables.id),
			});
		},
	});
}

export function useInvoicesList() {
	const query = useInvoicesQuery();
	return { ...query, invoices: query.data?.items ?? [] };
}

export function useInvoice(id: string | null | undefined) {
	const query = useInvoicesDetailQuery(id);
	return { ...query, invoice: query.data };
}

export const useCreateInvoiceMutation = useCreateInvoicesMutation;
export const useUpdateInvoiceMutation = useUpdateInvoicesMutation;

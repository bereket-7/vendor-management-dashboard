"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import {
	type ListPharmacyClaimsParams,
	getPharmacyClaim,
	listAuditReports,
	listAuditRequests,
	listCmsResponses,
	listDocumentLibrary,
	listMedicalClaims,
	listPharmacyClaims,
	listSubmissionHistory,
	seedPharmacyClaims,
} from "../api/cms-edgeApi";

const domain = "cms-edge";

export * from "../types/cms-edgeModel";
export function useCmsEdgeAuditRequestsQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "auditRequests"),
		queryFn: async () => {
			const items = await listAuditRequests();
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useCmsEdgeAuditRequestsList() {
	const query = useCmsEdgeAuditRequestsQuery();
	return { ...query, auditRequests: query.data?.items ?? [] };
}

export function useCmsEdgeAuditReportsQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "auditReports"),
		queryFn: async () => {
			const items = await listAuditReports();
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useCmsEdgeAuditReportsList() {
	const query = useCmsEdgeAuditReportsQuery();
	return { ...query, auditReports: query.data?.items ?? [] };
}

export function useCmsEdgeSubmissionHistoryQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "submissionHistory"),
		queryFn: async () => {
			const items = await listSubmissionHistory();
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useCmsEdgeSubmissionHistoryList() {
	const query = useCmsEdgeSubmissionHistoryQuery();
	return { ...query, submissionHistory: query.data?.items ?? [] };
}

export function useCmsEdgeCmsResponsesQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "cmsResponses"),
		queryFn: async () => {
			const items = await listCmsResponses();
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useCmsEdgeCmsResponsesList() {
	const query = useCmsEdgeCmsResponsesQuery();
	return { ...query, cmsResponses: query.data?.items ?? [] };
}

export function useCmsEdgeDocumentLibraryQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "documentLibrary"),
		queryFn: async () => {
			const items = await listDocumentLibrary();
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useCmsEdgeDocumentLibraryList() {
	const query = useCmsEdgeDocumentLibraryQuery();
	return { ...query, documentLibrary: query.data?.items ?? [] };
}

export function useCmsEdgePharmacyClaimsQuery(
	params: ListPharmacyClaimsParams = {}
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "pharmacyClaims", params),
		queryFn: () => listPharmacyClaims(params),
	});
}

export function useCmsEdgePharmacyClaimsList(
	params: ListPharmacyClaimsParams = {}
) {
	const query = useCmsEdgePharmacyClaimsQuery(params);
	return {
		...query,
		pharmacyClaims: query.data?.items ?? [],
		total: query.data?.total ?? 0,
		kpis: query.data?.kpis ?? [],
	};
}

export function useCmsEdgePharmacyClaimDetailQuery(id: string | null) {
	return useQuery({
		queryKey: featureQueryKey(domain, "pharmacyClaimDetail", { id }),
		queryFn: () => getPharmacyClaim(id!),
		enabled: Boolean(id),
	});
}

export function useCmsEdgeMedicalClaimsQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "medicalClaims"),
		queryFn: () => listMedicalClaims(),
	});
}

export function useCmsEdgeMedicalClaimsList() {
	const query = useCmsEdgeMedicalClaimsQuery();
	return {
		...query,
		medicalClaims: query.data?.items ?? [],
		total: query.data?.total ?? 0,
		kpis: query.data?.kpis ?? [],
	};
}

export function useSeedPharmacyClaims() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body?: {
			vendor_id?: string;
			count?: number;
			force?: boolean;
		}) => seedPharmacyClaims(body),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "pharmacyClaims"),
			});
		},
	});
}

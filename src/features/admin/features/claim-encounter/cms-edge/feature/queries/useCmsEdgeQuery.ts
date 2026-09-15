"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import { vendorCoreApi } from "@/lib/vendor-core/api";

import {
	type ListMedicalClaimsParams,
	type ListPharmacyClaimsParams,
	exportEdgeMemberDetailCsv,
	exportEdgeMembersCsv,
	exportEdgeProvidersCsv,
	getEdgeMember,
	getEdgeMemberFacets,
	getEdgeProvider,
	getEdgeProviderFacets,
	getMedicalClaim,
	getOverviewEntitySnapshot,
	getOverviewLivePanels,
	getOverviewShell,
	getPharmacyClaim,
	getSupplementalDiagnosis,
	listAuditReports,
	listAuditRequests,
	listCmsResponses,
	listDocumentLibrary,
	listEdgeMembers,
	listEdgeProviders,
	listMedicalClaims,
	listPharmacyClaims,
	listSubmissionHistory,
	listSupplementalDiagnoses,
	listValidationRuns,
	replaceMedicalClaimHeader,
	seedPharmacyClaims,
	voidMedicalClaimHeader,
	voidPharmacyClaim,
} from "../api/cms-edgeApi";

const domain = "cms-edge";

function invalidateCmsEdgeDemoQueries(
	queryClient: ReturnType<typeof useQueryClient>
) {
	void queryClient.invalidateQueries({ queryKey: featureQueryKey(domain) });
}

export function useSeedCmsEdgeDemo() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body?: { force?: boolean }) =>
			vendorCoreApi.seedCmsEdgeDemo({ force: body?.force ?? true }),
		onSuccess: async () => {
			invalidateCmsEdgeDemoQueries(queryClient);
		},
	});
}

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
	const search = params.search?.trim() || undefined;
	const claimNo = params.claim_no?.trim() || undefined;
	const cardholderId = params.cardholder_id?.trim() || undefined;
	const limit = params.limit ?? 50;
	const offset = params.offset ?? 0;

	return useQuery({
		queryKey: featureQueryKey(domain, "pharmacyClaims", {
			search,
			claimNo,
			cardholderId,
			limit,
			offset,
		}),
		queryFn: () =>
			listPharmacyClaims({
				search,
				claim_no: claimNo,
				cardholder_id: cardholderId,
				limit,
				offset,
			}),
		networkMode: "always",
		retry: 1,
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
		source: query.data?.source ?? null,
	};
}

export function useCmsEdgePharmacyClaimDetailQuery(id: string | null) {
	return useQuery({
		queryKey: featureQueryKey(domain, "pharmacyClaimDetail", { id }),
		queryFn: () => getPharmacyClaim(id!),
		enabled: Boolean(id),
	});
}

export function useCmsEdgeMedicalClaimsQuery(
	params: ListMedicalClaimsParams = {}
) {
	const limit = params.limit ?? 50;
	const offset = params.offset ?? 0;

	return useQuery({
		queryKey: featureQueryKey(domain, "medicalClaims", { limit, offset }),
		queryFn: () => listMedicalClaims({ limit, offset }),
		networkMode: "always",
		retry: 1,
	});
}

export function useCmsEdgeMedicalClaimsList(
	params: ListMedicalClaimsParams = {}
) {
	const query = useCmsEdgeMedicalClaimsQuery(params);
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

export function useCmsEdgeMembersList(
	params: { search?: string; limit?: number; offset?: number } = {}
) {
	const search = params.search?.trim() || undefined;
	const limit = params.limit ?? 25;
	const offset = params.offset ?? 0;
	const query = useQuery({
		queryKey: featureQueryKey(domain, "members", { search, limit, offset }),
		queryFn: () => listEdgeMembers({ search, limit, offset }),
		networkMode: "always",
		retry: 1,
	});
	return {
		...query,
		members: query.data?.items ?? [],
		total: query.data?.total ?? 0,
		kpis: query.data?.kpis ?? [],
	};
}

export function useCmsEdgeMemberDetailQuery(id: string | null) {
	return useQuery({
		queryKey: featureQueryKey(domain, "memberDetail", { id }),
		queryFn: () => getEdgeMember(id!),
		enabled: Boolean(id),
	});
}

export function useCmsEdgeProvidersList(
	params: { search?: string; limit?: number; offset?: number } = {}
) {
	const search = params.search?.trim() || undefined;
	const limit = params.limit ?? 25;
	const offset = params.offset ?? 0;
	const query = useQuery({
		queryKey: featureQueryKey(domain, "providers", { search, limit, offset }),
		queryFn: () => listEdgeProviders({ search, limit, offset }),
		networkMode: "always",
		retry: 1,
	});
	return {
		...query,
		providers: query.data?.items ?? [],
		total: query.data?.total ?? 0,
		kpis: query.data?.kpis ?? [],
	};
}

export function useCmsEdgeProviderDetailQuery(id: string | null) {
	return useQuery({
		queryKey: featureQueryKey(domain, "providerDetail", { id }),
		queryFn: () => getEdgeProvider(id!),
		enabled: Boolean(id),
	});
}

export function useCmsEdgeMedicalClaimDetailQuery(id: string | null) {
	return useQuery({
		queryKey: featureQueryKey(domain, "medicalClaimDetail", { id }),
		queryFn: () => getMedicalClaim(id!),
		enabled: Boolean(id),
	});
}

export function useCmsEdgeSupplementalDiagnosesList(
	params: { limit?: number; offset?: number } = {}
) {
	const limit = params.limit ?? 25;
	const offset = params.offset ?? 0;
	const query = useQuery({
		queryKey: featureQueryKey(domain, "supplementalDiagnoses", {
			limit,
			offset,
		}),
		queryFn: () => listSupplementalDiagnoses({ limit, offset }),
		networkMode: "always",
		retry: 1,
	});
	return {
		...query,
		diagnoses: query.data?.items ?? [],
		total: query.data?.total ?? 0,
		kpis: query.data?.kpis ?? [],
	};
}

export function useCmsEdgeSupplementalDiagnosisDetailQuery(id: string | null) {
	return useQuery({
		queryKey: featureQueryKey(domain, "supplementalDiagnosisDetail", { id }),
		queryFn: () => getSupplementalDiagnosis(id!),
		enabled: Boolean(id),
	});
}

export function useCmsEdgeOverviewEntities() {
	return useQuery({
		queryKey: featureQueryKey(domain, "overviewEntities"),
		queryFn: () => getOverviewEntitySnapshot(),
		networkMode: "always",
		retry: 1,
	});
}

export function useCmsEdgeOverviewLivePanels() {
	return useQuery({
		queryKey: featureQueryKey(domain, "overviewLivePanels"),
		queryFn: () => getOverviewLivePanels(),
		networkMode: "always",
		retry: 1,
	});
}

export function useCmsEdgeOverviewShell() {
	return useQuery({
		queryKey: featureQueryKey(domain, "overviewShell"),
		queryFn: () => getOverviewShell(),
		networkMode: "always",
		retry: 1,
	});
}

export function useCmsEdgeValidationRunsQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "validationRuns"),
		queryFn: async () => {
			const items = await listValidationRuns();
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
		networkMode: "always",
		retry: 1,
	});
}

export function useCmsEdgeValidationRunsList() {
	const query = useCmsEdgeValidationRunsQuery();
	return { ...query, validationRuns: query.data?.items ?? [] };
}

export function useCmsEdgeMemberFacets() {
	return useQuery({
		queryKey: featureQueryKey(domain, "memberFacets"),
		queryFn: () => getEdgeMemberFacets(),
		networkMode: "always",
		retry: 1,
	});
}

export function useCmsEdgeProviderFacets() {
	return useQuery({
		queryKey: featureQueryKey(domain, "providerFacets"),
		queryFn: () => getEdgeProviderFacets(),
		networkMode: "always",
		retry: 1,
	});
}

export function useExportEdgeMembersCsv() {
	return useMutation({
		mutationFn: () => exportEdgeMembersCsv(),
	});
}

export function useExportEdgeMemberDetailCsv() {
	return useMutation({
		mutationFn: (memberId: string) => exportEdgeMemberDetailCsv(memberId),
	});
}

export function useExportEdgeProvidersCsv() {
	return useMutation({
		mutationFn: () => exportEdgeProvidersCsv(),
	});
}

export function useVoidMedicalClaimHeaderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: voidMedicalClaimHeader,
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "medicalClaims"),
			});
			void queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "medicalClaimDetail"),
			});
		},
	});
}

export function useReplaceMedicalClaimHeaderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: replaceMedicalClaimHeader,
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "medicalClaims"),
			});
			void queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "medicalClaimDetail"),
			});
		},
	});
}

export function useVoidPharmacyClaimMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (rowId: string) => voidPharmacyClaim(rowId),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "pharmacyClaims"),
			});
			void queryClient.invalidateQueries({
				queryKey: featureQueryKey(domain, "pharmacyClaimDetail"),
			});
		},
	});
}

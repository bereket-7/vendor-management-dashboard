"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import { useVendorCoreFeatureQuery } from "@/features/admin/shared/vendor-core-feature-query";
import { isMockEnabled } from "@/lib/mock-mode";

import type {
	CmsResponseFileType,
	CmsResponseStatus,
	CmsResponseType,
	ExceptionDataset,
	ExceptionErrorType,
	ExceptionSeverity,
	ExceptionStatus,
	ReconciliationEnvironment,
	SubmissionEnvironment,
	SubmissionFileType,
	SubmissionStatus,
} from "../../mock-data";
import {
	type ListPharmacyClaimsParams,
	getCmsEdgeReportingOverview,
	getExceptionDetail,
	getExceptionWorkbench,
	getPharmacyClaim,
	getReconciliationDetail,
	getReconciliationWorkbench,
	getResponseDetail,
	getSubmissionDetail,
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

export function useCmsEdgeSubmissionHistoryQuery(filters?: {
	reportingPeriod?: string;
	environment?: SubmissionEnvironment | "all";
	fileType?: SubmissionFileType | "all";
	status?: SubmissionStatus | "all";
}) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"submissionHistory",
		async () => {
			const items = await listSubmissionHistory({
				reportingPeriod: filters?.reportingPeriod,
				environment:
					filters?.environment && filters.environment !== "all"
						? filters.environment
						: undefined,
				fileType:
					filters?.fileType && filters.fileType !== "all"
						? filters.fileType
						: undefined,
				status:
					filters?.status && filters.status !== "all"
						? filters.status
						: undefined,
			});
			return { items, total: items.length };
		},
		mock || true,
		[
			filters?.reportingPeriod,
			filters?.environment,
			filters?.fileType,
			filters?.status,
		]
	);
}

export function useCmsEdgeSubmissionHistoryList(filters?: {
	reportingPeriod?: string;
	environment?: SubmissionEnvironment | "all";
	fileType?: SubmissionFileType | "all";
	status?: SubmissionStatus | "all";
}) {
	const query = useCmsEdgeSubmissionHistoryQuery(filters);
	return { ...query, submissionHistory: query.data?.items ?? [] };
}

export function useCmsEdgeSubmissionDetailQuery(id: string) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"submissionDetail",
		async () => getSubmissionDetail(id),
		Boolean(id) && (mock || true),
		[id]
	);
}

export function useCmsEdgeCmsResponsesQuery(filters?: {
	reportingPeriod?: string;
	status?: CmsResponseStatus | "all";
	fileType?: CmsResponseFileType | "all";
	responseType?: CmsResponseType | "all";
}) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"cmsResponses",
		async () => {
			const items = await listCmsResponses({
				reportingPeriod: filters?.reportingPeriod,
				status:
					filters?.status && filters.status !== "all"
						? filters.status
						: undefined,
				fileType:
					filters?.fileType && filters.fileType !== "all"
						? filters.fileType
						: undefined,
				responseType:
					filters?.responseType && filters.responseType !== "all"
						? filters.responseType
						: undefined,
			});
			return { items, total: items.length };
		},
		mock || true,
		[
			filters?.reportingPeriod,
			filters?.status,
			filters?.fileType,
			filters?.responseType,
		]
	);
}

export function useCmsEdgeCmsResponsesList(filters?: {
	reportingPeriod?: string;
	status?: CmsResponseStatus | "all";
	fileType?: CmsResponseFileType | "all";
	responseType?: CmsResponseType | "all";
}) {
	const query = useCmsEdgeCmsResponsesQuery(filters);
	return { ...query, cmsResponses: query.data?.items ?? [] };
}

export function useCmsEdgeResponseDetailQuery(id: string) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"responseDetail",
		async () => getResponseDetail(id),
		Boolean(id) && (mock || true),
		[id]
	);
}

export function useCmsEdgeReportingOverviewQuery(reportingPeriod?: string) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"reportingOverview",
		async () => getCmsEdgeReportingOverview(reportingPeriod),
		mock || true,
		[reportingPeriod]
	);
}

export function useCmsEdgeExceptionWorkbenchQuery(filters?: {
	reportingPeriod?: string;
	status?: ExceptionStatus | "all";
	severity?: ExceptionSeverity | "all";
	dataset?: ExceptionDataset | "all";
	errorType?: ExceptionErrorType | "all";
}) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"exceptionWorkbench",
		async () =>
			getExceptionWorkbench({
				reportingPeriod: filters?.reportingPeriod,
				status:
					filters?.status && filters.status !== "all"
						? filters.status
						: undefined,
				severity:
					filters?.severity && filters.severity !== "all"
						? filters.severity
						: undefined,
				dataset:
					filters?.dataset && filters.dataset !== "all"
						? filters.dataset
						: undefined,
				errorType:
					filters?.errorType && filters.errorType !== "all"
						? filters.errorType
						: undefined,
			}),
		mock || true,
		[
			filters?.reportingPeriod,
			filters?.status,
			filters?.severity,
			filters?.dataset,
			filters?.errorType,
		]
	);
}

export function useCmsEdgeExceptionWorkbench(filters?: {
	reportingPeriod?: string;
	status?: ExceptionStatus | "all";
	severity?: ExceptionSeverity | "all";
	dataset?: ExceptionDataset | "all";
	errorType?: ExceptionErrorType | "all";
}) {
	const query = useCmsEdgeExceptionWorkbenchQuery(filters);
	return {
		...query,
		exceptions: query.data?.exceptions ?? [],
		corrections: query.data?.corrections ?? [],
		voids: query.data?.voids ?? [],
		kpis: query.data?.kpis ?? {
			openExceptions: 0,
			critical: 0,
			correctionsDrafted: 0,
			readyForResubmission: 0,
		},
		correctionQueue: query.data?.correctionQueue ?? {
			draft: 0,
			awaitingReview: 0,
			approved: 0,
			resubmitted: 0,
		},
	};
}

export function useCmsEdgeExceptionDetailQuery(id: string) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"exceptionDetail",
		async () => getExceptionDetail(id),
		Boolean(id) && (mock || true),
		[id]
	);
}

export function useCmsEdgeReconciliationWorkbenchQuery(filters?: {
	reportingPeriod?: string;
	environment?: ReconciliationEnvironment | "all";
}) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"reconciliationWorkbench",
		async () =>
			getReconciliationWorkbench({
				reportingPeriod: filters?.reportingPeriod,
				environment: filters?.environment,
			}),
		mock || true,
		[filters?.reportingPeriod, filters?.environment]
	);
}

export function useCmsEdgeReconciliationWorkbench(filters?: {
	reportingPeriod?: string;
	environment?: ReconciliationEnvironment | "all";
}) {
	const query = useCmsEdgeReconciliationWorkbenchQuery(filters);
	return {
		...query,
		rows: query.data?.rows ?? [],
		kpis: query.data?.kpis ?? {
			sourceRecords: 0,
			submitted: 0,
			cmsAccepted: 0,
			variance: 0,
		},
	};
}

export function useCmsEdgeReconciliationDetailQuery(id: string) {
	const mock = isMockEnabled();
	return useVendorCoreFeatureQuery(
		domain,
		"reconciliationDetail",
		async () => getReconciliationDetail(id),
		Boolean(id) && (mock || true),
		[id]
	);
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

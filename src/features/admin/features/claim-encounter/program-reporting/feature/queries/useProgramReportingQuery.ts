"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import type { ProgramType } from "../../types";
import {
	getAcceptanceAnalytics,
	getAuditData,
	getMedicareComplianceBundle,
	getOverviewData,
	getProgramScale,
	getSubmissionsData,
	patchProgramException,
} from "../api/program-reportingApi";

const domain = "program-reporting";

export * from "../types/program-reportingModel";
export type { ProgramType } from "../types/program-reportingModel";

export {
	useMedicaidEncounterDocumentLibraryList,
	useMedicaidEncounterDocumentLibraryQuery,
	useMedicaidEncounterExceptionDetailsList,
	useMedicaidEncounterExceptionDetailsQuery,
	useMedicaidEncounterResponseFilesList,
	useMedicaidEncounterResponseFilesQuery,
	useMedicaidEncounterValidationDerivedQuery,
	useUpdateProgramExceptionMutation,
} from "@/features/admin/features/claim-encounter/medicaid-encounter/feature/queries/useMedicaidEncounterQuery";

export {
	useMedicareReportingPartDKpisQuery,
	useMedicareReportingPartDReconciliationsQuery,
	useMedicareReportingPartDResponsesQuery,
	useMedicareReportingPartDSubmissionsList,
	useMedicareReportingPartDSubmissionsQuery,
} from "@/features/admin/features/claim-encounter/medicare-reporting/feature/queries/useMedicareReportingQuery";

export function useProgramOverviewQuery(
	programType: ProgramType,
	period?: string
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "overview", programType, period ?? null),
		queryFn: () => getOverviewData(programType, period),
	});
}

export function useProgramSubmissionsQuery(
	programType: ProgramType,
	period?: string
) {
	return useQuery({
		queryKey: featureQueryKey(
			domain,
			"submissions",
			programType,
			period ?? null
		),
		queryFn: () => getSubmissionsData(programType, period),
	});
}

export function useProgramAuditQuery(programType: ProgramType) {
	return useQuery({
		queryKey: featureQueryKey(domain, "audit", programType),
		queryFn: () => getAuditData(programType),
	});
}

export function useProgramAcceptanceAnalyticsQuery(
	programType: ProgramType = "medicaid",
	period?: string
) {
	return useQuery({
		queryKey: featureQueryKey(
			domain,
			"acceptance-analytics",
			programType,
			period ?? null
		),
		queryFn: () => getAcceptanceAnalytics(programType, period),
	});
}

export function useMedicareComplianceBundleQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "medicare-compliance"),
		queryFn: () => getMedicareComplianceBundle(),
	});
}

export function usePatchProgramExceptionMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			patchProgramException(id, { status }),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: ["medicaid-encounter"] });
			await qc.invalidateQueries({ queryKey: [domain] });
		},
	});
}

export function useProgramScale(programType: ProgramType) {
	return getProgramScale(programType);
}

export { getProgramScale };

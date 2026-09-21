"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { featureQueryKey } from "@/features/admin/shared/feature-contract";

import {
	getValidationDerivedFromLive,
	listDocumentLibrary,
	listExceptionDetails,
	listResponseFiles,
	updateExceptionStatus,
} from "../api/medicaid-encounterApi";

const domain = "medicaid-encounter";

export * from "../types/medicaid-encounterModel";

export function useMedicaidEncounterDocumentLibraryQuery(
	programType: ProgramType = "medicaid",
	reportingPeriod?: string
) {
	return useQuery({
		queryKey: featureQueryKey(
			domain,
			"documentLibrary",
			programType,
			reportingPeriod ?? null
		),
		queryFn: async () => {
			const items = await listDocumentLibrary(programType, reportingPeriod);
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useMedicaidEncounterDocumentLibraryList(
	programType: ProgramType = "medicaid",
	reportingPeriod?: string
) {
	const query = useMedicaidEncounterDocumentLibraryQuery(
		programType,
		reportingPeriod
	);
	return { ...query, documentLibrary: query.data?.items ?? [] };
}

export function useMedicaidEncounterExceptionDetailsQuery(
	programType: ProgramType = "medicaid"
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "exceptionDetails", programType),
		queryFn: async () => {
			const items = await listExceptionDetails(programType);
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useMedicaidEncounterExceptionDetailsList(
	programType: ProgramType = "medicaid"
) {
	const query = useMedicaidEncounterExceptionDetailsQuery(programType);
	return { ...query, exceptionDetails: query.data?.items ?? [] };
}

export function useMedicaidEncounterResponseFilesQuery(
	programType: ProgramType = "medicaid"
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "responseFiles", programType),
		queryFn: async () => {
			const items = await listResponseFiles(programType);
			const list = Array.isArray(items) ? items : [];
			return { items: list, total: list.length };
		},
	});
}

export function useMedicaidEncounterResponseFilesList(
	programType: ProgramType = "medicaid"
) {
	const query = useMedicaidEncounterResponseFilesQuery(programType);
	return { ...query, responseFiles: query.data?.items ?? [] };
}

export function useMedicaidEncounterValidationDerivedQuery(
	programType: ProgramType = "medicaid"
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "validationDerived", programType),
		queryFn: () => getValidationDerivedFromLive(programType),
	});
}

export function useUpdateProgramExceptionMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			updateExceptionStatus(id, status),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: [domain] });
		},
	});
}

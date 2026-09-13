"use client";

import { useQuery } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import {
	useVendorCoreFeatureMutation,
	useVendorCoreFeatureQuery,
} from "@/features/admin/shared/vendor-core-feature-query";
import { isMockEnabled } from "@/lib/mock-mode";
import type { ProgramFileType } from "@/types/UI/system.types";

import type { ClaimHeaderDto } from "../../live-claim-headers";
import {
	type ClaimVendorFileListParams,
	acceptClaimVendorFileLive,
	assignClaimExceptionLive,
	deleteClaimLine,
	exportClaimVendorFilesCsvLive,
	getClaimVendorFileLive,
	getClaimVendorFilesSummaryLive,
	getClaimsForVendorFileLive,
	getInboundQueueSnapshot,
	getProgramExceptions,
	getProgramFiles,
	getProgramResponses,
	getProgramVendorPerformance,
	hardDeleteClaimLine,
	listClaimExceptions,
	listClaimHeadersLive,
	listClaimLines,
	listClaimLinesLive,
	listClaimResponses,
	listClaimVendorFiles,
	listInboundFileEventsLive,
	listSubmissionBatches,
	rejectClaimVendorFileLive,
	reprocessLinkedInboundFile,
	resolveClaimExceptionLive,
	resolveClaimVendorFile,
	restoreClaimLine,
	seedClaimLines,
	seedInboundVendorQueueDemo,
	sendClaimVendorFileLive,
} from "../api/claimEncounterApi";

const domain = "claim-encounter";

const liveStaleMs = 30_000;

export function useClaimVendorFilesQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "vendor-files"),
		queryFn: () => listClaimVendorFiles(),
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useClaimResponsesQuery(enabled = true) {
	return useQuery({
		queryKey: featureQueryKey(domain, "responses"),
		queryFn: listClaimResponses,
		enabled,
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useClaimExceptionsQuery(enabled = true) {
	return useQuery({
		queryKey: featureQueryKey(domain, "exceptions"),
		queryFn: listClaimExceptions,
		enabled,
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useMockClaimLinesQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "claim-lines-mock"),
		queryFn: listClaimLines,
		staleTime: Infinity,
	});
}

export function useSubmissionBatchesQuery() {
	return useQuery({
		queryKey: featureQueryKey(domain, "submission-batches"),
		queryFn: listSubmissionBatches,
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useClaimLinesLiveQuery(enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"claim-lines-live",
		listClaimLinesLive,
		enabled
	);
}

export function useProgramFilesQuery(
	program: ProgramFileType,
	direction: "inbound" | "outbound",
	enabled = true
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "program-files", program, direction),
		queryFn: () => getProgramFiles(program, direction),
		enabled,
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useClaimHeadersLiveQuery(
	enabled = true,
	params?: {
		search?: string;
		vendor_file_id?: string;
		status?: string;
		limit?: number;
	}
) {
	return useVendorCoreFeatureQuery(
		domain,
		"claim-headers-live",
		() => listClaimHeadersLive(params) as Promise<ClaimHeaderDto[]>,
		enabled,
		[
			params?.search ?? "",
			params?.vendor_file_id ?? "",
			params?.status ?? "",
			params?.limit ?? 100,
		]
	);
}

/** Stash-compatible alias of useClaimVendorFileDetailQuery. */
export function useResolveClaimVendorFileQuery(
	idOrRef: string,
	enabled = true
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "vendor-file", idOrRef),
		queryFn: () => resolveClaimVendorFile(idOrRef),
		enabled: Boolean(idOrRef) && enabled,
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useInboundVendorQueueQuery(
	program: ProgramFileType,
	listParams?: ClaimVendorFileListParams
) {
	return useQuery({
		queryKey: featureQueryKey(
			domain,
			"inbound-vendor-queue",
			program,
			listParams ?? null
		),
		queryFn: () => getInboundQueueSnapshot(program, listParams),
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useClaimVendorFileDetailQuery(fileId: string, enabled = true) {
	return useQuery({
		queryKey: featureQueryKey(domain, "vendor-file-detail", fileId),
		queryFn: async () => (await getClaimVendorFileLive(fileId)) ?? null,
		enabled: Boolean(fileId) && enabled,
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

/**
 * Claim lines for a vendor file.
 * Compatible with both main `(fileId, enabled)` and stash `(fileId, program, enabled)`.
 */
export function useClaimsForVendorFileQuery(
	fileId: string,
	programOrEnabled: ProgramFileType | boolean = true,
	enabledArg = true
) {
	const program =
		typeof programOrEnabled === "string" ? programOrEnabled : undefined;
	const enabled =
		typeof programOrEnabled === "boolean" ? programOrEnabled : enabledArg;
	return useQuery({
		queryKey: featureQueryKey(
			domain,
			"vendor-file-claims",
			fileId,
			program ?? "default"
		),
		queryFn: () => getClaimsForVendorFileLive(fileId),
		enabled: Boolean(fileId) && enabled,
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useProgramResponsesQuery(program: ProgramFileType) {
	return useQuery({
		queryKey: featureQueryKey(domain, "program-responses", program),
		queryFn: () => getProgramResponses(program),
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useProgramExceptionsQuery(program: ProgramFileType) {
	return useQuery({
		queryKey: featureQueryKey(domain, "program-exceptions", program),
		queryFn: () => getProgramExceptions(program),
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useProgramVendorPerformanceQuery(program: ProgramFileType) {
	return useQuery({
		queryKey: featureQueryKey(domain, "vendor-performance", program),
		queryFn: () => getProgramVendorPerformance(program),
		staleTime: isMockEnabled() ? Infinity : liveStaleMs,
	});
}

export function useSeedClaimLinesMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof seedClaimLines>>,
		{ vendor_id?: string; force?: boolean } | undefined
	>(domain, {
		mutationFn: (body) => seedClaimLines(body),
	});
}

export function useSeedInboundVendorQueueMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof seedInboundVendorQueueDemo>>,
		{ force?: boolean } | undefined
	>(domain, {
		mutationFn: (body) => seedInboundVendorQueueDemo(body),
	});
}

export function useAcceptClaimVendorFileMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof acceptClaimVendorFileLive>>,
		{ id: string; notes?: string; claim_line_ids?: string[] }
	>(domain, {
		mutationFn: ({ id, notes, claim_line_ids }) =>
			acceptClaimVendorFileLive(id, { notes, claim_line_ids }),
	});
}

export function useRejectClaimVendorFileMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof rejectClaimVendorFileLive>>,
		{
			id: string;
			reasons?: string[];
			notes?: string;
			claim_line_ids?: string[];
		}
	>(domain, {
		mutationFn: ({ id, reasons, notes, claim_line_ids }) =>
			rejectClaimVendorFileLive(id, { reasons, notes, claim_line_ids }),
	});
}

export function useSendClaimVendorFileMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof sendClaimVendorFileLive>>,
		{ id: string; notes?: string; sync?: boolean; force?: boolean }
	>(domain, {
		mutationFn: ({ id, notes, sync, force }) =>
			sendClaimVendorFileLive(id, { notes, sync, force }),
	});
}

export function useClaimVendorFilesSummaryQuery(
	enabled = true,
	params?: ClaimVendorFileListParams
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "vendor-files-summary", params ?? null),
		queryFn: () => getClaimVendorFilesSummaryLive(params),
		enabled: enabled && !isMockEnabled(),
		staleTime: liveStaleMs,
	});
}

export function useExportClaimVendorFilesCsvMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof exportClaimVendorFilesCsvLive>>,
		ClaimVendorFileListParams | undefined
	>(domain, {
		mutationFn: (params) => exportClaimVendorFilesCsvLive(params),
	});
}

export function useReprocessInboundFileMutation() {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (sourceInboundFileId) =>
			reprocessLinkedInboundFile(sourceInboundFileId),
	});
}

export function useInboundFileEventsQuery(
	inboundFileId: string | null | undefined,
	enabled = true
) {
	return useQuery({
		queryKey: featureQueryKey(domain, "inbound-file-events", inboundFileId),
		queryFn: () => listInboundFileEventsLive(inboundFileId!),
		enabled: Boolean(inboundFileId) && enabled && !isMockEnabled(),
		staleTime: liveStaleMs,
	});
}

export function useResolveClaimExceptionMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof resolveClaimExceptionLive>>,
		{ id: string; notes?: string }
	>(domain, {
		mutationFn: ({ id, notes }) => resolveClaimExceptionLive(id, { notes }),
	});
}

export function useAssignClaimExceptionMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof assignClaimExceptionLive>>,
		{ id: string; assigned_to_id?: string | null }
	>(domain, {
		mutationFn: ({ id, assigned_to_id }) =>
			assignClaimExceptionLive(id, { assigned_to_id }),
	});
}

export function useDeleteClaimLineMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof deleteClaimLine>>,
		string
	>(domain, {
		mutationFn: (id) => deleteClaimLine(id),
	});
}

export function useHardDeleteClaimLineMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof hardDeleteClaimLine>>,
		string
	>(domain, {
		mutationFn: (id) => hardDeleteClaimLine(id),
	});
}

export function useRestoreClaimLineMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof restoreClaimLine>>,
		string
	>(domain, {
		mutationFn: (id) => restoreClaimLine(id),
	});
}

export const useVendorCoreClaimLines = useClaimLinesLiveQuery;
export const useSeedClaimLines = useSeedClaimLinesMutation;
export const useDeleteClaimLine = useDeleteClaimLineMutation;
export const useHardDeleteClaimLine = useHardDeleteClaimLineMutation;
export const useRestoreClaimLine = useRestoreClaimLineMutation;

"use client";

import { useQueryClient } from "@tanstack/react-query";

import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import {
	useInvalidateVendorCore,
	useVendorCoreFeatureMutation,
	useVendorCoreFeatureQuery,
} from "@/features/admin/shared/vendor-core-feature-query";
import { isMembersMockEnabled } from "@/lib/mock-mode";
import type {
	MemberDashboardStatsQuery,
	MemberListQuery,
} from "@/lib/vendor-core/types";

import { getMemberSummaries } from "../../mock-data";
import {
	createMember,
	createMemberAccumulator,
	createMemberClaim,
	createMemberException,
	createMemberFamilyLink,
	deleteMember,
	deleteMemberAccumulator,
	deleteMemberClaim,
	deleteMemberException,
	deleteMemberFamilyLink,
	getMemberAccumulatorSummary,
	getMemberDashboardStats,
	getMemberDetail,
	getMemberFamilyLink,
	getMemberSourceRecord,
	hardDeleteMember,
	listAccumulatorFiles,
	listAccumulatorRows,
	listMemberAccumulators,
	listMemberChangeEvents,
	listMemberClaims,
	listMemberCoverages,
	listMemberEligibilityHistory,
	listMemberExceptions,
	listMemberFamilyLinks,
	listMemberPlanHistory,
	listMemberSourceRecords,
	listMemberSummaries,
	listMemberSummariesPage,
	listMemberVendors,
	listPharmacyClaimRows,
	restoreMember,
	seedMembers,
	syncMemberFamilyLinks,
	transferMemberFamilyLink,
	updateMember,
	updateMemberAccumulator,
	updateMemberClaim,
	updateMemberException,
	updateMemberFamilyLink,
} from "../api/membersApi";

const domain = "members";
const apiOnly = !isMembersMockEnabled();

export function useMemberSummariesQuery(filters?: MemberListQuery) {
	return useVendorCoreFeatureQuery(
		domain,
		"summaries",
		() => listMemberSummaries(filters),
		true,
		[filters]
	);
}

export function useMemberSummariesPageQuery(
	filters: MemberListQuery | undefined,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"summaries-page",
		() => listMemberSummariesPage(filters),
		enabled,
		[filters]
	);
}

export function useMemberDashboardStatsQuery(
	params?: MemberDashboardStatsQuery,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"dashboard-stats",
		() => getMemberDashboardStats(params),
		enabled,
		[params]
	);
}

export function useMemberDetailQuery(memberId: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"detail",
		() => getMemberDetail(memberId),
		enabled && Boolean(memberId),
		[memberId]
	);
}

export function useMemberEligibilityHistoryQuery(
	memberId: string,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"eligibility-history",
		() => listMemberEligibilityHistory(memberId),
		enabled && Boolean(memberId) && apiOnly,
		[memberId]
	);
}

export function useMemberPlanHistoryQuery(memberId: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"plan-history",
		() => listMemberPlanHistory(memberId),
		enabled && Boolean(memberId) && apiOnly,
		[memberId]
	);
}

export function useMemberExceptionsQuery(memberId: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"exceptions",
		() => listMemberExceptions(memberId),
		enabled && Boolean(memberId) && apiOnly,
		[memberId]
	);
}

export function useMemberAccumulatorsQuery(memberId: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"accumulators",
		() => listMemberAccumulators(memberId),
		enabled && Boolean(memberId) && apiOnly,
		[memberId]
	);
}

export function useMemberAccumulatorSummaryQuery(
	memberId: string,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"accumulator-summary",
		() => getMemberAccumulatorSummary(memberId),
		enabled && Boolean(memberId),
		[memberId]
	);
}

/** Flat accumulator-rows by cardholder (Recent Transactions feed). */
export function useMemberAccumulatorFileRowsQuery(
	cardholderId: string,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"accumulator-file-rows",
		() =>
			listAccumulatorRows({
				cardholder_id: cardholderId,
				limit: 50,
			}),
		enabled && Boolean(cardholderId) && apiOnly,
		[cardholderId]
	);
}

export function useAccumulatorFilesQuery(
	params?: Parameters<typeof listAccumulatorFiles>[0],
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"accumulator-files",
		() => listAccumulatorFiles(params),
		enabled && apiOnly,
		[params]
	);
}

export function usePharmacyClaimRowsQuery(
	params?: Parameters<typeof listPharmacyClaimRows>[0],
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"pharmacy-claim-rows",
		() => listPharmacyClaimRows(params),
		enabled && apiOnly,
		[params]
	);
}

export function useMemberClaimsQuery(
	memberId: string,
	claimKind?: string,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"claims",
		() => listMemberClaims(memberId, claimKind),
		enabled && Boolean(memberId) && apiOnly,
		[memberId, claimKind]
	);
}

export function useMemberChangeEventsQuery(memberId: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"change-events",
		() => listMemberChangeEvents(memberId),
		enabled && Boolean(memberId) && apiOnly,
		[memberId]
	);
}

export function useMemberFamilyLinksQuery(memberId: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"family-links",
		() => listMemberFamilyLinks(memberId),
		enabled && Boolean(memberId) && apiOnly,
		[memberId]
	);
}

export function useMemberFamilyLinkQuery(
	memberId: string,
	linkId: string,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"family-link",
		() => getMemberFamilyLink(memberId, linkId),
		enabled && Boolean(memberId) && Boolean(linkId),
		[memberId, linkId]
	);
}

export function useMemberSourceRecordsQuery(memberId: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"source-records",
		() => listMemberSourceRecords(memberId),
		enabled && Boolean(memberId) && apiOnly,
		[memberId]
	);
}

export function useMemberSourceRecordQuery(
	memberId: string,
	recordId: string,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"source-record",
		() => getMemberSourceRecord(memberId, recordId),
		enabled && Boolean(memberId) && Boolean(recordId) && apiOnly,
		[memberId, recordId]
	);
}

export function useCreateMemberExceptionMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (body: Parameters<typeof createMemberException>[1]) =>
			createMemberException(memberId, body),
	});
}

export function useCreateMemberAccumulatorMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (body: Parameters<typeof createMemberAccumulator>[1]) =>
			createMemberAccumulator(memberId, body),
	});
}

export function useCreateMemberClaimMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (body: Parameters<typeof createMemberClaim>[1]) =>
			createMemberClaim(memberId, body),
	});
}

export function useUpdateMemberExceptionMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: ({
			exceptionId,
			body,
		}: {
			exceptionId: string;
			body: Record<string, unknown>;
		}) => updateMemberException(memberId, exceptionId, body),
	});
}

export function useDeleteMemberExceptionMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (exceptionId: string) =>
			deleteMemberException(memberId, exceptionId),
	});
}

export function useUpdateMemberAccumulatorMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: ({
			accumulatorId,
			body,
		}: {
			accumulatorId: string;
			body: Parameters<typeof updateMemberAccumulator>[2];
		}) => updateMemberAccumulator(memberId, accumulatorId, body),
	});
}

export function useDeleteMemberAccumulatorMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (accumulatorId: string) =>
			deleteMemberAccumulator(memberId, accumulatorId),
	});
}

export function useUpdateMemberClaimMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: ({
			claimId,
			body,
		}: {
			claimId: string;
			body: Record<string, unknown>;
		}) => updateMemberClaim(memberId, claimId, body),
	});
}

export function useDeleteMemberClaimMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (claimId: string) => deleteMemberClaim(memberId, claimId),
	});
}

export function useCreateMemberMutation() {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (body: Parameters<typeof createMember>[0]) =>
			createMember(body),
	});
}

export function useUpdateMemberMutation() {
	const queryClient = useQueryClient();
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: Parameters<typeof updateMember>[1];
		}) => updateMember(id, body),
		onSuccess: (detail, { id }) => {
			if (!detail) return;
			queryClient.setQueryData(featureQueryKey(domain, "detail", id), detail);
			queryClient.setQueriesData(
				{ queryKey: featureQueryKey(domain, "detail") },
				(current) => {
					if (
						current &&
						typeof current === "object" &&
						"id" in current &&
						String((current as { id: unknown }).id) === String(id)
					) {
						return detail;
					}
					return current;
				}
			);
		},
	});
}

export function useDeleteMemberMutation() {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (id: string) => deleteMember(id),
	});
}

export function useHardDeleteMemberMutation() {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (id: string) => hardDeleteMember(id),
	});
}

export function useRestoreMemberMutation() {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (id: string) => restoreMember(id),
	});
}

export function useSeedMembersMutation() {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (body?: Record<string, unknown>) => seedMembers(body),
	});
}

export function useCreateMemberFamilyLinkMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (body: Parameters<typeof createMemberFamilyLink>[1]) =>
			createMemberFamilyLink(memberId, body),
	});
}

export function useUpdateMemberFamilyLinkMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: ({
			linkId,
			body,
		}: {
			linkId: string;
			body: { relationship_code?: string; relationship_label?: string };
		}) => updateMemberFamilyLink(memberId, linkId, body),
	});
}

export function useDeleteMemberFamilyLinkMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: (linkId: string) => deleteMemberFamilyLink(memberId, linkId),
	});
}

export function useSyncMemberFamilyLinksMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: () => syncMemberFamilyLinks(memberId),
	});
}

export function useTransferMemberFamilyLinkMutation(memberId: string) {
	return useVendorCoreFeatureMutation(domain, {
		mutationFn: ({
			linkId,
			body,
		}: {
			linkId: string;
			body: { new_subscriber_id: string };
		}) => transferMemberFamilyLink(memberId, linkId, body),
	});
}

export function useMemberCoveragesQuery() {
	return useVendorCoreFeatureQuery(
		domain,
		"coverages",
		listMemberCoverages,
		apiOnly
	);
}

export function useMemberVendorsQuery() {
	return useVendorCoreFeatureQuery(
		domain,
		"vendors",
		listMemberVendors,
		apiOnly
	);
}

export function useMemberSummariesList(filters?: MemberListQuery) {
	const query = useMemberSummariesQuery(filters);
	const members = isMembersMockEnabled()
		? getMemberSummaries()
		: (query.data ?? []);
	return { ...query, members };
}

export function useMemberCoveragesList() {
	const query = useMemberCoveragesQuery();
	return { ...query, coverages: query.data ?? [] };
}

export const useVendorCoreMemberCoverages = useMemberCoveragesQuery;
export const useVendorCoreVendors = useMemberVendorsQuery;

export { useInvalidateVendorCore };

export const useMembersQuery = useMemberSummariesQuery;
export const useMembersDetailQuery = useMemberDetailQuery;

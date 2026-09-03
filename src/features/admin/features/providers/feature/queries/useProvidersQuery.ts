"use client";

import {
	useInvalidateVendorCore,
	useVendorCoreFeatureMutation,
	useVendorCoreFeatureQuery,
} from "@/features/admin/shared/vendor-core-feature-query";
import { isMockEnabled } from "@/lib/mock-mode";
import type {
	ProviderCreateInput,
	ProviderCredentialCreateInput,
	ProviderCredentialUpdateInput,
	ProviderDashboardStatsQuery,
	ProviderExceptionCreateInput,
	ProviderExceptionUpdateInput,
	ProviderIdentifierCreateInput,
	ProviderIdentifierUpdateInput,
	ProviderListQuery,
	ProviderLocationCreateInput,
	ProviderLocationUpdateInput,
	ProviderNetworkCreateInput,
	ProviderNetworkUpdateInput,
	ProviderRosterCreateInput,
	ProviderRosterListQuery,
	ProviderRosterUpdateInput,
	ProviderStatusInput,
	ProviderUpdateInput,
} from "@/lib/vendor-core/types";

import { getProviderSummaries } from "../../mock-data";
import {
	createProvider,
	createProviderCredential,
	createProviderException,
	createProviderIdentifier,
	createProviderLocation,
	createProviderNetwork,
	createProviderRoster,
	deleteProvider,
	deleteProviderCredential,
	deleteProviderException,
	deleteProviderIdentifier,
	deleteProviderLocation,
	deleteProviderNetwork,
	deleteProviderRoster,
	getProviderDashboardStats,
	getProviderDetail,
	hardDeleteProvider,
	listProviderRosters,
	listProviderSummaries,
	listProviders,
	recountProviderRoster,
	restoreProvider,
	restoreProviderRoster,
	seedProviders,
	setProviderStatus,
	updateProvider,
	updateProviderCredential,
	updateProviderException,
	updateProviderIdentifier,
	updateProviderLocation,
	updateProviderNetwork,
	updateProviderRoster,
} from "../api/providersApi";
import type { ProviderSummary } from "../api/providersApi";

const domain = "providers";
const liveOnly = !isMockEnabled();

export function useProviderSummariesQuery() {
	return useVendorCoreFeatureQuery(domain, "summaries", listProviderSummaries);
}

export function useProvidersQuery(enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"list",
		listProviders,
		enabled && liveOnly
	);
}

export function useProvidersListQuery(
	params: ProviderListQuery | undefined,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"list",
		() => listProviders(params),
		enabled && liveOnly,
		[params]
	);
}

export function useProviderDashboardStatsQuery(
	params?: ProviderDashboardStatsQuery,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"dashboard-stats",
		() => getProviderDashboardStats(params),
		enabled && liveOnly,
		[params]
	);
}

export function useSeedProvidersMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof seedProviders>>,
		{ force?: boolean } | undefined
	>(domain, {
		mutationFn: (body) => seedProviders(body),
	});
}

export function useCreateProviderMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createProvider>>,
		ProviderCreateInput
	>(domain, {
		mutationFn: (body) => createProvider(body),
	});
}

export function useUpdateProviderMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateProvider>>,
		{ id: string; body: ProviderUpdateInput }
	>(domain, {
		mutationFn: ({ id, body }) => updateProvider(id, body),
	});
}

export function useSetProviderStatusMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof setProviderStatus>>,
		{ id: string; body: ProviderStatusInput }
	>(domain, {
		mutationFn: ({ id, body }) => setProviderStatus(id, body),
	});
}

export function useDeleteProviderMutation() {
	return useVendorCoreFeatureMutation<void, { id: string }>(domain, {
		mutationFn: ({ id }) => deleteProvider(id),
	});
}

export function useRestoreProviderMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof restoreProvider>>,
		{ id: string }
	>(domain, {
		mutationFn: ({ id }) => restoreProvider(id),
	});
}

export function useHardDeleteProviderMutation() {
	return useVendorCoreFeatureMutation<void, { id: string }>(domain, {
		mutationFn: ({ id }) => hardDeleteProvider(id),
	});
}

export function useCreateProviderIdentifierMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createProviderIdentifier>>,
		ProviderIdentifierCreateInput
	>(domain, {
		mutationFn: (body) => createProviderIdentifier(providerId, body),
	});
}

export function useUpdateProviderIdentifierMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateProviderIdentifier>>,
		{ identifierId: string; body: ProviderIdentifierUpdateInput }
	>(domain, {
		mutationFn: ({ identifierId, body }) =>
			updateProviderIdentifier(providerId, identifierId, body),
	});
}

export function useDeleteProviderIdentifierMutation(providerId: string) {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (identifierId) =>
			deleteProviderIdentifier(providerId, identifierId),
	});
}

export function useCreateProviderLocationMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createProviderLocation>>,
		ProviderLocationCreateInput
	>(domain, {
		mutationFn: (body) => createProviderLocation(providerId, body),
	});
}

export function useUpdateProviderLocationMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateProviderLocation>>,
		{ locationId: string; body: ProviderLocationUpdateInput }
	>(domain, {
		mutationFn: ({ locationId, body }) =>
			updateProviderLocation(providerId, locationId, body),
	});
}

export function useDeleteProviderLocationMutation(providerId: string) {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (locationId) => deleteProviderLocation(providerId, locationId),
	});
}

export function useCreateProviderNetworkMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createProviderNetwork>>,
		ProviderNetworkCreateInput
	>(domain, {
		mutationFn: (body) => createProviderNetwork(providerId, body),
	});
}

export function useUpdateProviderNetworkMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateProviderNetwork>>,
		{ networkId: string; body: ProviderNetworkUpdateInput }
	>(domain, {
		mutationFn: ({ networkId, body }) =>
			updateProviderNetwork(providerId, networkId, body),
	});
}

export function useDeleteProviderNetworkMutation(providerId: string) {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (networkId) => deleteProviderNetwork(providerId, networkId),
	});
}

export function useCreateProviderCredentialMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createProviderCredential>>,
		ProviderCredentialCreateInput
	>(domain, {
		mutationFn: (body) => createProviderCredential(providerId, body),
	});
}

export function useUpdateProviderCredentialMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateProviderCredential>>,
		{ credentialId: string; body: ProviderCredentialUpdateInput }
	>(domain, {
		mutationFn: ({ credentialId, body }) =>
			updateProviderCredential(providerId, credentialId, body),
	});
}

export function useDeleteProviderCredentialMutation(providerId: string) {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (credentialId) =>
			deleteProviderCredential(providerId, credentialId),
	});
}

export function useCreateProviderExceptionMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createProviderException>>,
		ProviderExceptionCreateInput
	>(domain, {
		mutationFn: (body) => createProviderException(providerId, body),
	});
}

export function useUpdateProviderExceptionMutation(providerId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateProviderException>>,
		{ exceptionId: string; body: ProviderExceptionUpdateInput }
	>(domain, {
		mutationFn: ({ exceptionId, body }) =>
			updateProviderException(providerId, exceptionId, body),
	});
}

export function useDeleteProviderExceptionMutation(providerId: string) {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (exceptionId) =>
			deleteProviderException(providerId, exceptionId),
	});
}

export function useProviderRostersQuery(
	params?: ProviderRosterListQuery,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"rosters",
		() => listProviderRosters(params),
		enabled && liveOnly,
		[params]
	);
}

export function useCreateProviderRosterMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createProviderRoster>>,
		ProviderRosterCreateInput
	>(domain, {
		mutationFn: (body) => createProviderRoster(body),
	});
}

export function useUpdateProviderRosterMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateProviderRoster>>,
		{ id: string; body: ProviderRosterUpdateInput }
	>(domain, {
		mutationFn: ({ id, body }) => updateProviderRoster(id, body),
	});
}

export function useRecountProviderRosterMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof recountProviderRoster>>,
		{ id: string }
	>(domain, {
		mutationFn: ({ id }) => recountProviderRoster(id),
	});
}

export function useDeleteProviderRosterMutation() {
	return useVendorCoreFeatureMutation<void, { id: string }>(domain, {
		mutationFn: ({ id }) => deleteProviderRoster(id),
	});
}

export function useRestoreProviderRosterMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof restoreProviderRoster>>,
		{ id: string }
	>(domain, {
		mutationFn: ({ id }) => restoreProviderRoster(id),
	});
}

export function useProviderDetailQuery(
	providerId: string,
	enabled = true,
	program: ProviderSummary["program"] = "DHCF"
) {
	return useVendorCoreFeatureQuery(
		domain,
		"detail",
		() => getProviderDetail(providerId, program),
		enabled && liveOnly && Boolean(providerId),
		[providerId, program]
	);
}

export function useProviderSummariesList() {
	const query = useProviderSummariesQuery();
	const providers = isMockEnabled()
		? getProviderSummaries()
		: (query.data ?? []);
	return { ...query, providers };
}

export const useVendorCoreProviders = useProvidersQuery;
export const useProvidersDetailQuery = useProvidersQuery;

export { useInvalidateVendorCore };

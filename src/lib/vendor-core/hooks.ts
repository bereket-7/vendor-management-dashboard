"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useVendorCoreSession } from "@/components/vendor-core/VendorCoreGate";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import { VendorCoreApiError } from "@/lib/vendor-core/client";

export const vendorCoreKeys = {
	all: ["vendor-core"] as const,
	vendors: () => [...vendorCoreKeys.all, "vendors"] as const,
	vendor: (id: string) => [...vendorCoreKeys.vendors(), id] as const,
	connections: (vendorId?: string) =>
		[...vendorCoreKeys.all, "connections", vendorId ?? "all"] as const,
	jobs: (vendorId?: string) =>
		[...vendorCoreKeys.all, "jobs", vendorId ?? "all"] as const,
	files: (params?: Record<string, string | undefined>) =>
		[...vendorCoreKeys.all, "files", params ?? {}] as const,
	monitoring: () => [...vendorCoreKeys.all, "monitoring"] as const,
	errors: (status?: string) =>
		[...vendorCoreKeys.all, "errors", status ?? "all"] as const,
	audit: () => [...vendorCoreKeys.all, "audit"] as const,
	accounts: (vendorId?: string) =>
		[...vendorCoreKeys.all, "accounts", vendorId ?? "all"] as const,
	routing: () => [...vendorCoreKeys.all, "routing"] as const,
	users: () => [...vendorCoreKeys.all, "users"] as const,
	loginEvents: (scope?: string) =>
		[...vendorCoreKeys.all, "login-events", scope ?? "all"] as const,
	memberCoverages: () => [...vendorCoreKeys.all, "member-coverages"] as const,
	jobRuns: (params?: Record<string, string | undefined>) =>
		[...vendorCoreKeys.all, "job-runs", params ?? {}] as const,
	inboundFileEvents: (id: string) =>
		[...vendorCoreKeys.all, "inbound-file-events", id] as const,
	validationResults: (params?: Record<string, string | undefined>) =>
		[...vendorCoreKeys.all, "validation-results", params ?? {}] as const,
	providers: () => [...vendorCoreKeys.all, "providers"] as const,
	providerRosters: () => [...vendorCoreKeys.all, "provider-rosters"] as const,
	claimLines: () => [...vendorCoreKeys.all, "claim-lines"] as const,
	credentials: () => [...vendorCoreKeys.all, "credentials"] as const,
	eligibilityFiles: () => [...vendorCoreKeys.all, "eligibility-files"] as const,
	claimVendorFiles: () =>
		[...vendorCoreKeys.all, "claim-vendor-files"] as const,
	claimResponses: () => [...vendorCoreKeys.all, "claim-responses"] as const,
	claimExceptions: () => [...vendorCoreKeys.all, "claim-exceptions"] as const,
	notifications: () => [...vendorCoreKeys.all, "notifications"] as const,
};

function useAuthAwareQuery<T>(
	queryKey: readonly unknown[],
	queryFn: () => Promise<T>,
	enabled = true
) {
	const session = useVendorCoreSession();

	/* Callers own the cache key; auth only gates fetching. */
	/* eslint-disable @tanstack/query/exhaustive-deps -- wrapper: stable keys from callers */
	return useQuery({
		queryKey,
		enabled: session.live && session.authed && enabled,
		queryFn: async () => {
			try {
				return await queryFn();
			} catch (err) {
				if (
					err instanceof VendorCoreApiError &&
					(err.status === 401 || err.status === 403)
				) {
					session.markUnauthed();
				}
				throw err;
			}
		},
		staleTime: 15_000,
		refetchOnMount: "always",
	});
	/* eslint-enable @tanstack/query/exhaustive-deps */
}

export function useVendorCoreVendors() {
	return useAuthAwareQuery(vendorCoreKeys.vendors(), async () => {
		const page = await vendorCoreApi.listVendors();
		return page.results ?? [];
	});
}

export function useVendorCoreVendor(id: string) {
	return useAuthAwareQuery(
		vendorCoreKeys.vendor(id),
		() => vendorCoreApi.getVendor(id),
		Boolean(id)
	);
}

export function useVendorCoreConnections(vendorId?: string) {
	return useAuthAwareQuery(vendorCoreKeys.connections(vendorId), async () => {
		const page = await vendorCoreApi.listConnections(
			vendorId ? { vendor_id: vendorId } : undefined
		);
		return page.results ?? [];
	});
}

export function useVendorCoreJobs(vendorId?: string) {
	return useAuthAwareQuery(vendorCoreKeys.jobs(vendorId), async () => {
		const page = await vendorCoreApi.listIntakeJobs(
			vendorId ? { vendor_id: vendorId } : undefined
		);
		return page.results ?? [];
	});
}

export function useVendorCoreInboundFiles(params?: {
	stage?: string;
	vendor_id?: string;
}) {
	return useAuthAwareQuery(vendorCoreKeys.files(params), async () => {
		const page = await vendorCoreApi.listInboundFiles(params);
		return page.results ?? [];
	});
}

export function useVendorCoreInboundFile(id: string) {
	return useAuthAwareQuery(
		[...vendorCoreKeys.all, "file", id] as const,
		() => vendorCoreApi.getInboundFile(id),
		Boolean(id)
	);
}

export function useVendorCoreMonitoring() {
	return useAuthAwareQuery(vendorCoreKeys.monitoring(), () =>
		vendorCoreApi.getMonitoring()
	);
}

export function useVendorCoreErrors(status = "open", enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.errors(status),
		async () => {
			const page = await vendorCoreApi.listErrors(
				status === "all" ? undefined : { status }
			);
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreAudit() {
	return useAuthAwareQuery(vendorCoreKeys.audit(), async () => {
		const page = await vendorCoreApi.listAudit();
		return page.results ?? [];
	});
}

export function useVendorCoreAccounts(vendorId?: string) {
	return useAuthAwareQuery(vendorCoreKeys.accounts(vendorId), async () => {
		const page = await vendorCoreApi.listAccounts(
			vendorId ? { vendor_id: vendorId } : undefined
		);
		return page.results ?? [];
	});
}

export function useVendorCoreRoutingRules() {
	return useAuthAwareQuery(vendorCoreKeys.routing(), async () => {
		const page = await vendorCoreApi.listRoutingRules();
		return page.results ?? [];
	});
}

export function useVendorCoreUsers() {
	return useAuthAwareQuery(vendorCoreKeys.users(), async () => {
		const page = await vendorCoreApi.listUsers();
		return page.results ?? [];
	});
}

export function useVendorCoreLoginEvents(scope: "all" | "me" | string = "all") {
	return useAuthAwareQuery(vendorCoreKeys.loginEvents(scope), async () => {
		if (scope === "me") {
			const page = await vendorCoreApi.listMyLoginEvents();
			return page.results ?? [];
		}
		if (scope !== "all") {
			const page = await vendorCoreApi.listUserLoginEvents(scope);
			return page.results ?? [];
		}
		const page = await vendorCoreApi.listLoginEvents();
		return page.results ?? [];
	});
}

export function useVendorCoreMemberCoverages() {
	return useAuthAwareQuery(vendorCoreKeys.memberCoverages(), async () => {
		const page = await vendorCoreApi.listMemberCoverages();
		return page.results ?? [];
	});
}

export function useVendorCoreJobRuns(params?: {
	job_id?: string;
	stage?: string;
}) {
	return useAuthAwareQuery(vendorCoreKeys.jobRuns(params), async () => {
		const page = await vendorCoreApi.listIntakeJobRuns(params);
		return page.results ?? [];
	});
}

export function useVendorCoreInboundFileEvents(inboundFileId: string) {
	return useAuthAwareQuery(
		vendorCoreKeys.inboundFileEvents(inboundFileId),
		() => vendorCoreApi.listInboundFileEvents(inboundFileId),
		Boolean(inboundFileId)
	);
}

export function useVendorCoreValidationResults(
	params?: {
		inbound_file_id?: string;
		search?: string;
	},
	enabled = true
) {
	return useAuthAwareQuery(
		vendorCoreKeys.validationResults(params),
		async () => {
			const page = await vendorCoreApi.listValidationResults(params);
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreProviders(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.providers(),
		async () => {
			const page = await vendorCoreApi.listProviders();
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreProviderRosters(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.providerRosters(),
		async () => {
			const page = await vendorCoreApi.listProviderRosters();
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreClaimLines(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.claimLines(),
		async () => {
			const page = await vendorCoreApi.listClaimLines();
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreCredentials(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.credentials(),
		async () => {
			const page = await vendorCoreApi.listCredentials();
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreEligibilityFiles(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.eligibilityFiles(),
		async () => {
			const page = await vendorCoreApi.listEligibilityFiles();
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreClaimVendorFiles(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.claimVendorFiles(),
		async () => {
			const page = await vendorCoreApi.listClaimVendorFiles();
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreClaimResponses(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.claimResponses(),
		async () => {
			const page = await vendorCoreApi.listClaimResponses();
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreClaimExceptions(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.claimExceptions(),
		async () => {
			const page = await vendorCoreApi.listClaimExceptions();
			return page.results ?? [];
		},
		enabled
	);
}

export function useVendorCoreNotifications(enabled = true) {
	return useAuthAwareQuery(
		vendorCoreKeys.notifications(),
		async () => {
			const page = await vendorCoreApi.listNotifications();
			return page.results ?? [];
		},
		enabled
	);
}

export function useInvalidateVendorCore() {
	const client = useQueryClient();
	return () => client.invalidateQueries({ queryKey: vendorCoreKeys.all });
}

export function useCreateIntakeJob() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (body: Record<string, unknown>) =>
			vendorCoreApi.createIntakeJob(body),
		onSuccess: () => invalidate(),
	});
}

export function useUpdateIntakeJob() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
			vendorCoreApi.updateIntakeJob(id, body),
		onSuccess: () => invalidate(),
	});
}

export function useRunIntakeJob() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (id: string) => vendorCoreApi.runIntakeJob(id),
		onSuccess: () => invalidate(),
	});
}

export function useCreateCredential() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (body: {
			name: string;
			kind: string;
			secret_ref: string;
			metadata?: Record<string, unknown>;
		}) => vendorCoreApi.createCredential(body),
		onSuccess: () => invalidate(),
	});
}

export function useCreateRoutingRule() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (body: Record<string, unknown>) =>
			vendorCoreApi.createRoutingRule(body),
		onSuccess: () => invalidate(),
	});
}

export function useCreateEligibilityFile() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (body: {
			vendor_id?: string;
			original_filename?: string;
			received_at?: string;
			member_count?: number;
		}) => vendorCoreApi.createEligibilityFile(body),
		onSuccess: () => invalidate(),
	});
}

export function useCreateClaimLine() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (body: Record<string, unknown>) =>
			vendorCoreApi.createClaimLine(body),
		onSuccess: () => invalidate(),
	});
}

export function useUpdateClaimLine() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
			vendorCoreApi.updateClaimLine(id, body),
		onSuccess: () => invalidate(),
	});
}

export function useDeleteClaimLine() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (id: string) => vendorCoreApi.deleteClaimLine(id),
		onSuccess: () => invalidate(),
	});
}

export function useHardDeleteClaimLine() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (id: string) => vendorCoreApi.hardDeleteClaimLine(id),
		onSuccess: () => invalidate(),
	});
}

export function useRestoreClaimLine() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (id: string) => vendorCoreApi.restoreClaimLine(id),
		onSuccess: () => invalidate(),
	});
}

export function useSeedClaimLines() {
	const invalidate = useInvalidateVendorCore();
	return useMutation({
		mutationFn: (body?: { vendor_id?: string; force?: boolean }) =>
			vendorCoreApi.seedClaimLines(body),
		onSuccess: () => invalidate(),
	});
}

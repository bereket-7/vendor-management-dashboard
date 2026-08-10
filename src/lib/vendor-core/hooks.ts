"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useVendorCoreSession } from "@/components/vendor-core/VendorCoreGate";
import { VendorCoreApiError } from "@/lib/vendor-core/client";
import { vendorCoreApi } from "@/lib/vendor-core/api";

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
};

function useAuthAwareQuery<T>(
	queryKey: readonly unknown[],
	queryFn: () => Promise<T>,
	enabled = true
) {
	const session = useVendorCoreSession();

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

export function useVendorCoreValidationResults(params?: {
	inbound_file_id?: string;
	search?: string;
}) {
	return useAuthAwareQuery(vendorCoreKeys.validationResults(params), async () => {
		const page = await vendorCoreApi.listValidationResults(params);
		return page.results ?? [];
	});
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

export function useInvalidateVendorCore() {
	const client = useQueryClient();
	return () => client.invalidateQueries({ queryKey: vendorCoreKeys.all });
}

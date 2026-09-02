"use client";

import {
	useInvalidateVendorCore,
	useVendorCoreFeatureMutation,
	useVendorCoreFeatureQuery,
} from "@/features/admin/shared/vendor-core-feature-query";
import type { AccountUpdateInput } from "@/lib/vendor-core/types";

import type { VendorAccountRow } from "../../vendor-types";
import {
	createIntakeJob,
	createVendorAccount,
	createVendorNote,
	deleteVendorAccount,
	deleteVendorNote,
	getVendor,
	hardDeleteVendorAccount,
	listInboundFileEvents,
	listVendorAccountOpsSummaries,
	listVendorAccounts,
	listVendorConnections,
	listVendorInboundFiles,
	listVendorJobs,
	listVendorNotes,
	listVendors,
	reprocessInboundFile,
	restoreVendorAccount,
	runIntakeJob,
	testVendorConnection,
	updateIntakeJob,
	updateVendorAccount,
	updateVendorConnection,
	updateVendorNote,
} from "../api/vendorsApi";
import { accountRowLobToApi } from "../mappers/accountMappers";

const domain = "vendors";

export function useVendorsQuery() {
	return useVendorCoreFeatureQuery(domain, "list", listVendors);
}

export function useVendorDetailQuery(id: string | null | undefined) {
	return useVendorCoreFeatureQuery(
		domain,
		"detail",
		() => getVendor(String(id)),
		Boolean(id),
		[id ?? ""]
	);
}

export function useVendorConnectionsQuery(vendorId?: string) {
	return useVendorCoreFeatureQuery(
		domain,
		"connections",
		() => listVendorConnections(vendorId),
		true,
		[vendorId ?? "all"]
	);
}

export function useVendorJobsQuery(vendorId?: string) {
	return useVendorCoreFeatureQuery(
		domain,
		"jobs",
		() => listVendorJobs(vendorId),
		true,
		[vendorId ?? "all"]
	);
}

export function useVendorAccountsQuery(vendorId?: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"accounts",
		() => listVendorAccounts(vendorId),
		enabled,
		[vendorId ?? "all"]
	);
}

export function useVendorInboundFilesQuery(params?: {
	stage?: string;
	vendor_id?: string;
}) {
	return useVendorCoreFeatureQuery(
		domain,
		"inbound-files",
		() => listVendorInboundFiles(params),
		true,
		[params ?? {}]
	);
}

export function useVendorAccountOpsQuery(vendorId?: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"account-ops",
		() => listVendorAccountOpsSummaries(String(vendorId)),
		Boolean(vendorId) && enabled,
		[vendorId ?? ""]
	);
}

export function useVendorNotesQuery(vendorId?: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"notes",
		() => listVendorNotes(String(vendorId)),
		Boolean(vendorId) && enabled,
		[vendorId ?? ""]
	);
}

export function useVendorsList() {
	const query = useVendorsQuery();
	return { ...query, vendors: query.data ?? [] };
}

export function useVendor(id: string | null | undefined) {
	const query = useVendorDetailQuery(id);
	return { ...query, vendor: query.data };
}

/** Convenience aliases matching legacy vendor-core hook names. */
export const useVendorCoreVendors = useVendorsQuery;
export const useVendorCoreVendor = useVendorDetailQuery;
export const useVendorCoreConnections = useVendorConnectionsQuery;
export const useVendorCoreJobs = useVendorJobsQuery;
export const useVendorCoreAccounts = useVendorAccountsQuery;
export const useVendorCoreInboundFiles = useVendorInboundFilesQuery;

export const useVendorsDetailQuery = useVendorDetailQuery;

export function useUpdateVendorAccountMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateVendorAccount>>,
		{
			id: string;
			patch: Pick<
				VendorAccountRow,
				"name" | "lineOfBusiness" | "status" | "active"
			>;
		}
	>(domain, {
		mutationFn: async ({ id, patch }) => {
			const body: AccountUpdateInput = {
				name: patch.name,
				line_of_business: accountRowLobToApi(patch.lineOfBusiness),
				active: patch.active,
			};
			return updateVendorAccount(id, body);
		},
	});
}

export function useCreateVendorAccountMutation(vendorId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createVendorAccount>>,
		{
			account_code: string;
			name: string;
			line_of_business: string;
			active?: boolean;
		}
	>(domain, {
		mutationFn: (body) =>
			createVendorAccount({
				vendor_id: vendorId,
				...body,
			}),
	});
}

export function useDeleteVendorAccountMutation() {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (id) => deleteVendorAccount(id),
	});
}

export function useRestoreVendorAccountMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof restoreVendorAccount>>,
		string
	>(domain, {
		mutationFn: (id) => restoreVendorAccount(id),
	});
}

export function useHardDeleteVendorAccountMutation() {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (id) => hardDeleteVendorAccount(id),
	});
}

export function useRunIntakeJobMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof runIntakeJob>>,
		string
	>(domain, {
		mutationFn: (id) => runIntakeJob(id),
	});
}

export function useUpdateIntakeJobMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateIntakeJob>>,
		{ id: string; body: Record<string, unknown> }
	>(domain, {
		mutationFn: ({ id, body }) => updateIntakeJob(id, body),
	});
}

export function useCreateIntakeJobMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createIntakeJob>>,
		Record<string, unknown>
	>(domain, {
		mutationFn: (body) => createIntakeJob(body),
	});
}

export function useReprocessInboundFileMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof reprocessInboundFile>>,
		string
	>(domain, {
		mutationFn: (id) => reprocessInboundFile(id),
	});
}

export function useTestConnectionMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof testVendorConnection>>,
		string
	>(domain, {
		mutationFn: (id) => testVendorConnection(id),
	});
}

export function useUpdateConnectionMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateVendorConnection>>,
		{ id: string; body: Record<string, unknown> }
	>(domain, {
		mutationFn: ({ id, body }) => updateVendorConnection(id, body),
	});
}

export function useCreateVendorNoteMutation(vendorId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createVendorNote>>,
		{ body: string; is_pinned?: boolean }
	>(domain, {
		mutationFn: ({ body, is_pinned }) =>
			createVendorNote({ vendor_id: vendorId, body, is_pinned }),
	});
}

export function useUpdateVendorNoteMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateVendorNote>>,
		{ id: string; body: { body?: string; is_pinned?: boolean } }
	>(domain, {
		mutationFn: ({ id, body }) => updateVendorNote(id, body),
	});
}

export function useDeleteVendorNoteMutation() {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (id) => deleteVendorNote(id),
	});
}

export { useInvalidateVendorCore, listInboundFileEvents };

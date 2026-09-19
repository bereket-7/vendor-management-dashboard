"use client";

import {
	useInvalidateVendorCore,
	useVendorCoreFeatureMutation,
	useVendorCoreFeatureQuery,
} from "@/features/admin/shared/vendor-core-feature-query";
import type {
	AccountCreateInput,
	AccountUpdateInput,
	ConnectionCreateInput,
	ConnectionUpdateInput,
	CredentialCreateInput,
	VendorContactCreateInput,
	VendorContactUpdateInput,
	VendorIntegrationProfileUpdateInput,
} from "@/lib/vendor-core/types";

import type { VendorAccountRow } from "../../vendor-types";
import { getVendorDetailBundle } from "../api/vendorDetailApi";
import {
	createIntakeJob,
	createVendorAccount,
	createVendorCategoryAssignment,
	createVendorCertificate,
	createVendorConnection,
	createVendorContact,
	createVendorCredential,
	createVendorNote,
	deleteVendorAccount,
	deleteVendorCategoryAssignment,
	deleteVendorConnection,
	deleteVendorContact,
	deleteVendorNote,
	disableIntakeJob,
	getVendor,
	getVendorIntegrationProfile,
	hardDeleteVendorAccount,
	listInboundFileEvents,
	listVendorAccountOpsSummaries,
	listVendorAccounts,
	listVendorCategories,
	listVendorCategoryAssignments,
	listVendorCertificates,
	listVendorConnections,
	listVendorContacts,
	listVendorCredentials,
	listVendorInboundFiles,
	listVendorJobs,
	listVendorNotes,
	listVendors,
	reprocessInboundFile,
	restoreVendorAccount,
	runIntakeJob,
	testVendorConnection,
	triggerInboundFileBrowserDownload,
	updateIntakeJob,
	updateVendorAccount,
	updateVendorCertificate,
	updateVendorConnection,
	updateVendorContact,
	updateVendorIntegrationProfile,
	updateVendorNote,
} from "../api/vendorsApi";
import { accountRowLobToApi } from "../mappers/accountMappers";

const domain = "vendors";

export function useVendorsQuery() {
	return useVendorCoreFeatureQuery(domain, "list", listVendors);
}

export function useVendorCategoriesQuery(enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"categories",
		() => listVendorCategories({ is_active: true }),
		enabled
	);
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

export function useVendorIntegrationProfileQuery(
	vendorId?: string,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"integration-profile",
		() => getVendorIntegrationProfile(String(vendorId)),
		Boolean(vendorId) && enabled,
		[vendorId ?? ""]
	);
}

export function useVendorContactsQuery(vendorId?: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"contacts",
		() => listVendorContacts(vendorId),
		Boolean(vendorId) && enabled,
		[vendorId ?? ""]
	);
}

export function useVendorDetailBundleQuery(vendorId?: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"detail-bundle",
		() => getVendorDetailBundle(String(vendorId)),
		Boolean(vendorId) && enabled,
		[vendorId ?? ""]
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

export function useCreateVendorAccountMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createVendorAccount>>,
		AccountCreateInput
	>(domain, {
		mutationFn: (body) =>
			createVendorAccount({
				is_visible: true,
				health_score: 90,
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

export function useDisableIntakeJobMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof disableIntakeJob>>,
		string
	>(domain, {
		mutationFn: (id) => disableIntakeJob(id),
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

export function useDownloadInboundFileMutation() {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (id) => triggerInboundFileBrowserDownload(id),
	});
}

export function useDeleteConnectionMutation() {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (id) => deleteVendorConnection(id),
	});
}

export function useVendorCategoryAssignmentsQuery(
	vendorId?: string,
	enabled = true
) {
	return useVendorCoreFeatureQuery(
		domain,
		"category-assignments",
		() => listVendorCategoryAssignments(String(vendorId)),
		Boolean(vendorId) && enabled,
		[vendorId ?? ""]
	);
}

export function useCreateVendorCategoryAssignmentMutation(vendorId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createVendorCategoryAssignment>>,
		{ category_id: string; is_primary?: boolean }
	>(domain, {
		mutationFn: (body) =>
			createVendorCategoryAssignment({
				vendor_id: vendorId,
				...body,
			}),
	});
}

export function useDeleteVendorCategoryAssignmentMutation() {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (id) => deleteVendorCategoryAssignment(id),
	});
}

export function useVendorCertificatesQuery(vendorId?: string, enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"certificates",
		() => listVendorCertificates(String(vendorId)),
		Boolean(vendorId) && enabled,
		[vendorId ?? ""]
	);
}

export function useCreateVendorCertificateMutation(vendorId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createVendorCertificate>>,
		{
			certification_type: string;
			certifying_body?: string;
			certificate_number?: string;
			scope_description?: string;
			issued_at?: string;
			expires_at?: string;
			status?: string;
		}
	>(domain, {
		mutationFn: (body) =>
			createVendorCertificate({
				vendor_id: vendorId,
				...body,
			}),
	});
}

export function useUpdateVendorCertificateMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateVendorCertificate>>,
		{ id: string; body: Record<string, unknown> }
	>(domain, {
		mutationFn: ({ id, body }) => updateVendorCertificate(id, body),
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
		{ id: string; body: ConnectionUpdateInput }
	>(domain, {
		mutationFn: ({ id, body }) => updateVendorConnection(id, body),
	});
}

export function useCreateConnectionMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createVendorConnection>>,
		ConnectionCreateInput
	>(domain, {
		mutationFn: (body) => createVendorConnection(body),
	});
}

export function useVendorCredentialsQuery(enabled = true) {
	return useVendorCoreFeatureQuery(
		domain,
		"credentials",
		() => listVendorCredentials(),
		enabled,
		["all"]
	);
}

export function useCreateCredentialMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createVendorCredential>>,
		CredentialCreateInput
	>(domain, {
		mutationFn: (body) => createVendorCredential(body),
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

export function useCreateVendorContactMutation(vendorId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof createVendorContact>>,
		Omit<VendorContactCreateInput, "vendor_id">
	>(domain, {
		mutationFn: (body) =>
			createVendorContact({
				vendor_id: vendorId,
				...body,
			}),
	});
}

export function useUpdateVendorContactMutation() {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateVendorContact>>,
		{ id: string; body: VendorContactUpdateInput }
	>(domain, {
		mutationFn: ({ id, body }) => updateVendorContact(id, body),
	});
}

export function useDeleteVendorContactMutation() {
	return useVendorCoreFeatureMutation<void, string>(domain, {
		mutationFn: (id) => deleteVendorContact(id),
	});
}

export function useUpdateVendorIntegrationProfileMutation(vendorId: string) {
	return useVendorCoreFeatureMutation<
		Awaited<ReturnType<typeof updateVendorIntegrationProfile>>,
		VendorIntegrationProfileUpdateInput
	>(domain, {
		mutationFn: (body) => updateVendorIntegrationProfile(vendorId, body),
	});
}

export { useInvalidateVendorCore, listInboundFileEvents };

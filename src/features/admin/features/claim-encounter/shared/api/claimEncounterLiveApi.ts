import { vendorCoreEndpoints } from "@/lib/vendor-core/api";
import { vendorCoreFetch } from "@/lib/vendor-core/client";
import type { PaginatedResult } from "@/lib/vendor-core/types";

function unwrapPage<T>(res: PaginatedResult<T> | T[]): T[] {
	return Array.isArray(res) ? res : (res.results ?? []);
}

export type ClaimVendorFileDto = Record<string, unknown> & { id: string };
export type ClaimLineDto = Record<string, unknown> & { id: string };
export type ClaimResponseDto = Record<string, unknown> & { id: string };
export type ClaimExceptionDto = Record<string, unknown> & { id: string };
export type SubmissionBatchDto = Record<string, unknown> & { id: string };

/**
 * Live claims/members/providers reads against Django `/api/v1`.
 * Pages may still use mock-data until fully cut over; this client is the contract surface.
 */
export const claimEncounterLiveApi = {
	listClaimVendorFiles: async (params?: {
		vendor_id?: string;
		direction?: string;
	}) => {
		const page = await vendorCoreFetch<PaginatedResult<ClaimVendorFileDto>>(
			vendorCoreEndpoints.claimVendorFiles,
			{ params }
		);
		return unwrapPage(page);
	},

	getClaimVendorFile: (id: string) =>
		vendorCoreFetch<ClaimVendorFileDto>(
			vendorCoreEndpoints.claimVendorFileDetail(id)
		),

	listClaimLines: async (params?: { file_id?: string; batch_id?: string }) => {
		const page = await vendorCoreFetch<PaginatedResult<ClaimLineDto>>(
			vendorCoreEndpoints.claimLines,
			{ params }
		);
		return unwrapPage(page);
	},

	listClaimResponses: async () => {
		const page = await vendorCoreFetch<PaginatedResult<ClaimResponseDto>>(
			vendorCoreEndpoints.claimResponses
		);
		return unwrapPage(page);
	},

	listClaimExceptions: async () => {
		const page = await vendorCoreFetch<PaginatedResult<ClaimExceptionDto>>(
			vendorCoreEndpoints.claimExceptions
		);
		return unwrapPage(page);
	},

	listSubmissionBatches: async () => {
		const page = await vendorCoreFetch<PaginatedResult<SubmissionBatchDto>>(
			vendorCoreEndpoints.submissionBatches
		);
		return unwrapPage(page);
	},

	listMemberCoverages: async () => {
		const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.memberCoverages
		);
		return unwrapPage(page);
	},

	listProviders: async () => {
		const page = await vendorCoreFetch<PaginatedResult<Record<string, unknown>>>(
			vendorCoreEndpoints.providers
		);
		return unwrapPage(page);
	},
};

import { listAuditRecords } from "@/features/admin/features/audit-trail/feature/api/auditTrailApi";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { AccountDto } from "@/lib/vendor-core/types";

import type { VendorDetailRawBundleDto } from "../dto/vendorDetailDto";
import { mapVendorDetailBundle } from "../mappers/vendorDetailMappers";
import type {
	VendorDetailBundleModel,
	VendorDetailLoadError,
} from "../types/vendorDetailModel";
import {
	getVendor,
	getVendorIntegrationProfile,
	listVendorAccountOpsSummaries,
	listVendorAccounts,
	listVendorConnections,
	listVendorContacts,
	listVendorInboundFiles,
	listVendorJobs,
	listVendorNotes,
} from "./vendorsApi";

async function tryLoad<T>(
	resource: VendorDetailLoadError["resource"],
	loader: () => Promise<T>,
	errors: VendorDetailLoadError[]
): Promise<T | null> {
	try {
		return await loader();
	} catch (error) {
		errors.push({
			resource,
			message: error instanceof Error ? error.message : "Request failed",
		});
		return null;
	}
}

/**
 * Parallel vendor detail load — one call site for every tab/sub-section.
 * Matches the UI surface on `VendorDetailPage` (Overview → Notes).
 */
export async function getVendorDetailBundle(
	vendorId: string
): Promise<VendorDetailBundleModel> {
	const errors: VendorDetailLoadError[] = [];
	const vendorDto = await getVendor(vendorId);
	// #region agent log
	fetch("http://127.0.0.1:7619/ingest/2f252828-01b8-43ea-88bb-1263f3c1d386", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "6ffff2",
		},
		body: JSON.stringify({
			sessionId: "6ffff2",
			runId: "pre-fix",
			hypothesisId: "H2",
			location: "vendorDetailApi.ts:getVendorDetailBundle:vendor",
			message: "bundle vendor ids",
			data: {
				routeVendorId: vendorId,
				vendorDtoId: vendorDto.id,
				vendorCode: vendorDto.vendor_code,
			},
			timestamp: Date.now(),
		}),
	}).catch(() => {});
	// #endregion

	const [
		integrationProfile,
		connections,
		jobs,
		inboundFiles,
		accounts,
		accountOps,
		contacts,
		contracts,
		notes,
		auditRecords,
	] = await Promise.all([
		tryLoad(
			"integration_profile",
			() => getVendorIntegrationProfile(vendorId),
			errors
		),
		tryLoad("connections", () => listVendorConnections(vendorId), errors),
		tryLoad("jobs", () => listVendorJobs(vendorId), errors),
		tryLoad(
			"inbound_files",
			() => listVendorInboundFiles({ vendor_id: vendorId }),
			errors
		),
		tryLoad("accounts", () => listVendorAccounts(vendorId), errors),
		tryLoad(
			"account_ops",
			() => listVendorAccountOpsSummaries(vendorId),
			errors
		),
		tryLoad("contacts", () => listVendorContacts(vendorId), errors),
		tryLoad(
			"contracts",
			async () => {
				const page = await vendorCoreApi.listContracts({ vendor_id: vendorId });
				return page.results ?? [];
			},
			errors
		),
		tryLoad("notes", () => listVendorNotes(vendorId), errors),
		tryLoad(
			"audit",
			() => listAuditRecords({ vendor_id: vendorId, limit: 100 }),
			errors
		),
	]);

	const raw: VendorDetailRawBundleDto = {
		vendor: vendorDto,
		integrationProfile: integrationProfile,
		connections: connections ?? [],
		jobs: jobs ?? [],
		inboundFiles: inboundFiles ?? [],
		accounts: accounts ?? [],
		accountOps: accountOps ?? [],
		contacts: contacts ?? [],
		contracts: contracts ?? [],
		notes: notes ?? [],
		auditRecords: auditRecords ?? [],
	};

	logBundleAccounts(vendorId, accounts, errors);

	return mapVendorDetailBundle(raw, errors);
}

function logBundleAccounts(
	vendorId: string,
	accounts: AccountDto[] | null,
	errors: VendorDetailLoadError[]
) {
	// #region agent log
	fetch("http://127.0.0.1:7619/ingest/2f252828-01b8-43ea-88bb-1263f3c1d386", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "6ffff2",
		},
		body: JSON.stringify({
			sessionId: "6ffff2",
			runId: "pre-fix",
			hypothesisId: "H4-H5",
			location: "vendorDetailApi.ts:getVendorDetailBundle:accounts",
			message: "bundle accounts loaded",
			data: {
				routeVendorId: vendorId,
				accountCount: accounts?.length ?? 0,
				accountIds: (accounts ?? []).map((a) => a.id),
				accountsError: errors.find((e) => e.resource === "accounts") ?? null,
			},
			timestamp: Date.now(),
		}),
	}).catch(() => {});
	// #endregion
}

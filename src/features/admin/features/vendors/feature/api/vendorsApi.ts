import { vendorCoreApi } from "@/lib/vendor-core/api";
import type {
	AccountCreateInput,
	AccountDto,
	AccountOpsSummaryDto,
	AccountUpdateInput,
	ConnectionDto,
	InboundFileDto,
	IntakeJobDto,
	ProcessingEventDto,
	VendorCategoryAssignmentCreateInput,
	VendorCategoryAssignmentDto,
	VendorCategoryDto,
	VendorCategoryListQuery,
	VendorContactCreateInput,
	VendorContactDto,
	VendorContactUpdateInput,
	VendorCreateInput,
	VendorIntegrationProfileDto,
	VendorIntegrationProfileUpdateInput,
	VendorNoteDto,
} from "@/lib/vendor-core/types";

import { demoAccountSpecsForVendor } from "../demoAccountSpecs";
import {
	forgetVendorAccountId,
	listRememberedVendorAccountIds,
	rememberVendorAccountId,
} from "./vendorAccountRemember";

export { rememberVendorAccountId };

export async function listVendors(): Promise<
	import("@/lib/vendor-core/types").VendorDto[]
> {
	const page = await vendorCoreApi.listVendors();
	return page.results ?? [];
}

export async function getVendor(id: string) {
	return vendorCoreApi.getVendor(id);
}

export async function createVendorRecord(body: VendorCreateInput) {
	return vendorCoreApi.createVendor(body);
}

export async function listVendorCategories(params?: VendorCategoryListQuery) {
	const page = await vendorCoreApi.listVendorCategories(params);
	return page.results ?? [];
}

export async function createVendorCategoryAssignment(
	body: VendorCategoryAssignmentCreateInput
): Promise<VendorCategoryAssignmentDto> {
	return vendorCoreApi.createVendorCategoryAssignment(body);
}

export async function listVendorCategoryAssignments(vendorId?: string) {
	const page = await vendorCoreApi.listVendorCategoryAssignments(
		vendorId ? { vendor_id: vendorId } : undefined
	);
	return page.results ?? [];
}

export async function createVendorConnection(body: Record<string, unknown>) {
	return vendorCoreApi.createConnection(body);
}

export async function getVendorIntegrationProfile(
	vendorId: string
): Promise<VendorIntegrationProfileDto> {
	return vendorCoreApi.getVendorIntegrationProfile(vendorId);
}

export async function updateVendorIntegrationProfile(
	vendorId: string,
	body: VendorIntegrationProfileUpdateInput
): Promise<VendorIntegrationProfileDto> {
	return vendorCoreApi.updateVendorIntegrationProfile(vendorId, body);
}

export async function listVendorContacts(
	vendorId?: string
): Promise<VendorContactDto[]> {
	const page = await vendorCoreApi.listVendorContacts(
		vendorId ? { vendor_id: vendorId } : undefined
	);
	return page.results ?? [];
}

export async function createVendorContact(
	body: VendorContactCreateInput
): Promise<VendorContactDto> {
	return vendorCoreApi.createVendorContact(body);
}

export async function updateVendorContact(
	id: string,
	body: VendorContactUpdateInput
): Promise<VendorContactDto> {
	return vendorCoreApi.updateVendorContact(id, body);
}

export async function deleteVendorContact(id: string): Promise<void> {
	await vendorCoreApi.deleteVendorContact(id);
}

export async function getVendorContact(id: string) {
	return vendorCoreApi.getVendorContact(id);
}

export async function restoreVendorContact(id: string) {
	return vendorCoreApi.restoreVendorContact(id);
}

export async function hardDeleteVendorContact(id: string) {
	return vendorCoreApi.hardDeleteVendorContact(id);
}

export async function listVendorConnections(
	vendorId?: string
): Promise<ConnectionDto[]> {
	const page = await vendorCoreApi.listConnections(
		vendorId ? { vendor_id: vendorId } : undefined
	);
	return page.results ?? [];
}

export async function listVendorJobs(
	vendorId?: string
): Promise<IntakeJobDto[]> {
	const page = await vendorCoreApi.listIntakeJobs(
		vendorId ? { vendor_id: vendorId } : undefined
	);
	return page.results ?? [];
}

export async function createIntakeJob(body: Record<string, unknown>) {
	return vendorCoreApi.createIntakeJob(body);
}

export async function updateIntakeJob(
	id: string,
	body: Record<string, unknown>
) {
	return vendorCoreApi.updateIntakeJob(id, body);
}

export async function runIntakeJob(id: string) {
	return vendorCoreApi.runIntakeJob(id);
}

export async function testVendorConnection(id: string) {
	return vendorCoreApi.testConnection(id);
}

export async function updateVendorConnection(
	id: string,
	body: Record<string, unknown>
) {
	return vendorCoreApi.updateConnection(id, body);
}

export async function getVendorConnection(id: string) {
	return vendorCoreApi.getConnection(id);
}

export async function deleteVendorConnection(id: string) {
	return vendorCoreApi.deleteConnection(id);
}

export async function restoreVendorConnection(id: string) {
	return vendorCoreApi.restoreConnection(id);
}

export async function hardDeleteVendorConnection(id: string) {
	return vendorCoreApi.hardDeleteConnection(id);
}

export async function listVendorAccounts(
	vendorId?: string,
	filters?: { is_visible?: boolean; is_deleted?: boolean }
): Promise<AccountDto[]> {
	const params: {
		vendor_id?: string;
		is_visible?: boolean;
		is_deleted?: boolean;
	} = {};
	if (vendorId) params.vendor_id = vendorId;
	if (filters?.is_visible !== undefined) params.is_visible = filters.is_visible;
	if (filters?.is_deleted !== undefined) params.is_deleted = filters.is_deleted;
	// #region agent log
	fetch("http://127.0.0.1:7619/ingest/2f252828-01b8-43ea-88bb-1263f3c1d386", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "6ffff2",
		},
		body: JSON.stringify({
			sessionId: "6ffff2",
			runId: "post-fix",
			hypothesisId: "H1-H3-H5",
			location: "vendorsApi.ts:listVendorAccounts:request",
			message: "listVendorAccounts called",
			data: { vendorId, params, filters: filters ?? null },
			timestamp: Date.now(),
		}),
	}).catch(() => {});
	// #endregion
	const page = await vendorCoreApi.listAccounts(params);
	const byId = new Map<string, AccountDto>();
	for (const row of page.results ?? []) {
		byId.set(row.id, row);
	}

	if (vendorId && byId.size === 0 && filters?.is_deleted !== true) {
		const globalPage = await vendorCoreApi.listAccounts({
			is_visible: params.is_visible,
			is_deleted: params.is_deleted,
		});
		for (const row of globalPage.results ?? []) {
			if (row.vendor_id === vendorId) {
				byId.set(row.id, row);
			}
		}
	}

	if (vendorId) {
		for (const id of listRememberedVendorAccountIds(vendorId)) {
			if (byId.has(id)) {
				forgetVendorAccountId(vendorId, id);
				continue;
			}
			try {
				const detail = await vendorCoreApi.getAccount(id);
				if (detail.vendor_id !== vendorId) {
					forgetVendorAccountId(vendorId, id);
					continue;
				}
				const visible =
					(detail as { is_visible?: boolean }).is_visible !== false;
				const deleted =
					(detail as { is_deleted?: boolean }).is_deleted === true;
				if (filters?.is_deleted === true && !deleted) continue;
				if (filters?.is_deleted === false && deleted) continue;
				if (filters?.is_deleted !== true && deleted) continue;
				if (filters?.is_visible === true && !visible) continue;
				if (filters?.is_visible === false && visible) continue;
				if (
					filters?.is_visible === undefined &&
					filters?.is_deleted !== true &&
					!visible
				) {
					continue;
				}
				byId.set(detail.id, detail);
			} catch {
				forgetVendorAccountId(vendorId, id);
			}
		}
	}

	const results = Array.from(byId.values());
	// #region agent log
	fetch("http://127.0.0.1:7619/ingest/2f252828-01b8-43ea-88bb-1263f3c1d386", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "6ffff2",
		},
		body: JSON.stringify({
			sessionId: "6ffff2",
			runId: "post-fix",
			hypothesisId: "H1-H3-H5",
			location: "vendorsApi.ts:listVendorAccounts:response",
			message: "listVendorAccounts result",
			data: {
				count: results.length,
				accounts: results.map((r) => ({
					id: r.id,
					code: r.account_code,
					vendor_id: r.vendor_id,
				})),
			},
			timestamp: Date.now(),
		}),
	}).catch(() => {});
	// #endregion
	return results;
}

export type VendorAccountLookupState = "active" | "hidden" | "deleted";

/** Find account by code across active, hidden, and soft-deleted rows. */
export async function findVendorAccountByCode(
	vendorId: string,
	accountCode: string
): Promise<{ account: AccountDto; state: VendorAccountLookupState } | null> {
	const code = accountCode.trim();
	if (!code) return null;

	const searches: Array<{
		state: VendorAccountLookupState;
		filters: { is_visible?: boolean; is_deleted?: boolean };
	}> = [
		{ state: "active", filters: { is_visible: true, is_deleted: false } },
		{ state: "hidden", filters: { is_visible: false, is_deleted: false } },
		{ state: "deleted", filters: { is_deleted: true } },
	];

	for (const { state, filters } of searches) {
		const rows = await listVendorAccounts(vendorId, filters);
		const match = rows.find((row) => row.account_code === code);
		if (match) return { account: match, state };
	}

	for (const id of listRememberedVendorAccountIds(vendorId)) {
		try {
			const detail = await vendorCoreApi.getAccount(id);
			if (detail.vendor_id !== vendorId || detail.account_code !== code)
				continue;
			const deleted = (detail as { is_deleted?: boolean }).is_deleted === true;
			const visible = (detail as { is_visible?: boolean }).is_visible !== false;
			if (deleted) return { account: detail, state: "deleted" };
			if (!visible) return { account: detail, state: "hidden" };
			return { account: detail, state: "active" };
		} catch {
			forgetVendorAccountId(vendorId, id);
		}
	}

	return null;
}

/** Create or update demo accounts using the signed-in user's JWT (no CLI creds). */
export async function seedDemoVendorAccounts(
	vendorId: string,
	vendorCode: string
): Promise<AccountDto[]> {
	const specs = demoAccountSpecsForVendor(vendorCode);
	const existing = await listVendorAccounts(vendorId);
	const byCode = new Map(existing.map((row) => [row.account_code, row]));

	for (const spec of specs) {
		const payload = {
			vendor_id: vendorId,
			is_visible: true,
			...spec,
		};
		const current = byCode.get(spec.account_code);
		if (current) {
			const updated = await updateVendorAccount(current.id, payload);
			byCode.set(spec.account_code, updated);
			continue;
		}
		try {
			const created = await createVendorAccount(payload);
			byCode.set(spec.account_code, created);
		} catch (error) {
			const message = error instanceof Error ? error.message.toLowerCase() : "";
			if (!message.includes("unique") && !message.includes("already")) {
				throw error;
			}
			const refreshed = await listVendorAccounts(vendorId);
			const fallback = refreshed.find(
				(row) => row.account_code === spec.account_code
			);
			if (!fallback) throw error;
			const updated = await updateVendorAccount(fallback.id, payload);
			byCode.set(spec.account_code, updated);
		}
	}

	return listVendorAccounts(vendorId);
}

export async function listVendorAccountOpsSummaries(
	vendorId: string
): Promise<AccountOpsSummaryDto[]> {
	return vendorCoreApi.listAccountOpsSummaries(vendorId);
}

export async function getVendorAccount(id: string): Promise<AccountDto> {
	return vendorCoreApi.getAccount(id);
}

export async function createVendorAccount(
	body: AccountCreateInput
): Promise<AccountDto> {
	const created = await vendorCoreApi.createAccount(body);
	if (body.vendor_id && created.id) {
		rememberVendorAccountId(body.vendor_id, created.id);
	}
	return created;
}

export async function updateVendorAccount(
	id: string,
	body: AccountUpdateInput
): Promise<AccountDto> {
	return vendorCoreApi.updateAccount(id, body);
}

export async function deleteVendorAccount(id: string): Promise<void> {
	try {
		const account = await vendorCoreApi.getAccount(id);
		if (account.vendor_id) {
			forgetVendorAccountId(account.vendor_id, id);
		}
	} catch {
		// account may already be gone
	}
	await vendorCoreApi.deleteAccount(id);
}

export async function restoreVendorAccount(id: string): Promise<AccountDto> {
	const restored = await vendorCoreApi.restoreAccount(id);
	if (restored.vendor_id && restored.id) {
		rememberVendorAccountId(restored.vendor_id, restored.id);
	}
	return restored;
}

export async function hardDeleteVendorAccount(id: string): Promise<void> {
	await vendorCoreApi.hardDeleteAccount(id);
}

export async function listVendorInboundFiles(params?: {
	stage?: string;
	vendor_id?: string;
}): Promise<InboundFileDto[]> {
	const page = await vendorCoreApi.listInboundFiles(params);
	return page.results ?? [];
}

export async function listInboundFileEvents(
	inboundFileId: string
): Promise<ProcessingEventDto[]> {
	return vendorCoreApi.listInboundFileEvents(inboundFileId);
}

export async function reprocessInboundFile(id: string) {
	return vendorCoreApi.reprocessInboundFile(id);
}

export async function listVendorNotes(
	vendorId: string
): Promise<VendorNoteDto[]> {
	const page = await vendorCoreApi.listVendorNotes({ vendor_id: vendorId });
	return page.results ?? [];
}

export async function createVendorNote(body: {
	vendor_id: string;
	body: string;
	is_pinned?: boolean;
}) {
	return vendorCoreApi.createVendorNote(body);
}

export async function updateVendorNote(
	id: string,
	body: { body?: string; is_pinned?: boolean }
) {
	return vendorCoreApi.updateVendorNote(id, body);
}

export async function deleteVendorNote(id: string) {
	return vendorCoreApi.deleteVendorNote(id);
}

export async function getVendorNote(id: string) {
	return vendorCoreApi.getVendorNote(id);
}

export async function restoreVendorNote(id: string) {
	return vendorCoreApi.restoreVendorNote(id);
}

export async function hardDeleteVendorNote(id: string) {
	return vendorCoreApi.hardDeleteVendorNote(id);
}

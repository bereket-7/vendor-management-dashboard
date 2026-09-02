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
	VendorNoteDto,
} from "@/lib/vendor-core/types";

export async function listVendors(): Promise<
	import("@/lib/vendor-core/types").VendorDto[]
> {
	const page = await vendorCoreApi.listVendors();
	return page.results ?? [];
}

export async function getVendor(id: string) {
	return vendorCoreApi.getVendor(id);
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

export async function listVendorAccounts(
	vendorId?: string
): Promise<AccountDto[]> {
	const page = await vendorCoreApi.listAccounts(
		vendorId ? { vendor_id: vendorId } : undefined
	);
	return page.results ?? [];
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
	return vendorCoreApi.createAccount(body);
}

export async function updateVendorAccount(
	id: string,
	body: AccountUpdateInput
): Promise<AccountDto> {
	return vendorCoreApi.updateAccount(id, body);
}

export async function deleteVendorAccount(id: string): Promise<void> {
	await vendorCoreApi.deleteAccount(id);
}

export async function restoreVendorAccount(id: string): Promise<AccountDto> {
	return vendorCoreApi.restoreAccount(id);
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

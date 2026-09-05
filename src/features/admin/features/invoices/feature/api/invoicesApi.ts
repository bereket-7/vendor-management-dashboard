import { vmsApi } from "@/features/shared/vms/api";
import type { InvoiceModel } from "@/features/shared/vms/types";

import type { InvoicesCreateDto, InvoicesUpdateDto } from "../dto/invoicesDto";

function requireRecord<T>(record: T | null): T {
	if (!record) throw new Error("VMS record was not found");
	return record;
}

export async function listInvoices(): Promise<InvoiceModel[]> {
	return vmsApi.listInvoices();
}

export async function getInvoices(id: string): Promise<InvoiceModel> {
	return requireRecord(await vmsApi.getInvoice(id));
}

export async function createInvoices(
	input: InvoicesCreateDto
): Promise<InvoiceModel> {
	return vmsApi.createInvoice(input);
}

export async function seedInvoices() {
	return vmsApi.seedInvoices();
}

export async function updateInvoices(
	id: string,
	patch: InvoicesUpdateDto
): Promise<InvoiceModel> {
	return requireRecord(await vmsApi.updateInvoice(id, patch));
}

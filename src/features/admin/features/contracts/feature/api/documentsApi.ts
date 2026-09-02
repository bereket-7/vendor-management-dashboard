import { vendorCoreApi } from "@/lib/vendor-core/api";
import { isLiveIntegrationEnabled, isMockEnabled } from "@/lib/mock-mode";
import type { ContractDocumentItem } from "@/features/shared/vms/types";
import type { ProcurementDocumentCreateInput } from "@/lib/vendor-core/types";

import { procurementDocumentDtoToItem } from "../mappers/contractCoreMappers";

export const PROCUREMENT_DOCUMENT_TYPE_OPTIONS = [
	{ value: "msa", label: "Master service agreement" },
	{ value: "sow", label: "Statement of work" },
	{ value: "nda", label: "Non-disclosure agreement" },
	{ value: "w9", label: "W-9" },
	{ value: "w8_ben_e", label: "W-8BEN-E" },
	{ value: "insurance_certificate", label: "Certificate of insurance" },
	{ value: "business_license", label: "Business license" },
	{ value: "banking_letter", label: "Banking / voided check letter" },
	{ value: "other", label: "Other" },
] as const;

export type CreateProcurementDocumentInput = {
	vendorId: string;
	file: File;
	title: string;
	documentType: string;
};

async function sha256Hex(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const hash = await crypto.subtle.digest("SHA-256", buffer);
	return Array.from(new Uint8Array(hash))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

export async function createProcurementDocument(
	input: CreateProcurementDocumentInput
): Promise<ContractDocumentItem> {
	if (!isLiveIntegrationEnabled() || isMockEnabled()) {
		throw new Error("Document upload requires live vendor-core integration.");
	}

	const checksum = await sha256Hex(input.file);
	const storageKey = `uploads/${input.vendorId}/${Date.now()}-${input.file.name}`;
	const body: ProcurementDocumentCreateInput = {
		vendor_id: input.vendorId,
		document_type: input.documentType,
		title: input.title.trim() || input.file.name,
		storage_key: storageKey,
		checksum_sha256: checksum,
		mime_type: input.file.type || "application/octet-stream",
		size_bytes: input.file.size,
		status: "pending_review",
	};

	const dto = await vendorCoreApi.createDocument(body);
	return procurementDocumentDtoToItem(dto);
}

export async function listProcurementDocuments(
	vendorId?: string,
	contractId?: string
): Promise<ContractDocumentItem[]> {
	if (!isLiveIntegrationEnabled() || isMockEnabled()) {
		return [];
	}
	const params: { vendor_id?: string; contract_id?: string } = {};
	if (vendorId) params.vendor_id = vendorId;
	if (contractId) params.contract_id = contractId;
	const page = await vendorCoreApi.listDocuments(
		Object.keys(params).length > 0 ? params : undefined
	);
	return (page.results ?? []).map(procurementDocumentDtoToItem);
}

import { vmsApi } from "@/features/shared/vms/api";
import type { DocumentModel } from "@/features/shared/vms/types";
import { vendorCoreApi } from "@/lib/vendor-core/api";

import type {
	DocumentsCreateDto,
	DocumentsUpdateDto,
} from "../dto/documentsDto";

function requireRecord<T>(record: T | null): T {
	if (!record) throw new Error("VMS record was not found");
	return record;
}

export async function downloadDocumentFile(id: string, asAttachment = false) {
	return vendorCoreApi.downloadDocument(id, asAttachment);
}

export async function listDocuments(): Promise<DocumentModel[]> {
	return vmsApi.listDocuments();
}

export async function getDocuments(id: string): Promise<DocumentModel> {
	return requireRecord(await vmsApi.getDocument(id));
}

export async function createDocuments(
	input: DocumentsCreateDto
): Promise<DocumentModel> {
	return vmsApi.addDocument(input);
}

export async function updateDocuments(
	id: string,
	patch: DocumentsUpdateDto
): Promise<DocumentModel> {
	return requireRecord(await vmsApi.updateDocument(id, patch));
}

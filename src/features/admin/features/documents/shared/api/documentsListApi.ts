import { vendorCoreApi } from "@/lib/vendor-core/api";
import { isVendorCoreLive } from "@/lib/vendor-core/client";

import { documentsEndpoints } from "../../documents-endpoints";
import type { ApiDocumentsRecordDto } from "../dto/documentsRecordDto";

export { documentsEndpoints };

export type DocumentsListResponse = {
	results?: ApiDocumentsRecordDto[] | null;
	count?: number | null;
};

export async function listDocumentsRecords(params?: Record<string, string>) {
	if (isVendorCoreLive()) {
		const page = await vendorCoreApi.listDocuments({
			limit: 100,
			vendor_id: params?.vendor_id,
		});
		return { results: page.results ?? [], count: page.count ?? 0 };
	}
	return { results: [], count: 0 };
}

export async function getDocumentsRecord(id: string) {
	if (isVendorCoreLive()) {
		return vendorCoreApi.getDocument(id);
	}
	throw new Error("Document detail requires the live API.");
}

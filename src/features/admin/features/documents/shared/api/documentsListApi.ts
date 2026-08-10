import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { documentsEndpoints } from "../../documents-endpoints";
import type { ApiDocumentsRecordDto } from "../dto/documentsRecordDto";

export { documentsEndpoints };

export type DocumentsListResponse = {
	results?: ApiDocumentsRecordDto[] | null;
	count?: number | null;
};

export async function listDocumentsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<DocumentsListResponse>(documentsEndpoints.list(), { params })
	);
}

export async function getDocumentsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiDocumentsRecordDto>(documentsEndpoints.detail(id))
	);
}

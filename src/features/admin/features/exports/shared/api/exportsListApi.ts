import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { exportsEndpoints } from "../../exports-endpoints";
import type { ApiExportsRecordDto } from "../dto/exportsRecordDto";

export { exportsEndpoints };

export type ExportsListResponse = {
	results?: ApiExportsRecordDto[] | null;
	count?: number | null;
};

export async function listExportsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<ExportsListResponse>(exportsEndpoints.list(), { params })
	);
}

export async function getExportsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiExportsRecordDto>(exportsEndpoints.detail(id))
	);
}

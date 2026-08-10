import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { reportsEndpoints } from "../../reports-endpoints";
import type { ApiReportsRecordDto } from "../dto/reportsRecordDto";

export { reportsEndpoints };

export type ReportsListResponse = {
	results?: ApiReportsRecordDto[] | null;
	count?: number | null;
};

export async function listReportsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<ReportsListResponse>(reportsEndpoints.list(), { params })
	);
}

export async function getReportsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiReportsRecordDto>(reportsEndpoints.detail(id))
	);
}

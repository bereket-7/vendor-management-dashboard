import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { performanceEndpoints } from "../../performance-endpoints";
import type { ApiPerformanceRecordDto } from "../dto/performanceRecordDto";

export { performanceEndpoints };

export type PerformanceListResponse = {
	results?: ApiPerformanceRecordDto[] | null;
	count?: number | null;
};

export async function listPerformanceRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<PerformanceListResponse>(performanceEndpoints.list(), {
				params,
			})
	);
}

export async function getPerformanceRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiPerformanceRecordDto>(performanceEndpoints.detail(id))
	);
}

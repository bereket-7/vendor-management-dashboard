import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { processingLogsEndpoints } from "../../processing-logs-endpoints";
import type { ApiProcessingLogsRecordDto } from "../dto/processingLogsRecordDto";

export { processingLogsEndpoints };

export type ProcessingLogsListResponse = {
	results?: ApiProcessingLogsRecordDto[] | null;
	count?: number | null;
};

export async function listProcessingLogsRecords(
	params?: Record<string, string>
) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<ProcessingLogsListResponse>(processingLogsEndpoints.list(), {
				params,
			})
	);
}

export async function getProcessingLogsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProcessingLogsRecordDto>(processingLogsEndpoints.detail(id))
	);
}

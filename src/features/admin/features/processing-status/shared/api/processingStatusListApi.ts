import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { processingStatusEndpoints } from "../../processing-status-endpoints";
import type { ApiProcessingStatusRecordDto } from "../dto/processingStatusRecordDto";

export { processingStatusEndpoints };

export type ProcessingStatusListResponse = {
	results?: ApiProcessingStatusRecordDto[] | null;
	count?: number | null;
};

export async function listProcessingStatusRecords(
	params?: Record<string, string>
) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<ProcessingStatusListResponse>(
				processingStatusEndpoints.list(),
				{ params }
			)
	);
}

export async function getProcessingStatusRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProcessingStatusRecordDto>(
				processingStatusEndpoints.detail(id)
			)
	);
}

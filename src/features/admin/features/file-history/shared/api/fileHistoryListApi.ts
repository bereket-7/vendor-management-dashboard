import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { fileHistoryEndpoints } from "../../file-history-endpoints";
import type { ApiFileHistoryRecordDto } from "../dto/fileHistoryRecordDto";

export { fileHistoryEndpoints };

export type FileHistoryListResponse = {
	results?: ApiFileHistoryRecordDto[] | null;
	count?: number | null;
};

export async function listFileHistoryRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<FileHistoryListResponse>(fileHistoryEndpoints.list(), {
				params,
			})
	);
}

export async function getFileHistoryRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiFileHistoryRecordDto>(fileHistoryEndpoints.detail(id))
	);
}

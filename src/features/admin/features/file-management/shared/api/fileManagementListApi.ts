import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { fileManagementEndpoints } from "../../file-management-endpoints";
import type { ApiFileManagementRecordDto } from "../dto/fileManagementRecordDto";

export { fileManagementEndpoints };

export type FileManagementListResponse = {
	results?: ApiFileManagementRecordDto[] | null;
	count?: number | null;
};

export async function listFileManagementRecords(
	params?: Record<string, string>
) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<FileManagementListResponse>(fileManagementEndpoints.list(), {
				params,
			})
	);
}

export async function getFileManagementRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiFileManagementRecordDto>(fileManagementEndpoints.detail(id))
	);
}

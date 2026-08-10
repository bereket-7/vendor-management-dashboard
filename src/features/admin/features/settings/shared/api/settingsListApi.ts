import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { settingsEndpoints } from "../../settings-endpoints";
import type { ApiSettingsRecordDto } from "../dto/settingsRecordDto";

export { settingsEndpoints };

export type SettingsListResponse = {
	results?: ApiSettingsRecordDto[] | null;
	count?: number | null;
};

export async function listSettingsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<SettingsListResponse>(settingsEndpoints.list(), { params })
	);
}

export async function getSettingsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiSettingsRecordDto>(settingsEndpoints.detail(id))
	);
}

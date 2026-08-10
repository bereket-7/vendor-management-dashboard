import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { providersEndpoints } from "../../providers-endpoints";
import type { ApiProvidersRecordDto } from "../dto/providersRecordDto";

export { providersEndpoints };

export type ProvidersListResponse = {
	results?: ApiProvidersRecordDto[] | null;
	count?: number | null;
};

export async function listProvidersRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<ProvidersListResponse>(providersEndpoints.list(), { params })
	);
}

export async function getProvidersRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiProvidersRecordDto>(providersEndpoints.detail(id))
	);
}

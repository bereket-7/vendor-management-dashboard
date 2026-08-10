import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { contractsEndpoints } from "../../contracts-endpoints";
import type { ApiContractsRecordDto } from "../dto/contractsRecordDto";

export { contractsEndpoints };

export type ContractsListResponse = {
	results?: ApiContractsRecordDto[] | null;
	count?: number | null;
};

export async function listContractsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<ContractsListResponse>(contractsEndpoints.list(), { params })
	);
}

export async function getContractsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiContractsRecordDto>(contractsEndpoints.detail(id))
	);
}

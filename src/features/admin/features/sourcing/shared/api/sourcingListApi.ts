import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { sourcingEndpoints } from "../../sourcing-endpoints";
import type { ApiSourcingRecordDto } from "../dto/sourcingRecordDto";

export { sourcingEndpoints };

export type SourcingListResponse = {
	results?: ApiSourcingRecordDto[] | null;
	count?: number | null;
};

export async function listSourcingRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<SourcingListResponse>(sourcingEndpoints.list(), { params })
	);
}

export async function getSourcingRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiSourcingRecordDto>(sourcingEndpoints.detail(id))
	);
}

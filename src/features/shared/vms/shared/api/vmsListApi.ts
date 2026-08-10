import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { vmsEndpoints } from "../../vms-endpoints";
import type { ApiVmsRecordDto } from "../dto/vmsRecordDto";

export { vmsEndpoints };

export type VmsListResponse = {
	results?: ApiVmsRecordDto[] | null;
	count?: number | null;
};

export async function listVmsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<VmsListResponse>(vmsEndpoints.list(), { params })
	);
}

export async function getVmsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiVmsRecordDto>(vmsEndpoints.detail(id))
	);
}

import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { activityEndpoints } from "../../activity-endpoints";
import type { ApiActivityRecordDto } from "../dto/activityRecordDto";

export { activityEndpoints };

export type ActivityListResponse = {
	results?: ApiActivityRecordDto[] | null;
	count?: number | null;
};

export async function listActivityRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<ActivityListResponse>(activityEndpoints.list(), { params })
	);
}

export async function getActivityRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiActivityRecordDto>(activityEndpoints.detail(id))
	);
}

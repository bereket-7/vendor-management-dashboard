import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { schedulesEndpoints } from "../../schedules-endpoints";
import type { ApiSchedulesRecordDto } from "../dto/schedulesRecordDto";

export { schedulesEndpoints };

export type SchedulesListResponse = {
	results?: ApiSchedulesRecordDto[] | null;
	count?: number | null;
};

export async function listSchedulesRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<SchedulesListResponse>(schedulesEndpoints.list(), { params })
	);
}

export async function getSchedulesRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiSchedulesRecordDto>(schedulesEndpoints.detail(id))
	);
}

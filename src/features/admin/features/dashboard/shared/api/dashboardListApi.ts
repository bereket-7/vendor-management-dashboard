import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { dashboardEndpoints } from "../../dashboard-endpoints";
import type { ApiDashboardRecordDto } from "../dto/dashboardRecordDto";

export { dashboardEndpoints };

export type DashboardListResponse = {
	results?: ApiDashboardRecordDto[] | null;
	count?: number | null;
};

export async function listDashboardRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<DashboardListResponse>(dashboardEndpoints.list(), { params })
	);
}

export async function getDashboardRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiDashboardRecordDto>(dashboardEndpoints.detail(id))
	);
}

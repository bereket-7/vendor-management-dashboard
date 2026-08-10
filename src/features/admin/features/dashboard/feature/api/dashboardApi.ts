import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { dashboardEndpoints } from "../../dashboard-endpoints";
import type {
	ApiDashboardDto,
	DashboardCreateDto,
	DashboardUpdateDto,
} from "../dto/dashboardDto";

export async function listDashboard() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiDashboardDto[]; count?: number }>(
				dashboardEndpoints.list()
			)
	);
}

export async function getDashboard(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiDashboardDto>(dashboardEndpoints.detail(id))
	);
}

export async function createDashboard(body: DashboardCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiDashboardDto>(dashboardEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateDashboard(id: string, body: DashboardUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiDashboardDto>(dashboardEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteDashboard(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(dashboardEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

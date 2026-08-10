import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { reportsEndpoints } from "../../reports-endpoints";
import type {
	ApiReportsDto,
	ReportsCreateDto,
	ReportsUpdateDto,
} from "../dto/reportsDto";

export async function listReports() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiReportsDto[]; count?: number }>(
				reportsEndpoints.list()
			)
	);
}

export async function getReports(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiReportsDto>(reportsEndpoints.detail(id))
	);
}

export async function createReports(body: ReportsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiReportsDto>(reportsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateReports(id: string, body: ReportsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiReportsDto>(reportsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteReports(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(reportsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { performanceEndpoints } from "../../performance-endpoints";
import type {
	ApiPerformanceDto,
	PerformanceCreateDto,
	PerformanceUpdateDto,
} from "../dto/performanceDto";

export async function listPerformance() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiPerformanceDto[]; count?: number }>(
				performanceEndpoints.list()
			)
	);
}

export async function getPerformance(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiPerformanceDto>(performanceEndpoints.detail(id))
	);
}

export async function createPerformance(body: PerformanceCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiPerformanceDto>(performanceEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updatePerformance(
	id: string,
	body: PerformanceUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiPerformanceDto>(performanceEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deletePerformance(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(performanceEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

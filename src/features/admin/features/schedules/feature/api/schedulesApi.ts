import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { schedulesEndpoints } from "../../schedules-endpoints";
import type {
	ApiSchedulesDto,
	SchedulesCreateDto,
	SchedulesUpdateDto,
} from "../dto/schedulesDto";

export async function listSchedules() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiSchedulesDto[]; count?: number }>(
				schedulesEndpoints.list()
			)
	);
}

export async function getSchedules(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiSchedulesDto>(schedulesEndpoints.detail(id))
	);
}

export async function createSchedules(body: SchedulesCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiSchedulesDto>(schedulesEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateSchedules(id: string, body: SchedulesUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiSchedulesDto>(schedulesEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteSchedules(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(schedulesEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

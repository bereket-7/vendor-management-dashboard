import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { activityEndpoints } from "../../activity-endpoints";
import type {
	ActivityCreateDto,
	ActivityUpdateDto,
	ApiActivityDto,
} from "../dto/activityDto";

export async function listActivity() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiActivityDto[]; count?: number }>(
				activityEndpoints.list()
			)
	);
}

export async function getActivity(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiActivityDto>(activityEndpoints.detail(id))
	);
}

export async function createActivity(body: ActivityCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiActivityDto>(activityEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateActivity(id: string, body: ActivityUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiActivityDto>(activityEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteActivity(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(activityEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

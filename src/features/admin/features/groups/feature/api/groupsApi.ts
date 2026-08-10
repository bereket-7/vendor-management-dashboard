import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { groupsEndpoints } from "../../groups-endpoints";
import type {
	ApiGroupsDto,
	GroupsCreateDto,
	GroupsUpdateDto,
} from "../dto/groupsDto";

export async function listGroups() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiGroupsDto[]; count?: number }>(
				groupsEndpoints.list()
			)
	);
}

export async function getGroups(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiGroupsDto>(groupsEndpoints.detail(id))
	);
}

export async function createGroups(body: GroupsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiGroupsDto>(groupsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateGroups(id: string, body: GroupsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiGroupsDto>(groupsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteGroups(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(groupsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

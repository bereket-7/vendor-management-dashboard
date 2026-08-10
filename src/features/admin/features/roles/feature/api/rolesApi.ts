import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { rolesEndpoints } from "../../roles-endpoints";
import type {
	ApiRolesDto,
	RolesCreateDto,
	RolesUpdateDto,
} from "../dto/rolesDto";

export async function listRoles() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiRolesDto[]; count?: number }>(
				rolesEndpoints.list()
			)
	);
}

export async function getRoles(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiRolesDto>(rolesEndpoints.detail(id))
	);
}

export async function createRoles(body: RolesCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiRolesDto>(rolesEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateRoles(id: string, body: RolesUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiRolesDto>(rolesEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteRoles(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(rolesEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

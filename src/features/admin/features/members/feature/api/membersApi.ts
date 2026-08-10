import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { membersEndpoints } from "../../members-endpoints";
import type {
	ApiMembersDto,
	MembersCreateDto,
	MembersUpdateDto,
} from "../dto/membersDto";

export async function listMembers() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiMembersDto[]; count?: number }>(
				membersEndpoints.list()
			)
	);
}

export async function getMembers(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiMembersDto>(membersEndpoints.detail(id))
	);
}

export async function createMembers(body: MembersCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiMembersDto>(membersEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateMembers(id: string, body: MembersUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiMembersDto>(membersEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteMembers(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(membersEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

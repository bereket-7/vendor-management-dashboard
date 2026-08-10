import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { automationsEndpoints } from "../../automations-endpoints";
import type {
	ApiAutomationsDto,
	AutomationsCreateDto,
	AutomationsUpdateDto,
} from "../dto/automationsDto";

export async function listAutomations() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiAutomationsDto[]; count?: number }>(
				automationsEndpoints.list()
			)
	);
}

export async function getAutomations(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiAutomationsDto>(automationsEndpoints.detail(id))
	);
}

export async function createAutomations(body: AutomationsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiAutomationsDto>(automationsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateAutomations(
	id: string,
	body: AutomationsUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiAutomationsDto>(automationsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteAutomations(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(automationsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

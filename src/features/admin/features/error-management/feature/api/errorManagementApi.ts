import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { errorManagementEndpoints } from "../../error-management-endpoints";
import type {
	ApiErrorManagementDto,
	ErrorManagementCreateDto,
	ErrorManagementUpdateDto,
} from "../dto/errorManagementDto";

export async function listErrorManagement() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiErrorManagementDto[]; count?: number }>(
				errorManagementEndpoints.list()
			)
	);
}

export async function getErrorManagement(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiErrorManagementDto>(errorManagementEndpoints.detail(id))
	);
}

export async function createErrorManagement(body: ErrorManagementCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiErrorManagementDto>(errorManagementEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateErrorManagement(
	id: string,
	body: ErrorManagementUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiErrorManagementDto>(errorManagementEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteErrorManagement(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(errorManagementEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

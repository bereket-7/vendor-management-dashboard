import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { providersEndpoints } from "../../providers-endpoints";
import type {
	ApiProvidersDto,
	ProvidersCreateDto,
	ProvidersUpdateDto,
} from "../dto/providersDto";

export async function listProviders() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiProvidersDto[]; count?: number }>(
				providersEndpoints.list()
			)
	);
}

export async function getProviders(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiProvidersDto>(providersEndpoints.detail(id))
	);
}

export async function createProviders(body: ProvidersCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProvidersDto>(providersEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateProviders(id: string, body: ProvidersUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProvidersDto>(providersEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteProviders(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(providersEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

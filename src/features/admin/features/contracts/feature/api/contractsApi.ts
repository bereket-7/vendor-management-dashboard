import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { contractsEndpoints } from "../../contracts-endpoints";
import type {
	ApiContractsDto,
	ContractsCreateDto,
	ContractsUpdateDto,
} from "../dto/contractsDto";

export async function listContracts() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiContractsDto[]; count?: number }>(
				contractsEndpoints.list()
			)
	);
}

export async function getContracts(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiContractsDto>(contractsEndpoints.detail(id))
	);
}

export async function createContracts(body: ContractsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiContractsDto>(contractsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateContracts(id: string, body: ContractsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiContractsDto>(contractsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteContracts(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(contractsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

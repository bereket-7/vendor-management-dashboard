import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { sourcingEndpoints } from "../../sourcing-endpoints";
import type {
	ApiSourcingDto,
	SourcingCreateDto,
	SourcingUpdateDto,
} from "../dto/sourcingDto";

export async function listSourcing() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiSourcingDto[]; count?: number }>(
				sourcingEndpoints.list()
			)
	);
}

export async function getSourcing(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiSourcingDto>(sourcingEndpoints.detail(id))
	);
}

export async function createSourcing(body: SourcingCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiSourcingDto>(sourcingEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateSourcing(id: string, body: SourcingUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiSourcingDto>(sourcingEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteSourcing(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(sourcingEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

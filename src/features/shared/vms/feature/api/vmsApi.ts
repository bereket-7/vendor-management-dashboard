import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { vmsEndpoints } from "../../vms-endpoints";
import type { ApiVmsDto, VmsCreateDto, VmsUpdateDto } from "../dto/vmsDto";

export async function listVms() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiVmsDto[]; count?: number }>(vmsEndpoints.list())
	);
}

export async function getVms(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiVmsDto>(vmsEndpoints.detail(id))
	);
}

export async function createVms(body: VmsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiVmsDto>(vmsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateVms(id: string, body: VmsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiVmsDto>(vmsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteVms(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(vmsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

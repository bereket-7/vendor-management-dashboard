import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { exportsEndpoints } from "../../exports-endpoints";
import type {
	ApiExportsDto,
	ExportsCreateDto,
	ExportsUpdateDto,
} from "../dto/exportsDto";

export async function listExports() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiExportsDto[]; count?: number }>(
				exportsEndpoints.list()
			)
	);
}

export async function getExports(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiExportsDto>(exportsEndpoints.detail(id))
	);
}

export async function createExports(body: ExportsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiExportsDto>(exportsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateExports(id: string, body: ExportsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiExportsDto>(exportsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteExports(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(exportsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

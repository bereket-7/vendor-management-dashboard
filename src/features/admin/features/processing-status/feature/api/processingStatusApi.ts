import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { processingStatusEndpoints } from "../../processing-status-endpoints";
import type {
	ApiProcessingStatusDto,
	ProcessingStatusCreateDto,
	ProcessingStatusUpdateDto,
} from "../dto/processingStatusDto";

export async function listProcessingStatus() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiProcessingStatusDto[]; count?: number }>(
				processingStatusEndpoints.list()
			)
	);
}

export async function getProcessingStatus(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProcessingStatusDto>(processingStatusEndpoints.detail(id))
	);
}

export async function createProcessingStatus(body: ProcessingStatusCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProcessingStatusDto>(processingStatusEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateProcessingStatus(
	id: string,
	body: ProcessingStatusUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProcessingStatusDto>(processingStatusEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteProcessingStatus(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(processingStatusEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

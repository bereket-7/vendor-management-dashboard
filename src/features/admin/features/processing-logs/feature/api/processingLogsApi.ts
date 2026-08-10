import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { processingLogsEndpoints } from "../../processing-logs-endpoints";
import type {
	ApiProcessingLogsDto,
	ProcessingLogsCreateDto,
	ProcessingLogsUpdateDto,
} from "../dto/processingLogsDto";

export async function listProcessingLogs() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiProcessingLogsDto[]; count?: number }>(
				processingLogsEndpoints.list()
			)
	);
}

export async function getProcessingLogs(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiProcessingLogsDto>(processingLogsEndpoints.detail(id))
	);
}

export async function createProcessingLogs(body: ProcessingLogsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProcessingLogsDto>(processingLogsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateProcessingLogs(
	id: string,
	body: ProcessingLogsUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiProcessingLogsDto>(processingLogsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteProcessingLogs(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(processingLogsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

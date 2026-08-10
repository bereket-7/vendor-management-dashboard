import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { fileHistoryEndpoints } from "../../file-history-endpoints";
import type {
	ApiFileHistoryDto,
	FileHistoryCreateDto,
	FileHistoryUpdateDto,
} from "../dto/fileHistoryDto";

export async function listFileHistory() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiFileHistoryDto[]; count?: number }>(
				fileHistoryEndpoints.list()
			)
	);
}

export async function getFileHistory(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiFileHistoryDto>(fileHistoryEndpoints.detail(id))
	);
}

export async function createFileHistory(body: FileHistoryCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiFileHistoryDto>(fileHistoryEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateFileHistory(
	id: string,
	body: FileHistoryUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiFileHistoryDto>(fileHistoryEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteFileHistory(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(fileHistoryEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

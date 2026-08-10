import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { fileManagementEndpoints } from "../../file-management-endpoints";
import type {
	ApiFileManagementDto,
	FileManagementCreateDto,
	FileManagementUpdateDto,
} from "../dto/fileManagementDto";

export async function listFileManagement() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiFileManagementDto[]; count?: number }>(
				fileManagementEndpoints.list()
			)
	);
}

export async function getFileManagement(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiFileManagementDto>(fileManagementEndpoints.detail(id))
	);
}

export async function createFileManagement(body: FileManagementCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiFileManagementDto>(fileManagementEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateFileManagement(
	id: string,
	body: FileManagementUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiFileManagementDto>(fileManagementEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteFileManagement(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(fileManagementEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

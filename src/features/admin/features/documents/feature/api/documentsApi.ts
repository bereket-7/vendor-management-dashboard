import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { documentsEndpoints } from "../../documents-endpoints";
import type {
	ApiDocumentsDto,
	DocumentsCreateDto,
	DocumentsUpdateDto,
} from "../dto/documentsDto";

export async function listDocuments() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiDocumentsDto[]; count?: number }>(
				documentsEndpoints.list()
			)
	);
}

export async function getDocuments(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiDocumentsDto>(documentsEndpoints.detail(id))
	);
}

export async function createDocuments(body: DocumentsCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiDocumentsDto>(documentsEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateDocuments(id: string, body: DocumentsUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiDocumentsDto>(documentsEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteDocuments(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(documentsEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

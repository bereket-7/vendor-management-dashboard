import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { categoriesEndpoints } from "../../categories-endpoints";
import type {
	ApiCategoriesDto,
	CategoriesCreateDto,
	CategoriesUpdateDto,
} from "../dto/categoriesDto";

export async function listCategories() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiCategoriesDto[]; count?: number }>(
				categoriesEndpoints.list()
			)
	);
}

export async function getCategories(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiCategoriesDto>(categoriesEndpoints.detail(id))
	);
}

export async function createCategories(body: CategoriesCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiCategoriesDto>(categoriesEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateCategories(id: string, body: CategoriesUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiCategoriesDto>(categoriesEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteCategories(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(categoriesEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

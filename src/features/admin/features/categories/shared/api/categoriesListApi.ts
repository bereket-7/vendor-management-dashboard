import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { categoriesEndpoints } from "../../categories-endpoints";
import type { ApiCategoriesRecordDto } from "../dto/categoriesRecordDto";

export { categoriesEndpoints };

export type CategoriesListResponse = {
	results?: ApiCategoriesRecordDto[] | null;
	count?: number | null;
};

export async function listCategoriesRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<CategoriesListResponse>(categoriesEndpoints.list(), { params })
	);
}

export async function getCategoriesRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiCategoriesRecordDto>(categoriesEndpoints.detail(id))
	);
}

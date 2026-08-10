import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { rolesEndpoints } from "../../roles-endpoints";
import type { ApiRolesRecordDto } from "../dto/rolesRecordDto";

export { rolesEndpoints };

export type RolesListResponse = {
	results?: ApiRolesRecordDto[] | null;
	count?: number | null;
};

export async function listRolesRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<RolesListResponse>(rolesEndpoints.list(), { params })
	);
}

export async function getRolesRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiRolesRecordDto>(rolesEndpoints.detail(id))
	);
}

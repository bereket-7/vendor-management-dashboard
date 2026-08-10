import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { groupsEndpoints } from "../../groups-endpoints";
import type { ApiGroupsRecordDto } from "../dto/groupsRecordDto";

export { groupsEndpoints };

export type GroupsListResponse = {
	results?: ApiGroupsRecordDto[] | null;
	count?: number | null;
};

export async function listGroupsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<GroupsListResponse>(groupsEndpoints.list(), { params })
	);
}

export async function getGroupsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiGroupsRecordDto>(groupsEndpoints.detail(id))
	);
}

import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { membersEndpoints } from "../../members-endpoints";
import type { ApiMembersRecordDto } from "../dto/membersRecordDto";

export { membersEndpoints };

export type MembersListResponse = {
	results?: ApiMembersRecordDto[] | null;
	count?: number | null;
};

export async function listMembersRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<MembersListResponse>(membersEndpoints.list(), { params })
	);
}

export async function getMembersRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiMembersRecordDto>(membersEndpoints.detail(id))
	);
}

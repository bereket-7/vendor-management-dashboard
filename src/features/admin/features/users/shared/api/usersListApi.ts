import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { usersEndpoints } from "../../users-endpoints";
import type { ApiUsersRecordDto } from "../dto/usersRecordDto";

export { usersEndpoints };

export type UsersListResponse = {
	results?: ApiUsersRecordDto[] | null;
	count?: number | null;
};

export async function listUsersRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() => apiClient<UsersListResponse>(usersEndpoints.list(), { params })
	);
}

export async function getUsersRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiUsersRecordDto>(usersEndpoints.detail(id))
	);
}

import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { approvalsEndpoints } from "../../approvals-endpoints";
import type { ApiApprovalsRecordDto } from "../dto/approvalsRecordDto";

export { approvalsEndpoints };

export type ApprovalsListResponse = {
	results?: ApiApprovalsRecordDto[] | null;
	count?: number | null;
};

export async function listApprovalsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<ApprovalsListResponse>(approvalsEndpoints.list(), { params })
	);
}

export async function getApprovalsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiApprovalsRecordDto>(approvalsEndpoints.detail(id))
	);
}

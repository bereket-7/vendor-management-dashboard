import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { automationsEndpoints } from "../../automations-endpoints";
import type { ApiAutomationsRecordDto } from "../dto/automationsRecordDto";

export { automationsEndpoints };

export type AutomationsListResponse = {
	results?: ApiAutomationsRecordDto[] | null;
	count?: number | null;
};

export async function listAutomationsRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<AutomationsListResponse>(automationsEndpoints.list(), {
				params,
			})
	);
}

export async function getAutomationsRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiAutomationsRecordDto>(automationsEndpoints.detail(id))
	);
}

import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { integrationIntakeEndpoints } from "../../integration-intake-endpoints";
import type { ApiIntegrationIntakeRecordDto } from "../dto/integrationIntakeRecordDto";

export { integrationIntakeEndpoints };

export type IntegrationIntakeListResponse = {
	results?: ApiIntegrationIntakeRecordDto[] | null;
	count?: number | null;
};

export async function listIntegrationIntakeRecords(
	params?: Record<string, string>
) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<IntegrationIntakeListResponse>(
				integrationIntakeEndpoints.list(),
				{ params }
			)
	);
}

export async function getIntegrationIntakeRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiIntegrationIntakeRecordDto>(
				integrationIntakeEndpoints.detail(id)
			)
	);
}

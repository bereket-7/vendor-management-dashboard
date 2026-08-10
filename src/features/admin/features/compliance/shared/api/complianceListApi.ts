import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { complianceEndpoints } from "../../compliance-endpoints";
import type { ApiComplianceRecordDto } from "../dto/complianceRecordDto";

export { complianceEndpoints };

export type ComplianceListResponse = {
	results?: ApiComplianceRecordDto[] | null;
	count?: number | null;
};

export async function listComplianceRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<ComplianceListResponse>(complianceEndpoints.list(), { params })
	);
}

export async function getComplianceRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiComplianceRecordDto>(complianceEndpoints.detail(id))
	);
}

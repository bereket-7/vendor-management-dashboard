import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { auditTrailEndpoints } from "../../audit-trail-endpoints";
import type { ApiAuditTrailRecordDto } from "../dto/auditTrailRecordDto";

export { auditTrailEndpoints };

export type AuditTrailListResponse = {
	results?: ApiAuditTrailRecordDto[] | null;
	count?: number | null;
};

export async function listAuditTrailRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<AuditTrailListResponse>(auditTrailEndpoints.list(), { params })
	);
}

export async function getAuditTrailRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiAuditTrailRecordDto>(auditTrailEndpoints.detail(id))
	);
}

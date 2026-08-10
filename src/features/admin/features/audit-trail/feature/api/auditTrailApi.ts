import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { auditTrailEndpoints } from "../../audit-trail-endpoints";
import type {
	ApiAuditTrailDto,
	AuditTrailCreateDto,
	AuditTrailUpdateDto,
} from "../dto/auditTrailDto";

export async function listAuditTrail() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiAuditTrailDto[]; count?: number }>(
				auditTrailEndpoints.list()
			)
	);
}

export async function getAuditTrail(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiAuditTrailDto>(auditTrailEndpoints.detail(id))
	);
}

export async function createAuditTrail(body: AuditTrailCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiAuditTrailDto>(auditTrailEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateAuditTrail(id: string, body: AuditTrailUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiAuditTrailDto>(auditTrailEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteAuditTrail(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(auditTrailEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { complianceEndpoints } from "../../compliance-endpoints";
import type {
	ApiComplianceDto,
	ComplianceCreateDto,
	ComplianceUpdateDto,
} from "../dto/complianceDto";

export async function listCompliance() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiComplianceDto[]; count?: number }>(
				complianceEndpoints.list()
			)
	);
}

export async function getCompliance(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiComplianceDto>(complianceEndpoints.detail(id))
	);
}

export async function createCompliance(body: ComplianceCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiComplianceDto>(complianceEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateCompliance(id: string, body: ComplianceUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiComplianceDto>(complianceEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteCompliance(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(complianceEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

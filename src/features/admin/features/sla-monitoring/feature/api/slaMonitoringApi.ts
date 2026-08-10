import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { slaMonitoringEndpoints } from "../../sla-monitoring-endpoints";
import type {
	ApiSlaMonitoringDto,
	SlaMonitoringCreateDto,
	SlaMonitoringUpdateDto,
} from "../dto/slaMonitoringDto";

export async function listSlaMonitoring() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiSlaMonitoringDto[]; count?: number }>(
				slaMonitoringEndpoints.list()
			)
	);
}

export async function getSlaMonitoring(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiSlaMonitoringDto>(slaMonitoringEndpoints.detail(id))
	);
}

export async function createSlaMonitoring(body: SlaMonitoringCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiSlaMonitoringDto>(slaMonitoringEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateSlaMonitoring(
	id: string,
	body: SlaMonitoringUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiSlaMonitoringDto>(slaMonitoringEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteSlaMonitoring(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(slaMonitoringEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

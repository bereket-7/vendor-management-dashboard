import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { integrationIntakeEndpoints } from "../../integration-intake-endpoints";
import type {
	ApiIntegrationIntakeDto,
	IntegrationIntakeCreateDto,
	IntegrationIntakeUpdateDto,
} from "../dto/integrationIntakeDto";

export async function listIntegrationIntake() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiIntegrationIntakeDto[]; count?: number }>(
				integrationIntakeEndpoints.list()
			)
	);
}

export async function getIntegrationIntake(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiIntegrationIntakeDto>(integrationIntakeEndpoints.detail(id))
	);
}

export async function createIntegrationIntake(
	body: IntegrationIntakeCreateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiIntegrationIntakeDto>(integrationIntakeEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateIntegrationIntake(
	id: string,
	body: IntegrationIntakeUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiIntegrationIntakeDto>(
				integrationIntakeEndpoints.update(id),
				{
					method: "PATCH",
					body: JSON.stringify(body),
				}
			)
	);
}

export async function deleteIntegrationIntake(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(integrationIntakeEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

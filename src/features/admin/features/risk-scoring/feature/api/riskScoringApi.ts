import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { riskScoringEndpoints } from "../../risk-scoring-endpoints";
import type {
	ApiRiskScoringDto,
	RiskScoringCreateDto,
	RiskScoringUpdateDto,
} from "../dto/riskScoringDto";

export async function listRiskScoring() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiRiskScoringDto[]; count?: number }>(
				riskScoringEndpoints.list()
			)
	);
}

export async function getRiskScoring(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiRiskScoringDto>(riskScoringEndpoints.detail(id))
	);
}

export async function createRiskScoring(body: RiskScoringCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiRiskScoringDto>(riskScoringEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateRiskScoring(
	id: string,
	body: RiskScoringUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiRiskScoringDto>(riskScoringEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteRiskScoring(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(riskScoringEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

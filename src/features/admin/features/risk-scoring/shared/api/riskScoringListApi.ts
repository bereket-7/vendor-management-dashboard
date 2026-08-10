import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { riskScoringEndpoints } from "../../risk-scoring-endpoints";
import type { ApiRiskScoringRecordDto } from "../dto/riskScoringRecordDto";

export { riskScoringEndpoints };

export type RiskScoringListResponse = {
	results?: ApiRiskScoringRecordDto[] | null;
	count?: number | null;
};

export async function listRiskScoringRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<RiskScoringListResponse>(riskScoringEndpoints.list(), {
				params,
			})
	);
}

export async function getRiskScoringRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiRiskScoringRecordDto>(riskScoringEndpoints.detail(id))
	);
}

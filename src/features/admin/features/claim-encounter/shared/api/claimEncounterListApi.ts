import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { claimEncounterEndpoints } from "../../claim-encounter-endpoints";
import type { ApiClaimEncounterRecordDto } from "../dto/claimEncounterRecordDto";

export { claimEncounterEndpoints };

export type ClaimEncounterListResponse = {
	results?: ApiClaimEncounterRecordDto[] | null;
	count?: number | null;
};

export async function listClaimEncounterRecords(
	params?: Record<string, string>
) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<ClaimEncounterListResponse>(claimEncounterEndpoints.list(), {
				params,
			})
	);
}

export async function getClaimEncounterRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiClaimEncounterRecordDto>(claimEncounterEndpoints.detail(id))
	);
}

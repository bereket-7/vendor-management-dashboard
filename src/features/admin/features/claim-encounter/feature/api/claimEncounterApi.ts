import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { claimEncounterEndpoints } from "../../claim-encounter-endpoints";
import type {
	ApiClaimEncounterDto,
	ClaimEncounterCreateDto,
	ClaimEncounterUpdateDto,
} from "../dto/claimEncounterDto";

export async function listClaimEncounter() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiClaimEncounterDto[]; count?: number }>(
				claimEncounterEndpoints.list()
			)
	);
}

export async function getClaimEncounter(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiClaimEncounterDto>(claimEncounterEndpoints.detail(id))
	);
}

export async function createClaimEncounter(body: ClaimEncounterCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiClaimEncounterDto>(claimEncounterEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateClaimEncounter(
	id: string,
	body: ClaimEncounterUpdateDto
) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiClaimEncounterDto>(claimEncounterEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteClaimEncounter(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(claimEncounterEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { onboardingEndpoints } from "../../onboarding-endpoints";
import type { ApiOnboardingRecordDto } from "../dto/onboardingRecordDto";

export { onboardingEndpoints };

export type OnboardingListResponse = {
	results?: ApiOnboardingRecordDto[] | null;
	count?: number | null;
};

export async function listOnboardingRecords(params?: Record<string, string>) {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<OnboardingListResponse>(onboardingEndpoints.list(), { params })
	);
}

export async function getOnboardingRecord(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiOnboardingRecordDto>(onboardingEndpoints.detail(id))
	);
}

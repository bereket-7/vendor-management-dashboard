import { apiClient } from "@/lib/api/client";
import { withMockOrRemote } from "@/lib/mock-mode";

import { onboardingEndpoints } from "../../onboarding-endpoints";
import type {
	ApiOnboardingDto,
	OnboardingCreateDto,
	OnboardingUpdateDto,
} from "../dto/onboardingDto";

export async function listOnboarding() {
	return withMockOrRemote(
		() => ({ results: [], count: 0 }),
		() =>
			apiClient<{ results?: ApiOnboardingDto[]; count?: number }>(
				onboardingEndpoints.list()
			)
	);
}

export async function getOnboarding(id: string) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() => apiClient<ApiOnboardingDto>(onboardingEndpoints.detail(id))
	);
}

export async function createOnboarding(body: OnboardingCreateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiOnboardingDto>(onboardingEndpoints.create(), {
				method: "POST",
				body: JSON.stringify(body),
			})
	);
}

export async function updateOnboarding(id: string, body: OnboardingUpdateDto) {
	return withMockOrRemote(
		() => ({ id: "mock" }) as never,
		() =>
			apiClient<ApiOnboardingDto>(onboardingEndpoints.update(id), {
				method: "PATCH",
				body: JSON.stringify(body),
			})
	);
}

export async function deleteOnboarding(id: string) {
	return withMockOrRemote(
		() => undefined,
		() =>
			apiClient<void>(onboardingEndpoints.delete(id), {
				method: "DELETE",
			})
	);
}

import { vmsApi } from "@/features/shared/vms/api";
import type { OnboardingCaseModel } from "@/features/shared/vms/types";

import type { OnboardingUpdateDto } from "../dto/onboardingDto";

function requireRecord<T>(record: T | null): T {
	if (!record) throw new Error("VMS record was not found");
	return record;
}

export async function seedOnboarding(force = false) {
	return vmsApi.seedOnboarding(force);
}

export async function listOnboarding(): Promise<OnboardingCaseModel[]> {
	return vmsApi.listOnboarding();
}

export async function getOnboarding(id: string): Promise<OnboardingCaseModel> {
	return requireRecord(await vmsApi.getOnboarding(id));
}

export async function updateOnboarding(
	id: string,
	patch: OnboardingUpdateDto
): Promise<OnboardingCaseModel> {
	return requireRecord(await vmsApi.updateOnboarding(id, patch));
}

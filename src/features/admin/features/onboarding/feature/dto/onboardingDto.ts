import type { ApiOnboardingRecordDto } from "../../shared/dto/onboardingRecordDto";

export type ApiOnboardingDto = ApiOnboardingRecordDto;

export type OnboardingCreateDto = {
	name: string;
};

export type OnboardingUpdateDto = Partial<OnboardingCreateDto>;

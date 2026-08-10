import type {
	OnboardingCreateDto,
	OnboardingUpdateDto,
} from "../dto/onboardingDto";
import type { OnboardingModel } from "../types/onboardingModel";

export { toOnboardingModel } from "../../shared/mappers/onboardingMappers";

export function toOnboardingCreateDto(
	model: Pick<OnboardingModel, "name">
): OnboardingCreateDto {
	return { name: model.name };
}

export function toOnboardingUpdateDto(
	model: Partial<Pick<OnboardingModel, "name">>
): OnboardingUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

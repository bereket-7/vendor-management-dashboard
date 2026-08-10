import type {
	ClaimEncounterCreateDto,
	ClaimEncounterUpdateDto,
} from "../dto/claimEncounterDto";
import type { ClaimEncounterModel } from "../types/claimEncounterModel";

export { toClaimEncounterModel } from "../../shared/mappers/claimEncounterMappers";

export function toClaimEncounterCreateDto(
	model: Pick<ClaimEncounterModel, "name">
): ClaimEncounterCreateDto {
	return { name: model.name };
}

export function toClaimEncounterUpdateDto(
	model: Partial<Pick<ClaimEncounterModel, "name">>
): ClaimEncounterUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

import type { SourcingCreateDto, SourcingUpdateDto } from "../dto/sourcingDto";
import type { SourcingModel } from "../types/sourcingModel";

export { toSourcingModel } from "../../shared/mappers/sourcingMappers";

export function toSourcingCreateDto(
	model: Pick<SourcingModel, "name">
): SourcingCreateDto {
	return { name: model.name };
}

export function toSourcingUpdateDto(
	model: Partial<Pick<SourcingModel, "name">>
): SourcingUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

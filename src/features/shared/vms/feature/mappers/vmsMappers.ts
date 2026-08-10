import type { VmsCreateDto, VmsUpdateDto } from "../dto/vmsDto";
import type { VmsModel } from "../types/vmsModel";

export { toVmsModel } from "../../shared/mappers/vmsMappers";

export function toVmsCreateDto(model: Pick<VmsModel, "name">): VmsCreateDto {
	return { name: model.name };
}

export function toVmsUpdateDto(
	model: Partial<Pick<VmsModel, "name">>
): VmsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

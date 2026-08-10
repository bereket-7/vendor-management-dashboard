import type { RolesCreateDto, RolesUpdateDto } from "../dto/rolesDto";
import type { RolesModel } from "../types/rolesModel";

export { toRolesModel } from "../../shared/mappers/rolesMappers";

export function toRolesCreateDto(
	model: Pick<RolesModel, "name">
): RolesCreateDto {
	return { name: model.name };
}

export function toRolesUpdateDto(
	model: Partial<Pick<RolesModel, "name">>
): RolesUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

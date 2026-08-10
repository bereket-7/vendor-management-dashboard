import type { ExportsCreateDto, ExportsUpdateDto } from "../dto/exportsDto";
import type { ExportsModel } from "../types/exportsModel";

export { toExportsModel } from "../../shared/mappers/exportsMappers";

export function toExportsCreateDto(
	model: Pick<ExportsModel, "name">
): ExportsCreateDto {
	return { name: model.name };
}

export function toExportsUpdateDto(
	model: Partial<Pick<ExportsModel, "name">>
): ExportsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

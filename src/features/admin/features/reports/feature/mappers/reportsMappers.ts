import type { ReportsCreateDto, ReportsUpdateDto } from "../dto/reportsDto";
import type { ReportsModel } from "../types/reportsModel";

export { toReportsModel } from "../../shared/mappers/reportsMappers";

export function toReportsCreateDto(
	model: Pick<ReportsModel, "name">
): ReportsCreateDto {
	return { name: model.name };
}

export function toReportsUpdateDto(
	model: Partial<Pick<ReportsModel, "name">>
): ReportsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

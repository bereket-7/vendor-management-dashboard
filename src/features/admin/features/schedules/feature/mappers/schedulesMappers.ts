import type {
	SchedulesCreateDto,
	SchedulesUpdateDto,
} from "../dto/schedulesDto";
import type { SchedulesModel } from "../types/schedulesModel";

export { toSchedulesModel } from "../../shared/mappers/schedulesMappers";

export function toSchedulesCreateDto(
	model: Pick<SchedulesModel, "name">
): SchedulesCreateDto {
	return { name: model.name };
}

export function toSchedulesUpdateDto(
	model: Partial<Pick<SchedulesModel, "name">>
): SchedulesUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

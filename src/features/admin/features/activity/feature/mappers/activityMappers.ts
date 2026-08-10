import type { ActivityCreateDto, ActivityUpdateDto } from "../dto/activityDto";
import type { ActivityModel } from "../types/activityModel";

export { toActivityModel } from "../../shared/mappers/activityMappers";

export function toActivityCreateDto(
	model: Pick<ActivityModel, "name">
): ActivityCreateDto {
	return { name: model.name };
}

export function toActivityUpdateDto(
	model: Partial<Pick<ActivityModel, "name">>
): ActivityUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

import type {
	AutomationsCreateDto,
	AutomationsUpdateDto,
} from "../dto/automationsDto";
import type { AutomationsModel } from "../types/automationsModel";

export { toAutomationsModel } from "../../shared/mappers/automationsMappers";

export function toAutomationsCreateDto(
	model: Pick<AutomationsModel, "name">
): AutomationsCreateDto {
	return { name: model.name };
}

export function toAutomationsUpdateDto(
	model: Partial<Pick<AutomationsModel, "name">>
): AutomationsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

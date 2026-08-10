import type {
	IntegrationIntakeCreateDto,
	IntegrationIntakeUpdateDto,
} from "../dto/integrationIntakeDto";
import type { IntegrationIntakeModel } from "../types/integrationIntakeModel";

export { toIntegrationIntakeModel } from "../../shared/mappers/integrationIntakeMappers";

export function toIntegrationIntakeCreateDto(
	model: Pick<IntegrationIntakeModel, "name">
): IntegrationIntakeCreateDto {
	return { name: model.name };
}

export function toIntegrationIntakeUpdateDto(
	model: Partial<Pick<IntegrationIntakeModel, "name">>
): IntegrationIntakeUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

import type {
	ProvidersCreateDto,
	ProvidersUpdateDto,
} from "../dto/providersDto";
import type { ProvidersModel } from "../types/providersModel";

export { toProvidersModel } from "../../shared/mappers/providersMappers";

export function toProvidersCreateDto(
	model: Pick<ProvidersModel, "name">
): ProvidersCreateDto {
	return { name: model.name };
}

export function toProvidersUpdateDto(
	model: Partial<Pick<ProvidersModel, "name">>
): ProvidersUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

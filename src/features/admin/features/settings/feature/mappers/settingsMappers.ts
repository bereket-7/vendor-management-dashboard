import type { SettingsCreateDto, SettingsUpdateDto } from "../dto/settingsDto";
import type { SettingsModel } from "../types/settingsModel";

export { toSettingsModel } from "../../shared/mappers/settingsMappers";

export function toSettingsCreateDto(
	model: Pick<SettingsModel, "name">
): SettingsCreateDto {
	return { name: model.name };
}

export function toSettingsUpdateDto(
	model: Partial<Pick<SettingsModel, "name">>
): SettingsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

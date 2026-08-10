import type { ApiSettingsRecordDto } from "../../shared/dto/settingsRecordDto";

export type ApiSettingsDto = ApiSettingsRecordDto;

export type SettingsCreateDto = {
	name: string;
};

export type SettingsUpdateDto = Partial<SettingsCreateDto>;

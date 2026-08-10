import type { ApiProvidersRecordDto } from "../../shared/dto/providersRecordDto";

export type ApiProvidersDto = ApiProvidersRecordDto;

export type ProvidersCreateDto = {
	name: string;
};

export type ProvidersUpdateDto = Partial<ProvidersCreateDto>;

import type { ApiErrorManagementRecordDto } from "../../shared/dto/errorManagementRecordDto";

export type ApiErrorManagementDto = ApiErrorManagementRecordDto;

export type ErrorManagementCreateDto = {
	name: string;
};

export type ErrorManagementUpdateDto = Partial<ErrorManagementCreateDto>;

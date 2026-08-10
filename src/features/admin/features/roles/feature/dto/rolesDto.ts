import type { ApiRolesRecordDto } from "../../shared/dto/rolesRecordDto";

export type ApiRolesDto = ApiRolesRecordDto;

export type RolesCreateDto = {
	name: string;
};

export type RolesUpdateDto = Partial<RolesCreateDto>;

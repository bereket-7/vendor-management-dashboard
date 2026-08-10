import type { ApiMembersRecordDto } from "../../shared/dto/membersRecordDto";

export type ApiMembersDto = ApiMembersRecordDto;

export type MembersCreateDto = {
	name: string;
};

export type MembersUpdateDto = Partial<MembersCreateDto>;

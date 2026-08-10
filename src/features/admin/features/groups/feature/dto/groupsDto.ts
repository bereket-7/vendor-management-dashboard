import type { ApiGroupsRecordDto } from "../../shared/dto/groupsRecordDto";

export type ApiGroupsDto = ApiGroupsRecordDto;

export type GroupsCreateDto = {
	name: string;
};

export type GroupsUpdateDto = Partial<GroupsCreateDto>;

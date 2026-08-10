import type { ApiUsersRecordDto } from "../../shared/dto/usersRecordDto";

export type ApiUsersDto = ApiUsersRecordDto;

export type UsersCreateDto = {
	name: string;
};

export type UsersUpdateDto = Partial<UsersCreateDto>;

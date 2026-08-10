import type { UsersCreateDto, UsersUpdateDto } from "../dto/usersDto";
import type { UsersModel } from "../types/usersModel";

export { toUsersModel } from "../../shared/mappers/usersMappers";

export function toUsersCreateDto(
	model: Pick<UsersModel, "name">
): UsersCreateDto {
	return { name: model.name };
}

export function toUsersUpdateDto(
	model: Partial<Pick<UsersModel, "name">>
): UsersUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

import type { UsersModel } from "../../feature/types/usersModel";
import type { ApiUsersRecordDto } from "../dto/usersRecordDto";

export function toUsersModel(row: ApiUsersRecordDto, index = 0): UsersModel {
	const id = row.id != null ? String(row.id) : `users-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

import type { MembersModel } from "../../feature/types/membersModel";
import type { ApiMembersRecordDto } from "../dto/membersRecordDto";

export function toMembersModel(
	row: ApiMembersRecordDto,
	index = 0
): MembersModel {
	const id = row.id != null ? String(row.id) : `members-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

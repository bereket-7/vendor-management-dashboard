import type { GroupsModel } from "../../feature/types/groupsModel";
import type { ApiGroupsRecordDto } from "../dto/groupsRecordDto";

export function toGroupsModel(row: ApiGroupsRecordDto, index = 0): GroupsModel {
	const id = row.id != null ? String(row.id) : `groups-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

import type { RolesModel } from "../../feature/types/rolesModel";
import type { ApiRolesRecordDto } from "../dto/rolesRecordDto";

export function toRolesModel(row: ApiRolesRecordDto, index = 0): RolesModel {
	const id = row.id != null ? String(row.id) : `roles-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

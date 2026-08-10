import type { FileManagementModel } from "../../feature/types/fileManagementModel";
import type { ApiFileManagementRecordDto } from "../dto/fileManagementRecordDto";

export function toFileManagementModel(
	row: ApiFileManagementRecordDto,
	index = 0
): FileManagementModel {
	const id = row.id != null ? String(row.id) : `file-management-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

import type { FileHistoryModel } from "../../feature/types/fileHistoryModel";
import type { ApiFileHistoryRecordDto } from "../dto/fileHistoryRecordDto";

export function toFileHistoryModel(
	row: ApiFileHistoryRecordDto,
	index = 0
): FileHistoryModel {
	const id = row.id != null ? String(row.id) : `file-history-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

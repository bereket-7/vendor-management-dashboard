import type { ReportsModel } from "../../feature/types/reportsModel";
import type { ApiReportsRecordDto } from "../dto/reportsRecordDto";

export function toReportsModel(
	row: ApiReportsRecordDto,
	index = 0
): ReportsModel {
	const id = row.id != null ? String(row.id) : `reports-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

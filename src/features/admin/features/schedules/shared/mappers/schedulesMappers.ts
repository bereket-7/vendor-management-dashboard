import type { SchedulesModel } from "../../feature/types/schedulesModel";
import type { ApiSchedulesRecordDto } from "../dto/schedulesRecordDto";

export function toSchedulesModel(
	row: ApiSchedulesRecordDto,
	index = 0
): SchedulesModel {
	const id = row.id != null ? String(row.id) : `schedules-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

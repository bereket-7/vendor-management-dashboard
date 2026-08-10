import type { ActivityModel } from "../../feature/types/activityModel";
import type { ApiActivityRecordDto } from "../dto/activityRecordDto";

export function toActivityModel(
	row: ApiActivityRecordDto,
	index = 0
): ActivityModel {
	const id = row.id != null ? String(row.id) : `activity-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

import type { PerformanceModel } from "../../feature/types/performanceModel";
import type { ApiPerformanceRecordDto } from "../dto/performanceRecordDto";

export function toPerformanceModel(
	row: ApiPerformanceRecordDto,
	index = 0
): PerformanceModel {
	const id = row.id != null ? String(row.id) : `performance-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

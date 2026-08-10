import type { ProcessingStatusModel } from "../../feature/types/processingStatusModel";
import type { ApiProcessingStatusRecordDto } from "../dto/processingStatusRecordDto";

export function toProcessingStatusModel(
	row: ApiProcessingStatusRecordDto,
	index = 0
): ProcessingStatusModel {
	const id = row.id != null ? String(row.id) : `processing-status-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

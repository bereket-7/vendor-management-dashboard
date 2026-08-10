import type { SourcingModel } from "../../feature/types/sourcingModel";
import type { ApiSourcingRecordDto } from "../dto/sourcingRecordDto";

export function toSourcingModel(
	row: ApiSourcingRecordDto,
	index = 0
): SourcingModel {
	const id = row.id != null ? String(row.id) : `sourcing-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

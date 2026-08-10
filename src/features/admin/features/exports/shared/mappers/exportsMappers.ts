import type { ExportsModel } from "../../feature/types/exportsModel";
import type { ApiExportsRecordDto } from "../dto/exportsRecordDto";

export function toExportsModel(
	row: ApiExportsRecordDto,
	index = 0
): ExportsModel {
	const id = row.id != null ? String(row.id) : `exports-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

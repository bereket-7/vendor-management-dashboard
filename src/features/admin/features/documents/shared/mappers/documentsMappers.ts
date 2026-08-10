import type { DocumentsModel } from "../../feature/types/documentsModel";
import type { ApiDocumentsRecordDto } from "../dto/documentsRecordDto";

export function toDocumentsModel(
	row: ApiDocumentsRecordDto,
	index = 0
): DocumentsModel {
	const id = row.id != null ? String(row.id) : `documents-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

import type { ErrorManagementModel } from "../../feature/types/errorManagementModel";
import type { ApiErrorManagementRecordDto } from "../dto/errorManagementRecordDto";

export function toErrorManagementModel(
	row: ApiErrorManagementRecordDto,
	index = 0
): ErrorManagementModel {
	const id = row.id != null ? String(row.id) : `error-management-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

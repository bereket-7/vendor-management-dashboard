import type { ApprovalsModel } from "../../feature/types/approvalsModel";
import type { ApiApprovalsRecordDto } from "../dto/approvalsRecordDto";

export function toApprovalsModel(
	row: ApiApprovalsRecordDto,
	index = 0
): ApprovalsModel {
	const id = row.id != null ? String(row.id) : `approvals-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

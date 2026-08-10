import type { AuditTrailModel } from "../../feature/types/auditTrailModel";
import type { ApiAuditTrailRecordDto } from "../dto/auditTrailRecordDto";

export function toAuditTrailModel(
	row: ApiAuditTrailRecordDto,
	index = 0
): AuditTrailModel {
	const id = row.id != null ? String(row.id) : `audit-trail-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

import type { ComplianceModel } from "../../feature/types/complianceModel";
import type { ApiComplianceRecordDto } from "../dto/complianceRecordDto";

export function toComplianceModel(
	row: ApiComplianceRecordDto,
	index = 0
): ComplianceModel {
	const id = row.id != null ? String(row.id) : `compliance-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

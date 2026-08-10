import type { AutomationsModel } from "../../feature/types/automationsModel";
import type { ApiAutomationsRecordDto } from "../dto/automationsRecordDto";

export function toAutomationsModel(
	row: ApiAutomationsRecordDto,
	index = 0
): AutomationsModel {
	const id = row.id != null ? String(row.id) : `automations-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

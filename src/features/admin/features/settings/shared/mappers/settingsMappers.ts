import type { SettingsModel } from "../../feature/types/settingsModel";
import type { ApiSettingsRecordDto } from "../dto/settingsRecordDto";

export function toSettingsModel(
	row: ApiSettingsRecordDto,
	index = 0
): SettingsModel {
	const id = row.id != null ? String(row.id) : `settings-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

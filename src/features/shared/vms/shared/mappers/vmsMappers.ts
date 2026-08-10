import type { VmsModel } from "../../feature/types/vmsModel";
import type { ApiVmsRecordDto } from "../dto/vmsRecordDto";

export function toVmsModel(row: ApiVmsRecordDto, index = 0): VmsModel {
	const id = row.id != null ? String(row.id) : `vms-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

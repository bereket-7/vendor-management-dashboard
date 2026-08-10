import type { InvoicesModel } from "../../feature/types/invoicesModel";
import type { ApiInvoicesRecordDto } from "../dto/invoicesRecordDto";

export function toInvoicesModel(
	row: ApiInvoicesRecordDto,
	index = 0
): InvoicesModel {
	const id = row.id != null ? String(row.id) : `invoices-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

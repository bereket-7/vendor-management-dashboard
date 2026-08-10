import type { PurchaseOrdersModel } from "../../feature/types/purchaseOrdersModel";
import type { ApiPurchaseOrdersRecordDto } from "../dto/purchaseOrdersRecordDto";

export function toPurchaseOrdersModel(
	row: ApiPurchaseOrdersRecordDto,
	index = 0
): PurchaseOrdersModel {
	const id = row.id != null ? String(row.id) : `purchase-orders-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

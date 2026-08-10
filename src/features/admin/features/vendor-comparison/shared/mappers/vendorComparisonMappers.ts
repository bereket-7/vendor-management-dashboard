import type { VendorComparisonModel } from "../../feature/types/vendorComparisonModel";
import type { ApiVendorComparisonRecordDto } from "../dto/vendorComparisonRecordDto";

export function toVendorComparisonModel(
	row: ApiVendorComparisonRecordDto,
	index = 0
): VendorComparisonModel {
	const id = row.id != null ? String(row.id) : `vendor-comparison-${index}`;
	const name =
		typeof row.name === "string" && row.name.length > 0 ? row.name : "—";
	return { id, name };
}

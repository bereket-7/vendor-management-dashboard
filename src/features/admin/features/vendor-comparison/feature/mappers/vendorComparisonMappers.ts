import type {
	VendorComparisonCreateDto,
	VendorComparisonUpdateDto,
} from "../dto/vendorComparisonDto";
import type { VendorComparisonModel } from "../types/vendorComparisonModel";

export { toVendorComparisonModel } from "../../shared/mappers/vendorComparisonMappers";

export function toVendorComparisonCreateDto(
	model: Pick<VendorComparisonModel, "name">
): VendorComparisonCreateDto {
	return { name: model.name };
}

export function toVendorComparisonUpdateDto(
	model: Partial<Pick<VendorComparisonModel, "name">>
): VendorComparisonUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

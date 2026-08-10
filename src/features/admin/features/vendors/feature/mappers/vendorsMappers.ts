import type { VendorsCreateDto, VendorsUpdateDto } from "../dto/vendorsDto";
import type { VendorsModel } from "../types/vendorsModel";

export { toVendorsModel } from "../../shared/mappers/vendorsMappers";

export function toVendorsCreateDto(
	model: Pick<VendorsModel, "name">
): VendorsCreateDto {
	return { name: model.name };
}

export function toVendorsUpdateDto(
	model: Partial<Pick<VendorsModel, "name">>
): VendorsUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

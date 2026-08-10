import type { InvoicesCreateDto, InvoicesUpdateDto } from "../dto/invoicesDto";
import type { InvoicesModel } from "../types/invoicesModel";

export { toInvoicesModel } from "../../shared/mappers/invoicesMappers";

export function toInvoicesCreateDto(
	model: Pick<InvoicesModel, "name">
): InvoicesCreateDto {
	return { name: model.name };
}

export function toInvoicesUpdateDto(
	model: Partial<Pick<InvoicesModel, "name">>
): InvoicesUpdateDto {
	return {
		...(model.name != null ? { name: model.name } : {}),
	};
}

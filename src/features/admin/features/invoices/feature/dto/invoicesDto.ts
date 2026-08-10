import type { ApiInvoicesRecordDto } from "../../shared/dto/invoicesRecordDto";

export type ApiInvoicesDto = ApiInvoicesRecordDto;

export type InvoicesCreateDto = {
	name: string;
};

export type InvoicesUpdateDto = Partial<InvoicesCreateDto>;

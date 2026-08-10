import type { ApiVendorsRecordDto } from "../../shared/dto/vendorsRecordDto";

export type ApiVendorsDto = ApiVendorsRecordDto;

export type VendorsCreateDto = {
	name: string;
};

export type VendorsUpdateDto = Partial<VendorsCreateDto>;

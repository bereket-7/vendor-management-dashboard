import type { ApiVendorComparisonRecordDto } from "../../shared/dto/vendorComparisonRecordDto";

export type ApiVendorComparisonDto = ApiVendorComparisonRecordDto;

export type VendorComparisonCreateDto = {
	name: string;
};

export type VendorComparisonUpdateDto = Partial<VendorComparisonCreateDto>;

import type { ApiPurchaseOrdersRecordDto } from "../../shared/dto/purchaseOrdersRecordDto";

export type ApiPurchaseOrdersDto = ApiPurchaseOrdersRecordDto;

export type PurchaseOrdersCreateDto = {
	name: string;
};

export type PurchaseOrdersUpdateDto = Partial<PurchaseOrdersCreateDto>;

export type PurchaseOrdersModel = {
	id: string;
	name: string;
};

export type PurchaseOrdersListResult = {
	items: PurchaseOrdersModel[];
	total: number;
};

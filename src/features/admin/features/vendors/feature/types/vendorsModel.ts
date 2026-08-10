export type VendorsModel = {
	id: string;
	name: string;
};

export type VendorsListResult = {
	items: VendorsModel[];
	total: number;
};

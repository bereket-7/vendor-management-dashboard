export type VendorComparisonModel = {
	id: string;
	name: string;
};

export type VendorComparisonListResult = {
	items: VendorComparisonModel[];
	total: number;
};

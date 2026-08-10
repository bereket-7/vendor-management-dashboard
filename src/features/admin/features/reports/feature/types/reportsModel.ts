export type ReportsModel = {
	id: string;
	name: string;
};

export type ReportsListResult = {
	items: ReportsModel[];
	total: number;
};

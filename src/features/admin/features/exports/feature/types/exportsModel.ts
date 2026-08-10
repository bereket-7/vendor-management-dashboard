export type ExportsModel = {
	id: string;
	name: string;
};

export type ExportsListResult = {
	items: ExportsModel[];
	total: number;
};

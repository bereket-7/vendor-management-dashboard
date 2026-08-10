export type SourcingModel = {
	id: string;
	name: string;
};

export type SourcingListResult = {
	items: SourcingModel[];
	total: number;
};

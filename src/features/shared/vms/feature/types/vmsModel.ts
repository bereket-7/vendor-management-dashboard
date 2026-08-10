export type VmsModel = {
	id: string;
	name: string;
};

export type VmsListResult = {
	items: VmsModel[];
	total: number;
};

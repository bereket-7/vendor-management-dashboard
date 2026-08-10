export type ProvidersModel = {
	id: string;
	name: string;
};

export type ProvidersListResult = {
	items: ProvidersModel[];
	total: number;
};

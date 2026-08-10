export type AutomationsModel = {
	id: string;
	name: string;
};

export type AutomationsListResult = {
	items: AutomationsModel[];
	total: number;
};

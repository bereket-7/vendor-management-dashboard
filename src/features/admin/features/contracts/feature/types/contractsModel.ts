export type ContractsModel = {
	id: string;
	name: string;
};

export type ContractsListResult = {
	items: ContractsModel[];
	total: number;
};

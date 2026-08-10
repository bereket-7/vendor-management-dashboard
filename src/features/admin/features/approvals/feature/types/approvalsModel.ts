export type ApprovalsModel = {
	id: string;
	name: string;
};

export type ApprovalsListResult = {
	items: ApprovalsModel[];
	total: number;
};

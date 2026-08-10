export type ErrorManagementModel = {
	id: string;
	name: string;
};

export type ErrorManagementListResult = {
	items: ErrorManagementModel[];
	total: number;
};

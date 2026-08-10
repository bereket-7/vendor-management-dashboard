export type InvoicesModel = {
	id: string;
	name: string;
};

export type InvoicesListResult = {
	items: InvoicesModel[];
	total: number;
};

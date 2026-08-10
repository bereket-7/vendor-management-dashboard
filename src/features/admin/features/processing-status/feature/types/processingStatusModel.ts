export type ProcessingStatusModel = {
	id: string;
	name: string;
};

export type ProcessingStatusListResult = {
	items: ProcessingStatusModel[];
	total: number;
};

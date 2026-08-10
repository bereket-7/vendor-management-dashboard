export type ProcessingLogsModel = {
	id: string;
	name: string;
};

export type ProcessingLogsListResult = {
	items: ProcessingLogsModel[];
	total: number;
};

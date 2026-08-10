export type FileHistoryModel = {
	id: string;
	name: string;
};

export type FileHistoryListResult = {
	items: FileHistoryModel[];
	total: number;
};

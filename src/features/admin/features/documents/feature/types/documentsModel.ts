export type DocumentsModel = {
	id: string;
	name: string;
};

export type DocumentsListResult = {
	items: DocumentsModel[];
	total: number;
};

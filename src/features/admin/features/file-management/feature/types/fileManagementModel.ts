export type FileManagementModel = {
	id: string;
	name: string;
};

export type FileManagementListResult = {
	items: FileManagementModel[];
	total: number;
};

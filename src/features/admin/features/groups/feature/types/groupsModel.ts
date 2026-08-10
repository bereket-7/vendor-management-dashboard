export type GroupsModel = {
	id: string;
	name: string;
};

export type GroupsListResult = {
	items: GroupsModel[];
	total: number;
};

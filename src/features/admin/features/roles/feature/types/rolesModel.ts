export type RolesModel = {
	id: string;
	name: string;
};

export type RolesListResult = {
	items: RolesModel[];
	total: number;
};

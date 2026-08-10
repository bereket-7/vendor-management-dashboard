export type CategoriesModel = {
	id: string;
	name: string;
};

export type CategoriesListResult = {
	items: CategoriesModel[];
	total: number;
};

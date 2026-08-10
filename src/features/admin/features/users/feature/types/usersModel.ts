export type UsersModel = {
	id: string;
	name: string;
};

export type UsersListResult = {
	items: UsersModel[];
	total: number;
};

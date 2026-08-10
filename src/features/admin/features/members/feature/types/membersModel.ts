export type MembersModel = {
	id: string;
	name: string;
};

export type MembersListResult = {
	items: MembersModel[];
	total: number;
};

export type ActivityModel = {
	id: string;
	name: string;
};

export type ActivityListResult = {
	items: ActivityModel[];
	total: number;
};

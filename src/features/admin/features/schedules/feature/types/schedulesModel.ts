export type SchedulesModel = {
	id: string;
	name: string;
};

export type SchedulesListResult = {
	items: SchedulesModel[];
	total: number;
};

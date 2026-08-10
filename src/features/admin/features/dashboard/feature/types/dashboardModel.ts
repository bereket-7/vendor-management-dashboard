export type DashboardModel = {
	id: string;
	name: string;
};

export type DashboardListResult = {
	items: DashboardModel[];
	total: number;
};

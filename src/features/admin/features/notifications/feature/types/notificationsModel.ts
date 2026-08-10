export type NotificationsModel = {
	id: string;
	name: string;
};

export type NotificationsListResult = {
	items: NotificationsModel[];
	total: number;
};

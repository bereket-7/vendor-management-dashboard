export type SlaMonitoringModel = {
	id: string;
	name: string;
};

export type SlaMonitoringListResult = {
	items: SlaMonitoringModel[];
	total: number;
};

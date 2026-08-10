export type PerformanceModel = {
	id: string;
	name: string;
};

export type PerformanceListResult = {
	items: PerformanceModel[];
	total: number;
};

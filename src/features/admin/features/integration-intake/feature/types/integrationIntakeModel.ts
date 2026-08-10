export type IntegrationIntakeModel = {
	id: string;
	name: string;
};

export type IntegrationIntakeListResult = {
	items: IntegrationIntakeModel[];
	total: number;
};

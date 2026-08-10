export type ComplianceModel = {
	id: string;
	name: string;
};

export type ComplianceListResult = {
	items: ComplianceModel[];
	total: number;
};

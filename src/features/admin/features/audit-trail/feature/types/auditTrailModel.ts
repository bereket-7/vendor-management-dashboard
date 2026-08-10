export type AuditTrailModel = {
	id: string;
	name: string;
};

export type AuditTrailListResult = {
	items: AuditTrailModel[];
	total: number;
};

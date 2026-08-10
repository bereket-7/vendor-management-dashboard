export type RiskScoringModel = {
	id: string;
	name: string;
};

export type RiskScoringListResult = {
	items: RiskScoringModel[];
	total: number;
};

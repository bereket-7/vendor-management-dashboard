export type ClaimEncounterModel = {
	id: string;
	name: string;
};

export type ClaimEncounterListResult = {
	items: ClaimEncounterModel[];
	total: number;
};

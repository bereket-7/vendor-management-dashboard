export type SettingsModel = {
	id: string;
	name: string;
};

export type SettingsListResult = {
	items: SettingsModel[];
	total: number;
};

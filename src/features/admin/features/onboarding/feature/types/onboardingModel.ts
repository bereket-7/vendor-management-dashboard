export type OnboardingModel = {
	id: string;
	name: string;
};

export type OnboardingListResult = {
	items: OnboardingModel[];
	total: number;
};

export const BASELINE_HIOS_OPTIONS = [
	{ value: "31663", label: "Test Client(31663)" },
	{ value: "32542", label: "Test Client(32542)" },
	{ value: "35755", label: "Test Client(35755)" },
];

export const BASELINE_BENEFIT_YEARS = ["BY2025", "BY2024", "BY2023"];
export const BASELINE_QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export type BaselineMarketType = "non-merged" | "merged";

export type BaselineMetricId =
	| "enrollment-count"
	| "on-exchange-member-months"
	| "off-exchange-member-months"
	| "estimated-claims"
	| "collected-premium"
	| "annualized-premium"
	| "risk-score"
	| "hcrp-enrollees"
	| "hcrp-payment";

export type BaselineSegmentId =
	| "individual-catastrophic"
	| "individual-non-catastrophic"
	| "small-group";

export const BASELINE_METRICS: { id: BaselineMetricId; label: string }[] = [
	{ id: "enrollment-count", label: "Enrollment Count" },
	{
		id: "on-exchange-member-months",
		label: "Total Member Months for On-Exchange Policies",
	},
	{
		id: "off-exchange-member-months",
		label: "Total Member Months for Off-Exchange Policies",
	},
	{ id: "estimated-claims", label: "Estimated Claims Amount to Date" },
	{ id: "collected-premium", label: "Total Collected Premium Revenue" },
	{ id: "annualized-premium", label: "Total Annualized Premium Revenue" },
	{ id: "risk-score", label: "Risk Score Estimate" },
	{
		id: "hcrp-enrollees",
		label: "Number of Enrollees Expected to Have High Cost Risk Pools (HCRP)",
	},
	{
		id: "hcrp-payment",
		label: "Potential Estimated HCRP Payment for Market",
	},
];

export const BASELINE_SEGMENTS: { id: BaselineSegmentId; label: string }[] = [
	{
		id: "individual-catastrophic",
		label: "Individual - Catastrophic/Merged Market",
	},
	{ id: "individual-non-catastrophic", label: "Individual - Non Catastrophic" },
	{ id: "small-group", label: "Small Group" },
];

export type BaselineGridValues = Record<
	BaselineMetricId,
	Record<BaselineSegmentId, string>
>;

export function emptyBaselineGrid(): BaselineGridValues {
	return BASELINE_METRICS.reduce(
		(metrics, metric) => ({
			...metrics,
			[metric.id]: BASELINE_SEGMENTS.reduce(
				(segments, segment) => ({
					...segments,
					[segment.id]: "",
				}),
				{} as Record<BaselineSegmentId, string>
			),
		}),
		{} as BaselineGridValues
	);
}

export type SavedBaselineRecord = {
	id: string;
	hiosId: string;
	hiosLabel: string;
	benefitYear: string;
	quarter: string;
	marketType: BaselineMarketType;
	updatedAt: string;
	values: BaselineGridValues;
};

export const SAVED_BASELINE_RECORDS: SavedBaselineRecord[] = [
	{
		id: "baseline-1",
		hiosId: "31663",
		hiosLabel: "Test Client(31663)",
		benefitYear: "BY2024",
		quarter: "Q1",
		marketType: "non-merged",
		updatedAt: "2025-03-10",
		values: {
			"enrollment-count": {
				"individual-catastrophic": "12450",
				"individual-non-catastrophic": "8420",
				"small-group": "3180",
			},
			"on-exchange-member-months": {
				"individual-catastrophic": "37200",
				"individual-non-catastrophic": "25180",
				"small-group": "9540",
			},
			"off-exchange-member-months": {
				"individual-catastrophic": "11840",
				"individual-non-catastrophic": "7920",
				"small-group": "2100",
			},
			"estimated-claims": {
				"individual-catastrophic": "18450000",
				"individual-non-catastrophic": "12640000",
				"small-group": "4820000",
			},
			"collected-premium": {
				"individual-catastrophic": "5120000",
				"individual-non-catastrophic": "3480000",
				"small-group": "1290000",
			},
			"annualized-premium": {
				"individual-catastrophic": "6144000",
				"individual-non-catastrophic": "4176000",
				"small-group": "1548000",
			},
			"risk-score": {
				"individual-catastrophic": "1.04",
				"individual-non-catastrophic": "0.98",
				"small-group": "1.01",
			},
			"hcrp-enrollees": {
				"individual-catastrophic": "42",
				"individual-non-catastrophic": "28",
				"small-group": "11",
			},
			"hcrp-payment": {
				"individual-catastrophic": "820000",
				"individual-non-catastrophic": "540000",
				"small-group": "210000",
			},
		},
	},
];

export function isNumericBaselineInput(value: string) {
	return value === "" || /^\d*\.?\d*$/.test(value);
}

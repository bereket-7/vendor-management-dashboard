export type MeasureStatus = "Active" | "Retired";

export type MeasureListItem = {
	id: string;
	name: string;
	measureSet: string;
	domain: string;
	eligiblePopulation: string;
	status: MeasureStatus;
	complianceRate: number;
	vsPriorYear: number;
	lastCalculated: string;
};

export const MEASURE_LIBRARY_FILTERS = {
	measurementYears: [
		"MY 2025 (Jan 1 - Dec 31, 2025)",
		"MY 2024 (Jan 1 - Dec 31, 2024)",
	],
	plans: ["All Plans", "Commercial HMO", "Medicare Advantage", "Medicaid"],
	linesOfBusiness: ["All", "Commercial", "Medicare", "Medicaid"],
	measureSets: ["HEDIS", "CMS Stars", "Custom"],
	measureStatuses: ["All", "Active", "Retired"],
};

export const MEASURE_LIBRARY_ROWS: MeasureListItem[] = [
	{
		id: "CBP",
		name: "Controlling High Blood Pressure",
		measureSet: "HEDIS",
		domain: "Effectiveness of Care",
		eligiblePopulation: "18-85 years",
		status: "Active",
		complianceRate: 77.8,
		vsPriorYear: 7.2,
		lastCalculated: "Jul 30, 2025",
	},
	{
		id: "FUA",
		name: "Follow-Up After ED Visit for Mental Illness",
		measureSet: "HEDIS",
		domain: "Behavioral Health",
		eligiblePopulation: "6+ years",
		status: "Active",
		complianceRate: 81.4,
		vsPriorYear: 3.8,
		lastCalculated: "Jul 30, 2025",
	},
	{
		id: "A1C",
		name: "Diabetes: HbA1c Poor Control",
		measureSet: "HEDIS",
		domain: "Effectiveness of Care",
		eligiblePopulation: "18-75 years",
		status: "Active",
		complianceRate: 76.8,
		vsPriorYear: 2.1,
		lastCalculated: "Jul 30, 2025",
	},
	{
		id: "BCS",
		name: "Breast Cancer Screening",
		measureSet: "HEDIS",
		domain: "Preventive Care",
		eligiblePopulation: "50-74 years",
		status: "Active",
		complianceRate: 63.3,
		vsPriorYear: -1.4,
		lastCalculated: "Jul 29, 2025",
	},
	{
		id: "COL",
		name: "Colorectal Cancer Screening",
		measureSet: "HEDIS",
		domain: "Preventive Care",
		eligiblePopulation: "50-75 years",
		status: "Active",
		complianceRate: 52.7,
		vsPriorYear: -2.8,
		lastCalculated: "Jul 29, 2025",
	},
	{
		id: "PPC",
		name: "Prenatal and Postpartum Care",
		measureSet: "HEDIS",
		domain: "Effectiveness of Care",
		eligiblePopulation: "Deliveries",
		status: "Active",
		complianceRate: 84.2,
		vsPriorYear: 4.5,
		lastCalculated: "Jul 28, 2025",
	},
	{
		id: "WCC",
		name: "Weight Assessment and Counseling for Nutrition and Physical Activity",
		measureSet: "HEDIS",
		domain: "Preventive Care",
		eligiblePopulation: "3-21 years",
		status: "Active",
		complianceRate: 58.6,
		vsPriorYear: 1.2,
		lastCalculated: "Jul 28, 2025",
	},
	{
		id: "HBD",
		name: "Hemoglobin A1c Control for Patients with Diabetes",
		measureSet: "HEDIS",
		domain: "Effectiveness of Care",
		eligiblePopulation: "18-75 years",
		status: "Active",
		complianceRate: 71.9,
		vsPriorYear: 5.6,
		lastCalculated: "Jul 27, 2025",
	},
	{
		id: "CDC",
		name: "Comprehensive Diabetes Care",
		measureSet: "HEDIS",
		domain: "Effectiveness of Care",
		eligiblePopulation: "18-75 years",
		status: "Active",
		complianceRate: 68.4,
		vsPriorYear: 0.9,
		lastCalculated: "Jul 27, 2025",
	},
	{
		id: "AMR",
		name: "Asthma Medication Ratio",
		measureSet: "HEDIS",
		domain: "Care Coordination",
		eligiblePopulation: "5-64 years",
		status: "Active",
		complianceRate: 74.1,
		vsPriorYear: 6.3,
		lastCalculated: "Jul 26, 2025",
	},
	{
		id: "GSD",
		name: "Glucose Screening for Patients with Schizophrenia",
		measureSet: "HEDIS",
		domain: "Behavioral Health",
		eligiblePopulation: "18-64 years",
		status: "Retired",
		complianceRate: 62.0,
		vsPriorYear: 0,
		lastCalculated: "Dec 15, 2024",
	},
];

export type MeasureDetail = {
	id: string;
	ncqaMeasureId: string;
	name: string;
	measureSet: string;
	domain: string;
	subdomain: string;
	steward: string;
	owner: string;
	lastUpdated: string;
	description: string;
	ageRange: string;
	measurementYear: string;
	reportingPlans: string;
	lineOfBusiness: string;
	eligiblePopulation: string;
	dataSources: string;
	careSetting: string;
	collectionMethod: string;
	calculationMethod: string;
	inverseMeasure: string;
	higherRateIsBetter: string;
	status: MeasureStatus;
	reportingStatus: string;
	complianceRate: number;
	planGoal: number;
	varianceToGoal: number;
	lastCalculated: string;
	nextRefresh: string;
	frequency: string;
	createdBy: string;
	createdOn: string;
	lastUpdatedBy: string;
	performanceSummary: {
		eligiblePopulation: number;
		denominator: number;
		numerator: number;
		exclusions: number;
		complianceRate: number;
		openGaps: number;
		closedGaps: number;
	};
	recentActivity: {
		id: string;
		activity: string;
		user: string;
		dateTime: string;
		details: string;
	}[];
	relatedMeasures: {
		id: string;
		name: string;
		relationship: string;
	}[];
	documents: {
		id: string;
		name: string;
		type: string;
		updated: string;
	}[];
	notes: string;
};

export const CBP_MEASURE_DETAIL: MeasureDetail = {
	id: "CBP",
	ncqaMeasureId: "CBP",
	name: "Controlling High Blood Pressure",
	measureSet: "HEDIS",
	domain: "Effectiveness of Care",
	subdomain: "Preventive Care",
	steward: "Quality Management",
	owner: "Quality Team",
	lastUpdated: "Jul 30, 2025 02:15 PM",
	description:
		"Percentage of members 18-85 years of age who had a diagnosis of hypertension and whose blood pressure (BP) was adequately controlled (<140/90 mm Hg) during the measurement year.",
	ageRange: "18-85 years",
	measurementYear: "MY 2025",
	reportingPlans: "All Plans",
	lineOfBusiness: "Commercial, Medicare, Medicaid",
	eligiblePopulation: "Members 18-85 with hypertension diagnosis",
	dataSources: "Claims, EHR, Lab Results",
	careSetting: "Outpatient, Inpatient",
	collectionMethod: "Administrative",
	calculationMethod: "Standard HEDIS Rate",
	inverseMeasure: "No",
	higherRateIsBetter: "Yes",
	status: "Active",
	reportingStatus: "In Progress",
	complianceRate: 77.8,
	planGoal: 80.0,
	varianceToGoal: -2.2,
	lastCalculated: "Jul 30, 2025 02:15 PM",
	nextRefresh: "Aug 30, 2025",
	frequency: "Monthly",
	createdBy: "System Admin",
	createdOn: "Jan 15, 2024",
	lastUpdatedBy: "Quality Analyst",
	performanceSummary: {
		eligiblePopulation: 24_562,
		denominator: 19_112,
		numerator: 14_869,
		exclusions: 1_203,
		complianceRate: 77.8,
		openGaps: 5_450,
		closedGaps: 8_238,
	},
	recentActivity: [
		{
			id: "a1",
			activity: "Measure Recalculated",
			user: "System",
			dateTime: "Jul 30, 2025 02:15 PM",
			details: "Monthly refresh completed",
		},
		{
			id: "a2",
			activity: "Specification Updated",
			user: "Quality Analyst",
			dateTime: "Jul 15, 2025 10:30 AM",
			details: "MY 2025 spec applied",
		},
		{
			id: "a3",
			activity: "Gap Export Generated",
			user: "Care Manager",
			dateTime: "Jul 10, 2025 04:45 PM",
			details: "5,450 open gaps exported",
		},
	],
	relatedMeasures: [
		{ id: "FUA", name: "Follow-Up After ED Visit", relationship: "Related" },
		{
			id: "A1C",
			name: "Diabetes: HbA1c Poor Control",
			relationship: "Related Condition",
		},
		{
			id: "PPC",
			name: "Prenatal and Postpartum Care",
			relationship: "Complementary",
		},
		{
			id: "WCC",
			name: "Weight Assessment and Counseling",
			relationship: "Related",
		},
		{
			id: "HBD",
			name: "Hemoglobin A1c Control",
			relationship: "Related Condition",
		},
	],
	documents: [
		{
			id: "d1",
			name: "CBP Measure Specifications MY 2025",
			type: "Specifications",
			updated: "Jul 15, 2025",
		},
		{
			id: "d2",
			name: "CBP Technical Notes",
			type: "Technical Notes",
			updated: "Jun 1, 2025",
		},
		{
			id: "d3",
			name: "CBP Provider Tips",
			type: "Provider Tips",
			updated: "May 15, 2025",
		},
	],
	notes:
		"Members with documented hypertension must have at least one BP reading during the measurement year. Readings from acute inpatient stays are excluded. Telehealth visits are included per NCQA MY 2025 guidance.",
};

export const MEASURE_DETAILS: Record<string, MeasureDetail> = {
	CBP: CBP_MEASURE_DETAIL,
};

export function getMeasureDetail(measureId: string): MeasureDetail | undefined {
	const existing = MEASURE_DETAILS[measureId];
	if (existing) return existing;

	const listItem = MEASURE_LIBRARY_ROWS.find((m) => m.id === measureId);
	if (!listItem) return undefined;

	const base = CBP_MEASURE_DETAIL;
	return {
		...base,
		id: listItem.id,
		ncqaMeasureId: listItem.id,
		name: listItem.name,
		domain: listItem.domain,
		eligiblePopulation: listItem.eligiblePopulation,
		status: listItem.status,
		complianceRate: listItem.complianceRate,
		lastCalculated: `${listItem.lastCalculated} 02:15 PM`,
		lastUpdated: `${listItem.lastCalculated} 02:15 PM`,
		performanceSummary: {
			eligiblePopulation: 18_000,
			denominator: 14_500,
			numerator: Math.round(14_500 * (listItem.complianceRate / 100)),
			exclusions: 890,
			complianceRate: listItem.complianceRate,
			openGaps: 3_200,
			closedGaps: 6_100,
		},
	};
}

export const MEASURE_DETAIL_TABS = [
	"Overview",
	"Specifications",
	"Eligible Population",
	"Denominator",
	"Numerator",
	"Exclusions",
	"Performance",
	"Members",
	"Providers",
	"Gap Closure",
	"Documents",
	"History",
] as const;

export type MeasureDetailTab = (typeof MEASURE_DETAIL_TABS)[number];

export type MeasureSpecifications = {
	measureDescription: string;
	measureSteward: string;
	numeratorStatement: string;
	denominatorStatement: string;
	eligiblePopulation: string;
	measurementYear: string;
	lookBackPeriod: string;
	continuousEnrollment: string;
	dataSources: string;
	careSetting: string;
	collectionMethod: string;
	calculationMethod: string;
	inverseMeasure: string;
	higherRateIsBetter: string;
	stratifications: string;
	measureType: string;
	ncqaReporting: string;
	clinicalFocus: string;
	keyDefinitions: { term: string; definition: string }[];
	valueSets: { type: string; codeSetName: string; version: string }[];
	references: { label: string; href: string }[];
};

export type MeasureEligiblePopulationDetail = {
	definition: string;
	inclusionCriteria: string[];
	dataSources: string[];
	continuousEnrollment: string;
	lookBackPeriod: string;
	ageCalculation: string;
	summaryAsOf: string;
	summary: {
		totalEligiblePopulation: number;
		commercial: number;
		medicaid: number;
		medicare: number;
		totalPlans: number;
		totalGroups: number;
	};
	trend: {
		month: string;
		commercial: number;
		medicaid: number;
		medicare: number;
		total: number;
	}[];
	plans: {
		id: string;
		name: string;
		lineOfBusiness: string;
		totalEligible: number;
		commercial: number;
		medicaid: number;
		medicare: number;
		pctOfTotal: number;
		lastRefresh: string;
	}[];
	totalPlanEntries: number;
};

export const CBP_SPECIFICATIONS: MeasureSpecifications = {
	measureDescription:
		"Percentage of members 18-85 years of age who had a diagnosis of hypertension (HTN) and whose blood pressure (BP) was adequately controlled (<140/90 mm Hg) during the measurement year.",
	measureSteward: "Quality Management",
	numeratorStatement:
		"Members whose most recent BP reading during the measurement year was adequately controlled (systolic <140 mm Hg and diastolic <90 mm Hg).",
	denominatorStatement:
		"Members 18-85 years of age as of December 31 of the measurement year who had a diagnosis of hypertension during the measurement year or the year prior to the measurement year.",
	eligiblePopulation: "Members 18-85 years of age.",
	measurementYear: "MY 2025 (Jan 1 – Dec 31, 2025)",
	lookBackPeriod: "12 months",
	continuousEnrollment:
		"Members must be continuously enrolled for 11 months during the measurement year.",
	dataSources: "Medical Claims, Encounters, Pharmacy Claims",
	careSetting: "Ambulatory",
	collectionMethod: "Administrative Data",
	calculationMethod: "HEDIS 2025 Volume 2",
	inverseMeasure: "No",
	higherRateIsBetter: "Yes",
	stratifications: "Age, Gender, Plan",
	measureType: "Process",
	ncqaReporting: "Required",
	clinicalFocus: "Cardiovascular Health",
	keyDefinitions: [
		{
			term: "Hypertension (HTN)",
			definition: "ICD-10 diagnosis of hypertension.",
		},
		{
			term: "BP Reading",
			definition: "Systolic <140 mm Hg AND Diastolic <90 mm Hg.",
		},
		{
			term: "Most Recent BP",
			definition: "Most recent BP reading in the measurement year.",
		},
	],
	valueSets: [
		{
			type: "Diagnosis (ICD-10)",
			codeSetName: "Hypertension (HTN)",
			version: "v2025",
		},
		{
			type: "Procedure (CPT)",
			codeSetName: "Blood Pressure Measurement",
			version: "v2025",
		},
		{ type: "LOINC", codeSetName: "Blood Pressure", version: "v2025" },
	],
	references: [
		{ label: "HEDIS 2025 Volume 2: CBP", href: "#" },
		{ label: "NCQA Measure Specification – CBP", href: "#" },
		{ label: "CMS HEDIS Technical Notes", href: "#" },
	],
};

export const CBP_ELIGIBLE_POPULATION: MeasureEligiblePopulationDetail = {
	definition: "Members who are 18-85 years of age during the measurement year.",
	inclusionCriteria: [
		"Members must be 18 years of age by December 31 of the measurement year.",
		"Members must be 85 years of age on or after January 1 of the measurement year.",
	],
	dataSources: [
		"Medical Claims",
		"Encounters",
		"Pharmacy Claims",
		"Member Eligibility",
	],
	continuousEnrollment: "Not required for eligible population.",
	lookBackPeriod: "None",
	ageCalculation:
		"Age is calculated as of December 31 of the measurement year.",
	summaryAsOf: "Jul 30, 2025 02:15 PM",
	summary: {
		totalEligiblePopulation: 24_562,
		commercial: 12_458,
		medicaid: 7_842,
		medicare: 4_262,
		totalPlans: 28,
		totalGroups: 156,
	},
	trend: [
		{
			month: "Jan 2025",
			commercial: 12_102,
			medicaid: 7_612,
			medicare: 4_118,
			total: 23_832,
		},
		{
			month: "Feb 2025",
			commercial: 12_186,
			medicaid: 7_658,
			medicare: 4_142,
			total: 23_986,
		},
		{
			month: "Mar 2025",
			commercial: 12_248,
			medicaid: 7_702,
			medicare: 4_168,
			total: 24_118,
		},
		{
			month: "Apr 2025",
			commercial: 12_312,
			medicaid: 7_748,
			medicare: 4_198,
			total: 24_258,
		},
		{
			month: "May 2025",
			commercial: 12_384,
			medicaid: 7_792,
			medicare: 4_228,
			total: 24_404,
		},
		{
			month: "Jun 2025",
			commercial: 12_458,
			medicaid: 7_842,
			medicare: 4_262,
			total: 24_562,
		},
	],
	plans: [
		{
			id: "PLAN-001",
			name: "Commercial PPO",
			lineOfBusiness: "Commercial",
			totalEligible: 4_842,
			commercial: 4_842,
			medicaid: 0,
			medicare: 0,
			pctOfTotal: 19.7,
			lastRefresh: "Jul 30, 2025",
		},
		{
			id: "PLAN-002",
			name: "Commercial HMO",
			lineOfBusiness: "Commercial",
			totalEligible: 3_916,
			commercial: 3_916,
			medicaid: 0,
			medicare: 0,
			pctOfTotal: 15.9,
			lastRefresh: "Jul 30, 2025",
		},
		{
			id: "PLAN-003",
			name: "Medicaid Managed Care",
			lineOfBusiness: "Medicaid",
			totalEligible: 3_248,
			commercial: 0,
			medicaid: 3_248,
			medicare: 0,
			pctOfTotal: 13.2,
			lastRefresh: "Jul 30, 2025",
		},
		{
			id: "PLAN-004",
			name: "Medicare Advantage",
			lineOfBusiness: "Medicare",
			totalEligible: 2_862,
			commercial: 0,
			medicaid: 0,
			medicare: 2_862,
			pctOfTotal: 11.7,
			lastRefresh: "Jul 29, 2025",
		},
		{
			id: "PLAN-005",
			name: "Medicaid CHIP",
			lineOfBusiness: "Medicaid",
			totalEligible: 2_486,
			commercial: 0,
			medicaid: 2_486,
			medicare: 0,
			pctOfTotal: 10.1,
			lastRefresh: "Jul 29, 2025",
		},
		{
			id: "PLAN-006",
			name: "Commercial POS",
			lineOfBusiness: "Commercial",
			totalEligible: 2_124,
			commercial: 2_124,
			medicaid: 0,
			medicare: 0,
			pctOfTotal: 8.6,
			lastRefresh: "Jul 28, 2025",
		},
	],
	totalPlanEntries: 28,
};

export type MeasureDenominatorDetail = {
	definition: string;
	criteria: string;
	dataSources: string[];
	lookBackPeriod: string;
	ageCalculation: string;
	continuousEnrollment: string;
	summaryAsOf: string;
	summary: {
		totalDenominator: number;
		commercial: number;
		medicaid: number;
		medicare: number;
		totalPlans: number;
		totalGroups: number;
	};
	trend: {
		month: string;
		commercial: number;
		medicaid: number;
		medicare: number;
		total: number;
	}[];
	plans: {
		id: string;
		name: string;
		lineOfBusiness: string;
		totalDenominator: number;
		commercial: number;
		medicaid: number;
		medicare: number;
		pctOfTotal: number;
		lastRefresh: string;
	}[];
	totalPlanEntries: number;
};

export const CBP_DENOMINATOR: MeasureDenominatorDetail = {
	definition:
		"Members 18-85 years of age who had a diagnosis of hypertension (HTN) during the measurement year.",
	criteria:
		"Member had at least one diagnosis of hypertension (HTN) during the measurement year.",
	dataSources: [
		"Medical Claims (Professional and Institutional)",
		"Encounters",
		"Pharmacy Claims (if applicable)",
		"Member Eligibility",
	],
	lookBackPeriod: "None",
	ageCalculation:
		"Age is calculated as of December 31 of the measurement year.",
	continuousEnrollment: "Not required for denominator.",
	summaryAsOf: "Jul 30, 2025 02:15 PM",
	summary: {
		totalDenominator: 19_112,
		commercial: 9_642,
		medicaid: 5_812,
		medicare: 3_658,
		totalPlans: 28,
		totalGroups: 156,
	},
	trend: [
		{
			month: "Jan 2025",
			commercial: 9_412,
			medicaid: 5_668,
			medicare: 3_570,
			total: 18_650,
		},
		{
			month: "Feb 2025",
			commercial: 9_478,
			medicaid: 5_712,
			medicare: 3_590,
			total: 18_780,
		},
		{
			month: "Mar 2025",
			commercial: 9_532,
			medicaid: 5_748,
			medicare: 3_610,
			total: 18_890,
		},
		{
			month: "Apr 2025",
			commercial: 9_578,
			medicaid: 5_772,
			medicare: 3_630,
			total: 18_980,
		},
		{
			month: "May 2025",
			commercial: 9_612,
			medicaid: 5_792,
			medicare: 3_646,
			total: 19_050,
		},
		{
			month: "Jun 2025",
			commercial: 9_642,
			medicaid: 5_812,
			medicare: 3_658,
			total: 19_112,
		},
	],
	plans: [
		{
			id: "PLAN-001",
			name: "Commercial PPO",
			lineOfBusiness: "Commercial",
			totalDenominator: 4_156,
			commercial: 4_156,
			medicaid: 0,
			medicare: 0,
			pctOfTotal: 21.75,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-002",
			name: "Commercial HMO",
			lineOfBusiness: "Commercial",
			totalDenominator: 3_248,
			commercial: 3_248,
			medicaid: 0,
			medicare: 0,
			pctOfTotal: 17.0,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-003",
			name: "Medicaid Managed Care",
			lineOfBusiness: "Medicaid",
			totalDenominator: 5_812,
			commercial: 0,
			medicaid: 5_812,
			medicare: 0,
			pctOfTotal: 30.41,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-004",
			name: "Medicare Advantage HMO",
			lineOfBusiness: "Medicare",
			totalDenominator: 2_468,
			commercial: 0,
			medicaid: 0,
			medicare: 2_468,
			pctOfTotal: 12.92,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-005",
			name: "Medicaid CHIP",
			lineOfBusiness: "Medicaid",
			totalDenominator: 1_842,
			commercial: 0,
			medicaid: 1_842,
			medicare: 0,
			pctOfTotal: 9.64,
			lastRefresh: "Jul 29, 2025 02:15 PM",
		},
		{
			id: "PLAN-006",
			name: "Commercial POS",
			lineOfBusiness: "Commercial",
			totalDenominator: 1_586,
			commercial: 1_586,
			medicaid: 0,
			medicare: 0,
			pctOfTotal: 8.3,
			lastRefresh: "Jul 29, 2025 02:15 PM",
		},
	],
	totalPlanEntries: 28,
};

export type MeasureNumeratorDetail = {
	definition: string;
	criteria: string[];
	dataSources: string[];
	lookBackPeriod: string;
	ageCalculation: string;
	continuousEnrollment: string;
	summaryAsOf: string;
	summary: {
		totalNumerator: number;
		commercial: number;
		medicaid: number;
		medicare: number;
		totalPlans: number;
		totalGroups: number;
	};
	trend: {
		month: string;
		commercial: number;
		medicaid: number;
		medicare: number;
		total: number;
	}[];
	plans: {
		id: string;
		name: string;
		lineOfBusiness: string;
		totalNumerator: number;
		commercial: number;
		medicaid: number;
		medicare: number;
		pctOfDenominator: number;
		lastRefresh: string;
	}[];
	totalPlanEntries: number;
};

export const CBP_NUMERATOR: MeasureNumeratorDetail = {
	definition:
		"Members in the denominator who had a most recent blood pressure (BP) reading of <140/90 mm Hg during the measurement year.",
	criteria: [
		"Member must have at least one BP reading of <140/90 mm Hg during the measurement year.",
	],
	dataSources: [
		"Medical Claims (Professional and Institutional)",
		"Encounters",
		"Pharmacy Claims (if applicable)",
		"Member Eligibility",
	],
	lookBackPeriod: "None",
	ageCalculation:
		"Age is calculated as of December 31 of the measurement year.",
	continuousEnrollment: "Not required for numerator.",
	summaryAsOf: "Jul 30, 2025 02:15 PM",
	summary: {
		totalNumerator: 14_869,
		commercial: 7_842,
		medicaid: 4_620,
		medicare: 2_407,
		totalPlans: 28,
		totalGroups: 156,
	},
	trend: [
		{
			month: "Jan 2025",
			commercial: 7_318,
			medicaid: 4_308,
			medicare: 2_248,
			total: 14_512,
		},
		{
			month: "Feb 2025",
			commercial: 7_372,
			medicaid: 4_348,
			medicare: 2_264,
			total: 14_584,
		},
		{
			month: "Mar 2025",
			commercial: 7_418,
			medicaid: 4_382,
			medicare: 2_278,
			total: 14_652,
		},
		{
			month: "Apr 2025",
			commercial: 7_462,
			medicaid: 4_412,
			medicare: 2_292,
			total: 14_718,
		},
		{
			month: "May 2025",
			commercial: 7_698,
			medicaid: 4_538,
			medicare: 2_358,
			total: 14_794,
		},
		{
			month: "Jun 2025",
			commercial: 7_842,
			medicaid: 4_620,
			medicare: 2_407,
			total: 14_869,
		},
	],
	plans: [
		{
			id: "PLAN-001",
			name: "Commercial PPO",
			lineOfBusiness: "Commercial",
			totalNumerator: 2_839,
			commercial: 2_839,
			medicaid: 0,
			medicare: 0,
			pctOfDenominator: 68.32,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-002",
			name: "HMO Silver",
			lineOfBusiness: "Commercial",
			totalNumerator: 2_218,
			commercial: 2_218,
			medicaid: 0,
			medicare: 0,
			pctOfDenominator: 68.28,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-003",
			name: "Medicaid Managed Care",
			lineOfBusiness: "Medicaid",
			totalNumerator: 3_968,
			commercial: 0,
			medicaid: 3_968,
			medicare: 0,
			pctOfDenominator: 68.25,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-004",
			name: "Medicare Advantage HMO",
			lineOfBusiness: "Medicare",
			totalNumerator: 1_684,
			commercial: 0,
			medicaid: 0,
			medicare: 1_684,
			pctOfDenominator: 68.23,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-005",
			name: "Medicaid CHIP",
			lineOfBusiness: "Medicaid",
			totalNumerator: 1_256,
			commercial: 0,
			medicaid: 1_256,
			medicare: 0,
			pctOfDenominator: 68.18,
			lastRefresh: "Jul 29, 2025 02:15 PM",
		},
		{
			id: "PLAN-006",
			name: "Commercial POS",
			lineOfBusiness: "Commercial",
			totalNumerator: 1_082,
			commercial: 1_082,
			medicaid: 0,
			medicare: 0,
			pctOfDenominator: 68.22,
			lastRefresh: "Jul 29, 2025 02:15 PM",
		},
	],
	totalPlanEntries: 28,
};

export function getMeasureSpecifications(
	measureId: string
): MeasureSpecifications {
	if (measureId === "CBP") return CBP_SPECIFICATIONS;

	const detail = getMeasureDetail(measureId);
	return {
		...CBP_SPECIFICATIONS,
		measureDescription:
			detail?.description ?? CBP_SPECIFICATIONS.measureDescription,
		eligiblePopulation:
			detail?.eligiblePopulation ?? CBP_SPECIFICATIONS.eligiblePopulation,
		dataSources: detail?.dataSources ?? CBP_SPECIFICATIONS.dataSources,
		careSetting: detail?.careSetting ?? CBP_SPECIFICATIONS.careSetting,
		collectionMethod:
			detail?.collectionMethod ?? CBP_SPECIFICATIONS.collectionMethod,
		calculationMethod:
			detail?.calculationMethod ?? CBP_SPECIFICATIONS.calculationMethod,
		inverseMeasure: detail?.inverseMeasure ?? CBP_SPECIFICATIONS.inverseMeasure,
		higherRateIsBetter:
			detail?.higherRateIsBetter ?? CBP_SPECIFICATIONS.higherRateIsBetter,
		references: CBP_SPECIFICATIONS.references.map((ref) => ({
			...ref,
			label: ref.label.replace("CBP", measureId),
		})),
	};
}

export function getMeasureEligiblePopulation(
	measureId: string
): MeasureEligiblePopulationDetail {
	if (measureId === "CBP") return CBP_ELIGIBLE_POPULATION;

	const detail = getMeasureDetail(measureId);
	const total = detail?.performanceSummary.eligiblePopulation ?? 18_000;
	const commercial = Math.round(total * 0.51);
	const medicaid = Math.round(total * 0.32);
	const medicare = total - commercial - medicaid;

	return {
		...CBP_ELIGIBLE_POPULATION,
		definition:
			detail?.eligiblePopulation ?? CBP_ELIGIBLE_POPULATION.definition,
		summary: {
			totalEligiblePopulation: total,
			commercial,
			medicaid,
			medicare,
			totalPlans: 28,
			totalGroups: 156,
		},
		trend: CBP_ELIGIBLE_POPULATION.trend.map((row) => ({
			...row,
			commercial: Math.round(row.commercial * (commercial / 12_458)),
			medicaid: Math.round(row.medicaid * (medicaid / 7_842)),
			medicare: Math.round(row.medicare * (medicare / 4_262)),
			total: Math.round(row.total * (total / 24_562)),
		})),
		plans: CBP_ELIGIBLE_POPULATION.plans.map((plan, index) => ({
			...plan,
			id: `PLAN-00${index + 1}`,
			totalEligible: Math.round(plan.totalEligible * (total / 24_562)),
			commercial: Math.round(plan.commercial * (commercial / 12_458)),
			medicaid: Math.round(plan.medicaid * (medicaid / 7_842)),
			medicare: Math.round(plan.medicare * (medicare / 4_262)),
		})),
	};
}

export function getMeasureDenominator(
	measureId: string
): MeasureDenominatorDetail {
	if (measureId === "CBP") return CBP_DENOMINATOR;

	const detail = getMeasureDetail(measureId);
	const total = detail?.performanceSummary.denominator ?? 14_500;
	const commercial = Math.round(total * 0.505);
	const medicaid = Math.round(total * 0.304);
	const medicare = total - commercial - medicaid;

	return {
		...CBP_DENOMINATOR,
		definition: CBP_DENOMINATOR.definition,
		summary: {
			totalDenominator: total,
			commercial,
			medicaid,
			medicare,
			totalPlans: 28,
			totalGroups: 156,
		},
		trend: CBP_DENOMINATOR.trend.map((row) => ({
			...row,
			commercial: Math.round(row.commercial * (commercial / 9_642)),
			medicaid: Math.round(row.medicaid * (medicaid / 5_812)),
			medicare: Math.round(row.medicare * (medicare / 3_658)),
			total: Math.round(row.total * (total / 19_112)),
		})),
		plans: CBP_DENOMINATOR.plans.map((plan, index) => ({
			...plan,
			id: `PLAN-00${index + 1}`,
			totalDenominator: Math.round(plan.totalDenominator * (total / 19_112)),
			commercial: Math.round(plan.commercial * (commercial / 9_642)),
			medicaid: Math.round(plan.medicaid * (medicaid / 5_812)),
			medicare: Math.round(plan.medicare * (medicare / 3_658)),
		})),
	};
}

export function getMeasureNumerator(measureId: string): MeasureNumeratorDetail {
	if (measureId === "CBP") return CBP_NUMERATOR;

	const detail = getMeasureDetail(measureId);
	const total = detail?.performanceSummary.numerator ?? 11_000;
	const commercial = Math.round(total * 0.527);
	const medicaid = Math.round(total * 0.311);
	const medicare = total - commercial - medicaid;

	return {
		...CBP_NUMERATOR,
		summary: {
			totalNumerator: total,
			commercial,
			medicaid,
			medicare,
			totalPlans: 28,
			totalGroups: 156,
		},
		trend: CBP_NUMERATOR.trend.map((row) => ({
			...row,
			commercial: Math.round(row.commercial * (commercial / 7_842)),
			medicaid: Math.round(row.medicaid * (medicaid / 4_620)),
			medicare: Math.round(row.medicare * (medicare / 2_407)),
			total: Math.round(row.total * (total / 14_869)),
		})),
		plans: CBP_NUMERATOR.plans.map((plan, index) => ({
			...plan,
			id: `PLAN-00${index + 1}`,
			totalNumerator: Math.round(plan.totalNumerator * (total / 14_869)),
			commercial: Math.round(plan.commercial * (commercial / 7_842)),
			medicaid: Math.round(plan.medicaid * (medicaid / 4_620)),
			medicare: Math.round(plan.medicare * (medicare / 2_407)),
		})),
	};
}

export type MeasureExclusionsDetail = {
	intro: string;
	generalExclusionCriteria: string[];
	dataSources: string[];
	summaryAsOf: string;
	summary: {
		totalExclusions: number;
		commercial: number;
		medicaid: number;
		medicare: number;
		totalPlans: number;
		totalGroups: number;
	};
	byReason: {
		reason: string;
		commercial: number;
		medicaid: number;
		medicare: number;
		total: number;
		pctOfTotal: number;
	}[];
	plans: {
		id: string;
		name: string;
		lineOfBusiness: string;
		totalExclusions: number;
		commercial: number;
		medicaid: number;
		medicare: number;
		pctOfDenominator: number;
		lastRefresh: string;
	}[];
	totalPlanEntries: number;
};

export type MeasurePerformanceDetail = {
	summaryAsOf: string;
	summary: {
		numerator: number;
		denominator: number;
		exclusions: number;
		performanceRate: number;
		priorYearRate: number;
		change: number;
		goal: number;
		status: string;
		statusTone: "near" | "met" | "below";
	};
	trend: { month: string; rate: number }[];
	byPlan: {
		planName: string;
		lineOfBusiness: string;
		numerator: number;
		denominator: number;
		rate: number | null;
		priorYearRate: number | null;
		change: number | null;
	}[];
	byPopulationGroup: {
		group: string;
		numerator: number;
		denominator: number;
		rate: number;
		priorYearRate: number;
		change: number;
	}[];
	historicalTrend: {
		year: string;
		numerator: number;
		denominator: number;
		exclusions: number;
		performanceRate: number;
	}[];
	notes: string[];
};

export const CBP_EXCLUSIONS: MeasureExclusionsDetail = {
	intro:
		"Members in the denominator who meet any of the following exclusion criteria are removed from the measure calculation.",
	generalExclusionCriteria: [
		"Members in hospice at any time during the measurement year.",
		"Members who elect to use hospice benefit at any time during the measurement year.",
		"Members who die during the measurement year.",
		"Members not continuously enrolled for 11 months during the measurement year.",
		"Members with end-stage renal disease (ESRD) any time during the measurement year.",
		"Members with pregnancy during the measurement year.",
		"Members 66 years of age and older as of December 31 of the measurement year.",
	],
	dataSources: [
		"Claims (Medical and Pharmacy)",
		"Encounter Data",
		"Enrollment Data",
		"Member Eligibility Data",
		"Provider Data",
	],
	summaryAsOf: "Jul 30, 2025 02:15 PM",
	summary: {
		totalExclusions: 1_203,
		commercial: 612,
		medicaid: 412,
		medicare: 179,
		totalPlans: 28,
		totalGroups: 156,
	},
	byReason: [
		{
			reason: "Hospice (Anytime)",
			commercial: 142,
			medicaid: 98,
			medicare: 42,
			total: 282,
			pctOfTotal: 23.44,
		},
		{
			reason: "Hospice Election",
			commercial: 86,
			medicaid: 62,
			medicare: 28,
			total: 176,
			pctOfTotal: 14.63,
		},
		{
			reason: "Death",
			commercial: 124,
			medicaid: 88,
			medicare: 36,
			total: 248,
			pctOfTotal: 20.62,
		},
		{
			reason: "Not Continuously Enrolled (11 Months)",
			commercial: 98,
			medicaid: 72,
			medicare: 24,
			total: 194,
			pctOfTotal: 16.13,
		},
		{
			reason: "End-Stage Renal Disease (ESRD)",
			commercial: 52,
			medicaid: 38,
			medicare: 18,
			total: 108,
			pctOfTotal: 8.98,
		},
		{
			reason: "Pregnancy",
			commercial: 68,
			medicaid: 34,
			medicare: 12,
			total: 114,
			pctOfTotal: 9.48,
		},
		{
			reason: "Age 66+ as of Dec 31",
			commercial: 42,
			medicaid: 20,
			medicare: 19,
			total: 81,
			pctOfTotal: 6.73,
		},
	],
	plans: [
		{
			id: "PLAN-001",
			name: "Commercial PPO",
			lineOfBusiness: "Commercial",
			totalExclusions: 96,
			commercial: 96,
			medicaid: 0,
			medicare: 0,
			pctOfDenominator: 0.88,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-002",
			name: "HMO Silver",
			lineOfBusiness: "Commercial",
			totalExclusions: 78,
			commercial: 78,
			medicaid: 0,
			medicare: 0,
			pctOfDenominator: 0.72,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-003",
			name: "Medicaid Managed Care",
			lineOfBusiness: "Medicaid",
			totalExclusions: 412,
			commercial: 0,
			medicaid: 412,
			medicare: 0,
			pctOfDenominator: 5.26,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-004",
			name: "Medicare Advantage HMO",
			lineOfBusiness: "Medicare",
			totalExclusions: 179,
			commercial: 0,
			medicaid: 0,
			medicare: 179,
			pctOfDenominator: 4.31,
			lastRefresh: "Jul 30, 2025 02:15 PM",
		},
		{
			id: "PLAN-005",
			name: "Dual Eligible SNP",
			lineOfBusiness: "Medicare",
			totalExclusions: 142,
			commercial: 0,
			medicaid: 0,
			medicare: 142,
			pctOfDenominator: 3.42,
			lastRefresh: "Jul 29, 2025 02:15 PM",
		},
		{
			id: "PLAN-006",
			name: "Commercial POS",
			lineOfBusiness: "Commercial",
			totalExclusions: 68,
			commercial: 68,
			medicaid: 0,
			medicare: 0,
			pctOfDenominator: 0.62,
			lastRefresh: "Jul 29, 2025 02:15 PM",
		},
	],
	totalPlanEntries: 28,
};

export const CBP_PERFORMANCE: MeasurePerformanceDetail = {
	summaryAsOf: "Jul 30, 2025 02:15 PM",
	summary: {
		numerator: 14_869,
		denominator: 19_112,
		exclusions: 1_203,
		performanceRate: 77.81,
		priorYearRate: 76.35,
		change: 1.46,
		goal: 80.0,
		status: "Near Goal",
		statusTone: "near",
	},
	trend: [
		{ month: "Jan 2025", rate: 74.12 },
		{ month: "Feb 2025", rate: 75.08 },
		{ month: "Mar 2025", rate: 75.92 },
		{ month: "Apr 2025", rate: 76.85 },
		{ month: "May 2025", rate: 77.34 },
		{ month: "Jun 2025", rate: 77.81 },
	],
	byPlan: [
		{
			planName: "Commercial PPO",
			lineOfBusiness: "Commercial",
			numerator: 2_839,
			denominator: 3_624,
			rate: 78.35,
			priorYearRate: 76.91,
			change: 1.44,
		},
		{
			planName: "HMO Silver",
			lineOfBusiness: "Commercial",
			numerator: 2_218,
			denominator: 2_872,
			rate: 77.21,
			priorYearRate: 75.32,
			change: 1.89,
		},
		{
			planName: "Medicaid Managed Care",
			lineOfBusiness: "Medicaid",
			numerator: 3_968,
			denominator: 5_288,
			rate: 75.03,
			priorYearRate: 73.12,
			change: 1.91,
		},
		{
			planName: "Medicare Advantage HMO",
			lineOfBusiness: "Medicare",
			numerator: 1_684,
			denominator: 2_168,
			rate: 77.61,
			priorYearRate: 78.05,
			change: -0.44,
		},
		{
			planName: "Dual Eligible SNP",
			lineOfBusiness: "Medicare",
			numerator: 892,
			denominator: 1_212,
			rate: 73.55,
			priorYearRate: 72.11,
			change: 1.44,
		},
		{
			planName: "Medicare Advantage PPO",
			lineOfBusiness: "Medicare",
			numerator: 0,
			denominator: 0,
			rate: null,
			priorYearRate: null,
			change: null,
		},
	],
	byPopulationGroup: [
		{
			group: "Age 18-34",
			numerator: 842,
			denominator: 1_210,
			rate: 69.57,
			priorYearRate: 68.12,
			change: 1.45,
		},
		{
			group: "Age 35-44",
			numerator: 1_624,
			denominator: 2_030,
			rate: 80.02,
			priorYearRate: 78.45,
			change: 1.57,
		},
		{
			group: "Age 45-54",
			numerator: 2_486,
			denominator: 3_162,
			rate: 78.67,
			priorYearRate: 76.68,
			change: 1.99,
		},
		{
			group: "Age 55-64",
			numerator: 3_842,
			denominator: 4_772,
			rate: 80.48,
			priorYearRate: 79.12,
			change: 1.36,
		},
		{
			group: "Age 65-85",
			numerator: 6_075,
			denominator: 7_968,
			rate: 76.24,
			priorYearRate: 74.31,
			change: 1.93,
		},
	],
	historicalTrend: [
		{
			year: "MY 2021",
			numerator: 11_842,
			denominator: 16_604,
			exclusions: 982,
			performanceRate: 71.33,
		},
		{
			year: "MY 2022",
			numerator: 12_486,
			denominator: 17_218,
			exclusions: 1_024,
			performanceRate: 72.52,
		},
		{
			year: "MY 2023",
			numerator: 13_218,
			denominator: 17_892,
			exclusions: 1_086,
			performanceRate: 73.88,
		},
		{
			year: "MY 2024",
			numerator: 13_842,
			denominator: 18_524,
			exclusions: 1_148,
			performanceRate: 76.35,
		},
		{
			year: "MY 2025",
			numerator: 14_869,
			denominator: 19_112,
			exclusions: 1_203,
			performanceRate: 77.81,
		},
	],
	notes: [
		"Performance rate is not final until the close of the measurement year.",
		"Data is refreshed weekly.",
		"Performance rates may not sum due to rounding.",
		"Members must have a BP reading of <140/90 mm Hg during the measurement year.",
	],
};

export function getMeasureExclusions(
	measureId: string
): MeasureExclusionsDetail {
	if (measureId === "CBP") return CBP_EXCLUSIONS;

	const detail = getMeasureDetail(measureId);
	const total = detail?.performanceSummary.exclusions ?? 890;

	return {
		...CBP_EXCLUSIONS,
		summary: {
			totalExclusions: total,
			commercial: Math.round(total * 0.509),
			medicaid: Math.round(total * 0.342),
			medicare: Math.round(total * 0.149),
			totalPlans: 28,
			totalGroups: 156,
		},
		byReason: CBP_EXCLUSIONS.byReason.map((row) => ({
			...row,
			commercial: Math.round(row.commercial * (total / 1_203)),
			medicaid: Math.round(row.medicaid * (total / 1_203)),
			medicare: Math.round(row.medicare * (total / 1_203)),
			total: Math.round(row.total * (total / 1_203)),
		})),
		plans: CBP_EXCLUSIONS.plans.map((plan, index) => ({
			...plan,
			id: `PLAN-00${index + 1}`,
			totalExclusions: Math.round(plan.totalExclusions * (total / 1_203)),
			commercial: Math.round(plan.commercial * (total / 1_203)),
			medicaid: Math.round(plan.medicaid * (total / 1_203)),
			medicare: Math.round(plan.medicare * (total / 1_203)),
		})),
	};
}

export function getMeasurePerformance(
	measureId: string
): MeasurePerformanceDetail {
	if (measureId === "CBP") return CBP_PERFORMANCE;

	const detail = getMeasureDetail(measureId);
	const perf = detail?.performanceSummary;
	const rate = perf?.complianceRate ?? 75.0;

	return {
		...CBP_PERFORMANCE,
		summary: {
			numerator: perf?.numerator ?? 11_000,
			denominator: perf?.denominator ?? 14_500,
			exclusions: perf?.exclusions ?? 890,
			performanceRate: rate,
			priorYearRate: rate - 1.46,
			change: 1.46,
			goal: 80.0,
			status: rate >= 80 ? "Met Goal" : rate >= 75 ? "Near Goal" : "Below Goal",
			statusTone: rate >= 80 ? "met" : rate >= 75 ? "near" : "below",
		},
		trend: CBP_PERFORMANCE.trend.map((row, index) => ({
			...row,
			rate:
				Math.round(
					(rate - (CBP_PERFORMANCE.trend.length - 1 - index) * 0.6) * 100
				) / 100,
		})),
	};
}

export type MemberStatus = "Met Measure" | "Not Met" | "Excluded" | "Pending";

export type MeasureMembersDetail = {
	summaryAsOf: string;
	summary: {
		eligiblePopulation: number;
		denominator: number;
		numerator: number;
		exclusions: number;
		performanceRate: number;
	};
	byStatus: {
		name: string;
		value: number;
		pct: number;
		color: string;
	}[];
	byPlan: {
		planName: string;
		denominator: number;
		numerator: number;
		rate: number | null;
	}[];
	members: {
		id: string;
		name: string;
		dob: string;
		age: number;
		planName: string;
		status: MemberStatus;
		lastBpReading: string;
		lastBpDate: string;
		provider: string;
		riskGroup: string;
		lastOutreach: string;
	}[];
	totalMembers: number;
	filterOptions: {
		plans: string[];
		linesOfBusiness: string[];
		statuses: string[];
		providers: string[];
		riskGroups: string[];
		lastOutreach: string[];
	};
};

export type ProviderPerformanceLevel =
	| "High"
	| "Above Average"
	| "Average"
	| "Below Average"
	| "Low";

export type MeasureProvidersDetail = {
	summaryAsOf: string;
	summary: {
		totalProviders: number;
		providersWithEligibleMembers: number;
		providersThatMetMeasure: number;
		averagePerformanceRate: number;
		providersBelowBenchmark: number;
		benchmark: number;
	};
	byPerformanceLevel: {
		level: ProviderPerformanceLevel;
		count: number;
		pct: number;
		color: string;
	}[];
	trend: { month: string; rate: number }[];
	providers: {
		name: string;
		npi: string;
		providerType: string;
		specialty: string;
		eligibleMembers: number;
		numerator: number;
		performanceRate: number;
		performanceLevel: ProviderPerformanceLevel;
		riskGroup: string;
		lastOutreach: string;
	}[];
	totalProvidersListed: number;
	filterOptions: {
		plans: string[];
		linesOfBusiness: string[];
		providerTypes: string[];
		specialties: string[];
		riskGroups: string[];
		performanceLevels: string[];
	};
};

const MEMBER_STATUS_STYLES: Record<MemberStatus, string> = {
	"Met Measure": "border-emerald-200 bg-emerald-50 text-emerald-800",
	"Not Met": "border-amber-200 bg-amber-50 text-amber-800",
	Excluded: "border-border bg-muted text-muted-foreground",
	Pending: "border-sky-200 bg-sky-50 text-sky-800",
};

const PROVIDER_LEVEL_STYLES: Record<ProviderPerformanceLevel, string> = {
	High: "border-emerald-300 bg-emerald-100 text-emerald-900",
	"Above Average": "border-emerald-200 bg-emerald-50 text-emerald-800",
	Average: "border-amber-200 bg-amber-50 text-amber-800",
	"Below Average": "border-orange-200 bg-orange-50 text-orange-800",
	Low: "border-red-200 bg-red-50 text-red-800",
};

export function getMemberStatusStyle(status: MemberStatus) {
	return MEMBER_STATUS_STYLES[status];
}

export function getProviderLevelStyle(level: ProviderPerformanceLevel) {
	return PROVIDER_LEVEL_STYLES[level];
}

export const CBP_MEMBERS: MeasureMembersDetail = {
	summaryAsOf: "Jul 30, 2025 02:15 PM",
	summary: {
		eligiblePopulation: 24_562,
		denominator: 19_112,
		numerator: 14_869,
		exclusions: 1_203,
		performanceRate: 77.81,
	},
	byStatus: [
		{
			name: "Met Measure (Numerator)",
			value: 14_869,
			pct: 77.8,
			color: "#16a34a",
		},
		{ name: "Not Met Measure", value: 4_243, pct: 19.0, color: "#d97706" },
		{
			name: "Excluded",
			value: 1_203,
			pct: 0,
			color: "color-mix(in oklch, var(--primary) 42%, white)",
		},
		{
			name: "Pending / In Review",
			value: 0,
			pct: 0,
			color: "var(--primary)",
		},
	],
	byPlan: [
		{
			planName: "Commercial PPO",
			denominator: 3_624,
			numerator: 2_839,
			rate: 78.35,
		},
		{
			planName: "HMO Silver",
			denominator: 2_872,
			numerator: 2_218,
			rate: 77.21,
		},
		{
			planName: "Medicaid Managed Care",
			denominator: 5_288,
			numerator: 3_968,
			rate: 75.03,
		},
		{
			planName: "Medicare Advantage HMO",
			denominator: 2_168,
			numerator: 1_684,
			rate: 77.61,
		},
		{
			planName: "Dual Eligible SNP",
			denominator: 1_212,
			numerator: 892,
			rate: 73.55,
		},
		{
			planName: "Medicare Advantage PPO",
			denominator: 0,
			numerator: 0,
			rate: null,
		},
	],
	members: [
		{
			id: "MBR-2025-88421",
			name: "John Smith",
			dob: "03/15/1968",
			age: 57,
			planName: "Commercial PPO",
			status: "Met Measure",
			lastBpReading: "128/78",
			lastBpDate: "06/28/2025",
			provider: "Smith, John MD",
			riskGroup: "Medium",
			lastOutreach: "06/15/2025",
		},
		{
			id: "MBR-2025-77204",
			name: "Maria Garcia",
			dob: "11/22/1975",
			age: 49,
			planName: "HMO Silver",
			status: "Not Met",
			lastBpReading: "142/92",
			lastBpDate: "05/12/2025",
			provider: "Johnson, Sarah MD",
			riskGroup: "High",
			lastOutreach: "06/20/2025",
		},
		{
			id: "MBR-2025-66118",
			name: "Robert Williams",
			dob: "07/08/1955",
			age: 69,
			planName: "Medicare Advantage HMO",
			status: "Met Measure",
			lastBpReading: "132/82",
			lastBpDate: "06/22/2025",
			provider: "Chen, Lisa MD",
			riskGroup: "Low",
			lastOutreach: "05/30/2025",
		},
		{
			id: "MBR-2025-55892",
			name: "Patricia Brown",
			dob: "01/30/1982",
			age: 43,
			planName: "Medicaid Managed Care",
			status: "Not Met",
			lastBpReading: "148/96",
			lastBpDate: "04/18/2025",
			provider: "Martinez, Carlos MD",
			riskGroup: "High",
			lastOutreach: "06/25/2025",
		},
		{
			id: "MBR-2025-44107",
			name: "James Davis",
			dob: "09/14/1960",
			age: 64,
			planName: "Commercial PPO",
			status: "Met Measure",
			lastBpReading: "124/76",
			lastBpDate: "07/02/2025",
			provider: "Smith, John MD",
			riskGroup: "Medium",
			lastOutreach: "06/10/2025",
		},
		{
			id: "MBR-2025-32984",
			name: "Linda Miller",
			dob: "12/05/1948",
			age: 76,
			planName: "Dual Eligible SNP",
			status: "Excluded",
			lastBpReading: "—",
			lastBpDate: "—",
			provider: "Wilson, James MD",
			riskGroup: "Low",
			lastOutreach: "—",
		},
		{
			id: "MBR-2025-21856",
			name: "Michael Wilson",
			dob: "04/20/1970",
			age: 55,
			planName: "HMO Silver",
			status: "Met Measure",
			lastBpReading: "130/80",
			lastBpDate: "06/18/2025",
			provider: "Johnson, Sarah MD",
			riskGroup: "Medium",
			lastOutreach: "06/05/2025",
		},
		{
			id: "MBR-2025-10742",
			name: "Jennifer Taylor",
			dob: "08/11/1988",
			age: 36,
			planName: "Commercial PPO",
			status: "Not Met",
			lastBpReading: "138/88",
			lastBpDate: "05/25/2025",
			provider: "Anderson, Emily MD",
			riskGroup: "Medium",
			lastOutreach: "06/22/2025",
		},
		{
			id: "MBR-2025-99631",
			name: "David Anderson",
			dob: "02/28/1963",
			age: 62,
			planName: "Medicare Advantage HMO",
			status: "Met Measure",
			lastBpReading: "126/74",
			lastBpDate: "07/08/2025",
			provider: "Chen, Lisa MD",
			riskGroup: "Low",
			lastOutreach: "06/18/2025",
		},
		{
			id: "MBR-2025-88520",
			name: "Susan Thomas",
			dob: "06/17/1978",
			age: 47,
			planName: "Medicaid Managed Care",
			status: "Pending",
			lastBpReading: "—",
			lastBpDate: "—",
			provider: "Martinez, Carlos MD",
			riskGroup: "High",
			lastOutreach: "07/01/2025",
		},
	],
	totalMembers: 19_112,
	filterOptions: {
		plans: [
			"All",
			"Commercial PPO",
			"HMO Silver",
			"Medicaid Managed Care",
			"Medicare Advantage HMO",
		],
		linesOfBusiness: ["All", "Commercial", "Medicaid", "Medicare"],
		statuses: ["All", "Met Measure", "Not Met", "Excluded", "Pending"],
		providers: [
			"All",
			"Smith, John MD",
			"Johnson, Sarah MD",
			"Chen, Lisa MD",
			"Martinez, Carlos MD",
		],
		riskGroups: ["All", "Low", "Medium", "High"],
		lastOutreach: [
			"All",
			"Last 30 Days",
			"Last 90 Days",
			"Over 90 Days",
			"Never",
		],
	},
};

export const CBP_PROVIDERS: MeasureProvidersDetail = {
	summaryAsOf: "Jul 30, 2025 02:15 PM",
	summary: {
		totalProviders: 1_248,
		providersWithEligibleMembers: 1_102,
		providersThatMetMeasure: 678,
		averagePerformanceRate: 77.81,
		providersBelowBenchmark: 424,
		benchmark: 80.0,
	},
	byPerformanceLevel: [
		{ level: "High", count: 344, pct: 31.2, color: "var(--primary)" },
		{
			level: "Above Average",
			count: 339,
			pct: 30.7,
			color: "color-mix(in oklch, var(--primary) 75%, white)",
		},
		{
			level: "Average",
			count: 221,
			pct: 20.1,
			color: "color-mix(in oklch, var(--primary) 48%, white)",
		},
		{ level: "Below Average", count: 128, pct: 11.6, color: "#d97706" },
		{ level: "Low", count: 70, pct: 6.4, color: "#dc2626" },
	],
	trend: [
		{ month: "Jan 2025", rate: 74.12 },
		{ month: "Feb 2025", rate: 75.08 },
		{ month: "Mar 2025", rate: 75.92 },
		{ month: "Apr 2025", rate: 76.85 },
		{ month: "May 2025", rate: 77.34 },
		{ month: "Jun 2025", rate: 77.81 },
	],
	providers: [
		{
			name: "Smith, John MD",
			npi: "1234567890",
			providerType: "Individual",
			specialty: "Internal Medicine",
			eligibleMembers: 256,
			numerator: 212,
			performanceRate: 82.81,
			performanceLevel: "Above Average",
			riskGroup: "Medium",
			lastOutreach: "06/28/2025",
		},
		{
			name: "Johnson, Sarah MD",
			npi: "2345678901",
			providerType: "Individual",
			specialty: "Family Practice",
			eligibleMembers: 198,
			numerator: 154,
			performanceRate: 77.78,
			performanceLevel: "Average",
			riskGroup: "High",
			lastOutreach: "06/25/2025",
		},
		{
			name: "Chen, Lisa MD",
			npi: "3456789012",
			providerType: "Individual",
			specialty: "Internal Medicine",
			eligibleMembers: 312,
			numerator: 268,
			performanceRate: 85.9,
			performanceLevel: "Above Average",
			riskGroup: "Low",
			lastOutreach: "07/02/2025",
		},
		{
			name: "Martinez, Carlos MD",
			npi: "4567890123",
			providerType: "Individual",
			specialty: "Family Practice",
			eligibleMembers: 184,
			numerator: 118,
			performanceRate: 64.13,
			performanceLevel: "Below Average",
			riskGroup: "High",
			lastOutreach: "06/20/2025",
		},
		{
			name: "Wilson, James MD",
			npi: "5678901234",
			providerType: "Individual",
			specialty: "Cardiology",
			eligibleMembers: 142,
			numerator: 128,
			performanceRate: 90.14,
			performanceLevel: "High",
			riskGroup: "Low",
			lastOutreach: "06/15/2025",
		},
		{
			name: "Anderson, Emily MD",
			npi: "6789012345",
			providerType: "Individual",
			specialty: "Internal Medicine",
			eligibleMembers: 168,
			numerator: 102,
			performanceRate: 60.71,
			performanceLevel: "Average",
			riskGroup: "Medium",
			lastOutreach: "06/18/2025",
		},
		{
			name: "Regional Medical Group",
			npi: "7890123456",
			providerType: "Group",
			specialty: "Multi-Specialty",
			eligibleMembers: 524,
			numerator: 412,
			performanceRate: 78.63,
			performanceLevel: "Average",
			riskGroup: "Medium",
			lastOutreach: "06/30/2025",
		},
		{
			name: "Taylor, Robert MD",
			npi: "8901234567",
			providerType: "Individual",
			specialty: "Family Practice",
			eligibleMembers: 96,
			numerator: 38,
			performanceRate: 39.58,
			performanceLevel: "Low",
			riskGroup: "High",
			lastOutreach: "05/22/2025",
		},
		{
			name: "Park, Michelle MD",
			npi: "9012345678",
			providerType: "Individual",
			specialty: "Internal Medicine",
			eligibleMembers: 224,
			numerator: 186,
			performanceRate: 83.04,
			performanceLevel: "Above Average",
			riskGroup: "Low",
			lastOutreach: "07/05/2025",
		},
		{
			name: "Community Health Partners",
			npi: "0123456789",
			providerType: "Group",
			specialty: "Family Practice",
			eligibleMembers: 386,
			numerator: 298,
			performanceRate: 77.2,
			performanceLevel: "Average",
			riskGroup: "Medium",
			lastOutreach: "06/12/2025",
		},
	],
	totalProvidersListed: 1_102,
	filterOptions: {
		plans: [
			"All",
			"Commercial PPO",
			"HMO Silver",
			"Medicaid Managed Care",
			"Medicare Advantage HMO",
		],
		linesOfBusiness: ["All", "Commercial", "Medicaid", "Medicare"],
		providerTypes: ["All", "Individual", "Group"],
		specialties: [
			"All",
			"Internal Medicine",
			"Family Practice",
			"Cardiology",
			"Multi-Specialty",
		],
		riskGroups: ["All", "Low", "Medium", "High"],
		performanceLevels: [
			"All",
			"High",
			"Above Average",
			"Average",
			"Below Average",
			"Low",
		],
	},
};

export function getMeasureMembers(measureId: string): MeasureMembersDetail {
	if (measureId === "CBP") return CBP_MEMBERS;

	const detail = getMeasureDetail(measureId);
	const perf = detail?.performanceSummary;

	return {
		...CBP_MEMBERS,
		summary: {
			eligiblePopulation: perf?.eligiblePopulation ?? 18_000,
			denominator: perf?.denominator ?? 14_500,
			numerator: perf?.numerator ?? 11_000,
			exclusions: perf?.exclusions ?? 890,
			performanceRate: perf?.complianceRate ?? 75.0,
		},
		totalMembers: perf?.denominator ?? 14_500,
	};
}

export function getMeasureProviders(measureId: string): MeasureProvidersDetail {
	if (measureId === "CBP") return CBP_PROVIDERS;

	const detail = getMeasureDetail(measureId);
	const rate = detail?.performanceSummary.complianceRate ?? 75.0;

	return {
		...CBP_PROVIDERS,
		summary: {
			...CBP_PROVIDERS.summary,
			averagePerformanceRate: rate,
		},
	};
}

export type GapClosureStatus =
	| "In Process"
	| "Closed"
	| "Open - Not Contacted"
	| "Overdue";

export type MeasureGapClosureDetail = {
	summary: {
		totalGaps: number;
		openGaps: number;
		closedGaps: number;
		closureRate: number;
		inProcess: number;
	};
	byStatus: { name: string; value: number; pct: number; color: string }[];
	byReason: {
		reason: string;
		totalGaps: number;
		closedGaps: number;
		closureRate: number;
	}[];
	trend: { month: string; rate: number }[];
	goal: number;
	gaps: {
		memberId: string;
		memberName: string;
		dob: string;
		planName: string;
		gapReason: string;
		dateIdentified: string;
		status: GapClosureStatus;
		outreachDate: string;
		lastAction: string;
		assignedTo: string;
	}[];
	byPlan: {
		planName: string;
		totalGaps: number;
		closedGaps: number;
		closureRate: number;
	}[];
	recentActivities: {
		id: string;
		type: "closed" | "call" | "letter" | "overdue";
		message: string;
		timestamp: string;
	}[];
	totalGaps: number;
	filterOptions: {
		plans: string[];
		linesOfBusiness: string[];
		statuses: string[];
		reasons: string[];
		riskGroups: string[];
	};
};

export type MeasureDocumentsDetail = {
	summary: {
		totalDocuments: number;
		specifications: number;
		technicalNotes: number;
		submissionFiles: number;
		lastUpdated: string;
	};
	documents: {
		id: string;
		name: string;
		type: string;
		category: string;
		version: string;
		size: string;
		updated: string;
		updatedBy: string;
		status: string;
	}[];
	filterOptions: {
		categories: string[];
		types: string[];
		statuses: string[];
	};
};

export type MeasureHistoryDetail = {
	filterOptions: {
		historyViews: string[];
		comparedTo: string[];
		years: string[];
	};
	summary: {
		yearsAvailable: number;
		averagePerformanceRate: number;
		bestPerformance: number;
		bestPerformanceYear: string;
		lowestPerformance: number;
		lowestPerformanceYear: string;
		totalImprovement: number;
		goal: number;
	};
	performanceTrend: { year: string; rate: number }[];
	changeHistory: {
		id: string;
		dateTime: string;
		changeType: string;
		changeTypeStyle: string;
		section: string;
		changedBy: string;
		description: string;
		impact: string;
		impactStyle: string;
	}[];
	yearOverYear: {
		year: string;
		eligiblePopulation: number;
		denominator: number;
		numerator: number;
		exclusions: number;
		performanceRate: number;
		goal: number;
		variance: number;
		status: string;
		changeFromPriorYear: number | null;
	}[];
	totalChangeEntries: number;
};

const GAP_STATUS_STYLES: Record<GapClosureStatus, string> = {
	"In Process": "border-sky-200 bg-sky-50 text-sky-800",
	Closed: "border-emerald-200 bg-emerald-50 text-emerald-800",
	"Open - Not Contacted": "border-border bg-muted text-muted-foreground",
	Overdue: "border-red-200 bg-red-50 text-red-800",
};

export function getGapStatusStyle(status: GapClosureStatus) {
	return GAP_STATUS_STYLES[status];
}

export const CBP_GAP_CLOSURE: MeasureGapClosureDetail = {
	summary: {
		totalGaps: 4_243,
		openGaps: 3_296,
		closedGaps: 947,
		closureRate: 22.33,
		inProcess: 1_147,
	},
	byStatus: [
		{ name: "Closed", value: 947, pct: 22.33, color: "#16a34a" },
		{ name: "In Process", value: 1_147, pct: 27.15, color: "var(--primary)" },
		{
			name: "Open - Not Contacted",
			value: 1_997,
			pct: 47.06,
			color: "color-mix(in oklch, var(--primary) 42%, white)",
		},
		{ name: "Overdue", value: 1_152, pct: 27.02, color: "#dc2626" },
	],
	byReason: [
		{
			reason: "No BP Reading",
			totalGaps: 1_842,
			closedGaps: 412,
			closureRate: 22.37,
		},
		{
			reason: "BP Reading >= 140/90",
			totalGaps: 1_486,
			closedGaps: 328,
			closureRate: 22.07,
		},
		{
			reason: "Medication Adherence",
			totalGaps: 624,
			closedGaps: 142,
			closureRate: 22.76,
		},
		{
			reason: "Follow-Up Needed",
			totalGaps: 198,
			closedGaps: 48,
			closureRate: 24.24,
		},
		{ reason: "Other", totalGaps: 93, closedGaps: 17, closureRate: 18.28 },
	],
	trend: [
		{ month: "Jan 2025", rate: 14.2 },
		{ month: "Feb 2025", rate: 16.8 },
		{ month: "Mar 2025", rate: 18.4 },
		{ month: "Apr 2025", rate: 19.6 },
		{ month: "May 2025", rate: 20.8 },
		{ month: "Jun 2025", rate: 21.9 },
		{ month: "Jul 2025", rate: 22.33 },
	],
	goal: 30,
	gaps: [
		{
			memberId: "MBR-2025-77204",
			memberName: "Maria Garcia",
			dob: "11/22/1975",
			planName: "HMO Silver",
			gapReason: "BP Reading >= 140/90",
			dateIdentified: "03/15/2025",
			status: "In Process",
			outreachDate: "06/20/2025",
			lastAction: "Outbound call completed",
			assignedTo: "Care Manager A",
		},
		{
			memberId: "MBR-2025-55892",
			memberName: "Patricia Brown",
			dob: "01/30/1982",
			planName: "Medicaid Managed Care",
			gapReason: "No BP Reading",
			dateIdentified: "02/08/2025",
			status: "Closed",
			outreachDate: "06/25/2025",
			lastAction: "BP reading documented",
			assignedTo: "Care Manager B",
		},
		{
			memberId: "MBR-2025-10742",
			memberName: "Jennifer Taylor",
			dob: "08/11/1988",
			planName: "Commercial PPO",
			gapReason: "Follow-Up Needed",
			dateIdentified: "04/22/2025",
			status: "Open - Not Contacted",
			outreachDate: "—",
			lastAction: "—",
			assignedTo: "Outreach Team",
		},
		{
			memberId: "MBR-2025-44107",
			memberName: "James Davis",
			dob: "09/14/1960",
			planName: "Commercial PPO",
			gapReason: "Medication Adherence",
			dateIdentified: "01/18/2025",
			status: "Overdue",
			outreachDate: "05/10/2025",
			lastAction: "Letter sent",
			assignedTo: "Care Manager A",
		},
		{
			memberId: "MBR-2025-99631",
			memberName: "David Anderson",
			dob: "02/28/1963",
			planName: "Medicare Advantage HMO",
			gapReason: "No BP Reading",
			dateIdentified: "05/05/2025",
			status: "In Process",
			outreachDate: "07/01/2025",
			lastAction: "Appointment scheduled",
			assignedTo: "Care Manager C",
		},
		{
			memberId: "MBR-2025-88520",
			memberName: "Susan Thomas",
			dob: "06/17/1978",
			planName: "Medicaid Managed Care",
			gapReason: "BP Reading >= 140/90",
			dateIdentified: "03/28/2025",
			status: "Closed",
			outreachDate: "06/18/2025",
			lastAction: "Gap closed - BP controlled",
			assignedTo: "Care Manager B",
		},
		{
			memberId: "MBR-2025-66118",
			memberName: "Robert Williams",
			dob: "07/08/1955",
			planName: "Medicare Advantage HMO",
			gapReason: "Other",
			dateIdentified: "06/01/2025",
			status: "Open - Not Contacted",
			outreachDate: "—",
			lastAction: "—",
			assignedTo: "Outreach Team",
		},
		{
			memberId: "MBR-2025-32984",
			memberName: "Linda Miller",
			dob: "12/05/1948",
			planName: "Dual Eligible SNP",
			gapReason: "Follow-Up Needed",
			dateIdentified: "04/10/2025",
			status: "Overdue",
			outreachDate: "05/22/2025",
			lastAction: "Member unreachable",
			assignedTo: "Care Manager C",
		},
		{
			memberId: "MBR-2025-21856",
			memberName: "Michael Wilson",
			dob: "04/20/1970",
			planName: "HMO Silver",
			gapReason: "No BP Reading",
			dateIdentified: "02/14/2025",
			status: "In Process",
			outreachDate: "06/28/2025",
			lastAction: "Provider notified",
			assignedTo: "Care Manager A",
		},
		{
			memberId: "MBR-2025-88421",
			memberName: "John Smith",
			dob: "03/15/1968",
			planName: "Commercial PPO",
			gapReason: "Medication Adherence",
			dateIdentified: "05/18/2025",
			status: "Closed",
			outreachDate: "07/05/2025",
			lastAction: "Pharmacy refill confirmed",
			assignedTo: "Clinical Staff",
		},
	],
	byPlan: [
		{
			planName: "Commercial PPO",
			totalGaps: 892,
			closedGaps: 198,
			closureRate: 22.2,
		},
		{
			planName: "HMO Silver",
			totalGaps: 624,
			closedGaps: 142,
			closureRate: 22.76,
		},
		{
			planName: "Medicaid Managed Care",
			totalGaps: 1_486,
			closedGaps: 328,
			closureRate: 22.07,
		},
		{
			planName: "Medicare Advantage HMO",
			totalGaps: 748,
			closedGaps: 168,
			closureRate: 22.46,
		},
		{
			planName: "Dual Eligible SNP",
			totalGaps: 312,
			closedGaps: 68,
			closureRate: 21.79,
		},
	],
	recentActivities: [
		{
			id: "a1",
			type: "closed",
			message: "Gap closed for MBR-2025-55892",
			timestamp: "Jul 30, 2025 02:10 PM",
		},
		{
			id: "a2",
			type: "call",
			message: "Outbound call completed for MBR-2025-77204",
			timestamp: "Jul 30, 2025 01:45 PM",
		},
		{
			id: "a3",
			type: "letter",
			message: "Letter sent to MBR-2025-44107",
			timestamp: "Jul 29, 2025 04:30 PM",
		},
		{
			id: "a4",
			type: "overdue",
			message: "Gap overdue for MBR-2025-32984",
			timestamp: "Jul 29, 2025 09:15 AM",
		},
		{
			id: "a5",
			type: "closed",
			message: "Gap closed for MBR-2025-88520",
			timestamp: "Jul 28, 2025 03:20 PM",
		},
	],
	totalGaps: 4_243,
	filterOptions: {
		plans: [
			"All",
			"Commercial PPO",
			"HMO Silver",
			"Medicaid Managed Care",
			"Medicare Advantage HMO",
		],
		linesOfBusiness: ["All", "Commercial", "Medicaid", "Medicare"],
		statuses: [
			"All",
			"In Process",
			"Closed",
			"Open - Not Contacted",
			"Overdue",
		],
		reasons: [
			"All",
			"No BP Reading",
			"BP Reading >= 140/90",
			"Medication Adherence",
			"Follow-Up Needed",
			"Other",
		],
		riskGroups: ["All", "Low", "Medium", "High"],
	},
};

export const CBP_MEASURE_DOCUMENTS: MeasureDocumentsDetail = {
	summary: {
		totalDocuments: 24,
		specifications: 6,
		technicalNotes: 8,
		submissionFiles: 4,
		lastUpdated: "Jul 30, 2025 02:15 PM",
	},
	documents: [
		{
			id: "d1",
			name: "CBP Measure Specifications MY 2025",
			type: "PDF",
			category: "Specifications",
			version: "v2025.1",
			size: "4.2 MB",
			updated: "Jul 15, 2025",
			updatedBy: "Quality Analyst",
			status: "Current",
		},
		{
			id: "d2",
			name: "CBP Technical Notes",
			type: "PDF",
			category: "Technical Notes",
			version: "v2025.1",
			size: "1.8 MB",
			updated: "Jun 1, 2025",
			updatedBy: "Quality Team",
			status: "Current",
		},
		{
			id: "d3",
			name: "CBP Provider Tips",
			type: "PDF",
			category: "Provider Tips",
			version: "v2025",
			size: "980 KB",
			updated: "May 15, 2025",
			updatedBy: "Clinical Team",
			status: "Current",
		},
		{
			id: "d4",
			name: "HEDIS 2025 Volume 2 - CBP",
			type: "PDF",
			category: "Specifications",
			version: "NCQA 2025",
			size: "2.4 MB",
			updated: "Jan 10, 2025",
			updatedBy: "NCQA",
			status: "Reference",
		},
		{
			id: "d5",
			name: "CBP Value Set Reference",
			type: "XLSX",
			category: "Technical Notes",
			version: "v2025.2",
			size: "856 KB",
			updated: "Jul 1, 2025",
			updatedBy: "Data Team",
			status: "Current",
		},
		{
			id: "d6",
			name: "MY 2025 Gap Closure Report - Jun",
			type: "PDF",
			category: "Reports",
			version: "Jun 2025",
			size: "1.2 MB",
			updated: "Jul 5, 2025",
			updatedBy: "System",
			status: "Current",
		},
		{
			id: "d7",
			name: "CBP NCQA Submission File",
			type: "XML",
			category: "Submission Files",
			version: "MY 2025",
			size: "12.4 MB",
			updated: "Jul 28, 2025",
			updatedBy: "Submission Team",
			status: "Submitted",
		},
		{
			id: "d8",
			name: "CBP Audit Workpapers",
			type: "PDF",
			category: "Audit",
			version: "Q2 2025",
			size: "3.6 MB",
			updated: "Jul 20, 2025",
			updatedBy: "Audit Team",
			status: "Current",
		},
		{
			id: "d9",
			name: "Provider Performance Summary",
			type: "XLSX",
			category: "Reports",
			version: "Jul 2025",
			size: "2.1 MB",
			updated: "Jul 30, 2025",
			updatedBy: "Analytics",
			status: "Current",
		},
		{
			id: "d10",
			name: "CBP Member Outreach Scripts",
			type: "DOCX",
			category: "Provider Tips",
			version: "v3",
			size: "420 KB",
			updated: "Apr 12, 2025",
			updatedBy: "Outreach Team",
			status: "Current",
		},
	],
	filterOptions: {
		categories: [
			"All",
			"Specifications",
			"Technical Notes",
			"Provider Tips",
			"Reports",
			"Submission Files",
			"Audit",
		],
		types: ["All", "PDF", "XLSX", "XML", "DOCX"],
		statuses: ["All", "Current", "Reference", "Submitted", "Archived"],
	},
};

export const CBP_MEASURE_HISTORY: MeasureHistoryDetail = {
	filterOptions: {
		historyViews: [
			"Performance History",
			"Specification History",
			"Population History",
			"All Changes",
		],
		comparedTo: ["Prior Year", "Prior Period", "Goal"],
		years: ["MY 2021", "MY 2022", "MY 2023", "MY 2024", "MY 2025"],
	},
	summary: {
		yearsAvailable: 5,
		averagePerformanceRate: 74.49,
		bestPerformance: 77.81,
		bestPerformanceYear: "MY 2025",
		lowestPerformance: 71.33,
		lowestPerformanceYear: "MY 2021",
		totalImprovement: 6.48,
		goal: 80.0,
	},
	performanceTrend: [
		{ year: "MY 2021", rate: 71.33 },
		{ year: "MY 2022", rate: 72.76 },
		{ year: "MY 2023", rate: 72.74 },
		{ year: "MY 2024", rate: 76.35 },
		{ year: "MY 2025", rate: 77.81 },
	],
	changeHistory: [
		{
			id: "c1",
			dateTime: "Jul 30, 2025 02:15 PM",
			changeType: "Performance Refresh",
			changeTypeStyle: "border-violet-200 bg-violet-50 text-violet-800",
			section: "Performance",
			changedBy: "System",
			description: "Monthly performance recalculation completed",
			impact: "Low",
			impactStyle: "border-emerald-200 bg-emerald-50 text-emerald-800",
		},
		{
			id: "c2",
			dateTime: "Jul 15, 2025 10:30 AM",
			changeType: "Specification Update",
			changeTypeStyle: "border-sky-200 bg-sky-50 text-sky-800",
			section: "Specifications",
			changedBy: "Quality Analyst",
			description: "Updated denominator criteria for MY 2025",
			impact: "High",
			impactStyle: "border-red-200 bg-red-50 text-red-800",
		},
		{
			id: "c3",
			dateTime: "Jul 10, 2025 03:45 PM",
			changeType: "Population Update",
			changeTypeStyle: "border-emerald-200 bg-emerald-50 text-emerald-800",
			section: "Eligible Population",
			changedBy: "Data Team",
			description: "Refreshed eligible population counts",
			impact: "Medium",
			impactStyle: "border-amber-200 bg-amber-50 text-amber-800",
		},
		{
			id: "c4",
			dateTime: "Jun 28, 2025 11:20 AM",
			changeType: "Exclusion Update",
			changeTypeStyle: "border-amber-200 bg-amber-50 text-amber-800",
			section: "Exclusions",
			changedBy: "Quality Analyst",
			description: "Added new exclusion for ESRD",
			impact: "Medium",
			impactStyle: "border-amber-200 bg-amber-50 text-amber-800",
		},
		{
			id: "c5",
			dateTime: "Jun 15, 2025 09:00 AM",
			changeType: "Performance Refresh",
			changeTypeStyle: "border-violet-200 bg-violet-50 text-violet-800",
			section: "Performance",
			changedBy: "System",
			description: "Corrected BP reading mapping",
			impact: "High",
			impactStyle: "border-red-200 bg-red-50 text-red-800",
		},
		{
			id: "c6",
			dateTime: "May 20, 2025 02:30 PM",
			changeType: "Numerator Update",
			changeTypeStyle: "border-sky-200 bg-sky-50 text-sky-800",
			section: "Numerator",
			changedBy: "Clinical Team",
			description: "Updated numerator logic for telehealth visits",
			impact: "Low",
			impactStyle: "border-emerald-200 bg-emerald-50 text-emerald-800",
		},
	],
	yearOverYear: [
		{
			year: "MY 2021",
			eligiblePopulation: 21_842,
			denominator: 16_604,
			numerator: 11_842,
			exclusions: 982,
			performanceRate: 71.33,
			goal: 80.0,
			variance: -8.67,
			status: "Not Met",
			changeFromPriorYear: null,
		},
		{
			year: "MY 2022",
			eligiblePopulation: 22_486,
			denominator: 17_218,
			numerator: 12_486,
			exclusions: 1_024,
			performanceRate: 72.76,
			goal: 80.0,
			variance: -7.24,
			status: "Not Met",
			changeFromPriorYear: 1.43,
		},
		{
			year: "MY 2023",
			eligiblePopulation: 23_118,
			denominator: 17_892,
			numerator: 13_218,
			exclusions: 1_086,
			performanceRate: 72.74,
			goal: 80.0,
			variance: -7.26,
			status: "Not Met",
			changeFromPriorYear: -0.02,
		},
		{
			year: "MY 2024",
			eligiblePopulation: 23_842,
			denominator: 18_524,
			numerator: 13_842,
			exclusions: 1_148,
			performanceRate: 76.35,
			goal: 80.0,
			variance: -3.65,
			status: "Not Met",
			changeFromPriorYear: 3.61,
		},
		{
			year: "MY 2025",
			eligiblePopulation: 24_562,
			denominator: 19_112,
			numerator: 14_869,
			exclusions: 1_203,
			performanceRate: 77.81,
			goal: 80.0,
			variance: -2.19,
			status: "Not Met",
			changeFromPriorYear: 1.46,
		},
	],
	totalChangeEntries: 48,
};

export function getMeasureGapClosure(
	measureId: string
): MeasureGapClosureDetail {
	if (measureId === "CBP") return CBP_GAP_CLOSURE;
	const perf = getMeasureDetail(measureId)?.performanceSummary;
	const openGaps = perf?.openGaps ?? 3_200;
	const closedGaps = perf?.closedGaps ?? 900;
	return {
		...CBP_GAP_CLOSURE,
		summary: {
			...CBP_GAP_CLOSURE.summary,
			openGaps,
			closedGaps,
			totalGaps: openGaps + closedGaps,
		},
		totalGaps: openGaps + closedGaps,
	};
}

export function getMeasureDocuments(measureId: string): MeasureDocumentsDetail {
	if (measureId === "CBP") return CBP_MEASURE_DOCUMENTS;
	return {
		...CBP_MEASURE_DOCUMENTS,
		documents: CBP_MEASURE_DOCUMENTS.documents.map((d) => ({
			...d,
			name: d.name.replace("CBP", measureId),
		})),
	};
}

export function getMeasureHistory(measureId: string): MeasureHistoryDetail {
	if (measureId === "CBP") return CBP_MEASURE_HISTORY;
	return CBP_MEASURE_HISTORY;
}

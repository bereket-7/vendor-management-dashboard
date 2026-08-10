export type EdgeServerTabId =
	| "threshold-report"
	| "quarterly-baseline-report"
	| "cms-ra-reports"
	| "cms-radv-reports"
	| "cms-hcrp-reports"
	| "cms-orphan-frequency-reports"
	| "hhs-master-data-updates"
	| "crosswalk";

export const EDGE_SERVER_TABS: { id: EdgeServerTabId; label: string }[] = [
	{ id: "threshold-report", label: "Threshold Report" },
	{ id: "quarterly-baseline-report", label: "Quarterly Baseline Report" },
	{ id: "cms-ra-reports", label: "CMS RA Reports" },
	{ id: "cms-radv-reports", label: "CMS RADV Reports" },
	{ id: "cms-hcrp-reports", label: "CMS HCRP Reports" },
	{ id: "cms-orphan-frequency-reports", label: "CMS Orphan Frequency Reports" },
	{ id: "hhs-master-data-updates", label: "HHS Master Data Updates" },
	{ id: "crosswalk", label: "Crosswalk" },
];

export const PUBLISHED_DATE_OPTIONS = [
	{ value: "2025-03-14", label: "03/14/2025" },
	{ value: "2025-02-07", label: "02/07/2025" },
	{ value: "2025-01-15", label: "01/15/2025" },
	{ value: "2024-12-20", label: "12/20/2024" },
];

export type EdgeServerRow = {
	id: string;
	issuerHiosId: string;
	marketType: string;
	dataType: string;
	baseline: number;
	baselineDate: string;
	edgeActualEcsCount: number;
	ecsReportDate: string;
	percentOfBaseline: number;
	publishedDate: string;
};

const ISSUER_IDS = ["31663", "32542", "35755", "57125", "33130", "31674"];
const DATA_TYPES = ["Claims", "Enrollments"];
const MARKET_TYPES = ["Individual", "Small Group"];

const THRESHOLD_REPORT_STATIC: Omit<EdgeServerRow, "id" | "publishedDate">[] = [
	{
		issuerHiosId: "31663",
		marketType: "Individual",
		dataType: "Claims",
		baseline: 107_673,
		baselineDate: "2025-02-07",
		edgeActualEcsCount: 105_826,
		ecsReportDate: "2025-03-14",
		percentOfBaseline: 98.28,
	},
	{
		issuerHiosId: "32542",
		marketType: "Individual",
		dataType: "Enrollments",
		baseline: 84_512,
		baselineDate: "2025-02-07",
		edgeActualEcsCount: 83_104,
		ecsReportDate: "2025-03-14",
		percentOfBaseline: 98.33,
	},
	{
		issuerHiosId: "35755",
		marketType: "Individual",
		dataType: "Claims",
		baseline: 92_441,
		baselineDate: "2025-02-07",
		edgeActualEcsCount: 90_876,
		ecsReportDate: "2025-03-14",
		percentOfBaseline: 98.31,
	},
	{
		issuerHiosId: "33130",
		marketType: "Individual",
		dataType: "Enrollments",
		baseline: 41_288,
		baselineDate: "2025-02-07",
		edgeActualEcsCount: 40_512,
		ecsReportDate: "2025-03-14",
		percentOfBaseline: 98.12,
	},
	{
		issuerHiosId: "57125",
		marketType: "Individual",
		dataType: "Enrollments",
		baseline: 30_488,
		baselineDate: "2025-02-07",
		edgeActualEcsCount: 29_776,
		ecsReportDate: "2025-03-14",
		percentOfBaseline: 97.66,
	},
	{
		issuerHiosId: "31674",
		marketType: "Individual",
		dataType: "Claims",
		baseline: 68_904,
		baselineDate: "2025-02-07",
		edgeActualEcsCount: 67_812,
		ecsReportDate: "2025-03-14",
		percentOfBaseline: 98.42,
	},
];

export function mockThresholdReportRows(publishedDate: string): EdgeServerRow[] {
	if (publishedDate === "2025-03-14") {
		return THRESHOLD_REPORT_STATIC.map((row, index) => ({
			...row,
			id: `threshold-${publishedDate}-${index + 1}`,
			publishedDate,
		}));
	}
	return mockEdgeServerRows("threshold-report", publishedDate);
}

export function mockEdgeServerRows(
	tabId: EdgeServerTabId,
	publishedDate: string
): EdgeServerRow[] {
	const seed = tabId.length + publishedDate.length;
	return Array.from({ length: 12 }, (_, index) => {
		const issuerId = ISSUER_IDS[(index + seed) % ISSUER_IDS.length]!;
		const dataType = DATA_TYPES[(index + seed) % DATA_TYPES.length]!;
		const baseline = 80000 + ((index + seed) * 1379) % 40000;
		const edgeActual = Math.round(baseline * (0.88 + ((index % 5) * 0.025)));
		const pct = Number(((edgeActual / baseline) * 100).toFixed(2));
		return {
			id: `${tabId}-${publishedDate}-${index + 1}`,
			issuerHiosId: issuerId,
			marketType: MARKET_TYPES[index % MARKET_TYPES.length]!,
			dataType,
			baseline,
			baselineDate: "2025-02-07",
			edgeActualEcsCount: edgeActual,
			ecsReportDate: publishedDate,
			percentOfBaseline: pct,
			publishedDate,
		};
	});
}

export function publishedDateLabel(value: string) {
	return (
		PUBLISHED_DATE_OPTIONS.find((option) => option.value === value)?.label ??
		value
	);
}

export type HhsMasterDataRow = {
	id: string;
	tableName: string;
	referenceType: string;
	lastReleaseDate: string;
};

export const HHS_MASTER_DATA_ROWS: HhsMasterDataRow[] = [
	{
		id: "hhs-1",
		tableName: "EXCTN_ZN_TYPE",
		referenceType: "All File Types",
		lastReleaseDate: "4/23/2025 12:00:45 AM",
	},
	{
		id: "hhs-2",
		tableName: "INT_CNTRL_RLS_NMBR",
		referenceType: "All File Types",
		lastReleaseDate: "4/23/2025 12:00:45 AM",
	},
	{
		id: "hhs-3",
		tableName: "CLAIM_BILL_TYPE",
		referenceType: "Medical",
		lastReleaseDate: "4/23/2025 12:00:45 AM",
	},
	{
		id: "hhs-4",
		tableName: "DSCHRG_STUS_TYPE",
		referenceType: "Medical",
		lastReleaseDate: "4/23/2025 12:00:45 AM",
	},
	{
		id: "hhs-5",
		tableName: "SRVC_TYPE",
		referenceType: "Medical",
		lastReleaseDate: "4/23/2025 12:00:45 AM",
	},
	{
		id: "hhs-6",
		tableName: "SRVC_CD_TYPE",
		referenceType: "Medical",
		lastReleaseDate: "4/23/2025 12:00:45 AM",
	},
	{
		id: "hhs-7",
		tableName: "SRVC_CD_MDFR_TYPE",
		referenceType: "Medical",
		lastReleaseDate: "4/23/2025 12:00:45 AM",
	},
	{
		id: "hhs-8",
		tableName: "SRVC_PLC_TYPE",
		referenceType: "Medical",
		lastReleaseDate: "4/23/2025 12:00:45 AM",
	},
];

export const QUARTERLY_BENEFIT_YEARS = ["2025", "2024", "2023"];
export const QUARTERLY_HIOS_IDS = ["31863", "32542", "35755", "57125"];
export const QUARTERLY_BASELINE_DATES = [
	{ value: "2025-02-07", label: "02/07/2025" },
	{ value: "2025-01-15", label: "01/15/2025" },
];
export const QUARTERLY_EXTRACTION_DATES = [
	{ value: "2025-03-14", label: "03/14/2025" },
	{ value: "2025-02-28", label: "02/28/2025" },
];

export type QuarterlyBaselineFilters = {
	benefitYear: string;
	hiosId: string;
	baselineDate: string;
	hhsExtractionDate: string;
};

export function mockQuarterlyBaselineRows(filters: QuarterlyBaselineFilters) {
	return mockEdgeServerRows("quarterly-baseline-report", filters.baselineDate).map(
		(row, index) => ({
			...row,
			id: `qbr-${filters.benefitYear}-${filters.hiosId}-${index + 1}`,
			issuerHiosId: filters.hiosId,
		})
	);
}

export function filterHhsMasterDataRows(rows: HhsMasterDataRow[], query: string) {
	const q = query.trim().toLowerCase();
	if (!q) return rows;
	return rows.filter(
		(row) =>
			row.tableName.toLowerCase().includes(q) ||
			row.referenceType.toLowerCase().includes(q)
	);
}

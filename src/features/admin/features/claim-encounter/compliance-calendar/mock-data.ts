export type ComplianceProgramKey =
	| "cms-edge"
	| "medicaid"
	| "medicare"
	| "quality"
	| "other"
	| "overdue";

export const COMPLIANCE_PROGRAM_COLORS: Record<ComplianceProgramKey, string> = {
	"cms-edge": "#2563eb",
	medicaid: "#16a34a",
	medicare: "#ea580c",
	quality: "#9333ea",
	other: "#0d9488",
	overdue: "#dc2626",
};

export const COMPLIANCE_PROGRAM_LABELS: Record<ComplianceProgramKey, string> = {
	"cms-edge": "CMS EDGE",
	medicaid: "Medicaid",
	medicare: "Medicare",
	quality: "Quality",
	other: "Other Programs",
	overdue: "Overdue",
};

export const COMPLIANCE_CALENDAR_KPIS = {
	total: { value: 0, hint: "Across all programs" },
	upcoming: { value: 0, pct: "0%" },
	overdue: { value: 0, pct: "0%" },
	completed: { value: 0, pct: "0%" },
	atRisk: { value: 0, pct: "0%" },
};

export type CalendarDayEvent = {
	program: ComplianceProgramKey;
	count: number;
};

export const COMPLIANCE_CALENDAR_MONTH = { year: 2027, month: 5 }; // June 2027 (0-indexed)

export const COMPLIANCE_CALENDAR_TODAY = 16;

/** Events keyed by day of month (June 2027) */
export const COMPLIANCE_CALENDAR_EVENTS: Record<number, CalendarDayEvent[]> =
	{};

export const COMPLIANCE_PROGRAM_SUMMARY: Array<{
	key: Exclude<ComplianceProgramKey, "overdue">;
	count: number;
	pct: string;
}> = [];

export const COMPLIANCE_FILTER_PROGRAMS = [
	"All",
	"CMS EDGE",
	"Medicaid",
	"Medicare",
	"Quality",
	"Other",
];
export const COMPLIANCE_FILTER_TYPES = [
	"All",
	"Submission",
	"Reporting",
	"Attestation",
	"Audit",
];
export const COMPLIANCE_FILTER_STATUSES = [
	"All",
	"Upcoming",
	"Overdue",
	"Completed",
	"At Risk",
];
export const COMPLIANCE_FILTER_OWNERS = [
	"All",
	"Compliance Team",
	"Regulatory Ops",
	"Quality Team",
	"Vendor Relations",
];

export const COMPLIANCE_DATE_RANGE = "06/01/2027 - 06/30/2027";

export const COMPLIANCE_LEGEND_ITEMS: ComplianceProgramKey[] = [
	"cms-edge",
	"medicaid",
	"medicare",
	"quality",
	"other",
	"overdue",
];

/** Build calendar grid cells for June 2027 (includes trailing/leading days) */
export function buildMay2025Grid() {
	const year = 2027;
	const month = 5; // June
	const firstDay = new Date(year, month, 1).getDay(); // 4 = Thursday
	const daysInMonth = 30;
	const prevMonthDays = new Date(year, month, 0).getDate(); // May has 31 days

	const cells: { day: number; inMonth: boolean; isToday: boolean }[] = [];

	// Trailing days from May
	for (let i = firstDay - 1; i >= 0; i--) {
		cells.push({
			day: prevMonthDays - i,
			inMonth: false,
			isToday: false,
		});
	}

	// June days
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push({
			day: d,
			inMonth: true,
			isToday: d === COMPLIANCE_CALENDAR_TODAY,
		});
	}

	// Leading days from July to fill 6 rows (42 cells)
	let juneDay = 1;
	while (cells.length < 42) {
		cells.push({
			day: juneDay++,
			inMonth: false,
			isToday: false,
		});
	}

	return cells;
}

export type ObligationStatus = "Overdue" | "At Risk" | "Upcoming" | "Completed";

export type ComplianceObligationRow = {
	id: string;
	title: string;
	program: Exclude<ComplianceProgramKey, "overdue">;
	obligationType: string;
	frequency: string;
	dueDate: string;
	status: ObligationStatus;
	daysToDue: number;
	owner: string;
	sourceModule: string;
};

export const COMPLIANCE_OBLIGATIONS: ComplianceObligationRow[] = [];

export type CalendarScheduleItem = {
	id: string;
	title: string;
	program: Exclude<ComplianceProgramKey, "overdue">;
	obligationType: string;
	status: ObligationStatus;
	dueDate: string;
	owner: string;
	obligationId?: string;
	/** Parsed from dueDate — month is 0-indexed */
	year: number;
	month: number;
	day: number;
};

const CALENDAR_WEEKDAY_LABELS = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
] as const;

/** Week of June 13–19, 2027 (contains "today" June 16) */
export const COMPLIANCE_CALENDAR_WEEK_START = { year: 2027, month: 5, day: 13 };

function parseDueDate(dueDate: string) {
	const [mm, dd, yyyy] = dueDate.split("/").map(Number);
	return { year: yyyy!, month: mm! - 1, day: dd! };
}

/** Extra calendar-only items for days with events but no table obligation */
const COMPLIANCE_CALENDAR_EXTRA: Omit<
	CalendarScheduleItem,
	"year" | "month" | "day"
>[] = [];

function toScheduleItem(
	row: ComplianceObligationRow | (typeof COMPLIANCE_CALENDAR_EXTRA)[number]
): CalendarScheduleItem {
	const parsed = parseDueDate(row.dueDate);
	return {
		id: row.id,
		title: row.title,
		program: row.program,
		obligationType: row.obligationType,
		status: row.status,
		dueDate: row.dueDate,
		owner: row.owner,
		obligationId: "id" in row && row.id.startsWith("ob-") ? row.id : undefined,
		...parsed,
	};
}

export const COMPLIANCE_CALENDAR_SCHEDULE: CalendarScheduleItem[] = [];

export function complianceProgramPillClass(
	program: Exclude<ComplianceProgramKey, "overdue">
) {
	switch (program) {
		case "cms-edge":
			return "border-sky-200 bg-sky-50 text-sky-800";
		case "medicaid":
			return "border-emerald-200 bg-emerald-50 text-emerald-800";
		case "medicare":
			return "border-orange-200 bg-orange-50 text-orange-800";
		case "quality":
			return "border-violet-200 bg-violet-50 text-violet-800";
		case "other":
			return "border-teal-200 bg-teal-50 text-teal-800";
	}
}

export function complianceStatusPillClass(status: ObligationStatus) {
	switch (status) {
		case "Overdue":
			return "border-red-200 bg-red-50 text-red-700";
		case "At Risk":
			return "border-amber-200 bg-amber-50 text-amber-800";
		case "Upcoming":
			return "border-sky-200 bg-sky-50 text-sky-800";
		case "Completed":
			return "border-emerald-200 bg-emerald-50 text-emerald-800";
	}
}

export type ObligationDetail = ComplianceObligationRow & {
	reportingPeriod: string;
	regulatoryAgency: string;
	internalDueDate: string;
	priority: "High" | "Medium" | "Low";
	regulatoryReference: string;
	lastUpdated: string;
	description: string;
	notes: string;
	relatedSubmission: string;
	latestResponse: string;
	openIssues: string;
	documents: {
		id: string;
		title: string;
		meta: string;
		iconTone: string;
	}[];
	activity: {
		id: string;
		timestamp: string;
		action: string;
		actor: string;
	}[];
};

const OBLIGATION_DETAILS: Record<string, ObligationDetail> = {};

export type UpcomingDeadline = {
	id: string;
	month: string;
	day: number;
	title: string;
	program: Exclude<ComplianceProgramKey, "overdue">;
	obligationType: string;
	badge: string;
	badgeTone: "overdue" | "warning" | "info";
	dotColor: string;
	obligationId: string;
};

export const COMPLIANCE_UPCOMING_DEADLINES: UpcomingDeadline[] = [];

export function getObligationDetail(id: string): ObligationDetail | undefined {
	if (OBLIGATION_DETAILS[id]) return OBLIGATION_DETAILS[id];
	const row = COMPLIANCE_OBLIGATIONS.find((o) => o.id === id);
	if (!row) return undefined;
	return {
		...row,
		reportingPeriod: "Q2 2027",
		regulatoryAgency: COMPLIANCE_PROGRAM_LABELS[row.program],
		internalDueDate: row.dueDate,
		priority: row.status === "At Risk" ? "High" : "Medium",
		regulatoryReference: "Regulatory reference pending",
		lastUpdated: "06/14/2027 8:00 AM",
		description: `Complete ${row.obligationType.toLowerCase()} for ${row.title}.`,
		notes: "No additional notes.",
		relatedSubmission: "—",
		latestResponse: "—",
		openIssues: "0 open issues",
		documents: [],
		activity: [
			{
				id: "a1",
				timestamp: "06/14/2027\n8:00 AM",
				action: "Obligation created",
				actor: "System",
			},
		],
	};
}

export function getObligationRow(id: string) {
	return COMPLIANCE_OBLIGATIONS.find((o) => o.id === id);
}

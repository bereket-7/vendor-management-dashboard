export type CmsEdgeTabId =
	| "overview"
	| "members-enrollment"
	| "providers"
	| "claims"
	| "file-generation"
	| "submissions"
	| "cms-responses"
	| "exceptions"
	| "reconciliation"
	| "configuration";

export const CMS_EDGE_TABS: { id: CmsEdgeTabId; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "members-enrollment", label: "Members & Enrollment" },
	{ id: "providers", label: "Providers" },
	{ id: "claims", label: "Claims" },
	{ id: "file-generation", label: "File Generation" },
	{ id: "submissions", label: "Submissions" },
	{ id: "cms-responses", label: "CMS Responses" },
	{ id: "exceptions", label: "Exceptions" },
	{ id: "reconciliation", label: "Reconciliation" },
	{ id: "configuration", label: "Configuration" },
];

export const CMS_EDGE_REPORTING_PERIODS = [
	{
		value: "q2-2027",
		label: "Q2 2027 (Apr 1 – Jun 30, 2027)",
	},
	{
		value: "q1-2027",
		label: "Q1 2027 (Jan 1 – Mar 31, 2027)",
	},
	{
		value: "q4-2026",
		label: "Q4 2026 (Oct 1 – Dec 31, 2026)",
	},
];

export type AuditRequestStatus = "Completed" | "In Progress" | "Overdue";
export type AuditPriority = "High" | "Medium" | "Low";
export type AuditReportStatus = "Received" | "Final";

export type AuditRequestRow = {
	id: string;
	auditType: string;
	requestDate: string;
	relatedSubmission: string;
	auditPeriod: string;
	dueDate: string;
	status: AuditRequestStatus;
	priority: AuditPriority;
	requestedRecords: number;
};

export type AuditReportRow = {
	id: string;
	auditId: string;
	reportType: string;
	receivedDate: string;
	relatedSubmission: string;
	recordsReviewed: number;
	status: AuditReportStatus;
};

export type AuditFindingRow = {
	severity: "High" | "Medium" | "Low" | "Informational";
	count: number;
	percent: number;
	status: "Open" | "In Progress" | "Closed";
};

export type AuditActivityRow = {
	id: string;
	dateTime: string;
	activity: string;
	auditId: string;
	relatedSubmission: string;
	user: string;
	details: string;
};

export const CMS_EDGE_AUDIT_KPIS = {
	totalRequests: 8,
	completed: { count: 5, percent: 62.5 },
	inProgress: { count: 2, percent: 25 },
	overdue: { count: 1, percent: 12.5 },
	reportsReceived: 6,
	recordsReviewed: 152_430,
};

export const CMS_EDGE_AUDIT_STATUS_MIX = [
	{ name: "Completed", value: 5, color: "#22c55e" },
	{ name: "In Progress", value: 2, color: "#f59e0b" },
	{ name: "Overdue", value: 1, color: "#ef4444" },
];

export const CMS_EDGE_AUDIT_SLA = [
	{
		label: "On Time",
		count: 5,
		percent: 62.5,
		tone: "text-emerald-600",
		bg: "bg-emerald-50",
	},
	{
		label: "Due Soon",
		count: 1,
		percent: 12.5,
		tone: "text-amber-600",
		bg: "bg-amber-50",
	},
	{
		label: "Overdue",
		count: 1,
		percent: 12.5,
		tone: "text-red-600",
		bg: "bg-red-50",
	},
	{
		label: "No Due Date",
		count: 1,
		percent: 12.5,
		tone: "text-muted-foreground",
		bg: "bg-muted/40",
	},
];

export const CMS_EDGE_AUDIT_FINDINGS_TOTAL = 50;

export const CMS_EDGE_AUDIT_REQUESTS: AuditRequestRow[] = [
	{
		id: "AUD-2027-0721-001",
		auditType: "EDGE Data Validation",
		requestDate: "Jul 21, 2027 10:15 AM",
		relatedSubmission: "EDGE_Q2_2027_Final",
		auditPeriod: "Q2 2027",
		dueDate: "Aug 20, 2027",
		status: "Completed",
		priority: "High",
		requestedRecords: 24_500,
	},
	{
		id: "AUD-2027-0721-002",
		auditType: "Payment Accuracy",
		requestDate: "Jul 21, 2027 10:15 AM",
		relatedSubmission: "EDGE_Q2_2027_Final",
		auditPeriod: "Q2 2027",
		dueDate: "Aug 20, 2027",
		status: "In Progress",
		priority: "Medium",
		requestedRecords: 18_320,
	},
	{
		id: "AUD-2027-0721-003",
		auditType: "Risk Adjustment",
		requestDate: "Jul 21, 2027 10:15 AM",
		relatedSubmission: "EDGE_Q2_2027_Final",
		auditPeriod: "Q2 2027",
		dueDate: "Aug 20, 2027",
		status: "Overdue",
		priority: "High",
		requestedRecords: 12_105,
	},
	{
		id: "AUD-2027-0715-004",
		auditType: "EDGE Data Validation",
		requestDate: "Jul 15, 2027 09:30 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		auditPeriod: "Q1 2027",
		dueDate: "Aug 14, 2027",
		status: "Completed",
		priority: "Low",
		requestedRecords: 9_870,
	},
	{
		id: "AUD-2027-0715-005",
		auditType: "Payment Accuracy",
		requestDate: "Jul 15, 2027 09:30 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		auditPeriod: "Q1 2027",
		dueDate: "Aug 14, 2027",
		status: "Completed",
		priority: "Medium",
		requestedRecords: 15_640,
	},
	{
		id: "AUD-2027-0701-006",
		auditType: "EDGE Data Validation",
		requestDate: "Jul 1, 2027 08:00 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		auditPeriod: "Q1 2027",
		dueDate: "Jul 31, 2027",
		status: "Completed",
		priority: "High",
		requestedRecords: 22_310,
	},
	{
		id: "AUD-2027-0701-007",
		auditType: "Risk Adjustment",
		requestDate: "Jul 1, 2027 08:00 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		auditPeriod: "Q1 2027",
		dueDate: "Jul 31, 2027",
		status: "In Progress",
		priority: "Medium",
		requestedRecords: 11_980,
	},
	{
		id: "AUD-2027-0701-008",
		auditType: "Payment Accuracy",
		requestDate: "Jul 1, 2027 08:00 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		auditPeriod: "Q1 2027",
		dueDate: "Jul 31, 2027",
		status: "Completed",
		priority: "Low",
		requestedRecords: 8_705,
	},
];

export const CMS_EDGE_AUDIT_REPORTS: AuditReportRow[] = [
	{
		id: "RPT-2027-0721-001",
		auditId: "AUD-2027-0721-001",
		reportType: "Preliminary Findings",
		receivedDate: "Jul 21, 2027 10:15 AM",
		relatedSubmission: "EDGE_Q2_2027_Final",
		recordsReviewed: 24_500,
		status: "Received",
	},
	{
		id: "RPT-2027-0721-002",
		auditId: "AUD-2027-0721-002",
		reportType: "Final Audit Report",
		receivedDate: "Jul 21, 2027 10:15 AM",
		relatedSubmission: "EDGE_Q2_2027_Final",
		recordsReviewed: 18_320,
		status: "Final",
	},
	{
		id: "RPT-2027-0715-003",
		auditId: "AUD-2027-0715-004",
		reportType: "Preliminary Findings",
		receivedDate: "Jul 15, 2027 09:30 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		recordsReviewed: 9_870,
		status: "Received",
	},
	{
		id: "RPT-2027-0715-004",
		auditId: "AUD-2027-0715-005",
		reportType: "Final Audit Report",
		receivedDate: "Jul 15, 2027 09:30 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		recordsReviewed: 15_640,
		status: "Final",
	},
	{
		id: "RPT-2027-0701-005",
		auditId: "AUD-2027-0701-006",
		reportType: "Preliminary Findings",
		receivedDate: "Jul 1, 2027 08:00 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		recordsReviewed: 22_310,
		status: "Received",
	},
	{
		id: "RPT-2027-0701-006",
		auditId: "AUD-2027-0701-008",
		reportType: "Final Audit Report",
		receivedDate: "Jul 1, 2027 08:00 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
		recordsReviewed: 8_705,
		status: "Final",
	},
];

export const CMS_EDGE_AUDIT_FINDINGS: AuditFindingRow[] = [
	{ severity: "High", count: 15, percent: 30, status: "Open" },
	{ severity: "Medium", count: 20, percent: 40, status: "In Progress" },
	{ severity: "Low", count: 10, percent: 20, status: "Closed" },
	{ severity: "Informational", count: 5, percent: 10, status: "Closed" },
];

export const CMS_EDGE_AUDIT_ACTIVITY: AuditActivityRow[] = [
	{
		id: "act-1",
		dateTime: "Jul 21, 2027 10:15 AM",
		activity: "Audit request received from CMS",
		auditId: "AUD-2027-0721-001",
		relatedSubmission: "EDGE_Q2_2027_Final",
		user: "CMS EDGE System",
		details: "EDGE Data Validation audit initiated",
	},
	{
		id: "act-2",
		dateTime: "Jul 21, 2027 10:15 AM",
		activity: "Preliminary findings report uploaded",
		auditId: "AUD-2027-0721-001",
		relatedSubmission: "EDGE_Q2_2027_Final",
		user: "CMS EDGE System",
		details: "RPT-2027-0721-001 available for review",
	},
	{
		id: "act-3",
		dateTime: "Jul 21, 2027 10:15 AM",
		activity: "Audit marked in progress",
		auditId: "AUD-2027-0721-002",
		relatedSubmission: "EDGE_Q2_2027_Final",
		user: "Admin User",
		details: "Payment accuracy review started",
	},
	{
		id: "act-4",
		dateTime: "Jul 21, 2027 10:15 AM",
		activity: "Audit due date exceeded",
		auditId: "AUD-2027-0721-003",
		relatedSubmission: "EDGE_Q2_2027_Final",
		user: "CMS EDGE System",
		details: "Risk adjustment audit overdue",
	},
	{
		id: "act-5",
		dateTime: "Jul 15, 2027 09:30 AM",
		activity: "Final audit report received",
		auditId: "AUD-2027-0715-005",
		relatedSubmission: "EDGE_Q1_2027_Final",
		user: "CMS EDGE System",
		details: "RPT-2027-0715-004 marked final",
	},
];

export const SEVERITY_DOT: Record<AuditFindingRow["severity"], string> = {
	High: "bg-red-500",
	Medium: "bg-amber-500",
	Low: "bg-emerald-500",
	Informational: "bg-sky-500",
};

export const PRIORITY_DOT: Record<AuditPriority, string> = {
	High: "bg-red-500",
	Medium: "bg-amber-500",
	Low: "bg-emerald-500",
};

export const AUDIT_STATUS_STYLES: Record<AuditRequestStatus, string> = {
	Completed:
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	"In Progress":
		"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	Overdue:
		"border-red-200/80 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

export const REPORT_STATUS_STYLES: Record<AuditReportStatus, string> = {
	Received:
		"border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	Final:
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

export const FINDING_STATUS_STYLES: Record<AuditFindingRow["status"], string> =
	{
		Open: "border-red-200/80 bg-red-50 text-red-800",
		"In Progress": "border-amber-200/80 bg-amber-50 text-amber-900",
		Closed: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	};

export const CMS_EDGE_TAB_META: Record<
	CmsEdgeTabId,
	{ title: string; description: string }
> = {
	overview: {
		title: "Overview",
		description: "Submission health, validations, and reporting activity.",
	},
	"members-enrollment": {
		title: "Members & Enrollment",
		description: "Enrollee records staged for EDGE reporting.",
	},
	providers: {
		title: "Providers",
		description: "Provider identifiers referenced by EDGE claims.",
	},
	claims: {
		title: "Claims",
		description: "Medical and pharmacy claims staged for EDGE files.",
	},
	"file-generation": {
		title: "File Generation",
		description: "Enrollment, medical, pharmacy, and supplemental files.",
	},
	submissions: {
		title: "Submission Tracking",
		description: "Monitor submissions across Test, Validation, and Production.",
	},
	"cms-responses": {
		title: "CMS Responses",
		description: "CMS responses and issuer return files.",
	},
	exceptions: {
		title: "Exceptions",
		description: "Rejected records and validation errors.",
	},
	reconciliation: {
		title: "Reconciliation",
		description: "Submitted volumes vs CMS-accepted counts.",
	},
	configuration: {
		title: "Configuration",
		description: "Issuer IDs, calendars, and submission settings.",
	},
};

// ─── Overview tab ───────────────────────────────────────────────────────────

export type OverviewSubmissionStatus = "Accepted" | "Pending" | "Rejected";
export type OverviewResponseStatus = "Received" | "Pending" | "Processed";

export const CMS_EDGE_OVERVIEW_KPIS = {
	reportingPeriod: "Q2 2027",
	reportingPeriodRange: "Apr 1 – Jun 30, 2027",
	submissionStatus: "Accepted" as OverviewSubmissionStatus,
	lastCmsResponse: "Jul 27, 2027 11:44 AM ET",
	responsesReceived: 5,
	fmStatus: "In Progress",
	auditStatus: "2 Open",
};

export const CMS_EDGE_OVERVIEW_SUBMISSION_HISTORY = [
	{
		id: "sub-1",
		submissionType: "Final Submission",
		reportingPeriod: "Q2 2027",
		submittedDate: "Jul 21, 2027 09:45 AM",
		status: "Accepted" as OverviewSubmissionStatus,
		cmsResponse: "Yes",
		submittedBy: "Admin User",
	},
	{
		id: "sub-2",
		submissionType: "Preliminary Submission",
		reportingPeriod: "Q2 2027",
		submittedDate: "Jul 14, 2027 02:30 PM",
		status: "Accepted" as OverviewSubmissionStatus,
		cmsResponse: "Yes",
		submittedBy: "Admin User",
	},
	{
		id: "sub-3",
		submissionType: "Final Submission",
		reportingPeriod: "Q1 2027",
		submittedDate: "Apr 28, 2027 10:15 AM",
		status: "Accepted" as OverviewSubmissionStatus,
		cmsResponse: "Yes",
		submittedBy: "System User",
	},
	{
		id: "sub-4",
		submissionType: "Preliminary Submission",
		reportingPeriod: "Q1 2027",
		submittedDate: "Apr 21, 2027 11:00 AM",
		status: "Pending" as OverviewSubmissionStatus,
		cmsResponse: "No",
		submittedBy: "Admin User",
	},
];

export const CMS_EDGE_OVERVIEW_CMS_RESPONSES = [
	{
		id: "resp-1",
		responseFile: "EDGE_Q2_2027_Validation",
		responseType: "Validation Response",
		dateReceived: "Jul 21, 2027 10:02 AM",
		status: "Processed" as OverviewResponseStatus,
	},
	{
		id: "resp-2",
		responseFile: "EDGE_Q2_2027_Acceptance",
		responseType: "Acceptance Report",
		dateReceived: "Jul 27, 2027 11:44 AM",
		status: "Received" as OverviewResponseStatus,
	},
	{
		id: "resp-3",
		responseFile: "EDGE_Q2_2027_Payment",
		responseType: "Payment Report",
		dateReceived: "Jul 27, 2027 11:44 AM",
		status: "Received" as OverviewResponseStatus,
	},
	{
		id: "resp-4",
		responseFile: "EDGE_Q1_2027_Validation",
		responseType: "Validation Response",
		dateReceived: "Apr 28, 2027 09:20 AM",
		status: "Processed" as OverviewResponseStatus,
	},
];

export const CMS_EDGE_OVERVIEW_VALIDATION = [
	{
		recordType: "Member Enrollment",
		accepted: 12_450,
		rejected: 23,
		warnings: 87,
	},
	{
		recordType: "Risk Adjustment",
		accepted: 8_920,
		rejected: 12,
		warnings: 45,
	},
	{
		recordType: "Payment Data",
		accepted: 15_680,
		rejected: 8,
		warnings: 32,
	},
	{
		recordType: "Provider Data",
		accepted: 4_210,
		rejected: 5,
		warnings: 18,
	},
];

export const CMS_EDGE_OVERVIEW_FM_ITEMS = [
	{
		label: "FM Requests",
		count: 2,
		status: "Pending",
		statusStyle: "border-amber-200/80 bg-amber-50 text-amber-900",
		icon: "request" as const,
	},
	{
		label: "FM Responses",
		count: 5,
		status: "Open",
		statusStyle: "border-sky-200/80 bg-sky-50 text-sky-900",
		icon: "response" as const,
	},
	{
		label: "Payment Reconciliation",
		count: 1,
		status: "Pending",
		statusStyle: "border-amber-200/80 bg-amber-50 text-amber-900",
		icon: "reconcile" as const,
	},
	{
		label: "Archive Status",
		count: 0,
		status: "Not Archived",
		statusStyle: "border-red-200/80 bg-red-50 text-red-800",
		icon: "archive" as const,
	},
];

export const CMS_EDGE_OVERVIEW_AUDIT_SUMMARY = [
	{
		auditType: "EDGE Data Validation",
		status: "Completed" as AuditRequestStatus,
		dueDate: "Aug 20, 2027",
		owner: "CMS EDGE System",
	},
	{
		auditType: "Payment Accuracy",
		status: "In Progress" as AuditRequestStatus,
		dueDate: "Aug 20, 2027",
		owner: "Admin User",
	},
	{
		auditType: "Risk Adjustment",
		status: "Overdue" as AuditRequestStatus,
		dueDate: "Aug 20, 2027",
		owner: "Admin User",
	},
];

export const CMS_EDGE_OVERVIEW_REPORTING_CYCLE = [
	{
		quarter: "Q2 2027",
		requiredFiles: 4,
		submitted: 4,
		outstanding: 0,
		lastActivity: "Jul 27, 2027",
		owner: "Admin User",
	},
	{
		quarter: "Q1 2027",
		requiredFiles: 4,
		submitted: 3,
		outstanding: 1,
		lastActivity: "Apr 28, 2027",
		owner: "Admin User",
	},
	{
		quarter: "Q4 2026",
		requiredFiles: 4,
		submitted: 4,
		outstanding: 0,
		lastActivity: "Jan 28, 2027",
		owner: "System User",
	},
];

export type TimelineStageState = "done" | "current" | "pending" | "future";

export const CMS_EDGE_OVERVIEW_TIMELINE = [
	{
		label: "Initial Submission",
		date: "Jul 21, 2027",
		state: "done" as TimelineStageState,
	},
	{
		label: "Validation Report",
		date: "Jul 21, 2027",
		state: "done" as TimelineStageState,
	},
	{
		label: "Acceptance Report",
		date: "Jul 27, 2027",
		state: "current" as TimelineStageState,
	},
	{
		label: "Financial Management",
		date: "Pending",
		state: "pending" as TimelineStageState,
	},
	{
		label: "Archive",
		date: "—",
		state: "future" as TimelineStageState,
	},
];

export const CMS_EDGE_OVERVIEW_DOCUMENT_COUNTS = [
	{ label: "Submission Reports", count: 12 },
	{ label: "Validation Responses", count: 8 },
	{ label: "Payment Reports", count: 5 },
	{ label: "Audit Reports", count: 6 },
	{ label: "Supporting Documents", count: 24 },
];

export const OVERVIEW_SUBMISSION_STATUS_STYLES: Record<
	OverviewSubmissionStatus,
	string
> = {
	Accepted:
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	Pending:
		"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	Rejected:
		"border-red-200/80 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

export const OVERVIEW_RESPONSE_STATUS_STYLES: Record<
	OverviewResponseStatus,
	string
> = {
	Received:
		"border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
	Pending:
		"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	Processed:
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

// ─── Responses tab ──────────────────────────────────────────────────────────

export type CmsResponseStatus = "Completed" | "Pending" | "Error";

export type CmsResponseRow = {
	id: string;
	responseFile: string;
	responseType: string;
	relatedSubmission: string;
	dateReceived: string;
	status: CmsResponseStatus;
	records: number;
};

export const CMS_EDGE_RESPONSE_KPIS = {
	total: 8,
	completed: { count: 6, percent: 75 },
	pending: { count: 1, percent: 12.5 },
	errors: { count: 1, percent: 12.5 },
	lastReceived: "Jul 27, 2027 11:44 AM ET",
};

export const CMS_EDGE_RESPONSES_LIST: CmsResponseRow[] = [
	{
		id: "r-1",
		responseFile: "EDGE_Q2_2027_Acceptance",
		responseType: "Acceptance Report",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateReceived: "Jul 27, 2027 11:44 AM",
		status: "Completed",
		records: 41_250,
	},
	{
		id: "r-2",
		responseFile: "EDGE_Q2_2027_Validation",
		responseType: "Validation Response",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateReceived: "Jul 21, 2027 10:02 AM",
		status: "Completed",
		records: 41_260,
	},
	{
		id: "r-3",
		responseFile: "EDGE_Q2_2027_Payment",
		responseType: "Payment Report",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateReceived: "Jul 27, 2027 11:44 AM",
		status: "Completed",
		records: 18_420,
	},
	{
		id: "r-4",
		responseFile: "EDGE_Q2_2027_Withhold",
		responseType: "Withhold Report",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateReceived: "Jul 27, 2027 11:45 AM",
		status: "Pending",
		records: 2_180,
	},
	{
		id: "r-5",
		responseFile: "EDGE_Q1_2027_Acceptance",
		responseType: "Acceptance Report",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateReceived: "Apr 28, 2027 09:20 AM",
		status: "Completed",
		records: 39_870,
	},
	{
		id: "r-6",
		responseFile: "EDGE_Q1_2027_Validation",
		responseType: "Validation Response",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateReceived: "Apr 28, 2027 09:18 AM",
		status: "Completed",
		records: 39_880,
	},
	{
		id: "r-7",
		responseFile: "EDGE_Q1_2027_Payment",
		responseType: "Payment Report",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateReceived: "Apr 28, 2027 09:22 AM",
		status: "Completed",
		records: 17_650,
	},
	{
		id: "r-8",
		responseFile: "EDGE_Q4_2026_Validation_Err",
		responseType: "Validation Response",
		relatedSubmission: "EDGE_Q4_2026_Final",
		dateReceived: "Jan 28, 2027 02:10 PM",
		status: "Error",
		records: 0,
	},
];

export const CMS_EDGE_RESPONSE_SELECTED = {
	responseFile: "EDGE_Q2_2027_Acceptance",
	responseType: "Acceptance Report",
	relatedSubmission: "EDGE_Q2_2027_Final",
	dateReceived: "Jul 27, 2027 11:44 AM ET",
	status: "Completed" as CmsResponseStatus,
	records: 41_250,
	fileName: "EDGE_Q2_2027_Acceptance.xml",
	fileSize: "3.82 MB",
	fileFormat: "XML",
	description:
		"CMS acceptance report for Q2 2027 final submission. All required records validated successfully.",
};

export const CMS_EDGE_RESPONSE_TYPE_MIX = [
	{ name: "Validation Response", count: 3, color: "#3b82f6", pct: 37.5 },
	{ name: "Acceptance Report", count: 2, color: "#22c55e", pct: 25 },
	{ name: "Payment Report", count: 2, color: "#8b5cf6", pct: 25 },
	{ name: "Withhold Report", count: 1, color: "#f59e0b", pct: 12.5 },
];

export const CMS_EDGE_RESPONSE_STATUS_TREND = [
	{ quarter: "Q3 2026", completed: 5, pending: 1, errors: 0 },
	{ quarter: "Q4 2026", completed: 4, pending: 0, errors: 1 },
	{ quarter: "Q1 2027", completed: 6, pending: 0, errors: 0 },
	{ quarter: "Q2 2027", completed: 6, pending: 1, errors: 0 },
];

export const CMS_RESPONSE_STATUS_STYLES: Record<CmsResponseStatus, string> = {
	Completed:
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	Pending:
		"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	Error:
		"border-red-200/80 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

// ─── Submissions tab ────────────────────────────────────────────────────────

export type SubmissionStatus = "Accepted" | "Processing" | "Failed";
export type SubmissionFileType =
	| "Enrollment"
	| "Medical"
	| "Pharmacy"
	| "Supplemental Diagnosis";
export type SubmissionEnvironment = "Test" | "Validation" | "Production";

export type SubmissionHistoryRow = {
	id: string;
	fileType: SubmissionFileType;
	environment: SubmissionEnvironment;
	reportingPeriod: string;
	submittedDateTime: string;
	status: SubmissionStatus;
	records: number;
	submittedBy: string;
};

export type SubmissionCmsResponseItem = {
	label: string;
	status: "Received" | "Pending" | "Not Available";
};

export type SubmissionNoteRow = {
	id: string;
	dateTime: string;
	source: string;
	note: string;
};

export type SubmissionProcessStep = {
	id: string;
	title: string;
	description: string;
};

export const CMS_EDGE_SUBMISSION_FILE_TYPES: SubmissionFileType[] = [
	"Enrollment",
	"Medical",
	"Pharmacy",
	"Supplemental Diagnosis",
];

export const CMS_EDGE_SUBMISSION_ENVIRONMENTS: SubmissionEnvironment[] = [
	"Test",
	"Validation",
	"Production",
];

export const CMS_EDGE_SUBMISSION_STATUSES: SubmissionStatus[] = [
	"Accepted",
	"Processing",
	"Failed",
];

export const CMS_EDGE_SUBMISSION_KPIS = {
	total: 12,
	accepted: 8,
	inProgress: 1,
	failed: 3,
};

export const CMS_EDGE_SUBMISSION_HISTORY: SubmissionHistoryRow[] = [
	{
		id: "SUB-2027-000001",
		fileType: "Enrollment",
		environment: "Test",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/01/2027 09:15 AM",
		status: "Accepted",
		records: 12_524,
		submittedBy: "jdoe@bhphealth.com",
	},
	{
		id: "SUB-2027-000002",
		fileType: "Medical",
		environment: "Validation",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/02/2027 11:42 AM",
		status: "Accepted",
		records: 48_210,
		submittedBy: "asmith@bhphealth.com",
	},
	{
		id: "SUB-2027-000003",
		fileType: "Pharmacy",
		environment: "Production",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/03/2027 02:18 PM",
		status: "Failed",
		records: 31_045,
		submittedBy: "jdoe@bhphealth.com",
	},
	{
		id: "SUB-2027-000004",
		fileType: "Supplemental Diagnosis",
		environment: "Test",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/04/2027 08:05 AM",
		status: "Accepted",
		records: 6_812,
		submittedBy: "mlee@bhphealth.com",
	},
	{
		id: "SUB-2027-000005",
		fileType: "Enrollment",
		environment: "Production",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/05/2027 10:30 AM",
		status: "Processing",
		records: 12_640,
		submittedBy: "asmith@bhphealth.com",
	},
	{
		id: "SUB-2027-000006",
		fileType: "Medical",
		environment: "Test",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/06/2027 01:12 PM",
		status: "Accepted",
		records: 47_980,
		submittedBy: "jdoe@bhphealth.com",
	},
	{
		id: "SUB-2027-000007",
		fileType: "Pharmacy",
		environment: "Validation",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/07/2027 03:45 PM",
		status: "Failed",
		records: 30_922,
		submittedBy: "mlee@bhphealth.com",
	},
	{
		id: "SUB-2027-000008",
		fileType: "Enrollment",
		environment: "Validation",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/08/2027 09:20 AM",
		status: "Accepted",
		records: 12_588,
		submittedBy: "asmith@bhphealth.com",
	},
	{
		id: "SUB-2027-000009",
		fileType: "Medical",
		environment: "Production",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/09/2027 11:05 AM",
		status: "Accepted",
		records: 49_104,
		submittedBy: "jdoe@bhphealth.com",
	},
	{
		id: "SUB-2027-000010",
		fileType: "Supplemental Diagnosis",
		environment: "Production",
		reportingPeriod: "Q2 2027",
		submittedDateTime: "05/10/2027 04:22 PM",
		status: "Failed",
		records: 7_015,
		submittedBy: "mlee@bhphealth.com",
	},
	{
		id: "SUB-2027-000011",
		fileType: "Pharmacy",
		environment: "Test",
		reportingPeriod: "Q1 2027",
		submittedDateTime: "04/18/2027 10:48 AM",
		status: "Accepted",
		records: 29_774,
		submittedBy: "asmith@bhphealth.com",
	},
	{
		id: "SUB-2027-000012",
		fileType: "Enrollment",
		environment: "Production",
		reportingPeriod: "Q1 2027",
		submittedDateTime: "04/22/2027 02:55 PM",
		status: "Accepted",
		records: 12_301,
		submittedBy: "jdoe@bhphealth.com",
	},
];

export const CMS_EDGE_SUBMISSION_PROCESS_STEPS: SubmissionProcessStep[] = [
	{
		id: "generated",
		title: "Generated",
		description: "File generated successfully",
	},
	{
		id: "submitted",
		title: "Submitted",
		description: "File submitted to CMS EDGE",
	},
	{
		id: "cms-processing",
		title: "CMS Processing",
		description: "File is being processed by CMS",
	},
	{
		id: "response-received",
		title: "Response Received",
		description: "CMS response received",
	},
];

export const CMS_EDGE_SUBMISSION_DETAILS: Record<
	string,
	{
		submissionType: string;
		reportingPeriod: string;
		fileName: string;
		submittedDateTime: string;
		submittedBy: string;
		status: SubmissionStatus;
		totalRecords: number;
		acceptedRecords: number;
		acceptedPercent: number;
		rejectedRecords: number;
		rejectedPercent: number;
		warnings: number;
		cmsResponses: SubmissionCmsResponseItem[];
	}
> = {
	"SUB-2027-000001": {
		submissionType: "Enrollment",
		reportingPeriod: "Q2 2027",
		fileName: "EDGE_Q2_2027_Enrollment.xml",
		submittedDateTime: "05/01/2027 09:15 AM ET",
		submittedBy: "jdoe@bhphealth.com",
		status: "Accepted",
		totalRecords: 12_524,
		acceptedRecords: 12_490,
		acceptedPercent: 99.7,
		rejectedRecords: 34,
		rejectedPercent: 0.3,
		warnings: 0,
		cmsResponses: [
			{ label: "Acceptance Report", status: "Received" },
			{ label: "Validation Report", status: "Received" },
			{ label: "Error Report", status: "Not Available" },
		],
	},
};

export const CMS_EDGE_SUBMISSION_NOTES: SubmissionNoteRow[] = [
	{
		id: "note-1",
		dateTime: "05/01/2027 09:16 AM",
		source: "System",
		note: "Enrollment file queued for CMS EDGE Test environment.",
	},
	{
		id: "note-2",
		dateTime: "05/01/2027 10:02 AM",
		source: "jdoe@bhphealth.com",
		note: "Member counts reconciled against enrollment snapshot.",
	},
	{
		id: "note-3",
		dateTime: "05/01/2027 11:40 AM",
		source: "System",
		note: "CMS acceptance report received for SUB-2027-000001.",
	},
];

export const SUBMISSION_STATUS_STYLES: Record<SubmissionStatus, string> = {
	Accepted:
		"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
	Processing:
		"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
	Failed: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

export const SUBMISSION_CMS_RESPONSE_STYLES = {
	Received: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Pending: "border-amber-200/80 bg-amber-50 text-amber-900",
	"Not Available": "border-border/70 bg-muted/40 text-muted-foreground",
};

// ─── Validations tab ────────────────────────────────────────────────────────

export type ValidationRunStatus = "Completed" | "Pending" | "Error";

export type ValidationRecordTypeRow = {
	recordType: string;
	accepted: number;
	rejected: number;
	warnings: number;
};

export type ValidationExceptionRow = {
	id: string;
	errorCode: string;
	recordType: string;
	description: string;
	relatedSubmission: string;
	dateTime: string;
	severity: "Error" | "Warning";
};

export const CMS_EDGE_VALIDATION_KPIS = {
	totalRecords: 41_260,
	accepted: { count: 41_148, percent: 99.73 },
	rejected: { count: 48, percent: 0.12 },
	warnings: { count: 182, percent: 0.44 },
	acceptanceRate: 99.73,
	lastValidation: "Jul 21, 2027 10:02 AM ET",
};

export const CMS_EDGE_VALIDATION_RUNS = [
	{
		id: "val-1",
		validationFile: "EDGE_Q2_2027_Validation",
		relatedSubmission: "EDGE_Q2_2027_Final",
		reportingPeriod: "Q2 2027",
		dateValidated: "Jul 21, 2027 10:02 AM",
		status: "Completed" as ValidationRunStatus,
		totalRecords: 41_260,
		accepted: 41_148,
		rejected: 48,
		warnings: 182,
	},
	{
		id: "val-2",
		validationFile: "EDGE_Q2_2027_Correction2_Val",
		relatedSubmission: "EDGE_Q2_2027_Final",
		reportingPeriod: "Q2 2027",
		dateValidated: "Jul 25, 2027 03:10 PM",
		status: "Completed" as ValidationRunStatus,
		totalRecords: 12_340,
		accepted: 12_298,
		rejected: 42,
		warnings: 0,
	},
	{
		id: "val-3",
		validationFile: "EDGE_Q1_2027_Validation",
		relatedSubmission: "EDGE_Q1_2027_Final",
		reportingPeriod: "Q1 2027",
		dateValidated: "Apr 28, 2027 09:18 AM",
		status: "Completed" as ValidationRunStatus,
		totalRecords: 39_880,
		accepted: 39_820,
		rejected: 35,
		warnings: 25,
	},
	{
		id: "val-4",
		validationFile: "EDGE_Q1_2027_Correction1_Val",
		relatedSubmission: "EDGE_Q1_2027_Final",
		reportingPeriod: "Q1 2027",
		dateValidated: "Apr 26, 2027 04:15 PM",
		status: "Pending" as ValidationRunStatus,
		totalRecords: 11_920,
		accepted: 11_890,
		rejected: 18,
		warnings: 12,
	},
	{
		id: "val-5",
		validationFile: "EDGE_Q4_2026_Validation",
		relatedSubmission: "EDGE_Q4_2026_Final",
		reportingPeriod: "Q4 2026",
		dateValidated: "Jan 28, 2027 09:30 AM",
		status: "Completed" as ValidationRunStatus,
		totalRecords: 38_420,
		accepted: 38_380,
		rejected: 22,
		warnings: 18,
	},
	{
		id: "val-6",
		validationFile: "EDGE_Q4_2026_Validation_Err",
		relatedSubmission: "EDGE_Q4_2026_Final",
		reportingPeriod: "Q4 2026",
		dateValidated: "Jan 28, 2027 02:10 PM",
		status: "Error" as ValidationRunStatus,
		totalRecords: 0,
		accepted: 0,
		rejected: 0,
		warnings: 0,
	},
];

export const CMS_EDGE_VALIDATION_RECORD_TYPES: ValidationRecordTypeRow[] = [
	{
		recordType: "Member Enrollment",
		accepted: 12_450,
		rejected: 23,
		warnings: 87,
	},
	{
		recordType: "Risk Adjustment",
		accepted: 8_920,
		rejected: 12,
		warnings: 45,
	},
	{ recordType: "Payment Data", accepted: 15_680, rejected: 8, warnings: 32 },
	{ recordType: "Provider Data", accepted: 4_210, rejected: 5, warnings: 18 },
];

export const CMS_EDGE_VALIDATION_SELECTED = {
	validationFile: "EDGE_Q2_2027_Validation",
	relatedSubmission: "EDGE_Q2_2027_Final",
	reportingPeriod: "Q2 2027",
	dateValidated: "Jul 21, 2027 10:02 AM ET",
	status: "Completed" as ValidationRunStatus,
	totalRecords: 41_260,
	accepted: 41_148,
	acceptedPercent: 99.73,
	rejected: 48,
	rejectedPercent: 0.12,
	warnings: 182,
	warningsPercent: 0.44,
	fileName: "EDGE_Q2_2027_Validation_Response.xlsx",
	fileSize: "1.82 MB",
};

export const CMS_EDGE_VALIDATION_RECORD_TYPE_MIX = [
	{ name: "Payment Data", count: 15_680, color: "#3b82f6", pct: 37.98 },
	{ name: "Member Enrollment", count: 12_450, color: "#22c55e", pct: 30.17 },
	{ name: "Risk Adjustment", count: 8_920, color: "#8b5cf6", pct: 21.62 },
	{ name: "Provider Data", count: 4_210, color: "#f59e0b", pct: 10.23 },
];

export const CMS_EDGE_VALIDATION_TREND = [
	{ quarter: "Q3 2026", accepted: 36_200, rejected: 52, warnings: 165 },
	{ quarter: "Q4 2026", accepted: 38_380, rejected: 22, warnings: 18 },
	{ quarter: "Q1 2027", accepted: 39_820, rejected: 35, warnings: 25 },
	{ quarter: "Q2 2027", accepted: 41_148, rejected: 48, warnings: 182 },
];

export const CMS_EDGE_VALIDATION_EXCEPTIONS: ValidationExceptionRow[] = [
	{
		id: "exc-1",
		errorCode: "VAL-1024",
		recordType: "Member Enrollment",
		description: "Invalid member identifier format",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 21, 2027 10:02 AM",
		severity: "Error",
	},
	{
		id: "exc-2",
		errorCode: "VAL-2048",
		recordType: "Payment Data",
		description: "Payment amount exceeds plan threshold",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 21, 2027 10:02 AM",
		severity: "Error",
	},
	{
		id: "exc-3",
		errorCode: "VAL-3012",
		recordType: "Risk Adjustment",
		description: "Missing risk score for enrolled member",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 21, 2027 10:02 AM",
		severity: "Warning",
	},
	{
		id: "exc-4",
		errorCode: "VAL-1024",
		recordType: "Member Enrollment",
		description: "Duplicate enrollment record detected",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 25, 2027 03:10 PM",
		severity: "Error",
	},
	{
		id: "exc-5",
		errorCode: "VAL-4010",
		recordType: "Provider Data",
		description: "NPI not found in provider registry",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateTime: "Apr 28, 2027 09:18 AM",
		severity: "Warning",
	},
];

export const VALIDATION_RUN_STATUS_STYLES: Record<ValidationRunStatus, string> =
	{
		Completed:
			"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
		Pending:
			"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
		Error:
			"border-red-200/80 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
	};

export const VALIDATION_SEVERITY_STYLES = {
	Error: "border-red-200/80 bg-red-50 text-red-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
};

// ——— Internal / External validation sub-tabs ———

export type InternalFileValidationStatus = "Passed" | "Failed";

export type RecordValidationSeverity = "High" | "Medium" | "Low";

export type RecordResolutionStatus =
	| "Open"
	| "In Review"
	| "Corrected"
	| "Resubmitted"
	| "Closed";

export const INTERNAL_FILE_STATUS_STYLES: Record<
	InternalFileValidationStatus,
	string
> = {
	Passed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Failed: "border-red-200 bg-red-50 text-red-700",
};

export const RECORD_SEVERITY_STYLES: Record<RecordValidationSeverity, string> =
	{
		High: "border-red-200 bg-red-50 text-red-700",
		Medium: "border-amber-200 bg-amber-50 text-amber-800",
		Low: "border-sky-200 bg-sky-50 text-sky-800",
	};

export const RESOLUTION_STATUS_DOT: Record<RecordResolutionStatus, string> = {
	Open: "bg-red-500",
	"In Review": "bg-amber-500",
	Corrected: "bg-emerald-500",
	Resubmitted: "bg-sky-500",
	Closed: "bg-slate-500",
};

export const CMS_EDGE_INTERNAL_VALIDATION_SUMMARY = {
	filesPassed: 10,
	filesPassedPct: 83.33,
	filesFailed: 2,
	filesFailedPct: 16.67,
	recordsPassed: 2_340_915,
	recordsPassedPct: 95.52,
	recordsFailed: 76_512,
	recordsFailedPct: 3.12,
	warnings: 33_395,
	warningsPct: 1.36,
	totalFiles: 12,
	totalRecords: 2_450_822,
	lastValidation: "Jul 27, 2027 11:44 AM ET",
};

export const CMS_EDGE_INTERNAL_FILE_VALIDATION = [
	{
		id: "if-1",
		fileName: "EDGE_Q2_2027_MemberEnrollment.dat",
		fileType: "Member Enrollment",
		reportingPeriod: "Q2 2027",
		submittedDate: "Jul 26, 2027",
		records: 512_840,
		status: "Passed" as InternalFileValidationStatus,
		errors: 0,
		warnings: 1240,
		relatedSubmission: "EDGE_Q2_2027_Final",
	},
	{
		id: "if-2",
		fileName: "EDGE_Q2_2027_PaymentData.dat",
		fileType: "Payment Data",
		reportingPeriod: "Q2 2027",
		submittedDate: "Jul 26, 2027",
		records: 421_560,
		status: "Passed" as InternalFileValidationStatus,
		errors: 0,
		warnings: 892,
		relatedSubmission: "EDGE_Q2_2027_Final",
	},
	{
		id: "if-3",
		fileName: "EDGE_Q2_2027_RiskAdjustment.dat",
		fileType: "Risk Adjustment",
		reportingPeriod: "Q2 2027",
		submittedDate: "Jul 25, 2027",
		records: 389_104,
		status: "Passed" as InternalFileValidationStatus,
		errors: 0,
		warnings: 456,
		relatedSubmission: "EDGE_Q2_2027_Final",
	},
	{
		id: "if-4",
		fileName: "EDGE_Q2_2027_ProviderData.dat",
		fileType: "Provider Data",
		reportingPeriod: "Q2 2027",
		submittedDate: "Jul 25, 2027",
		records: 628_098,
		status: "Failed" as InternalFileValidationStatus,
		errors: 2840,
		warnings: 1120,
		relatedSubmission: "EDGE_Q2_2027_Final",
	},
	{
		id: "if-5",
		fileName: "EDGE_Q2_2027_Correction1.dat",
		fileType: "Member Enrollment",
		reportingPeriod: "Q2 2027",
		submittedDate: "Jul 24, 2027",
		records: 498_220,
		status: "Passed" as InternalFileValidationStatus,
		errors: 0,
		warnings: 320,
		relatedSubmission: "EDGE_Q2_2027_Correction1",
	},
];

export const CMS_EDGE_INTERNAL_RECORD_VALIDATION = [
	{
		id: "ir-1",
		recordType: "Member Enrollment",
		errorCode: "E1001",
		errorDescription: "Missing or invalid member identifier",
		recordCount: 18_452,
		severity: "High" as RecordValidationSeverity,
		relatedFile: "EDGE_Q2_2027_ProviderData.dat",
		resolutionStatus: "Open" as RecordResolutionStatus,
	},
	{
		id: "ir-2",
		recordType: "Payment Data",
		errorCode: "E2048",
		errorDescription: "Service date outside member eligibility period",
		recordCount: 12_840,
		severity: "High" as RecordValidationSeverity,
		relatedFile: "EDGE_Q2_2027_ProviderData.dat",
		resolutionStatus: "In Review" as RecordResolutionStatus,
	},
	{
		id: "ir-3",
		recordType: "Risk Adjustment",
		errorCode: "E3012",
		errorDescription: "Missing risk score for enrolled member",
		recordCount: 8_920,
		severity: "Medium" as RecordValidationSeverity,
		relatedFile: "EDGE_Q2_2027_RiskAdjustment.dat",
		resolutionStatus: "Open" as RecordResolutionStatus,
	},
	{
		id: "ir-4",
		recordType: "Provider Data",
		errorCode: "E4010",
		errorDescription: "Rendering provider NPI not on file",
		recordCount: 6_240,
		severity: "Medium" as RecordValidationSeverity,
		relatedFile: "EDGE_Q2_2027_ProviderData.dat",
		resolutionStatus: "Corrected" as RecordResolutionStatus,
	},
	{
		id: "ir-5",
		recordType: "Member Enrollment",
		errorCode: "E1024",
		errorDescription: "Duplicate enrollment record detected",
		recordCount: 4_180,
		severity: "Low" as RecordValidationSeverity,
		relatedFile: "EDGE_Q2_2027_MemberEnrollment.dat",
		resolutionStatus: "In Review" as RecordResolutionStatus,
	},
];

export const CMS_EDGE_INTERNAL_VALIDATION_TREND = [
	{ quarter: "Q3 2026", passed: 2_180_400, failed: 68_200, warnings: 28_400 },
	{ quarter: "Q4 2026", passed: 2_240_800, failed: 62_100, warnings: 30_200 },
	{ quarter: "Q1 2027", passed: 2_290_500, failed: 71_800, warnings: 31_600 },
	{ quarter: "Q2 2027", passed: 2_340_915, failed: 76_512, warnings: 33_395 },
];

export const CMS_EDGE_TOP_ERROR_CATEGORIES = [
	{ category: "Missing Member ID (E1001)", errors: 18_452, pct: 24.12 },
	{ category: "Invalid Service Date (E2048)", errors: 12_840, pct: 16.78 },
	{ category: "Provider NPI Not Found (E4010)", errors: 9_620, pct: 12.57 },
	{ category: "Duplicate Record (E1024)", errors: 7_480, pct: 9.78 },
	{ category: "Missing Risk Score (E3012)", errors: 6_240, pct: 8.16 },
];

export const CMS_EDGE_EXTERNAL_VALIDATION_SUMMARY = {
	filesPassed: 10,
	filesPassedPct: 83.33,
	filesFailed: 2,
	filesFailedPct: 16.67,
	recordsPassed: 2_340_915,
	recordsPassedPct: 95.52,
	recordsFailed: 76_512,
	recordsFailedPct: 3.12,
	warnings: 33_395,
	warningsPct: 1.36,
	totalFilesSubmitted: 12,
	totalRecordsReturned: 2_450_822,
	lastResponse: "Jul 27, 2027 11:44 AM ET",
};

export type ExternalFileValidationStatus = "Completed" | "Pending" | "Error";

export const EXTERNAL_FILE_STATUS_STYLES: Record<
	ExternalFileValidationStatus,
	string
> = {
	Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Pending: "border-amber-200 bg-amber-50 text-amber-800",
	Error: "border-red-200 bg-red-50 text-red-700",
};

export const CMS_EDGE_EXTERNAL_FILE_VALIDATION = [
	{
		id: "ef-1",
		responseType: "Validation Report",
		fileName: "EDGE_Q2_2027_Validation_Response.xlsx",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateReceived: "Jul 21, 2027 10:02 AM",
		status: "Completed" as ExternalFileValidationStatus,
		records: 512_840,
		errors: 12_480,
		warnings: 2_240,
	},
	{
		id: "ef-2",
		responseType: "Acceptance Report",
		fileName: "EDGE_Q2_2027_Acceptance_Report.pdf",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateReceived: "Jul 22, 2027 02:18 PM",
		status: "Completed" as ExternalFileValidationStatus,
		records: 421_560,
		errors: 0,
		warnings: 892,
	},
	{
		id: "ef-3",
		responseType: "Validation Report",
		fileName: "EDGE_Q2_2027_Correction1_Val.xlsx",
		relatedSubmission: "EDGE_Q2_2027_Correction1",
		dateReceived: "Jul 25, 2027 03:10 PM",
		status: "Completed" as ExternalFileValidationStatus,
		records: 389_104,
		errors: 8_284,
		warnings: 1_760,
	},
	{
		id: "ef-4",
		responseType: "Validation Report",
		fileName: "EDGE_Q1_2027_Validation_Response.xlsx",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateReceived: "Apr 28, 2027 09:18 AM",
		status: "Completed" as ExternalFileValidationStatus,
		records: 628_098,
		errors: 12_658,
		warnings: 3_000,
	},
	{
		id: "ef-5",
		responseType: "Acceptance Report",
		fileName: "EDGE_Q1_2027_Acceptance_Report.pdf",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateReceived: "Apr 29, 2027 11:42 AM",
		status: "Pending" as ExternalFileValidationStatus,
		records: 498_220,
		errors: 0,
		warnings: 0,
	},
];

export const CMS_EDGE_EXTERNAL_RECORD_VALIDATION =
	CMS_EDGE_INTERNAL_RECORD_VALIDATION;

export const CMS_EDGE_EXTERNAL_ERROR_BREAKDOWN = [
	{ label: "Missing Member ID", count: 18_452, color: "#13446c" },
	{ label: "Invalid Service Date", count: 12_840, color: "#3b82f6" },
	{ label: "Provider NPI", count: 9_620, color: "#8b5cf6" },
	{ label: "Duplicate Record", count: 7_480, color: "#f59e0b" },
	{ label: "Other", count: 28_120, color: "#94a3b8" },
];

export const CMS_EDGE_EXTERNAL_QUICK_ACTIONS = [
	{
		id: "eq-1",
		title: "Download All Reports",
		description: "Export all CMS validation and acceptance reports",
	},
	{
		id: "eq-2",
		title: "Download Error File",
		description: "Download the latest CMS error detail file",
	},
	{
		id: "eq-3",
		title: "Export All Errors",
		description: "Export record-level errors to spreadsheet",
	},
	{
		id: "eq-4",
		title: "Validation Rules",
		description: "View CMS EDGE validation rule reference",
	},
	{
		id: "eq-5",
		title: "Error Code Library",
		description: "Browse CMS error codes and resolutions",
	},
	{
		id: "eq-6",
		title: "Validation Audit Log",
		description: "Review validation activity and audit trail",
	},
];

export type DocumentFileKind = "pdf" | "xlsx" | "csv" | "xml";
export type DocumentStatus = "Available" | "Pending" | "Expired";
export type RetentionAlertStatus = "Expires Soon" | "Retention Warning";

export type DocumentLibraryRow = {
	id: string;
	name: string;
	fileKind: DocumentFileKind;
	documentType: string;
	relatedSubmission: string;
	reportingPeriod: string;
	dateUploaded: string;
	fileSize: string;
	status: DocumentStatus;
	retentionUntil: string;
};

export type RecentDocumentRow = {
	id: string;
	name: string;
	fileKind: DocumentFileKind;
	documentType: string;
	uploadedBy: string;
	dateUploaded: string;
	relatedSubmission: string;
};

export type RetentionAlertRow = {
	id: string;
	name: string;
	fileKind: DocumentFileKind;
	retentionUntil: string;
	daysRemaining: number;
	status: RetentionAlertStatus;
};

export const CMS_EDGE_DOCUMENT_KPIS = {
	totalDocuments: 128,
	available: { count: 112, percent: 87.5 },
	pending: { count: 10, percent: 7.81 },
	expiredWarning: { count: 6, percent: 4.69 },
	downloads: 348,
	storageUsedGb: 45.62,
	storageAllocatedGb: 100,
	storageAvailableGb: 54.38,
	storageAvailablePercent: 54.38,
};

export const CMS_EDGE_STORAGE_MIX = [
	{ name: "Reports", value: 53.4, gb: 24.35, color: "#3b82f6" },
	{ name: "Responses", value: 26.7, gb: 12.18, color: "#22c55e" },
	{ name: "Audit", value: 14.1, gb: 6.42, color: "#f59e0b" },
	{ name: "Other", value: 5.8, gb: 2.67, color: "#8b5cf6" },
];

export const CMS_EDGE_DOCUMENT_TYPES = [
	"All Types",
	"Submission Report",
	"Validation Response",
	"Audit Report",
	"Financial Report",
	"Supporting Document",
];

export const CMS_EDGE_DOCUMENT_SUBMISSIONS = [
	"All Submissions",
	"EDGE_Q2_2027_Final",
	"EDGE_Q1_2027_Final",
	"EDGE_Q4_2026_Final",
];

export const CMS_EDGE_DOCUMENT_STATUSES = [
	"All Statuses",
	"Available",
	"Pending",
	"Expired",
];

export const CMS_EDGE_DOCUMENT_LIBRARY: DocumentLibraryRow[] = [
	{
		id: "doc-1",
		name: "EDGE_Q2_2027_Final_Submission.pdf",
		fileKind: "pdf",
		documentType: "Submission Report",
		relatedSubmission: "EDGE_Q2_2027_Final",
		reportingPeriod: "Q2 2027",
		dateUploaded: "Jul 21, 2027 09:45 AM",
		fileSize: "4.2 MB",
		status: "Available",
		retentionUntil: "Jul 21, 2032",
	},
	{
		id: "doc-2",
		name: "EDGE_Q2_2027_Validation_Response.xlsx",
		fileKind: "xlsx",
		documentType: "Validation Response",
		relatedSubmission: "EDGE_Q2_2027_Final",
		reportingPeriod: "Q2 2027",
		dateUploaded: "Jul 21, 2027 10:02 AM",
		fileSize: "1.8 MB",
		status: "Available",
		retentionUntil: "Jul 21, 2032",
	},
	{
		id: "doc-3",
		name: "EDGE_Q2_2027_Audit_Preliminary.pdf",
		fileKind: "pdf",
		documentType: "Audit Report",
		relatedSubmission: "EDGE_Q2_2027_Final",
		reportingPeriod: "Q2 2027",
		dateUploaded: "Jul 20, 2027 03:15 PM",
		fileSize: "2.6 MB",
		status: "Pending",
		retentionUntil: "Jul 20, 2032",
	},
	{
		id: "doc-4",
		name: "EDGE_Q1_2027_Final_Submission.pdf",
		fileKind: "pdf",
		documentType: "Submission Report",
		relatedSubmission: "EDGE_Q1_2027_Final",
		reportingPeriod: "Q1 2027",
		dateUploaded: "Apr 18, 2027 11:20 AM",
		fileSize: "3.9 MB",
		status: "Available",
		retentionUntil: "Apr 18, 2032",
	},
	{
		id: "doc-5",
		name: "EDGE_Q1_2027_Financial_Reconciliation.xlsx",
		fileKind: "xlsx",
		documentType: "Financial Report",
		relatedSubmission: "EDGE_Q1_2027_Final",
		reportingPeriod: "Q1 2027",
		dateUploaded: "Apr 17, 2027 04:55 PM",
		fileSize: "920 KB",
		status: "Available",
		retentionUntil: "Apr 17, 2032",
	},
	{
		id: "doc-6",
		name: "EDGE_Q1_2027_Supporting_Data.csv",
		fileKind: "csv",
		documentType: "Supporting Document",
		relatedSubmission: "EDGE_Q1_2027_Final",
		reportingPeriod: "Q1 2027",
		dateUploaded: "Apr 16, 2027 08:30 AM",
		fileSize: "640 KB",
		status: "Pending",
		retentionUntil: "Apr 16, 2032",
	},
	{
		id: "doc-7",
		name: "EDGE_Q4_2026_Validation_Response.xml",
		fileKind: "xml",
		documentType: "Validation Response",
		relatedSubmission: "EDGE_Q4_2026_Final",
		reportingPeriod: "Q4 2026",
		dateUploaded: "Jan 12, 2027 02:10 PM",
		fileSize: "780 KB",
		status: "Available",
		retentionUntil: "Jan 12, 2031",
	},
	{
		id: "doc-8",
		name: "EDGE_Q4_2026_Audit_Final.pdf",
		fileKind: "pdf",
		documentType: "Audit Report",
		relatedSubmission: "EDGE_Q4_2026_Final",
		reportingPeriod: "Q4 2026",
		dateUploaded: "Jan 10, 2027 09:00 AM",
		fileSize: "3.1 MB",
		status: "Available",
		retentionUntil: "Jan 10, 2031",
	},
	{
		id: "doc-9",
		name: "EDGE_Q4_2026_Retention_Archive.pdf",
		fileKind: "pdf",
		documentType: "Supporting Document",
		relatedSubmission: "EDGE_Q4_2026_Final",
		reportingPeriod: "Q4 2026",
		dateUploaded: "Dec 20, 2026 05:40 PM",
		fileSize: "1.2 MB",
		status: "Expired",
		retentionUntil: "Dec 20, 2026",
	},
	{
		id: "doc-10",
		name: "EDGE_Q2_2027_CMS_Response.pdf",
		fileKind: "pdf",
		documentType: "Validation Response",
		relatedSubmission: "EDGE_Q2_2027_Final",
		reportingPeriod: "Q2 2027",
		dateUploaded: "Jul 19, 2027 01:25 PM",
		fileSize: "1.5 MB",
		status: "Available",
		retentionUntil: "Jul 19, 2032",
	},
];

export const CMS_EDGE_RECENT_DOCUMENTS: RecentDocumentRow[] = [
	{
		id: "recent-1",
		name: "EDGE_Q2_2027_Final_Submission.pdf",
		fileKind: "pdf",
		documentType: "Submission Report",
		uploadedBy: "System",
		dateUploaded: "Jul 21, 2027 09:45 AM",
		relatedSubmission: "EDGE_Q2_2027_Final",
	},
	{
		id: "recent-2",
		name: "EDGE_Q2_2027_Validation_Response.xlsx",
		fileKind: "xlsx",
		documentType: "Validation Response",
		uploadedBy: "CMS EDGE System",
		dateUploaded: "Jul 21, 2027 10:02 AM",
		relatedSubmission: "EDGE_Q2_2027_Final",
	},
	{
		id: "recent-3",
		name: "EDGE_Q2_2027_Audit_Preliminary.pdf",
		fileKind: "pdf",
		documentType: "Audit Report",
		uploadedBy: "CMS EDGE System",
		dateUploaded: "Jul 20, 2027 03:15 PM",
		relatedSubmission: "EDGE_Q2_2027_Final",
	},
	{
		id: "recent-4",
		name: "EDGE_Q1_2027_Final_Submission.pdf",
		fileKind: "pdf",
		documentType: "Submission Report",
		uploadedBy: "System",
		dateUploaded: "Apr 18, 2027 11:20 AM",
		relatedSubmission: "EDGE_Q1_2027_Final",
	},
	{
		id: "recent-5",
		name: "EDGE_Q1_2027_Financial_Reconciliation.xlsx",
		fileKind: "xlsx",
		documentType: "Financial Report",
		uploadedBy: "Admin User",
		dateUploaded: "Apr 17, 2027 04:55 PM",
		relatedSubmission: "EDGE_Q1_2027_Final",
	},
];

export const CMS_EDGE_RETENTION_ALERTS: RetentionAlertRow[] = [
	{
		id: "alert-1",
		name: "EDGE_Q4_2026_Retention_Archive.pdf",
		fileKind: "pdf",
		retentionUntil: "Aug 8, 2027",
		daysRemaining: 19,
		status: "Expires Soon",
	},
	{
		id: "alert-2",
		name: "EDGE_Q3_2026_Supporting_Data.csv",
		fileKind: "csv",
		retentionUntil: "Aug 1, 2027",
		daysRemaining: 12,
		status: "Retention Warning",
	},
	{
		id: "alert-3",
		name: "EDGE_Q3_2026_Validation_Response.xlsx",
		fileKind: "xlsx",
		retentionUntil: "Jul 28, 2027",
		daysRemaining: 8,
		status: "Retention Warning",
	},
	{
		id: "alert-4",
		name: "EDGE_Q2_2026_Audit_Report.pdf",
		fileKind: "pdf",
		retentionUntil: "Jul 25, 2027",
		daysRemaining: 5,
		status: "Expires Soon",
	},
];

export const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
	Available:
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
	Pending:
		"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	Expired:
		"border-red-200/80 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

export const RETENTION_ALERT_STYLES: Record<RetentionAlertStatus, string> = {
	"Expires Soon":
		"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
	"Retention Warning":
		"border-red-200/80 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

export function filterDocumentLibrary(
	rows: DocumentLibraryRow[],
	query: string
): DocumentLibraryRow[] {
	const q = query.trim().toLowerCase();
	if (!q) return rows;
	return rows.filter(
		(row) =>
			row.name.toLowerCase().includes(q) ||
			row.documentType.toLowerCase().includes(q) ||
			row.relatedSubmission.toLowerCase().includes(q)
	);
}

export function formatCurrencyPrecise(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export type FmSummaryRow = {
	id: string;
	responseFile: string;
	responseType: string;
	relatedSubmission: string;
	dataReceived: string;
	paidAmount: number;
	withholds: number;
	adjustments: number;
	netPayment: number;
	status: "Completed";
};

export type FmCategoryRow = {
	category: string;
	paidAmount: number;
	percent: number;
	color: string;
};

export type FmActivityRow = {
	id: string;
	activity: string;
	description: string;
	relatedSubmission: string;
	dateTime: string;
	status: "Completed";
	user: string;
};

export const CMS_EDGE_FM_KPIS = {
	totalPayments: 12_845_230.45,
	withholds: 245_678.9,
	withholdsPercent: 1.91,
	adjustments: 123_456.78,
	adjustmentsPercent: 0.96,
	netPayment: 12_476_094.77,
	lastFmResponse: "Jul 27, 2027 11:44 AM ET",
	fmReportsReceived: 5,
};

export const CMS_EDGE_FM_OVERVIEW_MIX = [
	{ name: "Total Payments", value: 12_845_230.45, color: "#3b82f6", pct: 100 },
	{ name: "Withholds", value: 245_678.9, color: "#ef4444", pct: 1.91 },
	{ name: "Adjustments", value: 123_456.78, color: "#f59e0b", pct: 0.96 },
	{ name: "Net Payment", value: 12_476_094.77, color: "#22c55e", pct: 97.13 },
];

export const CMS_EDGE_FM_SUMMARY: FmSummaryRow[] = [
	{
		id: "fm-1",
		responseFile: "FM_Q2_2027_Response_001.xml",
		responseType: "Payment Response",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dataReceived: "Jul 27, 2027 11:44 AM",
		paidAmount: 4_285_076.82,
		withholds: 81_892.67,
		adjustments: 41_152.26,
		netPayment: 4_162_031.89,
		status: "Completed",
	},
	{
		id: "fm-2",
		responseFile: "FM_Q2_2027_Response_002.xml",
		responseType: "Withhold Response",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dataReceived: "Jul 26, 2027 03:20 PM",
		paidAmount: 3_124_580.15,
		withholds: 59_680.48,
		adjustments: 30_012.44,
		netPayment: 3_034_887.23,
		status: "Completed",
	},
	{
		id: "fm-3",
		responseFile: "FM_Q1_2027_Response_001.xml",
		responseType: "Payment Response",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dataReceived: "Apr 28, 2027 09:15 AM",
		paidAmount: 2_856_412.33,
		withholds: 54_557.67,
		adjustments: 27_412.89,
		netPayment: 2_774_441.77,
		status: "Completed",
	},
	{
		id: "fm-4",
		responseFile: "FM_Q1_2027_Response_002.xml",
		responseType: "Adjustment Response",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dataReceived: "Apr 27, 2027 02:45 PM",
		paidAmount: 1_642_891.05,
		withholds: 31_378.42,
		adjustments: 15_764.12,
		netPayment: 1_595_748.51,
		status: "Completed",
	},
	{
		id: "fm-5",
		responseFile: "FM_Q4_2026_Response_001.xml",
		responseType: "Payment Response",
		relatedSubmission: "EDGE_Q4_2026_Final",
		dataReceived: "Jan 30, 2027 10:30 AM",
		paidAmount: 936_270.1,
		withholds: 18_169.66,
		adjustments: 9_115.07,
		netPayment: 908_985.37,
		status: "Completed",
	},
];

export const CMS_EDGE_FM_TREND = [
	{
		quarter: "Q3 2026",
		totalPayments: 9_842_100,
		withholds: 188_420,
		adjustments: 94_680,
		netPayment: 9_559_000,
	},
	{
		quarter: "Q4 2026",
		totalPayments: 10_456_800,
		withholds: 199_920,
		adjustments: 100_380,
		netPayment: 10_156_500,
	},
	{
		quarter: "Q1 2027",
		totalPayments: 11_892_400,
		withholds: 227_340,
		adjustments: 114_120,
		netPayment: 11_550_940,
	},
	{
		quarter: "Q2 2027",
		totalPayments: 12_845_230,
		withholds: 245_679,
		adjustments: 123_457,
		netPayment: 12_476_095,
	},
];

export const CMS_EDGE_FM_CATEGORIES: FmCategoryRow[] = [
	{
		category: "Capitation",
		paidAmount: 5_134_092.18,
		percent: 39.97,
		color: "#3b82f6",
	},
	{
		category: "Fee-for-Service",
		paidAmount: 4_876_287.54,
		percent: 37.96,
		color: "#6366f1",
	},
	{
		category: "Incentive",
		paidAmount: 1_926_784.57,
		percent: 15.0,
		color: "#8b5cf6",
	},
	{
		category: "Other",
		paidAmount: 908_066.16,
		percent: 7.07,
		color: "#a78bfa",
	},
];

export const CMS_EDGE_FM_SELECTED_DETAILS = {
	responseFile: "FM_Q2_2027_Response_001.xml",
	responseType: "Payment Response",
	relatedSubmission: "EDGE_Q2_2027_Final",
	reportingPeriod: "Q2 2027",
	dataReceived: "Jul 27, 2027 11:44 AM ET",
	paidAmount: 4_285_076.82,
	withholds: 81_892.67,
	adjustments: 41_152.26,
	netPayment: 4_162_031.89,
	status: "Completed" as const,
};

export const CMS_EDGE_FM_ACTIVITY: FmActivityRow[] = [
	{
		id: "fm-act-1",
		activity: "Payment Processed",
		description: "Q2 2027 payment response reconciled and posted",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 27, 2027 11:44 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
	{
		id: "fm-act-2",
		activity: "Withhold Applied",
		description: "Withhold amounts applied per CMS EDGE payment file",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 27, 2027 11:45 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
	{
		id: "fm-act-3",
		activity: "FM Report Received",
		description: "Financial management report received from CMS EDGE",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 27, 2027 11:46 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
	{
		id: "fm-act-4",
		activity: "Discrepancy Identified",
		description: "Minor adjustment variance flagged for review",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateTime: "Apr 28, 2027 09:20 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
	{
		id: "fm-act-5",
		activity: "Payment Processed",
		description: "Q1 2027 net payment confirmed and recorded",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateTime: "Apr 28, 2027 09:18 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
];

export const FM_COMPLETED_STYLE =
	"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";

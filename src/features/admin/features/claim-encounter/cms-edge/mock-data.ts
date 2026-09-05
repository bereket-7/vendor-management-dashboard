export type CmsEdgeTabId =
	| "overview"
	| "members-enrollment"
	| "providers"
	| "claims"
	| "pharmacy-claims"
	| "supplemental-diagnoses"
	| "file-generation"
	| "configuration";

export type CmsEdgeReportingTabId =
	| "overview"
	| "submissions"
	| "cms-responses"
	| "exceptions"
	| "reconciliation";

export const CMS_EDGE_TABS: { id: CmsEdgeTabId; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "members-enrollment", label: "Members & Enrollment" },
	{ id: "providers", label: "Providers" },
	{ id: "claims", label: "Claims" },
	{ id: "pharmacy-claims", label: "Pharmacy Claims" },
	{ id: "supplemental-diagnoses", label: "Supplemental Diagnoses" },
	{ id: "file-generation", label: "File Generation" },
	{ id: "configuration", label: "Configuration" },
];

export const CMS_EDGE_REPORTING_TABS: {
	id: CmsEdgeReportingTabId;
	label: string;
}[] = [
	{ id: "overview", label: "Overview" },
	{ id: "submissions", label: "Submissions" },
	{ id: "cms-responses", label: "CMS Responses" },
	{ id: "exceptions", label: "Exceptions" },
	{ id: "reconciliation", label: "Reconciliation" },
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
		title: "BHP - CMS EDGE Reporting",
		description:
			"Prepare, validate, submit, and reconcile BHP enrollment and claims data with CMS EDGE.",
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
		description:
			"Review medical claims staged for EDGE medical claim file submission.",
	},
	"pharmacy-claims": {
		title: "Pharmacy Claims",
		description:
			"Review prescription claims, dispensing providers, financial values, and CMS EDGE validation.",
	},
	"supplemental-diagnoses": {
		title: "Supplemental Diagnoses",
		description:
			"Review diagnosis records submitted separately from medical claims and validate linkage to original claims.",
	},
	"file-generation": {
		title: "File Generation",
		description: "Enrollment, medical, pharmacy, and supplemental files.",
	},
	configuration: {
		title: "Configuration",
		description: "Issuer IDs, calendars, and submission settings.",
	},
};

export const CMS_EDGE_REPORTING_TAB_META: Record<
	CmsEdgeReportingTabId,
	{ title: string; description: string }
> = {
	overview: {
		title: "CMS EDGE Reporting",
		description:
			"Cycle health across submissions, CMS responses, exceptions, and reconciliation.",
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
		title: "Exceptions & Corrections",
		description:
			"Resolve validation errors and manage claim voids and replacements.",
	},
	reconciliation: {
		title: "Reconciliation",
		description:
			"Compare source records, generated files, submitted records, and CMS-accepted totals.",
	},
};

// ─── Reporting overview ─────────────────────────────────────────────────────

export const CMS_EDGE_REPORTING_OVERVIEW_HEALTH = {
	status: "Attention Required" as const,
	acceptanceRate: 98.7,
	daysToDeadline: 18,
	deadlineLabel: "Q2 2027 EDGE due Jul 15",
	environment: "Production",
	lastSync: "Today · 09:42 AM",
};

export const CMS_EDGE_REPORTING_OVERVIEW_KPIS = [
	{
		id: "submissions" as const,
		label: "Submissions",
		value: 12,
		hint: "8 accepted · 3 failed",
		href: "submissions",
		delta: "+2 this week",
		deltaTone: "up" as const,
	},
	{
		id: "cms-responses" as const,
		label: "CMS Responses",
		value: 9,
		hint: "5 accepted · 2 rejected",
		href: "cms-responses",
		delta: "1 pending",
		deltaTone: "neutral" as const,
	},
	{
		id: "exceptions" as const,
		label: "Open Exceptions",
		value: 912,
		hint: "214 critical",
		href: "exceptions",
		delta: "−48 vs last week",
		deltaTone: "up" as const,
	},
	{
		id: "reconciliation" as const,
		label: "Variance",
		value: 69_264,
		hint: "vs 24.9M source records",
		href: "reconciliation",
		delta: "Review required",
		deltaTone: "down" as const,
	},
];

export const CMS_EDGE_REPORTING_OVERVIEW_PIPELINE = [
	{
		id: "extract",
		label: "Source extract",
		detail: "24.9M records staged",
		state: "done" as const,
	},
	{
		id: "submit",
		label: "Submit to CMS",
		detail: "12 files this cycle",
		state: "done" as const,
	},
	{
		id: "response",
		label: "CMS response",
		detail: "2 files awaiting review",
		state: "active" as const,
	},
	{
		id: "reconcile",
		label: "Reconcile",
		detail: "69K variance open",
		state: "pending" as const,
	},
];

export const CMS_EDGE_REPORTING_OVERVIEW_ATTENTION = [
	{
		id: "att-1",
		severity: "Critical" as const,
		title: "Pharmacy Production submission failed",
		detail: "SUB-2027-000003 · 31,045 records",
		href: "submissions",
		age: "2d ago",
	},
	{
		id: "att-2",
		severity: "High" as const,
		title: "214 critical enrollment exceptions open",
		detail: "Missing subscriber IDs and dual-coverage conflicts",
		href: "exceptions",
		age: "Today",
	},
	{
		id: "att-3",
		severity: "Medium" as const,
		title: "Medical claims variance needs review",
		detail: "19,330 source vs CMS-accepted gap",
		href: "reconciliation",
		age: "Yesterday",
	},
	{
		id: "att-4",
		severity: "Low" as const,
		title: "Issuer return file ready to download",
		detail: "RSP-2027-000008 · Supplemental Diagnosis",
		href: "cms-responses",
		age: "3h ago",
	},
];

export const CMS_EDGE_REPORTING_OVERVIEW_ACTIVITY = [
	{
		id: "act-1",
		time: "09:42 AM",
		title: "CMS accepted Enrollment (Test)",
		meta: "SUB-2027-000001 · 12,524 records",
		tone: "success" as const,
	},
	{
		id: "act-2",
		time: "08:15 AM",
		title: "47 corrections drafted for resubmission",
		meta: "Exceptions queue · Data Operations",
		tone: "info" as const,
	},
	{
		id: "act-3",
		time: "Yesterday",
		title: "Reconciliation run completed",
		meta: "Production · Variance 69,264",
		tone: "warn" as const,
	},
	{
		id: "act-4",
		time: "Yesterday",
		title: "Pharmacy file rejected by CMS",
		meta: "SUB-2027-000003 · Validation errors",
		tone: "danger" as const,
	},
	{
		id: "act-5",
		time: "Mon",
		title: "Q2 2027 reporting period opened",
		meta: "Calendars · EDGE submission window",
		tone: "info" as const,
	},
];

export const CMS_EDGE_REPORTING_TAB_BADGES: Partial<
	Record<CmsEdgeReportingTabId, number>
> = {
	exceptions: 912,
	reconciliation: 4,
};

// ─── Overview tab ───────────────────────────────────────────────────────────

export type OverviewWorkflowState = "completed" | "in_progress" | "pending";
export type OverviewExceptionSeverity = "High" | "Medium";
export type OverviewActivityStatus = "Completed" | "In Progress";

/** Overview KPI strip — always an array (not the legacy object shape). */
export const CMS_EDGE_OVERVIEW_KPI_CARDS = [
	{
		id: "period",
		label: "Reporting Period",
		value: "Q2 2027",
		hint: "Apr 1 - Jun 30, 2027",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "",
		hintClassName: "",
		icon: "calendar" as const,
	},
	{
		id: "readiness",
		label: "Data Readiness",
		value: "98.7%",
		hint: "High",
		tone: "text-emerald-700 bg-emerald-500/10",
		valueClassName: "",
		hintClassName: "font-semibold text-emerald-700",
		icon: "pie" as const,
	},
	{
		id: "files-required",
		label: "Files Required",
		value: "4",
		hint: "Submission Files",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "",
		hintClassName: "",
		icon: "file" as const,
	},
	{
		id: "files-generated",
		label: "Files Generated",
		value: "3",
		hint: "Ready for Review",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "",
		hintClassName: "",
		icon: "fileOut" as const,
	},
	{
		id: "submission",
		label: "Submission Status",
		value: "In Progress",
		hint: "File Generation",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-sky-700",
		hintClassName: "font-medium text-sky-700",
		icon: "send" as const,
	},
	{
		id: "errors",
		label: "Critical Errors",
		value: "912",
		hint: "Require Attention",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		hintClassName: "font-medium text-red-600",
		icon: "shield" as const,
	},
	{
		id: "reconciliation",
		label: "Reconciliation",
		value: "Pending",
		hint: "Awaiting CMS Response",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-600",
		hintClassName: "font-medium text-amber-700",
		icon: "hourglass" as const,
	},
] as const;

/** @deprecated Prefer CMS_EDGE_OVERVIEW_KPI_CARDS */
export const CMS_EDGE_OVERVIEW_KPIS = CMS_EDGE_OVERVIEW_KPI_CARDS;

export const CMS_EDGE_OVERVIEW_ENTITIES = [
	{
		id: "members",
		title: "Members & Enrollment",
		description: "Enrollment records and coverage periods",
		icon: "members" as const,
		stats: [
			{ label: "Total Records", value: "2,451,890", tone: "default" as const },
			{ label: "Ready", value: "2,441,022", tone: "success" as const },
			{ label: "Errors", value: "386", tone: "danger" as const },
		],
		cta: "View Members",
		tabId: "members-enrollment" as CmsEdgeTabId,
	},
	{
		id: "providers",
		title: "Providers",
		description: "Billing, rendering, and dispensing identifiers",
		icon: "providers" as const,
		stats: [
			{ label: "Total Providers", value: "215,667", tone: "default" as const },
			{ label: "Validated", value: "213,201", tone: "success" as const },
			{ label: "Invalid NPI", value: "93", tone: "danger" as const },
		],
		cta: "View Providers",
		tabId: "providers" as CmsEdgeTabId,
	},
	{
		id: "claims",
		title: "Claims",
		description: "Medical, pharmacy, and supplemental diagnosis records",
		icon: "claims" as const,
		stats: [
			{ label: "Medical", value: "9,842,113", tone: "default" as const },
			{ label: "Pharmacy", value: "6,318,774", tone: "default" as const },
			{ label: "Claim Errors", value: "701", tone: "danger" as const },
		],
		cta: "View Claims",
		tabId: "claims" as CmsEdgeTabId,
	},
] as const;

export const CMS_EDGE_OVERVIEW_WORKFLOW = [
	{
		id: "source",
		label: "Source Data",
		status: "Completed",
		state: "completed" as OverviewWorkflowState,
		icon: "database" as const,
	},
	{
		id: "validation",
		label: "CMS Validation",
		status: "Completed",
		state: "completed" as OverviewWorkflowState,
		icon: "shieldCheck" as const,
	},
	{
		id: "generation",
		label: "File Generation",
		status: "In Progress",
		state: "in_progress" as OverviewWorkflowState,
		icon: "fileUp" as const,
	},
	{
		id: "submission",
		label: "Submission",
		status: "Pending",
		state: "pending" as OverviewWorkflowState,
		icon: "send" as const,
	},
	{
		id: "response",
		label: "CMS Response",
		status: "Pending",
		state: "pending" as OverviewWorkflowState,
		icon: "mail" as const,
	},
	{
		id: "reconciliation",
		label: "Reconciliation",
		status: "Pending",
		state: "pending" as OverviewWorkflowState,
		icon: "scale" as const,
	},
] as const;

export const CMS_EDGE_OVERVIEW_EXCEPTIONS = [
	{
		id: "ex-1",
		type: "Member Not Found",
		count: 386,
		severity: "High" as OverviewExceptionSeverity,
		owner: "Data Ops",
	},
	{
		id: "ex-2",
		type: "Invalid Provider NPI",
		count: 178,
		severity: "High" as OverviewExceptionSeverity,
		owner: "Provider Ops",
	},
	{
		id: "ex-3",
		type: "Coverage Period Mismatch",
		count: 87,
		severity: "Medium" as OverviewExceptionSeverity,
		owner: "Enrollment",
	},
	{
		id: "ex-4",
		type: "Claim Total Mismatch",
		count: 47,
		severity: "Medium" as OverviewExceptionSeverity,
		owner: "Claims Ops",
	},
] as const;

export const CMS_EDGE_OVERVIEW_ACTIVITY = [
	{
		id: "act-1",
		activity: "Medical Claims File Generated",
		fileType: "Medical Claims",
		environment: "Production",
		status: "Completed" as OverviewActivityStatus,
		date: "Jul 25, 2027 02:35 PM",
		owner: "Jane Smith",
	},
	{
		id: "act-2",
		activity: "Pharmacy Claims Validation",
		fileType: "Pharmacy Claims",
		environment: "Production",
		status: "In Progress" as OverviewActivityStatus,
		date: "Jul 25, 2027 01:12 PM",
		owner: "System",
	},
	{
		id: "act-3",
		activity: "Enrollment File Generated",
		fileType: "Enrollment",
		environment: "Production",
		status: "Completed" as OverviewActivityStatus,
		date: "Jul 24, 2027 06:48 PM",
		owner: "Alex Rivera",
	},
	{
		id: "act-4",
		activity: "Supplemental Diagnosis Export",
		fileType: "Supplemental",
		environment: "Production",
		status: "In Progress" as OverviewActivityStatus,
		date: "Jul 24, 2027 04:05 PM",
		owner: "System",
	},
] as const;

export const CMS_EDGE_OVERVIEW_CONFIG = [
	{
		id: "hios",
		label: "HIOS Issuer ID",
		value: "16696",
		icon: "hash" as const,
	},
	{
		id: "zone",
		label: "Execution Zone",
		value: "Production",
		icon: "globe" as const,
	},
	{
		id: "year",
		label: "Benefit Year",
		value: "2027",
		icon: "calendar" as const,
	},
	{
		id: "plans",
		label: "Active Plan IDs",
		value: "4",
		icon: "list" as const,
	},
] as const;

export const OVERVIEW_SEVERITY_STYLES: Record<
	OverviewExceptionSeverity,
	string
> = {
	High: "border-red-200/80 bg-red-50 text-red-700",
	Medium: "border-amber-200/80 bg-amber-50 text-amber-800",
};

export const OVERVIEW_ACTIVITY_STATUS_STYLES: Record<
	OverviewActivityStatus,
	string
> = {
	Completed: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	"In Progress": "border-sky-200/80 bg-sky-50 text-sky-800",
};

// ─── Members & Enrollment tab ───────────────────────────────────────────────

export type MemberCmsStatus =
	| "CMS Ready"
	| "Accepted"
	| "Accepted (Terminated)"
	| "Needs Review"
	| "Error"
	| "Validation Error"
	| "Coverage Mismatch"
	| "Unmapped Plan ID";

export type MemberValidationResult =
	| "Passed"
	| "Warning"
	| "Corrected"
	| "Failed";

export type MemberRelationship = "Subscriber" | "Spouse" | "Child";

export type CmsEdgeMemberListRow = {
	id: string;
	name: string;
	uniqueEnrolleeId: string;
	subscriberId: string;
	relationship: MemberRelationship;
	dateOfBirth: string;
	sex: "M" | "F";
	zipCode: string;
	hiosIssuerId: string;
	planId: string;
	coveragePeriod: string;
	premium: number;
	cmsStatus: MemberCmsStatus;
	coverageType: string;
	errorType: string | null;
};

export const CMS_EDGE_MEMBERS_KPIS = [
	{
		id: "total",
		label: "Total Members",
		value: "2,451,890",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-foreground",
		icon: "users" as const,
	},
	{
		id: "ready",
		label: "CMS Ready",
		value: "2,441,022",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-sky-800",
		icon: "check" as const,
	},
	{
		id: "errors",
		label: "Validation Errors",
		value: "386",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		icon: "alert" as const,
	},
	{
		id: "mismatch",
		label: "Coverage Mismatches",
		value: "87",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "circleAlert" as const,
	},
	{
		id: "unmapped",
		label: "Unmapped Plan IDs",
		value: "214",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "link" as const,
	},
] as const;

export const CMS_EDGE_MEMBERS_VALIDATION_SUMMARY = [
	{
		id: "missing-sub",
		label: "Missing Subscriber ID",
		value: "126",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		icon: "userX" as const,
	},
	{
		id: "invalid-dates",
		label: "Invalid Coverage Dates",
		value: "142",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "calendar" as const,
	},
	{
		id: "invalid-plan",
		label: "Invalid Plan ID",
		value: "68",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "tag" as const,
	},
	{
		id: "duplicate",
		label: "Duplicate Enrollment",
		value: "50",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-sky-700",
		icon: "copy" as const,
	},
] as const;

export const CMS_EDGE_MEMBER_FILTER_OPTIONS = {
	status: [
		"All",
		"CMS Ready",
		"Validation Error",
		"Coverage Mismatch",
		"Unmapped Plan ID",
	],
	coverageType: ["All", "Medical", "Pharmacy", "Dental"],
	planId: ["All", "P***001", "P***002", "P***003"],
	relationship: ["All", "Subscriber", "Spouse", "Child"],
	errorType: [
		"All",
		"Missing Subscriber ID",
		"Invalid Coverage Dates",
		"Invalid Plan ID",
		"Duplicate Enrollment",
	],
} as const;

export const CMS_EDGE_MEMBERS_LIST: CmsEdgeMemberListRow[] = [
	{
		id: "mbr-jordan",
		name: "Jordan M.",
		uniqueEnrolleeId: "U***45D6K9",
		subscriberId: "S***82H7L3",
		relationship: "Subscriber",
		dateOfBirth: "04/12/1962",
		sex: "M",
		zipCode: "02115",
		hiosIssuerId: "88888",
		planId: "P***001",
		coveragePeriod: "04/01/2027 - 06/30/2027",
		premium: 528.42,
		cmsStatus: "CMS Ready",
		coverageType: "Medical",
		errorType: null,
	},
	{
		id: "mbr-taylor",
		name: "Taylor M.",
		uniqueEnrolleeId: "U***91B7K3",
		subscriberId: "S***82H7L3",
		relationship: "Spouse",
		dateOfBirth: "09/03/1964",
		sex: "F",
		zipCode: "02115",
		hiosIssuerId: "88888",
		planId: "P***001",
		coveragePeriod: "04/01/2027 - 06/30/2027",
		premium: 412.1,
		cmsStatus: "CMS Ready",
		coverageType: "Medical",
		errorType: null,
	},
	{
		id: "mbr-casey",
		name: "Casey M.",
		uniqueEnrolleeId: "U***17C4P8",
		subscriberId: "S***82H7L3",
		relationship: "Child",
		dateOfBirth: "01/22/2008",
		sex: "F",
		zipCode: "02115",
		hiosIssuerId: "88888",
		planId: "P***001",
		coveragePeriod: "04/01/2027 - 06/30/2027",
		premium: 186.0,
		cmsStatus: "Validation Error",
		coverageType: "Medical",
		errorType: "Missing Subscriber ID",
	},
	{
		id: "mbr-alex",
		name: "Alex R.",
		uniqueEnrolleeId: "U***44K1N2",
		subscriberId: "S***44K1N2",
		relationship: "Subscriber",
		dateOfBirth: "11/08/1989",
		sex: "M",
		zipCode: "02118",
		hiosIssuerId: "88888",
		planId: "P***002",
		coveragePeriod: "04/01/2027 - 05/15/2027",
		premium: 612.75,
		cmsStatus: "Coverage Mismatch",
		coverageType: "Medical",
		errorType: "Invalid Coverage Dates",
	},
	{
		id: "mbr-sam",
		name: "Sam L.",
		uniqueEnrolleeId: "U***55P0M7",
		subscriberId: "S***55P0M7",
		relationship: "Subscriber",
		dateOfBirth: "06/19/1975",
		sex: "M",
		zipCode: "02210",
		hiosIssuerId: "88888",
		planId: "P***003",
		coveragePeriod: "04/01/2027 - 06/30/2027",
		premium: 498.2,
		cmsStatus: "Unmapped Plan ID",
		coverageType: "Medical",
		errorType: "Invalid Plan ID",
	},
];

export const CMS_EDGE_MEMBER_DETAIL = {
	id: "mbr-jordan",
	name: "Jordan M.",
	uniqueEnrolleeId: "UE-82A91X44",
	cmsStatus: "CMS Ready" as MemberCmsStatus,
	summary: [
		{ label: "Relationship", value: "Subscriber", tone: "default" as const },
		{ label: "Date of Birth", value: "Apr 12, 1962", tone: "default" as const },
		{ label: "Sex", value: "M", tone: "default" as const },
		{ label: "HIOS Issuer ID", value: "16696", tone: "default" as const },
		{
			label: "Current Plan ID",
			value: "16696DC0010001",
			tone: "default" as const,
		},
		{ label: "Coverage Status", value: "Active", tone: "success" as const },
	],
	identification: [
		{ label: "Unique Enrollee ID", value: "UE-82A91X44" },
		{ label: "Subscriber ID", value: "— (Not required for subscriber)" },
		{ label: "Subscriber Indicator", value: "S" },
		{ label: "Relationship", value: "Subscriber" },
		{ label: "Date of Birth", value: "04/12/1962" },
		{ label: "Sex", value: "M" },
		{ label: "ZIP Code", value: "02115" },
		{ label: "Race Code", value: "00 - Unknown" },
		{ label: "Ethnicity Code", value: "00 - Unknown" },
		{ label: "Source Vendor", value: "BHP Enrollment" },
		{ label: "Source Member ID", value: "MBR-****-8456" },
	],
	enrollmentPeriods: [
		{
			id: "ep-1",
			planId: "16696DC0010001",
			coverageStart: "01/01/2024",
			coverageEnd: "12/31/9999",
			monthlyPremium: "$612.00",
			ehb: "$0.00",
			federalAptc: "$312.00",
			stateSubsidy: "$0.00",
			ichra: "$0.00",
			cmsStatus: "CMS Ready" as MemberCmsStatus,
		},
		{
			id: "ep-2",
			planId: "16696DC0010001",
			coverageStart: "01/01/2023",
			coverageEnd: "12/31/2023",
			monthlyPremium: "$598.00",
			ehb: "$0.00",
			federalAptc: "$298.00",
			stateSubsidy: "$0.00",
			ichra: "$0.00",
			cmsStatus: "Accepted" as MemberCmsStatus,
		},
		{
			id: "ep-3",
			planId: "16696DC0010001",
			coverageStart: "01/01/2022",
			coverageEnd: "12/31/2022",
			monthlyPremium: "$582.00",
			ehb: "$0.00",
			federalAptc: "$294.00",
			stateSubsidy: "$0.00",
			ichra: "$0.00",
			cmsStatus: "Accepted (Terminated)" as MemberCmsStatus,
		},
	],
	validationHistory: [
		{
			id: "vh-1",
			date: "05/15/2024 10:14 AM",
			rule: "ELIGIBLE_MEMBER_ID_FORMAT",
			result: "Passed" as MemberValidationResult,
			message: "Unique Enrollee ID format is valid.",
			sourceFile: "BHP_EDGE_20240515_001.csv",
			reviewedBy: "System",
		},
		{
			id: "vh-2",
			date: "05/15/2024 10:14 AM",
			rule: "RACE_ETHNICITY_REPORTED",
			result: "Warning" as MemberValidationResult,
			message: "Race and ethnicity submitted as 00 - Unknown.",
			sourceFile: "BHP_EDGE_20240515_001.csv",
			reviewedBy: "System",
		},
		{
			id: "vh-3",
			date: "05/15/2024 10:14 AM",
			rule: "DATE_OF_BIRTH_VALID",
			result: "Passed" as MemberValidationResult,
			message: "Date of birth is valid and consistent.",
			sourceFile: "BHP_EDGE_20240515_001.csv",
			reviewedBy: "System",
		},
		{
			id: "vh-4",
			date: "05/15/2024 2:32 PM",
			rule: "ZIP_CODE_REQUIRED",
			result: "Corrected" as MemberValidationResult,
			message: "ZIP code was missing; value 02115 added.",
			sourceFile: "BHP_EDGE_20240515_001.csv",
			reviewedBy: "jdoe@bhphealthcare.com",
		},
	],
	family: [
		{
			id: "mbr-jordan",
			name: "Jordan M.",
			role: "Subscriber",
			uniqueEnrolleeId: "UE-82A91X44",
			primary: true,
		},
		{
			id: "mbr-taylor",
			name: "Taylor M.",
			role: "Spouse",
			uniqueEnrolleeId: "UE-91B72K03",
			primary: false,
		},
		{
			id: "mbr-casey",
			name: "Casey M.",
			role: "Dependent",
			uniqueEnrolleeId: "UE-17C44P82",
			primary: false,
		},
	],
	currentValidation: {
		passed: 24,
		warnings: 1,
		errors: 0,
		alert: "Race and ethnicity submitted as 00 - Unknown.",
	},
	submissionHistory: [
		{
			id: "sh-1",
			submissionType: "Final Enrollment",
			reportingPeriod: "Q2 2027",
			submittedDate: "Jul 21, 2027 09:45 AM",
			status: "Accepted",
			fileName: "BHP_EDGE_ENROLL_20270721.xml",
		},
		{
			id: "sh-2",
			submissionType: "Preliminary Enrollment",
			reportingPeriod: "Q2 2027",
			submittedDate: "Jul 14, 2027 02:30 PM",
			status: "Accepted",
			fileName: "BHP_EDGE_ENROLL_20270714.xml",
		},
	],
} as const;

export const MEMBER_CMS_STATUS_STYLES: Record<MemberCmsStatus, string> = {
	"CMS Ready": "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Accepted: "border-sky-200/80 bg-sky-50 text-sky-800",
	"Accepted (Terminated)": "border-border bg-muted text-muted-foreground",
	"Needs Review": "border-amber-200/80 bg-amber-50 text-amber-900",
	Error: "border-red-200/80 bg-red-50 text-red-800",
	"Validation Error": "border-red-200/80 bg-red-50 text-red-800",
	"Coverage Mismatch": "border-amber-200/80 bg-amber-50 text-amber-900",
	"Unmapped Plan ID": "border-violet-200/80 bg-violet-50 text-violet-800",
};

export const MEMBER_VALIDATION_RESULT_STYLES: Record<
	MemberValidationResult,
	string
> = {
	Passed: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Corrected: "border-violet-200/80 bg-violet-50 text-violet-800",
	Failed: "border-red-200/80 bg-red-50 text-red-800",
};

// ─── Providers tab ──────────────────────────────────────────────────────────

export type ProviderEdgeStatus = "Valid" | "Invalid NPI" | "Missing ID";
export type ProviderClaimCmsStatus = "CMS Ready" | "Warning" | "Error";
export type ProviderErrorStatus = "Corrected" | "Resolved" | "Open";
export type ProviderIdQualifier = "NPI" | "TIN" | "NCPDP";
export type ProviderRole = "Billing" | "Rendering" | "Dispensing";

export type CmsEdgeProviderListRow = {
	id: string;
	name: string;
	npi: string | null;
	idQualifier: ProviderIdQualifier;
	role: ProviderRole;
	taxonomy: string;
	networkStatus: "In-Network" | "Out-of-Network";
	medicalClaims: number;
	pharmacyClaims: number;
	status: ProviderEdgeStatus;
	errors: number;
};

export const CMS_EDGE_PROVIDERS_KPIS = [
	{
		id: "total",
		label: "Total Providers",
		value: "215,667",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-sky-800",
		icon: "users" as const,
	},
	{
		id: "validated",
		label: "Validated",
		value: "213,201",
		tone: "text-emerald-700 bg-emerald-500/10",
		valueClassName: "text-emerald-700",
		icon: "check" as const,
	},
	{
		id: "invalid",
		label: "Invalid NPI",
		value: "93",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		icon: "alert" as const,
	},
	{
		id: "missing",
		label: "Missing Identifier",
		value: "178",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "circleAlert" as const,
	},
	{
		id: "impacted",
		label: "Claims Impacted",
		value: "1,284",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "file" as const,
	},
] as const;

export const CMS_EDGE_PROVIDER_VALIDATION_RULES = [
	{
		id: "check-digit",
		title: "NPI Check Digit",
		description:
			"Validates the 10-digit NPI using the CMS check digit algorithm.",
		icon: "badge" as const,
	},
	{
		id: "qualifier",
		title: "Identifier Qualifier",
		description:
			"Confirms the identifier qualifier is valid and appropriate for the provider role.",
		icon: "search" as const,
	},
	{
		id: "active-dates",
		title: "Active Dates",
		description:
			"Verifies the provider is active during the claim service dates.",
		icon: "calendar" as const,
	},
	{
		id: "claim-association",
		title: "Claim Association",
		description:
			"Ensures the provider is appropriately associated with the claim record.",
		icon: "link" as const,
	},
] as const;

export const CMS_EDGE_PROVIDERS_LIST: CmsEdgeProviderListRow[] = [
	{
		id: "prv-northshore",
		name: "Northshore Medical Group",
		npi: "1234567893",
		idQualifier: "NPI",
		role: "Billing",
		taxonomy: "208D00000X Family Medicine",
		networkStatus: "In-Network",
		medicalClaims: 4521,
		pharmacyClaims: 0,
		status: "Valid",
		errors: 0,
	},
	{
		id: "prv-sarah",
		name: "Sarah Johnson, MD",
		npi: "1987654321",
		idQualifier: "NPI",
		role: "Rendering",
		taxonomy: "207R00000X Internal Medicine",
		networkStatus: "In-Network",
		medicalClaims: 1842,
		pharmacyClaims: 12,
		status: "Valid",
		errors: 0,
	},
	{
		id: "prv-metro",
		name: "Metro Pharmacy Partners",
		npi: "1678901234",
		idQualifier: "NCPDP",
		role: "Dispensing",
		taxonomy: "333600000X Pharmacy",
		networkStatus: "In-Network",
		medicalClaims: 0,
		pharmacyClaims: 3987,
		status: "Valid",
		errors: 0,
	},
	{
		id: "prv-summit",
		name: "Summit Billing LLC",
		npi: "1111111111",
		idQualifier: "NPI",
		role: "Billing",
		taxonomy: "261QM1300X Multi-Specialty",
		networkStatus: "Out-of-Network",
		medicalClaims: 214,
		pharmacyClaims: 0,
		status: "Invalid NPI",
		errors: 1,
	},
	{
		id: "prv-harbor",
		name: "Harborview Specialty Clinic",
		npi: null,
		idQualifier: "TIN",
		role: "Billing",
		taxonomy: "261Q00000X Clinic/Center",
		networkStatus: "Out-of-Network",
		medicalClaims: 96,
		pharmacyClaims: 0,
		status: "Missing ID",
		errors: 1,
	},
	{
		id: "prv-lena",
		name: "Lena Ortiz, DO",
		npi: "1456789012",
		idQualifier: "NPI",
		role: "Rendering",
		taxonomy: "207Q00000X Family Practice",
		networkStatus: "In-Network",
		medicalClaims: 906,
		pharmacyClaims: 4,
		status: "Valid",
		errors: 0,
	},
];

export const CMS_EDGE_PROVIDER_DETAIL = {
	id: "prv-northshore",
	name: "Northshore Medical Group",
	npi: "1234567893",
	validated: true,
	roles: ["Billing", "Rendering"] as const,
	kpis: [
		{
			id: "type",
			label: "Provider Type",
			value: "Organization",
			tone: "default" as const,
			icon: "building" as const,
		},
		{
			id: "taxonomy",
			label: "Primary Taxonomy",
			value: "208D00000X",
			tone: "default" as const,
			icon: "stethoscope" as const,
		},
		{
			id: "network",
			label: "Network Status",
			value: "In-Network",
			tone: "success" as const,
			icon: "shield" as const,
		},
		{
			id: "medical",
			label: "Medical Claims",
			value: "4,521",
			tone: "default" as const,
			icon: "file" as const,
		},
		{
			id: "pharmacy",
			label: "Pharmacy Claims",
			value: "0",
			tone: "default" as const,
			icon: "pill" as const,
		},
		{
			id: "impacted",
			label: "Claims Impacted",
			value: "0",
			tone: "default" as const,
			icon: "alert" as const,
		},
	],
	identificationLeft: [
		{ label: "Provider Name", value: "Northshore Medical Group" },
		{ label: "NPI / Identifier", value: "1234567893" },
		{ label: "ID Qualifier", value: "NPI" },
		{ label: "Provider Type", value: "Organization" },
		{ label: "Taxonomy", value: "208D00000X - General Practice" },
		{ label: "TIN", value: "***-***6789" },
	],
	identificationRight: [
		{ label: "Effective Date", value: "01/01/2021" },
		{ label: "Termination Date", value: "—" },
		{ label: "Network Status", value: "In-Network", tone: "success" as const },
		{ label: "Source Vendor", value: "BHP Provider Network" },
		{ label: "Last Updated", value: "Jul 24, 2027 04:18 PM" },
	],
	npiValidation: {
		passed: 12,
		warnings: 0,
		errors: 0,
		lastValidated: "Jul 25, 2027 12:58 PM",
		checks: [
			{ id: "c1", label: "10-Digit Format", result: "Passed" as const },
			{ id: "c2", label: "Check Digit", result: "Passed" as const },
			{ id: "c3", label: "NPPES Match", result: "Passed" as const },
			{
				id: "c4",
				label: "Active During Service Dates",
				result: "Passed" as const,
			},
			{ id: "c5", label: "Identifier Qualifier", result: "Passed" as const },
		],
	},
	medicalClaims: [
		{
			id: "clm-1",
			claimId: "CLM-2027-88421",
			uniqueEnrolleeId: "UE-82A91X44",
			providerRole: "Billing",
			serviceDate: "06/12/2027",
			procedureCode: "99213",
			allowedAmount: "$185.00",
			planPaid: "$148.00",
			cmsStatus: "CMS Ready" as ProviderClaimCmsStatus,
			errors: 0,
		},
		{
			id: "clm-2",
			claimId: "CLM-2027-88455",
			uniqueEnrolleeId: "UE-91B72K03",
			providerRole: "Rendering",
			serviceDate: "06/14/2027",
			procedureCode: "80053",
			allowedAmount: "$62.00",
			planPaid: "$49.60",
			cmsStatus: "Warning" as ProviderClaimCmsStatus,
			errors: 1,
		},
		{
			id: "clm-3",
			claimId: "CLM-2027-88502",
			uniqueEnrolleeId: "UE-17C44P82",
			providerRole: "Billing",
			serviceDate: "06/18/2027",
			procedureCode: "90471",
			allowedAmount: "$40.00",
			planPaid: "$32.00",
			cmsStatus: "CMS Ready" as ProviderClaimCmsStatus,
			errors: 0,
		},
		{
			id: "clm-4",
			claimId: "CLM-2027-88541",
			uniqueEnrolleeId: "UE-44K18N02",
			providerRole: "Rendering",
			serviceDate: "06/21/2027",
			procedureCode: "93000",
			allowedAmount: "$95.00",
			planPaid: "$0.00",
			cmsStatus: "Error" as ProviderClaimCmsStatus,
			errors: 2,
		},
	],
	pharmacyClaims: [] as {
		id: string;
		claimId: string;
		uniqueEnrolleeId: string;
		providerRole: string;
		serviceDate: string;
		procedureCode: string;
		allowedAmount: string;
		planPaid: string;
		cmsStatus: ProviderClaimCmsStatus;
		errors: number;
	}[],
	errorHistory: [
		{
			id: "err-1",
			date: "03/02/2026 09:18 AM",
			errorCode: "NPI_CHECK_DIGIT",
			description: "NPI check digit failed initial validation.",
			claimsImpacted: 18,
			status: "Corrected" as ProviderErrorStatus,
			resolution: "Correct NPI applied from NPPES match.",
			resolvedBy: "jdow@bhp.com",
		},
		{
			id: "err-2",
			date: "11/14/2025 02:44 PM",
			errorCode: "NPI_INACTIVE",
			description: "NPI inactive for claim service date range.",
			claimsImpacted: 4,
			status: "Resolved" as ProviderErrorStatus,
			resolution: "Service dates adjusted; NPI active for DOS.",
			resolvedBy: "mchen@bhp.com",
		},
	],
	submissionHistory: [
		{
			id: "psh-1",
			submissionType: "Medical Claims File",
			reportingPeriod: "Q2 2027",
			submittedDate: "Jul 25, 2027 02:35 PM",
			status: "Accepted",
			fileName: "BHP_EDGE_MED_20270725.xml",
		},
		{
			id: "psh-2",
			submissionType: "Medical Claims File",
			reportingPeriod: "Q1 2027",
			submittedDate: "Apr 22, 2027 11:08 AM",
			status: "Accepted",
			fileName: "BHP_EDGE_MED_20270422.xml",
		},
	],
	infoNote:
		"Provider identifiers are submitted within associated medical and pharmacy claims; no standalone CMS provider file is generated.",
} as const;

export const PROVIDER_EDGE_STATUS_STYLES: Record<ProviderEdgeStatus, string> = {
	Valid: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	"Invalid NPI": "border-red-200/80 bg-red-50 text-red-800",
	"Missing ID": "border-amber-200/80 bg-amber-50 text-amber-900",
};

export const PROVIDER_CLAIM_STATUS_STYLES: Record<
	ProviderClaimCmsStatus,
	string
> = {
	"CMS Ready": "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Error: "border-red-200/80 bg-red-50 text-red-800",
};

export const PROVIDER_ERROR_STATUS_STYLES: Record<ProviderErrorStatus, string> =
	{
		Corrected: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
		Resolved: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
		Open: "border-amber-200/80 bg-amber-50 text-amber-900",
	};

export const PROVIDER_ROLE_STYLES: Record<string, string> = {
	Billing: "border-sky-200/80 bg-sky-50 text-sky-800",
	Rendering: "border-violet-200/80 bg-violet-50 text-violet-800",
	Dispensing: "border-amber-200/80 bg-amber-50 text-amber-900",
};

// ─── Claims tab (Medical Claims) ────────────────────────────────────────────

export type MedicalClaimCmsStatus = "Ready" | "Warning" | "Error";
export type MedicalClaimTransaction = "Original" | "Replacement" | "Void";
export type MedicalClaimFilterTab =
	| "all"
	| "ready"
	| "errors"
	| "warnings"
	| "voids";
export type MedicalClaimLineValidation = "Passed" | "Warning" | "Error";
export type MedicalClaimDetailCmsStatus =
	| "CMS Ready"
	| "Draft"
	| "Warning"
	| "Error";

export type CmsEdgeMedicalClaimRow = {
	id: string;
	claimId: string;
	enrolleeId: string;
	formType: string;
	statementFrom: string;
	statementThrough: string;
	billingNpi: string;
	primaryDiagnosis: string;
	allowedAmount: number;
	planPaid: number;
	transaction: MedicalClaimTransaction;
	cmsStatus: MedicalClaimCmsStatus;
};

export const CMS_EDGE_MEDICAL_CLAIMS_KPIS = [
	{
		id: "total",
		label: "Total Medical Claims",
		value: "9,842,113",
		hint: null as string | null,
		hintClassName: "",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-foreground",
		icon: "file" as const,
	},
	{
		id: "ready",
		label: "CMS Ready",
		value: "9,790,412",
		hint: "99.47% of total",
		hintClassName: "text-emerald-700",
		tone: "text-emerald-700 bg-emerald-500/10",
		valueClassName: "text-emerald-700",
		icon: "check" as const,
	},
	{
		id: "errors",
		label: "Validation Errors",
		value: "421",
		hint: "0.00% of total",
		hintClassName: "text-red-600",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		icon: "alert" as const,
	},
	{
		id: "warnings",
		label: "CMS Warnings",
		value: "1,842",
		hint: "0.02% of total",
		hintClassName: "text-amber-700",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "ban" as const,
	},
	{
		id: "unmatched",
		label: "Unmatched Members",
		value: "96",
		hint: "0.00% of total",
		hintClassName: "text-violet-700",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "user" as const,
	},
] as const;

export const MEDICAL_FILTER_BADGE_STYLES = {
	error: "bg-red-100 text-red-700",
	warning: "bg-amber-100 text-amber-800",
	void: "bg-violet-100 text-violet-800",
} as const;

export const CMS_EDGE_MEDICAL_CLAIM_FILTER_TABS: {
	id: MedicalClaimFilterTab;
	label: string;
	badge: number | null;
	badgeTone?: keyof typeof MEDICAL_FILTER_BADGE_STYLES;
}[] = [
	{ id: "all", label: "All Claims", badge: null },
	{ id: "ready", label: "Ready", badge: null },
	{ id: "errors", label: "Errors", badge: 421, badgeTone: "error" },
	{ id: "warnings", label: "Warnings", badge: 1842, badgeTone: "warning" },
	{
		id: "voids",
		label: "Voids & Replacements",
		badge: 218,
		badgeTone: "void",
	},
];

export const CMS_EDGE_MEDICAL_CLAIMS_LIST: CmsEdgeMedicalClaimRow[] = [
	{
		id: "mcl-1",
		claimId: "MCL-2027-00842119",
		enrolleeId: "UE-82A91X44",
		formType: "Professional",
		statementFrom: "07/01/2027",
		statementThrough: "07/01/2027",
		billingNpi: "1234567890",
		primaryDiagnosis: "E11.65",
		allowedAmount: 485.0,
		planPaid: 392.5,
		transaction: "Original",
		cmsStatus: "Ready",
	},
	{
		id: "mcl-2",
		claimId: "MCL-2027-00842120",
		enrolleeId: "UE-****4421",
		formType: "Institutional",
		statementFrom: "07/02/2027",
		statementThrough: "07/04/2027",
		billingNpi: "1987654321",
		primaryDiagnosis: "I10",
		allowedAmount: 1240.0,
		planPaid: 980.0,
		transaction: "Original",
		cmsStatus: "Ready",
	},
	{
		id: "mcl-3",
		claimId: "MCL-2027-00842121",
		enrolleeId: "UE-****1190",
		formType: "Professional",
		statementFrom: "07/05/2027",
		statementThrough: "07/05/2027",
		billingNpi: "1456789012",
		primaryDiagnosis: "J45.909",
		allowedAmount: 210.25,
		planPaid: 168.0,
		transaction: "Replacement",
		cmsStatus: "Warning",
	},
	{
		id: "mcl-4",
		claimId: "MCL-2027-00842122",
		enrolleeId: "UE-****3302",
		formType: "Professional",
		statementFrom: "07/06/2027",
		statementThrough: "07/06/2027",
		billingNpi: "1678901234",
		primaryDiagnosis: "Z99.999",
		allowedAmount: 95.0,
		planPaid: 0,
		transaction: "Original",
		cmsStatus: "Error",
	},
	{
		id: "mcl-5",
		claimId: "MCL-2027-00842123",
		enrolleeId: "UE-****7788",
		formType: "Institutional",
		statementFrom: "07/08/2027",
		statementThrough: "07/10/2027",
		billingNpi: "1234567890",
		primaryDiagnosis: "E11.9",
		allowedAmount: 2100.0,
		planPaid: 0,
		transaction: "Void",
		cmsStatus: "Ready",
	},
];

export const CMS_EDGE_MEDICAL_VALIDATION_SUMMARY = [
	{
		id: "proc-rev",
		label: "Procedure/Revenue Mismatch",
		value: "312",
		hint: "0.003% of total",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "alert" as const,
	},
	{
		id: "invalid-dx",
		label: "Invalid Diagnosis Code",
		value: "148",
		hint: "0.002% of total",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "ban" as const,
	},
	{
		id: "missing-npi",
		label: "Missing Rendering NPI",
		value: "87",
		hint: "0.001% of total",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		icon: "user" as const,
	},
	{
		id: "financial",
		label: "Financial Mismatch",
		value: "54",
		hint: "0.001% of total",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-sky-700",
		icon: "dollar" as const,
	},
	{
		id: "void-link",
		label: "Void/Replacement Link Error",
		value: "22",
		hint: "0.000% of total",
		tone: "text-teal-700 bg-teal-500/10",
		valueClassName: "text-teal-700",
		icon: "link" as const,
	},
] as const;

export const MEDICAL_CLAIM_CMS_STATUS_STYLES: Record<
	MedicalClaimCmsStatus,
	string
> = {
	Ready: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Error: "border-red-200/80 bg-red-50 text-red-800",
};

export const MEDICAL_CLAIM_TXN_STYLES: Record<MedicalClaimTransaction, string> =
	{
		Original: "border-sky-200/80 bg-sky-50 text-sky-800",
		Replacement: "border-violet-200/80 bg-violet-50 text-violet-800",
		Void: "border-slate-200/80 bg-slate-100 text-slate-700",
	};

export const CMS_EDGE_MEDICAL_CLAIM_DETAIL = {
	id: "mcl-1",
	claimId: "MCL-2027-00842119",
	cmsStatus: "CMS Ready" as MedicalClaimDetailCmsStatus,
	transaction: "Original" as MedicalClaimTransaction,
	summary: [
		{
			label: "Unique Enrollee ID",
			value: "UE-82A91X44",
			icon: "user" as const,
			link: "View Member",
		},
		{ label: "Plan ID", value: "16696DC0010001", icon: "shield" as const },
		{ label: "Form Type", value: "Professional", icon: "file" as const },
		{ label: "Paid Date", value: "Jul 20, 2027", icon: "calendar" as const },
		{ label: "Total Allowed", value: "$485.00", icon: "dollar" as const },
		{ label: "Plan Paid", value: "$392.50", icon: "wallet" as const },
	],
	headerLeft: [
		{ label: "Claim ID", value: "MCL-2027-00842119" },
		{ label: "Original Claim ID", value: "MCL-2027-00842119" },
		{ label: "Form Type Code", value: "1 (Professional)" },
		{ label: "Claim Processed Date/Time", value: "Jul 18, 2027 10:32:15 AM" },
		{ label: "Void/Replace Code", value: "0 (Original Claim)" },
		{ label: "Diagnosis Type", value: "ICD-10-CM" },
		{
			label: "Primary Diagnosis",
			value: "E11.65 (Type 2 diabetes mellitus with hyperglycemia)",
		},
	],
	headerRight: [
		{ label: "Statement From Date", value: "Jul 01, 2027" },
		{ label: "Statement Through Date", value: "Jul 01, 2027" },
		{
			label: "Billing Provider NPI",
			value: "1234567890",
			link: "View Provider",
		},
		{ label: "Total Allowed Amount", value: "$485.00" },
		{ label: "Policy Paid Total Amount", value: "$392.50" },
	],
	lines: [
		{
			id: "line-1",
			line: 1,
			serviceFrom: "07/01/2027",
			serviceTo: "07/01/2027",
			revenueCode: "—",
			serviceQualifier: "HC",
			procedureCode: "99213",
			modifiers: "—",
			placeOfService: "11",
			renderingNpi: "1456789012",
			allowed: 185.0,
			planPaid: 148.0,
			validation: "Passed" as MedicalClaimLineValidation,
			warning: null as null | {
				code: string;
				message: string;
				recommendedAction: string;
			},
		},
		{
			id: "line-2",
			line: 2,
			serviceFrom: "07/01/2027",
			serviceTo: "07/01/2027",
			revenueCode: "—",
			serviceQualifier: "HC",
			procedureCode: "83036",
			modifiers: "—",
			placeOfService: "11",
			renderingNpi: "1456789012",
			allowed: 95.0,
			planPaid: 76.0,
			validation: "Passed" as MedicalClaimLineValidation,
			warning: null,
		},
		{
			id: "line-3",
			line: 3,
			serviceFrom: "07/01/2027",
			serviceTo: "07/01/2027",
			revenueCode: "0300",
			serviceQualifier: "HC",
			procedureCode: "82962",
			modifiers: "—",
			placeOfService: "11",
			renderingNpi: "1456789012",
			allowed: 120.0,
			planPaid: 96.0,
			validation: "Warning" as MedicalClaimLineValidation,
			warning: {
				code: "W237",
				message: "Procedure code 82962 is inconsistent with revenue code 0300.",
				recommendedAction:
					"Verify the revenue code and procedure-code combination against the source claim.",
			},
		},
		{
			id: "line-4",
			line: 4,
			serviceFrom: "07/01/2027",
			serviceTo: "07/01/2027",
			revenueCode: "—",
			serviceQualifier: "HC",
			procedureCode: "36415",
			modifiers: "—",
			placeOfService: "11",
			renderingNpi: "1456789012",
			allowed: 85.0,
			planPaid: 72.5,
			validation: "Passed" as MedicalClaimLineValidation,
			warning: null,
		},
	],
	lineTotals: { allowed: 485.0, planPaid: 392.5 },
	cmsValidation: {
		passed: 28,
		warnings: 1,
		errors: 0,
		warningDetail: {
			title: "Procedure Code/Revenue Code Mismatch",
			affectedField: "Procedure Code / Revenue Code",
			affectedLine: "3",
			cmsCode: "W237",
			severity: "Warning",
			message: "Procedure code 82962 is inconsistent with revenue code 0300.",
		},
	},
	transactionHistory: [
		{
			id: "txn-1",
			transaction: "Original",
			claimId: "MCL-2027-00842119",
			originalClaimId: "—",
			date: "07/18/2027",
			cmsStatus: "CMS Ready" as MedicalClaimDetailCmsStatus,
		},
		{
			id: "txn-2",
			transaction: "Replacement Draft",
			claimId: "MCL-2027-00842119-R1",
			originalClaimId: "MCL-2027-00842119",
			date: "07/22/2027",
			cmsStatus: "Draft" as MedicalClaimDetailCmsStatus,
		},
	],
	submissionHistory: [
		{
			id: "sh-1",
			environment: "Production",
			fileName: "BHP_EDGE_MED_20270718.xml",
			submittedDate: "Jul 18, 2027 11:05 AM",
			cmsResponse: "Accepted",
			status: "Accepted",
		},
	],
} as const;

export const MEDICAL_CLAIM_DETAIL_STATUS_STYLES: Record<
	MedicalClaimDetailCmsStatus,
	string
> = {
	"CMS Ready": "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Draft: "border-sky-200/80 bg-sky-50 text-sky-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Error: "border-red-200/80 bg-red-50 text-red-800",
};

export const MEDICAL_CLAIM_LINE_VALIDATION_STYLES: Record<
	MedicalClaimLineValidation,
	string
> = {
	Passed: "text-emerald-700",
	Warning: "text-amber-700",
	Error: "text-red-600",
};

// ─── Pharmacy Claims tab ────────────────────────────────────────────────────

export type PharmacyClaimCmsStatus = "Ready" | "Warning" | "Error";
export type PharmacyClaimTransaction = "Original" | "Replacement" | "Void";
export type PharmacyClaimNetwork = "Retail" | "Mail Order";
export type PharmacyClaimFilterTab =
	| "all"
	| "ready"
	| "errors"
	| "warnings"
	| "voids";

export type CmsEdgePharmacyClaimRow = {
	id: string;
	claimId: string;
	enrolleeId: string;
	ndc: string;
	fillDate: string;
	rxReference: string;
	fillNo: number;
	daysSupply: number;
	dispensingNpi: string;
	network: PharmacyClaimNetwork;
	allowedCost: number;
	planPaid: number;
	transaction: PharmacyClaimTransaction;
	cmsStatus: PharmacyClaimCmsStatus;
};

export const CMS_EDGE_PHARMACY_CLAIMS_KPIS = [
	{
		id: "total",
		label: "Total Pharmacy Claims",
		value: "6,318,774",
		hint: null as string | null,
		hintClassName: "",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-foreground",
		icon: "file" as const,
	},
	{
		id: "ready",
		label: "CMS Ready",
		value: "6,262,893",
		hint: "98.12% of total",
		hintClassName: "text-emerald-700",
		tone: "text-emerald-700 bg-emerald-500/10",
		valueClassName: "text-emerald-700",
		icon: "check" as const,
	},
	{
		id: "errors",
		label: "Validation Errors",
		value: "280",
		hint: "0.00% of total",
		hintClassName: "text-red-600",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		icon: "alert" as const,
	},
	{
		id: "invalid-ndc",
		label: "Invalid NDC",
		value: "72",
		hint: "0.00% of total",
		hintClassName: "text-amber-700",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "ban" as const,
	},
	{
		id: "missing-npi",
		label: "Missing Pharmacy NPI",
		value: "41",
		hint: "0.00% of total",
		hintClassName: "text-violet-700",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "user" as const,
	},
] as const;

export const PHARMACY_FILTER_BADGE_STYLES = {
	error: "bg-red-100 text-red-700",
	warning: "bg-amber-100 text-amber-800",
	void: "bg-violet-100 text-violet-800",
} as const;

export const CMS_EDGE_PHARMACY_CLAIM_FILTER_TABS: {
	id: PharmacyClaimFilterTab;
	label: string;
	badge: number | null;
	badgeTone?: keyof typeof PHARMACY_FILTER_BADGE_STYLES;
}[] = [
	{ id: "all", label: "All Claims", badge: null },
	{ id: "ready", label: "Ready", badge: null },
	{ id: "errors", label: "Errors", badge: 280, badgeTone: "error" },
	{ id: "warnings", label: "Warnings", badge: 512, badgeTone: "warning" },
	{
		id: "voids",
		label: "Voids & Replacements",
		badge: 148,
		badgeTone: "void",
	},
];

export const CMS_EDGE_PHARMACY_CLAIMS_LIST: CmsEdgePharmacyClaimRow[] = [
	{
		id: "rx-1",
		claimId: "CLM-27Q2-00000001",
		enrolleeId: "ENR-****8765",
		ndc: "00093-1234-01",
		fillDate: "04/02/2027",
		rxReference: "RX-27Q2-00001234567",
		fillNo: 1,
		daysSupply: 30,
		dispensingNpi: "1678901234",
		network: "Retail",
		allowedCost: 245.8,
		planPaid: 198.4,
		transaction: "Original",
		cmsStatus: "Ready",
	},
	{
		id: "rx-2",
		claimId: "CLM-27Q2-00000002",
		enrolleeId: "ENR-****4421",
		ndc: "68180-0513-03",
		fillDate: "04/03/2027",
		rxReference: "RX-27Q2-00001234601",
		fillNo: 2,
		daysSupply: 90,
		dispensingNpi: "1678901234",
		network: "Mail Order",
		allowedCost: 612.1,
		planPaid: 540.0,
		transaction: "Original",
		cmsStatus: "Ready",
	},
	{
		id: "rx-3",
		claimId: "CLM-27Q2-00000003",
		enrolleeId: "ENR-****1190",
		ndc: "00074-3042-13",
		fillDate: "04/05/2027",
		rxReference: "RX-27Q2-00001234888",
		fillNo: 1,
		daysSupply: 30,
		dispensingNpi: "1456789012",
		network: "Retail",
		allowedCost: 89.25,
		planPaid: 65.0,
		transaction: "Replacement",
		cmsStatus: "Warning",
	},
	{
		id: "rx-4",
		claimId: "CLM-27Q2-00000004",
		enrolleeId: "ENR-****3302",
		ndc: "00002-1433-80",
		fillDate: "04/06/2027",
		rxReference: "RX-27Q2-00001235002",
		fillNo: 1,
		daysSupply: 0,
		dispensingNpi: "1678901234",
		network: "Retail",
		allowedCost: 412.0,
		planPaid: 360.0,
		transaction: "Original",
		cmsStatus: "Error",
	},
	{
		id: "rx-5",
		claimId: "CLM-27Q2-00000005",
		enrolleeId: "ENR-****7788",
		ndc: "68180-0513-03",
		fillDate: "04/08/2027",
		rxReference: "RX-27Q2-00001235110",
		fillNo: 1,
		daysSupply: 30,
		dispensingNpi: "1678901234",
		network: "Mail Order",
		allowedCost: 612.1,
		planPaid: 0.0,
		transaction: "Void",
		cmsStatus: "Ready",
	},
];

export const CMS_EDGE_PHARMACY_VALIDATION_SUMMARY = [
	{
		id: "invalid-ndc",
		label: "Invalid NDC",
		value: "72",
		hint: "0.001% of total",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		icon: "ban" as const,
	},
	{
		id: "missing-days",
		label: "Missing Days Supply",
		value: "134",
		hint: "0.002% of total",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "calendar" as const,
	},
	{
		id: "invalid-npi",
		label: "Invalid Dispensing Provider NPI",
		value: "41",
		hint: "0.001% of total",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "user" as const,
	},
	{
		id: "financial",
		label: "Financial Mismatch",
		value: "33",
		hint: "0.001% of total",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-sky-700",
		icon: "dollar" as const,
	},
	{
		id: "void-link",
		label: "Void/Replacement Link Error",
		value: "12",
		hint: "0.000% of total",
		tone: "text-teal-700 bg-teal-500/10",
		valueClassName: "text-teal-700",
		icon: "link" as const,
	},
] as const;

export const PHARMACY_CLAIM_CMS_STATUS_STYLES: Record<
	PharmacyClaimCmsStatus,
	string
> = {
	Ready: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Error: "border-red-200/80 bg-red-50 text-red-800",
};

export const PHARMACY_CLAIM_TXN_STYLES: Record<
	PharmacyClaimTransaction,
	string
> = {
	Original: "border-sky-200/80 bg-sky-50 text-sky-800",
	Replacement: "border-violet-200/80 bg-violet-50 text-violet-800",
	Void: "border-slate-200/80 bg-slate-100 text-slate-700",
};

export type PharmacyClaimDetailCmsStatus =
	| "CMS Ready"
	| "Draft"
	| "Warning"
	| "Error";
export type PharmacyClaimValidationResult = "Passed" | "Warning" | "Failed";

export const CMS_EDGE_PHARMACY_CLAIM_DETAIL = {
	id: "rx-1",
	claimId: "PCL-2027-0001234567",
	cmsStatus: "CMS Ready" as PharmacyClaimDetailCmsStatus,
	transaction: "Original" as PharmacyClaimTransaction,
	summary: [
		{
			label: "Unique Enrollee ID",
			value: "UE-82A91X44",
			icon: "user" as const,
		},
		{ label: "Plan ID", value: "16696DC0010001", icon: "id" as const },
		{ label: "NDC", value: "00093-1234-01", icon: "pill" as const },
		{ label: "Fill Date", value: "Apr 2, 2027", icon: "calendar" as const },
		{ label: "Allowed Cost", value: "$85.42", icon: "dollar" as const },
		{ label: "Plan Paid", value: "$25.62", icon: "dollar" as const },
	],
	claimInfoLeft: [
		{ label: "Claim ID", value: "PCL-2027-0001234567" },
		{ label: "Original Claim ID", value: "—" },
		{ label: "Record ID", value: "RX-27Q2-00001234567" },
		{ label: "Unique Enrollee ID", value: "UE-82A91X44" },
		{ label: "Claim Processed Date/Time", value: "04/05/2027 09:14 AM" },
		{ label: "Issuer Claim Paid Date", value: "04/06/2027" },
	],
	claimInfoRight: [
		{ label: "Fill Date", value: "04/02/2027" },
		{ label: "Prescription Reference Number", value: "RX-27Q2-00001234567" },
		{ label: "Fill Number", value: "1" },
		{ label: "Dispensing Status Code", value: "P - Paid" },
		{ label: "Void/Replace Code", value: "0 - Original" },
		{ label: "Plan ID", value: "16696DC0010001" },
		{ label: "HIOS Issuer ID", value: "16696" },
	],
	drugInfoLeft: [
		{ label: "Product Service ID / NDC", value: "00093-1234-01" },
		{ label: "Drug Name", value: "Metformin HCl 500 mg Tablet" },
		{ label: "Days Supply", value: "30" },
		{ label: "Quantity Dispensed", value: "60" },
		{ label: "Dispensing Provider NPI", value: "1678901234" },
	],
	drugInfoRight: [
		{ label: "Provider Name", value: "HealthPlus Pharmacy" },
		{ label: "Provider ID Qualifier", value: "NPI" },
		{ label: "Pharmacy Network Indicator", value: "In-Network" },
		{ label: "Pharmacy Type", value: "Retail" },
		{ label: "Prescriber NPI", value: "1456789012" },
	],
	financial: {
		allowedCost: "$85.42",
		planPaid: "$25.62",
		memberResponsibility: "$59.80",
		difference: "$0.00",
		equation: "$85.42 = $25.62 + $59.80",
		status: "Balanced",
	},
	transactionHistory: [
		{
			id: "txn-1",
			transaction: "Original",
			claimId: "PCL-2027-0001234567",
			originalClaimId: "—",
			processedDate: "04/05/2027",
			allowedCost: "$85.42",
			planPaid: "$25.62",
			cmsStatus: "CMS Ready" as PharmacyClaimDetailCmsStatus,
		},
		{
			id: "txn-2",
			transaction: "Replacement Draft",
			claimId: "PCL-2027-0001234567-R1",
			originalClaimId: "PCL-2027-0001234567",
			processedDate: "04/12/2027",
			allowedCost: "$85.42",
			planPaid: "$25.62",
			cmsStatus: "Draft" as PharmacyClaimDetailCmsStatus,
		},
	],
	validationHistory: [
		{
			id: "vh-1",
			date: "04/05/2027 09:14 AM",
			rule: "NDC Format",
			result: "Passed" as PharmacyClaimValidationResult,
			message: "NDC is valid and active.",
			sourceFile: "BHP_PHARM_20270405_001.dat",
			reviewedBy: "System",
		},
		{
			id: "vh-2",
			date: "04/05/2027 09:14 AM",
			rule: "Days Supply",
			result: "Passed" as PharmacyClaimValidationResult,
			message: "Days supply is within expected range.",
			sourceFile: "BHP_PHARM_20270405_001.dat",
			reviewedBy: "System",
		},
		{
			id: "vh-3",
			date: "04/05/2027 09:14 AM",
			rule: "Pharmacy Network Map",
			result: "Warning" as PharmacyClaimValidationResult,
			message: "Network indicator mapped from source value RETAIL-IN.",
			sourceFile: "BHP_PHARM_20270405_001.dat",
			reviewedBy: "System",
		},
		{
			id: "vh-4",
			date: "04/05/2027 09:14 AM",
			rule: "Financial Balance",
			result: "Passed" as PharmacyClaimValidationResult,
			message: "Allowed cost equals plan paid plus member responsibility.",
			sourceFile: "BHP_PHARM_20270405_001.dat",
			reviewedBy: "System",
		},
	],
	cmsValidation: {
		passed: 26,
		warnings: 1,
		errors: 0,
		checks: [
			{ id: "c1", label: "Member Enrollment Match", result: "Passed" },
			{ id: "c2", label: "NDC Format", result: "Passed" },
			{ id: "c3", label: "Days Supply", result: "Passed" },
			{ id: "c4", label: "Dispensing Provider NPI", result: "Passed" },
			{ id: "c5", label: "Financial Balance", result: "Passed" },
			{ id: "c6", label: "Fill Date in Period", result: "Passed" },
		],
		alert:
			"Pharmacy network indicator was mapped from the source vendor value RETAIL-IN.",
	},
	submissionHistory: [
		{
			id: "sh-1",
			submissionType: "Pharmacy Claims File",
			reportingPeriod: "Q2 2027",
			submittedDate: "Jul 18, 2027 09:12 AM",
			status: "Accepted",
			fileName: "BHP_EDGE_PHARM_20270718.xml",
		},
	],
} as const;

export const PHARMACY_CLAIM_DETAIL_STATUS_STYLES: Record<
	PharmacyClaimDetailCmsStatus,
	string
> = {
	"CMS Ready": "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Draft: "border-sky-200/80 bg-sky-50 text-sky-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Error: "border-red-200/80 bg-red-50 text-red-800",
};

export const PHARMACY_CLAIM_VALIDATION_RESULT_STYLES: Record<
	PharmacyClaimValidationResult,
	string
> = {
	Passed: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Failed: "border-red-200/80 bg-red-50 text-red-800",
};

// ─── Supplemental Diagnoses tab ─────────────────────────────────────────────

export type SupplementalDxCmsStatus = "Ready" | "Warning" | "Error";
export type SupplementalDxTransaction = "Original" | "Replacement" | "Void";
export type SupplementalDxClaimLink = "Matched" | "Unmatched";
export type SupplementalDxFilterTab =
	| "all"
	| "ready"
	| "errors"
	| "warnings"
	| "voids";

export type CmsEdgeSupplementalDxRow = {
	id: string;
	recordId: string;
	enrolleeId: string;
	originalClaimId: string | null;
	detailRecordId: string;
	diagnosisType: string;
	diagnosisCode: string;
	serviceFrom: string;
	serviceTo: string;
	transaction: SupplementalDxTransaction;
	claimLink: SupplementalDxClaimLink;
	cmsStatus: SupplementalDxCmsStatus;
};

export const CMS_EDGE_SUPPLEMENTAL_DX_KPIS = [
	{
		id: "total",
		label: "Total Diagnosis Records",
		value: "6,315,889",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-sky-800",
		icon: "file" as const,
	},
	{
		id: "ready",
		label: "CMS Ready",
		value: "6,307,821",
		tone: "text-emerald-700 bg-emerald-500/10",
		valueClassName: "text-emerald-700",
		icon: "check" as const,
	},
	{
		id: "errors",
		label: "Validation Errors",
		value: "8,068",
		tone: "text-red-700 bg-red-500/10",
		valueClassName: "text-red-600",
		icon: "alert" as const,
	},
	{
		id: "unmatched",
		label: "Unmatched Claims",
		value: "1,245",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "unlink" as const,
	},
	{
		id: "invalid-code",
		label: "Invalid Diagnosis Codes",
		value: "687",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "code" as const,
	},
] as const;

export const CMS_EDGE_SUPPLEMENTAL_DX_FILTER_TABS: {
	id: SupplementalDxFilterTab;
	label: string;
}[] = [
	{ id: "all", label: "All Records" },
	{ id: "ready", label: "Ready" },
	{ id: "errors", label: "Errors" },
	{ id: "warnings", label: "Warnings" },
	{ id: "voids", label: "Voids & Replacements" },
];

export const CMS_EDGE_SUPPLEMENTAL_DX_LIST: CmsEdgeSupplementalDxRow[] = [
	{
		id: "sdr-1",
		recordId: "SDR-27-0000012345",
		enrolleeId: "UEI-27-****5678",
		originalClaimId: "CLM-27-****9012",
		detailRecordId: "DR-27-0000001",
		diagnosisType: "ICD-10-CM",
		diagnosisCode: "E11.65",
		serviceFrom: "04/02/2027",
		serviceTo: "04/02/2027",
		transaction: "Original",
		claimLink: "Matched",
		cmsStatus: "Ready",
	},
	{
		id: "sdr-2",
		recordId: "SDR-27-0000012346",
		enrolleeId: "UEI-27-****4412",
		originalClaimId: "CLM-27-****3344",
		detailRecordId: "DR-27-0000002",
		diagnosisType: "ICD-10-CM",
		diagnosisCode: "I10",
		serviceFrom: "04/03/2027",
		serviceTo: "04/05/2027",
		transaction: "Original",
		claimLink: "Matched",
		cmsStatus: "Ready",
	},
	{
		id: "sdr-3",
		recordId: "SDR-27-0000012347",
		enrolleeId: "UEI-27-****8821",
		originalClaimId: "CLM-27-****7788",
		detailRecordId: "DR-27-0000003",
		diagnosisType: "ICD-10-CM",
		diagnosisCode: "J45.909",
		serviceFrom: "04/04/2027",
		serviceTo: "04/04/2027",
		transaction: "Replacement",
		claimLink: "Unmatched",
		cmsStatus: "Warning",
	},
	{
		id: "sdr-4",
		recordId: "SDR-27-0000012348",
		enrolleeId: "UEI-27-****1190",
		originalClaimId: null,
		detailRecordId: "DR-27-0000004",
		diagnosisType: "ICD-10-CM",
		diagnosisCode: "Z99.999",
		serviceFrom: "04/06/2027",
		serviceTo: "04/06/2027",
		transaction: "Original",
		claimLink: "Unmatched",
		cmsStatus: "Error",
	},
	{
		id: "sdr-5",
		recordId: "SDR-27-0000012349",
		enrolleeId: "UEI-27-****5566",
		originalClaimId: "CLM-27-****2211",
		detailRecordId: "DR-27-0000005",
		diagnosisType: "ICD-10-CM",
		diagnosisCode: "E11.65",
		serviceFrom: "04/08/2027",
		serviceTo: "04/08/2027",
		transaction: "Void",
		claimLink: "Matched",
		cmsStatus: "Ready",
	},
];

export const CMS_EDGE_SUPPLEMENTAL_DX_VALIDATION_SUMMARY = [
	{
		id: "unmatched",
		label: "Unmatched Medical Claim",
		value: "1,245",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-red-600",
		icon: "unlink" as const,
	},
	{
		id: "invalid-code",
		label: "Invalid Diagnosis Code",
		value: "687",
		tone: "text-violet-700 bg-violet-500/10",
		valueClassName: "text-violet-700",
		icon: "code" as const,
	},
	{
		id: "missing-date",
		label: "Missing Service Date",
		value: "312",
		tone: "text-amber-700 bg-amber-500/10",
		valueClassName: "text-amber-700",
		icon: "calendar" as const,
	},
	{
		id: "member-mismatch",
		label: "Member Enrollment Mismatch",
		value: "96",
		tone: "text-sky-700 bg-sky-500/10",
		valueClassName: "text-sky-700",
		icon: "user" as const,
	},
	{
		id: "void-link",
		label: "Void/Replacement Link Error",
		value: "42",
		tone: "text-teal-700 bg-teal-500/10",
		valueClassName: "text-teal-700",
		icon: "link" as const,
	},
] as const;

export const SUPPLEMENTAL_DX_CMS_STATUS_STYLES: Record<
	SupplementalDxCmsStatus,
	string
> = {
	Ready: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Error: "border-red-200/80 bg-red-50 text-red-800",
};

export const SUPPLEMENTAL_DX_TXN_STYLES: Record<
	SupplementalDxTransaction,
	string
> = {
	Original: "border-sky-200/80 bg-sky-50 text-sky-800",
	Replacement: "border-violet-200/80 bg-violet-50 text-violet-800",
	Void: "border-slate-200/80 bg-slate-100 text-slate-700",
};

export const SUPPLEMENTAL_DX_CLAIM_LINK_STYLES: Record<
	SupplementalDxClaimLink,
	string
> = {
	Matched: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Unmatched: "border-red-200/80 bg-red-50 text-red-800",
};

export type SupplementalDxDetailCmsStatus =
	| "CMS Ready"
	| "Draft"
	| "Warning"
	| "Error";
export type SupplementalDxHistoryResult =
	| "Passed"
	| "Accepted"
	| "Warning"
	| "Failed";

export const CMS_EDGE_SUPPLEMENTAL_DX_DETAIL = {
	id: "sdr-1",
	recordId: "SDR-27-0000012345",
	cmsStatus: "CMS Ready" as SupplementalDxDetailCmsStatus,
	transaction: "Original" as SupplementalDxTransaction,
	summary: [
		{
			label: "Unique Enrollee ID",
			value: "UE-82A91X44",
			icon: "user" as const,
		},
		{
			label: "Original Medical Claim ID",
			value: "MCL-2027-00842119",
			icon: "clipboard" as const,
		},
		{
			label: "Diagnosis Code",
			value: "E11.65",
			icon: "stethoscope" as const,
		},
		{ label: "Service Date", value: "Apr 1, 2027", icon: "calendar" as const },
		{ label: "Plan ID", value: "16696DC0010001", icon: "shield" as const },
		{ label: "Claim Link", value: "Matched", icon: "link" as const },
	],
	recordInfoLeft: [
		{ label: "Supplemental Record ID", value: "SDR-27-0000012345" },
		{ label: "Diagnosis Detail Record ID", value: "DR-27-00000001" },
		{ label: "Original Diagnosis Detail Record ID", value: "—" },
		{ label: "Transaction Type", value: "Original" },
		{ label: "Void/Replace Code", value: "0 - Original Record" },
	],
	recordInfoRight: [
		{ label: "Diagnosis Type", value: "ICD-10-CM" },
		{ label: "Diagnosis Code", value: "E11.65" },
		{
			label: "Diagnosis Description",
			value: "Type 2 diabetes mellitus with hyperglycemia",
		},
		{ label: "Service From Date", value: "04/01/2027" },
		{ label: "Service Through Date", value: "04/01/2027" },
		{ label: "Source Vendor", value: "BHP Medical Claims" },
		{
			label: "Source File",
			value: "BHP_SUPPLEMENTAL_DX_20270405_001.dat",
		},
	],
	memberLink: {
		name: "Jordan M.",
		enrolleeId: "UE-82A91X44",
		enrollmentStatus: "Active on Service Date",
		coveragePeriod: "01/01/2027 – 12/31/2027",
	},
	claimLink: {
		claimId: "MCL-2027-00842119",
		claimStatus: "Paid",
		primaryDiagnosis: "E11.9",
		allowedAmount: "$485.00",
		planPaid: "$392.50",
		matched: true,
	},
	transactionHistory: [
		{
			id: "txn-1",
			transaction: "Original",
			recordId: "SDR-27-0000012345",
			originalDetailRecordId: "—",
			diagnosisCode: "E11.65",
			processedDate: "04/05/2027",
			cmsStatus: "CMS Ready" as SupplementalDxDetailCmsStatus,
		},
		{
			id: "txn-2",
			transaction: "Replacement Draft",
			recordId: "SDR-27-0000012345-R1",
			originalDetailRecordId: "DR-27-00000001",
			diagnosisCode: "E11.65",
			processedDate: "04/12/2027",
			cmsStatus: "Draft" as SupplementalDxDetailCmsStatus,
		},
	],
	submissionHistory: [
		{
			id: "sh-1",
			date: "04/05/2027 10:22 AM",
			activity: "Source Validation",
			environment: "Prod",
			fileName: "BHP_SUPPLEMENTAL_DX_20270405_001.dat",
			result: "Passed" as SupplementalDxHistoryResult,
			reviewedBy: "System",
		},
		{
			id: "sh-2",
			date: "07/18/2027 09:40 AM",
			activity: "File Generation",
			environment: "Prod",
			fileName: "BHP_EDGE_SUPP_DX_20270718.xml",
			result: "Passed" as SupplementalDxHistoryResult,
			reviewedBy: "jdoe@bhphealthcare.com",
		},
		{
			id: "sh-3",
			date: "07/18/2027 11:05 AM",
			activity: "CMS Submission",
			environment: "Prod",
			fileName: "BHP_EDGE_SUPP_DX_20270718.xml",
			result: "Accepted" as SupplementalDxHistoryResult,
			reviewedBy: "System",
		},
	],
	cmsValidation: {
		passed: 18,
		warnings: 1,
		errors: 0,
		checks: [
			{ id: "c1", label: "Diagnosis Code Valid", result: "Passed" },
			{ id: "c2", label: "Plan ID Match", result: "Passed" },
			{ id: "c3", label: "Member Enrollment Match", result: "Passed" },
			{ id: "c4", label: "Service Date in Coverage", result: "Passed" },
			{ id: "c5", label: "Medical Claim Link", result: "Passed" },
			{ id: "c6", label: "Transaction Integrity", result: "Passed" },
		],
		alert:
			"Supplemental diagnosis differs from the medical claim primary diagnosis; accepted as an additional diagnosis.",
	},
} as const;

export const SUPPLEMENTAL_DX_DETAIL_STATUS_STYLES: Record<
	SupplementalDxDetailCmsStatus,
	string
> = {
	"CMS Ready": "border-emerald-200/80 bg-emerald-50 text-emerald-800",
	Draft: "border-sky-200/80 bg-sky-50 text-sky-800",
	Warning: "border-amber-200/80 bg-amber-50 text-amber-900",
	Error: "border-red-200/80 bg-red-50 text-red-800",
};

export const SUPPLEMENTAL_DX_HISTORY_RESULT_STYLES: Record<
	SupplementalDxHistoryResult,
	string
> = {
	Passed: "text-emerald-700",
	Accepted: "text-emerald-700",
	Warning: "text-amber-700",
	Failed: "text-red-600",
};

// ─── Responses tab ──────────────────────────────────────────────────────────

export type CmsResponseStatus = "Completed" | "Pending" | "Error";
export type CmsResponseFileType =
	| "Enrollment"
	| "Medical"
	| "Pharmacy"
	| "Supplemental Diagnosis"
	| "Encounter";
export type CmsResponseEnvironment = "Test" | "Validation" | "Production";
export type CmsResponseType =
	| "Acceptance Report"
	| "Validation Response"
	| "Payment Report"
	| "Withhold Report"
	| "Error Report";

export type CmsResponseRow = {
	id: string;
	responseFile: string;
	responseType: CmsResponseType;
	fileType: CmsResponseFileType;
	environment: CmsResponseEnvironment;
	relatedSubmission: string;
	reportingPeriod: string;
	dateReceived: string;
	status: CmsResponseStatus;
	accepted: number;
	rejected: number;
};

export type CmsResponseSummaryCard = {
	id: string;
	label: string;
	fileType: CmsResponseFileType;
	accepted: number;
	rejected: number;
	acceptanceRate: number;
};

export const CMS_EDGE_RESPONSE_FILE_TYPES: CmsResponseFileType[] = [
	"Enrollment",
	"Medical",
	"Pharmacy",
	"Supplemental Diagnosis",
	"Encounter",
];

export const CMS_EDGE_RESPONSE_TYPES: CmsResponseType[] = [
	"Acceptance Report",
	"Validation Response",
	"Payment Report",
	"Withhold Report",
	"Error Report",
];

export const CMS_EDGE_RESPONSE_STATUSES: CmsResponseStatus[] = [
	"Completed",
	"Pending",
	"Error",
];

export const CMS_EDGE_RESPONSE_KPIS = {
	responseFiles: 18,
	acceptedRecords: 18_570_736,
	rejectedRecords: 34_176,
	pendingResponses: 1,
};

export const CMS_EDGE_RESPONSES_LIST: CmsResponseRow[] = [
	{
		id: "r-1",
		responseFile: "EDGE_Q2_2027_Enrollment_Accept.xml",
		responseType: "Acceptance Report",
		fileType: "Enrollment",
		environment: "Production",
		relatedSubmission: "SUB-2027-000012",
		reportingPeriod: "Q2 2027",
		dateReceived: "05/12/2027 02:18 PM",
		status: "Completed",
		accepted: 12_301,
		rejected: 18,
	},
	{
		id: "r-2",
		responseFile: "EDGE_Q2_2027_Medical_Valid.xml",
		responseType: "Validation Response",
		fileType: "Medical",
		environment: "Production",
		relatedSubmission: "SUB-2027-000009",
		reportingPeriod: "Q2 2027",
		dateReceived: "05/11/2027 04:05 PM",
		status: "Completed",
		accepted: 48_920,
		rejected: 184,
	},
	{
		id: "r-3",
		responseFile: "EDGE_Q2_2027_Pharmacy_Accept.xml",
		responseType: "Acceptance Report",
		fileType: "Pharmacy",
		environment: "Validation",
		relatedSubmission: "SUB-2027-000007",
		reportingPeriod: "Q2 2027",
		dateReceived: "05/10/2027 11:42 AM",
		status: "Pending",
		accepted: 0,
		rejected: 0,
	},
	{
		id: "r-4",
		responseFile: "EDGE_Q2_2027_SuppDx_Valid.xml",
		responseType: "Validation Response",
		fileType: "Supplemental Diagnosis",
		environment: "Test",
		relatedSubmission: "SUB-2027-000004",
		reportingPeriod: "Q2 2027",
		dateReceived: "05/09/2027 09:30 AM",
		status: "Completed",
		accepted: 6_780,
		rejected: 32,
	},
	{
		id: "r-5",
		responseFile: "EDGE_Q2_2027_Encounter_Accept.xml",
		responseType: "Acceptance Report",
		fileType: "Encounter",
		environment: "Production",
		relatedSubmission: "SUB-2027-000006",
		reportingPeriod: "Q2 2027",
		dateReceived: "05/08/2027 03:15 PM",
		status: "Completed",
		accepted: 47_610,
		rejected: 370,
	},
	{
		id: "r-6",
		responseFile: "EDGE_Q2_2027_Medical_Error.xml",
		responseType: "Error Report",
		fileType: "Medical",
		environment: "Production",
		relatedSubmission: "SUB-2027-000003",
		reportingPeriod: "Q2 2027",
		dateReceived: "05/07/2027 01:22 PM",
		status: "Error",
		accepted: 0,
		rejected: 1_204,
	},
	{
		id: "r-7",
		responseFile: "EDGE_Q2_2027_Enrollment_Valid.xml",
		responseType: "Validation Response",
		fileType: "Enrollment",
		environment: "Validation",
		relatedSubmission: "SUB-2027-000008",
		reportingPeriod: "Q2 2027",
		dateReceived: "05/06/2027 10:08 AM",
		status: "Completed",
		accepted: 12_540,
		rejected: 48,
	},
	{
		id: "r-8",
		responseFile: "EDGE_Q2_2027_Pharmacy_Payment.xml",
		responseType: "Payment Report",
		fileType: "Pharmacy",
		environment: "Production",
		relatedSubmission: "SUB-2027-000011",
		reportingPeriod: "Q2 2027",
		dateReceived: "05/05/2027 05:40 PM",
		status: "Completed",
		accepted: 29_650,
		rejected: 124,
	},
	{
		id: "r-9",
		responseFile: "EDGE_Q1_2027_Medical_Accept.xml",
		responseType: "Acceptance Report",
		fileType: "Medical",
		environment: "Production",
		relatedSubmission: "SUB-2027-000002",
		reportingPeriod: "Q1 2027",
		dateReceived: "04/28/2027 09:20 AM",
		status: "Completed",
		accepted: 46_210,
		rejected: 210,
	},
	{
		id: "r-10",
		responseFile: "EDGE_Q1_2027_Enrollment_Accept.xml",
		responseType: "Acceptance Report",
		fileType: "Enrollment",
		environment: "Production",
		relatedSubmission: "SUB-2027-000001",
		reportingPeriod: "Q1 2027",
		dateReceived: "04/22/2027 02:55 PM",
		status: "Completed",
		accepted: 12_480,
		rejected: 22,
	},
];

export const CMS_EDGE_RESPONSE_LATEST_SUMMARY: CmsResponseSummaryCard[] = [
	{
		id: "sum-enrollment",
		label: "Enrollment",
		fileType: "Enrollment",
		accepted: 12_301,
		rejected: 18,
		acceptanceRate: 99.85,
	},
	{
		id: "sum-medical",
		label: "Medical",
		fileType: "Medical",
		accepted: 48_920,
		rejected: 184,
		acceptanceRate: 99.63,
	},
	{
		id: "sum-pharmacy",
		label: "Pharmacy",
		fileType: "Pharmacy",
		accepted: 29_650,
		rejected: 124,
		acceptanceRate: 99.58,
	},
	{
		id: "sum-supp",
		label: "Supplemental Diagnosis",
		fileType: "Supplemental Diagnosis",
		accepted: 6_780,
		rejected: 32,
		acceptanceRate: 99.53,
	},
];

export const CMS_EDGE_RESPONSE_SELECTED = {
	responseFile: "EDGE_Q2_2027_Enrollment_Accept.xml",
	responseType: "Acceptance Report" as CmsResponseType,
	relatedSubmission: "SUB-2027-000012",
	dateReceived: "05/12/2027 02:18 PM ET",
	status: "Completed" as CmsResponseStatus,
	records: 12_319,
	fileName: "EDGE_Q2_2027_Enrollment_Accept.xml",
	fileSize: "3.82 MB",
	fileFormat: "XML",
	description:
		"CMS acceptance report for Q2 2027 enrollment submission. Accepted and rejected record counts included.",
};

export const CMS_EDGE_RESPONSE_TYPE_MIX = [
	{ name: "Validation Response", count: 4, color: "#3b82f6", pct: 40 },
	{ name: "Acceptance Report", count: 4, color: "#22c55e", pct: 40 },
	{ name: "Payment Report", count: 1, color: "#8b5cf6", pct: 10 },
	{ name: "Error Report", count: 1, color: "#ef4444", pct: 10 },
];

export const CMS_EDGE_RESPONSE_STATUS_TREND = [
	{ quarter: "Q3 2026", completed: 5, pending: 1, errors: 0 },
	{ quarter: "Q4 2026", completed: 4, pending: 0, errors: 1 },
	{ quarter: "Q1 2027", completed: 6, pending: 0, errors: 0 },
	{ quarter: "Q2 2027", completed: 8, pending: 1, errors: 1 },
];

export const CMS_RESPONSE_STATUS_STYLES: Record<CmsResponseStatus, string> = {
	Completed:
		"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
	Pending:
		"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
	Error: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

export type CmsEdgeResponseDetailFile = {
	id: string;
	name: string;
	kind: string;
	sizeLabel: string;
	format: string;
	primary?: boolean;
};

export type CmsEdgeResponseDetailNote = {
	id: string;
	dateTime: string;
	source: string;
	note: string;
};

export type CmsEdgeResponseDetail = CmsResponseRow & {
	fileSize: string;
	fileFormat: string;
	description: string;
	totalRecords: number;
	acceptanceRate: number;
	warnings: number;
	files: CmsEdgeResponseDetailFile[];
	notes: CmsEdgeResponseDetailNote[];
	resultHighlights: { label: string; value: string }[];
};

/** Resolve a CMS EDGE response detail by list row id. */
export function getCmsEdgeResponseDetail(
	id: string
): CmsEdgeResponseDetail | null {
	const row = CMS_EDGE_RESPONSES_LIST.find((item) => item.id === id);
	if (!row) return null;

	const totalRecords = row.accepted + row.rejected;
	const acceptanceRate = totalRecords
		? Math.round((row.accepted / totalRecords) * 1000) / 10
		: 0;
	const base = row.responseFile.replace(/\.[^.]+$/, "");
	const format = row.responseFile.split(".").pop()?.toUpperCase() ?? "XML";

	const files: CmsEdgeResponseDetailFile[] = [
		{
			id: "response-payload",
			name: row.responseFile,
			kind: row.responseType,
			sizeLabel:
				row.status === "Pending"
					? "—"
					: row.responseType === "Error Report"
						? "640 KB"
						: "3.8 MB",
			format,
			primary: true,
		},
	];

	if (row.status !== "Pending") {
		files.push({
			id: "response-summary",
			name: `${base}_Summary.json`,
			kind: "Parsed summary",
			sizeLabel: "18 KB",
			format: "JSON",
		});
	}

	if (row.rejected > 0 || row.responseType === "Error Report") {
		files.push({
			id: "error-extract",
			name: `${base}_ErrorExtract.csv`,
			kind: "Rejected record extract",
			sizeLabel: "96 KB",
			format: "CSV",
		});
	}

	const notes: CmsEdgeResponseDetailNote[] = [
		{
			id: `${row.id}-n1`,
			dateTime: row.dateReceived,
			source: "CMS EDGE",
			note: `${row.responseType} received for ${row.relatedSubmission}.`,
		},
		{
			id: `${row.id}-n2`,
			dateTime: row.dateReceived,
			source: "System",
			note:
				row.status === "Pending"
					? "Response file queued for parsing. Counts will update when processing completes."
					: row.status === "Error"
						? "Error report indicates blocking validation failures. Review rejected extract before resubmission."
						: `Processed ${totalRecords.toLocaleString()} records · ${acceptanceRate}% accepted.`,
		},
	];

	const resultHighlights =
		row.status === "Pending"
			? [
					{ label: "Processing state", value: "Awaiting CMS completion" },
					{ label: "Related submission", value: row.relatedSubmission },
					{ label: "Environment", value: row.environment },
				]
			: [
					{
						label: "Acceptance rate",
						value: `${acceptanceRate}%`,
					},
					{
						label: "Accepted records",
						value: row.accepted.toLocaleString(),
					},
					{
						label: "Rejected records",
						value: row.rejected.toLocaleString(),
					},
					{
						label: "Related submission",
						value: row.relatedSubmission,
					},
				];

	return {
		...row,
		fileSize: files[0]?.sizeLabel ?? "—",
		fileFormat: format,
		description:
			row.status === "Pending"
				? `Pending ${row.responseType.toLowerCase()} for ${row.fileType} in ${row.environment}.`
				: row.status === "Error"
					? `CMS returned an error report for ${row.fileType}. Review rejected records and remediate before resubmit.`
					: `CMS ${row.responseType.toLowerCase()} for ${row.fileType} (${row.reportingPeriod}). Accepted and rejected record counts included.`,
		totalRecords,
		acceptanceRate,
		warnings:
			row.status === "Completed" && row.rejected > 0
				? Math.min(48, Math.round(row.rejected * 0.08))
				: 0,
		files,
		notes,
		resultHighlights,
	};
}

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
	"SUB-2027-000003": {
		submissionType: "Pharmacy",
		reportingPeriod: "Q2 2027",
		fileName: "EDGE_Q2_2027_Pharmacy.xml",
		submittedDateTime: "05/03/2027 02:18 PM ET",
		submittedBy: "jdoe@bhphealth.com",
		status: "Failed",
		totalRecords: 31_045,
		acceptedRecords: 0,
		acceptedPercent: 0,
		rejectedRecords: 31_045,
		rejectedPercent: 100,
		warnings: 214,
		cmsResponses: [
			{ label: "Acceptance Report", status: "Not Available" },
			{ label: "Validation Report", status: "Received" },
			{ label: "Error Report", status: "Received" },
		],
	},
	"SUB-2027-000005": {
		submissionType: "Enrollment",
		reportingPeriod: "Q2 2027",
		fileName: "EDGE_Q2_2027_Enrollment_Prod.xml",
		submittedDateTime: "05/05/2027 10:30 AM ET",
		submittedBy: "asmith@bhphealth.com",
		status: "Processing",
		totalRecords: 12_640,
		acceptedRecords: 0,
		acceptedPercent: 0,
		rejectedRecords: 0,
		rejectedPercent: 0,
		warnings: 0,
		cmsResponses: [
			{ label: "Acceptance Report", status: "Pending" },
			{ label: "Validation Report", status: "Pending" },
			{ label: "Error Report", status: "Not Available" },
		],
	},
};

export type CmsEdgeSubmissionDetail = {
	id: string;
	fileType: SubmissionFileType;
	environment: SubmissionEnvironment;
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
	/** 0-based index into CMS_EDGE_SUBMISSION_PROCESS_STEPS for current stage */
	lifecycleStepIndex: number;
};

function lifecycleStepForStatus(status: SubmissionStatus): number {
	if (status === "Processing") return 2;
	if (status === "Failed") return 2;
	return 3;
}

function defaultFileName(
	fileType: SubmissionFileType,
	period: string,
	environment: SubmissionEnvironment
) {
	const slug = fileType.replace(/\s+/g, "_");
	return `EDGE_${period.replace(/\s+/g, "_")}_${slug}_${environment}.xml`;
}

/** Resolve list row + optional rich detail for a submission ID. */
export function getCmsEdgeSubmissionDetail(
	id: string
): CmsEdgeSubmissionDetail | null {
	const row = CMS_EDGE_SUBMISSION_HISTORY.find((item) => item.id === id);
	if (!row) return null;

	const rich = CMS_EDGE_SUBMISSION_DETAILS[id];
	if (rich) {
		return {
			id,
			fileType: row.fileType,
			environment: row.environment,
			reportingPeriod: rich.reportingPeriod,
			fileName: rich.fileName,
			submittedDateTime: rich.submittedDateTime,
			submittedBy: rich.submittedBy,
			status: rich.status,
			totalRecords: rich.totalRecords,
			acceptedRecords: rich.acceptedRecords,
			acceptedPercent: rich.acceptedPercent,
			rejectedRecords: rich.rejectedRecords,
			rejectedPercent: rich.rejectedPercent,
			warnings: rich.warnings,
			cmsResponses: rich.cmsResponses,
			lifecycleStepIndex: lifecycleStepForStatus(rich.status),
		};
	}

	const isAccepted = row.status === "Accepted";
	const isFailed = row.status === "Failed";
	const acceptedRecords = isAccepted
		? Math.round(row.records * 0.997)
		: isFailed
			? 0
			: 0;
	const rejectedRecords = isAccepted
		? row.records - acceptedRecords
		: isFailed
			? row.records
			: 0;
	const acceptedPercent = row.records
		? Math.round((acceptedRecords / row.records) * 1000) / 10
		: 0;
	const rejectedPercent = row.records
		? Math.round((rejectedRecords / row.records) * 1000) / 10
		: 0;

	return {
		id,
		fileType: row.fileType,
		environment: row.environment,
		reportingPeriod: row.reportingPeriod,
		fileName: defaultFileName(
			row.fileType,
			row.reportingPeriod,
			row.environment
		),
		submittedDateTime: `${row.submittedDateTime} ET`,
		submittedBy: row.submittedBy,
		status: row.status,
		totalRecords: row.records,
		acceptedRecords,
		acceptedPercent,
		rejectedRecords,
		rejectedPercent,
		warnings: isFailed ? Math.round(row.records * 0.007) : 0,
		cmsResponses: isAccepted
			? [
					{ label: "Acceptance Report", status: "Received" },
					{ label: "Validation Report", status: "Received" },
					{ label: "Error Report", status: "Not Available" },
				]
			: isFailed
				? [
						{ label: "Acceptance Report", status: "Not Available" },
						{ label: "Validation Report", status: "Received" },
						{ label: "Error Report", status: "Received" },
					]
				: [
						{ label: "Acceptance Report", status: "Pending" },
						{ label: "Validation Report", status: "Pending" },
						{ label: "Error Report", status: "Not Available" },
					],
		lifecycleStepIndex: lifecycleStepForStatus(row.status),
	};
}

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

// ─── Exceptions tab ─────────────────────────────────────────────────────────

export type ExceptionSeverity = "Critical" | "High" | "Medium" | "Low";
export type ExceptionStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type ExceptionDataset =
	| "Enrollment"
	| "Medical"
	| "Pharmacy"
	| "Supplemental Diagnosis";
export type ExceptionErrorType =
	| "Missing Field"
	| "Invalid Value"
	| "Duplicate"
	| "Cross-file"
	| "Schema";

export type ExceptionRow = {
	id: string;
	dataset: ExceptionDataset;
	recordId: string;
	errorCode: string;
	description: string;
	severity: ExceptionSeverity;
	owner: string;
	status: ExceptionStatus;
	errorType: ExceptionErrorType;
	reportingPeriod: string;
};

export type CorrectionStatus =
	| "Draft"
	| "Awaiting Review"
	| "Approved"
	| "Resubmitted";

export type CorrectionRow = {
	id: string;
	exceptionId: string;
	dataset: ExceptionDataset;
	recordId: string;
	changeSummary: string;
	owner: string;
	status: CorrectionStatus;
	updatedAt: string;
	reportingPeriod: string;
};

export type VoidReplacementRow = {
	id: string;
	originalClaimId: string;
	action: "Void" | "Replacement";
	dataset: ExceptionDataset;
	reason: string;
	owner: string;
	status: "Pending" | "Submitted" | "Accepted" | "Rejected";
	submittedAt: string;
	reportingPeriod: string;
};

export const CMS_EDGE_EXCEPTION_DATASETS: ExceptionDataset[] = [
	"Enrollment",
	"Medical",
	"Pharmacy",
	"Supplemental Diagnosis",
];

export const CMS_EDGE_EXCEPTION_ERROR_TYPES: ExceptionErrorType[] = [
	"Missing Field",
	"Invalid Value",
	"Duplicate",
	"Cross-file",
	"Schema",
];

export const CMS_EDGE_EXCEPTION_STATUSES: ExceptionStatus[] = [
	"Open",
	"In Progress",
	"Resolved",
	"Closed",
];

export const CMS_EDGE_EXCEPTION_KPIS = {
	openExceptions: 912,
	critical: 214,
	correctionsDrafted: 47,
	readyForResubmission: 32,
};

export const CMS_EDGE_CORRECTION_QUEUE = {
	draft: 47,
	awaitingReview: 28,
	approved: 15,
	resubmitted: 32,
};

export const CMS_EDGE_EXCEPTIONS_LIST: ExceptionRow[] = [
	{
		id: "EXC-000912",
		dataset: "Enrollment",
		recordId: "MBR-482910",
		errorCode: "E-101",
		description: "Missing subscriber ID on enrollment record",
		severity: "Critical",
		owner: "Data Operations",
		status: "Open",
		errorType: "Missing Field",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "EXC-000911",
		dataset: "Medical",
		recordId: "CLM-771204",
		errorCode: "E-220",
		description: "Invalid diagnosis code format",
		severity: "High",
		owner: "Claims Ops",
		status: "Open",
		errorType: "Invalid Value",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "EXC-000910",
		dataset: "Pharmacy",
		recordId: "RX-339018",
		errorCode: "E-314",
		description: "NDC not found in reference file",
		severity: "Medium",
		owner: "Pharmacy Ops",
		status: "Open",
		errorType: "Cross-file",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "EXC-000909",
		dataset: "Supplemental Diagnosis",
		recordId: "SDX-118402",
		errorCode: "E-405",
		description: "Duplicate supplemental diagnosis row",
		severity: "High",
		owner: "Risk Ops",
		status: "In Progress",
		errorType: "Duplicate",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "EXC-000908",
		dataset: "Medical",
		recordId: "CLM-660183",
		errorCode: "E-118",
		description: "Provider NPI missing on claim header",
		severity: "Critical",
		owner: "Data Operations",
		status: "Open",
		errorType: "Missing Field",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "EXC-000907",
		dataset: "Enrollment",
		recordId: "MBR-291044",
		errorCode: "E-512",
		description: "Coverage end date before start date",
		severity: "Critical",
		owner: "Enrollment Ops",
		status: "Open",
		errorType: "Invalid Value",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "EXC-000906",
		dataset: "Pharmacy",
		recordId: "RX-204771",
		errorCode: "E-260",
		description: "Quantity dispensed exceeds allowed range",
		severity: "Medium",
		owner: "Pharmacy Ops",
		status: "In Progress",
		errorType: "Invalid Value",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "EXC-000905",
		dataset: "Medical",
		recordId: "CLM-551902",
		errorCode: "E-088",
		description: "Schema element out of order in claim file",
		severity: "Low",
		owner: "EDI Ops",
		status: "Resolved",
		errorType: "Schema",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "EXC-000890",
		dataset: "Enrollment",
		recordId: "MBR-100221",
		errorCode: "E-101",
		description: "Missing plan ID on enrollment span",
		severity: "High",
		owner: "Enrollment Ops",
		status: "Open",
		errorType: "Missing Field",
		reportingPeriod: "Q1 2027",
	},
	{
		id: "EXC-000881",
		dataset: "Medical",
		recordId: "CLM-448120",
		errorCode: "E-220",
		description: "Procedure code not billable for POS",
		severity: "Medium",
		owner: "Claims Ops",
		status: "Closed",
		errorType: "Invalid Value",
		reportingPeriod: "Q1 2027",
	},
];

export const CMS_EDGE_CORRECTIONS_LIST: CorrectionRow[] = [
	{
		id: "COR-000147",
		exceptionId: "EXC-000909",
		dataset: "Supplemental Diagnosis",
		recordId: "SDX-118402",
		changeSummary: "Removed duplicate SDX row; kept latest DOS",
		owner: "Risk Ops",
		status: "Awaiting Review",
		updatedAt: "05/12/2027 01:40 PM",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "COR-000146",
		exceptionId: "EXC-000911",
		dataset: "Medical",
		recordId: "CLM-771204",
		changeSummary: "Normalized ICD-10 code to valid format",
		owner: "Claims Ops",
		status: "Draft",
		updatedAt: "05/12/2027 11:05 AM",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "COR-000145",
		exceptionId: "EXC-000906",
		dataset: "Pharmacy",
		recordId: "RX-204771",
		changeSummary: "Capped quantity to plan max; documented override",
		owner: "Pharmacy Ops",
		status: "Draft",
		updatedAt: "05/11/2027 04:22 PM",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "COR-000144",
		exceptionId: "EXC-000905",
		dataset: "Medical",
		recordId: "CLM-551902",
		changeSummary: "Reordered claim schema elements per EDGE spec",
		owner: "EDI Ops",
		status: "Approved",
		updatedAt: "05/10/2027 09:18 AM",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "COR-000143",
		exceptionId: "EXC-000881",
		dataset: "Medical",
		recordId: "CLM-448120",
		changeSummary: "Updated POS and procedure pairing",
		owner: "Claims Ops",
		status: "Resubmitted",
		updatedAt: "04/26/2027 02:05 PM",
		reportingPeriod: "Q1 2027",
	},
	{
		id: "COR-000142",
		exceptionId: "EXC-000890",
		dataset: "Enrollment",
		recordId: "MBR-100221",
		changeSummary: "Backfilled plan ID from enrollment source",
		owner: "Enrollment Ops",
		status: "Resubmitted",
		updatedAt: "04/24/2027 10:30 AM",
		reportingPeriod: "Q1 2027",
	},
];

export const CMS_EDGE_VOID_REPLACEMENTS_LIST: VoidReplacementRow[] = [
	{
		id: "VR-000088",
		originalClaimId: "CLM-771204",
		action: "Replacement",
		dataset: "Medical",
		reason: "Corrected diagnosis after CMS reject",
		owner: "Claims Ops",
		status: "Pending",
		submittedAt: "05/12/2027 03:10 PM",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "VR-000087",
		originalClaimId: "RX-339018",
		action: "Void",
		dataset: "Pharmacy",
		reason: "Duplicate pharmacy claim voided",
		owner: "Pharmacy Ops",
		status: "Submitted",
		submittedAt: "05/11/2027 12:45 PM",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "VR-000086",
		originalClaimId: "CLM-660183",
		action: "Replacement",
		dataset: "Medical",
		reason: "Added missing rendering NPI",
		owner: "Data Operations",
		status: "Accepted",
		submittedAt: "05/09/2027 08:20 AM",
		reportingPeriod: "Q2 2027",
	},
	{
		id: "VR-000085",
		originalClaimId: "MBR-482910",
		action: "Void",
		dataset: "Enrollment",
		reason: "Erroneous enrollment span removed",
		owner: "Enrollment Ops",
		status: "Rejected",
		submittedAt: "05/08/2027 05:02 PM",
		reportingPeriod: "Q2 2027",
	},
];

export const EXCEPTION_SEVERITY_STYLES: Record<ExceptionSeverity, string> = {
	Critical: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300",
	High: "bg-orange-500/15 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
	Medium:
		"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
	Low: "bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
};

export const EXCEPTION_STATUS_STYLES: Record<ExceptionStatus, string> = {
	Open: "bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
	"In Progress":
		"bg-violet-500/15 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
	Resolved:
		"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
	Closed: "bg-muted text-muted-foreground",
};

export const CORRECTION_STATUS_STYLES: Record<CorrectionStatus, string> = {
	Draft: "bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
	"Awaiting Review":
		"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
	Approved:
		"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
	Resubmitted:
		"bg-violet-500/15 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
};

export const VOID_STATUS_STYLES: Record<VoidReplacementRow["status"], string> =
	{
		Pending:
			"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
		Submitted:
			"bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
		Accepted:
			"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
		Rejected: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300",
	};

export type CmsEdgeExceptionDetailNote = {
	id: string;
	dateTime: string;
	source: string;
	note: string;
};

export type CmsEdgeExceptionDetail = ExceptionRow & {
	detectedAt: string;
	sourceFile: string;
	relatedSubmission: string;
	fieldPath: string;
	expectedValue: string;
	actualValue: string;
	remediation: string;
	impactSummary: string;
	corrections: CorrectionRow[];
	voidReplacements: VoidReplacementRow[];
	notes: CmsEdgeExceptionDetailNote[];
};

const EXCEPTION_REMEDIATION: Record<ExceptionErrorType, string> = {
	"Missing Field":
		"Backfill the required field from the source system, then draft a correction for resubmission.",
	"Invalid Value":
		"Normalize the value to the CMS EDGE allowed format/code set and revalidate before resubmit.",
	Duplicate:
		"Confirm the surviving record, void or remove duplicates, then resubmit the corrected file.",
	"Cross-file":
		"Reconcile against the referenced file (enrollment / NDC / provider), then correct the mismatched key.",
	Schema:
		"Reorder or reshape elements to match the EDGE schema for this file type, then regenerate.",
};

/** Resolve an exception detail by list row id (e.g. EXC-000912). */
export function getCmsEdgeExceptionDetail(
	id: string
): CmsEdgeExceptionDetail | null {
	const row = CMS_EDGE_EXCEPTIONS_LIST.find((item) => item.id === id);
	if (!row) return null;

	const seq = Number(row.id.replace(/\D/g, "")) || 900;
	const day = String((seq % 12) + 1).padStart(2, "0");
	const hour = String((seq % 10) + 8).padStart(2, "0");
	const detectedAt = `${day}/05/2027 ${hour}:15 AM`;

	const fileSlug = row.dataset.replace(/\s+/g, "");
	const sourceFile = `EDGE_${row.reportingPeriod.replace(/\s+/g, "_")}_${fileSlug}.xml`;
	const relatedSubmission = `SUB-2027-${String(seq % 12 || 12).padStart(6, "0")}`;

	const fieldByType: Record<ExceptionErrorType, string> = {
		"Missing Field":
			row.dataset === "Enrollment" ? "subscriberId" : "billingProvider.npi",
		"Invalid Value":
			row.dataset === "Pharmacy" ? "quantityDispensed" : "diagnosis[0].code",
		Duplicate: "recordHash",
		"Cross-file": "ndcCode",
		Schema: "claimHeader.sequence",
	};

	const expectedByType: Record<ExceptionErrorType, string> = {
		"Missing Field": "Non-empty CMS EDGE identifier",
		"Invalid Value": "Value within EDGE allowed set / range",
		Duplicate: "Unique record key within file",
		"Cross-file": "Key present in reference file",
		Schema: "Elements in EDGE schema order",
	};

	const actualByType: Record<ExceptionErrorType, string> = {
		"Missing Field": "null / omitted",
		"Invalid Value": "Out-of-range or malformed value",
		Duplicate: "Matches prior row in same submission",
		"Cross-file": "Key not found in reference",
		Schema: "Out-of-order element detected",
	};

	const corrections = CMS_EDGE_CORRECTIONS_LIST.filter(
		(item) => item.exceptionId === row.id
	);
	const voidReplacements = CMS_EDGE_VOID_REPLACEMENTS_LIST.filter(
		(item) => item.originalClaimId === row.recordId
	);

	const notes: CmsEdgeExceptionDetailNote[] = [
		{
			id: `${row.id}-n1`,
			dateTime: detectedAt,
			source: "CMS EDGE validation",
			note: `${row.errorCode} · ${row.description}`,
		},
		{
			id: `${row.id}-n2`,
			dateTime: detectedAt,
			source: "System",
			note: `Routed to ${row.owner} · severity ${row.severity} · status ${row.status}.`,
		},
	];

	if (corrections[0]) {
		notes.push({
			id: `${row.id}-n3`,
			dateTime: corrections[0].updatedAt,
			source: corrections[0].owner,
			note: `Correction ${corrections[0].id}: ${corrections[0].changeSummary}`,
		});
	}

	return {
		...row,
		detectedAt,
		sourceFile,
		relatedSubmission,
		fieldPath: fieldByType[row.errorType],
		expectedValue: expectedByType[row.errorType],
		actualValue: actualByType[row.errorType],
		remediation: EXCEPTION_REMEDIATION[row.errorType],
		impactSummary:
			row.severity === "Critical"
				? "Blocks acceptance for this record until corrected and resubmitted."
				: row.severity === "High"
					? "Likely reject or high-risk variance if left unresolved this period."
					: "Non-blocking or low volume impact; still track for period close.",
		corrections,
		voidReplacements,
		notes,
	};
}

// ─── Reconciliation tab ─────────────────────────────────────────────────────

export type ReconciliationEnvironment = "Test" | "Validation" | "Production";
export type ReconciliationStatus = "Balanced" | "Review Required" | "Variance";

export type ReconciliationDatasetRow = {
	id: string;
	dataset: string;
	source: number;
	fileGenerated: number;
	submitted: number;
	cmsAccepted: number;
	cmsRejected: number;
	variance: number;
	status: ReconciliationStatus;
	reportingPeriod: string;
	environment: ReconciliationEnvironment;
};

export type ReconciliationVarianceReason = {
	id: string;
	label: string;
	count: number;
	tone: "violet" | "orange" | "teal" | "amber";
};

export const CMS_EDGE_RECON_ENVIRONMENTS: ReconciliationEnvironment[] = [
	"Test",
	"Validation",
	"Production",
];

export const CMS_EDGE_RECON_KPIS = {
	sourceRecords: 24_928_666,
	submitted: 24_893_578,
	cmsAccepted: 24_859_402,
	variance: 69_264,
};

export const CMS_EDGE_RECON_DATASETS: ReconciliationDatasetRow[] = [
	{
		id: "recon-enrollment",
		dataset: "Enrollment",
		source: 12_640_120,
		fileGenerated: 12_638_904,
		submitted: 12_635_210,
		cmsAccepted: 12_624_880,
		cmsRejected: 10_330,
		variance: 15_240,
		status: "Review Required",
		reportingPeriod: "Q2 2027",
		environment: "Production",
	},
	{
		id: "recon-medical",
		dataset: "Medical Claims",
		source: 8_420_550,
		fileGenerated: 8_418_200,
		submitted: 8_410_040,
		cmsAccepted: 8_401_220,
		cmsRejected: 8_820,
		variance: 19_330,
		status: "Review Required",
		reportingPeriod: "Q2 2027",
		environment: "Production",
	},
	{
		id: "recon-pharmacy",
		dataset: "Pharmacy Claims",
		source: 3_210_880,
		fileGenerated: 3_209_640,
		submitted: 3_205_110,
		cmsAccepted: 3_198_740,
		cmsRejected: 6_370,
		variance: 12_140,
		status: "Variance",
		reportingPeriod: "Q2 2027",
		environment: "Production",
	},
	{
		id: "recon-supp",
		dataset: "Supplemental Diagnoses",
		source: 657_116,
		fileGenerated: 656_880,
		submitted: 643_218,
		cmsAccepted: 634_562,
		cmsRejected: 8_656,
		variance: 22_554,
		status: "Review Required",
		reportingPeriod: "Q2 2027",
		environment: "Production",
	},
	{
		id: "recon-enrollment-val",
		dataset: "Enrollment",
		source: 1_240_200,
		fileGenerated: 1_240_200,
		submitted: 1_240_200,
		cmsAccepted: 1_240_200,
		cmsRejected: 0,
		variance: 0,
		status: "Balanced",
		reportingPeriod: "Q2 2027",
		environment: "Validation",
	},
	{
		id: "recon-medical-q1",
		dataset: "Medical Claims",
		source: 8_105_440,
		fileGenerated: 8_104_910,
		submitted: 8_100_220,
		cmsAccepted: 8_098_110,
		cmsRejected: 2_110,
		variance: 7_330,
		status: "Review Required",
		reportingPeriod: "Q1 2027",
		environment: "Production",
	},
];

export const CMS_EDGE_RECON_FLOW = [
	{
		id: "source",
		title: "Source Data",
		description: "Source system extracts",
	},
	{
		id: "generated",
		title: "Generated File",
		description: "EDGE file staged",
	},
	{
		id: "submitted",
		title: "CMS Submission",
		description: "Sent to CMS EDGE",
	},
	{
		id: "accepted",
		title: "CMS Accepted",
		description: "Accepted by CMS",
	},
] as const;

export const CMS_EDGE_RECON_VARIANCE_REASONS: ReconciliationVarianceReason[] = [
	{
		id: "validation-exclusions",
		label: "Validation Exclusions",
		count: 28_410,
		tone: "violet",
	},
	{
		id: "submission-rejections",
		label: "Submission Rejections",
		count: 24_176,
		tone: "orange",
	},
	{
		id: "duplicate-records",
		label: "Duplicate Records",
		count: 9_840,
		tone: "teal",
	},
	{
		id: "pending-corrections",
		label: "Pending Corrections",
		count: 6_838,
		tone: "amber",
	},
];

export const RECON_STATUS_DOT: Record<ReconciliationStatus, string> = {
	Balanced: "bg-emerald-500",
	"Review Required": "bg-amber-500",
	Variance: "bg-red-500",
};

export const RECON_STATUS_STYLES: Record<ReconciliationStatus, string> = {
	Balanced:
		"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
	"Review Required":
		"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
	Variance: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

export type CmsEdgeReconPipelineStep = {
	id: string;
	title: string;
	count: number;
	deltaFromPrevious: number | null;
};

export type CmsEdgeReconVarianceSlice = {
	id: string;
	label: string;
	count: number;
	pct: number;
	tone: ReconciliationVarianceReason["tone"];
};

export type CmsEdgeReconDetailNote = {
	id: string;
	dateTime: string;
	source: string;
	note: string;
};

export type CmsEdgeReconciliationDetail = ReconciliationDatasetRow & {
	runId: string;
	lastRunAt: string;
	acceptanceRate: number;
	rejectRate: number;
	pipeline: CmsEdgeReconPipelineStep[];
	varianceSlices: CmsEdgeReconVarianceSlice[];
	relatedSubmission: string;
	exceptionDataset: string;
	summary: string;
	notes: CmsEdgeReconDetailNote[];
};

function datasetToExceptionLabel(dataset: string): string {
	if (dataset.startsWith("Enrollment")) return "Enrollment";
	if (dataset.startsWith("Medical")) return "Medical";
	if (dataset.startsWith("Pharmacy")) return "Pharmacy";
	return "Supplemental Diagnosis";
}

/** Resolve a reconciliation dataset detail by list row id. */
export function getCmsEdgeReconciliationDetail(
	id: string
): CmsEdgeReconciliationDetail | null {
	const row = CMS_EDGE_RECON_DATASETS.find((item) => item.id === id);
	if (!row) return null;

	const acceptanceRate = row.submitted
		? Math.round((row.cmsAccepted / row.submitted) * 1000) / 10
		: 100;
	const rejectRate = row.submitted
		? Math.round((row.cmsRejected / row.submitted) * 1000) / 10
		: 0;

	const pipelineCounts = [
		row.source,
		row.fileGenerated,
		row.submitted,
		row.cmsAccepted,
	];
	const pipeline: CmsEdgeReconPipelineStep[] = CMS_EDGE_RECON_FLOW.map(
		(step, index) => {
			const count = pipelineCounts[index] ?? 0;
			const previous = index === 0 ? null : (pipelineCounts[index - 1] ?? 0);
			return {
				id: step.id,
				title: step.title,
				count,
				deltaFromPrevious: previous === null ? null : count - previous,
			};
		}
	);

	const reasonTotal = CMS_EDGE_RECON_VARIANCE_REASONS.reduce(
		(sum, item) => sum + item.count,
		0
	);
	const varianceSlices: CmsEdgeReconVarianceSlice[] =
		row.variance === 0
			? []
			: CMS_EDGE_RECON_VARIANCE_REASONS.map((reason) => {
					const share = reasonTotal ? reason.count / reasonTotal : 0;
					const count = Math.round(row.variance * share);
					return {
						id: reason.id,
						label: reason.label,
						count,
						pct: Math.round(share * 1000) / 10,
						tone: reason.tone,
					};
				});

	const seq = Math.abs(
		row.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
	);
	const relatedSubmission = `SUB-2027-${String((seq % 12) + 1).padStart(6, "0")}`;
	const lastRunAt = `05/${String((seq % 12) + 1).padStart(2, "0")}/2027 06:40 AM`;

	const summary =
		row.status === "Balanced"
			? `${row.dataset} is balanced for ${row.reportingPeriod} (${row.environment}). Source through CMS accepted align with no open variance.`
			: row.status === "Variance"
				? `${row.dataset} shows a material variance of ${row.variance.toLocaleString()} records between source and CMS accepted. Investigate rejections and exclusions before period close.`
				: `${row.dataset} needs review: ${row.variance.toLocaleString()} variance across the EDGE funnel (${row.cmsRejected.toLocaleString()} CMS rejects).`;

	const notes: CmsEdgeReconDetailNote[] = [
		{
			id: `${row.id}-n1`,
			dateTime: lastRunAt,
			source: "Reconciliation engine",
			note: `Run completed for ${row.dataset} · ${row.environment} · ${row.reportingPeriod}.`,
		},
		{
			id: `${row.id}-n2`,
			dateTime: lastRunAt,
			source: "System",
			note:
				row.variance === 0
					? "No variance detected. Dataset marked Balanced."
					: `Variance ${row.variance.toLocaleString()} · acceptance ${acceptanceRate}% · rejects ${row.cmsRejected.toLocaleString()}.`,
		},
	];

	if (row.status !== "Balanced") {
		notes.push({
			id: `${row.id}-n3`,
			dateTime: lastRunAt,
			source: "Ops",
			note: "Open exceptions and pending corrections contribute to residual variance. Drill into exception queue for this dataset.",
		});
	}

	return {
		...row,
		runId: `RCN-${row.reportingPeriod.replace(/\s+/g, "")}-${row.id.replace("recon-", "").toUpperCase()}`,
		lastRunAt,
		acceptanceRate,
		rejectRate,
		pipeline,
		varianceSlices,
		relatedSubmission,
		exceptionDataset: datasetToExceptionLabel(row.dataset),
		summary,
		notes,
	};
}

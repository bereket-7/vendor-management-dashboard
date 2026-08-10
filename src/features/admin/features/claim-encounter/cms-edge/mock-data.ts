export type CmsEdgeTabId =
	| "overview"
	| "submissions"
	| "responses"
	| "validations"
	| "financial-management"
	| "audit"
	| "documents";

export const CMS_EDGE_TABS: { id: CmsEdgeTabId; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "submissions", label: "Submissions" },
	{ id: "responses", label: "Responses" },
	{ id: "validations", label: "Validations" },
	{ id: "financial-management", label: "Financial Management" },
	{ id: "audit", label: "Audit" },
	{ id: "documents", label: "Documents" },
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

export const FINDING_STATUS_STYLES: Record<
	AuditFindingRow["status"],
	string
> = {
	Open: "border-red-200/80 bg-red-50 text-red-800",
	"In Progress": "border-amber-200/80 bg-amber-50 text-amber-900",
	Closed: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
};

export const CMS_EDGE_TAB_META: Record<
	CmsEdgeTabId,
	{ title: string; description: string }
> = {
	overview: {
		title: "CMS EDGE Reporting – Overview",
		description:
			"Monitor CMS EDGE submission health, validation outcomes, and reporting activity.",
	},
	submissions: {
		title: "CMS EDGE Reporting – Submissions",
		description: "Track EDGE submission batches and submission readiness.",
	},
	responses: {
		title: "CMS EDGE Reporting – Responses",
		description: "Review CMS responses and issuer return files.",
	},
	validations: {
		title: "CMS EDGE Reporting – Validations",
		description: "Analyze validation results and exception trends.",
	},
	"financial-management": {
		title: "CMS EDGE Reporting – Financial Management",
		description:
			"Review financial management (FM) results including payments, withholds, and adjustments returned by CMS.",
	},
	audit: {
		title: "CMS EDGE Reporting – Audit",
		description:
			"Review audit requests, audit reports, and issuer responses returned by CMS.",
	},
	documents: {
		title: "CMS EDGE Reporting – Documents",
		description:
			"Access, download, and manage all CMS EDGE reporting documents.",
	},
};

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
	{ name: "Reports", value: 53.4, color: "#3b82f6" },
	{ name: "Responses", value: 26.7, color: "#22c55e" },
	{ name: "Audit", value: 14.1, color: "#f59e0b" },
	{ name: "Other", value: 5.8, color: "#8b5cf6" },
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
	{ category: "Capitation", paidAmount: 5_134_092.18, percent: 39.97 },
	{ category: "Fee-for-Service", paidAmount: 4_876_287.54, percent: 37.96 },
	{ category: "Incentive", paidAmount: 1_926_784.57, percent: 15.0 },
	{ category: "Other", paidAmount: 908_066.16, percent: 7.07 },
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
};

export const CMS_EDGE_FM_ACTIVITY: FmActivityRow[] = [
	{
		id: "fm-act-1",
		activity: "FM Response Received",
		description: "Payment response file processed successfully",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 27, 2027 11:44 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
	{
		id: "fm-act-2",
		activity: "Withhold Applied",
		description: "Withhold amounts reconciled against payment file",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 27, 2027 11:45 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
	{
		id: "fm-act-3",
		activity: "Adjustment Posted",
		description: "Adjustment entries applied to FM summary",
		relatedSubmission: "EDGE_Q2_2027_Final",
		dateTime: "Jul 27, 2027 11:46 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
	{
		id: "fm-act-4",
		activity: "FM Report Generated",
		description: "Financial management report available for download",
		relatedSubmission: "EDGE_Q1_2027_Final",
		dateTime: "Apr 28, 2027 09:20 AM",
		status: "Completed",
		user: "CMS EDGE System",
	},
];

export const FM_COMPLETED_STYLE =
	"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";

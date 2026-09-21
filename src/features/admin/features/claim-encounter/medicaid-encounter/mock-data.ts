export const MEDICAID_ENCOUNTER_KPIS = {
	acceptanceRate: 0,
	acceptanceDelta: 0,
	reportsSubmitted: 0,
	reportsAccepted: 0,
	reportsRejected: 0,
	responsesPending: 0,
	openIssues: 0,
};

export const MEDICAID_OVERVIEW_KPIS = {
	encounterFilesSubmitted: 0,
	encounterFilesDelta: 0,
	encountersSubmitted: 0,
	encountersDelta: 0,
	accepted: 0,
	acceptanceRate: 0,
	rejected: 0,
	rejectionRate: 0,
	pendingResponses: 0,
	pendingRate: 0,
	acceptanceRateDelta: 0,
};

export type MedicaidSubmissionStatus =
	| "Submitted"
	| "Acknowledged"
	| "Accepted"
	| "Rejected"
	| "Pending";

export type MedicaidExceptionStatus = "Open" | "In Review" | "Resolved";

export const MEDICAID_SUBMISSION_STATUS_STYLES: Record<
	MedicaidSubmissionStatus,
	string
> = {
	Submitted: "border-sky-200 bg-sky-50 text-sky-800",
	Acknowledged: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Accepted: "border-emerald-300 bg-emerald-100 text-emerald-800",
	Rejected: "border-red-200 bg-red-50 text-red-700",
	Pending: "border-amber-200 bg-amber-50 text-amber-800",
};

export const MEDICAID_EXCEPTION_STATUS_STYLES: Record<
	MedicaidExceptionStatus,
	string
> = {
	Open: "border-red-200 bg-red-50 text-red-700",
	"In Review": "border-amber-200 bg-amber-50 text-amber-800",
	Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export type MedicaidOverviewRecentSubmission = {
	id: string;
	batch: string;
	fileName: string;
	state: string;
	submittedDate: string;
	status: MedicaidSubmissionStatus;
	encounters: number;
};

export type MedicaidOverviewAcceptanceTrendPoint = {
	month: string;
	rate: number;
};

export type MedicaidOverviewRejectionDonutSlice = {
	name: string;
	count: number;
	color: string;
	pct: number;
};

export type MedicaidOverviewRecentResponse = {
	id: string;
	file: string;
	state: string;
	receivedDate: string;
	accepted: number;
	rejected: number;
	status: string;
};

export type MedicaidOverviewException = {
	id: string;
	code: string;
	description: string;
	count: number;
	status: MedicaidExceptionStatus;
};

export const MEDICAID_OVERVIEW_RECENT_SUBMISSIONS: MedicaidOverviewRecentSubmission[] =
	[];

export const MEDICAID_OVERVIEW_ACCEPTANCE_TREND: MedicaidOverviewAcceptanceTrendPoint[] =
	[];

export const MEDICAID_OVERVIEW_REJECTION_DONUT: MedicaidOverviewRejectionDonutSlice[] =
	[];

export const MEDICAID_OVERVIEW_RECENT_RESPONSES: MedicaidOverviewRecentResponse[] =
	[];

export const MEDICAID_OVERVIEW_EXCEPTIONS: MedicaidOverviewException[] = [];

export const MEDICAID_OVERVIEW_QUICK_ACTIONS = [
	{
		id: "qa-1",
		title: "Submit Encounter File",
		description: "Upload a new encounter batch for the current period",
	},
	{
		id: "qa-2",
		title: "View State Edits",
		description: "Review state-specific edit rules and thresholds",
	},
	{
		id: "qa-3",
		title: "Download Reports",
		description: "Export acceptance and rejection summary reports",
	},
	{
		id: "qa-4",
		title: "Request Resubmission",
		description: "Initiate a corrected file resubmission workflow",
	},
];

export type MedicaidAcceptanceTrendPoint = {
	month: string;
	rate: number;
	prior: number;
};

export type MedicaidRateByName = {
	name: string;
	rate: number;
};

export type MedicaidReportsByTypeSlice = {
	name: string;
	value: number;
	color: string;
};

export type MedicaidTopRejection = {
	code: string;
	description: string;
	count: number;
	pct: number;
};

export type MedicaidRateByMonthPoint = {
	month: string;
	rate: number;
};

export type MedicaidSummaryByTypeRow = {
	type: string;
	submitted: number;
	accepted: number;
	rejected: number;
	rate: number;
};

export const MEDICAID_ACCEPTANCE_TREND: MedicaidAcceptanceTrendPoint[] = [];

export const MEDICAID_RATE_BY_REPORT_TYPE: MedicaidRateByName[] = [];

export const MEDICAID_RATE_BY_PLAN: MedicaidRateByName[] = [];

export const MEDICAID_REPORTS_BY_TYPE: MedicaidReportsByTypeSlice[] = [];

export const MEDICAID_TOP_REJECTIONS: MedicaidTopRejection[] = [];

export const MEDICAID_RATE_BY_MONTH: MedicaidRateByMonthPoint[] = [];

export const MEDICAID_SUMMARY_BY_TYPE: MedicaidSummaryByTypeRow[] = [];

export const MEDICAID_ENCOUNTER_TABS = [
	"Overview",
	"Submissions",
	"Responses",
	"Validation",
	"Acceptance Analytics",
	"Exception Management",
	"Audit",
	"Documents",
] as const;

// ——— Responses tab ———

export type MedicaidResponseFileStatus = "Processed" | "Pending" | "Failed";

export type MedicaidWarningStatus = "Open" | "In Review" | "Resolved";

export const MEDICAID_RESPONSE_STATUS_STYLES: Record<
	MedicaidResponseFileStatus,
	string
> = {
	Processed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Pending: "border-amber-200 bg-amber-50 text-amber-800",
	Failed: "border-red-200 bg-red-50 text-red-700",
};

export const MEDICAID_WARNING_STATUS_STYLES: Record<
	MedicaidWarningStatus,
	string
> = {
	Open: "border-red-200 bg-red-50 text-red-700",
	"In Review": "border-amber-200 bg-amber-50 text-amber-800",
	Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const MEDICAID_RESPONSE_KPIS = {
	filesReceived: 0,
	filesReceivedDelta: 0,
	totalReports: 0,
	accepted: 0,
	acceptanceRate: 0,
	errors: 0,
	errorRate: 0,
	warnings: 0,
	warningRate: 0,
	pending: 0,
};

export type MedicaidResponseFile = {
	id: string;
	fileName: string;
	reportType: string;
	receivedAt: string;
	records: number;
	accepted: number;
	errors: number;
	warnings: number;
	status: MedicaidResponseFileStatus;
};

export type MedicaidResponseSummaryTrendPoint = {
	week: string;
	accepted: number;
	errors: number;
	warnings: number;
};

export type MedicaidResponsesByStatusSlice = {
	name: string;
	count: number;
	color: string;
	pct: number;
};

export type MedicaidTopErrorReason = {
	code: string;
	description: string;
	count: number;
	pct: number;
};

export type MedicaidRecentWarning = {
	id: string;
	code: string;
	description: string;
	count: number;
	status: MedicaidWarningStatus;
};

export const MEDICAID_RESPONSE_FILES: MedicaidResponseFile[] = [];

export const MEDICAID_RESPONSE_SUMMARY_TREND: MedicaidResponseSummaryTrendPoint[] =
	[];

export const MEDICAID_RESPONSES_BY_STATUS: MedicaidResponsesByStatusSlice[] =
	[];

export const MEDICAID_TOP_ERROR_REASONS: MedicaidTopErrorReason[] = [];

export const MEDICAID_RECENT_WARNINGS: MedicaidRecentWarning[] = [];

// ——— Audit tab ———

export const MEDICAID_AUDIT_KPIS = {
	auditsConducted: 0,
	auditsConductedDelta: 0,
	findingsIdentified: 0,
	findingsIdentifiedDelta: 0,
	criticalFindings: 0,
	criticalFindingsDelta: 0,
	resolvedFindings: 0,
	resolvedFindingsDelta: 0,
	openFindings: 0,
	openFindingsDelta: 0,
	correctiveActions: 0,
	correctiveActionsDelta: 0,
};

export type MedicaidAuditStatus = "Completed" | "In Progress" | "Scheduled";

export const MEDICAID_AUDIT_STATUS_STYLES: Record<MedicaidAuditStatus, string> =
	{
		Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
		"In Progress": "border-violet-200 bg-violet-50 text-violet-800",
		Scheduled: "border-sky-200 bg-sky-50 text-sky-800",
	};

export type MedicaidRecentAuditActivity = {
	id: string;
	auditType: string;
	reportType: string;
	plan: string;
	auditPeriod: string;
	auditDate: string;
	auditor: string;
	status: MedicaidAuditStatus;
	findings: number;
	criticalFindings: number;
};

export type MedicaidFindingsBySeveritySlice = {
	name: string;
	value: number;
	color: string;
	pct: number;
};

export type MedicaidFindingsTrendPoint = {
	month: string;
	total: number;
	critical: number;
	high: number;
};

export const MEDICAID_RECENT_AUDIT_ACTIVITIES: MedicaidRecentAuditActivity[] =
	[];

export const MEDICAID_FINDINGS_BY_SEVERITY: MedicaidFindingsBySeveritySlice[] =
	[];

export const MEDICAID_FINDINGS_TREND: MedicaidFindingsTrendPoint[] = [];

export type MedicaidFindingSeverity = "Critical" | "High" | "Medium" | "Low";

export const MEDICAID_FINDING_SEVERITY_STYLES: Record<
	MedicaidFindingSeverity,
	string
> = {
	Critical: "text-red-600 font-semibold",
	High: "text-orange-600 font-semibold",
	Medium: "text-violet-600 font-medium",
	Low: "text-sky-600 font-medium",
};

export type MedicaidTopAuditFinding = {
	category: string;
	description: string;
	occurrences: number;
	severity: MedicaidFindingSeverity;
};

export type MedicaidCorrectiveActionsSummarySlice = {
	status: string;
	count: number;
	pct: number;
	color: string;
};

export const MEDICAID_TOP_AUDIT_FINDINGS: MedicaidTopAuditFinding[] = [];

export const MEDICAID_CORRECTIVE_ACTIONS_SUMMARY: MedicaidCorrectiveActionsSummarySlice[] =
	[];

export const MEDICAID_AUDIT_QUICK_ACTIONS = [
	{
		id: "aq-1",
		title: "View Audit Plan",
		description: "Review scheduled audits and scope for the reporting period",
	},
	{
		id: "aq-2",
		title: "Download Audit Report",
		description: "Export the latest audit summary and findings report",
	},
	{
		id: "aq-3",
		title: "View State Findings",
		description: "Review findings returned by state MMIS validation",
	},
	{
		id: "aq-4",
		title: "Create Corrective Action",
		description: "Open a new corrective action for an audit finding",
	},
	{
		id: "aq-5",
		title: "Track Corrective Actions",
		description: "Monitor open corrective actions and due dates",
	},
	{
		id: "aq-6",
		title: "Audit Calendar",
		description: "View upcoming audit milestones and deadlines",
	},
];

// ——— Documents tab ———

export const MEDICAID_DOCUMENT_KPIS = {
	totalDocuments: 0,
	totalDocumentsDelta: 0,
	submittedFiles: 0,
	submittedFilesDelta: 0,
	responseFiles: 0,
	responseFilesDelta: 0,
	reports: 0,
	reportsDelta: 0,
	auditDocuments: 0,
	auditDocumentsDelta: 0,
	otherDocuments: 0,
	otherDocumentsDelta: 0,
	storageUsedGb: 0,
	storageTotalGb: 0,
};

export type MedicaidDocumentType =
	| "Submitted File"
	| "Response File"
	| "Validation Report"
	| "Acceptance Report"
	| "Audit Document"
	| "Other Document";

export type MedicaidDocumentStatus =
	| "Submitted"
	| "Received"
	| "Complete"
	| "Reference";

export type MedicaidDocumentFileKind = "dat" | "rsp" | "pdf" | "xlsx" | "txt";

export const MEDICAID_DOCUMENT_TYPE_STYLES: Record<
	MedicaidDocumentType,
	string
> = {
	"Submitted File": "border-sky-200 bg-sky-50 text-sky-800",
	"Response File": "border-emerald-200 bg-emerald-50 text-emerald-700",
	"Validation Report": "border-violet-200 bg-violet-50 text-violet-800",
	"Acceptance Report": "border-amber-200 bg-amber-50 text-amber-800",
	"Audit Document": "border-teal-200 bg-teal-50 text-teal-800",
	"Other Document": "border-border bg-muted/50 text-muted-foreground",
};

export const MEDICAID_DOCUMENT_STATUS_STYLES: Record<
	MedicaidDocumentStatus,
	string
> = {
	Submitted: "border-sky-200 bg-sky-50 text-sky-800",
	Received: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Complete: "border-violet-200 bg-violet-50 text-violet-800",
	Reference: "border-border bg-muted/50 text-muted-foreground",
};

export const MEDICAID_DOCUMENT_TYPES_FILTER = [
	"All Types",
	"Submitted File",
	"Response File",
	"Validation Report",
	"Acceptance Report",
	"Audit Document",
	"Other Document",
] as const;

export const MEDICAID_DOCUMENT_STATES_FILTER = [
	"All States",
	"DC",
	"MD",
	"VA",
] as const;

export const MEDICAID_DOCUMENT_VENDORS_FILTER = [
	"All Vendors",
	"AmeriHealth DC",
	"MedStar Family Choice",
	"CareFirst Community Health",
] as const;

export const MEDICAID_DOCUMENT_STATUSES_FILTER = [
	"All Statuses",
	"Submitted",
	"Received",
	"Complete",
	"Reference",
] as const;

export const MEDICAID_DOCUMENT_REPORTING_PERIODS_FILTER = [
	{ value: "q2-2027", label: "Q2 2027" },
	{ value: "q1-2027", label: "Q1 2027" },
	{ value: "q4-2026", label: "Q4 2026" },
] as const;

export type MedicaidDocumentRow = {
	id: string;
	name: string;
	fileKind: MedicaidDocumentFileKind;
	documentType: MedicaidDocumentType;
	reportingPeriod: string;
	state: string;
	vendor: string;
	uploadedOn: string;
	uploadedBy: string;
	status: MedicaidDocumentStatus;
	fileSize: string;
	description?: string;
};

export const MEDICAID_DOCUMENT_LIBRARY: MedicaidDocumentRow[] = [];

export type MedicaidDocumentCategory = {
	id: string;
	title: string;
	count: number;
	description: string;
	documentType: MedicaidDocumentType;
};

export const MEDICAID_DOCUMENT_CATEGORIES: MedicaidDocumentCategory[] = [];

export const MEDICAID_DOCUMENT_QUICK_ACTIONS = [
	{
		id: "dq-1",
		title: "Upload Document",
		description: "Upload new file or document",
	},
	{
		id: "dq-2",
		title: "Download Selected",
		description: "Download selected document(s)",
	},
	{
		id: "dq-3",
		title: "Share Document",
		description: "Share with team or vendor",
	},
	{
		id: "dq-4",
		title: "Move to Category",
		description: "Organize document library",
	},
];

export function filterMedicaidDocuments(
	rows: MedicaidDocumentRow[],
	query: string,
	filters: {
		documentType: string;
		state: string;
		vendor: string;
		status: string;
	}
): MedicaidDocumentRow[] {
	const q = query.trim().toLowerCase();
	return rows.filter((row) => {
		if (
			filters.documentType !== "All Types" &&
			row.documentType !== filters.documentType
		) {
			return false;
		}
		if (filters.state !== "All States" && row.state !== filters.state) {
			return false;
		}
		if (filters.vendor !== "All Vendors" && row.vendor !== filters.vendor) {
			return false;
		}
		if (filters.status !== "All Statuses" && row.status !== filters.status) {
			return false;
		}
		if (!q) return true;
		return (
			row.name.toLowerCase().includes(q) ||
			row.documentType.toLowerCase().includes(q) ||
			row.vendor.toLowerCase().includes(q) ||
			(row.description?.toLowerCase().includes(q) ?? false)
		);
	});
}

// ——— Exception Management tab ———

export const MEDICAID_EXCEPTION_KPIS = {
	total: 0,
	totalDelta: 0,
	critical: 0,
	criticalDelta: 0,
	warning: 0,
	warningDelta: 0,
	info: 0,
	infoDelta: 0,
	resolved: 0,
	resolvedDelta: 0,
	open: 0,
	openDelta: 0,
};

export type MedicaidExceptionSeverity = "Critical" | "Warning" | "Info";

export const MEDICAID_EXCEPTION_SEVERITY_STYLES: Record<
	MedicaidExceptionSeverity,
	string
> = {
	Critical: "border-red-200 bg-red-50 text-red-700",
	Warning: "border-amber-200 bg-amber-50 text-amber-800",
	Info: "border-sky-200 bg-sky-50 text-sky-800",
};

export type MedicaidExceptionsBySeveritySlice = {
	name: string;
	value: number;
	color: string;
	pct: number;
};

export type MedicaidExceptionsTrendPoint = {
	week: string;
	critical: number;
	warning: number;
	info: number;
};

export type MedicaidTopExceptionReason = {
	reason: string;
	count: number;
};

export type MedicaidExceptionsByStateRow = {
	state: string;
	count: number;
	pct: number;
};

export const MEDICAID_EXCEPTIONS_BY_SEVERITY: MedicaidExceptionsBySeveritySlice[] =
	[];

export const MEDICAID_EXCEPTIONS_TREND: MedicaidExceptionsTrendPoint[] = [];

export const MEDICAID_TOP_EXCEPTION_REASONS: MedicaidTopExceptionReason[] = [];

export const MEDICAID_EXCEPTIONS_BY_STATE: MedicaidExceptionsByStateRow[] = [];

export type MedicaidExceptionDetailRow = {
	id: string;
	errorCode: string;
	description: string;
	severity: MedicaidExceptionSeverity;
	state: string;
	mco: string;
	vendor: string;
	submissionBatch: string;
	responseFile: string;
	encounterCount: number;
	firstOccurrence: string;
	lastOccurrence: string;
	status: MedicaidExceptionStatus;
};

export const MEDICAID_EXCEPTION_DETAILS: MedicaidExceptionDetailRow[] = [];

export const MEDICAID_EXCEPTION_SEVERITY_FILTER = [
	"All Severities",
	"Critical",
	"Warning",
	"Info",
] as const;

export const MEDICAID_EXCEPTION_STATUS_FILTER = [
	"All Statuses",
	"Open",
	"In Review",
	"Resolved",
] as const;

export function filterMedicaidExceptions(
	rows: MedicaidExceptionDetailRow[],
	query: string,
	filters: { severity: string; status: string }
): MedicaidExceptionDetailRow[] {
	const q = query.trim().toLowerCase();
	return rows.filter((row) => {
		if (
			filters.severity !== "All Severities" &&
			row.severity !== filters.severity
		) {
			return false;
		}
		if (filters.status !== "All Statuses" && row.status !== filters.status) {
			return false;
		}
		if (!q) return true;
		return (
			row.errorCode.toLowerCase().includes(q) ||
			row.description.toLowerCase().includes(q) ||
			row.responseFile.toLowerCase().includes(q) ||
			row.submissionBatch.toLowerCase().includes(q)
		);
	});
}

// ——— Validation tab ———

export const MEDICAID_INTERNAL_VALIDATION_SUMMARY = {
	filesValidated: 128,
	filesValidatedDelta: 10.12,
	passed: 112,
	passedPct: 87.5,
	warnings: 10,
	warningsPct: 7.81,
	errors: 6,
	errorsPct: 4.69,
};

export const MEDICAID_EXTERNAL_VALIDATION_SUMMARY = {
	filesValidated: 128,
	passed: 114,
	passedPct: 89.06,
	warnings: 8,
	warningsPct: 6.25,
	errors: 6,
	errorsPct: 4.69,
};

export type MedicaidInternalValidationStatus = "Passed" | "Failed";

export type MedicaidExternalValidationStatus = "Processed" | "On Hold";

export const MEDICAID_INTERNAL_VALIDATION_STATUS_STYLES: Record<
	MedicaidInternalValidationStatus,
	string
> = {
	Passed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Failed: "border-red-200 bg-red-50 text-red-700",
};

export const MEDICAID_EXTERNAL_VALIDATION_STATUS_STYLES: Record<
	MedicaidExternalValidationStatus,
	string
> = {
	Processed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	"On Hold": "border-amber-200 bg-amber-50 text-amber-800",
};

export type MedicaidInternalValidationDetail = {
	id: string;
	submissionBatch: string;
	fileName: string;
	state: string;
	fileType: string;
	records: number;
	status: MedicaidInternalValidationStatus;
	passed: number;
	warnings: number;
	errors: number;
	validatedOn: string;
};

export type MedicaidExternalValidationDetail = {
	id: string;
	responseFileName: string;
	submissionBatch: string;
	state: string;
	responseReceived: string;
	records: number;
	status: MedicaidExternalValidationStatus;
	accepted: number;
	warnings: number;
	rejected: number;
};

export type MedicaidValidationCodeCount = {
	code: string;
	description: string;
	count: number;
	pct: number;
};

export type MedicaidValidationTrendPoint = {
	week: string;
	passed: number;
	warnings: number;
	errors: number;
};

export type MedicaidValidationTypeBreakdownSlice = {
	name: string;
	value: number;
	color: string;
	pct: number;
};

export const MEDICAID_INTERNAL_VALIDATION_DETAILS: MedicaidInternalValidationDetail[] =
	[];

export const MEDICAID_EXTERNAL_VALIDATION_DETAILS: MedicaidExternalValidationDetail[] =
	[];

export const MEDICAID_VALIDATION_TOP_ERROR_CODES: MedicaidValidationCodeCount[] =
	[];

export const MEDICAID_VALIDATION_TREND: MedicaidValidationTrendPoint[] = [];

export const MEDICAID_EXTERNAL_VALIDATION_TREND: MedicaidValidationTrendPoint[] =
	[];

export const MEDICAID_EXTERNAL_TOP_REJECTION_CODES: MedicaidValidationCodeCount[] =
	[];

export const MEDICAID_VALIDATION_TYPE_BREAKDOWN: MedicaidValidationTypeBreakdownSlice[] =
	[];

export const MEDICAID_VALIDATION_QUICK_ACTIONS = [
	{
		id: "vq-1",
		title: "View Validation Rules",
		description: "Review internal and state edit rules",
	},
	{
		id: "vq-2",
		title: "Download Internal Validation Report",
		description: "Export pre-submission validation results",
	},
	{
		id: "vq-3",
		title: "Download State Validation Report",
		description: "Export state MMIS validation response",
	},
	{
		id: "vq-4",
		title: "Revalidate File",
		description: "Re-run validation on selected submission file",
	},
];

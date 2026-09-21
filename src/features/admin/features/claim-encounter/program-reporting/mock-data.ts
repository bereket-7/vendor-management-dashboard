import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";

export const MEDICARE_REPORTING_TABS = [
	"Overview",
	"Submissions",
	"Responses",
	"Validation",
	"Part D",
	"Compliance",
	"Audit",
	"Documents",
] as const;

export const MEDICAID_REPORTING_TABS = [
	"Overview",
	"Submissions",
	"Responses",
	"Validation",
	"Acceptance Analytics",
	"Exception Management",
	"Audit",
	"Documents",
] as const;

export type SubmissionStatus =
	| "Submitted"
	| "Acknowledged"
	| "Accepted"
	| "Rejected"
	| "Pending"
	| "Completed"
	| "In-Progress"
	| "Failed";

export type MedicareSubmissionStatus =
	| "Accepted"
	| "Acknowledged"
	| "Completed"
	| "In-Progress"
	| "Failed";

export type MedicaidSubmissionStatus =
	| "Submitted"
	| "Acknowledged"
	| "Accepted"
	| "Rejected"
	| "Failed";

export type AuditStatus = "Completed" | "In Progress" | "Scheduled";

export type FindingSeverity = "Critical" | "High" | "Medium" | "Low";

export type ExceptionStatus = "Open" | "In Review" | "Resolved";

export const SUBMISSION_STATUS_STYLES: Record<string, string> = {
	Submitted: "border-sky-200 bg-sky-50 text-sky-800",
	Acknowledged: "border-blue-200 bg-blue-50 text-blue-800",
	Accepted: "border-emerald-300 bg-emerald-100 text-emerald-800",
	Rejected: "border-red-200 bg-red-50 text-red-700",
	Pending: "border-amber-200 bg-amber-50 text-amber-800",
	Completed: "border-blue-200 bg-blue-50 text-blue-800",
	"In-Progress": "border-amber-200 bg-amber-50 text-amber-800",
	Failed: "border-red-200 bg-red-50 text-red-700",
};

export const MEDICARE_SUBMISSION_STATUS_STYLES: Record<
	MedicareSubmissionStatus,
	string
> = {
	Accepted: "border-emerald-300 bg-emerald-100 text-emerald-800",
	Acknowledged: "border-blue-200 bg-blue-50 text-blue-800",
	Completed: "border-blue-200 bg-blue-50 text-blue-800",
	"In-Progress": "border-amber-200 bg-amber-50 text-amber-800",
	Failed: "border-red-200 bg-red-50 text-red-700",
};

export const MEDICAID_SUBMISSION_STATUS_STYLES: Record<
	MedicaidSubmissionStatus,
	string
> = {
	Submitted: "border-sky-200 bg-sky-50 text-sky-800",
	Acknowledged: "border-blue-200 bg-blue-50 text-blue-800",
	Accepted: "border-emerald-300 bg-emerald-100 text-emerald-800",
	Rejected: "border-red-200 bg-red-50 text-red-700",
	Failed: "border-red-200 bg-red-50 text-red-700",
};

export const AUDIT_STATUS_STYLES: Record<AuditStatus, string> = {
	Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	"In Progress": "border-violet-200 bg-violet-50 text-violet-800",
	Scheduled: "border-sky-200 bg-sky-50 text-sky-800",
};

export const EXCEPTION_STATUS_STYLES: Record<ExceptionStatus, string> = {
	Open: "border-red-200 bg-red-50 text-red-700",
	"In Review": "border-amber-200 bg-amber-50 text-amber-800",
	Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const FINDING_SEVERITY_STYLES: Record<FindingSeverity, string> = {
	Critical: "text-red-600 font-semibold",
	High: "text-orange-600 font-semibold",
	Medium: "text-violet-600 font-medium",
	Low: "text-sky-600 font-medium",
};

export type ProgramOverviewData = {
	kpis:
		| {
				kind: "medicaid";
				encounterFilesSubmitted: number;
				encounterFilesDelta: number;
				encountersSubmitted: number;
				encountersDelta: number;
				accepted: number;
				acceptanceRate: number;
				rejected: number;
				rejectionRate: number;
				pendingResponses: number;
				pendingRate: number;
				acceptanceRateDelta: number;
		  }
		| {
				kind: "medicare";
				reportsSubmitted: number;
				reportsSubmittedDelta: number;
				cmsResponsesReceived: number;
				responseRate: number;
				openIssues: number;
				openIssuesDelta: number;
				complianceStatus: string;
				complianceHint: string;
				riskAdjustmentStatus: string;
				riskAdjustmentHint: string;
				partDStatus: string;
				partDHint: string;
		  };
	recentSubmissions: {
		id: string;
		batch: string;
		reportType: string;
		submittedDate: string;
		status: SubmissionStatus;
		records: number;
		region?: string;
	}[];
	recentResponses: {
		id: string;
		file: string;
		reportType: string;
		receivedDate: string;
		accepted?: number;
		rejected?: number;
		status: string;
	}[];
	exceptions: {
		id: string;
		code: string;
		description: string;
		count: number;
		status: ExceptionStatus;
	}[];
	acceptanceTrend: { month: string; rate: number }[];
	rejectionDonut: { name: string; count: number; color: string; pct: number }[];
	quickActions: { id: string; title: string; description: string }[];
	medicareExtras?: {
		riskAdjustment: {
			totalMembers: number;
			segments: { name: string; pct: number; color: string }[];
		};
		pdeSummary: {
			submitted: string;
			accepted: string;
			recordsSubmitted: number;
			recordsAccepted: number;
			acceptanceRate: number;
			segments: { name: string; value: number; color: string }[];
		};
		complianceDeadlines: {
			requirement: string;
			dueDate: string;
			status: string;
			statusStyle: string;
		}[];
	};
};

export type ProgramAuditData = {
	kpis: {
		auditsConducted: number;
		auditsConductedDelta: number;
		findingsIdentified: number;
		findingsIdentifiedDelta: number;
		criticalFindings: number;
		criticalFindingsDelta: number;
		resolvedFindings: number;
		resolvedFindingsDelta: number;
		openFindings: number;
		openFindingsDelta: number;
		correctiveActions: number;
		correctiveActionsDelta: number;
	};
	planColumnLabel: string;
	recentActivities: {
		id: string;
		auditType: string;
		reportType: string;
		plan: string;
		auditPeriod: string;
		auditDate: string;
		auditor: string;
		status: AuditStatus;
		findings: number;
		criticalFindings: number;
	}[];
	findingsBySeverity: {
		name: string;
		value: number;
		color: string;
		pct: number;
	}[];
	findingsTrend: {
		month: string;
		total: number;
		critical: number;
		high: number;
	}[];
	topFindings: {
		category: string;
		description: string;
		occurrences: number;
		severity: FindingSeverity;
	}[];
	correctiveActions: {
		status: string;
		count: number;
		pct: number;
		color: string;
	}[];
	quickActions: { id: string; title: string; description: string }[];
	totalAuditEntries: number;
};

const MEDICAID_OVERVIEW: ProgramOverviewData = {
	kpis: {
		kind: "medicaid",
		encounterFilesSubmitted: 128,
		encounterFilesDelta: 12.9,
		encountersSubmitted: 2_450_822,
		encountersDelta: 9.3,
		accepted: 2_340_915,
		acceptanceRate: 95.52,
		rejected: 76_512,
		rejectionRate: 3.12,
		pendingResponses: 33_395,
		pendingRate: 1.36,
		acceptanceRateDelta: 2.17,
	},
	recentSubmissions: [
		{
			id: "s1",
			batch: "MED-2027-Q2-001",
			reportType: "Encounter File",
			submittedDate: "Jul 18, 2027",
			status: "Submitted",
			records: 512_840,
			region: "DC",
		},
		{
			id: "s2",
			batch: "MED-2027-Q2-002",
			reportType: "Encounter File",
			submittedDate: "Jul 12, 2027",
			status: "Acknowledged",
			records: 498_220,
			region: "DC",
		},
		{
			id: "s3",
			batch: "MED-2027-Q2-003",
			reportType: "Member Eligibility",
			submittedDate: "Jul 08, 2027",
			status: "Accepted",
			records: 421_560,
			region: "MD",
		},
		{
			id: "s4",
			batch: "MED-2027-Q2-004",
			reportType: "Encounter File",
			submittedDate: "Jul 05, 2027",
			status: "Accepted",
			records: 389_104,
			region: "VA",
		},
		{
			id: "s5",
			batch: "MED-2027-Q2-005",
			reportType: "Provider Data",
			submittedDate: "Jun 28, 2027",
			status: "Acknowledged",
			records: 628_098,
			region: "DC",
		},
	],
	recentResponses: [
		{
			id: "r1",
			file: "DC_Response_Q2_2027_001.rsp",
			reportType: "Encounter File",
			receivedDate: "Jul 19, 2027",
			accepted: 498_120,
			rejected: 14_720,
			status: "Processed",
		},
		{
			id: "r2",
			file: "MD_Response_Q2_2027_Final.rsp",
			reportType: "Member Eligibility",
			receivedDate: "Jul 10, 2027",
			accepted: 410_880,
			rejected: 10_680,
			status: "Processed",
		},
		{
			id: "r3",
			file: "VA_Response_Q2_2027_001.rsp",
			reportType: "Encounter File",
			receivedDate: "Jul 06, 2027",
			accepted: 378_420,
			rejected: 10_684,
			status: "Processed",
		},
		{
			id: "r4",
			file: "DC_Response_Q2_2027_002.rsp",
			reportType: "Encounter File",
			receivedDate: "Jun 30, 2027",
			accepted: 612_440,
			rejected: 15_658,
			status: "Processed",
		},
	],
	exceptions: [
		{
			id: "e1",
			code: "ME-1024",
			description: "Member ID not found in eligibility file",
			count: 842,
			status: "Open",
		},
		{
			id: "e2",
			code: "ME-2048",
			description: "Service date outside member eligibility period",
			count: 516,
			status: "Open",
		},
		{
			id: "e3",
			code: "PR-008",
			description: "Rendering provider NPI not on file",
			count: 384,
			status: "In Review",
		},
		{
			id: "e4",
			code: "EN-022",
			description: "Duplicate encounter record detected",
			count: 291,
			status: "In Review",
		},
	],
	acceptanceTrend: [
		{ month: "Jan 2027", rate: 92.4 },
		{ month: "Feb 2027", rate: 93.1 },
		{ month: "Mar 2027", rate: 93.8 },
		{ month: "Apr 2027", rate: 94.5 },
		{ month: "May 2027", rate: 95.0 },
		{ month: "Jun 2027", rate: 95.52 },
	],
	rejectionDonut: [
		{
			name: "Missing/Invalid Member ID",
			count: 22_840,
			color: "#13446c",
			pct: 29.8,
		},
		{
			name: "Invalid Diagnosis Code",
			count: 18_920,
			color: "#3b82f6",
			pct: 24.7,
		},
		{
			name: "Provider Not Enrolled",
			count: 12_640,
			color: "#8b5cf6",
			pct: 16.5,
		},
		{ name: "Duplicate Encounter", count: 10_208, color: "#f59e0b", pct: 13.3 },
		{ name: "Other", count: 11_904, color: "#94a3b8", pct: 15.7 },
	],
	quickActions: [
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
			title: "View Exception Queue",
			description: "Open encounter exceptions requiring remediation",
		},
	],
};

const MEDICARE_OVERVIEW: ProgramOverviewData = {
	kpis: {
		kind: "medicare",
		reportsSubmitted: 42,
		reportsSubmittedDelta: 7.69,
		cmsResponsesReceived: 40,
		responseRate: 95.24,
		openIssues: 8,
		openIssuesDelta: -11.11,
		complianceStatus: "Good",
		complianceHint: "All Requirements Met",
		riskAdjustmentStatus: "On Track",
		riskAdjustmentHint: "No Critical Issues",
		partDStatus: "On Track",
		partDHint: "Last PDE: Jul 20, 2027",
	},
	recentSubmissions: [
		{
			id: "s1",
			batch: "MCR-2027-Q2-001",
			reportType: "Encounter Data",
			submittedDate: "Jul 18, 2027",
			status: "Accepted",
			records: 512_840,
		},
		{
			id: "s2",
			batch: "MCR-2027-Q2-002",
			reportType: "Risk Adjustment",
			submittedDate: "Jul 15, 2027",
			status: "Accepted",
			records: 245_302,
		},
		{
			id: "s3",
			batch: "MCR-2027-Q2-003",
			reportType: "Part D (PDE)",
			submittedDate: "Jul 12, 2027",
			status: "Accepted",
			records: 842_560,
		},
		{
			id: "s4",
			batch: "MCR-2027-Q2-004",
			reportType: "Encounter Data",
			submittedDate: "Jul 08, 2027",
			status: "Submitted",
			records: 498_220,
		},
		{
			id: "s5",
			batch: "MCR-2027-Q2-005",
			reportType: "HEDIS Measures",
			submittedDate: "Jul 05, 2027",
			status: "Acknowledged",
			records: 128_440,
		},
	],
	recentResponses: [
		{
			id: "r1",
			file: "CMS_RESP_Q2_2027_001.xml",
			reportType: "Encounter Data",
			receivedDate: "Jul 19, 2027",
			status: "Accepted",
		},
		{
			id: "r2",
			file: "CMS_RESP_Q2_2027_002.xml",
			reportType: "Risk Adjustment",
			receivedDate: "Jul 16, 2027",
			status: "Accepted",
		},
		{
			id: "r3",
			file: "CMS_RESP_Q2_2027_003.xml",
			reportType: "Part D (PDE)",
			receivedDate: "Jul 14, 2027",
			status: "Accepted",
		},
		{
			id: "r4",
			file: "CMS_RESP_Q2_2027_004.xml",
			reportType: "Encounter Data",
			receivedDate: "Jul 10, 2027",
			status: "Processed with Errors",
		},
	],
	exceptions: [
		{
			id: "e1",
			code: "HCC-401",
			description: "Invalid HCC code mapping for member",
			count: 124,
			status: "Open",
		},
		{
			id: "e2",
			code: "PDE-112",
			description: "PDE validation error – missing NDC",
			count: 86,
			status: "Open",
		},
		{
			id: "e3",
			code: "ENC-208",
			description: "Missing diagnosis code on encounter line",
			count: 64,
			status: "In Review",
		},
		{
			id: "e4",
			code: "RA-055",
			description: "Suspect condition gap not documented",
			count: 42,
			status: "In Review",
		},
	],
	acceptanceTrend: [
		{ month: "Jan 2027", rate: 91.2 },
		{ month: "Feb 2027", rate: 92.8 },
		{ month: "Mar 2027", rate: 93.5 },
		{ month: "Apr 2027", rate: 94.1 },
		{ month: "May 2027", rate: 94.8 },
		{ month: "Jun 2027", rate: 95.24 },
	],
	rejectionDonut: [
		{ name: "Invalid HCC", count: 8_420, color: "#13446c", pct: 28.4 },
		{ name: "PDE Validation Error", count: 6_840, color: "#3b82f6", pct: 23.1 },
		{ name: "Missing Diagnosis", count: 5_120, color: "#8b5cf6", pct: 17.3 },
		{ name: "Invalid NDC", count: 4_280, color: "#f59e0b", pct: 14.4 },
		{ name: "Other", count: 5_024, color: "#94a3b8", pct: 16.8 },
	],
	quickActions: [
		{
			id: "qa-1",
			title: "Submit Medicare Report",
			description: "Upload a new reporting file for the current period",
		},
		{
			id: "qa-2",
			title: "View CMS Requirements",
			description: "Review CMS submission guidelines and deadlines",
		},
		{
			id: "qa-3",
			title: "Download CMS Responses",
			description: "Export CMS response files and acceptance reports",
		},
		{
			id: "qa-4",
			title: "View Audit Findings",
			description: "Open audit findings requiring remediation",
		},
	],
	medicareExtras: {
		riskAdjustment: {
			totalMembers: 245_302,
			segments: [
				{ name: "HCC Captured", pct: 88.22, color: "#22c55e" },
				{ name: "Suspect Conditions", pct: 11.72, color: "#94a3b8" },
				{ name: "Potential Gaps", pct: 13.85, color: "#ef4444" },
				{ name: "No HCC", pct: 8.11, color: "#f59e0b" },
			],
		},
		pdeSummary: {
			submitted: "Jul 20, 2027",
			accepted: "Jul 22, 2027",
			recordsSubmitted: 842_560,
			recordsAccepted: 831_240,
			acceptanceRate: 98.76,
			segments: [
				{ name: "Accepted", value: 831_240, color: "#22c55e" },
				{ name: "Rejected", value: 8_420, color: "#ef4444" },
				{ name: "Warnings", value: 2_900, color: "#f59e0b" },
			],
		},
		complianceDeadlines: [
			{
				requirement: "Risk Adjustment Data Submission",
				dueDate: "Jul 31, 2027",
				status: "On Track",
				statusStyle: "border-emerald-200 bg-emerald-50 text-emerald-700",
			},
			{
				requirement: "Part D PDE Submission",
				dueDate: "Jul 20, 2027",
				status: "On Track",
				statusStyle: "border-emerald-200 bg-emerald-50 text-emerald-700",
			},
			{
				requirement: "Encounter Data Submission",
				dueDate: "Jul 15, 2027",
				status: "On Track",
				statusStyle: "border-emerald-200 bg-emerald-50 text-emerald-700",
			},
			{
				requirement: "HEDIS Measure Submission",
				dueDate: "Aug 15, 2027",
				status: "Upcoming",
				statusStyle: "border-amber-200 bg-amber-50 text-amber-800",
			},
		],
	},
};

const MEDICAID_AUDIT: ProgramAuditData = {
	kpis: {
		auditsConducted: 22,
		auditsConductedDelta: 5,
		findingsIdentified: 74,
		findingsIdentifiedDelta: 9,
		criticalFindings: 16,
		criticalFindingsDelta: -1,
		resolvedFindings: 48,
		resolvedFindingsDelta: 11,
		openFindings: 26,
		openFindingsDelta: -4,
		correctiveActions: 36,
		correctiveActionsDelta: 6,
	},
	planColumnLabel: "MCO / Plan",
	recentActivities: [
		{
			id: "AUD-2027-018",
			auditType: "Encounter Data Validation",
			reportType: "Encounter File",
			plan: "MFC-DC-100",
			auditPeriod: "Q2 2027",
			auditDate: "Jul 15, 2027",
			auditor: "State MMIS Review",
			status: "Completed",
			findings: 12,
			criticalFindings: 2,
		},
		{
			id: "AUD-2027-017",
			auditType: "Eligibility Reconciliation",
			reportType: "Member Eligibility",
			plan: "MFC-DC-200",
			auditPeriod: "Q2 2027",
			auditDate: "Jul 12, 2027",
			auditor: "Internal Compliance",
			status: "Completed",
			findings: 8,
			criticalFindings: 1,
		},
		{
			id: "AUD-2027-016",
			auditType: "Provider Enrollment Audit",
			reportType: "Provider Data",
			plan: "MFC-DC-100",
			auditPeriod: "Q2 2027",
			auditDate: "Jul 08, 2027",
			auditor: "State MMIS Review",
			status: "In Progress",
			findings: 6,
			criticalFindings: 0,
		},
		{
			id: "AUD-2027-015",
			auditType: "Duplicate Encounter Review",
			reportType: "Encounter File",
			plan: "MFC-DC-300",
			auditPeriod: "Q1 2027",
			auditDate: "Apr 22, 2027",
			auditor: "Internal Compliance",
			status: "Completed",
			findings: 14,
			criticalFindings: 3,
		},
		{
			id: "AUD-2027-014",
			auditType: "Capitation Accuracy Review",
			reportType: "Capitation Adj.",
			plan: "MFC-DC-200",
			auditPeriod: "Q1 2027",
			auditDate: "Apr 18, 2027",
			auditor: "External Auditor",
			status: "In Progress",
			findings: 4,
			criticalFindings: 1,
		},
	],
	findingsBySeverity: [
		{ name: "Critical", value: 16, color: "#ef4444", pct: 21.6 },
		{ name: "High", value: 22, color: "#f97316", pct: 29.7 },
		{ name: "Medium", value: 24, color: "#8b5cf6", pct: 32.4 },
		{ name: "Low", value: 12, color: "#3b82f6", pct: 16.2 },
	],
	findingsTrend: [
		{ month: "Jan 2027", total: 58, critical: 14, high: 18 },
		{ month: "Feb 2027", total: 62, critical: 15, high: 19 },
		{ month: "Mar 2027", total: 68, critical: 17, high: 20 },
		{ month: "Apr 2027", total: 71, critical: 16, high: 21 },
		{ month: "May 2027", total: 73, critical: 15, high: 22 },
		{ month: "Jun 2027", total: 74, critical: 16, high: 22 },
	],
	topFindings: [
		{
			category: "Invalid Member ID",
			description: "Member identifier not found in eligibility file",
			occurrences: 18,
			severity: "Critical",
		},
		{
			category: "Service Date Error",
			description: "Service date outside member eligibility period",
			occurrences: 14,
			severity: "High",
		},
		{
			category: "Provider Not Enrolled",
			description: "Rendering provider NPI not on state enrollment file",
			occurrences: 11,
			severity: "High",
		},
		{
			category: "Duplicate Encounter",
			description: "Duplicate encounter record within reporting period",
			occurrences: 9,
			severity: "Medium",
		},
		{
			category: "Missing Modifier",
			description: "Required procedure modifier not submitted",
			occurrences: 7,
			severity: "Medium",
		},
	],
	correctiveActions: [
		{ status: "Completed", count: 18, pct: 50.0, color: "#22c55e" },
		{ status: "In Progress", count: 12, pct: 33.3, color: "#3b82f6" },
		{ status: "Pending", count: 6, pct: 16.7, color: "#f59e0b" },
	],
	quickActions: [
		{
			id: "aq-1",
			title: "Create Corrective Action",
			description: "Create new action",
		},
		{
			id: "aq-2",
			title: "Track Corrective Actions",
			description: "Monitor action progress",
		},
		{ id: "aq-3", title: "Audit Calendar", description: "View audit schedule" },
	],
	totalAuditEntries: 22,
};

const MEDICARE_AUDIT: ProgramAuditData = {
	kpis: {
		auditsConducted: 22,
		auditsConductedDelta: 5,
		findingsIdentified: 74,
		findingsIdentifiedDelta: 9,
		criticalFindings: 16,
		criticalFindingsDelta: -1,
		resolvedFindings: 48,
		resolvedFindingsDelta: 11,
		openFindings: 26,
		openFindingsDelta: -4,
		correctiveActions: 36,
		correctiveActionsDelta: 6,
	},
	planColumnLabel: "Contract / Plan",
	recentActivities: [
		{
			id: "AUD-MCR-018",
			auditType: "Risk Adjustment Validation",
			reportType: "Risk Adjustment",
			plan: "H1234 – SilverScript",
			auditPeriod: "Q2 2027",
			auditDate: "Jul 15, 2027",
			auditor: "CMS Review",
			status: "Completed",
			findings: 12,
			criticalFindings: 2,
		},
		{
			id: "AUD-MCR-017",
			auditType: "PDE Data Validation",
			reportType: "Part D (PDE)",
			plan: "H5678 – Aetna Medicare Rx",
			auditPeriod: "Q2 2027",
			auditDate: "Jul 12, 2027",
			auditor: "Internal Compliance",
			status: "Completed",
			findings: 8,
			criticalFindings: 1,
		},
		{
			id: "AUD-MCR-016",
			auditType: "Encounter Data Audit",
			reportType: "Encounter Data",
			plan: "H1234 – SilverScript",
			auditPeriod: "Q2 2027",
			auditDate: "Jul 08, 2027",
			auditor: "CMS Review",
			status: "In Progress",
			findings: 6,
			criticalFindings: 0,
		},
		{
			id: "AUD-MCR-015",
			auditType: "HCC Capture Review",
			reportType: "Risk Adjustment",
			plan: "H9012 – Humana PDP",
			auditPeriod: "Q1 2027",
			auditDate: "Apr 22, 2027",
			auditor: "Internal Compliance",
			status: "Completed",
			findings: 14,
			criticalFindings: 3,
		},
		{
			id: "AUD-MCR-014",
			auditType: "Compliance Attestation",
			reportType: "Compliance",
			plan: "H5678 – Aetna Medicare Rx",
			auditPeriod: "Q1 2027",
			auditDate: "Apr 18, 2027",
			auditor: "External Auditor",
			status: "In Progress",
			findings: 4,
			criticalFindings: 1,
		},
	],
	findingsBySeverity: [
		{ name: "Critical", value: 16, color: "#ef4444", pct: 21.62 },
		{ name: "High", value: 22, color: "#f97316", pct: 29.73 },
		{ name: "Medium", value: 20, color: "#8b5cf6", pct: 27.03 },
		{ name: "Low", value: 16, color: "#3b82f6", pct: 21.62 },
	],
	findingsTrend: [
		{ month: "Jan 2027", total: 58, critical: 14, high: 18 },
		{ month: "Feb 2027", total: 62, critical: 15, high: 19 },
		{ month: "Mar 2027", total: 68, critical: 17, high: 20 },
		{ month: "Apr 2027", total: 71, critical: 16, high: 21 },
		{ month: "May 2027", total: 73, critical: 15, high: 22 },
		{ month: "Jun 2027", total: 74, critical: 16, high: 22 },
	],
	topFindings: [
		{
			category: "Invalid HCC",
			description: "HCC code not supported by submitted diagnosis",
			occurrences: 18,
			severity: "Critical",
		},
		{
			category: "PDE Validation Error",
			description: "PDE record failed CMS validation rules",
			occurrences: 14,
			severity: "High",
		},
		{
			category: "Missing Diagnosis Code",
			description: "Required diagnosis code missing on encounter",
			occurrences: 11,
			severity: "High",
		},
		{
			category: "Invalid NDC",
			description: "National Drug Code not recognized by CMS",
			occurrences: 9,
			severity: "Medium",
		},
		{
			category: "Duplicate PDE Record",
			description: "Duplicate prescription drug event detected",
			occurrences: 7,
			severity: "Medium",
		},
	],
	correctiveActions: [
		{ status: "Completed", count: 18, pct: 50.0, color: "#22c55e" },
		{ status: "In Progress", count: 12, pct: 33.3, color: "#3b82f6" },
		{ status: "Pending", count: 6, pct: 16.7, color: "#f59e0b" },
	],
	quickActions: [
		{
			id: "aq-1",
			title: "Create Corrective Action",
			description: "Create new action",
		},
		{
			id: "aq-2",
			title: "Track Corrective Actions",
			description: "Monitor action progress",
		},
		{ id: "aq-3", title: "Audit Calendar", description: "View audit schedule" },
	],
	totalAuditEntries: 22,
};

export function getOverviewData(programType: ProgramType): ProgramOverviewData {
	return programType === "medicare" ? MEDICARE_OVERVIEW : MEDICAID_OVERVIEW;
}

export function getAuditData(programType: ProgramType): ProgramAuditData {
	return programType === "medicare" ? MEDICARE_AUDIT : MEDICAID_AUDIT;
}

export function getProgramScale(programType: ProgramType) {
	return programType === "medicare" ? 0.82 : 1;
}

export const MEDICARE_RISK_ADJUSTMENT_KPIS = {
	totalMembers: 0,
	hccCaptured: 0,
	hccCapturedPct: 0,
	suspectConditions: 0,
	suspectPct: 0,
	potentialGaps: 0,
	gapsPct: 0,
	noHcc: 0,
	noHccPct: 0,
	openReviews: 0,
	chartReviewsDue: 0,
};

export type MedicareRiskAdjustmentHccCategory = {
	category: string;
	captured: number;
	suspected: number;
	gaps: number;
	target: number;
	rate: number;
};

export const MEDICARE_RISK_ADJUSTMENT_HCC_CATEGORIES: MedicareRiskAdjustmentHccCategory[] =
	[];

export const MEDICARE_COMPLIANCE_KPIS = {
	requirementsMet: 0,
	requirementsTotal: 0,
	upcomingDeadlines: 0,
	overdueItems: 0,
	attestationsComplete: 0,
	attestationsTotal: 0,
	openGaps: 0,
};

export type MedicareComplianceRequirement = {
	id: string;
	requirement: string;
	regulation: string;
	dueDate: string;
	owner: string;
	status: string;
	statusStyle: string;
};

export type MedicareComplianceAttestation = {
	id: string;
	name: string;
	submittedBy: string;
	submittedDate: string;
	status: string;
	statusStyle: string;
};

export const MEDICARE_COMPLIANCE_REQUIREMENTS: MedicareComplianceRequirement[] =
	[];

export const MEDICARE_COMPLIANCE_ATTESTATIONS: MedicareComplianceAttestation[] =
	[];

export type ProgramSubmissionsData =
	| {
			kind: "medicare";
			kpis: ProgramOverviewData["kpis"] & { kind: "medicare" };
			submissions: {
				id: string;
				reportType: string;
				submittedAt: string;
				reportingPeriod: string;
				status: MedicareSubmissionStatus;
				records: number;
				submittedBy: string;
			}[];
			byReportType: { name: string; value: number; color: string }[];
			summaryByStatus: {
				status: string;
				count: number;
				pct: number;
				color: string;
			}[];
			trendByMonth: {
				month: string;
				accepted: number;
				acknowledged: number;
				completed: number;
				failed: number;
			}[];
			recentActivity: {
				id: string;
				at: string;
				submissionId: string;
				reportType: string;
				status: MedicareSubmissionStatus;
				details: string;
			}[];
			quickActions: { id: string; title: string; description: string }[];
			totalEntries: number;
	  }
	| {
			kind: "medicaid";
			kpis: ProgramOverviewData["kpis"] & { kind: "medicaid" };
			submissions: {
				id: string;
				batch: string;
				fileName: string;
				state: string;
				submittedAt: string;
				status: MedicaidSubmissionStatus;
				encounters: number;
				submittedBy: string;
			}[];
			trendWeekly: {
				week: string;
				accepted: number;
				rejected: number;
				pending: number;
			}[];
			byState: { name: string; value: number; color: string }[];
			summaryByStatus: {
				status: string;
				count: number;
				pct: number;
				color: string;
			}[];
			recentActivity: {
				id: string;
				at: string;
				batch: string;
				fileName: string;
				status: MedicaidSubmissionStatus;
				encounters: number;
				details: string;
			}[];
			quickActions: { id: string; title: string; description: string }[];
			totalEntries: number;
			totalEncounters: number;
	  };

const MEDICARE_SUBMISSIONS: Extract<
	ProgramSubmissionsData,
	{ kind: "medicare" }
> = {
	kind: "medicare",
	kpis: MEDICARE_OVERVIEW.kpis as Extract<
		ProgramOverviewData["kpis"],
		{ kind: "medicare" }
	>,
	submissions: [
		{
			id: "MCR-SUB-2027-042",
			reportType: "PDE",
			submittedAt: "Jul 20, 2027 04:12 PM",
			reportingPeriod: "Q2 2027",
			status: "Accepted",
			records: 842_560,
			submittedBy: "System",
		},
		{
			id: "MCR-SUB-2027-041",
			reportType: "MAO-004",
			submittedAt: "Jul 18, 2027 11:08 AM",
			reportingPeriod: "Q2 2027",
			status: "Accepted",
			records: 245_302,
			submittedBy: "System",
		},
		{
			id: "MCR-SUB-2027-040",
			reportType: "Risk Adjustment",
			submittedAt: "Jul 15, 2027 09:44 AM",
			reportingPeriod: "Q2 2027",
			status: "Acknowledged",
			records: 198_440,
			submittedBy: "J. Martinez",
		},
		{
			id: "MCR-SUB-2027-039",
			reportType: "Encounter Data",
			submittedAt: "Jul 12, 2027 03:22 PM",
			reportingPeriod: "Q2 2027",
			status: "Completed",
			records: 512_840,
			submittedBy: "System",
		},
		{
			id: "MCR-SUB-2027-038",
			reportType: "Part D Reconciliation",
			submittedAt: "Jul 08, 2027 08:55 AM",
			reportingPeriod: "Q2 2027",
			status: "In-Progress",
			records: 128_440,
			submittedBy: "R. Chen",
		},
		{
			id: "MCR-SUB-2027-037",
			reportType: "Enrollment",
			submittedAt: "Jul 05, 2027 02:30 PM",
			reportingPeriod: "Q2 2027",
			status: "Failed",
			records: 42_180,
			submittedBy: "System",
		},
	],
	byReportType: [
		{ name: "PDE", value: 12, color: "#13446c" },
		{ name: "MAO-004", value: 10, color: "#3b82f6" },
		{ name: "Risk Adjustment", value: 8, color: "#8b5cf6" },
		{ name: "Part D Reconciliation", value: 5, color: "#f59e0b" },
		{ name: "Enrollment", value: 4, color: "#22c55e" },
		{ name: "Reconciliation", value: 3, color: "#94a3b8" },
	],
	summaryByStatus: [
		{ status: "Accepted", count: 20, pct: 47.6, color: "#22c55e" },
		{ status: "Acknowledged", count: 8, pct: 19.0, color: "#3b82f6" },
		{ status: "Completed", count: 6, pct: 14.3, color: "#6366f1" },
		{ status: "In-Progress", count: 5, pct: 11.9, color: "#f59e0b" },
		{ status: "Failed", count: 3, pct: 7.1, color: "#ef4444" },
	],
	trendByMonth: [
		{
			month: "Jan 2027",
			accepted: 5,
			acknowledged: 2,
			completed: 1,
			failed: 0,
		},
		{
			month: "Feb 2027",
			accepted: 6,
			acknowledged: 2,
			completed: 2,
			failed: 1,
		},
		{
			month: "Mar 2027",
			accepted: 7,
			acknowledged: 3,
			completed: 2,
			failed: 0,
		},
		{
			month: "Apr 2027",
			accepted: 8,
			acknowledged: 3,
			completed: 3,
			failed: 1,
		},
		{
			month: "May 2027",
			accepted: 9,
			acknowledged: 4,
			completed: 3,
			failed: 1,
		},
		{
			month: "Jun 2027",
			accepted: 10,
			acknowledged: 4,
			completed: 4,
			failed: 1,
		},
	],
	recentActivity: [
		{
			id: "a1",
			at: "Jul 20, 2027 04:15 PM",
			submissionId: "MCR-SUB-2027-042",
			reportType: "PDE",
			status: "Accepted",
			details: "PDE file accepted by CMS",
		},
		{
			id: "a2",
			at: "Jul 18, 2027 11:12 AM",
			submissionId: "MCR-SUB-2027-041",
			reportType: "MAO-004",
			status: "Accepted",
			details: "MAO-004 submission acknowledged",
		},
		{
			id: "a3",
			at: "Jul 15, 2027 09:50 AM",
			submissionId: "MCR-SUB-2027-040",
			reportType: "Risk Adjustment",
			status: "Acknowledged",
			details: "Risk adjustment file received by CMS",
		},
		{
			id: "a4",
			at: "Jul 12, 2027 03:28 PM",
			submissionId: "MCR-SUB-2027-039",
			reportType: "Encounter Data",
			status: "Completed",
			details: "Encounter data processing complete",
		},
		{
			id: "a5",
			at: "Jul 08, 2027 09:02 AM",
			submissionId: "MCR-SUB-2027-038",
			reportType: "Part D Reconciliation",
			status: "In-Progress",
			details: "Reconciliation file under CMS review",
		},
	],
	quickActions: [
		{
			id: "sq-1",
			title: "Submit Medicare Report",
			description: "Upload a new reporting file",
		},
		{
			id: "sq-2",
			title: "View CMS Responses",
			description: "Review CMS response files",
		},
		{
			id: "sq-3",
			title: "PDE Dashboard",
			description: "Open Part D submission dashboard",
		},
		{
			id: "sq-4",
			title: "Risk Adjustment Dashboard",
			description: "View HCC capture and gaps",
		},
		{
			id: "sq-5",
			title: "Compliance Calendar",
			description: "View upcoming deadlines",
		},
		{
			id: "sq-6",
			title: "Download Reports",
			description: "Export submission summary reports",
		},
	],
	totalEntries: 42,
};

const MEDICAID_SUBMISSIONS: Extract<
	ProgramSubmissionsData,
	{ kind: "medicaid" }
> = {
	kind: "medicaid",
	kpis: MEDICAID_OVERVIEW.kpis as Extract<
		ProgramOverviewData["kpis"],
		{ kind: "medicaid" }
	>,
	submissions: [
		{
			id: "s1",
			batch: "MED-2027-Q2-001",
			fileName: "837_Encounter_20270718_001.edi",
			state: "Maryland",
			submittedAt: "Jul 18, 2027 04:12 PM",
			status: "Submitted",
			encounters: 512_840,
			submittedBy: "System",
		},
		{
			id: "s2",
			batch: "MED-2027-Q2-002",
			fileName: "837_Encounter_20270712_002.edi",
			state: "Maryland",
			submittedAt: "Jul 12, 2027 11:08 AM",
			status: "Acknowledged",
			encounters: 498_220,
			submittedBy: "System",
		},
		{
			id: "s3",
			batch: "MED-2027-Q2-003",
			fileName: "837_Encounter_20270708_Final.edi",
			state: "DC",
			submittedAt: "Jul 08, 2027 09:44 AM",
			status: "Accepted",
			encounters: 421_560,
			submittedBy: "J. Martinez",
		},
		{
			id: "s4",
			batch: "MED-2027-Q2-004",
			fileName: "837_Encounter_20270705_001.edi",
			state: "Virginia",
			submittedAt: "Jul 05, 2027 03:22 PM",
			status: "Accepted",
			encounters: 389_104,
			submittedBy: "System",
		},
		{
			id: "s5",
			batch: "MED-2027-Q2-005",
			fileName: "837_Encounter_20270628_003.edi",
			state: "Maryland",
			submittedAt: "Jun 28, 2027 08:55 AM",
			status: "Failed",
			encounters: 628_098,
			submittedBy: "R. Chen",
		},
	],
	trendWeekly: [
		{ week: "Jun W1", accepted: 820_000, rejected: 28_000, pending: 12_000 },
		{ week: "Jun W2", accepted: 840_000, rejected: 26_000, pending: 11_000 },
		{ week: "Jun W3", accepted: 860_000, rejected: 24_000, pending: 10_500 },
		{ week: "Jun W4", accepted: 880_000, rejected: 22_000, pending: 9_800 },
		{ week: "Jul W1", accepted: 900_000, rejected: 20_000, pending: 9_200 },
		{ week: "Jul W2", accepted: 920_000, rejected: 18_000, pending: 8_600 },
	],
	byState: [
		{ name: "Maryland", value: 1_040_158, color: "#13446c" },
		{ name: "DC", value: 421_560, color: "#3b82f6" },
		{ name: "Virginia", value: 389_104, color: "#8b5cf6" },
		{ name: "West Virginia", value: 312_440, color: "#f59e0b" },
		{ name: "Other", value: 287_560, color: "#94a3b8" },
	],
	summaryByStatus: [
		{ status: "Accepted", count: 2_340_915, pct: 95.52, color: "#22c55e" },
		{ status: "Acknowledged", count: 498_220, pct: 20.33, color: "#3b82f6" },
		{ status: "Submitted", count: 512_840, pct: 20.93, color: "#6366f1" },
		{ status: "Failed", count: 76_512, pct: 3.12, color: "#ef4444" },
	],
	recentActivity: [
		{
			id: "a1",
			at: "Jul 18, 2027 04:15 PM",
			batch: "MED-2027-Q2-001",
			fileName: "837_Encounter_20270718_001.edi",
			status: "Submitted",
			encounters: 512_840,
			details: "File submitted successfully",
		},
		{
			id: "a2",
			at: "Jul 12, 2027 11:12 AM",
			batch: "MED-2027-Q2-002",
			fileName: "837_Encounter_20270712_002.edi",
			status: "Acknowledged",
			encounters: 498_220,
			details: "State MMIS acknowledged receipt",
		},
		{
			id: "a3",
			at: "Jul 08, 2027 09:50 AM",
			batch: "MED-2027-Q2-003",
			fileName: "837_Encounter_20270708_Final.edi",
			status: "Accepted",
			encounters: 421_560,
			details: "Encounter file accepted by state",
		},
		{
			id: "a4",
			at: "Jul 05, 2027 03:28 PM",
			batch: "MED-2027-Q2-004",
			fileName: "837_Encounter_20270705_001.edi",
			status: "Accepted",
			encounters: 389_104,
			details: "All encounters accepted",
		},
		{
			id: "a5",
			at: "Jun 28, 2027 09:02 AM",
			batch: "MED-2027-Q2-005",
			fileName: "837_Encounter_20270628_003.edi",
			status: "Failed",
			encounters: 628_098,
			details: "Validation errors – resubmission required",
		},
	],
	quickActions: [
		{
			id: "sq-1",
			title: "Submit 837 File",
			description: "Upload a new encounter batch",
		},
		{
			id: "sq-2",
			title: "Check File Status",
			description: "Track submission processing status",
		},
		{
			id: "sq-3",
			title: "Download Reports",
			description: "Export acceptance summary reports",
		},
		{
			id: "sq-4",
			title: "View Response Files",
			description: "Open state MMIS response files",
		},
		{
			id: "sq-5",
			title: "Resubmit File",
			description: "Resubmit a rejected encounter file",
		},
		{
			id: "sq-6",
			title: "View Error Summary",
			description: "Review validation error details",
		},
	],
	totalEntries: 128,
	totalEncounters: 2_450_822,
};

export function getSubmissionsData(
	programType: ProgramType
): ProgramSubmissionsData {
	return programType === "medicare"
		? MEDICARE_SUBMISSIONS
		: MEDICAID_SUBMISSIONS;
}

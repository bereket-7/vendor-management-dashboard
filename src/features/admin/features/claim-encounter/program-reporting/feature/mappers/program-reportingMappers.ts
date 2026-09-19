import type {
	PdeReconciliationDto,
	ProgramAuditDto,
	ProgramDocumentDto,
	ProgramExceptionDto,
	ProgramOverviewDto,
	ProgramResponseDto,
	ProgramSubmissionDto,
	ProgramTypeDto,
} from "@/lib/vendor-reporting/program-reporting";

import type {
	MedicaidDocumentFileKind,
	MedicaidDocumentRow,
	MedicaidDocumentStatus,
	MedicaidDocumentType,
	MedicaidExceptionDetailRow,
	MedicaidExceptionSeverity,
	MedicaidExceptionStatus,
	MedicaidResponseFileStatus,
} from "@/features/admin/features/claim-encounter/medicaid-encounter/mock-data";
import type {
	MedicarePartDReconciliationStatus,
	MedicarePartDSubmissionStatus,
	MedicarePartDSubmissionType,
} from "@/features/admin/features/claim-encounter/medicare-reporting/mock-data";
import type {
	AuditStatus,
	ExceptionStatus,
	FindingSeverity,
	MedicaidSubmissionStatus,
	MedicareSubmissionStatus,
	ProgramAuditData,
	ProgramOverviewData,
	ProgramSubmissionsData,
	SubmissionStatus,
} from "../../mock-data";
import type { ProgramType } from "../../types";

const DONUT_COLORS = ["#13446c", "#3b82f6", "#8b5cf6", "#f59e0b", "#94a3b8"];
const STATUS_COLORS: Record<string, string> = {
	Accepted: "#22c55e",
	Acknowledged: "#3b82f6",
	Submitted: "#6366f1",
	Completed: "#6366f1",
	"In-Progress": "#f59e0b",
	Pending: "#f59e0b",
	Rejected: "#ef4444",
	Failed: "#ef4444",
	Processed: "#22c55e",
};

const MEDICAID_QUICK_ACTIONS = [
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
];

const MEDICARE_QUICK_ACTIONS = [
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
];

const AUDIT_QUICK_ACTIONS = [
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
];

const SUBMISSION_QUICK_ACTIONS_MEDICAID = [
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
];

const SUBMISSION_QUICK_ACTIONS_MEDICARE = [
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
];

/** UI select keys like `q2-2027` → BE label `Q2 2027`. */
export function normalizeReportingPeriod(
	period?: string | null
): string | undefined {
	if (!period) return undefined;
	const m = /^q(\d)-(\d{4})$/i.exec(period.trim());
	if (m) return `Q${m[1]} ${m[2]}`;
	return period;
}

export function formatDisplayDate(
	raw: string | null | undefined,
	withTime = false
): string {
	if (!raw) return "—";
	const ms = Date.parse(raw);
	if (Number.isNaN(ms)) return raw;
	const d = new Date(ms);
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	const base = `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
	if (!withTime) return base;
	const h = d.getHours();
	const m = String(d.getMinutes()).padStart(2, "0");
	const ampm = h >= 12 ? "PM" : "AM";
	const h12 = h % 12 || 12;
	return `${base} ${String(h12).padStart(2, "0")}:${m} ${ampm}`;
}

function num(value: unknown, fallback = 0): number {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const n = Number(value);
		if (Number.isFinite(n)) return n;
	}
	return fallback;
}

function str(value: unknown, fallback = "—"): string {
	if (value == null || value === "") return fallback;
	return String(value);
}

function asProgramType(value: string | undefined): ProgramType {
	return value === "medicare" ? "medicare" : "medicaid";
}

function asSubmissionStatus(value: string): SubmissionStatus {
	const allowed: SubmissionStatus[] = [
		"Submitted",
		"Acknowledged",
		"Accepted",
		"Rejected",
		"Pending",
		"Completed",
		"In-Progress",
		"Failed",
	];
	const normalized =
		value === "In Progress" || value === "In Process" ? "In-Progress" : value;
	return (allowed.includes(normalized as SubmissionStatus)
		? normalized
		: "Pending") as SubmissionStatus;
}

function asMedicareSubmissionStatus(value: string): MedicareSubmissionStatus {
	const allowed: MedicareSubmissionStatus[] = [
		"Accepted",
		"Acknowledged",
		"Completed",
		"In-Progress",
		"Failed",
	];
	const normalized =
		value === "In Progress" || value === "In Process" ? "In-Progress" : value;
	if (allowed.includes(normalized as MedicareSubmissionStatus)) {
		return normalized as MedicareSubmissionStatus;
	}
	if (normalized === "Rejected") return "Failed";
	if (normalized === "Submitted" || normalized === "Pending")
		return "In-Progress";
	return "In-Progress";
}

function asMedicaidSubmissionStatus(value: string): MedicaidSubmissionStatus {
	const allowed: MedicaidSubmissionStatus[] = [
		"Submitted",
		"Acknowledged",
		"Accepted",
		"Rejected",
		"Failed",
	];
	if (allowed.includes(value as MedicaidSubmissionStatus)) {
		return value as MedicaidSubmissionStatus;
	}
	if (value === "Pending" || value === "In-Progress" || value === "In Progress")
		return "Submitted";
	return "Submitted";
}

function asExceptionStatus(value: string): ExceptionStatus {
	if (value === "Open" || value === "In Review" || value === "Resolved") {
		return value;
	}
	if (value === "Closed") return "Resolved";
	return "Open";
}

function asAuditStatus(value: string): AuditStatus {
	if (value === "Completed" || value === "In Progress" || value === "Scheduled") {
		return value;
	}
	if (value === "Closed" || value === "Done") return "Completed";
	if (value === "Open" || value === "In-Progress") return "In Progress";
	return "Scheduled";
}

function asFindingSeverity(value: string): FindingSeverity {
	if (
		value === "Critical" ||
		value === "High" ||
		value === "Medium" ||
		value === "Low"
	) {
		return value;
	}
	return "Medium";
}

function pct(part: number, whole: number): number {
	if (!whole) return 0;
	return Math.round((part / whole) * 1000) / 10;
}

function rateFromTrend(
	accepted: number,
	rejected: number,
	records: number
): number {
	const denom = records || accepted + rejected;
	if (!denom) return 0;
	return Math.round((accepted / denom) * 10000) / 100;
}

function recordField(row: Record<string, unknown>, ...keys: string[]): unknown {
	for (const key of keys) {
		if (row[key] != null && row[key] !== "") return row[key];
	}
	return undefined;
}

export function mapOverviewDto(
	dto: ProgramOverviewDto,
	programType?: ProgramType
): ProgramOverviewData {
	const kind = asProgramType(programType ?? dto.programType);
	const kpisRaw = (dto.kpis ?? {}) as Record<string, unknown>;

	const recentSubmissions = (dto.recentSubmissions ?? []).map((raw, i) => {
		const row = raw as Record<string, unknown>;
		return {
			id: str(recordField(row, "id"), `s-${i}`),
			batch: str(recordField(row, "batch"), "—"),
			reportType: str(recordField(row, "reportType", "report_type"), "—"),
			submittedDate: formatDisplayDate(
				str(recordField(row, "submittedAt", "submitted_at"), "")
			),
			status: asSubmissionStatus(str(recordField(row, "status"), "Pending")),
			records: num(recordField(row, "records")),
			region: str(recordField(row, "state", "region"), "") || undefined,
		};
	});

	const recentResponses = (dto.recentResponses ?? []).map((raw, i) => {
		const row = raw as Record<string, unknown>;
		const records = num(recordField(row, "records"));
		const errors = num(recordField(row, "errors"));
		return {
			id: str(recordField(row, "id"), `r-${i}`),
			file: str(
				recordField(row, "responseFile", "response_file", "file"),
				"—"
			),
			reportType: str(recordField(row, "reportType", "report_type"), "—"),
			receivedDate: formatDisplayDate(
				str(recordField(row, "receivedAt", "received_at"), "")
			),
			accepted: Math.max(0, records - errors),
			rejected: errors,
			status: str(recordField(row, "status"), "—"),
		};
	});

	const exceptions = (dto.exceptions ?? []).map((raw, i) => {
		const row = raw as Record<string, unknown>;
		return {
			id: str(recordField(row, "id"), `e-${i}`),
			code: str(recordField(row, "errorCode", "error_code", "code"), "—"),
			description: str(recordField(row, "description"), "—"),
			count: num(
				recordField(row, "encounterCount", "encounter_count", "count")
			),
			status: asExceptionStatus(str(recordField(row, "status"), "Open")),
		};
	});

	const acceptanceTrend = (dto.acceptanceTrend ?? []).map((row) => ({
		month: row.period || "—",
		rate: rateFromTrend(row.accepted, row.rejected, row.records),
	}));

	const donutTotal = (dto.rejectionDonut ?? []).reduce(
		(sum, item) => sum + num(item.value),
		0
	);
	const rejectionDonut = (dto.rejectionDonut ?? []).map((item, i) => ({
		name: item.name || "—",
		count: num(item.value),
		color: DONUT_COLORS[i % DONUT_COLORS.length] ?? "#94a3b8",
		pct: pct(num(item.value), donutTotal),
	}));

	const extras = dto.medicareExtras;
	const medicareExtras: ProgramOverviewData["medicareExtras"] | undefined =
		kind === "medicare" && extras
			? {
					riskAdjustment: {
						totalMembers: 0,
						segments: [],
					},
					pdeSummary: {
						submitted: "—",
						accepted: "—",
						recordsSubmitted: 0,
						recordsAccepted: 0,
						acceptanceRate: 0,
						segments: [
							{
								name: "Open PDE",
								value: extras.pdeOpen,
								color: "#f59e0b",
							},
							{
								name: "Variance",
								value: extras.pdeVariance,
								color: "#ef4444",
							},
							{
								name: "PBPs",
								value: extras.pbpCount,
								color: "#3b82f6",
							},
						],
					},
					complianceDeadlines: [],
				}
			: undefined;

	if (kind === "medicare") {
		return {
			kpis: {
				kind: "medicare",
				reportsSubmitted: num(kpisRaw.reportsSubmitted),
				reportsSubmittedDelta: num(kpisRaw.reportsSubmittedDelta),
				cmsResponsesReceived: num(kpisRaw.cmsResponsesReceived),
				responseRate: num(kpisRaw.responseRate),
				openIssues: num(kpisRaw.openIssues),
				openIssuesDelta: num(kpisRaw.openIssuesDelta),
				complianceStatus: str(kpisRaw.complianceStatus, "—"),
				complianceHint: str(kpisRaw.complianceHint, "—"),
				riskAdjustmentStatus: str(kpisRaw.riskAdjustmentStatus, "—"),
				riskAdjustmentHint: str(kpisRaw.riskAdjustmentHint, "—"),
				partDStatus:
					extras && extras.pdeOpen > 0
						? "At Risk"
						: str(kpisRaw.partDStatus, "On Track"),
				partDHint:
					extras != null
						? `Open PDE: ${extras.pdeOpen}`
						: str(kpisRaw.partDHint, "—"),
			},
			recentSubmissions,
			recentResponses,
			exceptions,
			acceptanceTrend,
			rejectionDonut,
			quickActions: MEDICARE_QUICK_ACTIONS,
			medicareExtras,
		};
	}

	return {
		kpis: {
			kind: "medicaid",
			encounterFilesSubmitted: num(kpisRaw.encounterFilesSubmitted),
			encounterFilesDelta: num(kpisRaw.encounterFilesDelta),
			encountersSubmitted: num(kpisRaw.encountersSubmitted),
			encountersDelta: num(kpisRaw.encountersDelta),
			accepted: num(kpisRaw.accepted),
			acceptanceRate: num(kpisRaw.acceptanceRate),
			rejected: num(kpisRaw.rejected),
			rejectionRate: num(kpisRaw.rejectionRate),
			pendingResponses: num(kpisRaw.pendingResponses),
			pendingRate: num(kpisRaw.pendingRate),
			acceptanceRateDelta: num(kpisRaw.acceptanceRateDelta),
		},
		recentSubmissions,
		recentResponses,
		exceptions,
		acceptanceTrend,
		rejectionDonut,
		quickActions: MEDICAID_QUICK_ACTIONS,
	};
}

export function emptyOverview(programType: ProgramType): ProgramOverviewData {
	if (programType === "medicare") {
		return {
			kpis: {
				kind: "medicare",
				reportsSubmitted: 0,
				reportsSubmittedDelta: 0,
				cmsResponsesReceived: 0,
				responseRate: 0,
				openIssues: 0,
				openIssuesDelta: 0,
				complianceStatus: "—",
				complianceHint: "—",
				riskAdjustmentStatus: "—",
				riskAdjustmentHint: "—",
				partDStatus: "—",
				partDHint: "—",
			},
			recentSubmissions: [],
			recentResponses: [],
			exceptions: [],
			acceptanceTrend: [],
			rejectionDonut: [],
			quickActions: MEDICARE_QUICK_ACTIONS,
		};
	}
	return {
		kpis: {
			kind: "medicaid",
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
		},
		recentSubmissions: [],
		recentResponses: [],
		exceptions: [],
		acceptanceTrend: [],
		rejectionDonut: [],
		quickActions: MEDICAID_QUICK_ACTIONS,
	};
}

export function mapAuditsToProgramAuditData(
	audits: ProgramAuditDto[],
	programType: ProgramType
): ProgramAuditData {
	const critical = audits.filter(
		(a) => a.findingSeverity?.toLowerCase() === "critical"
	).length;
	const resolved = audits.filter((a) =>
		["Completed", "Closed", "Resolved"].includes(a.status)
	).length;
	const open = audits.filter((a) =>
		["Open", "In Progress", "Scheduled"].includes(a.status)
	).length;

	const severityBuckets = {
		Critical: 0,
		High: 0,
		Medium: 0,
		Low: 0,
	} as Record<FindingSeverity, number>;
	for (const a of audits) {
		const sev = asFindingSeverity(a.findingSeverity || "Medium");
		severityBuckets[sev] += 1;
	}
	const sevTotal = audits.length || 1;
	const findingsBySeverity = (
		Object.entries(severityBuckets) as [FindingSeverity, number][]
	).map(([name, value], i) => ({
		name,
		value,
		color: DONUT_COLORS[i % DONUT_COLORS.length] ?? "#94a3b8",
		pct: pct(value, sevTotal),
	}));

	const recentActivities = audits.slice(0, 20).map((a, i) => {
		const details = (a.details ?? {}) as Record<string, unknown>;
		return {
			id: a.id || `audit-${i}`,
			auditType: str(details.auditType ?? a.activity, a.activity || "—"),
			reportType: str(details.reportType, "—"),
			plan: str(details.plan ?? details.pbp, "—"),
			auditPeriod: str(details.auditPeriod ?? details.reportingPeriod, "—"),
			auditDate: formatDisplayDate(a.occurredAt),
			auditor: str(details.auditor, "—"),
			status: asAuditStatus(a.status),
			findings: num(details.findings, a.findingSeverity ? 1 : 0),
			criticalFindings: a.findingSeverity?.toLowerCase() === "critical" ? 1 : 0,
		};
	});

	const topFindings = audits.slice(0, 8).map((a) => ({
		category: str(a.activity, "—"),
		description: str(
			(a.details as Record<string, unknown>)?.description,
			a.activity || "—"
		),
		occurrences: 1,
		severity: asFindingSeverity(a.findingSeverity || "Medium"),
	}));

	return {
		kpis: {
			auditsConducted: audits.length,
			auditsConductedDelta: 0,
			findingsIdentified: audits.filter((a) => Boolean(a.findingSeverity))
				.length,
			findingsIdentifiedDelta: 0,
			criticalFindings: critical,
			criticalFindingsDelta: 0,
			resolvedFindings: resolved,
			resolvedFindingsDelta: 0,
			openFindings: open,
			openFindingsDelta: 0,
			correctiveActions: 0,
			correctiveActionsDelta: 0,
		},
		planColumnLabel: programType === "medicare" ? "PBP / Plan" : "MCO / Plan",
		recentActivities,
		findingsBySeverity,
		findingsTrend: [],
		topFindings,
		correctiveActions: [],
		quickActions: AUDIT_QUICK_ACTIONS,
		totalAuditEntries: audits.length,
	};
}

function summarizeByStatus(
	statuses: string[]
): { status: string; count: number; pct: number; color: string }[] {
	const counts = new Map<string, number>();
	for (const s of statuses) {
		counts.set(s, (counts.get(s) ?? 0) + 1);
	}
	const total = statuses.length || 1;
	return [...counts.entries()].map(([status, count]) => ({
		status,
		count,
		pct: pct(count, total),
		color: STATUS_COLORS[status] ?? "#94a3b8",
	}));
}

export function mapSubmissionsToProgramSubmissionsData(
	submissions: ProgramSubmissionDto[],
	overview: ProgramOverviewData,
	programType: ProgramType
): ProgramSubmissionsData {
	if (programType === "medicare") {
		const kpis = overview.kpis.kind === "medicare"
			? overview.kpis
			: emptyOverview("medicare").kpis;
		const rows = submissions.map((s) => ({
			id: s.id,
			reportType: s.reportType || "—",
			submittedAt: formatDisplayDate(s.submittedAt, true),
			reportingPeriod: s.reportingPeriod || "—",
			status: asMedicareSubmissionStatus(s.status),
			records: s.records ?? 0,
			submittedBy: s.submittedBy || "—",
		}));
		const byReportTypeMap = new Map<string, number>();
		for (const s of submissions) {
			const key = s.reportType || "Other";
			byReportTypeMap.set(key, (byReportTypeMap.get(key) ?? 0) + 1);
		}
		const byReportType = [...byReportTypeMap.entries()].map(
			([name, value], i) => ({
				name,
				value,
				color: DONUT_COLORS[i % DONUT_COLORS.length] ?? "#94a3b8",
			})
		);
		return {
			kind: "medicare",
			kpis: kpis as Extract<ProgramOverviewData["kpis"], { kind: "medicare" }>,
			submissions: rows,
			byReportType,
			summaryByStatus: summarizeByStatus(rows.map((r) => r.status)),
			trendByMonth: [],
			recentActivity: rows.slice(0, 5).map((r, i) => ({
				id: `a-${i}`,
				at: r.submittedAt,
				submissionId: r.id,
				reportType: r.reportType,
				status: r.status,
				details: `${r.reportType} – ${r.status}`,
			})),
			quickActions: SUBMISSION_QUICK_ACTIONS_MEDICARE,
			totalEntries: submissions.length,
		};
	}

	const kpis = overview.kpis.kind === "medicaid"
		? overview.kpis
		: emptyOverview("medicaid").kpis;
	const rows = submissions.map((s) => ({
		id: s.id,
		batch: s.batch || "—",
		fileName: s.fileName || "—",
		state: s.state || "—",
		submittedAt: formatDisplayDate(s.submittedAt, true),
		status: asMedicaidSubmissionStatus(s.status),
		encounters: s.records ?? 0,
		submittedBy: s.submittedBy || "—",
	}));
	const byStateMap = new Map<string, number>();
	for (const s of submissions) {
		const key = s.state || "Other";
		byStateMap.set(key, (byStateMap.get(key) ?? 0) + (s.records ?? 0));
	}
	const byState = [...byStateMap.entries()].map(([name, value], i) => ({
		name,
		value,
		color: DONUT_COLORS[i % DONUT_COLORS.length] ?? "#94a3b8",
	}));
	return {
		kind: "medicaid",
		kpis: kpis as Extract<ProgramOverviewData["kpis"], { kind: "medicaid" }>,
		submissions: rows,
		trendWeekly: [],
		byState,
		summaryByStatus: summarizeByStatus(rows.map((r) => r.status)),
		recentActivity: rows.slice(0, 5).map((r, i) => ({
			id: `a-${i}`,
			at: r.submittedAt,
			batch: r.batch,
			fileName: r.fileName,
			status: r.status,
			encounters: r.encounters,
			details: `${r.fileName} – ${r.status}`,
		})),
		quickActions: SUBMISSION_QUICK_ACTIONS_MEDICAID,
		totalEntries: submissions.length,
		totalEncounters: submissions.reduce((sum, s) => sum + (s.records ?? 0), 0),
	};
}

export function emptySubmissions(
	programType: ProgramType
): ProgramSubmissionsData {
	return mapSubmissionsToProgramSubmissionsData(
		[],
		emptyOverview(programType),
		programType
	);
}

export function emptyAudit(programType: ProgramType): ProgramAuditData {
	return mapAuditsToProgramAuditData([], programType);
}

/* ——— Medicaid row mappers ——— */

function asDocFileKind(value: string): MedicaidDocumentFileKind {
	const v = value.toLowerCase().replace(/^\./, "");
	if (v === "dat" || v === "rsp" || v === "pdf" || v === "xlsx" || v === "txt") {
		return v;
	}
	return "pdf";
}

function asDocType(value: string): MedicaidDocumentType {
	const allowed: MedicaidDocumentType[] = [
		"Submitted File",
		"Response File",
		"Validation Report",
		"Acceptance Report",
		"Audit Document",
		"Other Document",
	];
	if (allowed.includes(value as MedicaidDocumentType)) {
		return value as MedicaidDocumentType;
	}
	const lower = value.toLowerCase();
	if (lower.includes("response")) return "Response File";
	if (lower.includes("validation")) return "Validation Report";
	if (lower.includes("acceptance")) return "Acceptance Report";
	if (lower.includes("audit")) return "Audit Document";
	if (lower.includes("submit") || lower.includes("encounter"))
		return "Submitted File";
	return "Other Document";
}

function asDocStatus(value: string): MedicaidDocumentStatus {
	const allowed: MedicaidDocumentStatus[] = [
		"Submitted",
		"Received",
		"Complete",
		"Reference",
	];
	if (allowed.includes(value as MedicaidDocumentStatus)) {
		return value as MedicaidDocumentStatus;
	}
	return "Submitted";
}

export function mapDocumentDtoToRow(
	dto: ProgramDocumentDto
): MedicaidDocumentRow {
	return {
		id: dto.id,
		name: dto.name || "—",
		fileKind: asDocFileKind(dto.fileKind || "pdf"),
		documentType: asDocType(dto.documentType || ""),
		reportingPeriod: dto.reportingPeriod || "—",
		state: dto.state || "—",
		vendor: "—",
		uploadedOn: formatDisplayDate(dto.uploadedAt, true),
		uploadedBy: "—",
		status: asDocStatus(dto.status || "Submitted"),
		fileSize: dto.fileSize || "—",
	};
}

function asExceptionSeverity(value: string): MedicaidExceptionSeverity {
	if (value === "Critical" || value === "Warning" || value === "Info") {
		return value;
	}
	if (value === "High") return "Critical";
	if (value === "Medium" || value === "Low") return "Warning";
	return "Warning";
}

function asMedicaidExceptionStatus(value: string): MedicaidExceptionStatus {
	if (value === "Open" || value === "In Review" || value === "Resolved") {
		return value;
	}
	if (value === "Closed") return "Resolved";
	return "Open";
}

export function mapExceptionDtoToRow(
	dto: ProgramExceptionDto
): MedicaidExceptionDetailRow {
	return {
		id: dto.id,
		errorCode: dto.errorCode || "—",
		description: dto.description || "—",
		severity: asExceptionSeverity(dto.severity || "Warning"),
		state: dto.state || "—",
		mco: "—",
		vendor: "—",
		submissionBatch: dto.submissionBatch || "—",
		responseFile: "—",
		encounterCount: dto.encounterCount ?? 0,
		firstOccurrence: "—",
		lastOccurrence: "—",
		status: asMedicaidExceptionStatus(dto.status || "Open"),
	};
}

function asResponseFileStatus(value: string): MedicaidResponseFileStatus {
	if (value === "Processed" || value === "Pending" || value === "Failed") {
		return value;
	}
	if (value === "Accepted" || value === "Completed") return "Processed";
	if (value === "Rejected" || value === "Error") return "Failed";
	return "Pending";
}

export type MedicaidResponseFileRow = {
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

export function mapResponseDtoToRow(
	dto: ProgramResponseDto
): MedicaidResponseFileRow {
	const errors = dto.errors ?? 0;
	const records = dto.records ?? 0;
	return {
		id: dto.id,
		fileName: dto.responseFile || "—",
		reportType: "—",
		receivedAt: formatDisplayDate(dto.receivedAt, true),
		records,
		accepted: Math.max(0, records - errors),
		errors,
		warnings: dto.warnings ?? 0,
		status: asResponseFileStatus(dto.status || "Pending"),
	};
}

export type MedicaidValidationDerived = {
	topErrorCodes: {
		code: string;
		description: string;
		count: number;
		pct: number;
	}[];
	trend: { week: string; passed: number; warnings: number; errors: number }[];
	kpis: {
		filesReceived: number;
		accepted: number;
		errors: number;
		warnings: number;
		pending: number;
	};
};

export function getValidationDerived(
	responses: ProgramResponseDto[] | MedicaidResponseFileRow[]
): MedicaidValidationDerived {
	const rows = responses.map((r) => {
		if ("responseFile" in r) {
			return mapResponseDtoToRow(r as ProgramResponseDto);
		}
		return r as MedicaidResponseFileRow;
	});
	const totalErrors = rows.reduce((sum, r) => sum + r.errors, 0);
	const totalWarnings = rows.reduce((sum, r) => sum + r.warnings, 0);
	const totalRecords = rows.reduce((sum, r) => sum + r.records, 0) || 1;
	const topErrorCodes =
		totalErrors > 0
			? [
					{
						code: "ERR",
						description: "Response file errors",
						count: totalErrors,
						pct: pct(totalErrors, totalErrors),
					},
					{
						code: "WARN",
						description: "Response file warnings",
						count: totalWarnings,
						pct: pct(totalWarnings, totalErrors + totalWarnings || 1),
					},
				]
			: [];

	const passed = pct(
		rows.reduce((sum, r) => sum + r.accepted, 0),
		totalRecords
	);
	const warnPct = pct(totalWarnings, totalRecords);
	const errPct = pct(totalErrors, totalRecords);

	return {
		topErrorCodes,
		trend: [
			{
				week: "Current",
				passed,
				warnings: warnPct,
				errors: errPct,
			},
		],
		kpis: {
			filesReceived: rows.length,
			accepted: rows.filter((r) => r.status === "Processed").length,
			errors: rows.filter((r) => r.status === "Failed").length,
			warnings: rows.filter((r) => r.warnings > 0).length,
			pending: rows.filter((r) => r.status === "Pending").length,
		},
	};
}

export type MedicaidAcceptanceDerived = {
	kpis: {
		acceptanceRate: number;
		acceptanceDelta: number;
		reportsSubmitted: number;
		reportsAccepted: number;
		reportsRejected: number;
		responsesPending: number;
		openIssues: number;
	};
	acceptanceTrend: { month: string; rate: number; prior: number }[];
	topRejections: { name: string; count: number; color: string; pct: number }[];
};

export function getAcceptanceDerived(
	overview: ProgramOverviewData
): MedicaidAcceptanceDerived {
	const k =
		overview.kpis.kind === "medicaid"
			? overview.kpis
			: {
					acceptanceRate: 0,
					acceptanceRateDelta: 0,
					encounterFilesSubmitted: 0,
					accepted: 0,
					rejected: 0,
					pendingResponses: 0,
				};
	return {
		kpis: {
			acceptanceRate: "acceptanceRate" in k ? num(k.acceptanceRate) : 0,
			acceptanceDelta:
				"acceptanceRateDelta" in k ? num(k.acceptanceRateDelta) : 0,
			reportsSubmitted:
				"encounterFilesSubmitted" in k ? num(k.encounterFilesSubmitted) : 0,
			reportsAccepted: "accepted" in k ? num(k.accepted) : 0,
			reportsRejected: "rejected" in k ? num(k.rejected) : 0,
			responsesPending:
				"pendingResponses" in k ? num(k.pendingResponses) : 0,
			openIssues: overview.exceptions.filter((e) => e.status === "Open")
				.length,
		},
		acceptanceTrend: overview.acceptanceTrend.map((row) => ({
			month: row.month,
			rate: row.rate,
			prior: 0,
		})),
		topRejections: overview.rejectionDonut,
	};
}

/* ——— Medicare Part D ——— */

export function isPartDSubmission(dto: ProgramSubmissionDto): boolean {
	const hay = `${dto.reportType} ${dto.submissionKind} ${dto.fileName}`.toLowerCase();
	return hay.includes("pde") || hay.includes("part d") || hay.includes("partd");
}

function asPartDStatus(value: string): MedicarePartDSubmissionStatus {
	if (value === "Accepted" || value === "Rejected" || value === "Pending") {
		return value;
	}
	if (value === "Failed") return "Rejected";
	if (
		value === "Submitted" ||
		value === "In-Progress" ||
		value === "Acknowledged"
	) {
		return "Pending";
	}
	return "Pending";
}

function asPartDType(value: string): MedicarePartDSubmissionType {
	const allowed: MedicarePartDSubmissionType[] = [
		"Regular",
		"Backfill",
		"Original",
		"Replacement",
		"Delete",
	];
	if (allowed.includes(value as MedicarePartDSubmissionType)) {
		return value as MedicarePartDSubmissionType;
	}
	const lower = value.toLowerCase();
	if (lower.includes("backfill")) return "Backfill";
	if (lower.includes("replace")) return "Replacement";
	if (lower.includes("delete")) return "Delete";
	if (lower.includes("original")) return "Original";
	return "Regular";
}

export type MedicarePartDSubmissionRow = {
	id: string;
	fileName: string;
	submissionType: MedicarePartDSubmissionType;
	pbp: string;
	submittedOn: string;
	recordCount: number;
	status: MedicarePartDSubmissionStatus;
};

export function mapSubmissionDtoToPartDRow(
	dto: ProgramSubmissionDto
): MedicarePartDSubmissionRow {
	return {
		id: dto.id,
		fileName: dto.fileName || "—",
		submissionType: asPartDType(dto.submissionKind || dto.reportType || ""),
		pbp: dto.pbp || "—",
		submittedOn: formatDisplayDate(dto.submittedAt, true),
		recordCount: dto.records ?? 0,
		status: asPartDStatus(dto.status),
	};
}

function asPdeReconStatus(value: string): MedicarePartDReconciliationStatus {
	if (value === "In Review" || value === "Reconciled" || value === "Pending") {
		return value;
	}
	if (value === "Closed" || value === "Complete" || value === "Completed") {
		return "Reconciled";
	}
	if (value === "Open") return "In Review";
	return "Pending";
}

export type MedicarePartDReconciliationRow = {
	id: string;
	type: string;
	pbp: string;
	recordsSubmitted: number;
	cmsAccepted: number;
	variance: number;
	status: MedicarePartDReconciliationStatus;
	lastReconciled: string;
};

export function mapPdeReconciliationDto(
	dto: PdeReconciliationDto
): MedicarePartDReconciliationRow {
	return {
		id: dto.id,
		type: dto.reconciliationType || "—",
		pbp: dto.pbp || "—",
		recordsSubmitted: dto.recordsSubmitted ?? 0,
		cmsAccepted: dto.cmsAccepted ?? 0,
		variance: dto.variance ?? 0,
		status: asPdeReconStatus(dto.status),
		lastReconciled: dto.reportingPeriod || "—",
	};
}

export type MedicarePartDKpis = {
	submitted: number;
	submittedDelta: number;
	accepted: number;
	acceptedDelta: number;
	rejected: number;
	rejectedDelta: number;
	pending: number;
	pendingDelta: number;
	lastCmsResponseAt: string;
	lastCmsResponseFile: string;
	lastCmsResponseStatus: "Processed" | "Processed with Errors" | "Pending";
};

export function mapPartDKpis(input: {
	submissions: ProgramSubmissionDto[];
	responses?: ProgramResponseDto[];
	medicareExtras?: ProgramOverviewDto["medicareExtras"];
}): MedicarePartDKpis {
	const partD = input.submissions.filter(isPartDSubmission);
	const accepted = partD.filter((s) =>
		["Accepted", "Acknowledged", "Completed"].includes(s.status)
	).length;
	const rejected = partD.filter((s) =>
		["Rejected", "Failed"].includes(s.status)
	).length;
	const pending = partD.length - accepted - rejected;
	const latest = [...(input.responses ?? [])].sort((a, b) => {
		const ta = a.receivedAt ? Date.parse(a.receivedAt) : 0;
		const tb = b.receivedAt ? Date.parse(b.receivedAt) : 0;
		return tb - ta;
	})[0];
	return {
		submitted: partD.length,
		submittedDelta: 0,
		accepted,
		acceptedDelta: 0,
		rejected,
		rejectedDelta: 0,
		pending: Math.max(0, pending),
		pendingDelta: input.medicareExtras?.pdeOpen ?? 0,
		lastCmsResponseAt: formatDisplayDate(latest?.receivedAt, true),
		lastCmsResponseFile: latest?.responseFile || "—",
		lastCmsResponseStatus:
			latest?.errors && latest.errors > 0
				? "Processed with Errors"
				: latest
					? "Processed"
					: "Pending",
	};
}

export type { ProgramTypeDto };

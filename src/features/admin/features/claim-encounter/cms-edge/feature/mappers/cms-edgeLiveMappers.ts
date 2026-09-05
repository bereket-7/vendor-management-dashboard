import type {
	CmsEdgeOverviewDto,
	EdgeAdjustmentDto,
	EdgeCorrectionDto,
	EdgeReconciliationDto,
	EdgeReconciliationOverviewDto,
	EdgeResponseDto,
	EdgeSubmissionDto,
	EdgeValidationDto,
	EdgeValidationExceptionDto,
} from "@/lib/vendor-reporting/cms-edge";

import type {
	CmsEdgeExceptionDetail,
	CmsEdgeReconciliationDetail,
	CmsEdgeResponseDetail,
	CmsEdgeResponseDetailFile,
	CmsEdgeSubmissionDetail,
	CmsResponseFileType,
	CmsResponseRow,
	CmsResponseStatus,
	CmsResponseType,
	CorrectionRow,
	CorrectionStatus,
	ExceptionDataset,
	ExceptionErrorType,
	ExceptionRow,
	ExceptionSeverity,
	ExceptionStatus,
	ReconciliationDatasetRow,
	ReconciliationEnvironment,
	ReconciliationStatus,
	SubmissionCmsResponseItem,
	SubmissionEnvironment,
	SubmissionFileType,
	SubmissionHistoryRow,
	SubmissionStatus,
	VoidReplacementRow,
} from "../../mock-data";
import {
	CMS_EDGE_RECON_FLOW,
	CMS_EDGE_RECON_VARIANCE_REASONS,
} from "../../mock-data";

/** UI select value `q2-2027` ↔ display / seed `Q2 2027` / API `q2-2027`. */
export function normalizePeriodLabel(period: string): string {
	const slug = period.trim();
	const slugMatch = /^q([1-4])-(\d{4})$/i.exec(slug);
	if (slugMatch) return `Q${slugMatch[1]} ${slugMatch[2]}`;
	return slug;
}

export function periodLabelToApiParam(periodValueOrLabel: string): string {
	const slugMatch = /^q([1-4])-(\d{4})$/i.exec(periodValueOrLabel.trim());
	if (slugMatch) return `q${slugMatch[1]}-${slugMatch[2]}`.toLowerCase();
	const labelMatch = /^Q([1-4])\s+(\d{4})$/i.exec(periodValueOrLabel.trim());
	if (labelMatch) return `q${labelMatch[1]}-${labelMatch[2]}`.toLowerCase();
	return periodValueOrLabel.trim().toLowerCase();
}

export function formatEdgeDateTime(value: string | null | undefined): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
}

export function mapSubmissionFileType(raw: string): SubmissionFileType {
	const value = raw.trim().toLowerCase();
	if (value.startsWith("enrol")) return "Enrollment";
	if (value.startsWith("med")) return "Medical";
	if (value.startsWith("pharm") || value === "rx") return "Pharmacy";
	if (
		value.includes("supp") ||
		value.includes("sdx") ||
		value.includes("diag")
	) {
		return "Supplemental Diagnosis";
	}
	return "Enrollment";
}

export function mapResponseFileType(raw: string): CmsResponseFileType {
	const value = raw.trim().toLowerCase();
	if (value.startsWith("enc")) return "Encounter";
	return mapSubmissionFileType(raw);
}

export function mapSubmissionStatus(raw: string): SubmissionStatus {
	const value = raw.trim().toLowerCase();
	if (value === "accepted") return "Accepted";
	if (value === "pending" || value === "processing") return "Processing";
	if (value === "rejected" || value === "failed" || value === "error") {
		return "Failed";
	}
	return "Processing";
}

export function mapUiStatusToApi(status: SubmissionStatus): string {
	if (status === "Accepted") return "Accepted";
	if (status === "Processing") return "Pending";
	return "Rejected";
}

export function mapSubmissionEnvironment(raw: string): SubmissionEnvironment {
	const value = raw.trim().toLowerCase();
	if (value === "test") return "Test";
	if (value === "validation") return "Validation";
	return "Production";
}

export function mapResponseType(raw: string): CmsResponseType {
	const value = raw.trim().toLowerCase();
	if (value.includes("accept") || value === "999") return "Acceptance Report";
	if (value.includes("valid")) return "Validation Response";
	if (value.includes("pay") || value === "fm") return "Payment Report";
	if (value.includes("withhold")) return "Withhold Report";
	if (value.includes("error")) return "Error Report";
	return "Acceptance Report";
}

export function mapResponseStatus(raw: string): CmsResponseStatus {
	const value = raw.trim().toLowerCase();
	if (value === "completed") return "Completed";
	if (value === "error" || value === "failed") return "Error";
	return "Pending";
}

function asCmsResponseItems(raw: unknown): SubmissionCmsResponseItem[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((item) => {
			if (!item || typeof item !== "object") return null;
			const row = item as Record<string, unknown>;
			const label = String(row.label ?? row.name ?? "CMS response");
			const statusRaw = String(row.status ?? "Pending");
			const status =
				statusRaw === "Received" ||
				statusRaw === "Pending" ||
				statusRaw === "Not Available"
					? statusRaw
					: "Pending";
			return { label, status } satisfies SubmissionCmsResponseItem;
		})
		.filter((item): item is SubmissionCmsResponseItem => item !== null);
}

function lifecycleStepForStatus(status: SubmissionStatus): number {
	if (status === "Processing") return 2;
	if (status === "Failed") return 2;
	return 3;
}

export function mapEdgeSubmissionToHistoryRow(
	dto: EdgeSubmissionDto
): SubmissionHistoryRow {
	return {
		id: dto.id,
		fileType: mapSubmissionFileType(dto.submissionType),
		environment: mapSubmissionEnvironment(dto.environment),
		reportingPeriod: normalizePeriodLabel(dto.reportingPeriod),
		submittedDateTime: formatEdgeDateTime(dto.submittedAt),
		status: mapSubmissionStatus(dto.status),
		records: dto.records ?? 0,
		submittedBy: dto.submittedBy || "—",
	};
}

export function mapEdgeSubmissionToDetail(
	dto: EdgeSubmissionDto
): CmsEdgeSubmissionDetail {
	const status = mapSubmissionStatus(dto.status);
	const totalRecords = dto.records ?? 0;
	const acceptedPercent = Number(dto.acceptedPercent ?? 0);
	const rejectedPercent = Number(dto.rejectedPercent ?? 0);
	const acceptedRecords = Math.round((totalRecords * acceptedPercent) / 100);
	const rejectedRecords = Math.max(0, totalRecords - acceptedRecords);
	const totals = dto.totals ?? {};
	const fileName =
		dto.fileName || `EDGE_${dto.reportingPeriod}_${dto.submissionType}.xml`;

	return {
		id: dto.id,
		fileType: mapSubmissionFileType(dto.submissionType),
		environment: mapSubmissionEnvironment(dto.environment),
		reportingPeriod: normalizePeriodLabel(dto.reportingPeriod),
		fileName,
		submittedDateTime: `${formatEdgeDateTime(dto.submittedAt)} ET`,
		submittedBy: dto.submittedBy || "—",
		status,
		totalRecords,
		acceptedRecords:
			typeof totals.accepted === "number" ? totals.accepted : acceptedRecords,
		acceptedPercent,
		rejectedRecords:
			typeof totals.rejected === "number" ? totals.rejected : rejectedRecords,
		rejectedPercent,
		warnings: dto.warnings ?? 0,
		cmsResponses: asCmsResponseItems(dto.cmsResponses),
		lifecycleStepIndex: lifecycleStepForStatus(status),
	};
}

export function mapEdgeResponseToRow(
	dto: EdgeResponseDto,
	submission?: EdgeSubmissionDto | null
): CmsResponseRow {
	const status = mapResponseStatus(dto.status);
	const records = dto.records ?? 0;
	const accepted =
		typeof dto.accepted === "number"
			? dto.accepted
			: status === "Completed"
				? records
				: 0;
	const rejected =
		typeof dto.rejected === "number"
			? dto.rejected
			: status === "Error"
				? records
				: 0;

	return {
		id: dto.id,
		responseFile: dto.responseFile,
		responseType: mapResponseType(dto.responseType),
		fileType: mapResponseFileType(
			dto.submissionType || submission?.submissionType || "Enrollment"
		),
		environment: mapSubmissionEnvironment(
			dto.environment || submission?.environment || "Production"
		),
		relatedSubmission: dto.submissionId,
		reportingPeriod: normalizePeriodLabel(
			dto.reportingPeriod || submission?.reportingPeriod || ""
		),
		dateReceived: formatEdgeDateTime(dto.receivedAt),
		status,
		accepted,
		rejected,
	};
}

export function mapEdgeResponseToDetail(
	dto: EdgeResponseDto,
	submission?: EdgeSubmissionDto | null
): CmsEdgeResponseDetail {
	const row = mapEdgeResponseToRow(dto, submission);
	const totalRecords = row.accepted + row.rejected || dto.records || 0;
	const acceptanceRate = totalRecords
		? Math.round((row.accepted / totalRecords) * 1000) / 10
		: 0;
	const format =
		dto.fileFormat || dto.responseFile.split(".").pop()?.toUpperCase() || "XML";
	const base = dto.responseFile.replace(/\.[^.]+$/, "");

	const files: CmsEdgeResponseDetailFile[] = [
		{
			id: "response-payload",
			name: dto.responseFile,
			kind: row.responseType,
			sizeLabel: dto.fileSize || "—",
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

	return {
		...row,
		fileSize: dto.fileSize || "—",
		fileFormat: format,
		description:
			dto.description ||
			`CMS ${row.responseType.toLowerCase()} for ${row.fileType} (${row.reportingPeriod || "period n/a"}).`,
		totalRecords,
		acceptanceRate,
		warnings: dto.warnings ?? 0,
		files,
		notes: [
			{
				id: `${dto.id}-n1`,
				dateTime: row.dateReceived,
				source: "CMS EDGE",
				note: `${row.responseType} received for submission ${row.relatedSubmission}.`,
			},
			{
				id: `${dto.id}-n2`,
				dateTime: row.dateReceived,
				source: "System",
				note:
					row.status === "Pending"
						? "Response file queued for parsing."
						: `Processed ${totalRecords.toLocaleString()} records.`,
			},
		],
		resultHighlights: [
			{ label: "Acceptance rate", value: `${acceptanceRate}%` },
			{ label: "Accepted records", value: row.accepted.toLocaleString() },
			{ label: "Rejected records", value: row.rejected.toLocaleString() },
			{ label: "Related submission", value: row.relatedSubmission },
		],
	};
}

export function mapOverviewKpis(dto: CmsEdgeOverviewDto) {
	return {
		total: dto.kpis.submissions,
		accepted: dto.kpis.accepted,
		inProgress: dto.kpis.pending,
		failed: dto.kpis.rejected,
		records: dto.kpis.records,
	};
}

export function mapExceptionSeverity(raw: string): ExceptionSeverity {
	const value = raw.trim().toLowerCase();
	if (value === "error" || value === "critical") return "Critical";
	if (value === "high") return "High";
	if (value === "warning" || value === "medium") return "Medium";
	if (value === "low") return "Low";
	return "Medium";
}

export function mapUiSeverityToApi(
	severity: ExceptionSeverity
): "Error" | "Warning" {
	if (severity === "Critical" || severity === "High") return "Error";
	return "Warning";
}

export function mapExceptionStatus(raw: string): ExceptionStatus {
	const value = raw.trim().toLowerCase();
	if (value === "open") return "Open";
	if (value.includes("progress")) return "In Progress";
	if (value === "resolved") return "Resolved";
	if (value === "closed") return "Closed";
	return "Open";
}

export function mapExceptionDataset(raw: string): ExceptionDataset {
	const value = raw.trim().toLowerCase();
	if (value.startsWith("enrol")) return "Enrollment";
	if (value.startsWith("pharm") || value === "rx") return "Pharmacy";
	if (
		value.includes("supp") ||
		value.includes("sdx") ||
		value.includes("diag")
	) {
		return "Supplemental Diagnosis";
	}
	// Encounters / Medical / unknown → Medical
	return "Medical";
}

export function mapExceptionErrorType(
	errorCode: string,
	description: string
): ExceptionErrorType {
	const hay = `${errorCode} ${description}`.toLowerCase();
	if (hay.includes("missing") || hay.includes("not found")) {
		return hay.includes("member") ||
			hay.includes("ndc") ||
			hay.includes("enrol")
			? "Cross-file"
			: "Missing Field";
	}
	if (hay.includes("duplicate")) return "Duplicate";
	if (hay.includes("schema") || hay.includes("format")) return "Schema";
	if (hay.includes("invalid") || hay.includes("outside"))
		return "Invalid Value";
	return "Invalid Value";
}

export function mapEdgeExceptionToRow(
	dto: EdgeValidationExceptionDto,
	validation?: EdgeValidationDto | null,
	linkedCorrection?: EdgeCorrectionDto | null
): ExceptionRow {
	return {
		id: dto.id,
		dataset: mapExceptionDataset(
			dto.dataset || linkedCorrection?.dataset || dto.recordType || "Medical"
		),
		recordId:
			dto.recordId || linkedCorrection?.recordId || dto.errorCode || "—",
		errorCode: dto.errorCode,
		description: dto.description,
		severity: mapExceptionSeverity(dto.severity),
		owner: dto.owner || "—",
		status: mapExceptionStatus(dto.status),
		errorType: (() => {
			const allowed: ExceptionErrorType[] = [
				"Missing Field",
				"Invalid Value",
				"Duplicate",
				"Schema",
				"Cross-file",
			];
			if (
				dto.errorType &&
				allowed.includes(dto.errorType as ExceptionErrorType)
			) {
				return dto.errorType as ExceptionErrorType;
			}
			return mapExceptionErrorType(dto.errorCode, dto.description);
		})(),
		reportingPeriod: normalizePeriodLabel(
			dto.reportingPeriod || validation?.reportingPeriod || ""
		),
	};
}

export function mapCorrectionStatus(raw: string): CorrectionStatus {
	const value = raw.trim().toLowerCase();
	if (value.includes("await")) return "Awaiting Review";
	if (value === "approved") return "Approved";
	if (value === "resubmitted") return "Resubmitted";
	return "Draft";
}

export function mapEdgeCorrectionToRow(dto: EdgeCorrectionDto): CorrectionRow {
	return {
		id: dto.id,
		exceptionId: dto.exceptionId || "",
		dataset: mapExceptionDataset(dto.dataset),
		recordId: dto.recordId,
		changeSummary: dto.changeSummary,
		owner: dto.owner || "—",
		status: mapCorrectionStatus(dto.status),
		updatedAt: formatEdgeDateTime(dto.updatedAt),
		reportingPeriod: normalizePeriodLabel(dto.reportingPeriod),
	};
}

export function mapEdgeAdjustmentToVoidRow(
	dto: EdgeAdjustmentDto
): VoidReplacementRow {
	const action = dto.action.trim().toLowerCase().startsWith("repl")
		? ("Replacement" as const)
		: ("Void" as const);
	const statusRaw = dto.status.trim().toLowerCase();
	const status =
		statusRaw === "accepted"
			? ("Accepted" as const)
			: statusRaw === "rejected"
				? ("Rejected" as const)
				: statusRaw === "submitted"
					? ("Submitted" as const)
					: ("Pending" as const);

	return {
		id: dto.id,
		originalClaimId: dto.originalRecordId,
		action,
		dataset: mapExceptionDataset(dto.dataset),
		reason: dto.reason,
		owner: dto.owner || "—",
		status,
		submittedAt: formatEdgeDateTime(dto.submittedAt),
		reportingPeriod: normalizePeriodLabel(dto.reportingPeriod),
	};
}

export function mapEdgeExceptionToDetail(
	dto: EdgeValidationExceptionDto,
	opts: {
		validation?: EdgeValidationDto | null;
		submission?: EdgeSubmissionDto | null;
		corrections: EdgeCorrectionDto[];
		adjustments: EdgeAdjustmentDto[];
	}
): CmsEdgeExceptionDetail {
	const linked =
		opts.corrections.find((item) => item.exceptionId === dto.id) ?? null;
	const row = mapEdgeExceptionToRow(dto, opts.validation, linked);
	const corrections = opts.corrections
		.filter((item) => item.exceptionId === dto.id)
		.map(mapEdgeCorrectionToRow);
	const voidReplacements = opts.adjustments
		.filter(
			(item) =>
				item.originalRecordId === row.recordId ||
				mapExceptionDataset(item.dataset) === row.dataset
		)
		.map(mapEdgeAdjustmentToVoidRow);

	const detectedAt = formatEdgeDateTime(dto.occurredAt);
	const sourceFile =
		opts.validation?.validationFile ||
		`EDGE_${row.reportingPeriod.replace(/\s+/g, "_") || "PERIOD"}_${row.dataset.replace(/\s+/g, "")}.xml`;
	const relatedSubmission =
		opts.submission?.id || opts.validation?.submissionId || "—";

	return {
		...row,
		detectedAt,
		sourceFile,
		relatedSubmission,
		fieldPath: dto.fieldPath || "record",
		expectedValue: dto.expectedValue || "Value within EDGE allowed set",
		actualValue: dto.actualValue || dto.description,
		remediation:
			dto.remediation ||
			"Normalize the value to the CMS EDGE allowed format/code set and revalidate before resubmit.",
		impactSummary: `${row.severity} ${row.errorCode} on ${row.dataset} · status ${row.status}.`,
		corrections,
		voidReplacements,
		notes:
			Array.isArray(dto.notes) && dto.notes.length
				? dto.notes.map((note, index) => {
						const item = note as {
							source?: string;
							note?: string;
							dateTime?: string;
						};
						return {
							id: `${dto.id}-n${index + 1}`,
							dateTime: item.dateTime || detectedAt,
							source: item.source || "System",
							note: item.note || String(note),
						};
					})
				: [
						{
							id: `${dto.id}-n1`,
							dateTime: detectedAt,
							source: "CMS EDGE validation",
							note: `${dto.errorCode} · ${dto.description}`,
						},
					],
	};
}

export function buildExceptionKpis(
	exceptions: ExceptionRow[],
	corrections: CorrectionRow[]
) {
	return {
		openExceptions: exceptions.filter((row) => row.status === "Open").length,
		critical: exceptions.filter((row) => row.severity === "Critical").length,
		correctionsDrafted: corrections.filter((row) => row.status === "Draft")
			.length,
		readyForResubmission: corrections.filter(
			(row) => row.status === "Resubmitted" || row.status === "Approved"
		).length,
	};
}

export function buildCorrectionQueueCounts(corrections: CorrectionRow[]) {
	return {
		draft: corrections.filter((row) => row.status === "Draft").length,
		awaitingReview: corrections.filter(
			(row) => row.status === "Awaiting Review"
		).length,
		approved: corrections.filter((row) => row.status === "Approved").length,
		resubmitted: corrections.filter((row) => row.status === "Resubmitted")
			.length,
	};
}

export function mapReconciliationStatus(raw: string): ReconciliationStatus {
	const value = raw.trim().toLowerCase();
	if (value === "balanced") return "Balanced";
	if (value.includes("variance")) return "Variance";
	return "Review Required";
}

export function mapReconciliationEnvironment(
	raw: string
): ReconciliationEnvironment {
	const value = raw.trim().toLowerCase();
	if (value === "test") return "Test";
	if (value === "validation") return "Validation";
	return "Production";
}

export function mapEdgeReconciliationToRow(
	dto: EdgeReconciliationDto
): ReconciliationDatasetRow {
	return {
		id: dto.id,
		dataset: dto.dataset,
		source: dto.sourceRecords ?? 0,
		fileGenerated: dto.fileGenerated ?? 0,
		submitted: dto.submitted ?? 0,
		cmsAccepted: dto.cmsAccepted ?? 0,
		cmsRejected: dto.cmsRejected ?? 0,
		variance:
			typeof dto.variance === "number"
				? dto.variance
				: (dto.sourceRecords ?? 0) - (dto.cmsAccepted ?? 0),
		status: mapReconciliationStatus(dto.status),
		reportingPeriod: normalizePeriodLabel(dto.reportingPeriod),
		environment: mapReconciliationEnvironment(dto.environment),
	};
}

export function mapReconciliationOverviewKpis(
	dto: EdgeReconciliationOverviewDto
) {
	return {
		sourceRecords: dto.kpis.sourceRecords,
		submitted: dto.kpis.submitted,
		cmsAccepted: dto.kpis.cmsAccepted,
		variance: dto.kpis.variance,
	};
}

export function buildReconKpisFromRows(rows: ReconciliationDatasetRow[]) {
	const sourceRecords = rows.reduce((sum, row) => sum + row.source, 0);
	const submitted = rows.reduce((sum, row) => sum + row.submitted, 0);
	const cmsAccepted = rows.reduce((sum, row) => sum + row.cmsAccepted, 0);
	return {
		sourceRecords,
		submitted,
		cmsAccepted,
		variance: sourceRecords - cmsAccepted,
	};
}

export function mapEdgeReconciliationToDetail(
	dto: EdgeReconciliationDto
): CmsEdgeReconciliationDetail {
	const row = mapEdgeReconciliationToRow(dto);
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
	const pipeline = CMS_EDGE_RECON_FLOW.map((step, index) => {
		const count = pipelineCounts[index] ?? 0;
		const previous = index === 0 ? null : (pipelineCounts[index - 1] ?? 0);
		return {
			id: step.id,
			title: step.title,
			count,
			deltaFromPrevious: previous === null ? null : count - previous,
		};
	});

	const reasonSource =
		Array.isArray(dto.varianceReasons) && dto.varianceReasons.length
			? dto.varianceReasons
			: CMS_EDGE_RECON_VARIANCE_REASONS;
	const reasonTotal = reasonSource.reduce(
		(sum, item) => sum + (item.count ?? 0),
		0
	);
	const varianceSlices =
		row.variance === 0
			? []
			: reasonSource.map((reason, index) => {
					const count = reason.count ?? 0;
					const share = reasonTotal ? count / reasonTotal : 0;
					const tone =
						("tone" in reason && reason.tone) ||
						CMS_EDGE_RECON_VARIANCE_REASONS[
							index % CMS_EDGE_RECON_VARIANCE_REASONS.length
						]?.tone ||
						"violet";
					return {
						id: reason.id || `reason-${index}`,
						label: reason.label,
						count,
						pct: Math.round(share * 1000) / 10,
						tone: tone as "violet" | "orange" | "teal" | "amber",
					};
				});

	const lastRunAt = formatEdgeDateTime(dto.updatedAt);
	const exceptionDataset = (() => {
		if (row.dataset.startsWith("Enrollment")) return "Enrollment";
		if (row.dataset.startsWith("Medical")) return "Medical";
		if (row.dataset.startsWith("Pharmacy")) return "Pharmacy";
		return "Supplemental Diagnosis";
	})();

	const summary =
		dto.summary ||
		(row.status === "Balanced"
			? `${row.dataset} is balanced for ${row.reportingPeriod} (${row.environment}). Source through CMS accepted align with no open variance.`
			: row.status === "Variance"
				? `${row.dataset} shows a material variance of ${row.variance.toLocaleString()} records between source and CMS accepted.`
				: `${row.dataset} needs review: ${row.variance.toLocaleString()} variance across the EDGE funnel (${row.cmsRejected.toLocaleString()} CMS rejects).`);

	const notes =
		Array.isArray(dto.notes) && dto.notes.length
			? dto.notes.map((note, index) => {
					const item = note as {
						source?: string;
						note?: string;
						dateTime?: string;
					};
					return {
						id: `${row.id}-n${index + 1}`,
						dateTime: item.dateTime || lastRunAt,
						source: item.source || "Reconciliation engine",
						note: item.note || String(note),
					};
				})
			: [
					{
						id: `${row.id}-n1`,
						dateTime: lastRunAt,
						source: "Reconciliation engine",
						note: `Run completed for ${row.dataset} · ${row.environment} · ${row.reportingPeriod}.`,
					},
				];

	return {
		...row,
		runId:
			dto.runId ||
			`RCN-${row.reportingPeriod.replace(/\s+/g, "")}-${row.id.slice(0, 8).toUpperCase()}`,
		lastRunAt,
		acceptanceRate,
		rejectRate,
		pipeline,
		varianceSlices,
		relatedSubmission: dto.relatedSubmissionId || "—",
		exceptionDataset,
		summary,
		notes,
	};
}

export type ReportingOverviewCard = {
	id: "submissions" | "cms-responses" | "exceptions" | "reconciliation";
	label: string;
	value: number;
	hint: string;
	href: string;
	delta: string;
	deltaTone: "up" | "down" | "neutral";
};

export type ReportingOverviewPipelineStep = {
	id: string;
	label: string;
	detail: string;
	state: "done" | "active" | "pending";
};

export type ReportingOverviewAttentionItem = {
	id: string;
	severity: "Critical" | "High" | "Medium" | "Low";
	title: string;
	detail: string;
	href: string;
	age: string;
};

export type ReportingOverviewActivityItem = {
	id: string;
	time: string;
	title: string;
	meta: string;
	tone: "success" | "info" | "warn" | "danger";
};

export type ReportingOverviewHealth = {
	status: string;
	acceptanceRate: number;
	daysToDeadline: number;
	deadlineLabel: string;
	environment: string;
	lastSync: string;
};

function formatRelativeAge(value: string | null | undefined): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	const diffMs = Date.now() - date.getTime();
	const minutes = Math.floor(diffMs / 60_000);
	if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatClockOrDay(value: string | null | undefined): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	const sameDay = date.toDateString() === new Date().toDateString();
	if (sameDay) {
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	}
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
	return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function buildReportingOverviewDashboard(input: {
	overview: CmsEdgeOverviewDto;
	responses: EdgeResponseDto[];
	exceptions: ExceptionRow[];
	reconKpis: {
		sourceRecords: number;
		submitted: number;
		cmsAccepted: number;
		variance: number;
	};
	periodLabel: string;
}): {
	health: ReportingOverviewHealth;
	cards: ReportingOverviewCard[];
	pipeline: ReportingOverviewPipelineStep[];
	attention: ReportingOverviewAttentionItem[];
	activity: ReportingOverviewActivityItem[];
} {
	const { overview, responses, exceptions, reconKpis, periodLabel } = input;
	const submissionKpis = mapOverviewKpis(overview);
	const acceptedResponses = responses.filter(
		(row) => mapResponseStatus(row.status) === "Completed"
	).length;
	const rejectedResponses = responses.filter(
		(row) => mapResponseStatus(row.status) === "Error"
	).length;
	const pendingResponses = responses.filter(
		(row) => mapResponseStatus(row.status) === "Pending"
	).length;
	const openExceptions = exceptions.filter((row) => row.status === "Open");
	const criticalOpen = openExceptions.filter(
		(row) => row.severity === "Critical"
	).length;
	const denom = submissionKpis.accepted + submissionKpis.failed;
	const acceptanceRate =
		denom > 0 ? (submissionKpis.accepted / denom) * 100 : 100;

	let healthStatus = "On Track";
	if (submissionKpis.failed > 0 || criticalOpen > 0 || reconKpis.variance > 0) {
		healthStatus = "Attention Required";
	}

	const latestSubmissionAt =
		overview.recentSubmissions
			.map((row) => row as { submittedAt?: string | null; createdAt?: string })
			.map((row) => row.submittedAt || row.createdAt || null)
			.find(Boolean) ?? null;

	const health: ReportingOverviewHealth = overview.health
		? {
				status: overview.health.status,
				acceptanceRate: overview.health.acceptanceRate,
				daysToDeadline: overview.health.daysToDeadline,
				deadlineLabel: overview.health.deadlineLabel,
				environment: overview.health.environment,
				lastSync: overview.health.lastSync,
			}
		: {
				status: healthStatus,
				acceptanceRate,
				daysToDeadline: 18,
				deadlineLabel: `${periodLabel} EDGE due Jul 15`,
				environment: "Production",
				lastSync: latestSubmissionAt
					? `Today · ${formatClockOrDay(latestSubmissionAt)}`
					: "No sync yet",
			};

	const cards: ReportingOverviewCard[] = [
		{
			id: "submissions",
			label: "Submissions",
			value: submissionKpis.total,
			hint: `${submissionKpis.accepted} accepted · ${submissionKpis.failed} failed`,
			href: "submissions",
			delta:
				submissionKpis.inProgress > 0
					? `${submissionKpis.inProgress} in progress`
					: `${submissionKpis.records.toLocaleString()} records`,
			deltaTone: submissionKpis.failed > 0 ? "down" : "up",
		},
		{
			id: "cms-responses",
			label: "CMS Responses",
			value: responses.length,
			hint: `${acceptedResponses} accepted · ${rejectedResponses} rejected`,
			href: "cms-responses",
			delta:
				pendingResponses > 0
					? `${pendingResponses} pending`
					: "All responses reviewed",
			deltaTone: pendingResponses > 0 ? "neutral" : "up",
		},
		{
			id: "exceptions",
			label: "Open Exceptions",
			value: openExceptions.length,
			hint: `${criticalOpen} critical`,
			href: "exceptions",
			delta:
				criticalOpen > 0
					? "Critical queue open"
					: openExceptions.length > 0
						? "Review recommended"
						: "Queue clear",
			deltaTone:
				criticalOpen > 0 ? "down" : openExceptions.length ? "neutral" : "up",
		},
		{
			id: "reconciliation",
			label: "Variance",
			value: reconKpis.variance,
			hint:
				reconKpis.sourceRecords > 0
					? `vs ${reconKpis.sourceRecords.toLocaleString()} source records`
					: "No reconciliation runs yet",
			href: "reconciliation",
			delta: reconKpis.variance > 0 ? "Review required" : "Balanced",
			deltaTone: reconKpis.variance > 0 ? "down" : "up",
		},
	];

	const pipeline: ReportingOverviewPipelineStep[] = [
		{
			id: "extract",
			label: "Source extract",
			detail:
				overview.kpis.warehouseClaimLines > 0
					? `${overview.kpis.warehouseClaimLines.toLocaleString()} claim lines staged`
					: `${submissionKpis.records.toLocaleString()} records staged`,
			state: "done",
		},
		{
			id: "submit",
			label: "Submit to CMS",
			detail: `${submissionKpis.total} file${submissionKpis.total === 1 ? "" : "s"} this cycle`,
			state: submissionKpis.total > 0 ? "done" : "pending",
		},
		{
			id: "response",
			label: "CMS response",
			detail:
				pendingResponses > 0
					? `${pendingResponses} file${pendingResponses === 1 ? "" : "s"} awaiting review`
					: responses.length > 0
						? `${responses.length} responses received`
						: "Awaiting CMS files",
			state:
				pendingResponses > 0
					? "active"
					: responses.length > 0
						? "done"
						: submissionKpis.total > 0
							? "active"
							: "pending",
		},
		{
			id: "reconcile",
			label: "Reconcile",
			detail:
				reconKpis.variance > 0
					? `${reconKpis.variance.toLocaleString()} variance open`
					: reconKpis.sourceRecords > 0
						? "Balanced"
						: "Not started",
			state:
				reconKpis.variance > 0
					? "active"
					: reconKpis.sourceRecords > 0
						? "done"
						: "pending",
		},
	];

	const attention: ReportingOverviewAttentionItem[] = [];

	for (const row of overview.recentSubmissions) {
		const status = mapSubmissionStatus(row.status);
		if (status !== "Failed") continue;
		attention.push({
			id: `sub-${row.id}`,
			severity: "Critical",
			title: `${mapSubmissionFileType(row.submissionType)} submission failed`,
			detail: `${row.fileName} · ${(row.records ?? 0).toLocaleString()} records`,
			href: "submissions",
			age: formatRelativeAge(
				(row as { submittedAt?: string | null }).submittedAt ?? null
			),
		});
		if (attention.length >= 4) break;
	}

	if (attention.length < 4 && criticalOpen > 0) {
		attention.push({
			id: "exc-critical",
			severity: "Critical",
			title: `${criticalOpen} critical exceptions open`,
			detail: "Validation rejects need owner action",
			href: "exceptions",
			age: "Today",
		});
	}

	if (attention.length < 4 && reconKpis.variance > 0) {
		attention.push({
			id: "recon-variance",
			severity: "Medium",
			title: "Reconciliation variance needs review",
			detail: `${reconKpis.variance.toLocaleString()} source vs CMS-accepted gap`,
			href: "reconciliation",
			age: "Today",
		});
	}

	if (attention.length < 4 && pendingResponses > 0) {
		const pending = responses.find(
			(row) => mapResponseStatus(row.status) === "Pending"
		);
		attention.push({
			id: pending ? `rsp-${pending.id}` : "rsp-pending",
			severity: "Low",
			title: "CMS response awaiting review",
			detail: pending
				? `${pending.responseFile} · ${pending.records.toLocaleString()} records`
				: `${pendingResponses} pending response files`,
			href: "cms-responses",
			age: formatRelativeAge(pending?.receivedAt),
		});
	}

	const activity: ReportingOverviewActivityItem[] = overview.recentSubmissions
		.slice(0, 5)
		.map((row) => {
			const status = mapSubmissionStatus(row.status);
			const tone =
				status === "Accepted"
					? ("success" as const)
					: status === "Failed"
						? ("danger" as const)
						: status === "Processing"
							? ("info" as const)
							: ("warn" as const);
			const title =
				status === "Accepted"
					? `CMS accepted ${mapSubmissionFileType(row.submissionType)}`
					: status === "Failed"
						? `${mapSubmissionFileType(row.submissionType)} file rejected`
						: `${mapSubmissionFileType(row.submissionType)} submission ${status.toLowerCase()}`;
			return {
				id: `act-${row.id}`,
				time: (() => {
					const stamp = formatClockOrDay(
						(row as { submittedAt?: string | null }).submittedAt ?? null
					);
					return stamp === "—" ? "Recent" : stamp;
				})(),
				title,
				meta: `${row.fileName} · ${(row.records ?? 0).toLocaleString()} records`,
				tone,
			};
		});

	if (activity.length < 5 && reconKpis.sourceRecords > 0) {
		activity.push({
			id: "act-recon",
			time: "Today",
			title: "Reconciliation snapshot",
			meta: `Production · Variance ${reconKpis.variance.toLocaleString()}`,
			tone: reconKpis.variance > 0 ? "warn" : "success",
		});
	}

	return { health, cards, pipeline, attention, activity };
}

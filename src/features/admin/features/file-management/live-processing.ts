import type {
	FileRun,
	ValidationIssue,
} from "@/features/admin/features/file-management/mock-data";
import type {
	ProcessingEventDto,
	ValidationResultDto,
} from "@/lib/vendor-core/types";

export type ProcessingLogRow = {
	id: string;
	timestamp: string;
	timeSort: number;
	level: "info" | "warn" | "error" | "debug";
	source: "File Receiver" | "Parser" | "Validation" | "Processor";
	message: string;
	relatedRecord: string | null;
	errorCode?: string;
	memberId?: string;
	lineNumber?: number;
};

function mapEventLevel(raw?: string | null): ProcessingLogRow["level"] {
	const value = (raw ?? "info").toLowerCase();
	if (value.includes("err") || value.includes("fail")) return "error";
	if (value.includes("warn")) return "warn";
	if (value.includes("debug")) return "debug";
	return "info";
}

function mapEventSource(
	raw?: string | null,
	stage?: string | null
): ProcessingLogRow["source"] {
	const value = `${raw ?? ""} ${stage ?? ""}`.toLowerCase();
	if (value.includes("valid")) return "Validation";
	if (value.includes("parse")) return "Parser";
	if (
		value.includes("receive") ||
		value.includes("download") ||
		value.includes("quarantine") ||
		value.includes("transfer")
	) {
		return "File Receiver";
	}
	return "Processor";
}

function formatEventTime(iso?: string | null): { display: string; sort: number } {
	if (!iso) return { display: "—", sort: 0 };
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return { display: iso, sort: 0 };
	return {
		display: date.toLocaleTimeString(undefined, {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		}),
		sort: date.getTime(),
	};
}

/** Map vendor-core validation results → log rows when events are unavailable. */
export function validationResultsToLogs(
	results: ValidationResultDto[]
): ProcessingLogRow[] {
	return [...results]
		.sort((a, b) => {
			const aTime = new Date(a.created_at ?? 0).getTime();
			const bTime = new Date(b.created_at ?? 0).getTime();
			return aTime - bTime;
		})
		.map((row) => {
			const time = formatEventTime(row.created_at);
			const severity =
				row.severity ?? (row.is_valid === true ? "info" : "error");
			return {
				id: `validation-${row.id}`,
				timestamp: time.display,
				timeSort: time.sort,
				level: mapEventLevel(severity),
				source: "Validation",
				message:
					row.message ??
					row.description ??
					row.code ??
					row.error_code ??
					"Validation issue",
				relatedRecord: row.member_id ?? row.subscriber_id ?? null,
				errorCode: row.code ?? row.error_code ?? undefined,
				memberId: row.member_id ?? row.subscriber_id ?? undefined,
				lineNumber: row.line_number ?? row.line ?? undefined,
			};
		});
}

/** Map vendor-core processing events → processing log viewer rows. */
export function processingEventsToLogs(
	events: ProcessingEventDto[]
): ProcessingLogRow[] {
	return [...events]
		.sort((a, b) => {
			const aTime = new Date(a.occurred_at ?? a.created_at ?? 0).getTime();
			const bTime = new Date(b.occurred_at ?? b.created_at ?? 0).getTime();
			return aTime - bTime;
		})
		.map((event) => {
			const time = formatEventTime(event.occurred_at ?? event.created_at);
			return {
				id: event.id,
				timestamp: time.display,
				timeSort: time.sort,
				level: mapEventLevel(event.level),
				source: mapEventSource(event.source, event.stage),
				message: event.detail
					? `${event.message} — ${event.detail}`
					: event.message,
				relatedRecord:
					event.related_record ?? event.member_id ?? null,
				errorCode: event.error_code ?? undefined,
				memberId: event.member_id ?? undefined,
				lineNumber: event.line_number ?? undefined,
			};
		});
}

function mapValidationSeverity(
	raw?: string | null,
	isValid?: boolean
): ValidationIssue["severity"] {
	if (isValid === true) return "info";
	const value = (raw ?? "error").toLowerCase();
	if (value.includes("warn")) return "warning";
	if (value.includes("info")) return "info";
	return "error";
}

/** Map vendor-core validation results → file run validation issues. */
export function validationResultsToIssues(
	results: ValidationResultDto[]
): ValidationIssue[] {
	return results.map((row) => ({
		id: row.id,
		severity: mapValidationSeverity(row.severity, row.is_valid),
		code: row.code ?? row.error_code ?? "VALIDATION",
		message: row.message ?? row.description ?? "Validation issue",
		line: row.line_number ?? row.line ?? undefined,
		field: row.field_name ?? row.field ?? undefined,
		memberId: row.member_id ?? row.subscriber_id ?? undefined,
		receivedValue: row.received_value ?? undefined,
		expectedValue: row.expected_value ?? undefined,
		validationRule: row.validation_rule ?? undefined,
		recommendedResolution: row.recommended_resolution ?? undefined,
		status: row.is_valid === true ? "resolved" : "open",
	}));
}

/** Merge validation issues into a live file run for detail views. */
export function enrichLiveFileRun(
	run: FileRun,
	validationResults: ValidationResultDto[]
): FileRun {
	const issues = validationResultsToIssues(validationResults);
	const errorCount = issues.filter((i) => i.severity === "error").length;
	const warningCount = issues.filter((i) => i.severity === "warning").length;
	return {
		...run,
		issues,
		errorCount: errorCount || run.errorCount,
		warningCount: warningCount || run.warningCount,
	};
}

import type { ValidationIssue } from "@/features/admin/features/file-management/mock-data";
import type {
	ErrorRecordDto,
	InboundFileDto,
	ValidationResultDto,
} from "@/lib/vendor-core/types";
import { refId, vendorLabel } from "@/lib/vendor-core/types";

export type ErrorQueueRow = ValidationIssue & {
	rowId: string;
	runId: string;
	vendor: string;
	fileType: string;
	timestamp: string;
	statusLabel: string;
	inboundFileId?: string | null;
	recordStatus?: string;
	retryEligible?: boolean;
};

function categoryToSeverity(category: string): ValidationIssue["severity"] {
	const value = category.toLowerCase();
	if (
		value.includes("content") ||
		value.includes("duplicate") ||
		value.includes("parser") ||
		value.includes("auth") ||
		value.includes("security") ||
		value.includes("api")
	) {
		return "error";
	}
	if (
		value.includes("expected") ||
		value.includes("transfer") ||
		value.includes("connection")
	) {
		return "warning";
	}
	return "info";
}

function formatTimestamp(iso?: string | null): string {
	if (!iso) return "—";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString(undefined, {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
	});
}

/** Map vendor-core error records into the error management table row shape. */
export function errorRecordsToRows(
	records: ErrorRecordDto[],
	context?: {
		nameById?: Map<string, string>;
		fileById?: Map<string, InboundFileDto>;
	}
): ErrorQueueRow[] {
	const nameById = context?.nameById;
	const fileById = context?.fileById;

	return records.map((record) => {
		const inboundFileId =
			record.inbound_file_id ??
			refId(record.inbound_file as string | { id: string } | null);
		const file = inboundFileId ? fileById?.get(inboundFileId) : undefined;
		const vendorName = file
			? vendorLabel(file.vendor, nameById)
			: vendorLabel(record.vendor, nameById);

		return {
			id: record.id,
			rowId: record.id,
			runId: inboundFileId
				? inboundFileId.slice(0, 8).toUpperCase()
				: record.id.slice(0, 8).toUpperCase(),
			severity: categoryToSeverity(record.category),
			code: record.code || record.category.replace(/_/g, "-").toUpperCase(),
			message:
				record.business_explanation ||
				record.message ||
				record.technical_message ||
				record.detail ||
				"Processing error",
			status:
				record.status === "resolved" || record.status === "ignored"
					? "resolved"
					: "open",
			field: record.stage || undefined,
			timestamp: formatTimestamp(record.created_at),
			statusLabel: record.status.replace(/_/g, " "),
			vendor: vendorName,
			fileType: file?.detected_type || record.stage || "unknown",
			inboundFileId,
			recordStatus: record.status,
			retryEligible: record.retry_eligible === true,
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

/** Fallback queue rows from validation results when ErrorRecord list is empty. */
export function validationResultsToErrorRows(
	results: ValidationResultDto[],
	context?: {
		nameById?: Map<string, string>;
		fileById?: Map<string, InboundFileDto>;
	}
): ErrorQueueRow[] {
	const nameById = context?.nameById;
	const fileById = context?.fileById;

	return results.map((row) => {
		const inboundFileId =
			row.inbound_file_id ??
			refId(row.inbound_file as string | { id: string } | null);
		const file = inboundFileId ? fileById?.get(inboundFileId) : undefined;
		const severity = mapValidationSeverity(row.severity, row.is_valid);

		return {
			id: row.id,
			rowId: row.id,
			runId: inboundFileId
				? inboundFileId.slice(0, 8).toUpperCase()
				: row.id.slice(0, 8).toUpperCase(),
			severity,
			code: row.code ?? row.error_code ?? "VALIDATION",
			message: row.message ?? row.description ?? "Validation issue",
			line: row.line_number ?? row.line ?? undefined,
			field: row.field_name ?? row.field ?? undefined,
			memberId: row.member_id ?? row.subscriber_id ?? undefined,
			status: row.is_valid === true ? "resolved" : "open",
			timestamp: formatTimestamp(row.created_at),
			statusLabel: row.is_valid === true ? "resolved" : "open",
			vendor: file ? vendorLabel(file.vendor, nameById) : "—",
			fileType: file?.detected_type || "unknown",
			inboundFileId,
			recordStatus: row.is_valid === true ? "resolved" : "open",
			retryEligible: false,
		};
	});
}

import type {
	ClaimException,
	ClaimLine,
	ClaimResponse,
	ClaimVendorFile,
	ProgramFileType,
} from "@/features/admin/features/claim-encounter/mock-data";
import type { ClaimLineDto } from "@/lib/vendor-core/types";

const PROVIDERS = [
	"Capitol Family Practice",
	"Metro Specialty Clinic",
	"Riverside Urgent Care",
	"Harbor Pediatrics",
	"Summit Orthopedics",
];

function mapGainwellStatus(
	status?: string | null
): ClaimLine["gainwellStatus"] {
	const value = (status ?? "pending").toLowerCase();
	if (value.includes("paid") && !value.includes("partial")) return "paid";
	if (value.includes("partial")) return "partial";
	if (value.includes("denied")) return "denied";
	if (value.includes("reverse") || value.includes("reject")) return "rejected";
	return "pending";
}

function mapMfcStatus(
	status?: string | null,
	metadata?: Record<string, unknown> | null
): ClaimLine["mfcReviewStatus"] {
	const review = metadata?.review;
	if (review && typeof review === "object") {
		const decision = String(
			(review as { decision?: string }).decision ?? ""
		).toLowerCase();
		if (decision === "accepted") return "accepted";
		if (decision === "rejected") return "rejected";
		if (decision === "denied") return "denied";
		if (decision === "partial") return "partial";
		if (decision === "pending") return "pending";
	}
	const gainwell = mapGainwellStatus(status);
	if (gainwell === "denied") return "denied";
	if (gainwell === "rejected") return "rejected";
	if (gainwell === "pending") return "pending";
	return "accepted";
}

function mapSubmissionStatus(
	status?: string | null,
	metadata?: Record<string, unknown> | null
): ClaimLine["submissionStatus"] {
	const mfc = mapMfcStatus(status, metadata);
	if (mfc === "rejected" || mfc === "denied") return "rejected";
	if (mfc === "pending" || mfc === "partial") return "pending";
	return "accepted";
}

/** Map vendor-core claim lines into the claim workbench row shape. */
export function claimLineDtosToClaimLines(
	rows: ClaimLineDto[],
	program: ProgramFileType = "DHCF"
): ClaimLine[] {
	return rows.map((row, index) => {
		const seq =
			Number(
				String(row.claim_reference_id ?? row.claim_id).replace(/\D/g, "")
			) || index + 1;
		const gainwellStatus = mapGainwellStatus(row.status);
		const mfcReviewStatus = mapMfcStatus(row.status, row.metadata);
		const billed = Number(row.billed_amount ?? 0);
		const paid = Number(row.paid_amount ?? 0);
		const fileId =
			row.file_control_number ??
			row.vendor_file_id?.slice(0, 8).toUpperCase() ??
			`CE-${seq}`;

		return {
			id: row.id,
			claimId: row.claim_reference_id || row.claim_id || row.id,
			lineNumber: row.line_number != null ? Number(row.line_number) : undefined,
			memberId: `MBR-${440000 + seq}`,
			provider: PROVIDERS[seq % PROVIDERS.length]!,
			vendor: row.vendor ?? "—",
			account: `${(row.vendor ?? "VND").slice(0, 3).toUpperCase()}-ACC-${(seq % 4) + 1}`,
			claimType: row.procedure_code?.startsWith("J")
				? "Pharmacy Claim"
				: row.procedure_code?.startsWith("D")
					? "Dental Claim"
					: row.line_kind === "institutional"
						? "Institutional Claim"
						: "Professional Claim",
			dateOfService: row.service_date ?? "2026-07-15",
			amountBilled: billed,
			amountPaid: paid,
			submissionStatus: mapSubmissionStatus(row.status, row.metadata),
			gainwellStatus,
			mfcReviewStatus,
			rejectReason: row.denial_reason_code ?? null,
			rejectReasons: row.denial_reason_code
				? [
						{
							code: row.denial_reason_code,
							description: `Denial code ${row.denial_reason_code}`,
						},
					]
				: [],
			responseFileName: gainwellStatus === "paid" ? `835_${fileId}.edi` : "",
			traceId: `TRC-${fileId}-${String(row.line_number ?? 1).padStart(4, "0")}`,
			batchId: row.batch_number ?? row.batch_id ?? `MFC-${fileId}`,
			fileId,
			responseId: gainwellStatus === "paid" ? `resp-${row.id.slice(0, 8)}` : "",
			program,
			direction: index % 3 === 0 ? ("outbound" as const) : ("inbound" as const),
		};
	});
}

export function findClaimLineByClaimId(
	rows: ClaimLineDto[],
	claimId: string
): ClaimLine | undefined {
	const decoded = decodeURIComponent(claimId);
	return claimLineDtosToClaimLines(rows).find(
		(row) =>
			row.id === decoded ||
			row.claimId === decoded ||
			row.claimId.toLowerCase() === decoded.toLowerCase()
	);
}

function str(value: unknown, fallback = ""): string {
	if (value == null) return fallback;
	return String(value);
}

function num(value: unknown, fallback = 0): number {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

/** Map Django `/claim-vendor-files/` rows into claim workbench file cards. */
export function claimVendorFileDtosToFiles(
	rows: Record<string, unknown>[],
	program: ProgramFileType = "DHCF"
): ClaimVendorFile[] {
	return rows.map((row, index) => {
		const id = str(row.id);
		const claimCount = num(row.claim_count);
		const rejected = num(row.rejected_count);
		const accepted = Math.max(claimCount - rejected, 0);
		const statusRaw = str(row.status, "pending").toLowerCase();
		const reviewStatus: ClaimVendorFile["reviewStatus"] =
			statusRaw.includes("reject")
				? "rejected"
				: statusRaw.includes("accept") || statusRaw.includes("complete")
					? "accepted"
					: "pending";
		const fileStatus: ClaimVendorFile["status"] =
			reviewStatus === "rejected"
				? "rejected"
				: reviewStatus === "accepted"
					? "accepted"
					: "pending";
		return {
			id,
			fileId: str(
				row.transaction_set_control_number,
				`CVF-${id.slice(0, 8).toUpperCase()}`
			),
			vendor: str(row.vendor_name ?? row.vendor, "Vendor"),
			direction: "inbound",
			program,
			fileTypeLabel: "837 Professional",
			transactionType: "837",
			fileName: `${str(row.transaction_set_control_number, id)}.edi`,
			receivedAt: str(row.created_at, new Date().toISOString()),
			records: claimCount,
			submitted: claimCount,
			accepted,
			rejected,
			partial: 0,
			paid: accepted,
			denied: rejected,
			status: fileStatus,
			responseCode: null,
			notes: null,
			avgResponseMinutes: null,
			reviewStatus,
			rejectReasons: [],
			reviewedAt: null,
			reviewedBy: null,
			sourceInboundFileId: row.source_inbound_file
				? str(row.source_inbound_file)
				: null,
			outboundSendStatus: null,
			ediFixture: "837I",
		};
	});
}

/** Map Django `/claim-responses/` rows. */
export function claimResponseDtosToResponses(
	rows: Record<string, unknown>[],
	program: ProgramFileType = "DHCF"
): ClaimResponse[] {
	return rows.map((row, index) => {
		const id = str(row.id);
		const accepted = num(row.accepted_count);
		const rejected = num(row.rejected_count);
		const typeRaw = str(row.response_type, "835").toUpperCase();
		const responseType: ClaimResponse["responseType"] =
			typeRaw === "277CA" ||
			typeRaw === "999" ||
			typeRaw === "TA1" ||
			typeRaw === "835"
				? typeRaw
				: "835";
		return {
			id,
			responseId: `RESP-${id.slice(0, 8).toUpperCase()}`,
			responseFile: `${responseType}_${id.slice(0, 8)}.edi`,
			submissionBatch: str(row.batch, `BATCH-${index + 1}`),
			relatedFileId: str(row.source_inbound_file, id),
			vendor: str(row.vendor_name ?? row.vendor, "Vendor"),
			program,
			claimType: "Professional Claim",
			responseType,
			receivedAt: str(row.received_at ?? row.created_at, new Date().toISOString()),
			totalSubmitted: accepted + rejected,
			paid: accepted,
			rejected,
			partialPaid: 0,
			pending: 0,
			acceptedCount: accepted,
			rejectedCount: rejected,
			status: rejected > accepted ? "rejected" : "accepted",
			summary: `${accepted} accepted / ${rejected} rejected`,
			direction: "inbound",
			ediFixture: responseType === "835" ? "835" : "837I",
		};
	});
}

/** Map Django `/claim-exceptions/` rows. */
export function claimExceptionDtosToExceptions(
	rows: Record<string, unknown>[],
	program: ProgramFileType = "DHCF"
): ClaimException[] {
	return rows.map((row) => {
		const id = str(row.id);
		const severityRaw = str(row.severity, "error").toLowerCase();
		const statusRaw = str(row.status, "open").toLowerCase();
		return {
			id,
			exceptionId: `EX-${id.slice(0, 8).toUpperCase()}`,
			fileId: str(row.batch ?? row.source_inbound_file, id),
			vendor: str(row.vendor_name ?? row.vendor, "Vendor"),
			program,
			severity: severityRaw === "warning" ? "warning" : "error",
			code: str(row.code, "EXC"),
			message: str(row.message, "Exception"),
			claimId: row.claim_line ? str(row.claim_line) : null,
			status:
				statusRaw === "resolved"
					? "resolved"
					: statusRaw.includes("progress")
						? "in_progress"
						: "open",
			detectedAt: str(row.created_at, new Date().toISOString()),
		};
	});
}


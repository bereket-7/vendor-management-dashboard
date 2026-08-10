import type { ClaimLine, ProgramFileType } from "@/features/admin/features/claim-encounter/mock-data";
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

function mapMfcStatus(status?: string | null): ClaimLine["mfcReviewStatus"] {
	const gainwell = mapGainwellStatus(status);
	if (gainwell === "denied") return "denied";
	if (gainwell === "rejected") return "rejected";
	if (gainwell === "pending") return "pending";
	return "accepted";
}

function mapSubmissionStatus(
	status?: string | null
): ClaimLine["submissionStatus"] {
	const mfc = mapMfcStatus(status);
	if (mfc === "rejected" || mfc === "denied") return "rejected";
	if (mfc === "pending") return "pending";
	return "accepted";
}

/** Map vendor-core claim lines into the claim workbench row shape. */
export function claimLineDtosToClaimLines(
	rows: ClaimLineDto[],
	program: ProgramFileType = "DHCF"
): ClaimLine[] {
	return rows.map((row, index) => {
		const seq =
			Number(String(row.claim_reference_id ?? row.claim_id).replace(/\D/g, "")) ||
			index + 1;
		const gainwellStatus = mapGainwellStatus(row.status);
		const mfcReviewStatus = mapMfcStatus(row.status);
		const billed = Number(row.billed_amount ?? 0);
		const paid = Number(row.paid_amount ?? 0);
		const fileId =
			row.file_control_number ??
			row.vendor_file_id?.slice(0, 8).toUpperCase() ??
			`CE-${seq}`;

		return {
			id: row.id,
			claimId: row.claim_reference_id || row.claim_id || row.id,
			memberId: `MBR-${440000 + seq}`,
			provider: PROVIDERS[seq % PROVIDERS.length]!,
			vendor: row.vendor ?? "—",
			account: `${(row.vendor ?? "VND").slice(0, 3).toUpperCase()}-ACC-${(seq % 4) + 1}`,
			claimType: row.procedure_code?.startsWith("J")
				? "Pharmacy Claim"
				: row.procedure_code?.startsWith("D")
					? "Dental Claim"
					: "Professional Claim",
			dateOfService: row.service_date ?? "2026-07-15",
			amountBilled: billed,
			amountPaid: paid,
			submissionStatus: mapSubmissionStatus(row.status),
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
			direction: index % 3 === 0 ? "outbound" : "inbound",
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

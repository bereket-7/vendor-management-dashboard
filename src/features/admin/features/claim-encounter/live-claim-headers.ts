import type {
	ClaimLine,
	ProgramFileType,
} from "@/features/admin/features/claim-encounter/mock-data";

/** Wire shape from claim-headers list/detail. */
export type ClaimHeaderDto = {
	id?: string;
	reference_id?: string | null;
	claim_reference_id?: string | null;
	subscriber_id?: string | null;
	billing_provider_npi?: string | null;
	rendering_provider_npi?: string | null;
	total_billed_amount?: number | string | null;
	status?: string | null;
	validation_status?: string | null;
	is_duplicate?: boolean | null;
	primary_diagnosis_code?: string | null;
	vendor_file?: { id?: string; reference_id?: string | null } | null;
	source_inbound_file_id?: string | null;
	created_at?: string | null;
	facility_code?: string | null;
	frequency_code?: string | null;
	lines?: Array<{
		id?: string;
		line_number?: number;
		procedure_code?: string | null;
		revenue_code?: string | null;
		service_date?: string | null;
		billed_amount?: number | string | null;
		paid_amount?: number | string | null;
		status?: string | null;
		line_kind?: string | null;
	}> | null;
};

function mapStatus(status?: string | null): ClaimLine["gainwellStatus"] {
	const value = (status ?? "pending").toLowerCase();
	if (value.includes("paid") && !value.includes("partial")) return "paid";
	if (value.includes("partial")) return "partial";
	if (value.includes("denied")) return "denied";
	if (
		value.includes("void") ||
		value.includes("reverse") ||
		value.includes("reject")
	)
		return "rejected";
	return "pending";
}

function mapMfc(status?: string | null): ClaimLine["mfcReviewStatus"] {
	const g = mapStatus(status);
	if (g === "denied") return "denied";
	if (g === "rejected") return "rejected";
	if (g === "pending") return "pending";
	return "accepted";
}

/** Map claim headers into workbench ClaimLine rows (one row per claim). */
export function claimHeaderDtosToClaimLines(
	rows: ClaimHeaderDto[],
	program: ProgramFileType = "DHCF"
): ClaimLine[] {
	return rows.map((row, index) => {
		const claimId = String(
			row.claim_reference_id ?? row.reference_id ?? row.id ?? index
		);
		const billed = Number(row.total_billed_amount ?? 0);
		const firstLine = row.lines?.[0];
		const paid = Number(firstLine?.paid_amount ?? 0);
		const gainwellStatus = mapStatus(row.status);
		const vendorFileId = row.vendor_file?.id ? String(row.vendor_file.id) : "";
		const fileRef = row.vendor_file?.reference_id
			? String(row.vendor_file.reference_id)
			: vendorFileId.slice(0, 8).toUpperCase() || `HDR-${index + 1}`;

		return {
			id: String(row.id ?? claimId),
			claimId,
			memberId: row.subscriber_id?.trim() || `SUB-${index + 1}`,
			provider: row.billing_provider_npi?.trim()
				? `NPI ${row.billing_provider_npi}`
				: "—",
			vendor: "—",
			account: "—",
			claimType:
				firstLine?.line_kind === "institutional"
					? "Institutional Claim"
					: "Professional Claim",
			dateOfService: firstLine?.service_date ?? "—",
			amountBilled: billed,
			amountPaid: paid,
			submissionStatus:
				gainwellStatus === "rejected" || gainwellStatus === "denied"
					? "rejected"
					: gainwellStatus === "pending"
						? "pending"
						: "accepted",
			gainwellStatus,
			mfcReviewStatus: mapMfc(row.status),
			rejectReason: null,
			rejectReasons: [],
			responseFileName: "",
			traceId: `TRC-${fileRef}`,
			batchId: fileRef,
			fileId: fileRef,
			responseId: "",
			program,
			direction: "inbound" as const,
		};
	});
}

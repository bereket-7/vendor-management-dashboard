import type {
	ClaimFileStatus,
	ClaimVendorFile,
	MfcReviewStatus,
	ProgramFileType,
	RejectReason,
} from "@/features/admin/features/claim-encounter/mock-data";
import { REJECT_REASON_CATALOG } from "@/features/admin/features/claim-encounter/mock-data";

/** Wire shape from `GET /api/v1/claim-vendor-files/list/` (loose — BE evolves). */
export type ClaimVendorFileDto = {
	id?: string;
	reference_id?: string | null;
	batch?: { id?: string; reference_id?: string | null } | null;
	vendor?: { id?: string; name?: string | null } | null;
	source_inbound_file_id?: string | null;
	transaction_set_control_number?: string | null;
	status?: string | null;
	direction?: string | null;
	review_status?: string | null;
	outbound_send_status?: string | null;
	received_at?: string | null;
	file_name?: string | null;
	program?: string | null;
	transaction_type?: string | null;
	reject_reasons?: string[] | null;
	reviewed_at?: string | null;
	reviewed_by?: string | null;
	download_available?: boolean | null;
	claim_count?: number | null;
	rejected_count?: number | null;
	created_at?: string | null;
	metadata?: Record<string, unknown> | null;
};

const PROGRAMS = new Set(["DHCF", "MDH", "HHS"]);

function mapProgram(
	raw: string | null | undefined,
	fallback: ProgramFileType
): ProgramFileType {
	const value = (raw ?? "").toUpperCase();
	if (PROGRAMS.has(value)) return value as ProgramFileType;
	return fallback;
}

function mapDirection(raw: string | null | undefined): "inbound" | "outbound" {
	return raw === "outbound" ? "outbound" : "inbound";
}

function mapReviewStatus(raw: string | null | undefined): MfcReviewStatus {
	const value = (raw ?? "pending").toLowerCase();
	if (value === "accepted") return "accepted";
	if (value === "rejected") return "rejected";
	if (value === "denied") return "denied";
	if (value === "partial") return "partial";
	return "pending";
}

function mapPipelineStatus(raw: string | null | undefined): ClaimFileStatus {
	const value = (raw ?? "received").toLowerCase();
	if (value === "accepted") return "accepted";
	if (value === "rejected") return "rejected";
	if (value === "processing") return "pending";
	return "pending";
}

function mapTransactionType(
	raw: string | null | undefined
): ClaimVendorFile["transactionType"] {
	const value = (raw ?? "").toUpperCase();
	if (value.includes("835")) return "835";
	if (value.includes("277")) return "277CA";
	if (value.includes("999")) return "999";
	if (value.includes("TA1")) return "TA1";
	return "837";
}

function mapRejectReasons(codes: string[] | null | undefined): RejectReason[] {
	if (!codes?.length) return [];
	return codes.map((code) => {
		const known = REJECT_REASON_CATALOG.find((r) => r.code === code);
		return known ?? { code, description: code };
	});
}

function vendorName(row: ClaimVendorFileDto): string {
	const name = row.vendor?.name?.trim();
	if (name) return name;
	return "—";
}

/** Map vendor-core claim vendor files into queue UI rows. */
export function claimVendorFileDtoToUi(
	row: ClaimVendorFileDto,
	programFallback: ProgramFileType = "DHCF"
): ClaimVendorFile {
	const id = String(row.id ?? "");
	const claimCount = Number(row.claim_count ?? 0);
	const rejected = Number(row.rejected_count ?? 0);
	const reviewStatus = mapReviewStatus(row.review_status);
	const direction = mapDirection(row.direction);
	const transactionType = mapTransactionType(row.transaction_type);
	const accepted =
		reviewStatus === "accepted"
			? Math.max(0, claimCount - rejected)
			: reviewStatus === "partial"
				? Math.max(0, claimCount - rejected)
				: 0;

	const meta =
		row.metadata && typeof row.metadata === "object" ? row.metadata : null;
	const sourceInboundVendorFileId = meta?.source_inbound_vendor_file_id
		? String(meta.source_inbound_vendor_file_id)
		: null;

	return {
		id,
		fileId: String(row.reference_id ?? id),
		vendor: vendorName(row),
		direction,
		program: mapProgram(row.program, programFallback),
		fileTypeLabel:
			row.transaction_type?.trim() ||
			(direction === "outbound" ? "Outbound package" : "Inbound claim file"),
		transactionType,
		fileName:
			row.file_name?.trim() || String(row.transaction_set_control_number ?? id),
		receivedAt: String(
			row.received_at ?? row.created_at ?? new Date().toISOString()
		),
		records: claimCount,
		submitted: claimCount,
		accepted,
		rejected,
		partial:
			reviewStatus === "partial" ? Math.max(0, claimCount - rejected) : 0,
		paid: 0,
		denied:
			reviewStatus === "rejected" || reviewStatus === "denied" ? rejected : 0,
		status:
			reviewStatus === "partial" ? "partial" : mapPipelineStatus(row.status),
		responseCode: null,
		notes: null,
		avgResponseMinutes: null,
		reviewStatus,
		rejectReasons: mapRejectReasons(row.reject_reasons ?? undefined),
		reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
		reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
		/** Prefer sibling inbound CVF id (outbound packages); else intake inbound file. */
		sourceInboundFileId:
			sourceInboundVendorFileId ??
			(row.source_inbound_file_id ? String(row.source_inbound_file_id) : null),
		outboundSendStatus:
			(row.outbound_send_status as
				| ClaimVendorFile["outboundSendStatus"]
				| null) ?? null,
		ediFixture: direction === "outbound" ? "835" : "837I",
	};
}

export function claimVendorFileDtosToUi(
	rows: ClaimVendorFileDto[],
	programFallback: ProgramFileType = "DHCF"
): ClaimVendorFile[] {
	return rows.map((row) => claimVendorFileDtoToUi(row, programFallback));
}

import { CLAIM_VENDOR_SEED } from "@/features/admin/features/vendors/vendor-integration-mock";
import { isMockEnabled } from "@/lib/mock-mode";
import type { ProgramFileType } from "@/types/UI/system.types";

export type ClaimFileStatus =
	| "accepted"
	| "rejected"
	| "pending"
	| "partial"
	| "exception"
	| "paid"
	| "denied";

export type MfcReviewStatus = "pending" | "accepted" | "rejected" | "denied";

export type RejectReason = {
	code: string;
	description: string;
};

/** Catalog of MFC reject reasons shown in review + exceptions. */
export const REJECT_REASON_CATALOG: RejectReason[] = [
	{ code: "CLM-4010", description: "Invalid member ID for program" },
	{
		code: "NM1-2100",
		description: "Billing provider NPI missing or mismatched",
	},
	{ code: "CLM-4022", description: "Duplicate claim submission" },
	{ code: "DTP-4720", description: "Service date outside coverage window" },
	{ code: "HI-ABK0", description: "Missing or invalid principal diagnosis" },
	{ code: "SV2-1200", description: "Service line units exceed expected range" },
	{
		code: "CLM-4031",
		description: "Claim charge does not balance to service lines",
	},
];

export type ClaimVendorFile = {
	id: string;
	fileId: string;
	vendor: string;
	direction: "inbound" | "outbound";
	program: ProgramFileType;
	fileTypeLabel: string;
	transactionType: "837" | "835" | "277CA" | "999" | "TA1";
	fileName: string;
	receivedAt: string;
	records: number;
	submitted: number;
	accepted: number;
	rejected: number;
	partial: number;
	paid: number;
	denied: number;
	status: ClaimFileStatus;
	responseCode: string | null;
	notes: string | null;
	avgResponseMinutes: number | null;
	/** MFC review lifecycle */
	reviewStatus: MfcReviewStatus;
	rejectReasons: RejectReason[];
	reviewedAt: string | null;
	reviewedBy: string | null;
	/** For outbound rows: the inbound file this was reviewed from */
	sourceInboundFileId: string | null;
	/** Queued / sent for accepted outbound; notified for rejected */
	outboundSendStatus: "queued" | "sent" | "notified" | null;
	/** EDI fixture key used by the viewer */
	ediFixture: "837I" | "835";
};

export type ClaimResponse = {
	id: string;
	responseId: string;
	responseFile: string;
	submissionBatch: string;
	relatedFileId: string;
	vendor: string;
	program: ProgramFileType;
	claimType: string;
	responseType: "277CA" | "999" | "TA1" | "835";
	receivedAt: string;
	totalSubmitted: number;
	paid: number;
	rejected: number;
	partialPaid: number;
	pending: number;
	acceptedCount: number;
	rejectedCount: number;
	status: ClaimFileStatus;
	summary: string;
	direction: "inbound" | "outbound";
	ediFixture: "837I" | "835";
};

export type ClaimException = {
	id: string;
	exceptionId: string;
	fileId: string;
	vendor: string;
	program: ProgramFileType;
	severity: "error" | "warning";
	code: string;
	message: string;
	claimId: string | null;
	status: "open" | "in_progress" | "resolved";
	detectedAt: string;
};

export type VendorPerformanceRow = {
	vendor: string;
	fileType: string;
	filesReceived: number;
	submittedToGainwell: number;
	accepted: number;
	rejected: number;
	partial: number;
	acceptanceRate: number;
	program: ProgramFileType;
};

const VENDORS = CLAIM_VENDOR_SEED;

function seedFiles(): ClaimVendorFile[] {
	const rows: ClaimVendorFile[] = [];
	const reviewers = ["A. Mensah", "J. Okonkwo", "S. Diallo", "M. Abebe"];

	// Inbound: pending review + MFC-rejected (stay inbound for vendor rework)
	for (let i = 0; i < 14; i++) {
		const program: ProgramFileType =
			i % 3 === 0 ? "MDH" : i % 3 === 1 ? "DHCF" : "BHP";
		const vendorMeta = VENDORS[i % VENDORS.length]!;
		const records = 40 + ((i * 17) % 120);
		const day = String(20 + (i % 8)).padStart(2, "0");
		const hour = String(7 + (i % 10)).padStart(2, "0");
		const isRejected = i % 5 === 0 && i > 0;
		const reasons = isRejected
			? [
					REJECT_REASON_CATALOG[i % REJECT_REASON_CATALOG.length]!,
					REJECT_REASON_CATALOG[(i + 2) % REJECT_REASON_CATALOG.length]!,
				]
			: [];
		rows.push({
			id: `cf-in-${i + 1}`,
			fileId: `CE-IN-2026-07${day}-${String(100 + i).padStart(3, "0")}`,
			vendor: vendorMeta.name,
			direction: "inbound",
			program,
			fileTypeLabel: vendorMeta.fileType,
			transactionType: "837",
			fileName:
				i === 0
					? "837I_Magellan_sample.txt"
					: isRejected
						? `${program}_${vendorMeta.name.toUpperCase()}_837_REJECTED_202607${day}.edi`
						: `${program}_${vendorMeta.name.toUpperCase()}_837_202607${day}.edi`,
			receivedAt: `2026-07-${day} ${hour}:${String((i * 7) % 60).padStart(2, "0")}`,
			records,
			submitted: records,
			accepted: 0,
			rejected: isRejected ? records : 0,
			partial: 0,
			paid: 0,
			denied: 0,
			status: isRejected ? "rejected" : "pending",
			responseCode: isRejected ? `RJ-${9000 + i}` : null,
			notes: isRejected
				? "MFC rejected — returned to inbound for vendor correction"
				: "Awaiting MFC claim review",
			avgResponseMinutes: isRejected ? 18 + (i % 5) * 4 : null,
			reviewStatus: isRejected ? "rejected" : "pending",
			rejectReasons: reasons,
			reviewedAt: isRejected
				? `2026-07-${day} ${String(11 + (i % 5)).padStart(2, "0")}:${String((i * 9) % 60).padStart(2, "0")}`
				: null,
			reviewedBy: isRejected ? reviewers[i % reviewers.length]! : null,
			sourceInboundFileId: null,
			outboundSendStatus: isRejected ? "notified" : null,
			ediFixture: "837I",
		});
	}

	// Outbound: accepted (to Gainwell) + denied (Gainwell/payer denials)
	for (let i = 0; i < 12; i++) {
		const program: ProgramFileType =
			i % 3 === 0 ? "MDH" : i % 3 === 1 ? "DHCF" : "BHP";
		const vendorMeta = VENDORS[i % VENDORS.length]!;
		const records = 35 + ((i * 13) % 90);
		const isDeniedPackage = i % 4 === 0;
		const deniedCount = isDeniedPackage
			? records
			: i % 3 === 0
				? Math.max(2, Math.floor(records * 0.1))
				: 0;
		const accepted = records - deniedCount;
		const day = String(18 + (i % 10)).padStart(2, "0");
		const hour = String(9 + (i % 8)).padStart(2, "0");
		const reasons = isDeniedPackage
			? [
					REJECT_REASON_CATALOG[i % REJECT_REASON_CATALOG.length]!,
					REJECT_REASON_CATALOG[(i + 1) % REJECT_REASON_CATALOG.length]!,
				]
			: deniedCount > 0
				? [REJECT_REASON_CATALOG[i % REJECT_REASON_CATALOG.length]!]
				: [];
		const sourceId = `CE-IN-2026-07${day}-${String(200 + i).padStart(3, "0")}`;
		rows.push({
			id: `cf-out-${i + 1}`,
			fileId: `CE-OUT-2026-07${day}-${String(300 + i).padStart(3, "0")}`,
			vendor: vendorMeta.name,
			direction: "outbound",
			program,
			fileTypeLabel: vendorMeta.fileType,
			transactionType: "837",
			fileName: isDeniedPackage
				? `${program}_${vendorMeta.name.toUpperCase()}_DENIED_202607${day}.edi`
				: `${program}_${vendorMeta.name.toUpperCase()}_837_ACCEPTED_202607${day}.edi`,
			receivedAt: `2026-07-${day} ${hour}:${String((i * 11) % 60).padStart(2, "0")}`,
			records,
			submitted: records,
			accepted: isDeniedPackage ? 0 : accepted,
			rejected: 0,
			partial: 0,
			paid: isDeniedPackage ? 0 : Math.floor(accepted * 0.85),
			denied: deniedCount,
			status: isDeniedPackage ? "denied" : "accepted",
			responseCode: isDeniedPackage ? `DN-${9100 + i}` : `AC-${9200 + i}`,
			notes: isDeniedPackage
				? "Gainwell denied — denial codes returned to vendor"
				: "MFC accepted — queued/sent to Gainwell",
			avgResponseMinutes: 22 + (i % 6) * 5,
			reviewStatus: isDeniedPackage ? "denied" : "accepted",
			rejectReasons: reasons,
			reviewedAt: `2026-07-${day} ${String(10 + (i % 6)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
			reviewedBy: reviewers[i % reviewers.length]!,
			sourceInboundFileId: sourceId,
			outboundSendStatus: isDeniedPackage
				? "notified"
				: i % 2 === 0
					? "sent"
					: "queued",
			ediFixture: "837I",
		});
	}

	return rows;
}

export const CLAIM_VENDOR_FILES: ClaimVendorFile[] = isMockEnabled()
	? seedFiles()
	: [];

export const CLAIM_RESPONSES: ClaimResponse[] = CLAIM_VENDOR_FILES.filter(
	(f) => f.direction === "outbound" && f.reviewStatus === "accepted"
).map((file, i) => {
	const pending = Math.max(
		0,
		file.submitted - file.paid - file.denied - file.partial
	);
	const paid = Math.floor(file.accepted * 0.88);
	const rejected = Math.max(
		0,
		file.accepted - paid - Math.floor(file.accepted * 0.05)
	);
	const partialPaid = Math.max(0, file.accepted - paid - rejected);
	const tabStatus: ClaimFileStatus =
		i % 5 === 0
			? "partial"
			: i % 4 === 0
				? "denied"
				: i % 3 === 0
					? "pending"
					: "paid";
	return {
		id: `cr-${i + 1}`,
		responseId: `RESP-${file.fileId}`,
		responseFile:
			i === 0
				? "835_P_sample.txt"
				: `GW_RSP_${file.vendor.toUpperCase()}_202607${file.receivedAt.slice(8, 10)}_${String(i + 1).padStart(3, "0")}.edi`,
		submissionBatch: `GW_SUB_202607${file.receivedAt.slice(8, 10)}_${String(i + 1).padStart(3, "0")}`,
		relatedFileId: file.fileId,
		vendor: file.vendor,
		program: file.program,
		claimType: file.fileTypeLabel,
		responseType: (["835", "277CA", "999", "TA1"] as const)[i % 4]!,
		receivedAt: file.reviewedAt ?? file.receivedAt,
		totalSubmitted: file.accepted || file.submitted,
		paid,
		rejected,
		partialPaid,
		pending,
		acceptedCount: file.accepted,
		rejectedCount: rejected,
		status: tabStatus,
		summary:
			rejected > 0
				? `${rejected} claims denied; ${paid} paid`
				: `All ${paid} claims paid`,
		direction: "outbound",
		ediFixture: "835",
	};
});

export const CLAIM_EXCEPTIONS: ClaimException[] = CLAIM_VENDOR_FILES.filter(
	(f) =>
		f.reviewStatus === "rejected" ||
		f.reviewStatus === "denied" ||
		f.rejectReasons.length > 0 ||
		f.status === "rejected" ||
		f.status === "denied"
).flatMap((file, i) => {
	const reasons =
		file.rejectReasons.length > 0
			? file.rejectReasons
			: [REJECT_REASON_CATALOG[i % REJECT_REASON_CATALOG.length]!];
	return reasons.map((reason, ri) => ({
		id: `ex-${file.id}-${ri}`,
		exceptionId: `EX-${file.fileId}-${String(ri + 1).padStart(2, "0")}`,
		fileId: file.fileId,
		vendor: file.vendor,
		program: file.program,
		severity: (ri === 0 ? "error" : "warning") as "error" | "warning",
		code: reason.code,
		message: reason.description,
		claimId: `CLM-${800000 + i * 10 + ri}`,
		status: (["open", "in_progress", "resolved"] as const)[(i + ri) % 3]!,
		detectedAt: file.reviewedAt ?? file.receivedAt,
	}));
});

export function filesForProgram(
	program: ProgramFileType,
	direction?: "inbound" | "outbound"
) {
	return CLAIM_VENDOR_FILES.filter(
		(f) =>
			f.program === program && (direction ? f.direction === direction : true)
	);
}

export function responsesForProgram(
	program: ProgramFileType,
	direction?: "inbound" | "outbound"
) {
	return CLAIM_RESPONSES.filter(
		(r) =>
			r.program === program && (direction ? r.direction === direction : true)
	);
}

export function exceptionsForProgram(program: ProgramFileType) {
	return CLAIM_EXCEPTIONS.filter((e) => e.program === program);
}

export function vendorPerformanceForProgram(
	program: ProgramFileType,
	direction: "inbound" | "outbound" = "inbound"
): VendorPerformanceRow[] {
	const files = filesForProgram(program, direction);
	const map = new Map<string, VendorPerformanceRow>();

	for (const file of files) {
		const key = `${file.vendor}::${file.fileTypeLabel}`;
		const current = map.get(key) ?? {
			vendor: file.vendor,
			fileType: file.fileTypeLabel,
			filesReceived: 0,
			submittedToGainwell: 0,
			accepted: 0,
			rejected: 0,
			partial: 0,
			acceptanceRate: 0,
			program,
		};
		current.filesReceived += 1;
		current.submittedToGainwell += file.submitted;
		current.accepted += file.accepted;
		current.rejected += file.rejected;
		current.partial += file.partial;
		map.set(key, current);
	}

	return Array.from(map.values())
		.map((row) => ({
			...row,
			acceptanceRate: row.submittedToGainwell
				? Math.round((row.accepted / row.submittedToGainwell) * 1000) / 10
				: 0,
		}))
		.sort((a, b) => a.vendor.localeCompare(b.vendor));
}

export type ClaimLine = {
	id: string;
	claimId: string;
	memberId: string;
	provider: string;
	vendor: string;
	account: string;
	claimType: string;
	dateOfService: string;
	amountBilled: number;
	amountPaid: number;
	submissionStatus:
		| "submitted"
		| "accepted"
		| "rejected"
		| "partial"
		| "pending";
	gainwellStatus: "paid" | "rejected" | "partial" | "pending" | "denied";
	/** MFC review decision at claim level */
	mfcReviewStatus: MfcReviewStatus;
	rejectReason: string | null;
	rejectReasons: RejectReason[];
	responseFileName: string;
	traceId: string;
	batchId: string;
	fileId: string;
	responseId: string;
	program: ProgramFileType;
	direction: "inbound" | "outbound";
};

export type SubmissionBatch = {
	id: string;
	batchId: string;
	vendor: string;
	program: ProgramFileType;
	direction: "inbound" | "outbound";
	claimType: string;
	claimsSubmitted: number;
	responseReceived: boolean;
	accepted: number;
	rejected: number;
	partial: number;
	paid: number;
	pending: number;
	submittedAt: string;
	responseFile: string | null;
	relatedFileId: string;
	responseId: string;
};

const PROVIDERS = [
	"Capitol Family Practice",
	"Metro Specialty Clinic",
	"Riverside Urgent Care",
	"Harbor Pediatrics",
	"Summit Orthopedics",
];

function seedClaimLines(): ClaimLine[] {
	const lines: ClaimLine[] = [];
	let seq = 0;

	// Claims for inbound + outbound vendor files (MFC review)
	for (const file of CLAIM_VENDOR_FILES) {
		const count = Math.min(12, Math.max(4, Math.floor(file.records / 10)));
		for (let j = 0; j < count; j++) {
			seq += 1;
			const billed = 120 + ((seq * 37) % 2800);
			let mfcReviewStatus: MfcReviewStatus = file.reviewStatus;
			if (file.reviewStatus === "pending") mfcReviewStatus = "pending";
			else if (file.reviewStatus === "rejected") mfcReviewStatus = "rejected";
			else if (file.reviewStatus === "denied") mfcReviewStatus = "denied";
			else if (j % 7 === 0 && file.denied > 0) mfcReviewStatus = "denied";
			else mfcReviewStatus = "accepted";

			const reasons =
				mfcReviewStatus === "rejected" || mfcReviewStatus === "denied"
					? [
							file.rejectReasons[0] ??
								REJECT_REASON_CATALOG[seq % REJECT_REASON_CATALOG.length]!,
						]
					: [];

			const gainwellStatus =
				file.direction === "outbound" && mfcReviewStatus === "accepted"
					? j % 6 === 0
						? "partial"
						: j % 8 === 0
							? "pending"
							: "paid"
					: mfcReviewStatus === "denied"
						? "denied"
						: mfcReviewStatus === "rejected"
							? "rejected"
							: "pending";

			const paid =
				gainwellStatus === "paid"
					? billed
					: gainwellStatus === "partial"
						? Math.round(billed * 0.62)
						: 0;

			const relatedResponse = CLAIM_RESPONSES.find(
				(r) => r.relatedFileId === file.fileId
			);

			lines.push({
				id: `cl-${seq}`,
				claimId: `CLM-${900000 + seq}`,
				memberId: `MBR-${440000 + seq}`,
				provider: PROVIDERS[seq % PROVIDERS.length]!,
				vendor: file.vendor,
				account: `${file.vendor.slice(0, 3).toUpperCase()}-ACC-${(seq % 4) + 1}`,
				claimType: file.fileTypeLabel,
				dateOfService: `2026-07-${String(10 + (seq % 18)).padStart(2, "0")}`,
				amountBilled: billed,
				amountPaid: paid,
				submissionStatus:
					mfcReviewStatus === "rejected" || mfcReviewStatus === "denied"
						? "rejected"
						: mfcReviewStatus === "pending"
							? "pending"
							: "accepted",
				gainwellStatus,
				mfcReviewStatus,
				rejectReason: reasons[0]?.description ?? null,
				rejectReasons: reasons,
				responseFileName: relatedResponse?.responseFile ?? "",
				traceId: `TRC-${file.fileId}-${String(j + 1).padStart(4, "0")}`,
				batchId: relatedResponse?.submissionBatch ?? `MFC-${file.fileId}`,
				fileId: file.fileId,
				responseId: relatedResponse?.id ?? "",
				program: file.program,
				direction: file.direction,
			});
		}
	}
	return lines;
}

export const CLAIM_LINES: ClaimLine[] = isMockEnabled() ? seedClaimLines() : [];

export const SUBMISSION_BATCHES: SubmissionBatch[] = CLAIM_RESPONSES.map(
	(response) => ({
		id: response.submissionBatch,
		batchId: response.submissionBatch,
		vendor: response.vendor,
		program: response.program,
		direction: response.direction,
		claimType: response.claimType,
		claimsSubmitted: response.totalSubmitted,
		responseReceived: response.status !== "pending",
		accepted: response.acceptedCount,
		rejected: response.rejected,
		partial: response.partialPaid,
		paid: response.paid,
		pending: response.pending,
		submittedAt: response.receivedAt,
		responseFile: response.status === "pending" ? null : response.responseFile,
		relatedFileId: response.relatedFileId,
		responseId: response.id,
	})
);

export function getClaimResponse(id: string) {
	if (!isMockEnabled()) return undefined;
	return CLAIM_RESPONSES.find(
		(r) => r.id === id || r.responseId === id || r.responseFile === id
	);
}

export function getSubmissionBatch(batchId: string) {
	if (!isMockEnabled()) return undefined;
	const decoded = decodeURIComponent(batchId);
	return SUBMISSION_BATCHES.find(
		(b) => b.id === decoded || b.batchId === decoded
	);
}

export function getVendorFile(fileId: string) {
	if (!isMockEnabled()) return undefined;
	return CLAIM_VENDOR_FILES.find((f) => f.id === fileId || f.fileId === fileId);
}

export function claimsForFile(fileId: string) {
	const decoded = decodeURIComponent(fileId);
	return CLAIM_LINES.filter(
		(c) => c.fileId === decoded || c.fileId === getVendorFile(decoded)?.fileId
	);
}

export function claimsForBatch(batchId: string) {
	const decoded = decodeURIComponent(batchId);
	return CLAIM_LINES.filter((c) => c.batchId === decoded);
}

export function claimsForResponse(responseId: string) {
	return CLAIM_LINES.filter(
		(c) =>
			c.responseId === responseId || c.responseFileName.includes(responseId)
	);
}

/** Apply MFC accept/reject to claims in memory (mock). */
export function applyClaimReviews(
	fileId: string,
	updates: Array<{
		claimId: string;
		status: MfcReviewStatus;
		reasons?: RejectReason[];
	}>,
	reviewedBy = "Current User"
) {
	const file = getVendorFile(fileId);
	const now = new Date().toISOString().slice(0, 16).replace("T", " ");
	for (const update of updates) {
		const line = CLAIM_LINES.find(
			(c) =>
				c.claimId === update.claimId &&
				(c.fileId === fileId || c.fileId === file?.fileId)
		);
		if (!line) continue;
		line.mfcReviewStatus = update.status;
		line.submissionStatus =
			update.status === "rejected"
				? "rejected"
				: update.status === "accepted"
					? "accepted"
					: "pending";
		line.rejectReasons = update.reasons ?? [];
		line.rejectReason = update.reasons?.[0]?.description ?? null;
	}
	if (file && updates.length > 0) {
		const fileClaims = claimsForFile(file.fileId);
		const allDecided = fileClaims.every((c) => c.mfcReviewStatus !== "pending");
		if (allDecided) {
			const anyRejected = fileClaims.some(
				(c) => c.mfcReviewStatus === "rejected"
			);
			const allRejected = fileClaims.every(
				(c) => c.mfcReviewStatus === "rejected"
			);
			const acceptedCount = fileClaims.filter(
				(c) => c.mfcReviewStatus === "accepted"
			).length;
			const rejectedCount = fileClaims.filter(
				(c) => c.mfcReviewStatus === "rejected"
			).length;
			file.reviewedAt = now;
			file.reviewedBy = reviewedBy;
			file.accepted = acceptedCount;
			file.rejected = rejectedCount;
			file.rejectReasons = fileClaims
				.flatMap((c) => c.rejectReasons)
				.filter(
					(r, idx, arr) => arr.findIndex((x) => x.code === r.code) === idx
				);

			if (allRejected) {
				// MFC rejects stay on inbound for vendor correction
				file.direction = "inbound";
				file.reviewStatus = "rejected";
				file.status = "rejected";
				file.outboundSendStatus = "notified";
				file.notes = "MFC rejected — returned to inbound for vendor correction";
			} else {
				// Accepted (or mixed with accepts) move to outbound
				file.direction = "outbound";
				file.reviewStatus = "accepted";
				file.status = anyRejected ? "partial" : "accepted";
				file.outboundSendStatus = "queued";
				file.sourceInboundFileId = file.sourceInboundFileId ?? file.fileId;
				file.notes = anyRejected
					? "MFC accepted with some claim rejects — queued for Gainwell"
					: "MFC accepted — queued for Gainwell";
			}
		}
	}
	return claimsForFile(fileId);
}

export type ClaimDetailStatus =
	| "Paid"
	| "Pending"
	| "Denied"
	| "Rejected"
	| "Partial"
	| "Accepted"
	| "Processed";

export type ClaimDetailFileRow = {
	fileType: string;
	fileName: string;
	receivedDate: string;
	status: ClaimDetailStatus;
};

export type ClaimDetailLogRow = {
	timestamp: string;
	step: string;
	message: string;
	status: "Success" | "Warning" | "Error";
	details: string;
};

export type ClaimDetailAuditRow = {
	dateTime: string;
	action: string;
	userSystem: string;
	details: string;
};

export type ClaimDetailRelated = {
	claimId: string;
	relationship: "Original" | "Replacement" | "Adjustment" | "Void" | "Reversal";
	serviceDate: string;
	status: ClaimDetailStatus;
	paidAmount: number;
};

export type ClaimDetailServiceLine = {
	id: string;
	code: string;
	modifier: string;
	diagnosis: string;
	units: number;
	charge: number;
	allowed: number;
	paid: number;
	status: ClaimDetailStatus;
};

export type ClaimDetailNote = {
	id: string;
	text: string;
	addedBy: string;
	date: string;
};

export type ClaimDetailAttachment = {
	id: string;
	fileName: string;
	type: string;
	uploadedBy: string;
	date: string;
};

export type ClaimDetail = {
	id: string;
	claimId: string;
	status: ClaimDetailStatus;
	memberId: string;
	memberName: string;
	dateOfService: string;
	provider: string;
	providerNpi: string;
	vendor: string;
	payer: string;
	payerPlan: string;
	claimType: string;
	priority: "Normal" | "High" | "Urgent";
	amountBilled: number;
	amountAllowed: number;
	amountPaid: number;
	patientResponsibility: number;
	group: string;
	plan: string;
	authNumber: string;
	traceId: string;
	receivedAt: string;
	paidDate: string | null;
	checkEft: string | null;
	fileName: string;
	fileId: string;
	responseId: string;
	batchId: string;
	program: ProgramFileType;
	responseFiles: ClaimDetailFileRow[];
	fileHistory: ClaimDetailFileRow[];
	validation: {
		total: number;
		passed: number;
		warnings: number;
		errors: number;
	};
	batch: {
		inboundBatch: string;
		inboundAt: string;
		outboundBatch: string;
		outboundAt: string;
		runId: string;
		processingJob: string;
	};
	processingLogs: ClaimDetailLogRow[];
	auditTrail: ClaimDetailAuditRow[];
	relatedClaims: ClaimDetailRelated[];
	reprocessingHistory: ClaimDetailLogRow[];
	notes: ClaimDetailNote[];
	attachments: ClaimDetailAttachment[];
	serviceLines: ClaimDetailServiceLine[];
	edi837FileName: string;
	edi835FileName: string;
};

function statusFromGainwell(
	status: ClaimLine["gainwellStatus"]
): ClaimDetailStatus {
	if (status === "paid") return "Paid";
	if (status === "denied") return "Denied";
	if (status === "rejected") return "Rejected";
	if (status === "partial") return "Partial";
	return "Pending";
}

export function buildClaimDetailFromLine(line: ClaimLine, index = 0): ClaimDetail {
	const file = getVendorFile(line.fileId);
	const response = getClaimResponse(line.responseId);
	const seq = Number(line.claimId.replace(/\D/g, "")) || index + 1;
	const status = statusFromGainwell(line.gainwellStatus);
	const memberNames = [
		"Jordan Lee",
		"Ava Patel",
		"Marcus Chen",
		"Sofia Ramirez",
		"Noah Brooks",
		"Amara Wells",
		"Liam Ortiz",
		"Harper Diaz",
	];
	const payers = [
		"Medicaid (MFC-DC-100)",
		"MDH Medicaid",
		"DHCF QHP",
		"BHP Commercial",
	];
	const memberName = memberNames[seq % memberNames.length]!;
	const payer = payers[seq % payers.length]!;
	const receivedAt = file?.receivedAt ?? `${line.dateOfService} 09:14:22`;
	const paidDate =
		status === "Paid" || status === "Partial" ? receivedAt.slice(0, 10) : null;
	const svcCount = 2 + (seq % 3);
	const serviceLines: ClaimDetailServiceLine[] = [];
	for (let i = 0; i < svcCount; i++) {
		const charge = Math.round(line.amountBilled / svcCount);
		const paid =
			status === "Paid"
				? charge
				: status === "Partial"
					? Math.round(charge * 0.6)
					: 0;
		serviceLines.push({
			id: `${line.id}-svc-${i + 1}`,
			code: ["99213", "99214", "80053", "87070"][(seq + i) % 4]!,
			modifier: i === 0 ? "25" : "",
			diagnosis: ["E11.9", "I10", "J06.9", "M54.5"][(seq + i) % 4]!,
			units: 1 + (i % 2),
			charge,
			allowed: Math.round(charge * 0.85),
			paid,
			status,
		});
	}

	const edi837 =
		file?.fileName ??
		`837P_${line.vendor.replace(/\s/g, "")}_${line.claimId}.edi`;
	const edi835 =
		response?.responseFile ??
		(line.responseFileName || `835_${line.claimId}.edi`);

	return {
		id: line.id,
		claimId: line.claimId,
		status,
		memberId: line.memberId,
		memberName,
		dateOfService: line.dateOfService,
		provider: line.provider,
		providerNpi: String(1000000000 + ((seq * 17) % 899999999)),
		vendor: line.vendor,
		payer,
		payerPlan: payer.includes("(")
			? payer.replace(/^.*\((.+)\)$/, "$1")
			: `PLAN-${seq % 4}`,
		claimType: line.claimType,
		priority: seq % 11 === 0 ? "Urgent" : seq % 5 === 0 ? "High" : "Normal",
		amountBilled: line.amountBilled,
		amountAllowed: Math.round(line.amountBilled * 0.85),
		amountPaid: line.amountPaid,
		patientResponsibility: Math.max(
			0,
			Math.round(line.amountBilled * 0.85) - line.amountPaid
		),
		group: `GRP-${4400 + (seq % 4)}`,
		plan: ["MDH Standard", "DHCF Plus", "BHP Select", "Essential Care"][
			seq % 4
		]!,
		authNumber: seq % 3 === 0 ? `AUTH-${600000 + seq}` : "",
		traceId: line.traceId,
		receivedAt,
		paidDate,
		checkEft:
			line.amountPaid > 0
				? `EFT-${line.claimId.replace(/\D/g, "").slice(-8)}`
				: null,
		fileName: edi837,
		fileId: line.fileId,
		responseId: line.responseId,
		batchId: line.batchId,
		program: line.program,
		responseFiles: [
			{
				fileType: "277 Response",
				fileName: `277CA_${line.claimId}.edi`,
				receivedDate: receivedAt,
				status: "Accepted",
			},
			{
				fileType: "835 Response",
				fileName: edi835,
				receivedDate: paidDate ? `${paidDate} 11:42:18` : receivedAt,
				status:
					status === "Paid" || status === "Partial" ? "Processed" : "Pending",
			},
		],
		fileHistory: [
			{
				fileType: "837 Professional",
				fileName: edi837,
				receivedDate: receivedAt,
				status: "Processed",
			},
		],
		validation: {
			total: 18,
			passed: status === "Rejected" || status === "Denied" ? 15 : 18,
			warnings: status === "Partial" ? 2 : 0,
			errors: status === "Rejected" || status === "Denied" ? 3 : 0,
		},
		batch: {
			inboundBatch: `IN-${line.dateOfService.replaceAll("-", "")}-04`,
			inboundAt: receivedAt,
			outboundBatch: `OUT-${line.dateOfService.replaceAll("-", "")}-02`,
			outboundAt: paidDate ? `${paidDate} 08:15:00` : "—",
			runId: `RUN-${line.dateOfService.replaceAll("-", "")}-15`,
			processingJob: "JOB-837-PRO-001",
		},
		processingLogs: [
			{
				timestamp: receivedAt,
				step: "File Received",
				message: "Inbound 837 file received from vendor",
				status: "Success",
				details: edi837,
			},
			{
				timestamp: receivedAt,
				step: "File Validation",
				message: "X12 structure and trading partner checks passed",
				status: "Success",
				details: "18 rules evaluated",
			},
			{
				timestamp: receivedAt,
				step: "Claim Creation",
				message: "Claim record created in VMS",
				status: "Success",
				details: line.claimId,
			},
			{
				timestamp: paidDate ? `${paidDate} 10:05:12` : receivedAt,
				step: "Adjudication",
				message:
					status === "Paid"
						? "Claim adjudicated and paid"
						: `Claim marked ${status.toLowerCase()}`,
				status: "Success",
				details: line.traceId,
			},
		],
		auditTrail: [
			{
				dateTime: receivedAt,
				action: "File Received",
				userSystem: "SFTP Ingest",
				details: `Received ${edi837}`,
			},
			{
				dateTime: receivedAt,
				action: "Claim Created",
				userSystem: "Claim Engine",
				details: `Created ${line.claimId}`,
			},
			{
				dateTime: paidDate ? `${paidDate} 10:05:12` : receivedAt,
				action: "Adjudicated",
				userSystem: "Gainwell",
				details: `Status set to ${status}`,
			},
		],
		relatedClaims: [
			{
				claimId: line.claimId,
				relationship: "Original",
				serviceDate: line.dateOfService,
				status,
				paidAmount: line.amountPaid,
			},
			{
				claimId: `CLM-${900000 + seq + 50}`,
				relationship: "Replacement",
				serviceDate: line.dateOfService,
				status: "Paid",
				paidAmount: Math.round(line.amountPaid * 0.92),
			},
		],
		reprocessingHistory: [],
		notes: [
			{
				id: `${line.id}-note-1`,
				text: "Member called to verify copay amount.",
				addedBy: "Sarah Nguyen",
				date: paidDate ?? line.dateOfService,
			},
		],
		attachments: [
			{
				id: `${line.id}-att-1`,
				fileName: "EOBA_summary.pdf",
				type: "PDF",
				uploadedBy: "System",
				date: paidDate ?? line.dateOfService,
			},
			{
				id: `${line.id}-att-2`,
				fileName: "member_auth.png",
				type: "Image",
				uploadedBy: "Sarah Nguyen",
				date: line.dateOfService,
			},
		],
		serviceLines,
		edi837FileName: edi837,
		edi835FileName: edi835,
	};
}

/** Showcase claim matching Claim Overview product mock. */
export const SHOWCASE_CLAIM_DETAIL: ClaimDetail = {
	id: "cl-showcase",
	claimId: "CLM7245678910",
	status: "Paid",
	memberId: "M2086605880",
	memberName: "John M. Doe",
	dateOfService: "2026-07-26",
	provider: "Johns Hopkins Hospital",
	providerNpi: "1234567890",
	vendor: "MedStar",
	payer: "Medicaid (MFC-DC-100)",
	payerPlan: "MFC-DC-100",
	claimType: "837 Professional",
	priority: "Normal",
	amountBilled: 2450,
	amountAllowed: 2082,
	amountPaid: 1980,
	patientResponsibility: 102,
	group: "GRP-4401",
	plan: "MDH Standard",
	authNumber: "AUTH-772451",
	traceId: "TRC-MEDSTAR-0001",
	receivedAt: "2026-07-28 09:14:22",
	paidDate: "2026-07-29",
	checkEft: "EFT-72456789",
	fileName: "837P_MedStar_CLM7245678910.edi",
	fileId: "vf-showcase",
	responseId: "resp-showcase",
	batchId: "IN-07282026-04",
	program: "MDH",
	responseFiles: [
		{
			fileType: "277 Response",
			fileName: "277CA_MedStar_20260728.edi",
			receivedDate: "2026-07-28 14:22:10",
			status: "Accepted",
		},
		{
			fileType: "835 Response",
			fileName: "835_MedStar_20260729.edi",
			receivedDate: "2026-07-29 11:42:18",
			status: "Processed",
		},
	],
	fileHistory: [
		{
			fileType: "837 Professional",
			fileName: "837P_MedStar_CLM7245678910.edi",
			receivedDate: "2026-07-28 09:14:22",
			status: "Processed",
		},
	],
	validation: { total: 18, passed: 18, warnings: 0, errors: 0 },
	batch: {
		inboundBatch: "IN-07282026-04",
		inboundAt: "2026-07-28 09:14:22",
		outboundBatch: "OUT-07292026-02",
		outboundAt: "2026-07-29 08:15:00",
		runId: "RUN-20260728-15",
		processingJob: "JOB-837-PRO-001",
	},
	processingLogs: [
		{
			timestamp: "2026-07-28 09:14:22",
			step: "File Received",
			message: "Inbound 837 file received from MedStar",
			status: "Success",
			details: "837P_MedStar_CLM7245678910.edi",
		},
		{
			timestamp: "2026-07-28 09:15:01",
			step: "File Validation",
			message: "X12 structure and trading partner checks passed",
			status: "Success",
			details: "18 rules evaluated",
		},
		{
			timestamp: "2026-07-28 09:16:44",
			step: "Claim Creation",
			message: "Claim record created in VMS",
			status: "Success",
			details: "CLM7245678910",
		},
		{
			timestamp: "2026-07-28 10:02:18",
			step: "Outbound Submission",
			message: "Claim submitted to Gainwell",
			status: "Success",
			details: "OUT-07292026-02",
		},
		{
			timestamp: "2026-07-29 10:05:12",
			step: "Adjudication",
			message: "Claim adjudicated and paid",
			status: "Success",
			details: "TRC-MEDSTAR-0001",
		},
	],
	auditTrail: [
		{
			dateTime: "2026-07-28 09:14:22",
			action: "File Received",
			userSystem: "SFTP Ingest",
			details: "Received 837P_MedStar_CLM7245678910.edi",
		},
		{
			dateTime: "2026-07-28 09:16:44",
			action: "Claim Created",
			userSystem: "Claim Engine",
			details: "Created CLM7245678910",
		},
		{
			dateTime: "2026-07-28 11:20:05",
			action: "MFC Review Accepted",
			userSystem: "A. Carter",
			details: "Accepted for Gainwell submission",
		},
		{
			dateTime: "2026-07-29 10:05:12",
			action: "Adjudicated",
			userSystem: "Gainwell",
			details: "Status set to Paid · $1,980",
		},
	],
	relatedClaims: [
		{
			claimId: "CLM7245678910",
			relationship: "Original",
			serviceDate: "2026-07-26",
			status: "Paid",
			paidAmount: 1980,
		},
		{
			claimId: "CLM7245678999",
			relationship: "Adjustment",
			serviceDate: "2026-07-26",
			status: "Paid",
			paidAmount: 1820,
		},
	],
	reprocessingHistory: [],
	notes: [
		{
			id: "note-1",
			text: "Member called to verify copay amount.",
			addedBy: "Jane Smith",
			date: "2026-07-28 16:10",
		},
	],
	attachments: [
		{
			id: "att-1",
			fileName: "EOBA_summary.pdf",
			type: "PDF",
			uploadedBy: "System",
			date: "2026-07-29",
		},
		{
			id: "att-2",
			fileName: "member_auth.png",
			type: "Image",
			uploadedBy: "Sarah Nguyen",
			date: "2026-07-28",
		},
	],
	serviceLines: [
		{
			id: "svc-1",
			code: "99214",
			modifier: "25",
			diagnosis: "E11.9",
			units: 1,
			charge: 1450,
			allowed: 1232,
			paid: 1180,
			status: "Paid",
		},
		{
			id: "svc-2",
			code: "80053",
			modifier: "",
			diagnosis: "E11.9",
			units: 1,
			charge: 1000,
			allowed: 850,
			paid: 800,
			status: "Paid",
		},
	],
	edi837FileName: "837P_MedStar_CLM7245678910.edi",
	edi835FileName: "835_MedStar_20260729.edi",
};

export function getClaimDetail(claimId: string): ClaimDetail | undefined {
	if (!isMockEnabled()) return undefined;
	const decoded = decodeURIComponent(claimId);
	if (
		decoded === SHOWCASE_CLAIM_DETAIL.claimId ||
		decoded === SHOWCASE_CLAIM_DETAIL.id
	) {
		return SHOWCASE_CLAIM_DETAIL;
	}
	const line = CLAIM_LINES.find(
		(c) => c.claimId === decoded || c.id === decoded
	);
	if (!line) return undefined;
	return buildClaimDetailFromLine(line);
}

export function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});
}

export function downloadTextFile(filename: string, content: string) {
	const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

export function exportRowsAsCsv(
	filename: string,
	headers: string[],
	rows: Array<Array<string | number>>
) {
	const escape = (value: string | number) => {
		const text = String(value);
		if (text.includes(",") || text.includes('"') || text.includes("\n")) {
			return `"${text.replaceAll('"', '""')}"`;
		}
		return text;
	};
	const body = [
		headers.map(escape).join(","),
		...rows.map((row) => row.map(escape).join(",")),
	].join("\n");
	downloadTextFile(filename, body);
}

export function displayClaimStatus(status: ClaimFileStatus) {
	if (status === "accepted") return "Accepted";
	if (status === "rejected") return "Rejected";
	if (status === "pending") return "Pending";
	if (status === "partial") return "Partial";
	if (status === "paid") return "Paid";
	if (status === "denied") return "Denied";
	return "Exception";
}

export function formatCount(value: number) {
	return value.toLocaleString("en-US");
}

/** Build comparable vendor rows for the Claim & Encounter comparison page. */
export function claimVendorsForComparison(program: ProgramFileType) {
	const files = filesForProgram(program);
	const exceptions = exceptionsForProgram(program);

	return CLAIM_VENDOR_SEED.map((seed, index) => {
		const vendorFiles = files.filter((f) => f.vendor === seed.name);
		const submitted = vendorFiles.reduce((s, f) => s + f.submitted, 0);
		const accepted = vendorFiles.reduce((s, f) => s + f.accepted, 0);
		const lastFileReceived =
			vendorFiles
				.map((f) => f.receivedAt)
				.sort()
				.at(-1) ?? "—";
		const alerts = exceptions.filter(
			(ex) =>
				ex.vendor === seed.name &&
				(ex.status === "open" || ex.status === "in_progress")
		).length;
		const acceptance = submitted
			? Math.round((accepted / submitted) * 1000) / 10
			: 0;
		const health =
			vendorFiles.length === 0
				? ("warning" as const)
				: acceptance >= 97
					? ("healthy" as const)
					: acceptance >= 92
						? ("warning" as const)
						: ("critical" as const);

		return {
			id: seed.id,
			name: seed.name,
			mark: seed.mark,
			avatarBg: seed.avatarBg,
			health,
			linkedAccounts: Math.max(1, vendorFiles.length),
			activeJobs: Math.max(1, Math.round(submitted / 2500) || 1),
			slaPercent: acceptance,
			alertsCount: alerts,
			lastFileReceived,
			vendorCode: `CE-${String(index + 1).padStart(3, "0")}`,
			vendorType: seed.vendorType,
		};
	});
}

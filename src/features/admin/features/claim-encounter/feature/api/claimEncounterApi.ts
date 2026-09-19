import { isClaimVendorFilesMockEnabled, isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { ClaimLineDto } from "@/lib/vendor-core/types";
import type { ProgramFileType } from "@/types/UI/system.types";

import { fixtureKeyForTransaction, loadEdiFixture } from "../../edi/fixtures";
import { buildSynthetic837FromClaimLines } from "../../edi/synthetic837";
import {
	CLAIM_EXCEPTIONS,
	CLAIM_LINES,
	CLAIM_RESPONSES,
	CLAIM_VENDOR_FILES,
	type ClaimFileStatus,
	type ClaimLine,
	type ClaimVendorFile,
	type MfcReviewStatus,
	REJECT_REASON_CATALOG,
	SHOWCASE_CLAIM_DETAIL,
	SUBMISSION_BATCHES,
	applyClaimReviews,
	buildClaimDetailFromLine,
	claimVendorsForComparison,
	claimsForBatch,
	claimsForFile,
	claimsForResponse,
	displayClaimStatus,
	downloadTextFile,
	exceptionsForProgram,
	exportRowsAsCsv,
	filesForProgram,
	formatCount,
	formatCurrency,
	getClaimDetail,
	getClaimResponse,
	getSubmissionBatch,
	getVendorFile,
	responsesForProgram,
	vendorPerformanceForProgram,
} from "../../mock-data";

export {
	REJECT_REASON_CATALOG,
	SHOWCASE_CLAIM_DETAIL,
	applyClaimReviews,
	buildClaimDetailFromLine,
	claimVendorsForComparison,
	claimsForBatch,
	claimsForFile,
	claimsForResponse,
	displayClaimStatus,
	exceptionsForProgram,
	exportRowsAsCsv,
	filesForProgram,
	formatCount,
	formatCurrency,
	getClaimDetail,
	getClaimResponse,
	getSubmissionBatch,
	getVendorFile,
	responsesForProgram,
	vendorPerformanceForProgram,
	downloadTextFile,
};
export type {
	ClaimDetail,
	ClaimDetailNote,
	ClaimException,
	ClaimFileStatus,
	ClaimLine,
	ClaimResponse,
	ClaimVendorFile,
	MfcReviewStatus,
	RejectReason,
	SubmissionBatch,
	VendorPerformanceRow,
} from "../../mock-data";

function claimFixturesEnabled() {
	return isMockEnabled() || isClaimVendorFilesMockEnabled();
}

function mapPipelineStatus(raw: unknown): ClaimFileStatus {
	const s = String(raw ?? "").toLowerCase();
	if (s.includes("reject") || s.includes("fail") || s.includes("error")) {
		return "rejected";
	}
	if (s.includes("accept") || s.includes("complete") || s.includes("done")) {
		return "accepted";
	}
	if (s.includes("partial")) return "partial";
	if (s.includes("process")) return "pending";
	if (s.includes("receiv")) return "pending";
	return "pending";
}

function mapReviewStatus(
	raw: unknown,
	fallback: MfcReviewStatus
): MfcReviewStatus {
	const s = String(raw ?? "").toLowerCase();
	if (s === "pending") return "pending";
	if (s === "accepted") return "accepted";
	if (s === "rejected") return "rejected";
	if (s === "partial") return "partial";
	if (s === "denied") return "denied";
	return fallback;
}

function mapOutboundSendStatus(
	raw: unknown
): ClaimVendorFile["outboundSendStatus"] {
	const s = String(raw ?? "").toLowerCase();
	if (s === "queued" || s === "sent" || s === "notified" || s === "failed") {
		return s;
	}
	return null;
}

function parseIsoDate(raw: unknown, fallback: string): string {
	if (raw == null || raw === "") return fallback;
	const str = String(raw);
	const normalized = str.includes("T") ? str : str.replace(" ", "T");
	return Number.isNaN(Date.parse(normalized))
		? fallback
		: normalized.includes("T")
			? normalized
			: new Date(normalized).toISOString();
}

function vendorNameFromRow(row: Record<string, unknown>): string {
	const batch = row.batch as
		| {
				vendor?: { name?: string; legal_name?: string } | string;
				vendor_name?: string;
		  }
		| null
		| undefined;
	if (batch && typeof batch === "object") {
		if (typeof batch.vendor === "string" && batch.vendor.trim())
			return batch.vendor;
		if (batch.vendor && typeof batch.vendor === "object") {
			const n = batch.vendor.name ?? batch.vendor.legal_name;
			if (n?.trim()) return n.trim();
		}
		if (batch.vendor_name?.trim()) return batch.vendor_name.trim();
	}
	if (row.vendor != null && typeof row.vendor === "object") {
		const v = row.vendor as { name?: string; legal_name?: string };
		const n = v.name ?? v.legal_name;
		if (n?.trim()) return n.trim();
	}
	if (row.vendor_name != null && String(row.vendor_name).trim()) {
		return String(row.vendor_name);
	}
	return "—";
}

function vendorIdFromRow(row: Record<string, unknown>): string | null {
	const direct = row.vendor;
	if (direct && typeof direct === "object" && "id" in direct && direct.id) {
		return String((direct as { id: unknown }).id);
	}
	const batch = row.batch as
		| { vendor?: { id?: string } | string; vendor_id?: string }
		| null
		| undefined;
	if (batch && typeof batch === "object") {
		if (batch.vendor && typeof batch.vendor === "object" && batch.vendor.id) {
			return String(batch.vendor.id);
		}
		if (batch.vendor_id) return String(batch.vendor_id);
	}
	if (row.vendor_id) return String(row.vendor_id);
	return null;
}

function mapProgram(raw: unknown): ClaimVendorFile["program"] {
	const s = String(raw ?? "").toUpperCase();
	if (s === "MDH" || s === "MSC+" || s === "SNBC")
		return s as ClaimVendorFile["program"];
	return "MDH";
}

function mapTransactionType(raw: unknown): ClaimVendorFile["transactionType"] {
	const s = String(raw ?? "").toUpperCase();
	if (
		s === "837" ||
		s === "835" ||
		s === "277CA" ||
		s === "999" ||
		s === "TA1"
	) {
		return s;
	}
	return "837";
}

function mapRejectReasons(raw: unknown): ClaimVendorFile["rejectReasons"] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((r) => String(r).trim())
		.filter(Boolean)
		.map((code) => {
			const catalog = REJECT_REASON_CATALOG.find((c) => c.code === code);
			return catalog ?? { code, description: code };
		});
}

/** Map core claim-vendor-file row → EDGE queue ClaimVendorFile. */
export function mapClaimVendorFileDto(
	row: Record<string, unknown>,
	enrichment?: { originalFilename?: string; stage?: string }
): ClaimVendorFile {
	const id = String(row.id ?? "");
	const claimCount = Number(row.claim_count ?? 0);
	const rejected = Number(row.rejected_count ?? 0);
	const status = mapPipelineStatus(row.status);
	const reviewStatus = mapReviewStatus(
		row.review_status,
		status === "accepted"
			? "accepted"
			: status === "rejected"
				? "rejected"
				: "pending"
	);
	const direction =
		String(row.direction ?? "").toLowerCase() === "outbound"
			? "outbound"
			: "inbound";
	const fileName =
		enrichment?.originalFilename?.trim() ||
		String(
			row.file_name ??
				row.original_filename ??
				row.transaction_set_control_number ??
				row.reference_id ??
				id
		);

	const nowIso = new Date().toISOString();
	const receivedAt = parseIsoDate(
		row.received_at ?? row.created_at ?? row.updated_at,
		nowIso
	);
	const reviewedAt = row.reviewed_at
		? parseIsoDate(row.reviewed_at, nowIso)
		: null;
	const reviewedBy =
		row.reviewed_by != null && String(row.reviewed_by).trim()
			? String(row.reviewed_by)
			: null;

	const notesFromRow =
		row.review_notes != null && String(row.review_notes).trim()
			? String(row.review_notes)
			: null;

	return {
		id,
		fileId: String(row.reference_id ?? id),
		vendor: vendorNameFromRow(row),
		direction,
		program: mapProgram(row.program),
		fileTypeLabel: enrichment?.stage
			? `Claim file · ${enrichment.stage}`
			: direction === "outbound"
				? "Outbound claim vendor file"
				: "Claim vendor file",
		transactionType: mapTransactionType(row.transaction_type),
		fileName,
		receivedAt,
		records: claimCount,
		submitted: claimCount,
		accepted: Math.max(0, claimCount - rejected),
		rejected,
		partial: reviewStatus === "partial" ? Math.max(1, rejected) : 0,
		paid: 0,
		denied: 0,
		status,
		responseCode: null,
		notes:
			notesFromRow ??
			(enrichment?.stage ? `Inbound stage: ${enrichment.stage}` : null),
		avgResponseMinutes: null,
		reviewStatus,
		rejectReasons: mapRejectReasons(row.reject_reasons),
		reviewedAt,
		reviewedBy,
		sourceInboundFileId: row.source_inbound_file_id
			? String(row.source_inbound_file_id)
			: row.inbound_file_id
				? String(row.inbound_file_id)
				: null,
		vendorId: vendorIdFromRow(row),
		outboundSendStatus: mapOutboundSendStatus(row.outbound_send_status),
		downloadAvailable: Boolean(row.download_available),
		ediFixture:
			direction === "outbound" &&
			String(row.transaction_type ?? "").includes("835")
				? "835"
				: "837I",
	};
}

export type ClaimVendorFileListParams = {
	limit?: number;
	offset?: number;
	search?: string;
	vendor_id?: string;
	/** Pipeline status (received/processing/…) — not MFC review */
	status?: string;
	direction?: "inbound" | "outbound";
	review_status?: string;
	wait_bucket?: string;
	outbound_send_status?: string;
	transaction_type?: string;
	program?: string;
	reject_reason?: string;
	order_by?: string;
};

export async function listClaimVendorFiles(
	params?: ClaimVendorFileListParams
): Promise<ClaimVendorFile[]> {
	if (isMockEnabled()) return [...CLAIM_VENDOR_FILES];

	const page = await vendorCoreApi.listClaimVendorFiles({
		limit: params?.limit ?? 100,
		offset: params?.offset ?? 0,
		search: params?.search,
		vendor_id: params?.vendor_id,
		status: params?.status,
		direction: params?.direction,
		review_status: params?.review_status,
		wait_bucket: params?.wait_bucket,
		outbound_send_status: params?.outbound_send_status,
		transaction_type: params?.transaction_type,
		program: params?.program,
		reject_reason: params?.reject_reason,
		order_by: params?.order_by,
	});
	const rows = page.results ?? [];
	const inboundIds = Array.from(
		new Set(
			rows
				.map((r) =>
					r.source_inbound_file_id
						? String(r.source_inbound_file_id)
						: r.inbound_file_id
							? String(r.inbound_file_id)
							: null
				)
				.filter((id): id is string => Boolean(id))
		)
	).slice(0, 40);

	const inboundById = new Map<
		string,
		{ original_filename?: string; stage?: string }
	>();
	await Promise.all(
		inboundIds.map(async (iid) => {
			const file = await vendorCoreApi.getInboundFile(iid).catch(() => null);
			if (file) {
				inboundById.set(iid, {
					original_filename: file.original_filename,
					stage: file.stage,
				});
			}
		})
	);

	const mapped = rows.map((row) => {
		const iid = row.source_inbound_file_id
			? String(row.source_inbound_file_id)
			: row.inbound_file_id
				? String(row.inbound_file_id)
				: null;
		const enrich = iid ? inboundById.get(iid) : undefined;
		return mapClaimVendorFileDto(row as Record<string, unknown>, {
			originalFilename: enrich?.original_filename,
			stage: enrich?.stage,
		});
	});

	const needsCount = mapped.some((f) => f.records === 0);
	if (!needsCount) return mapped;

	// Provider seed often leaves claim_count=0; backfill from claim-lines for KPIs.
	const linesPage = await vendorCoreApi.listClaimLines().catch(() => null);
	if (!linesPage?.results?.length) return mapped;

	const countByFile = new Map<string, number>();
	for (const line of linesPage.results) {
		const vf = line.vendor_file_id ? String(line.vendor_file_id) : "";
		if (!vf) continue;
		countByFile.set(vf, (countByFile.get(vf) ?? 0) + 1);
	}

	return mapped.map((f) => {
		const fromLines = countByFile.get(f.id) ?? 0;
		if (f.records > 0 || fromLines === 0) return f;
		return {
			...f,
			records: fromLines,
			submitted: fromLines,
			accepted: Math.max(0, fromLines - f.rejected),
		};
	});
}

export async function listClaimResponses() {
	if (isMockEnabled()) return CLAIM_RESPONSES;

	const page = await vendorCoreApi.listClaimResponses({ limit: 100 });
	return (page.results ?? []).map((row) => {
		const id = String(row.id ?? "");
		return {
			id,
			responseId: id,
			responseFile: String(row.reference_id ?? id),
			submissionBatch: String((row.batch as { id?: string } | null)?.id ?? ""),
			relatedFileId: String(row.claim_vendor_file_id ?? ""),
			vendor: "—",
			program: "MDH" as const,
			claimType: "institutional",
			responseType: "835" as const,
			receivedAt: String(row.created_at ?? new Date().toISOString()),
			totalSubmitted: Number(row.claim_count ?? 0),
			paid: 0,
			rejected: Number(row.rejected_count ?? 0),
			partialPaid: 0,
			pending: 0,
			acceptedCount: Number(row.accepted_count ?? 0),
			rejectedCount: Number(row.rejected_count ?? 0),
			status: "pending" as const,
			summary: String(row.status ?? ""),
			direction: "inbound" as const,
			ediFixture: "835" as const,
		};
	});
}

export async function listClaimExceptions() {
	if (isMockEnabled()) return CLAIM_EXCEPTIONS;

	const page = await vendorCoreApi.listClaimExceptions({ limit: 100 });
	return (page.results ?? []).map((row) => {
		const id = String(row.id ?? "");
		const rawStatus = String(row.status ?? "open").toLowerCase();
		const status =
			rawStatus === "resolved"
				? ("resolved" as const)
				: rawStatus === "in_review" || rawStatus === "in_progress"
					? ("in_progress" as const)
					: ("open" as const);
		const rawSeverity = String(row.severity ?? "").toLowerCase();
		const severity =
			rawSeverity === "critical" ||
			rawSeverity === "high" ||
			rawSeverity === "error"
				? ("error" as const)
				: ("warning" as const);
		const assigned =
			row.assigned_to &&
			typeof row.assigned_to === "object" &&
			"full_name" in row.assigned_to
				? String(
						(row.assigned_to as { full_name?: string; username?: string })
							.full_name ||
							(row.assigned_to as { username?: string }).username ||
							""
					)
				: "";
		return {
			id,
			exceptionId: id,
			fileId: String(row.claim_vendor_file_id ?? ""),
			vendor: "—",
			program: "MDH" as const,
			severity,
			code: String(row.code ?? row.exception_type ?? "EX"),
			message: String(row.message ?? row.detail ?? "Exception"),
			claimId: row.claim_line_id ? String(row.claim_line_id) : null,
			status,
			detectedAt: String(row.created_at ?? new Date().toISOString()),
			category: String(row.exception_type ?? "validation"),
			memberId: "—",
			memberName: "—",
			provider: "—",
			serviceLine: 0,
			dateOfService: "—",
			source: "django",
			whatFailed: String(row.message ?? ""),
			whyItMatters: "",
			receivedValue: "",
			expectedValue: "",
			loopSegment: "",
			element: "",
			elementDescription: "",
			usage: "",
			maxUse: 0,
			ruleId: "",
			ruleDescription: "",
			recommendedAction: "",
			ediSnippet: "",
			responsibleParty: "",
			assignedTo: assigned || "Unassigned",
			resolutionNotes:
				row.metadata &&
				typeof row.metadata === "object" &&
				"resolution" in row.metadata &&
				row.metadata.resolution &&
				typeof row.metadata.resolution === "object" &&
				"notes" in (row.metadata.resolution as object)
					? String((row.metadata.resolution as { notes?: string }).notes ?? "")
					: "",
			attachmentsCount: 0,
			ediFixture: "837I" as const,
			fileName: String(row.reference_id ?? id),
		};
	});
}

export async function listClaimLines() {
	if (isMockEnabled()) return CLAIM_LINES;
	return listClaimLinesLive() as unknown as typeof CLAIM_LINES;
}

export async function listSubmissionBatches() {
	if (isMockEnabled()) return SUBMISSION_BATCHES;

	const page = await vendorCoreApi.listSubmissionBatches({ limit: 100 });
	return (page.results ?? []).map((row) => {
		const id = String(row.id ?? "");
		const count = Number(row.claim_count ?? 0);
		return {
			id,
			batchId: String(row.reference_id ?? id),
			vendor: "—",
			program: "MDH" as const,
			direction: "inbound" as const,
			claimType: "institutional",
			claimsSubmitted: count,
			responseReceived: false,
			accepted: 0,
			rejected: 0,
			partial: 0,
			paid: 0,
			pending: count,
			submittedAt: String(row.created_at ?? new Date().toISOString()),
			responseFile: null,
			relatedFileId: "",
			responseId: "",
		};
	});
}

export async function listClaimDiagnoses() {
	const page = await vendorCoreApi.listClaimDiagnoses({ limit: 100 });
	return page.results ?? [];
}

export async function listClaimLinesLive(): Promise<ClaimLineDto[]> {
	const page = await vendorCoreApi.listClaimLines();
	return page.results ?? [];
}

export async function seedClaimLines(body?: {
	vendor_id?: string;
	force?: boolean;
}) {
	return vendorCoreApi.seedClaimLines(body);
}

export async function seedClaimVendorFiles(body?: {
	vendor_id?: string;
	force?: boolean;
}) {
	return vendorCoreApi.seedClaimVendorFiles(body);
}

/**
 * Populate inbound review queue + related claim data.
 *
 * Remote (`api.vm.tillahealth.com`) has **no** `POST /claim-vendor-files/seed/`
 * (BFF surfaces HTML 404). Use claim-lines seed, then providers seed.
 */
export async function seedInboundVendorQueueDemo(body?: {
	force?: boolean;
}): Promise<{
	source: "claim-lines" | "providers";
	result: Record<string, unknown>;
}> {
	const force = body?.force ?? true;
	const statusOf = (err: unknown) =>
		err && typeof err === "object" && "status" in err
			? Number((err as { status: unknown }).status)
			: null;
	const isMissing = (err: unknown) => {
		const s = statusOf(err);
		if (s === 404 || s === 405) return true;
		const msg = err instanceof Error ? err.message : String(err ?? "");
		return (
			msg.includes("Upstream returned 404") ||
			msg.includes("route not found") ||
			msg.includes("Vendor-core route not found")
		);
	};

	try {
		const result = await vendorCoreApi.seedClaimLines({ force });
		return { source: "claim-lines", result: result as Record<string, unknown> };
	} catch (err) {
		if (!isMissing(err)) throw err;
	}
	const result = await vendorCoreApi.seedProviders({ force, count: 24 });
	return { source: "providers", result: result as Record<string, unknown> };
}

export async function createClaimLine(body: Record<string, unknown>) {
	return vendorCoreApi.createClaimLine(body);
}

export async function updateClaimLine(
	id: string,
	body: Record<string, unknown>
) {
	return vendorCoreApi.updateClaimLine(id, body);
}

export type ClaimOperationalNote = {
	id: string;
	text: string;
	addedBy: string;
	date: string;
};

/** Read operational notes stored on claim-line metadata (no dedicated notes API). */
export function parseClaimOperationalNotes(
	metadata?: Record<string, unknown> | null
): ClaimOperationalNote[] {
	const raw = metadata?.operational_notes;
	if (!Array.isArray(raw)) return [];
	return raw
		.map((item, index) => {
			if (!item || typeof item !== "object") return null;
			const row = item as Record<string, unknown>;
			const text = String(row.text ?? row.body ?? "").trim();
			if (!text) return null;
			const addedAt = String(row.added_at ?? row.date ?? row.created_at ?? "");
			return {
				id: String(row.id ?? `note-${index}`),
				text,
				addedBy: String(row.added_by ?? row.addedBy ?? row.author ?? "User"),
				date: addedAt ? addedAt.slice(0, 19).replace("T", " ") : "—",
			};
		})
		.filter((n): n is ClaimOperationalNote => n !== null);
}

/**
 * Persist a claim note via claim-line update (`metadata.operational_notes`).
 * Fetches current line first so we do not wipe review / other metadata keys.
 */
export async function addClaimLineOperationalNote({
	claimLineId,
	text,
	addedBy = "Dashboard user",
}: {
	claimLineId: string;
	text: string;
	addedBy?: string;
}): Promise<ClaimOperationalNote> {
	const trimmed = text.trim();
	if (!trimmed) {
		throw new Error("Note text is required");
	}
	const current = await vendorCoreApi.getClaimLine(claimLineId);
	const meta: Record<string, unknown> = {
		...(current.metadata && typeof current.metadata === "object"
			? current.metadata
			: {}),
	};
	const existing = Array.isArray(meta.operational_notes)
		? [...(meta.operational_notes as unknown[])]
		: [];
	const note = {
		id:
			typeof crypto !== "undefined" && "randomUUID" in crypto
				? crypto.randomUUID()
				: `note-${Date.now()}`,
		text: trimmed,
		added_by: addedBy,
		added_at: new Date().toISOString(),
	};
	existing.push(note);
	meta.operational_notes = existing;
	await vendorCoreApi.updateClaimLine(claimLineId, { metadata: meta });
	return {
		id: note.id,
		text: note.text,
		addedBy: note.added_by,
		date: note.added_at.slice(0, 19).replace("T", " "),
	};
}

export async function deleteClaimLine(id: string) {
	return vendorCoreApi.deleteClaimLine(id);
}

export async function hardDeleteClaimLine(id: string) {
	return vendorCoreApi.hardDeleteClaimLine(id);
}

export async function restoreClaimLine(id: string) {
	return vendorCoreApi.restoreClaimLine(id);
}

export async function getProgramFiles(
	program: ProgramFileType,
	direction: "inbound" | "outbound",
	listParams?: ClaimVendorFileListParams
): Promise<ClaimVendorFile[]> {
	if (isMockEnabled()) {
		return filesForProgram(program, direction);
	}
	const files = await listClaimVendorFiles({
		...listParams,
		direction: listParams?.direction ?? direction,
	});
	if (direction === "outbound") {
		return files.filter((f) => f.direction === "outbound");
	}
	return files.filter(
		(f) =>
			f.direction === "inbound" && (f.program === program || program === "MDH")
	);
}

export async function getProgramResponses(program: ProgramFileType) {
	if (isMockEnabled()) return responsesForProgram(program);
	const files = await listClaimVendorFiles();
	void files;
	return responsesForProgram(program);
}

export async function getProgramExceptions(program: ProgramFileType) {
	if (isMockEnabled()) return exceptionsForProgram(program);
	return listClaimExceptions().then((rows) =>
		rows.filter((e) => e.program === program || program === "MDH")
	);
}

export async function getProgramVendorPerformance(program: ProgramFileType) {
	if (isMockEnabled()) return vendorPerformanceForProgram(program);
	return vendorPerformanceForProgram(program);
}

function amountNumber(v: number | string | null | undefined): number {
	if (v == null || v === "") return 0;
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : 0;
}

function mapSubmissionStatus(
	raw: string | undefined
): ClaimLine["submissionStatus"] {
	const s = String(raw ?? "").toLowerCase();
	if (s.includes("accept")) return "accepted";
	if (s.includes("reject") || s.includes("deny")) return "rejected";
	if (s.includes("partial")) return "partial";
	if (s.includes("submit")) return "submitted";
	return "pending";
}

/** Map core claim-line DTO → EDGE ClaimLine UI shape. */
export function mapClaimLineDtoToUi(
	dto: ClaimLineDto,
	file?: ClaimVendorFile | null
): ClaimLine {
	const claimId = dto.claim_reference_id || dto.claim_id || dto.id;
	const status = mapSubmissionStatus(dto.status);
	return {
		id: dto.id,
		claimId,
		memberId: "—",
		provider: "—",
		vendor: file?.vendor ?? (typeof dto.vendor === "string" ? dto.vendor : "—"),
		account: "—",
		claimType: "institutional",
		dateOfService: dto.service_date ?? "—",
		amountBilled: amountNumber(dto.billed_amount),
		amountPaid: amountNumber(dto.paid_amount),
		submissionStatus: status,
		gainwellStatus:
			status === "accepted"
				? "paid"
				: status === "rejected"
					? "rejected"
					: "pending",
		mfcReviewStatus: "pending",
		rejectReason: dto.denial_reason_code ?? null,
		rejectReasons: [],
		responseFileName: "",
		traceId: dto.reference_id ?? dto.id,
		batchId: dto.batch_number ?? dto.batch_id ?? "",
		fileId: file?.fileId ?? dto.vendor_file_id ?? "",
		responseId: "",
		program: file?.program ?? "MDH",
		direction: file?.direction ?? "inbound",
	};
}

async function enrichVendorFileFromInbound(
	file: ClaimVendorFile
): Promise<ClaimVendorFile> {
	if (!file.sourceInboundFileId) return file;
	const inbound = await vendorCoreApi
		.getInboundFile(file.sourceInboundFileId)
		.catch(() => null);
	if (!inbound) return file;
	const vendorFromInbound =
		typeof inbound.vendor === "string"
			? inbound.vendor
			: inbound.vendor && typeof inbound.vendor === "object"
				? (inbound.vendor.legal_name ?? inbound.vendor.vendor_code ?? null)
				: null;
	return {
		...file,
		fileName: inbound.original_filename || file.fileName,
		vendor:
			file.vendor !== "—"
				? file.vendor
				: vendorFromInbound?.trim() || file.vendor,
		notes: inbound.stage ? `Inbound stage: ${inbound.stage}` : file.notes,
		fileTypeLabel: inbound.stage
			? `Claim file · ${inbound.stage}`
			: file.fileTypeLabel,
	};
}

/**
 * Live (or mock) vendor file by UUID id or reference_id / fileId.
 */
export async function getClaimVendorFileLive(
	fileIdOrUuid: string
): Promise<ClaimVendorFile | undefined> {
	const decoded = decodeURIComponent(fileIdOrUuid);
	if (isMockEnabled()) {
		return getVendorFile(decoded);
	}

	let row: Record<string, unknown> | null = null;
	try {
		row = await vendorCoreApi.getClaimVendorFile(decoded);
	} catch {
		row = null;
	}

	if (!row) {
		const listed = await listClaimVendorFiles();
		const hit = listed.find((f) => f.id === decoded || f.fileId === decoded);
		return hit ? enrichVendorFileFromInbound(hit) : undefined;
	}

	const mapped = mapClaimVendorFileDto(row);
	return enrichVendorFileFromInbound(mapped);
}

/** Claim lines for a vendor file (live filtered list or mock). */
export async function getClaimsForVendorFileLive(
	fileIdOrUuid: string
): Promise<ClaimLine[]> {
	const decoded = decodeURIComponent(fileIdOrUuid);
	if (isMockEnabled()) {
		const file = getVendorFile(decoded);
		return file ? claimsForFile(file.fileId) : [];
	}

	const file = await getClaimVendorFileLive(decoded);
	if (!file) return [];

	let page = await vendorCoreApi.listClaimLinesPage({
		limit: 200,
		offset: 0,
		vendor_file_id: file.id,
	});
	let results = page.results ?? [];

	// Outbound CVFs often have no own lines (send leaves lines on inbound).
	// Fall back to sibling inbound CVF from metadata.
	if (results.length === 0) {
		try {
			const row = await vendorCoreApi.getClaimVendorFile(file.id);
			const meta =
				row.metadata && typeof row.metadata === "object"
					? (row.metadata as Record<string, unknown>)
					: null;
			const sourceId = meta?.source_inbound_vendor_file_id
				? String(meta.source_inbound_vendor_file_id)
				: null;
			if (sourceId && sourceId !== file.id) {
				page = await vendorCoreApi.listClaimLinesPage({
					limit: 200,
					offset: 0,
					vendor_file_id: sourceId,
				});
				results = page.results ?? [];
			}
		} catch {
			/* keep empty */
		}
	}

	return results.map((dto) => mapClaimLineDtoToUi(dto, file));
}

/** Stash-compatible alias of getClaimsForVendorFileLive. */
export async function listClaimsForVendorFile(
	vendorFileId: string,
	_program: ProgramFileType = "DHCF"
) {
	void _program;
	return getClaimsForVendorFileLive(vendorFileId);
}

/** Stash-compatible alias of getClaimVendorFileLive (null instead of undefined). */
export async function resolveClaimVendorFile(
	idOrRef: string
): Promise<ClaimVendorFile | null> {
	return (await getClaimVendorFileLive(idOrRef)) ?? null;
}

export type InboundQueueSnapshot = {
	inbound: ClaimVendorFile[];
	outbound: ClaimVendorFile[];
	openExceptionCount: number;
	ediCompletion: Record<string, unknown> | null;
	monitoring: Record<string, unknown> | null;
	outboundAvailable: boolean;
};

/** Composed inbound queue + best-effort intake KPIs for Inbound Vendor Files page. */
export async function getInboundQueueSnapshot(
	program: ProgramFileType,
	listParams?: ClaimVendorFileListParams
): Promise<InboundQueueSnapshot> {
	if (isMockEnabled()) {
		return {
			inbound: filesForProgram(program, "inbound"),
			outbound: filesForProgram(program, "outbound"),
			openExceptionCount: CLAIM_EXCEPTIONS.filter(
				(e) => e.program === program && e.status === "open"
			).length,
			ediCompletion: null,
			monitoring: null,
			outboundAvailable: true,
		};
	}

	const [inbound, outbound, exceptions, ediCompletion, monitoring] =
		await Promise.all([
			getProgramFiles(program, "inbound", listParams),
			getProgramFiles(program, "outbound"),
			listClaimExceptions().catch(
				() => [] as Awaited<ReturnType<typeof listClaimExceptions>>
			),
			vendorCoreApi.getIntakeCompletionEdi().catch(() => null),
			vendorCoreApi.getMonitoring().catch(() => null),
		]);

	const openExceptionCount = exceptions.filter(
		(e) => e.status === "open" || !e.status
	).length;

	return {
		inbound,
		outbound,
		openExceptionCount,
		ediCompletion,
		monitoring: monitoring as Record<string, unknown> | null,
		outboundAvailable: outbound.length > 0,
	};
}

export async function reprocessLinkedInboundFile(
	sourceInboundFileId: string
): Promise<void> {
	await vendorCoreApi.reprocessInboundFile(sourceInboundFileId);
}

export async function acceptClaimVendorFileLive(
	id: string,
	body?: { notes?: string; claim_line_ids?: string[] }
): Promise<Record<string, unknown>> {
	return vendorCoreApi.acceptClaimVendorFile(id, body);
}

export async function rejectClaimVendorFileLive(
	id: string,
	body?: { reasons?: string[]; notes?: string; claim_line_ids?: string[] }
): Promise<Record<string, unknown>> {
	return vendorCoreApi.rejectClaimVendorFile(id, body);
}

export async function sendClaimVendorFileLive(
	id: string,
	body?: { notes?: string; sync?: boolean; force?: boolean }
): Promise<Record<string, unknown>> {
	return vendorCoreApi.sendClaimVendorFile(id, body);
}

export type ClaimVendorFilesSummary = {
	total_files: number;
	awaiting_review: number;
	accepted: number;
	rejected: number;
	age_buckets: Record<string, number>;
	by_status: Record<string, number>;
	by_review_status: Record<string, number>;
	by_vendor: Record<string, number>;
};

export async function getClaimVendorFilesSummaryLive(
	params?: ClaimVendorFileListParams
): Promise<ClaimVendorFilesSummary | null> {
	if (isMockEnabled()) return null;
	try {
		return await vendorCoreApi.getClaimVendorFilesSummary(params);
	} catch {
		return null;
	}
}

export async function exportClaimVendorFilesCsvLive(
	params?: ClaimVendorFileListParams
): Promise<{
	blob: Blob;
	filename?: string;
}> {
	return vendorCoreApi.exportClaimVendorFilesCsv(params);
}

export async function listInboundFileEventsLive(
	inboundFileId: string
): Promise<Record<string, unknown>[]> {
	if (isMockEnabled()) return [];
	try {
		const rows = await vendorCoreApi.listInboundFileEvents(inboundFileId);
		return rows as unknown as Record<string, unknown>[];
	} catch {
		return [];
	}
}

export async function resolveClaimExceptionLive(
	id: string,
	body?: { notes?: string }
): Promise<Record<string, unknown>> {
	return vendorCoreApi.resolveClaimException(id, body);
}

export async function assignClaimExceptionLive(
	id: string,
	body?: { assigned_to_id?: string | null }
): Promise<Record<string, unknown>> {
	return vendorCoreApi.assignClaimException(id, body);
}

/** Stash-compatible aliases used by ExceptionDetailPage. */
export async function assignClaimException(
	id: string,
	body?: { assigned_to_id?: string | null }
) {
	if (claimFixturesEnabled()) return { mock: true };
	return assignClaimExceptionLive(id, body);
}

export async function resolveClaimException(id: string, notes?: string) {
	if (claimFixturesEnabled()) return { mock: true };
	return resolveClaimExceptionLive(id, { notes });
}

/**
 * Live EDI: prefer inbound-file download, then CVF download.
 * If neither has stored bytes (typical seed CVF on remote), build a
 * synthetic 837 from claim lines — not Magellan fixtures.
 */
export async function loadVendorFileEdiBody(file: {
	id?: string | null;
	fileId?: string | null;
	vendor?: string | null;
	sourceInboundFileId?: string | null;
	ediFixture?: string | null;
	transactionType?: string | null;
	downloadAvailable?: boolean;
}): Promise<string> {
	const fixtureKey = fixtureKeyForTransaction(
		file.transactionType === "835" ? "835" : "837"
	);
	const fixture = (file.ediFixture as "837I" | "835" | undefined) ?? fixtureKey;

	if (isMockEnabled()) {
		return loadEdiFixture(fixture);
	}

	const cvfId = file.id?.trim();
	const inboundId = file.sourceInboundFileId?.trim();
	const errors: string[] = [];

	if (inboundId) {
		try {
			const downloaded = await vendorCoreApi.downloadInboundFile(inboundId);
			const text = downloaded.text?.trim() ?? "";
			if (text) return text;
			errors.push(`Inbound file ${inboundId} download returned an empty body.`);
		} catch (err) {
			const detail = err instanceof Error ? err.message : String(err);
			errors.push(`Inbound file download failed (${inboundId}): ${detail}`);
		}
	}

	if (cvfId) {
		try {
			const downloaded = await vendorCoreApi.downloadClaimVendorFile(cvfId);
			const text = downloaded.text?.trim() ?? "";
			if (text) return text;
			errors.push(
				`Claim vendor file ${cvfId} download returned an empty body.`
			);
		} catch (err) {
			const detail = err instanceof Error ? err.message : String(err);
			errors.push(`CVF download failed (${cvfId}): ${detail}`);
		}
	}

	if (cvfId || file.fileId) {
		try {
			const lines = await getClaimsForVendorFileLive(cvfId || file.fileId!);
			if (lines.length > 0) {
				return buildSynthetic837FromClaimLines(
					lines.map((l) => ({
						claimId: l.claimId,
						amountBilled: l.amountBilled,
						dateOfService: l.dateOfService,
						provider: l.provider !== "—" ? l.provider : null,
					})),
					{
						vendor: file.vendor,
						controlNumber: file.fileId ?? cvfId,
					}
				);
			}
			errors.push("No claim lines found to build EDI preview.");
		} catch (err) {
			const detail = err instanceof Error ? err.message : String(err);
			errors.push(`Claim-line EDI preview failed: ${detail}`);
		}
	}

	if (!inboundId && !cvfId) {
		throw new Error(
			"No vendor file id or linked inbound file. EDI download unavailable."
		);
	}

	throw new Error(
		errors.length > 0
			? errors.join(" ")
			: "EDI download unavailable for this vendor file."
	);
}

/** Browser download from vendor-core CVF (returns blob for saveVendorCoreBlob). */
export async function downloadClaimVendorFile(id: string) {
	if (claimFixturesEnabled()) {
		throw new Error("EDI download requires live vendor-core");
	}
	const result = await vendorCoreApi.downloadClaimVendorFile(id);
	return {
		blob: new Blob([result.text], {
			type: result.contentType || "application/edi-x12",
		}),
		filename: result.filename,
	};
}

/** Trigger browser download from a blob result. */
export function saveVendorCoreBlob(
	result: { blob: Blob; filename?: string },
	fallbackName: string
) {
	const url = URL.createObjectURL(result.blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = result.filename || fallbackName;
	a.click();
	URL.revokeObjectURL(url);
}

export async function listClaimHeadersLive(params?: {
	search?: string;
	vendor_file_id?: string;
	status?: string;
	limit?: number;
}) {
	const page = await vendorCoreApi.listClaimHeaders({
		limit: params?.limit ?? 100,
		search: params?.search,
		vendor_file_id: params?.vendor_file_id,
		status: params?.status,
	});
	return page.results ?? [];
}

export async function getClaimHeaderLive(id: string) {
	return vendorCoreApi.getClaimHeader(id);
}

export async function voidClaimHeader(
	id: string,
	body?: Record<string, unknown>
) {
	return vendorCoreApi.voidClaimHeader(
		id,
		body as { related_claim_reference_id?: string } | undefined
	);
}

export async function replaceClaimHeader(
	id: string,
	body?: Record<string, unknown>
) {
	return vendorCoreApi.replaceClaimHeader(
		id,
		body as { related_claim_reference_id?: string } | undefined
	);
}

export async function revalidateClaimHeaders(claimHeaderIds: string[]) {
	return vendorCoreApi.revalidateClaimHeaders(claimHeaderIds);
}

/** Stash-compatible alias of reprocessLinkedInboundFile. */
export async function reprocessInboundFile(id: string) {
	return reprocessLinkedInboundFile(id);
}

export async function downloadInboundFile(id: string) {
	return vendorCoreApi.downloadInboundFile(id);
}

export async function listRemittanceFilesLive(params?: {
	limit?: number;
	offset?: number;
}) {
	const page = await vendorCoreApi.listRemittanceFiles(params);
	return page.results ?? [];
}

export async function generateSubmissionBatchOutbound(id: string) {
	return vendorCoreApi.generateSubmissionBatchOutbound(id);
}

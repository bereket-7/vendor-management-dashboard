import { withMockOrRemote } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { ClaimLineDto } from "@/lib/vendor-core/types";
import type { ProgramFileType } from "@/types/UI/system.types";

import {
	CLAIM_EXCEPTIONS,
	CLAIM_LINES,
	CLAIM_RESPONSES,
	CLAIM_VENDOR_FILES,
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

export async function listClaimVendorFiles() {
	return withMockOrRemote(
		() => CLAIM_VENDOR_FILES,
		async () => {
			const page = await vendorCoreApi.listClaimVendorFiles({ limit: 100 });
			return (page.results ?? []).map((row) => {
				const id = String(row.id ?? "");
				const claimCount = Number(row.claim_count ?? 0);
				const rejected = Number(row.rejected_count ?? 0);
				return {
					id,
					fileId: String(row.reference_id ?? id),
					vendor: "—",
					direction: "inbound" as const,
					program: "MDH" as const,
					fileTypeLabel: "Claim vendor file",
					transactionType: "837" as const,
					fileName: String(row.transaction_set_control_number ?? id),
					receivedAt: String(row.created_at ?? new Date().toISOString()),
					records: claimCount,
					submitted: claimCount,
					accepted: Math.max(0, claimCount - rejected),
					rejected,
					partial: 0,
					paid: 0,
					denied: 0,
					status: "pending" as const,
					responseCode: null,
					notes: null,
					avgResponseMinutes: null,
					reviewStatus: "pending" as const,
					rejectReasons: [],
					reviewedAt: null,
					reviewedBy: null,
					sourceInboundFileId: row.source_inbound_file_id
						? String(row.source_inbound_file_id)
						: null,
					outboundSendStatus: null,
					ediFixture: "837I" as const,
				};
			});
		},
		[]
	);
}

export async function listClaimResponses() {
	return withMockOrRemote(
		() => CLAIM_RESPONSES,
		async () => {
			const page = await vendorCoreApi.listClaimResponses({ limit: 100 });
			return (page.results ?? []).map((row) => {
				const id = String(row.id ?? "");
				return {
					id,
					responseId: id,
					responseFile: String(row.reference_id ?? id),
					submissionBatch: String(
						(row.batch as { id?: string } | null)?.id ?? ""
					),
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
		},
		[]
	);
}

export async function listClaimExceptions() {
	return withMockOrRemote(
		() => CLAIM_EXCEPTIONS,
		async () => {
			const page = await vendorCoreApi.listClaimExceptions({ limit: 100 });
			return (page.results ?? []).map((row) => {
				const id = String(row.id ?? "");
				return {
					id,
					exceptionId: id,
					fileId: String(row.claim_vendor_file_id ?? ""),
					vendor: "—",
					program: "MDH" as const,
					severity: "error" as const,
					code: String(row.code ?? row.exception_type ?? "EX"),
					message: String(row.message ?? row.detail ?? "Exception"),
					claimId: row.claim_line_id ? String(row.claim_line_id) : null,
					status: "open" as const,
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
					assignedTo: "",
					resolutionNotes: "",
					attachmentsCount: 0,
					ediFixture: "837I" as const,
					fileName: String(row.reference_id ?? id),
				};
			});
		},
		[]
	);
}

export async function listClaimLines() {
	return withMockOrRemote(
		() => CLAIM_LINES,
		async () => listClaimLinesLive() as unknown as typeof CLAIM_LINES,
		[]
	);
}

export async function listSubmissionBatches() {
	return withMockOrRemote(
		() => SUBMISSION_BATCHES,
		async () => {
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
		},
		[]
	);
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

export async function createClaimLine(body: Record<string, unknown>) {
	return vendorCoreApi.createClaimLine(body);
}

export async function updateClaimLine(
	id: string,
	body: Record<string, unknown>
) {
	return vendorCoreApi.updateClaimLine(id, body);
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
	direction: "inbound" | "outbound"
) {
	const files = await listClaimVendorFiles();
	return filesForProgram(program, direction);
}

export async function getProgramResponses(program: ProgramFileType) {
	const files = await listClaimVendorFiles();
	return responsesForProgram(program);
}

export async function getProgramExceptions(program: ProgramFileType) {
	const files = await listClaimVendorFiles();
	return exceptionsForProgram(program);
}

export async function getProgramVendorPerformance(program: ProgramFileType) {
	const files = await listClaimVendorFiles();
	return vendorPerformanceForProgram(program);
}

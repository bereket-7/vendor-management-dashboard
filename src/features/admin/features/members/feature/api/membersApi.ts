import { isMembersMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { VendorCoreBlobResult } from "@/lib/vendor-core/client";
import type {
	AccumulatorFileDto,
	AccumulatorFileListQuery,
	AccumulatorRowCreateInput,
	AccumulatorRowDetailDto,
	AccumulatorRowListDto,
	AccumulatorRowListQuery,
	AccumulatorRowUpdateInput,
	MemberCreateBody,
	MemberDashboardStatsQuery,
	MemberDetailDto,
	MemberListQuery,
	MemberWriteBody,
	PharmacyClaimFileDto,
	PharmacyClaimFileListQuery,
	PharmacyClaimRowCreateInput,
	PharmacyClaimRowDetailDto,
	PharmacyClaimRowListDto,
	PharmacyClaimRowListQuery,
	PharmacyClaimRowUpdateInput,
	ProviderDto,
	VendorDto,
} from "@/lib/vendor-core/types";

import {
	type MemberImportFileKind,
	type MemberImportRowDraft,
	memberImportRowToCreateBody,
} from "../../lib/member-import";
import {
	buildAccumulatorSummaryForMember,
	mapAccumulatorFileRowToTransaction,
	mapAccumulatorSummary,
	mapAccumulators,
	mapChangeEvents,
	mapClaims,
	mapEligibilityHistory,
	mapExceptions,
	mapFamilyLinkDetail,
	mapFamilyLinks,
	mapPharmacyClaimRowToTransaction,
	mapPlanHistory,
	mapSourceRecordList,
	memberDetailDtoToDetail,
	memberListDtoToSummary,
	mergeRecentAccumulatorTransactions,
	sanitizeMemberWriteBody,
} from "../../map-member-core";
import { buildMockMemberChangeEvents } from "../../member-change-events-mock";
import {
	type AccumulatorRow,
	type AccumulatorSummary,
	type DependentRow,
	type EligibilityExceptionRow,
	type EligibilityHistoryRow,
	type MemberClaimRow,
	type MemberDetail,
	type MemberSummary,
	type PlanHistoryRow,
	getMember,
	getMemberSummaries,
} from "../../mock-data";
import type {
	MemberAccumulatorCreateBody,
	MemberAccumulatorUpdateBody,
} from "../dto/membersDto";

export {
	displayName,
	formatCurrency,
	formatDate,
	formatDateTime,
	getMember,
	maskSsn,
	memberAge,
} from "../../mock-data";
export type {
	ClaimStatus,
	EligibilityStatus,
	ExceptionStatus,
	MemberDetail,
	MemberStatus,
	MemberSummary,
} from "../../mock-data";

export type MemberSummariesPage = {
	results: MemberSummary[];
	count: number;
	limit: number;
	offset: number;
};

/** Map UI eligibility labels → backend `eligibility_status` raw values. */
export function eligibilityLabelToApi(
	label: string | undefined
): string | undefined {
	if (!label || label === "all") return undefined;
	const map: Record<string, string> = {
		Active: "active",
		Pending: "pending",
		Inactive: "inactive",
		Termed: "termed",
	};
	return map[label] ?? label.toLowerCase();
}

export function memberStatusLabelToApi(
	label: string | undefined
): string | undefined {
	if (!label || label === "all") return undefined;
	const map: Record<string, string> = {
		Active: "active",
		Pending: "pending",
		Inactive: "inactive",
		Termed: "termed",
	};
	return map[label] ?? label.toLowerCase();
}

/** Map UI gender labels → backend `demographics.gender` (iexact). */
export function genderLabelToApi(
	label: string | undefined
): string | undefined {
	if (!label || label === "all") return undefined;
	const map: Record<string, string> = {
		Male: "Male",
		Female: "Female",
		Other: "Other",
		Unknown: "Unknown",
	};
	return map[label] ?? label;
}

export async function getMemberDashboardStats(
	params?: MemberDashboardStatsQuery
) {
	if (isMembersMockEnabled()) {
		const all = getMemberSummaries();
		const program = params?.program;
		const scoped = program ? all.filter((m) => m.program === program) : all;
		return {
			total: scoped.length,
			active: scoped.filter((m) => m.status === "active").length,
			pending: scoped.filter((m) => m.status === "pending").length,
			termed: scoped.filter((m) => m.status === "termed").length,
			inactive: scoped.filter((m) => m.status === "inactive").length,
			program: program ?? "",
			vendor_id: params?.vendor_id ?? null,
		};
	}
	return vendorCoreApi.getMemberDashboardStats(params);
}

export async function listMemberSummaries(
	filters?: MemberListQuery
): Promise<MemberSummary[]> {
	if (isMembersMockEnabled()) return getMemberSummaries();
	const page = await vendorCoreApi.listMembers(filters);
	return (page.results ?? []).map(memberListDtoToSummary);
}

export async function listMemberSummariesPage(
	filters?: MemberListQuery
): Promise<MemberSummariesPage> {
	if (isMembersMockEnabled()) {
		const all = getMemberSummaries();
		const limit = filters?.limit ?? 50;
		const offset = filters?.offset ?? 0;
		return {
			results: all.slice(offset, offset + limit),
			count: all.length,
			limit,
			offset,
		};
	}
	const page = await vendorCoreApi.listMembersPage(filters);
	return {
		results: (page.results ?? []).map(memberListDtoToSummary),
		count: page.count ?? page.results?.length ?? 0,
		limit: page.limit ?? filters?.limit ?? 50,
		offset: page.offset ?? filters?.offset ?? 0,
	};
}

export async function getMemberDetail(
	idOrMemberId: string
): Promise<MemberDetail | undefined> {
	if (isMembersMockEnabled()) return getMember(idOrMemberId);
	try {
		const dto = await vendorCoreApi.getMember(idOrMemberId);
		return attachLivePcp(memberDetailDtoToDetail(dto), dto);
	} catch {
		const page = await vendorCoreApi.listMembersPage({
			cardholder_id: idOrMemberId,
			limit: 5,
			offset: 0,
		});
		const hit = page.results?.[0];
		if (!hit?.id) return undefined;
		const dto = await vendorCoreApi.getMember(String(hit.id));
		return attachLivePcp(memberDetailDtoToDetail(dto), dto);
	}
}

function needsPcpLookup(detail: MemberDetail): boolean {
	const name = detail.pcpName.trim();
	const npi = detail.pcpNpi.trim();
	return !name || name === "—" || !npi || npi === "—";
}

async function attachLivePcp(
	detail: MemberDetail,
	dto: MemberDetailDto
): Promise<MemberDetail> {
	if (!needsPcpLookup(detail) && detail.pcpNpi.trim() !== "—") {
		return detail;
	}
	try {
		const page = await vendorCoreApi.listProviders();
		const providers = page.results ?? [];
		const match = matchProviderForMember(providers, dto, detail);
		if (!match) return detail;
		return {
			...detail,
			pcpName: match.name?.trim() || detail.pcpName,
			pcpNpi: match.npi?.trim() || detail.pcpNpi,
		};
	} catch {
		return detail;
	}
}

function matchProviderForMember(
	providers: ProviderDto[],
	dto: MemberDetailDto,
	detail: MemberDetail
): ProviderDto | undefined {
	const npi = (dto.pcp_npi || detail.pcpNpi || "").replace(/\D/g, "");
	if (npi && npi !== "") {
		const byNpi = providers.find(
			(p) => (p.npi || "").replace(/\D/g, "") === npi
		);
		if (byNpi) return byNpi;
	}
	const vendorId = dto.vendor_id;
	if (vendorId) {
		const byVendor = providers.find((p) => p.vendor_id === vendorId);
		if (byVendor) return byVendor;
	}
	return undefined;
}

export async function listMemberEligibilityHistory(
	memberId: string
): Promise<EligibilityHistoryRow[]> {
	if (isMembersMockEnabled())
		return getMember(memberId)?.eligibilityHistory ?? [];
	const page = await vendorCoreApi.listMemberEligibilityHistory(memberId);
	return mapEligibilityHistory(page.results as Record<string, unknown>[]);
}

export async function listMemberPlanHistory(
	memberId: string
): Promise<PlanHistoryRow[]> {
	if (isMembersMockEnabled()) return getMember(memberId)?.planHistory ?? [];
	const page = await vendorCoreApi.listMemberPlanHistory(memberId);
	return mapPlanHistory(page.results as Record<string, unknown>[]);
}

export async function listMemberExceptions(
	memberId: string
): Promise<EligibilityExceptionRow[]> {
	if (isMembersMockEnabled()) return getMember(memberId)?.exceptions ?? [];
	const page = await vendorCoreApi.listMemberExceptions(memberId);
	return mapExceptions(page.results as Record<string, unknown>[]);
}

export async function listMemberAccumulators(
	memberId: string
): Promise<AccumulatorRow[]> {
	if (isMembersMockEnabled()) return getMember(memberId)?.accumulators ?? [];
	const page = await vendorCoreApi.listMemberAccumulators(memberId);
	return mapAccumulators(page.results as Record<string, unknown>[]);
}

/**
 * Accumulators tab summary. Tries dedicated GET; on miss/error reshapes from
 * flat list + member context (optional `memberContext` avoids extra detail fetch).
 * Live: overlays Recent Transactions from accumulator-rows + pharmacy-claim-rows
 * filtered by cardholder_id (= member.memberId).
 */
export async function getMemberAccumulatorSummary(
	memberId: string,
	memberContext?: Pick<
		MemberDetail,
		| "planName"
		| "planCode"
		| "planId"
		| "accountGroup"
		| "groupName"
		| "groupId"
		| "memberId"
		| "coverageStart"
		| "coverageEnd"
		| "dataAsOf"
		| "paidYtd"
		| "accumulators"
		| "vendorSource"
		| "accumulatorSummary"
	>
): Promise<AccumulatorSummary | undefined> {
	if (isMembersMockEnabled()) {
		const m = getMember(memberId);
		if (!m) return undefined;
		return m.accumulatorSummary ?? buildAccumulatorSummaryForMember(m);
	}

	let summary: AccumulatorSummary | undefined;
	let ctxMemberId = memberContext?.memberId?.trim() || "";
	let ctxPlanId =
		memberContext?.planCode?.trim() || memberContext?.planId?.trim() || "";

	try {
		const dto = await vendorCoreApi.getMemberAccumulatorSummary(memberId);
		summary = mapAccumulatorSummary(dto);
	} catch {
		/* 404 / not shipped — fall through to reshape */
	}

	if (!summary) {
		const [accumulators, detail] = await Promise.all([
			listMemberAccumulators(memberId),
			memberContext ? Promise.resolve(undefined) : getMemberDetail(memberId),
		]);
		const ctx = memberContext ?? detail;
		if (ctx?.memberId?.trim()) ctxMemberId = ctx.memberId.trim();
		if (!ctxPlanId) {
			ctxPlanId = ctx?.planCode?.trim() || ctx?.planId?.trim() || "";
		}
		if (!ctx) {
			summary = buildAccumulatorSummaryForMember({
				planName: "—",
				planCode: "",
				planId: "",
				accountGroup: "",
				groupName: "",
				groupId: "",
				memberId: memberId,
				coverageStart: "",
				coverageEnd: "",
				dataAsOf: "",
				paidYtd: 0,
				accumulators,
				vendorSource: "",
				accumulatorSummary: undefined,
			});
		} else {
			summary = buildAccumulatorSummaryForMember({
				...ctx,
				accumulators,
				// Force reshape from live nested list — do not reuse stale demo KPIs.
				accumulatorSummary: undefined,
			});
		}
	}

	let cardholderId =
		ctxMemberId ||
		summary.medicalRows[0]?.internalMemberId?.trim() ||
		summary.pharmacyRows[0]?.internalMemberId?.trim() ||
		"";
	const planId =
		ctxPlanId ||
		summary.medicalRows[0]?.planId ||
		summary.pharmacyRows[0]?.planId ||
		"—";

	if (!cardholderId) {
		try {
			const detail = await getMemberDetail(memberId);
			cardholderId = detail?.memberId?.trim() || "";
		} catch {
			cardholderId = "";
		}
	}

	if (!cardholderId) {
		return { ...summary, recentTransactions: [] };
	}

	const [accPage, rxPage] = await Promise.all([
		listAccumulatorRows({
			cardholder_id: cardholderId,
			limit: 50,
		}).catch(() => ({ results: [] as AccumulatorRowListDto[] })),
		listPharmacyClaimRows({
			cardholder_id: cardholderId,
			limit: 50,
		}).catch(() => ({ results: [] as PharmacyClaimRowListDto[] })),
	]);

	const recentTransactions = mergeRecentAccumulatorTransactions(
		(accPage.results ?? []).map((r) =>
			mapAccumulatorFileRowToTransaction(r, planId)
		),
		(rxPage.results ?? []).map((r) =>
			mapPharmacyClaimRowToTransaction(r, planId)
		)
	);

	return { ...summary, recentTransactions };
}

export async function listAccumulatorFiles(
	params?: AccumulatorFileListQuery
): Promise<{ results: AccumulatorFileDto[]; count?: number }> {
	if (isMembersMockEnabled()) return { results: [], count: 0 };
	const page = await vendorCoreApi.listAccumulatorFiles(params);
	return { results: page.results ?? [], count: page.count };
}

export async function getAccumulatorFile(
	id: string
): Promise<AccumulatorFileDto> {
	return vendorCoreApi.getAccumulatorFile(id);
}

export async function listAccumulatorRows(
	params?: AccumulatorRowListQuery
): Promise<{ results: AccumulatorRowListDto[]; count?: number }> {
	if (isMembersMockEnabled()) return { results: [], count: 0 };
	const page = await vendorCoreApi.listAccumulatorRows(params);
	return { results: page.results ?? [], count: page.count };
}

export async function getAccumulatorRow(
	id: string
): Promise<AccumulatorRowDetailDto> {
	return vendorCoreApi.getAccumulatorRow(id);
}

export async function createAccumulatorRow(
	body: AccumulatorRowCreateInput
): Promise<AccumulatorRowDetailDto> {
	return vendorCoreApi.createAccumulatorRow(body);
}

export async function updateAccumulatorRow(
	id: string,
	body: AccumulatorRowUpdateInput
): Promise<AccumulatorRowDetailDto> {
	return vendorCoreApi.updateAccumulatorRow(id, body);
}

export async function deleteAccumulatorRow(id: string): Promise<void> {
	return vendorCoreApi.deleteAccumulatorRow(id);
}

export async function listPharmacyClaimFiles(
	params?: PharmacyClaimFileListQuery
): Promise<{ results: PharmacyClaimFileDto[]; count?: number }> {
	if (isMembersMockEnabled()) return { results: [], count: 0 };
	const page = await vendorCoreApi.listPharmacyClaimFiles(params);
	return { results: page.results ?? [], count: page.count };
}

export async function getPharmacyClaimFile(
	id: string
): Promise<PharmacyClaimFileDto> {
	return vendorCoreApi.getPharmacyClaimFile(id);
}

export async function listPharmacyClaimRows(
	params?: PharmacyClaimRowListQuery
): Promise<{ results: PharmacyClaimRowListDto[]; count?: number }> {
	if (isMembersMockEnabled()) return { results: [], count: 0 };
	const page = await vendorCoreApi.listPharmacyClaimRows(params);
	return { results: page.results ?? [], count: page.count };
}

export async function getPharmacyClaimRow(
	id: string
): Promise<PharmacyClaimRowDetailDto> {
	return vendorCoreApi.getPharmacyClaimRow(id);
}

export async function createPharmacyClaimRow(
	body: PharmacyClaimRowCreateInput
): Promise<PharmacyClaimRowDetailDto> {
	return vendorCoreApi.createPharmacyClaimRow(body);
}

export async function updatePharmacyClaimRow(
	id: string,
	body: PharmacyClaimRowUpdateInput
): Promise<PharmacyClaimRowDetailDto> {
	return vendorCoreApi.updatePharmacyClaimRow(id, body);
}

export async function deletePharmacyClaimRow(id: string): Promise<void> {
	return vendorCoreApi.deletePharmacyClaimRow(id);
}

export async function listMemberClaims(
	memberId: string,
	claimKind?: string
): Promise<MemberClaimRow[]> {
	if (isMembersMockEnabled()) {
		const m = getMember(memberId);
		if (!m) return [];
		if (claimKind === "encounter") return m.encounters;
		return m.claims;
	}
	const page = await vendorCoreApi.listMemberClaims(
		memberId,
		claimKind ? { claim_kind: claimKind } : undefined
	);
	return mapClaims(page.results as Record<string, unknown>[]);
}

export async function listMemberChangeEvents(memberId: string) {
	if (isMembersMockEnabled()) return buildMockMemberChangeEvents(memberId);
	const page = await vendorCoreApi.listMemberChangeEvents(memberId);
	const mapped = mapChangeEvents(page.results as Record<string, unknown>[]);
	if (mapped.length > 0) return mapped;
	return buildMockMemberChangeEvents(memberId);
}

export async function listMemberSourceRecords(memberId: string) {
	if (isMembersMockEnabled()) return [];
	const page = await vendorCoreApi.listMemberSourceRecords(memberId);
	return mapSourceRecordList(page.results as Record<string, unknown>[]);
}

export async function getMemberSourceRecord(
	memberId: string,
	recordId: string
): Promise<Record<string, unknown>> {
	if (isMembersMockEnabled()) {
		return { id: recordId, message: "Mock mode — no source payload" };
	}
	return vendorCoreApi.getMemberSourceRecord(memberId, recordId);
}

export async function createMemberException(
	memberId: string,
	body: {
		exception_type?: string;
		description?: string;
		status?: string;
		source?: string;
		resolution?: string;
	}
): Promise<EligibilityExceptionRow> {
	if (isMembersMockEnabled()) {
		return mapExceptions([
			{
				id: crypto.randomUUID(),
				exception_type: body.exception_type,
				description: body.description,
				status: body.status,
				source: body.source,
				resolution: body.resolution,
			},
		])[0]!;
	}
	const row = await vendorCoreApi.createMemberException(memberId, body);
	return mapExceptions([row as Record<string, unknown>])[0]!;
}

export async function createMemberAccumulator(
	memberId: string,
	body: MemberAccumulatorCreateBody
): Promise<AccumulatorRow> {
	if (isMembersMockEnabled()) {
		return mapAccumulators([
			{
				id: crypto.randomUUID(),
				label: body.label,
				individual: body.individual,
				family: body.family,
				remaining: body.remaining,
				limit: body.limit,
			},
		])[0]!;
	}
	const row = await vendorCoreApi.createMemberAccumulator(
		memberId,
		body as Record<string, unknown>
	);
	return mapAccumulators([row as Record<string, unknown>])[0]!;
}

export async function createMemberClaim(
	memberId: string,
	body: {
		service_date?: string;
		claim_number?: string;
		claim_kind?: string;
		provider_name?: string;
		billed_amount?: number;
		paid_amount?: number;
		status?: string;
	}
): Promise<MemberClaimRow> {
	if (isMembersMockEnabled()) {
		return mapClaims([
			{
				id: crypto.randomUUID(),
				service_date: body.service_date,
				claim_number: body.claim_number,
				claim_kind: body.claim_kind,
				provider_name: body.provider_name,
				billed_amount: body.billed_amount,
				paid_amount: body.paid_amount,
				status: body.status,
			},
		])[0]!;
	}
	const row = await vendorCoreApi.createMemberClaim(memberId, body);
	return mapClaims([row as Record<string, unknown>])[0]!;
}

export async function updateMemberException(
	memberId: string,
	exceptionId: string,
	body: Record<string, unknown>
) {
	if (isMembersMockEnabled()) {
		return mapExceptions([{ id: exceptionId, ...body }])[0]!;
	}
	const row = await vendorCoreApi.updateMemberException(
		memberId,
		exceptionId,
		body
	);
	return mapExceptions([row as Record<string, unknown>])[0]!;
}

export async function deleteMemberException(
	memberId: string,
	exceptionId: string
) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.deleteMemberException(memberId, exceptionId);
}

export async function updateMemberAccumulator(
	memberId: string,
	accumulatorId: string,
	body: MemberAccumulatorUpdateBody
) {
	if (isMembersMockEnabled()) {
		return mapAccumulators([{ id: accumulatorId, ...body }])[0]!;
	}
	const row = await vendorCoreApi.updateMemberAccumulator(
		memberId,
		accumulatorId,
		body as Record<string, unknown>
	);
	return mapAccumulators([row as Record<string, unknown>])[0]!;
}

export async function deleteMemberAccumulator(
	memberId: string,
	accumulatorId: string
) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.deleteMemberAccumulator(memberId, accumulatorId);
}

export async function updateMemberClaim(
	memberId: string,
	claimId: string,
	body: Record<string, unknown>
) {
	if (isMembersMockEnabled()) {
		return mapClaims([{ id: claimId, ...body }])[0]!;
	}
	const row = await vendorCoreApi.updateMemberClaim(memberId, claimId, body);
	return mapClaims([row as Record<string, unknown>])[0]!;
}

export async function deleteMemberClaim(memberId: string, claimId: string) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.deleteMemberClaim(memberId, claimId);
}

export async function createMember(
	body: MemberCreateBody | Record<string, unknown>
) {
	if (isMembersMockEnabled()) {
		const existing = getMemberSummaries()[0];
		const id = `mock-import-${String(body.cardholder_id ?? "member")}-${Date.now()}`;
		const first = String(body.first_name ?? "Imported");
		const last = String(body.last_name ?? "Member");
		if (!existing) {
			return {
				id,
				memberId: String(body.cardholder_id ?? id),
				firstName: first,
				lastName: last,
				status: "active",
				eligibilityStatus: "eligible",
			} as MemberDetail;
		}
		const template = getMember(existing.id);
		if (!template) throw new Error("No mock members");
		return {
			...template,
			id,
			memberId: String(body.cardholder_id ?? template.memberId),
			firstName: first,
			lastName: last,
			vendorId: String(body.vendor_id ?? template.vendorId ?? ""),
		};
	}
	const dto = await vendorCoreApi.createMember(sanitizeMemberWriteBody(body));
	const rawId =
		dto && typeof dto === "object" && "id" in dto
			? String((dto as { id: unknown }).id ?? "")
			: "";
	try {
		const detail = memberDetailDtoToDetail(dto as MemberDetailDto);
		if (detail.id) return detail;
		if (rawId) return { ...detail, id: rawId };
	} catch {
		/* fall through to raw id */
	}
	if (!rawId) throw new Error("Member created but no id returned");
	return memberDetailDtoToDetail({
		...(dto as object),
		id: rawId,
	} as MemberDetailDto);
}

export async function updateMember(
	id: string,
	body: MemberWriteBody | Record<string, unknown>
) {
	if (isMembersMockEnabled()) {
		const member = getMember(id);
		if (!member) throw new Error("Member not found");
		return member;
	}
	const dto = await vendorCoreApi.updateMember(
		id,
		sanitizeMemberWriteBody(body)
	);
	return memberDetailDtoToDetail(dto);
}

export async function deleteMember(id: string) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.deleteMember(id);
}

export async function hardDeleteMember(id: string) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.hardDeleteMember(id);
}

export async function restoreMember(id: string) {
	if (isMembersMockEnabled()) {
		const member = getMember(id);
		if (!member) throw new Error("Member not found");
		return member;
	}
	const dto = await vendorCoreApi.restoreMember(id);
	return memberDetailDtoToDetail(dto);
}

export async function seedMembers(body?: Record<string, unknown>) {
	if (isMembersMockEnabled()) return { created: 0, skipped: true };
	return vendorCoreApi.seedMembers(body);
}

export type MemberBulkImportResult = {
	createdCount: number;
	updatedCount: number;
	errorCount: number;
	errors: { cardholderId: string; message: string }[];
};

export async function importMembersBulk(input: {
	vendorId: string;
	fileKind: MemberImportFileKind;
	rows: MemberImportRowDraft[];
	filename?: string;
	onProgress?: (done: number, total: number) => void;
}): Promise<MemberBulkImportResult> {
	const { vendorId, fileKind, rows, onProgress } = input;
	let createdCount = 0;
	const errors: MemberBulkImportResult["errors"] = [];

	// Live + mock: use existing member create endpoint (no dedicated import API).
	for (let i = 0; i < rows.length; i += 1) {
		const row = rows[i]!;
		try {
			await createMember(memberImportRowToCreateBody(row, vendorId, fileKind));
			createdCount += 1;
		} catch (err) {
			errors.push({
				cardholderId: row.cardholder_id,
				message: err instanceof Error ? err.message : "Create failed",
			});
		}
		onProgress?.(i + 1, rows.length);
	}

	return {
		createdCount,
		updatedCount: 0,
		errorCount: errors.length,
		errors,
	};
}

export async function listMemberFamilyLinks(
	memberId: string
): Promise<DependentRow[]> {
	if (isMembersMockEnabled()) return getMember(memberId)?.dependents ?? [];
	const page = await vendorCoreApi.listMemberFamilyLinks(memberId);
	const rows = Array.isArray(page)
		? page
		: Array.isArray(page?.results)
			? page.results
			: [];
	return mapFamilyLinks(rows as Record<string, unknown>[]);
}

export async function getMemberFamilyLink(memberId: string, linkId: string) {
	if (isMembersMockEnabled()) {
		const dep = getMember(memberId)?.dependents.find((d) => d.id === linkId);
		if (!dep) throw new Error("Family link not found");
		return mapFamilyLinkDetail({
			id: dep.id,
			subscriber_id: memberId,
			dependent_id: dep.memberId ?? dep.id,
			relationship_code: dep.relationship,
			relationship_label: dep.relationship,
			dependent_cardholder_id: dep.memberId,
			dependent_first_name: dep.name.split(" ")[0],
			dependent_last_name: dep.name.split(" ").slice(1).join(" "),
			dependent_status: dep.coverageStatus,
			created_at: null,
		});
	}
	const row = await vendorCoreApi.getMemberFamilyLink(memberId, linkId);
	return mapFamilyLinkDetail(row);
}

export async function createMemberFamilyLink(
	memberId: string,
	body: {
		dependent_id: string;
		relationship_code?: string;
		relationship_label?: string;
	}
) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.createMemberFamilyLink(memberId, body);
}

export async function updateMemberFamilyLink(
	memberId: string,
	linkId: string,
	body: { relationship_code?: string; relationship_label?: string }
) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.updateMemberFamilyLink(memberId, linkId, body);
}

export async function deleteMemberFamilyLink(memberId: string, linkId: string) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.deleteMemberFamilyLink(memberId, linkId);
}

export async function syncMemberFamilyLinks(memberId: string) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.syncMemberFamilyLinks(memberId);
}

export async function transferMemberFamilyLink(
	memberId: string,
	linkId: string,
	body: { new_subscriber_id: string }
) {
	if (isMembersMockEnabled()) return;
	await vendorCoreApi.transferMemberFamilyLink(memberId, linkId, body);
}

/** List filters for export (no pagination). */
export function memberListExportFilters(
	query: MemberListQuery
): MemberListQuery {
	const { limit: _l, offset: _o, ...filters } = query;
	return filters;
}

export async function exportMemberListCsv(
	filters: MemberListQuery
): Promise<VendorCoreBlobResult> {
	return vendorCoreApi.exportMemberListCsv(memberListExportFilters(filters));
}

export async function exportMemberDetailCsv(
	memberId: string
): Promise<VendorCoreBlobResult> {
	return vendorCoreApi.exportMemberDetailCsv(memberId);
}

export async function exportMemberDetailPdf(
	memberId: string,
	variant: "full" | "summary" = "full"
): Promise<VendorCoreBlobResult> {
	return vendorCoreApi.exportMemberDetailPdf(memberId, { variant });
}

export async function exportMemberPrintHtml(
	memberId: string
): Promise<VendorCoreBlobResult> {
	return vendorCoreApi.exportMemberPrintHtml(memberId);
}

export async function exportMemberDocumentPdf(
	memberId: string,
	document: "summary" | "eligibility-letter" | "coverage-card"
): Promise<VendorCoreBlobResult> {
	return vendorCoreApi.exportMemberDocumentPdf(memberId, document);
}

export async function listMemberCoverages() {
	const page = await vendorCoreApi.listMemberCoverages();
	return page.results ?? [];
}

export async function listMemberVendors(): Promise<VendorDto[]> {
	const page = await vendorCoreApi.listVendors();
	return page.results ?? [];
}

export async function seedMemberCoverages(_body?: {
	vendor_id?: string;
	force?: boolean;
}): Promise<{ created: number; skipped?: boolean }> {
	throw new Error(
		"Member coverage seed API is not available. Use backend: manage.py seed_demo_members"
	);
}

import type {
	CmsEdgeSupplementalDxRow,
	SupplementalDxClaimLink,
	SupplementalDxCmsStatus,
	SupplementalDxTransaction,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";

export type ClaimDiagnosisDto = {
	id: string;
	reference_id?: string;
	vendor_file_id?: string;
	vendor_id?: string | null;
	claim_reference_id?: string;
	sequence?: number;
	diagnosis_code?: string;
	present_on_admission?: string | null;
	enrollee_external_id?: string;
	service_date_from?: string | null;
	service_date_to?: string | null;
	link_status?: string;
	transaction_code?: string;
	created_at?: string;
	updated_at?: string;
};

export function normalizeClaimDiagnosis(
	raw: Record<string, unknown>
): ClaimDiagnosisDto {
	return {
		id: String(raw.id ?? ""),
		reference_id:
			raw.reference_id != null ? String(raw.reference_id) : undefined,
		vendor_file_id:
			raw.vendor_file_id != null ? String(raw.vendor_file_id) : undefined,
		vendor_id: raw.vendor_id != null ? String(raw.vendor_id) : null,
		claim_reference_id:
			raw.claim_reference_id != null
				? String(raw.claim_reference_id)
				: undefined,
		sequence: raw.sequence != null ? Number(raw.sequence) : undefined,
		diagnosis_code:
			raw.diagnosis_code != null ? String(raw.diagnosis_code) : undefined,
		present_on_admission:
			raw.present_on_admission != null
				? String(raw.present_on_admission)
				: null,
		enrollee_external_id:
			raw.enrollee_external_id != null
				? String(raw.enrollee_external_id)
				: undefined,
		service_date_from:
			raw.service_date_from != null ? String(raw.service_date_from) : null,
		service_date_to:
			raw.service_date_to != null ? String(raw.service_date_to) : null,
		link_status: raw.link_status != null ? String(raw.link_status) : undefined,
		transaction_code:
			raw.transaction_code != null ? String(raw.transaction_code) : undefined,
		created_at: raw.created_at != null ? String(raw.created_at) : undefined,
		updated_at: raw.updated_at != null ? String(raw.updated_at) : undefined,
	};
}

function mapCmsStatus(code?: string): SupplementalDxCmsStatus {
	if (!code?.trim() || code.toUpperCase() === "INVALID") return "Error";
	return "Ready";
}

function mapClaimLink(
	claimRef: string | undefined,
	knownClaimRefs: Set<string>,
	linkStatus?: string
): SupplementalDxClaimLink {
	const status = (linkStatus || "").toLowerCase();
	if (status === "unmatched") return "Unmatched";
	if (status === "matched") return "Matched";
	if (!claimRef?.trim()) return "Unmatched";
	return knownClaimRefs.has(claimRef) ? "Matched" : "Unmatched";
}

function mapTransaction(code?: string): SupplementalDxTransaction {
	const t = (code || "").toLowerCase();
	if (t === "void") return "Void";
	if (t === "replacement") return "Replacement";
	return "Original";
}

function formatDxDate(value?: string | null): string {
	if (!value?.trim()) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
}

/** Best-effort map claim-diagnoses → EDGE supplemental DX rows. */
export function claimDiagnosisDtosToRows(
	rows: ClaimDiagnosisDto[],
	knownClaimRefs: Set<string> = new Set()
): CmsEdgeSupplementalDxRow[] {
	return rows.map((dto) => {
		const code = dto.diagnosis_code?.trim() || "";
		const claimRef = dto.claim_reference_id?.trim() || null;
		return {
			id: dto.id,
			recordId: dto.reference_id || dto.id,
			enrolleeId: dto.enrollee_external_id?.trim() || "—",
			originalClaimId: claimRef,
			detailRecordId:
				dto.sequence != null
					? `DR-${dto.sequence}`
					: dto.reference_id || dto.id,
			diagnosisType: "ICD-10-CM",
			diagnosisCode: code || "—",
			serviceFrom: formatDxDate(dto.service_date_from),
			serviceTo: formatDxDate(dto.service_date_to),
			transaction: mapTransaction(dto.transaction_code),
			claimLink: mapClaimLink(
				claimRef ?? undefined,
				knownClaimRefs,
				dto.link_status
			),
			cmsStatus: mapCmsStatus(code),
		};
	});
}

export function deriveSupplementalDxKpis(rows: CmsEdgeSupplementalDxRow[]) {
	const total = rows.length;
	const ready = rows.filter((r) => r.cmsStatus === "Ready").length;
	const errors = rows.filter((r) => r.cmsStatus === "Error").length;
	const unmatched = rows.filter((r) => r.claimLink === "Unmatched").length;
	const voids = rows.filter((r) => r.transaction === "Void").length;

	return [
		{
			id: "total",
			label: "Total Diagnosis Records",
			value: total.toLocaleString("en-US"),
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "text-sky-800",
			icon: "file" as const,
		},
		{
			id: "ready",
			label: "CMS Ready",
			value: ready.toLocaleString("en-US"),
			tone: "text-emerald-700 bg-emerald-500/10",
			valueClassName: "text-emerald-700",
			icon: "check" as const,
		},
		{
			id: "errors",
			label: "Validation Errors",
			value: errors.toLocaleString("en-US"),
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "alert" as const,
		},
		{
			id: "unmatched",
			label: "Unmatched Claims",
			value: unmatched.toLocaleString("en-US"),
			tone: "text-amber-800 bg-amber-500/10",
			valueClassName: "text-amber-800",
			icon: "link" as const,
		},
		{
			id: "voids",
			label: "Voids / Replacements",
			value: voids.toLocaleString("en-US"),
			tone: "text-slate-700 bg-slate-500/10",
			valueClassName: "text-foreground",
			icon: "unlink" as const,
		},
	];
}

export function deriveSupplementalDxValidationSummary(
	rows: CmsEdgeSupplementalDxRow[]
) {
	const unmatched = rows.filter((r) => r.claimLink === "Unmatched").length;
	const invalidCode = rows.filter(
		(r) => !r.diagnosisCode || r.diagnosisCode === "—"
	).length;
	const missingDate = rows.filter(
		(r) => r.serviceFrom === "—" || r.serviceTo === "—"
	).length;
	const errors = rows.filter((r) => r.cmsStatus === "Error").length;
	const voids = rows.filter((r) => r.transaction === "Void").length;

	return [
		{
			id: "unmatched",
			label: "Unmatched Medical Claim",
			value: unmatched.toLocaleString("en-US"),
			tone: "text-amber-700 bg-amber-500/10",
			valueClassName: "text-red-600",
			icon: "unlink" as const,
		},
		{
			id: "invalid-code",
			label: "Invalid Diagnosis Code",
			value: invalidCode.toLocaleString("en-US"),
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "text-violet-700",
			icon: "code" as const,
		},
		{
			id: "missing-date",
			label: "Missing Service Date",
			value: missingDate.toLocaleString("en-US"),
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "text-sky-700",
			icon: "calendar" as const,
		},
		{
			id: "errors",
			label: "Validation Errors",
			value: errors.toLocaleString("en-US"),
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "user" as const,
		},
		{
			id: "voids",
			label: "Voids / Replacements",
			value: voids.toLocaleString("en-US"),
			tone: "text-slate-700 bg-slate-500/10",
			valueClassName: "text-foreground",
			icon: "link" as const,
		},
	];
}

export type CmsEdgeSupplementalDxDetailView = {
	id: string;
	recordId: string;
	cmsStatus: string;
	transaction: string;
	summary: { label: string; value: string; icon: string }[];
	recordInfoLeft: { label: string; value: string }[];
	recordInfoRight: { label: string; value: string }[];
};

export function claimDiagnosisDtoToDetailView(
	dto: ClaimDiagnosisDto
): CmsEdgeSupplementalDxDetailView {
	const row = claimDiagnosisDtosToRows([dto])[0]!;
	return {
		id: dto.id,
		recordId: row.recordId,
		cmsStatus: row.cmsStatus === "Ready" ? "CMS Ready" : row.cmsStatus,
		transaction: row.transaction,
		summary: [
			{ label: "Unique Enrollee ID", value: row.enrolleeId, icon: "user" },
			{
				label: "Original Medical Claim ID",
				value: row.originalClaimId ?? "—",
				icon: "clipboard",
			},
			{
				label: "Diagnosis Code",
				value: row.diagnosisCode,
				icon: "stethoscope",
			},
			{ label: "Service Date", value: row.serviceFrom, icon: "calendar" },
			{ label: "Plan ID", value: "—", icon: "shield" },
			{ label: "Claim Link", value: row.claimLink, icon: "link" },
		],
		recordInfoLeft: [
			{ label: "Supplemental Record ID", value: row.recordId },
			{ label: "Diagnosis Detail Record ID", value: row.detailRecordId },
			{ label: "Original Diagnosis Detail Record ID", value: "—" },
			{ label: "Transaction Type", value: row.transaction },
			{ label: "Void/Replace Code", value: "0 - Original Record" },
		],
		recordInfoRight: [
			{ label: "Diagnosis Type", value: row.diagnosisType },
			{ label: "Diagnosis Code", value: row.diagnosisCode },
			{ label: "Diagnosis Description", value: "—" },
			{
				label: "Present on Admission",
				value: dto.present_on_admission?.trim() || "—",
			},
			{ label: "Claim Reference", value: row.originalClaimId ?? "—" },
		],
	};
}

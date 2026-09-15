import type {
	CmsEdgeProviderListRow,
	ProviderClaimCmsStatus,
	ProviderEdgeStatus,
	ProviderErrorStatus,
	ProviderIdQualifier,
	ProviderRole,
} from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import { CMS_EDGE_PROVIDER_DETAIL } from "@/features/admin/features/claim-encounter/cms-edge/mock-data";
import type {
	ProviderCredentialDto,
	ProviderDto,
	ProviderExceptionDto,
	ProviderIdentifierDto,
	ProviderLocationDto,
	ProviderNetworkDto,
	ProviderProfileDto,
	ProviderRecentActivityDto,
	ProviderSummaryDto,
	ProviderVendorSourceDto,
} from "@/lib/vendor-core/types";

function dash(value: string | null | undefined): string {
	if (value == null || value === "") return "—";
	return String(value);
}

function formatDate(value: string | null | undefined): string {
	if (!value) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
}

function mapProviderStatus(dto: ProviderDto): ProviderEdgeStatus {
	if (!dto.npi?.trim()) return "Missing ID";
	if (!/^\d{10}$/.test(dto.npi.trim())) return "Invalid NPI";
	const s = (dto.status ?? "").toLowerCase();
	if (s.includes("inact") || s.includes("term")) return "Invalid NPI";
	return "Valid";
}

function mapRole(dto: ProviderDto): ProviderRole {
	const meta = dto.metadata ?? {};
	const raw = String(
		meta.role ?? meta.provider_role ?? dto.entity_type ?? ""
	).toLowerCase();
	if (raw.includes("dispens")) return "Dispensing";
	if (raw.includes("render")) return "Rendering";
	return "Billing";
}

/** Map vendor-core provider DTOs → EDGE providers table rows. */
export function providerDtosToRows(
	rows: ProviderDto[]
): CmsEdgeProviderListRow[] {
	return rows.map((dto) => {
		const status = mapProviderStatus(dto);
		const claims = Number(dto.claims12m ?? 0) || 0;
		return {
			id: dto.id,
			name: dash(dto.name),
			npi: dto.npi?.trim() || null,
			idQualifier: "NPI" as ProviderIdQualifier,
			role: mapRole(dto),
			taxonomy: dash(dto.taxonomy || dto.profile?.specialty),
			networkStatus: "In-Network" as const,
			medicalClaims: claims,
			pharmacyClaims: 0,
			status,
			errors: Number(dto.tab_counts?.exception_count ?? 0) || 0,
		};
	});
}

export function deriveProviderEdgeKpis(rows: CmsEdgeProviderListRow[]) {
	const total = rows.length;
	const validated = rows.filter((r) => r.status === "Valid").length;
	const invalid = rows.filter((r) => r.status === "Invalid NPI").length;
	const missing = rows.filter((r) => r.status === "Missing ID").length;
	const impacted = rows.filter((r) => r.errors > 0).length;

	return [
		{
			id: "total",
			label: "Total Providers",
			value: total.toLocaleString("en-US"),
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "text-sky-800",
			icon: "users" as const,
		},
		{
			id: "validated",
			label: "Validated",
			value: validated.toLocaleString("en-US"),
			tone: "text-emerald-700 bg-emerald-500/10",
			valueClassName: "text-emerald-700",
			icon: "check" as const,
		},
		{
			id: "invalid",
			label: "Invalid NPI",
			value: invalid.toLocaleString("en-US"),
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "alert" as const,
		},
		{
			id: "missing",
			label: "Missing Identifier",
			value: missing.toLocaleString("en-US"),
			tone: "text-amber-800 bg-amber-500/10",
			valueClassName: "text-amber-800",
			icon: "circleAlert" as const,
		},
		{
			id: "impacted",
			label: "Claims Impacted",
			value: impacted.toLocaleString("en-US"),
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "text-violet-700",
			icon: "file" as const,
		},
	];
}

/** Map GET /providers/stats/ into EDGE providers KPI strip. */
export function providerStatsToEdgeKpis(stats: {
	total: number;
	active: number;
	pending: number;
	termed: number;
	inactive: number;
}): ReturnType<typeof deriveProviderEdgeKpis> {
	return [
		{
			id: "total",
			label: "Total Providers",
			value: stats.total.toLocaleString("en-US"),
			tone: "text-sky-700 bg-sky-500/10",
			valueClassName: "text-sky-800",
			icon: "users" as const,
		},
		{
			id: "validated",
			label: "Active",
			value: stats.active.toLocaleString("en-US"),
			tone: "text-emerald-700 bg-emerald-500/10",
			valueClassName: "text-emerald-700",
			icon: "check" as const,
		},
		{
			id: "invalid",
			label: "Pending",
			value: stats.pending.toLocaleString("en-US"),
			tone: "text-amber-800 bg-amber-500/10",
			valueClassName: "text-amber-800",
			icon: "alert" as const,
		},
		{
			id: "missing",
			label: "Termed",
			value: stats.termed.toLocaleString("en-US"),
			tone: "text-red-700 bg-red-500/10",
			valueClassName: "text-red-600",
			icon: "circleAlert" as const,
		},
		{
			id: "impacted",
			label: "Inactive",
			value: stats.inactive.toLocaleString("en-US"),
			tone: "text-violet-700 bg-violet-500/10",
			valueClassName: "text-violet-700",
			icon: "file" as const,
		},
	];
}

export function deriveProviderFilterOptions(rows: CmsEdgeProviderListRow[]) {
	const uniq = (values: string[]) => [
		"All",
		...Array.from(new Set(values.filter(Boolean))).sort(),
	];

	return {
		status: uniq(rows.map((r) => r.status)),
		role: uniq(rows.map((r) => r.role)),
		networkStatus: uniq(rows.map((r) => r.networkStatus)),
		idQualifier: uniq(rows.map((r) => r.idQualifier)),
		errors: ["All", "Has errors", "No errors"] as const,
	};
}

export type CmsEdgeProviderDetailView = {
	id: string;
	name: string;
	npi: string;
	validated: boolean;
	roles: ProviderRole[];
	kpis: {
		id: string;
		label: string;
		value: string;
		icon: "building" | "stethoscope" | "shield" | "file" | "pill" | "alert";
		tone?: "default" | "success";
	}[];
	identificationLeft: { label: string; value: string }[];
	identificationRight: {
		label: string;
		value: string;
		tone?: "success";
	}[];
	npiValidation: {
		passed: number;
		warnings: number;
		errors: number;
		lastValidated: string;
		checks: { id: string; label: string; result: string }[];
	};
	medicalClaims: {
		id: string;
		claimId: string;
		uniqueEnrolleeId: string;
		providerRole: string;
		serviceDate: string;
		procedureCode: string;
		allowedAmount: string;
		planPaid: string;
		cmsStatus: ProviderClaimCmsStatus;
		errors: number;
	}[];
	pharmacyClaims: {
		id: string;
		claimId: string;
		uniqueEnrolleeId: string;
		providerRole: string;
		serviceDate: string;
		procedureCode: string;
		allowedAmount: string;
		planPaid: string;
		cmsStatus: ProviderClaimCmsStatus;
		errors: number;
	}[];
	errorHistory: {
		id: string;
		date: string;
		errorCode: string;
		description: string;
		claimsImpacted: number;
		status: ProviderErrorStatus;
		resolution: string;
		resolvedBy: string;
	}[];
	submissionHistory: {
		id: string;
		submissionType: string;
		reportingPeriod: string;
		submittedDate: string;
		status: string;
		fileName: string;
	}[];
	infoNote: string;
};

/** Adapt fixture provider detail → live view shape. */
export function providerMockDetailToView(
	detail: typeof CMS_EDGE_PROVIDER_DETAIL = CMS_EDGE_PROVIDER_DETAIL,
	overrideId?: string
): CmsEdgeProviderDetailView {
	return {
		id: overrideId ?? detail.id,
		name: detail.name,
		npi: detail.npi,
		validated: detail.validated,
		roles: [...detail.roles],
		kpis: detail.kpis.map((k) => ({
			id: k.id,
			label: k.label,
			value: k.value,
			icon: k.icon,
			tone: k.tone === "success" ? "success" : "default",
		})),
		identificationLeft: detail.identificationLeft.map((f) => ({
			label: f.label,
			value: f.value,
		})),
		identificationRight: detail.identificationRight.map((f) => ({
			label: f.label,
			value: f.value,
			tone: "tone" in f && f.tone === "success" ? "success" : undefined,
		})),
		npiValidation: {
			passed: detail.npiValidation.passed,
			warnings: detail.npiValidation.warnings,
			errors: detail.npiValidation.errors,
			lastValidated: detail.npiValidation.lastValidated,
			checks: detail.npiValidation.checks.map((c) => ({
				id: c.id,
				label: c.label,
				result: c.result,
			})),
		},
		medicalClaims: detail.medicalClaims.map((c) => ({ ...c })),
		pharmacyClaims: detail.pharmacyClaims.map((c) => ({ ...c })),
		errorHistory: detail.errorHistory.map((e) => ({ ...e })),
		submissionHistory: detail.submissionHistory.map((s) => ({ ...s })),
		infoNote: detail.infoNote,
	};
}

export function providerDtoToDetailView(
	dto: ProviderDto
): CmsEdgeProviderDetailView {
	const row = providerDtosToRows([dto])[0]!;
	const vendorName =
		typeof dto.vendor === "object" && dto.vendor
			? String((dto.vendor as { name?: string }).name ?? "—")
			: dash(typeof dto.vendor === "string" ? dto.vendor : undefined);

	const npiPass = Boolean(row.npi && /^\d{10}$/.test(row.npi));

	return {
		id: dto.id,
		name: row.name,
		npi: row.npi ?? "—",
		validated: row.status === "Valid",
		roles: [row.role],
		kpis: [
			{
				id: "type",
				label: "Entity Type",
				value: dash(dto.entity_type),
				icon: "building",
			},
			{
				id: "taxonomy",
				label: "Taxonomy",
				value: row.taxonomy,
				icon: "stethoscope",
			},
			{
				id: "network",
				label: "Network",
				value: row.networkStatus,
				icon: "shield",
				tone: "success",
			},
			{
				id: "medical",
				label: "Medical Claims (12m)",
				value: row.medicalClaims.toLocaleString("en-US"),
				icon: "file",
			},
			{
				id: "pharmacy",
				label: "Pharmacy Claims (12m)",
				value: row.pharmacyClaims.toLocaleString("en-US"),
				icon: "pill",
			},
			{
				id: "errors",
				label: "Open Exceptions",
				value: row.errors.toLocaleString("en-US"),
				icon: "alert",
			},
		],
		identificationLeft: [
			{ label: "Provider Name", value: row.name },
			{ label: "NPI", value: row.npi ?? "—" },
			{ label: "ID Qualifier", value: row.idQualifier },
			{ label: "Entity Type", value: dash(dto.entity_type) },
			{ label: "Taxonomy", value: row.taxonomy },
		],
		identificationRight: [
			{ label: "TIN", value: "—" },
			{ label: "Effective Date", value: formatDate(dto.effective_date) },
			{ label: "Termination Date", value: "—" },
			{ label: "Network Status", value: row.networkStatus, tone: "success" },
			{ label: "Source Vendor", value: vendorName },
			{ label: "Last Updated", value: formatDate(dto.updated_at) },
		],
		npiValidation: {
			passed: npiPass ? 1 : 0,
			warnings: 0,
			errors: npiPass ? 0 : 1,
			lastValidated: formatDate(dto.updated_at),
			checks: [
				{
					id: "format",
					label: "NPI format (10 digits)",
					result: npiPass ? "Pass" : "Fail",
				},
				{ id: "nppes", label: "NPPES registry", result: "—" },
				{ id: "active", label: "Active enumeration", result: "—" },
			],
		},
		medicalClaims: [],
		pharmacyClaims: [],
		errorHistory: [],
		submissionHistory: [],
		infoNote:
			"Provider identifiers are submitted within medical and pharmacy claims; no standalone CMS provider file is generated.",
	};
}

export type ProviderDetailEnrichment = {
	profile?: ProviderProfileDto | null;
	summary?: ProviderSummaryDto | null;
	recentClaims?: ProviderRecentActivityDto[];
	exceptions?: ProviderExceptionDto[];
	identifiers?: ProviderIdentifierDto[];
	networks?: ProviderNetworkDto[];
	locations?: ProviderLocationDto[];
	credentials?: ProviderCredentialDto[];
	vendorSources?: ProviderVendorSourceDto[];
};

function mapProviderClaimCmsStatus(raw: string): ProviderClaimCmsStatus {
	const s = raw.toLowerCase();
	if (s.includes("error") || s.includes("reject")) return "Error";
	if (s.includes("warn") || s.includes("pend")) return "Warning";
	return "CMS Ready";
}

function mapProviderErrorStatus(raw: string): ProviderErrorStatus {
	const s = raw.toLowerCase();
	if (s.includes("correct")) return "Corrected";
	if (s.includes("resolv") || s.includes("clos")) return "Resolved";
	return "Open";
}

function money(value: number | string | null | undefined): string {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return "—";
	return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Merge profile + summary + nested tabs into EDGE provider detail view. */
export function providerDtoToDetailViewEnriched(
	dto: ProviderDto,
	enrichment: ProviderDetailEnrichment = {}
): CmsEdgeProviderDetailView {
	const base = providerDtoToDetailView(dto);
	const {
		profile,
		summary,
		recentClaims = [],
		exceptions = [],
		identifiers = [],
		networks = [],
		locations = [],
		credentials = [],
		vendorSources = [],
	} = enrichment;
	const row = providerDtosToRows([dto])[0]!;

	const taxonomy =
		profile?.taxonomy_description?.trim() ||
		profile?.specialty?.trim() ||
		row.taxonomy;

	const primaryNetwork =
		networks.find((n) => (n.status ?? "").toLowerCase().includes("active")) ??
		networks[0];
	const networkStatus = primaryNetwork
		? (primaryNetwork.status ?? "").toLowerCase().includes("term") ||
			(primaryNetwork.status ?? "").toLowerCase().includes("out")
			? ("Out-of-Network" as const)
			: ("In-Network" as const)
		: summary?.enrollment_status?.toLowerCase().includes("term") ||
			  summary?.status?.toLowerCase().includes("inact")
			? ("Out-of-Network" as const)
			: row.networkStatus;

	const validated =
		summary?.status != null
			? summary.status.toLowerCase().includes("active") ||
				summary.status.toLowerCase() === "valid"
			: base.validated;

	const tinId = identifiers.find((id) =>
		/tin|tax|ein/i.test(`${id.label ?? ""} ${id.value ?? ""}`)
	);
	const tin = tinId?.value?.trim() || "—";

	const medicalFromRecent = recentClaims
		.filter((c) => {
			const t = (c.type ?? "").toLowerCase();
			return !t.includes("pharm");
		})
		.map((c) => ({
			id: c.id,
			claimId: c.claim_number || c.id,
			uniqueEnrolleeId: c.member_id || c.member_name || "—",
			providerRole: row.role,
			serviceDate: formatDate(c.dos || c.received_date),
			procedureCode: dash(c.procedure_code),
			allowedAmount: money(c.billed),
			planPaid: money(c.paid),
			cmsStatus: mapProviderClaimCmsStatus(String(c.status ?? "")),
			errors: 0,
		}));

	const pharmacyFromRecent = recentClaims
		.filter((c) => (c.type ?? "").toLowerCase().includes("pharm"))
		.map((c) => ({
			id: c.id,
			claimId: c.claim_number || c.id,
			uniqueEnrolleeId: c.member_id || c.member_name || "—",
			providerRole: "Dispensing" as const,
			serviceDate: formatDate(c.dos || c.received_date),
			procedureCode: dash(c.procedure_code),
			allowedAmount: money(c.billed),
			planPaid: money(c.paid),
			cmsStatus: mapProviderClaimCmsStatus(String(c.status ?? "")),
			errors: 0,
		}));

	const errorHistory = exceptions.map((e) => ({
		id: e.id,
		date: formatDate(e.date_identified || e.created_at),
		errorCode: e.exception_type || e.reference_id || "—",
		description: e.description || "—",
		claimsImpacted: 0,
		status: mapProviderErrorStatus(String(e.status ?? "")),
		resolution: e.status || "—",
		resolvedBy: "—",
	}));

	const primaryLocation =
		locations.find((l) => l.is_primary) ?? locations[0] ?? null;
	const locationLabel = primaryLocation
		? [
				primaryLocation.name,
				primaryLocation.address_line1,
				[
					primaryLocation.city,
					primaryLocation.state,
					primaryLocation.postal_code,
				]
					.filter(Boolean)
					.join(" "),
			]
				.filter(Boolean)
				.join(", ")
		: formatPracticeLocation(profile);

	const credentialLabel =
		credentials[0]?.label ||
		credentials[0]?.issuer ||
		profile?.credentials ||
		"—";

	const vendorSourceLabel =
		vendorSources[0]?.vendor_name ||
		vendorSources[0]?.file_type ||
		(typeof dto.vendor === "object" && dto.vendor
			? String((dto.vendor as { name?: string }).name ?? "—")
			: dash(typeof dto.vendor === "string" ? dto.vendor : undefined));

	const medicalClaimsCount =
		medicalFromRecent.length || summary?.claims12m || row.medicalClaims;
	const pharmacyClaimsCount = pharmacyFromRecent.length;
	const openExceptions =
		exceptions.filter(
			(e) => mapProviderErrorStatus(String(e.status ?? "")) === "Open"
		).length ||
		summary?.open_exception_count ||
		(dto.tab_counts?.exception_count != null
			? Number(dto.tab_counts.exception_count)
			: row.errors);

	const idQualifier =
		identifiers.find((id) => /npi/i.test(id.label ?? ""))?.label ||
		row.idQualifier;

	return {
		...base,
		name: summary?.name?.trim() || profile?.practice_name?.trim() || base.name,
		npi: summary?.npi?.trim() || base.npi,
		validated,
		roles: profile?.provider_type
			? [
					profile.provider_type.toLowerCase().includes("dispens")
						? ("Dispensing" as ProviderRole)
						: profile.provider_type.toLowerCase().includes("render")
							? ("Rendering" as ProviderRole)
							: ("Billing" as ProviderRole),
				]
			: base.roles,
		kpis: [
			{
				id: "type",
				label: "Entity Type",
				value: dash(profile?.provider_type || dto.entity_type),
				icon: "building",
			},
			{
				id: "taxonomy",
				label: "Taxonomy",
				value: taxonomy,
				icon: "stethoscope",
			},
			{
				id: "network",
				label: "Network",
				value: networkStatus,
				icon: "shield",
				tone: networkStatus === "In-Network" ? "success" : "default",
			},
			{
				id: "medical",
				label: "Medical Claims (12m)",
				value: Number(medicalClaimsCount).toLocaleString("en-US"),
				icon: "file",
			},
			{
				id: "pharmacy",
				label: "Pharmacy Claims (12m)",
				value: Number(pharmacyClaimsCount).toLocaleString("en-US"),
				icon: "pill",
			},
			{
				id: "errors",
				label: "Open Exceptions",
				value: Number(openExceptions).toLocaleString("en-US"),
				icon: "alert",
			},
		],
		identificationLeft: [
			{ label: "Provider Name", value: base.name },
			{ label: "NPI", value: base.npi },
			{ label: "ID Qualifier", value: String(idQualifier) },
			{
				label: "Entity Type",
				value: dash(profile?.provider_type || dto.entity_type),
			},
			{ label: "Taxonomy", value: taxonomy },
			{
				label: "Specialty",
				value: dash(profile?.specialty || profile?.subspecialty),
			},
			{ label: "Credential", value: dash(String(credentialLabel)) },
		],
		identificationRight: [
			{ label: "TIN", value: tin },
			{
				label: "Effective Date",
				value: formatDate(
					primaryNetwork?.effective_date ||
						profile?.enrollment_effective ||
						dto.effective_date
				),
			},
			{
				label: "Termination Date",
				value: formatDate(primaryNetwork?.end_date),
			},
			{
				label: "Enrollment Status",
				value: dash(profile?.enrollment_status || summary?.enrollment_status),
			},
			{
				label: "Network Status",
				value: networkStatus,
				tone: networkStatus === "In-Network" ? "success" : undefined,
			},
			{ label: "Source Vendor", value: dash(String(vendorSourceLabel)) },
			{ label: "Practice Location", value: locationLabel },
			{
				label: "Last Updated",
				value: formatDate(profile?.updated_at || dto.updated_at),
			},
		],
		npiValidation: {
			...base.npiValidation,
			lastValidated: formatDate(
				profile?.updated_at || summary?.data_as_of || dto.updated_at
			),
		},
		medicalClaims: medicalFromRecent,
		pharmacyClaims: pharmacyFromRecent,
		errorHistory,
		submissionHistory: vendorSources.map((vs, i) => ({
			id: vs.id || `vs-${i}`,
			submissionType: "Vendor source",
			reportingPeriod: "—",
			submittedDate: formatDate(vs.received_at),
			status: dash(vs.status),
			fileName: dash(vs.original_filename || vs.file_type || vs.vendor_name),
		})),
	};
}

function formatPracticeLocation(profile?: ProviderProfileDto | null): string {
	if (!profile) return "—";
	const parts = [
		profile.practice_address_line1,
		profile.practice_address_line2,
		[
			profile.practice_city,
			profile.practice_state,
			profile.practice_postal_code,
		]
			.filter(Boolean)
			.join(" "),
	].filter(Boolean);
	return parts.length ? parts.join(", ") : "—";
}

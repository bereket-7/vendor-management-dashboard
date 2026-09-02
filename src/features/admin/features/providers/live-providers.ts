import type {
	ProviderCredentialDto,
	ProviderDto,
	ProviderExceptionDto,
	ProviderIdentifierDto,
	ProviderLocationDto,
	ProviderMonthlyVolumeDto,
	ProviderNetworkDto,
	ProviderProfileDto,
	ProviderRecentActivityDto,
	ProviderRejectionReasonDto,
	ProviderRosterRef,
	ProviderSummaryDto,
	ProviderVendorSourceDto,
} from "@/lib/vendor-core/types";
import type {
	ClaimActivityStatus,
	FeedStatus,
	ProviderClaimRow,
	ProviderDetail,
	ProviderStatus,
	ProviderSummary,
} from "@/features/admin/features/providers/mock-data";

export const TAXONOMY_LABELS: Record<string, string> = {
	"207R00000X": "Internal Medicine",
	"207Q00000X": "Family Medicine",
	"207RC0000X": "Cardiology",
	"208000000X": "Pediatrics",
	"207X00000X": "Orthopedic Surgery",
	"2084P0800X": "Psychiatry",
	"207V00000X": "OB/GYN",
	"207N00000X": "Dermatology",
	"2084N0400X": "Neurology",
	"207P00000X": "Emergency Medicine",
};

function parseGender(raw?: string | null): ProviderSummary["gender"] {
	const value = (raw ?? "unknown").toLowerCase();
	if (value === "male") return "Male";
	if (value === "female") return "Female";
	if (value === "other") return "Other";
	return "Unknown";
}

function parseEnrollmentStatus(
	raw?: string | null
): ProviderSummary["enrollmentStatus"] {
	const value = (raw ?? "").toLowerCase();
	if (value.includes("term")) return "terminated";
	if (value.includes("pend")) return "pending";
	return "enrolled";
}

function parseProgram(raw?: string | null): ProviderSummary["program"] {
	const value = (raw ?? "DHCF").toUpperCase();
	if (value === "MDH" || value === "BHP") return value;
	return "DHCF";
}

function formatAddress(parts: Array<string | undefined | null>): string {
	const joined = parts
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part))
		.join(", ");
	return joined || "—";
}

function identifierValue(
	identifiers: ProviderIdentifierDto[] | undefined,
	label: string,
	fallback?: string
): string {
	const hit = identifiers?.find(
		(row) => row.label.trim().toLowerCase() === label.toLowerCase()
	);
	return hit?.value?.trim() || fallback || "—";
}

export type ProviderDetailContext = {
	profile?: ProviderProfileDto | null;
	summary?: ProviderSummaryDto | null;
	locations?: ProviderLocationDto[];
	identifiers?: ProviderIdentifierDto[];
	networks?: ProviderNetworkDto[];
	credentials?: ProviderCredentialDto[];
	exceptions?: ProviderExceptionDto[];
	vendorSources?: ProviderVendorSourceDto[];
	monthlyVolume?: ProviderMonthlyVolumeDto[];
	rejectionReasons?: ProviderRejectionReasonDto[];
	recentClaims?: ProviderRecentActivityDto[];
	recentEncounters?: ProviderRecentActivityDto[];
};

function mapLocations(
	rows: ProviderLocationDto[]
): ProviderDetail["locations"] {
	return rows.map((row) => ({
		id: row.id,
		name: dash(row.name),
		address: formatAddress([
			row.address_line1,
			row.address_line2,
			[row.city, row.state, row.postal_code].filter(Boolean).join(" "),
		]),
		phone: dash(row.phone),
		status: parseStatus(row.status),
		isPrimary: row.is_primary,
	}));
}

function mapNetworks(rows: ProviderNetworkDto[]): ProviderDetail["networks"] {
	return rows.map((row) => ({
		id: row.id,
		networkPlan: dash(row.network_plan),
		payer: dash(row.payer),
		status: (row.status ||
			"pending") as ProviderDetail["networks"][number]["status"],
		effectiveDate: row.effective_date?.slice(0, 10) ?? "—",
		endDate: row.end_date?.slice(0, 10) ?? null,
	}));
}

function mapCredentials(
	rows: ProviderCredentialDto[]
): ProviderDetail["credentialing"] {
	return rows.map((row) => ({
		id: row.id,
		label: dash(row.label),
		status: (row.status ||
			"pending") as ProviderDetail["credentialing"][number]["status"],
		issuer: dash(row.issuer),
		verifiedDate: row.verified_date?.slice(0, 10) ?? null,
		expirationDate: row.expiration_date?.slice(0, 10) ?? null,
	}));
}

function mapExceptions(
	rows: ProviderExceptionDto[]
): ProviderDetail["exceptions"] {
	return rows.map((row) => ({
		id: row.id,
		exceptionType: dash(row.exception_type),
		description: dash(row.description),
		status: (row.status ||
			"open") as ProviderDetail["exceptions"][number]["status"],
		dateIdentified: row.date_identified?.slice(0, 10) ?? "—",
	}));
}

function mapVendorSources(
	rows: ProviderVendorSourceDto[]
): ProviderDetail["vendors"] {
	return rows.map((row) => {
		const feedStatus = (row.status ?? "active").toLowerCase();
		const status: FeedStatus =
			feedStatus === "warning"
				? "warning"
				: feedStatus === "inactive"
					? "inactive"
					: "active";
		return {
			id: row.id,
			vendor: dash(row.vendor_name),
			fileType: dash(row.file_type) || "provider_roster",
			dataSent: dash(row.data_sent) !== "—" ? row.data_sent!.trim() : "Provider roster",
			frequency: dash(row.frequency),
			lastReceived: row.received_at?.slice(0, 10) ?? "—",
			status,
		};
	});
}

function mapMonthlyVolume(
	rows: ProviderMonthlyVolumeDto[]
): ProviderDetail["monthlyVolume"] {
	return rows.map((row) => ({
		month: row.month,
		claims: row.claims,
		encounters: row.encounters,
		rejectionRate: row.rejection_rate,
		rejectionCount: row.rejection_count,
	}));
}

function mapRejectionReasons(
	rows: ProviderRejectionReasonDto[]
): ProviderDetail["rejectionReasons"] {
	return rows.map((row) => ({
		id: row.id,
		reason: row.reason,
		count: row.count,
		pct: row.pct,
	}));
}

function parseActivityStatus(raw: string): ClaimActivityStatus {
	const value = raw.toLowerCase();
	if (value === "paid") return "paid";
	if (value === "denied") return "denied";
	if (value === "rejected") return "rejected";
	if (value === "accepted") return "accepted";
	return "pending";
}

function parseActivityType(
	raw: string
): ProviderClaimRow["type"] {
	const value = raw.toLowerCase();
	if (value.includes("institutional")) return "Institutional";
	if (value.includes("encounter")) return "Encounter";
	return "Professional";
}

function mapRecentActivity(
	rows: ProviderRecentActivityDto[]
): ProviderClaimRow[] {
	return rows.map((row) => ({
		id: row.id,
		dos: row.dos?.slice(0, 10) ?? "—",
		receivedDate: row.received_date?.slice(0, 10) ?? "—",
		claimNumber: row.claim_number || "—",
		memberId: row.member_id || "—",
		memberName: row.member_name || "—",
		type: parseActivityType(row.type),
		procedureCode: row.procedure_code || "—",
		billed: Number(row.billed) || 0,
		paid: Number(row.paid) || 0,
		status: parseActivityStatus(row.status),
		vendor: row.vendor || "—",
	}));
}

function num(value: unknown, fallback = 0): number {
	if (value == null || value === "") return fallback;
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function buildIdentifierRows(
	provider: ProviderDto,
	identifiers: ProviderIdentifierDto[] | undefined
): ProviderDetail["identifiers"] {
	const rows: ProviderDetail["identifiers"] = [
		{ id: "npi", label: "NPI", value: dash(provider.npi) },
		{
			id: "reference",
			label: "Reference ID",
			value: dash(provider.reference_id),
		},
		{
			id: "taxonomy",
			label: "Taxonomy",
			value: dash(provider.taxonomy),
		},
		{
			id: "entity",
			label: "Entity type",
			value: dash(provider.entity_type),
		},
	];
	const seen = new Set(rows.map((row) => row.label.toLowerCase()));
	for (const row of identifiers ?? []) {
		const label = row.label.trim();
		if (!label) continue;
		const key = label.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		rows.push({ id: row.id, label, value: dash(row.value) });
	}
	const metadataExtras: Array<[string, string]> = [
		["tax_id", "Tax ID"],
		["upin", "UPIN"],
		["medicaid_id", "Medicaid ID"],
		["state_license", "State license"],
		["dea", "DEA"],
	];
	for (const [key, label] of metadataExtras) {
		if (seen.has(label.toLowerCase())) continue;
		const value = metaString(provider.metadata, key);
		if (value) rows.push({ id: key, label, value });
	}
	return rows;
}

function parseStatus(raw?: string | null): ProviderStatus {
	const value = (raw ?? "active").toLowerCase();
	if (value.includes("term")) return "termed";
	if (value.includes("pend")) return "pending";
	if (value.includes("inact")) return "inactive";
	return "active";
}

function parseProviderType(
	entityType?: string | null
): ProviderSummary["providerType"] {
	const value = (entityType ?? "1").toLowerCase();
	if (value === "2" || value.includes("group")) return "Group";
	if (value === "3" || value.includes("facil")) return "Facility";
	return "Individual";
}

export function parseNameParts(name: string): {
	displayName: string;
	credentials: string;
} {
	const comma = name.lastIndexOf(",");
	if (comma < 0) return { displayName: name, credentials: "" };
	return {
		displayName: name.slice(0, comma).trim(),
		credentials: name.slice(comma + 1).trim(),
	};
}

function metaString(
	metadata: Record<string, unknown> | null | undefined,
	key: string
): string | undefined {
	const value = metadata?.[key];
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseSeedMeta(rawObjectId?: string | null): {
	specialty?: string;
	practiceName?: string;
} {
	if (!rawObjectId) return {};
	const parts = rawObjectId.split("|");
	return {
		specialty: parts[1] || undefined,
		practiceName: parts[2] || undefined,
	};
}

function vendorLabel(provider: ProviderDto): string | undefined {
	const vendor = provider.vendor;
	if (vendor && typeof vendor === "object") {
		return vendor.legal_name || vendor.vendor_code;
	}
	if (typeof vendor === "string" && vendor.trim()) return vendor;
	const roster = provider.roster_file;
	if (roster && typeof roster === "object") {
		const nested = roster.vendor;
		if (nested && typeof nested === "object") {
			return nested.legal_name || nested.vendor_code;
		}
		if (typeof nested === "string" && nested.trim()) return nested;
	}
	return undefined;
}

function rosterRef(provider: ProviderDto): ProviderRosterRef | null {
	const roster = provider.roster_file;
	if (roster && typeof roster === "object") return roster;
	return null;
}

function dash(value?: string | null): string {
	const trimmed = value?.trim();
	return trimmed ? trimmed : "—";
}

function enrollmentFromStatus(
	status: ProviderStatus
): ProviderSummary["enrollmentStatus"] {
	if (status === "termed") return "terminated";
	if (status === "pending") return "pending";
	return "enrolled";
}

/** Map vendor-core providers into the admin provider directory row shape. */
export function providersToSummaries(
	providers: ProviderDto[],
	program: ProviderSummary["program"] = "DHCF",
	identifiersByProviderId?: Record<string, ProviderIdentifierDto[]>
): ProviderSummary[] {
	return providers.map((provider) => {
		const profile = provider.profile;
		const identifiers = identifiersByProviderId?.[provider.id];
		const { displayName, credentials } = parseNameParts(provider.name);
		const seed = parseSeedMeta(provider.raw_object_id);
		const resolvedProgram = parseProgram(profile?.program || program);
		const specialty =
			profile?.specialty?.trim() ||
			metaString(provider.metadata, "specialty") ||
			seed.specialty ||
			TAXONOMY_LABELS[provider.taxonomy ?? ""] ||
			"—";
		const practiceName =
			profile?.practice_name?.trim() ||
			metaString(provider.metadata, "practice") ||
			seed.practiceName ||
			vendorLabel(provider) ||
			(typeof provider.roster_file === "object"
				? provider.roster_file?.original_filename
				: undefined) ||
			"—";
		const status = parseStatus(provider.status);
		const taxId =
			identifierValue(identifiers, "Tax ID") !== "—"
				? identifierValue(identifiers, "Tax ID")
				: (metaString(provider.metadata, "tax_id") ?? "—");
		const upin =
			identifierValue(identifiers, "UPIN") !== "—"
				? identifierValue(identifiers, "UPIN")
				: (metaString(provider.metadata, "upin") ?? "—");
		const medicaidId =
			identifierValue(identifiers, "Medicaid ID") !== "—"
				? identifierValue(identifiers, "Medicaid ID")
				: (metaString(provider.metadata, "medicaid_id") ?? "—");

		return {
			id: provider.id,
			npi: provider.npi,
			name: profile?.first_name
				? [profile.first_name, profile.middle_name, profile.last_name]
						.filter(Boolean)
						.join(" ")
						.trim() || displayName
				: displayName,
			credentials: profile?.credentials?.trim() || credentials,
			specialty,
			subspecialty:
				profile?.subspecialty?.trim() ||
				metaString(provider.metadata, "subspecialty") ||
				"—",
			taxId,
			upin,
			medicaidId,
			status,
			program: resolvedProgram,
			providerType: profile?.provider_type
				? (profile.provider_type as ProviderSummary["providerType"])
				: parseProviderType(provider.entity_type),
			gender: parseGender(profile?.gender),
			dob: profile?.dob?.slice(0, 10) ?? "—",
			yearsInPractice: 0,
			practiceName,
			practiceAddress: "—",
			practicePhone: dash(profile?.phone),
			enrollmentStatus: profile?.enrollment_status
				? parseEnrollmentStatus(profile.enrollment_status)
				: enrollmentFromStatus(status),
			enrollmentEffective:
				profile?.enrollment_effective?.slice(0, 10) ??
				provider.effective_date?.slice(0, 10) ??
				"—",
			claims12m: provider.claims12m ?? 0,
			encounters12m: 0,
			billed12m: 0,
			paid12m: provider.paid12m ?? 0,
			rejectionRate: provider.rejection_rate ?? 0,
			netPayment12m: provider.paid12m ?? 0,
		};
	});
}

export function findProviderSummaryById(
	providers: ProviderDto[],
	id: string,
	program?: ProviderSummary["program"]
): ProviderSummary | undefined {
	return providersToSummaries(providers, program).find((row) => row.id === id);
}

function splitPersonName(displayName: string): {
	firstName: string;
	middleName: string | null;
	lastName: string;
} {
	const parts = displayName.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return { firstName: "—", middleName: null, lastName: "—" };
	}
	if (parts.length === 1) {
		return { firstName: parts[0]!, middleName: null, lastName: "—" };
	}
	return {
		firstName: parts[0]!,
		middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : null,
		lastName: parts[parts.length - 1]!,
	};
}

function identifierRows(provider: ProviderDto): ProviderDetail["identifiers"] {
	return buildIdentifierRows(provider, undefined);
}

/** Map a vendor-core provider into the admin detail shell from live API data. */
export function providerDtoToDetail(
	dto: ProviderDto,
	program: ProviderSummary["program"] = "DHCF",
	context: ProviderDetailContext = {}
): ProviderDetail {
	const {
		profile,
		summary: summaryDto,
		locations = [],
		identifiers = [],
		networks = [],
		credentials = [],
		exceptions = [],
		vendorSources = [],
		monthlyVolume = [],
		rejectionReasons = [],
		recentClaims = [],
		recentEncounters = [],
	} = context;
	const mergedDto =
		profile && !dto.profile
			? {
					...dto,
					profile: {
						id: profile.id,
						first_name: profile.first_name,
						last_name: profile.last_name,
						middle_name: profile.middle_name,
						suffix: profile.suffix,
						credentials: profile.credentials,
						gender: profile.gender,
						dob: profile.dob,
						email: profile.email,
						phone: profile.phone,
						specialty: profile.specialty,
						subspecialty: profile.subspecialty,
						program: profile.program,
						provider_type: profile.provider_type,
						enrollment_status: profile.enrollment_status,
						enrollment_effective: profile.enrollment_effective,
						practice_name: profile.practice_name,
						accepting_new_patients: profile.accepting_new_patients,
					},
				}
			: dto;
	const summary = providersToSummaries(
		[mergedDto],
		program,
		identifiers.length ? { [dto.id]: identifiers } : undefined
	)[0]!;
	const person = profile?.first_name
		? {
				firstName: dash(profile.first_name),
				middleName: profile.middle_name?.trim() || null,
				lastName: dash(profile.last_name),
			}
		: splitPersonName(summary.name);
	const taxonomyDescription =
		profile?.taxonomy_description?.trim() ||
		TAXONOMY_LABELS[dto.taxonomy ?? ""] ||
		summary.specialty;
	const roster = rosterRef(dto);
	const mappedLocations = mapLocations(locations);
	const mappedVendors = mapVendorSources(vendorSources);

	return {
		...summary,
		...person,
		preferredName: null,
		suffix: profile?.suffix?.trim() || summary.credentials || null,
		email: dash(profile?.email),
		fax: dash(profile?.fax),
		preferredLanguage: "—",
		race: "—",
		ethnicity: "—",
		taxonomyCode: dash(dto.taxonomy),
		taxonomyDescription,
		boardCertification: dash(profile?.board_certification),
		medicalSchool: dash(profile?.medical_school),
		graduationYear: profile?.graduation_year ?? 0,
		yearsInPractice: profile?.years_in_practice ?? summary.yearsInPractice,
		acceptingNewPatients: profile?.accepting_new_patients ?? true,
		mailingAddress: dash(profile?.mailing_address),
		practiceCity: dash(profile?.practice_city),
		practiceState: dash(profile?.practice_state),
		practiceZip: dash(profile?.practice_postal_code),
		practiceAddress: formatAddress([
			profile?.practice_address_line1,
			profile?.practice_address_line2,
			[
				profile?.practice_city,
				profile?.practice_state,
				profile?.practice_postal_code,
			]
				.filter(Boolean)
				.join(" "),
		]),
		practicePhone: dash(profile?.phone) || summary.practicePhone,
		website: profile?.website?.trim() || null,
		stateLicense:
			profile?.state_license?.trim() ||
			metaString(dto.metadata, "state_license") ||
			"—",
		deaNumber:
			profile?.dea_number?.trim() || metaString(dto.metadata, "dea") || "—",
		locations:
			mappedLocations.length > 0
				? mappedLocations
				: summary.practiceName !== "—"
					? [
							{
								id: `${dto.id}-practice`,
								name: summary.practiceName,
								address: summary.practiceAddress,
								phone: summary.practicePhone,
								status: summary.status,
								isPrimary: true,
							},
						]
					: [],
		networks: mapNetworks(networks),
		identifiers: buildIdentifierRows(dto, identifiers),
		monthlyVolume: mapMonthlyVolume(monthlyVolume),
		rejectionReasons: mapRejectionReasons(rejectionReasons),
		recentClaims: mapRecentActivity(recentClaims),
		recentEncounters: mapRecentActivity(recentEncounters),
		vendors:
			mappedVendors.length > 0
				? mappedVendors
				: roster || vendorLabel(dto)
					? [
							{
								id: dto.vendor_id ?? dto.roster_file_id ?? dto.id,
								vendor: vendorLabel(dto) ?? "—",
								fileType:
									roster?.original_filename?.split(".").pop() || program,
								dataSent: "Provider roster",
								frequency: "—",
								lastReceived:
									roster?.received_at?.slice(0, 10) ??
									dto.updated_at?.slice(0, 10) ??
									"—",
								status: "active" satisfies FeedStatus,
							},
						]
					: [],
		credentialing: mapCredentials(credentials),
		exceptions: mapExceptions(exceptions),
		claims12m: summaryDto?.claims12m ?? summary.claims12m,
		encounters12m: summaryDto?.encounters12m ?? summary.encounters12m,
		billed12m: num(summaryDto?.billed12m, summary.billed12m),
		paid12m: num(summaryDto?.paid12m, summary.paid12m),
		rejectionRate: num(summaryDto?.rejection_rate, summary.rejectionRate),
		netPayment12m: num(summaryDto?.net_payment12m, summary.netPayment12m),
		claimsTrendPct: num(summaryDto?.claims_trend_pct),
		encountersTrendPct: num(summaryDto?.encounters_trend_pct),
		billedTrendPct: num(summaryDto?.billed_trend_pct),
		paidTrendPct: num(summaryDto?.paid_trend_pct),
		rejectionTrendPct: num(summaryDto?.rejection_trend_pct),
		netPaymentTrendPct: num(summaryDto?.net_payment_trend_pct),
		dataAsOf:
			summaryDto?.data_as_of?.slice(0, 10) ??
			dto.updated_at?.slice(0, 10) ??
			new Date().toISOString().slice(0, 10),
	};
}

export function isProviderUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		value
	);
}

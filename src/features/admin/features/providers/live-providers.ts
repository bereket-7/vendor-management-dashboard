import type {
	ProviderSummary,
	ProviderStatus,
} from "@/features/admin/features/providers/mock-data";
import type { ProviderDto } from "@/lib/vendor-core/types";

const TAXONOMY_LABELS: Record<string, string> = {
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

function parseStatus(raw?: string | null): ProviderStatus {
	const value = (raw ?? "active").toLowerCase();
	if (value.includes("term")) return "termed";
	if (value.includes("pend")) return "pending";
	if (value.includes("inact")) return "inactive";
	return "active";
}

function parseProviderType(entityType?: string | null): ProviderSummary["providerType"] {
	const value = (entityType ?? "1").toLowerCase();
	if (value === "2" || value.includes("group")) return "Group";
	if (value === "3" || value.includes("facil")) return "Facility";
	return "Individual";
}

function parseNameParts(name: string): { displayName: string; credentials: string } {
	const comma = name.lastIndexOf(",");
	if (comma < 0) return { displayName: name, credentials: "" };
	return {
		displayName: name.slice(0, comma).trim(),
		credentials: name.slice(comma + 1).trim(),
	};
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

function hashNumber(input: string, min: number, max: number): number {
	let hash = 0;
	for (let i = 0; i < input.length; i += 1) {
		hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
	}
	return min + (hash % (max - min + 1));
}

/** Map vendor-core providers into the admin provider directory row shape. */
export function providersToSummaries(
	providers: ProviderDto[],
	program: ProviderSummary["program"] = "DHCF"
): ProviderSummary[] {
	return providers.map((provider, index) => {
		const { displayName, credentials } = parseNameParts(provider.name);
		const meta = parseSeedMeta(provider.raw_object_id);
		const specialty =
			meta.specialty ||
			TAXONOMY_LABELS[provider.taxonomy ?? ""] ||
			"General Practice";
		const claims12m = hashNumber(provider.npi, 4200, 10200);
		const billed12m = hashNumber(`${provider.npi}-billed`, 1_800_000, 4_800_000);
		const paid12m = Math.round(billed12m * 0.755);
		const status = parseStatus(provider.status);

		return {
			id: provider.id,
			npi: provider.npi,
			name: displayName,
			credentials,
			specialty,
			subspecialty: specialty === "Internal Medicine" ? "Primary Care" : "General",
			taxId: `${12 + (index % 80)}-${hashNumber(provider.npi, 1_000_000, 9_999_999)}`,
			upin: `A${hashNumber(provider.npi, 10_000, 99_999)}`,
			medicaidId: `DC-MD-${String(240000 + index).padStart(6, "0")}`,
			status,
			program,
			providerType: parseProviderType(provider.entity_type),
			gender: index % 2 === 0 ? "Male" : "Female",
			dob: `19${60 + (index % 25)}-${String((index % 12) + 1).padStart(2, "0")}-${String(10 + (index % 18)).padStart(2, "0")}`,
			yearsInPractice: 8 + (index % 25),
			practiceName:
				meta.practiceName || provider.vendor || provider.roster_file || "—",
			practiceAddress: `${100 + index * 11} K St NW, Washington, DC 200${10 + (index % 40)}`,
			practicePhone: `(202) ${555 + (index % 40)}-${2000 + ((index * 13) % 7000)}`,
			enrollmentStatus:
				status === "termed"
					? "terminated"
					: status === "pending"
						? "pending"
						: "enrolled",
			enrollmentEffective: provider.effective_date ?? "2022-01-15",
			claims12m,
			encounters12m: Math.round(claims12m * 0.84),
			billed12m,
			paid12m,
			rejectionRate: Math.round((4.2 + (index % 5) * 0.37) * 100) / 100,
			netPayment12m: Math.round(paid12m * 0.89),
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

import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { fixtureRecord, isMockEnabled } from "@/lib/mock-mode";

export type ProviderStatus = "active" | "inactive" | "pending" | "termed";
export type NetworkStatus = "in_network" | "out_of_network" | "pending";
export type CredentialStatus = "complete" | "expiring" | "expired" | "pending";
export type ExceptionStatus = "open" | "in_progress" | "resolved";
export type FeedStatus = "active" | "warning" | "inactive";

export type ProviderSummary = {
	id: string;
	npi: string;
	name: string;
	credentials: string;
	specialty: string;
	subspecialty: string;
	taxId: string;
	upin: string;
	medicaidId: string;
	status: ProviderStatus;
	program: "MDH" | "DHCF" | "BHP";
	providerType: "Individual" | "Group" | "Facility";
	gender: "Male" | "Female" | "Other" | "Unknown";
	dob: string;
	yearsInPractice: number;
	practiceName: string;
	practiceAddress: string;
	practicePhone: string;
	enrollmentStatus: "enrolled" | "pending" | "terminated";
	enrollmentEffective: string;
	claims12m: number;
	encounters12m: number;
	billed12m: number;
	paid12m: number;
	rejectionRate: number;
	netPayment12m: number;
};

export type ProviderLocation = {
	id: string;
	name: string;
	address: string;
	phone: string;
	status: ProviderStatus;
	isPrimary: boolean;
};

export type NetworkParticipation = {
	id: string;
	networkPlan: string;
	payer: string;
	status: NetworkStatus;
	effectiveDate: string;
	endDate: string | null;
};

export type ProviderIdentifier = {
	id: string;
	label: string;
	value: string;
};

export type MonthlyVolume = {
	month: string;
	claims: number;
	encounters: number;
	rejectionRate: number;
	rejectionCount: number;
};

export type RejectionReason = {
	id: string;
	reason: string;
	count: number;
	pct: number;
};

export type VendorAssociation = {
	id: string;
	vendor: string;
	fileType: string;
	dataSent: string;
	frequency: string;
	lastReceived: string;
	status: FeedStatus;
};

export type CredentialItem = {
	id: string;
	label: string;
	status: CredentialStatus;
	issuer: string;
	verifiedDate: string | null;
	expirationDate: string | null;
};

export type ProviderException = {
	id: string;
	exceptionType: string;
	description: string;
	status: ExceptionStatus;
	dateIdentified: string;
};

export type ClaimActivityStatus =
	| "paid"
	| "denied"
	| "pending"
	| "rejected"
	| "accepted";

export type ProviderClaimRow = {
	id: string;
	dos: string;
	receivedDate: string;
	claimNumber: string;
	memberId: string;
	memberName: string;
	type: "Professional" | "Institutional" | "Encounter";
	procedureCode: string;
	billed: number;
	paid: number;
	status: ClaimActivityStatus;
	vendor: string;
};

export type ProviderDemographics = {
	firstName: string;
	middleName: string | null;
	lastName: string;
	preferredName: string | null;
	suffix: string | null;
	email: string;
	fax: string;
	preferredLanguage: string;
	race: string;
	ethnicity: string;
	taxonomyCode: string;
	taxonomyDescription: string;
	boardCertification: string;
	medicalSchool: string;
	graduationYear: number;
	acceptingNewPatients: boolean;
	mailingAddress: string;
	practiceCity: string;
	practiceState: string;
	practiceZip: string;
	website: string | null;
};

export type ProviderDetail = ProviderSummary &
	ProviderDemographics & {
		stateLicense: string;
		deaNumber: string;
		locations: ProviderLocation[];
		networks: NetworkParticipation[];
		identifiers: ProviderIdentifier[];
		monthlyVolume: MonthlyVolume[];
		rejectionReasons: RejectionReason[];
		recentClaims: ProviderClaimRow[];
		recentEncounters: ProviderClaimRow[];
		vendors: VendorAssociation[];
		credentialing: CredentialItem[];
		exceptions: ProviderException[];
		claimsTrendPct: number;
		encountersTrendPct: number;
		billedTrendPct: number;
		paidTrendPct: number;
		rejectionTrendPct: number;
		netPaymentTrendPct: number;
		dataAsOf: string;
	};

const SPECIALTIES = [
	["Internal Medicine", "Primary Care"],
	["Family Medicine", "Primary Care"],
	["Cardiology", "Interventional"],
	["Pediatrics", "General Pediatrics"],
	["Orthopedic Surgery", "Sports Medicine"],
	["Psychiatry", "Adult"],
	["OB/GYN", "General"],
	["Dermatology", "Medical"],
	["Neurology", "General"],
	["Emergency Medicine", "Emergency"],
] as const;

const PRACTICES = [
	"Smith Medical Group, LLC",
	"Capitol Health Associates",
	"District Care Partners",
	"Potomac Specialty Clinic",
	"Anacostia Family Practice",
	"Georgetown Medical Associates",
];

const NAMES: Array<[string, string, string]> = [
	["John", "Smith", "MD"],
	["Maria", "Garcia", "MD"],
	["James", "Williams", "DO"],
	["Aisha", "Hassan", "MD"],
	["Robert", "Johnson", "MD"],
	["Sofia", "Martinez", "NP"],
	["Daniel", "Brown", "MD"],
	["Fatima", "Ali", "MD"],
	["Michael", "Davis", "MD"],
	["Elena", "Nguyen", "DO"],
	["David", "Wilson", "MD"],
	["Amara", "Bekele", "MD"],
	["Christopher", "Anderson", "PA"],
	["Nia", "Okoro", "MD"],
	["Anthony", "Thomas", "MD"],
	["Grace", "Lee", "MD"],
	["Kevin", "Jackson", "DO"],
	["Hannah", "Patel", "MD"],
	["Brian", "White", "MD"],
	["Olivia", "Kim", "MD"],
	["Samuel", "Reed", "MD"],
	["Chloe", "Bennett", "NP"],
	["Ethan", "Carter", "MD"],
	["Isabella", "Wright", "MD"],
];

const PROGRAMS: Array<"MDH" | "DHCF" | "BHP"> = ["MDH", "DHCF", "BHP"];
const MONTHS = [
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
];

const TAXONOMIES = [
	["207R00000X", "Internal Medicine"],
	["207Q00000X", "Family Medicine"],
	["207RC0000X", "Cardiovascular Disease"],
	["208000000X", "Pediatrics"],
	["207X00000X", "Orthopaedic Surgery"],
	["2084P0800X", "Psychiatry"],
	["207V00000X", "Obstetrics & Gynecology"],
	["207N00000X", "Dermatology"],
	["2084N0400X", "Neurology"],
	["207P00000X", "Emergency Medicine"],
] as const;

const SCHOOLS = [
	"George Washington University School of Medicine",
	"Georgetown University School of Medicine",
	"Howard University College of Medicine",
	"Johns Hopkins University School of Medicine",
	"University of Maryland School of Medicine",
	"Virginia Commonwealth University School of Medicine",
];

const LANGUAGES = [
	"English",
	"Spanish",
	"Amharic",
	"French",
	"Mandarin",
	"Vietnamese",
];
const RACES = [
	"White",
	"Black or African American",
	"Asian",
	"American Indian or Alaska Native",
	"Native Hawaiian or Other Pacific Islander",
	"Two or More Races",
	"Decline to Answer",
];
const ETHNICITIES = [
	"Not Hispanic or Latino",
	"Hispanic or Latino",
	"Decline to Answer",
];

function buildSummaries(): ProviderSummary[] {
	return NAMES.map(([first, last, cred], i) => {
		const [specialty, subspecialty] = SPECIALTIES[i % SPECIALTIES.length]!;
		const program = PROGRAMS[i % 3]!;
		const status: ProviderStatus =
			i % 11 === 0
				? "termed"
				: i % 9 === 0
					? "pending"
					: i % 7 === 0
						? "inactive"
						: "active";
		const claims = 4200 + ((i * 317) % 6000);
		const encounters = Math.round(claims * 0.84);
		const billed = 1_800_000 + i * 95_000 + ((i * 12345) % 400_000);
		const paid = Math.round(billed * 0.755);
		const rejectionRate = 4.2 + ((i * 0.37) % 5);
		return {
			id: `prov-${i + 1}`,
			npi: String(1000000000 + i * 1117 + 234567890).slice(0, 10),
			name: `${first} ${last}`,
			credentials: cred ?? "",
			specialty,
			subspecialty,
			taxId: `${12 + (i % 80)}-${1000000 + i * 137}`.slice(0, 10),
			upin: `A${String(10000 + i * 17).slice(0, 5)}`,
			medicaidId: `DC-MD-${String(240000 + i).padStart(6, "0")}`,
			status,
			program,
			providerType: i % 8 === 0 ? "Group" : "Individual",
			gender: i % 2 === 0 ? "Male" : "Female",
			dob: `19${60 + (i % 25)}-${String((i % 12) + 1).padStart(2, "0")}-${String(10 + (i % 18)).padStart(2, "0")}`,
			yearsInPractice: 8 + (i % 25),
			practiceName: PRACTICES[i % PRACTICES.length]!,
			practiceAddress: `${100 + i * 11} ${["K St NW", "M St NE", "Connecticut Ave", "Georgia Ave"][i % 4]}, Washington, DC 200${10 + (i % 40)}`,
			practicePhone: `(202) ${555 + (i % 40)}-${2000 + ((i * 13) % 7000)}`,
			enrollmentStatus:
				status === "termed"
					? "terminated"
					: status === "pending"
						? "pending"
						: "enrolled",
			enrollmentEffective: `202${i % 4}-0${(i % 8) + 1}-15`,
			claims12m: claims,
			encounters12m: encounters,
			billed12m: billed,
			paid12m: paid,
			rejectionRate: Math.round(rejectionRate * 100) / 100,
			netPayment12m: Math.round(paid * 0.89),
		};
	});
}

const _PROVIDER_SUMMARIES: ProviderSummary[] = isMockEnabled()
	? buildSummaries()
	: [];

// Match mockup hero provider
if (isMockEnabled() && _PROVIDER_SUMMARIES[0]) {
	const john = _PROVIDER_SUMMARIES[0]!;
	john.name = "John Smith";
	john.credentials = "MD";
	john.specialty = "Internal Medicine";
	john.subspecialty = "Primary Care";
	john.npi = "1234567890";
	john.taxId = "12-3456789";
	john.upin = "A12345";
	john.medicaidId = "DC-MD-88421";
	john.status = "active";
	john.program = "DHCF";
	john.providerType = "Individual";
	john.gender = "Male";
	john.dob = "1972-04-18";
	john.yearsInPractice = 18;
	john.practiceName = "Smith Medical Group, LLC";
	john.practiceAddress = "1842 K Street NW, Suite 400, Washington, DC 20006";
	john.practicePhone = "(202) 555-0198";
	john.enrollmentStatus = "enrolled";
	john.enrollmentEffective = "2022-01-15";
	john.claims12m = 8432;
	john.encounters12m = 7103;
	john.billed12m = 4238512.45;
	john.paid12m = 3204551.32;
	john.rejectionRate = 6.72;
	john.netPayment12m = 2856422.18;
}

export const PROVIDER_SUMMARIES: ProviderSummary[] = _PROVIDER_SUMMARIES;

function detailFor(summary: ProviderSummary): ProviderDetail {
	const isJohn = summary.id === "prov-1";
	const monthlyVolume: MonthlyVolume[] = MONTHS.map((month, i) => {
		const base = isJohn ? 620 : 280 + (summary.claims12m % 200);
		const claims = base + ((i * 37 + summary.claims12m) % 180);
		const encounters = Math.round(claims * (0.78 + (i % 5) * 0.02));
		const rejectionRate = isJohn
			? 5.2 + (i % 6) * 0.35 + (i === 10 ? 1.2 : 0)
			: 4 + (i % 5) * 0.5;
		return {
			month,
			claims,
			encounters,
			rejectionRate: Math.round(rejectionRate * 100) / 100,
			rejectionCount: Math.round((claims * rejectionRate) / 100),
		};
	});

	const rejectionReasons: RejectionReason[] = [
		{
			id: "rr1",
			reason: "Invalid member ID",
			count: isJohn ? 184 : 42,
			pct: 22.4,
		},
		{
			id: "rr2",
			reason: "Missing authorization",
			count: isJohn ? 156 : 38,
			pct: 19.0,
		},
		{
			id: "rr3",
			reason: "Duplicate claim",
			count: isJohn ? 121 : 29,
			pct: 14.7,
		},
		{
			id: "rr4",
			reason: "Coding / diagnosis error",
			count: isJohn ? 98 : 24,
			pct: 11.9,
		},
		{ id: "rr5", reason: "Timely filing", count: isJohn ? 76 : 18, pct: 9.2 },
	];

	const nameParts = summary.name.trim().split(/\s+/);
	const firstName = nameParts[0] ?? summary.name;
	const lastName = nameParts.slice(1).join(" ") || summary.name;
	const idx = Number(summary.id.replace(/\D/g, "")) || 1;
	const [taxonomyCode, taxonomyDescription] =
		TAXONOMIES[(idx - 1) % TAXONOMIES.length]!;
	const zipMatch = summary.practiceAddress.match(/DC\s+(\d{5})/);
	const practiceZip = zipMatch?.[1] ?? `200${10 + (idx % 40)}`;

	const memberNames = [
		"Doe, John",
		"Garcia, Maria",
		"Williams, James",
		"Hassan, Aisha",
		"Johnson, Robert",
		"Martinez, Sofia",
		"Brown, Daniel",
		"Ali, Fatima",
		"Davis, Michael",
		"Nguyen, Elena",
	];
	const claimStatuses: ClaimActivityStatus[] = [
		"paid",
		"paid",
		"paid",
		"pending",
		"denied",
		"rejected",
		"accepted",
		"paid",
	];
	const cptCodes = [
		"99213",
		"99214",
		"99215",
		"93000",
		"80053",
		"90471",
		"G0438",
		"99203",
	];
	const buildActivity = (
		kind: "claim" | "encounter",
		count: number
	): ProviderClaimRow[] =>
		Array.from({ length: count }, (_, i) => {
			const billed = 120 + ((idx * 17 + i * 41) % 880);
			const status = claimStatuses[(idx + i) % claimStatuses.length]!;
			const paid =
				status === "paid" || status === "accepted"
					? Math.round(billed * (0.62 + ((i * 3) % 20) / 100))
					: status === "pending"
						? 0
						: Math.round(billed * 0.15);
			const day = String(1 + ((i * 3 + idx) % 27)).padStart(2, "0");
			const month = String(1 + ((i + idx) % 7)).padStart(2, "0");
			return {
				id: `${kind}-${summary.id}-${i + 1}`,
				dos: `2026-${month}-${day}`,
				receivedDate: `2026-${month}-${String(Math.min(28, Number(day) + 2)).padStart(2, "0")}`,
				claimNumber:
					kind === "claim"
						? `CLM-2026-${String(84000 + idx * 100 + i).padStart(6, "0")}`
						: `ENC-2026-${String(22000 + idx * 80 + i).padStart(6, "0")}`,
				memberId: `MFC-${String(100000 + idx * 37 + i).padStart(6, "0")}`,
				memberName: memberNames[(idx + i) % memberNames.length]!,
				type:
					kind === "encounter"
						? "Encounter"
						: i % 5 === 0
							? "Institutional"
							: "Professional",
				procedureCode: cptCodes[(idx + i) % cptCodes.length]!,
				billed,
				paid,
				status: kind === "encounter" && status === "paid" ? "accepted" : status,
				vendor: VENDOR_NAMES[(idx + i) % Math.min(4, VENDOR_NAMES.length)]!,
			};
		});

	return {
		...summary,
		firstName: isJohn ? "John" : firstName,
		middleName: isJohn ? "Michael" : idx % 3 === 0 ? "A." : null,
		lastName: isJohn ? "Smith" : lastName,
		preferredName: isJohn ? "Dr. Smith" : null,
		suffix:
			summary.credentials === "MD" || summary.credentials === "DO"
				? null
				: null,
		email: isJohn
			? "john.smith@smithmedical.com"
			: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, "")}@${summary.practiceName
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "")
					.slice(0, 18)}.com`,
		fax: isJohn
			? "(202) 555-0199"
			: `(202) ${555 + (idx % 40)}-${3000 + ((idx * 11) % 6000)}`,
		preferredLanguage: isJohn ? "English" : LANGUAGES[idx % LANGUAGES.length]!,
		race: isJohn ? "White" : RACES[idx % RACES.length]!,
		ethnicity: isJohn
			? "Not Hispanic or Latino"
			: ETHNICITIES[idx % ETHNICITIES.length]!,
		taxonomyCode: isJohn ? "207R00000X" : taxonomyCode,
		taxonomyDescription: isJohn ? "Internal Medicine" : taxonomyDescription,
		boardCertification: isJohn
			? "American Board of Internal Medicine"
			: `American Board of ${summary.specialty.split(" ")[0]}`,
		medicalSchool: isJohn
			? "George Washington University School of Medicine"
			: SCHOOLS[idx % SCHOOLS.length]!,
		graduationYear: isJohn ? 2004 : 1995 + (idx % 20),
		acceptingNewPatients: isJohn
			? true
			: summary.status === "active" && idx % 5 !== 0,
		mailingAddress: isJohn
			? "1842 K Street NW, Suite 400, Washington, DC 20006"
			: summary.practiceAddress,
		practiceCity: "Washington",
		practiceState: "DC",
		practiceZip: isJohn ? "20006" : practiceZip,
		website: isJohn ? "https://www.smithmedical.com" : null,
		stateLicense: `MD${34000 + Number(summary.id.replace(/\D/g, ""))}`,
		deaNumber: `BS${2000000 + Number(summary.id.replace(/\D/g, "")) * 17}`,
		claimsTrendPct: isJohn ? 12.4 : 8.1,
		encountersTrendPct: isJohn ? 10.8 : 7.4,
		billedTrendPct: isJohn ? 14.6 : 9.2,
		paidTrendPct: isJohn ? 13.1 : 8.8,
		rejectionTrendPct: isJohn ? -1.18 : -0.4,
		netPaymentTrendPct: isJohn ? 12.7 : 7.9,
		dataAsOf: "07/28/2026 08:30 AM ET",
		locations: [
			{
				id: "loc1",
				name: summary.practiceName,
				address: summary.practiceAddress,
				phone: summary.practicePhone,
				status: "active",
				isPrimary: true,
			},
			{
				id: "loc2",
				name: `${summary.name.split(" ")[1]} Satellite Clinic`,
				address: "900 New York Ave NW, Washington, DC 20001",
				phone: "(202) 555-0288",
				status: "active",
				isPrimary: false,
			},
			{
				id: "loc3",
				name: "Telehealth Location",
				address: "Virtual — DC Licensed",
				phone: summary.practicePhone,
				status: summary.status === "active" ? "active" : "inactive",
				isPrimary: false,
			},
		],
		networks: [
			{
				id: "n1",
				networkPlan: "MedStar Family Choice DC",
				payer: "MedStar",
				status: "in_network",
				effectiveDate: "2022-01-15",
				endDate: null,
			},
			{
				id: "n2",
				networkPlan: "AmeriHealth Caritas DC",
				payer: "AmeriHealth",
				status: "in_network",
				effectiveDate: "2021-07-01",
				endDate: null,
			},
			{
				id: "n3",
				networkPlan: "CareFirst Community",
				payer: "CareFirst",
				status: "in_network",
				effectiveDate: "2020-03-01",
				endDate: null,
			},
			{
				id: "n4",
				networkPlan: "UnitedHealthcare Community",
				payer: "UHC",
				status: "out_of_network",
				effectiveDate: "2019-01-01",
				endDate: "2023-12-31",
			},
			{
				id: "n5",
				networkPlan: "Kaiser Permanente Medicaid",
				payer: "Kaiser",
				status: "in_network",
				effectiveDate: "2023-06-01",
				endDate: null,
			},
			{
				id: "n6",
				networkPlan: "DC Healthy Families",
				payer: "DHCF",
				status: "pending",
				effectiveDate: "2026-08-01",
				endDate: null,
			},
		],
		identifiers: [
			{ id: "i1", label: "NPI", value: summary.npi },
			{ id: "i2", label: "Tax ID (TIN)", value: summary.taxId },
			{ id: "i3", label: "UPIN", value: summary.upin },
			{ id: "i4", label: "Medicaid ID", value: summary.medicaidId },
			{
				id: "i5",
				label: "State License",
				value: `MD${34000 + Number(summary.id.replace(/\D/g, ""))}`,
			},
			{
				id: "i6",
				label: "DEA Number",
				value: `BS${2000000 + Number(summary.id.replace(/\D/g, "")) * 17}`,
			},
		],
		monthlyVolume,
		rejectionReasons,
		recentClaims: buildActivity("claim", isJohn ? 12 : 8),
		recentEncounters: buildActivity("encounter", isJohn ? 10 : 6),
		vendors: [
			{
				id: "v1",
				vendor: VENDOR_NAMES[0]!,
				fileType: "837 Professional",
				dataSent: "Claims",
				frequency: "Daily",
				lastReceived: "2026-07-28 06:14",
				status: "active",
			},
			{
				id: "v2",
				vendor: VENDOR_NAMES[6]!,
				fileType: "837 Institutional",
				dataSent: "Claims",
				frequency: "Daily",
				lastReceived: "2026-07-27 18:02",
				status: "active",
			},
			{
				id: "v3",
				vendor: VENDOR_NAMES[2]!,
				fileType: "837 Encounter",
				dataSent: "Encounters",
				frequency: "Weekly",
				lastReceived: "2026-07-25 09:41",
				status: "warning",
			},
			{
				id: "v4",
				vendor: VENDOR_NAMES[1]!,
				fileType: "NCPDP",
				dataSent: "Pharmacy",
				frequency: "Daily",
				lastReceived: "2026-07-28 07:05",
				status: "active",
			},
		],
		credentialing: [
			{
				id: "c1",
				label: "Medical License",
				status: "complete",
				issuer: "DC Board of Medicine",
				verifiedDate: "2025-11-12",
				expirationDate: "2027-06-30",
			},
			{
				id: "c2",
				label: "DEA Registration",
				status: "complete",
				issuer: "DEA",
				verifiedDate: "2025-09-03",
				expirationDate: "2028-03-31",
			},
			{
				id: "c3",
				label: "Board Certification",
				status: "complete",
				issuer: "ABIM",
				verifiedDate: "2024-04-18",
				expirationDate: "2030-12-31",
			},
			{
				id: "c4",
				label: "Malpractice Insurance",
				status: "expiring",
				issuer: "MedPro Group",
				verifiedDate: "2025-09-01",
				expirationDate: "2026-09-01",
			},
			{
				id: "c5",
				label: "Hospital Privileges",
				status: "complete",
				issuer: "MedStar Washington Hospital Center",
				verifiedDate: "2025-01-20",
				expirationDate: "2027-01-20",
			},
			{
				id: "c6",
				label: "CAQH Profile",
				status: "complete",
				issuer: "CAQH",
				verifiedDate: "2026-06-15",
				expirationDate: null,
			},
			{
				id: "c7",
				label: "Background Check",
				status: "complete",
				issuer: "Sterling",
				verifiedDate: "2025-08-10",
				expirationDate: "2028-08-10",
			},
			{
				id: "c8",
				label: "OIG Exclusion",
				status: "complete",
				issuer: "HHS OIG",
				verifiedDate: "2026-07-01",
				expirationDate: null,
			},
			{
				id: "c9",
				label: "NPI Verification",
				status: "complete",
				issuer: "NPPES",
				verifiedDate: "2026-07-01",
				expirationDate: null,
			},
			{
				id: "c10",
				label: "Education Verification",
				status: "complete",
				issuer: "Primary Source",
				verifiedDate: "2022-01-10",
				expirationDate: null,
			},
			{
				id: "c11",
				label: "Work History",
				status: "complete",
				issuer: "Credentialing Ops",
				verifiedDate: "2022-01-10",
				expirationDate: null,
			},
			{
				id: "c12",
				label: "Peer References",
				status: "complete",
				issuer: "Credentialing Ops",
				verifiedDate: "2022-02-01",
				expirationDate: null,
			},
			{
				id: "c13",
				label: "CMS Opt-Out",
				status: "complete",
				issuer: "CMS",
				verifiedDate: "2026-01-05",
				expirationDate: null,
			},
			{
				id: "c14",
				label: "CLIA Certificate",
				status: "complete",
				issuer: "CMS / CLIA",
				verifiedDate: "2025-03-12",
				expirationDate: "2027-03-12",
			},
			{
				id: "c15",
				label: "CPR Certification",
				status: "expiring",
				issuer: "AHA",
				verifiedDate: "2024-10-01",
				expirationDate: "2026-10-01",
			},
			{
				id: "c16",
				label: "Immunization Record",
				status: isJohn ? "complete" : idx % 7 === 0 ? "pending" : "complete",
				issuer: "Occupational Health",
				verifiedDate: "2025-05-20",
				expirationDate: null,
			},
		],
		exceptions: isJohn
			? [
					{
						id: "ex1",
						exceptionType: "Credential Expiring",
						description: "Malpractice insurance expires within 60 days",
						status: "open",
						dateIdentified: "2026-07-10",
					},
					{
						id: "ex2",
						exceptionType: "Network Pending",
						description:
							"DC Healthy Families participation pending payer response",
						status: "open",
						dateIdentified: "2026-06-22",
					},
					{
						id: "ex3",
						exceptionType: "Address Update",
						description: "Satellite clinic address pending NPPES sync",
						status: "in_progress",
						dateIdentified: "2026-07-01",
					},
				]
			: summary.status === "pending"
				? [
						{
							id: "ex1",
							exceptionType: "Enrollment Pending",
							description: "Initial credentialing packet incomplete",
							status: "open",
							dateIdentified: "2026-07-15",
						},
					]
				: [],
	};
}

export const PROVIDER_DETAILS: Record<string, ProviderDetail> = fixtureRecord(
	Object.fromEntries(PROVIDER_SUMMARIES.map((s) => [s.id, detailFor(s)]))
);

export function displayProviderName(
	p: Pick<ProviderSummary, "name" | "credentials">
) {
	return `${p.name}, ${p.credentials}`;
}

export function getProvider(idOrNpi: string): ProviderDetail | undefined {
	if (!isMockEnabled()) return undefined;
	const decoded = decodeURIComponent(idOrNpi);
	const byId = PROVIDER_DETAILS[decoded];
	if (byId) return byId;
	const summary = PROVIDER_SUMMARIES.find(
		(p) => p.id === decoded || p.npi === decoded
	);
	return summary ? PROVIDER_DETAILS[summary.id] : undefined;
}

export function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	});
}

export function formatDate(iso: string | null | undefined) {
	if (!iso) return "—";
	if (iso.includes("/")) return iso;
	const [y, m, d] = iso.split("-");
	if (!y || !m || !d) return iso;
	return `${m}/${d}/${y}`;
}

export function formatCompact(value: number) {
	return value.toLocaleString("en-US");
}

export function providerAge(dob: string, asOf = "2026-08-04") {
	const [y, m, d] = dob.split("-").map(Number);
	const [ay, am, ad] = asOf.split("-").map(Number);
	if (!y || !m || !d || !ay || !am || !ad) return null;
	let age = ay - y;
	if (am < m || (am === m && ad < d)) age -= 1;
	return age;
}

export function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

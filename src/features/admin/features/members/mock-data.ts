import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { fixtureRecord, isMockEnabled } from "@/lib/mock-mode";

export type MemberStatus = "active" | "inactive" | "pending" | "termed";
export type EligibilityStatus =
	| "eligible"
	| "termed"
	| "pending"
	| "ineligible";
export type ClaimStatus = "paid" | "denied" | "pending" | "partial";
export type ExceptionStatus = "open" | "in_progress" | "resolved";

export type MemberSummary = {
	id: string;
	memberId: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	dob: string;
	gender: "Male" | "Female" | "Other" | "Unknown";
	ssnLast4: string;
	phone: string;
	email: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state: string;
	zip: string;
	status: MemberStatus;
	program: "MDH" | "DHCF" | "BHP";
	planName: string;
	planType: string;
	lob: string;
	pcpName: string;
	pcpNpi: string;
	memberSince: string;
	lastClaimDate: string | null;
	claimsYtd: number;
	paidYtd: number;
	vendorSource: string;
};

export type EligibilityHistoryRow = {
	id: string;
	startDate: string;
	endDate: string | null;
	status: EligibilityStatus;
	source: string;
	groupCaseId: string;
	reason: string;
	verifiedBy: string;
};

export type PlanHistoryRow = {
	id: string;
	planName: string;
	planType: string;
	planId: string;
	carrier: string;
	startDate: string;
	endDate: string | null;
	changeReason: string;
};

export type DependentRow = {
	id: string;
	name: string;
	relationship: "Self" | "Spouse" | "Daughter" | "Son" | "Other";
	dob: string;
	gender: string;
	coverageStatus: MemberStatus;
	memberId?: string;
	pcpName?: string;
	planName?: string;
};

export type MemberClaimRow = {
	id: string;
	dos: string;
	claimNumber: string;
	type: "Medical" | "Pharmacy" | "Dental" | "Vision" | "Encounter";
	provider: string;
	billed: number;
	paid: number;
	status: ClaimStatus;
};

export type AccumulatorRow = {
	id: string;
	label: string;
	individual: number;
	family: number;
	remaining: number;
	limit: number;
};

export type VendorSourceRow = {
	id: string;
	vendor: string;
	fileFeedType: string;
	lastReceived: string;
	status: "success" | "warning" | "failed";
	frequency: string;
	recordsProcessed: number;
	direction: "Inbound" | "Outbound";
};

export type EligibilityExceptionRow = {
	id: string;
	exceptionType: string;
	description: string;
	startDetected: string;
	status: ExceptionStatus;
	source: string;
	resolution: string;
};

export type MemberAlert = {
	id: string;
	severity: "warning" | "error" | "info";
	title: string;
	hrefLabel: string;
};

export type MemberDetail = MemberSummary & {
	eligibilityStatus: EligibilityStatus;
	coverageStart: string;
	coverageEnd: string | null;
	planId: string;
	preferredName: string | null;
	preferredLanguage: string;
	race: string;
	ethnicity: string;
	communicationPreference: "Phone" | "Email" | "Mail" | "SMS";
	emergencyContactName: string;
	emergencyContactPhone: string;
	emergencyContactRelation: string;
	mailingAddressLine1: string;
	mailingAddressLine2?: string;
	mailingCity: string;
	mailingState: string;
	mailingZip: string;
	dataAsOf: string;
	alerts: MemberAlert[];
	eligibilityHistory: EligibilityHistoryRow[];
	planHistory: PlanHistoryRow[];
	dependents: DependentRow[];
	claims: MemberClaimRow[];
	encounters: MemberClaimRow[];
	accumulators: AccumulatorRow[];
	vendorHistory: VendorSourceRow[];
	exceptions: EligibilityExceptionRow[];
};

function money(n: number) {
	return n;
}

const FIRST = [
	"John",
	"Maria",
	"James",
	"Aisha",
	"Robert",
	"Sofia",
	"Daniel",
	"Fatima",
	"Michael",
	"Elena",
	"David",
	"Amara",
	"Christopher",
	"Nia",
	"Anthony",
	"Grace",
	"Kevin",
	"Hannah",
	"Brian",
	"Olivia",
];
const LAST = [
	"Doe",
	"Garcia",
	"Williams",
	"Hassan",
	"Johnson",
	"Martinez",
	"Brown",
	"Ali",
	"Davis",
	"Nguyen",
	"Wilson",
	"Bekele",
	"Anderson",
	"Okoro",
	"Thomas",
	"Lee",
	"Jackson",
	"Patel",
	"White",
	"Kim",
];
const PLANS = [
	"MedStar Family Choice DC",
	"AmeriHealth Caritas DC",
	"CareFirst Community Health",
	"UnitedHealthcare Community",
	"Kaiser Permanente Medicaid",
];
const VENDORS = VENDOR_NAMES;
const PROGRAMS: Array<"MDH" | "DHCF" | "BHP"> = ["MDH", "DHCF", "BHP"];

function pad(n: number, w = 8) {
	return String(n).padStart(w, "0");
}

function buildSummaries(): MemberSummary[] {
	const rows: MemberSummary[] = [];
	for (let i = 0; i < 28; i++) {
		const first = FIRST[i % FIRST.length]!;
		const last = LAST[i % LAST.length]!;
		const program = PROGRAMS[i % 3]!;
		const status: MemberStatus =
			i % 11 === 0
				? "termed"
				: i % 9 === 0
					? "pending"
					: i % 7 === 0
						? "inactive"
						: "active";
		const day = String(10 + (i % 18)).padStart(2, "0");
		rows.push({
			id: `mem-${i + 1}`,
			memberId: `MFC-${pad(2401000 + i, 7)}`,
			firstName: first,
			middleName: i === 0 ? "Michael" : undefined,
			lastName: last,
			dob: `19${70 + (i % 30)}-${String((i % 12) + 1).padStart(2, "0")}-${day}`,
			gender: i % 2 === 0 ? "Male" : "Female",
			ssnLast4: String(1000 + ((i * 37) % 9000)).slice(-4),
			phone: `(202) ${555 + (i % 40)}-${1000 + ((i * 11) % 9000)}`,
			email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
			addressLine1: `${100 + i * 7} ${["M St NW", "K St NE", "Rhode Island Ave", "Georgia Ave", "H St NE"][i % 5]}`,
			city: "Washington",
			state: "DC",
			zip: `200${10 + (i % 40)}`,
			status,
			program,
			planName: PLANS[i % PLANS.length]!,
			planType: "Medicaid",
			lob: i % 4 === 0 ? "Pharmacy" : "Medical",
			pcpName: [
				"Jane Smith, MD",
				"Omar Khalil, MD",
				"Lisa Chen, MD",
				"Marcus Reed, MD",
			][i % 4]!,
			pcpNpi: `1${pad(234567890 + i, 9)}`.slice(0, 10),
			memberSince: `20${10 + (i % 14)}-0${(i % 8) + 1}-15`,
			lastClaimDate: status === "pending" ? null : `2026-07-${day}`,
			claimsYtd: 2 + ((i * 3) % 18),
			paidYtd: money(1200 + i * 340 + ((i * 17) % 900)),
			vendorSource: VENDORS[i % VENDORS.length]!,
		});
	}
	// Override first member to match mockup
	const john = rows[0]!;
	john.firstName = "John";
	john.middleName = "Michael";
	john.lastName = "Doe";
	john.memberId = "MFC-2401842";
	john.dob = "1985-03-14";
	john.gender = "Male";
	john.ssnLast4 = "6789";
	john.phone = "(202) 555-0142";
	john.email = "john.doe@email.com";
	john.addressLine1 = "1842 Rhode Island Ave NW";
	john.addressLine2 = "Apt 4B";
	john.city = "Washington";
	john.state = "DC";
	john.zip = "20036";
	john.status = "active";
	john.program = "DHCF";
	john.planName = "MedStar Family Choice DC";
	john.planType = "Medicaid";
	john.lob = "Medical";
	john.pcpName = "Jane Smith, MD";
	john.pcpNpi = "1234567890";
	john.memberSince = "2019-06-01";
	john.lastClaimDate = "2026-07-22";
	john.claimsYtd = 14;
	john.paidYtd = 12840.5;
	john.vendorSource = VENDOR_NAMES[0]!;
	return rows;
}

export const MEMBER_SUMMARIES: MemberSummary[] = isMockEnabled()
	? buildSummaries()
	: [];

function detailFor(summary: MemberSummary): MemberDetail {
	const isJohn = summary.id === "mem-1";
	const idx = Number(summary.id.replace(/\D/g, "")) || 1;
	const languages = ["English", "Spanish", "Amharic", "French", "Mandarin"];
	const races = [
		"White",
		"Black or African American",
		"Asian",
		"Two or More Races",
		"Decline to Answer",
	];
	const ethnicities = [
		"Not Hispanic or Latino",
		"Hispanic or Latino",
		"Decline to Answer",
	];
	const comms: Array<"Phone" | "Email" | "Mail" | "SMS"> = [
		"Phone",
		"Email",
		"Mail",
		"SMS",
	];

	return {
		...summary,
		eligibilityStatus: summary.status === "termed" ? "termed" : "eligible",
		coverageStart: isJohn
			? "2026-01-01"
			: `${summary.memberSince.slice(0, 4)}-01-01`,
		coverageEnd: summary.status === "termed" ? "2026-06-30" : null,
		planId: isJohn
			? "MFC-DC-MED-001"
			: `PLAN-${summary.program}-00${summary.id.slice(-1)}`,
		preferredName: isJohn ? "Johnny" : null,
		preferredLanguage: isJohn ? "English" : languages[idx % languages.length]!,
		race: isJohn ? "White" : races[idx % races.length]!,
		ethnicity: isJohn
			? "Not Hispanic or Latino"
			: ethnicities[idx % ethnicities.length]!,
		communicationPreference: isJohn ? "Email" : comms[idx % comms.length]!,
		emergencyContactName: isJohn ? "Jane Doe" : `${summary.lastName}, Contact`,
		emergencyContactPhone: isJohn ? "(202) 555-0190" : summary.phone,
		emergencyContactRelation: isJohn
			? "Spouse"
			: idx % 2 === 0
				? "Parent"
				: "Sibling",
		mailingAddressLine1: summary.addressLine1,
		mailingAddressLine2: summary.addressLine2,
		mailingCity: summary.city,
		mailingState: summary.state,
		mailingZip: summary.zip,
		dataAsOf: "07/28/2026 08:30 AM ET",
		alerts: isJohn
			? [
					{
						id: "a1",
						severity: "warning",
						title: "1 Eligibility Exception",
						hrefLabel: "View details",
					},
					{
						id: "a2",
						severity: "warning",
						title: "2 Open Claim Denials",
						hrefLabel: "View details",
					},
					{
						id: "a3",
						severity: "info",
						title: "PCP attribution updated",
						hrefLabel: "View details",
					},
				]
			: summary.status === "pending"
				? [
						{
							id: "a1",
							severity: "warning",
							title: "Eligibility verification pending",
							hrefLabel: "View details",
						},
					]
				: [],
		eligibilityHistory: [
			{
				id: "eh1",
				startDate: isJohn ? "2026-01-01" : "2025-01-01",
				endDate: null,
				status: "eligible",
				source: "834 Eligibility",
				groupCaseId: isJohn ? "CASE-DC-88211" : `CASE-${summary.program}-100`,
				reason: "Annual enrollment / continuous coverage",
				verifiedBy: "System — 834 inbound",
			},
			{
				id: "eh2",
				startDate: "2024-01-01",
				endDate: "2025-12-31",
				status: "eligible",
				source: "834 Eligibility",
				groupCaseId: isJohn ? "CASE-DC-77102" : `CASE-${summary.program}-090`,
				reason: "Plan year renewal",
				verifiedBy: "Eligibility Ops",
			},
			{
				id: "eh3",
				startDate: "2023-01-01",
				endDate: "2023-12-31",
				status: "termed",
				source: "Manual",
				groupCaseId: isJohn ? "CASE-DC-66001" : `CASE-${summary.program}-080`,
				reason: isJohn
					? "Address verification hold resolved; prior span closed"
					: "Coverage gap",
				verifiedBy: "Member Services",
			},
			...(isJohn
				? [
						{
							id: "eh4",
							startDate: "2022-06-01",
							endDate: "2022-12-31",
							status: "eligible" as const,
							source: "834 Eligibility",
							groupCaseId: "CASE-DC-55120",
							reason: "New enrollment after Medicaid redetermination",
							verifiedBy: "System — 834 inbound",
						},
						{
							id: "eh5",
							startDate: "2022-01-01",
							endDate: "2022-05-31",
							status: "pending" as const,
							source: "Manual",
							groupCaseId: "CASE-DC-54002",
							reason: "Pending income documentation",
							verifiedBy: "Eligibility Ops",
						},
					]
				: []),
		],
		planHistory: [
			{
				id: "ph1",
				planName: summary.planName,
				planType: summary.planType,
				planId: isJohn
					? "MFC-DC-MED-001"
					: `PLAN-${summary.program}-00${summary.id.slice(-1)}`,
				carrier: isJohn
					? "MedStar Family Choice"
					: `${summary.program} Carrier`,
				startDate: isJohn ? "2024-01-01" : summary.memberSince,
				endDate: null,
				changeReason: "Current active plan",
			},
			{
				id: "ph2",
				planName: "Legacy Medicaid Plan",
				planType: "Medicaid",
				planId: isJohn ? "MFC-DC-LEG-009" : `PLAN-${summary.program}-LEG`,
				carrier: isJohn
					? "MedStar Family Choice"
					: `${summary.program} Carrier`,
				startDate: "2021-01-01",
				endDate: "2023-12-31",
				changeReason: "Plan redesign / product migration",
			},
			...(isJohn
				? [
						{
							id: "ph3",
							planName: "DC Healthy Families",
							planType: "Medicaid",
							planId: "DHCF-HF-2019",
							carrier: "DHCF",
							startDate: "2019-06-01",
							endDate: "2020-12-31",
							changeReason: "Initial enrollment",
						},
					]
				: []),
		],
		dependents: isJohn
			? [
					{
						id: "d1",
						name: "John Michael Doe",
						relationship: "Self" as const,
						dob: "1985-03-14",
						gender: "Male",
						coverageStatus: "active" as const,
						memberId: summary.memberId,
						pcpName: "Jane Smith, MD",
						planName: summary.planName,
					},
					{
						id: "d2",
						name: "Sarah Anne Doe",
						relationship: "Spouse" as const,
						dob: "1987-09-02",
						gender: "Female",
						coverageStatus: "active" as const,
						memberId: "MFC-2401843",
						pcpName: "Jane Smith, MD",
						planName: summary.planName,
					},
					{
						id: "d3",
						name: "Emily Rose Doe",
						relationship: "Daughter" as const,
						dob: "2014-05-21",
						gender: "Female",
						coverageStatus: "active" as const,
						memberId: "MFC-2401844",
						pcpName: "Children's National PCP",
						planName: summary.planName,
					},
					{
						id: "d4",
						name: "Noah James Doe",
						relationship: "Son" as const,
						dob: "2018-11-08",
						gender: "Male",
						coverageStatus: "active" as const,
						memberId: "MFC-2401845",
						pcpName: "Children's National PCP",
						planName: summary.planName,
					},
				]
			: [
					{
						id: "d1",
						name: displayName(summary),
						relationship: "Self" as const,
						dob: summary.dob,
						gender: summary.gender,
						coverageStatus: summary.status,
						memberId: summary.memberId,
						pcpName: summary.pcpName,
						planName: summary.planName,
					},
				],
		claims: [
			{
				id: "c1",
				dos: "2026-07-22",
				claimNumber: "CLM-9001842",
				type: "Medical",
				provider: "MedStar Washington Hospital",
				billed: 2450,
				paid: 1820.4,
				status: "paid",
			},
			{
				id: "c2",
				dos: "2026-06-14",
				claimNumber: "CLM-9001620",
				type: "Pharmacy",
				provider: "CVS Pharmacy #4421",
				billed: 186.5,
				paid: 42.1,
				status: "paid",
			},
			{
				id: "c3",
				dos: "2026-05-03",
				claimNumber: "CLM-9001401",
				type: "Medical",
				provider: "Jane Smith, MD",
				billed: 320,
				paid: 0,
				status: "denied",
			},
			{
				id: "c4",
				dos: "2026-04-18",
				claimNumber: "CLM-9001288",
				type: "Medical",
				provider: "Capital Radiology",
				billed: 980,
				paid: 640,
				status: "paid",
			},
			{
				id: "c5",
				dos: "2026-03-09",
				claimNumber: "CLM-9001102",
				type: "Pharmacy",
				provider: "Walgreens #201",
				billed: 64.2,
				paid: 0,
				status: "denied",
			},
		],
		encounters: [
			{
				id: "e1",
				dos: "2026-07-10",
				claimNumber: "ENC-550214",
				type: "Encounter",
				provider: "Community Health Center",
				billed: 0,
				paid: 0,
				status: "paid",
			},
			{
				id: "e2",
				dos: "2026-05-28",
				claimNumber: "ENC-550188",
				type: "Encounter",
				provider: "Jane Smith, MD",
				billed: 0,
				paid: 0,
				status: "paid",
			},
			{
				id: "e3",
				dos: "2026-04-02",
				claimNumber: "ENC-550144",
				type: "Encounter",
				provider: "Urgent Care NW",
				billed: 0,
				paid: 0,
				status: "pending",
			},
			{
				id: "e4",
				dos: "2026-02-19",
				claimNumber: "ENC-550101",
				type: "Encounter",
				provider: "Behavioral Health Partners",
				billed: 0,
				paid: 0,
				status: "paid",
			},
			{
				id: "e5",
				dos: "2026-01-08",
				claimNumber: "ENC-550066",
				type: "Encounter",
				provider: "Vision Care DC",
				billed: 0,
				paid: 0,
				status: "paid",
			},
		],
		accumulators: [
			{
				id: "ac1",
				label: "Deductible",
				individual: isJohn ? 250 : 180 + (idx % 100),
				family: isJohn ? 500 : 400,
				remaining: 0,
				limit: isJohn ? 250 : 250,
			},
			{
				id: "ac2",
				label: "Out of Pocket Max",
				individual: isJohn ? 1840 : 1200 + (idx % 400),
				family: isJohn ? 3200 : 2800,
				remaining: isJohn ? 1660 : 1400,
				limit: isJohn ? 3500 : 3500,
			},
			{
				id: "ac3",
				label: "Pharmacy Deductible",
				individual: isJohn ? 50 : 25,
				family: isJohn ? 100 : 75,
				remaining: 0,
				limit: isJohn ? 50 : 50,
			},
			{
				id: "ac4",
				label: "Dental Annual Max",
				individual: isJohn ? 420 : 200 + (idx % 150),
				family: isJohn ? 980 : 600,
				remaining: isJohn ? 580 : 800,
				limit: isJohn ? 1000 : 1000,
			},
			{
				id: "ac5",
				label: "Vision Annual Max",
				individual: isJohn ? 85 : 40,
				family: isJohn ? 160 : 100,
				remaining: isJohn ? 65 : 110,
				limit: isJohn ? 150 : 150,
			},
		],
		vendorHistory: [
			{
				id: "vh1",
				vendor: summary.vendorSource,
				fileFeedType: "834 Eligibility",
				lastReceived: "2026-07-28 06:14",
				status: "success",
				frequency: "Daily",
				recordsProcessed: isJohn ? 1842 : 420 + idx * 11,
				direction: "Inbound",
			},
			{
				id: "vh2",
				vendor: VENDOR_NAMES[6] ?? VENDOR_NAMES[1]!,
				fileFeedType: "837 Claims",
				lastReceived: "2026-07-27 18:02",
				status: "success",
				frequency: "Daily",
				recordsProcessed: isJohn ? 96 : 40 + idx,
				direction: "Inbound",
			},
			{
				id: "vh3",
				vendor: VENDOR_NAMES[1]!,
				fileFeedType: "NCPDP Pharmacy",
				lastReceived: "2026-07-26 09:41",
				status: "warning",
				frequency: "Daily",
				recordsProcessed: isJohn ? 28 : 12 + (idx % 10),
				direction: "Inbound",
			},
			{
				id: "vh4",
				vendor: VENDOR_NAMES[3]!,
				fileFeedType: "837 Vision",
				lastReceived: "2026-07-20 11:05",
				status: "success",
				frequency: "Weekly",
				recordsProcessed: isJohn ? 6 : 3,
				direction: "Inbound",
			},
			...(isJohn
				? [
						{
							id: "vh5",
							vendor: VENDOR_NAMES[2]!,
							fileFeedType: "277CA Response",
							lastReceived: "2026-07-25 14:22",
							status: "failed" as const,
							frequency: "Daily",
							recordsProcessed: 0,
							direction: "Outbound" as const,
						},
					]
				: []),
		],
		exceptions: buildExceptions(summary),
	};
}

function buildExceptions(summary: MemberSummary): EligibilityExceptionRow[] {
	const seq = Number(summary.id.replace(/\D/g, "")) || 1;
	const catalog: EligibilityExceptionRow[] = [
		{
			id: `${summary.id}-ex1`,
			exceptionType: "Coverage Gap",
			description: "Short eligibility gap detected between plan years",
			startDetected: "2026-01-02",
			status: "open",
			source: "834 Eligibility",
			resolution:
				"Pending case worker review — verify continuous coverage letter",
		},
		{
			id: `${summary.id}-ex2`,
			exceptionType: "Address Mismatch",
			description: "Mailing address differs from enrollment file",
			startDetected: "2026-06-15",
			status: "in_progress",
			source: "Manual",
			resolution: "Member contacted; awaiting updated proof of residence",
		},
		{
			id: `${summary.id}-ex3`,
			exceptionType: "Duplicate Enrollment",
			description:
				"Member appears under two active Medicaid IDs for the same period",
			startDetected: "2026-05-08",
			status: "open",
			source: "834 Eligibility",
			resolution: "Merge request submitted to enrollment ops",
		},
		{
			id: `${summary.id}-ex4`,
			exceptionType: "PCP Attribution Error",
			description: "Assigned PCP NPI does not match network roster",
			startDetected: "2026-07-12",
			status: "in_progress",
			source: "Provider Roster",
			resolution: "Roster sync in progress; temporary PCP assigned",
		},
		{
			id: `${summary.id}-ex5`,
			exceptionType: "SSN Verification Failed",
			description:
				"SSN check returned no match against SSA verification service",
			startDetected: "2026-04-21",
			status: "open",
			source: "Identity Service",
			resolution: "Awaiting corrected SSN documentation from member",
		},
		{
			id: `${summary.id}-ex6`,
			exceptionType: "Plan Code Invalid",
			description:
				"Inbound 834 plan code not mapped to an active benefit package",
			startDetected: "2026-03-30",
			status: "resolved",
			source: "834 Eligibility",
			resolution: "Mapped to replacement plan code effective 04/01/2026",
		},
		{
			id: `${summary.id}-ex7`,
			exceptionType: "Pending Verification",
			description: "New enrollment awaiting document verification",
			startDetected: "2026-07-01",
			status: "open",
			source: "834 Eligibility",
			resolution: "Waiting on identity documents",
		},
		{
			id: `${summary.id}-ex8`,
			exceptionType: "Date of Birth Conflict",
			description: "DOB on eligibility file conflicts with claims history",
			startDetected: "2026-06-28",
			status: "open",
			source: "Claims Crosswalk",
			resolution: "Case opened with enrollment to confirm legal DOB",
		},
	];

	if (summary.id === "mem-1") {
		return catalog.slice(0, 2);
	}
	if (summary.status === "pending") {
		return [catalog[6]!, catalog[4]!];
	}
	if (summary.status === "termed") {
		return [
			{
				...catalog[0]!,
				exceptionType: "Termed with Open Auth",
				description: "Coverage termed while prior authorization remains open",
				resolution: "Coordinate auth end-date with utilization management",
			},
			catalog[2]!,
		];
	}

	// Rotate 2–3 exceptions so every active/inactive member has data
	const start = (seq - 1) % (catalog.length - 2);
	const count = 2 + (seq % 2);
	return catalog.slice(start, start + count);
}

export const MEMBER_DETAILS: Record<string, MemberDetail> = fixtureRecord(
	Object.fromEntries(MEMBER_SUMMARIES.map((s) => [s.id, detailFor(s)]))
);

export function displayName(
	m: Pick<MemberSummary, "firstName" | "middleName" | "lastName">
) {
	return [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ");
}

export function getMember(idOrMemberId: string): MemberDetail | undefined {
	if (!isMockEnabled()) return undefined;
	const decoded = decodeURIComponent(idOrMemberId);
	const byId = MEMBER_DETAILS[decoded];
	if (byId) return byId;
	const summary = MEMBER_SUMMARIES.find(
		(m) => m.id === decoded || m.memberId === decoded
	);
	return summary ? MEMBER_DETAILS[summary.id] : undefined;
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
	const [y, m, d] = iso.split("-");
	if (!y || !m || !d) return iso;
	return `${m}/${d}/${y}`;
}

export function maskSsn(last4: string) {
	return `***-**-${last4}`;
}

export function memberAge(dob: string, asOf = "2026-08-04") {
	const [y, m, d] = dob.split("-").map(Number);
	const [ay, am, ad] = asOf.split("-").map(Number);
	if (!y || !m || !d || !ay || !am || !ad) return null;
	let age = ay - y;
	if (am < m || (am === m && ad < d)) age -= 1;
	return age;
}

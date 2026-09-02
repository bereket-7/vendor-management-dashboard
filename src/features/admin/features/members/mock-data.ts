import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { fixtureRecord, isMembersMockEnabled } from "@/lib/mock-mode";

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
	/** Core vendor UUID when known (live API). */
	vendorId?: string;
	alternateId?: string;
	newtechMemberId?: string;
	newtechFamilyId?: string;
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
	eligibilityLabel?: "Active" | "Inactive" | "Pending" | "Termed";
	accountGroup?: string;
	program: "MDH" | "DHCF" | "BHP";
	planName: string;
	planType: string;
	lob: string;
	pcpName: string;
	pcpNpi: string;
	memberSince: string;
	coverageEffectiveDate?: string;
	lastClaimDate: string | null;
	claimsYtd: number;
	paidYtd: number;
	vendorSource: string;
};

export type OtherStatusRow = {
	id: string;
	slot: string;
	status: string;
	detail: string;
	effectiveStart: string | null;
	effectiveEnd: string | null;
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
	relationshipCode?: string;
	relationshipLabel?: string;
	dob: string;
	gender: string;
	coverageStatus: MemberStatus;
	/** Cardholder / display member id */
	memberId?: string;
	/** Linked dependent member UUID when known */
	dependentId?: string;
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

export type AccumulatorAmountTriple = {
	applied: number | null;
	remaining: number | null;
	total: number | null;
};

export type AccumulatorTableRow = {
	id: string;
	category: "medical" | "pharmacy";
	planId: string;
	accountGroupId: string;
	internalMemberId: string;
	internalFamilyId: string;
	accumulatorType: string;
	level: "individual" | "family";
	deductible: AccumulatorAmountTriple;
	oop: AccumulatorAmountTriple;
	benefitMax: AccumulatorAmountTriple;
	planYearAmount: number | null;
	planYearStart: string | null;
	planYearEnd: string | null;
	resetDate: string | null;
	/** Links to legacy flat AccumulatorRow for row CRUD */
	sourceAccumulatorId?: string | null;
};

export type AccumulatorKpi = {
	key: string;
	label: string;
	individualApplied: number;
	individualTotal: number | null;
	familyApplied: number;
	familyTotal: number | null;
};

export type AccumulatorTransaction = {
	id: string;
	date: string;
	planId: string;
	accumulatorType: string;
	level: "individual" | "family";
	serviceDate: string | null;
	description: string;
	amount: number;
	individualAmount: number;
	familyAmount: number;
	source: string;
};

export type AccumulatorSummary = {
	currentPlanName: string;
	effectiveDate: string | null;
	asOfDate: string | null;
	kpis: AccumulatorKpi[];
	medicalRows: AccumulatorTableRow[];
	pharmacyRows: AccumulatorTableRow[];
	recentTransactions: AccumulatorTransaction[];
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
	planCode?: string;
	benefitPackage?: string;
	coverageLevelCode?: string;
	coverageLevel?: string;
	secondaryCoverage?: string;
	statusEffectiveDate?: string;
	statusTermDate?: string | null;
	enrollmentDate?: string;
	disenrollmentDate?: string | null;
	lastEligibilityUpdate?: string;
	groupId?: string;
	groupName?: string;
	clientId?: string;
	accountType?: string;
	accountStatus?: "Active" | "Inactive";
	memberType?: string;
	personCode?: string;
	relationshipCode?: string;
	externalId?: string;
	newtechMemberId?: string;
	newtechFamilyId?: string;
	employeeType?: string;
	sourceSystem?: string;
	sourceFileName?: string;
	sourceFileReceived?: string;
	recordStatus?: string;
	changeDetected?: string;
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
	/** Accumulators tab summary (KPI + Medical/Pharmacy tables + transactions). */
	accumulatorSummary?: AccumulatorSummary;
	vendorHistory: VendorSourceRow[];
	exceptions: EligibilityExceptionRow[];
	otherStatuses: OtherStatusRow[];
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

const EMPTY_AMOUNT: AccumulatorAmountTriple = {
	applied: null,
	remaining: null,
	total: null,
};

function amountTriple(applied: number, total: number): AccumulatorAmountTriple {
	return {
		applied,
		remaining: Math.max(0, total - applied),
		total,
	};
}

function tableRowFromBucket(args: {
	id: string;
	category: "medical" | "pharmacy";
	planId: string;
	accountGroupId: string;
	internalMemberId: string;
	internalFamilyId: string;
	accumulatorType: string;
	level: "individual" | "family";
	bucket: "deductible" | "oop" | "benefit_max";
	applied: number;
	total: number;
	planYearStart: string;
	planYearEnd: string;
	resetDate: string;
	sourceAccumulatorId: string;
}): AccumulatorTableRow {
	const triple = amountTriple(args.applied, args.total);
	return {
		id: args.id,
		category: args.category,
		planId: args.planId,
		accountGroupId: args.accountGroupId,
		internalMemberId: args.internalMemberId,
		internalFamilyId: args.internalFamilyId,
		accumulatorType: args.accumulatorType,
		level: args.level,
		deductible: args.bucket === "deductible" ? triple : EMPTY_AMOUNT,
		oop: args.bucket === "oop" ? triple : EMPTY_AMOUNT,
		benefitMax: args.bucket === "benefit_max" ? triple : EMPTY_AMOUNT,
		planYearAmount: args.applied,
		planYearStart: args.planYearStart,
		planYearEnd: args.planYearEnd,
		resetDate: args.resetDate,
		sourceAccumulatorId: args.sourceAccumulatorId,
	};
}

/** Screenshot-aligned accumulator summary + transactions for Member Detail tab. */
export function buildMockAccumulatorSummary(args: {
	isJohn: boolean;
	idx: number;
	planName: string;
	planCode: string;
	accountGroup: string;
	memberId: string;
	familyId: string;
	coverageStart: string;
	asOfDate: string;
	paidYtdIndividual: number;
	paidYtdFamily: number;
	vendorSource: string;
}): AccumulatorSummary {
	const year = args.coverageStart.slice(0, 4) || "2026";
	const planYearStart = `${year}-01-01`;
	const planYearEnd = `${year}-12-31`;
	const resetDate = planYearEnd;
	const planId = args.planCode || "PLAN_A";
	const ctx = {
		planId,
		accountGroupId: args.accountGroup,
		internalMemberId: args.memberId,
		internalFamilyId: args.familyId,
		planYearStart,
		planYearEnd,
		resetDate,
	};

	const buckets: {
		sourceId: string;
		category: "medical" | "pharmacy";
		type: string;
		bucket: "deductible" | "oop" | "benefit_max";
		indApplied: number;
		indTotal: number;
		famApplied: number;
		famTotal: number;
	}[] = args.isJohn
		? [
				{
					sourceId: "ac1",
					category: "medical",
					type: "Medical Deductible",
					bucket: "deductible",
					indApplied: 125,
					indTotal: 1000,
					famApplied: 250,
					famTotal: 2000,
				},
				{
					sourceId: "ac2",
					category: "medical",
					type: "Medical Out-of-Pocket",
					bucket: "oop",
					indApplied: 250,
					indTotal: 5000,
					famApplied: 750,
					famTotal: 10000,
				},
				{
					sourceId: "ac5",
					category: "medical",
					type: "Medical Benefit Max",
					bucket: "benefit_max",
					indApplied: 250,
					indTotal: 10000,
					famApplied: 750,
					famTotal: 20000,
				},
				{
					sourceId: "ac3",
					category: "pharmacy",
					type: "Pharmacy Deductible",
					bucket: "deductible",
					indApplied: 25,
					indTotal: 500,
					famApplied: 50,
					famTotal: 1000,
				},
				{
					sourceId: "ac4",
					category: "pharmacy",
					type: "Pharmacy Out-of-Pocket",
					bucket: "oop",
					indApplied: 150,
					indTotal: 2000,
					famApplied: 450,
					famTotal: 4000,
				},
				{
					sourceId: "ac6",
					category: "pharmacy",
					type: "Pharmacy Benefit Max",
					bucket: "benefit_max",
					indApplied: 250,
					indTotal: 10000,
					famApplied: 750,
					famTotal: 20000,
				},
			]
		: [
				{
					sourceId: "ac1",
					category: "medical",
					type: "Medical Deductible",
					bucket: "deductible",
					indApplied: 180 + (args.idx % 100),
					indTotal: 1000,
					famApplied: 400,
					famTotal: 2000,
				},
				{
					sourceId: "ac2",
					category: "medical",
					type: "Medical Out-of-Pocket",
					bucket: "oop",
					indApplied: 1200 + (args.idx % 400),
					indTotal: 5000,
					famApplied: 2800,
					famTotal: 10000,
				},
				{
					sourceId: "ac5",
					category: "medical",
					type: "Medical Benefit Max",
					bucket: "benefit_max",
					indApplied: 400,
					indTotal: 10000,
					famApplied: 900,
					famTotal: 20000,
				},
				{
					sourceId: "ac3",
					category: "pharmacy",
					type: "Pharmacy Deductible",
					bucket: "deductible",
					indApplied: 25,
					indTotal: 500,
					famApplied: 75,
					famTotal: 1000,
				},
				{
					sourceId: "ac4",
					category: "pharmacy",
					type: "Pharmacy Out-of-Pocket",
					bucket: "oop",
					indApplied: 90,
					indTotal: 2000,
					famApplied: 200,
					famTotal: 4000,
				},
				{
					sourceId: "ac6",
					category: "pharmacy",
					type: "Pharmacy Benefit Max",
					bucket: "benefit_max",
					indApplied: 300,
					indTotal: 10000,
					famApplied: 800,
					famTotal: 20000,
				},
			];

	const medicalRows: AccumulatorTableRow[] = [];
	const pharmacyRows: AccumulatorTableRow[] = [];
	for (const b of buckets) {
		const ind = tableRowFromBucket({
			...ctx,
			id: `${b.sourceId}-ind`,
			category: b.category,
			accumulatorType: b.type,
			level: "individual",
			bucket: b.bucket,
			applied: b.indApplied,
			total: b.indTotal,
			sourceAccumulatorId: b.sourceId,
		});
		const fam = tableRowFromBucket({
			...ctx,
			id: `${b.sourceId}-fam`,
			category: b.category,
			accumulatorType: b.type,
			level: "family",
			bucket: b.bucket,
			applied: b.famApplied,
			total: b.famTotal,
			sourceAccumulatorId: b.sourceId,
		});
		if (b.category === "medical") {
			medicalRows.push(ind, fam);
		} else {
			pharmacyRows.push(ind, fam);
		}
	}

	const byKey = Object.fromEntries(
		buckets.map((b) => [
			`${b.category}_${b.bucket === "benefit_max" ? "benefit_max" : b.bucket === "oop" ? "oop" : "deductible"}`,
			b,
		])
	) as Record<string, (typeof buckets)[0]>;

	const kpiFrom = (
		key: string,
		label: string,
		b: (typeof buckets)[0] | undefined
	): AccumulatorKpi => ({
		key,
		label,
		individualApplied: b?.indApplied ?? 0,
		individualTotal: b?.indTotal ?? null,
		familyApplied: b?.famApplied ?? 0,
		familyTotal: b?.famTotal ?? null,
	});

	const kpis: AccumulatorKpi[] = [
		kpiFrom(
			"medical_deductible",
			"Medical Deductible",
			byKey.medical_deductible
		),
		kpiFrom("medical_oop", "Medical Out-of-Pocket", byKey.medical_oop),
		kpiFrom(
			"medical_benefit_max",
			"Medical Benefit Max",
			byKey.medical_benefit_max
		),
		kpiFrom(
			"pharmacy_deductible",
			"Pharmacy Deductible",
			byKey.pharmacy_deductible
		),
		kpiFrom("pharmacy_oop", "Pharmacy Out-of-Pocket", byKey.pharmacy_oop),
		kpiFrom(
			"pharmacy_benefit_max",
			"Pharmacy Benefit Max",
			byKey.pharmacy_benefit_max
		),
		{
			key: "total_paid",
			label: "Total Amount Paid",
			individualApplied: args.paidYtdIndividual,
			individualTotal: null,
			familyApplied: args.paidYtdFamily,
			familyTotal: null,
		},
	];

	return {
		currentPlanName: args.planName,
		effectiveDate: args.coverageStart,
		asOfDate: args.asOfDate,
		kpis,
		medicalRows,
		pharmacyRows,
		recentTransactions: buildMockAccumulatorTransactions({
			planId,
			vendorSource: args.vendorSource,
			asOfDate: args.asOfDate,
			isJohn: args.isJohn,
		}),
	};
}

/** Placeholder transactions until BE ships accumulator transaction history. */
export function buildMockAccumulatorTransactions(args: {
	planId: string;
	vendorSource: string;
	asOfDate: string;
	isJohn?: boolean;
}): AccumulatorTransaction[] {
	const d = args.asOfDate.slice(0, 10) || "2026-01-20";
	return [
		{
			id: "atx1",
			date: d,
			planId: args.planId,
			accumulatorType: "Pharmacy Out-of-Pocket",
			level: "individual",
			serviceDate: d,
			description: "Pharmacy Claim Paid",
			amount: 45,
			individualAmount: 45,
			familyAmount: 45,
			source: args.vendorSource || "NIH Claims Feed",
		},
		{
			id: "atx2",
			date: d,
			planId: args.planId,
			accumulatorType: "Medical Deductible",
			level: "individual",
			serviceDate: d,
			description: "Applied to Deductible",
			amount: 125,
			individualAmount: 125,
			familyAmount: 125,
			source: args.vendorSource || "NIH Claims Feed",
		},
		{
			id: "atx3",
			date: "2026-01-15",
			planId: args.planId,
			accumulatorType: "Medical Out-of-Pocket",
			level: "family",
			serviceDate: "2026-01-14",
			description: "Medical Claim Paid",
			amount: 200,
			individualAmount: 80,
			familyAmount: 200,
			source: args.vendorSource || "NIH Claims Feed",
		},
		{
			id: "atx4",
			date: "2026-01-10",
			planId: args.planId,
			accumulatorType: "Pharmacy Deductible",
			level: "individual",
			serviceDate: "2026-01-10",
			description: "Pharmacy Claim Paid",
			amount: 25,
			individualAmount: 25,
			familyAmount: 50,
			source: args.vendorSource || "NIH Claims Feed",
		},
		{
			id: "atx5",
			date: "2026-01-01",
			planId: args.planId,
			accumulatorType: "Medical Deductible",
			level: "family",
			serviceDate: null,
			description: "Plan Year Reset",
			amount: 0,
			individualAmount: 0,
			familyAmount: 0,
			source: "System",
		},
	];
}

function buildSummaries(): MemberSummary[] {
	const rows: MemberSummary[] = [];
	const groups = [
		"NIH EMPLOYEE GROUP",
		"DC MEDICAID GROUP",
		"FEDERAL EMPLOYEE GROUP",
		"STATE HEALTH GROUP",
	];
	for (let i = 0; i < 2; i++) {
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
			memberId: `${pad(123456780 + i, 9)}`,
			alternateId: `${pad(64980000 + i, 8)}`,
			firstName: first,
			middleName: i === 0 ? "T." : undefined,
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
			eligibilityLabel:
				status === "active"
					? "Active"
					: status === "pending"
						? "Pending"
						: status === "termed"
							? "Termed"
							: "Inactive",
			accountGroup: groups[i % groups.length]!,
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
			coverageEffectiveDate: `2026-01-01`,
			lastClaimDate: status === "pending" ? null : `2026-07-${day}`,
			claimsYtd: 2 + ((i * 3) % 18),
			paidYtd: money(1200 + i * 340 + ((i * 17) % 900)),
			vendorSource: VENDORS[i % VENDORS.length]!,
		});
	}
	// Primary demo members — synthetic Ethiopian names, clearly labeled demo IDs
	const abebe = rows[0]!;
	abebe.firstName = "Abebe";
	abebe.middleName = undefined;
	abebe.lastName = "Kebede";
	abebe.memberId = "099898779";
	abebe.alternateId = "64987572";
	abebe.newtechMemberId = "12345678";
	abebe.newtechFamilyId = "12345678";
	abebe.dob = "1990-03-15";
	abebe.gender = "Male";
	abebe.ssnLast4 = "0001";
	abebe.phone = "(202) 555-0142";
	abebe.email = "abebe.kebede.demo@example.invalid";
	abebe.addressLine1 = "1200 Medical Center Dr";
	abebe.city = "Washington";
	abebe.state = "DC";
	abebe.zip = "20037";
	abebe.status = "active";
	abebe.eligibilityLabel = "Active";
	abebe.accountGroup = "NIH EMPLOYEE GROUP";
	abebe.program = "MDH";
	abebe.planName = "MDH CareFirst PPO";
	abebe.planType = "PPO";
	abebe.lob = "Medicaid";
	abebe.pcpName = "Dr. Samira Patel";
	abebe.pcpNpi = "1234567890";
	abebe.memberSince = "2025-01-15";
	abebe.coverageEffectiveDate = "2025-01-15";
	abebe.lastClaimDate = "2026-01-20";
	abebe.claimsYtd = 4;
	abebe.paidYtd = 453.86;
	abebe.vendorSource = "NIH Eligibility";

	const tigist = rows[1]!;
	tigist.firstName = "Tigist";
	tigist.middleName = undefined;
	tigist.lastName = "Hailemariam";
	tigist.memberId = "099876543";
	tigist.alternateId = "64981234";
	tigist.newtechMemberId = "12345678";
	tigist.newtechFamilyId = "12345678";
	tigist.dob = "1985-11-22";
	tigist.gender = "Female";
	tigist.ssnLast4 = "0002";
	tigist.phone = "(202) 555-0143";
	tigist.email = "tigist.hailemariam.demo@example.invalid";
	tigist.addressLine1 = "1200 Medical Center Dr";
	tigist.city = "Washington";
	tigist.state = "DC";
	tigist.zip = "20037";
	tigist.status = "active";
	tigist.eligibilityLabel = "Active";
	tigist.accountGroup = "DC MEDICAID GROUP";
	tigist.program = "DHCF";
	tigist.planName = "DHCF Community Plus";
	tigist.planType = "PPO";
	tigist.lob = "Medicaid";
	tigist.pcpName = "Dr. Samira Patel";
	tigist.pcpNpi = "1234567890";
	tigist.memberSince = "2025-02-01";
	tigist.coverageEffectiveDate = "2025-02-01";
	tigist.lastClaimDate = "2026-01-18";
	tigist.claimsYtd = 2;
	tigist.paidYtd = 210.0;
	tigist.vendorSource = "NIH Eligibility";
	return rows;
}

let _memberSummariesCache: MemberSummary[] | null = null;

export function getMemberSummaries(): MemberSummary[] {
	if (!isMembersMockEnabled()) return [];
	if (!_memberSummariesCache) _memberSummariesCache = buildSummaries();
	return _memberSummariesCache;
}

let _memberDetailsCache: Record<string, MemberDetail> | null = null;

function getMemberDetailsMap(): Record<string, MemberDetail> {
	if (!isMembersMockEnabled()) return {};
	if (!_memberDetailsCache) {
		_memberDetailsCache = Object.fromEntries(
			getMemberSummaries().map((s) => [s.id, detailFor(s)])
		);
	}
	return _memberDetailsCache;
}

function detailFor(summary: MemberSummary): MemberDetail {
	const isAbebe = summary.id === "mem-1";
	const isTigist = summary.id === "mem-2";
	const isDemoPrimary = isAbebe || isTigist;
	const isJohn = isAbebe;
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
		coverageStart: isDemoPrimary
			? (summary.coverageEffectiveDate ?? summary.memberSince)
			: `${summary.memberSince.slice(0, 4)}-01-01`,
		coverageEnd: summary.status === "termed" ? "2026-06-30" : null,
		planId: isAbebe
			? "PPO-01"
			: isTigist
				? "PPO-01"
				: `PLAN-${summary.program}-00${summary.id.slice(-1)}`,
		planCode: isDemoPrimary ? "PPO-01" : `PLAN_${summary.program}`,
		benefitPackage: isDemoPrimary ? "Standard" : "BASIC",
		coverageLevelCode: isDemoPrimary ? "EMP" : "IND",
		coverageLevel: isDemoPrimary ? "Employee Only" : "Individual",
		secondaryCoverage: "No",
		statusEffectiveDate: "2026-01-01",
		statusTermDate: summary.status === "termed" ? "2026-06-30" : null,
		enrollmentDate: isDemoPrimary ? summary.memberSince : summary.memberSince,
		disenrollmentDate: summary.status === "termed" ? "2026-06-30" : null,
		lastEligibilityUpdate: "01/28/2026 08:45 AM",
		groupId: isAbebe
			? "GRP-100"
			: isTigist
				? "GRP-100"
				: `${summary.program} GROUP 00${idx}`,
		groupName: summary.accountGroup ?? `${summary.program} GROUP`,
		clientId: isDemoPrimary ? "CL-1" : `${summary.program}${pad(idx, 3)}`,
		accountType: "Employer Group",
		accountStatus: summary.status === "termed" ? "Inactive" : "Active",
		memberType: "Subscriber",
		personCode: isDemoPrimary ? "01" : String(idx).padStart(2, "0"),
		relationshipCode: isDemoPrimary ? "18" : idx % 3 === 0 ? "01" : "18",
		externalId: isAbebe
			? "87654321"
			: isTigist
				? "87654324"
				: `${pad(87650000 + idx, 8)}`,
		employeeType: summary.status === "termed" ? "Termed" : "Active",
		sourceSystem: isDemoPrimary ? "NIH Eligibility" : summary.vendorSource,
		sourceFileName: isDemoPrimary
			? "NIH_Eligibility_demo.txt"
			: `${summary.program}_Eligibility_20260128.txt`,
		sourceFileReceived: "01/28/2026 01:33 AM",
		recordStatus: "Processed",
		changeDetected: isDemoPrimary ? "New Member" : "Eligibility Refresh",
		preferredName: isDemoPrimary ? summary.firstName : null,
		preferredLanguage: isDemoPrimary
			? "English"
			: languages[idx % languages.length]!,
		race: isDemoPrimary ? "Ethiopian" : races[idx % races.length]!,
		ethnicity: isDemoPrimary
			? "Ethiopian"
			: ethnicities[idx % ethnicities.length]!,
		communicationPreference: isJohn ? "Email" : comms[idx % comms.length]!,
		emergencyContactName: isJohn
			? "Sarah K. Johnson"
			: `${summary.lastName}, Contact`,
		emergencyContactPhone: isJohn ? "(301) 555-0199" : summary.phone,
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
		dataAsOf: "01/28/2026 08:45 AM",
		alerts: isJohn
			? [
					{
						id: "a1",
						severity: "info",
						title: "Plan / Address Update",
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
						name: "MICHAEL T. JOHNSON",
						relationship: "Self" as const,
						dob: "1985-03-15",
						gender: "M",
						coverageStatus: "active" as const,
						memberId: "M123456789",
						pcpName: "Jane Smith, MD",
						planName: "NIH PLAN A",
					},
					{
						id: "d2",
						name: "SARAH K. JOHNSON",
						relationship: "Spouse" as const,
						dob: "1987-06-20",
						gender: "F",
						coverageStatus: "active" as const,
						memberId: "M123456790",
						pcpName: "Jane Smith, MD",
						planName: "NIH PLAN A",
					},
					{
						id: "d3",
						name: "EMILY R. JOHNSON",
						relationship: "Daughter" as const,
						dob: "2015-09-12",
						gender: "F",
						coverageStatus: "active" as const,
						memberId: "M123456791",
						pcpName: "Children's National PCP",
						planName: "NIH PLAN A",
					},
				]
			: [
					{
						id: "d1",
						name: displayName(summary),
						relationship: "Self" as const,
						dob: summary.dob,
						gender: summary.gender === "Male" ? "M" : "F",
						coverageStatus: summary.status,
						memberId: summary.memberId,
						pcpName: summary.pcpName,
						planName: summary.planName,
					},
				],
		claims: isJohn
			? [
					{
						id: "c1",
						dos: "2026-01-20",
						claimNumber: "CLM-9001842",
						type: "Pharmacy",
						provider: "CVS Pharmacy",
						billed: 45.67,
						paid: 45.67,
						status: "paid",
					},
					{
						id: "c2",
						dos: "2026-01-18",
						claimNumber: "CLM-9001620",
						type: "Medical",
						provider: "Jane Smith, MD",
						billed: 120,
						paid: 120,
						status: "paid",
					},
					{
						id: "c3",
						dos: "2026-01-10",
						claimNumber: "CLM-9001401",
						type: "Medical",
						provider: "MedStar Washington Hospital",
						billed: 250,
						paid: 250,
						status: "paid",
					},
					{
						id: "c4",
						dos: "2026-01-05",
						claimNumber: "CLM-9001288",
						type: "Pharmacy",
						provider: "Walgreens",
						billed: 38.19,
						paid: 38.19,
						status: "paid",
					},
				]
			: [
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
				label: "Medical Deductible",
				individual: isJohn ? 125 : 180 + (idx % 100),
				family: isJohn ? 250 : 400,
				remaining: isJohn ? 875 : 70,
				limit: isJohn ? 1000 : 250,
			},
			{
				id: "ac2",
				label: "Medical Out-of-Pocket",
				individual: isJohn ? 250 : 1200 + (idx % 400),
				family: isJohn ? 750 : 2800,
				remaining: isJohn ? 4750 : 1400,
				limit: isJohn ? 5000 : 3500,
			},
			{
				id: "ac5",
				label: "Medical Benefit Max",
				individual: isJohn ? 250 : 400,
				family: isJohn ? 750 : 900,
				remaining: isJohn ? 9750 : 9100,
				limit: isJohn ? 10000 : 10000,
			},
			{
				id: "ac3",
				label: "Pharmacy Deductible",
				individual: isJohn ? 25 : 25,
				family: isJohn ? 50 : 75,
				remaining: isJohn ? 475 : 25,
				limit: isJohn ? 500 : 50,
			},
			{
				id: "ac4",
				label: "Pharmacy Out-of-Pocket",
				individual: isJohn ? 150 : 90,
				family: isJohn ? 450 : 200,
				remaining: isJohn ? 1850 : 110,
				limit: isJohn ? 2000 : 200,
			},
			{
				id: "ac6",
				label: "Pharmacy Benefit Max",
				individual: isJohn ? 250 : 300,
				family: isJohn ? 750 : 800,
				remaining: isJohn ? 9750 : 9200,
				limit: isJohn ? 10000 : 10000,
			},
		],
		accumulatorSummary: buildMockAccumulatorSummary({
			isJohn,
			idx,
			planName: summary.planName,
			planCode: isJohn ? "PLAN_A" : `PLAN_${summary.program}`,
			accountGroup:
				summary.accountGroup ??
				(isJohn ? "NIH GROUP 001" : `${summary.program} GROUP`),
			memberId: isAbebe
				? "099898779"
				: isTigist
					? "099876543"
					: summary.memberId,
			familyId: isJohn ? "FAM00012345" : `FAM${pad(idx, 8)}`,
			coverageStart: isJohn
				? "2026-01-01"
				: `${summary.memberSince.slice(0, 4)}-01-01`,
			asOfDate: isJohn ? "2026-01-20" : "2026-01-28",
			paidYtdIndividual: isJohn ? 670 : summary.paidYtd,
			paidYtdFamily: isJohn ? 1845 : summary.paidYtd * 2.5,
			vendorSource: summary.vendorSource,
		}),
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
		otherStatuses: isJohn
			? [
					{
						id: "os1",
						slot: "Status 1",
						status: "—",
						detail: "—",
						effectiveStart: null,
						effectiveEnd: null,
					},
					{
						id: "os2",
						slot: "Status 2",
						status: "PART TIME",
						detail: "Employee Works < 30 hrs",
						effectiveStart: "2026-01-01",
						effectiveEnd: null,
					},
					{
						id: "os3",
						slot: "Status 3",
						status: "WELLNESS",
						detail: "Wellness Program Participant",
						effectiveStart: "2026-01-01",
						effectiveEnd: "2026-12-31",
					},
					{
						id: "os4",
						slot: "Status 4",
						status: "—",
						detail: "—",
						effectiveStart: null,
						effectiveEnd: null,
					},
					{
						id: "os5",
						slot: "Status 5",
						status: "—",
						detail: "—",
						effectiveStart: null,
						effectiveEnd: null,
					},
				]
			: [
					{
						id: "os1",
						slot: "Status 1",
						status: "—",
						detail: "—",
						effectiveStart: null,
						effectiveEnd: null,
					},
				],
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

/** Lazy detail map — use {@link getMember} for lookups. */
export const MEMBER_DETAILS: Record<string, MemberDetail> = fixtureRecord({});

export function displayName(
	m: Pick<MemberSummary, "firstName" | "middleName" | "lastName">
) {
	return [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ");
}

export function getMember(idOrMemberId: string): MemberDetail | undefined {
	if (!isMembersMockEnabled()) return undefined;
	const decoded = decodeURIComponent(idOrMemberId);
	const details = getMemberDetailsMap();
	const byId = details[decoded];
	if (byId) return byId;
	const summary = getMemberSummaries().find(
		(m) => m.id === decoded || m.memberId === decoded
	);
	return summary ? details[summary.id] : undefined;
}

export function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	});
}

export function formatDate(iso: string | null | undefined) {
	if (!iso || iso === "—") return "—";
	const trimmed = String(iso).trim();
	// Already MM/DD/YYYY (optional time after)
	const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/);
	if (us) {
		const [, m, d, y, rest] = us;
		const base = `${m!.padStart(2, "0")}/${d!.padStart(2, "0")}/${y}`;
		return rest?.trim() ? `${base} ${rest.trim()}` : base;
	}
	const parsed = new Date(trimmed);
	if (!Number.isNaN(parsed.getTime())) {
		const mm = String(parsed.getMonth() + 1).padStart(2, "0");
		const dd = String(parsed.getDate()).padStart(2, "0");
		return `${mm}/${dd}/${parsed.getFullYear()}`;
	}
	const dayPart = trimmed.split("T")[0] ?? trimmed;
	const [y, m, d] = dayPart.split("-");
	if (y && m && d && y.length === 4) return `${m}/${d.slice(0, 2)}/${y}`;
	return trimmed;
}

/** Human-readable date + time (e.g. 08/26/2026 3:25 PM). */
export function formatDateTime(iso: string | null | undefined) {
	if (!iso || iso === "—") return "—";
	const trimmed = String(iso).trim();
	// Already has a readable time suffix
	if (/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d/.test(trimmed)) return trimmed;
	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) return formatDate(trimmed);
	const date = formatDate(parsed.toISOString());
	let hours = parsed.getHours();
	const mins = String(parsed.getMinutes()).padStart(2, "0");
	const ampm = hours >= 12 ? "AM" : "PM";
	hours = hours % 12 || 12;
	return `${date} ${hours}:${mins} ${ampm}`;
}

export function maskSsn(last4: string) {
	return `XXX-XX-${last4}`;
}

export function memberAge(dob: string, asOf?: string) {
	const asOfDate = asOf ?? new Date().toISOString().slice(0, 10);
	const [y, m, d] = dob.split("-").map(Number);
	const [ay, am, ad] = asOfDate.split("-").map(Number);
	if (!y || !m || !d || !ay || !am || !ad) return null;
	let age = ay - y;
	if (am < m || (am === m && ad < d)) age -= 1;
	return age;
}

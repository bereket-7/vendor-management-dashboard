import { rowsToCsv } from "@/lib/export/csv";
import type { MemberCreateBody } from "@/lib/vendor-core/types";

export type MemberImportFileKind = "eligibility" | "claim" | "accumulator";

export const MEMBER_IMPORT_FILE_KINDS: {
	id: MemberImportFileKind;
	label: string;
	shortLabel: string;
	description: string;
	sourceSystem: string;
}[] = [
	{
		id: "eligibility",
		label: "Eligibility file",
		shortLabel: "Eligibility",
		description:
			"Enrollment / roster feeds — one row per member with coverage fields.",
		sourceSystem: "Eligibility Import",
	},
	{
		id: "claim",
		label: "Claim file",
		shortLabel: "Claim",
		description:
			"Pharmacy / medical claim extracts — members inferred from patient columns.",
		sourceSystem: "Claim File Import",
	},
	{
		id: "accumulator",
		label: "Accumulator file",
		shortLabel: "Accumulator",
		description:
			"Deductible / OOP accumulator feeds — unique members extracted from rows.",
		sourceSystem: "Accumulator Import",
	},
];

/** Canonical member fields extracted from any of the three file kinds. */
export const MEMBER_IMPORT_COLUMNS = [
	"cardholder_id",
	"person_code",
	"first_name",
	"middle_name",
	"last_name",
	"date_of_birth",
	"gender",
	"relationship_code",
	"status",
	"eligibility_status",
	"plan_name",
	"plan_code",
	"group_id",
	"group_name",
	"email",
	"phone",
	"address_line1",
	"address_line2",
	"city",
	"state",
	"postal_code",
	"external_id",
	"program",
	"lob",
] as const;

export type MemberImportColumn = (typeof MEMBER_IMPORT_COLUMNS)[number];

export type MemberImportRow = Record<MemberImportColumn, string>;

export type MemberImportRowDraft = MemberImportRow & {
	id: string;
	sourceRow: number;
	/** How many source file rows collapsed into this member (claim/accum). */
	sourceHits: number;
};

const REQUIRED_COLUMNS: MemberImportColumn[] = [
	"cardholder_id",
	"first_name",
	"last_name",
];

/** Header aliases → canonical field, shared across kinds. */
const SHARED_ALIASES: Record<string, MemberImportColumn> = {
	cardholder_id: "cardholder_id",
	cardholderid: "cardholder_id",
	cardholder: "cardholder_id",
	member_id: "cardholder_id",
	memberid: "cardholder_id",
	member_number: "cardholder_id",
	subscriber_id: "cardholder_id",
	subscriberid: "cardholder_id",
	person_code: "person_code",
	personcode: "person_code",
	person_cd: "person_code",
	first_name: "first_name",
	firstname: "first_name",
	member_first_name: "first_name",
	patient_first_name: "first_name",
	patientfirstname: "first_name",
	middle_name: "middle_name",
	middlename: "middle_name",
	last_name: "last_name",
	lastname: "last_name",
	member_last_name: "last_name",
	patient_last_name: "last_name",
	patientlastname: "last_name",
	date_of_birth: "date_of_birth",
	dateofbirth: "date_of_birth",
	dob: "date_of_birth",
	birth_date: "date_of_birth",
	birthdate: "date_of_birth",
	patient_date_of_birth: "date_of_birth",
	patientdateofbirth: "date_of_birth",
	gender: "gender",
	sex: "gender",
	relationship_code: "relationship_code",
	relationshipcode: "relationship_code",
	relationship: "relationship_code",
	patient_relationship_code: "relationship_code",
	status: "status",
	member_status: "status",
	eligibility_status: "eligibility_status",
	elig_status: "eligibility_status",
	plan_name: "plan_name",
	planname: "plan_name",
	plan: "plan_name",
	plan_code: "plan_code",
	plancode: "plan_code",
	group_id: "group_id",
	groupid: "group_id",
	group_name: "group_name",
	groupname: "group_name",
	account_group: "group_name",
	email: "email",
	email_address: "email",
	phone: "phone",
	phone_number: "phone",
	home_phone: "phone",
	address_line1: "address_line1",
	address1: "address_line1",
	address_line_1: "address_line1",
	address_line2: "address_line2",
	address2: "address_line2",
	city: "city",
	state: "state",
	postal_code: "postal_code",
	postal: "postal_code",
	zip: "postal_code",
	zipcode: "postal_code",
	external_id: "external_id",
	externalid: "external_id",
	alternate_id: "external_id",
	program: "program",
	lob: "lob",
	line_of_business: "lob",
};

/** Extra aliases that appear on claim / accumulator vendor files. */
const CLAIM_EXTRA_ALIASES: Record<string, MemberImportColumn> = {
	claimno: "external_id",
	claim_no: "external_id",
};

const ACCUM_EXTRA_ALIASES: Record<string, MemberImportColumn> = {
	cardholder_ssn: "external_id",
	cardholderssn: "external_id",
};

function aliasTableFor(
	kind: MemberImportFileKind
): Record<string, MemberImportColumn> {
	if (kind === "claim") return { ...SHARED_ALIASES, ...CLAIM_EXTRA_ALIASES };
	if (kind === "accumulator")
		return { ...SHARED_ALIASES, ...ACCUM_EXTRA_ALIASES };
	return SHARED_ALIASES;
}

export function normalizeImportHeader(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/^\uFEFF/, "")
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

export function detectDelimiter(headerLine: string): "," | "|" {
	const pipes = (headerLine.match(/\|/g) ?? []).length;
	const commas = (headerLine.match(/,/g) ?? []).length;
	return pipes > commas ? "|" : ",";
}

/** Parse delimited text into rows of string cells (handles quoted fields). */
export function parseDelimitedRecords(
	text: string,
	delimiter: "," | "|" = ","
): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let inQuotes = false;

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		const next = text[i + 1];

		if (inQuotes) {
			if (char === '"' && next === '"') {
				cell += '"';
				i += 1;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				cell += char;
			}
			continue;
		}

		if (char === '"') {
			inQuotes = true;
			continue;
		}

		if (char === delimiter) {
			row.push(cell);
			cell = "";
			continue;
		}

		if (char === "\n") {
			row.push(cell);
			cell = "";
			if (row.some((value) => value.trim().length > 0)) {
				rows.push(row);
			}
			row = [];
			continue;
		}

		if (char === "\r") continue;
		cell += char;
	}

	row.push(cell);
	if (row.some((value) => value.trim().length > 0)) {
		rows.push(row);
	}

	return rows;
}

function emptyImportRow(): MemberImportRow {
	return {
		cardholder_id: "",
		person_code: "",
		first_name: "",
		middle_name: "",
		last_name: "",
		date_of_birth: "",
		gender: "",
		relationship_code: "",
		status: "",
		eligibility_status: "",
		plan_name: "",
		plan_code: "",
		group_id: "",
		group_name: "",
		email: "",
		phone: "",
		address_line1: "",
		address_line2: "",
		city: "",
		state: "",
		postal_code: "",
		external_id: "",
		program: "",
		lob: "",
	};
}

export function normalizeDateOfBirth(raw: string): string {
	const value = raw.trim();
	if (!value) return "";
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
	if (/^\d{8}$/.test(value)) {
		return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
	}
	const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (us) {
		const [, mm, dd, yyyy] = us;
		return `${yyyy}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;
	}
	return value;
}

export function normalizeGender(raw: string): string {
	const v = raw.trim().toUpperCase();
	if (!v) return "";
	if (v === "M" || v === "MALE") return "M";
	if (v === "F" || v === "FEMALE") return "F";
	if (v === "O" || v === "OTHER") return "O";
	if (v === "U" || v === "UNKNOWN") return "U";
	return v.slice(0, 1);
}

export function normalizeStatus(raw: string): string {
	const v = raw.trim().toLowerCase();
	if (!v) return "";
	if (["active", "eligible", "elig", "a", "y", "yes"].includes(v))
		return "active";
	if (["pending", "p"].includes(v)) return "pending";
	if (["inactive", "i", "n", "no"].includes(v)) return "inactive";
	if (["termed", "terminated", "term", "t"].includes(v)) return "termed";
	return v;
}

export type ColumnMapping = {
	field: MemberImportColumn;
	header: string;
	index: number;
};

export type ParseMemberImportResult = {
	rows: MemberImportRowDraft[];
	fileErrors: string[];
	warnings: string[];
	skippedEmptyRows: number;
	rawRowCount: number;
	dedupedCount: number;
	mappings: ColumnMapping[];
	unmappedHeaders: string[];
	delimiter: "," | "|";
};

function memberKey(row: MemberImportRow): string {
	const id = row.cardholder_id.trim().toLowerCase();
	const pc = (row.person_code.trim() || "01").toLowerCase();
	return `${id}::${pc}`;
}

export function parseMemberImportFile(
	text: string,
	kind: MemberImportFileKind
): ParseMemberImportResult {
	const decoded = text.replace(/^\uFEFF/, "");
	const firstLine = decoded.split(/\r?\n/).find((l) => l.trim()) ?? "";
	const delimiter = detectDelimiter(firstLine);
	const records = parseDelimitedRecords(decoded, delimiter);
	const aliases = aliasTableFor(kind);
	const fileErrors: string[] = [];
	const warnings: string[] = [];

	if (records.length === 0) {
		return {
			rows: [],
			fileErrors: ["File is empty."],
			warnings: [],
			skippedEmptyRows: 0,
			rawRowCount: 0,
			dedupedCount: 0,
			mappings: [],
			unmappedHeaders: [],
			delimiter,
		};
	}

	const headerRecord = records[0] ?? [];
	const headerMap = new Map<MemberImportColumn, number>();
	const mappings: ColumnMapping[] = [];
	const unmappedHeaders: string[] = [];
	const usedFields = new Set<MemberImportColumn>();

	for (let i = 0; i < headerRecord.length; i += 1) {
		const header = (headerRecord[i] ?? "").trim();
		if (!header) continue;
		const normalized = normalizeImportHeader(header);
		const field = aliases[normalized];
		if (field && !usedFields.has(field)) {
			headerMap.set(field, i);
			usedFields.add(field);
			mappings.push({ field, header, index: i });
		} else if (!field) {
			unmappedHeaders.push(header);
		}
	}

	for (const required of REQUIRED_COLUMNS) {
		if (!headerMap.has(required)) {
			fileErrors.push(
				`Missing required member column: ${required.replace(/_/g, " ")} (no matching header for ${kind} file)`
			);
		}
	}

	if (fileErrors.length > 0) {
		return {
			rows: [],
			fileErrors,
			warnings,
			skippedEmptyRows: 0,
			rawRowCount: 0,
			dedupedCount: 0,
			mappings,
			unmappedHeaders,
			delimiter,
		};
	}

	if (unmappedHeaders.length > 0) {
		warnings.push(
			`${unmappedHeaders.length} column(s) ignored (not mapped to member fields).`
		);
	}

	const byKey = new Map<string, MemberImportRowDraft>();
	let skippedEmptyRows = 0;
	let rawRowCount = 0;

	for (let rowIndex = 1; rowIndex < records.length; rowIndex += 1) {
		const record = records[rowIndex] ?? [];
		const row = emptyImportRow();

		for (const column of MEMBER_IMPORT_COLUMNS) {
			const cellIndex = headerMap.get(column);
			if (cellIndex == null) continue;
			row[column] = (record[cellIndex] ?? "").trim();
		}

		row.date_of_birth = normalizeDateOfBirth(row.date_of_birth);
		row.gender = normalizeGender(row.gender);
		row.status = normalizeStatus(row.status);
		row.eligibility_status = normalizeStatus(row.eligibility_status);
		if (!row.person_code.trim()) row.person_code = "01";
		if (!row.relationship_code.trim()) row.relationship_code = "18";
		if (!row.status.trim()) row.status = "active";

		if (!row.cardholder_id.trim()) {
			skippedEmptyRows += 1;
			continue;
		}

		rawRowCount += 1;
		const key = memberKey(row);
		const existing = byKey.get(key);
		if (existing) {
			existing.sourceHits += 1;
			// Fill blanks from later rows (claim/accum enrich)
			for (const col of MEMBER_IMPORT_COLUMNS) {
				if (!existing[col]?.trim() && row[col]?.trim()) {
					existing[col] = row[col];
				}
			}
			continue;
		}

		byKey.set(key, {
			...row,
			id: `member-import-${rowIndex}-${row.cardholder_id}`,
			sourceRow: rowIndex + 1,
			sourceHits: 1,
		});
	}

	const rows = Array.from(byKey.values());
	const dedupedCount = Math.max(0, rawRowCount - rows.length);

	if (rows.length === 0) {
		fileErrors.push(
			"No importable member rows found (cardholder ID required)."
		);
	} else if (dedupedCount > 0) {
		warnings.push(
			`Collapsed ${dedupedCount} duplicate row(s) into ${rows.length} unique member(s).`
		);
	}

	return {
		rows,
		fileErrors,
		warnings,
		skippedEmptyRows,
		rawRowCount,
		dedupedCount,
		mappings,
		unmappedHeaders,
		delimiter,
	};
}

export type RowValidationIssue = {
	field?: MemberImportColumn | "duplicate_cardholder";
	message: string;
};

export function collectDuplicateMemberKeys(
	rows: MemberImportRowDraft[]
): Set<string> {
	const seen = new Map<string, number>();
	for (const row of rows) {
		const key = memberKey(row);
		if (!row.cardholder_id.trim()) continue;
		seen.set(key, (seen.get(key) ?? 0) + 1);
	}
	const dupes = new Set<string>();
	for (const [key, count] of seen) {
		if (count > 1) dupes.add(key);
	}
	return dupes;
}

export function validateMemberImportRow(
	row: MemberImportRow,
	duplicateKeys: Set<string>
): RowValidationIssue[] {
	const issues: RowValidationIssue[] = [];

	if (!row.cardholder_id.trim()) {
		issues.push({
			field: "cardholder_id",
			message: "Cardholder ID is required",
		});
	}
	if (!row.first_name.trim()) {
		issues.push({ field: "first_name", message: "First name is required" });
	}
	if (!row.last_name.trim()) {
		issues.push({ field: "last_name", message: "Last name is required" });
	}
	if (!row.person_code.trim()) {
		issues.push({ field: "person_code", message: "Person code is required" });
	}

	const dob = row.date_of_birth.trim();
	if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
		issues.push({
			field: "date_of_birth",
			message: "DOB must be YYYY-MM-DD",
		});
	}

	const gender = row.gender.trim().toUpperCase();
	if (gender && !["M", "F", "O", "U"].includes(gender)) {
		issues.push({ field: "gender", message: "Gender must be M, F, O, or U" });
	}

	if (
		row.email.trim() &&
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())
	) {
		issues.push({ field: "email", message: "Invalid email format" });
	}

	const key = memberKey(row);
	if (row.cardholder_id.trim() && duplicateKeys.has(key)) {
		issues.push({
			field: "duplicate_cardholder",
			message: "Duplicate cardholder + person code in this import",
		});
	}

	return issues;
}

export function createBlankMemberImportRow(
	sourceRow = 1
): MemberImportRowDraft {
	return {
		...emptyImportRow(),
		person_code: "01",
		relationship_code: "18",
		status: "active",
		id: `member-import-blank-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		sourceRow,
		sourceHits: 1,
	};
}

export function memberImportRowToCreateBody(
	row: MemberImportRow,
	vendorId: string,
	kind: MemberImportFileKind
): MemberCreateBody {
	const meta = MEMBER_IMPORT_FILE_KINDS.find((k) => k.id === kind);
	const eligibilityStatus =
		row.eligibility_status.trim() ||
		(row.status.trim() === "active" ? "active" : row.status.trim()) ||
		"active";

	return {
		vendor_id: vendorId,
		cardholder_id: row.cardholder_id.trim(),
		person_code: row.person_code.trim() || "01",
		first_name: row.first_name.trim(),
		middle_name: row.middle_name.trim() || undefined,
		last_name: row.last_name.trim(),
		status: normalizeStatus(row.status) || "active",
		relationship_code: row.relationship_code.trim() || "18",
		external_id: row.external_id.trim() || undefined,
		source_system: meta?.sourceSystem ?? "Member Import",
		program: row.program.trim() || undefined,
		lob: row.lob.trim() || undefined,
		plan_type: row.plan_code.trim() || undefined,
		demographics: {
			date_of_birth: row.date_of_birth.trim() || null,
			gender: normalizeGender(row.gender) || undefined,
			email: row.email.trim() || undefined,
			phone: row.phone.trim() || undefined,
			address_line1: row.address_line1.trim() || undefined,
			address_line2: row.address_line2.trim() || undefined,
			city: row.city.trim() || undefined,
			state: row.state.trim() || undefined,
			postal_code: row.postal_code.trim() || undefined,
		},
		eligibility: {
			status: eligibilityStatus,
		},
		plan_coverage: {
			plan_name: row.plan_name.trim() || undefined,
			plan_code: row.plan_code.trim() || undefined,
		},
		employment_group: {
			group_id: row.group_id.trim() || undefined,
			group_name: row.group_name.trim() || undefined,
		},
	};
}

export const COLUMN_LABELS: Record<MemberImportColumn, string> = {
	cardholder_id: "Cardholder ID",
	person_code: "Person",
	first_name: "First name",
	middle_name: "Middle",
	last_name: "Last name",
	date_of_birth: "DOB",
	gender: "Gender",
	relationship_code: "Rel",
	status: "Status",
	eligibility_status: "Elig status",
	plan_name: "Plan",
	plan_code: "Plan code",
	group_id: "Group ID",
	group_name: "Group",
	email: "Email",
	phone: "Phone",
	address_line1: "Address",
	address_line2: "Addr 2",
	city: "City",
	state: "State",
	postal_code: "ZIP",
	external_id: "External ID",
	program: "Program",
	lob: "LOB",
};

export const REVIEW_VISIBLE_COLUMNS: MemberImportColumn[] = [
	"cardholder_id",
	"person_code",
	"first_name",
	"last_name",
	"date_of_birth",
	"gender",
	"status",
	"plan_name",
	"group_name",
	"email",
	"phone",
];

export const SAMPLE_ELIGIBILITY_ROWS: MemberImportRow[] = [
	{
		...emptyImportRow(),
		cardholder_id: "ELIG-10001",
		person_code: "01",
		first_name: "Ava",
		last_name: "Nguyen",
		date_of_birth: "1988-04-12",
		gender: "F",
		relationship_code: "18",
		status: "active",
		eligibility_status: "eligible",
		plan_name: "PPO Gold",
		plan_code: "PPO-G",
		group_id: "GRP-440",
		group_name: "Acme Manufacturing",
		email: "ava.nguyen@example.com",
		phone: "(410) 555-0101",
		address_line1: "120 Harbor Ave",
		city: "Baltimore",
		state: "MD",
		postal_code: "21201",
		program: "Commercial",
		lob: "Medical",
	},
	{
		...emptyImportRow(),
		cardholder_id: "ELIG-10002",
		person_code: "01",
		first_name: "Marcus",
		last_name: "Reid",
		date_of_birth: "1975-11-03",
		gender: "M",
		relationship_code: "18",
		status: "active",
		eligibility_status: "eligible",
		plan_name: "HMO Silver",
		plan_code: "HMO-S",
		group_id: "GRP-441",
		group_name: "Harbor Logistics",
		email: "marcus.reid@example.com",
		phone: "(301) 555-0144",
		address_line1: "88 Pratt St",
		city: "Baltimore",
		state: "MD",
		postal_code: "21202",
		program: "Commercial",
		lob: "Medical",
	},
	{
		...emptyImportRow(),
		cardholder_id: "ELIG-10003",
		person_code: "02",
		first_name: "Sofia",
		last_name: "Reid",
		date_of_birth: "2008-06-21",
		gender: "F",
		relationship_code: "19",
		status: "active",
		eligibility_status: "eligible",
		plan_name: "HMO Silver",
		plan_code: "HMO-S",
		group_id: "GRP-441",
		group_name: "Harbor Logistics",
		email: "",
		phone: "(301) 555-0144",
		address_line1: "88 Pratt St",
		city: "Baltimore",
		state: "MD",
		postal_code: "21202",
		program: "Commercial",
		lob: "Medical",
	},
];

export const SAMPLE_CLAIM_ROWS: MemberImportRow[] = [
	{
		...emptyImportRow(),
		cardholder_id: "CLM-20011",
		person_code: "01",
		first_name: "Jordan",
		last_name: "Patel",
		date_of_birth: "1991-02-18",
		gender: "M",
		relationship_code: "18",
		status: "active",
		plan_name: "",
		group_id: "CL-900",
		external_id: "RX-778201",
		phone: "(703) 555-0199",
	},
	{
		...emptyImportRow(),
		cardholder_id: "CLM-20012",
		person_code: "01",
		first_name: "Elena",
		last_name: "Brooks",
		date_of_birth: "1984-09-30",
		gender: "F",
		relationship_code: "18",
		status: "active",
		group_id: "CL-901",
		external_id: "RX-778255",
		phone: "(240) 555-0177",
	},
	{
		...emptyImportRow(),
		cardholder_id: "CLM-20013",
		person_code: "01",
		first_name: "Noah",
		last_name: "Kim",
		date_of_birth: "1999-12-01",
		gender: "M",
		relationship_code: "18",
		status: "active",
		group_id: "CL-902",
		external_id: "RX-778301",
		phone: "(202) 555-0166",
	},
];

export const SAMPLE_ACCUMULATOR_ROWS: MemberImportRow[] = [
	{
		...emptyImportRow(),
		cardholder_id: "ACC-30021",
		person_code: "01",
		first_name: "Priya",
		last_name: "Shah",
		date_of_birth: "1986-07-14",
		gender: "F",
		relationship_code: "18",
		status: "active",
		group_id: "ACC-10",
		external_id: "",
		phone: "(410) 555-0188",
	},
	{
		...emptyImportRow(),
		cardholder_id: "ACC-30022",
		person_code: "01",
		first_name: "Liam",
		last_name: "Ortega",
		date_of_birth: "1979-01-25",
		gender: "M",
		relationship_code: "18",
		status: "active",
		group_id: "ACC-11",
		phone: "(301) 555-0122",
	},
	{
		...emptyImportRow(),
		cardholder_id: "ACC-30023",
		person_code: "02",
		first_name: "Mia",
		last_name: "Ortega",
		date_of_birth: "2012-03-08",
		gender: "F",
		relationship_code: "19",
		status: "active",
		group_id: "ACC-11",
		phone: "(301) 555-0122",
	},
];

export function sampleRowsForKind(
	kind: MemberImportFileKind
): MemberImportRow[] {
	if (kind === "claim") return SAMPLE_CLAIM_ROWS;
	if (kind === "accumulator") return SAMPLE_ACCUMULATOR_ROWS;
	return SAMPLE_ELIGIBILITY_ROWS;
}

/** Vendor-style headers for sample downloads (matches real feed naming). */
export function sampleDownloadSpec(kind: MemberImportFileKind): {
	filename: string;
	headers: string[];
	rows: string[][];
} {
	if (kind === "claim") {
		return {
			filename: "member-import-claim-sample.csv",
			headers: [
				"CardholderID",
				"PersonCode",
				"PatientFirstName",
				"PatientLastName",
				"DateOfBirth",
				"Gender",
				"GroupID",
				"ClaimNo",
				"Phone",
			],
			rows: SAMPLE_CLAIM_ROWS.map((r) => [
				r.cardholder_id,
				r.person_code,
				r.first_name,
				r.last_name,
				r.date_of_birth,
				r.gender,
				r.group_id,
				r.external_id,
				r.phone,
			]),
		};
	}
	if (kind === "accumulator") {
		return {
			filename: "member-import-accumulator-sample.csv",
			headers: [
				"Cardholder ID",
				"Person Code",
				"Patient First Name",
				"Patient Last Name",
				"Patient Date Of Birth",
				"Gender",
				"Patient Relationship Code",
				"Client ID",
				"Phone",
			],
			rows: SAMPLE_ACCUMULATOR_ROWS.map((r) => [
				r.cardholder_id,
				r.person_code,
				r.first_name,
				r.last_name,
				r.date_of_birth,
				r.gender,
				r.relationship_code,
				r.group_id,
				r.phone,
			]),
		};
	}
	return {
		filename: "member-import-eligibility-sample.csv",
		headers: [
			"Member ID",
			"Person Code",
			"First Name",
			"Last Name",
			"Date of Birth",
			"Gender",
			"Relationship",
			"Status",
			"Eligibility Status",
			"Plan Name",
			"Plan Code",
			"Group ID",
			"Group Name",
			"Email",
			"Phone",
			"Address Line 1",
			"City",
			"State",
			"Postal Code",
			"Program",
			"LOB",
		],
		rows: SAMPLE_ELIGIBILITY_ROWS.map((r) => [
			r.cardholder_id,
			r.person_code,
			r.first_name,
			r.last_name,
			r.date_of_birth,
			r.gender,
			r.relationship_code,
			r.status,
			r.eligibility_status,
			r.plan_name,
			r.plan_code,
			r.group_id,
			r.group_name,
			r.email,
			r.phone,
			r.address_line1,
			r.city,
			r.state,
			r.postal_code,
			r.program,
			r.lob,
		]),
	};
}

export function rowsToMemberImportCsv(rows: MemberImportRow[]): string {
	return rowsToCsv(
		[...MEMBER_IMPORT_COLUMNS],
		rows.map((row) => MEMBER_IMPORT_COLUMNS.map((col) => row[col] ?? ""))
	);
}

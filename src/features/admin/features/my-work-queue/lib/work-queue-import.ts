import { rowsToCsv } from "@/lib/export/csv";

export const WORK_QUEUE_IMPORT_COLUMNS = [
	"code",
	"name",
	"vendor_type",
	"wave",
	"server_type",
	"notes",
	"primary_contact",
	"primary_email",
	"primary_phone",
	"next_step",
] as const;

export type WorkQueueImportColumn = (typeof WORK_QUEUE_IMPORT_COLUMNS)[number];

export type WorkQueueImportRow = Record<WorkQueueImportColumn, string>;

export type WorkQueueImportRowDraft = WorkQueueImportRow & {
	id: string;
	sourceRow: number;
};

export const WORK_QUEUE_SERVER_TYPE_OPTIONS = [
	"New SFTP",
	"Legacy SFTP",
	"API Feed",
] as const;

const REQUIRED_COLUMNS: WorkQueueImportColumn[] = [
	"code",
	"name",
	"vendor_type",
];

export function normalizeImportHeader(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Parse CSV text into rows of string cells (handles quoted fields). */
export function parseCsvRecords(text: string): string[][] {
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

		if (char === ",") {
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

		if (char === "\r") {
			continue;
		}

		cell += char;
	}

	row.push(cell);
	if (row.some((value) => value.trim().length > 0)) {
		rows.push(row);
	}

	return rows;
}

function emptyImportRow(): WorkQueueImportRow {
	return {
		code: "",
		name: "",
		vendor_type: "",
		wave: "",
		server_type: "",
		notes: "",
		primary_contact: "",
		primary_email: "",
		primary_phone: "",
		next_step: "",
	};
}

export type ParseWorkQueueCsvResult = {
	rows: WorkQueueImportRowDraft[];
	fileErrors: string[];
	skippedEmptyRows: number;
};

export function parseWorkQueueCsv(text: string): ParseWorkQueueCsvResult {
	const decoded = text.replace(/^\uFEFF/, "");
	const records = parseCsvRecords(decoded);
	const fileErrors: string[] = [];

	if (records.length === 0) {
		return {
			rows: [],
			fileErrors: ["CSV file is empty."],
			skippedEmptyRows: 0,
		};
	}

	const headerRecord = records[0] ?? [];
	const headerMap = new Map<WorkQueueImportColumn, number>();

	for (let i = 0; i < headerRecord.length; i += 1) {
		const normalized = normalizeImportHeader(headerRecord[i] ?? "");
		if ((WORK_QUEUE_IMPORT_COLUMNS as readonly string[]).includes(normalized)) {
			headerMap.set(normalized as WorkQueueImportColumn, i);
		}
	}

	for (const required of REQUIRED_COLUMNS) {
		if (!headerMap.has(required)) {
			fileErrors.push(`Missing required column: ${required}`);
		}
	}

	if (fileErrors.length > 0) {
		return { rows: [], fileErrors, skippedEmptyRows: 0 };
	}

	const rows: WorkQueueImportRowDraft[] = [];
	let skippedEmptyRows = 0;

	for (let rowIndex = 1; rowIndex < records.length; rowIndex += 1) {
		const record = records[rowIndex] ?? [];
		const row = emptyImportRow();

		for (const column of WORK_QUEUE_IMPORT_COLUMNS) {
			const cellIndex = headerMap.get(column);
			if (cellIndex == null) continue;
			row[column] = (record[cellIndex] ?? "").trim();
		}

		if (!row.code.trim()) {
			skippedEmptyRows += 1;
			continue;
		}

		rows.push({
			...row,
			id: `import-row-${rowIndex}-${row.code}`,
			sourceRow: rowIndex + 1,
		});
	}

	return { rows, fileErrors, skippedEmptyRows };
}

export type RowValidationIssue = {
	field?: WorkQueueImportColumn | "duplicate_code";
	message: string;
};

export function validateImportRow(
	row: WorkQueueImportRow,
	duplicateCodes: Set<string>
): RowValidationIssue[] {
	const issues: RowValidationIssue[] = [];

	if (!row.code.trim()) {
		issues.push({ field: "code", message: "Code is required" });
	}
	if (!row.name.trim()) {
		issues.push({ field: "name", message: "Name is required" });
	}

	const vendorType = row.vendor_type.trim().toLowerCase();
	if (!vendorType) {
		issues.push({ field: "vendor_type", message: "Type is required" });
	} else if (vendorType !== "tpa" && vendorType !== "tpv") {
		issues.push({
			field: "vendor_type",
			message: "Type must be tpa or tpv",
		});
	}

	if (row.wave.trim() && !/^\d+$/.test(row.wave.trim())) {
		issues.push({ field: "wave", message: "Wave must be a number" });
	}

	if (
		row.primary_email.trim() &&
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.primary_email.trim())
	) {
		issues.push({ field: "primary_email", message: "Invalid email format" });
	}

	const codeKey = row.code.trim().toLowerCase();
	if (codeKey && duplicateCodes.has(codeKey)) {
		issues.push({
			field: "duplicate_code",
			message: "Duplicate code in this import",
		});
	}

	return issues;
}

export function collectDuplicateCodeKeys(
	rows: WorkQueueImportRow[]
): Set<string> {
	const seen = new Map<string, number>();
	const duplicates = new Set<string>();

	for (const row of rows) {
		const key = row.code.trim().toLowerCase();
		if (!key) continue;
		const count = (seen.get(key) ?? 0) + 1;
		seen.set(key, count);
		if (count > 1) duplicates.add(key);
	}

	return duplicates;
}

export function rowsToImportCsv(rows: WorkQueueImportRow[]): string {
	const data = rows.map((row) =>
		WORK_QUEUE_IMPORT_COLUMNS.map((column) => row[column] ?? "")
	);
	return rowsToCsv([...WORK_QUEUE_IMPORT_COLUMNS], data);
}

export function createImportFileFromRows(
	rows: WorkQueueImportRow[],
	filename = "tpa-tpv-import.csv"
): File {
	const csv = rowsToImportCsv(rows);
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	return new File([blob], filename, { type: "text/csv" });
}

export const SAMPLE_IMPORT_ROWS: WorkQueueImportRow[] = [
	{
		code: "TPA-TEST-001",
		name: "Horizon Logistics Test",
		vendor_type: "tpa",
		wave: "1",
		server_type: "New SFTP",
		notes: "Sample import row for testing.",
		primary_contact: "Lisa Walker",
		primary_email: "lisa.w@horizon.com",
		primary_phone: "(410) 555-1122",
		next_step: "Awaiting test file from vendor.",
	},
	{
		code: "TPV-TEST-001",
		name: "Gateway Management Test",
		vendor_type: "tpv",
		wave: "2",
		server_type: "New SFTP",
		notes: "Waiting on IP whitelist confirmation.",
		primary_contact: "Elena Park",
		primary_email: "elena.p@gatewaymgmt.com",
		primary_phone: "(301) 555-4400",
		next_step: "Confirm vendor firewall rules.",
	},
];

export function createBlankImportRowDraft(
	sourceRow = 0
): WorkQueueImportRowDraft {
	return {
		...emptyImportRow(),
		id: `import-row-new-${crypto.randomUUID()}`,
		sourceRow,
	};
}

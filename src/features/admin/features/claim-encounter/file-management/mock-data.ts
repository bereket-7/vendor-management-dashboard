export type TrackedFileRow = {
	id: string;
	inboundFileName: string;
	fileType: string;
	submittedDate: string;
	submittedDateDisplay: string;
	status: string;
	recordCount: number;
	issuer?: string;
	issuers?: string[];
	hhsBatchId?: string;
};

export type TrackFileFilters = {
	issuerName: string;
	fileType: string;
	status: string;
	submittedFrom: string;
	submittedTo: string;
	fileName: string;
};

export const SOURCE_FILE_TYPES = [
	"834 Enrollment",
	"820 Premium Payment",
	"837 Professional",
	"837 Institutional",
	"270 Eligibility",
];

export const ISSUER_FILE_TYPES = [
	"Issuer Enrollment",
	"Issuer Rate File",
	"Issuer Plan Crosswalk",
	"Issuer Payment Notice",
	"TDAT Outbound",
];

export const HHS_FILE_TYPES = [
	"HHS EDGE Submission",
	"HHS Risk Adjustment",
	"HHS Quality Measures",
	"HHS Reconciliation",
	"HHS Inbound Response",
];

export const ISSUER_STATUS_OPTIONS = [
	"Completed",
	"Submitted",
	"In Review",
	"Acknowledged",
	"Returned",
];

export const HHS_STATUS_OPTIONS = [
	"Completed",
	"Queued",
	"Transmitted",
	"Accepted",
	"Rejected",
];

const SOURCE_STATUSES = ["Received", "Validated", "Processing", "Accepted", "Rejected"];

const TEST_CLIENT_IDS = [31663, 32542, 33130, 31674, 32567, 33112, 31890, 32901];

export const ISSUER_NAME_OPTIONS = [
	"All",
	...TEST_CLIENT_IDS.map((id) => `Test Client(${id})`),
];

function pad(n: number) {
	return String(n).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
	return `${year}-${pad(month)}-${pad(day)}`;
}

function displayDate(year: number, month: number, day: number) {
	return `${pad(month)}/${pad(day)}/${year}`;
}

function sourceFileName(index: number) {
	return `SRC_${20260700 + index}_IN_${String(index + 1).padStart(3, "0")}.edi`;
}

function issuerFileName(index: number) {
	const day = 10 + index;
	return `ASMOUT_ACA_32_PROD_202502${pad(day)}_${23103496 + index}.TDAT`;
}

function hhsFileName(index: number) {
	const day = 8 + index;
	return `HHSIN_ACA_32_PROD_202508${pad(day)}_${44102000 + index}.TDAT`;
}

function issuerClients(index: number) {
	const count = 3 + (index % 3);
	return Array.from({ length: count }, (_, i) => {
		const id = TEST_CLIENT_IDS[(index + i) % TEST_CLIENT_IDS.length]!;
		return `Test Client(${id})`;
	});
}

export function mockSourceFiles(): TrackedFileRow[] {
	return Array.from({ length: 12 }, (_, index) => {
		const month = 7;
		const day = 5 + ((index * 3) % 24);
		return {
			id: `src-${index + 1}`,
			inboundFileName: sourceFileName(index),
			fileType: SOURCE_FILE_TYPES[index % SOURCE_FILE_TYPES.length]!,
			submittedDate: isoDate(2026, month, day),
			submittedDateDisplay: displayDate(2026, month, day),
			status: SOURCE_STATUSES[index % SOURCE_STATUSES.length]!,
			recordCount: 120 + index * 37,
			issuer: `Test Client(${TEST_CLIENT_IDS[index % TEST_CLIENT_IDS.length]})`,
		};
	});
}

export function mockIssuerFiles(): TrackedFileRow[] {
	return Array.from({ length: 10 }, (_, index) => {
		const day = 10 + index;
		const issuers = issuerClients(index);
		return {
			id: `iss-${index + 1}`,
			inboundFileName: issuerFileName(index),
			fileType: ISSUER_FILE_TYPES[index % ISSUER_FILE_TYPES.length]!,
			submittedDate: isoDate(2025, 2, day),
			submittedDateDisplay: displayDate(2025, 2, day),
			status: index % 4 === 0 ? "In Review" : "Completed",
			recordCount: [1, 10, 3, 7, 2, 14, 6, 9, 4, 11][index]!,
			issuer: issuers[0],
			issuers,
		};
	});
}

export function mockHhsFiles(): TrackedFileRow[] {
	return Array.from({ length: 8 }, (_, index) => {
		const day = 8 + index;
		const issuerId = TEST_CLIENT_IDS[index % TEST_CLIENT_IDS.length]!;
		return {
			id: `hhs-${index + 1}`,
			inboundFileName: hhsFileName(index),
			fileType: HHS_FILE_TYPES[index % HHS_FILE_TYPES.length]!,
			submittedDate: isoDate(2026, 8, day),
			submittedDateDisplay: displayDate(2026, 8, day),
			status: index % 5 === 0 ? "Queued" : "Completed",
			recordCount: [890, 1120, 654, 1430, 780, 990, 1205, 865][index]!,
			issuer: `Test Client(${issuerId})`,
			issuers: [`Test Client(${issuerId})`],
			hhsBatchId: `HHS-BATCH-${20260000 + index + 1}`,
		};
	});
}

export function filterTrackedFiles(
	rows: TrackedFileRow[],
	filters: Pick<TrackFileFilters, "fileType" | "submittedFrom" | "submittedTo" | "fileName">
) {
	return rows.filter((row) => {
		if (filters.fileType !== "all" && row.fileType !== filters.fileType) {
			return false;
		}
		if (filters.submittedFrom && row.submittedDate < filters.submittedFrom) {
			return false;
		}
		if (filters.submittedTo && row.submittedDate > filters.submittedTo) {
			return false;
		}
		const q = filters.fileName.trim().toLowerCase();
		if (!q) return true;
		return (
			row.inboundFileName.toLowerCase().includes(q) ||
			row.issuer?.toLowerCase().includes(q) ||
			row.issuers?.some((name) => name.toLowerCase().includes(q)) ||
			row.hhsBatchId?.toLowerCase().includes(q)
		);
	});
}

export function filterIssuerHhsFiles(
	rows: TrackedFileRow[],
	filters: TrackFileFilters
) {
	return filterTrackedFiles(rows, filters).filter((row) => {
		if (filters.issuerName !== "all") {
			const matchesIssuer =
				row.issuer === filters.issuerName ||
				row.issuers?.includes(filters.issuerName);
			if (!matchesIssuer) return false;
		}
		if (filters.status !== "all" && row.status !== filters.status) {
			return false;
		}
		return true;
	});
}

export function hasSourceSearch(filters: Pick<TrackFileFilters, "fileType" | "submittedFrom" | "submittedTo" | "fileName">) {
	return (
		filters.fileName.trim() !== "" ||
		filters.fileType !== "all" ||
		filters.submittedFrom !== "" ||
		filters.submittedTo !== ""
	);
}

export function hasIssuerHhsSearch(filters: TrackFileFilters) {
	return (
		hasSourceSearch(filters) ||
		filters.issuerName !== "all" ||
		filters.status !== "all"
	);
}

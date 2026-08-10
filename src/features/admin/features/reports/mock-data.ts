export type ReportTabId =
	| "enrollment-detail"
	| "medical-dental-detail"
	| "pharmacy-detail"
	| "supplemental-detail"
	| "orphan-claims"
	| "enrollee-search"
	| "claim-search"
	| "error-summary"
	| "overlap-analysis"
	| "duplicates"
	| "generate-void-claims";

export const REPORT_TABS: { id: ReportTabId; label: string }[] = [
	{ id: "enrollment-detail", label: "Enrollment Detail" },
	{ id: "medical-dental-detail", label: "Medical/Dental Detail" },
	{ id: "pharmacy-detail", label: "Pharmacy Detail" },
	{ id: "supplemental-detail", label: "Supplemental Detail" },
	{ id: "orphan-claims", label: "Orphan Claims" },
	{ id: "enrollee-search", label: "Enrollee Search" },
	{ id: "claim-search", label: "Claim Search" },
	{ id: "error-summary", label: "Error Summary" },
	{ id: "overlap-analysis", label: "Overlap Analysis" },
	{ id: "duplicates", label: "Duplicates" },
	{ id: "generate-void-claims", label: "Generate Void Claim(s)" },
];

export type ReportTabLayout =
	| "enrollment-detail"
	| "enrollee-search"
	| "claim-search"
	| "error-summary";

export function getReportTabLayout(tabId: ReportTabId): ReportTabLayout {
	switch (tabId) {
		case "enrollee-search":
			return "enrollee-search";
		case "claim-search":
			return "claim-search";
		case "error-summary":
			return "error-summary";
		default:
			return "enrollment-detail";
	}
}

export type EnrollmentReportFilters = {
	issuerName: string;
	process: string;
	enrolleeStatus: string;
	inboundFileName: string;
	fileStatus: string;
	submittedFrom: string;
	submittedTo: string;
};

export type EnrolleeSearchFilters = {
	enrolleeId: string;
	issuerName: string;
};

export type ClaimSearchFilters = {
	claimType: string;
	issuerId: string;
	fieldType: "claim-id" | "enrollee-id";
	fieldValue: string;
};

export type ErrorSummaryFilters = {
	issuerId: string;
	process: string;
	fileType: string;
};

export type EnrollmentReportRow = {
	id: string;
	fileName: string;
	payer: string;
	receivedDateDisplay: string;
	executedDateDisplay: string;
	status: string;
	acceptedReportFileName: string;
	acceptedCount: number;
	rejectedCount: number;
	receivedDate: string;
	issuerName: string;
	process: string;
	enrolleeStatus: string;
	fileStatus: string;
	inboundFileName: string;
};

export type EnrolleeSearchRow = {
	id: string;
	enrolleeId: string;
	issuerName: string;
	status: string;
	effectiveDate: string;
	termDate: string;
};

export type ClaimSearchRow = {
	id: string;
	claimId: string;
	enrolleeId: string;
	claimType: string;
	issuerId: string;
	status: string;
	serviceDate: string;
};

export type ErrorSummaryRow = {
	id: string;
	fileName: string;
	issuerId: string;
	fileType: string;
	process: string;
	errorCount: number;
	status: string;
};

export const REPORT_ISSUER_OPTIONS = [
	"All",
	"Test Client(31663)",
	"Test Client(32542)",
	"Test Client(33130)",
	"Test Client(31674)",
];

export const REPORT_ISSUER_ID_OPTIONS = ["31663", "32542", "33130", "31674", "32567"];

export const REPORT_PROCESS_OPTIONS = ["Optum Process", "OIDS", "HHS"];

export const REPORT_ERROR_PROCESS_OPTIONS = ["ODS", "HHS"];

export const REPORT_ENROLLEE_STATUS_OPTIONS = [
	"Active",
	"Terminated",
	"Pending",
	"Suspended",
];

export const REPORT_FILE_STATUS_OPTIONS = [
	"Completed",
	"In Progress",
	"Failed",
	"Submitted",
];

export const REPORT_ERROR_FILE_TYPES = ["Enrollment", "Medical", "Pharmacy"];

export const REPORT_CLAIM_TYPES = [
	"Professional",
	"Institutional",
	"Pharmacy",
	"Dental",
];

const TAB_PREFIX: Record<ReportTabId, string> = {
	"enrollment-detail": "ENR",
	"medical-dental-detail": "MED",
	"pharmacy-detail": "PHR",
	"supplemental-detail": "SUP",
	"orphan-claims": "ORP",
	"enrollee-search": "ENS",
	"claim-search": "CLM",
	"error-summary": "ERR",
	"overlap-analysis": "OVL",
	"duplicates": "DUP",
	"generate-void-claims": "VOD",
};

function pad(n: number) {
	return String(n).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
	return `${year}-${pad(month)}-${pad(day)}`;
}

function displayDate(year: number, month: number, day: number) {
	return `${pad(month)}/${pad(day)}/${year}`;
}

export function mockEnrollmentReportRows(tabId: ReportTabId): EnrollmentReportRow[] {
	const prefix = TAB_PREFIX[tabId];
	const count = 8 + (prefix.charCodeAt(0) % 4);

	return Array.from({ length: count }, (_, index) => {
		const day = 7 + ((index + prefix.length) % 20);
		const execDay = day + 1;
		const issuer = REPORT_ISSUER_OPTIONS[1 + (index % 4)]!;
		const fileName = `${prefix}_ACA_32_PROD_202507${pad(day)}_${44102000 + index}.TDAT`;
		return {
			id: `${tabId}-${index + 1}`,
			fileName,
			payer: issuer,
			receivedDate: isoDate(2026, 7, day),
			receivedDateDisplay: displayDate(2026, 7, day),
			executedDateDisplay: displayDate(2026, 7, execDay),
			status: index % 5 === 0 ? "In Progress" : "Completed",
			acceptedReportFileName: `ACC_${fileName}`,
			acceptedCount: [12, 48, 7, 19, 3, 55, 21, 9, 14][index % 9]!,
			rejectedCount: [0, 2, 1, 0, 3, 1, 0, 2, 1][index % 9]!,
			issuerName: issuer,
			process: index % 3 === 0 ? "Optum Process" : REPORT_PROCESS_OPTIONS[index % 3]!,
			enrolleeStatus:
				REPORT_ENROLLEE_STATUS_OPTIONS[index % REPORT_ENROLLEE_STATUS_OPTIONS.length]!,
			fileStatus:
				REPORT_FILE_STATUS_OPTIONS[index % REPORT_FILE_STATUS_OPTIONS.length]!,
			inboundFileName: fileName,
		};
	});
}

export function mockEnrolleeSearchRows(): EnrolleeSearchRow[] {
	return Array.from({ length: 8 }, (_, index) => ({
		id: `enrollee-${index + 1}`,
		enrolleeId: `ENR-${100240 + index}`,
		issuerName: REPORT_ISSUER_OPTIONS[1 + (index % 4)]!,
		status: REPORT_ENROLLEE_STATUS_OPTIONS[index % 4]!,
		effectiveDate: displayDate(2025, 1, 1 + index),
		termDate: index % 3 === 0 ? "—" : displayDate(2025, 12, 15 + index),
	}));
}

export function mockClaimSearchRows(): ClaimSearchRow[] {
	return Array.from({ length: 8 }, (_, index) => ({
		id: `claim-${index + 1}`,
		claimId: `CLM-${880000 + index}`,
		enrolleeId: `ENR-${100240 + index}`,
		claimType: REPORT_CLAIM_TYPES[index % REPORT_CLAIM_TYPES.length]!,
		issuerId: REPORT_ISSUER_ID_OPTIONS[index % REPORT_ISSUER_ID_OPTIONS.length]!,
		status: index % 4 === 0 ? "Denied" : "Accepted",
		serviceDate: displayDate(2025, 7, 10 + index),
	}));
}

export function mockErrorSummaryRows(): ErrorSummaryRow[] {
	return Array.from({ length: 8 }, (_, index) => ({
		id: `error-${index + 1}`,
		fileName: `ERR_ACA_32_PROD_202507${pad(10 + index)}_${55001000 + index}.TDAT`,
		issuerId: REPORT_ISSUER_ID_OPTIONS[index % REPORT_ISSUER_ID_OPTIONS.length]!,
		fileType: REPORT_ERROR_FILE_TYPES[index % REPORT_ERROR_FILE_TYPES.length]!,
		process: REPORT_ERROR_PROCESS_OPTIONS[index % 2]!,
		errorCount: 3 + index * 2,
		status: index % 3 === 0 ? "Open" : "Resolved",
	}));
}

export function filterEnrollmentReportRows(
	rows: EnrollmentReportRow[],
	filters: EnrollmentReportFilters
) {
	return rows.filter((row) => {
		if (filters.issuerName !== "all" && row.issuerName !== filters.issuerName) {
			return false;
		}
		if (filters.process !== "all" && row.process !== filters.process) {
			return false;
		}
		if (
			filters.enrolleeStatus !== "all" &&
			row.enrolleeStatus !== filters.enrolleeStatus
		) {
			return false;
		}
		if (filters.fileStatus !== "all" && row.fileStatus !== filters.fileStatus) {
			return false;
		}
		if (filters.submittedFrom && row.receivedDate < filters.submittedFrom) {
			return false;
		}
		if (filters.submittedTo && row.receivedDate > filters.submittedTo) {
			return false;
		}
		const q = filters.inboundFileName.trim().toLowerCase();
		if (!q) return true;
		return (
			row.inboundFileName.toLowerCase().includes(q) ||
			row.fileName.toLowerCase().includes(q) ||
			row.payer.toLowerCase().includes(q)
		);
	});
}

export function filterEnrolleeSearchRows(
	rows: EnrolleeSearchRow[],
	filters: EnrolleeSearchFilters
) {
	return rows.filter((row) => {
		if (filters.issuerName !== "all" && row.issuerName !== filters.issuerName) {
			return false;
		}
		const q = filters.enrolleeId.trim().toLowerCase();
		if (!q) return true;
		return row.enrolleeId.toLowerCase().includes(q);
	});
}

export function filterClaimSearchRows(
	rows: ClaimSearchRow[],
	filters: ClaimSearchFilters
) {
	return rows.filter((row) => {
		if (filters.claimType !== "all" && row.claimType !== filters.claimType) {
			return false;
		}
		if (filters.issuerId !== "all" && row.issuerId !== filters.issuerId) {
			return false;
		}
		const q = filters.fieldValue.trim().toLowerCase();
		if (!q) return true;
		if (filters.fieldType === "claim-id") {
			return row.claimId.toLowerCase().includes(q);
		}
		return row.enrolleeId.toLowerCase().includes(q);
	});
}

export function filterErrorSummaryRows(
	rows: ErrorSummaryRow[],
	filters: ErrorSummaryFilters
) {
	return rows.filter((row) => {
		if (filters.issuerId !== "all" && row.issuerId !== filters.issuerId) {
			return false;
		}
		if (filters.process !== "all" && row.process !== filters.process) {
			return false;
		}
		if (filters.fileType !== "all" && row.fileType !== filters.fileType) {
			return false;
		}
		return true;
	});
}

export const DEFAULT_ENROLLMENT_FILTERS: EnrollmentReportFilters = {
	issuerName: "all",
	process: "Optum Process",
	enrolleeStatus: "all",
	inboundFileName: "",
	fileStatus: "all",
	submittedFrom: "",
	submittedTo: "",
};

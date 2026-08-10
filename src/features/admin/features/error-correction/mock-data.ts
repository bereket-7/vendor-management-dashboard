export const ERROR_CORRECTION_FILE_TYPES = [
	"Enrollment",
	"Medical",
	"Pharmacy",
];

export const ERROR_CORRECTION_PROCESS_TYPES = ["ODS", "HHS", "Optum Process"];

export const ERROR_CORRECTION_ENROLLMENT_YEARS = ["2025", "2024", "2023"];

export const ERROR_CORRECTION_ISSUER_NAMES = [
	"ALL",
	"Test Client(31663)",
	"Test Client(32542)",
	"Test Client(35755)",
];

export const ERROR_CORRECTION_ENROLLEE_TYPES = [
	"Subscriber",
	"Dependent",
	"All Enrollees",
];

export type ErrorSummaryFilters = {
	fileType: string;
	processType: string;
	enrollmentYear: string;
	issuerName: string;
	enrolleeType: string;
};

export type ErrorSummaryRow = {
	id: string;
	errorCode: string;
	errorDescription: string;
	fileName: string;
	enrolleeId: string;
	status: string;
	processType: string;
};

export type ErrorReviewRow = {
	id: string;
	errorCode: string;
	description: string;
	issuerName: string;
	fileType: string;
	assignedTo: string;
	status: "Open" | "In Review" | "Resolved";
	priority: "High" | "Medium" | "Low";
};

export const MOCK_ERROR_SUMMARY_ROWS: ErrorSummaryRow[] = [
	{
		id: "err-1",
		errorCode: "ENR-1042",
		errorDescription: "Missing subscriber relationship code",
		fileName: "ENR_31663_20250314.xml",
		enrolleeId: "E-100245",
		status: "Open",
		processType: "ODS",
	},
	{
		id: "err-2",
		errorCode: "ENR-2201",
		errorDescription: "Invalid benefit effective date",
		fileName: "ENR_31663_20250314.xml",
		enrolleeId: "E-100812",
		status: "Open",
		processType: "ODS",
	},
	{
		id: "err-3",
		errorCode: "ENR-3310",
		errorDescription: "Duplicate enrollee identifier in file",
		fileName: "ENR_32542_20250312.xml",
		enrolleeId: "E-220019",
		status: "Corrected",
		processType: "HHS",
	},
	{
		id: "err-4",
		errorCode: "ENR-1188",
		errorDescription: "Coverage tier does not match plan selection",
		fileName: "ENR_35755_20250310.xml",
		enrolleeId: "E-330441",
		status: "Open",
		processType: "ODS",
	},
];

export const MOCK_ERROR_REVIEW_ROWS: ErrorReviewRow[] = [
	{
		id: "review-1",
		errorCode: "ENR-1042",
		description: "Missing subscriber relationship code",
		issuerName: "Test Client(31663)",
		fileType: "Enrollment",
		assignedTo: "Admin",
		status: "In Review",
		priority: "High",
	},
	{
		id: "review-2",
		errorCode: "ENR-2201",
		description: "Invalid benefit effective date",
		issuerName: "Test Client(31663)",
		fileType: "Enrollment",
		assignedTo: "Admin",
		status: "Open",
		priority: "Medium",
	},
	{
		id: "review-3",
		errorCode: "ENR-3310",
		description: "Duplicate enrollee identifier in file",
		issuerName: "Test Client(32542)",
		fileType: "Enrollment",
		assignedTo: "Ops Team",
		status: "Resolved",
		priority: "Low",
	},
];

export function filterErrorSummaryRows(
	rows: ErrorSummaryRow[],
	filters: ErrorSummaryFilters
) {
	return rows.filter((row) => {
		if (filters.processType !== "all" && row.processType !== filters.processType) {
			return false;
		}
		if (filters.issuerName !== "ALL") {
			const hiosId = filters.issuerName.match(/\((\d+)\)/)?.[1];
			if (hiosId && !row.fileName.includes(hiosId)) {
				return false;
			}
		}
		return true;
	});
}

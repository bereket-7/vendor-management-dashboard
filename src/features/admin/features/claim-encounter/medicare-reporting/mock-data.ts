export { MEDICARE_REPORTING_TABS } from "@/features/admin/features/claim-encounter/program-reporting/mock-data";

export type MedicarePartDSubmissionStatus = "Accepted" | "Rejected" | "Pending";

export type MedicarePartDSubmissionType =
	| "Regular"
	| "Backfill"
	| "Original"
	| "Replacement"
	| "Delete";

export type MedicarePartDResponseStatus =
	| "Processed"
	| "Processed with Errors"
	| "Pending";

export type MedicarePartDErrorSeverity = "Critical" | "High" | "Medium" | "Low";

export type MedicarePartDReconciliationStatus =
	| "In Review"
	| "Reconciled"
	| "Pending";

export type MedicarePartDComplianceStatus =
	| "Compliant"
	| "At Risk"
	| "In Progress";

export const MEDICARE_PART_D_KPIS = {
	submitted: 0,
	submittedDelta: 0,
	accepted: 0,
	acceptedDelta: 0,
	rejected: 0,
	rejectedDelta: 0,
	pending: 0,
	pendingDelta: 0,
	lastCmsResponseAt: "—",
	lastCmsResponseFile: "—",
	lastCmsResponseStatus: "Pending" as MedicarePartDResponseStatus,
};

export const MEDICARE_PART_D_SUBMISSION_STATUS_STYLES: Record<
	MedicarePartDSubmissionStatus,
	string
> = {
	Accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Rejected: "border-red-200 bg-red-50 text-red-700",
	Pending: "border-amber-200 bg-amber-50 text-amber-800",
};

export const MEDICARE_PART_D_RESPONSE_STATUS_STYLES: Record<
	MedicarePartDResponseStatus,
	string
> = {
	Processed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	"Processed with Errors": "border-red-200 bg-red-50 text-red-700",
	Pending: "border-amber-200 bg-amber-50 text-amber-800",
};

export const MEDICARE_PART_D_ERROR_SEVERITY_STYLES: Record<
	MedicarePartDErrorSeverity,
	string
> = {
	Critical: "text-red-600 font-semibold",
	High: "text-orange-600 font-semibold",
	Medium: "text-violet-600 font-medium",
	Low: "text-sky-600 font-medium",
};

export const MEDICARE_PART_D_RECONCILIATION_STATUS_STYLES: Record<
	MedicarePartDReconciliationStatus,
	string
> = {
	"In Review": "border-amber-200 bg-amber-50 text-amber-800",
	Reconciled: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Pending: "border-sky-200 bg-sky-50 text-sky-800",
};

export const MEDICARE_PART_D_COMPLIANCE_STATUS_STYLES: Record<
	MedicarePartDComplianceStatus,
	string
> = {
	Compliant: "border-emerald-200 bg-emerald-50 text-emerald-700",
	"At Risk": "border-amber-200 bg-amber-50 text-amber-800",
	"In Progress": "border-sky-200 bg-sky-50 text-sky-800",
};

export const MEDICARE_PART_D_ERROR_SEVERITY_FILTER = [
	"All",
	"Critical",
	"High",
	"Medium",
	"Low",
] as const;

export const MEDICARE_PART_D_ERROR_TYPE_FILTER = [
	"All",
	"Data Validation",
	"Format Error",
	"Business Rule",
] as const;

export type MedicarePartDSubmission = {
	id: string;
	fileName: string;
	submissionType: MedicarePartDSubmissionType;
	pbp: string;
	submittedOn: string;
	recordCount: number;
	status: MedicarePartDSubmissionStatus;
};

export type MedicarePartDResponse = {
	id: string;
	responseFile: string;
	receivedOn: string;
	pdeSubmission: string;
	status: MedicarePartDResponseStatus;
};

export type MedicarePartDValidationError = {
	id: string;
	code: string;
	description: string;
	errorType: string;
	severity: MedicarePartDErrorSeverity;
	pdeSubmission: string;
	recordsImpacted: number;
};

export type MedicarePartDReconciliationRow = {
	id: string;
	type: string;
	pbp: string;
	recordsSubmitted: number;
	cmsAccepted: number;
	variance: number;
	status: MedicarePartDReconciliationStatus;
	lastReconciled: string;
};

export type MedicarePartDComplianceRow = {
	id: string;
	requirement: string;
	description: string;
	frequency: string;
	dueDate: string;
	status: MedicarePartDComplianceStatus;
};

export type MedicarePartDDocument = {
	id: string;
	name: string;
	documentType: string;
	reportingPeriod: string;
	uploadedOn: string;
	size: string;
};

export const MEDICARE_PART_D_SUBMISSIONS: MedicarePartDSubmission[] = [];

export const MEDICARE_PART_D_RESPONSES: MedicarePartDResponse[] = [];

export const MEDICARE_PART_D_VALIDATION_ERRORS: MedicarePartDValidationError[] = [];

export const MEDICARE_PART_D_RECONCILIATION: MedicarePartDReconciliationRow[] = [];

export const MEDICARE_PART_D_COMPLIANCE: MedicarePartDComplianceRow[] = [];

export const MEDICARE_PART_D_DOCUMENTS: MedicarePartDDocument[] = [];

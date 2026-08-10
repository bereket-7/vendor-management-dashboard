import type { ProgramFileType } from "@/types/UI/system.types";
import { isMockEnabled } from "@/lib/mock-mode";

export type FileDirection = "inbound" | "outbound";
export type ProcessStatus =
	| "success"
	| "failed"
	| "late"
	| "missing"
	| "processing"
	| "warning";

export type { ProgramFileType };

export type PipelineStepStatus =
	| "completed"
	| "failed"
	| "running"
	| "skipped"
	| "pending";

export type PipelineStep = {
	id: string;
	label: string;
	status: PipelineStepStatus;
	at: string | null;
	durationMs: number | null;
	detail?: string;
};

export type ValidationIssue = {
	id: string;
	severity: "error" | "warning" | "info";
	code: string;
	message: string;
	line?: number;
	field?: string;
	memberId?: string;
	receivedValue?: string;
	expectedValue?: string;
	validationRule?: string;
	recommendedResolution?: string;
	resolutionSteps?: string[];
	relatedInformation?: string;
	status?: "open" | "in_progress" | "resolved";
	/** Optional panel title override (defaults to Member Context / Entity Context) */
	contextTitle?: string;
	/** Flexible key/value rows for the context panel */
	contextFields?: { label: string; value: string }[];
	memberContext?: {
		subscriberName?: string;
		dateOfBirth?: string;
		gender?: string;
		memberId?: string;
		groupNumber?: string;
		coverageStart?: string;
		coverageEnd?: string;
	};
	recordSnippet?: string[];
	investigationHistory?: {
		id: string;
		at: string;
		user: string;
		action: string;
		notes?: string;
	}[];
};

export type LogEntry = {
	id: string;
	at: string;
	level: "info" | "warn" | "error" | "debug";
	message: string;
	component?: string;
	details?: string;
};

export type FileRun = {
	id: string;
	runId: string;
	vendor: string;
	/** Live vendor-core UUID when data is remote (not mock directory id). */
	vendorId?: string | null;
	account: string;
	client: string;
	fileType: string;
	/** Program jurisdiction — filtered by global MDH/DHCF/BHP selector */
	program: ProgramFileType;
	direction: FileDirection;
	frequency: string;
	expectedAt: string;
	receivedAt: string | null;
	startedAt: string | null;
	completedAt: string | null;
	status: ProcessStatus;
	fileName: string | null;
	records: number | null;
	recordsValid: number | null;
	recordsRejected: number | null;
	recordsLoaded: number | null;
	errorCount: number;
	warningCount: number;
	duration: string | null;
	fileSizeKb: number | null;
	checksum: string | null;
	protocol: string;
	sourcePath: string | null;
	destinationPath: string | null;
	slaMinutes: number;
	latencyMinutes: number | null;
	scheduleId: string;
	correlationId: string;
	operator: string;
	notes: string | null;
	reviewed: boolean;
	pipeline: PipelineStep[];
	issues: ValidationIssue[];
	logs: LogEntry[];
};

type RawFileRun = Omit<FileRun, "program">;

const RAW_FILE_RUNS: RawFileRun[] = [
	{
		id: "f1",
		runId: "FR-2026-0727-00142",
		vendor: "Apex Industrial Supply",
		account: "APX-US-01",
		client: "Tilla North America",
		fileType: "Invoice EDI",
		direction: "inbound",
		frequency: "Daily",
		expectedAt: "2026-07-27 08:00",
		receivedAt: "2026-07-27 07:52",
		startedAt: "2026-07-27 07:52:18",
		completedAt: "2026-07-27 07:53:41",
		status: "success",
		fileName: "APX_INV_20260727.xml",
		records: 142,
		recordsValid: 140,
		recordsRejected: 2,
		recordsLoaded: 140,
		errorCount: 1,
		warningCount: 3,
		duration: "00:01:23",
		fileSizeKb: 384,
		checksum: "sha256:9f2c…a81e",
		protocol: "SFTP",
		sourcePath: "/inbound/apex/invoices/",
		destinationPath: "/processed/invoices/2026/07/27/",
		slaMinutes: 30,
		latencyMinutes: -8,
		scheduleId: "SCH-APX-INV-DAILY",
		correlationId: "a8f31c2a-0b14-4e91-9c22-77d1e0a10001",
		operator: "System",
		notes: null,
		reviewed: true,
		pipeline: [
			{
				id: "p1",
				label: "File detected",
				status: "completed",
				at: "07:52:04",
				durationMs: 120,
			},
			{
				id: "p2",
				label: "Transfer complete",
				status: "completed",
				at: "07:52:18",
				durationMs: 14000,
			},
			{
				id: "p3",
				label: "Schema validation",
				status: "completed",
				at: "07:52:44",
				durationMs: 26000,
			},
			{
				id: "p4",
				label: "Business rules",
				status: "completed",
				at: "07:53:12",
				durationMs: 28000,
			},
			{
				id: "p5",
				label: "Post to ledger",
				status: "completed",
				at: "07:53:41",
				durationMs: 29000,
			},
		],
		issues: [
			{
				id: "f1-i1",
				severity: "warning",
				code: "INV-TAX-ROUND",
				message: "Tax amount rounded differently than expected precision.",
				line: 18,
				field: "Tax Amount",
				memberId: "PO-4412",
				status: "resolved",
				receivedValue: "12.455",
				expectedValue: "Two decimal places (12.46)",
				validationRule:
					"INV-TAX-ROUND: Invoice tax amounts must use two-decimal currency precision.",
				recommendedResolution:
					"Confirm rounding rule with Apex AP and reprocess if material.",
				resolutionSteps: [
					"Compare tax line to PO tax schedule.",
					"Apply banker's rounding to two decimals.",
					"Accept or reprocess the invoice node.",
				],
				relatedInformation: "X12 810 IT1 / TXI · Companion Guide 3.1",
				investigationHistory: [
					{
						id: "ih1",
						at: "07:53:05",
						user: "System",
						action: "Warning raised",
					},
				],
			},
			{
				id: "f1-i2",
				severity: "error",
				code: "INV-PO-MISSING",
				message: "Referenced purchase order not found.",
				line: 42,
				field: "PO Number",
				memberId: "PO-9981",
				status: "open",
				receivedValue: "PO-9981",
				expectedValue: "Open PO in procurement master",
				validationRule:
					"INV-PO-MISSING: Invoice must reference an active purchase order.",
				recommendedResolution:
					"Create or restore PO-9981, or correct the invoice PO reference.",
				resolutionSteps: [
					"Search procurement for alternate PO numbers.",
					"Update invoice BIG segment if wrong.",
					"Reprocess quarantined invoice.",
				],
				relatedInformation: "X12 810 BIG03 · AP staging",
				recordSnippet: [
					"BIG*20260727*INV-7781**PO-9981~",
					"N1*SE*Apex Industrial Supply~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "07:53:10",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "f1-i3",
				severity: "warning",
				code: "INV-QTY-TOL",
				message: "Shipped quantity exceeds PO tolerance by 2%.",
				line: 67,
				field: "Quantity",
				memberId: "PO-4412-L3",
				status: "open",
				receivedValue: "510",
				expectedValue: "Within 2% of ordered qty (500)",
				validationRule:
					"Invoice quantity may not exceed PO ordered quantity beyond configured tolerance.",
				recommendedResolution:
					"Approve over-shipment or adjust invoice quantity to 500.",
				relatedInformation: "PO-4412 line 3 · tolerance 2%",
			},
			{
				id: "f1-i4",
				severity: "warning",
				code: "INV-DUP-CHECK",
				message: "Possible duplicate invoice number within 30 days.",
				line: 1,
				field: "Invoice Number",
				memberId: "INV-7781",
				status: "open",
				receivedValue: "INV-7781",
				expectedValue: "Unique invoice number per vendor",
				validationRule:
					"Duplicate invoice numbers from the same vendor within 30 days raise a warning.",
				recommendedResolution:
					"Confirm with Apex whether INV-7781 is a rebill or true duplicate.",
				relatedInformation: "AP duplicate detector · vendor APX-US-01",
			},
			{
				id: "f1-i5",
				severity: "info",
				code: "INV-CURR-OK",
				message: "Currency code validated as USD.",
				line: 1,
				field: "Currency",
				memberId: "—",
				status: "resolved",
				receivedValue: "USD",
				expectedValue: "USD, EUR, or ETB",
				validationRule: "Invoice currency must be an approved ISO code.",
				recommendedResolution: "No action required.",
				relatedInformation: "X12 810 CUR",
			},
		],
		logs: [
			{
				id: "l1",
				at: "07:52:04",
				level: "info",
				message: "Inbound file landed on SFTP watch folder.",
			},
			{
				id: "l2",
				at: "07:52:18",
				level: "info",
				message: "Checksum verified (sha256).",
			},
			{
				id: "l3",
				at: "07:52:44",
				level: "info",
				message: "XSD validation passed — 142 invoice nodes.",
			},
			{
				id: "l4",
				at: "07:53:41",
				level: "info",
				message: "Run completed successfully. Posted to AP staging.",
			},
		],
	},
	{
		id: "f2",
		runId: "FR-2026-0727-00158",
		vendor: "Horizon Logistics",
		account: "HRZ-ET-02",
		client: "Tilla East Africa",
		fileType: "ASN",
		direction: "inbound",
		frequency: "Daily",
		expectedAt: "2026-07-27 09:00",
		receivedAt: "2026-07-27 09:41",
		startedAt: "2026-07-27 09:41:22",
		completedAt: "2026-07-27 09:45:10",
		status: "failed",
		fileName: "HRZ_ASN_0727.csv",
		records: 1250,
		recordsValid: 1232,
		recordsRejected: 18,
		recordsLoaded: 1232,
		errorCount: 14,
		warningCount: 4,
		duration: "00:03:48",
		fileSizeKb: 96,
		checksum: "sha256:1ab4…c09d",
		protocol: "SFTP",
		sourcePath: "/inbound/horizon/asn/",
		destinationPath: "/processed/asn/2026/07/27/",
		slaMinutes: 15,
		latencyMinutes: 41,
		scheduleId: "SCH-HRZ-ASN-DAILY",
		correlationId: "44b9e110-8c2a-4f01-b771-9aa01c220002",
		operator: "System",
		notes: "Arrived after cutoff; validation failures quarantined.",
		reviewed: false,
		pipeline: [
			{
				id: "p1",
				label: "File detected",
				status: "completed",
				at: "09:41:08",
				durationMs: 90,
				detail: "41 min past expected window",
			},
			{
				id: "p2",
				label: "Transfer complete",
				status: "completed",
				at: "09:41:22",
				durationMs: 14000,
			},
			{
				id: "p3",
				label: "Schema validation",
				status: "failed",
				at: "09:42:01",
				durationMs: 39000,
			},
			{
				id: "p4",
				label: "Business rules",
				status: "completed",
				at: "09:44:40",
				durationMs: 39000,
				detail: "18 rows quarantined",
			},
			{
				id: "p5",
				label: "Post to WMS",
				status: "completed",
				at: "09:45:10",
				durationMs: 25000,
			},
		],
		issues: [
			{
				id: "i1",
				severity: "error",
				code: "VAL-1001",
				message: "Invalid date format. Expected MM/DD/YYYY.",
				line: 120,
				field: "Subscriber DOB",
				memberId: "987654321",
				status: "open",
				receivedValue: "2006-07-35",
				expectedValue: "Valid date in MM/DD/YYYY format",
				validationRule:
					"VAL-1001: Date fields must be in a valid calendar date format.",
				recommendedResolution:
					"Correct the date to a valid calendar date (e.g. 07/04/2006) and resubmit the file.",
				resolutionSteps: [
					"Verify the Subscriber DOB is correct in the source system.",
					"Update the date to a valid calendar date in MM/DD/YYYY format.",
					"Regenerate and reprocess the file.",
				],
				relatedInformation:
					"X12 834 Loop 2000A, DTP*291 (Subscriber Date Companion Guide 2.2.2.1)",
				memberContext: {
					subscriberName: "DOE, JOHN",
					dateOfBirth: "05/15/1980",
					gender: "Male",
					memberId: "987654321",
					groupNumber: "GRP12345",
					coverageStart: "01/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"INS*Y*18*030*20*A***FT~",
					"REF*0F*987654321~",
					"NM1*IL*1*DOE*JOHN****MI*987654321~",
					"DMG*D8*19800515*M~",
					"DTP*291*D8*20060735~",
					"HD*030**HLT*GRP12345*EMP~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:46:12",
						user: "Kassie M. (Admin)",
						action: "Investigation opened",
						notes: "Opened from validation results.",
					},
					{
						id: "ih2",
						at: "09:46:40",
						user: "Kassie M. (Admin)",
						action: "Viewed error details",
					},
				],
			},
			{
				id: "i2",
				severity: "error",
				code: "VAL-2003",
				message: "Subscriber ID not found in reference file.",
				line: 245,
				field: "Subscriber ID",
				memberId: "987654321",
				status: "open",
				receivedValue: "987654321",
				expectedValue:
					"A valid Subscriber ID that exists in the subscriber reference file.",
				validationRule:
					"VAL-2003: Subscriber ID must exist in the subscriber reference file. Reference File: HRZ_Subscriber_20260727.csv",
				recommendedResolution:
					"Verify the Subscriber ID is correct and present in the reference file.",
				resolutionSteps: [
					"Verify the Subscriber ID is correct and present in the reference file.",
					"If the ID is incorrect, update the source system and regenerate the file.",
					"If the ID is correct, add the subscriber to the reference file and reprocess.",
				],
				relatedInformation:
					"X12 834 Loop 2000A, NM1*IL · Companion Guide: Section 2.2.3.1",
				memberContext: {
					subscriberName: "DOE, JOHN",
					dateOfBirth: "05/15/1980",
					gender: "Male",
					memberId: "987654321",
					groupNumber: "GRP12345",
					coverageStart: "01/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"INS*Y*18*030*20*A***FT~",
					"NM1*IL*1*DOE*JOHN****MI*987654321~",
					"REF*0F*987654321~",
					"DMG*D8*19800515*M~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:47:02",
						user: "Kassie M. (Admin)",
						action: "Investigation opened",
					},
					{
						id: "ih2",
						at: "09:47:18",
						user: "Kassie M. (Admin)",
						action: "Viewed error details",
						notes: "Checked reference file match.",
					},
				],
			},
			{
				id: "i3",
				severity: "warning",
				code: "VAL-3003",
				message: "Invalid gender code. Expected M, F, or U.",
				line: 367,
				field: "Gender Code",
				memberId: "123456789",
				status: "open",
				receivedValue: "X",
				expectedValue: "M, F, or U",
				validationRule: "VAL-3003: Gender code must be one of M, F, or U.",
				recommendedResolution:
					"Correct the gender code in the source file and reprocess.",
				resolutionSteps: [
					"Confirm the intended gender code with the vendor.",
					"Update the source record to M, F, or U.",
					"Reprocess the quarantined row.",
				],
				relatedInformation: "X12 834 Loop 2000A, DMG03",
				memberContext: {
					subscriberName: "SMITH, JANE",
					dateOfBirth: "11/02/1992",
					gender: "—",
					memberId: "123456789",
					groupNumber: "GRP88901",
					coverageStart: "03/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"NM1*IL*1*SMITH*JANE****MI*123456789~",
					"DMG*D8*19921102*X~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:48:01",
						user: "System",
						action: "Warning raised",
					},
				],
			},
			{
				id: "i4",
				severity: "error",
				code: "VAL-1001",
				message: "Data cannot be in the future.",
				line: 401,
				field: "Subscriber DOB",
				memberId: "556677889",
				status: "open",
				receivedValue: "03/15/2031",
				expectedValue: "A past or current calendar date",
				validationRule:
					"VAL-1001: Date of birth must not be a future date relative to the run date.",
				recommendedResolution:
					"Correct the DOB to the member's actual birth date and resubmit.",
				resolutionSteps: [
					"Confirm DOB with the enrollment source.",
					"Update the record to a non-future date.",
					"Reprocess the quarantined row.",
				],
				relatedInformation:
					"X12 834 Loop 2000A, DMG*D8 · Companion Guide 2.2.2.1",
				memberContext: {
					subscriberName: "ABEBE, SARA",
					dateOfBirth: "—",
					gender: "Female",
					memberId: "556677889",
					groupNumber: "GRP44110",
					coverageStart: "02/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"NM1*IL*1*ABEBE*SARA****MI*556677889~",
					"DMG*D8*20310315*F~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:48:22",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i5",
				severity: "error",
				code: "ASN-SKU-UNKNOWN",
				message: "Unknown SKU referenced in shipment line.",
				line: 12,
				field: "SKU",
				memberId: "441002001",
				status: "open",
				receivedValue: "SKU-ZZ-9999",
				expectedValue: "Active SKU from vendor catalog",
				validationRule:
					"Shipment line SKU must exist in the approved vendor catalog and be active as of the run date.",
				recommendedResolution:
					"Confirm SKU with the vendor, update the catalog, then reprocess quarantined rows.",
				resolutionSteps: [
					"Confirm SKU with the vendor.",
					"Update the approved catalog if needed.",
					"Reprocess quarantined rows.",
				],
				relatedInformation: "Catalog sync SCH-HRZ-CAT · WMS item master",
				investigationHistory: [
					{
						id: "ih1",
						at: "09:42:55",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i6",
				severity: "error",
				code: "VAL-4102",
				message: "Coverage end date precedes coverage start date.",
				line: 488,
				field: "Coverage End",
				memberId: "778899001",
				status: "open",
				receivedValue: "01/01/2025",
				expectedValue: "On or after coverage start (06/01/2026)",
				validationRule:
					"VAL-4102: Coverage end must be greater than or equal to coverage start.",
				recommendedResolution:
					"Correct the coverage dates so end is on/after start, then resubmit.",
				resolutionSteps: [
					"Confirm intended coverage window with benefits admin.",
					"Update DTP*349 / DTP*348 values accordingly.",
					"Reprocess the member record.",
				],
				relatedInformation: "X12 834 Loop 2300, DTP*348 / DTP*349",
				memberContext: {
					subscriberName: "TESFAYE, DANIEL",
					dateOfBirth: "09/21/1988",
					gender: "Male",
					memberId: "778899001",
					groupNumber: "GRP22001",
					coverageStart: "06/01/2026",
					coverageEnd: "01/01/2025",
				},
				recordSnippet: [
					"NM1*IL*1*TESFAYE*DANIEL****MI*778899001~",
					"DTP*348*D8*20260601~",
					"DTP*349*D8*20250101~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:49:10",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i7",
				severity: "error",
				code: "VAL-2003",
				message: "Subscriber ID not found in reference file.",
				line: 512,
				field: "Subscriber ID",
				memberId: "334455667",
				status: "open",
				receivedValue: "334455667",
				expectedValue:
					"A valid Subscriber ID that exists in the subscriber reference file.",
				validationRule:
					"VAL-2003: Subscriber ID must exist in the subscriber reference file. Reference File: HRZ_Subscriber_20260727.csv",
				recommendedResolution:
					"Add the subscriber to the reference file or correct the ID, then reprocess.",
				resolutionSteps: [
					"Search the reference file for alternate IDs for this member.",
					"Update source enrollment data if the ID is wrong.",
					"Reprocess after reference file refresh.",
				],
				relatedInformation:
					"X12 834 Loop 2000A, NM1*IL · Companion Guide: Section 2.2.3.1",
				memberContext: {
					subscriberName: "KEBEDE, MIRIAM",
					dateOfBirth: "02/14/1995",
					gender: "Female",
					memberId: "334455667",
					groupNumber: "GRP12345",
					coverageStart: "01/15/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"NM1*IL*1*KEBEDE*MIRIAM****MI*334455667~",
					"REF*0F*334455667~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:49:40",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i8",
				severity: "warning",
				code: "SLA-LATE",
				message: "File received 41 minutes after expected cutoff.",
				line: 1,
				field: "Run window",
				memberId: "—",
				status: "open",
				receivedValue: "09:41",
				expectedValue: "On or before 09:00",
				validationRule:
					"Inbound ASN files must arrive within the configured daily SLA window.",
				recommendedResolution:
					"Confirm vendor schedule adherence and escalate if lateness continues.",
				resolutionSteps: [
					"Confirm vendor delivery schedule.",
					"Escalate recurring SLA breaches to vendor ops.",
					"Adjust SLA window only if business-approved.",
				],
				relatedInformation: "Schedule SCH-HRZ-ASN-DAILY · SLA 15 minutes",
				investigationHistory: [
					{
						id: "ih1",
						at: "09:41:10",
						user: "System",
						action: "SLA breach recorded",
					},
				],
			},
			{
				id: "i9",
				severity: "error",
				code: "VAL-5201",
				message: "Required field Group Number is missing.",
				line: 620,
				field: "Group Number",
				memberId: "990011223",
				status: "open",
				receivedValue: "(blank)",
				expectedValue: "Non-empty group/policy number",
				validationRule:
					"VAL-5201: Group Number (REF*1L) is required for active coverage records.",
				recommendedResolution:
					"Populate the group number from the enrollment source and resubmit the row.",
				resolutionSteps: [
					"Locate the member's group assignment in HRIS.",
					"Update REF*1L in the source extract.",
					"Reprocess quarantined rows.",
				],
				relatedInformation: "X12 834 Loop 2000, REF*1L",
				memberContext: {
					subscriberName: "HAILU, YONAS",
					dateOfBirth: "07/08/1979",
					gender: "Male",
					memberId: "990011223",
					groupNumber: "—",
					coverageStart: "04/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"NM1*IL*1*HAILU*YONAS****MI*990011223~",
					"HD*030**HLT**EMP~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:50:05",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i10",
				severity: "error",
				code: "ASN-QTY-MISMATCH",
				message: "Ship quantity exceeds ordered quantity.",
				line: 88,
				field: "Ship Qty",
				memberId: "441002088",
				status: "open",
				receivedValue: "250",
				expectedValue: "Less than or equal to ordered qty (180)",
				validationRule:
					"ASN ship quantity cannot exceed the open PO line ordered quantity.",
				recommendedResolution:
					"Correct the ship quantity or update the PO before reprocessing.",
				resolutionSteps: [
					"Confirm physical shipment count with warehouse.",
					"Adjust ASN line quantity or raise a PO change.",
					"Reprocess the ASN line.",
				],
				relatedInformation: "ASN line 88 · PO PO-HRZ-88421 line 3",
				investigationHistory: [
					{
						id: "ih1",
						at: "09:43:12",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i11",
				severity: "error",
				code: "VAL-1001",
				message: "Invalid date format. Expected MM/DD/YYYY.",
				line: 701,
				field: "Coverage Start",
				memberId: "112233445",
				status: "open",
				receivedValue: "2026-13-01",
				expectedValue: "Valid date in MM/DD/YYYY format",
				validationRule:
					"VAL-1001: Date fields must be in a valid calendar date format.",
				recommendedResolution:
					"Correct the coverage start to a valid calendar date (e.g. 01/13/2026).",
				resolutionSteps: [
					"Confirm coverage effective date with benefits admin.",
					"Rewrite DTP*348 using a valid calendar date.",
					"Reprocess the member record.",
				],
				relatedInformation: "X12 834 Loop 2300, DTP*348",
				memberContext: {
					subscriberName: "GIRMA, HELEN",
					dateOfBirth: "12/01/1990",
					gender: "Female",
					memberId: "112233445",
					groupNumber: "GRP88901",
					coverageStart: "—",
					coverageEnd: "—",
				},
				recordSnippet: [
					"NM1*IL*1*GIRMA*HELEN****MI*112233445~",
					"DTP*348*D8*20261301~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:50:44",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i12",
				severity: "error",
				code: "VAL-3003",
				message: "Invalid gender code. Expected M, F, or U.",
				line: 844,
				field: "Gender Code",
				memberId: "667788990",
				status: "open",
				receivedValue: "N",
				expectedValue: "M, F, or U",
				validationRule: "VAL-3003: Gender code must be one of M, F, or U.",
				recommendedResolution:
					"Map the source gender value to M, F, or U and reprocess.",
				resolutionSteps: [
					"Confirm gender mapping rules with the vendor.",
					"Update DMG03 to an allowed code.",
					"Reprocess the quarantined row.",
				],
				relatedInformation: "X12 834 Loop 2000A, DMG03",
				memberContext: {
					subscriberName: "MEKONNEN, BIRUK",
					dateOfBirth: "04/30/1985",
					gender: "—",
					memberId: "667788990",
					groupNumber: "GRP22001",
					coverageStart: "05/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"NM1*IL*1*MEKONNEN*BIRUK****MI*667788990~",
					"DMG*D8*19850430*N~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:51:02",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i13",
				severity: "error",
				code: "VAL-6104",
				message: "Postal code format is invalid for country code.",
				line: 902,
				field: "Postal Code",
				memberId: "223344556",
				status: "open",
				receivedValue: "ABC-12",
				expectedValue: "5-digit or ZIP+4 for US; valid ET format for ET",
				validationRule:
					"VAL-6104: Postal code must match the country-specific format.",
				recommendedResolution:
					"Correct the postal code for the member address country and resubmit.",
				resolutionSteps: [
					"Confirm country code on N3/N4 segments.",
					"Update postal code to the expected pattern.",
					"Reprocess the quarantined row.",
				],
				relatedInformation: "X12 834 Loop 2100A, N4",
				memberContext: {
					subscriberName: "ASSEFA, LEMLEM",
					dateOfBirth: "08/19/1991",
					gender: "Female",
					memberId: "223344556",
					groupNumber: "GRP44110",
					coverageStart: "01/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"NM1*IL*1*ASSEFA*LEMLEM****MI*223344556~",
					"N3*12 Bole Road~",
					"N4*Addis Ababa*AA*ABC-12*ET~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:51:20",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i14",
				severity: "warning",
				code: "VAL-7001",
				message: "Dependent relationship code is unusual for subscriber.",
				line: 955,
				field: "Relationship",
				memberId: "334455112",
				status: "open",
				receivedValue: "G8",
				expectedValue: "18 (self), 01 (spouse), 19 (child), or approved codes",
				validationRule:
					"VAL-7001: Relationship codes outside the approved set generate a warning.",
				recommendedResolution:
					"Confirm the relationship mapping with enrollment and update if needed.",
				resolutionSteps: [
					"Review INS02 relationship code.",
					"Map to an approved companion-guide value.",
					"Reprocess if corrected.",
				],
				relatedInformation: "X12 834 Loop 2000, INS02",
				memberContext: {
					subscriberName: "WOLDE, SAMSON",
					dateOfBirth: "01/03/1976",
					gender: "Male",
					memberId: "334455112",
					groupNumber: "GRP12345",
					coverageStart: "02/15/2026",
					coverageEnd: "—",
				},
				recordSnippet: ["INS*Y*G8*030*20*A***FT~"],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:51:33",
						user: "System",
						action: "Warning raised",
					},
				],
			},
			{
				id: "i15",
				severity: "error",
				code: "ASN-UOM-INVALID",
				message: "Unit of measure code is not recognized.",
				line: 104,
				field: "UOM",
				memberId: "441002104",
				status: "open",
				receivedValue: "BXZ",
				expectedValue: "EA, CS, or PLT",
				validationRule:
					"ASN line UOM must be one of the approved warehouse codes.",
				recommendedResolution:
					"Replace BXZ with an approved UOM and reprocess the ASN line.",
				resolutionSteps: [
					"Confirm packing unit with warehouse.",
					"Update ASN UOM to EA, CS, or PLT.",
					"Reprocess quarantined line.",
				],
				relatedInformation: "ASN line 104 · WMS UOM dictionary",
				investigationHistory: [
					{
						id: "ih1",
						at: "09:43:40",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i16",
				severity: "error",
				code: "VAL-1001",
				message: "Invalid date format. Expected MM/DD/YYYY.",
				line: 1012,
				field: "Coverage End",
				memberId: "889900112",
				status: "open",
				receivedValue: "31/12/2026",
				expectedValue: "Valid date in MM/DD/YYYY format",
				validationRule:
					"VAL-1001: Date fields must be in a valid calendar date format.",
				recommendedResolution:
					"Rewrite the coverage end as 12/31/2026 and resubmit.",
				resolutionSteps: [
					"Confirm coverage end with benefits admin.",
					"Convert from DD/MM/YYYY to MM/DD/YYYY.",
					"Reprocess the member record.",
				],
				relatedInformation: "X12 834 Loop 2300, DTP*349",
				memberContext: {
					subscriberName: "BELAY, RAHEL",
					dateOfBirth: "06/22/1987",
					gender: "Female",
					memberId: "889900112",
					groupNumber: "GRP88901",
					coverageStart: "01/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: [
					"NM1*IL*1*BELAY*RAHEL****MI*889900112~",
					"DTP*349*D8*20263112~",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:52:01",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i17",
				severity: "error",
				code: "VAL-2003",
				message: "Subscriber ID not found in reference file.",
				line: 1088,
				field: "Subscriber ID",
				memberId: "101010101",
				status: "open",
				receivedValue: "101010101",
				expectedValue:
					"A valid Subscriber ID that exists in the subscriber reference file.",
				validationRule:
					"VAL-2003: Subscriber ID must exist in the subscriber reference file.",
				recommendedResolution:
					"Add the subscriber to the reference file or correct the ID.",
				resolutionSteps: [
					"Search alternate IDs for this member.",
					"Update enrollment extract if wrong.",
					"Refresh reference file and reprocess.",
				],
				relatedInformation:
					"X12 834 Loop 2000A, NM1*IL · Companion Guide 2.2.3.1",
				memberContext: {
					subscriberName: "TADESSE, ABEL",
					dateOfBirth: "10/10/1999",
					gender: "Male",
					memberId: "101010101",
					groupNumber: "GRP22001",
					coverageStart: "07/01/2026",
					coverageEnd: "—",
				},
				recordSnippet: ["NM1*IL*1*TADESSE*ABEL****MI*101010101~"],
				investigationHistory: [
					{
						id: "ih1",
						at: "09:52:18",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "i18",
				severity: "warning",
				code: "ASN-DUP-LINE",
				message: "Duplicate shipment line detected for the same SKU/lot.",
				line: 156,
				field: "SKU / Lot",
				memberId: "441002156",
				status: "open",
				receivedValue: "SKU-AA-100 · LOT-991",
				expectedValue: "Unique SKU + lot combination per ASN",
				validationRule:
					"ASN lines must not repeat the same SKU and lot within a single file.",
				recommendedResolution:
					"Remove or consolidate the duplicate line before resubmitting.",
				resolutionSteps: [
					"Identify duplicate ASN lines.",
					"Merge quantities or drop the duplicate.",
					"Reprocess the ASN.",
				],
				relatedInformation: "ASN lines 142 and 156",
				investigationHistory: [
					{
						id: "ih1",
						at: "09:44:02",
						user: "System",
						action: "Warning raised",
					},
				],
			},
		],
		logs: [
			{
				id: "l1",
				at: "09:41:08",
				level: "warn",
				message: "SLA window exceeded before file arrival.",
			},
			{
				id: "l2",
				at: "09:41:22",
				level: "info",
				message: "SFTP transfer complete — HRZ_ASN_0727.csv (96 KB).",
			},
			{
				id: "l3",
				at: "09:41:40",
				level: "debug",
				message: "Checksum verified sha256:1ab4…c09d.",
			},
			{
				id: "l4",
				at: "09:42:01",
				level: "info",
				message: "Schema validation started for ASN inbound profile.",
			},
			{
				id: "l5",
				at: "09:42:40",
				level: "error",
				message: "Validation failed on line 120 — VAL-1001.",
			},
			{
				id: "l6",
				at: "09:43:05",
				level: "error",
				message: "Validation failed on line 245 — VAL-2003.",
			},
			{
				id: "l7",
				at: "09:43:28",
				level: "warn",
				message: "Validation warning on line 367 — VAL-3003.",
			},
			{
				id: "l8",
				at: "09:44:40",
				level: "info",
				message: "Business rules complete — 12 rows quarantined.",
			},
			{
				id: "l9",
				at: "09:45:10",
				level: "info",
				message: "1232 valid ASN lines posted; 18 quarantined.",
			},
			{
				id: "l10",
				at: "09:45:12",
				level: "info",
				message: "Investigation queue notified for run FR-2026-0727-00158.",
			},
		],
	},
	{
		id: "f3",
		runId: "FR-2026-0727-00091",
		vendor: "NovaTech Components",
		account: "NVA-EU-04",
		client: "Tilla Europe",
		fileType: "Catalog",
		direction: "inbound",
		frequency: "Weekly",
		expectedAt: "2026-07-27 06:00",
		receivedAt: null,
		startedAt: null,
		completedAt: null,
		status: "failed",
		fileName: null,
		records: null,
		recordsValid: null,
		recordsRejected: null,
		recordsLoaded: null,
		errorCount: 2,
		warningCount: 1,
		duration: null,
		fileSizeKb: null,
		checksum: null,
		protocol: "SFTP",
		sourcePath: "/inbound/novatech/catalog/",
		destinationPath: null,
		slaMinutes: 60,
		latencyMinutes: null,
		scheduleId: "SCH-NVA-CAT-WEEKLY",
		correlationId: "aa01d772-3f90-4bb2-8e11-c100220003",
		operator: "System",
		notes: "Expected weekly catalog not received past SLA window.",
		reviewed: false,
		pipeline: [
			{
				id: "p1",
				label: "Awaiting delivery",
				status: "failed",
				at: "07:00:00",
				durationMs: null,
				detail: "No file detected in watch folder",
			},
			{
				id: "p2",
				label: "Transfer complete",
				status: "skipped",
				at: null,
				durationMs: null,
			},
			{
				id: "p3",
				label: "Schema validation",
				status: "skipped",
				at: null,
				durationMs: null,
			},
			{
				id: "p4",
				label: "Business rules",
				status: "skipped",
				at: null,
				durationMs: null,
			},
			{
				id: "p5",
				label: "Publish catalog",
				status: "skipped",
				at: null,
				durationMs: null,
			},
		],
		issues: [
			{
				id: "f3-i1",
				severity: "error",
				code: "FILE-MISSING",
				message: "Weekly catalog feed not received past SLA window.",
				line: 0,
				field: "Delivery",
				memberId: "—",
				status: "open",
				receivedValue: "No file",
				expectedValue: "Catalog CSV/XML by 06:00",
				validationRule:
					"Scheduled weekly catalog must arrive within the SLA window or the run is marked failed.",
				recommendedResolution:
					"Contact NovaTech ops, request retransmit, and monitor the next schedule window.",
				resolutionSteps: [
					"Confirm SFTP credentials and watch folder path.",
					"Request emergency retransmit from NovaTech.",
					"Re-open the schedule window once file arrives.",
				],
				relatedInformation: "Schedule SCH-NVA-CAT-WEEKLY · SFTP watch folder",
				investigationHistory: [
					{
						id: "ih1",
						at: "07:00:00",
						user: "System",
						action: "SLA breach recorded",
					},
				],
			},
			{
				id: "f3-i2",
				severity: "error",
				code: "CAT-EMPTY",
				message: "No catalog payload detected in the SLA window.",
				line: 0,
				field: "Payload",
				memberId: "—",
				status: "open",
				receivedValue: "(empty)",
				expectedValue: "At least 1 catalog item row",
				validationRule:
					"CAT-EMPTY: Catalog runs with zero payload are treated as failed deliveries.",
				recommendedResolution:
					"Obtain a valid catalog extract and drop it to the inbound folder.",
				relatedInformation: "SCH-NVA-CAT-WEEKLY · expected format CSV/XML",
			},
			{
				id: "f3-i3",
				severity: "warning",
				code: "SLA-LATE",
				message: "Catalog schedule exceeded by 60 minutes.",
				line: 0,
				field: "Run window",
				memberId: "—",
				status: "open",
				receivedValue: "07:00",
				expectedValue: "On or before 06:00",
				validationRule:
					"Weekly catalog must arrive within the configured SLA window.",
				recommendedResolution:
					"Escalate recurring SLA breaches to NovaTech vendor ops.",
				relatedInformation: "Schedule SCH-NVA-CAT-WEEKLY · SLA 60 minutes",
			},
			{
				id: "f3-i4",
				severity: "info",
				code: "ALERT-SENT",
				message: "Escalation email sent to vendor operations.",
				line: 0,
				field: "Notification",
				memberId: "—",
				status: "resolved",
				receivedValue: "vendor-ops@novatech.example",
				expectedValue: "Configured alert recipients notified",
				validationRule: "Missing-file runs must notify the vendor ops channel.",
				recommendedResolution:
					"No further action unless vendor does not respond.",
				relatedInformation: "alert-router · NovaTech escalation list",
			},
		],
		logs: [
			{
				id: "l1",
				at: "06:00:00",
				level: "info",
				message: "Schedule window opened for SCH-NVA-CAT-WEEKLY.",
			},
			{
				id: "l2",
				at: "07:00:00",
				level: "error",
				message: "SLA breach — marking run as missing.",
			},
			{
				id: "l3",
				at: "07:00:01",
				level: "info",
				message: "Alert raised to vendor ops channel.",
			},
		],
	},
	{
		id: "f4",
		runId: "FR-2026-0727-00171",
		vendor: "Summit Packaging Co.",
		account: "SMT-US-03",
		client: "Tilla North America",
		fileType: "PO Ack",
		direction: "outbound",
		frequency: "On demand",
		expectedAt: "2026-07-27 10:15",
		receivedAt: "2026-07-27 10:12",
		startedAt: "2026-07-27 10:12:04",
		completedAt: "2026-07-27 10:12:51",
		status: "success",
		fileName: "SMT_POACK_8841.json",
		records: 6,
		recordsValid: 5,
		recordsRejected: 1,
		recordsLoaded: 5,
		errorCount: 1,
		warningCount: 3,
		duration: "00:00:47",
		fileSizeKb: 18,
		checksum: "sha256:77ce…12bf",
		protocol: "API",
		sourcePath: "/outbound/po-ack/",
		destinationPath: "https://api.summit.example/v1/acks",
		slaMinutes: 10,
		latencyMinutes: -3,
		scheduleId: "SCH-SMT-POACK",
		correlationId: "c2ee9910-11aa-4d88-bc01-d100220004",
		operator: "A. Bekele",
		notes: null,
		reviewed: true,
		pipeline: [
			{
				id: "p1",
				label: "Payload assembled",
				status: "completed",
				at: "10:12:04",
				durationMs: 800,
			},
			{
				id: "p2",
				label: "Signed & encrypted",
				status: "completed",
				at: "10:12:11",
				durationMs: 7000,
			},
			{
				id: "p3",
				label: "Delivered to vendor",
				status: "completed",
				at: "10:12:38",
				durationMs: 27000,
			},
			{
				id: "p4",
				label: "Ack confirmed",
				status: "completed",
				at: "10:12:51",
				durationMs: 13000,
			},
		],
		issues: [
			{
				id: "f4-i1",
				severity: "error",
				code: "POACK-LINE-MISS",
				message: "Acknowledgment missing for PO line 3.",
				line: 3,
				field: "PO Line",
				memberId: "PO-8841-L3",
				status: "open",
				receivedValue: "(omitted)",
				expectedValue: "Ack status for every open PO line",
				validationRule:
					"POACK-LINE-MISS: Outbound PO acknowledgments must cover all open lines.",
				recommendedResolution:
					"Include line 3 with accept/reject status and resend the ack.",
				resolutionSteps: [
					"Confirm line 3 is still open on PO-8841.",
					"Add acknowledgment status for line 3.",
					"Repost SMT_POACK_8841.json.",
				],
				relatedInformation: "PO-8841 · Summit packaging API v1/acks",
				contextTitle: "PO / Trading Partner Context",
				contextFields: [
					{ label: "Vendor", value: "Summit Packaging Co." },
					{ label: "Account", value: "SMT-US-03" },
					{ label: "Purchase Order", value: "PO-8841" },
					{ label: "PO Line", value: "3" },
					{ label: "Buyer Contact", value: "A. Bekele" },
					{ label: "Ship-to", value: "Tilla NA DC — Dallas" },
					{ label: "Ordered Qty", value: "100" },
					{ label: "Ack Status", value: "(missing)" },
					{ label: "Promise Date", value: "—" },
					{ label: "SKU", value: "PKG-BOX-12" },
				],
				memberContext: {
					subscriberName: "Summit Packaging Co.",
					dateOfBirth: "—",
					gender: "—",
					memberId: "PO-8841-L3",
					groupNumber: "SMT-US-03",
					coverageStart: "2026-07-27",
					coverageEnd: "—",
				},
				recordSnippet: [
					"{",
					'  "po": "PO-8841",',
					'  "vendor": "Summit Packaging Co.",',
					'  "lines": [',
					'    { "line": 1, "sku": "PKG-BOX-12", "status": "AC", "qty": 100 },',
					'    { "line": 2, "sku": "PKG-TAPE-01", "status": "AC", "qty": 80 },',
					"    // line 3 omitted — expected status for PKG-WRAP-04",
					"  ]",
					"}",
				],
				investigationHistory: [
					{
						id: "ih1",
						at: "10:12:20",
						user: "System",
						action: "Error raised",
						notes: "POACK-LINE-MISS on line 3.",
					},
					{
						id: "ih2",
						at: "10:13:02",
						user: "Kassie M. (Admin)",
						action: "Investigation opened",
						notes: "Opened from validation results.",
					},
					{
						id: "ih3",
						at: "10:13:40",
						user: "Kassie M. (Admin)",
						action: "Viewed record context",
						notes: "Confirmed line 3 missing from JSON payload.",
					},
				],
			},
			{
				id: "f4-i2",
				severity: "warning",
				code: "POACK-DATE-SOFT",
				message: "Promised ship date is outside preferred window.",
				line: 1,
				field: "Promise Date",
				memberId: "PO-8841-L1",
				status: "open",
				receivedValue: "2026-08-15",
				expectedValue: "On or before 2026-08-10",
				validationRule:
					"Promise dates beyond the buyer preference window raise a warning.",
				recommendedResolution:
					"Confirm Summit can meet 08/10 or accept the delayed promise.",
				relatedInformation: "Buyer preference window · PO-8841",
			},
			{
				id: "f4-i3",
				severity: "warning",
				code: "POACK-QTY-PARTIAL",
				message: "Partial quantity acknowledgment on line 2.",
				line: 2,
				field: "Ack Qty",
				memberId: "PO-8841-L2",
				status: "open",
				receivedValue: "80",
				expectedValue: "Ordered qty 100 (or explicit backorder)",
				validationRule:
					"Partial acks must include remaining quantity or backorder flag.",
				recommendedResolution:
					"Add backorder quantity 20 or fully acknowledge 100.",
				relatedInformation: "PO-8841 line 2",
			},
			{
				id: "f4-i4",
				severity: "warning",
				code: "POACK-SKU-ALIAS",
				message: "Vendor SKU alias mapped via crosswalk.",
				line: 1,
				field: "SKU",
				memberId: "PO-8841-L1",
				status: "resolved",
				receivedValue: "SMT-BOX-12",
				expectedValue: "Internal SKU PKG-BOX-12",
				validationRule:
					"Unknown vendor SKUs are accepted when a crosswalk alias exists.",
				recommendedResolution: "No action — alias applied automatically.",
				relatedInformation: "SKU crosswalk SMT→PKG",
			},
			{
				id: "f4-i5",
				severity: "info",
				code: "POACK-HTTP-202",
				message: "Vendor API returned HTTP 202 Accepted.",
				line: 0,
				field: "API Response",
				memberId: "—",
				status: "resolved",
				receivedValue: "202 Accepted",
				expectedValue: "2xx success response",
				validationRule: "PO ack posts must receive a successful HTTP response.",
				recommendedResolution: "No action required.",
				relatedInformation: "https://api.summit.example/v1/acks",
			},
			{
				id: "f4-i6",
				severity: "info",
				code: "POACK-SIGN-OK",
				message: "Payload signature verified.",
				line: 0,
				field: "Signature",
				memberId: "—",
				status: "resolved",
				receivedValue: "valid",
				expectedValue: "Valid HMAC signature",
				validationRule: "Outbound API payloads must be signed before post.",
				recommendedResolution: "No action required.",
				relatedInformation: "Summit API signing key SMT-2026",
			},
		],
		logs: [
			{
				id: "l1",
				at: "10:12:04",
				level: "info",
				message: "Outbound PO acknowledgment generated for PO-8841.",
			},
			{
				id: "l2",
				at: "10:12:51",
				level: "info",
				message: "Vendor API returned HTTP 202 Accepted.",
			},
		],
	},
	{
		id: "f5",
		runId: "FR-2026-0727-00119",
		vendor: "GreenField Organics",
		account: "GRF-ET-01",
		client: "Tilla East Africa",
		fileType: "Inventory",
		direction: "inbound",
		frequency: "Daily",
		expectedAt: "2026-07-27 07:30",
		receivedAt: "2026-07-27 07:48",
		startedAt: "2026-07-27 07:48:10",
		completedAt: "2026-07-27 07:50:22",
		status: "warning",
		fileName: "GRF_INV_0727.csv",
		records: 210,
		recordsValid: 206,
		recordsRejected: 4,
		recordsLoaded: 206,
		errorCount: 1,
		warningCount: 4,
		duration: "00:02:12",
		fileSizeKb: 512,
		checksum: "sha256:b0d1…e44a",
		protocol: "SFTP",
		sourcePath: "/inbound/greenfield/inventory/",
		destinationPath: "/processed/inventory/2026/07/27/",
		slaMinutes: 30,
		latencyMinutes: 18,
		scheduleId: "SCH-GRF-INV-DAILY",
		correlationId: "55fa1002-7781-4c33-a901-e100220005",
		operator: "System",
		notes: "Schema drift detected on 4 columns; partial ingest completed.",
		reviewed: false,
		pipeline: [
			{
				id: "p1",
				label: "File detected",
				status: "completed",
				at: "07:48:02",
				durationMs: 100,
			},
			{
				id: "p2",
				label: "Transfer complete",
				status: "completed",
				at: "07:48:10",
				durationMs: 8000,
			},
			{
				id: "p3",
				label: "Schema validation",
				status: "completed",
				at: "07:48:55",
				durationMs: 45000,
				detail: "4 unexpected columns",
			},
			{
				id: "p4",
				label: "Business rules",
				status: "completed",
				at: "07:49:40",
				durationMs: 45000,
			},
			{
				id: "p5",
				label: "Update inventory",
				status: "completed",
				at: "07:50:22",
				durationMs: 42000,
			},
		],
		issues: [
			{
				id: "f5-i1",
				severity: "warning",
				code: "SCHEMA-DRIFT",
				message: "Unexpected columns detected in inventory feed.",
				line: 1,
				field: "Header",
				memberId: "—",
				status: "open",
				receivedValue: "lot_code, harvest_week, moisture_pct, origin_farm",
				expectedValue: "Approved inventory schema v3 columns only",
				validationRule:
					"Inbound inventory files must match the published schema; unknown columns are skipped in tolerant mode.",
				recommendedResolution:
					"Align with GreenField on schema version or whitelist the new columns.",
				relatedInformation: "Schema inventory_v3.xsd · Tolerant mode ON",
			},
			{
				id: "f5-i2",
				severity: "warning",
				code: "ROW-SKIPPED",
				message: "Row skipped due to unmapped fields.",
				line: 88,
				field: "lot_code",
				memberId: "SKU-GRF-210",
				status: "open",
				receivedValue: "LOT-A88",
				expectedValue: "Mapped field or omitted column",
				validationRule:
					"Rows containing only unmapped fields are quarantined when tolerant mode is enabled.",
				recommendedResolution:
					"Map lot_code in the integration profile, then reprocess quarantined rows.",
				relatedInformation: "Line 88 · inventory_v3 mapping profile",
			},
			{
				id: "f5-i3",
				severity: "warning",
				code: "INV-MOISTURE",
				message: "Moisture percent outside accepted range.",
				line: 112,
				field: "moisture_pct",
				memberId: "SKU-GRF-044",
				status: "open",
				receivedValue: "28.4",
				expectedValue: "Between 8.0 and 18.0",
				validationRule:
					"INV-MOISTURE: Moisture percent must be within produce quality bounds.",
				recommendedResolution:
					"Confirm lab reading with GreenField QA and correct the row.",
				relatedInformation: "Quality bounds profile · produce_v2",
			},
			{
				id: "f5-i4",
				severity: "warning",
				code: "INV-ORIGIN-UNK",
				message: "Origin farm code is not in the approved farm list.",
				line: 140,
				field: "origin_farm",
				memberId: "SKU-GRF-091",
				status: "open",
				receivedValue: "FARM-ZZ9",
				expectedValue: "Active farm code from GreenField master",
				validationRule:
					"origin_farm must exist in the approved farm reference file.",
				recommendedResolution:
					"Add FARM-ZZ9 to the farm master or correct the code.",
				relatedInformation: "Farm master GRF_FARMS_2026.csv",
			},
			{
				id: "f5-i5",
				severity: "error",
				code: "INV-QTY-NEG",
				message: "Negative on-hand quantity is not allowed.",
				line: 156,
				field: "On Hand Qty",
				memberId: "SKU-GRF-012",
				status: "open",
				receivedValue: "-4",
				expectedValue: "Greater than or equal to 0",
				validationRule: "Inventory on-hand quantity cannot be negative.",
				recommendedResolution:
					"Correct the quantity or post an adjustment before reprocessing.",
				relatedInformation: "Line 156 · WMS inventory balance",
			},
			{
				id: "f5-i6",
				severity: "info",
				code: "INV-TOLERANT",
				message: "Tolerant schema mode enabled for this run.",
				line: 0,
				field: "Mode",
				memberId: "—",
				status: "resolved",
				receivedValue: "tolerant",
				expectedValue: "strict or tolerant",
				validationRule:
					"Integration profile may run inventory feeds in tolerant mode.",
				recommendedResolution: "No action required unless drift persists.",
				relatedInformation: "Profile GRF-INV-DAILY",
			},
		],
		logs: [
			{
				id: "l1",
				at: "07:48:55",
				level: "warn",
				message: "Schema drift detected — continuing with tolerant mode.",
			},
			{
				id: "l2",
				at: "07:50:22",
				level: "info",
				message: "206 inventory rows applied; 4 quarantined.",
			},
		],
	},
	{
		id: "f6",
		runId: "FR-2026-0727-00188",
		vendor: "Apex Industrial Supply",
		account: "APX-US-01",
		client: "Tilla North America",
		fileType: "Remittance",
		direction: "outbound",
		frequency: "Daily",
		expectedAt: "2026-07-27 11:00",
		receivedAt: null,
		startedAt: "2026-07-27 10:58:12",
		completedAt: null,
		status: "processing",
		fileName: "APX_REM_DRAFT.xml",
		records: 14,
		recordsValid: 12,
		recordsRejected: 2,
		recordsLoaded: null,
		errorCount: 1,
		warningCount: 2,
		duration: null,
		fileSizeKb: 64,
		checksum: null,
		protocol: "SFTP",
		sourcePath: "/outbound/remittance/",
		destinationPath: "/outbound/apex/remittance/",
		slaMinutes: 20,
		latencyMinutes: null,
		scheduleId: "SCH-APX-REM-DAILY",
		correlationId: "9910aabb-22cc-4d55-bf10-f100220006",
		operator: "System",
		notes: "Outbound remittance still in validation queue.",
		reviewed: false,
		pipeline: [
			{
				id: "p1",
				label: "Payload assembled",
				status: "completed",
				at: "10:58:12",
				durationMs: 2200,
			},
			{
				id: "p2",
				label: "Treasury validation",
				status: "running",
				at: "10:58:40",
				durationMs: null,
				detail: "Awaiting bank reference check",
			},
			{
				id: "p3",
				label: "Signed & encrypted",
				status: "pending",
				at: null,
				durationMs: null,
			},
			{
				id: "p4",
				label: "Deliver to vendor",
				status: "pending",
				at: null,
				durationMs: null,
			},
		],
		issues: [
			{
				id: "f6-i1",
				severity: "info",
				code: "QUEUE-HOLD",
				message: "Held for treasury reference confirmation.",
				line: 0,
				field: "Bank reference",
				memberId: "—",
				status: "in_progress",
				receivedValue: "Pending",
				expectedValue: "Confirmed bank reference",
				validationRule:
					"Outbound remittance cannot leave the queue until treasury confirms the bank reference.",
				recommendedResolution:
					"Wait for treasury confirmation or escalate if hold exceeds SLA.",
				relatedInformation: "Treasury gateway · SCH-APX-REM-DAILY",
			},
			{
				id: "f6-i2",
				severity: "warning",
				code: "REM-AMT-MISMATCH",
				message: "Payment amount does not match invoice open balance.",
				line: 4,
				field: "Payment Amount",
				memberId: "INV-4410",
				status: "open",
				receivedValue: "1250.00",
				expectedValue: "1184.50 (open AP balance)",
				validationRule:
					"REM-AMT-MISMATCH: Remittance lines must equal the open invoice balance unless short-pay is coded.",
				recommendedResolution:
					"Add short-pay reason code or correct the payment amount.",
				relatedInformation: "AP open items · INV-4410",
			},
			{
				id: "f6-i3",
				severity: "error",
				code: "REM-VENDOR-BANK",
				message: "Vendor bank account fingerprint not on file.",
				line: 1,
				field: "Bank Account",
				memberId: "APX-US-01",
				status: "open",
				receivedValue: "****9921",
				expectedValue: "Registered Apex remittance account",
				validationRule:
					"Outbound remittances require a registered vendor bank fingerprint.",
				recommendedResolution:
					"Register the Apex account in treasury master, then release the hold.",
				relatedInformation: "Treasury vendor bank master",
			},
			{
				id: "f6-i4",
				severity: "warning",
				code: "REM-SLA-NEAR",
				message: "Remittance approaching daily cutoff.",
				line: 0,
				field: "Run window",
				memberId: "—",
				status: "open",
				receivedValue: "10:58",
				expectedValue: "Complete before 11:00",
				validationRule: "Daily remittance must clear treasury before cutoff.",
				recommendedResolution:
					"Prioritize treasury confirmation for this draft.",
				relatedInformation: "SCH-APX-REM-DAILY · cutoff 11:00",
			},
			{
				id: "f6-i5",
				severity: "info",
				code: "REM-LINES-OK",
				message: "14 payment lines assembled successfully.",
				line: 0,
				field: "Payload",
				memberId: "—",
				status: "resolved",
				receivedValue: "14",
				expectedValue: "One or more payment lines",
				validationRule:
					"Remittance drafts must contain at least one payment line.",
				recommendedResolution: "No action required.",
				relatedInformation: "APX_REM_DRAFT.xml",
			},
		],
		logs: [
			{
				id: "l1",
				at: "10:58:12",
				level: "info",
				message: "Remittance draft generated for 14 payment lines.",
			},
			{
				id: "l2",
				at: "10:58:40",
				level: "info",
				message: "Submitted to treasury validation queue.",
			},
		],
	},
	{
		id: "f7",
		runId: "FR-2026-0727-00103",
		vendor: "Horizon Logistics",
		account: "HRZ-ET-02",
		client: "Tilla East Africa",
		fileType: "Claims",
		direction: "inbound",
		frequency: "Daily",
		expectedAt: "2026-07-27 08:30",
		receivedAt: null,
		startedAt: null,
		completedAt: null,
		status: "failed",
		fileName: null,
		records: null,
		recordsValid: null,
		recordsRejected: null,
		recordsLoaded: null,
		errorCount: 2,
		warningCount: 2,
		duration: null,
		fileSizeKb: null,
		checksum: null,
		protocol: "SFTP",
		sourcePath: "/inbound/horizon/claims/",
		destinationPath: null,
		slaMinutes: 45,
		latencyMinutes: null,
		scheduleId: "SCH-HRZ-CLM-DAILY",
		correlationId: "7712cc09-55aa-4e10-9100-a100220007",
		operator: "System",
		notes: "Daily claims file not delivered.",
		reviewed: false,
		pipeline: [
			{
				id: "p1",
				label: "Awaiting delivery",
				status: "failed",
				at: "09:15:00",
				durationMs: null,
			},
			{
				id: "p2",
				label: "Transfer complete",
				status: "skipped",
				at: null,
				durationMs: null,
			},
			{
				id: "p3",
				label: "Schema validation",
				status: "skipped",
				at: null,
				durationMs: null,
			},
			{
				id: "p4",
				label: "Claims ingest",
				status: "skipped",
				at: null,
				durationMs: null,
			},
		],
		issues: [
			{
				id: "f7-i1",
				severity: "error",
				code: "FILE-MISSING",
				message: "Daily claims file not delivered.",
				line: 0,
				field: "Delivery",
				memberId: "—",
				status: "open",
				receivedValue: "No file",
				expectedValue: "Claims file by 08:30",
				validationRule:
					"Daily claims feed must arrive within the SLA window or the run fails.",
				recommendedResolution:
					"Escalate to Horizon Logistics and request same-day retransmit.",
				relatedInformation: "Schedule SCH-HRZ-CLM-DAILY",
				investigationHistory: [
					{
						id: "ih1",
						at: "09:15:00",
						user: "System",
						action: "Missing file recorded",
					},
				],
			},
			{
				id: "f7-i2",
				severity: "error",
				code: "CLM-EMPTY",
				message: "No claims payload available for ingest.",
				line: 0,
				field: "Payload",
				memberId: "—",
				status: "open",
				receivedValue: "(empty)",
				expectedValue: "One or more claim transactions",
				validationRule:
					"CLM-EMPTY: Claims runs with zero payload are marked failed.",
				recommendedResolution:
					"Obtain the claims extract and drop it to the inbound SFTP folder.",
				relatedInformation: "/inbound/horizon/claims/",
			},
			{
				id: "f7-i3",
				severity: "warning",
				code: "SLA-LATE",
				message: "Claims window exceeded by 45 minutes.",
				line: 0,
				field: "Run window",
				memberId: "—",
				status: "open",
				receivedValue: "09:15",
				expectedValue: "On or before 08:30",
				validationRule: "Daily claims must arrive within the SLA window.",
				recommendedResolution:
					"Escalate recurring lateness to Horizon vendor ops.",
				relatedInformation: "SCH-HRZ-CLM-DAILY · SLA 45 minutes",
			},
			{
				id: "f7-i4",
				severity: "warning",
				code: "ALERT-OPEN",
				message: "Open incident remains for missing claims feed.",
				line: 0,
				field: "Incident",
				memberId: "—",
				status: "open",
				receivedValue: "PD-9921",
				expectedValue: "Resolved incident",
				validationRule: "Missing claims runs create a tracking incident.",
				recommendedResolution: "Close the incident after file retransmit.",
				relatedInformation: "PagerDuty · Horizon claims",
			},
			{
				id: "f7-i5",
				severity: "info",
				code: "WATCH-ACTIVE",
				message: "SFTP watch folder remains armed for late arrival.",
				line: 0,
				field: "Watch",
				memberId: "—",
				status: "resolved",
				receivedValue: "armed",
				expectedValue: "Watch active until cutoff+grace",
				validationRule:
					"Missing runs keep the watch folder armed for grace period.",
				recommendedResolution: "No action unless grace expires.",
				relatedInformation: "Grace window 120 minutes",
			},
		],
		logs: [
			{
				id: "l1",
				at: "08:30:00",
				level: "info",
				message: "Schedule window opened.",
			},
			{
				id: "l2",
				at: "09:15:00",
				level: "error",
				message: "No claims file detected — run marked missing.",
			},
		],
	},
	{
		id: "f8",
		runId: "FR-2026-0727-00144",
		vendor: "NovaTech Components",
		account: "NVA-EU-04",
		client: "Tilla Europe",
		fileType: "Invoice EDI",
		direction: "inbound",
		frequency: "Daily",
		expectedAt: "2026-07-27 08:00",
		receivedAt: "2026-07-27 08:05",
		startedAt: "2026-07-27 08:05:10",
		completedAt: "2026-07-27 08:06:48",
		status: "success",
		fileName: "NVA_INV_20260727.xml",
		records: 89,
		recordsValid: 87,
		recordsRejected: 2,
		recordsLoaded: 87,
		errorCount: 1,
		warningCount: 3,
		duration: "00:01:38",
		fileSizeKb: 256,
		checksum: "sha256:33aa…90fe",
		protocol: "AS2",
		sourcePath: "AS2://novatech/invoices",
		destinationPath: "/processed/invoices/2026/07/27/",
		slaMinutes: 30,
		latencyMinutes: 5,
		scheduleId: "SCH-NVA-INV-DAILY",
		correlationId: "d0ff2211-99bb-4a10-8800-b100220008",
		operator: "System",
		notes: null,
		reviewed: true,
		pipeline: [
			{
				id: "p1",
				label: "AS2 received",
				status: "completed",
				at: "08:05:02",
				durationMs: 200,
			},
			{
				id: "p2",
				label: "Decrypt & verify",
				status: "completed",
				at: "08:05:10",
				durationMs: 8000,
			},
			{
				id: "p3",
				label: "Schema validation",
				status: "completed",
				at: "08:05:40",
				durationMs: 30000,
			},
			{
				id: "p4",
				label: "Business rules",
				status: "completed",
				at: "08:06:18",
				durationMs: 38000,
			},
			{
				id: "p5",
				label: "Post to ledger",
				status: "completed",
				at: "08:06:48",
				durationMs: 30000,
			},
		],
		issues: [
			{
				id: "f8-i1",
				severity: "error",
				code: "INV-VAT-CODE",
				message: "VAT code is not valid for EU invoice.",
				line: 22,
				field: "VAT Code",
				memberId: "INV-NVA-2201",
				status: "open",
				receivedValue: "VAT-XX",
				expectedValue: "S, Z, E, or AE",
				validationRule:
					"INV-VAT-CODE: EU invoices must use an approved VAT category code.",
				recommendedResolution:
					"Correct VAT-XX to an approved code and reprocess the invoice.",
				resolutionSteps: [
					"Confirm VAT treatment with NovaTech AP.",
					"Update TXI02 to an approved code.",
					"Reprocess quarantined invoice.",
				],
				relatedInformation: "X12 810 TXI · EU VAT dictionary",
				recordSnippet: ["TXI*VA*12.5**VAT-XX~"],
				investigationHistory: [
					{
						id: "ih1",
						at: "08:06:05",
						user: "System",
						action: "Error raised",
					},
				],
			},
			{
				id: "f8-i2",
				severity: "warning",
				code: "INV-IBAN-FORMAT",
				message: "Supplier IBAN checksum failed soft validation.",
				line: 5,
				field: "IBAN",
				memberId: "NVA-EU-04",
				status: "open",
				receivedValue: "DE00 0000 0000 0000 0000 00",
				expectedValue: "Valid IBAN checksum",
				validationRule:
					"Supplier IBAN should pass ISO 13616 checksum; soft fail raises warning.",
				recommendedResolution:
					"Confirm the NovaTech remittance IBAN with treasury.",
				relatedInformation: "AS2 invoice remittance block",
			},
			{
				id: "f8-i3",
				severity: "warning",
				code: "INV-UNIT-PRICE",
				message: "Unit price differs from catalog by more than 5%.",
				line: 41,
				field: "Unit Price",
				memberId: "SKU-NVA-880",
				status: "open",
				receivedValue: "18.90",
				expectedValue: "Within 5% of catalog 17.50",
				validationRule:
					"Invoice unit prices outside catalog tolerance raise a warning.",
				recommendedResolution:
					"Approve price variance or correct the invoice line.",
				relatedInformation: "NovaTech catalog · SKU-NVA-880",
			},
			{
				id: "f8-i4",
				severity: "warning",
				code: "AS2-LATENCY",
				message: "AS2 arrival 5 minutes after expected window start.",
				line: 0,
				field: "Run window",
				memberId: "—",
				status: "resolved",
				receivedValue: "08:05",
				expectedValue: "On or before 08:00",
				validationRule: "Inbound AS2 invoices should arrive by schedule start.",
				recommendedResolution: "Monitor for recurring latency.",
				relatedInformation: "SCH-NVA-INV-DAILY",
			},
			{
				id: "f8-i5",
				severity: "info",
				code: "AS2-MDN-OK",
				message: "AS2 MDN acknowledged successfully.",
				line: 0,
				field: "MDN",
				memberId: "—",
				status: "resolved",
				receivedValue: "acknowledged",
				expectedValue: "Valid MDN signature",
				validationRule: "AS2 receipts must include a valid MDN.",
				recommendedResolution: "No action required.",
				relatedInformation: "Partner cert NVA-AS2-2025",
			},
			{
				id: "f8-i6",
				severity: "info",
				code: "INV-POSTED",
				message: "87 invoices posted to AP staging.",
				line: 0,
				field: "Posting",
				memberId: "—",
				status: "resolved",
				receivedValue: "87",
				expectedValue: "All valid invoices posted",
				validationRule: "Valid invoices are posted after business rules pass.",
				recommendedResolution: "No action required.",
				relatedInformation: "AP staging · NVA-EU-04",
			},
		],
		logs: [
			{
				id: "l1",
				at: "08:05:02",
				level: "info",
				message: "AS2 MDN acknowledged.",
			},
			{
				id: "l2",
				at: "08:06:48",
				level: "info",
				message: "87 invoices posted successfully; 2 quarantined.",
			},
		],
	},
];

function defaultContextFields(
	run: FileRun,
	issue: ValidationIssue
): { label: string; value: string }[] {
	const fileType = run.fileType.toLowerCase();
	const isMemberish =
		fileType.includes("eligib") ||
		fileType.includes("834") ||
		fileType.includes("claim") ||
		!!issue.memberContext?.subscriberName;

	if (isMemberish && issue.memberContext) {
		return [
			{
				label: "Subscriber Name",
				value: issue.memberContext.subscriberName ?? "—",
			},
			{ label: "Date of Birth", value: issue.memberContext.dateOfBirth ?? "—" },
			{ label: "Gender", value: issue.memberContext.gender ?? "—" },
			{
				label: "Member ID",
				value: issue.memberContext.memberId ?? issue.memberId ?? "—",
			},
			{ label: "Group Number", value: issue.memberContext.groupNumber ?? "—" },
			{
				label: "Coverage Start",
				value: issue.memberContext.coverageStart ?? "—",
			},
			{ label: "Coverage End", value: issue.memberContext.coverageEnd ?? "—" },
		];
	}

	if (fileType.includes("po") || fileType.includes("asn")) {
		return [
			{ label: "Vendor", value: run.vendor },
			{ label: "Account", value: run.account },
			{ label: "Document / PO", value: issue.memberId ?? "—" },
			{ label: "Line", value: String(issue.line ?? "—") },
			{ label: "Field", value: issue.field ?? "—" },
			{ label: "Received", value: issue.receivedValue ?? "—" },
			{ label: "Expected", value: issue.expectedValue ?? "—" },
			{ label: "File Name", value: run.fileName ?? "—" },
			{ label: "Protocol", value: run.protocol },
		];
	}

	if (fileType.includes("invoice") || fileType.includes("remittance")) {
		return [
			{ label: "Vendor", value: run.vendor },
			{ label: "Account", value: run.account },
			{ label: "Invoice / Ref", value: issue.memberId ?? "—" },
			{ label: "Line", value: String(issue.line ?? "—") },
			{ label: "Field", value: issue.field ?? "—" },
			{ label: "Received", value: issue.receivedValue ?? "—" },
			{ label: "Expected", value: issue.expectedValue ?? "—" },
			{ label: "Client", value: run.client },
			{ label: "File Name", value: run.fileName ?? "—" },
		];
	}

	if (fileType.includes("inventory") || fileType.includes("catalog")) {
		return [
			{ label: "Vendor", value: run.vendor },
			{ label: "Account", value: run.account },
			{ label: "SKU / Item", value: issue.memberId ?? "—" },
			{ label: "Line", value: String(issue.line ?? "—") },
			{ label: "Field", value: issue.field ?? "—" },
			{ label: "Received", value: issue.receivedValue ?? "—" },
			{ label: "Expected", value: issue.expectedValue ?? "—" },
			{ label: "File Name", value: run.fileName ?? "—" },
			{ label: "Schedule", value: run.scheduleId },
		];
	}

	return [
		{ label: "Vendor", value: run.vendor },
		{ label: "Account", value: run.account },
		{ label: "Client", value: run.client },
		{ label: "Reference ID", value: issue.memberId ?? "—" },
		{ label: "Line", value: String(issue.line ?? "—") },
		{ label: "Field", value: issue.field ?? "—" },
		{ label: "Received", value: issue.receivedValue ?? "—" },
		{ label: "Expected", value: issue.expectedValue ?? "—" },
		{ label: "File Name", value: run.fileName ?? "—" },
		{ label: "Run GUID", value: run.correlationId },
	];
}

function defaultContextTitle(run: FileRun, issue: ValidationIssue): string {
	if (issue.contextTitle) return issue.contextTitle;
	if (issue.memberContext?.subscriberName) return "Member Context";
	const fileType = run.fileType.toLowerCase();
	if (fileType.includes("po")) return "PO / Trading Partner Context";
	if (fileType.includes("asn")) return "Shipment / ASN Context";
	if (fileType.includes("invoice")) return "Invoice Context";
	if (fileType.includes("remittance")) return "Remittance Context";
	if (fileType.includes("inventory") || fileType.includes("catalog"))
		return "Item / Catalog Context";
	if (fileType.includes("claim")) return "Claims Context";
	return "Entity Context";
}

function defaultRecordSnippet(run: FileRun, issue: ValidationIssue): string[] {
	if (issue.recordSnippet?.length) return issue.recordSnippet;
	const file = run.fileName ?? "payload.dat";
	const line = issue.line ?? 0;
	const field = issue.field ?? "field";
	const received = issue.receivedValue ?? "";
	const member = issue.memberId ?? "—";
	return [
		`# ${run.fileType} · ${file}`,
		`# vendor=${run.vendor} account=${run.account}`,
		`LINE ${line} | REF=${member} | ${field}=${received}`,
		`RULE ${issue.code}: ${issue.message}`,
		`EXPECTED: ${issue.expectedValue ?? "—"}`,
	];
}

function defaultResolutionSteps(issue: ValidationIssue): string[] {
	if (issue.resolutionSteps?.length) return issue.resolutionSteps;
	return [
		`Review ${issue.field ?? "the failing field"} against the validation rule ${issue.code}.`,
		`Correct the source value (received: ${issue.receivedValue ?? "n/a"}).`,
		"Reprocess the quarantined row or resubmit the file.",
		"Confirm the investigation history reflects the outcome.",
	];
}

function defaultHistory(
	run: FileRun,
	issue: ValidationIssue
): NonNullable<ValidationIssue["investigationHistory"]> {
	if (issue.investigationHistory?.length) return issue.investigationHistory;
	const at =
		(run.startedAt ?? run.expectedAt).split(" ").at(-1)?.slice(0, 8) ??
		"00:00:00";
	return [
		{
			id: `${issue.id}-h1`,
			at,
			user: "System",
			action:
				issue.severity === "error"
					? "Error raised"
					: issue.severity === "warning"
						? "Warning raised"
						: "Info recorded",
			notes: issue.message,
		},
		{
			id: `${issue.id}-h2`,
			at,
			user: "Kassie M. (Admin)",
			action: "Investigation opened",
			notes: "Opened from validation results.",
		},
		{
			id: `${issue.id}-h3`,
			at,
			user: "Kassie M. (Admin)",
			action: "Viewed record context",
		},
	];
}

function enrichIssue(run: FileRun, issue: ValidationIssue): ValidationIssue {
	const memberContext =
		issue.memberContext ??
		({
			subscriberName:
				run.fileType.toLowerCase().includes("eligib") ||
				run.fileType.toLowerCase().includes("claim")
					? "DOE, JANE"
					: run.vendor,
			dateOfBirth:
				run.fileType.toLowerCase().includes("eligib") ||
				run.fileType.toLowerCase().includes("claim")
					? "03/14/1988"
					: "—",
			gender:
				run.fileType.toLowerCase().includes("eligib") ||
				run.fileType.toLowerCase().includes("claim")
					? "Female"
					: "—",
			memberId: issue.memberId ?? run.account,
			groupNumber: run.account,
			coverageStart: run.expectedAt.slice(0, 10),
			coverageEnd: "—",
		} satisfies NonNullable<ValidationIssue["memberContext"]>);

	return {
		...issue,
		status: issue.status ?? "open",
		recommendedResolution:
			issue.recommendedResolution ??
			`Address ${issue.code} on line ${issue.line ?? "n/a"} and resubmit.`,
		validationRule: issue.validationRule ?? `${issue.code}: ${issue.message}`,
		relatedInformation:
			issue.relatedInformation ??
			`${run.fileType} · ${run.scheduleId} · ${run.correlationId}`,
		memberContext,
		contextTitle: defaultContextTitle(run, { ...issue, memberContext }),
		contextFields:
			issue.contextFields ??
			defaultContextFields(run, { ...issue, memberContext }),
		recordSnippet: defaultRecordSnippet(run, issue),
		resolutionSteps: defaultResolutionSteps(issue),
		investigationHistory: defaultHistory(run, issue),
	};
}

export const FILE_RUNS: FileRun[] = isMockEnabled()
	? RAW_FILE_RUNS.map((run, index) => {
			const withProgram: FileRun = {
				...run,
				program: index % 3 === 0 ? "MDH" : index % 3 === 1 ? "DHCF" : "BHP",
			};
			return {
				...withProgram,
				issues: withProgram.issues.map((issue) =>
					enrichIssue(withProgram, issue)
				),
			};
		})
	: [];

export function getFileRun(id: string): FileRun | undefined {
	if (!isMockEnabled()) return undefined;
	return FILE_RUNS.find((run) => run.id === id || run.runId === id);
}

export function markFileRunReviewed(id: string, reviewed = true): boolean {
	const run = getFileRun(id);
	if (!run) return false;
	run.reviewed = reviewed;
	return true;
}

export function getValidationIssue(runId: string, issueId: string) {
	const run = getFileRun(runId);
	if (!run) return { run: undefined, issue: undefined };
	const issue = run.issues.find((i) => i.id === issueId);
	return { run, issue };
}

export function displayRunStatus(status: ProcessStatus) {
	if (status === "success") return "Success";
	if (status === "failed" || status === "missing") return "Failed";
	if (status === "processing") return "Processing";
	if (status === "late") return "Late";
	if (status === "warning") return "Warning";
	return status;
}

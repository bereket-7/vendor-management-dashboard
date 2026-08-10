export type ComplianceProgramSection =
	| "regulatory_compliance"
	| "program_monitoring";

export type ComplianceProgramIconKey =
	| "shield-check"
	| "file-bar-chart-2"
	| "stethoscope"
	| "scale"
	| "clipboard-check"
	| "calendar-days"
	| "activity"
	| "accessibility"
	| "home"
	| "heart-pulse"
	| "hospital"
	| "brain";

export type ComplianceSectionKind =
	| "trend-chart"
	| "status-mix"
	| "vendor-bars"
	| "insights"
	| "measure-grid"
	| "timeline"
	| "findings"
	| "cap-gauge"
	| "code-ranking"
	| "scorecards"
	| "calendar-strip"
	| "split-compare"
	| "queue-table";

export type ComplianceSectionConfig = {
	kind: ComplianceSectionKind;
	title: string;
	description?: string;
};

export type ComplianceProgramPageConfig = {
	slug: string;
	section: ComplianceProgramSection;
	title: string;
	description: string;
	iconKey: ComplianceProgramIconKey;
	kpiLabels: [string, string, string, string];
	statusOptions: string[];
	rowNoun: string;
	sections: ComplianceSectionConfig[];
};

export const COMPLIANCE_PROGRAM_PAGES: ComplianceProgramPageConfig[] = [
	{
		slug: "cms-edge",
		section: "regulatory_compliance",
		title: "CMS EDGE",
		description:
			"Track CMS EDGE submission batches, validation outcomes, and resubmission windows across vendors.",
		iconKey: "shield-check",
		kpiLabels: ["Open Batches", "Accepted", "Pending Review", "Overdue"],
		statusOptions: ["Submitted", "Accepted", "Pending", "Rejected", "Overdue"],
		rowNoun: "batch",
		sections: [
			{
				kind: "trend-chart",
				title: "Submission volume",
				description: "Weekly EDGE batch counts by validation outcome",
			},
			{
				kind: "vendor-bars",
				title: "Vendor acceptance rate",
				description: "Accepted vs rejected batches by trading partner",
			},
			{ kind: "insights", title: "Operational insights" },
			{ kind: "queue-table", title: "Batch queue" },
		],
	},
	{
		slug: "medicaid-encounter-reporting",
		section: "regulatory_compliance",
		title: "Medicaid Encounter Reporting",
		description:
			"Monitor Medicaid encounter files, member-month coverage, and state submission readiness.",
		iconKey: "file-bar-chart-2",
		kpiLabels: ["Encounters", "Accepted", "Exceptions", "Due This Week"],
		statusOptions: ["Ready", "Submitted", "Accepted", "Exception", "Late"],
		rowNoun: "file",
		sections: [
			{
				kind: "status-mix",
				title: "File status mix",
				description: "Current encounter file pipeline",
			},
			{
				kind: "trend-chart",
				title: "Member-month trend",
				description: "Reportable encounters submitted over time",
			},
			{ kind: "queue-table", title: "Encounter files" },
		],
	},
	{
		slug: "medicare-reporting",
		section: "regulatory_compliance",
		title: "Medicare Reporting",
		description:
			"Review Medicare claim and encounter reporting cycles, CARC/RARC trends, and vendor cutoffs.",
		iconKey: "stethoscope",
		kpiLabels: ["Reports", "Clean", "Warnings", "Rejections"],
		statusOptions: ["Draft", "Submitted", "Accepted", "Warning", "Rejected"],
		rowNoun: "report",
		sections: [
			{
				kind: "code-ranking",
				title: "Top CARC / RARC drivers",
				description: "Most frequent adjustment codes in the selected window",
			},
			{
				kind: "trend-chart",
				title: "Report acceptance trend",
				description: "Clean vs warning vs rejected submissions",
			},
			{ kind: "vendor-bars", title: "Vendor clean rate" },
			{ kind: "queue-table", title: "Reporting queue" },
		],
	},
	{
		slug: "risk-adjustment",
		section: "regulatory_compliance",
		title: "Risk Adjustment",
		description:
			"Summarize HCC capture, suspected gaps, and chart-review queues for risk adjustment programs.",
		iconKey: "scale",
		kpiLabels: ["Members", "Captured HCCs", "Suspected Gaps", "Open Reviews"],
		statusOptions: ["Complete", "In Review", "Suspected", "Pending", "Closed"],
		rowNoun: "member",
		sections: [
			{
				kind: "measure-grid",
				title: "HCC capture by category",
				description: "Documented vs suspected gaps across major condition groups",
			},
			{ kind: "queue-table", title: "Member review queue" },
		],
	},
	{
		slug: "hedis-quality",
		section: "regulatory_compliance",
		title: "HEDIS / Quality",
		description:
			"Track HEDIS measure performance, supplemental data loads, and vendor attestation status.",
		iconKey: "clipboard-check",
		kpiLabels: ["Measures", "Met Target", "At Risk", "Data Gaps"],
		statusOptions: ["On Track", "At Risk", "Gap", "Submitted", "Validated"],
		rowNoun: "measure",
		sections: [
			{
				kind: "measure-grid",
				title: "Measure performance",
				description: "Star-rating sensitive HEDIS measures vs target",
			},
			{
				kind: "status-mix",
				title: "Attestation status",
				description: "Vendor supplemental data readiness",
			},
			{ kind: "queue-table", title: "Measure worklist" },
		],
	},
	{
		slug: "audit-management",
		section: "regulatory_compliance",
		title: "Audit Management",
		description:
			"Manage audit requests, document retrieval, and corrective action plans by vendor and program.",
		iconKey: "shield-check",
		kpiLabels: ["Open Audits", "In Progress", "Findings", "Closed"],
		statusOptions: ["Open", "In Progress", "Finding", "Remediating", "Closed"],
		rowNoun: "audit",
		sections: [
			{
				kind: "findings",
				title: "Findings by severity",
				description: "Open audit findings requiring remediation",
			},
			{
				kind: "timeline",
				title: "Audit activity",
				description: "Recent requests, responses, and closures",
			},
			{ kind: "insights", title: "Remediation focus" },
			{ kind: "queue-table", title: "Audit register" },
		],
	},
	{
		slug: "compliance-calendar",
		section: "regulatory_compliance",
		title: "Compliance Calendar",
		description:
			"View regulatory deadlines, filing windows, and vendor attestations on a unified calendar.",
		iconKey: "calendar-days",
		kpiLabels: ["Due Soon", "Submitted", "Upcoming", "Overdue"],
		statusOptions: ["Upcoming", "Due Soon", "Submitted", "Complete", "Overdue"],
		rowNoun: "deadline",
		sections: [
			{
				kind: "calendar-strip",
				title: "August filing window",
				description: "Regulatory deadlines across programs and vendors",
			},
			{
				kind: "timeline",
				title: "Upcoming milestones",
				description: "Next 14 days of compliance activity",
			},
			{ kind: "queue-table", title: "Deadline register" },
		],
	},
	{
		slug: "esrd-dialysis",
		section: "program_monitoring",
		title: "ESRD / Dialysis",
		description:
			"Monitor ESRD encounter volume, dialysis treatment days, and vendor reconciliation by plan.",
		iconKey: "activity",
		kpiLabels: ["Active Members", "Treatments", "Pending", "Exceptions"],
		statusOptions: ["Active", "Pending", "Reconciled", "Exception", "Closed"],
		rowNoun: "case",
		sections: [
			{
				kind: "trend-chart",
				title: "Treatment day volume",
				description: "Dialysis treatments reported vs reconciled",
			},
			{ kind: "vendor-bars", title: "Facility reconciliation rate" },
			{ kind: "queue-table", title: "Active cases" },
		],
	},
	{
		slug: "dme",
		section: "program_monitoring",
		title: "DME",
		description:
			"Track durable medical equipment authorizations, claim linkage, and supplier performance.",
		iconKey: "accessibility",
		kpiLabels: ["Authorizations", "Paid", "Pending", "Denied"],
		statusOptions: ["Authorized", "Paid", "Pending", "Denied", "Appeal"],
		rowNoun: "authorization",
		sections: [
			{
				kind: "status-mix",
				title: "Authorization outcomes",
				description: "Paid, pending, denied, and appeal volume",
			},
			{
				kind: "scorecards",
				title: "Supplier scorecard",
				description: "Top DME vendors by turnaround and denial rate",
			},
			{ kind: "queue-table", title: "Authorization queue" },
		],
	},
	{
		slug: "home-health",
		section: "program_monitoring",
		title: "Home Health",
		description:
			"Review home health episodes, OASIS submissions, and vendor encounter acceptance rates.",
		iconKey: "home",
		kpiLabels: ["Episodes", "Accepted", "In Review", "Rejected"],
		statusOptions: ["Open", "Accepted", "In Review", "Rejected", "Closed"],
		rowNoun: "episode",
		sections: [
			{
				kind: "trend-chart",
				title: "Episode acceptance",
				description: "OASIS-linked episodes accepted over time",
			},
			{
				kind: "split-compare",
				title: "Inbound vs outbound",
				description: "Acceptance and rejection split by file direction",
			},
			{ kind: "queue-table", title: "Episode worklist" },
		],
	},
	{
		slug: "hospice",
		section: "program_monitoring",
		title: "Hospice",
		description:
			"Monitor hospice election periods, benefit caps, and encounter reporting by vendor.",
		iconKey: "heart-pulse",
		kpiLabels: ["Elections", "Active", "Cap Alerts", "Exceptions"],
		statusOptions: ["Active", "Cap Alert", "Pending", "Exception", "Discharged"],
		rowNoun: "election",
		sections: [
			{
				kind: "cap-gauge",
				title: "Benefit cap utilization",
				description: "Aggregate cap consumption for active elections",
			},
			{
				kind: "timeline",
				title: "Election lifecycle",
				description: "Recent elections, cap alerts, and discharges",
			},
			{ kind: "queue-table", title: "Election register" },
		],
	},
	{
		slug: "ltss",
		section: "program_monitoring",
		title: "LTSS",
		description:
			"Track long-term services and supports authorizations, units, and vendor file completeness.",
		iconKey: "hospital",
		kpiLabels: ["Authorizations", "Units Billed", "Pending", "Exceptions"],
		statusOptions: ["Active", "Pending", "Billed", "Exception", "Closed"],
		rowNoun: "authorization",
		sections: [
			{
				kind: "trend-chart",
				title: "Units billed trend",
				description: "LTSS units by service category",
			},
			{
				kind: "status-mix",
				title: "Authorization pipeline",
				description: "Active, pending, billed, and exception authorizations",
			},
			{ kind: "queue-table", title: "Authorization register" },
		],
	},
	{
		slug: "behavioral-health",
		section: "program_monitoring",
		title: "Behavioral Health",
		description:
			"Monitor behavioral health encounters, carve-out vendors, and compliance with program rules.",
		iconKey: "brain",
		kpiLabels: ["Encounters", "Accepted", "Pending", "Exceptions"],
		statusOptions: ["Accepted", "Pending", "Exception", "Rejected", "Closed"],
		rowNoun: "encounter",
		sections: [
			{
				kind: "split-compare",
				title: "Carve-out vendor comparison",
				description: "Acceptance and exception rates by BH vendor",
			},
			{ kind: "insights", title: "Program compliance notes" },
			{ kind: "queue-table", title: "Encounter queue" },
		],
	},
];

export const COMPLIANCE_PROGRAM_PAGE_BY_SLUG = Object.fromEntries(
	COMPLIANCE_PROGRAM_PAGES.map((page) => [page.slug, page])
) as Record<string, ComplianceProgramPageConfig>;

export function getComplianceProgramPage(slug: string) {
	return COMPLIANCE_PROGRAM_PAGE_BY_SLUG[slug];
}

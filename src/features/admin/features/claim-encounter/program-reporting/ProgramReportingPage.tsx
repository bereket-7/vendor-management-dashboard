"use client";

import { useEffect, useState } from "react";

import {
	AlertTriangle,
	BarChart3,
	CalendarDays,
	ChevronDown,
	ClipboardCheck,
	Download,
	FileCheck,
	Filter,
	FolderOpen,
	Inbox,
	LayoutDashboard,
	type LucideIcon,
	Pill,
	Send,
	Shield,
	SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CMS_EDGE_TAB_TRIGGER_CLASS } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { ClaimPageHeader } from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import { MedicaidEncounterAcceptanceAnalyticsTab } from "@/features/admin/features/claim-encounter/medicaid-encounter/MedicaidEncounterAcceptanceAnalyticsTab";
import { MedicaidEncounterDocumentsTab } from "@/features/admin/features/claim-encounter/medicaid-encounter/MedicaidEncounterDocumentsTab";
import { MedicaidEncounterExceptionsTab } from "@/features/admin/features/claim-encounter/medicaid-encounter/MedicaidEncounterExceptionsTab";
import { MedicaidEncounterResponsesTab } from "@/features/admin/features/claim-encounter/medicaid-encounter/MedicaidEncounterResponsesTab";
import { MedicaidEncounterValidationTab } from "@/features/admin/features/claim-encounter/medicaid-encounter/MedicaidEncounterValidationTab";
import { MedicarePartDTab } from "@/features/admin/features/claim-encounter/medicare-reporting/MedicarePartDTab";
import {
	MEDICAID_REPORTING_TABS,
	MEDICARE_REPORTING_TABS,
} from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import { MedicareComplianceTab } from "@/features/admin/features/claim-encounter/program-reporting/tabs/MedicareComplianceTab";
import { ProgramReportingAuditTab } from "@/features/admin/features/claim-encounter/program-reporting/tabs/ProgramReportingAuditTab";
import { ProgramReportingOverviewTab } from "@/features/admin/features/claim-encounter/program-reporting/tabs/ProgramReportingOverviewTab";
import { ProgramReportingSubmissionsTab } from "@/features/admin/features/claim-encounter/program-reporting/tabs/ProgramReportingSubmissionsTab";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";

export type { ProgramType };

type SharedTabId =
	| "overview"
	| "submissions"
	| "responses"
	| "validation"
	| "audit"
	| "documents";

type MedicaidTabId = SharedTabId | "acceptance-analytics" | "exceptions";

type MedicareTabId = SharedTabId | "part-d" | "compliance";

type TabId = MedicaidTabId | MedicareTabId;

const MEDICAID_TAB_IDS: Record<
	(typeof MEDICAID_REPORTING_TABS)[number],
	MedicaidTabId
> = {
	Overview: "overview",
	Submissions: "submissions",
	Responses: "responses",
	Validation: "validation",
	"Acceptance Analytics": "acceptance-analytics",
	"Exception Management": "exceptions",
	Audit: "audit",
	Documents: "documents",
};

const MEDICARE_TAB_IDS: Record<
	(typeof MEDICARE_REPORTING_TABS)[number],
	MedicareTabId
> = {
	Overview: "overview",
	Submissions: "submissions",
	Responses: "responses",
	Validation: "validation",
	"Part D": "part-d",
	Compliance: "compliance",
	Audit: "audit",
	Documents: "documents",
};

const MEDICAID_TAB_ICONS: Record<MedicaidTabId, LucideIcon> = {
	overview: LayoutDashboard,
	submissions: Send,
	responses: Inbox,
	validation: FileCheck,
	"acceptance-analytics": BarChart3,
	exceptions: AlertTriangle,
	audit: Shield,
	documents: FolderOpen,
};

const MEDICARE_TAB_ICONS: Record<MedicareTabId, LucideIcon> = {
	overview: LayoutDashboard,
	submissions: Send,
	responses: Inbox,
	validation: FileCheck,
	"part-d": Pill,
	compliance: ClipboardCheck,
	audit: Shield,
	documents: FolderOpen,
};

const SHARED_TAB_META: Record<
	SharedTabId,
	{ titleSuffix: string; description: Record<ProgramType, string> }
> = {
	overview: {
		titleSuffix: "Overview",
		description: {
			medicaid:
				"Reporting cycle status, submission readiness, and encounter file pipeline for state Medicaid programs.",
			medicare:
				"Reporting cycle status, submission readiness, and Medicare program compliance across contracts and plans.",
		},
	},
	submissions: {
		titleSuffix: "Submissions",
		description: {
			medicaid:
				"Encounter file submission history, acknowledgements, and resubmission tracking.",
			medicare:
				"Submission history, acknowledgements, and resubmission tracking for Medicare reporting files.",
		},
	},
	responses: {
		titleSuffix: "Responses",
		description: {
			medicaid:
				"View and manage state MMIS response files, acceptance results, and issue details.",
			medicare:
				"View and manage CMS response files, acceptance results, and issue details.",
		},
	},
	validation: {
		titleSuffix: "Validation",
		description: {
			medicaid:
				"Pre-submission internal validation and state MMIS external validation results for encounter files.",
			medicare:
				"Pre-submission validation runs, record-level exceptions, and warning summaries.",
		},
	},
	audit: {
		titleSuffix: "Audit",
		description: {
			medicaid:
				"Audit trail, submission attestations, and compliance review activity.",
			medicare:
				"Review Medicare reporting audits, findings, and compliance activities.",
		},
	},
	documents: {
		titleSuffix: "Documents",
		description: {
			medicaid:
				"Access all submitted files, state responses, validation reports, audit documents, and supporting materials.",
			medicare:
				"Supporting documentation, retention policies, and archived submission artifacts.",
		},
	},
};

const MEDICAID_TAB_META: Record<
	MedicaidTabId,
	{ title: string; description: string }
> = {
	overview: {
		title: "Medicaid Encounter Reporting – Overview",
		description: SHARED_TAB_META.overview.description.medicaid,
	},
	submissions: {
		title: "Medicaid Encounter Reporting – Submissions",
		description: SHARED_TAB_META.submissions.description.medicaid,
	},
	responses: {
		title: "Medicaid Encounter Reporting – Responses",
		description: SHARED_TAB_META.responses.description.medicaid,
	},
	validation: {
		title: "Medicaid Encounter Reporting – Validation",
		description: SHARED_TAB_META.validation.description.medicaid,
	},
	"acceptance-analytics": {
		title: "Medicaid Encounter Reporting – Acceptance Analytics",
		description:
			"Acceptance rates, rejection drivers, and report-type performance for the selected reporting period.",
	},
	exceptions: {
		title: "Medicaid Encounter Reporting – Exception Management",
		description:
			"Monitor encounter exceptions by severity, track trends, and manage remediation workflows.",
	},
	audit: {
		title: "Medicaid Encounter Reporting – Audit",
		description: SHARED_TAB_META.audit.description.medicaid,
	},
	documents: {
		title: "Medicaid Encounter Reporting – Documents",
		description: SHARED_TAB_META.documents.description.medicaid,
	},
};

const MEDICARE_TAB_META: Record<
	MedicareTabId,
	{ title: string; description: string }
> = {
	overview: {
		title: "Medicare Reporting – Overview",
		description: SHARED_TAB_META.overview.description.medicare,
	},
	submissions: {
		title: "Medicare Reporting – Submissions",
		description: SHARED_TAB_META.submissions.description.medicare,
	},
	responses: {
		title: "Medicare Reporting – Responses",
		description: SHARED_TAB_META.responses.description.medicare,
	},
	validation: {
		title: "Medicare Reporting – Validation",
		description: SHARED_TAB_META.validation.description.medicare,
	},
	"part-d": {
		title: "Medicare Part D Reporting",
		description:
			"Monitor and manage Part D Prescription Drug Event (PDE) submissions, CMS responses, and compliance.",
	},
	compliance: {
		title: "Medicare Reporting – Compliance",
		description:
			"Track regulatory requirements, attestations, and compliance deadlines across Medicare programs.",
	},
	audit: {
		title: "Medicare Reporting – Audit",
		description: SHARED_TAB_META.audit.description.medicare,
	},
	documents: {
		title: "Medicare Reporting – Documents",
		description: SHARED_TAB_META.documents.description.medicare,
	},
};

const DEFAULT_TAB: Record<ProgramType, TabId> = {
	medicaid: "overview",
	medicare: "overview",
};

type ProgramReportingPageProps = {
	defaultProgramType?: ProgramType;
};

export function ProgramReportingPage({
	defaultProgramType = "medicaid",
}: ProgramReportingPageProps) {
	const [programType, setProgramType] =
		useState<ProgramType>(defaultProgramType);
	const [activeTab, setActiveTab] = useState<TabId>(
		DEFAULT_TAB[defaultProgramType]
	);

	const [medicaidState, setMedicaidState] = useState("medicaid-dc");
	const [reportType, setReportType] = useState("all");
	const [medicaidPlan, setMedicaidPlan] = useState("all");

	const [contract, setContract] = useState("all");
	const [pbp, setPbp] = useState("all");
	const [submissionType, setSubmissionType] = useState("all");

	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");

	useEffect(() => {
		setActiveTab(DEFAULT_TAB[programType]);
	}, [programType]);

	const isMedicaid = programType === "medicaid";
	const tabMetaMap = isMedicaid ? MEDICAID_TAB_META : MEDICARE_TAB_META;
	const resolvedTab =
		activeTab in tabMetaMap ? activeTab : DEFAULT_TAB[programType];
	const tabMeta = tabMetaMap[resolvedTab as keyof typeof tabMetaMap];
	const tabLabels = isMedicaid
		? MEDICAID_REPORTING_TABS
		: MEDICARE_REPORTING_TABS;
	const tabIds = isMedicaid ? MEDICAID_TAB_IDS : MEDICARE_TAB_IDS;
	const tabIcons = isMedicaid ? MEDICAID_TAB_ICONS : MEDICARE_TAB_ICONS;

	return (
		<div className="space-y-0">
			<div className="space-y-4 pb-4">
				<ClaimPageHeader
					title={tabMeta.title}
					description={tabMeta.description}
					actions={
						<>
							<Button
								variant="outline"
								size="sm"
								className="h-9 border-border/70 bg-card shadow-sm"
							>
								<CalendarDays className="mr-1.5 size-3.5" />
								Reporting Calendar
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-9 border-border/70 bg-card shadow-sm"
							>
								<SlidersHorizontal className="mr-1.5 size-3.5" />
								Filters
							</Button>
							<Button
								size="sm"
								className="h-9"
								onClick={() => toast.success("Export queued")}
							>
								<Download className="mr-1.5 size-3.5" />
								Export
								<ChevronDown className="ml-1 size-3.5" />
							</Button>
						</>
					}
				/>

				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
					<div className="space-y-1">
						<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							Program Type
						</label>
						<Select
							value={programType}
							onValueChange={(value) => setProgramType(value as ProgramType)}
						>
							<SelectTrigger className="h-9 border-border/70 bg-card shadow-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="medicaid">Medicaid</SelectItem>
								<SelectItem value="medicare">Medicare</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{isMedicaid ? (
						<>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									State Program
								</label>
								<Select value={medicaidState} onValueChange={setMedicaidState}>
									<SelectTrigger className="h-9 border-border/70 bg-card shadow-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="medicaid-dc">Medicaid – DC</SelectItem>
										<SelectItem value="medicaid-md">Medicaid – MD</SelectItem>
										<SelectItem value="chip">CHIP</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Report Type
								</label>
								<Select value={reportType} onValueChange={setReportType}>
									<SelectTrigger className="h-9 border-border/70 bg-card shadow-sm">
										<Filter className="mr-2 size-3.5 text-muted-foreground" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Report Types</SelectItem>
										<SelectItem value="encounter">Encounter File</SelectItem>
										<SelectItem value="eligibility">
											Member Eligibility
										</SelectItem>
										<SelectItem value="provider">Provider Data</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									MCO / Plan
								</label>
								<Select value={medicaidPlan} onValueChange={setMedicaidPlan}>
									<SelectTrigger className="h-9 border-border/70 bg-card shadow-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Plans</SelectItem>
										<SelectItem value="mfc-100">MFC-DC-100</SelectItem>
										<SelectItem value="mfc-200">MFC-DC-200</SelectItem>
										<SelectItem value="mfc-300">MFC-DC-300</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</>
					) : (
						<>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Report Type
								</label>
								<Select value={reportType} onValueChange={setReportType}>
									<SelectTrigger className="h-9 border-border/70 bg-card shadow-sm">
										<Filter className="mr-2 size-3.5 text-muted-foreground" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Report Types</SelectItem>
										<SelectItem value="encounter">Encounter Data</SelectItem>
										<SelectItem value="part-d">Part D (PDE)</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Contract / Plan
								</label>
								<Select value={contract} onValueChange={setContract}>
									<SelectTrigger className="h-9 border-border/70 bg-card shadow-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Contracts</SelectItem>
										<SelectItem value="h1234">H1234 – SilverScript</SelectItem>
										<SelectItem value="h5678">
											H5678 – Aetna Medicare Rx
										</SelectItem>
										<SelectItem value="h9012">H9012 – Humana PDP</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Audit Period
								</label>
								<Select
									value={reportingPeriod}
									onValueChange={setReportingPeriod}
								>
									<SelectTrigger className="h-9 border-border/70 bg-card shadow-sm">
										<CalendarDays className="mr-2 size-3.5 text-muted-foreground" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="q2-2027">
											Q2 2027 (Apr 1 – Jun 30, 2027)
										</SelectItem>
										<SelectItem value="q1-2027">Q1 2027 (Jan – Mar)</SelectItem>
										<SelectItem value="q4-2026">Q4 2026 (Oct – Dec)</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</>
					)}

					{isMedicaid ? (
						<div className="space-y-1">
							<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Reporting Period
							</label>
							<Select
								value={reportingPeriod}
								onValueChange={setReportingPeriod}
							>
								<SelectTrigger className="h-9 border-border/70 bg-card shadow-sm">
									<CalendarDays className="mr-2 size-3.5 text-muted-foreground" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="q2-2027">Q2 2027 (Apr – Jun)</SelectItem>
									<SelectItem value="q1-2027">Q1 2027 (Jan – Mar)</SelectItem>
									<SelectItem value="q4-2026">Q4 2026 (Oct – Dec)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					) : null}
				</div>
			</div>

			<Tabs
				value={resolvedTab}
				onValueChange={(value) => setActiveTab(value as TabId)}
			>
				<div className="border-b border-border/70 bg-card">
					<ScrollArea
						type="always"
						className="w-full"
						scrollbarClassName="h-2.5"
					>
						<TabsList className="inline-flex h-auto w-max min-w-full justify-start gap-0 rounded-none bg-transparent p-0">
							{tabLabels.map((label) => {
								const tabId = tabIds[label as keyof typeof tabIds];
								const Icon = tabIcons[tabId as keyof typeof tabIcons];
								return (
									<TabsTrigger
										key={`${programType}-${label}`}
										value={tabId}
										className={CMS_EDGE_TAB_TRIGGER_CLASS}
									>
										<Icon className="mr-1.5 size-3.5" />
										{label}
									</TabsTrigger>
								);
							})}
						</TabsList>
					</ScrollArea>
				</div>

				<div className="bg-muted/30 py-4">
					<TabsContent value="overview" className="mt-0 space-y-0">
						<ProgramReportingOverviewTab
							key={programType}
							programType={programType}
							reportingPeriod={reportingPeriod}
						/>
					</TabsContent>
					<TabsContent value="responses" className="mt-0 space-y-0">
						<MedicaidEncounterResponsesTab
							key={programType}
							programType={programType}
							reportingPeriod={reportingPeriod}
						/>
					</TabsContent>
					<TabsContent value="validation" className="mt-0 space-y-0">
						<MedicaidEncounterValidationTab
							key={programType}
							programType={programType}
							reportingPeriod={reportingPeriod}
						/>
					</TabsContent>
					<TabsContent value="audit" className="mt-0 space-y-0">
						<ProgramReportingAuditTab
							key={programType}
							programType={programType}
							reportingPeriod={reportingPeriod}
						/>
					</TabsContent>
					<TabsContent value="documents" className="mt-0 space-y-0">
						<MedicaidEncounterDocumentsTab
							key={programType}
							programType={programType}
							reportingPeriod={reportingPeriod}
						/>
					</TabsContent>

					{isMedicaid ? (
						<>
							<TabsContent
								value="acceptance-analytics"
								className="mt-0 space-y-0"
							>
								<MedicaidEncounterAcceptanceAnalyticsTab
									programType={programType}
									reportingPeriod={reportingPeriod}
								/>
							</TabsContent>
							<TabsContent value="exceptions" className="mt-0 space-y-0">
								<MedicaidEncounterExceptionsTab
									key={programType}
									programType={programType}
									reportingPeriod={reportingPeriod}
								/>
							</TabsContent>
						</>
					) : (
						<>
							<TabsContent value="part-d" className="mt-0 space-y-0">
								<MedicarePartDTab reportingPeriod={reportingPeriod} />
							</TabsContent>
							<TabsContent value="compliance" className="mt-0 space-y-0">
								<MedicareComplianceTab reportingPeriod={reportingPeriod} />
							</TabsContent>
						</>
					)}

					<TabsContent value="submissions" className="mt-0 space-y-0">
						<ProgramReportingSubmissionsTab
							key={programType}
							programType={programType}
							reportingPeriod={reportingPeriod}
						/>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}

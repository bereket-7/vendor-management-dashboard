"use client";

import { type ReactNode } from "react";

import {
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	ClipboardCheck,
	FileCheck,
	type LucideIcon,
	Shield,
} from "lucide-react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { useComplianceCalendarObligationsList } from "@/features/admin/features/claim-encounter/compliance-calendar/feature/queries/useComplianceCalendarQuery";
import { emptyOverview } from "@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers";
import {
	MEDICARE_COMPLIANCE_ATTESTATIONS,
	useProgramOverviewQuery,
} from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import { cn } from "@/lib/utils";

const PAGE_STACK = "space-y-5";
const SECTION_GAP = "gap-4";
const TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const TABLE_CELL = "px-4 py-2.5";

function StatusPill({
	label,
	className,
}: {
	label: string;
	className: string;
}) {
	return (
		<span className={cn(CMS_EDGE_STATUS_PILL_CLASS, className)}>{label}</span>
	);
}

function MetricCard({
	label,
	value,
	hint,
	icon: Icon,
	tone = "text-primary bg-primary/10",
	valueClassName,
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	icon: LucideIcon;
	tone?: string;
	valueClassName?: string;
}) {
	return (
		<div className="rounded-lg border border-border/70 bg-card p-3.5 shadow-sm">
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-md",
						tone
					)}
				>
					<Icon className="size-4" aria-hidden />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						{label}
					</p>
					<p
						className={cn(
							"mt-0.5 text-sm font-semibold tabular-nums leading-tight text-foreground",
							valueClassName
						)}
					>
						{value}
					</p>
					{hint != null && hint !== "" ? (
						<div className="mt-0.5 truncate text-[10px] text-muted-foreground">
							{hint}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

function obligationStatusStyle(status: string): string {
	if (status === "Completed") {
		return "border-emerald-200 bg-emerald-50 text-emerald-700";
	}
	if (status === "Overdue") {
		return "border-red-200 bg-red-50 text-red-700";
	}
	if (status === "At Risk") {
		return "border-amber-200 bg-amber-50 text-amber-800";
	}
	return "border-sky-200 bg-sky-50 text-sky-800";
}

function ComplianceKpiRow({
	overallStatus,
	obligations,
}: {
	overallStatus: string;
	obligations: Array<{ status: string }>;
}) {
	const total = obligations.length;
	const met = obligations.filter((o) => o.status === "Completed").length;
	const upcoming = obligations.filter((o) => o.status === "Upcoming").length;
	const overdue = obligations.filter((o) => o.status === "Overdue").length;
	const atRisk = obligations.filter((o) => o.status === "At Risk").length;
	const k = {
		requirementsMet: met,
		requirementsTotal: total,
		upcomingDeadlines: upcoming,
		overdueItems: overdue,
		attestationsComplete: 0,
		attestationsTotal: 0,
		openGaps: atRisk + overdue,
	};

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<MetricCard
				label="Requirements Met"
				value={`${k.requirementsMet}/${k.requirementsTotal}`}
				hint={`${k.requirementsTotal > 0 ? ((k.requirementsMet / k.requirementsTotal) * 100).toFixed(1) : "0"}% Complete`}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<MetricCard
				label="Upcoming Deadlines"
				value={k.upcomingDeadlines}
				hint="Next 90 Days"
				icon={CalendarDays}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
			<MetricCard
				label="Overdue Items"
				value={k.overdueItems}
				hint="Requires Immediate Action"
				icon={AlertTriangle}
				tone="text-red-700 bg-red-500/10"
				valueClassName={
					k.overdueItems > 0 ? "text-red-600" : "text-emerald-700"
				}
			/>
			<MetricCard
				label="Attestations Complete"
				value={`${k.attestationsComplete}/${k.attestationsTotal}`}
				hint={
					k.attestationsTotal > 0
						? `${((k.attestationsComplete / k.attestationsTotal) * 100).toFixed(0)}% Complete`
						: "No attestation data"
				}
				icon={ClipboardCheck}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<MetricCard
				label="Open Gaps"
				value={k.openGaps}
				hint="Compliance Gaps Identified"
				icon={FileCheck}
				tone="text-violet-700 bg-violet-500/10"
				valueClassName="text-amber-600"
			/>
			<MetricCard
				label="Overall Status"
				value={overallStatus || "—"}
				hint="From program overview"
				icon={Shield}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
		</div>
	);
}

function RequirementsTablePanel({
	requirements,
}: {
	requirements: Array<{
		id: string;
		requirement: string;
		regulation: string;
		dueDate: string;
		owner: string;
		status: string;
		statusStyle: string;
	}>;
}) {
	return (
		<CmsEdgeSectionPanel title="Compliance Requirements">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Requirement</TableHead>
							<TableHead className={TABLE_HEAD}>Regulation</TableHead>
							<TableHead className={TABLE_HEAD}>Due Date</TableHead>
							<TableHead className={TABLE_HEAD}>Owner</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-5")}>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{requirements.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="px-4 py-8 text-center text-sm text-muted-foreground"
								>
									No medicare compliance obligations
								</TableCell>
							</TableRow>
						) : (
							requirements.map((row) => (
								<TableRow
									key={row.id}
									className="border-b border-border/40 hover:bg-muted/20"
								>
									<TableCell className={cn(TABLE_CELL, "font-medium")}>
										{row.requirement}
									</TableCell>
									<TableCell className={TABLE_CELL}>{row.regulation}</TableCell>
									<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
										{row.dueDate}
									</TableCell>
									<TableCell className={TABLE_CELL}>{row.owner}</TableCell>
									<TableCell className={cn(TABLE_CELL, "pr-5")}>
										<StatusPill
											label={row.status}
											className={row.statusStyle}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function AttestationsTablePanel() {
	const rows: typeof MEDICARE_COMPLIANCE_ATTESTATIONS = [];
	return (
		<CmsEdgeSectionPanel title="Attestations">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Attestation</TableHead>
							<TableHead className={TABLE_HEAD}>Submitted By</TableHead>
							<TableHead className={TABLE_HEAD}>Submitted Date</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-5")}>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="px-4 py-8 text-center text-sm text-muted-foreground"
								>
									No attestations from API
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => (
								<TableRow
									key={row.id}
									className="border-b border-border/40 hover:bg-muted/20"
								>
									<TableCell className={cn(TABLE_CELL, "font-medium")}>
										{row.name}
									</TableCell>
									<TableCell className={TABLE_CELL}>
										{row.submittedBy}
									</TableCell>
									<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
										{row.submittedDate}
									</TableCell>
									<TableCell className={cn(TABLE_CELL, "pr-5")}>
										<StatusPill
											label={row.status}
											className={row.statusStyle}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

export function MedicareComplianceTab({
	reportingPeriod,
}: { reportingPeriod?: string } = {}) {
	const overviewQuery = useProgramOverviewQuery("medicare", reportingPeriod);
	const overview = overviewQuery.data ?? emptyOverview("medicare");
	const complianceStatus =
		overview.kpis.kind === "medicare" ? overview.kpis.complianceStatus : "—";

	const { obligations, isLoading } = useComplianceCalendarObligationsList({
		program: "medicare",
	});

	const requirements = obligations.map((row) => ({
		id: row.id,
		requirement: row.title,
		regulation: row.obligationType || "—",
		dueDate: row.dueDate,
		owner: row.owner,
		status: row.status,
		statusStyle: obligationStatusStyle(row.status),
	}));

	return (
		<div className={PAGE_STACK}>
			{overviewQuery.isLoading || isLoading ? (
				<p className="px-4 py-4 text-center text-sm text-muted-foreground">
					Loading compliance…
				</p>
			) : null}
			<ComplianceKpiRow
				overallStatus={complianceStatus}
				obligations={obligations}
			/>
			<div className={cn("flex flex-col", SECTION_GAP)}>
				<RequirementsTablePanel requirements={requirements} />
				<AttestationsTablePanel />
			</div>
			<CmsEdgePageFooter />
		</div>
	);
}

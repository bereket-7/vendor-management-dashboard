"use client";

import { type ReactNode } from "react";

import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	BookOpen,
	CalendarDays,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Download,
	FileSearch,
	History,
	ListChecks,
	type LucideIcon,
	Search,
	Shield,
} from "lucide-react";
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
	CMS_EDGE_TABLE_LINK_CLASS,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	AUDIT_STATUS_STYLES,
	FINDING_SEVERITY_STYLES,
	type ProgramAuditData,
	useProgramAuditQuery,
} from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import { emptyAudit } from "@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { cn } from "@/lib/utils";

const AUDIT_PAGE_STACK = "space-y-5";
const AUDIT_SECTION_GAP = "gap-4";
const AUDIT_TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const AUDIT_TABLE_CELL = "px-4 py-2.5";

const AUDIT_QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
	"aq-1": ClipboardList,
	"aq-2": Download,
	"aq-3": FileSearch,
	"aq-4": ListChecks,
	"aq-5": History,
	"aq-6": CalendarDays,
};

function PanelLink({ children }: { children: ReactNode }) {
	return (
		<Button variant="link" size="sm" className="h-7 px-0 text-xs text-primary">
			{children}
		</Button>
	);
}

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

function AuditMetricCard({
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
		<div className="rounded-lg border border-border/70 bg-card p-2.5 shadow-sm">
			<div className="flex items-center gap-2.5">
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

function TrendHint({
	delta,
	invert = false,
}: {
	delta: number;
	invert?: boolean;
}) {
	const positive = invert ? delta < 0 : delta > 0;
	const Icon = positive ? ArrowUpRight : ArrowDownRight;
	const tone = positive ? "text-emerald-700" : "text-red-600";
	const sign = delta > 0 ? "+" : "";

	return (
		<span className={cn("inline-flex items-center gap-0.5", tone)}>
			<Icon className="size-3" />
			{sign}
			{Math.abs(delta)} vs Prior Period
		</span>
	);
}

function AuditKpiRow({ data }: { data: ProgramAuditData }) {
	const k = data.kpis;

	return (
		<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<AuditMetricCard
				label="Audits Conducted"
				value={k.auditsConducted}
				hint={<TrendHint delta={k.auditsConductedDelta} />}
				icon={Search}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<AuditMetricCard
				label="Findings Identified"
				value={k.findingsIdentified}
				hint={<TrendHint delta={k.findingsIdentifiedDelta} />}
				icon={ClipboardList}
				tone="text-violet-700 bg-violet-500/10"
			/>
			<AuditMetricCard
				label="Critical Findings"
				value={k.criticalFindings}
				hint={<TrendHint delta={k.criticalFindingsDelta} invert />}
				icon={AlertTriangle}
				tone="text-red-700 bg-red-500/10"
				valueClassName="text-red-600"
			/>
			<AuditMetricCard
				label="Resolved Findings"
				value={k.resolvedFindings}
				hint={<TrendHint delta={k.resolvedFindingsDelta} />}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<AuditMetricCard
				label="Open Findings"
				value={k.openFindings}
				hint={<TrendHint delta={k.openFindingsDelta} invert />}
				icon={Shield}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
			<AuditMetricCard
				label="Corrective Actions"
				value={k.correctiveActions}
				hint={<TrendHint delta={k.correctiveActionsDelta} />}
				icon={ListChecks}
				tone="text-sky-700 bg-sky-500/10"
			/>
		</div>
	);
}

function RecentAuditActivitiesPanel({ data }: { data: ProgramAuditData }) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Recent Audit Activities"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
					<span>Showing 1 to 5 of {data.totalAuditEntries} entries</span>
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1">
							<Button variant="outline" size="icon" className="size-7" disabled>
								<ChevronLeft className="size-3.5" />
							</Button>
							<Button variant="default" size="icon" className="size-7 text-xs">
								1
							</Button>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								2
							</Button>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								3
							</Button>
							<Button variant="outline" size="icon" className="size-7">
								<ChevronRight className="size-3.5" />
							</Button>
						</div>
						<span className="text-[11px]">Rows per page: 5</span>
					</div>
				</div>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={AUDIT_TABLE_HEAD}>Audit ID</TableHead>
							<TableHead className={AUDIT_TABLE_HEAD}>Audit Type</TableHead>
							<TableHead className={AUDIT_TABLE_HEAD}>Report Type</TableHead>
							<TableHead className={AUDIT_TABLE_HEAD}>
								{data.planColumnLabel}
							</TableHead>
							<TableHead className={AUDIT_TABLE_HEAD}>Audit Period</TableHead>
							<TableHead className={AUDIT_TABLE_HEAD}>Audit Date</TableHead>
							<TableHead className={AUDIT_TABLE_HEAD}>Auditor</TableHead>
							<TableHead className={AUDIT_TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(AUDIT_TABLE_HEAD, "text-right")}>
								Findings
							</TableHead>
							<TableHead className={cn(AUDIT_TABLE_HEAD, "pr-4 text-right")}>
								Critical
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.recentActivities.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={AUDIT_TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.id}
									</Button>
								</TableCell>
								<TableCell className={cn(AUDIT_TABLE_CELL, "font-medium")}>
									{row.auditType}
								</TableCell>
								<TableCell className={AUDIT_TABLE_CELL}>
									{row.reportType}
								</TableCell>
								<TableCell className={AUDIT_TABLE_CELL}>{row.plan}</TableCell>
								<TableCell className={AUDIT_TABLE_CELL}>
									{row.auditPeriod}
								</TableCell>
								<TableCell className={cn(AUDIT_TABLE_CELL, "tabular-nums")}>
									{row.auditDate}
								</TableCell>
								<TableCell
									className={cn(AUDIT_TABLE_CELL, "text-muted-foreground")}
								>
									{row.auditor}
								</TableCell>
								<TableCell className={AUDIT_TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={AUDIT_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(AUDIT_TABLE_CELL, "text-right tabular-nums")}
								>
									{row.findings}
								</TableCell>
								<TableCell
									className={cn(
										AUDIT_TABLE_CELL,
										"pr-4 text-right tabular-nums",
										row.criticalFindings > 0
											? "font-semibold text-red-600"
											: "text-muted-foreground"
									)}
								>
									{row.criticalFindings}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function FindingsBySeverityPanel({ data }: { data: ProgramAuditData }) {
	const total = data.findingsBySeverity.reduce(
		(sum, item) => sum + item.value,
		0
	);

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Findings by Severity"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
		>
			<div className="flex min-h-[220px] flex-1 flex-col gap-2 border-t border-border/50 px-3 py-3 sm:flex-row">
				<div className="relative mx-auto w-full max-w-[140px] flex-1">
					<ResponsiveContainer width="100%" height="100%" minHeight={120}>
						<PieChart>
							<Pie
								data={data.findingsBySeverity}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{data.findingsBySeverity.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-sm font-bold tabular-nums">{total}</p>
						<p className="text-[10px] text-muted-foreground">Findings</p>
					</div>
				</div>
				<ul className="flex flex-1 flex-col justify-center gap-2 text-xs">
					{data.findingsBySeverity.map((item) => (
						<li
							key={item.name}
							className="flex items-center justify-between gap-2"
						>
							<span className="flex min-w-0 items-center gap-1.5 font-medium">
								<span
									className="size-2 shrink-0 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span className="truncate">{item.name}</span>
							</span>
							<span className="shrink-0 tabular-nums text-muted-foreground">
								{item.value}
								<span className="ml-1">({item.pct.toFixed(1)}%)</span>
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function FindingsTrendPanel({ data }: { data: ProgramAuditData }) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Findings Trend"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
		>
			<div className="min-h-[220px] flex-1 border-t border-border/50 px-2 py-2">
				<ResponsiveContainer width="100%" height="100%" minHeight={180}>
					<LineChart
						data={data.findingsTrend}
						margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
						<XAxis
							dataKey="month"
							tick={{ fontSize: 10 }}
							interval={0}
							angle={-15}
							textAnchor="end"
							height={44}
						/>
						<YAxis tick={{ fontSize: 11 }} width={32} />
						<RechartsTooltip />
						<Legend
							iconSize={8}
							wrapperStyle={{ fontSize: 10, paddingBottom: 4 }}
						/>
						<Line
							type="monotone"
							dataKey="total"
							name="Total Findings"
							stroke="#13446c"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="critical"
							name="Critical"
							stroke="#ef4444"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
						<Line
							type="monotone"
							dataKey="high"
							name="High"
							stroke="#f97316"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function TopAuditFindingsPanel({ data }: { data: ProgramAuditData }) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Top Audit Findings"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View All Findings</PanelLink>
				</div>
			}
		>
			<div className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={AUDIT_TABLE_HEAD}>
								Finding Category
							</TableHead>
							<TableHead className={AUDIT_TABLE_HEAD}>Description</TableHead>
							<TableHead className={cn(AUDIT_TABLE_HEAD, "text-right")}>
								Occurrences
							</TableHead>
							<TableHead className={cn(AUDIT_TABLE_HEAD, "pr-4")}>
								Severity
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.topFindings.map((row) => (
							<TableRow
								key={row.category}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={cn(AUDIT_TABLE_CELL, "font-medium")}>
									{row.category}
								</TableCell>
								<TableCell
									className={cn(
										AUDIT_TABLE_CELL,
										"text-muted-foreground leading-relaxed"
									)}
								>
									{row.description}
								</TableCell>
								<TableCell
									className={cn(AUDIT_TABLE_CELL, "text-right tabular-nums")}
								>
									{row.occurrences}
								</TableCell>
								<TableCell
									className={cn(
										AUDIT_TABLE_CELL,
										"pr-4",
										FINDING_SEVERITY_STYLES[row.severity]
									)}
								>
									{row.severity}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function CorrectiveActionsSummaryPanel({ data }: { data: ProgramAuditData }) {
	const maxCount = Math.max(
		...data.correctiveActions.map((item) => item.count)
	);

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Corrective Actions Summary"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View All Corrective Actions</PanelLink>
				</div>
			}
		>
			<div className="space-y-4 border-t border-border/50 px-4 py-4">
				{data.correctiveActions.map((item) => (
					<div key={item.status}>
						<div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
							<span className="font-medium">{item.status}</span>
							<span className="tabular-nums text-muted-foreground">
								{item.count}
								<span className="ml-1">({item.pct.toFixed(1)}%)</span>
							</span>
						</div>
						<div className="h-2.5 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full"
								style={{
									width: `${(item.count / maxCount) * 100}%`,
									backgroundColor: item.color,
								}}
							/>
						</div>
					</div>
				))}
			</div>
		</CmsEdgeSectionPanel>
	);
}

function AuditQuickActionsPanel({ data }: { data: ProgramAuditData }) {
	return (
		<CmsEdgeSectionPanel title="Audit Quick Actions" bodyClassName="pb-4">
			<div className="grid gap-3 border-t border-border/50 p-4 sm:grid-cols-2">
				{data.quickActions.map((action) => {
					const Icon = AUDIT_QUICK_ACTION_ICONS[action.id] ?? BookOpen;
					return (
						<button
							key={action.id}
							type="button"
							className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/30"
							onClick={() => toast.message(action.title)}
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
								<Icon className="size-4" aria-hidden />
							</div>
							<div className="min-w-0">
								<p className="text-xs font-semibold text-foreground">
									{action.title}
								</p>
								<p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
									{action.description}
								</p>
							</div>
						</button>
					);
				})}
			</div>
		</CmsEdgeSectionPanel>
	);
}

type ProgramReportingAuditTabProps = {
	programType: ProgramType;
	reportingPeriod?: string;
};

export function ProgramReportingAuditTab({
	programType,
}: ProgramReportingAuditTabProps) {
	const auditQuery = useProgramAuditQuery(programType);
	const data = auditQuery.data ?? emptyAudit(programType);

	if (auditQuery.isLoading) {
		return (
			<div className={AUDIT_PAGE_STACK}>
				<p className="px-4 py-8 text-center text-sm text-muted-foreground">
					Loading audit…
				</p>
				<CmsEdgePageFooter />
			</div>
		);
	}

	return (
		<div className={AUDIT_PAGE_STACK}>
			<AuditKpiRow data={data} />

			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,1fr)_minmax(240px,1fr)]",
					AUDIT_SECTION_GAP
				)}
			>
				<RecentAuditActivitiesPanel data={data} />
				<FindingsBySeverityPanel data={data} />
				<FindingsTrendPanel data={data} />
			</div>

			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-3",
					AUDIT_SECTION_GAP
				)}
			>
				<TopAuditFindingsPanel data={data} />
				<CorrectiveActionsSummaryPanel data={data} />
				<AuditQuickActionsPanel data={data} />
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}

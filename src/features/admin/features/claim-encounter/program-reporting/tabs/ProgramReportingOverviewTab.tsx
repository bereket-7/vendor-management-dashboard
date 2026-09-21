"use client";

import { type ReactNode } from "react";

import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	BarChart3,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Download,
	FileText,
	FolderOpen,
	Inbox,
	type LucideIcon,
	Percent,
	Pill,
	RefreshCw,
	Send,
	Shield,
	Upload,
	XCircle,
} from "lucide-react";
import {
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
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
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { emptyOverview } from "@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers";
import {
	EXCEPTION_STATUS_STYLES,
	type ProgramOverviewData,
	SUBMISSION_STATUS_STYLES,
	useProgramOverviewQuery,
} from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { cn } from "@/lib/utils";

const OVERVIEW_TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const OVERVIEW_TABLE_CELL = "px-4 py-2.5";
const OVERVIEW_PAGE_STACK = "space-y-5";
const OVERVIEW_SECTION_GAP = "gap-4";

const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
	"qa-1": Upload,
	"qa-2": RefreshCw,
	"qa-3": Download,
	"qa-4": Send,
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

function OverviewMetricCard({
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

function MedicaidKpiRow({ data }: { data: ProgramOverviewData }) {
	if (data.kpis.kind !== "medicaid") return null;
	const k = data.kpis;

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<OverviewMetricCard
				label="Encounter Files Submitted"
				value={k.encounterFilesSubmitted}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />
						{k.encounterFilesDelta}% vs. Prior Period
					</span>
				}
				icon={FileText}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<OverviewMetricCard
				label="Encounters Submitted"
				value={formatCount(k.encountersSubmitted)}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />
						{k.encountersDelta}% vs. Prior Period
					</span>
				}
				icon={Send}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<OverviewMetricCard
				label="Accepted"
				value={formatCount(k.accepted)}
				hint={`${k.acceptanceRate.toFixed(2)}% Acceptance Rate`}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<OverviewMetricCard
				label="Rejected"
				value={formatCount(k.rejected)}
				hint={`${k.rejectionRate.toFixed(2)}% Rejection Rate`}
				icon={XCircle}
				tone="text-red-700 bg-red-500/10"
				valueClassName="text-red-600"
			/>
			<OverviewMetricCard
				label="Pending Responses"
				value={formatCount(k.pendingResponses)}
				hint={`${k.pendingRate.toFixed(2)}% Pending Rate`}
				icon={Clock3}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
			<OverviewMetricCard
				label="Acceptance Rate"
				value={`${k.acceptanceRate.toFixed(2)}%`}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />
						{k.acceptanceRateDelta}% vs. Prior Period
					</span>
				}
				icon={Percent}
				tone="text-violet-700 bg-violet-500/10"
				valueClassName="text-emerald-700"
			/>
		</div>
	);
}

function MedicareKpiRow({ data }: { data: ProgramOverviewData }) {
	if (data.kpis.kind !== "medicare") return null;
	const k = data.kpis;

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<OverviewMetricCard
				label="Reports Submitted"
				value={k.reportsSubmitted}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />
						{k.reportsSubmittedDelta}% vs. Prior Period
					</span>
				}
				icon={FileText}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<OverviewMetricCard
				label="CMS Responses"
				value={k.cmsResponsesReceived}
				hint={`${k.responseRate.toFixed(2)}% Response Rate`}
				icon={Inbox}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<OverviewMetricCard
				label="Open Issues"
				value={k.openIssues}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowDownRight className="size-3" />
						{Math.abs(k.openIssuesDelta)}% vs. Prior Period
					</span>
				}
				icon={AlertTriangle}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
			<OverviewMetricCard
				label="Compliance Status"
				value={k.complianceStatus}
				hint={k.complianceHint}
				icon={Shield}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<OverviewMetricCard
				label="RA Status"
				value={k.riskAdjustmentStatus}
				hint={k.riskAdjustmentHint}
				icon={BarChart3}
				tone="text-violet-700 bg-violet-500/10"
				valueClassName="text-emerald-700"
			/>
			<OverviewMetricCard
				label="Part D Status"
				value={k.partDStatus}
				hint={k.partDHint}
				icon={Pill}
				tone="text-sky-700 bg-sky-500/10"
				valueClassName="text-emerald-700"
			/>
		</div>
	);
}

function RecentSubmissionsPanel({
	data,
	variant,
}: {
	data: ProgramOverviewData;
	variant: "medicaid" | "medicare";
}) {
	const totalEntries = variant === "medicaid" ? 128 : 42;

	return (
		<CmsEdgeSectionPanel
			title="Recent Submissions"
			action={<PanelLink>View All</PanelLink>}
			footer={
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-5 py-3 text-xs text-muted-foreground">
					<span>Showing 1 to 5 of {totalEntries} entries</span>
					<div className="flex items-center gap-1">
						<Button variant="outline" size="icon" className="size-7" disabled>
							<ChevronLeft className="size-3.5" />
						</Button>
						<Button variant="default" size="icon" className="size-7 text-xs">
							1
						</Button>
						<Button variant="outline" size="icon" className="size-7">
							<ChevronRight className="size-3.5" />
						</Button>
					</div>
				</div>
			}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="border-b border-border/50 hover:bg-transparent">
							<TableHead className={cn(OVERVIEW_TABLE_HEAD, "min-w-[140px]")}>
								{variant === "medicare" ? "Submission ID" : "Submission Batch"}
							</TableHead>
							{variant === "medicaid" ? (
								<TableHead className={OVERVIEW_TABLE_HEAD}>State</TableHead>
							) : (
								<TableHead className={OVERVIEW_TABLE_HEAD}>
									Report Type
								</TableHead>
							)}
							<TableHead className={OVERVIEW_TABLE_HEAD}>
								Submitted Date
							</TableHead>
							<TableHead className={OVERVIEW_TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(OVERVIEW_TABLE_HEAD, "pr-5 text-right")}>
								Records
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.recentSubmissions.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={OVERVIEW_TABLE_CELL}>
									<Button
										variant="link"
										className={cn(
											CMS_EDGE_TABLE_LINK_CLASS,
											"whitespace-normal text-left"
										)}
									>
										{row.batch}
									</Button>
								</TableCell>
								{variant === "medicaid" ? (
									<TableCell className={OVERVIEW_TABLE_CELL}>
										{row.region ?? "—"}
									</TableCell>
								) : (
									<TableCell className={OVERVIEW_TABLE_CELL}>
										{row.reportType}
									</TableCell>
								)}
								<TableCell className={cn(OVERVIEW_TABLE_CELL, "tabular-nums")}>
									{row.submittedDate}
								</TableCell>
								<TableCell className={OVERVIEW_TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={
											SUBMISSION_STATUS_STYLES[row.status] ??
											"border-border bg-muted text-muted-foreground"
										}
									/>
								</TableCell>
								<TableCell
									className={cn(
										OVERVIEW_TABLE_CELL,
										"pr-5 text-right tabular-nums"
									)}
								>
									{formatCount(row.records)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function RecentResponseFilesPanel({
	data,
	variant,
}: {
	data: ProgramOverviewData;
	variant: "medicaid" | "medicare";
}) {
	const title =
		variant === "medicare" ? "Recent CMS Responses" : "Recent Response Files";

	return (
		<CmsEdgeSectionPanel title={title}>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={OVERVIEW_TABLE_HEAD}>
								{variant === "medicare" ? "Response File" : "Response File"}
							</TableHead>
							{variant === "medicaid" ? (
								<>
									<TableHead className={OVERVIEW_TABLE_HEAD}>
										Report Type
									</TableHead>
									<TableHead className={OVERVIEW_TABLE_HEAD}>
										Received Date
									</TableHead>
									<TableHead className={cn(OVERVIEW_TABLE_HEAD, "text-right")}>
										Accepted
									</TableHead>
									<TableHead className={cn(OVERVIEW_TABLE_HEAD, "text-right")}>
										Rejected
									</TableHead>
								</>
							) : (
								<>
									<TableHead className={OVERVIEW_TABLE_HEAD}>
										Report Type
									</TableHead>
									<TableHead className={OVERVIEW_TABLE_HEAD}>
										Received Date
									</TableHead>
								</>
							)}
							<TableHead className={cn(OVERVIEW_TABLE_HEAD, "pr-5")}>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.recentResponses.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={OVERVIEW_TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.file}
									</Button>
								</TableCell>
								<TableCell className={OVERVIEW_TABLE_CELL}>
									{row.reportType}
								</TableCell>
								<TableCell className={cn(OVERVIEW_TABLE_CELL, "tabular-nums")}>
									{row.receivedDate}
								</TableCell>
								{variant === "medicaid" ? (
									<>
										<TableCell
											className={cn(
												OVERVIEW_TABLE_CELL,
												"text-right tabular-nums text-emerald-700"
											)}
										>
											{row.accepted != null ? formatCount(row.accepted) : "—"}
										</TableCell>
										<TableCell
											className={cn(
												OVERVIEW_TABLE_CELL,
												"text-right tabular-nums text-red-600"
											)}
										>
											{row.rejected != null ? formatCount(row.rejected) : "—"}
										</TableCell>
									</>
								) : null}
								<TableCell className={cn(OVERVIEW_TABLE_CELL, "pr-5")}>
									<StatusPill
										label={row.status}
										className={
											row.status === "Processed with Errors"
												? "border-amber-200 bg-amber-50 text-amber-800"
												: "border-emerald-200 bg-emerald-50 text-emerald-700"
										}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ExceptionsSummaryPanel({ data }: { data: ProgramOverviewData }) {
	return (
		<CmsEdgeSectionPanel
			title="Exceptions Summary"
			action={<PanelLink>View All</PanelLink>}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={cn(OVERVIEW_TABLE_HEAD, "w-[100px]")}>
								Error Code
							</TableHead>
							<TableHead className={OVERVIEW_TABLE_HEAD}>Description</TableHead>
							<TableHead
								className={cn(OVERVIEW_TABLE_HEAD, "w-[72px] text-right")}
							>
								Count
							</TableHead>
							<TableHead className={cn(OVERVIEW_TABLE_HEAD, "w-[100px] pr-5")}>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.exceptions.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell
									className={cn(OVERVIEW_TABLE_CELL, "font-mono font-medium")}
								>
									{row.code}
								</TableCell>
								<TableCell
									className={cn(
										OVERVIEW_TABLE_CELL,
										"pr-6 text-muted-foreground leading-relaxed"
									)}
								>
									{row.description}
								</TableCell>
								<TableCell
									className={cn(OVERVIEW_TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(row.count)}
								</TableCell>
								<TableCell className={cn(OVERVIEW_TABLE_CELL, "pr-5")}>
									<StatusPill
										label={row.status}
										className={EXCEPTION_STATUS_STYLES[row.status]}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function AcceptanceTrendPanel({ data }: { data: ProgramOverviewData }) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Acceptance Trend"
			bodyClassName="flex min-h-0 flex-1 flex-col"
		>
			<div className="min-h-[240px] flex-1 border-t border-border/50 px-4 py-4">
				<ResponsiveContainer width="100%" height="100%" minHeight={200}>
					<LineChart
						data={data.acceptanceTrend}
						margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
						<XAxis
							dataKey="month"
							tick={{ fontSize: 10 }}
							interval={0}
							angle={-15}
							textAnchor="end"
							height={40}
						/>
						<YAxis
							tick={{ fontSize: 11 }}
							width={36}
							domain={[88, 100]}
							tickFormatter={(v) => `${v}%`}
						/>
						<Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
						<Line
							type="monotone"
							dataKey="rate"
							name="Acceptance Rate"
							stroke="#22c55e"
							strokeWidth={2}
							dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function TopRejectionDonutPanel({ data }: { data: ProgramOverviewData }) {
	const total = data.rejectionDonut.reduce((sum, item) => sum + item.count, 0);
	const pieData = data.rejectionDonut.map((item) => ({
		name: item.name,
		value: item.count,
		color: item.color,
	}));

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Top Rejection Reasons"
			bodyClassName="flex min-h-0 flex-1 flex-col"
		>
			<div className="flex min-h-[240px] flex-1 gap-4 border-t border-border/50 px-5 py-4">
				<div className="relative mx-auto w-full max-w-[140px] shrink-0">
					<ResponsiveContainer width="100%" height={168}>
						<PieChart>
							<Pie
								data={pieData}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{pieData.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-xs font-bold tabular-nums leading-tight">
							{(total / 1000).toFixed(1)}K
						</p>
						<p className="text-[9px] text-muted-foreground">Total Rejections</p>
					</div>
				</div>
				<ul className="flex min-w-0 flex-1 flex-col justify-center gap-3 py-1 text-xs leading-relaxed">
					{data.rejectionDonut.map((item) => (
						<li
							key={item.name}
							className="flex items-start justify-between gap-4"
						>
							<span className="flex min-w-0 items-start gap-2 font-medium">
								<span
									className="mt-1.5 size-2 shrink-0 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span className="line-clamp-2">{item.name}</span>
							</span>
							<span className="shrink-0 pt-0.5 tabular-nums text-muted-foreground">
								{(item.count / 1000).toFixed(1)}K
								<span className="ml-1.5">({item.pct}%)</span>
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function RiskAdjustmentSummaryPanel({ data }: { data: ProgramOverviewData }) {
	const ra = data.medicareExtras?.riskAdjustment;
	if (!ra) return null;

	const pieData = ra.segments.map((seg) => ({
		name: seg.name,
		value: seg.pct,
		color: seg.color,
	}));

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Risk Adjustment Summary"
			bodyClassName="flex min-h-0 flex-1 flex-col"
		>
			<div className="flex min-h-[220px] flex-1 gap-4 border-t border-border/50 px-5 py-4">
				<div className="relative mx-auto w-full max-w-[140px] shrink-0">
					<ResponsiveContainer width="100%" height={168}>
						<PieChart>
							<Pie
								data={pieData}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{pieData.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-xs font-bold tabular-nums leading-tight">
							{formatCount(ra.totalMembers)}
						</p>
						<p className="text-[9px] text-muted-foreground">Members</p>
					</div>
				</div>
				<ul className="flex min-w-0 flex-1 flex-col justify-center gap-3 py-1 text-xs leading-relaxed">
					{ra.segments.map((item) => (
						<li
							key={item.name}
							className="flex items-center justify-between gap-4"
						>
							<span className="flex min-w-0 items-center gap-2 font-medium">
								<span
									className="size-2 shrink-0 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								{item.name}
							</span>
							<span className="shrink-0 tabular-nums text-muted-foreground">
								{item.pct}%
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function PdeSummaryPanel({ data }: { data: ProgramOverviewData }) {
	const pde = data.medicareExtras?.pdeSummary;
	if (!pde) return null;

	const pieData = pde.segments.map((seg) => ({
		name: seg.name,
		value: seg.value,
		color: seg.color,
	}));

	return (
		<CmsEdgeSectionPanel title="PDE Summary">
			<div className="border-t border-border/50 px-5 py-4">
				<div className="mb-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
					<div>
						<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
							Submitted
						</p>
						<p className="mt-0.5 font-semibold tabular-nums">{pde.submitted}</p>
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
							Accepted
						</p>
						<p className="mt-0.5 font-semibold tabular-nums">{pde.accepted}</p>
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
							Records Submitted
						</p>
						<p className="mt-0.5 font-semibold tabular-nums">
							{formatCount(pde.recordsSubmitted)}
						</p>
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
							Acceptance Rate
						</p>
						<p className="mt-0.5 font-semibold tabular-nums text-emerald-700">
							{pde.acceptanceRate.toFixed(2)}%
						</p>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<div className="relative mx-auto w-full max-w-[120px] shrink-0">
						<ResponsiveContainer width="100%" height={140}>
							<PieChart>
								<Pie
									data={pieData}
									dataKey="value"
									nameKey="name"
									innerRadius="58%"
									outerRadius="88%"
									paddingAngle={2}
									stroke="none"
									isAnimationActive={false}
								>
									{pieData.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
							</PieChart>
						</ResponsiveContainer>
					</div>
					<ul className="flex min-w-0 flex-1 flex-col gap-2 text-xs">
						{pde.segments.map((item) => (
							<li
								key={item.name}
								className="flex items-center justify-between gap-2"
							>
								<span className="flex min-w-0 items-center gap-1.5 font-medium">
									<span
										className="size-2 shrink-0 rounded-full"
										style={{ backgroundColor: item.color }}
									/>
									{item.name}
								</span>
								<span className="shrink-0 tabular-nums text-muted-foreground">
									{formatCount(item.value)}
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ComplianceDeadlinesPanel({ data }: { data: ProgramOverviewData }) {
	const deadlines = data.medicareExtras?.complianceDeadlines;
	if (!deadlines) return null;

	return (
		<CmsEdgeSectionPanel title="Compliance Deadlines">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={OVERVIEW_TABLE_HEAD}>Requirement</TableHead>
							<TableHead className={OVERVIEW_TABLE_HEAD}>Due Date</TableHead>
							<TableHead className={cn(OVERVIEW_TABLE_HEAD, "pr-5")}>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{deadlines.map((row) => (
							<TableRow
								key={row.requirement}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={OVERVIEW_TABLE_CELL}>
									{row.requirement}
								</TableCell>
								<TableCell className={cn(OVERVIEW_TABLE_CELL, "tabular-nums")}>
									{row.dueDate}
								</TableCell>
								<TableCell className={cn(OVERVIEW_TABLE_CELL, "pr-5")}>
									<StatusPill label={row.status} className={row.statusStyle} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function QuickActionsPanel({ data }: { data: ProgramOverviewData }) {
	return (
		<CmsEdgeSectionPanel title="Quick Actions">
			<div className="grid grid-cols-1 gap-3 border-t border-border/50 p-4 sm:grid-cols-2">
				{data.quickActions.map((action) => {
					const Icon = QUICK_ACTION_ICONS[action.id] ?? FolderOpen;
					return (
						<button
							key={action.id}
							type="button"
							className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3.5 text-left transition-colors hover:bg-muted/30"
							onClick={() => toast.message(action.title)}
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
								<Icon className="size-4" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-semibold text-foreground">
									{action.title}
								</p>
								<p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
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

function MedicaidOverviewContent({ data }: { data: ProgramOverviewData }) {
	return (
		<>
			<MedicaidKpiRow data={data} />
			<div
				className={cn(
					"grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]",
					OVERVIEW_SECTION_GAP
				)}
			>
				<div className={cn("flex min-w-0 flex-col", OVERVIEW_SECTION_GAP)}>
					<RecentSubmissionsPanel data={data} variant="medicaid" />
					<RecentResponseFilesPanel data={data} variant="medicaid" />
					<ExceptionsSummaryPanel data={data} />
				</div>
				<div className={cn("flex min-w-0 flex-col", OVERVIEW_SECTION_GAP)}>
					<AcceptanceTrendPanel data={data} />
					<TopRejectionDonutPanel data={data} />
					<QuickActionsPanel data={data} />
				</div>
			</div>
		</>
	);
}

function MedicareOverviewContent({ data }: { data: ProgramOverviewData }) {
	return (
		<>
			<MedicareKpiRow data={data} />
			<div
				className={cn(
					"grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]",
					OVERVIEW_SECTION_GAP
				)}
			>
				<div className={cn("flex min-w-0 flex-col", OVERVIEW_SECTION_GAP)}>
					<RecentSubmissionsPanel data={data} variant="medicare" />
					<RecentResponseFilesPanel data={data} variant="medicare" />
					<ComplianceDeadlinesPanel data={data} />
				</div>
				<div className={cn("flex min-w-0 flex-col", OVERVIEW_SECTION_GAP)}>
					<RiskAdjustmentSummaryPanel data={data} />
					<PdeSummaryPanel data={data} />
					<QuickActionsPanel data={data} />
				</div>
			</div>
		</>
	);
}

type ProgramReportingOverviewTabProps = {
	programType: ProgramType;
	reportingPeriod?: string;
};

export function ProgramReportingOverviewTab({
	programType,
	reportingPeriod,
}: ProgramReportingOverviewTabProps) {
	const overviewQuery = useProgramOverviewQuery(programType, reportingPeriod);
	const data = overviewQuery.data ?? emptyOverview(programType);

	return (
		<div className={OVERVIEW_PAGE_STACK}>
			{overviewQuery.isLoading ? (
				<p className="px-4 py-8 text-center text-sm text-muted-foreground">
					Loading overview…
				</p>
			) : null}
			{programType === "medicare" ? (
				<MedicareOverviewContent data={data} />
			) : (
				<MedicaidOverviewContent data={data} />
			)}
			<CmsEdgePageFooter />
		</div>
	);
}

"use client";

import { type ReactNode } from "react";

import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	BarChart3,
	CalendarDays,
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
	Legend,
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
import {
	MEDICAID_SUBMISSION_STATUS_STYLES,
	MEDICARE_SUBMISSION_STATUS_STYLES,
	type ProgramSubmissionsData,
	useProgramSubmissionsQuery,
} from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import { emptySubmissions } from "@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { cn } from "@/lib/utils";

const PAGE_STACK = "space-y-5";
const SECTION_GAP = "gap-4";
const TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const TABLE_CELL = "px-4 py-2.5";

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

function TablePagination({ total, shown }: { total: number; shown: number }) {
	return (
		<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-5 py-3 text-xs text-muted-foreground">
			<span>
				Showing 1 to {shown} of {total} entries
			</span>
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
	);
}

function MedicareKpiRow({
	data,
}: {
	data: Extract<ProgramSubmissionsData, { kind: "medicare" }>;
}) {
	const k = data.kpis;

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<MetricCard
				label="Medicare Reports Submitted"
				value={k.reportsSubmitted}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />+{" "}
						{k.reportsSubmittedDelta.toFixed(2)}% vs Prior Period
					</span>
				}
				icon={FileText}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<MetricCard
				label="CMS Responses Received"
				value={k.cmsResponsesReceived}
				hint={`${k.responseRate.toFixed(2)}% Response Rate`}
				icon={Inbox}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<MetricCard
				label="Open Issues"
				value={k.openIssues}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowDownRight className="size-3" />
						{Math.abs(k.openIssuesDelta).toFixed(2)}% vs Prior Period
					</span>
				}
				icon={AlertTriangle}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
			<MetricCard
				label="Compliance Status"
				value={k.complianceStatus}
				hint={k.complianceHint}
				icon={Shield}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<MetricCard
				label="Risk Adjustment Status"
				value={k.riskAdjustmentStatus}
				hint={k.riskAdjustmentHint}
				icon={BarChart3}
				tone="text-violet-700 bg-violet-500/10"
			/>
			<MetricCard
				label="Part D (PDE) Status"
				value={k.partDStatus}
				hint={k.partDHint}
				icon={Pill}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
		</div>
	);
}

function MedicaidKpiRow({
	data,
}: {
	data: Extract<ProgramSubmissionsData, { kind: "medicaid" }>;
}) {
	const k = data.kpis;

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<MetricCard
				label="Encounter Files Submitted"
				value={k.encounterFilesSubmitted}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />
						{k.encounterFilesDelta}% vs Prior Period
					</span>
				}
				icon={FileText}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<MetricCard
				label="Encounters Submitted"
				value={formatCount(k.encountersSubmitted)}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />
						{k.encountersDelta}% vs Prior Period
					</span>
				}
				icon={Send}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<MetricCard
				label="Accepted"
				value={formatCount(k.accepted)}
				hint={`${k.acceptanceRate.toFixed(2)}% Acceptance Rate`}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<MetricCard
				label="Rejected"
				value={formatCount(k.rejected)}
				hint={`${k.rejectionRate.toFixed(2)}% Rejection Rate`}
				icon={XCircle}
				tone="text-red-700 bg-red-500/10"
				valueClassName="text-red-600"
			/>
			<MetricCard
				label="Pending Responses"
				value={formatCount(k.pendingResponses)}
				hint={`${k.pendingRate.toFixed(2)}% Pending Rate`}
				icon={Clock3}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
			<MetricCard
				label="Acceptance Rate"
				value={`${k.acceptanceRate.toFixed(2)}%`}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />+ {k.acceptanceRateDelta}% vs
						Prior Period
					</span>
				}
				icon={Percent}
				tone="text-violet-700 bg-violet-500/10"
				valueClassName="text-emerald-700"
			/>
		</div>
	);
}

function MedicareSubmissionsTable({
	data,
}: {
	data: Extract<ProgramSubmissionsData, { kind: "medicare" }>;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Submissions List"
			action={<PanelLink>View All</PanelLink>}
			bodyClassName="flex min-h-0 flex-1 flex-col"
			footer={
				<TablePagination
					total={data.totalEntries}
					shown={data.submissions.length}
				/>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Submission ID</TableHead>
							<TableHead className={TABLE_HEAD}>Report Type</TableHead>
							<TableHead className={TABLE_HEAD}>Submitted Date/Time</TableHead>
							<TableHead className={TABLE_HEAD}>Reporting Period</TableHead>
							<TableHead className={TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(TABLE_HEAD, "text-right")}>
								Records
							</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-5")}>
								Submitted By
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.submissions.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.id}
									</Button>
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "font-medium")}>
									{row.reportType}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.submittedAt}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									{row.reportingPeriod}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={MEDICARE_SUBMISSION_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(row.records)}
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "pr-5 text-muted-foreground")}
								>
									{row.submittedBy}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function MedicaidSubmissionsTable({
	data,
}: {
	data: Extract<ProgramSubmissionsData, { kind: "medicaid" }>;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Submissions List"
			action={<PanelLink>View All</PanelLink>}
			bodyClassName="flex min-h-0 flex-1 flex-col"
			footer={
				<TablePagination
					total={data.totalEntries}
					shown={data.submissions.length}
				/>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Submission Batch</TableHead>
							<TableHead className={cn(TABLE_HEAD, "min-w-[180px]")}>
								File Name
							</TableHead>
							<TableHead className={TABLE_HEAD}>State</TableHead>
							<TableHead className={TABLE_HEAD}>Submitted Date/Time</TableHead>
							<TableHead className={TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(TABLE_HEAD, "text-right")}>
								Encounters
							</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-5")}>
								Submitted By
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.submissions.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.batch}
									</Button>
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "font-mono text-[11px]")}>
									{row.fileName}
								</TableCell>
								<TableCell className={TABLE_CELL}>{row.state}</TableCell>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.submittedAt}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={MEDICAID_SUBMISSION_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(row.encounters)}
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "pr-5 text-muted-foreground")}
								>
									{row.submittedBy}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function DonutPanel({
	title,
	data,
	centerLabel,
	centerValue,
	footer,
}: {
	title: string;
	data: { name: string; value: number; color: string }[];
	centerLabel: string;
	centerValue: string;
	footer?: ReactNode;
}) {
	const total = data.reduce((sum, item) => sum + item.value, 0);

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title={title}
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				footer ? (
					<div className="border-t border-border/50 px-4 py-2 text-center">
						{footer}
					</div>
				) : undefined
			}
		>
			<div className="flex min-h-[220px] flex-1 flex-col gap-2 border-t border-border/50 px-3 py-3 sm:flex-row">
				<div className="relative mx-auto w-full max-w-[140px] flex-1">
					<ResponsiveContainer width="100%" height="100%" minHeight={120}>
						<PieChart>
							<Pie
								data={data}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{data.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-sm font-bold tabular-nums leading-tight">
							{centerValue}
						</p>
						<p className="text-[10px] text-muted-foreground">{centerLabel}</p>
					</div>
				</div>
				<ul className="flex flex-1 flex-col justify-center gap-2 text-xs">
					{data.map((item) => (
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
								{formatCount(item.value)}
								<span className="ml-1">
									({((item.value / total) * 100).toFixed(0)}%)
								</span>
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function SummaryByStatusPanel({
	title,
	items,
	valueFormatter,
}: {
	title: string;
	items: { status: string; count: number; pct: number; color: string }[];
	valueFormatter?: (count: number) => string;
}) {
	const maxCount = Math.max(...items.map((item) => item.count));
	const format = valueFormatter ?? ((count: number) => String(count));

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title={title}
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
		>
			<div className="space-y-3 border-t border-border/50 px-4 py-4">
				{items.map((item) => (
					<div key={item.status} className="space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="font-medium">{item.status}</span>
							<span className="tabular-nums text-muted-foreground">
								{format(item.count)}
								<span className="ml-1.5">({item.pct.toFixed(1)}%)</span>
							</span>
						</div>
						<div className="h-2 overflow-hidden rounded-full bg-muted/40">
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

function MedicareTrendPanel({
	data,
}: {
	data: Extract<ProgramSubmissionsData, { kind: "medicare" }>;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Submission Summary by Month"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
		>
			<div className="min-h-[220px] flex-1 border-t border-border/50 px-2 py-2">
				<ResponsiveContainer width="100%" height="100%" minHeight={180}>
					<LineChart
						data={data.trendByMonth}
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
						<Tooltip />
						<Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
						<Line
							type="monotone"
							dataKey="accepted"
							name="Accepted"
							stroke="#22c55e"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="acknowledged"
							name="Acknowledged"
							stroke="#3b82f6"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
						<Line
							type="monotone"
							dataKey="completed"
							name="Completed"
							stroke="#6366f1"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
						<Line
							type="monotone"
							dataKey="failed"
							name="Failed"
							stroke="#ef4444"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function MedicaidTrendPanel({
	data,
}: {
	data: Extract<ProgramSubmissionsData, { kind: "medicaid" }>;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Submissions Trend"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
		>
			<div className="min-h-[220px] flex-1 border-t border-border/50 px-2 py-2">
				<ResponsiveContainer width="100%" height="100%" minHeight={180}>
					<LineChart
						data={data.trendWeekly}
						margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
						<XAxis dataKey="week" tick={{ fontSize: 10 }} />
						<YAxis
							tick={{ fontSize: 11 }}
							width={48}
							tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
						/>
						<Tooltip formatter={(v: number) => formatCount(v)} />
						<Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
						<Line
							type="monotone"
							dataKey="accepted"
							name="Accepted"
							stroke="#22c55e"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="rejected"
							name="Rejected"
							stroke="#ef4444"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
						<Line
							type="monotone"
							dataKey="pending"
							name="Pending"
							stroke="#f59e0b"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function MedicareRecentActivityPanel({
	data,
}: {
	data: Extract<ProgramSubmissionsData, { kind: "medicare" }>;
}) {
	return (
		<CmsEdgeSectionPanel
			title="Recent Submission Activity"
			bodyClassName="pb-4"
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Date/Time</TableHead>
							<TableHead className={TABLE_HEAD}>Submission ID</TableHead>
							<TableHead className={TABLE_HEAD}>Report Type</TableHead>
							<TableHead className={TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-5")}>Details</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.recentActivity.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.at}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.submissionId}
									</Button>
								</TableCell>
								<TableCell className={TABLE_CELL}>{row.reportType}</TableCell>
								<TableCell className={TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={MEDICARE_SUBMISSION_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "pr-5 text-muted-foreground")}
								>
									{row.details}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function MedicaidRecentActivityPanel({
	data,
}: {
	data: Extract<ProgramSubmissionsData, { kind: "medicaid" }>;
}) {
	return (
		<CmsEdgeSectionPanel
			title="Recent Submission Activity"
			bodyClassName="pb-4"
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Date/Time</TableHead>
							<TableHead className={TABLE_HEAD}>Batch</TableHead>
							<TableHead className={TABLE_HEAD}>File Name</TableHead>
							<TableHead className={TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(TABLE_HEAD, "text-right")}>
								Encounters
							</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-5")}>Details</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.recentActivity.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.at}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.batch}
									</Button>
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "font-mono text-[11px]")}>
									{row.fileName}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={MEDICAID_SUBMISSION_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(row.encounters)}
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "pr-5 text-muted-foreground")}
								>
									{row.details}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
	"sq-1": Upload,
	"sq-2": RefreshCw,
	"sq-3": Download,
	"sq-4": Inbox,
	"sq-5": Upload,
	"sq-6": AlertTriangle,
};

function QuickActionsPanel({
	actions,
}: {
	actions: { id: string; title: string; description: string }[];
}) {
	return (
		<CmsEdgeSectionPanel title="Quick Actions" bodyClassName="pb-4">
			<div className="grid grid-cols-1 gap-3 border-t border-border/50 p-4 sm:grid-cols-2">
				{actions.map((action) => {
					const Icon = QUICK_ACTION_ICONS[action.id] ?? FolderOpen;
					return (
						<button
							key={action.id}
							type="button"
							className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3.5 text-left transition-colors hover:bg-muted/30"
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

type ProgramReportingSubmissionsTabProps = {
	programType: ProgramType;
	reportingPeriod?: string;
};

export function ProgramReportingSubmissionsTab({
	programType,
	reportingPeriod,
}: ProgramReportingSubmissionsTabProps) {
	const submissionsQuery = useProgramSubmissionsQuery(
		programType,
		reportingPeriod
	);
	const data = submissionsQuery.data ?? emptySubmissions(programType);

	if (submissionsQuery.isLoading) {
		return (
			<div className={PAGE_STACK}>
				<p className="px-4 py-8 text-center text-sm text-muted-foreground">
					Loading submissions…
				</p>
				<CmsEdgePageFooter />
			</div>
		);
	}

	if (data.kind === "medicare") {
		return (
			<div className={PAGE_STACK}>
				<MedicareKpiRow data={data} />

				<div
					className={cn(
						"grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,1fr)_minmax(240px,1fr)]",
						SECTION_GAP
					)}
				>
					<MedicareSubmissionsTable data={data} />
					<DonutPanel
						title="Submissions by Report Type"
						data={data.byReportType}
						centerValue={String(data.totalEntries)}
						centerLabel="Total"
						footer={<PanelLink>View Full Report</PanelLink>}
					/>
					<SummaryByStatusPanel
						title="Submissions Summary"
						items={data.summaryByStatus}
					/>
				</div>

				<div
					className={cn(
						"grid grid-cols-1 items-stretch lg:grid-cols-3",
						SECTION_GAP
					)}
				>
					<MedicareTrendPanel data={data} />
					<MedicareRecentActivityPanel data={data} />
					<QuickActionsPanel actions={data.quickActions} />
				</div>

				<CmsEdgePageFooter />
			</div>
		);
	}

	return (
		<div className={PAGE_STACK}>
			<MedicaidKpiRow data={data} />

			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,1fr)_minmax(240px,1fr)]",
					SECTION_GAP
				)}
			>
				<MedicaidSubmissionsTable data={data} />
				<MedicaidTrendPanel data={data} />
				<DonutPanel
					title="Submissions by State"
					data={data.byState}
					centerValue={formatCount(data.totalEncounters)}
					centerLabel="Total Encounters"
					footer={<PanelLink>View Full Report</PanelLink>}
				/>
			</div>

			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-3",
					SECTION_GAP
				)}
			>
				<SummaryByStatusPanel
					title="Submission Summary by Status"
					items={data.summaryByStatus}
					valueFormatter={formatCount}
				/>
				<MedicaidRecentActivityPanel data={data} />
				<QuickActionsPanel actions={data.quickActions} />
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}

"use client";

import { type ReactNode } from "react";

import {
	AlertTriangle,
	ArrowUpRight,
	CheckCircle2,
	Clock3,
	FileText,
	type LucideIcon,
	Percent,
	XCircle,
} from "lucide-react";
import {
	Bar,
	BarChart,
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
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_SECTION_GAP,
	CMS_EDGE_TABLE_CELL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
	CmsEdgeTripleRow,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	MEDICAID_RATE_BY_MONTH,
	MEDICAID_RATE_BY_PLAN,
	MEDICAID_RATE_BY_REPORT_TYPE,
	MEDICAID_REPORTS_BY_TYPE,
	MEDICAID_SUMMARY_BY_TYPE,
	MEDICAID_TOP_REJECTIONS,
} from "@/features/admin/features/claim-encounter/medicaid-encounter/feature/queries/useMedicaidEncounterQuery";
import { getAcceptanceDerived } from "@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers";
import { useProgramOverviewQuery } from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import { emptyOverview } from "@/features/admin/features/claim-encounter/program-reporting/feature/mappers/program-reportingMappers";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { cn } from "@/lib/utils";

function PanelLink({ children }: { children: ReactNode }) {
	return (
		<Button variant="link" size="sm" className="h-7 px-0 text-xs text-primary">
			{children}
		</Button>
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

function AcceptanceKpiRow({
	kpis,
}: {
	kpis: ReturnType<typeof getAcceptanceDerived>["kpis"];
}) {
	const k = kpis;

	return (
		<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<MetricCard
				label="Overall Acceptance Rate"
				value={`${k.acceptanceRate.toFixed(2)}%`}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />+ {k.acceptanceDelta.toFixed(2)}%
						vs Prior Period
					</span>
				}
				icon={Percent}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<MetricCard
				label="Reports Submitted"
				value={k.reportsSubmitted}
				icon={FileText}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<MetricCard
				label="Reports Accepted"
				value={k.reportsAccepted}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<MetricCard
				label="Reports Rejected"
				value={k.reportsRejected}
				icon={XCircle}
				tone="text-red-700 bg-red-500/10"
				valueClassName="text-red-600"
			/>
			<MetricCard
				label="State Responses Pending"
				value={k.responsesPending}
				icon={Clock3}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<MetricCard
				label="Critical / Open Issues"
				value={k.openIssues}
				icon={AlertTriangle}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
		</div>
	);
}

function AcceptanceTrendChart({
	data,
}: {
	data: ReturnType<typeof getAcceptanceDerived>["acceptanceTrend"];
}) {
	return (
		<ChartPanel
			title="Acceptance Rate Trend"
			footer={<PanelLink>View Details</PanelLink>}
		>
			<ResponsiveContainer width="100%" height="100%" minHeight={180}>
				<LineChart
					data={data}
					margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
				>
					<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
					<XAxis dataKey="month" tick={{ fontSize: 11 }} />
					<YAxis
						tick={{ fontSize: 11 }}
						width={36}
						domain={[0, 100]}
						tickFormatter={(v) => `${v}%`}
					/>
					<Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
					<Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
					<Line
						type="monotone"
						dataKey="rate"
						name="Acceptance Rate"
						stroke="#13446c"
						strokeWidth={2}
						dot={{ r: 3 }}
					/>
					<Line
						type="monotone"
						dataKey="prior"
						name="Prior Period"
						stroke="#94a3b8"
						strokeWidth={2}
						strokeDasharray="4 4"
						dot={{ r: 2 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}

function ChartPanel({
	title,
	children,
	footer,
	className,
}: {
	title: string;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
}) {
	return (
		<CmsEdgeSectionPanel
			className={cn("flex h-full min-h-0 flex-col", className)}
			title={title}
			bodyClassName="flex min-h-0 flex-1 flex-col"
			footer={
				footer ? (
					<div className="border-t border-border/50 px-4 py-2 text-center">
						{footer}
					</div>
				) : undefined
			}
		>
			<div className="min-h-[200px] flex-1 border-t border-border/50 px-2 py-2">
				{children}
			</div>
		</CmsEdgeSectionPanel>
	);
}

function HorizontalRateChart({
	title,
	data,
	color,
}: {
	title: string;
	data: { name: string; rate: number }[];
	color: string;
}) {
	return (
		<ChartPanel title={title} footer={<PanelLink>View Details</PanelLink>}>
			<ResponsiveContainer width="100%" height="100%" minHeight={180}>
				<BarChart
					data={data}
					layout="vertical"
					margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						className="stroke-border/50"
						horizontal={false}
					/>
					<XAxis
						type="number"
						domain={[80, 100]}
						tick={{ fontSize: 10 }}
						tickFormatter={(v) => `${v}%`}
					/>
					<YAxis
						type="category"
						dataKey="name"
						tick={{ fontSize: 10 }}
						width={88}
					/>
					<Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
					<Bar dataKey="rate" fill={color} radius={[0, 4, 4, 0]} barSize={14} />
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}

function ReportsByTypeDonut() {
	const total = MEDICAID_REPORTS_BY_TYPE.reduce((s, d) => s + d.value, 0);

	return (
		<ChartPanel
			title="Reports by Type"
			footer={<PanelLink>View Full Report</PanelLink>}
		>
			<div className="flex h-full min-h-[200px] flex-col gap-2 px-2 sm:flex-row">
				<div className="relative mx-auto w-full max-w-[140px] flex-1">
					<ResponsiveContainer width="100%" height="100%" minHeight={120}>
						<PieChart>
							<Pie
								data={MEDICAID_REPORTS_BY_TYPE}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{MEDICAID_REPORTS_BY_TYPE.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-sm font-bold tabular-nums">{total}</p>
						<p className="text-[10px] text-muted-foreground">Total</p>
					</div>
				</div>
				<ul className="flex flex-1 flex-col justify-center gap-1.5 text-xs">
					{MEDICAID_REPORTS_BY_TYPE.map((item) => (
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
								<span className="ml-1">
									({((item.value / total) * 100).toFixed(0)}%)
								</span>
							</span>
						</li>
					))}
				</ul>
			</div>
		</ChartPanel>
	);
}

function TopRejectionReasonsTable({ rows = MEDICAID_TOP_REJECTIONS }: { rows?: typeof MEDICAID_TOP_REJECTIONS }) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Top Rejection Reasons"
			bodyClassName="flex min-h-0 flex-1 flex-col"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View All Reasons</PanelLink>
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
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7")}>
								Reason Code
							</TableHead>
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7")}>
								Description
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7 text-right")}
							>
								Rejected Reports
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7 pr-3 text-right")}
							>
								% of Total
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow
								key={row.code}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 font-mono font-medium"
									)}
								>
									{row.code}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 text-muted-foreground"
									)}
								>
									{row.description}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 text-right tabular-nums"
									)}
								>
									{row.count}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 pr-3 text-right tabular-nums"
									)}
								>
									{row.pct.toFixed(1)}%
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function AcceptanceRateByMonthChart({ data = MEDICAID_RATE_BY_MONTH }: { data?: Array<{ month: string; rate: number; prior?: number }> }) {
	return (
		<ChartPanel
			title="Acceptance Rate by Month"
			footer={<PanelLink>View Details</PanelLink>}
		>
			<ResponsiveContainer width="100%" height="100%" minHeight={180}>
				<BarChart
					data={data}
					margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
				>
					<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
					<XAxis
						dataKey="month"
						tick={{ fontSize: 10 }}
						interval={0}
						angle={-20}
						textAnchor="end"
						height={48}
					/>
					<YAxis
						tick={{ fontSize: 11 }}
						width={36}
						domain={[85, 100]}
						tickFormatter={(v) => `${v}%`}
					/>
					<Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
					<Bar
						dataKey="rate"
						fill="#13446c"
						radius={[4, 4, 0, 0]}
						barSize={28}
					/>
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}

function SummaryByReportTypeTable() {
	const totals = MEDICAID_SUMMARY_BY_TYPE.reduce(
		(acc, row) => ({
			submitted: acc.submitted + row.submitted,
			accepted: acc.accepted + row.accepted,
			rejected: acc.rejected + row.rejected,
		}),
		{ submitted: 0, accepted: 0, rejected: 0 }
	);
	const totalRate = totals.submitted
		? (totals.accepted / totals.submitted) * 100
		: 0;

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Summary by Report Type"
			bodyClassName="flex min-h-0 flex-1 flex-col"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View Full Summary</PanelLink>
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
							<TableHead className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7")}>
								Report Type
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7 text-right")}
							>
								Submitted
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7 text-right")}
							>
								Accepted
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7 text-right")}
							>
								Rejected
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "h-7 pr-3 text-right")}
							>
								Acceptance Rate
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MEDICAID_SUMMARY_BY_TYPE.map((row) => (
							<TableRow
								key={row.type}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 font-medium"
									)}
								>
									{row.type}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 text-right tabular-nums"
									)}
								>
									{row.submitted}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 text-right tabular-nums text-emerald-700"
									)}
								>
									{row.accepted}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 text-right tabular-nums text-red-600"
									)}
								>
									{row.rejected}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"py-1.5 pr-3 text-right tabular-nums"
									)}
								>
									{row.rate.toFixed(1)}%
								</TableCell>
							</TableRow>
						))}
						<TableRow className="border-t border-border/60 bg-muted/20 font-semibold hover:bg-muted/20">
							<TableCell className={cn(CMS_EDGE_TABLE_CELL_CLASS, "py-1.5")}>
								Total
							</TableCell>
							<TableCell
								className={cn(
									CMS_EDGE_TABLE_CELL_CLASS,
									"py-1.5 text-right tabular-nums"
								)}
							>
								{totals.submitted}
							</TableCell>
							<TableCell
								className={cn(
									CMS_EDGE_TABLE_CELL_CLASS,
									"py-1.5 text-right tabular-nums text-emerald-700"
								)}
							>
								{totals.accepted}
							</TableCell>
							<TableCell
								className={cn(
									CMS_EDGE_TABLE_CELL_CLASS,
									"py-1.5 text-right tabular-nums text-red-600"
								)}
							>
								{totals.rejected}
							</TableCell>
							<TableCell
								className={cn(
									CMS_EDGE_TABLE_CELL_CLASS,
									"py-1.5 pr-3 text-right tabular-nums"
								)}
							>
								{totalRate.toFixed(1)}%
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

export function MedicaidEncounterAcceptanceAnalyticsTab({
	programType = "medicaid",
	reportingPeriod,
}: {
	programType?: ProgramType;
	reportingPeriod?: string;
} = {}) {
	const overviewQuery = useProgramOverviewQuery(programType, reportingPeriod);
	const derived = getAcceptanceDerived(
		overviewQuery.data ?? emptyOverview(programType)
	);

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			{overviewQuery.isLoading ? (
				<p className="px-4 py-4 text-center text-sm text-muted-foreground">
					Loading acceptance analytics…
				</p>
			) : null}
			<AcceptanceKpiRow kpis={derived.kpis} />

			<div
				className={cn(
					"grid grid-cols-1 items-stretch sm:grid-cols-2 xl:grid-cols-4",
					CMS_EDGE_SECTION_GAP
				)}
			>
				<div className="flex min-h-0 min-w-0 flex-col">
					<AcceptanceTrendChart data={derived.acceptanceTrend} />
				</div>
				<div className="flex min-h-0 min-w-0 flex-col">
					<CmsEdgeSectionPanel title="Acceptance Rate by Report Type">
						<p className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground">
							No series from API
						</p>
					</CmsEdgeSectionPanel>
				</div>
				<div className="flex min-h-0 min-w-0 flex-col">
					<CmsEdgeSectionPanel title="Acceptance Rate by MCO / Plan">
						<p className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground">
							No series from API
						</p>
					</CmsEdgeSectionPanel>
				</div>
				<div className="flex min-h-0 min-w-0 flex-col">
					<CmsEdgeSectionPanel title="Reports by Type">
						<p className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground">
							No series from API
						</p>
					</CmsEdgeSectionPanel>
				</div>
			</div>

			<CmsEdgeTripleRow
				left={
					<TopRejectionReasonsTable
						rows={derived.topRejections.map((row) => ({
							code: row.name,
							description: row.name,
							count: row.count,
							pct: row.pct,
						}))}
					/>
				}
				center={
					<AcceptanceRateByMonthChart data={derived.acceptanceTrend} />
				}
				right={
					<CmsEdgeSectionPanel title="Summary by Report Type">
						<p className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground">
							No series from API
						</p>
					</CmsEdgeSectionPanel>
				}
			/>

			<CmsEdgePageFooter />
		</div>
	);
}

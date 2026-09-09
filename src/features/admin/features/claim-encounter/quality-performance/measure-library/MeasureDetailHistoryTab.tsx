"use client";

import { ArrowUpRight, ExternalLink, History, TrendingUp } from "lucide-react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CMS_EDGE_STATUS_PILL_CLASS } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	MEASURE_CHART_FRAME,
	MEASURE_CHART_GOAL,
	MEASURE_CHART_PRIMARY,
	MEASURE_TABLE_MUTED,
	MEASURE_TAB_STACK,
	MeasureDataTable,
	MeasureKpiCard,
	MeasureSectionPanel,
	MeasureTablePagination,
	PanelLink,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import type { MeasureHistoryDetail } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";
import { cn } from "@/lib/utils";

export function MeasureDetailHistoryTab({
	data,
}: {
	data: MeasureHistoryDetail;
}) {
	const summary = data.summary;

	return (
		<div className={MEASURE_TAB_STACK}>
			<MeasureSectionPanel
				title="History Controls"
				subtitle="Adjust the time range and comparison view"
				bodyClassName="p-0"
			>
				<div className="flex flex-wrap gap-3">
					<Select defaultValue="Performance History">
						<SelectTrigger className="h-9 w-[200px] text-sm">
							<SelectValue placeholder="History View" />
						</SelectTrigger>
						<SelectContent>
							{data.filterOptions.historyViews.map((o) => (
								<SelectItem key={o} value={o} className="text-sm">
									{o}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select defaultValue="Prior Year">
						<SelectTrigger className="h-9 w-[150px] text-sm">
							<SelectValue placeholder="Compared To" />
						</SelectTrigger>
						<SelectContent>
							{data.filterOptions.comparedTo.map((o) => (
								<SelectItem key={o} value={o} className="text-sm">
									{o}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select defaultValue="MY 2021">
						<SelectTrigger className="h-9 w-[130px] text-sm">
							<SelectValue placeholder="Start Year" />
						</SelectTrigger>
						<SelectContent>
							{data.filterOptions.years.map((o) => (
								<SelectItem key={o} value={o} className="text-sm">
									{o}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select defaultValue="MY 2025">
						<SelectTrigger className="h-9 w-[130px] text-sm">
							<SelectValue placeholder="End Year" />
						</SelectTrigger>
						<SelectContent>
							{data.filterOptions.years.map((o) => (
								<SelectItem key={o} value={o} className="text-sm">
									{o}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</MeasureSectionPanel>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<MeasureKpiCard
					label="Years Available"
					value={String(summary.yearsAvailable)}
					icon={History}
				/>
				<MeasureKpiCard
					label="Average Rate"
					value={`${summary.averagePerformanceRate.toFixed(2)}%`}
					tone="primary"
				/>
				<MeasureKpiCard
					label="Best Performance"
					value={`${summary.bestPerformance.toFixed(2)}%`}
					hint={summary.bestPerformanceYear}
					tone="success"
				/>
				<MeasureKpiCard
					label="Lowest Performance"
					value={`${summary.lowestPerformance.toFixed(2)}%`}
					hint={summary.lowestPerformanceYear}
				/>
				<MeasureKpiCard
					label="Total Improvement"
					value={`+${summary.totalImprovement.toFixed(2)} pts`}
					icon={TrendingUp}
					tone="success"
				/>
			</div>

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
				<MeasureSectionPanel
					title="Performance Rate Over Time"
					subtitle="Year-over-year performance trend vs goal"
					action={
						<PanelLink icon={<ExternalLink className="size-3.5" />}>
							View Trend Details
						</PanelLink>
					}
					bodyClassName="p-0"
				>
					<div className={MEASURE_CHART_FRAME}>
						<ResponsiveContainer width="100%" height={280}>
							<LineChart
								data={data.performanceTrend}
								margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border/50"
								/>
								<XAxis dataKey="year" tick={{ fontSize: 11 }} />
								<YAxis
									tick={{ fontSize: 11 }}
									width={40}
									domain={[0, 100]}
									tickFormatter={(v) => `${v}%`}
								/>
								<Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
								<ReferenceLine
									y={summary.goal}
									stroke={MEASURE_CHART_GOAL}
									strokeDasharray="4 4"
									label={{
										value: `Goal (${summary.goal.toFixed(0)}%)`,
										fontSize: 11,
										fill: MEASURE_CHART_GOAL,
									}}
								/>
								<Legend wrapperStyle={{ fontSize: 12 }} />
								<Line
									type="monotone"
									dataKey="rate"
									name="Performance Rate"
									stroke={MEASURE_CHART_PRIMARY}
									strokeWidth={2.5}
									dot={{
										r: 5,
										fill: MEASURE_CHART_PRIMARY,
										strokeWidth: 2,
										stroke: "#fff",
									}}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Change History"
					subtitle="Specification, population, and calculation updates"
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{
								key: "date",
								header: "Date/Time",
								className: "whitespace-nowrap",
							},
							{ key: "type", header: "Change Type" },
							{
								key: "section",
								header: "Section",
								className: MEASURE_TABLE_MUTED,
							},
							{
								key: "by",
								header: "Changed By",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "desc", header: "Description" },
							{ key: "impact", header: "Impact", align: "right" },
						]}
						rows={data.changeHistory.map((row) => ({
							date: row.dateTime,
							type: (
								<span
									className={cn(
										CMS_EDGE_STATUS_PILL_CLASS,
										row.changeTypeStyle
									)}
								>
									{row.changeType}
								</span>
							),
							section: row.section,
							by: row.changedBy,
							desc: row.description,
							impact: (
								<span
									className={cn(CMS_EDGE_STATUS_PILL_CLASS, row.impactStyle)}
								>
									{row.impact}
								</span>
							),
						}))}
						getRowKey={(row, index) =>
							data.changeHistory[index]?.id ?? String(index)
						}
					/>
					<MeasureTablePagination
						shown={data.changeHistory.length}
						total={data.totalChangeEntries}
					/>
				</MeasureSectionPanel>
			</div>

			<MeasureSectionPanel
				title="Year-over-Year Detail"
				subtitle="Full population and rate breakdown by measurement year"
				action={<PanelLink>Export Year-over-Year Detail</PanelLink>}
				bodyClassName="p-0"
				footer={
					<div className="border-t border-border/50 px-3 py-2 text-sm text-muted-foreground">
						Rates may differ slightly due to rounding.
					</div>
				}
			>
				<MeasureDataTable
					columns={[
						{ key: "year", header: "Year", className: "font-medium" },
						{ key: "eligible", header: "Eligible Pop.", align: "right" },
						{ key: "den", header: "Denominator", align: "right" },
						{ key: "num", header: "Numerator", align: "right" },
						{
							key: "excl",
							header: "Exclusions",
							align: "right",
							className: MEASURE_TABLE_MUTED,
						},
						{
							key: "rate",
							header: "Rate",
							align: "right",
							className: "font-semibold text-primary",
						},
						{
							key: "goal",
							header: "Goal",
							align: "right",
							className: MEASURE_TABLE_MUTED,
						},
						{ key: "variance", header: "Variance", align: "right" },
						{ key: "status", header: "Status" },
						{ key: "change", header: "vs Prior Year", align: "right" },
					]}
					rows={data.yearOverYear.map((row) => ({
						year: row.year,
						eligible: row.eligiblePopulation.toLocaleString(),
						den: row.denominator.toLocaleString(),
						num: row.numerator.toLocaleString(),
						excl: row.exclusions.toLocaleString(),
						rate: `${row.performanceRate.toFixed(2)}%`,
						goal: `${row.goal.toFixed(2)}%`,
						variance: (
							<span className="text-red-600">{row.variance.toFixed(2)}%</span>
						),
						status: (
							<span
								className={cn(
									CMS_EDGE_STATUS_PILL_CLASS,
									"border-red-200 bg-red-50 text-red-800"
								)}
							>
								{row.status}
							</span>
						),
						change:
							row.changeFromPriorYear == null ? (
								<span className="text-muted-foreground">N/A</span>
							) : (
								<span className="inline-flex items-center gap-0.5 font-medium tabular-nums text-emerald-700">
									<ArrowUpRight className="size-3.5" />
									{row.changeFromPriorYear.toFixed(2)}%
								</span>
							),
					}))}
					getRowKey={(row) => String(row.year)}
				/>
			</MeasureSectionPanel>
		</div>
	);
}

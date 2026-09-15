"use client";

import { ExternalLink, Gauge, Target, TrendingUp } from "lucide-react";
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
	MEASURE_CHART_FRAME,
	MEASURE_CHART_GOAL,
	MEASURE_CHART_PRIMARY,
	MEASURE_TABLE_MUTED,
	MEASURE_TAB_STACK,
	MeasureAsOfBar,
	MeasureChangeCell,
	MeasureDataTable,
	MeasureGoalProgress,
	MeasureKpiCard,
	MeasurePipeline,
	MeasureSectionPanel,
	MeasureSubsection,
	PanelLink,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import type { MeasurePerformanceDetail } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";

export function MeasureDetailPerformanceTab({
	data,
	measurementYear,
}: {
	data: MeasurePerformanceDetail;
	measurementYear: string;
}) {
	const summary = data.summary;
	const variance = summary.performanceRate - summary.goal;

	return (
		<div className={MEASURE_TAB_STACK}>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MeasureKpiCard
					label="Performance Rate"
					value={`${summary.performanceRate.toFixed(2)}%`}
					hint={`Goal: ${summary.goal.toFixed(2)}%`}
					icon={Gauge}
					tone="primary"
				/>
				<MeasureKpiCard
					label="Change vs Prior Year"
					value={`${summary.change >= 0 ? "+" : ""}${summary.change.toFixed(2)}%`}
					hint={`Prior year: ${summary.priorYearRate.toFixed(2)}%`}
					icon={TrendingUp}
					tone={summary.change >= 0 ? "success" : "danger"}
				/>
				<MeasureKpiCard
					label="Variance to Goal"
					value={`${variance >= 0 ? "+" : ""}${variance.toFixed(2)}%`}
					hint={summary.status}
					icon={Target}
					tone={variance >= 0 ? "success" : "warning"}
				/>
				<MeasureKpiCard
					label="Numerator / Denominator"
					value={`${summary.numerator.toLocaleString()} / ${summary.denominator.toLocaleString()}`}
					hint={`${summary.exclusions.toLocaleString()} exclusions`}
				/>
			</div>

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
				<MeasureSectionPanel
					title={`Performance Summary (${measurementYear})`}
					subtitle="Rate calculation and goal attainment"
					bodyClassName="space-y-3 p-0"
				>
					<MeasureAsOfBar asOf={data.summaryAsOf} />
					<MeasureGoalProgress
						rate={summary.performanceRate}
						goal={summary.goal}
						status={summary.status}
						statusTone={summary.statusTone}
					/>
					<MeasurePipeline
						steps={[
							{ label: "Numerator", value: summary.numerator },
							{ label: "Denominator", value: summary.denominator },
							{ label: "Exclusions", value: summary.exclusions },
							{
								label: "Performance Rate",
								value: `${summary.performanceRate.toFixed(2)}%`,
								description: "Numerator ÷ Denominator",
							},
						]}
					/>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Performance Trend"
					subtitle="Monthly performance rate for the measurement year"
					action={
						<PanelLink icon={<ExternalLink className="size-3.5" />}>
							View Trend Data
						</PanelLink>
					}
					bodyClassName="p-0"
				>
					<div className={MEASURE_CHART_FRAME}>
						<ResponsiveContainer width="100%" height={280}>
							<LineChart
								data={data.trend}
								margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border/50"
								/>
								<XAxis dataKey="month" tick={{ fontSize: 11 }} />
								<YAxis
									tick={{ fontSize: 11 }}
									width={40}
									domain={[70, 85]}
									tickFormatter={(v) => `${v}%`}
								/>
								<Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
								<ReferenceLine
									y={summary.goal}
									stroke={MEASURE_CHART_GOAL}
									strokeDasharray="4 4"
									label={{
										value: `Goal (${summary.goal}%)`,
										position: "insideTopRight",
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
										r: 4,
										fill: MEASURE_CHART_PRIMARY,
										strokeWidth: 2,
										stroke: "#fff",
									}}
									activeDot={{ r: 6 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</MeasureSectionPanel>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<MeasureSectionPanel
					title="Performance by Plan"
					subtitle="Plan-level rates compared to prior year"
					action={
						<PanelLink icon={<ExternalLink className="size-3.5" />}>
							View All Plans
						</PanelLink>
					}
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "plan", header: "Plan Name" },
							{ key: "lob", header: "LOB", className: MEASURE_TABLE_MUTED },
							{ key: "num", header: "Numerator", align: "right" },
							{ key: "den", header: "Denominator", align: "right" },
							{
								key: "rate",
								header: "Rate",
								align: "right",
								className: "font-semibold text-primary",
							},
							{
								key: "prior",
								header: "MY 2024",
								align: "right",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "change", header: "Change", align: "right" },
						]}
						rows={data.byPlan.map((row) => ({
							plan: row.planName,
							lob: row.lineOfBusiness,
							num: row.numerator > 0 ? row.numerator.toLocaleString() : "—",
							den: row.denominator > 0 ? row.denominator.toLocaleString() : "—",
							rate: row.rate != null ? `${row.rate.toFixed(2)}%` : "N/A",
							prior:
								row.priorYearRate != null
									? `${row.priorYearRate.toFixed(2)}%`
									: "N/A",
							change: <MeasureChangeCell value={row.change} />,
						}))}
						getRowKey={(row) => String(row.plan)}
					/>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Performance by Population Group"
					subtitle="Rates across stratified population segments"
					action={<PanelLink>View All Groups</PanelLink>}
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "group", header: "Population Group" },
							{ key: "num", header: "Numerator", align: "right" },
							{ key: "den", header: "Denominator", align: "right" },
							{
								key: "rate",
								header: "Rate",
								align: "right",
								className: "font-semibold text-primary",
							},
							{
								key: "prior",
								header: "MY 2024",
								align: "right",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "change", header: "Change", align: "right" },
						]}
						rows={data.byPopulationGroup.map((row) => ({
							group: row.group,
							num: row.numerator.toLocaleString(),
							den: row.denominator.toLocaleString(),
							rate: `${row.rate.toFixed(2)}%`,
							prior: `${row.priorYearRate.toFixed(2)}%`,
							change: <MeasureChangeCell value={row.change} />,
						}))}
						getRowKey={(row) => String(row.group)}
					/>
				</MeasureSectionPanel>
			</div>

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
				<MeasureSectionPanel
					title="Measure Rate Over Time"
					subtitle="Historical numerator, denominator, and rate by measurement year"
					action={<PanelLink>View Historical Trend</PanelLink>}
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "metric", header: "", className: "font-semibold" },
							...data.historicalTrend.map((col) => ({
								key: col.year,
								header: col.year,
								align: "right" as const,
							})),
						]}
						rows={[
							{
								metric: "Numerator",
								...Object.fromEntries(
									data.historicalTrend.map((col) => [
										col.year,
										col.numerator.toLocaleString(),
									])
								),
							},
							{
								metric: "Denominator",
								...Object.fromEntries(
									data.historicalTrend.map((col) => [
										col.year,
										col.denominator.toLocaleString(),
									])
								),
							},
							{
								metric: "Exclusions",
								...Object.fromEntries(
									data.historicalTrend.map((col) => [
										col.year,
										col.exclusions.toLocaleString(),
									])
								),
							},
							{
								metric: "Performance Rate",
								...Object.fromEntries(
									data.historicalTrend.map((col) => [
										col.year,
										`${col.performanceRate.toFixed(2)}%`,
									])
								),
							},
						]}
						getRowKey={(row) => String(row.metric)}
					/>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Performance Notes"
					subtitle="Context and methodology notes"
					bodyClassName="p-0"
				>
					<MeasureSubsection title="Key Notes">
						<ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">
							{data.notes.map((note) => (
								<li key={note}>{note}</li>
							))}
						</ul>
					</MeasureSubsection>
				</MeasureSectionPanel>
			</div>
		</div>
	);
}

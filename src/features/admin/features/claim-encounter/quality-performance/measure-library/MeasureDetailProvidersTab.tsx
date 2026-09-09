"use client";

import { useMemo, useState } from "react";

import {
	Bookmark,
	Download,
	MoreVertical,
	Search,
	Stethoscope,
	Target,
} from "lucide-react";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	MeasureAsOfBar,
	MeasureDataTable,
	MeasureDonutBreakdown,
	MeasureFilterField,
	MeasureGoalProgress,
	MeasureKpiCard,
	MeasureSectionPanel,
	MeasureTablePagination,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import {
	type MeasureProvidersDetail,
	getProviderLevelStyle,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";
import { cn } from "@/lib/utils";

export function MeasureDetailProvidersTab({
	data,
}: {
	data: MeasureProvidersDetail;
}) {
	const [search, setSearch] = useState("");
	const summary = data.summary;

	const filteredProviders = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return data.providers;
		return data.providers.filter(
			(p) =>
				p.name.toLowerCase().includes(q) ||
				p.npi.includes(q) ||
				p.specialty.toLowerCase().includes(q)
		);
	}, [data.providers, search]);

	const benchmarkTone =
		summary.averagePerformanceRate >= summary.benchmark
			? "met"
			: summary.averagePerformanceRate >= summary.benchmark - 3
				? "near"
				: "below";

	return (
		<div className={MEASURE_TAB_STACK}>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<MeasureKpiCard
					label="Total Providers"
					value={summary.totalProviders.toLocaleString()}
					icon={Stethoscope}
					tone="primary"
				/>
				<MeasureKpiCard
					label="With Eligible Members"
					value={summary.providersWithEligibleMembers.toLocaleString()}
				/>
				<MeasureKpiCard
					label="Met Measure"
					value={summary.providersThatMetMeasure.toLocaleString()}
					tone="success"
				/>
				<MeasureKpiCard
					label="Avg Performance Rate"
					value={`${summary.averagePerformanceRate.toFixed(2)}%`}
					hint={`Benchmark: ${summary.benchmark.toFixed(2)}%`}
				/>
				<MeasureKpiCard
					label="Below Benchmark"
					value={summary.providersBelowBenchmark.toLocaleString()}
					icon={Target}
					tone="warning"
				/>
			</div>

			<MeasureSectionPanel
				title="Network Performance vs Benchmark"
				subtitle="Average provider performance relative to the 80% benchmark"
				bodyClassName="p-0"
			>
				<MeasureGoalProgress
					rate={summary.averagePerformanceRate}
					goal={summary.benchmark}
					status={
						benchmarkTone === "met"
							? "At Benchmark"
							: benchmarkTone === "near"
								? "Near Benchmark"
								: "Below Benchmark"
					}
					statusTone={benchmarkTone}
				/>
			</MeasureSectionPanel>

			<div className="grid gap-3 lg:grid-cols-2">
				<MeasureSectionPanel
					title="Providers by Performance Level"
					subtitle="Distribution across performance tiers"
					bodyClassName="p-0"
				>
					<MeasureDonutBreakdown
						items={data.byPerformanceLevel.map((item) => ({
							name: item.level,
							value: item.count,
							color: item.color,
							pct: item.pct,
						}))}
						centerValue={summary.providersWithEligibleMembers.toLocaleString()}
						centerLabel="Providers"
					/>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Performance Rate Trend"
					subtitle="Average provider rate by month"
					bodyClassName="p-0"
				>
					<div className={MEASURE_CHART_FRAME}>
						<ResponsiveContainer width="100%" height={240}>
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
									y={summary.benchmark}
									stroke={MEASURE_CHART_GOAL}
									strokeDasharray="4 4"
									label={{
										value: "Benchmark",
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
									dot={{ r: 4, fill: MEASURE_CHART_PRIMARY }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</MeasureSectionPanel>
			</div>

			<div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
				<MeasureSectionPanel
					title="Filters"
					subtitle="Narrow the provider list"
					bodyClassName="space-y-2 p-0"
					action={
						<Button
							variant="link"
							size="sm"
							className="h-8 px-0 text-sm text-primary"
						>
							Clear All
						</Button>
					}
				>
					{[
						{ label: "Plan", options: data.filterOptions.plans },
						{
							label: "Line of Business",
							options: data.filterOptions.linesOfBusiness,
						},
						{
							label: "Provider Type",
							options: data.filterOptions.providerTypes,
						},
						{ label: "Specialty", options: data.filterOptions.specialties },
						{ label: "Risk Group", options: data.filterOptions.riskGroups },
						{
							label: "Performance Level",
							options: data.filterOptions.performanceLevels,
						},
					].map((filter) => (
						<MeasureFilterField key={filter.label} label={filter.label}>
							<Select defaultValue="All">
								<SelectTrigger className="h-9 text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{filter.options.map((opt) => (
										<SelectItem key={opt} value={opt} className="text-sm">
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</MeasureFilterField>
					))}
					<MeasureFilterField label="Search Provider">
						<div className="relative">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Name or NPI"
								className="h-9 pl-9 text-sm"
							/>
						</div>
					</MeasureFilterField>
					<div className="space-y-2 pt-2">
						<Button className="h-9 w-full text-sm">Apply Filters</Button>
						<Button variant="outline" className="h-9 w-full gap-1.5 text-sm">
							<Bookmark className="size-4" />
							Save Filter
						</Button>
					</div>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title={`Provider List (${data.totalProvidersListed.toLocaleString()})`}
					subtitle="Individual provider performance and outreach"
					action={
						<Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm">
							<Download className="size-4" />
							Export Table
						</Button>
					}
					bodyClassName="p-0"
				>
					<div className="border-b border-border/50 px-3 py-2">
						<MeasureAsOfBar asOf={data.summaryAsOf} />
					</div>
					<MeasureDataTable
						columns={[
							{ key: "name", header: "Provider Name" },
							{ key: "npi", header: "NPI", className: "font-mono text-xs" },
							{ key: "type", header: "Type", className: MEASURE_TABLE_MUTED },
							{ key: "specialty", header: "Specialty" },
							{ key: "eligible", header: "Eligible", align: "right" },
							{ key: "num", header: "Numerator", align: "right" },
							{
								key: "rate",
								header: "Rate",
								align: "right",
								className: "font-semibold text-primary",
							},
							{ key: "level", header: "Level" },
							{ key: "risk", header: "Risk", className: MEASURE_TABLE_MUTED },
							{
								key: "outreach",
								header: "Outreach",
								className: MEASURE_TABLE_MUTED,
							},
							{ key: "actions", header: "Actions", align: "right" },
						]}
						rows={filteredProviders.map((provider) => ({
							name: (
								<Button
									variant="link"
									className="h-auto p-0 text-sm text-primary"
								>
									{provider.name}
								</Button>
							),
							npi: provider.npi,
							type: provider.providerType,
							specialty: provider.specialty,
							eligible: provider.eligibleMembers.toLocaleString(),
							num: provider.numerator.toLocaleString(),
							rate: `${provider.performanceRate.toFixed(2)}%`,
							level: (
								<span
									className={cn(
										CMS_EDGE_STATUS_PILL_CLASS,
										getProviderLevelStyle(provider.performanceLevel)
									)}
								>
									{provider.performanceLevel}
								</span>
							),
							risk: provider.riskGroup,
							outreach: provider.lastOutreach,
							actions: (
								<Button variant="ghost" size="icon" className="size-8">
									<MoreVertical className="size-4" />
								</Button>
							),
						}))}
						getRowKey={(_, index) =>
							filteredProviders[index]?.npi ?? String(index)
						}
					/>
					<MeasureTablePagination
						shown={filteredProviders.length}
						total={data.totalProvidersListed}
					/>
				</MeasureSectionPanel>
			</div>
		</div>
	);
}

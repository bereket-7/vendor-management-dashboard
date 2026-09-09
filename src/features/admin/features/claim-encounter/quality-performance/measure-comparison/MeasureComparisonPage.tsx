"use client";

import { useState } from "react";

import {
	ArrowDownRight,
	ArrowRight,
	ArrowUpRight,
	Database,
	Download,
	Filter,
	GitBranch,
} from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { ReadinessOverviewSection } from "./ReadinessOverviewSection";
import {
	MCR_COMPLIANCE_DISTRIBUTION,
	MCR_FILTERS,
	MCR_KPIS,
	MCR_MEASURES,
	MCR_MEASURE_LIBRARY_HREF,
	MCR_TOP_GAPS,
	type MeasureTrend,
} from "./feature/queries/useMeasureComparisonQuery";

const PANEL = CMS_EDGE_PANEL_CLASS;
const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";
const compactFieldClass = cn(
	"h-8 rounded-sm border border-border bg-background text-xs shadow-none",
	"hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);
const th =
	"h-9 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-3 py-2.5 text-[12px] align-middle text-foreground";

/** Primary light → dark for distribution charts */
const PRIMARY_CHART_SCALE = [
	"color-mix(in oklch, var(--primary) 38%, white)",
	"color-mix(in oklch, var(--primary) 58%, white)",
	"color-mix(in oklch, var(--primary) 80%, white)",
	"var(--primary)",
] as const;

function TrendMark({ trend }: { trend: MeasureTrend }) {
	if (trend === "up") {
		return (
			<span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
				<ArrowUpRight className="size-3.5" />
				Up
			</span>
		);
	}
	if (trend === "down") {
		return (
			<span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-600">
				<ArrowDownRight className="size-3.5" />
				Down
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
			<ArrowRight className="size-3.5" />
			Flat
		</span>
	);
}

function FilterBar() {
	const [year, setYear] = useState<string>(
		MCR_FILTERS.measurementYears[0].value
	);
	const [plan, setPlan] = useState<string>(MCR_FILTERS.plans[0].value);
	const [lob, setLob] = useState<string>(MCR_FILTERS.linesOfBusiness[0].value);
	const [measureSet, setMeasureSet] = useState<string>(
		MCR_FILTERS.measureSets[0].value
	);
	const [domain, setDomain] = useState<string>(MCR_FILTERS.domains[0].value);

	return (
		<div className={cn(PANEL, "flex flex-wrap items-center gap-2 px-3 py-2.5")}>
			<Select value={year} onValueChange={setYear}>
				<SelectTrigger className={cn(compactFieldClass, "w-40")}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{MCR_FILTERS.measurementYears.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label.split("(")[0]?.trim()}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={plan} onValueChange={setPlan}>
				<SelectTrigger className={cn(compactFieldClass, "w-28")}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{MCR_FILTERS.plans.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={lob} onValueChange={setLob}>
				<SelectTrigger className={cn(compactFieldClass, "w-28")}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{MCR_FILTERS.linesOfBusiness.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={measureSet} onValueChange={setMeasureSet}>
				<SelectTrigger className={cn(compactFieldClass, "w-28")}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{MCR_FILTERS.measureSets.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={domain} onValueChange={setDomain}>
				<SelectTrigger className={cn(compactFieldClass, "w-44")}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{MCR_FILTERS.domains.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button
				size="sm"
				variant="outline"
				className={cn(toolbarBtn, "ml-auto")}
				onClick={() => toast.success("Filters applied")}
			>
				<Filter className="size-3.5" />
				Apply
			</Button>
		</div>
	);
}

export function MeasureComparisonPage() {
	const pieData = MCR_COMPLIANCE_DISTRIBUTION.map((b, i) => ({
		name: b.label,
		value: b.count,
		// Excellent → Fair: primary dark → light; Poor: full red
		color:
			i === 0
				? PRIMARY_CHART_SCALE[3]
				: i === 1
					? PRIMARY_CHART_SCALE[2]
					: i === 2
						? PRIMARY_CHART_SCALE[1]
						: "#dc2626",
	}));
	const gapChartData = MCR_TOP_GAPS.map((g) => ({
		code: g.code,
		gap: Math.abs(g.gap),
	}));

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Measure Comparison & Readiness
					</h1>
					<p className="text-sm text-muted-foreground">
						Compare rates to target · track digital readiness
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						asChild
					>
						<Link href={MCR_MEASURE_LIBRARY_HREF}>Library</Link>
					</Button>
					<Button
						size="sm"
						className={toolbarBtn}
						onClick={() => toast.success("Export started")}
					>
						<Download className="size-3.5" />
						Export
					</Button>
				</div>
			</div>

			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="grid grid-cols-2 divide-y divide-border/50 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
					<div className="border-l-2 border-l-emerald-600 px-4 py-4">
						<p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
							Meeting target
						</p>
						<p className="mt-1.5 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
							{MCR_KPIS.meetingTarget.value}
						</p>
						<p className="mt-1 text-[11px] text-muted-foreground">
							{MCR_KPIS.meetingTarget.pct}% ·{" "}
							<span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-300">
								<ArrowUpRight className="size-3" />+
								{MCR_KPIS.meetingTarget.delta}
							</span>
						</p>
					</div>
					<div className="border-l-2 border-l-amber-500 px-4 py-4">
						<p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
							Below target
						</p>
						<p className="mt-1.5 text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-300">
							{MCR_KPIS.belowTarget.value}
						</p>
						<p className="mt-1 text-[11px] text-muted-foreground">
							{MCR_KPIS.belowTarget.pct}% ·{" "}
							<span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-300">
								<ArrowDownRight className="size-3" />
								{Math.abs(MCR_KPIS.belowTarget.delta)} fewer
							</span>
						</p>
					</div>
					<div className="border-l-2 border-l-primary px-4 py-4">
						<p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
							Avg compliance
						</p>
						<p className="mt-1.5 text-2xl font-semibold tabular-nums text-primary">
							{MCR_KPIS.averageCompliance.value}%
						</p>
						<p className="mt-1 inline-flex items-center gap-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
							<ArrowUpRight className="size-3" />+
							{MCR_KPIS.averageCompliance.delta}% vs MY 2024
						</p>
					</div>
					<div className="border-l-2 border-l-primary px-4 py-4">
						<div className="flex items-start justify-between gap-2">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
									Submission ready
								</p>
								<p className="mt-1.5 text-2xl font-semibold tabular-nums text-primary">
									{MCR_KPIS.readyForSubmission.value}
								</p>
								<p className="mt-1 text-[11px] text-muted-foreground">
									{MCR_KPIS.readyForSubmission.pct}% ·{" "}
									<span className="inline-flex items-center gap-1">
										<Database className="size-3" />
										{MCR_KPIS.dataSources.value}
									</span>
								</p>
							</div>
							<span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
								<GitBranch className="size-3.5" />
							</span>
						</div>
					</div>
				</div>
			</section>

			<FilterBar />

			{/* Charts row */}
			<div className="grid gap-3 lg:grid-cols-2">
				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Compliance distribution
						</p>
					</div>
					<div className="flex flex-col items-center gap-4 px-4 py-4 sm:flex-row">
						<div className="relative h-40 w-40 shrink-0">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieData}
										dataKey="value"
										innerRadius={48}
										outerRadius={68}
										paddingAngle={2}
										strokeWidth={0}
									>
										{pieData.map((entry) => (
											<Cell key={entry.name} fill={entry.color} />
										))}
									</Pie>
								</PieChart>
							</ResponsiveContainer>
							<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
								<p className="text-lg font-semibold tabular-nums leading-none">
									{MCR_KPIS.totalMeasures.value}
								</p>
								<p className="text-[10px] text-muted-foreground">Measures</p>
							</div>
						</div>
						<ul className="w-full min-w-0 space-y-2.5">
							{pieData.map((band, i) => {
								const source = MCR_COMPLIANCE_DISTRIBUTION[i]!;
								return (
									<li
										key={band.name}
										className="flex items-center justify-between gap-2 text-xs"
									>
										<span className="inline-flex items-center gap-2">
											<span
												className="size-2.5 rounded-full"
												style={{ backgroundColor: band.color }}
											/>
											<span>
												<span className="font-medium">{source.range}</span>
												<span className="ml-1.5 text-muted-foreground">
													{band.name}
												</span>
											</span>
										</span>
										<span className="tabular-nums text-muted-foreground">
											{band.value} ({source.pct}%)
										</span>
									</li>
								);
							})}
						</ul>
					</div>
				</section>

				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Largest gaps to target
						</p>
					</div>
					<div className="h-48 px-2 py-2">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={gapChartData}
								layout="vertical"
								margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border/40"
									horizontal={false}
								/>
								<XAxis
									type="number"
									tick={{ fontSize: 10 }}
									tickFormatter={(v) => `${v}%`}
								/>
								<YAxis
									type="category"
									dataKey="code"
									width={40}
									tick={{ fontSize: 11, fontFamily: "ui-monospace" }}
								/>
								<Tooltip
									formatter={(v: number) => [`${v.toFixed(1)}%`, "Gap"]}
								/>
								<Bar
									dataKey="gap"
									radius={[0, 4, 4, 0]}
									barSize={14}
									fill="#dc2626"
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</section>
			</div>

			{/* ONE table */}
			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
					<p className="text-sm font-semibold text-foreground">
						Measure comparison
						<span className="ml-1.5 font-normal text-muted-foreground">
							{MCR_MEASURES.length} shown
						</span>
					</p>
					<Button variant="link" size="sm" className="h-7 px-0 text-xs" asChild>
						<Link href={MCR_MEASURE_LIBRARY_HREF}>
							All {MCR_KPIS.totalMeasures.value}
						</Link>
					</Button>
				</div>
				<div className={CMS_EDGE_TABLE_CONTAINER}>
					<CmsEdgeTableScroll>
						<Table className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[760px]")}>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className={cn(th, "w-10 pl-3 text-right")}>
										#
									</TableHead>
									<TableHead className={th}>Measure</TableHead>
									<TableHead className={th}>Domain</TableHead>
									<TableHead className={cn(th, "text-right")}>Rate</TableHead>
									<TableHead className={cn(th, "text-right")}>Target</TableHead>
									<TableHead className={cn(th, "text-right")}>Gap</TableHead>
									<TableHead className={cn(th, "text-right")}>
										Percentile
									</TableHead>
									<TableHead className={th}>Trend</TableHead>
									<TableHead className={cn(th, "pr-3")} />
								</TableRow>
							</TableHeader>
							<TableBody>
								{MCR_MEASURES.map((row, index) => {
									const meeting = row.complianceRate >= row.target;
									return (
										<TableRow
											key={row.code}
											className="border-b border-border/40 hover:bg-muted/20"
										>
											<TableCell
												className={cn(
													td,
													"w-10 pl-3 text-right tabular-nums text-muted-foreground"
												)}
											>
												{index + 1}
											</TableCell>
											<TableCell className={td}>
												<p className="font-mono text-xs font-semibold text-foreground">
													{row.code}
												</p>
												<p className="mt-0.5 max-w-52 truncate text-[11px] text-muted-foreground">
													{row.name}
												</p>
											</TableCell>
											<TableCell className={cn(td, "text-muted-foreground")}>
												{row.domain}
											</TableCell>
											<TableCell className={cn(td, "text-right")}>
												<span
													className={cn(
														"font-semibold tabular-nums",
														meeting
															? "text-primary"
															: "text-amber-700 dark:text-amber-300"
													)}
												>
													{row.complianceRate.toFixed(1)}%
												</span>
											</TableCell>
											<TableCell
												className={cn(
													td,
													"text-right tabular-nums text-muted-foreground"
												)}
											>
												{row.target}%
											</TableCell>
											<TableCell
												className={cn(
													td,
													"text-right font-semibold tabular-nums",
													row.gapToTarget < 0
														? "text-red-600"
														: "text-emerald-700 dark:text-emerald-300"
												)}
											>
												{row.gapToTarget > 0 ? "+" : ""}
												{row.gapToTarget.toFixed(1)}%
											</TableCell>
											<TableCell className={cn(td, "text-right tabular-nums")}>
												{row.percentile}
												<sup className="text-[8px]">th</sup>
											</TableCell>
											<TableCell className={td}>
												<TrendMark trend={row.trend} />
											</TableCell>
											<TableCell className={cn(td, "pr-3 text-right")}>
												<Button
													variant="outline"
													size="sm"
													className="h-7 px-2.5 text-xs"
													asChild
												>
													<Link
														href={`${MCR_MEASURE_LIBRARY_HREF}/${row.code}`}
													>
														View
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CmsEdgeTableScroll>
				</div>
			</section>

			<ReadinessOverviewSection />
		</div>
	);
}

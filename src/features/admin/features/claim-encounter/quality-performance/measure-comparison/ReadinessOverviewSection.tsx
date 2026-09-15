"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Info,
	RefreshCw,
	XCircle,
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
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
	type ComponentStatus,
	MCR_MEASURE_LIBRARY_HREF,
	MCR_READINESS_BY_DOMAIN,
	MCR_READINESS_ROWS,
	MCR_READINESS_SUMMARY,
	type ReadinessStatus,
} from "./feature/queries/useMeasureComparisonQuery";

const PANEL = CMS_EDGE_PANEL_CLASS;

/** Primary light → dark for domain bars */
const PRIMARY_CHART_SCALE = [
	"color-mix(in oklch, var(--primary) 42%, white)",
	"color-mix(in oklch, var(--primary) 62%, white)",
	"color-mix(in oklch, var(--primary) 82%, white)",
	"var(--primary)",
] as const;

function ReadinessStatusPill({ status }: { status: ReadinessStatus }) {
	const styles: Record<ReadinessStatus, string> = {
		Ready:
			"border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
		"Needs Review":
			"border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
		"At Risk":
			"border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
		"Not Ready":
			"border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
	};
	return (
		<span className={cn(CMS_EDGE_STATUS_PILL_CLASS, styles[status])}>
			{status}
		</span>
	);
}

function ComponentIcon({ status }: { status: ComponentStatus }) {
	if (status === "pass") {
		return (
			<CheckCircle2 className="size-3.5 text-emerald-600" aria-label="Pass" />
		);
	}
	if (status === "warn") {
		return (
			<AlertTriangle className="size-3.5 text-amber-500" aria-label="Warning" />
		);
	}
	return <XCircle className="size-3.5 text-red-600" aria-label="Fail" />;
}

const COMPONENT_KEYS = [
	{ key: "dataAvailability" as const, label: "Data" },
	{ key: "fhirResources" as const, label: "FHIR" },
	{ key: "logicValidated" as const, label: "Logic" },
	{ key: "dataQuality" as const, label: "Quality" },
	{ key: "calculation" as const, label: "Calc" },
	{ key: "submissionConfig" as const, label: "Submit" },
];

function scoreRingTone(score: number) {
	if (score >= 70) return "text-primary";
	if (score >= 55) return "text-amber-500";
	return "text-red-600";
}

function MiniScoreRing({ score }: { score: number }) {
	const r = 18;
	const c = 2 * Math.PI * r;
	const offset = c * (1 - Math.min(score, 100) / 100);
	return (
		<svg viewBox="0 0 48 48" className="size-12 -rotate-90">
			<circle
				cx="24"
				cy="24"
				r={r}
				fill="none"
				stroke="currentColor"
				strokeWidth="4"
				className="text-muted/50"
			/>
			<circle
				cx="24"
				cy="24"
				r={r}
				fill="none"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="round"
				strokeDasharray={c}
				strokeDashoffset={offset}
				className={scoreRingTone(score)}
			/>
		</svg>
	);
}

export function ReadinessOverviewSection() {
	const pieData = MCR_READINESS_SUMMARY.map((item, i) => ({
		name: item.label,
		value: item.count,
		// Ready uses primary; rest full status colors
		color:
			i === 0
				? "var(--primary)"
				: i === 1
					? "#eab308"
					: i === 2
						? "#f97316"
						: "#dc2626",
	}));
	const domainChart = MCR_READINESS_BY_DOMAIN.map((d) => ({
		domain: d.domain.replace(" of Care", "").replace("Care ", ""),
		full: d.domain,
		score: d.score,
		fill:
			d.score >= 80
				? PRIMARY_CHART_SCALE[3]
				: d.score >= 70
					? PRIMARY_CHART_SCALE[2]
					: d.score >= 60
						? "#f59e0b"
						: "#dc2626",
	}));
	const summaryTotal = MCR_READINESS_SUMMARY.reduce((s, i) => s + i.count, 0);

	return (
		<section className="space-y-3">
			<div className="flex flex-wrap items-end justify-between gap-2">
				<div>
					<h2 className="text-sm font-semibold text-foreground">
						Digital readiness
					</h2>
					<p className="text-xs text-muted-foreground">
						Status mix · domain scores · measure checklists
					</p>
				</div>
				<button
					type="button"
					className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
					onClick={() => toast.success("Readiness refreshed")}
				>
					Updated Jul 30, 2025
					<RefreshCw className="size-3.5" />
				</button>
			</div>

			{/* Charts — no tables */}
			<div className="grid gap-3 lg:grid-cols-2">
				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Readiness status mix
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
									{summaryTotal}
								</p>
								<p className="text-[10px] text-muted-foreground">Measures</p>
							</div>
						</div>
						<ul className="w-full space-y-2.5 text-xs">
							{pieData.map((item, i) => {
								const source = MCR_READINESS_SUMMARY[i]!;
								return (
									<li
										key={item.name}
										className="flex items-center justify-between gap-2"
									>
										<span className="inline-flex items-center gap-2">
											<span
												className="size-2.5 rounded-full"
												style={{ backgroundColor: item.color }}
											/>
											{item.name}
										</span>
										<span className="tabular-nums text-muted-foreground">
											{item.value} ({source.pct}%)
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
							Avg score by domain
						</p>
					</div>
					<div className="h-48 px-2 py-2">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={domainChart}
								layout="vertical"
								margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border/40"
									horizontal={false}
								/>
								<XAxis
									type="number"
									domain={[0, 100]}
									tick={{ fontSize: 10 }}
								/>
								<YAxis
									type="category"
									dataKey="domain"
									width={88}
									tick={{ fontSize: 10 }}
								/>
								<Tooltip
									formatter={(v: number, _n, ctx) => [
										`${v}/100`,
										(ctx?.payload as { full?: string } | undefined)?.full ??
											"Score",
									]}
								/>
								<Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={14}>
									{domainChart.map((entry) => (
										<Cell key={entry.full} fill={entry.fill} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</section>
			</div>

			{/* Measure cards — not a second table */}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{MCR_READINESS_ROWS.map((row) => {
					const passCount = COMPONENT_KEYS.filter(
						({ key }) => row.components[key] === "pass"
					).length;
					return (
						<article
							key={row.code}
							className={cn(PANEL, "flex flex-col overflow-hidden")}
						>
							<div className="flex items-start gap-3 border-b border-border/40 px-4 py-3">
								<div className="relative shrink-0">
									<MiniScoreRing score={row.score} />
									<span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-foreground">
										{row.score}
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-mono text-sm font-bold text-foreground">
											{row.code}
										</p>
										<ReadinessStatusPill status={row.status} />
									</div>
									<p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
										{row.name}
									</p>
									<p className="mt-1 text-[10px] text-muted-foreground">
										{row.domain} · {passCount}/{COMPONENT_KEYS.length} checks
									</p>
								</div>
							</div>
							<ul className="grid grid-cols-2 gap-1.5 p-3 sm:grid-cols-3">
								{COMPONENT_KEYS.map(({ key, label }) => (
									<li
										key={key}
										className="flex items-center gap-1.5 rounded-sm bg-muted/35 px-2 py-1.5 text-[10px] text-muted-foreground"
									>
										<ComponentIcon status={row.components[key]} />
										{label}
									</li>
								))}
							</ul>
							<div className="mt-auto flex items-center justify-between border-t border-border/40 px-4 py-2">
								<span className="text-[10px] text-muted-foreground">
									{row.lastUpdated}
								</span>
								<Button
									variant="outline"
									size="sm"
									className="h-7 px-2.5 text-xs"
									asChild
								>
									<Link href={`${MCR_MEASURE_LIBRARY_HREF}/${row.code}`}>
										View
									</Link>
								</Button>
							</div>
						</article>
					);
				})}
			</div>

			<p className="inline-flex items-start gap-1.5 px-1 text-[11px] text-muted-foreground">
				<Info className="mt-0.5 size-3.5 shrink-0" />
				Percentiles use NCQA Quality Compass® national benchmarks where
				available.
			</p>
		</section>
	);
}

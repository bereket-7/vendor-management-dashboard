"use client";

import {
	ArrowDownRight,
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	Check,
	CheckCircle2,
	ClipboardList,
	Download,
	FileText,
	FolderOpen,
	type LucideIcon,
	Minus,
	Percent,
	RefreshCw,
	Send,
	Stethoscope,
	Target,
	Users,
} from "lucide-react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import {
	type GapTrend,
	QUALITY_COMPLIANCE_GOAL,
	QUALITY_COMPLIANCE_TREND,
	QUALITY_DOCUMENTS,
	QUALITY_GAP_CLOSURE_ACTIVITY,
	QUALITY_GAP_STATUS,
	QUALITY_NCQA_SUBMISSION,
	QUALITY_OPEN_GAPS_BY_MEASURE,
	QUALITY_PERFORMANCE_KPIS,
	QUALITY_QUICK_ACTIONS,
	QUALITY_TOP_MEASURES,
} from "@/features/admin/features/claim-encounter/quality-performance/feature/queries/useQualityPerformanceQuery";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PANEL = CMS_EDGE_PANEL_CLASS;
const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const QP_BASE = "/admin/claim-encounter/regulatory/quality-performance";

function TrendHint({
	delta,
	suffix = "MY 2024",
}: {
	delta: number;
	suffix?: string;
}) {
	if (delta === 0) {
		return (
			<span className="inline-flex items-center gap-0.5 text-muted-foreground">
				<Minus className="size-3" />— vs {suffix}
			</span>
		);
	}
	const positive = delta > 0;
	const Icon = positive ? ArrowUpRight : ArrowDownRight;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5",
				positive
					? "text-emerald-700 dark:text-emerald-300"
					: "text-red-600 dark:text-red-400"
			)}
		>
			<Icon className="size-3" />
			{positive ? "+" : ""}
			{Math.abs(delta)}% vs {suffix}
		</span>
	);
}

function GapTrendIcon({ trend }: { trend: GapTrend }) {
	if (trend === "Up") return <ArrowUpRight className="size-3.5 text-red-600" />;
	if (trend === "Down")
		return (
			<ArrowDownRight className="size-3.5 text-emerald-600 dark:text-emerald-400" />
		);
	return <Minus className="size-3.5 text-muted-foreground" />;
}

function ComplianceDial({ rate, goal }: { rate: number; goal: number }) {
	const r = 54;
	const c = 2 * Math.PI * r;
	const pct = Math.min(rate, 100) / 100;
	const offset = c * (1 - pct);
	const toGoal = goal - rate;

	return (
		<div className="relative mx-auto flex size-44 items-center justify-center sm:size-52">
			<svg viewBox="0 0 140 140" className="size-full -rotate-90">
				<circle
					cx="70"
					cy="70"
					r={r}
					fill="none"
					stroke="currentColor"
					strokeWidth="10"
					className="text-primary/20"
				/>
				<circle
					cx="70"
					cy="70"
					r={r}
					fill="none"
					stroke="currentColor"
					strokeWidth="10"
					strokeLinecap="round"
					strokeDasharray={c}
					strokeDashoffset={offset}
					className="text-primary transition-[stroke-dashoffset] duration-700 ease-out"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
				<p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
					Compliance
				</p>
				<p className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums text-foreground sm:text-4xl">
					{rate.toFixed(1)}
					<span className="text-lg text-muted-foreground">%</span>
				</p>
				<p
					className={cn(
						"mt-1 text-[11px] font-medium",
						toGoal > 0
							? "text-amber-700 dark:text-amber-300"
							: "text-emerald-700 dark:text-emerald-300"
					)}
				>
					{toGoal > 0 ? `${toGoal.toFixed(1)} pts to goal` : "At / above goal"}
				</p>
			</div>
		</div>
	);
}

export function QualityPerformancePage() {
	const k = QUALITY_PERFORMANCE_KPIS;
	const submission = QUALITY_NCQA_SUBMISSION;
	const gapTotal = QUALITY_GAP_STATUS.reduce(
		(sum, item) => sum + item.value,
		0
	);
	const priorityGaps = [...QUALITY_OPEN_GAPS_BY_MEASURE].sort(
		(a, b) => b.overdue - a.overdue || b.openGaps - a.openGaps
	);

	const pulseMetrics = [
		{
			id: "open",
			label: "Open gaps",
			value: formatCount(k.openGaps),
			delta: k.openGapsDelta,
			icon: Target,
			well: "bg-primary",
			accent: "border-l-primary",
			valueTone: "text-primary",
			blurb: "Still need closure",
		},
		{
			id: "closed",
			label: "Closed",
			value: formatCount(k.closedGaps),
			delta: k.closedGapsDelta,
			icon: CheckCircle2,
			well: "bg-primary",
			accent: "border-l-primary",
			valueTone: "text-primary",
			blurb: "Closed this cycle",
		},
		{
			id: "members",
			label: "Members",
			value: formatCount(k.membersInMeasure),
			delta: k.membersDelta,
			icon: Users,
			well: "bg-primary",
			accent: "border-l-primary",
			valueTone: "text-primary",
			blurb: "In measure populations",
		},
		{
			id: "completion",
			label: "Completion",
			value: `${k.measureCompletion.toFixed(1)}%`,
			delta: k.measureCompletionDelta,
			icon: Percent,
			well: "bg-primary",
			accent: "border-l-primary",
			valueTone: "text-primary",
			blurb: "Measure run complete",
		},
	] as const;

	const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
		"qa-1": ClipboardList,
		"qa-2": Target,
		"qa-3": Send,
		"qa-4": Stethoscope,
		"qa-5": FileText,
		"qa-6": BarChart3,
	};

	const QUICK_ACTION_HREF: Partial<Record<string, string>> = {
		"qa-1": `${QP_BASE}/measure-library`,
		"qa-2": `${QP_BASE}/gap-closure`,
		"qa-4": `${QP_BASE}/provider-performance`,
		"qa-5": `${QP_BASE}/ncqa-submission`,
		"qa-6": `${QP_BASE}/documents`,
	};

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			{/* Quiet header + chip metrics */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							Quality Performance
						</h1>
						<p className="text-sm text-muted-foreground">
							MY 2025 scoreboard · {k.totalMeasures} HEDIS measures · goal{" "}
							{QUALITY_COMPLIANCE_GOAL}%
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
							onClick={() => toast.success("Export queued")}
						>
							<Download className="size-3.5" />
							Export
						</Button>
						<Button
							variant="outline"
							size="sm"
							className={cn(
								toolbarBtn,
								"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
							)}
							onClick={() => toast.success("Quality data refreshed")}
						>
							<RefreshCw className="size-3.5" />
							Refresh
						</Button>
						<Button size="sm" className={toolbarBtn} asChild>
							<Link href={`${QP_BASE}/measure-library`}>
								Measure library
								<ArrowRight className="size-3.5" />
							</Link>
						</Button>
					</div>
				</div>

				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
						{pulseMetrics.map((m) => {
							const Icon = m.icon;
							// Open gaps falling is good; other metrics rising is good
							const favorable = m.id === "open" ? m.delta <= 0 : m.delta >= 0;
							const flat = m.delta === 0;
							const DeltaIcon = flat
								? Minus
								: m.delta > 0
									? ArrowUpRight
									: ArrowDownRight;
							return (
								<div
									key={m.id}
									className={cn(
										"relative border-l-2 bg-card px-4 py-4 sm:px-5",
										m.accent
									)}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
												{m.label}
											</p>
											<p
												className={cn(
													"mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.65rem]",
													m.valueTone
												)}
											>
												{m.value}
											</p>
										</div>
										<span
											className={cn(
												"flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm",
												m.well
											)}
										>
											<Icon className="size-4 text-white" aria-hidden />
										</span>
									</div>
									<p className="mt-1.5 text-[11px] text-muted-foreground">
										{m.blurb}
									</p>
									<div className="mt-3">
										<span
											className={cn(
												"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
												flat &&
													"border-border bg-muted/50 text-muted-foreground",
												!flat &&
													favorable &&
													"border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
												!flat &&
													!favorable &&
													"border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
											)}
										>
											<DeltaIcon className="size-3" />
											{flat ? "—" : `${m.delta > 0 ? "+" : ""}${m.delta}%`} vs
											MY 2024
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			</div>

			{/* Scoreboard: dial + severity + NCQA */}
			<div className="grid gap-3 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.4fr)]">
				<section
					className={cn(
						PANEL,
						"flex flex-col items-center justify-center gap-3 px-4 py-6"
					)}
				>
					<ComplianceDial
						rate={k.complianceRate}
						goal={QUALITY_COMPLIANCE_GOAL}
					/>
					<p className="text-center text-xs text-muted-foreground">
						<span className="font-medium text-foreground">
							<TrendHint delta={k.complianceDelta} />
						</span>
					</p>
					<div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-primary/15">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{
								width: `${Math.min((k.complianceRate / QUALITY_COMPLIANCE_GOAL) * 100, 100)}%`,
							}}
						/>
					</div>
					<p className="text-[10px] text-muted-foreground">
						Progress to {QUALITY_COMPLIANCE_GOAL}% goal
					</p>
				</section>

				<div className="grid gap-3 sm:grid-cols-2">
					<section className={cn(PANEL, "overflow-hidden")}>
						<div className="border-b border-border/50 px-4 py-2.5">
							<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
								Gap severity
							</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								{formatCount(gapTotal)} open across mix
							</p>
						</div>
						<ul className="space-y-3 p-4">
							{QUALITY_GAP_STATUS.map((item) => {
								const toneClass =
									item.name === "Critical"
										? "bg-red-600"
										: item.name === "High"
											? "bg-amber-500"
											: item.name === "Medium"
												? "bg-primary"
												: null;
								const toneStyle =
									item.name === "Low"
										? {
												backgroundColor:
													"color-mix(in oklch, var(--primary) 45%, white)",
											}
										: undefined;
								return (
									<li key={item.name} className="space-y-1.5">
										<div className="flex items-center justify-between text-xs">
											<span className="flex items-center gap-1.5 font-medium">
												<span
													className={cn("size-2 rounded-full", toneClass)}
													style={toneStyle}
												/>
												{item.name}
											</span>
											<span className="tabular-nums text-muted-foreground">
												{formatCount(item.value)} · {item.pct}%
											</span>
										</div>
										<div className="h-1.5 overflow-hidden rounded-full bg-primary/15">
											<div
												className={cn("h-full rounded-full", toneClass)}
												style={{
													width: `${item.pct}%`,
													...toneStyle,
												}}
											/>
										</div>
									</li>
								);
							})}
						</ul>
					</section>

					<section className={cn(PANEL, "overflow-hidden")}>
						<div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
									NCQA path
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{submission.window}
								</p>
							</div>
							<span
								className={cn(
									CMS_EDGE_STATUS_PILL_CLASS,
									"border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
								)}
							>
								{submission.status}
							</span>
						</div>
						<ol className="relative space-y-0 px-4 py-3">
							{submission.steps.map((step, index) => {
								const isLast = index === submission.steps.length - 1;
								return (
									<li
										key={step.id}
										className="relative flex gap-3 pb-4 last:pb-1"
									>
										{!isLast ? (
											<span
												aria-hidden
												className="absolute top-8 left-[13px] h-[calc(100%-1.25rem)] w-px bg-primary/25"
											/>
										) : null}
										<span
											className={cn(
												"relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
												step.state === "complete" &&
													"bg-emerald-600 text-white",
												step.state === "active" &&
													"bg-primary text-primary-foreground ring-4 ring-primary/25",
												step.state === "pending" &&
													"bg-muted text-muted-foreground"
											)}
										>
											{step.state === "complete" ? (
												<Check className="size-3.5" />
											) : (
												index + 1
											)}
										</span>
										<div className="min-w-0 pt-0.5">
											<p className="text-[12px] font-semibold text-foreground">
												{step.label}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{step.state === "complete"
													? "Done"
													: step.state === "active"
														? "In progress"
														: "Queued"}
											</p>
										</div>
									</li>
								);
							})}
						</ol>
					</section>
				</div>
			</div>

			{/* Trend + leaderboard */}
			<div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(240px,0.9fr)]">
				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Compliance trend
						</p>
						<span className="text-[11px] text-muted-foreground">
							Jan – Jun 2025
						</span>
					</div>
					<div className="h-56 px-2 py-2 sm:h-64">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={QUALITY_COMPLIANCE_TREND}
								margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border/50"
								/>
								<XAxis dataKey="month" tick={{ fontSize: 10 }} />
								<YAxis
									tick={{ fontSize: 11 }}
									width={36}
									domain={[60, 95]}
									tickFormatter={(v) => `${v}%`}
								/>
								<Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
								<ReferenceLine
									y={QUALITY_COMPLIANCE_GOAL}
									stroke="#94a3b8"
									strokeDasharray="4 4"
									label={{
										value: `Goal ${QUALITY_COMPLIANCE_GOAL}%`,
										position: "insideTopRight",
										fontSize: 10,
										fill: "#64748b",
									}}
								/>
								<Line
									type="monotone"
									dataKey="rate"
									name="Compliance"
									stroke="var(--primary)"
									strokeWidth={2.5}
									dot={{ r: 4, fill: "var(--primary)" }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</section>

				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Leaderboard
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Top rates this period
						</p>
					</div>
					<ol className="divide-y divide-border/40">
						{QUALITY_TOP_MEASURES.map((m, i) => (
							<li key={m.name} className="flex items-center gap-3 px-4 py-3">
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold tabular-nums text-primary-foreground">
									{i + 1}
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate text-xs font-medium text-foreground">
										{m.name}
									</p>
									<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/15">
										<div
											className="h-full rounded-full bg-primary"
											style={{
												width: `${m.rate}%`,
												opacity:
													0.55 + (1 - i / QUALITY_TOP_MEASURES.length) * 0.45,
											}}
										/>
									</div>
								</div>
								<span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
									{m.rate.toFixed(1)}%
								</span>
							</li>
						))}
					</ol>
				</section>
			</div>

			{/* Priority work queue — not a clone of Claims table */}
			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5">
					<div>
						<p className="text-sm font-semibold text-foreground">
							Priority gap queue
						</p>
						<p className="text-xs text-muted-foreground">
							Sorted by overdue load · tap to open worklist
						</p>
					</div>
					<Button variant="link" size="sm" className="h-7 px-0 text-xs" asChild>
						<Link href={`${QP_BASE}/gap-closure`}>Gap closure</Link>
					</Button>
				</div>
				<ul className="divide-y divide-border/40">
					{priorityGaps.map((row) => {
						const load = Math.min(
							100,
							Math.round((row.overdue / Math.max(row.openGaps, 1)) * 100) +
								row.gapRate
						);
						return (
							<li key={row.id}>
								<button
									type="button"
									onClick={() => toast.message(`Open ${row.code} worklist`)}
									className="group flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4"
								>
									<div className="flex min-w-0 flex-1 items-start gap-3">
										<span className="mt-0.5 font-mono text-sm font-bold text-primary group-hover:underline">
											{row.code}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-xs text-foreground">
												{row.description}
											</p>
											<p className="mt-0.5 text-[11px] text-muted-foreground">
												{formatCount(row.openGaps)} open ·{" "}
												<span className="text-amber-700 dark:text-amber-300">
													{formatCount(row.dueSoon)} due soon
												</span>
												{" · "}
												<span className="text-red-600 dark:text-red-400">
													{formatCount(row.overdue)} overdue
												</span>
											</p>
										</div>
									</div>
									<div className="flex w-full items-center gap-3 sm:w-48">
										<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15">
											<div
												className={cn(
													"h-full rounded-full",
													row.trend === "Up" ? "bg-red-600" : "bg-primary"
												)}
												style={{ width: `${Math.min(load, 100)}%` }}
											/>
										</div>
										<span className="w-12 text-right text-xs font-semibold tabular-nums">
											{row.gapRate.toFixed(1)}%
										</span>
										<GapTrendIcon trend={row.trend} />
									</div>
								</button>
							</li>
						);
					})}
				</ul>
			</section>

			{/* Activity feed + docs strip */}
			<div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Recent closures
						</p>
					</div>
					<ul className="relative px-4 py-3">
						{QUALITY_GAP_CLOSURE_ACTIVITY.map((row, index) => {
							const isLast = index === QUALITY_GAP_CLOSURE_ACTIVITY.length - 1;
							return (
								<li key={row.id} className="relative flex gap-3 pb-4 last:pb-0">
									{!isLast ? (
										<span
											aria-hidden
											className="absolute top-6 left-[7px] h-[calc(100%-0.5rem)] w-px bg-border"
										/>
									) : null}
									<span className="relative z-[1] mt-1.5 size-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" />
									<div className="min-w-0 flex-1">
										<p className="text-xs text-foreground">
											<span className="font-mono font-semibold text-primary">
												{row.memberId}
											</span>
											<span className="text-muted-foreground"> · </span>
											<span className="font-mono font-medium">
												{row.measure}
											</span>
										</p>
										<p className="mt-0.5 text-[11px] text-muted-foreground">
											{row.action} · {row.closedBy} · {row.closedOn}
										</p>
									</div>
								</li>
							);
						})}
					</ul>
				</section>

				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Documents
						</p>
					</div>
					<ul className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
						{QUALITY_DOCUMENTS.map((doc) => (
							<li key={doc.id}>
								<button
									type="button"
									onClick={() => toast.success(`Download ${doc.name}`)}
									className="flex h-full w-full flex-col gap-2 rounded-sm border border-primary/20 bg-primary/5 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
								>
									<FolderOpen className="size-4 text-primary" />
									<p className="line-clamp-2 text-xs font-medium text-foreground">
										{doc.name}
									</p>
									<p className="mt-auto text-[10px] text-muted-foreground">
										{doc.size}
									</p>
								</button>
							</li>
						))}
					</ul>
				</section>
			</div>

			{/* Inline quick links — not icon grid cards */}
			<nav
				className={cn(
					PANEL,
					"flex flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3"
				)}
			>
				<span className="mr-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
					Go to
				</span>
				{QUALITY_QUICK_ACTIONS.map((action, i) => {
					const Icon = QUICK_ACTION_ICONS[action.id] ?? FolderOpen;
					const href = QUICK_ACTION_HREF[action.id];
					const linkClass =
						"inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5";
					const body = (
						<>
							<Icon className="size-3.5 opacity-70" />
							{action.title}
						</>
					);
					return (
						<span key={action.id} className="inline-flex items-center">
							{i > 0 ? (
								<span className="mx-0.5 text-border" aria-hidden>
									·
								</span>
							) : null}
							{href ? (
								<Link href={href} className={linkClass}>
									{body}
								</Link>
							) : (
								<button
									type="button"
									className={linkClass}
									onClick={() => toast.message(action.title)}
								>
									{body}
								</button>
							)}
						</span>
					);
				})}
			</nav>
		</div>
	);
}

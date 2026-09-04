"use client";

import {
	AlertCircle,
	ArrowRight,
	ArrowUpRight,
	CheckCircle2,
	Clock3,
	CloudUpload,
	type LucideIcon,
	MessageSquareReply,
	Scale,
	Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	CMS_EDGE_PAGE_STACK,
	CmsEdgePageFooter,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_REPORTING_OVERVIEW_ACTIVITY,
	CMS_EDGE_REPORTING_OVERVIEW_ATTENTION,
	CMS_EDGE_REPORTING_OVERVIEW_HEALTH,
	CMS_EDGE_REPORTING_OVERVIEW_KPIS,
	CMS_EDGE_REPORTING_OVERVIEW_PIPELINE,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PANEL =
	"rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";

const STAT_HOVER =
	"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)] hover:-translate-y-px";

const REPORTING_BASE = "/admin/claim-encounter/regulatory/cms-edge-reporting";

const KPI_VISUAL: Record<
	(typeof CMS_EDGE_REPORTING_OVERVIEW_KPIS)[number]["id"],
	{ icon: LucideIcon; well: string; accent: string; valueTone: string }
> = {
	submissions: {
		icon: Send,
		well: "bg-sky-600",
		accent: "from-sky-500/80 to-sky-400/40",
		valueTone: "text-sky-700 dark:text-sky-300",
	},
	"cms-responses": {
		icon: MessageSquareReply,
		well: "bg-blue-600",
		accent: "from-blue-500/80 to-blue-400/40",
		valueTone: "text-blue-700 dark:text-blue-300",
	},
	exceptions: {
		icon: AlertCircle,
		well: "bg-orange-600",
		accent: "from-orange-500/80 to-orange-400/40",
		valueTone: "text-orange-700 dark:text-orange-300",
	},
	reconciliation: {
		icon: Scale,
		well: "bg-violet-600",
		accent: "from-violet-500/80 to-violet-400/40",
		valueTone: "text-violet-700 dark:text-violet-300",
	},
};

const SEVERITY_STYLES = {
	Critical: "bg-red-600 text-white",
	High: "bg-orange-500 text-white",
	Medium: "bg-amber-500 text-white",
	Low: "bg-slate-500 text-white",
} as const;

const ACTIVITY_DOT = {
	success: "bg-emerald-500",
	info: "bg-sky-500",
	warn: "bg-amber-500",
	danger: "bg-red-500",
} as const;

function HealthBanner() {
	const health = CMS_EDGE_REPORTING_OVERVIEW_HEALTH;
	const rate = health.acceptanceRate;

	return (
		<section className="rounded-sm border border-primary/20 bg-primary px-4 py-4 text-primary-foreground shadow-[0_1px_3px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.06)] sm:px-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="min-w-0 space-y-1.5">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
							Cycle status
						</p>
						<span className="inline-flex items-center gap-1.5 rounded-sm border border-primary-foreground/25 bg-primary-foreground/10 px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
							<span className="size-1.5 rounded-full bg-amber-300" />
							{health.status}
						</span>
					</div>
					<p className="text-base font-semibold tracking-tight sm:text-lg">
						{health.deadlineLabel}
					</p>
					<p className="text-xs text-primary-foreground/75">
						{health.environment} · Synced {health.lastSync} ·{" "}
						<span className="font-medium text-primary-foreground">
							{health.daysToDeadline} days
						</span>{" "}
						to deadline
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-5 sm:gap-6">
					<div className="min-w-[8.5rem]">
						<p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
							Acceptance rate
						</p>
						<p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
							{rate.toFixed(1)}%
						</p>
						<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary-foreground/20">
							<div
								className="h-full rounded-full bg-primary-foreground"
								style={{ width: `${Math.min(rate, 100)}%` }}
							/>
						</div>
					</div>
					<Button
						asChild
						size="sm"
						className="h-9 gap-1.5 rounded-sm border-0 bg-primary-foreground text-primary shadow-none hover:bg-primary-foreground/90"
					>
						<Link href={`${REPORTING_BASE}/exceptions`}>
							Work exceptions
							<ArrowRight className="size-3.5" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}

function KpiGrid() {
	return (
		<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{CMS_EDGE_REPORTING_OVERVIEW_KPIS.map((kpi) => {
				const visual = KPI_VISUAL[kpi.id];
				const Icon = visual.icon;

				return (
					<Link
						key={kpi.id}
						href={`${REPORTING_BASE}/${kpi.href}`}
						className={cn(
							"group relative overflow-hidden rounded-sm border border-border/70 bg-card p-4 transition-all duration-200 ease-out",
							STAT_SHADOW,
							STAT_HOVER
						)}
					>
						<span
							aria-hidden
							className={cn(
								"absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
								visual.accent
							)}
						/>
						<div className="flex items-start justify-between gap-3 pl-1.5">
							<div className="min-w-0">
								<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
									{kpi.label}
								</p>
								<p
									className={cn(
										"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
										visual.valueTone
									)}
								>
									{formatCount(kpi.value)}
								</p>
								<p className="mt-1.5 text-xs text-muted-foreground">
									{kpi.hint}
								</p>
								<p
									className={cn(
										"mt-2 text-[11px] font-medium",
										kpi.deltaTone === "up" &&
											"text-emerald-700 dark:text-emerald-300",
										kpi.deltaTone === "down" &&
											"text-amber-700 dark:text-amber-300",
										kpi.deltaTone === "neutral" && "text-muted-foreground"
									)}
								>
									{kpi.delta}
								</p>
							</div>
							<div className="flex flex-col items-end gap-2">
								<span
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm",
										visual.well
									)}
								>
									<Icon className="size-[18px] text-white" />
								</span>
								<ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
							</div>
						</div>
					</Link>
				);
			})}
		</div>
	);
}

function PipelineStrip() {
	return (
		<section className={cn(PANEL, "overflow-hidden")}>
			<div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
				<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
					Reporting pipeline
				</p>
				<span className="text-[11px] text-muted-foreground">
					Q2 2027 · Production
				</span>
			</div>
			<ol className="grid gap-0 sm:grid-cols-4">
				{CMS_EDGE_REPORTING_OVERVIEW_PIPELINE.map((step, index) => {
					const isLast =
						index === CMS_EDGE_REPORTING_OVERVIEW_PIPELINE.length - 1;
					const Icon =
						step.state === "done"
							? CheckCircle2
							: step.state === "active"
								? CloudUpload
								: Clock3;

					return (
						<li
							key={step.id}
							className={cn(
								"relative flex gap-3 px-4 py-4",
								!isLast && "sm:border-r sm:border-border/50"
							)}
						>
							<span
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-full",
									step.state === "done" && "bg-emerald-600 text-white",
									step.state === "active" &&
										"bg-sky-600 text-white ring-4 ring-sky-500/20",
									step.state === "pending" && "bg-muted text-muted-foreground"
								)}
							>
								<Icon className="size-4" />
							</span>
							<div className="min-w-0">
								<p className="text-[12px] font-semibold text-foreground">
									{step.label}
								</p>
								<p className="mt-0.5 text-[11px] text-muted-foreground">
									{step.detail}
								</p>
							</div>
						</li>
					);
				})}
			</ol>
		</section>
	);
}

function AttentionList() {
	return (
		<section className={cn(PANEL, "overflow-hidden")}>
			<div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
				<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
					Needs attention
				</p>
				<span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-800 dark:text-amber-200">
					{CMS_EDGE_REPORTING_OVERVIEW_ATTENTION.length}
				</span>
			</div>
			<ul className="divide-y divide-border/50">
				{CMS_EDGE_REPORTING_OVERVIEW_ATTENTION.map((item) => (
					<li key={item.id}>
						<Link
							href={`${REPORTING_BASE}/${item.href}`}
							className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
						>
							<span
								className={cn(
									"mt-0.5 inline-flex shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
									SEVERITY_STYLES[item.severity]
								)}
							>
								{item.severity}
							</span>
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-medium text-foreground">
									{item.title}
								</p>
								<p className="mt-0.5 text-[11px] text-muted-foreground">
									{item.detail}
								</p>
							</div>
							<span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
								{item.age}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

function ActivityFeed() {
	return (
		<section className={cn(PANEL, "overflow-hidden")}>
			<div className="border-b border-border/50 px-4 py-2.5">
				<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
					Recent activity
				</p>
			</div>
			<ul className="divide-y divide-border/40 px-1 py-1">
				{CMS_EDGE_REPORTING_OVERVIEW_ACTIVITY.map((item) => (
					<li key={item.id} className="flex items-start gap-3 px-3 py-2.5">
						<span
							className={cn(
								"mt-1.5 size-2 shrink-0 rounded-full",
								ACTIVITY_DOT[item.tone]
							)}
						/>
						<div className="min-w-0 flex-1">
							<p className="text-[13px] font-medium text-foreground">
								{item.title}
							</p>
							<p className="mt-0.5 text-[11px] text-muted-foreground">
								{item.meta}
							</p>
						</div>
						<span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
							{item.time}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}

export function CmsEdgeReportingOverviewTab() {
	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<HealthBanner />
			<KpiGrid />
			<PipelineStrip />

			<div className="grid gap-3 lg:grid-cols-2">
				<AttentionList />
				<ActivityFeed />
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}

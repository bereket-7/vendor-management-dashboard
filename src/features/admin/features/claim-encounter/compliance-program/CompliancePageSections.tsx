"use client";

import type { ReactNode } from "react";

import {
	AlertTriangle,
	ArrowDownRight,
	CheckCircle2,
	TrendingUp,
} from "lucide-react";
import {
	Area,
	AreaChart,
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ComplianceSectionConfig } from "@/features/admin/features/claim-encounter/compliance-program/config";
import type { PageAnalytics } from "@/features/admin/features/claim-encounter/compliance-program/mock-analytics";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
	"#13446c",
	"#0ea5e9",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#94a3b8",
];

function SectionShell({
	title,
	description,
	children,
	className,
}: {
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<Card className={cn("gap-0 bg-card/70 py-0", className)}>
			<CardHeader className="border-b border-border/50 px-4 py-3">
				<CardTitle className="text-sm font-semibold">{title}</CardTitle>
				{description ? (
					<p className="text-xs leading-relaxed text-muted-foreground">
						{description}
					</p>
				) : null}
			</CardHeader>
			<CardContent className="p-4">{children}</CardContent>
		</Card>
	);
}

export function CompliancePageSection({
	section,
	analytics,
	variant = "default",
}: {
	section: ComplianceSectionConfig;
	analytics: PageAnalytics;
	variant?: "default" | "sidebar" | "compact";
}) {
	switch (section.kind) {
		case "trend-chart":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="h-56 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={analytics.trend}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
								<XAxis dataKey="label" tick={{ fontSize: 11 }} />
								<YAxis tick={{ fontSize: 11 }} />
								<Tooltip />
								<Area
									type="monotone"
									dataKey="value"
									name="Primary"
									stroke="#13446c"
									fill="#13446c"
									fillOpacity={0.15}
								/>
								<Area
									type="monotone"
									dataKey="secondary"
									name="Secondary"
									stroke="#0ea5e9"
									fill="#0ea5e9"
									fillOpacity={0.1}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</SectionShell>
			);

		case "status-mix":
			if (variant === "sidebar") {
				return (
					<SectionShell
						title={section.title}
						description={section.description}
						className="h-full"
					>
						<div className="flex flex-col items-center gap-4">
							<div className="h-40 w-40">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={analytics.statusMix}
											dataKey="value"
											nameKey="name"
											innerRadius={36}
											outerRadius={62}
											paddingAngle={2}
										>
											{analytics.statusMix.map((_, i) => (
												<Cell
													key={i}
													fill={PIE_COLORS[i % PIE_COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className="w-full space-y-2">
								{analytics.statusMix.map((item, i) => (
									<div
										key={item.name}
										className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5"
									>
										<div className="flex min-w-0 items-center gap-2">
											<span
												className="size-2 shrink-0 rounded-full"
												style={{
													backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
												}}
											/>
											<span className="truncate text-xs">{item.name}</span>
										</div>
										<span className="text-xs font-semibold">{item.value}</span>
									</div>
								))}
							</div>
						</div>
					</SectionShell>
				);
			}
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="grid gap-4 lg:grid-cols-[220px_1fr]">
						<div className="mx-auto h-44 w-44">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={analytics.statusMix}
										dataKey="value"
										nameKey="name"
										innerRadius={42}
										outerRadius={70}
										paddingAngle={2}
									>
										{analytics.statusMix.map((_, i) => (
											<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="grid gap-2 sm:grid-cols-2">
							{analytics.statusMix.map((item, i) => (
								<div
									key={item.name}
									className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
								>
									<div className="flex items-center gap-2">
										<span
											className="size-2.5 rounded-full"
											style={{
												backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
											}}
										/>
										<span className="text-sm">{item.name}</span>
									</div>
									<span className="text-sm font-semibold">{item.value}</span>
								</div>
							))}
						</div>
					</div>
				</SectionShell>
			);

		case "vendor-bars":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="h-56 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={analytics.vendorBars} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
								<XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
								<YAxis
									type="category"
									dataKey="name"
									width={88}
									tick={{ fontSize: 11 }}
								/>
								<Tooltip />
								<Bar dataKey="value" name="Rate %" fill="#13446c" radius={4} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</SectionShell>
			);

		case "insights":
			return (
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{analytics.insights.map((item, i) => {
						const Icon =
							i === 0 ? TrendingUp : i === 1 ? CheckCircle2 : AlertTriangle;
						return (
							<div
								key={item.title}
								className={cn(
									"rounded-xl border p-4 shadow-sm",
									item.tone
								)}
							>
								<div className="mb-2 flex items-center gap-2">
									<Icon className="size-4 shrink-0" />
									<p className="text-sm font-semibold">{item.title}</p>
								</div>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{item.body}
								</p>
							</div>
						);
					})}
				</div>
			);

		case "measure-grid":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						{analytics.measures.map((measure) => (
							<div
								key={measure.id}
								className="rounded-xl border border-border/60 bg-muted/15 p-3"
							>
								<p className="text-xs font-medium text-muted-foreground">
									{measure.label}
								</p>
								<p className="mt-1 text-2xl font-semibold tracking-tight">
									{measure.actual}
									{measure.unit}
								</p>
								<div className="mt-2 flex items-center justify-between text-xs">
									<span className="text-muted-foreground">
										Target {measure.target}
										{measure.unit}
									</span>
									<span
										className={cn(
											"font-semibold capitalize",
											measure.status === "on-track" && "text-emerald-700",
											measure.status === "at-risk" && "text-amber-700",
											measure.status === "gap" && "text-red-700"
										)}
									>
										{measure.status.replace("-", " ")}
									</span>
								</div>
								<Progress
									value={Math.min(100, (measure.actual / measure.target) * 100)}
									className="mt-2 h-1.5"
								/>
							</div>
						))}
					</div>
				</SectionShell>
			);

		case "timeline":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div
						className={cn(
							"space-y-3",
							variant === "compact" && "max-h-72 overflow-y-auto pr-1"
						)}
					>
						{analytics.timeline.map((item, i) => (
							<div key={item.id} className="flex gap-3">
								<div className="flex flex-col items-center">
									<span className="mt-1 size-2 rounded-full bg-primary" />
									{i < analytics.timeline.length - 1 ? (
										<span className="w-px flex-1 bg-border" />
									) : null}
								</div>
								<div className="min-w-0 flex-1 border-b border-border/40 pb-3 last:border-0">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<p className="text-sm font-medium">{item.title}</p>
										<span className="text-[11px] text-muted-foreground">
											{item.when}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">{item.subtitle}</p>
									<p className="mt-1 text-xs font-semibold text-primary">
										{item.status}
									</p>
								</div>
							</div>
						))}
					</div>
				</SectionShell>
			);

		case "findings":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div
						className={cn(
							"grid gap-3",
							variant === "compact"
								? "grid-cols-2"
								: "sm:grid-cols-2 lg:grid-cols-4"
						)}
					>
						{analytics.findings.map((item, i) => (
							<div
								key={item.name}
								className={cn(
									"rounded-xl border border-border/60 px-4 py-3",
									variant === "compact" && "px-3 py-2"
								)}
							>
								<p className="text-xs uppercase tracking-wide text-muted-foreground">
									{item.name}
								</p>
								<p
									className={cn(
										"mt-1 font-semibold",
										variant === "compact" ? "text-2xl" : "text-3xl"
									)}
									style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}
								>
									{item.value}
								</p>
							</div>
						))}
					</div>
				</SectionShell>
			);

		case "cap-gauge":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
						<div>
							<div className="mb-2 flex items-end justify-between">
								<p className="text-sm font-medium">Aggregate cap used</p>
								<p className="text-2xl font-semibold">
									{analytics.capUsedPct}%
								</p>
							</div>
							<Progress value={analytics.capUsedPct} className="h-3" />
							<p className="mt-2 text-xs text-muted-foreground">
								{analytics.capAlertCount} elections flagged near benefit cap
							</p>
						</div>
						<div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
							<p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
								Cap alert threshold
							</p>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								Review elections above 85% utilization before the next billing
								cycle closes.
							</p>
						</div>
					</div>
				</SectionShell>
			);

		case "code-ranking":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="space-y-2">
						{analytics.codes.map((code, i) => (
							<div
								key={code.name}
								className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
							>
								<span className="w-6 text-xs font-semibold text-muted-foreground">
									{i + 1}
								</span>
								<div className="min-w-0 flex-1">
									<p className="font-mono text-sm font-semibold">{code.name}</p>
									<p className="truncate text-xs text-muted-foreground">
										{code.hint}
									</p>
								</div>
								<span className="text-sm font-semibold">{code.value}×</span>
							</div>
						))}
					</div>
				</SectionShell>
			);

		case "scorecards":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="grid gap-3 md:grid-cols-2">
						{analytics.scorecards.map((card) => (
							<div
								key={card.vendor}
								className="rounded-xl border border-border/60 bg-muted/15 p-4"
							>
								<p className="font-medium">{card.vendor}</p>
								<div className="mt-3 grid grid-cols-3 gap-2 text-center">
									<div>
										<p className="text-lg font-semibold">
											{card.turnaroundDays}d
										</p>
										<p className="text-[11px] text-muted-foreground">
											Turnaround
										</p>
									</div>
									<div>
										<p className="text-lg font-semibold">{card.denialRate}%</p>
										<p className="text-[11px] text-muted-foreground">Denials</p>
									</div>
									<div>
										<p className="text-lg font-semibold">{card.volume}</p>
										<p className="text-[11px] text-muted-foreground">Volume</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</SectionShell>
			);

		case "calendar-strip":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
							<span key={d}>{d}</span>
						))}
					</div>
					<div className="mt-1 grid grid-cols-7 gap-1">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={`pad-${i}`} />
						))}
						{analytics.calendarDays.map((day) => (
							<div
								key={day.day}
								className={cn(
									"flex min-h-12 flex-col items-center justify-center rounded-md border text-xs",
									day.tone === "due" &&
										"border-red-300/60 bg-red-50 text-red-900",
									day.tone === "done" &&
										"border-emerald-300/60 bg-emerald-50 text-emerald-900",
									day.tone === "upcoming" && "border-border/60 bg-muted/20"
								)}
							>
								<span className="font-semibold">{day.day}</span>
								{day.count > 0 ? (
									<span className="text-[10px]">{day.count} due</span>
								) : null}
							</div>
						))}
					</div>
				</SectionShell>
			);

		case "split-compare":
			return (
				<SectionShell title={section.title} description={section.description}>
					<div className="grid gap-4 md:grid-cols-2">
						{analytics.splitCompare.map((item) => (
							<div
								key={item.label}
								className="rounded-xl border border-border/60 p-4"
							>
								<p className="text-sm font-semibold">{item.label}</p>
								<div className="mt-3 grid grid-cols-2 gap-3">
									<div className="rounded-lg bg-primary/5 px-3 py-2">
										<p className="text-[11px] text-muted-foreground">
											{item.leftLabel}
										</p>
										<p className="text-xl font-semibold text-primary">
											{item.leftValue}%
										</p>
									</div>
									<div className="rounded-lg bg-sky-500/5 px-3 py-2">
										<p className="text-[11px] text-muted-foreground">
											{item.rightLabel}
										</p>
										<p className="text-xl font-semibold text-sky-700 dark:text-sky-300">
											{item.rightValue}%
										</p>
									</div>
								</div>
								<p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
									<ArrowDownRight className="size-3.5" />
									{item.rightValue >= item.leftValue
										? "Outbound performing better in this window"
										: "Inbound performing better in this window"}
								</p>
							</div>
						))}
					</div>
				</SectionShell>
			);

		default:
			return null;
	}
}

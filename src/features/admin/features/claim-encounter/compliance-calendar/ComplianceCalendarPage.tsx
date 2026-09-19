"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Download,
	Plus,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CmsEdgeSectionPanel } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	ComplianceCalendarListView,
	ComplianceCalendarWeekView,
} from "@/features/admin/features/claim-encounter/compliance-calendar/ComplianceCalendarViews";
import { ComplianceObligationsSection } from "@/features/admin/features/claim-encounter/compliance-calendar/ComplianceObligationsSection";
import {
	buildMonthGrid,
	labelToProgramFilter,
	weekLabel,
} from "@/features/admin/features/claim-encounter/compliance-calendar/feature/mappers/compliance-calendarMappers";
import {
	COMPLIANCE_FILTER_OWNERS,
	COMPLIANCE_FILTER_PROGRAMS,
	COMPLIANCE_FILTER_STATUSES,
	COMPLIANCE_FILTER_TYPES,
	COMPLIANCE_LEGEND_ITEMS,
	COMPLIANCE_PROGRAM_COLORS,
	COMPLIANCE_PROGRAM_LABELS,
	type CalendarDayEvent,
	type ComplianceProgramKey,
	useComplianceCalendarBundleQuery,
	useCreateComplianceObligationMutation,
} from "@/features/admin/features/claim-encounter/compliance-calendar/feature/queries/useComplianceCalendarQuery";
import { cn } from "@/lib/utils";

const PAGE_STACK = "space-y-4 pb-4";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function SummaryKpiCard({
	label,
	value,
	hint,
	icon: Icon,
	iconClass,
}: {
	label: string;
	value: number | string;
	hint: string;
	icon: typeof CalendarDays;
	iconClass: string;
}) {
	return (
		<div className="rounded-lg border border-border/70 bg-card p-3.5 shadow-sm">
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-full",
						iconClass
					)}
				>
					<Icon className="size-4" aria-hidden />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
						{label}
					</p>
					<p className="mt-0.5 text-2xl font-bold tabular-nums leading-none text-foreground">
						{value}
					</p>
					<p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
				</div>
			</div>
		</div>
	);
}

function EventDot({ event }: { event: CalendarDayEvent }) {
	return (
		<span
			className="inline-flex size-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white"
			style={{ backgroundColor: COMPLIANCE_PROGRAM_COLORS[event.program] }}
			title={COMPLIANCE_PROGRAM_LABELS[event.program]}
		>
			{event.count}
		</span>
	);
}

function CalendarDayCell({
	day,
	inMonth,
	isToday,
	events,
}: {
	day: number;
	inMonth: boolean;
	isToday: boolean;
	events: CalendarDayEvent[];
}) {
	return (
		<div
			className={cn(
				"flex min-h-[72px] flex-col border-b border-r border-border/40 p-1.5 last:border-r-0",
				!inMonth && "bg-muted/20"
			)}
		>
			<div className="flex justify-end">
				<span
					className={cn(
						"inline-flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
						isToday && "bg-primary font-semibold text-primary-foreground",
						inMonth && !isToday && "text-foreground",
						!inMonth && "text-muted-foreground/60"
					)}
				>
					{day}
				</span>
			</div>
			{inMonth && events.length > 0 ? (
				<div className="mt-1 flex flex-wrap justify-end gap-0.5">
					{events.map((event, i) => (
						<EventDot key={`${event.program}-${i}`} event={event} />
					))}
				</div>
			) : null}
		</div>
	);
}

function ProgramSummaryChart({
	summary,
	total,
}: {
	summary: Array<{ key: Exclude<ComplianceProgramKey, "overdue">; count: number; pct: string }>;
	total: number;
}) {
	const chartData = summary.map((item) => ({
		name: COMPLIANCE_PROGRAM_LABELS[item.key],
		value: item.count,
		fill: COMPLIANCE_PROGRAM_COLORS[item.key],
	}));

	return (
		<div className="flex items-center gap-4">
			<div className="h-[120px] w-[120px] shrink-0">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={chartData}
							dataKey="value"
							nameKey="name"
							innerRadius="52%"
							outerRadius="88%"
							paddingAngle={2}
							stroke="none"
							isAnimationActive={false}
						>
							{chartData.map((entry) => (
								<Cell key={entry.name} fill={entry.fill} />
							))}
						</Pie>
					</PieChart>
				</ResponsiveContainer>
			</div>
			<ul className="min-w-0 flex-1 space-y-1.5 text-xs">
				{summary.map((item) => (
					<li
						key={item.key}
						className="flex items-center justify-between gap-2"
					>
						<span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
							<span
								className="size-2 shrink-0 rounded-full"
								style={{ backgroundColor: COMPLIANCE_PROGRAM_COLORS[item.key] }}
							/>
							<span className="truncate">
								{COMPLIANCE_PROGRAM_LABELS[item.key]}
							</span>
						</span>
						<span className="shrink-0 tabular-nums text-muted-foreground">
							{item.count} <span className="text-[10px]">({item.pct})</span>
						</span>
					</li>
				))}
				<li className="flex items-center justify-between border-t border-border/50 pt-2 font-semibold text-foreground">
					<span>Total</span>
					<span className="tabular-nums">{total}</span>
				</li>
			</ul>
		</div>
	);
}

export function ComplianceCalendarPage() {
	const now = new Date();
	const [view, setView] = useState("month");
	const [cursor, setCursor] = useState({
		year: now.getFullYear(),
		monthIndex: now.getMonth(),
	});
	const [filterProgram, setFilterProgram] = useState("All");
	const [filterStatus, setFilterStatus] = useState("All");
	const createMutation = useCreateComplianceObligationMutation();

	const bundleQuery = useComplianceCalendarBundleQuery(cursor);
	const data = bundleQuery.data;
	const kpis = data?.kpis ?? {
		total: { value: 0, hint: "—" },
		upcoming: { value: 0, pct: "0%" },
		overdue: { value: 0, pct: "0%" },
		completed: { value: 0, pct: "0%" },
		atRisk: { value: 0, pct: "0%" },
	};
	const eventsByDay = data?.eventsByDay ?? {};
	const schedule = data?.schedule ?? [];
	const obligations = useMemo(() => {
		let rows = data?.obligations ?? [];
		const program = labelToProgramFilter(filterProgram);
		if (program) rows = rows.filter((r) => r.program === program);
		if (filterStatus !== "All") {
			rows = rows.filter((r) => r.status === filterStatus);
		}
		return rows;
	}, [data?.obligations, filterProgram, filterStatus]);

	const grid = buildMonthGrid(cursor.year, cursor.monthIndex);
	const monthLabel = new Date(cursor.year, cursor.monthIndex, 1).toLocaleDateString(
		"en-US",
		{ month: "long", year: "numeric" }
	);
	const anchor = new Date(
		cursor.year,
		cursor.monthIndex,
		Math.min(now.getDate(), 28)
	);
	const periodLabel =
		view === "week" ? weekLabel(anchor) : monthLabel;

	async function handleAddObligation() {
		try {
			await createMutation.mutateAsync({
				title: "New compliance obligation",
				program: "other",
				dueDate: new Date().toISOString().slice(0, 10),
				status: "Upcoming",
				owner: "Regulatory ops",
			});
			toast.success("Obligation created");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Create failed");
		}
	}

	return (
		<div className={PAGE_STACK}>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						Compliance Calendar
					</h1>
					<p className="text-sm text-muted-foreground">
						Track and manage all regulatory, program, and quality obligations in
						one place.
					</p>
					{bundleQuery.isError ? (
						<p className="text-sm text-destructive">
							Could not load compliance calendar.
						</p>
					) : null}
				</div>
				<div className="flex flex-wrap items-end gap-2">
					<div className="flex flex-col gap-1">
						<span className="text-[11px] font-medium text-muted-foreground">
							Program
						</span>
						<Select
							value={filterProgram === "All" ? "all" : filterProgram}
							onValueChange={(v) =>
								setFilterProgram(v === "all" ? "All" : v)
							}
						>
							<SelectTrigger className="h-9 w-[140px] bg-card text-xs shadow-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Programs</SelectItem>
								<SelectItem value="cms-edge">CMS EDGE</SelectItem>
								<SelectItem value="medicaid">Medicaid</SelectItem>
								<SelectItem value="medicare">Medicare</SelectItem>
								<SelectItem value="quality">Quality</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-[11px] font-medium text-muted-foreground">
							Measurement Year
						</span>
						<Select
							value={String(cursor.year)}
							onValueChange={(v) =>
								setCursor((c) => ({ ...c, year: Number(v) }))
							}
						>
							<SelectTrigger className="h-9 w-[100px] bg-card text-xs shadow-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Array.from(
									new Set([
										cursor.year,
										now.getFullYear(),
										now.getFullYear() - 1,
										2027,
									])
								)
									.sort((a, b) => b - a)
									.map((y) => (
										<SelectItem key={y} value={String(y)}>
											{y}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-9 bg-card text-xs shadow-sm"
						onClick={() =>
							setCursor({
								year: now.getFullYear(),
								monthIndex: now.getMonth(),
							})
						}
					>
						Today
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-9 bg-card shadow-sm"
						aria-label="Export"
						onClick={() => toast.info("Export coming soon")}
					>
						<Download className="size-4" />
					</Button>
					<Button
						size="sm"
						className="h-9 gap-1.5 text-xs"
						onClick={() => void handleAddObligation()}
						disabled={createMutation.isPending}
					>
						<Plus className="size-3.5" />
						Add Obligation
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				<SummaryKpiCard
					label="Total Obligations"
					value={kpis.total.value}
					hint={kpis.total.hint}
					icon={CalendarDays}
					iconClass="bg-sky-100 text-sky-700"
				/>
				<SummaryKpiCard
					label="Upcoming (Next 30 Days)"
					value={kpis.upcoming.value}
					hint={kpis.upcoming.pct}
					icon={ClipboardList}
					iconClass="bg-amber-100 text-amber-700"
				/>
				<SummaryKpiCard
					label="Overdue"
					value={kpis.overdue.value}
					hint={kpis.overdue.pct}
					icon={AlertTriangle}
					iconClass="bg-red-100 text-red-700"
				/>
				<SummaryKpiCard
					label="Completed"
					value={kpis.completed.value}
					hint={kpis.completed.pct}
					icon={CheckCircle2}
					iconClass="bg-emerald-100 text-emerald-700"
				/>
				<SummaryKpiCard
					label="At Risk"
					value={kpis.atRisk.value}
					hint={kpis.atRisk.pct}
					icon={ClipboardList}
					iconClass="bg-violet-100 text-violet-700"
				/>
			</div>

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
				<CmsEdgeSectionPanel
					title={
						<div className="flex w-full items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									aria-label="Previous month"
									onClick={() =>
										setCursor((c) => {
											const d = new Date(c.year, c.monthIndex - 1, 1);
											return {
												year: d.getFullYear(),
												monthIndex: d.getMonth(),
											};
										})
									}
								>
									<ChevronLeft className="size-4" />
								</Button>
								<span className="text-sm font-semibold text-foreground">
									{periodLabel}
								</span>
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									aria-label="Next month"
									onClick={() =>
										setCursor((c) => {
											const d = new Date(c.year, c.monthIndex + 1, 1);
											return {
												year: d.getFullYear(),
												monthIndex: d.getMonth(),
											};
										})
									}
								>
									<ChevronRight className="size-4" />
								</Button>
							</div>
							<ToggleGroup
								type="single"
								value={view}
								onValueChange={(v) => v && setView(v)}
								className="rounded-md border border-border/70 bg-muted/30 p-0.5"
							>
								<ToggleGroupItem
									value="month"
									className="h-7 rounded px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
								>
									Month
								</ToggleGroupItem>
								<ToggleGroupItem
									value="week"
									className="h-7 rounded px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
								>
									Week
								</ToggleGroupItem>
								<ToggleGroupItem
									value="list"
									className="h-7 rounded px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
								>
									List
								</ToggleGroupItem>
							</ToggleGroup>
						</div>
					}
					bodyClassName="p-0"
					footer={
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/50 px-4 py-2.5">
							{COMPLIANCE_LEGEND_ITEMS.map((key: ComplianceProgramKey) => (
								<span
									key={key}
									className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
								>
									<span
										className="size-2 rounded-full"
										style={{ backgroundColor: COMPLIANCE_PROGRAM_COLORS[key] }}
									/>
									{COMPLIANCE_PROGRAM_LABELS[key]}
								</span>
							))}
						</div>
					}
				>
					{bundleQuery.isLoading ? (
						<p className="px-4 py-12 text-center text-sm text-muted-foreground">
							Loading calendar…
						</p>
					) : view === "month" ? (
						<div>
							<div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
								{WEEKDAYS.map((day) => (
									<div
										key={day}
										className="border-r border-border/40 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground last:border-r-0"
									>
										{day}
									</div>
								))}
							</div>
							<div className="grid grid-cols-7">
								{grid.map((cell, index) => (
									<CalendarDayCell
										key={`${cell.inMonth}-${cell.day}-${index}`}
										day={cell.day}
										inMonth={cell.inMonth}
										isToday={cell.isToday}
										events={
											cell.inMonth ? (eventsByDay[cell.day] ?? []) : []
										}
									/>
								))}
							</div>
						</div>
					) : view === "week" ? (
						<ComplianceCalendarWeekView
							schedule={schedule}
							anchor={anchor}
							year={cursor.year}
							monthIndex={cursor.monthIndex}
						/>
					) : (
						<ComplianceCalendarListView
							schedule={schedule}
							year={cursor.year}
							monthIndex={cursor.monthIndex}
						/>
					)}
				</CmsEdgeSectionPanel>

				<div className="flex flex-col gap-3">
					<CmsEdgeSectionPanel
						title={
							<div className="flex w-full items-center justify-between">
								<span>Filters</span>
								<Button
									variant="link"
									size="sm"
									className="h-auto px-0 text-xs"
									onClick={() => {
										setFilterProgram("All");
										setFilterStatus("All");
									}}
								>
									Clear All
								</Button>
							</div>
						}
						bodyClassName="space-y-3 p-4"
					>
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">Program</Label>
							<Select value={filterProgram} onValueChange={setFilterProgram}>
								<SelectTrigger className="h-9 bg-card text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{COMPLIANCE_FILTER_PROGRAMS.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								Obligation Type
							</Label>
							<Select defaultValue="All">
								<SelectTrigger className="h-9 bg-card text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{COMPLIANCE_FILTER_TYPES.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">Status</Label>
							<Select value={filterStatus} onValueChange={setFilterStatus}>
								<SelectTrigger className="h-9 bg-card text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{COMPLIANCE_FILTER_STATUSES.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								Owner / Assigned To
							</Label>
							<Select defaultValue="All">
								<SelectTrigger className="h-9 bg-card text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{COMPLIANCE_FILTER_OWNERS.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								Date Range
							</Label>
							<div className="relative">
								<CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
								<Input
									readOnly
									value={monthLabel}
									className="h-9 bg-card pl-8 text-xs"
								/>
							</div>
						</div>
					</CmsEdgeSectionPanel>

					<CmsEdgeSectionPanel title="Program Summary" bodyClassName="p-4">
						<ProgramSummaryChart
							summary={data?.programSummary ?? []}
							total={Number(kpis.total.value) || 0}
						/>
					</CmsEdgeSectionPanel>
				</div>
			</div>

			<ComplianceObligationsSection
				obligations={obligations}
				upcomingDeadlines={data?.upcomingDeadlines ?? []}
				total={data?.total ?? obligations.length}
			/>
		</div>
	);
}

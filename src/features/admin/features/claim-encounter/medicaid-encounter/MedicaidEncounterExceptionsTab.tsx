"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
	AlertCircle,
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	CircleAlert,
	Eye,
	Info,
	type LucideIcon,
	Pencil,
	Power,
} from "lucide-react";
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_LINK_CLASS,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	MEDICAID_EXCEPTIONS_BY_SEVERITY,
	MEDICAID_EXCEPTIONS_BY_STATE,
	MEDICAID_EXCEPTIONS_TREND,
	MEDICAID_EXCEPTION_SEVERITY_FILTER,
	MEDICAID_EXCEPTION_SEVERITY_STYLES,
	MEDICAID_EXCEPTION_STATUS_FILTER,
	MEDICAID_EXCEPTION_STATUS_STYLES,
	MEDICAID_TOP_EXCEPTION_REASONS,
	type MedicaidExceptionDetailRow,
	filterMedicaidExceptions,
	useMedicaidEncounterExceptionDetailsList,
	useUpdateProgramExceptionMutation,
} from "@/features/admin/features/claim-encounter/medicaid-encounter/feature/queries/useMedicaidEncounterQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { getProgramScale } from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { cn } from "@/lib/utils";

function scaleProgramCount(value: number, programType?: ProgramType) {
	if (programType !== "medicare") return value;
	return Math.round(value * getProgramScale("medicare"));
}

function formatProgramState(state: string, programType?: ProgramType) {
	if (programType !== "medicare") return state;
	return "CMS";
}

const EXCEPTION_PAGE_STACK = "space-y-5";
const EXCEPTION_SECTION_GAP = "gap-4";
const EXCEPTION_TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const EXCEPTION_TABLE_CELL = "px-4 py-2.5";

function PanelLink({ children }: { children: ReactNode }) {
	return (
		<Button variant="link" size="sm" className="h-7 px-0 text-xs text-primary">
			{children}
		</Button>
	);
}

function StatusPill({
	label,
	className,
}: {
	label: string;
	className: string;
}) {
	return (
		<span className={cn(CMS_EDGE_STATUS_PILL_CLASS, className)}>{label}</span>
	);
}

function TrendHint({
	delta,
	invert = false,
}: {
	delta: number;
	invert?: boolean;
}) {
	const positive = invert ? delta < 0 : delta > 0;
	const Icon = positive ? ArrowUpRight : ArrowDownRight;
	const tone = positive ? "text-emerald-700" : "text-red-600";
	const sign = delta > 0 ? "+" : "";

	return (
		<span className={cn("inline-flex items-center gap-0.5", tone)}>
			<Icon className="size-3" />
			{sign}
			{Math.abs(delta).toFixed(2)}% vs Prior Period
		</span>
	);
}

function ExceptionMetricCard({
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
						"flex size-10 shrink-0 items-center justify-center rounded-md",
						tone
					)}
				>
					<Icon className="size-5 stroke-[2.25]" aria-hidden />
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

function deriveExceptionKpis(rows: MedicaidExceptionDetailRow[]) {
	return {
		total: rows.length,
		totalDelta: 0,
		critical: rows.filter((r) => r.severity === "Critical").length,
		criticalDelta: 0,
		warning: rows.filter((r) => r.severity === "Warning").length,
		warningDelta: 0,
		info: rows.filter((r) => r.severity === "Info").length,
		infoDelta: 0,
		resolved: rows.filter((r) => r.status === "Resolved").length,
		resolvedDelta: 0,
		open: rows.filter((r) => r.status === "Open" || r.status === "In Review")
			.length,
		openDelta: 0,
	};
}

function ExceptionsKpiRow({
	programType,
	kpis,
}: {
	programType?: ProgramType;
	kpis: ReturnType<typeof deriveExceptionKpis>;
}) {
	const k = kpis;

	return (
		<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<ExceptionMetricCard
				label="Total Exceptions"
				value={formatCount(scaleProgramCount(k.total, programType))}
				hint={<TrendHint delta={k.totalDelta} />}
				icon={AlertCircle}
				tone="text-red-700 bg-red-500/10"
				valueClassName="text-red-600"
			/>
			<ExceptionMetricCard
				label="Critical Exceptions"
				value={formatCount(scaleProgramCount(k.critical, programType))}
				hint={<TrendHint delta={k.criticalDelta} invert />}
				icon={AlertTriangle}
				tone="text-orange-700 bg-orange-500/10"
				valueClassName="text-orange-600"
			/>
			<ExceptionMetricCard
				label="Warning Exceptions"
				value={formatCount(scaleProgramCount(k.warning, programType))}
				hint={<TrendHint delta={k.warningDelta} />}
				icon={CircleAlert}
				tone="text-violet-700 bg-violet-500/10"
				valueClassName="text-violet-700"
			/>
			<ExceptionMetricCard
				label="Info Exceptions"
				value={formatCount(scaleProgramCount(k.info, programType))}
				hint={<TrendHint delta={k.infoDelta} />}
				icon={Info}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<ExceptionMetricCard
				label="Resolved Exceptions"
				value={formatCount(scaleProgramCount(k.resolved, programType))}
				hint={<TrendHint delta={k.resolvedDelta} />}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<ExceptionMetricCard
				label="Open Exceptions"
				value={formatCount(scaleProgramCount(k.open, programType))}
				hint={<TrendHint delta={k.openDelta} invert />}
				icon={Power}
				tone="text-sky-700 bg-sky-500/10"
				valueClassName="text-sky-700"
			/>
		</div>
	);
}

function ExceptionsBySeverityPanel({
	programType,
}: {
	programType?: ProgramType;
}) {
	const total = MEDICAID_EXCEPTIONS_BY_SEVERITY.reduce(
		(sum, item) => sum + item.value,
		0
	);
	const scaledTotal = scaleProgramCount(total, programType);

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Exceptions by Severity"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View Full Report</PanelLink>
				</div>
			}
		>
			<div className="flex min-h-[220px] flex-1 flex-col gap-2 border-t border-border/50 px-3 py-3 sm:flex-row">
				<div className="relative mx-auto w-full max-w-[150px] flex-1">
					<ResponsiveContainer width="100%" height="100%" minHeight={120}>
						<PieChart>
							<Pie
								data={MEDICAID_EXCEPTIONS_BY_SEVERITY}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{MEDICAID_EXCEPTIONS_BY_SEVERITY.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-sm font-bold tabular-nums">
							{formatCount(scaledTotal)}
						</p>
						<p className="text-[10px] text-muted-foreground">
							Total Exceptions
						</p>
					</div>
				</div>
				<ul className="flex flex-1 flex-col justify-center gap-2 text-xs">
					{MEDICAID_EXCEPTIONS_BY_SEVERITY.map((item) => (
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
								{formatCount(scaleProgramCount(item.value, programType))}
								<span className="ml-1">({item.pct.toFixed(1)}%)</span>
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ExceptionsTrendPanel() {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Exceptions Trend (by Week)"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View Full Trend Report</PanelLink>
				</div>
			}
		>
			<div className="min-h-[220px] flex-1 border-t border-border/50 px-2 py-2">
				<ResponsiveContainer width="100%" height="100%" minHeight={180}>
					<LineChart
						data={MEDICAID_EXCEPTIONS_TREND}
						margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
						<XAxis
							dataKey="week"
							tick={{ fontSize: 10 }}
							interval={0}
							angle={-12}
							textAnchor="end"
							height={48}
						/>
						<YAxis
							tick={{ fontSize: 11 }}
							width={40}
							tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
						/>
						<RechartsTooltip
							formatter={(value: number) => formatCount(value)}
						/>
						<Legend
							iconSize={8}
							wrapperStyle={{ fontSize: 10, paddingBottom: 4 }}
						/>
						<Line
							type="monotone"
							dataKey="critical"
							name="Critical"
							stroke="#ef4444"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
						<Line
							type="monotone"
							dataKey="warning"
							name="Warning"
							stroke="#f97316"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
						<Line
							type="monotone"
							dataKey="info"
							name="Info"
							stroke="#3b82f6"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function TopExceptionReasonsPanel({
	programType,
}: {
	programType?: ProgramType;
}) {
	const maxCount = Math.max(
		...MEDICAID_TOP_EXCEPTION_REASONS.map((item) => item.count)
	);

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Top Exception Reasons"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View All Reasons</PanelLink>
				</div>
			}
		>
			<div className="space-y-3 border-t border-border/50 px-4 py-4">
				{MEDICAID_TOP_EXCEPTION_REASONS.map((item) => (
					<div key={item.reason}>
						<div className="mb-1 flex items-center justify-between gap-2 text-xs">
							<span className="min-w-0 truncate font-medium">
								{item.reason}
							</span>
							<span className="shrink-0 tabular-nums text-muted-foreground">
								{formatCount(scaleProgramCount(item.count, programType))}
							</span>
						</div>
						<div className="h-2 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary"
								style={{ width: `${(item.count / maxCount) * 100}%` }}
							/>
						</div>
					</div>
				))}
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ExceptionsByStatePanel({
	programType,
}: {
	programType?: ProgramType;
}) {
	const isMedicare = programType === "medicare";

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title={isMedicare ? "Exceptions by Program" : "Exceptions by State"}
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>
						{isMedicare ? "View All Programs" : "View All States"}
					</PanelLink>
				</div>
			}
		>
			<div className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={EXCEPTION_TABLE_HEAD}>
								{isMedicare ? "Program" : "State"}
							</TableHead>
							<TableHead className={cn(EXCEPTION_TABLE_HEAD, "text-right")}>
								Exceptions
							</TableHead>
							<TableHead
								className={cn(EXCEPTION_TABLE_HEAD, "pr-4 text-right")}
							>
								% of Total
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MEDICAID_EXCEPTIONS_BY_STATE.map((row) => (
							<TableRow
								key={row.state}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={cn(EXCEPTION_TABLE_CELL, "font-medium")}>
									{formatProgramState(row.state, programType)}
								</TableCell>
								<TableCell
									className={cn(
										EXCEPTION_TABLE_CELL,
										"text-right tabular-nums"
									)}
								>
									{formatCount(scaleProgramCount(row.count, programType))}
								</TableCell>
								<TableCell
									className={cn(
										EXCEPTION_TABLE_CELL,
										"pr-4 text-right tabular-nums"
									)}
								>
									{row.pct.toFixed(1)}%
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ExceptionDetailsPanel({
	search,
	onSearchChange,
	severity,
	onSeverityChange,
	status,
	onStatusChange,
	onReset,
	rows,
	programType,
	onCycleStatus,
}: {
	search: string;
	onSearchChange: (value: string) => void;
	severity: string;
	onSeverityChange: (value: string) => void;
	status: string;
	onStatusChange: (value: string) => void;
	onReset: () => void;
	rows: MedicaidExceptionDetailRow[];
	programType?: ProgramType;
	onCycleStatus?: (row: MedicaidExceptionDetailRow) => void;
}) {
	const isMedicare = programType === "medicare";

	return (
		<CmsEdgeSectionPanel
			className="flex min-h-0 flex-col"
			title="Exceptions Details"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
					<span>
						Showing 1 to {rows.length} of {scaleProgramCount(48, programType)}{" "}
						entries
					</span>
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1">
							<Button variant="outline" size="icon" className="size-7" disabled>
								<ChevronLeft className="size-3.5" />
							</Button>
							{[1, 2, 3, 4, 5].map((page) => (
								<Button
									key={page}
									variant={page === 1 ? "default" : "outline"}
									size="icon"
									className="size-7 text-xs"
								>
									{page}
								</Button>
							))}
							<span className="px-1">…</span>
							<Button variant="outline" size="icon" className="size-7 text-xs">
								10
							</Button>
							<Button variant="outline" size="icon" className="size-7">
								<ChevronRight className="size-3.5" />
							</Button>
						</div>
						<span className="text-[11px]">Rows per page: 10</span>
					</div>
				</div>
			}
		>
			<div className="space-y-3 border-b border-border/50 px-4 py-4">
				<div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto_auto] lg:items-end">
					<div className="space-y-1">
						<Label className="sr-only">Search</Label>
						<Input
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Search by error code, description, file, batch..."
							className="h-9 bg-background text-xs"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Error Code
						</Label>
						<Input
							placeholder="All codes"
							className="h-9 bg-background text-xs"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Severity
						</Label>
						<Select value={severity} onValueChange={onSeverityChange}>
							<SelectTrigger className="h-9 bg-background text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MEDICAID_EXCEPTION_SEVERITY_FILTER.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Status
						</Label>
						<Select value={status} onValueChange={onStatusChange}>
							<SelectTrigger className="h-9 bg-background text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MEDICAID_EXCEPTION_STATUS_FILTER.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button size="sm" className="h-9">
						Apply Filters
					</Button>
					<Button size="sm" variant="outline" className="h-9" onClick={onReset}>
						Reset
					</Button>
				</div>
				<div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
					<Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:pb-2">
						Date Range
					</Label>
					<Input
						type="date"
						defaultValue="2027-04-01"
						className="h-9 bg-background text-xs"
					/>
					<Input
						type="date"
						defaultValue="2027-06-30"
						className="h-9 bg-background text-xs"
					/>
				</div>
			</div>

			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[1400px]")}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={EXCEPTION_TABLE_HEAD}>Error Code</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>
								Description
							</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>Severity</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>
								{isMedicare ? "Program" : "State"}
							</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>MCO</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>Vendor</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>
								Submission Batch
							</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>
								Response File
							</TableHead>
							<TableHead className={cn(EXCEPTION_TABLE_HEAD, "text-right")}>
								Encounter Count
							</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>
								First Occurrence
							</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>
								Last Occurrence
							</TableHead>
							<TableHead className={EXCEPTION_TABLE_HEAD}>Status</TableHead>
							<TableHead
								className={cn(EXCEPTION_TABLE_HEAD, "pr-4 text-right")}
							>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell
									className={cn(EXCEPTION_TABLE_CELL, "font-mono font-medium")}
								>
									{row.errorCode}
								</TableCell>
								<TableCell
									className={cn(EXCEPTION_TABLE_CELL, "text-muted-foreground")}
								>
									{row.description}
								</TableCell>
								<TableCell className={EXCEPTION_TABLE_CELL}>
									<StatusPill
										label={row.severity}
										className={MEDICAID_EXCEPTION_SEVERITY_STYLES[row.severity]}
									/>
								</TableCell>
								<TableCell className={EXCEPTION_TABLE_CELL}>
									{formatProgramState(row.state, programType)}
								</TableCell>
								<TableCell
									className={cn(EXCEPTION_TABLE_CELL, "text-muted-foreground")}
								>
									{row.mco}
								</TableCell>
								<TableCell className={EXCEPTION_TABLE_CELL}>
									{row.vendor}
								</TableCell>
								<TableCell
									className={cn(EXCEPTION_TABLE_CELL, "font-mono text-[11px]")}
								>
									{row.submissionBatch}
								</TableCell>
								<TableCell className={EXCEPTION_TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.responseFile}
									</Button>
								</TableCell>
								<TableCell
									className={cn(
										EXCEPTION_TABLE_CELL,
										"text-right tabular-nums"
									)}
								>
									{formatCount(
										scaleProgramCount(row.encounterCount, programType)
									)}
								</TableCell>
								<TableCell className={cn(EXCEPTION_TABLE_CELL, "tabular-nums")}>
									{row.firstOccurrence}
								</TableCell>
								<TableCell className={cn(EXCEPTION_TABLE_CELL, "tabular-nums")}>
									{row.lastOccurrence}
								</TableCell>
								<TableCell className={EXCEPTION_TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={MEDICAID_EXCEPTION_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(EXCEPTION_TABLE_CELL, "pr-4 text-right")}
								>
									<div className="inline-flex items-center gap-0.5">
										<Button
											variant="ghost"
											size="icon"
											className="size-7 text-primary"
											onClick={() => toast.message(`View ${row.errorCode}`)}
										>
											<Eye className="size-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-7 text-primary"
											onClick={() => {
												if (onCycleStatus) onCycleStatus(row);
												else toast.message(`Edit ${row.errorCode}`);
											}}
										>
											<Pencil className="size-3.5" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

export function MedicaidEncounterExceptionsTab({
	programType = "medicaid",
}: { programType?: ProgramType; reportingPeriod?: string } = {}) {
	const [search, setSearch] = useState("");
	const [severity, setSeverity] = useState("All Severities");
	const [status, setStatus] = useState("All Statuses");

	const { exceptionDetails, isLoading } =
		useMedicaidEncounterExceptionDetailsList(programType);
	const updateException = useUpdateProgramExceptionMutation();
	const kpis = deriveExceptionKpis(exceptionDetails);

	const rows = useMemo(
		() =>
			filterMedicaidExceptions(exceptionDetails, search, {
				severity,
				status,
			}),
		[exceptionDetails, search, severity, status]
	);

	const resetFilters = () => {
		setSearch("");
		setSeverity("All Severities");
		setStatus("All Statuses");
	};

	const cycleStatus = (row: MedicaidExceptionDetailRow) => {
		const next =
			row.status === "Open"
				? "In Review"
				: row.status === "In Review"
					? "Resolved"
					: "Open";
		updateException.mutate(
			{ id: row.id, status: next },
			{
				onSuccess: () => toast.success(`Status → ${next}`),
				onError: () => toast.error("Failed to update exception status"),
			}
		);
	};

	return (
		<div className={EXCEPTION_PAGE_STACK}>
			{isLoading ? (
				<p className="px-4 py-4 text-center text-sm text-muted-foreground">
					Loading exceptions…
				</p>
			) : null}
			<ExceptionsKpiRow programType={programType} kpis={kpis} />

			<ExceptionDetailsPanel
				search={search}
				onSearchChange={setSearch}
				severity={severity}
				onSeverityChange={setSeverity}
				status={status}
				onStatusChange={setStatus}
				onReset={resetFilters}
				rows={rows}
				programType={programType}
				onCycleStatus={cycleStatus}
			/>

			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-2",
					EXCEPTION_SECTION_GAP
				)}
			>
				<ExceptionsBySeverityPanel programType={programType} />
				<ExceptionsTrendPanel />
			</div>

			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-2",
					EXCEPTION_SECTION_GAP
				)}
			>
				<TopExceptionReasonsPanel programType={programType} />
				<ExceptionsByStatePanel programType={programType} />
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}

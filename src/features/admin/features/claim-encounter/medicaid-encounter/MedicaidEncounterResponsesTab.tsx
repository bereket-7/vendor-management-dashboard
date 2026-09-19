"use client";

import { type ReactNode, useState } from "react";

import {
	AlertTriangle,
	ArrowUpRight,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	FileText,
	type LucideIcon,
	Mail,
	Search,
	XCircle,
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
	MEDICAID_RECENT_WARNINGS,
	MEDICAID_RESPONSE_STATUS_STYLES,
	MEDICAID_RESPONSE_SUMMARY_TREND,
	MEDICAID_TOP_ERROR_REASONS,
	MEDICAID_WARNING_STATUS_STYLES,
	useMedicaidEncounterResponseFilesList,
} from "@/features/admin/features/claim-encounter/medicaid-encounter/feature/queries/useMedicaidEncounterQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { getProgramScale } from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { cn } from "@/lib/utils";

function scaleProgramCount(value: number, programType?: ProgramType) {
	if (programType !== "medicare") return value;
	return Math.round(value * getProgramScale("medicare"));
}

function formatProgramFileName(fileName: string, programType?: ProgramType) {
	if (programType !== "medicare") return fileName;
	return fileName
		.replace(/^[A-Z]{2}_MMIS_Response_/, "CMS_RESP_")
		.replace(/\.rsp$/, ".xml");
}

const RESPONSE_PAGE_STACK = "space-y-5";
const RESPONSE_SECTION_GAP = "gap-4";
/** Wider table cells so file names and descriptions fit without horizontal scroll on desktop */
const RESPONSE_TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const RESPONSE_TABLE_CELL = "px-4 py-2.5";

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

function ResponseMetricCard({
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
						"flex size-8 shrink-0 items-center justify-center rounded-md",
						tone
					)}
				>
					<Icon className="size-4" aria-hidden />
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

type ResponseKpis = {
	filesReceived: number;
	filesReceivedDelta: number;
	totalReports: number;
	accepted: number;
	acceptanceRate: number;
	errors: number;
	errorRate: number;
	warnings: number;
	warningRate: number;
	pending: number;
};

function deriveResponseKpis(
	files: Array<{
		records: number;
		accepted: number;
		errors: number;
		warnings: number;
		status: string;
	}>
): ResponseKpis {
	const filesReceived = files.length;
	const totalReports = files.reduce((sum, f) => sum + f.records, 0);
	const accepted = files.reduce((sum, f) => sum + f.accepted, 0);
	const errors = files.reduce((sum, f) => sum + f.errors, 0);
	const warnings = files.reduce((sum, f) => sum + f.warnings, 0);
	const pending = files.filter((f) => f.status === "Pending").length;
	const denom = totalReports || 1;
	return {
		filesReceived,
		filesReceivedDelta: 0,
		totalReports,
		accepted,
		acceptanceRate: (accepted / denom) * 100,
		errors,
		errorRate: (errors / denom) * 100,
		warnings,
		warningRate: (warnings / denom) * 100,
		pending,
	};
}

function ResponsesKpiRow({
	programType,
	kpis,
}: {
	programType?: ProgramType;
	kpis: ResponseKpis;
}) {
	const k = kpis;
	const isMedicare = programType === "medicare";

	return (
		<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<ResponseMetricCard
				label={
					isMedicare
						? "CMS Response Files Received"
						: "State Response Files Received"
				}
				value={scaleProgramCount(k.filesReceived, programType)}
				hint={
					<span className="inline-flex items-center gap-0.5 text-emerald-700">
						<ArrowUpRight className="size-3" />
						{k.filesReceivedDelta}% vs Prior Period
					</span>
				}
				icon={Mail}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<ResponseMetricCard
				label="Total Reports"
				value={scaleProgramCount(k.totalReports, programType)}
				hint="This Period"
				icon={FileText}
				tone="text-sky-700 bg-sky-500/10"
			/>
			<ResponseMetricCard
				label="Accepted"
				value={scaleProgramCount(k.accepted, programType)}
				hint={`${k.acceptanceRate.toFixed(2)}% Acceptance Rate`}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<ResponseMetricCard
				label="Errors"
				value={scaleProgramCount(k.errors, programType)}
				hint={`${k.errorRate.toFixed(2)}% Error Rate`}
				icon={XCircle}
				tone="text-red-700 bg-red-500/10"
				valueClassName="text-red-600"
			/>
			<ResponseMetricCard
				label="Warnings"
				value={scaleProgramCount(k.warnings, programType)}
				hint={`${k.warningRate.toFixed(2)}% Warning Rate`}
				icon={AlertTriangle}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
			<ResponseMetricCard
				label="Responses Pending"
				value={scaleProgramCount(k.pending, programType)}
				hint="This Period"
				icon={Clock3}
				tone="text-violet-700 bg-violet-500/10"
			/>
		</div>
	);
}

function StateResponseFilesTable({
	programType,
	rows,
}: {
	programType?: ProgramType;
	rows: Array<{
		id: string;
		fileName: string;
		reportType: string;
		receivedAt: string;
		records: number;
		accepted: number;
		errors: number;
		warnings: number;
		status: keyof typeof MEDICAID_RESPONSE_STATUS_STYLES;
	}>;
}) {
	const isMedicare = programType === "medicare";

	return (
		<CmsEdgeSectionPanel
			title={isMedicare ? "CMS Response Files" : "State Response Files"}
			action={<PanelLink>View All</PanelLink>}
			footer={
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-5 py-3 text-xs text-muted-foreground">
					<span>
						Showing {rows.length} of {rows.length} entries
					</span>
					<div className="flex items-center gap-1">
						<Button variant="outline" size="icon" className="size-7" disabled>
							<ChevronLeft className="size-3.5" />
						</Button>
						<Button variant="default" size="icon" className="size-7 text-xs">
							1
						</Button>
						<Button variant="outline" size="icon" className="size-7">
							<ChevronRight className="size-3.5" />
						</Button>
					</div>
				</div>
			}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={RESPONSE_TABLE_HEAD}>
								{isMedicare ? "CMS Response File" : "Response File"}
							</TableHead>
							<TableHead className={RESPONSE_TABLE_HEAD}>Report Type</TableHead>
							<TableHead className={RESPONSE_TABLE_HEAD}>
								Received Date/Time
							</TableHead>
							<TableHead className={cn(RESPONSE_TABLE_HEAD, "text-right")}>
								Records
							</TableHead>
							<TableHead className={cn(RESPONSE_TABLE_HEAD, "text-right")}>
								Accepted
							</TableHead>
							<TableHead className={cn(RESPONSE_TABLE_HEAD, "text-right")}>
								Errors
							</TableHead>
							<TableHead className={cn(RESPONSE_TABLE_HEAD, "text-right")}>
								Warnings
							</TableHead>
							<TableHead className={cn(RESPONSE_TABLE_HEAD, "pr-5")}>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={8}
									className="px-4 py-8 text-center text-sm text-muted-foreground"
								>
									No response files
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => (
								<TableRow
									key={row.id}
									className="border-b border-border/40 hover:bg-muted/20"
								>
									<TableCell className={RESPONSE_TABLE_CELL}>
										<Button
											variant="link"
											className={cn(
												CMS_EDGE_TABLE_LINK_CLASS,
												"whitespace-normal text-left"
											)}
										>
											{formatProgramFileName(row.fileName, programType)}
										</Button>
									</TableCell>
									<TableCell className={RESPONSE_TABLE_CELL}>
										{row.reportType}
									</TableCell>
									<TableCell
										className={cn(RESPONSE_TABLE_CELL, "tabular-nums")}
									>
										{row.receivedAt}
									</TableCell>
									<TableCell
										className={cn(RESPONSE_TABLE_CELL, "text-right tabular-nums")}
									>
										{formatCount(scaleProgramCount(row.records, programType))}
									</TableCell>
									<TableCell
										className={cn(
											RESPONSE_TABLE_CELL,
											"text-right tabular-nums text-emerald-700"
										)}
									>
										{formatCount(scaleProgramCount(row.accepted, programType))}
									</TableCell>
									<TableCell
										className={cn(
											RESPONSE_TABLE_CELL,
											"text-right tabular-nums text-red-600"
										)}
									>
										{formatCount(scaleProgramCount(row.errors, programType))}
									</TableCell>
									<TableCell
										className={cn(
											RESPONSE_TABLE_CELL,
											"text-right tabular-nums text-amber-600"
										)}
									>
										{formatCount(scaleProgramCount(row.warnings, programType))}
									</TableCell>
									<TableCell className={cn(RESPONSE_TABLE_CELL, "pr-5")}>
										<StatusPill
											label={row.status}
											className={MEDICAID_RESPONSE_STATUS_STYLES[row.status]}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ResponseSummaryTrendPanel({
	programType,
}: {
	programType?: ProgramType;
}) {
	const isMedicare = programType === "medicare";

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title={
				isMedicare
					? "CMS Response Summary Trend"
					: "State Response Summary Trend"
			}
			bodyClassName="flex min-h-0 flex-1 flex-col"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View Full Trend Report</PanelLink>
				</div>
			}
		>
			<div className="min-h-[240px] flex-1 border-t border-border/50 px-2 py-2">
				<ResponsiveContainer width="100%" height="100%" minHeight={200}>
					<LineChart
						data={MEDICAID_RESPONSE_SUMMARY_TREND}
						margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
						<XAxis dataKey="week" tick={{ fontSize: 11 }} />
						<YAxis tick={{ fontSize: 11 }} width={28} allowDecimals={false} />
						<RechartsTooltip />
						<Legend
							verticalAlign="top"
							align="center"
							iconType="circle"
							iconSize={8}
							wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
						/>
						<Line
							type="monotone"
							dataKey="accepted"
							name="Accepted"
							stroke="#22c55e"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="errors"
							name="Errors"
							stroke="#ef4444"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="warnings"
							name="Warnings"
							stroke="#f59e0b"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ResponseFiltersPanel() {
	const [reportType, setReportType] = useState("all");
	const [status, setStatus] = useState("all");
	const [fileName, setFileName] = useState("");
	const [dateFrom, setDateFrom] = useState("2027-06-01");
	const [dateTo, setDateTo] = useState("2027-07-21");

	function resetFilters() {
		setReportType("all");
		setStatus("all");
		setFileName("");
		setDateFrom("2027-06-01");
		setDateTo("2027-07-21");
	}

	return (
		<CmsEdgeSectionPanel title="Filters">
			<div className="space-y-3 border-t border-border/50 px-3 py-3 text-xs">
				<div className="space-y-1">
					<label className="text-[11px] font-medium text-muted-foreground">
						Response Received Date
					</label>
					<div className="grid grid-cols-2 gap-2">
						<Input
							type="date"
							value={dateFrom}
							onChange={(e) => setDateFrom(e.target.value)}
							className="h-8 text-xs"
						/>
						<Input
							type="date"
							value={dateTo}
							onChange={(e) => setDateTo(e.target.value)}
							className="h-8 text-xs"
						/>
					</div>
				</div>
				<div className="space-y-1">
					<label className="text-[11px] font-medium text-muted-foreground">
						Report Type
					</label>
					<Select value={reportType} onValueChange={setReportType}>
						<SelectTrigger className="h-8 text-xs">
							<SelectValue placeholder="All types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Report Types</SelectItem>
							<SelectItem value="encounter">Encounter File</SelectItem>
							<SelectItem value="eligibility">Member Eligibility</SelectItem>
							<SelectItem value="provider">Provider Data</SelectItem>
							<SelectItem value="capitation">Capitation Adj.</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<label className="text-[11px] font-medium text-muted-foreground">
						Status
					</label>
					<Select value={status} onValueChange={setStatus}>
						<SelectTrigger className="h-8 text-xs">
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="processed">Processed</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<label className="text-[11px] font-medium text-muted-foreground">
						File Name
					</label>
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={fileName}
							onChange={(e) => setFileName(e.target.value)}
							placeholder="Search file name…"
							className="h-8 pl-8 text-xs"
						/>
					</div>
				</div>
				<div className="flex gap-2 pt-1">
					<Button
						size="sm"
						className="h-8 flex-1 text-xs"
						onClick={() => toast.message("Filters applied")}
					>
						Apply Filters
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs"
						onClick={resetFilters}
					>
						Reset
					</Button>
				</div>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ResponsesByStatusPanel({
	programType,
	files = [],
}: {
	programType?: ProgramType;
	files?: Array<{ status: string }>;
}) {
	const counts = new Map<string, number>();
	for (const f of files) {
		counts.set(f.status, (counts.get(f.status) ?? 0) + 1);
	}
	const colors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#94a3b8"];
	const pieData = [...counts.entries()].map(([name, count], i) => ({
		name,
		value: scaleProgramCount(count, programType),
		color: colors[i % colors.length],
	}));
	const total = pieData.reduce((sum, item) => sum + item.value, 0) || 1;

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Responses by Status"
			bodyClassName="flex min-h-0 flex-1 flex-col"
		>
			<div className="flex min-h-[200px] flex-1 items-center gap-3 border-t border-border/50 px-3 py-3">
				<div className="relative mx-auto w-full max-w-[120px] shrink-0">
					<ResponsiveContainer width="100%" height={140}>
						<PieChart>
							<Pie
								data={pieData}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{pieData.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-sm font-bold tabular-nums">{total}</p>
						<p className="text-[10px] text-muted-foreground">Total</p>
					</div>
				</div>
				<ul className="flex min-w-0 flex-1 flex-col gap-2 text-xs">
					{pieData.map((item) => (
						<li
							key={item.name}
							className="flex items-center justify-between gap-2"
						>
							<span className="flex min-w-0 items-center gap-1.5 font-medium">
								<span
									className="size-2 shrink-0 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								{item.name}
							</span>
							<span className="shrink-0 tabular-nums text-muted-foreground">
								{item.value}
								<span className="ml-1">
									({total ? ((item.value / total) * 100).toFixed(0) : 0}%)
								</span>
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function TopErrorReasonsPanel({ programType }: { programType?: ProgramType }) {
	return (
		<CmsEdgeSectionPanel
			title="Top Error Reasons"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View All Error Reasons</PanelLink>
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
							<TableHead className={cn(RESPONSE_TABLE_HEAD, "w-[88px]")}>
								Code
							</TableHead>
							<TableHead className={RESPONSE_TABLE_HEAD}>Description</TableHead>
							<TableHead
								className={cn(RESPONSE_TABLE_HEAD, "w-[72px] text-right")}
							>
								Count
							</TableHead>
							<TableHead
								className={cn(RESPONSE_TABLE_HEAD, "w-[100px] pr-5 text-right")}
							>
								% of Total Errors
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MEDICAID_TOP_ERROR_REASONS.map((row) => (
							<TableRow
								key={row.code}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell
									className={cn(RESPONSE_TABLE_CELL, "font-mono font-medium")}
								>
									{row.code}
								</TableCell>
								<TableCell
									className={cn(
										RESPONSE_TABLE_CELL,
										"pr-6 text-muted-foreground leading-relaxed"
									)}
								>
									{row.description}
								</TableCell>
								<TableCell
									className={cn(RESPONSE_TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(scaleProgramCount(row.count, programType))}
								</TableCell>
								<TableCell
									className={cn(
										RESPONSE_TABLE_CELL,
										"pr-5 text-right tabular-nums"
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

function RecentWarningsPanel({ programType }: { programType?: ProgramType }) {
	return (
		<CmsEdgeSectionPanel
			title="Recent Warnings"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View All Warnings</PanelLink>
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
							<TableHead className={cn(RESPONSE_TABLE_HEAD, "w-[88px]")}>
								Code
							</TableHead>
							<TableHead className={RESPONSE_TABLE_HEAD}>Description</TableHead>
							<TableHead
								className={cn(RESPONSE_TABLE_HEAD, "w-[72px] text-right")}
							>
								Count
							</TableHead>
							<TableHead className={cn(RESPONSE_TABLE_HEAD, "w-[100px] pr-5")}>
								Status
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MEDICAID_RECENT_WARNINGS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell
									className={cn(RESPONSE_TABLE_CELL, "font-mono font-medium")}
								>
									{row.code}
								</TableCell>
								<TableCell
									className={cn(
										RESPONSE_TABLE_CELL,
										"pr-6 text-muted-foreground leading-relaxed"
									)}
								>
									{row.description}
								</TableCell>
								<TableCell
									className={cn(RESPONSE_TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(scaleProgramCount(row.count, programType))}
								</TableCell>
								<TableCell className={cn(RESPONSE_TABLE_CELL, "pr-5")}>
									<StatusPill
										label={row.status}
										className={MEDICAID_WARNING_STATUS_STYLES[row.status]}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</CmsEdgeSectionPanel>
	);
}

type MedicaidEncounterResponsesTabProps = {
	programType?: ProgramType;
	reportingPeriod?: string;
};

export function MedicaidEncounterResponsesTab({
	programType = "medicaid",
}: MedicaidEncounterResponsesTabProps = {}) {
	const { responseFiles, isLoading } =
		useMedicaidEncounterResponseFilesList(programType);
	const kpis = deriveResponseKpis(responseFiles);

	return (
		<div className={RESPONSE_PAGE_STACK}>
			{isLoading ? (
				<p className="px-4 py-4 text-center text-sm text-muted-foreground">
					Loading responses…
				</p>
			) : null}
			<ResponsesKpiRow programType={programType} kpis={kpis} />

			{/* Main content — wide left for tables, narrow right for chart + filters */}
			<div
				className={cn(
					"grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]",
					RESPONSE_SECTION_GAP
				)}
			>
				<div className={cn("flex min-w-0 flex-col", RESPONSE_SECTION_GAP)}>
					<StateResponseFilesTable
						programType={programType}
						rows={responseFiles}
					/>
					<TopErrorReasonsPanel programType={programType} />
					<RecentWarningsPanel programType={programType} />
				</div>

				<div className={cn("flex min-w-0 flex-col", RESPONSE_SECTION_GAP)}>
					<ResponseSummaryTrendPanel programType={programType} />
					<ResponseFiltersPanel />
					<ResponsesByStatusPanel
						programType={programType}
						files={responseFiles}
					/>
				</div>
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}

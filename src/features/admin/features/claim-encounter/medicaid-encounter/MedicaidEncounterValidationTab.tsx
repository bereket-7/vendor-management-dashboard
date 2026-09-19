"use client";

import { type ReactNode, useState } from "react";

import {
	AlertTriangle,
	ArrowUpRight,
	BookOpen,
	CheckCircle2,
	Download,
	FileText,
	type LucideIcon,
	RefreshCw,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
	MEDICAID_EXTERNAL_TOP_REJECTION_CODES,
	MEDICAID_EXTERNAL_VALIDATION_DETAILS,
	MEDICAID_EXTERNAL_VALIDATION_STATUS_STYLES,
	MEDICAID_EXTERNAL_VALIDATION_TREND,
	MEDICAID_INTERNAL_VALIDATION_DETAILS,
	MEDICAID_INTERNAL_VALIDATION_STATUS_STYLES,
	MEDICAID_VALIDATION_QUICK_ACTIONS,
	MEDICAID_VALIDATION_TOP_ERROR_CODES,
	MEDICAID_VALIDATION_TREND,
	MEDICAID_VALIDATION_TYPE_BREAKDOWN,
	useMedicaidEncounterValidationDerivedQuery,
} from "@/features/admin/features/claim-encounter/medicaid-encounter/feature/queries/useMedicaidEncounterQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { getProgramScale } from "@/features/admin/features/claim-encounter/program-reporting/feature/queries/useProgramReportingQuery";
import type { ProgramType } from "@/features/admin/features/claim-encounter/program-reporting/types";
import { cn } from "@/lib/utils";

type ValidationSubTab = "internal" | "external";

const VALIDATION_SUB_TAB_CLASS = cn(
	"rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold shadow-none transition-colors",
	"text-muted-foreground hover:text-foreground",
	"data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
);

const INTERNAL_QUICK_ACTION_IDS = new Set(["vq-1", "vq-2", "vq-4"]);
const EXTERNAL_QUICK_ACTION_IDS = new Set(["vq-1", "vq-3"]);

function scaleProgramCount(value: number, programType?: ProgramType) {
	if (programType !== "medicare") return value;
	return Math.round(value * getProgramScale("medicare"));
}

function formatProgramFileName(fileName: string, programType?: ProgramType) {
	if (programType !== "medicare") return fileName;
	return fileName
		.replace(/^[A-Z]{2}_Encounter_/, "CMS_ENC_")
		.replace(/^[A-Z]{2}_MMIS_Response_/, "CMS_RESP_")
		.replace(/\.(dat|rsp)$/, ".xml");
}

function formatProgramState(state: string, programType?: ProgramType) {
	if (programType !== "medicare") return state;
	return "CMS";
}

const VALIDATION_PAGE_STACK = "space-y-5";
const VALIDATION_SECTION_GAP = "gap-4";
const VALIDATION_TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const VALIDATION_TABLE_CELL = "px-4 py-2.5";

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

function SummaryStatCard({
	label,
	value,
	hint,
	icon: Icon,
	tone,
	valueClassName,
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	icon: LucideIcon;
	tone: string;
	valueClassName?: string;
}) {
	return (
		<div className="rounded-lg border border-border/60 bg-muted/20 p-3">
			<div className="flex items-start gap-2.5">
				<div
					className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-md",
						tone
					)}
				>
					<Icon className="size-5 stroke-[2.25]" aria-hidden />
				</div>
				<div className="min-w-0">
					<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						{label}
					</p>
					<p
						className={cn(
							"mt-0.5 text-lg font-semibold tabular-nums leading-tight",
							valueClassName
						)}
					>
						{value}
					</p>
					{hint != null && hint !== "" ? (
						<div className="mt-0.5 text-[10px] text-muted-foreground">
							{hint}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

function InternalValidationSummaryPanel({
	programType,
	kpis,
}: {
	programType?: ProgramType;
	kpis?: { filesReceived: number; accepted: number; errors: number; warnings: number };
}) {
	const files = kpis?.filesReceived ?? 0;
	const passed = kpis?.accepted ?? 0;
	const warnings = kpis?.warnings ?? 0;
	const errors = kpis?.errors ?? 0;
	const total = files || 1;
	const s = {
		filesValidated: files,
		filesValidatedDelta: 0,
		passed,
		passedPct: (passed / total) * 100,
		warnings,
		warningsPct: (warnings / total) * 100,
		errors,
		errorsPct: (errors / total) * 100,
	};

	return (
		<CmsEdgeSectionPanel title="Internal Validation Summary">
			<div className="grid gap-3 border-t border-border/50 p-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryStatCard
					label="Files Validated"
					value={scaleProgramCount(s.filesValidated, programType)}
					hint={
						<span className="inline-flex items-center gap-0.5 text-emerald-700">
							<ArrowUpRight className="size-3" />+
							{s.filesValidatedDelta.toFixed(2)}% vs Prior Period
						</span>
					}
					icon={FileText}
					tone="text-sky-700 bg-sky-500/10"
				/>
				<SummaryStatCard
					label="Passed"
					value={scaleProgramCount(s.passed, programType)}
					hint={`${s.passedPct.toFixed(2)}%`}
					icon={CheckCircle2}
					tone="text-emerald-700 bg-emerald-500/10"
					valueClassName="text-emerald-700"
				/>
				<SummaryStatCard
					label="Warnings"
					value={scaleProgramCount(s.warnings, programType)}
					hint={`${s.warningsPct.toFixed(2)}%`}
					icon={AlertTriangle}
					tone="text-amber-700 bg-amber-500/10"
					valueClassName="text-amber-600"
				/>
				<SummaryStatCard
					label="Errors"
					value={scaleProgramCount(s.errors, programType)}
					hint={`${s.errorsPct.toFixed(2)}%`}
					icon={XCircle}
					tone="text-red-700 bg-red-500/10"
					valueClassName="text-red-600"
				/>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ExternalValidationSummaryPanel({
	programType,
	kpis,
}: {
	programType?: ProgramType;
	kpis?: { filesReceived: number; accepted: number; errors: number; warnings: number };
}) {
	const files = kpis?.filesReceived ?? 0;
	const passed = kpis?.accepted ?? 0;
	const warnings = kpis?.warnings ?? 0;
	const errors = kpis?.errors ?? 0;
	const total = files || 1;
	const s = {
		filesValidated: files,
		passed,
		passedPct: (passed / total) * 100,
		warnings,
		warningsPct: (warnings / total) * 100,
		errors,
		errorsPct: (errors / total) * 100,
	};
	const isMedicare = programType === "medicare";

	return (
		<CmsEdgeSectionPanel
			title={
				isMedicare
					? "External (CMS) Validation Summary"
					: "External (State) Validation Summary"
			}
		>
			<div className="grid gap-3 border-t border-border/50 p-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryStatCard
					label="Files Validated"
					value={scaleProgramCount(s.filesValidated, programType)}
					icon={FileText}
					tone="text-sky-700 bg-sky-500/10"
				/>
				<SummaryStatCard
					label="Passed"
					value={scaleProgramCount(s.passed, programType)}
					hint={`${s.passedPct.toFixed(2)}%`}
					icon={CheckCircle2}
					tone="text-emerald-700 bg-emerald-500/10"
					valueClassName="text-emerald-700"
				/>
				<SummaryStatCard
					label="Warnings"
					value={scaleProgramCount(s.warnings, programType)}
					hint={`${s.warningsPct.toFixed(2)}%`}
					icon={AlertTriangle}
					tone="text-amber-700 bg-amber-500/10"
					valueClassName="text-amber-600"
				/>
				<SummaryStatCard
					label="Errors"
					value={scaleProgramCount(s.errors, programType)}
					hint={`${s.errorsPct.toFixed(2)}%`}
					icon={XCircle}
					tone="text-red-700 bg-red-500/10"
					valueClassName="text-red-600"
				/>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function InternalValidationDetailsPanel({
	programType,
}: {
	programType?: ProgramType;
}) {
	const isMedicare = programType === "medicare";

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Internal Validation Details"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View All Internal Validation Details</PanelLink>
				</div>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[960px]")}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={VALIDATION_TABLE_HEAD}>
								Submission Batch
							</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>File Name</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>
								{isMedicare ? "Program" : "State"}
							</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>File Type</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "text-right")}>
								Records
							</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "text-right")}>
								Passed
							</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "text-right")}>
								Warnings
							</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "text-right")}>
								Errors
							</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "pr-4")}>
								Validated On
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MEDICAID_INTERNAL_VALIDATION_DETAILS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={VALIDATION_TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.submissionBatch}
									</Button>
								</TableCell>
								<TableCell className={VALIDATION_TABLE_CELL}>
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
								<TableCell className={VALIDATION_TABLE_CELL}>
									{formatProgramState(row.state, programType)}
								</TableCell>
								<TableCell className={VALIDATION_TABLE_CELL}>
									{row.fileType}
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"text-right tabular-nums"
									)}
								>
									{formatCount(scaleProgramCount(row.records, programType))}
								</TableCell>
								<TableCell className={VALIDATION_TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={
											MEDICAID_INTERNAL_VALIDATION_STATUS_STYLES[row.status]
										}
									/>
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"text-right tabular-nums text-emerald-700"
									)}
								>
									{formatCount(scaleProgramCount(row.passed, programType))}
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"text-right tabular-nums text-amber-600"
									)}
								>
									{formatCount(scaleProgramCount(row.warnings, programType))}
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"text-right tabular-nums text-red-600"
									)}
								>
									{formatCount(scaleProgramCount(row.errors, programType))}
								</TableCell>
								<TableCell
									className={cn(VALIDATION_TABLE_CELL, "pr-4 tabular-nums")}
								>
									{row.validatedOn}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ExternalValidationDetailsPanel({
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
					? "External (CMS) Validation Details"
					: "External (State) Validation Details"
			}
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<div className="border-t border-border/50 px-4 py-2 text-center">
					<PanelLink>View All External Validation Details</PanelLink>
				</div>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[960px]")}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={VALIDATION_TABLE_HEAD}>
								Response File Name
							</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>
								Submission Batch
							</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>
								{isMedicare ? "Program" : "State"}
							</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>
								Response Received
							</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "text-right")}>
								Records
							</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "text-right")}>
								Accepted
							</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "text-right")}>
								Warnings
							</TableHead>
							<TableHead
								className={cn(VALIDATION_TABLE_HEAD, "pr-4 text-right")}
							>
								Rejected
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MEDICAID_EXTERNAL_VALIDATION_DETAILS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={VALIDATION_TABLE_CELL}>
									<Button
										variant="link"
										className={cn(
											CMS_EDGE_TABLE_LINK_CLASS,
											"whitespace-normal text-left"
										)}
									>
										{formatProgramFileName(row.responseFileName, programType)}
									</Button>
								</TableCell>
								<TableCell className={VALIDATION_TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.submissionBatch}
									</Button>
								</TableCell>
								<TableCell className={VALIDATION_TABLE_CELL}>
									{formatProgramState(row.state, programType)}
								</TableCell>
								<TableCell
									className={cn(VALIDATION_TABLE_CELL, "tabular-nums")}
								>
									{row.responseReceived}
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"text-right tabular-nums"
									)}
								>
									{formatCount(scaleProgramCount(row.records, programType))}
								</TableCell>
								<TableCell className={VALIDATION_TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={
											MEDICAID_EXTERNAL_VALIDATION_STATUS_STYLES[row.status]
										}
									/>
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"text-right tabular-nums text-emerald-700"
									)}
								>
									{formatCount(scaleProgramCount(row.accepted, programType))}
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"text-right tabular-nums text-amber-600"
									)}
								>
									{formatCount(scaleProgramCount(row.warnings, programType))}
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"pr-4 text-right tabular-nums text-red-600"
									)}
								>
									{formatCount(scaleProgramCount(row.rejected, programType))}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function TopErrorCodesPanel({
	programType,
	title = "Internal Validation – Top Error Codes",
	rows = MEDICAID_VALIDATION_TOP_ERROR_CODES,
	lastColumnLabel = "% of Total Errors",
}: {
	programType?: ProgramType;
	title?: string;
	rows?: typeof MEDICAID_VALIDATION_TOP_ERROR_CODES;
	lastColumnLabel?: string;
}) {
	return (
		<CmsEdgeSectionPanel title={title}>
			<div className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={VALIDATION_TABLE_HEAD}>
								Error Code
							</TableHead>
							<TableHead className={VALIDATION_TABLE_HEAD}>
								Description
							</TableHead>
							<TableHead className={cn(VALIDATION_TABLE_HEAD, "text-right")}>
								Count
							</TableHead>
							<TableHead
								className={cn(VALIDATION_TABLE_HEAD, "pr-4 text-right")}
							>
								{lastColumnLabel}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow
								key={row.code}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell
									className={cn(VALIDATION_TABLE_CELL, "font-mono font-medium")}
								>
									{row.code}
								</TableCell>
								<TableCell
									className={cn(VALIDATION_TABLE_CELL, "text-muted-foreground")}
								>
									{row.description}
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"text-right tabular-nums"
									)}
								>
									{formatCount(scaleProgramCount(row.count, programType))}
								</TableCell>
								<TableCell
									className={cn(
										VALIDATION_TABLE_CELL,
										"pr-4 text-right tabular-nums"
									)}
								>
									{row.pct.toFixed(2)}%
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ValidationTrendPanel({
	title = "Validation Trend (by Week)",
	data = MEDICAID_VALIDATION_TREND,
}: {
	title?: string;
	data?: typeof MEDICAID_VALIDATION_TREND;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title={title}
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
		>
			<div className="min-h-[220px] flex-1 border-t border-border/50 px-2 py-2">
				<ResponsiveContainer width="100%" height="100%" minHeight={180}>
					<LineChart
						data={data}
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
							width={36}
							domain={[0, 100]}
							tickFormatter={(v) => `${v}%`}
						/>
						<RechartsTooltip
							formatter={(value: number) => `${value.toFixed(1)}%`}
						/>
						<Legend
							iconSize={8}
							wrapperStyle={{ fontSize: 10, paddingBottom: 4 }}
						/>
						<Line
							type="monotone"
							dataKey="passed"
							name="Passed %"
							stroke="#22c55e"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
						<Line
							type="monotone"
							dataKey="warnings"
							name="Warnings %"
							stroke="#f97316"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
						<Line
							type="monotone"
							dataKey="errors"
							name="Errors %"
							stroke="#ef4444"
							strokeWidth={2}
							dot={{ r: 2 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ValidationTypeBreakdownPanel({
	scope,
}: {
	scope: "internal" | "external";
}) {
	const breakdown = MEDICAID_VALIDATION_TYPE_BREAKDOWN.filter((item) =>
		scope === "internal"
			? item.name.startsWith("Internal")
			: item.name.startsWith("External")
	);
	const total = breakdown.reduce((sum, item) => sum + item.value, 0);
	const title =
		scope === "internal"
			? "Internal Validation Breakdown"
			: "External Validation Breakdown";

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title={title}
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
		>
			<div className="flex min-h-[220px] flex-1 flex-col gap-2 border-t border-border/50 px-3 py-3 sm:flex-row">
				<div className="relative mx-auto w-full max-w-[150px] flex-1">
					<ResponsiveContainer width="100%" height="100%" minHeight={120}>
						<PieChart>
							<Pie
								data={breakdown}
								dataKey="value"
								nameKey="name"
								innerRadius="58%"
								outerRadius="88%"
								paddingAngle={2}
								stroke="none"
								isAnimationActive={false}
							>
								{breakdown.map((entry) => (
									<Cell key={entry.name} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
						<p className="text-sm font-bold tabular-nums">{total}</p>
						<p className="text-[10px] text-muted-foreground">Total Files</p>
					</div>
				</div>
				<ul className="flex flex-1 flex-col justify-center gap-1.5 text-[11px]">
					{breakdown.map((item) => (
						<li
							key={item.name}
							className="flex items-center justify-between gap-2"
						>
							<span className="flex min-w-0 items-center gap-1.5 font-medium">
								<span
									className="size-2 shrink-0 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span className="truncate">
									{item.name.replace(/^(Internal|External) /, "")}
								</span>
							</span>
							<span className="shrink-0 tabular-nums text-muted-foreground">
								{item.pct.toFixed(2)}%
							</span>
						</li>
					))}
				</ul>
			</div>
		</CmsEdgeSectionPanel>
	);
}

const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
	"vq-1": BookOpen,
	"vq-2": Download,
	"vq-3": Download,
	"vq-4": RefreshCw,
};

function ValidationQuickActionsPanel({
	scope,
}: {
	scope: "internal" | "external";
}) {
	const actionIds =
		scope === "internal"
			? INTERNAL_QUICK_ACTION_IDS
			: EXTERNAL_QUICK_ACTION_IDS;
	const actions = MEDICAID_VALIDATION_QUICK_ACTIONS.filter((action) =>
		actionIds.has(action.id)
	);
	const title =
		scope === "internal" ? "Internal Quick Actions" : "External Quick Actions";

	return (
		<CmsEdgeSectionPanel title={title}>
			<ul className="divide-y divide-border/40 border-t border-border/50">
				{actions.map((action) => {
					const Icon = QUICK_ACTION_ICONS[action.id] ?? FileText;
					return (
						<li key={action.id}>
							<button
								type="button"
								className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
								onClick={() => toast.message(action.title)}
							>
								<Icon className="mt-0.5 size-4 shrink-0 text-primary" />
								<div>
									<p className="text-xs font-semibold text-foreground">
										{action.title}
									</p>
									<p className="mt-0.5 text-[10px] text-muted-foreground">
										{action.description}
									</p>
								</div>
							</button>
						</li>
					);
				})}
			</ul>
		</CmsEdgeSectionPanel>
	);
}

function InternalValidationView({
	programType,
	topErrorCodes,
	trend,
	kpis,
}: {
	programType?: ProgramType;
	topErrorCodes?: typeof MEDICAID_VALIDATION_TOP_ERROR_CODES;
	trend?: typeof MEDICAID_VALIDATION_TREND;
	kpis?: { filesReceived: number; accepted: number; errors: number; warnings: number };
}) {
	return (
		<div className={VALIDATION_PAGE_STACK}>
			<InternalValidationSummaryPanel programType={programType} kpis={kpis} />
			<InternalValidationDetailsPanel programType={programType} />
			<TopErrorCodesPanel programType={programType} rows={topErrorCodes} />
			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-2",
					VALIDATION_SECTION_GAP
				)}
			>
				<ValidationTrendPanel
					title="Internal Validation Trend (by Week)"
					data={trend}
				/>
				<ValidationTypeBreakdownPanel scope="internal" />
			</div>
			<ValidationQuickActionsPanel scope="internal" />
		</div>
	);
}

function ExternalValidationView({
	programType,
	topErrorCodes,
	trend,
	kpis,
}: {
	programType?: ProgramType;
	topErrorCodes?: typeof MEDICAID_EXTERNAL_TOP_REJECTION_CODES;
	trend?: typeof MEDICAID_EXTERNAL_VALIDATION_TREND;
	kpis?: { filesReceived: number; accepted: number; errors: number; warnings: number };
}) {
	const isMedicare = programType === "medicare";

	return (
		<div className={VALIDATION_PAGE_STACK}>
			<ExternalValidationSummaryPanel programType={programType} kpis={kpis} />
			<ExternalValidationDetailsPanel programType={programType} />
			<TopErrorCodesPanel
				programType={programType}
				title={
					isMedicare
						? "External (CMS) Validation – Top Rejection Codes"
						: "External (State) Validation – Top Rejection Codes"
				}
				rows={topErrorCodes}
				lastColumnLabel="% of Total Rejections"
			/>
			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-2",
					VALIDATION_SECTION_GAP
				)}
			>
				<ValidationTrendPanel
					title={
						isMedicare
							? "External (CMS) Validation Trend (by Week)"
							: "External (State) Validation Trend (by Week)"
					}
					data={trend}
				/>
				<ValidationTypeBreakdownPanel scope="external" />
			</div>
			<ValidationQuickActionsPanel scope="external" />
		</div>
	);
}

export function MedicaidEncounterValidationTab({
	programType = "medicaid",
	reportingPeriod: _reportingPeriod,
}: { programType?: ProgramType; reportingPeriod?: string } = {}) {
	const [subTab, setSubTab] = useState<ValidationSubTab>("internal");
	const isMedicare = programType === "medicare";
	const validationQuery = useMedicaidEncounterValidationDerivedQuery(programType);
	const derivedTop = validationQuery.data?.topErrorCodes ?? [];
	const derivedTrend = validationQuery.data?.trend ?? [];
	const derivedExternalTop = derivedTop;
	const derivedExternalTrend = derivedTrend;
	const derivedKpis = validationQuery.data?.kpis;

	return (
		<div className={VALIDATION_PAGE_STACK}>
			{validationQuery.isLoading ? (
				<p className="px-4 py-4 text-center text-sm text-muted-foreground">
					Loading validation…
				</p>
			) : null}
			<Tabs
				value={subTab}
				onValueChange={(value) => setSubTab(value as ValidationSubTab)}
			>
				<div className="rounded-lg border border-border/70 bg-card shadow-sm">
					<TabsList className="inline-flex h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0">
						<TabsTrigger value="internal" className={VALIDATION_SUB_TAB_CLASS}>
							Internal Validation (Pre-Submission)
						</TabsTrigger>
						<TabsTrigger value="external" className={VALIDATION_SUB_TAB_CLASS}>
							{isMedicare
								? "External Validation (CMS)"
								: "External Validation (State)"}
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="internal" className="mt-4 space-y-0">
					<InternalValidationView
						programType={programType}
						topErrorCodes={derivedTop}
						trend={derivedTrend}
						kpis={derivedKpis}
					/>
				</TabsContent>
				<TabsContent value="external" className="mt-4 space-y-0">
					<ExternalValidationView
						programType={programType}
						topErrorCodes={derivedExternalTop}
						trend={derivedExternalTrend}
						kpis={derivedKpis}
					/>
				</TabsContent>
			</Tabs>

			<CmsEdgePageFooter />
		</div>
	);
}

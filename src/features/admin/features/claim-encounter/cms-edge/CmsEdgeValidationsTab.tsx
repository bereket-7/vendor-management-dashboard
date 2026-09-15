"use client";

import { type ReactNode, useState } from "react";

import {
	AlertTriangle,
	BookOpen,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Download,
	Eye,
	FileSearch,
	FileText,
	FolderX,
	History,
	type LucideIcon,
	Scale,
	XCircle,
} from "lucide-react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
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
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_SECTION_GAP,
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CELL_CLASS,
	CMS_EDGE_TABLE_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CMS_EDGE_TABLE_HEAD_CLASS,
	CMS_EDGE_TABLE_LINK_CLASS,
	CmsEdgePageFooter,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_EXTERNAL_ERROR_BREAKDOWN,
	CMS_EDGE_EXTERNAL_FILE_VALIDATION,
	CMS_EDGE_EXTERNAL_QUICK_ACTIONS,
	CMS_EDGE_EXTERNAL_RECORD_VALIDATION,
	CMS_EDGE_EXTERNAL_VALIDATION_SUMMARY,
	CMS_EDGE_INTERNAL_FILE_VALIDATION,
	CMS_EDGE_INTERNAL_RECORD_VALIDATION,
	CMS_EDGE_INTERNAL_VALIDATION_SUMMARY,
	CMS_EDGE_INTERNAL_VALIDATION_TREND,
	CMS_EDGE_TOP_ERROR_CATEGORIES,
	EXTERNAL_FILE_STATUS_STYLES,
	INTERNAL_FILE_STATUS_STYLES,
	RECORD_SEVERITY_STYLES,
	RESOLUTION_STATUS_DOT,
	type RecordResolutionStatus,
	useCmsEdgeValidationRunsList,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

type ValidationSubTab = "internal" | "external";

const VALIDATION_SUB_TAB_CLASS = cn(
	"rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold shadow-none transition-colors",
	"text-muted-foreground hover:text-foreground",
	"data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
);

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

function SummaryMetricCard({
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
		<div className="rounded-lg border border-border/70 bg-card p-3 shadow-sm">
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"flex size-9 shrink-0 items-center justify-center rounded-md",
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
							"mt-0.5 text-sm font-semibold tabular-nums leading-tight",
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

function TablePagination({
	label,
	pages,
}: {
	label: string;
	pages: (number | "ellipsis")[];
}) {
	return (
		<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
			<span>{label}</span>
			<div className="flex items-center gap-1">
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronLeft className="size-3.5" />
				</Button>
				{pages.map((page, i) =>
					page === "ellipsis" ? (
						<span key={`e-${i}`} className="px-1">
							…
						</span>
					) : (
						<Button
							key={page}
							variant={page === 1 ? "default" : "outline"}
							size="icon"
							className="size-7 text-xs"
						>
							{page}
						</Button>
					)
				)}
				<Button variant="outline" size="icon" className="size-7">
					<ChevronRight className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}

function ResolutionStatus({ status }: { status: RecordResolutionStatus }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-xs font-medium">
			<span
				className={cn("size-2 rounded-full", RESOLUTION_STATUS_DOT[status])}
			/>
			{status}
		</span>
	);
}

function InternalValidationSummaryPanel() {
	const s = CMS_EDGE_INTERNAL_VALIDATION_SUMMARY;

	return (
		<CmsEdgeSectionPanel
			title="Internal Validation Summary"
			subtitle="Pre-submission validation results across all encounter files for the current reporting period."
			action={
				<StatusPill
					label="Validated by Platform"
					className="border-sky-200 bg-sky-50 text-sky-800"
				/>
			}
			footer={
				<div className="border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
					<span>
						Total Files Validated: {s.totalFiles} | Total Records Validated:{" "}
						{formatCount(s.totalRecords)}
					</span>
					<span className="mt-1 block sm:mt-0 sm:float-right">
						Last Validation: {s.lastValidation}
					</span>
				</div>
			}
		>
			<div className="grid gap-3 border-t border-border/50 p-4 sm:grid-cols-2 lg:grid-cols-5">
				<SummaryMetricCard
					label="Files Passed"
					value={s.filesPassed}
					hint={`${s.filesPassedPct.toFixed(2)}%`}
					icon={FileText}
					tone="text-sky-700 bg-sky-500/10"
				/>
				<SummaryMetricCard
					label="Files Failed"
					value={s.filesFailed}
					hint={`${s.filesFailedPct.toFixed(2)}%`}
					icon={FolderX}
					tone="text-red-700 bg-red-500/10"
					valueClassName="text-red-600"
				/>
				<SummaryMetricCard
					label="Records Passed"
					value={formatCount(s.recordsPassed)}
					hint={`${s.recordsPassedPct.toFixed(2)}%`}
					icon={CheckCircle2}
					tone="text-emerald-700 bg-emerald-500/10"
					valueClassName="text-emerald-700"
				/>
				<SummaryMetricCard
					label="Records Failed"
					value={formatCount(s.recordsFailed)}
					hint={`${s.recordsFailedPct.toFixed(2)}%`}
					icon={XCircle}
					tone="text-red-700 bg-red-500/10"
					valueClassName="text-red-600"
				/>
				<SummaryMetricCard
					label="Warnings"
					value={formatCount(s.warnings)}
					hint={`${s.warningsPct.toFixed(2)}%`}
					icon={AlertTriangle}
					tone="text-amber-700 bg-amber-500/10"
					valueClassName="text-amber-600"
				/>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function InternalFileValidationPanel() {
	const { validationRuns } = useCmsEdgeValidationRunsList();

	return (
		<CmsEdgeSectionPanel
			title="Internal File Validation"
			subtitle="File-level validation results before CMS submission."
			action={
				<div className="flex items-center gap-3">
					<PanelLink>View All Files</PanelLink>
					<Button
						variant="outline"
						size="icon"
						className="size-8 border-primary/30 text-primary"
						onClick={() => toast.success("Download queued")}
					>
						<Download className="size-3.5" />
					</Button>
				</div>
			}
			footer={
				<TablePagination
					label="Showing 1 to 5 of 12 files"
					pages={[1, 2, 3, "ellipsis", 12]}
				/>
			}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								File Name
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								File Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Reporting Period
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Submitted Date
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Records
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Status
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Errors
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Warnings
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Related Submission
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4 text-right")}
							>
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{(isMockEnabled()
							? CMS_EDGE_INTERNAL_FILE_VALIDATION
							: validationRuns
						).map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<Button
										variant="link"
										className={cn(
											CMS_EDGE_TABLE_LINK_CLASS,
											"whitespace-normal text-left"
										)}
									>
										{row.fileName}
									</Button>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									{row.fileType}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									{row.reportingPeriod}
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
								>
									{row.submittedDate}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums"
									)}
								>
									{formatCount(row.records)}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<StatusPill
										label={row.status}
										className={INTERNAL_FILE_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums text-red-600"
									)}
								>
									{formatCount(row.errors)}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums text-amber-600"
									)}
								>
									{formatCount(row.warnings)}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.relatedSubmission}
									</Button>
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "pr-4 text-right")}
								>
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-primary"
										onClick={() => toast.message(`View ${row.fileName}`)}
									>
										<Eye className="size-3.5" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function InternalRecordValidationPanel() {
	return (
		<CmsEdgeSectionPanel
			title="Internal Record Validation"
			subtitle="Record-level errors and warnings identified during pre-submission validation."
			action={
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						className="h-8 border-primary/30 text-primary"
						onClick={() => toast.success("Export queued")}
					>
						<Download className="mr-1.5 size-3.5" />
						View All Errors
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 border-primary/30 text-primary"
						onClick={() => toast.success("Export queued")}
					>
						<Download className="mr-1.5 size-3.5" />
						Export Errors
					</Button>
				</div>
			}
			footer={
				<>
					<TablePagination
						label="Showing 1 to 5 of 76,512 errors"
						pages={[1, 2, 3, "ellipsis", 8]}
					/>
					<div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50 px-4 py-2 text-[10px] text-muted-foreground">
						{(
							[
								"Open",
								"In Review",
								"Corrected",
								"Resubmitted",
								"Closed",
							] as const
						).map((status) => (
							<span key={status} className="inline-flex items-center gap-1.5">
								<span
									className={cn(
										"size-2 rounded-full",
										RESOLUTION_STATUS_DOT[status]
									)}
								/>
								{status}
							</span>
						))}
					</div>
				</>
			}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Record Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Error Code
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Error Description
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Record Count
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Severity
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Related File
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Resolution Status
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4 text-right")}
							>
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_INTERNAL_RECORD_VALIDATION.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									{row.recordType}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"font-mono font-medium"
									)}
								>
									{row.errorCode}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-muted-foreground"
									)}
								>
									{row.errorDescription}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums"
									)}
								>
									{formatCount(row.recordCount)}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<StatusPill
										label={row.severity}
										className={RECORD_SEVERITY_STYLES[row.severity]}
									/>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<Button
										variant="link"
										className={cn(
											CMS_EDGE_TABLE_LINK_CLASS,
											"whitespace-normal text-left"
										)}
									>
										{row.relatedFile}
									</Button>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<ResolutionStatus status={row.resolutionStatus} />
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "pr-4 text-right")}
								>
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-primary"
										onClick={() => toast.message(`View error ${row.errorCode}`)}
									>
										<Eye className="size-3.5" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ValidationTrendsPanel({
	data,
	title,
}: {
	data: typeof CMS_EDGE_INTERNAL_VALIDATION_TREND;
	title: string;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title={title}
			bodyClassName="flex min-h-0 flex-1 flex-col"
		>
			<div className="min-h-[260px] flex-1 border-t border-border/50 px-3 py-3">
				<ResponsiveContainer width="100%" height="100%" minHeight={220}>
					<LineChart
						data={data}
						margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
						<XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
						<YAxis
							tick={{ fontSize: 11 }}
							width={48}
							tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
						/>
						<RechartsTooltip
							formatter={(value: number) => formatCount(value)}
						/>
						<Legend
							iconSize={8}
							wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
						/>
						<Line
							type="monotone"
							dataKey="passed"
							name="Passed"
							stroke="#22c55e"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="failed"
							name="Failed / Errors"
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

function TopErrorCategoriesPanel() {
	return (
		<CmsEdgeSectionPanel title="Top Error Categories (This Period)">
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Error Category
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Errors
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4 text-right")}
							>
								% of Total
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_TOP_ERROR_CATEGORIES.map((row) => (
							<TableRow
								key={row.category}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									{row.category}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums"
									)}
								>
									{formatCount(row.errors)}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"pr-4 text-right tabular-nums"
									)}
								>
									{row.pct.toFixed(2)}%
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function InternalValidationView() {
	return (
		<div className="space-y-4">
			<InternalValidationSummaryPanel />
			<InternalFileValidationPanel />
			<InternalRecordValidationPanel />
			<div
				className={cn(
					"grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]",
					CMS_EDGE_SECTION_GAP
				)}
			>
				<ValidationTrendsPanel
					data={CMS_EDGE_INTERNAL_VALIDATION_TREND}
					title="Validation Trends (All Validations)"
				/>
				<TopErrorCategoriesPanel />
			</div>
		</div>
	);
}

function ExternalValidationSummaryPanel() {
	const s = CMS_EDGE_EXTERNAL_VALIDATION_SUMMARY;

	return (
		<CmsEdgeSectionPanel
			title="External Validation Summary (CMS)"
			subtitle="CMS-returned validation results for submitted EDGE files."
			action={
				<StatusPill
					label="Validated by CMS"
					className="border-violet-200 bg-violet-50 text-violet-800"
				/>
			}
			footer={
				<div className="border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
					<span>
						Total Files Submitted: {s.totalFilesSubmitted} | Total Records
						Returned: {formatCount(s.totalRecordsReturned)}
					</span>
					<span className="mt-1 block sm:mt-0 sm:float-right">
						Last Response: {s.lastResponse}
					</span>
				</div>
			}
		>
			<div className="grid gap-3 border-t border-border/50 p-4 sm:grid-cols-2 lg:grid-cols-5">
				<SummaryMetricCard
					label="Files Passed"
					value={s.filesPassed}
					hint={`${s.filesPassedPct.toFixed(2)}%`}
					icon={FileText}
					tone="text-sky-700 bg-sky-500/10"
				/>
				<SummaryMetricCard
					label="Files Failed"
					value={s.filesFailed}
					hint={`${s.filesFailedPct.toFixed(2)}%`}
					icon={FolderX}
					tone="text-red-700 bg-red-500/10"
					valueClassName="text-red-600"
				/>
				<SummaryMetricCard
					label="Records Passed"
					value={formatCount(s.recordsPassed)}
					hint={`${s.recordsPassedPct.toFixed(2)}%`}
					icon={CheckCircle2}
					tone="text-emerald-700 bg-emerald-500/10"
					valueClassName="text-emerald-700"
				/>
				<SummaryMetricCard
					label="Records Failed"
					value={formatCount(s.recordsFailed)}
					hint={`${s.recordsFailedPct.toFixed(2)}%`}
					icon={XCircle}
					tone="text-red-700 bg-red-500/10"
					valueClassName="text-red-600"
				/>
				<SummaryMetricCard
					label="Warnings"
					value={formatCount(s.warnings)}
					hint={`${s.warningsPct.toFixed(2)}%`}
					icon={AlertTriangle}
					tone="text-amber-700 bg-amber-500/10"
					valueClassName="text-amber-600"
				/>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ExternalFileValidationPanel() {
	return (
		<CmsEdgeSectionPanel
			title="External File Validation (CMS)"
			subtitle="File-level validation response files received from CMS."
			action={
				<div className="flex items-center gap-3">
					<PanelLink>View All Responses</PanelLink>
					<Button
						variant="outline"
						size="icon"
						className="size-8 border-primary/30 text-primary"
						onClick={() => toast.success("Download queued")}
					>
						<Download className="size-3.5" />
					</Button>
				</div>
			}
			footer={
				<TablePagination label="Showing 1 to 5 of 12 files" pages={[1, 2]} />
			}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Response Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								File/Report Name
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Related Submission
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Date Received
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Status
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Records
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Errors
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Warnings
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4 text-right")}
							>
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_EXTERNAL_FILE_VALIDATION.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									{row.responseType}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<Button
										variant="link"
										className={cn(
											CMS_EDGE_TABLE_LINK_CLASS,
											"whitespace-normal text-left"
										)}
									>
										{row.fileName}
									</Button>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.relatedSubmission}
									</Button>
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "tabular-nums")}
								>
									{row.dateReceived}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<StatusPill
										label={row.status}
										className={EXTERNAL_FILE_STATUS_STYLES[row.status]}
									/>
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums"
									)}
								>
									{formatCount(row.records)}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums text-red-600"
									)}
								>
									{formatCount(row.errors)}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums text-amber-600"
									)}
								>
									{formatCount(row.warnings)}
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "pr-4 text-right")}
								>
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-primary"
										onClick={() => toast.message(`View ${row.fileName}`)}
									>
										<Eye className="size-3.5" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ExternalRecordValidationPanel() {
	return (
		<CmsEdgeSectionPanel
			title="External Record Validation (CMS)"
			subtitle="Record-level errors and warnings returned by CMS validation."
			action={
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						className="h-8 border-primary/30 text-primary"
						onClick={() => toast.success("Export queued")}
					>
						<Download className="mr-1.5 size-3.5" />
						View All Errors
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 border-primary/30 text-primary"
						onClick={() => toast.success("Export queued")}
					>
						<Download className="mr-1.5 size-3.5" />
						Export Errors
					</Button>
				</div>
			}
			footer={
				<>
					<TablePagination
						label="Showing 1 to 5 of 76,512 errors"
						pages={[1, 2, 3, "ellipsis", 8]}
					/>
					<div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50 px-4 py-2 text-[10px] text-muted-foreground">
						{(
							[
								"Open",
								"In Review",
								"Corrected",
								"Resubmitted",
								"Closed",
							] as const
						).map((status) => (
							<span key={status} className="inline-flex items-center gap-1.5">
								<span
									className={cn(
										"size-2 rounded-full",
										RESOLUTION_STATUS_DOT[status]
									)}
								/>
								{status}
							</span>
						))}
					</div>
				</>
			}
		>
			<CmsEdgeTableScroll className="border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Record Type
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Error Code
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Error Description
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "text-right")}
							>
								Record Count
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Severity
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Related File
							</TableHead>
							<TableHead className={CMS_EDGE_TABLE_HEAD_CLASS}>
								Resolution Status
							</TableHead>
							<TableHead
								className={cn(CMS_EDGE_TABLE_HEAD_CLASS, "pr-4 text-right")}
							>
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{CMS_EDGE_EXTERNAL_RECORD_VALIDATION.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									{row.recordType}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"font-mono font-medium"
									)}
								>
									{row.errorCode}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-muted-foreground"
									)}
								>
									{row.errorDescription}
								</TableCell>
								<TableCell
									className={cn(
										CMS_EDGE_TABLE_CELL_CLASS,
										"text-right tabular-nums"
									)}
								>
									{formatCount(row.recordCount)}
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<StatusPill
										label={row.severity}
										className={RECORD_SEVERITY_STYLES[row.severity]}
									/>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<Button
										variant="link"
										className={cn(
											CMS_EDGE_TABLE_LINK_CLASS,
											"whitespace-normal text-left"
										)}
									>
										{row.relatedFile}
									</Button>
								</TableCell>
								<TableCell className={CMS_EDGE_TABLE_CELL_CLASS}>
									<ResolutionStatus status={row.resolutionStatus} />
								</TableCell>
								<TableCell
									className={cn(CMS_EDGE_TABLE_CELL_CLASS, "pr-4 text-right")}
								>
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-primary"
										onClick={() => toast.message(`View error ${row.errorCode}`)}
									>
										<Eye className="size-3.5" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

const EXTERNAL_QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
	"eq-1": Download,
	"eq-2": FileSearch,
	"eq-3": Download,
	"eq-4": Scale,
	"eq-5": BookOpen,
	"eq-6": History,
};

function ExternalQuickActionsPanel() {
	const maxCount = Math.max(
		...CMS_EDGE_EXTERNAL_ERROR_BREAKDOWN.map((item) => item.count)
	);

	return (
		<CmsEdgeSectionPanel title="Quick Actions & Reports">
			<div className="grid gap-4 border-t border-border/50 p-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
				<div className="rounded-lg border border-border/60 bg-muted/20 p-3">
					<p className="text-xs font-semibold text-foreground">Total Errors</p>
					<div className="mt-3 space-y-2.5">
						{CMS_EDGE_EXTERNAL_ERROR_BREAKDOWN.map((item) => (
							<div key={item.label}>
								<div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
									<span className="truncate text-muted-foreground">
										{item.label}
									</span>
									<span className="shrink-0 tabular-nums font-medium text-foreground">
										{formatCount(item.count)}
									</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full"
										style={{
											width: `${(item.count / maxCount) * 100}%`,
											backgroundColor: item.color,
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{CMS_EDGE_EXTERNAL_QUICK_ACTIONS.map((action) => {
						const Icon =
							EXTERNAL_QUICK_ACTION_ICONS[action.id] ?? ClipboardList;
						return (
							<button
								key={action.id}
								type="button"
								className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/30"
								onClick={() => toast.message(action.title)}
							>
								<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
									<Icon className="size-4" aria-hidden />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-semibold text-foreground">
										{action.title}
									</p>
									<p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
										{action.description}
									</p>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</CmsEdgeSectionPanel>
	);
}

function ExternalValidationView() {
	return (
		<div className="space-y-4">
			<ExternalValidationSummaryPanel />
			<ExternalFileValidationPanel />
			<ExternalRecordValidationPanel />
			<ExternalQuickActionsPanel />
		</div>
	);
}

export function CmsEdgeValidationsTab() {
	const [subTab, setSubTab] = useState<ValidationSubTab>("internal");

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<Tabs
				value={subTab}
				onValueChange={(v) => setSubTab(v as ValidationSubTab)}
			>
				<div className="rounded-lg border border-border/70 bg-card shadow-sm">
					<TabsList className="inline-flex h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0">
						<TabsTrigger value="internal" className={VALIDATION_SUB_TAB_CLASS}>
							Internal Validation (Pre-Submission)
						</TabsTrigger>
						<TabsTrigger value="external" className={VALIDATION_SUB_TAB_CLASS}>
							External Validation (CMS)
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="internal" className="mt-4 space-y-0">
					<InternalValidationView />
				</TabsContent>
				<TabsContent value="external" className="mt-4 space-y-0">
					<ExternalValidationView />
				</TabsContent>
			</Tabs>

			<CmsEdgePageFooter />
		</div>
	);
}

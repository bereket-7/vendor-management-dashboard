"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
	ArrowDownRight,
	ArrowUpRight,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Download,
	FileText,
	Inbox,
	Info,
	type LucideIcon,
	Minus,
	RotateCcw,
	Search,
	XCircle,
} from "lucide-react";
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
	MEDICARE_PART_D_COMPLIANCE,
	MEDICARE_PART_D_COMPLIANCE_STATUS_STYLES,
	MEDICARE_PART_D_DOCUMENTS,
	MEDICARE_PART_D_ERROR_SEVERITY_FILTER,
	MEDICARE_PART_D_ERROR_SEVERITY_STYLES,
	MEDICARE_PART_D_ERROR_TYPE_FILTER,
	MEDICARE_PART_D_KPIS,
	MEDICARE_PART_D_RECONCILIATION_STATUS_STYLES,
	MEDICARE_PART_D_RESPONSES,
	MEDICARE_PART_D_RESPONSE_STATUS_STYLES,
	MEDICARE_PART_D_SUBMISSION_STATUS_STYLES,
	MEDICARE_PART_D_VALIDATION_ERRORS,
	type MedicarePartDErrorSeverity,
	useMedicareReportingPartDKpisQuery,
	useMedicareReportingPartDReconciliationsQuery,
	useMedicareReportingPartDResponsesQuery,
	useMedicareReportingPartDSubmissionsList,
} from "@/features/admin/features/claim-encounter/medicare-reporting/feature/queries/useMedicareReportingQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { cn } from "@/lib/utils";

const PAGE_STACK = "space-y-5";
const SECTION_GAP = "gap-4";
const TABLE_HEAD =
	"h-9 bg-muted/30 px-4 text-[11px] font-semibold text-foreground";
const TABLE_CELL = "px-4 py-2.5";

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

function DeltaHint({ delta }: { delta: number }) {
	if (delta === 0) {
		return (
			<span className="inline-flex items-center gap-0.5 text-muted-foreground">
				<Minus className="size-3" />— vs Prior Period
			</span>
		);
	}

	const positive = delta > 0;
	const Icon = positive ? ArrowUpRight : ArrowDownRight;
	const tone = positive ? "text-emerald-700" : "text-red-600";
	const sign = positive ? "+" : "";

	return (
		<span className={cn("inline-flex items-center gap-0.5", tone)}>
			<Icon className="size-3" />
			{sign}
			{Math.abs(delta)} vs Prior Period
		</span>
	);
}

function PartDMetricCard({
	label,
	value,
	hint,
	icon: Icon,
	tone = "text-primary bg-primary/10",
	valueClassName,
	footer,
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	icon: LucideIcon;
	tone?: string;
	valueClassName?: string;
	footer?: ReactNode;
}) {
	return (
		<div className="rounded-lg border border-border/70 bg-card p-2.5 shadow-sm">
			<div className="flex items-start gap-2.5">
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
						<div className="mt-0.5 text-[10px] text-muted-foreground">
							{hint}
						</div>
					) : null}
					{footer ? <div className="mt-1.5">{footer}</div> : null}
				</div>
			</div>
		</div>
	);
}

function PartDKpiRow({
	kpis = MEDICARE_PART_D_KPIS,
}: {
	kpis?: typeof MEDICARE_PART_D_KPIS;
}) {
	const k = kpis;

	return (
		<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
			<PartDMetricCard
				label="PDE Files Submitted"
				value={k.submitted}
				hint={<DeltaHint delta={k.submittedDelta} />}
				icon={FileText}
				tone="text-violet-700 bg-violet-500/10"
			/>
			<PartDMetricCard
				label="PDE Files Accepted"
				value={k.accepted}
				hint={<DeltaHint delta={k.acceptedDelta} />}
				icon={CheckCircle2}
				tone="text-emerald-700 bg-emerald-500/10"
				valueClassName="text-emerald-700"
			/>
			<PartDMetricCard
				label="PDE Files Rejected"
				value={k.rejected}
				hint={<DeltaHint delta={k.rejectedDelta} />}
				icon={XCircle}
				tone="text-red-700 bg-red-500/10"
				valueClassName="text-red-600"
			/>
			<PartDMetricCard
				label="PDE Files Pending"
				value={k.pending}
				hint={<DeltaHint delta={k.pendingDelta} />}
				icon={Clock3}
				tone="text-amber-700 bg-amber-500/10"
				valueClassName="text-amber-600"
			/>
			<PartDMetricCard
				label="Last CMS Response"
				value={
					<span className="text-xs font-semibold">{k.lastCmsResponseAt}</span>
				}
				hint={
					<Button
						variant="link"
						className={cn(CMS_EDGE_TABLE_LINK_CLASS, "h-auto p-0")}
					>
						{k.lastCmsResponseFile}
					</Button>
				}
				icon={Inbox}
				tone="text-sky-700 bg-sky-500/10"
				footer={
					<StatusPill
						label={k.lastCmsResponseStatus}
						className={
							MEDICARE_PART_D_RESPONSE_STATUS_STYLES[k.lastCmsResponseStatus]
						}
					/>
				}
			/>
		</div>
	);
}

function TablePaginationFooter({
	viewAllLabel,
	showing,
	total,
}: {
	viewAllLabel: string;
	showing: number;
	total: number;
}) {
	return (
		<div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
			<PanelLink>{viewAllLabel}</PanelLink>
			<div className="flex items-center gap-2">
				<span>
					Showing 1 to {showing} of {total} entries
				</span>
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
					<Button variant="outline" size="icon" className="size-7">
						<ChevronRight className="size-3.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function RowActions({ label }: { label: string }) {
	return (
		<div className="inline-flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="size-7 text-primary"
				onClick={() => toast.success(`Download ${label}`)}
			>
				<Download className="size-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="size-7 text-muted-foreground"
				onClick={() => toast.message(label)}
			>
				<Info className="size-3.5" />
			</Button>
		</div>
	);
}

function PdeSubmissionHistoryPanel({
	submissions = [],
}: {
	submissions?: Array<{
		id: string;
		fileName: string;
		submissionType: string;
		pbp: string;
		submittedOn: string;
		recordCount: number;
		status: keyof typeof MEDICARE_PART_D_SUBMISSION_STATUS_STYLES;
	}>;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="PDE Submission History"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<TablePaginationFooter
					viewAllLabel="View All Submissions"
					showing={5}
					total={24}
				/>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[880px]")}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Submission ID</TableHead>
							<TableHead className={TABLE_HEAD}>File Name</TableHead>
							<TableHead className={TABLE_HEAD}>Submission Type</TableHead>
							<TableHead className={TABLE_HEAD}>PBP</TableHead>
							<TableHead className={TABLE_HEAD}>Submitted On</TableHead>
							<TableHead className={cn(TABLE_HEAD, "text-right")}>
								Record Count
							</TableHead>
							<TableHead className={TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-4 text-right")}>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{submissions.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.id}
									</Button>
								</TableCell>
								<TableCell className={TABLE_CELL}>
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
								<TableCell className={TABLE_CELL}>
									{row.submissionType}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.pbp}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.submittedOn}
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(row.recordCount)}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={
											MEDICARE_PART_D_SUBMISSION_STATUS_STYLES[row.status]
										}
									/>
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "pr-4 text-right")}>
									<RowActions label={row.fileName} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function CmsResponseFilesPanel({
	rows = MEDICARE_PART_D_RESPONSES,
}: {
	rows?: typeof MEDICARE_PART_D_RESPONSES;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="CMS Response Files"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<TablePaginationFooter
					viewAllLabel="View All Responses"
					showing={rows.length}
					total={rows.length}
				/>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Response File</TableHead>
							<TableHead className={TABLE_HEAD}>Received On</TableHead>
							<TableHead className={TABLE_HEAD}>PDE Submission ID</TableHead>
							<TableHead className={TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-4 text-right")}>
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
								<TableCell className={TABLE_CELL}>
									<Button
										variant="link"
										className={cn(
											CMS_EDGE_TABLE_LINK_CLASS,
											"whitespace-normal text-left"
										)}
									>
										{row.responseFile}
									</Button>
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.receivedOn}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.pdeSubmission}
									</Button>
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={
											MEDICARE_PART_D_RESPONSE_STATUS_STYLES[row.status]
										}
									/>
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "pr-4 text-right")}>
									<RowActions label={row.responseFile} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ValidationErrorDetailsPanel() {
	const [severity, setSeverity] = useState<string>("All");
	const [errorType, setErrorType] = useState<string>("All");
	const [codeSearch, setCodeSearch] = useState("");

	const filtered = useMemo(() => {
		return MEDICARE_PART_D_VALIDATION_ERRORS.filter((row) => {
			if (severity !== "All" && row.severity !== severity) return false;
			if (errorType !== "All" && row.errorType !== errorType) return false;
			if (
				codeSearch &&
				!row.code.toLowerCase().includes(codeSearch.toLowerCase())
			)
				return false;
			return true;
		});
	}, [severity, errorType, codeSearch]);

	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Validation / Error Details"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<TablePaginationFooter
					viewAllLabel="View All Errors"
					showing={filtered.length}
					total={42}
				/>
			}
		>
			<div className="flex flex-wrap items-end gap-2 border-t border-border/50 px-4 py-3">
				<div className="space-y-1">
					<label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Error Severity
					</label>
					<Select value={severity} onValueChange={setSeverity}>
						<SelectTrigger className="h-8 w-[120px] border-border/70 bg-card text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MEDICARE_PART_D_ERROR_SEVERITY_FILTER.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Error Type
					</label>
					<Select value={errorType} onValueChange={setErrorType}>
						<SelectTrigger className="h-8 w-[140px] border-border/70 bg-card text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MEDICARE_PART_D_ERROR_TYPE_FILTER.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Error Code
					</label>
					<div className="relative">
						<Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={codeSearch}
							onChange={(event) => setCodeSearch(event.target.value)}
							placeholder="Search code…"
							className="h-8 w-[140px] pl-8 text-xs"
						/>
					</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="h-8 gap-1.5 text-xs"
					onClick={() => {
						setSeverity("All");
						setErrorType("All");
						setCodeSearch("");
					}}
				>
					<RotateCcw className="size-3.5" />
					Reset
				</Button>
			</div>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[920px]")}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Error Code</TableHead>
							<TableHead className={TABLE_HEAD}>Error Description</TableHead>
							<TableHead className={TABLE_HEAD}>Error Type</TableHead>
							<TableHead className={TABLE_HEAD}>Severity</TableHead>
							<TableHead className={TABLE_HEAD}>PDE Submission</TableHead>
							<TableHead className={cn(TABLE_HEAD, "text-right")}>
								Records Impacted
							</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-4 text-right")}>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={cn(TABLE_CELL, "font-mono font-medium")}>
									{row.code}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "text-muted-foreground")}>
									{row.description}
								</TableCell>
								<TableCell className={TABLE_CELL}>{row.errorType}</TableCell>
								<TableCell
									className={cn(
										TABLE_CELL,
										MEDICARE_PART_D_ERROR_SEVERITY_STYLES[
											row.severity as MedicarePartDErrorSeverity
										]
									)}
								>
									{row.severity}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<Button variant="link" className={CMS_EDGE_TABLE_LINK_CLASS}>
										{row.pdeSubmission}
									</Button>
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(row.recordsImpacted)}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "pr-4 text-right")}>
									<RowActions label={row.code} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ReconciliationStatusPanel({
	rows = [],
}: {
	rows?: Array<{
		id: string;
		type: string;
		pbp: string;
		recordsSubmitted: number;
		cmsAccepted: number;
		variance: number;
		status: keyof typeof MEDICARE_PART_D_RECONCILIATION_STATUS_STYLES;
		lastReconciled: string;
	}>;
}) {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Reconciliation Status"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<TablePaginationFooter
					viewAllLabel="View All Reconciliations"
					showing={5}
					total={12}
				/>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[880px]")}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Reconciliation Type</TableHead>
							<TableHead className={TABLE_HEAD}>PBP</TableHead>
							<TableHead className={cn(TABLE_HEAD, "text-right")}>
								Records Submitted
							</TableHead>
							<TableHead className={cn(TABLE_HEAD, "text-right")}>
								CMS Accepted
							</TableHead>
							<TableHead className={cn(TABLE_HEAD, "text-right")}>
								Variance
							</TableHead>
							<TableHead className={TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-4")}>
								Last Reconciled
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={cn(TABLE_CELL, "font-medium")}>
									{row.type}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.pbp}
								</TableCell>
								<TableCell
									className={cn(TABLE_CELL, "text-right tabular-nums")}
								>
									{formatCount(row.recordsSubmitted)}
								</TableCell>
								<TableCell
									className={cn(
										TABLE_CELL,
										"text-right tabular-nums text-emerald-700"
									)}
								>
									{formatCount(row.cmsAccepted)}
								</TableCell>
								<TableCell
									className={cn(
										TABLE_CELL,
										"text-right tabular-nums",
										row.variance > 0
											? "text-amber-600"
											: "text-muted-foreground"
									)}
								>
									{formatCount(row.variance)}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={
											MEDICARE_PART_D_RECONCILIATION_STATUS_STYLES[row.status]
										}
									/>
								</TableCell>
								<TableCell
									className={cn(
										TABLE_CELL,
										"pr-4 tabular-nums text-muted-foreground"
									)}
								>
									{row.lastReconciled}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function ComplianceRequirementsPanel() {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Compliance & Requirements"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<TablePaginationFooter
					viewAllLabel="View All Requirements"
					showing={5}
					total={14}
				/>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={cn(CMS_EDGE_TABLE_CLASS, "min-w-[880px]")}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Requirement</TableHead>
							<TableHead className={TABLE_HEAD}>Description</TableHead>
							<TableHead className={TABLE_HEAD}>Frequency</TableHead>
							<TableHead className={TABLE_HEAD}>Due Date</TableHead>
							<TableHead className={TABLE_HEAD}>Status</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-4 text-right")}>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MEDICARE_PART_D_COMPLIANCE.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={cn(TABLE_CELL, "font-medium")}>
									{row.requirement}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "text-muted-foreground")}>
									{row.description}
								</TableCell>
								<TableCell className={TABLE_CELL}>{row.frequency}</TableCell>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.dueDate}
								</TableCell>
								<TableCell className={TABLE_CELL}>
									<StatusPill
										label={row.status}
										className={
											MEDICARE_PART_D_COMPLIANCE_STATUS_STYLES[row.status]
										}
									/>
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "pr-4 text-right")}>
									<RowActions label={row.requirement} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CmsEdgeTableScroll>
		</CmsEdgeSectionPanel>
	);
}

function DocumentsPanel() {
	return (
		<CmsEdgeSectionPanel
			className="flex h-full min-h-0 flex-col"
			title="Documents"
			bodyClassName="flex min-h-0 flex-1 flex-col pb-4"
			footer={
				<TablePaginationFooter
					viewAllLabel="View All Documents"
					showing={5}
					total={28}
				/>
			}
		>
			<CmsEdgeTableScroll className="min-h-0 flex-1 border-t border-border/50">
				<Table
					containerClassName={CMS_EDGE_TABLE_CONTAINER}
					className={CMS_EDGE_TABLE_CLASS}
				>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className={TABLE_HEAD}>Document Name</TableHead>
							<TableHead className={TABLE_HEAD}>Document Type</TableHead>
							<TableHead className={TABLE_HEAD}>Reporting Period</TableHead>
							<TableHead className={TABLE_HEAD}>Uploaded On</TableHead>
							<TableHead className={TABLE_HEAD}>Size</TableHead>
							<TableHead className={cn(TABLE_HEAD, "pr-4 text-right")}>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MEDICARE_PART_D_DOCUMENTS.map((row) => (
							<TableRow
								key={row.id}
								className="border-b border-border/40 hover:bg-muted/20"
							>
								<TableCell className={TABLE_CELL}>
									<Button
										variant="link"
										className={cn(
											CMS_EDGE_TABLE_LINK_CLASS,
											"whitespace-normal text-left"
										)}
									>
										{row.name}
									</Button>
								</TableCell>
								<TableCell className={TABLE_CELL}>{row.documentType}</TableCell>
								<TableCell className={TABLE_CELL}>
									{row.reportingPeriod}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "tabular-nums")}>
									{row.uploadedOn}
								</TableCell>
								<TableCell
									className={cn(
										TABLE_CELL,
										"tabular-nums text-muted-foreground"
									)}
								>
									{row.size}
								</TableCell>
								<TableCell className={cn(TABLE_CELL, "pr-4 text-right")}>
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-primary"
										onClick={() => toast.success(`Download ${row.name}`)}
									>
										<Download className="size-3.5" />
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

export function MedicarePartDTab({
	reportingPeriod,
}: { reportingPeriod?: string } = {}) {
	const kpisQuery = useMedicareReportingPartDKpisQuery(reportingPeriod);
	const { partDSubmissions, isLoading: submissionsLoading } =
		useMedicareReportingPartDSubmissionsList(reportingPeriod);
	const reconQuery =
		useMedicareReportingPartDReconciliationsQuery(reportingPeriod);
	const responsesQuery =
		useMedicareReportingPartDResponsesQuery(reportingPeriod);

	return (
		<div className={PAGE_STACK}>
			{kpisQuery.isLoading ||
			submissionsLoading ||
			reconQuery.isLoading ||
			responsesQuery.isLoading ? (
				<p className="px-4 py-4 text-center text-sm text-muted-foreground">
					Loading Part D…
				</p>
			) : null}
			<PartDKpiRow kpis={kpisQuery.data ?? MEDICARE_PART_D_KPIS} />

			<div
				className={cn(
					"grid grid-cols-1 items-stretch xl:grid-cols-2",
					SECTION_GAP
				)}
			>
				<PdeSubmissionHistoryPanel submissions={partDSubmissions} />
				<CmsResponseFilesPanel
					rows={(responsesQuery.data?.items ?? []) as typeof MEDICARE_PART_D_RESPONSES}
				/>
			</div>

			<div
				className={cn(
					"grid grid-cols-1 items-stretch xl:grid-cols-2",
					SECTION_GAP
				)}
			>
				<ValidationErrorDetailsPanel />
				<ReconciliationStatusPanel
					rows={reconQuery.data?.items ?? []}
				/>
			</div>

			<div
				className={cn(
					"grid grid-cols-1 items-stretch xl:grid-cols-2",
					SECTION_GAP
				)}
			>
				<ComplianceRequirementsPanel />
				<DocumentsPanel />
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}

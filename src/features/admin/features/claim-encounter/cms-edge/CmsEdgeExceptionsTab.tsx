"use client";

import { useState } from "react";

import {
	AlertCircle,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock3,
	FilePenLine,
	type LucideIcon,
	Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgePageFooter,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_EXCEPTION_DATASETS,
	CMS_EDGE_EXCEPTION_ERROR_TYPES,
	CMS_EDGE_EXCEPTION_STATUSES,
	CMS_EDGE_REPORTING_PERIODS,
	CORRECTION_STATUS_STYLES,
	type CorrectionStatus,
	EXCEPTION_SEVERITY_STYLES,
	EXCEPTION_STATUS_STYLES,
	type ExceptionDataset,
	type ExceptionErrorType,
	type ExceptionSeverity,
	type ExceptionStatus,
	VOID_STATUS_STYLES,
	useCmsEdgeExceptionWorkbench,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const EXCEPTION_DETAIL_BASE =
	"/admin/claim-encounter/regulatory/cms-edge-reporting/exceptions";

const PANEL_SHADOW =
	"rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const STAT_CARD_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";

const STAT_CARD_SHADOW_HOVER =
	"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)]";

const compactFieldClass = cn(
	"h-8 rounded-sm border border-border bg-background text-xs shadow-none transition-colors duration-200",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

const th =
	"h-9 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-3 py-2.5 text-[12px] align-middle text-foreground";

type WorkbenchTab = "exceptions" | "corrections" | "voids";

const WORKBENCH_TABS: { id: WorkbenchTab; label: string }[] = [
	{ id: "exceptions", label: "Exceptions" },
	{ id: "corrections", label: "Corrections" },
	{ id: "voids", label: "Voids & Replacements" },
];

const KPI_META: {
	key:
		| "openExceptions"
		| "critical"
		| "correctionsDrafted"
		| "readyForResubmission";
	label: string;
	hint: string;
	icon: LucideIcon;
	well: string;
	valueTone: string;
	accent: string;
	ring: string;
}[] = [
	{
		key: "openExceptions",
		label: "Open Exceptions",
		hint: "Active queue",
		icon: AlertCircle,
		well: "bg-sky-600",
		valueTone: "text-sky-700 dark:text-sky-300",
		accent: "from-sky-500/80 to-sky-400/40",
		ring: "ring-sky-500/20",
	},
	{
		key: "critical",
		label: "Critical",
		hint: "Highest severity",
		icon: AlertCircle,
		well: "bg-red-600",
		valueTone: "text-red-700 dark:text-red-300",
		accent: "from-red-500/80 to-red-400/40",
		ring: "ring-red-500/20",
	},
	{
		key: "correctionsDrafted",
		label: "Corrections Drafted",
		hint: "In progress",
		icon: FilePenLine,
		well: "bg-blue-600",
		valueTone: "text-blue-700 dark:text-blue-300",
		accent: "from-blue-500/80 to-blue-400/40",
		ring: "ring-blue-500/20",
	},
	{
		key: "readyForResubmission",
		label: "Ready for Resubmission",
		hint: "Approved & queued",
		icon: Send,
		well: "bg-emerald-600",
		valueTone: "text-emerald-700 dark:text-emerald-300",
		accent: "from-emerald-500/80 to-emerald-400/40",
		ring: "ring-emerald-500/20",
	},
];

const QUEUE_META: {
	key: "draft" | "awaitingReview" | "approved" | "resubmitted";
	label: string;
	icon: LucideIcon;
	well: string;
}[] = [
	{
		key: "draft",
		label: "Draft",
		icon: FilePenLine,
		well: "bg-sky-700",
	},
	{
		key: "awaitingReview",
		label: "Awaiting Review",
		icon: Clock3,
		well: "bg-amber-600",
	},
	{
		key: "approved",
		label: "Approved",
		icon: CheckCircle2,
		well: "bg-emerald-600",
	},
	{
		key: "resubmitted",
		label: "Resubmitted",
		icon: Send,
		well: "bg-violet-600",
	},
];

function Pill({ label, className }: { label: string; className: string }) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold",
				className
			)}
		>
			{label}
		</span>
	);
}

function ExceptionFilterBar({
	reportingPeriod,
	dataset,
	errorType,
	status,
	onReportingPeriodChange,
	onDatasetChange,
	onErrorTypeChange,
	onStatusChange,
}: {
	reportingPeriod: string;
	dataset: ExceptionDataset | "all";
	errorType: ExceptionErrorType | "all";
	status: ExceptionStatus | "all";
	onReportingPeriodChange: (value: string) => void;
	onDatasetChange: (value: ExceptionDataset | "all") => void;
	onErrorTypeChange: (value: ExceptionErrorType | "all") => void;
	onStatusChange: (value: ExceptionStatus | "all") => void;
}) {
	return (
		<section className={cn(PANEL_SHADOW, "px-3 py-2.5")}>
			<div className="flex flex-wrap items-center gap-2">
				<Select value={reportingPeriod} onValueChange={onReportingPeriodChange}>
					<SelectTrigger className={cn(compactFieldClass, "w-[140px]")}>
						<SelectValue placeholder="Period" />
					</SelectTrigger>
					<SelectContent>
						{CMS_EDGE_REPORTING_PERIODS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label.split(" (")[0]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={dataset}
					onValueChange={(value) =>
						onDatasetChange(value as ExceptionDataset | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[170px]")}>
						<SelectValue placeholder="Dataset" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All datasets</SelectItem>
						{CMS_EDGE_EXCEPTION_DATASETS.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={errorType}
					onValueChange={(value) =>
						onErrorTypeChange(value as ExceptionErrorType | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[150px]")}>
						<SelectValue placeholder="Error type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All error types</SelectItem>
						{CMS_EDGE_EXCEPTION_ERROR_TYPES.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={status}
					onValueChange={(value) =>
						onStatusChange(value as ExceptionStatus | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[140px]")}>
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{CMS_EDGE_EXCEPTION_STATUSES.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</section>
	);
}

function ExceptionKpiCards({
	onOpenExceptions,
	onCritical,
	onCorrections,
	counts,
}: {
	onOpenExceptions: () => void;
	onCritical: () => void;
	onCorrections: () => void;
	counts: {
		openExceptions: number;
		critical: number;
		correctionsDrafted: number;
		readyForResubmission: number;
	};
}) {
	return (
		<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{KPI_META.map((kpi) => {
				const Icon = kpi.icon;
				const value = counts[kpi.key];

				return (
					<button
						key={kpi.key}
						type="button"
						onClick={() => {
							if (kpi.key === "openExceptions") onOpenExceptions();
							else if (kpi.key === "critical") onCritical();
							else onCorrections();
						}}
						className={cn(
							"group relative overflow-hidden rounded-sm border border-border/70 bg-card p-4 text-left transition-all duration-200 ease-out",
							STAT_CARD_SHADOW,
							STAT_CARD_SHADOW_HOVER,
							"hover:-translate-y-px hover:border-border"
						)}
					>
						<span
							aria-hidden
							className={cn(
								"absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
								kpi.accent
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
										kpi.valueTone
									)}
								>
									{formatCount(value)}
								</p>
								<p className="mt-1.5 text-xs text-muted-foreground">
									{kpi.hint}
								</p>
							</div>
							<span
								className={cn(
									"flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm",
									kpi.well
								)}
							>
								<Icon className="size-[18px] text-white" />
							</span>
						</div>
					</button>
				);
			})}
		</div>
	);
}

function CorrectionQueue({
	queue,
}: {
	queue: {
		draft: number;
		awaitingReview: number;
		approved: number;
		resubmitted: number;
	};
}) {
	return (
		<section className="space-y-3">
			<div className="px-0.5">
				<p className="text-sm font-semibold text-foreground">
					Correction queue
				</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					Draft through resubmit pipeline
				</p>
			</div>

			<div className={cn(PANEL_SHADOW, "overflow-hidden")}>
				<div className="grid sm:grid-cols-2 xl:grid-cols-4">
					{QUEUE_META.map((item, index) => {
						const Icon = item.icon;
						const isLast = index === QUEUE_META.length - 1;

						return (
							<div
								key={item.key}
								className={cn(
									"flex items-center gap-4 px-5 py-5",
									!isLast &&
										"border-b border-border/40 sm:border-b-0 xl:border-r"
								)}
							>
								<span
									className={cn(
										"flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm",
										item.well
									)}
								>
									<Icon className="size-5 text-white" />
								</span>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground">
										{item.label}
									</p>
									<p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
										{formatCount(queue[item.key])}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

function TableFooter({ count, noun }: { count: number; noun: string }) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
			<span>
				Showing {count === 0 ? 0 : 1}–{count} of {count} {noun}
			</span>
			<div className="flex items-center gap-1">
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronsLeft className="size-3.5" />
				</Button>
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronLeft className="size-3.5" />
				</Button>
				<span className="px-2 tabular-nums">Page 1 of 1</span>
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronRight className="size-3.5" />
				</Button>
				<Button variant="outline" size="icon" className="size-7" disabled>
					<ChevronsRight className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}

function exceptionActionLabel(
	severity: ExceptionSeverity,
	status: ExceptionStatus
) {
	if (status === "Open" && severity === "Critical") return "Review";
	if (status === "Open") return "Assign";
	if (status === "In Progress") return "Create Correction";
	return "View";
}

export function CmsEdgeExceptionsTab() {
	const router = useRouter();
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const [dataset, setDataset] = useState<ExceptionDataset | "all">("all");
	const [errorType, setErrorType] = useState<ExceptionErrorType | "all">("all");
	const [status, setStatus] = useState<ExceptionStatus | "all">("Open");
	const [workbench, setWorkbench] = useState<WorkbenchTab>("exceptions");
	const [severityFilter, setSeverityFilter] = useState<
		ExceptionSeverity | "all"
	>("all");

	const {
		exceptions: exceptionRows,
		corrections: correctionRows,
		voids: voidRows,
		kpis,
		correctionQueue,
		isLoading,
		isError,
	} = useCmsEdgeExceptionWorkbench({
		reportingPeriod,
		dataset,
		errorType,
		status,
		severity: severityFilter,
	});

	const hasFilters =
		dataset !== "all" ||
		errorType !== "all" ||
		status !== "all" ||
		severityFilter !== "all";

	const activeCount =
		workbench === "exceptions"
			? exceptionRows.length
			: workbench === "corrections"
				? correctionRows.length
				: voidRows.length;

	function openException(id: string) {
		router.push(`${EXCEPTION_DETAIL_BASE}/${encodeURIComponent(id)}`);
	}

	function openExceptionForRecord(recordId: string) {
		const match = exceptionRows.find((row) => row.recordId === recordId);
		if (match) {
			openException(match.id);
			return;
		}
		toast.message(`No exception linked to ${recordId}`);
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<ExceptionFilterBar
				reportingPeriod={reportingPeriod}
				dataset={dataset}
				errorType={errorType}
				status={status}
				onReportingPeriodChange={setReportingPeriod}
				onDatasetChange={setDataset}
				onErrorTypeChange={setErrorType}
				onStatusChange={(value) => {
					setSeverityFilter("all");
					setStatus(value);
				}}
			/>

			<ExceptionKpiCards
				counts={kpis}
				onOpenExceptions={() => {
					setWorkbench("exceptions");
					setSeverityFilter("all");
					setStatus("Open");
				}}
				onCritical={() => {
					setWorkbench("exceptions");
					setStatus("all");
					setSeverityFilter("Critical");
				}}
				onCorrections={() => {
					setWorkbench("corrections");
					setSeverityFilter("all");
				}}
			/>

			{isError ? (
				<p className="text-xs text-destructive">Failed to load live data</p>
			) : null}
			{isLoading ? (
				<p className="text-xs text-muted-foreground">Loading…</p>
			) : null}

			<CorrectionQueue queue={correctionQueue} />

			<section className={cn(PANEL_SHADOW, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3">
					<div className="flex items-center gap-0 overflow-x-auto">
						{WORKBENCH_TABS.map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => setWorkbench(tab.id)}
								className={cn(
									"relative whitespace-nowrap px-3 py-2.5 text-xs font-semibold transition-colors",
									workbench === tab.id
										? "text-primary"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{tab.label}
								{workbench === tab.id ? (
									<span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
								) : null}
							</button>
						))}
					</div>
					<div className="flex items-center gap-1.5 py-2">
						{hasFilters ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2.5 text-xs text-muted-foreground"
								onClick={() => {
									setDataset("all");
									setErrorType("all");
									setStatus("all");
									setSeverityFilter("all");
								}}
							>
								Clear
							</Button>
						) : null}
						<p className="pr-1 text-xs tabular-nums text-muted-foreground">
							{activeCount.toLocaleString()} rows
						</p>
					</div>
				</div>

				{workbench === "exceptions" ? (
					<>
						<CmsEdgeTableScroll>
							<Table
								containerClassName={CMS_EDGE_TABLE_CONTAINER}
								className="w-full min-w-[1180px] text-xs"
							>
								<TableHeader>
									<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
										<TableHead className={cn(th, "w-12 pl-4 text-center")}>
											#
										</TableHead>
										<TableHead className={th}>Exception ID</TableHead>
										<TableHead className={th}>Dataset</TableHead>
										<TableHead className={th}>Record ID</TableHead>
										<TableHead className={th}>Error Code</TableHead>
										<TableHead className={th}>Description</TableHead>
										<TableHead className={th}>Severity</TableHead>
										<TableHead className={th}>Owner</TableHead>
										<TableHead className={th}>Status</TableHead>
										<TableHead className={cn(th, "pr-4 text-right")}>
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{exceptionRows.length === 0 ? (
										<TableRow className="hover:bg-transparent">
											<TableCell
												colSpan={10}
												className="px-4 py-12 text-center text-sm text-muted-foreground"
											>
												No exceptions match your filters.
											</TableCell>
										</TableRow>
									) : (
										exceptionRows.map((row, index) => {
											const action = exceptionActionLabel(
												row.severity,
												row.status
											);
											return (
												<TableRow
													key={row.id}
													className="border-b border-border/40 transition-colors hover:bg-muted/25"
												>
													<TableCell
														className={cn(
															td,
															"w-12 pl-4 text-center tabular-nums text-muted-foreground"
														)}
													>
														{index + 1}
													</TableCell>
													<TableCell className={td}>
														<Link
															href={`${EXCEPTION_DETAIL_BASE}/${encodeURIComponent(row.id)}`}
															className="font-mono text-[11px] font-medium text-primary hover:underline"
														>
															{row.id}
														</Link>
													</TableCell>
													<TableCell className={cn(td, "font-medium")}>
														{row.dataset}
													</TableCell>
													<TableCell
														className={cn(td, "font-mono text-[11px]")}
													>
														{row.recordId}
													</TableCell>
													<TableCell
														className={cn(td, "font-mono text-[11px]")}
													>
														{row.errorCode}
													</TableCell>
													<TableCell
														className={cn(td, "max-w-[260px] truncate")}
													>
														{row.description}
													</TableCell>
													<TableCell className={td}>
														<Pill
															label={row.severity}
															className={
																EXCEPTION_SEVERITY_STYLES[row.severity]
															}
														/>
													</TableCell>
													<TableCell className={td}>{row.owner}</TableCell>
													<TableCell className={td}>
														<Pill
															label={row.status}
															className={EXCEPTION_STATUS_STYLES[row.status]}
														/>
													</TableCell>
													<TableCell className={cn(td, "pr-4 text-right")}>
														<Button
															variant="outline"
															size="sm"
															className="h-7 rounded-sm border-primary/30 px-2.5 text-[11px] font-medium text-primary shadow-none hover:bg-primary/5"
															onClick={() => openException(row.id)}
														>
															{action}
														</Button>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</CmsEdgeTableScroll>
						<TableFooter count={exceptionRows.length} noun="exceptions" />
					</>
				) : null}

				{workbench === "corrections" ? (
					<>
						<CmsEdgeTableScroll>
							<Table
								containerClassName={CMS_EDGE_TABLE_CONTAINER}
								className="w-full min-w-[1100px] text-xs"
							>
								<TableHeader>
									<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
										<TableHead className={cn(th, "w-12 pl-4 text-center")}>
											#
										</TableHead>
										<TableHead className={th}>Correction ID</TableHead>
										<TableHead className={th}>Exception</TableHead>
										<TableHead className={th}>Dataset</TableHead>
										<TableHead className={th}>Record ID</TableHead>
										<TableHead className={th}>Change Summary</TableHead>
										<TableHead className={th}>Owner</TableHead>
										<TableHead className={th}>Status</TableHead>
										<TableHead className={th}>Updated</TableHead>
										<TableHead className={cn(th, "pr-4 text-right")}>
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{correctionRows.length === 0 ? (
										<TableRow className="hover:bg-transparent">
											<TableCell
												colSpan={10}
												className="px-4 py-12 text-center text-sm text-muted-foreground"
											>
												No corrections match your filters.
											</TableCell>
										</TableRow>
									) : (
										correctionRows.map((row, index) => (
											<TableRow
												key={row.id}
												className="border-b border-border/40 transition-colors hover:bg-muted/25"
											>
												<TableCell
													className={cn(
														td,
														"w-12 pl-4 text-center tabular-nums text-muted-foreground"
													)}
												>
													{index + 1}
												</TableCell>
												<TableCell className={td}>
													<Link
														href={`${EXCEPTION_DETAIL_BASE}/${encodeURIComponent(row.exceptionId)}`}
														className="font-mono text-[11px] font-medium text-primary hover:underline"
													>
														{row.id}
													</Link>
												</TableCell>
												<TableCell className={cn(td, "font-mono text-[11px]")}>
													<Link
														href={`${EXCEPTION_DETAIL_BASE}/${encodeURIComponent(row.exceptionId)}`}
														className="text-primary hover:underline"
													>
														{row.exceptionId}
													</Link>
												</TableCell>
												<TableCell className={cn(td, "font-medium")}>
													{row.dataset}
												</TableCell>
												<TableCell className={cn(td, "font-mono text-[11px]")}>
													{row.recordId}
												</TableCell>
												<TableCell className={cn(td, "max-w-[280px] truncate")}>
													{row.changeSummary}
												</TableCell>
												<TableCell className={td}>{row.owner}</TableCell>
												<TableCell className={td}>
													<Pill
														label={row.status}
														className={
															CORRECTION_STATUS_STYLES[
																row.status as CorrectionStatus
															]
														}
													/>
												</TableCell>
												<TableCell className={cn(td, "tabular-nums")}>
													{row.updatedAt}
												</TableCell>
												<TableCell className={cn(td, "pr-4 text-right")}>
													<Button
														variant="outline"
														size="sm"
														className="h-7 rounded-sm border-primary/30 px-2.5 text-[11px] font-medium text-primary shadow-none hover:bg-primary/5"
														onClick={() => openException(row.exceptionId)}
													>
														Open
													</Button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CmsEdgeTableScroll>
						<TableFooter count={correctionRows.length} noun="corrections" />
					</>
				) : null}

				{workbench === "voids" ? (
					<>
						<CmsEdgeTableScroll>
							<Table
								containerClassName={CMS_EDGE_TABLE_CONTAINER}
								className="w-full min-w-[1080px] text-xs"
							>
								<TableHeader>
									<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
										<TableHead className={cn(th, "w-12 pl-4 text-center")}>
											#
										</TableHead>
										<TableHead className={th}>Request ID</TableHead>
										<TableHead className={th}>Original Claim</TableHead>
										<TableHead className={th}>Action</TableHead>
										<TableHead className={th}>Dataset</TableHead>
										<TableHead className={th}>Reason</TableHead>
										<TableHead className={th}>Owner</TableHead>
										<TableHead className={th}>Status</TableHead>
										<TableHead className={th}>Submitted</TableHead>
										<TableHead className={cn(th, "pr-4 text-right")}>
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{voidRows.length === 0 ? (
										<TableRow className="hover:bg-transparent">
											<TableCell
												colSpan={10}
												className="px-4 py-12 text-center text-sm text-muted-foreground"
											>
												No void or replacement requests match your filters.
											</TableCell>
										</TableRow>
									) : (
										voidRows.map((row, index) => (
											<TableRow
												key={row.id}
												className="border-b border-border/40 transition-colors hover:bg-muted/25"
											>
												<TableCell
													className={cn(
														td,
														"w-12 pl-4 text-center tabular-nums text-muted-foreground"
													)}
												>
													{index + 1}
												</TableCell>
												<TableCell className={td}>
													<span className="font-mono text-[11px] font-medium text-primary">
														{row.id}
													</span>
												</TableCell>
												<TableCell className={cn(td, "font-mono text-[11px]")}>
													{row.originalClaimId}
												</TableCell>
												<TableCell className={cn(td, "font-medium")}>
													{row.action}
												</TableCell>
												<TableCell className={td}>{row.dataset}</TableCell>
												<TableCell className={cn(td, "max-w-[260px] truncate")}>
													{row.reason}
												</TableCell>
												<TableCell className={td}>{row.owner}</TableCell>
												<TableCell className={td}>
													<Pill
														label={row.status}
														className={VOID_STATUS_STYLES[row.status]}
													/>
												</TableCell>
												<TableCell className={cn(td, "tabular-nums")}>
													{row.submittedAt}
												</TableCell>
												<TableCell className={cn(td, "pr-4 text-right")}>
													<Button
														variant="outline"
														size="sm"
														className="h-7 rounded-sm border-primary/30 px-2.5 text-[11px] font-medium text-primary shadow-none hover:bg-primary/5"
														onClick={() =>
															openExceptionForRecord(row.originalClaimId)
														}
													>
														Review
													</Button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CmsEdgeTableScroll>
						<TableFooter
							count={voidRows.length}
							noun="void / replacement requests"
						/>
					</>
				) : null}
			</section>

			<CmsEdgePageFooter />
		</div>
	);
}

"use client";

import { useMemo, useState } from "react";

import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock3,
	CloudUpload,
	Download,
	Eye,
	FileCheck2,
	FileText,
	type LucideIcon,
	MoreHorizontal,
	Settings2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	CMS_EDGE_REPORTING_PERIODS,
	CMS_EDGE_SUBMISSION_ENVIRONMENTS,
	CMS_EDGE_SUBMISSION_FILE_TYPES,
	CMS_EDGE_SUBMISSION_KPIS,
	CMS_EDGE_SUBMISSION_PROCESS_STEPS,
	CMS_EDGE_SUBMISSION_STATUSES,
	SUBMISSION_STATUS_STYLES,
	type SubmissionEnvironment,
	type SubmissionFileType,
	type SubmissionStatus,
	useCmsEdgeSubmissionHistoryList,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

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

const KPI_META: {
	key: "total" | "accepted" | "inProgress" | "failed";
	label: string;
	hint: string;
	icon: LucideIcon;
	iconTone: string;
	accent: string;
	valueTone: string;
	ring: string;
	filter: SubmissionStatus | "all";
}[] = [
	{
		key: "total",
		label: "Total Submissions",
		hint: "This reporting cycle",
		icon: FileText,
		iconTone: "text-sky-700 bg-sky-500/10 dark:text-sky-300",
		accent: "from-sky-500/80 to-sky-400/40",
		valueTone: "text-sky-700 dark:text-sky-300",
		ring: "ring-sky-500/20",
		filter: "all",
	},
	{
		key: "accepted",
		label: "Accepted",
		hint: "66.7% of submissions",
		icon: CheckCircle2,
		iconTone: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300",
		accent: "from-emerald-500/80 to-emerald-400/40",
		valueTone: "text-emerald-700 dark:text-emerald-300",
		ring: "ring-emerald-500/20",
		filter: "Accepted",
	},
	{
		key: "inProgress",
		label: "In Progress",
		hint: "Awaiting CMS response",
		icon: Clock3,
		iconTone: "text-amber-700 bg-amber-500/10 dark:text-amber-200",
		accent: "from-amber-500/80 to-amber-400/40",
		valueTone: "text-amber-700 dark:text-amber-300",
		ring: "ring-amber-500/20",
		filter: "Processing",
	},
	{
		key: "failed",
		label: "Failed",
		hint: "Needs remediation",
		icon: AlertCircle,
		iconTone: "text-red-700 bg-red-500/10 dark:text-red-300",
		accent: "from-red-500/80 to-red-400/40",
		valueTone: "text-red-700 dark:text-red-300",
		ring: "ring-red-500/20",
		filter: "Failed",
	},
];

const PROCESS_ICONS: LucideIcon[] = [
	FileCheck2,
	CloudUpload,
	Settings2,
	CheckCircle2,
];

function StatusPill({ status }: { status: SubmissionStatus }) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold",
				SUBMISSION_STATUS_STYLES[status]
			)}
		>
			{status}
		</span>
	);
}

function SubmissionFilterBar({
	reportingPeriod,
	environment,
	fileType,
	status,
	onReportingPeriodChange,
	onEnvironmentChange,
	onFileTypeChange,
	onStatusChange,
}: {
	reportingPeriod: string;
	environment: SubmissionEnvironment | "all";
	fileType: SubmissionFileType | "all";
	status: SubmissionStatus | "all";
	onReportingPeriodChange: (value: string) => void;
	onEnvironmentChange: (value: SubmissionEnvironment | "all") => void;
	onFileTypeChange: (value: SubmissionFileType | "all") => void;
	onStatusChange: (value: SubmissionStatus | "all") => void;
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
					value={environment}
					onValueChange={(value) =>
						onEnvironmentChange(value as SubmissionEnvironment | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[140px]")}>
						<SelectValue placeholder="Environment" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All environments</SelectItem>
						{CMS_EDGE_SUBMISSION_ENVIRONMENTS.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={fileType}
					onValueChange={(value) =>
						onFileTypeChange(value as SubmissionFileType | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[180px]")}>
						<SelectValue placeholder="File type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All file types</SelectItem>
						{CMS_EDGE_SUBMISSION_FILE_TYPES.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={status}
					onValueChange={(value) =>
						onStatusChange(value as SubmissionStatus | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[140px]")}>
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{CMS_EDGE_SUBMISSION_STATUSES.map((option) => (
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

function SubmissionKpiCards({
	activeFilter,
	onFilter,
}: {
	activeFilter: SubmissionStatus | "all";
	onFilter: (filter: SubmissionStatus | "all") => void;
}) {
	const counts = CMS_EDGE_SUBMISSION_KPIS;

	return (
		<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{KPI_META.map((kpi) => {
				const Icon = kpi.icon;
				const active = activeFilter === kpi.filter;
				const value = counts[kpi.key];

				return (
					<button
						key={kpi.key}
						type="button"
						onClick={() => onFilter(kpi.filter)}
						className={cn(
							"group relative overflow-hidden rounded-sm border bg-card p-4 text-left transition-all duration-200 ease-out",
							STAT_CARD_SHADOW,
							STAT_CARD_SHADOW_HOVER,
							"hover:-translate-y-px hover:border-border",
							active
								? cn("border-transparent ring-1", kpi.ring)
								: "border-border/70"
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
									{value.toLocaleString()}
								</p>
								<p className="mt-1.5 text-xs text-muted-foreground">
									{kpi.hint}
								</p>
							</div>
							<span
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-sm ring-1 ring-inset ring-black/5 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10",
									kpi.iconTone
								)}
							>
								<Icon className="size-[18px]" aria-hidden />
							</span>
						</div>
					</button>
				);
			})}
		</div>
	);
}

function SubmissionProcessStepper() {
	const steps = CMS_EDGE_SUBMISSION_PROCESS_STEPS;

	return (
		<section className={cn(PANEL_SHADOW, "overflow-hidden")}>
			<div className="border-b border-border/50 px-4 py-2.5 sm:px-5">
				<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
					Submission lifecycle
				</p>
			</div>

			<div className="px-4 py-5 sm:px-6">
				<ol className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-0">
					{steps.map((step, index) => {
						const Icon = PROCESS_ICONS[index] ?? FileCheck2;
						const isLast = index === steps.length - 1;

						return (
							<li
								key={step.id}
								className="flex min-w-0 items-center gap-4 sm:flex-1"
							>
								<div className="flex min-w-0 items-center gap-3">
									<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]">
										<Icon className="size-4" />
									</span>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-foreground">
											{step.title}
										</p>
										<p className="mt-0.5 text-xs leading-snug text-muted-foreground">
											{step.description}
										</p>
									</div>
								</div>

								{!isLast ? (
									<>
										<span
											aria-hidden
											className="mx-3 hidden min-w-12 flex-1 items-center sm:flex"
										>
											<span className="h-px flex-1 bg-primary/30" />
											<ChevronRight className="-ml-px size-4 shrink-0 text-primary/55" />
										</span>
										<ChevronDown
											aria-hidden
											className="ml-auto size-4 shrink-0 text-primary/55 sm:hidden"
										/>
									</>
								) : null}
							</li>
						);
					})}
				</ol>
			</div>
		</section>
	);
}

function periodValueToLabel(value: string) {
	const match = CMS_EDGE_REPORTING_PERIODS.find(
		(option) => option.value === value
	);
	return match?.label.split(" (")[0] ?? "Q2 2027";
}

export function CmsEdgeSubmissionsTab() {
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const [environment, setEnvironment] = useState<SubmissionEnvironment | "all">(
		"all"
	);
	const [fileType, setFileType] = useState<SubmissionFileType | "all">("all");
	const [status, setStatus] = useState<SubmissionStatus | "all">("all");
	const { submissionHistory } = useCmsEdgeSubmissionHistoryList();

	const filteredRows = useMemo(() => {
		const periodLabel = periodValueToLabel(reportingPeriod);
		const useMock = isMockEnabled();

		return submissionHistory.filter((row) => {
			if (useMock && row.reportingPeriod !== periodLabel) return false;
			if (environment !== "all" && row.environment !== environment)
				return false;
			if (fileType !== "all" && row.fileType !== fileType) return false;
			if (status !== "all" && row.status !== status) return false;
			return true;
		});
	}, [reportingPeriod, environment, fileType, status, submissionHistory]);

	const hasFilters =
		environment !== "all" || fileType !== "all" || status !== "all";

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<SubmissionFilterBar
				reportingPeriod={reportingPeriod}
				environment={environment}
				fileType={fileType}
				status={status}
				onReportingPeriodChange={setReportingPeriod}
				onEnvironmentChange={setEnvironment}
				onFileTypeChange={setFileType}
				onStatusChange={setStatus}
			/>

			<SubmissionKpiCards
				activeFilter={status}
				onFilter={(next) => setStatus(next)}
			/>

			<section className={cn(PANEL_SHADOW, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
					<p className="text-sm font-semibold text-foreground">
						{filteredRows.length.toLocaleString()}{" "}
						{filteredRows.length === 1 ? "submission" : "submissions"}
					</p>
					<div className="flex items-center gap-1.5">
						{hasFilters ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2.5 text-xs text-muted-foreground"
								onClick={() => {
									setEnvironment("all");
									setFileType("all");
									setStatus("all");
								}}
							>
								Clear
							</Button>
						) : null}
						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 rounded-sm border-border bg-background px-3 text-xs shadow-none"
							onClick={() => toast.success("Export queued")}
						>
							<Download className="size-3.5" />
							Export
						</Button>
					</div>
				</div>

				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className="w-full min-w-[1020px] text-xs"
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
								<TableHead className={cn(th, "w-12 pl-4 text-center")}>
									#
								</TableHead>
								<TableHead className={th}>Submission ID</TableHead>
								<TableHead className={th}>File Type</TableHead>
								<TableHead className={th}>Environment</TableHead>
								<TableHead className={th}>Submitted Date</TableHead>
								<TableHead className={cn(th, "text-right")}>Records</TableHead>
								<TableHead className={th}>Status</TableHead>
								<TableHead className={th}>Submitted By</TableHead>
								<TableHead className={cn(th, "pr-4 text-right")}>
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRows.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={9}
										className="px-4 py-12 text-center text-sm text-muted-foreground"
									>
										No submissions match your filters.
									</TableCell>
								</TableRow>
							) : (
								filteredRows.map((row, index) => (
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
											<button
												type="button"
												className="font-mono text-[11px] font-medium text-primary transition-colors hover:underline"
												onClick={() => toast.message(`Open ${row.id}`)}
											>
												{row.id}
											</button>
										</TableCell>
										<TableCell className={cn(td, "font-medium")}>
											{row.fileType}
										</TableCell>
										<TableCell className={td}>{row.environment}</TableCell>
										<TableCell className={cn(td, "tabular-nums")}>
											{row.submittedDateTime}
										</TableCell>
										<TableCell
											className={cn(td, "text-right font-medium tabular-nums")}
										>
											{formatCount(row.records)}
										</TableCell>
										<TableCell className={td}>
											<StatusPill status={row.status} />
										</TableCell>
										<TableCell className={cn(td, "text-muted-foreground")}>
											{row.submittedBy}
										</TableCell>
										<TableCell className={cn(td, "pr-4 text-right")}>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-7 text-muted-foreground hover:text-foreground"
														aria-label={`Actions for ${row.id}`}
													>
														<MoreHorizontal className="size-3.5" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-44">
													<DropdownMenuItem
														onClick={() => toast.message(`View ${row.id}`)}
													>
														<Eye className="mr-2 size-3.5" />
														View details
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															toast.success(`Download queued for ${row.id}`)
														}
													>
														<Download className="mr-2 size-3.5" />
														Download files
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
					<span>
						Showing {filteredRows.length === 0 ? 0 : 1}–{filteredRows.length} of{" "}
						{filteredRows.length} entries
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
			</section>

			<SubmissionProcessStepper />

			<CmsEdgePageFooter />
		</div>
	);
}

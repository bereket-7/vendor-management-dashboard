"use client";

import { useMemo, useState } from "react";

import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ClipboardList,
	Clock3,
	Download,
	Eye,
	FileText,
	type LucideIcon,
	Pill,
	Stethoscope,
	Users,
	XCircle,
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
	CMS_EDGE_REPORTING_PERIODS,
	CMS_EDGE_RESPONSES_LIST,
	CMS_EDGE_RESPONSE_FILE_TYPES,
	CMS_EDGE_RESPONSE_KPIS,
	CMS_EDGE_RESPONSE_LATEST_SUMMARY,
	CMS_EDGE_RESPONSE_STATUSES,
	CMS_EDGE_RESPONSE_TYPES,
	CMS_RESPONSE_STATUS_STYLES,
	type CmsResponseFileType,
	type CmsResponseStatus,
	type CmsResponseType,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
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
	key:
		| "responseFiles"
		| "acceptedRecords"
		| "rejectedRecords"
		| "pendingResponses";
	label: string;
	hint: string;
	icon: LucideIcon;
	iconTone: string;
	accent: string;
	valueTone: string;
	ring: string;
	filter: CmsResponseStatus | "all";
}[] = [
	{
		key: "responseFiles",
		label: "Response Files",
		hint: "Received this cycle",
		icon: FileText,
		iconTone: "text-sky-700 bg-sky-500/10 dark:text-sky-300",
		accent: "from-sky-500/80 to-sky-400/40",
		valueTone: "text-sky-700 dark:text-sky-300",
		ring: "ring-sky-500/20",
		filter: "all",
	},
	{
		key: "acceptedRecords",
		label: "Accepted Records",
		hint: "Across all responses",
		icon: CheckCircle2,
		iconTone: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300",
		accent: "from-emerald-500/80 to-emerald-400/40",
		valueTone: "text-emerald-700 dark:text-emerald-300",
		ring: "ring-emerald-500/20",
		filter: "Completed",
	},
	{
		key: "rejectedRecords",
		label: "Rejected Records",
		hint: "Needs remediation",
		icon: XCircle,
		iconTone: "text-red-700 bg-red-500/10 dark:text-red-300",
		accent: "from-red-500/80 to-red-400/40",
		valueTone: "text-red-700 dark:text-red-300",
		ring: "ring-red-500/20",
		filter: "Error",
	},
	{
		key: "pendingResponses",
		label: "Pending Responses",
		hint: "Awaiting CMS return",
		icon: Clock3,
		iconTone: "text-amber-700 bg-amber-500/10 dark:text-amber-200",
		accent: "from-amber-500/80 to-amber-400/40",
		valueTone: "text-amber-700 dark:text-amber-300",
		ring: "ring-amber-500/20",
		filter: "Pending",
	},
];

const SUMMARY_META: Record<string, { icon: LucideIcon; well: string }> = {
	Enrollment: {
		icon: Users,
		well: "bg-sky-600",
	},
	Medical: {
		icon: Stethoscope,
		well: "bg-violet-600",
	},
	Pharmacy: {
		icon: Pill,
		well: "bg-teal-600",
	},
	"Supplemental Diagnosis": {
		icon: ClipboardList,
		well: "bg-amber-600",
	},
};

function StatusPill({ status }: { status: CmsResponseStatus }) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold",
				CMS_RESPONSE_STATUS_STYLES[status]
			)}
		>
			{status}
		</span>
	);
}

function ResponseFilterBar({
	reportingPeriod,
	fileType,
	responseType,
	status,
	onReportingPeriodChange,
	onFileTypeChange,
	onResponseTypeChange,
	onStatusChange,
}: {
	reportingPeriod: string;
	fileType: CmsResponseFileType | "all";
	responseType: CmsResponseType | "all";
	status: CmsResponseStatus | "all";
	onReportingPeriodChange: (value: string) => void;
	onFileTypeChange: (value: CmsResponseFileType | "all") => void;
	onResponseTypeChange: (value: CmsResponseType | "all") => void;
	onStatusChange: (value: CmsResponseStatus | "all") => void;
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
					value={fileType}
					onValueChange={(value) =>
						onFileTypeChange(value as CmsResponseFileType | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[180px]")}>
						<SelectValue placeholder="File type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All file types</SelectItem>
						{CMS_EDGE_RESPONSE_FILE_TYPES.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={responseType}
					onValueChange={(value) =>
						onResponseTypeChange(value as CmsResponseType | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[180px]")}>
						<SelectValue placeholder="Response type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All response types</SelectItem>
						{CMS_EDGE_RESPONSE_TYPES.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={status}
					onValueChange={(value) =>
						onStatusChange(value as CmsResponseStatus | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[140px]")}>
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{CMS_EDGE_RESPONSE_STATUSES.map((option) => (
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

function ResponseKpiCards({
	activeFilter,
	onFilter,
}: {
	activeFilter: CmsResponseStatus | "all";
	onFilter: (filter: CmsResponseStatus | "all") => void;
}) {
	const counts = CMS_EDGE_RESPONSE_KPIS;

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
									{formatCount(value)}
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

function LatestResponseSummary({ periodLabel }: { periodLabel: string }) {
	return (
		<section className="space-y-3">
			<div className="flex items-center justify-between gap-2 px-0.5">
				<div>
					<p className="text-sm font-semibold text-foreground">
						Latest summary
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Accepted vs rejected by file type · {periodLabel}
					</p>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{CMS_EDGE_RESPONSE_LATEST_SUMMARY.map((card) => {
					const meta = SUMMARY_META[card.label];
					const Icon = meta?.icon ?? FileText;
					const total = card.accepted + card.rejected;
					const rateWidth =
						total > 0 ? Math.min(100, (card.accepted / total) * 100) : 0;

					return (
						<div
							key={card.id}
							className={cn(
								"rounded-sm border border-border/70 bg-card p-4 transition-all duration-200 ease-out",
								STAT_CARD_SHADOW,
								STAT_CARD_SHADOW_HOVER,
								"hover:-translate-y-px"
							)}
						>
							<div className="flex items-start justify-between gap-3">
								<span
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-sm shadow-sm",
										meta?.well ?? "bg-primary"
									)}
								>
									<Icon className="size-[18px] text-white" />
								</span>
								<p className="text-right text-xl font-semibold tabular-nums tracking-tight text-primary">
									{card.acceptanceRate.toFixed(1)}%
								</p>
							</div>

							<p className="mt-3 text-sm font-semibold text-foreground">
								{card.label}
							</p>

							<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-emerald-500"
									style={{ width: `${rateWidth}%` }}
								/>
							</div>

							<div className="mt-3 flex items-center justify-between gap-3 text-xs">
								<span className="tabular-nums">
									<span className="font-semibold text-emerald-700 dark:text-emerald-300">
										{formatCount(card.accepted)}
									</span>
									<span className="ml-1 text-muted-foreground">accepted</span>
								</span>
								<span className="tabular-nums">
									<span className="font-semibold text-red-700 dark:text-red-300">
										{formatCount(card.rejected)}
									</span>
									<span className="ml-1 text-muted-foreground">rejected</span>
								</span>
							</div>
						</div>
					);
				})}
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

export function CmsEdgeResponsesTab() {
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const [fileType, setFileType] = useState<CmsResponseFileType | "all">("all");
	const [responseType, setResponseType] = useState<CmsResponseType | "all">(
		"all"
	);
	const [status, setStatus] = useState<CmsResponseStatus | "all">("all");

	const periodLabel = periodValueToLabel(reportingPeriod);

	const filteredRows = useMemo(() => {
		return CMS_EDGE_RESPONSES_LIST.filter((row) => {
			if (row.reportingPeriod !== periodLabel) return false;
			if (fileType !== "all" && row.fileType !== fileType) return false;
			if (responseType !== "all" && row.responseType !== responseType) {
				return false;
			}
			if (status !== "all" && row.status !== status) return false;
			return true;
		});
	}, [periodLabel, fileType, responseType, status]);

	const hasFilters =
		fileType !== "all" || responseType !== "all" || status !== "all";

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<ResponseFilterBar
				reportingPeriod={reportingPeriod}
				fileType={fileType}
				responseType={responseType}
				status={status}
				onReportingPeriodChange={setReportingPeriod}
				onFileTypeChange={setFileType}
				onResponseTypeChange={setResponseType}
				onStatusChange={setStatus}
			/>

			<ResponseKpiCards
				activeFilter={status}
				onFilter={(next) => setStatus(next)}
			/>

			<section className={cn(PANEL_SHADOW, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
					<p className="text-sm font-semibold text-foreground">
						{filteredRows.length.toLocaleString()}{" "}
						{filteredRows.length === 1 ? "response file" : "response files"}
					</p>
					<div className="flex items-center gap-1.5">
						{hasFilters ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2.5 text-xs text-muted-foreground"
								onClick={() => {
									setFileType("all");
									setResponseType("all");
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
						className="w-full min-w-[1180px] text-xs"
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
								<TableHead className={cn(th, "w-12 pl-4 text-center")}>
									#
								</TableHead>
								<TableHead className={th}>Response File</TableHead>
								<TableHead className={th}>Related Submission</TableHead>
								<TableHead className={th}>File Type</TableHead>
								<TableHead className={th}>Environment</TableHead>
								<TableHead className={th}>Date Received</TableHead>
								<TableHead className={cn(th, "text-right")}>Accepted</TableHead>
								<TableHead className={cn(th, "text-right")}>Rejected</TableHead>
								<TableHead className={th}>Status</TableHead>
								<TableHead className={cn(th, "pr-4 text-right")}>
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRows.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={10}
										className="px-4 py-12 text-center text-sm text-muted-foreground"
									>
										No response files match your filters.
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
												className="max-w-[240px] truncate font-mono text-[11px] font-medium text-primary transition-colors hover:underline"
												onClick={() =>
													toast.message(`Open ${row.responseFile}`)
												}
											>
												{row.responseFile}
											</button>
										</TableCell>
										<TableCell className={td}>
											<button
												type="button"
												className="font-mono text-[11px] font-medium text-primary transition-colors hover:underline"
												onClick={() =>
													toast.message(`Open ${row.relatedSubmission}`)
												}
											>
												{row.relatedSubmission}
											</button>
										</TableCell>
										<TableCell className={cn(td, "font-medium")}>
											{row.fileType}
										</TableCell>
										<TableCell className={td}>{row.environment}</TableCell>
										<TableCell className={cn(td, "tabular-nums")}>
											{row.dateReceived}
										</TableCell>
										<TableCell
											className={cn(
												td,
												"text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-300"
											)}
										>
											{formatCount(row.accepted)}
										</TableCell>
										<TableCell
											className={cn(
												td,
												"text-right font-medium tabular-nums text-red-700 dark:text-red-300"
											)}
										>
											{formatCount(row.rejected)}
										</TableCell>
										<TableCell className={td}>
											<StatusPill status={row.status} />
										</TableCell>
										<TableCell className={cn(td, "pr-4 text-right")}>
											<div className="inline-flex items-center gap-1.5">
												<Button
													variant="link"
													size="sm"
													className="h-auto gap-1 p-0 text-[11px] font-medium"
													onClick={() =>
														toast.message(
															`View results for ${row.responseFile}`
														)
													}
												>
													<Eye className="size-3" />
													View Results
												</Button>
												<span className="text-border">|</span>
												<Button
													variant="link"
													size="sm"
													className="h-auto gap-1 p-0 text-[11px] font-medium"
													onClick={() =>
														toast.success(
															`Download queued for ${row.responseFile}`
														)
													}
												>
													<Download className="size-3" />
													Download
												</Button>
											</div>
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
						{filteredRows.length} response files
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

			<LatestResponseSummary periodLabel={periodLabel} />

			<CmsEdgePageFooter />
		</div>
	);
}

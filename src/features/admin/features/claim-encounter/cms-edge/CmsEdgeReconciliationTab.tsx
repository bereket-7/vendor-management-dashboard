"use client";

import { useMemo, useState } from "react";

import {
	Ban,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock3,
	CloudUpload,
	Copy,
	Database,
	FileText,
	type LucideIcon,
	Scale,
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
	CMS_EDGE_RECON_DATASETS,
	CMS_EDGE_RECON_ENVIRONMENTS,
	CMS_EDGE_RECON_FLOW,
	CMS_EDGE_RECON_KPIS,
	CMS_EDGE_RECON_VARIANCE_REASONS,
	CMS_EDGE_REPORTING_PERIODS,
	RECON_STATUS_DOT,
	type ReconciliationEnvironment,
	type ReconciliationStatus,
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
	key: keyof typeof CMS_EDGE_RECON_KPIS;
	label: string;
	hint: string;
	icon: LucideIcon;
	well: string;
	valueTone: string;
	accent: string;
}[] = [
	{
		key: "sourceRecords",
		label: "Source Records",
		hint: "Extracted source volume",
		icon: Database,
		well: "bg-sky-600",
		valueTone: "text-sky-700 dark:text-sky-300",
		accent: "from-sky-500/80 to-sky-400/40",
	},
	{
		key: "submitted",
		label: "Submitted",
		hint: "Sent to CMS EDGE",
		icon: CloudUpload,
		well: "bg-blue-600",
		valueTone: "text-blue-700 dark:text-blue-300",
		accent: "from-blue-500/80 to-blue-400/40",
	},
	{
		key: "cmsAccepted",
		label: "CMS Accepted",
		hint: "Accepted by CMS",
		icon: CheckCircle2,
		well: "bg-emerald-600",
		valueTone: "text-emerald-700 dark:text-emerald-300",
		accent: "from-emerald-500/80 to-emerald-400/40",
	},
	{
		key: "variance",
		label: "Variance",
		hint: "Source vs accepted",
		icon: Scale,
		well: "bg-violet-600",
		valueTone: "text-violet-700 dark:text-violet-300",
		accent: "from-violet-500/80 to-violet-400/40",
	},
];

const FLOW_ICONS: LucideIcon[] = [
	Database,
	FileText,
	CloudUpload,
	CheckCircle2,
];

const VARIANCE_ICON: Record<
	(typeof CMS_EDGE_RECON_VARIANCE_REASONS)[number]["tone"],
	{ icon: LucideIcon; well: string }
> = {
	violet: { icon: FileText, well: "bg-violet-600" },
	orange: { icon: Ban, well: "bg-orange-600" },
	teal: { icon: Copy, well: "bg-teal-600" },
	amber: { icon: Clock3, well: "bg-amber-600" },
};

function ReconFilterBar({
	reportingPeriod,
	environment,
	onReportingPeriodChange,
	onEnvironmentChange,
}: {
	reportingPeriod: string;
	environment: ReconciliationEnvironment | "all";
	onReportingPeriodChange: (value: string) => void;
	onEnvironmentChange: (value: ReconciliationEnvironment | "all") => void;
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
						onEnvironmentChange(value as ReconciliationEnvironment | "all")
					}
				>
					<SelectTrigger className={cn(compactFieldClass, "w-[150px]")}>
						<SelectValue placeholder="Environment" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All environments</SelectItem>
						{CMS_EDGE_RECON_ENVIRONMENTS.map((option) => (
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

function ReconKpiCards() {
	const counts = CMS_EDGE_RECON_KPIS;

	return (
		<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{KPI_META.map((kpi) => {
				const Icon = kpi.icon;

				return (
					<div
						key={kpi.key}
						className={cn(
							"relative overflow-hidden rounded-sm border border-border/70 bg-card p-4 transition-all duration-200 ease-out",
							STAT_CARD_SHADOW,
							STAT_CARD_SHADOW_HOVER,
							"hover:-translate-y-px"
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
									{formatCount(counts[kpi.key])}
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
					</div>
				);
			})}
		</div>
	);
}

function StatusCell({ status }: { status: ReconciliationStatus }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground">
			<span
				className={cn("size-2 shrink-0 rounded-full", RECON_STATUS_DOT[status])}
			/>
			{status}
		</span>
	);
}

function ReconciliationFlow() {
	return (
		<section className={cn(PANEL_SHADOW, "overflow-hidden")}>
			<div className="border-b border-border/50 px-4 py-2.5">
				<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
					Reconciliation flow
				</p>
			</div>
			<div className="px-4 py-5 sm:px-5">
				<ol className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-0">
					{CMS_EDGE_RECON_FLOW.map((step, index) => {
						const Icon = FLOW_ICONS[index] ?? Database;
						const isLast = index === CMS_EDGE_RECON_FLOW.length - 1;

						return (
							<li
								key={step.id}
								className="flex min-w-0 items-center gap-4 sm:flex-1"
							>
								<div className="flex min-w-0 items-center gap-3">
									<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-600 shadow-sm">
										<Icon className="size-[18px] text-white" />
									</span>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-foreground">
											{step.title}
										</p>
										<p className="mt-0.5 text-xs text-muted-foreground">
											{step.description}
										</p>
									</div>
								</div>
								{!isLast ? (
									<>
										<span
											aria-hidden
											className="mx-3 hidden min-w-10 flex-1 items-center sm:flex"
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

function VarianceReasons() {
	return (
		<section className={cn(PANEL_SHADOW, "overflow-hidden")}>
			<div className="border-b border-border/50 px-4 py-2.5">
				<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
					Variance reasons
				</p>
			</div>
			<ul className="divide-y divide-border/40">
				{CMS_EDGE_RECON_VARIANCE_REASONS.map((reason) => {
					const meta = VARIANCE_ICON[reason.tone];
					const Icon = meta.icon;

					return (
						<li
							key={reason.id}
							className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/20"
						>
							<span
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm",
									meta.well
								)}
							>
								<Icon className="size-4 text-white" />
							</span>
							<p className="min-w-0 flex-1 text-sm font-medium text-foreground">
								{reason.label}
							</p>
							<p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
								{formatCount(reason.count)}
							</p>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

function periodValueToLabel(value: string) {
	const match = CMS_EDGE_REPORTING_PERIODS.find(
		(option) => option.value === value
	);
	return match?.label.split(" (")[0] ?? "Q2 2027";
}

export function CmsEdgeReconciliationTab() {
	const [reportingPeriod, setReportingPeriod] = useState("q2-2027");
	const [environment, setEnvironment] = useState<
		ReconciliationEnvironment | "all"
	>("Production");

	const periodLabel = periodValueToLabel(reportingPeriod);

	const rows = useMemo(() => {
		return CMS_EDGE_RECON_DATASETS.filter((row) => {
			if (row.reportingPeriod !== periodLabel) return false;
			if (environment !== "all" && row.environment !== environment)
				return false;
			return true;
		});
	}, [periodLabel, environment]);

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			<ReconFilterBar
				reportingPeriod={reportingPeriod}
				environment={environment}
				onReportingPeriodChange={setReportingPeriod}
				onEnvironmentChange={setEnvironment}
			/>

			<ReconKpiCards />

			<section className={cn(PANEL_SHADOW, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
					<p className="text-sm font-semibold text-foreground">
						{rows.length.toLocaleString()}{" "}
						{rows.length === 1 ? "dataset" : "datasets"}
					</p>
					{environment !== "all" ? (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 px-2.5 text-xs text-muted-foreground"
							onClick={() => setEnvironment("all")}
						>
							Clear
						</Button>
					) : null}
				</div>

				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className="w-full min-w-[1120px] text-xs"
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
								<TableHead className={cn(th, "w-12 pl-4 text-center")}>
									#
								</TableHead>
								<TableHead className={th}>Dataset</TableHead>
								<TableHead className={cn(th, "text-right")}>Source</TableHead>
								<TableHead className={cn(th, "text-right")}>
									File Generated
								</TableHead>
								<TableHead className={cn(th, "text-right")}>
									Submitted
								</TableHead>
								<TableHead className={cn(th, "text-right")}>
									CMS Accepted
								</TableHead>
								<TableHead className={cn(th, "text-right")}>
									CMS Rejected
								</TableHead>
								<TableHead className={cn(th, "text-right")}>Variance</TableHead>
								<TableHead className={th}>Status</TableHead>
								<TableHead className={cn(th, "pr-4 text-right")}>
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={10}
										className="px-4 py-12 text-center text-sm text-muted-foreground"
									>
										No reconciliation rows match your filters.
									</TableCell>
								</TableRow>
							) : (
								rows.map((row, index) => (
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
										<TableCell className={cn(td, "font-semibold")}>
											{row.dataset}
										</TableCell>
										<TableCell
											className={cn(
												td,
												"text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-300"
											)}
										>
											{formatCount(row.source)}
										</TableCell>
										<TableCell
											className={cn(
												td,
												"text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-300"
											)}
										>
											{formatCount(row.fileGenerated)}
										</TableCell>
										<TableCell
											className={cn(
												td,
												"text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-300"
											)}
										>
											{formatCount(row.submitted)}
										</TableCell>
										<TableCell
											className={cn(
												td,
												"text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-300"
											)}
										>
											{formatCount(row.cmsAccepted)}
										</TableCell>
										<TableCell
											className={cn(
												td,
												"text-right font-medium tabular-nums text-red-700 dark:text-red-300"
											)}
										>
											{formatCount(row.cmsRejected)}
										</TableCell>
										<TableCell
											className={cn(
												td,
												"text-right font-medium tabular-nums text-red-700 dark:text-red-300"
											)}
										>
											{formatCount(row.variance)}
										</TableCell>
										<TableCell className={td}>
											<StatusCell status={row.status} />
										</TableCell>
										<TableCell className={cn(td, "pr-4 text-right")}>
											<Button
												variant="outline"
												size="sm"
												className="h-7 rounded-sm border-primary/30 px-2.5 text-[11px] font-medium text-primary shadow-none hover:bg-primary/5"
												onClick={() =>
													toast.message(`View details · ${row.dataset}`)
												}
											>
												View Details
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
					<span>
						Showing {rows.length === 0 ? 0 : 1}–{rows.length} of {rows.length}{" "}
						datasets
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

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
				<ReconciliationFlow />
				<VarianceReasons />
			</div>

			<CmsEdgePageFooter />
		</div>
	);
}

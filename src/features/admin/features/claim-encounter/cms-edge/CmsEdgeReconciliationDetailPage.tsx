"use client";

import { useParams } from "next/navigation";

import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	CloudUpload,
	Database,
	Download,
	ExternalLink,
	type LucideIcon,
	Scale,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_STATUS_PILL_CLASS,
	CmsEdgePageFooter,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	RECON_STATUS_DOT,
	RECON_STATUS_STYLES,
	type ReconciliationStatus,
	useCmsEdgeReconciliationDetailQuery,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PANEL =
	"rounded-sm border border-border/70 bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";

const LIST_HREF =
	"/admin/claim-encounter/regulatory/cms-edge-reporting/reconciliation";

const SUBMISSION_DETAIL_BASE =
	"/admin/claim-encounter/regulatory/cms-edge-reporting/submissions";

const EXCEPTIONS_HREF =
	"/admin/claim-encounter/regulatory/cms-edge-reporting/exceptions";

const VARIANCE_TONE: Record<string, string> = {
	violet: "bg-violet-500",
	orange: "bg-orange-500",
	teal: "bg-teal-500",
	amber: "bg-amber-500",
};

function StatusPill({ status }: { status: ReconciliationStatus }) {
	return (
		<span
			className={cn(CMS_EDGE_STATUS_PILL_CLASS, RECON_STATUS_STYLES[status])}
		>
			<span
				className={cn(
					"mr-1.5 inline-block size-1.5 rounded-full",
					RECON_STATUS_DOT[status]
				)}
			/>
			{status}
		</span>
	);
}

function MetricCard({
	label,
	value,
	hint,
	icon: Icon,
	well,
	valueTone,
	accent,
}: {
	label: string;
	value: string;
	hint: string;
	icon: LucideIcon;
	well: string;
	valueTone: string;
	accent: string;
}) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-sm border border-border/70 bg-card p-4",
				STAT_SHADOW
			)}
		>
			<span
				aria-hidden
				className={cn(
					"absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
					accent
				)}
			/>
			<div className="flex items-start justify-between gap-3 pl-1.5">
				<div className="min-w-0">
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						{label}
					</p>
					<p
						className={cn(
							"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
							valueTone
						)}
					>
						{value}
					</p>
					<p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
				</div>
				<span
					className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm",
						well
					)}
				>
					<Icon className="size-[18px] text-white" />
				</span>
			</div>
		</div>
	);
}

export function CmsEdgeReconciliationDetailPage() {
	const params = useParams<{ reconId: string }>();
	const reconId = decodeURIComponent(params.reconId ?? "");

	const detailQuery = useCmsEdgeReconciliationDetailQuery(reconId);
	const detail = detailQuery.data ?? null;
	const isLoading = detailQuery.isLoading || detailQuery.isFetching;

	if (isLoading && !detail) {
		return (
			<div className={cn(CMS_EDGE_PAGE_STACK, "px-1")}>
				<Link
					href={LIST_HREF}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back to Reconciliation
				</Link>
				<section className={cn(PANEL, "px-4 py-10 text-center")}>
					<p className="text-sm text-muted-foreground">
						Loading reconciliation…
					</p>
				</section>
			</div>
		);
	}

	if (!detail) {
		return (
			<div className={cn(CMS_EDGE_PAGE_STACK, "px-1")}>
				<Link
					href={LIST_HREF}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back to Reconciliation
				</Link>
				<section className={cn(PANEL, "px-4 py-10 text-center")}>
					<p className="text-sm font-semibold text-foreground">
						{detailQuery.isError
							? "Failed to load reconciliation"
							: "Reconciliation row not found"}
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						No dataset matches{" "}
						<span className="font-mono text-foreground">{reconId}</span>.
					</p>
					<Button asChild className="mt-4 h-9 rounded-sm" size="sm">
						<Link href={LIST_HREF}>Return to list</Link>
					</Button>
				</section>
			</div>
		);
	}

	const maxVariance = Math.max(
		...detail.varianceSlices.map((item) => item.count),
		1
	);

	return (
		<div className={cn(CMS_EDGE_PAGE_STACK, "px-1 sm:px-0")}>
			<div className="space-y-3 border-b border-border/50 pb-3">
				<Link
					href={LIST_HREF}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back to Reconciliation
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
								{detail.dataset}
							</h1>
							<StatusPill status={detail.status} />
						</div>
						<p className="text-sm text-muted-foreground">
							{detail.environment} · {detail.reportingPeriod} ·{" "}
							<span className="font-mono text-[12px]">{detail.runId}</span>
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{detail.status !== "Balanced" ? (
							<Button
								size="sm"
								className="h-8 rounded-sm bg-primary px-3 text-[11px] font-semibold text-primary-foreground shadow-none hover:bg-primary/90"
								onClick={() =>
									toast.success(`Investigate queued · ${detail.dataset}`)
								}
							>
								Investigate variance
							</Button>
						) : (
							<Button
								size="sm"
								className="h-8 rounded-sm bg-primary px-3 text-[11px] font-semibold text-primary-foreground shadow-none hover:bg-primary/90"
								onClick={() =>
									toast.success(`Marked reviewed · ${detail.dataset}`)
								}
							>
								Mark reviewed
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 rounded-sm border-border bg-background text-[11px] shadow-none"
							onClick={() => toast.success(`Export queued for ${detail.runId}`)}
						>
							<Download className="size-3.5" />
							Export report
						</Button>
						<Button
							asChild
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 rounded-sm border-border bg-background shadow-none"
						>
							<Link
								href={`${SUBMISSION_DETAIL_BASE}/${encodeURIComponent(detail.relatedSubmission)}`}
							>
								<ExternalLink className="size-3.5" />
								Related submission
							</Link>
						</Button>
					</div>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Source"
					value={formatCount(detail.source)}
					hint="Extracted source volume"
					icon={Database}
					well="bg-sky-600"
					valueTone="text-sky-700 dark:text-sky-300"
					accent="from-sky-500/80 to-sky-400/40"
				/>
				<MetricCard
					label="Submitted"
					value={formatCount(detail.submitted)}
					hint="Sent to CMS EDGE"
					icon={CloudUpload}
					well="bg-violet-600"
					valueTone="text-violet-700 dark:text-violet-300"
					accent="from-violet-500/80 to-violet-400/40"
				/>
				<MetricCard
					label="CMS accepted"
					value={formatCount(detail.cmsAccepted)}
					hint={`${detail.acceptanceRate}% of submitted`}
					icon={CheckCircle2}
					well="bg-emerald-600"
					valueTone="text-emerald-700 dark:text-emerald-300"
					accent="from-emerald-500/80 to-emerald-400/40"
				/>
				<MetricCard
					label="Variance"
					value={formatCount(detail.variance)}
					hint={`${formatCount(detail.cmsRejected)} CMS rejects`}
					icon={detail.variance > 0 ? AlertTriangle : Scale}
					well={detail.variance > 0 ? "bg-red-600" : "bg-emerald-600"}
					valueTone={
						detail.variance > 0
							? "text-red-700 dark:text-red-300"
							: "text-emerald-700 dark:text-emerald-300"
					}
					accent={
						detail.variance > 0
							? "from-red-500/80 to-red-400/40"
							: "from-emerald-500/80 to-emerald-400/40"
					}
				/>
			</div>

			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="border-b border-border/50 px-4 py-2.5">
					<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						Funnel · source → CMS accepted
					</p>
				</div>
				<ol className="grid gap-px bg-border/40 sm:grid-cols-4">
					{detail.pipeline.map((step) => (
						<li key={step.id} className="bg-card px-4 py-4">
							<p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
								{step.title}
							</p>
							<p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
								{formatCount(step.count)}
							</p>
							{step.deltaFromPrevious === null ? (
								<p className="mt-1 text-[11px] text-muted-foreground">
									Baseline
								</p>
							) : (
								<p
									className={cn(
										"mt-1 text-[11px] font-medium tabular-nums",
										step.deltaFromPrevious < 0
											? "text-red-700 dark:text-red-300"
											: "text-emerald-700 dark:text-emerald-300"
									)}
								>
									{step.deltaFromPrevious === 0
										? "No change"
										: `${step.deltaFromPrevious > 0 ? "+" : ""}${formatCount(step.deltaFromPrevious)} vs prior`}
								</p>
							)}
						</li>
					))}
				</ol>
			</section>

			<div className="grid gap-3 lg:grid-cols-5">
				<section className={cn(PANEL, "overflow-hidden lg:col-span-3")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Run summary
						</p>
					</div>
					<p className="border-b border-border/40 px-4 py-3 text-[13px] text-muted-foreground">
						{detail.summary}
					</p>
					<dl className="grid gap-0 sm:grid-cols-2">
						{(
							[
								["Run ID", detail.runId, true],
								["Dataset", detail.dataset, false],
								["Environment", detail.environment, false],
								["Reporting period", detail.reportingPeriod, false],
								["Last run", detail.lastRunAt, false],
								["File generated", formatCount(detail.fileGenerated), false],
								["CMS rejected", formatCount(detail.cmsRejected), false],
								["Reject rate", `${detail.rejectRate}%`, false],
							] as const
						).map(([label, value, mono]) => (
							<div
								key={label}
								className="border-b border-border/40 px-4 py-3 sm:odd:border-r sm:odd:border-border/40"
							>
								<dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
									{label}
								</dt>
								<dd
									className={cn(
										"mt-1 text-[13px] font-medium text-foreground",
										mono && "break-all font-mono text-[12px]"
									)}
								>
									{value}
								</dd>
							</div>
						))}
					</dl>
					<div className="border-t border-border/50 px-4 py-3">
						<Button
							asChild
							variant="outline"
							size="sm"
							className="h-8 w-full rounded-sm border-border bg-background text-xs shadow-none"
						>
							<Link href={EXCEPTIONS_HREF}>
								Open {detail.exceptionDataset} exceptions
							</Link>
						</Button>
					</div>
				</section>

				<section className={cn(PANEL, "overflow-hidden lg:col-span-2")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Variance breakdown
						</p>
					</div>
					{detail.varianceSlices.length === 0 ? (
						<div className="flex items-start gap-3 px-4 py-6">
							<span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
								<CheckCircle2 className="size-4" />
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">
									No variance
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Source and CMS accepted are aligned for this run.
								</p>
							</div>
						</div>
					) : (
						<ul className="divide-y divide-border/40">
							{detail.varianceSlices.map((slice) => (
								<li key={slice.id} className="space-y-2 px-4 py-3">
									<div className="flex items-center justify-between gap-3">
										<span className="text-[12px] font-medium text-foreground">
											{slice.label}
										</span>
										<span className="text-[12px] font-semibold tabular-nums text-foreground">
											{formatCount(slice.count)}
										</span>
									</div>
									<div className="h-1.5 overflow-hidden rounded-full bg-muted">
										<div
											className={cn(
												"h-full rounded-full",
												VARIANCE_TONE[slice.tone] ?? "bg-primary"
											)}
											style={{
												width: `${Math.max(6, (slice.count / maxVariance) * 100)}%`,
											}}
										/>
									</div>
									<p className="text-[11px] text-muted-foreground">
										{slice.pct}% of dataset variance
									</p>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>

			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="border-b border-border/50 px-4 py-2.5">
					<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						Activity & notes
					</p>
				</div>
				<ul className="divide-y divide-border/40">
					{detail.notes.map((note) => (
						<li key={note.id} className="flex items-start gap-3 px-4 py-3">
							<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-medium text-foreground">
									{note.note}
								</p>
								<p className="mt-0.5 text-[11px] text-muted-foreground">
									{note.source} · {note.dateTime}
								</p>
							</div>
						</li>
					))}
				</ul>
			</section>

			<CmsEdgePageFooter />
		</div>
	);
}

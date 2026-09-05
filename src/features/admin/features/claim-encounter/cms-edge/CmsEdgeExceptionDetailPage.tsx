"use client";

import { useParams } from "next/navigation";

import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	ClipboardList,
	ExternalLink,
	FileWarning,
	type LucideIcon,
	UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_STATUS_PILL_CLASS,
	CmsEdgePageFooter,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CORRECTION_STATUS_STYLES,
	type CorrectionStatus,
	EXCEPTION_SEVERITY_STYLES,
	EXCEPTION_STATUS_STYLES,
	type ExceptionSeverity,
	type ExceptionStatus,
	VOID_STATUS_STYLES,
	useCmsEdgeExceptionDetailQuery,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PANEL =
	"rounded-sm border border-border/70 bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";

const LIST_HREF =
	"/admin/claim-encounter/regulatory/cms-edge-reporting/exceptions";

const SUBMISSION_DETAIL_BASE =
	"/admin/claim-encounter/regulatory/cms-edge-reporting/submissions";

function Pill({ label, className }: { label: string; className: string }) {
	return (
		<span className={cn(CMS_EDGE_STATUS_PILL_CLASS, className)}>{label}</span>
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
							"mt-1.5 text-2xl font-semibold tracking-tight",
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

function primaryActionLabel(
	severity: ExceptionSeverity,
	status: ExceptionStatus
) {
	if (status === "Open" && severity === "Critical") return "Review";
	if (status === "Open") return "Assign";
	if (status === "In Progress") return "Create Correction";
	return null;
}

export function CmsEdgeExceptionDetailPage() {
	const params = useParams<{ exceptionId: string }>();
	const exceptionId = decodeURIComponent(params.exceptionId ?? "");

	const detailQuery = useCmsEdgeExceptionDetailQuery(exceptionId);
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
					Back to Exceptions
				</Link>
				<section className={cn(PANEL, "px-4 py-10 text-center")}>
					<p className="text-sm text-muted-foreground">Loading exception…</p>
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
					Back to Exceptions
				</Link>
				<section className={cn(PANEL, "px-4 py-10 text-center")}>
					<p className="text-sm font-semibold text-foreground">
						{detailQuery.isError
							? "Failed to load exception"
							: "Exception not found"}
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						No exception matches{" "}
						<span className="font-mono text-foreground">{exceptionId}</span>.
					</p>
					<Button asChild className="mt-4 h-9 rounded-sm" size="sm">
						<Link href={LIST_HREF}>Return to list</Link>
					</Button>
				</section>
			</div>
		);
	}

	const primaryAction = primaryActionLabel(detail.severity, detail.status);

	return (
		<div className={cn(CMS_EDGE_PAGE_STACK, "px-1 sm:px-0")}>
			<div className="space-y-3 border-b border-border/50 pb-3">
				<Link
					href={LIST_HREF}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back to Exceptions
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="truncate font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
								{detail.id}
							</h1>
							<Pill
								label={detail.severity}
								className={EXCEPTION_SEVERITY_STYLES[detail.severity]}
							/>
							<Pill
								label={detail.status}
								className={EXCEPTION_STATUS_STYLES[detail.status]}
							/>
						</div>
						<p className="text-sm text-muted-foreground">
							{detail.errorCode} · {detail.dataset} · {detail.reportingPeriod}
						</p>
						<p className="text-sm text-foreground">{detail.description}</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{primaryAction ? (
							<Button
								size="sm"
								className="h-8 rounded-sm bg-primary px-3 text-[11px] font-semibold text-primary-foreground shadow-none hover:bg-primary/90"
								onClick={() =>
									toast.success(`${primaryAction} queued for ${detail.id}`)
								}
							>
								{primaryAction}
							</Button>
						) : null}
						{detail.status === "In Progress" || detail.status === "Open" ? (
							<Button
								variant="outline"
								size="sm"
								className="h-8 rounded-sm border-border bg-background text-[11px] shadow-none"
								onClick={() => toast.success(`Marked resolved · ${detail.id}`)}
							>
								Mark resolved
							</Button>
						) : null}
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
					label="Severity"
					value={detail.severity}
					hint={detail.impactSummary}
					icon={AlertTriangle}
					well="bg-red-600"
					valueTone="text-red-700 dark:text-red-300"
					accent="from-red-500/80 to-red-400/40"
				/>
				<MetricCard
					label="Owner"
					value={detail.owner}
					hint={`Detected ${detail.detectedAt}`}
					icon={UserRound}
					well="bg-sky-600"
					valueTone="text-sky-700 dark:text-sky-300"
					accent="from-sky-500/80 to-sky-400/40"
				/>
				<MetricCard
					label="Corrections"
					value={String(detail.corrections.length)}
					hint={
						detail.corrections[0]
							? detail.corrections[0].status
							: "None drafted yet"
					}
					icon={ClipboardList}
					well="bg-violet-600"
					valueTone="text-violet-700 dark:text-violet-300"
					accent="from-violet-500/80 to-violet-400/40"
				/>
				<MetricCard
					label="Voids / replacements"
					value={String(detail.voidReplacements.length)}
					hint={
						detail.voidReplacements[0]
							? detail.voidReplacements[0].action
							: "None linked"
					}
					icon={FileWarning}
					well="bg-amber-600"
					valueTone="text-amber-700 dark:text-amber-300"
					accent="from-amber-500/80 to-amber-400/40"
				/>
			</div>

			<div className="grid gap-3 lg:grid-cols-5">
				<section className={cn(PANEL, "overflow-hidden lg:col-span-3")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Exception summary
						</p>
					</div>
					<p className="border-b border-border/40 px-4 py-3 text-[13px] text-muted-foreground">
						{detail.remediation}
					</p>
					<dl className="grid gap-0 sm:grid-cols-2">
						{(
							[
								["Exception ID", detail.id, true],
								["Record ID", detail.recordId, true],
								["Dataset", detail.dataset, false],
								["Error type", detail.errorType, false],
								["Error code", detail.errorCode, true],
								["Source file", detail.sourceFile, true],
								["Field path", detail.fieldPath, true],
								["Reporting period", detail.reportingPeriod, false],
								["Expected", detail.expectedValue, false],
								["Actual", detail.actualValue, false],
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
				</section>

				<section className={cn(PANEL, "overflow-hidden lg:col-span-2")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Remediation path
						</p>
					</div>
					<ul className="divide-y divide-border/50">
						{(
							[
								{
									label: "1. Confirm source",
									value: "Validate against upstream enrollment / claims feed",
								},
								{
									label: "2. Draft correction",
									value:
										detail.corrections[0]?.changeSummary ??
										"Create correction with corrected field values",
								},
								{
									label: "3. Review & approve",
									value: "Owner + QA approve before EDGE resubmit",
								},
								{
									label: "4. Resubmit",
									value: `Include ${detail.recordId} in next ${detail.dataset} file`,
								},
							] as const
						).map((item) => (
							<li key={item.label} className="space-y-1 px-4 py-3">
								<p className="text-[11px] font-semibold text-muted-foreground">
									{item.label}
								</p>
								<p className="text-[13px] font-medium text-foreground">
									{item.value}
								</p>
							</li>
						))}
					</ul>
				</section>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Linked corrections · {detail.corrections.length}
						</p>
					</div>
					{detail.corrections.length === 0 ? (
						<div className="flex items-start gap-3 px-4 py-6">
							<span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
								<ClipboardList className="size-4" />
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">
									No corrections yet
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Use Create Correction when ready to remediate this record.
								</p>
							</div>
						</div>
					) : (
						<ul className="divide-y divide-border/40">
							{detail.corrections.map((item) => (
								<li
									key={item.id}
									className="flex items-start justify-between gap-3 px-4 py-3"
								>
									<div className="min-w-0">
										<p className="font-mono text-[12px] font-medium text-foreground">
											{item.id}
										</p>
										<p className="mt-0.5 truncate text-[12px] text-muted-foreground">
											{item.changeSummary}
										</p>
										<p className="mt-1 text-[11px] text-muted-foreground">
											{item.owner} · {item.updatedAt}
										</p>
									</div>
									<Pill
										label={item.status}
										className={
											CORRECTION_STATUS_STYLES[item.status as CorrectionStatus]
										}
									/>
								</li>
							))}
						</ul>
					)}
				</section>

				<section className={cn(PANEL, "overflow-hidden")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Voids & replacements · {detail.voidReplacements.length}
						</p>
					</div>
					{detail.voidReplacements.length === 0 ? (
						<div className="flex items-start gap-3 px-4 py-6">
							<span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
								<CheckCircle2 className="size-4" />
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">
									No void / replacement linked
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Use when the original claim must be voided or replaced in
									EDGE.
								</p>
							</div>
						</div>
					) : (
						<ul className="divide-y divide-border/40">
							{detail.voidReplacements.map((item) => (
								<li
									key={item.id}
									className="flex items-start justify-between gap-3 px-4 py-3"
								>
									<div className="min-w-0">
										<p className="font-mono text-[12px] font-medium text-foreground">
											{item.id} · {item.action}
										</p>
										<p className="mt-0.5 truncate text-[12px] text-muted-foreground">
											{item.reason}
										</p>
										<p className="mt-1 text-[11px] text-muted-foreground">
											{item.owner} · {item.submittedAt}
										</p>
									</div>
									<Pill
										label={item.status}
										className={VOID_STATUS_STYLES[item.status]}
									/>
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

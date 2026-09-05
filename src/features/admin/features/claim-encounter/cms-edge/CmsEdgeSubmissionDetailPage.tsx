"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";

import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock3,
	CloudUpload,
	Download,
	FileCheck2,
	FileText,
	type LucideIcon,
	RefreshCw,
	Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_STATUS_PILL_CLASS,
	CmsEdgePageFooter,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	CMS_EDGE_SUBMISSION_NOTES,
	CMS_EDGE_SUBMISSION_PROCESS_STEPS,
	type CmsEdgeSubmissionDetail,
	SUBMISSION_CMS_RESPONSE_STYLES,
	useCmsEdgeSubmissionDetailQuery,
} from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";
import { formatCount } from "@/features/admin/features/claim-encounter/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PANEL =
	"rounded-sm border border-border/70 bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";

const LIST_HREF =
	"/admin/claim-encounter/regulatory/cms-edge-reporting/submissions";

const PROCESS_ICONS: LucideIcon[] = [
	FileCheck2,
	CloudUpload,
	Send,
	CheckCircle2,
];

type SubmissionFileItem = {
	id: string;
	name: string;
	kind: string;
	sizeLabel: string;
	format: string;
	primary?: boolean;
};

function filesForDetail(detail: CmsEdgeSubmissionDetail): SubmissionFileItem[] {
	const base = detail.fileName.replace(/\.[^.]+$/, "");
	const ext = detail.fileName.split(".").pop()?.toUpperCase() ?? "XML";

	const files: SubmissionFileItem[] = [
		{
			id: "edge-payload",
			name: detail.fileName,
			kind: "EDGE submission",
			sizeLabel: "2.4 MB",
			format: ext,
			primary: true,
		},
		{
			id: "manifest",
			name: `${base}_Manifest.json`,
			kind: "Submission manifest",
			sizeLabel: "12 KB",
			format: "JSON",
		},
		{
			id: "control",
			name: `${base}_Control.txt`,
			kind: "Control / checksum",
			sizeLabel: "4 KB",
			format: "TXT",
		},
	];

	for (const response of detail.cmsResponses) {
		if (response.status !== "Received") continue;
		const slug = response.label.replace(/\s+/g, "_");
		files.push({
			id: slug,
			name: `${detail.id}_${slug}.xml`,
			kind: response.label,
			sizeLabel: "180 KB",
			format: "XML",
		});
	}

	return files;
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

function DownloadPrimaryButton({
	label,
	onClick,
	className,
}: {
	label: string;
	onClick: () => void;
	className?: string;
}) {
	return (
		<Button
			size="sm"
			onClick={onClick}
			className={cn(
				"h-8 gap-1.5 rounded-sm bg-primary px-3 text-[11px] font-semibold text-primary-foreground shadow-none",
				"hover:bg-primary/90",
				"focus-visible:ring-2 focus-visible:ring-primary/30",
				className
			)}
		>
			<Download className="size-3.5" />
			{label}
		</Button>
	);
}

function SubmissionFilesPanel({
	files,
	onDownloadOne,
}: {
	files: SubmissionFileItem[];
	onDownloadOne: (file: SubmissionFileItem) => void;
}) {
	return (
		<section className={cn(PANEL, "overflow-hidden")}>
			<div className="border-b border-border/50 px-3 py-2">
				<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
					Files · {files.length}
				</p>
			</div>

			<ul className="grid gap-px bg-border/40 sm:grid-cols-2">
				{files.map((file) => (
					<li
						key={file.id}
						className={cn(
							"flex items-center gap-2.5 bg-card px-3 py-2 transition-colors hover:bg-muted/40",
							file.primary && "sm:col-span-2"
						)}
					>
						<span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
							<FileText className="size-3.5" />
						</span>

						<div className="min-w-0 flex-1">
							<div className="flex min-w-0 items-center gap-1.5">
								<p className="truncate font-mono text-[11px] font-medium text-foreground">
									{file.name}
								</p>
								{file.primary ? (
									<span className="shrink-0 rounded-sm bg-primary/10 px-1 py-px text-[9px] font-semibold text-primary">
										Primary
									</span>
								) : null}
							</div>
							<p className="truncate text-[10px] text-muted-foreground">
								{file.kind} · {file.format} · {file.sizeLabel}
							</p>
						</div>

						<button
							type="button"
							aria-label={`Download ${file.name}`}
							className="flex size-7 shrink-0 items-center justify-center rounded-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
							onClick={() => onDownloadOne(file)}
						>
							<Download className="size-3.5" />
						</button>
					</li>
				))}
			</ul>
		</section>
	);
}

export function CmsEdgeSubmissionDetailPage() {
	const params = useParams<{ submissionId: string }>();
	const submissionId = decodeURIComponent(params.submissionId ?? "");

	const detailQuery = useCmsEdgeSubmissionDetailQuery(submissionId);
	const detail = detailQuery.data ?? null;
	const isLoading = detailQuery.isLoading || detailQuery.isFetching;

	const notes = useMemo(() => {
		if (!detail) return [];
		if (detail.id === "SUB-2027-000001") return CMS_EDGE_SUBMISSION_NOTES;
		return [
			{
				id: `${detail.id}-n1`,
				dateTime: detail.submittedDateTime.replace(" ET", ""),
				source: "System",
				note: `${detail.fileType} file submitted to CMS EDGE ${detail.environment}.`,
			},
			{
				id: `${detail.id}-n2`,
				dateTime: detail.submittedDateTime.replace(" ET", ""),
				source: detail.submittedBy,
				note:
					detail.status === "Failed"
						? "CMS validation returned blocking errors. Remediation required before resubmit."
						: detail.status === "Processing"
							? "Awaiting CMS processing response."
							: "CMS acceptance confirmed for this submission.",
			},
		];
	}, [detail]);

	const files = useMemo(() => (detail ? filesForDetail(detail) : []), [detail]);

	if (isLoading && !detail) {
		return (
			<div className={cn(CMS_EDGE_PAGE_STACK, "px-1")}>
				<Link
					href={LIST_HREF}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back to Submissions
				</Link>
				<section className={cn(PANEL, "px-4 py-10 text-center")}>
					<p className="text-sm text-muted-foreground">Loading submission…</p>
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
					Back to Submissions
				</Link>
				<section className={cn(PANEL, "px-4 py-10 text-center")}>
					<p className="text-sm font-semibold text-foreground">
						{detailQuery.isError
							? "Failed to load submission"
							: "Submission not found"}
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						No submission matches{" "}
						<span className="font-mono text-foreground">{submissionId}</span>.
					</p>
					<Button asChild className="mt-4 h-9 rounded-sm" size="sm">
						<Link href={LIST_HREF}>Return to list</Link>
					</Button>
				</section>
			</div>
		);
	}

	return (
		<div className={cn(CMS_EDGE_PAGE_STACK, "px-1 sm:px-0")}>
			<div className="space-y-3 border-b border-border/50 pb-3">
				<Link
					href={LIST_HREF}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back to Submissions
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<h1 className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							{detail.id}
						</h1>
						<p className="text-sm text-muted-foreground">
							{detail.fileType} · {detail.reportingPeriod}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<DownloadPrimaryButton
							label="Download files"
							onClick={() =>
								toast.success(`Download queued for ${detail.fileName}`)
							}
						/>
						{detail.status === "Failed" ? (
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 rounded-sm border-border bg-background shadow-none"
								onClick={() =>
									toast.success(`Resubmit queued for ${detail.id}`)
								}
							>
								<RefreshCw className="size-3.5" />
								Resubmit
							</Button>
						) : null}
					</div>
				</div>
			</div>

			<SubmissionFilesPanel
				files={files}
				onDownloadOne={(file) =>
					toast.success(`Download queued for ${file.name}`)
				}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Total records"
					value={formatCount(detail.totalRecords)}
					hint="Submitted volume"
					icon={FileText}
					well="bg-sky-600"
					valueTone="text-sky-700 dark:text-sky-300"
					accent="from-sky-500/80 to-sky-400/40"
				/>
				<MetricCard
					label="Accepted"
					value={formatCount(detail.acceptedRecords)}
					hint={`${detail.acceptedPercent}% of total`}
					icon={CheckCircle2}
					well="bg-emerald-600"
					valueTone="text-emerald-700 dark:text-emerald-300"
					accent="from-emerald-500/80 to-emerald-400/40"
				/>
				<MetricCard
					label="Rejected"
					value={formatCount(detail.rejectedRecords)}
					hint={`${detail.rejectedPercent}% of total`}
					icon={AlertCircle}
					well="bg-red-600"
					valueTone="text-red-700 dark:text-red-300"
					accent="from-red-500/80 to-red-400/40"
				/>
				<MetricCard
					label="Warnings"
					value={formatCount(detail.warnings)}
					hint="Non-blocking flags"
					icon={Clock3}
					well="bg-amber-600"
					valueTone="text-amber-700 dark:text-amber-300"
					accent="from-amber-500/80 to-amber-400/40"
				/>
			</div>

			<div className="grid gap-3 lg:grid-cols-5">
				<section className={cn(PANEL, "overflow-hidden lg:col-span-3")}>
					<div className="border-b border-border/50 px-4 py-2.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Submission summary
						</p>
					</div>
					<dl className="grid gap-0 sm:grid-cols-2">
						{(
							[
								["Submission ID", detail.id, true],
								["File type", detail.fileType, false],
								["Environment", detail.environment, false],
								["Reporting period", detail.reportingPeriod, false],
								["Submitted", detail.submittedDateTime, false],
								["Submitted by", detail.submittedBy, false],
								["Status", detail.status, false],
								["Primary file", detail.fileName, true],
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
							CMS responses
						</p>
					</div>
					<ul className="divide-y divide-border/50">
						{detail.cmsResponses.map((item) => (
							<li
								key={item.label}
								className="flex items-center justify-between gap-3 px-4 py-3"
							>
								<span className="text-[13px] font-medium text-foreground">
									{item.label}
								</span>
								<span
									className={cn(
										CMS_EDGE_STATUS_PILL_CLASS,
										SUBMISSION_CMS_RESPONSE_STYLES[item.status]
									)}
								>
									{item.status}
								</span>
							</li>
						))}
					</ul>
					<div className="border-t border-border/50 px-4 py-3">
						<Button
							asChild
							variant="outline"
							size="sm"
							className="h-8 w-full rounded-sm border-border bg-background text-xs shadow-none"
						>
							<Link href="/admin/claim-encounter/regulatory/cms-edge-reporting/cms-responses">
								View related responses
							</Link>
						</Button>
					</div>
				</section>
			</div>

			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="border-b border-border/50 px-4 py-2.5">
					<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						Lifecycle
					</p>
				</div>
				<ol className="grid gap-0 sm:grid-cols-4">
					{CMS_EDGE_SUBMISSION_PROCESS_STEPS.map((step, index) => {
						const Icon = PROCESS_ICONS[index] ?? FileCheck2;
						const isDone = index < detail.lifecycleStepIndex;
						const isActive = index === detail.lifecycleStepIndex;
						const isLast =
							index === CMS_EDGE_SUBMISSION_PROCESS_STEPS.length - 1;
						const failedActive = isActive && detail.status === "Failed";

						return (
							<li
								key={step.id}
								className={cn(
									"flex gap-3 px-4 py-4",
									!isLast && "sm:border-r sm:border-border/50"
								)}
							>
								<span
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-full",
										isDone && "bg-emerald-600 text-white",
										isActive &&
											!failedActive &&
											"bg-sky-600 text-white ring-4 ring-sky-500/20",
										failedActive &&
											"bg-red-600 text-white ring-4 ring-red-500/20",
										!isDone && !isActive && "bg-muted text-muted-foreground"
									)}
								>
									{failedActive ? (
										<AlertCircle className="size-4" />
									) : (
										<Icon className="size-4" />
									)}
								</span>
								<div className="min-w-0">
									<p className="text-[12px] font-semibold text-foreground">
										{step.title}
									</p>
									<p className="mt-0.5 text-[11px] text-muted-foreground">
										{failedActive
											? "CMS processing returned failures"
											: step.description}
									</p>
								</div>
							</li>
						);
					})}
				</ol>
			</section>

			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="border-b border-border/50 px-4 py-2.5">
					<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						Activity & notes
					</p>
				</div>
				<ul className="divide-y divide-border/40">
					{notes.map((note) => (
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

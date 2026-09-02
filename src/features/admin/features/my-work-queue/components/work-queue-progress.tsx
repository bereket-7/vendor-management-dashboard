"use client";

import { useEffect, useState } from "react";

import {
	Calendar,
	Check,
	ChevronRight,
	FileText,
	Link2,
	MoreHorizontal,
	Server,
	X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
	type ConnectionProgress,
	EDI_MILESTONE_DEFS,
	type GuideTrack,
	type MilestoneState,
	type ProgressTrack,
	SFTP_MILESTONE_DEFS,
	WORK_QUEUE_GUIDE_TRACKS,
	emptyProgressSummary,
	progressFromMilestones,
} from "../progress-data";
import {
	applyMilestoneDateChange,
	canSetEdiProgress,
	percentFromCompletedKeys,
	toggleMilestoneCompletion,
	validateEdiMilestoneSave,
} from "../progress-rules";
import type { TpaTpvRow } from "../work-queue-types";

type StatCardColor = "blue" | "green";

const STAT_COLOR: Record<
	StatCardColor,
	{ bar: string; circle: string; rowTitle: string }
> = {
	blue: {
		bar: "bg-blue-600",
		circle: "border-blue-600 text-blue-600",
		rowTitle: "text-blue-600",
	},
	green: {
		bar: "bg-green-600",
		circle: "border-green-600 text-green-600",
		rowTitle: "text-green-600",
	},
};

const TRACK_BAR: Record<ProgressTrack, string> = {
	sftp: "bg-blue-600",
	edi: "bg-green-600",
};

const PROGRESS_PANEL_CLASS =
	"rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

export function CompletionStatCard({
	label,
	percentage,
	completedCount,
	totalCount,
	color,
	className,
	waveFilter,
	waves,
	onWaveFilterChange,
}: {
	label: string;
	percentage: number;
	completedCount: number;
	totalCount: number;
	color: StatCardColor;
	className?: string;
	waveFilter?: string;
	waves?: string[];
	onWaveFilterChange?: (wave: string) => void;
}) {
	const safe = Math.min(100, Math.max(0, percentage));

	return (
		<div
			className={cn(
				PROGRESS_PANEL_CLASS,
				"relative flex flex-col justify-center p-4",
				className
			)}
		>
			{onWaveFilterChange ? (
				<div className="absolute top-3.5 right-3.5">
					<Select value={waveFilter} onValueChange={onWaveFilterChange}>
						<SelectTrigger className="h-7 w-[108px] rounded-sm border-border/50 bg-background px-2 text-[11px] shadow-none">
							<SelectValue placeholder="All waves" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All waves</SelectItem>
							{(waves ?? []).map((wave) => (
								<SelectItem key={wave} value={wave}>
									Wave {wave}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}
			<p
				className={cn(
					"text-xs font-semibold text-foreground",
					onWaveFilterChange && "pr-28"
				)}
			>
				{label}
			</p>
			<div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
				<span className="text-2xl font-bold tabular-nums text-foreground">
					{safe}%
				</span>
				<span className="text-xs text-muted-foreground">
					{completedCount} of {totalCount} fully complete
				</span>
			</div>
			<div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					className={cn(
						"h-full rounded-full transition-[width] duration-500 ease-out",
						STAT_COLOR[color].bar
					)}
					style={{ width: `${safe}%` }}
				/>
			</div>
		</div>
	);
}

function GuideMilestoneNode({
	milestone,
	color,
}: {
	milestone: GuideTrack["milestones"][number];
	color: StatCardColor;
}) {
	return (
		<div className="flex w-[58px] shrink-0 flex-col items-center gap-1">
			<div
				className={cn(
					"flex size-8 items-center justify-center rounded-full border bg-card text-[10px] font-semibold tabular-nums",
					STAT_COLOR[color].circle
				)}
			>
				{milestone.percent}
			</div>
			<p className="min-h-[2.75rem] text-center text-[9px] leading-snug text-muted-foreground">
				{milestone.label}
			</p>
		</div>
	);
}

function GuideTrackRow({ track }: { track: GuideTrack }) {
	return (
		<div className="flex min-w-0 items-start gap-2.5">
			<p
				className={cn(
					"w-20 shrink-0 pt-2 text-[11px] leading-tight font-bold",
					STAT_COLOR[track.color].rowTitle
				)}
			>
				{track.name}
			</p>
			<div className="min-w-0 flex-1 overflow-x-auto">
				<div className="flex w-max items-start">
					{track.milestones.map((milestone, index) => (
						<div
							key={`${track.name}-${milestone.percent}`}
							className="flex items-start"
						>
							<GuideMilestoneNode milestone={milestone} color={track.color} />
							{index < track.milestones.length - 1 ? (
								<ChevronRight className="mx-0.5 mt-2.5 size-3 shrink-0 text-muted-foreground/55" />
							) : null}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function MilestoneStepperPanel({
	tracks = WORK_QUEUE_GUIDE_TRACKS,
	className,
}: {
	tracks?: GuideTrack[];
	className?: string;
}) {
	return (
		<div
			className={cn(
				PROGRESS_PANEL_CLASS,
				"min-h-[192px] p-4 py-4 lg:min-h-[208px]",
				className
			)}
		>
			<p className="text-[13px] font-semibold text-foreground">
				Progress Guide{" "}
				<span className="font-normal text-muted-foreground">
					(Milestone Weighting)
				</span>
			</p>
			<div className="mt-3 space-y-4">
				{tracks.map((track) => (
					<GuideTrackRow key={track.name} track={track} />
				))}
			</div>
		</div>
	);
}

function ProgressBar({
	percent,
	track,
	className,
}: {
	percent: number;
	track: ProgressTrack;
	className?: string;
}) {
	const safe = Math.min(100, Math.max(0, percent));
	return (
		<div
			className={cn(
				"h-1.5 w-full overflow-hidden rounded-full bg-muted",
				className
			)}
		>
			<div
				className={cn(
					"h-full rounded-full transition-[width] duration-500 ease-out",
					TRACK_BAR[track]
				)}
				style={{ width: `${safe}%` }}
			/>
		</div>
	);
}

export function WorkQueueProgressOverview({
	summary = emptyProgressSummary(),
	tracks = WORK_QUEUE_GUIDE_TRACKS,
	waveFilter = "all",
	waves = [],
	onWaveFilterChange,
	waveSummaryUnavailable = false,
}: {
	summary?: ReturnType<typeof emptyProgressSummary>;
	tracks?: GuideTrack[];
	waveFilter?: string;
	waves?: string[];
	onWaveFilterChange?: (wave: string) => void;
	waveSummaryUnavailable?: boolean;
}) {
	return (
		<section className="space-y-2">
			{waveSummaryUnavailable ? (
				<p className="text-xs text-muted-foreground">
					Wave summary unavailable — case list could not be loaded.
				</p>
			) : null}
			<div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-4">
				<CompletionStatCard
					label="Overall SFTP Completion"
					percentage={summary.sftp.percent}
					completedCount={summary.sftp.completeCount}
					totalCount={summary.sftp.totalCount}
					color="blue"
					waveFilter={waveFilter}
					waves={waves}
					onWaveFilterChange={onWaveFilterChange}
				/>
				<CompletionStatCard
					label="Overall EDI Completion"
					percentage={summary.edi.percent}
					completedCount={summary.edi.completeCount}
					totalCount={summary.edi.totalCount}
					color="green"
				/>
				<MilestoneStepperPanel tracks={tracks} className="lg:col-span-2" />
			</div>
		</section>
	);
}

function milestoneTone(percent: number): string {
	if (percent >= 100) return "text-emerald-600 dark:text-emerald-400";
	if (percent >= 50) return "text-sky-600 dark:text-sky-400";
	if (percent > 0) return "text-amber-600 dark:text-amber-400";
	return "text-muted-foreground";
}

export function ProgressTrackCell({
	progress,
	track,
}: {
	progress: ConnectionProgress;
	track: ProgressTrack;
}) {
	return (
		<div className="space-y-1">
			<div className="flex items-center gap-2">
				<ProgressBar
					percent={progress.percent}
					track={track}
					className="flex-1"
				/>
				<span className="w-8 shrink-0 text-right text-[10px] font-semibold tabular-nums text-foreground">
					{progress.percent}%
				</span>
			</div>
			<p
				className={cn(
					"flex items-center gap-1 truncate text-[11px] font-medium",
					milestoneTone(progress.percent)
				)}
				title={progress.currentMilestone}
			>
				<span
					className={cn(
						"size-1.5 shrink-0 rounded-full",
						progress.percent >= 100
							? "bg-emerald-500"
							: progress.percent > 0
								? "bg-sky-500"
								: "bg-muted-foreground/40"
					)}
				/>
				{progress.currentMilestone}
			</p>
			<p className="truncate text-[10px] tabular-nums text-muted-foreground">
				{progress.lastUpdated || "—"}
			</p>
		</div>
	);
}

function MilestoneDateField({
	id,
	value,
	onChange,
	disabled,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}) {
	return (
		<div className="relative">
			<Input
				id={id}
				value={value}
				disabled={disabled}
				onChange={(e) => onChange(e.target.value)}
				placeholder="MM/DD/YYYY"
				className="h-9 rounded-sm border-border bg-background pr-9 pl-2 text-center text-xs tabular-nums shadow-none"
			/>
			<Calendar
				aria-hidden
				className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
			/>
		</div>
	);
}

function MilestoneCompleteToggle({
	complete,
	onToggle,
	disabled,
}: {
	complete: boolean;
	onToggle: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onToggle}
			className={cn(
				"flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
				disabled ? "cursor-not-allowed opacity-40" : "hover:bg-muted/60"
			)}
			aria-label={complete ? "Mark incomplete" : "Mark complete"}
		>
			{complete ? (
				<span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
					<Check className="size-3.5 stroke-[3]" />
				</span>
			) : (
				<span className="size-6 rounded-full border-2 border-muted-foreground/25 bg-background" />
			)}
		</button>
	);
}

type WorkQueueProgressEditorProps = {
	row: TpaTpvRow;
	track: ProgressTrack;
	onClose?: () => void;
	onSave: (rowId: string, progress: ConnectionProgress) => void;
	saving?: boolean;
	variant?: "panel" | "inline";
};

export function WorkQueueProgressEditor({
	row,
	track,
	onClose,
	onSave,
	saving,
	variant = "panel",
}: WorkQueueProgressEditorProps) {
	const progress = track === "sftp" ? row.sftpProgress : row.ediProgress;
	const milestoneDefs =
		track === "sftp" ? SFTP_MILESTONE_DEFS : EDI_MILESTONE_DEFS;
	const ediBlocked =
		track === "edi" && !canSetEdiProgress(row.sftpProgress.percent);

	const [milestones, setMilestones] = useState<MilestoneState[]>([]);
	const [notes, setNotes] = useState("");

	useEffect(() => {
		setMilestones(progress.milestones.map((m) => ({ ...m })));
		setNotes(progress.notes);
	}, [progress, row.id, track]);

	function defaultMilestoneDate() {
		return new Date().toLocaleDateString("en-US", {
			month: "2-digit",
			day: "2-digit",
			year: "numeric",
		});
	}

	function applyCompletionRows(
		prev: MilestoneState[],
		rows: Array<{ key: string; completedAt: string | null }>
	): MilestoneState[] {
		const byKey = new Map(rows.map((row) => [row.key, row.completedAt]));
		return prev.map((m) => ({
			...m,
			completedAt: byKey.get(m.key) ?? null,
		}));
	}

	function toggleMilestone(key: string, checked: boolean) {
		if (ediBlocked) return;
		const today = defaultMilestoneDate();
		setMilestones((prev) =>
			applyCompletionRows(
				prev,
				toggleMilestoneCompletion(
					milestoneDefs,
					prev.map((m) => ({ key: m.key, completedAt: m.completedAt })),
					key,
					checked,
					today
				)
			)
		);
	}

	function handleDateChange(key: string, date: string) {
		if (ediBlocked) return;
		const today = defaultMilestoneDate();
		setMilestones((prev) =>
			applyCompletionRows(
				prev,
				applyMilestoneDateChange(
					milestoneDefs,
					prev.map((m) => ({ key: m.key, completedAt: m.completedAt })),
					key,
					date,
					today
				)
			)
		);
	}

	function handleSave() {
		if (track === "edi") {
			const err = validateEdiMilestoneSave(
				row.sftpProgress.percent,
				milestones
			);
			if (err) {
				toast.error(err);
				return;
			}
		}

		const next = progressFromMilestones(milestones, {
			updatedBy: progress.updatedBy || row.assignedAnalyst,
			updatedAt: new Date().toLocaleString("en-US", {
				month: "2-digit",
				day: "2-digit",
				year: "numeric",
				hour: "numeric",
				minute: "2-digit",
			}),
			notes,
		});
		onSave(row.id, { ...next, notes });
	}

	const title =
		track === "sftp" ? "Update SFTP Progress" : "Update EDI Progress";

	const livePercent = percentFromCompletedKeys(
		milestoneDefs,
		milestones.filter((m) => m.completedAt).map((m) => m.key)
	);

	const editorBody = (
		<>
			{ediBlocked ? (
				<p className="mb-3 rounded-sm border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
					EDI milestones require SFTP at 100% (currently{" "}
					{row.sftpProgress.percent}%). Complete SFTP first.
				</p>
			) : (
				<p className="mb-3 text-xs text-muted-foreground">
					Current progress:{" "}
					<span className="font-medium tabular-nums text-foreground">
						{livePercent}%
					</span>
				</p>
			)}

			<div className="space-y-2">
				{milestones.map((m) => {
					const complete = Boolean(m.completedAt);
					return (
						<div
							key={m.key}
							className="grid grid-cols-[minmax(0,1fr)_118px_24px] items-center gap-2.5 sm:grid-cols-[minmax(0,1fr)_132px_24px] sm:gap-3"
						>
							<label
								htmlFor={`${row.id}-${m.key}`}
								className="text-[13px] leading-snug font-medium text-foreground"
							>
								{m.label}
							</label>
							<MilestoneDateField
								id={`${row.id}-${m.key}`}
								value={m.completedAt ?? ""}
								disabled={ediBlocked}
								onChange={(date) => handleDateChange(m.key, date)}
							/>
							<MilestoneCompleteToggle
								complete={complete}
								disabled={ediBlocked}
								onToggle={() => toggleMilestone(m.key, !complete)}
							/>
						</div>
					);
				})}
			</div>

			<div className="mt-4">
				<p className="mb-1.5 text-sm font-semibold text-foreground">Notes</p>
				<div className="relative">
					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value.slice(0, 500))}
						rows={4}
						placeholder="Add notes about this progress update…"
						className="min-h-[88px] resize-none rounded-sm border-border/60 bg-background pb-6 text-sm shadow-none"
					/>
					<p className="pointer-events-none absolute right-2.5 bottom-2 text-[11px] text-muted-foreground tabular-nums">
						{notes.length}/500
					</p>
				</div>
			</div>

			{progress.updatedBy ? (
				<p className="mt-3 text-center text-xs text-muted-foreground">
					Updated by{" "}
					<span className="font-medium text-foreground">
						{progress.updatedBy}
					</span>
					{progress.updatedAt ? ` on ${progress.updatedAt}` : ""}
				</p>
			) : null}

			<div className="mt-3.5 flex justify-end gap-2 pb-0.5">
				{onClose ? (
					<Button
						variant="outline"
						size="sm"
						className="h-9 min-w-[92px] rounded-sm shadow-none"
						onClick={onClose}
					>
						Cancel
					</Button>
				) : null}
				<Button
					size="sm"
					className="h-9 min-w-[92px] rounded-sm shadow-none"
					disabled={saving || ediBlocked}
					onClick={handleSave}
				>
					Save progress
				</Button>
			</div>
		</>
	);

	if (variant === "inline") {
		return (
			<div className="space-y-1">
				<p className="text-sm text-muted-foreground">
					Mark milestones complete and add dates for {row.name}.
				</p>
				<div className="mt-4">{editorBody}</div>
			</div>
		);
	}

	return (
		<div className="flex max-h-[min(80vh,560px)] flex-col">
			<div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2.5">
					<span
						aria-hidden
						className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary"
					>
						<FileText className="size-4" />
					</span>
					<p className="truncate text-base font-semibold text-foreground">
						{title}
					</p>
				</div>
				{onClose ? (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 shrink-0 text-muted-foreground"
						onClick={onClose}
						aria-label="Close"
					>
						<X className="size-4" />
					</Button>
				) : null}
			</div>

			<div className="overflow-y-auto px-4 py-3.5">{editorBody}</div>
		</div>
	);
}

type WorkQueueRowActionsProps = {
	row: TpaTpvRow;
	onOpenContacts: () => void;
};

export function WorkQueueRowActions({
	row,
	onOpenContacts,
}: WorkQueueRowActionsProps) {
	return (
		<div className="flex items-center justify-end">
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						aria-label={`Actions for ${row.name}`}
					>
						<MoreHorizontal className="size-3.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-52">
					<DropdownMenuItem asChild>
						<Link href={`/admin/my-work-queue/${row.id}?tab=sftp`}>
							<Server className="mr-2 size-3.5" />
							Update SFTP Progress
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href={`/admin/my-work-queue/${row.id}?tab=edi`}>
							<Server className="mr-2 size-3.5" />
							Update EDI Progress
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={onOpenContacts}>
						<Link2 className="mr-2 size-3.5" />
						Contacts Information
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

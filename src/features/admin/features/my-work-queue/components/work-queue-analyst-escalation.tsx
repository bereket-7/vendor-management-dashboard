"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { WorkQueueBlockerRowDto } from "@/lib/vendor-core/types";

import {
	type AnalystProgressRow,
	ESCALATION_STATUS_LABEL,
	type EscalationStatus,
	type EscalationSummary,
	analystAvatarTone,
	analystInitials,
	listEscalationItems,
	summarizeAnalystProgress,
	summarizeEscalations,
} from "../work-queue-analyst-escalation";
import type { TpaTpvRow } from "../work-queue-types";

/** Matches work-queue cards (detail page, main table, progress overview). */
const PANEL =
	"overflow-hidden rounded-sm border border-border/60 bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const PANEL_HEADER = "border-b border-border/50 px-3 py-2";
const PANEL_TITLE = "text-xs font-semibold text-foreground";
const PANEL_SUBTITLE = "text-[11px] leading-snug text-muted-foreground";
const COMPACT_TABLE =
	"[&_th]:h-7 [&_th]:px-2 [&_th]:py-0 [&_td]:px-2 [&_td]:py-1.5";
const TABLE_HEAD =
	"text-[10px] font-medium text-muted-foreground whitespace-nowrap";

const ESCALATION_CARD = "rounded-md border p-2.5 shadow-none";

export function AnalystAvatar({
	name,
	compact = false,
}: {
	name: string;
	compact?: boolean;
}) {
	const initials = analystInitials(name);
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1",
				compact ? "size-6 text-[9px]" : "size-7 text-[10px]",
				analystAvatarTone(name)
			)}
		>
			{initials}
		</span>
	);
}

function pctCell(
	value: number,
	pct: number,
	tone: "green" | "orange" | "red" | "muted",
	compact = false
) {
	const pctTone = {
		green: "text-emerald-600 dark:text-emerald-400",
		orange: "text-orange-600 dark:text-orange-400",
		red: "text-red-600 dark:text-red-400",
		muted: "text-muted-foreground",
	}[tone];

	return (
		<span className={cn("tabular-nums", compact ? "text-xs" : "text-sm")}>
			{value} <span className={cn("font-semibold", pctTone)}>({pct}%)</span>
		</span>
	);
}

function metricCell(
	value: number,
	pct: number,
	tone: "green" | "orange" | "red" | "muted"
) {
	const pctTone = {
		green: "text-emerald-600 dark:text-emerald-400",
		orange: "text-orange-600 dark:text-orange-400",
		red: "text-red-600 dark:text-red-400",
		muted: "text-muted-foreground",
	}[tone];
	const barTone = {
		green: "bg-emerald-500/70",
		orange: "bg-orange-500/70",
		red: "bg-red-500/70",
		muted: "bg-muted-foreground/35",
	}[tone];

	return (
		<div className="min-w-[68px]">
			<div className="flex items-baseline justify-between gap-1 tabular-nums">
				<span className="text-xs font-medium text-foreground">{value}</span>
				<span className={cn("text-[10px] font-semibold", pctTone)}>{pct}%</span>
			</div>
			<div className="mt-1 h-1 overflow-hidden rounded-full bg-muted/80">
				<div
					className={cn("h-full rounded-full transition-[width]", barTone)}
					style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
				/>
			</div>
		</div>
	);
}

export function EdiAnalystProgressSection({
	rows,
	analysts: analystsProp,
	loading = false,
	activeAnalyst,
	statusEstimated = false,
	onAnalystSelect,
}: {
	rows: TpaTpvRow[];
	analysts?: AnalystProgressRow[];
	loading?: boolean;
	activeAnalyst: string;
	statusEstimated?: boolean;
	onAnalystSelect: (analyst: string) => void;
}) {
	const analysts: AnalystProgressRow[] =
		analystsProp ?? summarizeAnalystProgress(rows);

	return (
		<section className={cn(PANEL, "min-w-0 text-xs")}>
			<div className={PANEL_HEADER}>
				<h2 className={PANEL_TITLE}>EDI Analyst Progress</h2>
				<p className={cn(PANEL_SUBTITLE, "mt-0.5")}>
					Workload and completion by analyst.
					{statusEstimated ? (
						<span className="mt-0.5 block text-[10px] italic text-muted-foreground/90">
							SFTP/EDI estimated from migration status until progress is live.
						</span>
					) : null}
				</p>
			</div>
			<div className="overflow-x-auto">
				{loading ? (
					<p className="px-3 py-4 text-[11px] text-muted-foreground">
						Loading analyst stats…
					</p>
				) : (
					<Table className={COMPACT_TABLE}>
						<TableHeader>
							<TableRow className="bg-muted/20 hover:bg-muted/20">
								<TableHead className={cn(TABLE_HEAD, "w-7 text-center")}>
									#
								</TableHead>
								<TableHead className={TABLE_HEAD}>Analyst</TableHead>
								<TableHead className={cn(TABLE_HEAD, "text-right")}>
									Asgn
								</TableHead>
								<TableHead className={TABLE_HEAD}>SFTP</TableHead>
								<TableHead className={TABLE_HEAD}>EDI</TableHead>
								<TableHead className={TABLE_HEAD}>Active</TableHead>
								<TableHead className={TABLE_HEAD}>Blocked</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{analysts.map((row, index) => {
								const isUnassigned = row.analyst === "Unassigned";
								const selected = activeAnalyst === row.analyst;
								return (
									<TableRow
										key={row.analyst}
										className={cn(
											"transition-colors",
											!isUnassigned && "cursor-pointer hover:bg-muted/30",
											selected &&
												"border-l-2 border-l-primary bg-primary/5 hover:bg-primary/5"
										)}
										onClick={() => {
											if (isUnassigned) return;
											onAnalystSelect(selected ? "all" : row.analyst);
										}}
									>
										<TableCell className="text-center text-[11px] font-medium tabular-nums text-muted-foreground">
											{index + 1}
										</TableCell>
										<TableCell>
											<span className="flex min-w-[120px] items-center gap-1.5">
												<AnalystAvatar name={row.analyst} compact />
												<span className="truncate text-xs font-medium">
													{row.analyst}
												</span>
											</span>
										</TableCell>
										<TableCell className="text-right text-xs font-semibold tabular-nums">
											{isUnassigned ? "—" : row.assigned}
										</TableCell>
										<TableCell>
											{isUnassigned
												? "—"
												: metricCell(row.sftpComplete, row.sftpPct, "green")}
										</TableCell>
										<TableCell>
											{isUnassigned
												? "—"
												: metricCell(row.ediComplete, row.ediPct, "green")}
										</TableCell>
										<TableCell>
											{isUnassigned
												? "—"
												: metricCell(
														row.inProgress,
														row.inProgressPct,
														"orange"
													)}
										</TableCell>
										<TableCell>
											{isUnassigned
												? "—"
												: pctCell(
														row.blockedEscalated,
														row.blockedPct,
														row.blockedEscalated > 0 ? "red" : "muted",
														true
													)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>
			<div className="border-t border-border/50 px-3 py-2">
				<Link
					href="/admin/my-work-queue/analysts"
					className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
				>
					View all analysts
					<ChevronRight className="size-3" />
				</Link>
			</div>
		</section>
	);
}

const ESCALATION_CARDS: {
	key: keyof EscalationSummary;
	title: string;
	note: string;
	border: string;
	bg: string;
	accent: string;
}[] = [
	{
		key: "escalated",
		title: "Escalated",
		note: "Escalated to senior team / management.",
		border: "border-sky-300 dark:border-sky-600/55",
		bg: "bg-sky-50/45 dark:bg-sky-950/12",
		accent: "text-sky-600 dark:text-sky-400",
	},
	{
		key: "resolved",
		title: "Resolved",
		note: "Resolved (blocker cleared).",
		border: "border-emerald-300 dark:border-emerald-600/55",
		bg: "bg-emerald-50/45 dark:bg-emerald-950/12",
		accent: "text-emerald-600 dark:text-emerald-400",
	},
];

function blockerAnalystName(row: WorkQueueBlockerRowDto): string {
	const user = row.assigned_to;
	if (!user) return "Unassigned";
	return (
		user.full_name?.trim() ||
		[user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
		user.username?.trim() ||
		user.email?.trim() ||
		"Unassigned"
	);
}

function formatBlockerReason(reason: string | null | undefined): string {
	if (!reason) return "—";
	return reason.replace(/_/g, " ");
}

function BlockerManagementList({
	rows,
	filter,
}: {
	rows: WorkQueueBlockerRowDto[];
	filter: EscalationStatus;
}) {
	const items = rows.filter(
		(row) => (row.blocker_status || row.escalation_status) === filter
	);
	if (!items.length) {
		return (
			<p className="px-4 py-3 text-xs text-muted-foreground">
				No {ESCALATION_STATUS_LABEL[filter].toLowerCase()} items.
			</p>
		);
	}

	return (
		<div className="overflow-x-auto border-t border-border/50">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/20 hover:bg-muted/20">
						<TableHead className="text-[10px] font-bold uppercase">
							TPA/TPV
						</TableHead>
						<TableHead className="text-[10px] font-bold uppercase">
							Analyst
						</TableHead>
						<TableHead className="text-[10px] font-bold uppercase">
							Reason
						</TableHead>
						<TableHead className="text-[10px] font-bold uppercase">
							Status
						</TableHead>
						<TableHead className="text-[10px] font-bold uppercase">
							SFTP / EDI
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item) => (
						<TableRow key={item.id}>
							<TableCell className="text-xs">
								<Link
									href={`/admin/my-work-queue/${item.id}`}
									className="font-medium text-primary hover:underline"
								>
									{item.name}
								</Link>
								<p className="text-[10px] text-muted-foreground">{item.code}</p>
							</TableCell>
							<TableCell className="text-xs">
								{blockerAnalystName(item)}
							</TableCell>
							<TableCell
								className="max-w-[180px] truncate text-xs text-muted-foreground capitalize"
								title={item.blocker_reason ?? undefined}
							>
								{formatBlockerReason(item.blocker_reason)}
							</TableCell>
							<TableCell>
								<EscalationStatusPill
									status={
										(item.blocker_status ||
											item.escalation_status ||
											"none") as EscalationStatus
									}
								/>
							</TableCell>
							<TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
								{item.sftp_percent}% / {item.edi_percent}%
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function EscalationManagementList({
	rows,
	filter,
}: {
	rows: TpaTpvRow[];
	filter: EscalationStatus;
}) {
	const items = listEscalationItems(rows, filter);
	if (!items.length) {
		return (
			<p className="px-4 py-3 text-xs text-muted-foreground">
				No {ESCALATION_STATUS_LABEL[filter].toLowerCase()} items.
			</p>
		);
	}

	return (
		<div className="overflow-x-auto border-t border-border/50">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/20 hover:bg-muted/20">
						<TableHead className="text-[10px] font-bold uppercase">
							TPA/TPV
						</TableHead>
						<TableHead className="text-[10px] font-bold uppercase">
							Analyst
						</TableHead>
						<TableHead className="text-[10px] font-bold uppercase">
							Reason
						</TableHead>
						<TableHead className="text-[10px] font-bold uppercase">
							Status
						</TableHead>
						<TableHead className="text-[10px] font-bold uppercase">
							Last update
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item) => (
						<TableRow key={item.id}>
							<TableCell className="text-xs">
								<Link
									href={`/admin/my-work-queue/${item.id}`}
									className="font-medium text-primary hover:underline"
								>
									{item.name}
								</Link>
								<p className="text-[10px] text-muted-foreground">{item.code}</p>
							</TableCell>
							<TableCell className="text-xs">{item.assignedAnalyst}</TableCell>
							<TableCell
								className="max-w-[180px] truncate text-xs text-muted-foreground"
								title={item.reason}
							>
								{item.reason}
							</TableCell>
							<TableCell>
								<EscalationStatusPill status={item.status} />
							</TableCell>
							<TableCell className="whitespace-nowrap text-xs text-muted-foreground">
								{item.lastUpdated}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

export function EscalationSummarySection({
	rows,
	summary: summaryProp,
	blockerRows,
	loading = false,
	activeFilter,
	onFilterChange,
}: {
	rows: TpaTpvRow[];
	summary?: EscalationSummary;
	blockerRows?: WorkQueueBlockerRowDto[];
	loading?: boolean;
	activeFilter: EscalationStatus | "all";
	onFilterChange: (status: EscalationStatus | "all") => void;
}) {
	const summary = summaryProp ?? summarizeEscalations(rows);
	const useBlockerList = Boolean(blockerRows?.length);

	return (
		<section className={cn(PANEL, "text-xs")}>
			<div className={PANEL_HEADER}>
				<h2 className={PANEL_TITLE}>Escalation Summary</h2>
			</div>
			<div className="grid grid-cols-1 gap-2 p-2.5">
				{loading ? (
					<p className="col-span-full text-[11px] text-muted-foreground">
						Loading escalation summary…
					</p>
				) : (
					ESCALATION_CARDS.map((card) => {
						const active = activeFilter === card.key;
						return (
							<div
								key={card.key}
								className={cn(
									ESCALATION_CARD,
									"min-h-0",
									card.border,
									card.bg,
									active && "ring-2 ring-primary/20"
								)}
							>
								<p className={cn("text-xs font-bold", card.accent)}>
									{card.title}
								</p>
								<p
									className={cn(
										"mt-0.5 text-2xl font-bold tabular-nums leading-none",
										card.accent
									)}
								>
									{summary[card.key]}
								</p>
								<p className="mt-1 text-[10px] leading-snug text-muted-foreground">
									{card.note}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-2 h-6 rounded-sm border-border/70 bg-background px-2 text-[10px] shadow-none"
									onClick={() => onFilterChange(active ? "all" : card.key)}
								>
									View list
								</Button>
							</div>
						);
					})
				)}
			</div>
			{activeFilter !== "all" ? (
				useBlockerList ? (
					<BlockerManagementList
						rows={blockerRows ?? []}
						filter={activeFilter}
					/>
				) : (
					<EscalationManagementList rows={rows} filter={activeFilter} />
				)
			) : null}
		</section>
	);
}

export function EscalationStatusPill({ status }: { status: EscalationStatus }) {
	if (status === "none") {
		return <span className="text-muted-foreground">—</span>;
	}

	const styles: Record<Exclude<EscalationStatus, "none">, string> = {
		escalation_required:
			"bg-red-500/15 text-red-800 ring-1 ring-red-500/20 dark:text-red-300",
		attention:
			"bg-orange-500/15 text-orange-900 ring-1 ring-orange-500/20 dark:text-orange-200",
		escalated:
			"bg-sky-500/15 text-sky-900 ring-1 ring-sky-500/20 dark:text-sky-300",
		resolved:
			"bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-500/20 dark:text-emerald-300",
	};

	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold",
				styles[status]
			)}
			title={ESCALATION_STATUS_LABEL[status]}
		>
			{ESCALATION_STATUS_LABEL[status]}
		</span>
	);
}

"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	ArrowUpDown,
	CheckCircle2,
	RefreshCw,
	Search,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { WorkQueueFilterQuery } from "@/lib/vendor-core/types";

import { AnalystAvatar } from "../components/work-queue-analyst-escalation";
import {
	useInvalidateVendorCore,
	useWorkQueueAnalystStatsQuery,
} from "../feature/queries/useWorkQueueQuery";
import type { AnalystProgressRow } from "../work-queue-analyst-escalation";

const PANEL =
	"overflow-hidden rounded-sm border border-border/60 bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const compactFieldClass =
	"h-8 rounded-sm border-border/60 bg-background text-xs shadow-none";

const WAVE_OPTIONS = ["1", "2", "3", "4"];

type SortKey = "name" | "assigned" | "sftp" | "edi" | "blocked";

function MetricBar({
	percent,
	tone,
}: {
	percent: number;
	tone: "emerald" | "sky" | "orange" | "red" | "muted";
}) {
	const safe = Math.min(100, Math.max(0, percent));
	const barTone = {
		emerald: "bg-emerald-500",
		sky: "bg-sky-500",
		orange: "bg-orange-500",
		red: "bg-red-500",
		muted: "bg-muted-foreground/40",
	}[tone];

	return (
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div
				className={cn("h-full rounded-full transition-[width]", barTone)}
				style={{ width: `${safe}%` }}
			/>
		</div>
	);
}

function AnalystMetricCell({
	count,
	percent,
	tone,
}: {
	count: number;
	percent: number;
	tone: "emerald" | "sky" | "orange" | "red" | "muted";
}) {
	const pctTone = {
		emerald: "text-emerald-600 dark:text-emerald-400",
		sky: "text-sky-600 dark:text-sky-400",
		orange: "text-orange-600 dark:text-orange-400",
		red: "text-red-600 dark:text-red-400",
		muted: "text-muted-foreground",
	}[tone];

	return (
		<div className="min-w-[88px] space-y-1">
			<p className="text-sm tabular-nums">
				<span className="font-semibold">{count}</span>{" "}
				<span className={cn("text-xs font-semibold", pctTone)}>
					({percent}%)
				</span>
			</p>
			<MetricBar percent={percent} tone={tone} />
		</div>
	);
}

function SummaryCard({
	label,
	value,
	sub,
	icon: Icon,
	tone,
}: {
	label: string;
	value: string;
	sub?: string;
	icon: typeof Users;
	tone: string;
}) {
	return (
		<div className={cn(PANEL, "p-4")}>
			<div className="flex items-start justify-between gap-2">
				<p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
					{label}
				</p>
				<Icon className={cn("size-4 shrink-0 opacity-70", tone)} />
			</div>
			<p className={cn("mt-2 text-2xl font-semibold tabular-nums", tone)}>
				{value}
			</p>
			{sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
		</div>
	);
}

function sortAnalysts(rows: AnalystProgressRow[], sort: SortKey) {
	const copy = [...rows];
	copy.sort((a, b) => {
		if (a.analyst === "Unassigned") return 1;
		if (b.analyst === "Unassigned") return -1;
		switch (sort) {
			case "name":
				return a.analyst.localeCompare(b.analyst);
			case "assigned":
				return b.assigned - a.assigned;
			case "sftp":
				return b.sftpPct - a.sftpPct || b.sftpComplete - a.sftpComplete;
			case "edi":
				return b.ediPct - a.ediPct || b.ediComplete - a.ediComplete;
			case "blocked":
				return (
					b.blockedEscalated - a.blockedEscalated || b.blockedPct - a.blockedPct
				);
			default:
				return 0;
		}
	});
	return copy;
}

function WorkQueueAnalystsBody() {
	const invalidate = useInvalidateVendorCore();
	const [search, setSearch] = useState("");
	const [waveFilter, setWaveFilter] = useState("all");
	const [sort, setSort] = useState<SortKey>("assigned");
	const [refreshing, setRefreshing] = useState(false);

	const filterParams = useMemo((): WorkQueueFilterQuery => {
		return {
			wave: waveFilter !== "all" ? Number(waveFilter) : undefined,
		};
	}, [waveFilter]);

	const analystStatsQ = useWorkQueueAnalystStatsQuery(filterParams);

	const analysts = useMemo(() => {
		const query = search.trim().toLowerCase();
		const rows = (analystStatsQ.data ?? []).filter((row) => {
			if (!query) return true;
			return row.analyst.toLowerCase().includes(query);
		});
		return sortAnalysts(rows, sort);
	}, [analystStatsQ.data, search, sort]);

	const summary = useMemo(() => {
		const active = analysts.filter((row) => row.analyst !== "Unassigned");
		const assignedTotal = active.reduce((sum, row) => sum + row.assigned, 0);
		const sftpTotal = active.reduce((sum, row) => sum + row.sftpComplete, 0);
		const ediTotal = active.reduce((sum, row) => sum + row.ediComplete, 0);
		const blockedTotal = active.reduce(
			(sum, row) => sum + row.blockedEscalated,
			0
		);
		const pct = (n: number) =>
			assignedTotal ? Math.round((n / assignedTotal) * 100) : 0;

		return {
			analystCount: active.length,
			assignedTotal,
			sftpPct: pct(sftpTotal),
			ediPct: pct(ediTotal),
			blockedTotal,
		};
	}, [analysts]);

	async function handleRefresh() {
		setRefreshing(true);
		try {
			await Promise.all([analystStatsQ.refetch(), invalidate()]);
		} finally {
			setRefreshing(false);
		}
	}

	const toolbarBtn =
		"h-9 gap-1.5 rounded-md px-3 text-xs font-medium shadow-none";

	return (
		<div className="space-y-4">
			<Link
				href="/admin/my-work-queue"
				className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Back to My Work Queue
			</Link>

			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Analyst Progress
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Assigned workload and SFTP/EDI completion across analysts.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className={cn(toolbarBtn, "border-border bg-background")}
					onClick={() => void handleRefresh()}
					disabled={refreshing}
				>
					<RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
					Refresh
				</Button>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{analystStatsQ.isLoading ? (
					Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index} className="h-[104px] rounded-sm" />
					))
				) : (
					<>
						<SummaryCard
							label="Active analysts"
							value={summary.analystCount.toLocaleString()}
							sub="Excludes unassigned bucket"
							icon={Users}
							tone="text-sky-700 dark:text-sky-400"
						/>
						<SummaryCard
							label="Cases assigned"
							value={summary.assignedTotal.toLocaleString()}
							sub={
								waveFilter !== "all"
									? `Filtered to wave ${waveFilter}`
									: "All waves"
							}
							icon={CheckCircle2}
							tone="text-emerald-700 dark:text-emerald-400"
						/>
						<SummaryCard
							label="SFTP completion"
							value={`${summary.sftpPct}%`}
							sub="Share of assigned cases SFTP complete"
							icon={CheckCircle2}
							tone="text-violet-700 dark:text-violet-400"
						/>
						<SummaryCard
							label="Blocked / escalated"
							value={summary.blockedTotal.toLocaleString()}
							sub={`EDI completion ${summary.ediPct}%`}
							icon={AlertTriangle}
							tone="text-red-700 dark:text-red-400"
						/>
					</>
				)}
			</div>

			<section className={PANEL}>
				<div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-3 py-2.5">
					<div className="relative min-w-[160px] flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search analysts…"
							className={cn(compactFieldClass, "w-full pl-8")}
						/>
					</div>
					<div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
						<Select value={waveFilter} onValueChange={setWaveFilter}>
							<SelectTrigger className={cn(compactFieldClass, "w-[120px]")}>
								<SelectValue placeholder="All waves" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All waves</SelectItem>
								{WAVE_OPTIONS.map((wave) => (
									<SelectItem key={wave} value={wave}>
										Wave {wave}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
							<SelectTrigger className={cn(compactFieldClass, "w-[148px]")}>
								<ArrowUpDown className="mr-1 size-3.5 opacity-60" />
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="assigned">Most assigned</SelectItem>
								<SelectItem value="name">Name (A–Z)</SelectItem>
								<SelectItem value="sftp">SFTP completion</SelectItem>
								<SelectItem value="edi">EDI completion</SelectItem>
								<SelectItem value="blocked">Blocked / escalated</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="overflow-x-auto">
					{analystStatsQ.isLoading ? (
						<div className="space-y-2 p-4">
							{Array.from({ length: 5 }).map((_, index) => (
								<Skeleton key={index} className="h-12 w-full rounded-sm" />
							))}
						</div>
					) : analysts.length === 0 ? (
						<p className="px-4 py-10 text-center text-sm text-muted-foreground">
							No analysts match your filters.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/30 hover:bg-muted/30">
									<TableHead className="w-10 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
										#
									</TableHead>
									<TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
										Analyst
									</TableHead>
									<TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
										Assigned
									</TableHead>
									<TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
										SFTP Complete
									</TableHead>
									<TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
										EDI Complete
									</TableHead>
									<TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
										In Progress
									</TableHead>
									<TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
										Blocked / Escalated
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{analysts.map((row, index) => {
									const isUnassigned = row.analyst === "Unassigned";
									const href = isUnassigned
										? "/admin/my-work-queue"
										: `/admin/my-work-queue?analyst=${encodeURIComponent(row.analyst)}`;

									return (
										<TableRow
											key={row.analyst}
											className={cn(
												"transition-colors",
												!isUnassigned && "hover:bg-primary/5"
											)}
										>
											<TableCell className="text-center text-xs font-medium tabular-nums text-muted-foreground">
												{index + 1}
											</TableCell>
											<TableCell className="text-sm font-medium">
												{isUnassigned ? (
													<span className="flex items-center gap-2">
														<AnalystAvatar name={row.analyst} />
														{row.analyst}
													</span>
												) : (
													<Link
														href={href}
														className="flex items-center gap-2 text-foreground hover:text-primary"
													>
														<AnalystAvatar name={row.analyst} />
														{row.analyst}
													</Link>
												)}
											</TableCell>
											<TableCell className="text-sm font-semibold tabular-nums">
												{row.assigned}
											</TableCell>
											<TableCell>
												{isUnassigned ? (
													"—"
												) : (
													<AnalystMetricCell
														count={row.sftpComplete}
														percent={row.sftpPct}
														tone="emerald"
													/>
												)}
											</TableCell>
											<TableCell>
												{isUnassigned ? (
													"—"
												) : (
													<AnalystMetricCell
														count={row.ediComplete}
														percent={row.ediPct}
														tone="sky"
													/>
												)}
											</TableCell>
											<TableCell>
												{isUnassigned ? (
													"—"
												) : (
													<AnalystMetricCell
														count={row.inProgress}
														percent={row.inProgressPct}
														tone="orange"
													/>
												)}
											</TableCell>
											<TableCell>
												{isUnassigned ? (
													"—"
												) : (
													<AnalystMetricCell
														count={row.blockedEscalated}
														percent={row.blockedPct}
														tone={row.blockedEscalated > 0 ? "red" : "muted"}
													/>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</div>
			</section>
		</div>
	);
}

export function WorkQueueAnalystsPage() {
	return (
		<VendorCoreGate title="Analyst Progress">
			<WorkQueueAnalystsBody />
		</VendorCoreGate>
	);
}

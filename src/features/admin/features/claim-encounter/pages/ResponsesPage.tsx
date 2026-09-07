"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowRight,
	ArrowUpDown,
	CheckCircle2,
	Clock3,
	Download,
	ExternalLink,
	Eye,
	FileOutput,
	FileText,
	type LucideIcon,
	MoreHorizontal,
	RefreshCw,
	Search,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	ClaimTablePagination,
	pct,
	usePagedRows,
} from "@/features/admin/features/claim-encounter/components/ClaimQueueChrome";
import {
	type ClaimFileStatus,
	type ClaimResponse,
	displayClaimStatus,
	exportRowsAsCsv,
	formatCount,
	responsesForProgram,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import { CLAIM_VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const PANEL = CMS_EDGE_PANEL_CLASS;

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";
const STAT_SHADOW_HOVER =
	"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)]";

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const selectField = cn(
	"h-8 w-auto min-w-[7.5rem] rounded-sm border border-border bg-background text-xs shadow-none transition-colors duration-200",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

const th =
	"h-9 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-3 py-2.5 text-[12px] align-middle text-foreground";

type ResponseType = ClaimResponse["responseType"];
type SortKey = "receivedAt" | "vendor" | "accepted" | "rejected" | "rate";
type StatusBucket = "all" | "clean" | "attention" | "pending";

const ACK_TYPES: ResponseType[] = ["TA1", "999", "277CA", "835"];

const TYPE_BADGE: Record<ResponseType, string> = {
	TA1: "border-slate-200/80 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
	"999":
		"border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
	"277CA":
		"border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
	"835":
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
};

const STATUS_TONE: Record<ClaimFileStatus, string> = {
	accepted:
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
	paid: "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
	rejected:
		"border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
	denied:
		"border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
	pending:
		"border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
	partial:
		"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
	exception:
		"border-orange-200/80 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
};

function isAttentionStatus(status: ClaimFileStatus) {
	return (
		status === "rejected" ||
		status === "denied" ||
		status === "partial" ||
		status === "exception"
	);
}

function isCleanStatus(status: ClaimFileStatus) {
	return status === "accepted" || status === "paid";
}

function acceptanceRate(row: ClaimResponse) {
	const denom = row.acceptedCount + row.rejectedCount;
	return denom ? Math.round((row.acceptedCount / denom) * 1000) / 10 : 0;
}

function TypeBadge({ type }: { type: ResponseType }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
				TYPE_BADGE[type]
			)}
		>
			{type}
		</span>
	);
}

function StatusPill({ status }: { status: ClaimFileStatus }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
				STATUS_TONE[status]
			)}
		>
			{displayClaimStatus(status)}
		</span>
	);
}

function AcceptBar({ rate }: { rate: number }) {
	const tone =
		rate >= 90
			? "bg-emerald-500"
			: rate >= 70
				? "bg-sky-500"
				: rate >= 40
					? "bg-amber-500"
					: "bg-rose-500";
	return (
		<div className="min-w-18 space-y-1">
			<p className="text-[10px] font-semibold tabular-nums text-foreground">
				{rate}%
			</p>
			<div className="h-1 overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full", tone)}
					style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
				/>
			</div>
		</div>
	);
}

export function ResponsesPage() {
	const router = useRouter();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [search, setSearch] = useState("");
	const [vendor, setVendor] = useState("all");
	const [responseType, setResponseType] = useState("all");
	const [statusBucket, setStatusBucket] = useState<StatusBucket>("all");
	const [status, setStatus] = useState("all");
	const [direction, setDirection] = useState("all");
	const [sortKey, setSortKey] = useState<SortKey>("receivedAt");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [refreshing, setRefreshing] = useState(false);

	const base = useMemo(
		() => responsesForProgram(programFilter),
		[programFilter]
	);
	const vendors = CLAIM_VENDOR_NAMES;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return base.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (responseType !== "all" && row.responseType !== responseType)
				return false;
			if (direction !== "all" && row.direction !== direction) return false;
			if (status !== "all" && row.status !== status) return false;
			if (statusBucket === "clean" && !isCleanStatus(row.status)) return false;
			if (statusBucket === "attention" && !isAttentionStatus(row.status))
				return false;
			if (statusBucket === "pending" && row.status !== "pending") return false;
			if (q) {
				const hay = [
					row.responseId,
					row.responseFile,
					row.relatedFileId,
					row.vendor,
					row.responseType,
					row.submissionBatch,
					row.summary,
				]
					.join(" ")
					.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	}, [base, direction, responseType, search, status, statusBucket, vendor]);

	const rows = useMemo(() => {
		const sorted = [...filtered];
		sorted.sort((a, b) => {
			let cmp = 0;
			switch (sortKey) {
				case "vendor":
					cmp = a.vendor.localeCompare(b.vendor);
					break;
				case "accepted":
					cmp = a.acceptedCount - b.acceptedCount;
					break;
				case "rejected":
					cmp = a.rejectedCount - b.rejectedCount;
					break;
				case "rate":
					cmp = acceptanceRate(a) - acceptanceRate(b);
					break;
				default:
					cmp = a.receivedAt.localeCompare(b.receivedAt);
			}
			return sortDir === "asc" ? cmp : -cmp;
		});
		return sorted;
	}, [filtered, sortDir, sortKey]);

	const { pageRows, pageCount, safePage } = usePagedRows(
		rows,
		pageSize,
		page,
		setPage
	);

	const stats = useMemo(() => {
		const clean = base.filter((r) => isCleanStatus(r.status)).length;
		const attention = base.filter((r) => isAttentionStatus(r.status)).length;
		const pending = base.filter((r) => r.status === "pending").length;
		const acceptedClaims = base.reduce((s, r) => s + r.acceptedCount, 0);
		const rejectedClaims = base.reduce((s, r) => s + r.rejectedCount, 0);
		const claimAcceptRate = pct(
			acceptedClaims,
			Math.max(1, acceptedClaims + rejectedClaims)
		);
		const health =
			attention === 0
				? "On Track"
				: attention > Math.max(1, Math.floor(base.length * 0.25))
					? "Needs Attention"
					: "Watch";
		return {
			clean,
			attention,
			pending,
			acceptedClaims,
			rejectedClaims,
			claimAcceptRate,
			health,
		};
	}, [base]);

	const hasActiveFilters =
		search.trim() !== "" ||
		vendor !== "all" ||
		responseType !== "all" ||
		status !== "all" ||
		statusBucket !== "all" ||
		direction !== "all";

	function clearFilters() {
		setSearch("");
		setVendor("all");
		setResponseType("all");
		setStatus("all");
		setStatusBucket("all");
		setDirection("all");
		setSortKey("receivedAt");
		setSortDir("desc");
		setPage(1);
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir(key === "vendor" ? "asc" : "desc");
		}
		setPage(1);
	}

	async function handleRefresh() {
		setRefreshing(true);
		await new Promise((r) => setTimeout(r, 400));
		setRefreshing(false);
		toast.success("Responses refreshed");
	}

	function handleExport() {
		exportRowsAsCsv(
			`responses-${programFilter.toLowerCase()}.csv`,
			[
				"Vendor",
				"Response ID",
				"Related File",
				"Type",
				"Direction",
				"Received",
				"Status",
				"Accepted",
				"Rejected",
				"Rate %",
				"Summary",
			],
			rows.map((row) => [
				row.vendor,
				row.responseId,
				row.relatedFileId,
				row.responseType,
				row.direction,
				row.receivedAt,
				row.status,
				row.acceptedCount,
				row.rejectedCount,
				acceptanceRate(row),
				row.summary,
			])
		);
		toast.success("Responses exported");
	}

	function toggleBucket(bucket: StatusBucket) {
		setStatusBucket((s) => (s === bucket ? "all" : bucket));
		setStatus("all");
		setPage(1);
	}

	const kpis: {
		id: string;
		label: string;
		value: number | string;
		hint: string;
		icon: LucideIcon;
		accent: string;
		valueTone: string;
		well: string;
		ring: string;
		active: boolean;
		onClick: () => void;
	}[] = [
		{
			id: "accepted",
			label: "Accepted",
			value: formatCount(stats.acceptedClaims),
			hint: `${formatCount(stats.clean)} clean responses`,
			icon: CheckCircle2,
			accent: "from-emerald-500/80 to-emerald-400/40",
			valueTone: "text-emerald-700 dark:text-emerald-300",
			well: "bg-emerald-600",
			ring: "ring-emerald-500/20",
			active: statusBucket === "clean",
			onClick: () => toggleBucket("clean"),
		},
		{
			id: "rejected",
			label: "Rejected",
			value: formatCount(stats.rejectedClaims),
			hint: `${formatCount(stats.attention)} need attention`,
			icon: AlertTriangle,
			accent: "from-red-500/80 to-red-400/40",
			valueTone: "text-red-700 dark:text-red-300",
			well: "bg-red-600",
			ring: "ring-red-500/20",
			active: statusBucket === "attention",
			onClick: () => toggleBucket("attention"),
		},
		{
			id: "rate",
			label: "Accept rate",
			value: `${stats.claimAcceptRate}%`,
			hint: `${formatCount(base.length)} response files`,
			icon: FileText,
			accent: "from-sky-500/80 to-sky-400/40",
			valueTone: "text-sky-700 dark:text-sky-300",
			well: "bg-sky-600",
			ring: "ring-sky-500/20",
			active: statusBucket === "all" && !hasActiveFilters,
			onClick: () => clearFilters(),
		},
		{
			id: "pending",
			label: "Pending",
			value: stats.pending,
			hint: "Awaiting outcome",
			icon: Clock3,
			accent: "from-amber-500/80 to-amber-400/40",
			valueTone: "text-amber-700 dark:text-amber-300",
			well: "bg-amber-600",
			ring: "ring-amber-500/20",
			active: statusBucket === "pending",
			onClick: () => toggleBucket("pending"),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Responses
					</h1>
					<p className="text-sm text-muted-foreground">
						277CA · 999 · TA1 · 835
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						asChild
						size="sm"
						className={cn(
							toolbarBtn,
							"bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
						)}
					>
						<Link href="/admin/claim-encounter/outbound">
							<FileOutput className="size-3.5" />
							Outbound
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={handleExport}
					>
						<Download className="size-3.5" />
						Export
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={handleRefresh}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{/* Primary overview banner — CMS HealthBanner pattern */}
			<section className="rounded-sm border border-primary/20 bg-primary px-4 py-4 text-primary-foreground shadow-[0_1px_3px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.06)] sm:px-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="min-w-0 space-y-1.5">
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
								Inbox status
							</p>
							<span className="inline-flex items-center gap-1.5 rounded-sm border border-primary-foreground/25 bg-primary-foreground/10 px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
								<span
									className={cn(
										"size-1.5 rounded-full",
										stats.health === "On Track"
											? "bg-emerald-300"
											: stats.health === "Watch"
												? "bg-amber-300"
												: "bg-rose-300"
									)}
								/>
								{stats.health}
							</span>
						</div>
						<p className="text-base font-semibold tracking-tight sm:text-lg">
							{formatCount(base.length)} responses · {programFilter}
						</p>
						<p className="text-xs text-primary-foreground/75">
							{formatCount(stats.clean)} clean · {formatCount(stats.attention)}{" "}
							attention · {formatCount(stats.pending)} pending
						</p>
						<div className="flex flex-wrap gap-1.5 pt-1">
							{ACK_TYPES.map((type) => {
								const active = responseType === type;
								const count = base.filter(
									(r) => r.responseType === type
								).length;
								return (
									<button
										key={type}
										type="button"
										onClick={() => {
											setResponseType((t) => (t === type ? "all" : type));
											setPage(1);
										}}
										className={cn(
											"inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold transition",
											active
												? "border-primary-foreground bg-primary-foreground text-primary"
												: "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
										)}
									>
										{type}
										<span className="tabular-nums opacity-80">{count}</span>
									</button>
								);
							})}
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-5 sm:gap-6">
						<button
							type="button"
							onClick={() => {
								setStatusBucket((s) =>
									s === "attention" ? "all" : "attention"
								);
								setStatus("all");
								setPage(1);
							}}
							className="min-w-[7.5rem] text-left"
						>
							<p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
								Accept rate
							</p>
							<p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
								{stats.claimAcceptRate}%
							</p>
							<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary-foreground/20">
								<div
									className="h-full rounded-full bg-primary-foreground"
									style={{
										width: `${Math.min(stats.claimAcceptRate, 100)}%`,
									}}
								/>
							</div>
						</button>
						{stats.attention > 0 ? (
							<Button
								size="sm"
								className="h-9 gap-1.5 rounded-sm border-0 bg-primary-foreground text-primary shadow-none hover:bg-primary-foreground/90"
								onClick={() => {
									setStatusBucket("attention");
									setStatus("all");
									setPage(1);
								}}
							>
								Work attention
								<ArrowRight className="size-3.5" />
							</Button>
						) : null}
					</div>
				</div>
			</section>

			{/* KPI stats — CMS / Outbound card grid */}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					return (
						<button
							key={kpi.id}
							type="button"
							onClick={kpi.onClick}
							className={cn(
								"group relative overflow-hidden rounded-sm border bg-card p-4 text-left transition-all duration-200 ease-out",
								STAT_SHADOW,
								STAT_SHADOW_HOVER,
								"hover:-translate-y-px hover:border-border",
								kpi.active
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
										{typeof kpi.value === "number"
											? kpi.value.toLocaleString()
											: kpi.value}
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
									<Icon className="size-[18px] text-white" aria-hidden />
								</span>
							</div>
						</button>
					);
				})}
			</div>

			<section className={cn(PANEL, "px-3 py-2.5")}>
				<div className="flex flex-col gap-2.5">
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search response, file, vendor…"
							className="h-8 rounded-sm border-border bg-background pl-8 text-xs shadow-none focus-visible:ring-primary/15"
						/>
						{search ? (
							<button
								type="button"
								aria-label="Clear search"
								className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								onClick={() => {
									setSearch("");
									setPage(1);
								}}
							>
								<X className="size-3.5" />
							</button>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={vendor}
							onValueChange={(v) => {
								setVendor(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-34")}>
								<SelectValue placeholder="Vendor" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All vendors</SelectItem>
								{vendors.map((v) => (
									<SelectItem key={v} value={v}>
										{v}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={responseType}
							onValueChange={(v) => {
								setResponseType(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={selectField}>
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{ACK_TYPES.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={status}
							onValueChange={(v) => {
								setStatus(v);
								setStatusBucket("all");
								setPage(1);
							}}
						>
							<SelectTrigger className={selectField}>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								<SelectItem value="accepted">Accepted</SelectItem>
								<SelectItem value="paid">Paid</SelectItem>
								<SelectItem value="rejected">Rejected</SelectItem>
								<SelectItem value="denied">Denied</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="partial">Partial</SelectItem>
								<SelectItem value="exception">Exception</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={direction}
							onValueChange={(v) => {
								setDirection(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={selectField}>
								<SelectValue placeholder="Direction" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All directions</SelectItem>
								<SelectItem value="outbound">Outbound</SelectItem>
								<SelectItem value="inbound">Inbound</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={`${sortKey}:${sortDir}`}
							onValueChange={(v) => {
								const [k, d] = v.split(":") as [SortKey, "asc" | "desc"];
								setSortKey(k);
								setSortDir(d);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-40")}>
								<SelectValue placeholder="Sort" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="receivedAt:desc">Newest</SelectItem>
								<SelectItem value="receivedAt:asc">Oldest</SelectItem>
								<SelectItem value="rate:desc">Highest accept %</SelectItem>
								<SelectItem value="rate:asc">Lowest accept %</SelectItem>
								<SelectItem value="rejected:desc">Most rejected</SelectItem>
								<SelectItem value="vendor:asc">Vendor A–Z</SelectItem>
							</SelectContent>
						</Select>
						{hasActiveFilters ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 px-2.5 text-xs text-muted-foreground"
								onClick={clearFilters}
							>
								Clear
							</Button>
						) : null}
					</div>
				</div>
			</section>

			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
					<p className="text-sm font-semibold text-foreground">
						Responses{" "}
						<span className="font-normal text-muted-foreground">
							({rows.length})
						</span>
					</p>
				</div>

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
								<TableHead className={th}>Response</TableHead>
								<TableHead className={th}>
									<button
										type="button"
										className="inline-flex items-center gap-1"
										onClick={() => toggleSort("vendor")}
									>
										Vendor
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={th}>Type</TableHead>
								<TableHead className={th}>Status</TableHead>
								<TableHead className={cn(th, "text-right")}>
									<button
										type="button"
										className="ml-auto inline-flex items-center gap-1"
										onClick={() => toggleSort("accepted")}
									>
										Accepted
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={cn(th, "text-right")}>
									<button
										type="button"
										className="ml-auto inline-flex items-center gap-1"
										onClick={() => toggleSort("rejected")}
									>
										Rejected
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={th}>
									<button
										type="button"
										className="inline-flex items-center gap-1"
										onClick={() => toggleSort("rate")}
									>
										Accept %
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={th}>
									<button
										type="button"
										className="inline-flex items-center gap-1"
										onClick={() => toggleSort("receivedAt")}
									>
										Received
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={cn(th, "pr-4 text-right")}>
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={10}
										className="px-4 py-12 text-center text-sm text-muted-foreground"
									>
										{hasActiveFilters
											? "No responses match filters."
											: "No responses for this program."}
									</TableCell>
								</TableRow>
							) : (
								pageRows.map((row, index) => {
									const rate = acceptanceRate(row);
									return (
										<TableRow
											key={row.id}
											className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/25"
											onClick={() =>
												router.push(
													`/admin/claim-encounter/responses/${row.id}`
												)
											}
										>
											<TableCell
												className={cn(
													td,
													"w-12 pl-4 text-center tabular-nums text-muted-foreground"
												)}
											>
												{(safePage - 1) * pageSize + index + 1}
											</TableCell>
											<TableCell className={td}>
												<div className="min-w-0 space-y-0.5">
													<span className="font-mono text-[11px] font-medium text-primary">
														{row.responseId}
													</span>
													<p className="max-w-70 truncate text-[11px] text-muted-foreground">
														{row.responseFile}
													</p>
												</div>
											</TableCell>
											<TableCell className={cn(td, "font-medium")}>
												{row.vendor}
											</TableCell>
											<TableCell className={td}>
												<TypeBadge type={row.responseType} />
											</TableCell>
											<TableCell className={td}>
												<StatusPill status={row.status} />
											</TableCell>
											<TableCell
												className={cn(
													td,
													"text-right font-medium tabular-nums text-emerald-700 dark:text-emerald-400"
												)}
											>
												{formatCount(row.acceptedCount)}
											</TableCell>
											<TableCell
												className={cn(
													td,
													"text-right font-medium tabular-nums text-rose-700 dark:text-rose-400"
												)}
											>
												{formatCount(row.rejectedCount)}
											</TableCell>
											<TableCell className={td}>
												<AcceptBar rate={rate} />
											</TableCell>
											<TableCell
												className={cn(td, "tabular-nums text-muted-foreground")}
											>
												{row.receivedAt}
											</TableCell>
											<TableCell
												className={cn(td, "pr-4 text-right")}
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-7 text-muted-foreground hover:text-foreground"
															aria-label={`Actions for ${row.responseId}`}
														>
															<MoreHorizontal className="size-3.5" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-44">
														<DropdownMenuItem asChild>
															<Link
																href={`/admin/claim-encounter/responses/${row.id}`}
															>
																<Eye className="mr-2 size-3.5" />
																Open
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem asChild>
															<Link
																href={`/admin/claim-encounter/files/${encodeURIComponent(row.relatedFileId)}`}
															>
																<ExternalLink className="mr-2 size-3.5" />
																Related file
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem asChild>
															<Link
																href={`/admin/claim-encounter/batches/${encodeURIComponent(row.submissionBatch)}`}
															>
																<ExternalLink className="mr-2 size-3.5" />
																Batch
															</Link>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>

				<div className="border-t border-border/50">
					<ClaimTablePagination
						total={rows.length}
						page={safePage}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={setPage}
						onPageSizeChange={(size) => {
							setPageSize(size);
							setPage(1);
						}}
						noun="responses"
					/>
				</div>
			</section>
		</div>
	);
}

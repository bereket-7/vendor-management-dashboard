"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowUpDown,
	Clock3,
	ExternalLink,
	Eye,
	FileOutput,
	FileSearch,
	Hourglass,
	Inbox,
	type LucideIcon,
	MoreHorizontal,
	RefreshCw,
	Search,
	X,
	XCircle,
} from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
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
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	ClaimTablePagination,
	formatWaitLabel,
	hoursSince,
	pct,
	usePagedRows,
} from "@/features/admin/features/claim-encounter/components/ClaimQueueChrome";
import {
	VendorFileWorkspace,
	vendorFileToolbarBtn,
} from "@/features/admin/features/claim-encounter/components/VendorFileWorkspace";
import {
	type ClaimVendorFile,
	filesForProgram,
	formatCount,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import { useProgramFilesQuery } from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { CLAIM_VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { isClaimVendorFilesMockEnabled, isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const PANEL = CMS_EDGE_PANEL_CLASS;
const SLA_HOURS = 48;

const toolbarBtn = vendorFileToolbarBtn;

const selectField = cn(
	"h-8 w-auto min-w-[7.5rem] rounded-sm border border-border bg-background text-xs shadow-none transition-colors duration-200",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

const th =
	"h-9 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-3 py-2.5 text-[12px] align-middle text-foreground";

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";
const STAT_SHADOW_HOVER =
	"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)]";

type SortKey = "receivedAt" | "records" | "vendor" | "wait";
type StatusFilter = "all" | "pending" | "rejected";

function ReviewStatusPill({
	status,
}: {
	status: ClaimVendorFile["reviewStatus"];
}) {
	const rejected = status === "rejected";
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
				rejected
					? "border-rose-200/80 bg-rose-50 text-rose-800"
					: "border-amber-200/80 bg-amber-50 text-amber-950"
			)}
		>
			{rejected ? (
				<XCircle className="size-2.5" />
			) : (
				<Clock3 className="size-2.5" />
			)}
			{rejected ? "rejected" : "pending"}
		</span>
	);
}

function WaitPill({ hours }: { hours: number }) {
	const sla = hours >= SLA_HOURS;
	const aging = hours >= 24 && hours < SLA_HOURS;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
				sla
					? "border-rose-200/80 bg-rose-50 text-rose-800"
					: aging
						? "border-amber-200/80 bg-amber-50 text-amber-950"
						: "border-sky-200/80 bg-sky-50 text-sky-900"
			)}
		>
			{formatWaitLabel(hours)}
		</span>
	);
}

function TxBadge({ type }: { type: ClaimVendorFile["transactionType"] }) {
	return (
		<span className="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-muted-foreground">
			{type}
		</span>
	);
}

/** Prefer claim-file fixtures (default on). Live → vendor-core claim-vendor-files. */
export function InboundVendorFilePage() {
	const useFixtures = isMockEnabled() || isClaimVendorFilesMockEnabled();
	if (!useFixtures) {
		return (
			<VendorCoreGate title="Inbound Vendor Files">
				<InboundVendorFileBody useLive />
			</VendorCoreGate>
		);
	}
	return <InboundVendorFileBody useLive={false} />;
}

function InboundVendorFileBody({ useLive }: { useLive: boolean }) {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const inboundQuery = useProgramFilesQuery(programFilter, "inbound", useLive);
	const outboundQuery = useProgramFilesQuery(
		programFilter,
		"outbound",
		useLive
	);
	const [vendor, setVendor] = useState("all");
	const [fileType, setFileType] = useState("all");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [waitBucket, setWaitBucket] = useState("all");
	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("wait");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

	const inboundQueue = useMemo(() => {
		if (useLive) return inboundQuery.data ?? [];
		return filesForProgram(programFilter, "inbound");
	}, [useLive, inboundQuery.data, programFilter]);
	const allOutbound = useMemo(() => {
		if (useLive) return outboundQuery.data ?? [];
		return filesForProgram(programFilter, "outbound");
	}, [useLive, outboundQuery.data, programFilter]);
	const pending = useMemo(
		() => inboundQueue.filter((f) => f.reviewStatus === "pending"),
		[inboundQueue]
	);
	const rejectedIn = useMemo(
		() => inboundQueue.filter((f) => f.reviewStatus === "rejected"),
		[inboundQueue]
	);

	const vendors = CLAIM_VENDOR_NAMES;
	const fileTypes = useMemo(
		() => Array.from(new Set(inboundQueue.map((f) => f.fileTypeLabel))).sort(),
		[inboundQueue]
	);

	const rows = useMemo(() => {
		const filtered = inboundQueue.filter((f) => {
			if (statusFilter !== "all" && f.reviewStatus !== statusFilter)
				return false;
			if (vendor !== "all" && f.vendor !== vendor) return false;
			if (fileType !== "all" && f.fileTypeLabel !== fileType) return false;
			const wait = hoursSince(f.receivedAt);
			if (waitBucket === "fresh" && wait >= 24) return false;
			if (waitBucket === "aging" && (wait < 24 || wait >= SLA_HOURS))
				return false;
			if (waitBucket === "sla" && wait < SLA_HOURS) return false;
			const q = search.trim().toLowerCase();
			if (!q) return true;
			return [
				f.fileId,
				f.fileName,
				f.vendor,
				f.fileTypeLabel,
				f.transactionType,
			]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});

		const sorted = [...filtered].sort((a, b) => {
			let cmp = 0;
			if (sortKey === "records") cmp = a.records - b.records;
			else if (sortKey === "vendor") cmp = a.vendor.localeCompare(b.vendor);
			else if (sortKey === "wait")
				cmp = hoursSince(a.receivedAt) - hoursSince(b.receivedAt);
			else cmp = a.receivedAt.localeCompare(b.receivedAt);
			return sortDir === "asc" ? cmp : -cmp;
		});
		return sorted;
	}, [
		inboundQueue,
		statusFilter,
		vendor,
		fileType,
		waitBucket,
		search,
		sortKey,
		sortDir,
	]);

	const { pageRows, pageCount, safePage } = usePagedRows(
		rows,
		pageSize,
		page,
		setPage
	);

	const selectedFile = useMemo(
		() =>
			selectedFileId
				? (inboundQueue.find((f) => f.id === selectedFileId) ?? null)
				: null,
		[inboundQueue, selectedFileId]
	);

	const analytics = useMemo(() => {
		const awaiting = pending;
		const waits = awaiting.map((f) => hoursSince(f.receivedAt));
		const claimsPending = awaiting.reduce((s, f) => s + f.records, 0);
		const claimsRejected = rejectedIn.reduce((s, f) => s + f.rejected, 0);
		const slaRisk = awaiting.filter(
			(f) => hoursSince(f.receivedAt) >= SLA_HOURS
		);
		const aging = awaiting.filter((f) => {
			const h = hoursSince(f.receivedAt);
			return h >= 24 && h < SLA_HOURS;
		});
		const avgWait = waits.length
			? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length)
			: 0;
		const oldest = [...awaiting].sort(
			(a, b) => hoursSince(b.receivedAt) - hoursSince(a.receivedAt)
		)[0];
		const largest = [...awaiting].sort((a, b) => b.records - a.records)[0];

		const byVendor = Object.entries(
			inboundQueue.reduce<Record<string, { files: number; claims: number }>>(
				(acc, f) => {
					const cur = acc[f.vendor] ?? { files: 0, claims: 0 };
					cur.files += 1;
					cur.claims += f.records;
					acc[f.vendor] = cur;
					return acc;
				},
				{}
			)
		)
			.map(([name, v]) => ({
				name,
				short: name.length > 14 ? `${name.slice(0, 12)}…` : name,
				...v,
			}))
			.sort((a, b) => b.claims - a.claims);

		const ageBuckets = [
			{
				name: "< 24h",
				id: "fresh" as const,
				files: awaiting.filter((f) => hoursSince(f.receivedAt) < 24).length,
				fill: "#0ea5e9",
			},
			{
				name: "24–48h",
				id: "aging" as const,
				files: aging.length,
				fill: "#f59e0b",
			},
			{
				name: `≥ ${SLA_HOURS}h SLA`,
				id: "sla" as const,
				files: slaRisk.length,
				fill: "#ef4444",
			},
		];

		const statusPie = [
			{ name: "Pending", value: pending.length, fill: "#d97706" },
			{ name: "Rejected", value: rejectedIn.length, fill: "#e11d48" },
		].filter((d) => d.value > 0);

		const acceptedOut = allOutbound.filter(
			(f) => f.reviewStatus === "accepted"
		);
		const deniedOut = allOutbound.filter(
			(f) => f.reviewStatus === "denied" || f.reviewStatus === "rejected"
		);
		const throughputClaims = allOutbound.reduce((s, f) => s + f.records, 0);
		const acceptRate = pct(
			acceptedOut.reduce((s, f) => s + f.accepted, 0),
			throughputClaims || 1
		);

		return {
			claimsPending,
			claimsRejected,
			avgWait,
			slaRisk,
			aging,
			oldest,
			largest,
			byVendor,
			ageBuckets,
			statusPie,
			statusTotal: pending.length + rejectedIn.length,
			acceptedOut,
			deniedOut,
			acceptRate,
			maxVendorClaims: Math.max(1, ...byVendor.map((v) => v.claims), 1),
		};
	}, [pending, rejectedIn, inboundQueue, allOutbound]);

	const hasActiveFilters =
		statusFilter !== "all" ||
		vendor !== "all" ||
		fileType !== "all" ||
		waitBucket !== "all" ||
		search.trim().length > 0 ||
		sortKey !== "wait" ||
		sortDir !== "desc";

	function clearFilters() {
		setStatusFilter("all");
		setVendor("all");
		setFileType("all");
		setWaitBucket("all");
		setSearch("");
		setSortKey("wait");
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
		if (useLive) {
			await Promise.all([inboundQuery.refetch(), outboundQuery.refetch()]);
		} else {
			await new Promise((r) => setTimeout(r, 400));
		}
		setRefreshing(false);
		toast.success("Inbound refreshed");
	}

	const queueTotal = Math.max(inboundQueue.length, 1);
	const inboundKpis: {
		id: string;
		label: string;
		value: string | number;
		hint: string;
		icon: LucideIcon;
		accent: string;
		valueTone: string;
		iconTone: string;
		ring: string;
		active: boolean;
		onClick: () => void;
	}[] = [
		{
			id: "pending",
			label: "Awaiting review",
			value: pending.length,
			hint: `${formatCount(analytics.claimsPending)} claims`,
			icon: Clock3,
			accent: "from-amber-500/80 to-amber-400/40",
			valueTone: "text-amber-700 dark:text-amber-300",
			iconTone: "text-amber-700 bg-amber-500/10 dark:text-amber-200",
			ring: "ring-amber-500/20",
			active: statusFilter === "pending",
			onClick: () => {
				setStatusFilter((s) => (s === "pending" ? "all" : "pending"));
				setWaitBucket("all");
				setPage(1);
			},
		},
		{
			id: "rejected",
			label: "MFC rejected",
			value: rejectedIn.length,
			hint: `${formatCount(analytics.claimsRejected)} claims · vendor rework`,
			icon: XCircle,
			accent: "from-rose-500/80 to-rose-400/40",
			valueTone: "text-rose-700 dark:text-rose-300",
			iconTone: "text-rose-700 bg-rose-500/10 dark:text-rose-300",
			ring: "ring-rose-500/20",
			active: statusFilter === "rejected",
			onClick: () => {
				setStatusFilter((s) => (s === "rejected" ? "all" : "rejected"));
				setWaitBucket("all");
				setPage(1);
			},
		},
		{
			id: "sla",
			label: "SLA risk",
			value: analytics.slaRisk.length,
			hint: `Pending waiting ≥ ${SLA_HOURS}h`,
			icon: AlertTriangle,
			accent: "from-orange-500/80 to-orange-400/40",
			valueTone: "text-orange-700 dark:text-orange-300",
			iconTone: "text-orange-700 bg-orange-500/10 dark:text-orange-200",
			ring: "ring-orange-500/20",
			active: waitBucket === "sla",
			onClick: () => {
				setWaitBucket((w) => (w === "sla" ? "all" : "sla"));
				setStatusFilter("pending");
				setPage(1);
			},
		},
		{
			id: "total",
			label: "Total inbound",
			value: inboundQueue.length,
			hint: `${pct(pending.length, queueTotal)}% still pending · avg wait ${formatWaitLabel(analytics.avgWait)}`,
			icon: Inbox,
			accent: "from-sky-500/80 to-sky-400/40",
			valueTone: "text-sky-700 dark:text-sky-300",
			iconTone: "text-sky-700 bg-sky-500/10 dark:text-sky-300",
			ring: "ring-sky-500/20",
			active:
				statusFilter === "all" &&
				waitBucket === "all" &&
				vendor === "all" &&
				fileType === "all" &&
				!search.trim(),
			onClick: () => {
				clearFilters();
			},
		},
	];

	if (selectedFile) {
		return (
			<InboundFileWorkspace
				file={selectedFile}
				useLive={useLive}
				onBack={() => setSelectedFileId(null)}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header — CMS EDGE Reporting rhythm */}
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Inbound
					</h1>
					<p className="text-sm text-muted-foreground">
						Pending review + MFC-rejected packages
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

			{useLive && inboundQuery.error ? (
				<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
					Could not load inbound files: {inboundQuery.error.message}
				</p>
			) : null}
			{useLive && inboundQuery.isLoading ? (
				<p className="text-sm text-muted-foreground">Loading inbound queue…</p>
			) : null}
			{useLive &&
			!inboundQuery.isLoading &&
			!inboundQuery.error &&
			inboundQueue.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No inbound vendor files for this program yet.
				</p>
			) : null}

			{/* KPI grid — reporting submissions pattern */}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{inboundKpis.map((kpi) => {
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

			{/* Filters — reporting-style panel */}
			<section className={cn(PANEL, "px-3 py-2.5 sm:px-3")}>
				<div className="flex flex-col gap-2.5">
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search file ID, vendor, claim type…"
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
							value={statusFilter}
							onValueChange={(v) => {
								setStatusFilter(v as StatusFilter);
								setPage(1);
							}}
						>
							<SelectTrigger className={selectField}>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All status</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="rejected">Rejected</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={vendor}
							onValueChange={(v) => {
								setVendor(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-[8.5rem]")}>
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
							value={fileType}
							onValueChange={(v) => {
								setFileType(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-[8rem]")}>
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{fileTypes.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={waitBucket}
							onValueChange={(v) => {
								setWaitBucket(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={selectField}>
								<SelectValue placeholder="Wait" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Any age</SelectItem>
								<SelectItem value="fresh">&lt; 24h</SelectItem>
								<SelectItem value="aging">24–48h</SelectItem>
								<SelectItem value="sla">SLA risk</SelectItem>
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
							<SelectTrigger className={cn(selectField, "min-w-[10rem]")}>
								<SelectValue placeholder="Sort" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="wait:desc">Wait (longest)</SelectItem>
								<SelectItem value="wait:asc">Wait (shortest)</SelectItem>
								<SelectItem value="receivedAt:desc">Newest received</SelectItem>
								<SelectItem value="receivedAt:asc">Oldest received</SelectItem>
								<SelectItem value="records:desc">Most claims</SelectItem>
								<SelectItem value="records:asc">Fewest claims</SelectItem>
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

			{/* Table — CMS EDGE reporting layout */}
			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
					<p className="text-sm font-semibold text-foreground">
						Review queue{" "}
						<span className="font-normal text-muted-foreground">
							({rows.length})
						</span>
					</p>
					<span className="text-xs tabular-nums text-muted-foreground">
						{formatCount(rows.reduce((s, f) => s + f.records, 0))} claims
					</span>
				</div>

				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className="w-full min-w-[1080px] text-xs"
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
								<TableHead className={cn(th, "w-12 pl-4 text-center")}>
									#
								</TableHead>
								<TableHead className={th}>
									<button
										type="button"
										className="inline-flex items-center gap-1"
										onClick={() => toggleSort("receivedAt")}
									>
										File ID
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
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
								<TableHead className={cn(th, "text-right")}>
									<button
										type="button"
										className="ml-auto inline-flex items-center gap-1"
										onClick={() => toggleSort("records")}
									>
										Claims
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={th}>
									<button
										type="button"
										className="inline-flex items-center gap-1"
										onClick={() => toggleSort("wait")}
									>
										Wait
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={th}>Status</TableHead>
								<TableHead className={th}>Received</TableHead>
								<TableHead className={cn(th, "pr-4 text-right")}>
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={9}
										className="px-4 py-12 text-center text-sm text-muted-foreground"
									>
										{hasActiveFilters
											? "No inbound files match your filters."
											: "No inbound files for this program."}
									</TableCell>
								</TableRow>
							) : (
								pageRows.map((row, index) => {
									const wait = hoursSince(row.receivedAt);
									return (
										<TableRow
											key={row.id}
											className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/25"
											onClick={() => setSelectedFileId(row.id)}
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
													<div className="flex flex-wrap items-center gap-1.5">
														<span className="font-mono text-[11px] font-medium text-primary">
															{row.fileId}
														</span>
														<TxBadge type={row.transactionType} />
														<span className="text-[10px] text-muted-foreground">
															{row.program}
														</span>
													</div>
													<p className="max-w-[260px] truncate text-[11px] text-muted-foreground">
														{row.fileName}
													</p>
												</div>
											</TableCell>
											<TableCell className={cn(td, "font-medium")}>
												{row.vendor}
											</TableCell>
											<TableCell className={td}>
												<span className="text-[11px] text-muted-foreground">
													{row.fileTypeLabel}
												</span>
											</TableCell>
											<TableCell
												className={cn(
													td,
													"text-right font-medium tabular-nums"
												)}
											>
												{formatCount(row.records)}
											</TableCell>
											<TableCell className={td}>
												<WaitPill hours={wait} />
											</TableCell>
											<TableCell className={td}>
												<ReviewStatusPill status={row.reviewStatus} />
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
															aria-label={`Actions for ${row.fileId}`}
														>
															<MoreHorizontal className="size-3.5" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-48">
														<DropdownMenuItem
															onClick={() => setSelectedFileId(row.id)}
														>
															<Eye className="mr-2 size-3.5" />
															Open claims
														</DropdownMenuItem>
														{row.reviewStatus === "pending" ? (
															<DropdownMenuItem asChild>
																<Link
																	href={`/admin/claim-encounter/files/${encodeURIComponent(row.id)}/review`}
																>
																	<FileSearch className="mr-2 size-3.5" />
																	Review
																</Link>
															</DropdownMenuItem>
														) : null}
														<DropdownMenuItem asChild>
															<Link
																href={`/admin/claim-encounter/files/${encodeURIComponent(row.id)}`}
															>
																<ExternalLink className="mr-2 size-3.5" />
																Full page
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
						noun="files"
					/>
				</div>
			</section>

			{/* Analytics — CmsEdgeSectionPanel standard */}
			<div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
				<CmsEdgeSectionPanel
					title="Queue age mix"
					subtitle="Pending files vs 48h SLA"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					{analytics.ageBuckets.every((b) => b.files === 0) ? (
						<div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
							No pending files in queue
						</div>
					) : (
						<div className="flex flex-1 flex-col justify-center gap-4">
							<div className="flex items-center gap-3">
								<div className="relative h-[112px] w-[112px] shrink-0">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={analytics.ageBuckets}
												dataKey="files"
												nameKey="name"
												innerRadius="58%"
												outerRadius="88%"
												paddingAngle={2}
												stroke="none"
												isAnimationActive={false}
											>
												{analytics.ageBuckets.map((b) => (
													<Cell key={b.name} fill={b.fill} />
												))}
											</Pie>
											<Tooltip content={<InboundChartTooltip />} />
										</PieChart>
									</ResponsiveContainer>
									<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
										<p className="text-lg font-bold tabular-nums leading-none text-foreground">
											{pending.length}
										</p>
										<p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
											Pending
										</p>
									</div>
								</div>
								<div className="min-w-0 flex-1 space-y-1.5">
									{analytics.ageBuckets.map((b) => {
										const active = waitBucket === b.id;
										return (
											<button
												key={b.name}
												type="button"
												onClick={() => {
													setWaitBucket((cur) => (cur === b.id ? "all" : b.id));
													setStatusFilter("pending");
													setPage(1);
												}}
												className={cn(
													"flex w-full items-center justify-between gap-2 rounded-sm border px-2 py-1.5 text-left text-xs transition",
													active
														? "border-primary/30 bg-primary/5"
														: "border-border/60 hover:bg-muted/40"
												)}
											>
												<span className="flex min-w-0 items-center gap-1.5 font-medium">
													<span
														className="size-2 shrink-0 rounded-full"
														style={{ backgroundColor: b.fill }}
													/>
													<span className="truncate">{b.name}</span>
												</span>
												<span className="shrink-0 tabular-nums text-muted-foreground">
													{b.files}
												</span>
											</button>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Status mix"
					subtitle="Pending vs MFC-rejected packages"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					{analytics.statusPie.length === 0 ? (
						<div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
							No packages in scope
						</div>
					) : (
						<div className="flex flex-1 flex-col justify-center gap-4">
							<div className="flex items-center gap-3">
								<div className="relative h-[112px] w-[112px] shrink-0">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={analytics.statusPie}
												dataKey="value"
												nameKey="name"
												innerRadius="58%"
												outerRadius="88%"
												paddingAngle={2}
												stroke="none"
												isAnimationActive={false}
											>
												{analytics.statusPie.map((d) => (
													<Cell key={d.name} fill={d.fill} />
												))}
											</Pie>
											<Tooltip content={<InboundChartTooltip />} />
										</PieChart>
									</ResponsiveContainer>
									<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
										<p className="text-lg font-bold tabular-nums leading-none text-foreground">
											{analytics.statusTotal}
										</p>
										<p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
											Packages
										</p>
									</div>
								</div>
								<div className="min-w-0 flex-1 space-y-1.5">
									{analytics.statusPie.map((d) => {
										const isPending = d.name === "Pending";
										const active = isPending
											? statusFilter === "pending"
											: statusFilter === "rejected";
										return (
											<button
												key={d.name}
												type="button"
												onClick={() => {
													const next = isPending ? "pending" : "rejected";
													setStatusFilter((cur) =>
														cur === next ? "all" : next
													);
													setPage(1);
												}}
												className={cn(
													"flex w-full items-center justify-between gap-2 rounded-sm border px-2 py-1.5 text-left text-xs transition",
													active
														? isPending
															? "border-amber-300/80 bg-amber-50 dark:bg-amber-950/30"
															: "border-rose-300/80 bg-rose-50 dark:bg-rose-950/30"
														: "border-border/60 hover:bg-muted/40"
												)}
											>
												<span className="flex min-w-0 items-center gap-1.5 font-medium">
													<span
														className="size-2 shrink-0 rounded-full"
														style={{ backgroundColor: d.fill }}
													/>
													<span className="truncate">{d.name}</span>
												</span>
												<span className="shrink-0 tabular-nums text-muted-foreground">
													{d.value}
													<span className="ml-1 text-[10px]">
														({pct(d.value, Math.max(1, analytics.statusTotal))}
														%)
													</span>
												</span>
											</button>
										);
									})}
								</div>
							</div>
							<div className="space-y-1.5 border-t border-border/40 pt-3">
								<div className="flex items-center justify-between text-[10px]">
									<span className="text-muted-foreground">
										Outbound accept rate
									</span>
									<span className="font-semibold tabular-nums text-foreground">
										{analytics.acceptRate}%
									</span>
								</div>
								<div className="h-1.5 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
										style={{ width: `${analytics.acceptRate}%` }}
									/>
								</div>
							</div>
						</div>
					)}
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Needs attention"
					subtitle="Prioritize aging and high-volume files"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					<div className="flex flex-1 flex-col justify-evenly gap-2">
						{analytics.oldest ? (
							<AttentionRow
								icon={Hourglass}
								tone="text-amber-700 bg-amber-500/10"
								title="Oldest waiting"
								meta={`${analytics.oldest.vendor} · ${formatWaitLabel(hoursSince(analytics.oldest.receivedAt))}`}
								detail={analytics.oldest.fileId}
								onOpen={() => setSelectedFileId(analytics.oldest!.id)}
							/>
						) : null}
						{analytics.largest ? (
							<AttentionRow
								icon={FileSearch}
								tone="text-sky-700 bg-sky-500/10"
								title="Largest file"
								meta={`${formatCount(analytics.largest.records)} claims · ${analytics.largest.vendor}`}
								detail={analytics.largest.fileId}
								onOpen={() => setSelectedFileId(analytics.largest!.id)}
							/>
						) : null}
						{analytics.slaRisk[0] ? (
							<AttentionRow
								icon={AlertTriangle}
								tone="text-red-700 bg-red-500/10"
								title="SLA breach"
								meta={`${analytics.slaRisk.length} file(s) past ${SLA_HOURS}h`}
								detail={analytics.slaRisk[0].fileId}
								onOpen={() => setSelectedFileId(analytics.slaRisk[0]!.id)}
							/>
						) : (
							<div className="rounded-sm border border-primary/20 bg-primary/5 px-2.5 py-2 text-xs text-primary">
								No files past the {SLA_HOURS}h review SLA.
							</div>
						)}
					</div>
				</CmsEdgeSectionPanel>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<CmsEdgeSectionPanel
					title="Vendor backlog"
					subtitle="Claims waiting by vendor — click a bar to filter"
					bodyClassName="px-2 pb-3 pt-2"
				>
					{analytics.byVendor.length === 0 ? (
						<p className="py-8 text-center text-xs text-muted-foreground">
							Queue is empty.
						</p>
					) : (
						<div className="h-[220px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									layout="vertical"
									data={analytics.byVendor.slice(0, 6)}
									margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
									barCategoryGap={10}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										horizontal={false}
										stroke="hsl(var(--border))"
										strokeOpacity={0.55}
									/>
									<XAxis
										type="number"
										allowDecimals={false}
										tick={{
											fontSize: 10,
											fill: "hsl(var(--muted-foreground))",
										}}
										axisLine={false}
										tickLine={false}
									/>
									<YAxis
										type="category"
										dataKey="short"
										width={96}
										tick={{
											fontSize: 11,
											fill: "hsl(var(--muted-foreground))",
										}}
										axisLine={false}
										tickLine={false}
									/>
									<Tooltip
										cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
										content={<InboundChartTooltip />}
									/>
									<Bar
										dataKey="claims"
										name="Claims"
										fill="#13446c"
										barSize={14}
										cursor="pointer"
										radius={[0, 4, 4, 0]}
										onClick={(data) => {
											const name = (data as { name?: string })?.name;
											if (!name) return;
											setVendor((cur) => (cur === name ? "all" : name));
											setPage(1);
										}}
									>
										{analytics.byVendor.slice(0, 6).map((v) => (
											<Cell
												key={v.name}
												fill={vendor === v.name ? "#13446c" : "#13446c99"}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					)}
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Program snapshot"
					subtitle={`${programFilter} inbound volume`}
					bodyClassName="p-4"
				>
					<div className="grid grid-cols-2 gap-2">
						<div className="rounded-sm border border-border/60 bg-muted/20 px-2.5 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
								Inbound files
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums">
								{formatCount(inboundQueue.length)}
							</p>
						</div>
						<div className="rounded-sm border border-border/60 bg-muted/20 px-2.5 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
								Pending claims
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums">
								{formatCount(analytics.claimsPending)}
							</p>
						</div>
						<div className="rounded-sm border border-border/60 bg-muted/20 px-2.5 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
								Avg claims / file
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums">
								{pending.length
									? formatCount(
											Math.round(analytics.claimsPending / pending.length)
										)
									: "0"}
							</p>
						</div>
						<div className="rounded-sm border border-border/60 bg-muted/20 px-2.5 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
								Accepted out
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
								{formatCount(analytics.acceptedOut.length)}
							</p>
						</div>
					</div>
					<ol className="mt-4 space-y-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
						<li className="flex gap-2">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-[10px] font-semibold text-primary">
								1
							</span>
							Open a file, inspect 837 claim loops in the EDI reader
						</li>
						<li className="flex gap-2">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-[10px] font-semibold text-primary">
								2
							</span>
							Accept clean claims or reject with catalog reason codes
						</li>
						<li className="flex gap-2">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-[10px] font-semibold text-primary">
								3
							</span>
							Accepted packages go outbound; full MFC rejects stay inbound
						</li>
					</ol>
					<Button
						asChild
						variant="outline"
						size="sm"
						className={cn(toolbarBtn, "mt-3 w-full border-border/80")}
					>
						<Link href="/admin/claim-encounter/acceptance-analytics">
							<FileSearch className="size-3.5" />
							Open acceptance analytics
						</Link>
					</Button>
				</CmsEdgeSectionPanel>
			</div>
		</div>
	);
}

function InboundChartTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{
		name?: string;
		value?: number | string;
		color?: string;
		dataKey?: string;
	}>;
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-sm border border-border/70 bg-card px-2.5 py-2 text-xs shadow-md">
			{label ? (
				<p className="mb-1.5 font-medium text-foreground">{label}</p>
			) : null}
			<ul className="space-y-1">
				{payload.map((entry) => (
					<li
						key={`${entry.name}-${entry.value}`}
						className="flex items-center justify-between gap-4 tabular-nums text-muted-foreground"
					>
						<span className="inline-flex items-center gap-1.5">
							<span
								className="size-1.5 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							{entry.name}
						</span>
						<span className="font-medium text-foreground">
							{typeof entry.value === "number"
								? entry.value.toLocaleString()
								: entry.value}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function AttentionRow({
	icon: Icon,
	tone,
	title,
	meta,
	detail,
	onOpen,
}: {
	icon: LucideIcon;
	tone: string;
	title: string;
	meta: string;
	detail: string;
	onOpen: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onOpen}
			className="flex w-full items-start gap-2 rounded-sm border border-border/50 bg-background/40 px-2.5 py-2 text-left transition-colors hover:bg-muted/40"
		>
			<span
				className={cn(
					"mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm",
					tone
				)}
			>
				<Icon className="size-3.5" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-xs font-medium">{title}</span>
				<span className="block text-[11px] text-muted-foreground">{meta}</span>
				<span className="mt-0.5 block truncate font-mono text-[10px] text-foreground/80">
					{detail}
				</span>
			</span>
		</button>
	);
}

function InboundFileWorkspace({
	file,
	useLive,
	onBack,
}: {
	file: ClaimVendorFile;
	useLive: boolean;
	onBack: () => void;
}) {
	return (
		<VendorFileWorkspace
			file={file}
			useLive={useLive}
			backLabel="Inbound"
			onBack={onBack}
			negativeLabel="rejected"
			statusPills={
				<>
					<ReviewStatusPill status={file.reviewStatus} />
					<WaitPill hours={hoursSince(file.receivedAt)} />
				</>
			}
			metaExtra={
				<>
					<span className="text-border">·</span>
					<span>Received {file.receivedAt}</span>
				</>
			}
			actions={
				file.reviewStatus === "pending" ? (
					<Button
						asChild
						size="sm"
						className={cn(
							vendorFileToolbarBtn,
							"bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
						)}
					>
						<Link
							href={`/admin/claim-encounter/files/${encodeURIComponent(file.id)}/review`}
						>
							<FileSearch className="size-3.5" />
							Review
						</Link>
					</Button>
				) : null
			}
		/>
	);
}

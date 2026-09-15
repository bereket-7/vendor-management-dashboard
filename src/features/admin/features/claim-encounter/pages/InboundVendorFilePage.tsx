"use client";

import { useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	ArrowUpDown,
	Clock3,
	Download,
	ExternalLink,
	Eye,
	FileOutput,
	FileSearch,
	Hourglass,
	type LucideIcon,
	MoreHorizontal,
	RefreshCw,
	ScrollText,
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
	type ClaimVendorFile,
	type ClaimVendorFileListParams,
	formatCount,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import {
	useClaimVendorFilesSummaryQuery,
	useExportClaimVendorFilesCsvMutation,
	useInboundVendorQueueQuery,
	useSeedInboundVendorQueueMutation,
} from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import { Link, useRouter } from "@/i18n/navigation";
import { downloadBlob, stampFilename } from "@/lib/export/csv";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type SortKey = "receivedAt" | "records" | "vendor" | "wait";

/** Align wait chips / SLA with BE summary age_buckets.over_3d (72h). */
const SLA_HOURS = 72;

const PANEL = CMS_EDGE_PANEL_CLASS;

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

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";
const STAT_SHADOW_HOVER =
	"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)]";

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
			{rejected ? "MFC rejected" : "Pending"}
		</span>
	);
}

function WaitPill({ wait }: { wait: number }) {
	const sla = wait >= SLA_HOURS;
	const aging = wait >= 24 && wait < SLA_HOURS;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
				sla
					? "border-rose-200/80 bg-rose-50 text-rose-800"
					: aging
						? "border-amber-200/80 bg-amber-50 text-amber-950"
						: "border-sky-200/80 bg-sky-50 text-sky-900"
			)}
		>
			{formatWaitLabel(wait)}
		</span>
	);
}

function TxBadge({ label }: { label: string }) {
	return (
		<span className="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-muted-foreground">
			{label}
		</span>
	);
}

export function InboundVendorFilePage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const queryClient = useQueryClient();
	const [vendor, setVendor] = useState("all");
	const [fileType, setFileType] = useState("all");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "pending" | "rejected"
	>("all");
	const [waitBucket, setWaitBucket] = useState("all");
	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("wait");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [refreshing, setRefreshing] = useState(false);
	/** Persist vendor UUID by display name across filtered fetches. */
	const [vendorIdByName, setVendorIdByName] = useState<Record<string, string>>(
		{}
	);

	const listApiParams = useMemo((): ClaimVendorFileListParams | undefined => {
		if (isMockEnabled()) return undefined;
		const params: ClaimVendorFileListParams = {
			limit: 100,
			offset: 0,
			direction: "inbound",
		};
		const q = search.trim();
		if (q) params.search = q;
		if (statusFilter === "pending") params.review_status = "pending";
		else if (statusFilter === "rejected") params.review_status = "rejected";
		const vid = vendor !== "all" ? vendorIdByName[vendor] : undefined;
		if (vid) params.vendor_id = vid;
		if (waitBucket === "fresh") params.wait_bucket = "under_24h";
		else if (waitBucket === "aging") params.wait_bucket = "day_1_to_3";
		else if (waitBucket === "sla") params.wait_bucket = "over_3d";
		if (sortKey === "receivedAt" || sortKey === "wait") {
			// ListOrderingMixin allowlist is created_at/updated_at/deleted_at only
			// (FilterSet also supports received_at once query serializer is extended).
			params.order_by = sortDir === "asc" ? "created_at" : "-created_at";
		}
		return params;
	}, [
		search,
		statusFilter,
		vendor,
		vendorIdByName,
		waitBucket,
		sortKey,
		sortDir,
	]);

	const summaryApiParams = useMemo(():
		| ClaimVendorFileListParams
		| undefined => {
		if (isMockEnabled()) return undefined;
		const params: ClaimVendorFileListParams = { direction: "inbound" };
		const q = search.trim();
		if (q) params.search = q;
		if (statusFilter === "pending") params.review_status = "pending";
		else if (statusFilter === "rejected") params.review_status = "rejected";
		const vid = vendor !== "all" ? vendorIdByName[vendor] : undefined;
		if (vid) params.vendor_id = vid;
		if (waitBucket === "fresh") params.wait_bucket = "under_24h";
		else if (waitBucket === "aging") params.wait_bucket = "day_1_to_3";
		else if (waitBucket === "sla") params.wait_bucket = "over_3d";
		return params;
	}, [search, statusFilter, vendor, vendorIdByName, waitBucket]);

	const queueQuery = useInboundVendorQueueQuery(programFilter, listApiParams);
	const summaryQuery = useClaimVendorFilesSummaryQuery(
		!isMockEnabled(),
		summaryApiParams
	);
	const seedMutation = useSeedInboundVendorQueueMutation();
	const exportMutation = useExportClaimVendorFilesCsvMutation();

	/** Inbound = pending review + MFC-rejected (held for vendor correction). */
	const inboundQueue = useMemo(
		() => queueQuery.data?.inbound ?? ([] as ClaimVendorFile[]),
		[queueQuery.data?.inbound]
	);

	useEffect(() => {
		const next: Record<string, string> = {};
		for (const f of inboundQueue) {
			if (f.vendor && f.vendor !== "—" && f.vendorId) {
				next[f.vendor] = f.vendorId;
			}
		}
		if (Object.keys(next).length === 0) return;
		setVendorIdByName((prev) => {
			let changed = false;
			const merged = { ...prev };
			for (const [name, id] of Object.entries(next)) {
				if (merged[name] !== id) {
					merged[name] = id;
					changed = true;
				}
			}
			return changed ? merged : prev;
		});
	}, [inboundQueue]);
	const allOutbound = useMemo(
		() => queueQuery.data?.outbound ?? ([] as ClaimVendorFile[]),
		[queueQuery.data?.outbound]
	);
	const outboundAvailable =
		queueQuery.data?.outboundAvailable ?? isMockEnabled();
	const openExceptionCount = queueQuery.data?.openExceptionCount ?? 0;

	const pending = useMemo(
		() => inboundQueue.filter((f) => f.reviewStatus === "pending"),
		[inboundQueue]
	);
	const rejectedIn = useMemo(
		() => inboundQueue.filter((f) => f.reviewStatus === "rejected"),
		[inboundQueue]
	);

	const statusCounts = useMemo(() => {
		const byReview = summaryQuery.data?.by_review_status;
		if (byReview && Object.keys(byReview).length > 0) {
			return {
				all:
					summaryQuery.data?.total_files ??
					Object.values(byReview).reduce((s, n) => s + Number(n), 0),
				pending: Number(
					byReview.pending ??
						summaryQuery.data?.awaiting_review ??
						pending.length
				),
				rejected: Number(
					byReview.rejected ?? summaryQuery.data?.rejected ?? rejectedIn.length
				),
			};
		}
		const byStatus = summaryQuery.data?.by_status;
		if (byStatus && Object.keys(byStatus).length > 0) {
			const pendingFromStatus =
				Number(byStatus.received ?? 0) +
				Number(byStatus.processing ?? 0) +
				Number(byStatus.pending ?? 0);
			return {
				all:
					summaryQuery.data?.total_files ??
					Object.values(byStatus).reduce((s, n) => s + Number(n), 0),
				pending: pendingFromStatus || pending.length,
				rejected: Number(
					byStatus.rejected ?? summaryQuery.data?.rejected ?? rejectedIn.length
				),
			};
		}
		return {
			all: inboundQueue.length,
			pending: pending.length,
			rejected: rejectedIn.length,
		};
	}, [
		summaryQuery.data,
		inboundQueue.length,
		pending.length,
		rejectedIn.length,
	]);

	const vendors = useMemo(() => {
		if (isMockEnabled()) return [...VENDOR_NAMES];
		const fromRows = Array.from(
			new Set(inboundQueue.map((f) => f.vendor).filter((v) => v && v !== "—"))
		).sort();
		const known = Object.keys(vendorIdByName).sort();
		const merged = Array.from(new Set([...fromRows, ...known]));
		return merged.length > 0 ? merged : [];
	}, [inboundQueue, vendorIdByName]);
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
			return [f.fileId, f.fileName, f.vendor, f.fileTypeLabel]
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

	const analytics = useMemo(() => {
		const awaiting = pending;
		const waits = awaiting.map((f) => hoursSince(f.receivedAt));
		const claimsPending = awaiting.reduce((s, f) => s + f.records, 0);
		const claimsRejected = rejectedIn.reduce((s, f) => s + f.rejected, 0);
		const buckets = summaryQuery.data?.age_buckets;
		const under24 =
			buckets?.under_24h ??
			awaiting.filter((f) => hoursSince(f.receivedAt) < 24).length;
		const day1to3 =
			buckets?.day_1_to_3 ??
			awaiting.filter((f) => {
				const h = hoursSince(f.receivedAt);
				return h >= 24 && h < SLA_HOURS;
			}).length;
		const over3d =
			buckets?.over_3d ??
			awaiting.filter((f) => hoursSince(f.receivedAt) >= SLA_HOURS).length;
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

		const nameByVendorId = new Map<string, string>();
		for (const f of inboundQueue) {
			if (f.vendorId && f.vendor && f.vendor !== "—") {
				nameByVendorId.set(f.vendorId, f.vendor);
			}
		}
		for (const [name, id] of Object.entries(vendorIdByName)) {
			if (!nameByVendorId.has(id)) nameByVendorId.set(id, name);
		}

		const summaryByVendor = summaryQuery.data?.by_vendor;
		const byVendor =
			summaryByVendor && Object.keys(summaryByVendor).length > 0
				? Object.entries(summaryByVendor)
						.map(([id, files]) => ({
							name: nameByVendorId.get(id) ?? id.slice(0, 8),
							files: Number(files),
							claims: Number(files),
						}))
						.sort((a, b) => b.files - a.files)
				: Object.entries(
						inboundQueue.reduce<
							Record<string, { files: number; claims: number }>
						>((acc, f) => {
							const cur = acc[f.vendor] ?? { files: 0, claims: 0 };
							cur.files += 1;
							cur.claims += f.records;
							acc[f.vendor] = cur;
							return acc;
						}, {})
					)
						.map(([name, v]) => ({ name, ...v }))
						.sort((a, b) => b.claims - a.claims);

		const ageBuckets = [
			{ name: "< 24h", files: under24, fill: "#0ea5e9" },
			{ name: "1–3 days", files: day1to3, fill: "#f59e0b" },
			{ name: "≥ 3 days", files: over3d, fill: "#ef4444" },
		];

		const acceptedOut = allOutbound.filter(
			(f) => f.reviewStatus === "accepted"
		);
		const deniedOut = allOutbound.filter((f) => f.reviewStatus === "denied");
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
			acceptedOut,
			deniedOut,
			acceptRate,
			maxVendorClaims: Math.max(1, ...byVendor.map((v) => v.claims || v.files)),
			under24,
			day1to3,
			over3d,
			totalFiles: summaryQuery.data?.total_files ?? inboundQueue.length,
		};
	}, [
		pending,
		rejectedIn,
		inboundQueue,
		allOutbound,
		summaryQuery.data,
		vendorIdByName,
	]);

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
		try {
			await queryClient.invalidateQueries({
				queryKey: featureQueryKey("claim-encounter", "inbound-vendor-queue"),
			});
			await queryClient.invalidateQueries({
				queryKey: featureQueryKey("claim-encounter", "vendor-files"),
			});
			await queryClient.invalidateQueries({
				queryKey: featureQueryKey("claim-encounter", "vendor-files-summary"),
			});
			toast.success("Inbound queue refreshed");
		} catch {
			toast.error("Refresh failed");
		} finally {
			setRefreshing(false);
		}
	}

	async function handleSeedDemo() {
		try {
			const result = await seedMutation.mutateAsync({ force: true });
			await queryClient.invalidateQueries({
				queryKey: featureQueryKey("claim-encounter", "inbound-vendor-queue"),
			});
			await queryClient.invalidateQueries({
				queryKey: featureQueryKey("claim-encounter", "vendor-files"),
			});
			await queryClient.invalidateQueries({
				queryKey: featureQueryKey("claim-encounter", "vendor-files-summary"),
			});
			const created =
				typeof result.result.created === "number"
					? result.result.created
					: undefined;
			toast.success(
				created != null
					? `Seeded ${created} via ${result.source}`
					: `Seeded via ${result.source}`
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Seed demo failed");
		}
	}

	const pendingCount =
		summaryQuery.data?.by_review_status?.pending ??
		summaryQuery.data?.awaiting_review ??
		pending.length;
	const rejectedCount =
		summaryQuery.data?.by_review_status?.rejected ??
		summaryQuery.data?.rejected ??
		rejectedIn.length;
	const packageTotal = Math.max(statusCounts.all, 1);

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
			value: pendingCount,
			hint: `${formatCount(analytics.claimsPending)} claims · ${pct(Number(pendingCount), packageTotal)}%`,
			icon: Clock3,
			accent: "from-amber-500/80 to-amber-400/40",
			valueTone: "text-amber-700 dark:text-amber-300",
			iconTone: "text-amber-700 bg-amber-500/10 dark:text-amber-200",
			ring: "ring-amber-500/20",
			active: statusFilter === "pending",
			onClick: () => {
				setStatusFilter((s) => (s === "pending" ? "all" : "pending"));
				setPage(1);
			},
		},
		{
			id: "rejected",
			label: "MFC rejected",
			value: rejectedCount,
			hint: `${formatCount(analytics.claimsRejected)} claims · vendor rework`,
			icon: XCircle,
			accent: "from-rose-500/80 to-rose-400/40",
			valueTone: "text-rose-700 dark:text-rose-300",
			iconTone: "text-rose-700 bg-rose-500/10 dark:text-rose-300",
			ring: "ring-rose-500/20",
			active: statusFilter === "rejected",
			onClick: () => {
				setStatusFilter((s) => (s === "rejected" ? "all" : "rejected"));
				setPage(1);
			},
		},
		{
			id: "sla",
			label: "Age risk (≥3d)",
			value: analytics.over3d,
			hint: `${pct(analytics.over3d, packageTotal)}% past SLA`,
			icon: AlertTriangle,
			accent: "from-rose-500/80 to-rose-400/40",
			valueTone: "text-rose-700 dark:text-rose-300",
			iconTone: "text-rose-700 bg-rose-500/10 dark:text-rose-300",
			ring: "ring-rose-500/20",
			active: waitBucket === "sla",
			onClick: () => {
				setWaitBucket((b) => (b === "sla" ? "all" : "sla"));
				setPage(1);
			},
		},
		{
			id: "avg-wait",
			label: "Avg wait",
			value: formatWaitLabel(analytics.avgWait),
			hint: "Across pending files",
			icon: Hourglass,
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

	async function handleExportCsv() {
		if (isMockEnabled()) {
			toast.message("Export CSV is live-mode only.");
			return;
		}
		try {
			const result = await exportMutation.mutateAsync(summaryApiParams);
			downloadBlob(
				result.filename ?? stampFilename("claim-vendor-files"),
				result.blob
			);
			toast.success("Vendor files CSV downloaded");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Export failed");
		}
	}

	if (queueQuery.isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
					<div className="min-w-0 space-y-1">
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							Inbound
						</h1>
						<p className="text-sm text-muted-foreground">
							Loading queue · {programFilter}
						</p>
					</div>
				</div>
				<p className="text-sm text-muted-foreground">Loading inbound files…</p>
			</div>
		);
	}

	if (queueQuery.isError) {
		return (
			<div className="space-y-4">
				<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
					<div className="min-w-0 space-y-1">
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							Inbound
						</h1>
						<p className="text-sm text-muted-foreground">
							Pending review · {programFilter}
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={handleRefresh}
					>
						<RefreshCw className="size-3.5" />
						Retry
					</Button>
				</div>
				<p className="text-sm text-destructive">
					Could not load inbound vendor files.
					{queueQuery.error instanceof Error
						? ` ${queueQuery.error.message}`
						: ""}
				</p>
			</div>
		);
	}

	const ageTotal = Math.max(
		analytics.under24 + analytics.day1to3 + analytics.over3d,
		1
	);

	return (
		<div className="space-y-4">
			{/* Header — match outbound CMS EDGE Reporting rhythm */}
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Inbound
					</h1>
					<p className="text-sm text-muted-foreground">
						Pending review + MFC-rejected · {programFilter}
						{openExceptionCount > 0 && !isMockEnabled() ? (
							<>
								{" · "}
								<Link
									href="/admin/claim-encounter/exceptions"
									className="font-medium text-amber-800 underline-offset-2 hover:underline"
								>
									{formatCount(openExceptionCount)} open exceptions
								</Link>
							</>
						) : null}
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
					{!isMockEnabled() ? (
						<Button
							variant="outline"
							size="sm"
							className={cn(
								toolbarBtn,
								"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
							)}
							disabled={exportMutation.isPending}
							onClick={() => void handleExportCsv()}
						>
							<Download className="size-3.5" />
							{exportMutation.isPending ? "Exporting…" : "Export CSV"}
						</Button>
					) : null}
					{!isMockEnabled() ? (
						<Button
							variant="outline"
							size="sm"
							className={cn(
								toolbarBtn,
								"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
							)}
							onClick={handleSeedDemo}
							disabled={seedMutation.isPending}
						>
							{seedMutation.isPending ? "Seeding…" : "Seed demo"}
						</Button>
					) : null}
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={handleRefresh}
						disabled={refreshing || queueQuery.isFetching}
					>
						<RefreshCw
							className={cn(
								"size-3.5",
								(refreshing || queueQuery.isFetching) && "animate-spin"
							)}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{/* KPI grid — outbound reporting pattern */}
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

			{/* Filters — outbound reporting-style panel */}
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
							placeholder="Search file ID, name, vendor, claim type…"
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
								setStatusFilter(v as "all" | "pending" | "rejected");
								setPage(1);
							}}
						>
							<SelectTrigger className={selectField}>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									All status ({statusCounts.all})
								</SelectItem>
								<SelectItem value="pending">
									Pending ({statusCounts.pending})
								</SelectItem>
								<SelectItem value="rejected">
									Rejected ({statusCounts.rejected})
								</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={waitBucket}
							onValueChange={(v) => {
								setWaitBucket(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-[8rem]")}>
								<SelectValue placeholder="Age" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Any age</SelectItem>
								<SelectItem value="fresh">
									&lt; 24h ({analytics.under24})
								</SelectItem>
								<SelectItem value="aging">
									1–3 days ({analytics.day1to3})
								</SelectItem>
								<SelectItem value="sla">
									≥ 3 days ({analytics.over3d})
								</SelectItem>
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
								<TableHead className={th}>Received</TableHead>
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
										{inboundQueue.length === 0 && !isMockEnabled() ? (
											<span>
												No claim vendor files in core yet. Click{" "}
												<button
													type="button"
													className="font-medium text-primary underline-offset-2 hover:underline"
													onClick={handleSeedDemo}
													disabled={seedMutation.isPending}
												>
													Seed demo
												</button>{" "}
												to load the review queue.
											</span>
										) : hasActiveFilters ? (
											"No inbound files match your filters."
										) : (
											"No inbound files for this program."
										)}
									</TableCell>
								</TableRow>
							) : (
								pageRows.map((row, index) => (
									<InboundRow
										key={row.id}
										row={row}
										index={(safePage - 1) * pageSize + index + 1}
									/>
								))
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

			{/* Analytics — outbound CmsEdgeSectionPanel pattern */}
			<div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
				<CmsEdgeSectionPanel
					title="Queue age mix"
					subtitle="Pending files vs 72h SLA"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					{analytics.ageBuckets.every((b) => b.files === 0) ? (
						<div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
							No pending files in scope
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
											{analytics.under24 + analytics.day1to3 + analytics.over3d}
										</p>
										<p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
											Pending
										</p>
									</div>
								</div>
								<div className="min-w-0 flex-1 space-y-1.5">
									{analytics.ageBuckets.map((b) => {
										const next = b.name.startsWith("<")
											? "fresh"
											: b.name.includes("1–3")
												? "aging"
												: "sla";
										const active = waitBucket === next;
										return (
											<button
												key={b.name}
												type="button"
												onClick={() => {
													setWaitBucket((cur) => (cur === next ? "all" : next));
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
													<span className="ml-1 text-[10px]">
														({pct(b.files, ageTotal)}%)
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
										{outboundAvailable ? `${analytics.acceptRate}%` : "—"}
									</span>
								</div>
								<div className="h-1.5 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
										style={{
											width: `${outboundAvailable ? analytics.acceptRate : 0}%`,
										}}
									/>
								</div>
							</div>
						</div>
					)}
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Vendor backlog"
					subtitle="Files waiting by vendor"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					{analytics.byVendor.length === 0 ? (
						<p className="flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
							Queue is empty.
						</p>
					) : (
						<ul className="flex flex-1 flex-col justify-evenly gap-1.5">
							{analytics.byVendor.slice(0, 5).map((v) => {
								const share = pct(v.files, analytics.maxVendorClaims);
								const active = vendor === v.name;
								return (
									<li key={v.name} className="min-h-0">
										<button
											type="button"
											onClick={() => {
												setVendor((cur) => (cur === v.name ? "all" : v.name));
												setPage(1);
											}}
											className={cn(
												"flex h-full w-full flex-col justify-center rounded-sm border px-2 py-2 text-left transition",
												active
													? "border-primary/30 bg-primary/5"
													: "border-transparent hover:bg-muted/40"
											)}
										>
											<div className="mb-1 flex items-center justify-between gap-2 text-xs">
												<span className="truncate font-medium">{v.name}</span>
												<span className="shrink-0 tabular-nums text-muted-foreground">
													{v.files}{" "}
													<span className="text-[10px]">({share}%)</span>
												</span>
											</div>
											<div className="h-1.5 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full bg-sky-500 transition-all"
													style={{
														width: `${Math.max(v.files > 0 ? 4 : 0, share)}%`,
													}}
												/>
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Needs attention"
					subtitle="Prioritize aging and high-volume files"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					<ul className="flex flex-1 flex-col justify-evenly gap-1.5">
						{analytics.oldest ? (
							<li className="min-h-0">
								<AttentionRow
									icon={Hourglass}
									tone="text-amber-700 bg-amber-500/10"
									title="Oldest waiting"
									meta={`${analytics.oldest.vendor} · ${formatWaitLabel(hoursSince(analytics.oldest.receivedAt))}`}
									detail={analytics.oldest.fileId}
									href={`/admin/claim-encounter/files/${encodeURIComponent(analytics.oldest.fileId)}/review`}
								/>
							</li>
						) : null}
						{analytics.largest ? (
							<li className="min-h-0">
								<AttentionRow
									icon={ScrollText}
									tone="text-sky-700 bg-sky-500/10"
									title="Largest file"
									meta={`${formatCount(analytics.largest.records)} claims · ${analytics.largest.vendor}`}
									detail={analytics.largest.fileId}
									href={`/admin/claim-encounter/files/${encodeURIComponent(analytics.largest.fileId)}/review`}
								/>
							</li>
						) : null}
						{analytics.slaRisk[0] ? (
							<li className="min-h-0">
								<AttentionRow
									icon={AlertTriangle}
									tone="text-rose-700 bg-rose-500/10"
									title="SLA breach"
									meta={`${analytics.slaRisk.length} file(s) past ${SLA_HOURS}h`}
									detail={analytics.slaRisk[0].fileId}
									href={`/admin/claim-encounter/files/${encodeURIComponent(analytics.slaRisk[0].fileId)}/review`}
								/>
							</li>
						) : (
							<li className="rounded-sm border border-emerald-200/80 bg-emerald-50 px-2 py-2 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
								No files past the {SLA_HOURS}h review SLA.
							</li>
						)}
					</ul>
				</CmsEdgeSectionPanel>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<CmsEdgeSectionPanel
					title="Program snapshot"
					subtitle={`${programFilter} inbound volume`}
					bodyClassName="p-4"
				>
					<div className="grid grid-cols-2 gap-2">
						<div className="rounded-sm border border-border/60 bg-muted/20 px-2.5 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
								Inbound files
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums">
								{formatCount(analytics.totalFiles)}
							</p>
						</div>
						<div className="rounded-sm border border-border/60 bg-muted/20 px-2.5 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
								Pending claims
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums">
								{formatCount(analytics.claimsPending)}
							</p>
						</div>
						<div className="rounded-sm border border-border/60 bg-muted/20 px-2.5 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
							<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
								File types
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums">
								{formatCount(fileTypes.length)}
							</p>
						</div>
					</div>
					<Button
						asChild
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"mt-3 w-full border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
					>
						<Link href="/admin/claim-encounter/acceptance-analytics">
							<FileSearch className="size-3.5" />
							Open acceptance analytics
						</Link>
					</Button>
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Vendor claim volume"
					subtitle="Files in queue by vendor"
					bodyClassName="px-2 pb-3 pt-2"
				>
					{analytics.byVendor.length === 0 ? (
						<p className="py-8 text-center text-xs text-muted-foreground">
							No vendor volume in scope.
						</p>
					) : (
						<div className="h-[220px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									layout="vertical"
									data={analytics.byVendor.slice(0, 6).map((v) => ({
										...v,
										short:
											v.name.length > 14 ? `${v.name.slice(0, 12)}…` : v.name,
									}))}
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
										dataKey="files"
										name="Files"
										fill="#0284c7"
										radius={[0, 4, 4, 0]}
										barSize={14}
										cursor="pointer"
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
												fill={vendor === v.name ? "#0369a1" : "#0284c7"}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					)}
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
		payload?: { name?: string };
	}>;
	label?: string | number;
}) {
	if (!active || !payload?.length) return null;
	const title =
		typeof label === "string" || typeof label === "number"
			? String(label)
			: (payload[0]?.payload?.name ?? "");

	return (
		<div className="rounded-sm border border-border/70 bg-card px-2.5 py-1.5 text-xs shadow-md">
			{title ? (
				<p className="mb-1 font-medium text-foreground">{title}</p>
			) : null}
			<ul className="space-y-0.5">
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
	href,
}: {
	icon: LucideIcon;
	tone: string;
	title: string;
	meta: string;
	detail: string;
	href: string;
}) {
	return (
		<Link
			href={href}
			className="flex h-full w-full items-start gap-2 rounded-sm border border-border/60 px-2 py-2 transition hover:bg-muted/40"
		>
			<span
				className={cn(
					"mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm ring-1 ring-inset ring-black/5 dark:ring-white/10",
					tone
				)}
			>
				<Icon className="size-3.5" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-xs font-medium text-foreground">
					{title}
				</span>
				<span className="block text-[11px] text-muted-foreground">{meta}</span>
				<span className="mt-0.5 block truncate font-mono text-[10px] text-foreground/80">
					{detail}
				</span>
			</span>
		</Link>
	);
}

function InboundRow({ row, index }: { row: ClaimVendorFile; index: number }) {
	const router = useRouter();
	const wait = hoursSince(row.receivedAt);
	const reviewHref = `/admin/claim-encounter/files/${encodeURIComponent(row.fileId)}/review`;
	const detailHref = `/admin/claim-encounter/files/${encodeURIComponent(row.fileId)}`;

	return (
		<TableRow
			className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/25"
			onClick={() => {
				router.push(row.reviewStatus === "pending" ? reviewHref : detailHref);
			}}
		>
			<TableCell
				className={cn(
					td,
					"w-12 pl-4 text-center tabular-nums text-muted-foreground"
				)}
			>
				{index}
			</TableCell>
			<TableCell className={td}>
				<div className="min-w-0 space-y-0.5">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="font-mono text-[11px] font-medium text-primary">
							{row.fileId}
						</span>
						<TxBadge label="837" />
						<span className="text-[10px] text-muted-foreground">
							{row.program}
						</span>
					</div>
					<p className="max-w-[260px] truncate text-[11px] text-muted-foreground">
						{row.fileName}
					</p>
				</div>
			</TableCell>
			<TableCell className={cn(td, "font-medium")}>{row.vendor}</TableCell>
			<TableCell className={td}>
				<span className="text-[11px] text-muted-foreground">
					{row.fileTypeLabel}
				</span>
			</TableCell>
			<TableCell className={cn(td, "text-right font-medium tabular-nums")}>
				{formatCount(row.records)}
			</TableCell>
			<TableCell className={cn(td, "tabular-nums text-muted-foreground")}>
				{row.receivedAt}
			</TableCell>
			<TableCell className={td}>
				<WaitPill wait={wait} />
			</TableCell>
			<TableCell className={td}>
				<ReviewStatusPill status={row.reviewStatus} />
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
					<DropdownMenuContent align="end" className="w-44">
						{row.reviewStatus === "pending" ? (
							<DropdownMenuItem asChild>
								<Link href={reviewHref}>
									<Eye className="mr-2 size-3.5" />
									Review
								</Link>
							</DropdownMenuItem>
						) : null}
						<DropdownMenuItem asChild>
							<Link href={detailHref}>
								<ExternalLink className="mr-2 size-3.5" />
								{row.reviewStatus === "rejected" ? "View" : "Open EDI"}
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
}

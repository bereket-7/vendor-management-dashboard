"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowUpDown,
	CheckCircle2,
	ClipboardList,
	Clock3,
	FileSearch,
	Hourglass,
	RefreshCw,
	ScrollText,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
	ClaimKpiGrid,
	ClaimPageHeader,
} from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import {
	ClaimFilterBar,
	ClaimSectionCard,
	ClaimTablePagination,
	FilterField,
	MetricBar,
	formatWaitLabel,
	hoursSince,
	pct,
	usePagedRows,
} from "@/features/admin/features/claim-encounter/components/ClaimQueueChrome";
import {
	type ClaimVendorFile,
	filesForProgram,
	formatCount,
} from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type SortKey = "receivedAt" | "records" | "vendor" | "wait";

const SLA_HOURS = 48;

export function InboundVendorFilePage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
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

	/** Inbound = pending review + MFC-rejected (held for vendor correction). */
	const inboundQueue = useMemo(
		() => filesForProgram(programFilter, "inbound"),
		[programFilter]
	);
	const allOutbound = useMemo(
		() => filesForProgram(programFilter, "outbound"),
		[programFilter]
	);
	const pending = useMemo(
		() => inboundQueue.filter((f) => f.reviewStatus === "pending"),
		[inboundQueue]
	);
	const rejectedIn = useMemo(
		() => inboundQueue.filter((f) => f.reviewStatus === "rejected"),
		[inboundQueue]
	);

	const vendors = VENDOR_NAMES;
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
			.map(([name, v]) => ({ name, ...v }))
			.sort((a, b) => b.claims - a.claims);

		const ageBuckets = [
			{
				name: "< 24h",
				files: awaiting.filter((f) => hoursSince(f.receivedAt) < 24).length,
				fill: "#0ea5e9",
			},
			{
				name: "24–48h",
				files: aging.length,
				fill: "#f59e0b",
			},
			{
				name: `≥ ${SLA_HOURS}h SLA`,
				files: slaRisk.length,
				fill: "#ef4444",
			},
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
			maxVendorClaims: Math.max(1, ...byVendor.map((v) => v.claims)),
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
		await new Promise((r) => setTimeout(r, 400));
		setRefreshing(false);
		toast.success("Inbound queue refreshed");
	}

	const kpis = [
		{
			label: "Awaiting review",
			value: formatCount(pending.length),
			hint: `${formatCount(analytics.claimsPending)} claims`,
			icon: Clock3,
			tone: "text-amber-700 bg-amber-500/10",
		},
		{
			label: "MFC rejected",
			value: formatCount(rejectedIn.length),
			hint: `${formatCount(analytics.claimsRejected)} claims · vendor rework`,
			icon: XCircle,
			tone: "text-red-700 bg-red-500/10",
		},
		{
			label: "SLA risk",
			value: formatCount(analytics.slaRisk.length),
			hint: `Pending waiting ≥ ${SLA_HOURS}h`,
			icon: AlertTriangle,
			tone: "text-red-700 bg-red-500/10",
		},
		{
			label: "Avg wait",
			value: formatWaitLabel(analytics.avgWait),
			hint: "Across pending files",
			icon: Hourglass,
			tone: "text-orange-700 bg-orange-500/10",
		},
		{
			label: "Accepted out",
			value: formatCount(analytics.acceptedOut.length),
			hint: "Moved to outbound",
			icon: CheckCircle2,
			tone: "text-emerald-700 bg-emerald-500/10",
		},
		{
			label: "Denied out",
			value: formatCount(analytics.deniedOut.length),
			hint: "Gainwell denials",
			icon: XCircle,
			tone: "text-rose-700 bg-rose-500/10",
		},
	];

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Inbound Vendor File"
				description={`Pending review + MFC-rejected (vendor correction) · ${programFilter}`}
				actions={
					<div className="flex flex-wrap gap-1.5">
						<Button asChild variant="outline" size="sm" className="h-9">
							<Link href="/admin/claim-encounter/outbound">View outbound</Link>
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-9"
							onClick={handleRefresh}
							disabled={refreshing}
						>
							<RefreshCw
								className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")}
							/>
							Refresh
						</Button>
					</div>
				}
			/>

			<ClaimKpiGrid items={kpis} />

			{/* Review queue — directly under stats */}
			<div className="flex flex-wrap gap-1.5">
				{[
					{
						id: "all" as const,
						label: "All inbound",
						count: inboundQueue.length,
					},
					{ id: "pending" as const, label: "Pending", count: pending.length },
					{
						id: "rejected" as const,
						label: "Rejected",
						count: rejectedIn.length,
					},
				].map((chip) => (
					<button
						key={chip.id}
						type="button"
						onClick={() => {
							setStatusFilter(chip.id);
							setPage(1);
						}}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
							statusFilter === chip.id
								? "border-primary/40 bg-primary/10 text-primary"
								: "border-border/60 bg-card/70 text-muted-foreground hover:bg-muted/40"
						)}
					>
						{chip.label}
						<span className="tabular-nums opacity-80">{chip.count}</span>
					</button>
				))}
				<span className="mx-1 h-4 w-px bg-border/70" />
				{(
					[
						{ id: "all", label: "Any age", count: pending.length },
						{
							id: "fresh",
							label: "< 24h",
							count: analytics.ageBuckets[0]?.files ?? 0,
						},
						{
							id: "aging",
							label: "24–48h",
							count: analytics.ageBuckets[1]?.files ?? 0,
						},
						{
							id: "sla",
							label: "SLA risk",
							count: analytics.slaRisk.length,
						},
					] as const
				).map((chip) => (
					<button
						key={chip.id}
						type="button"
						onClick={() => {
							setWaitBucket(chip.id);
							setPage(1);
						}}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
							waitBucket === chip.id
								? "border-primary/40 bg-primary/10 text-primary"
								: "border-border/60 bg-card/70 text-muted-foreground hover:bg-muted/40"
						)}
					>
						{chip.label}
						<span className="tabular-nums opacity-80">{chip.count}</span>
					</button>
				))}
			</div>

			<ClaimFilterBar
				search={search}
				onSearchChange={(v) => {
					setSearch(v);
					setPage(1);
				}}
				searchPlaceholder="File ID, name, vendor, claim type…"
				hasActiveFilters={hasActiveFilters}
				onClear={clearFilters}
			>
				<FilterField label="Vendor">
					<Select
						value={vendor}
						onValueChange={(v) => {
							setVendor(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-[160px]">
							<SelectValue />
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
				</FilterField>
				<FilterField label="Claim type">
					<Select
						value={fileType}
						onValueChange={(v) => {
							setFileType(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-[160px]">
							<SelectValue />
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
				</FilterField>
				<FilterField label="Sort">
					<Select
						value={`${sortKey}:${sortDir}`}
						onValueChange={(v) => {
							const [k, d] = v.split(":") as [SortKey, "asc" | "desc"];
							setSortKey(k);
							setSortDir(d);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="wait:desc">Wait (longest)</SelectItem>
							<SelectItem value="wait:asc">Wait (shortest)</SelectItem>
							<SelectItem value="receivedAt:desc">Received (newest)</SelectItem>
							<SelectItem value="receivedAt:asc">Received (oldest)</SelectItem>
							<SelectItem value="records:desc">Claims (high→low)</SelectItem>
							<SelectItem value="records:asc">Claims (low→high)</SelectItem>
							<SelectItem value="vendor:asc">Vendor A–Z</SelectItem>
						</SelectContent>
					</Select>
				</FilterField>
			</ClaimFilterBar>

			<Card className="gap-1 bg-card/70 py-2">
				<CardHeader className="px-3 pb-0.5 pt-0">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div>
							<CardTitle className="text-sm font-medium">
								Review queue
							</CardTitle>
							<p className="text-[11px] text-muted-foreground">
								{rows.length} matching · pending await MFC review; rejected stay
								inbound for vendor correction
							</p>
						</div>
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
							<ClipboardList className="size-3.5" />
							<span className="tabular-nums">
								{formatCount(rows.reduce((s, f) => s + f.records, 0))} claims in
								view
							</span>
						</div>
					</div>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-3 sm:pl-4">
										<SortHead
											label="File"
											active={sortKey === "receivedAt"}
											onClick={() => toggleSort("receivedAt")}
										/>
									</TableHead>
									<TableHead>
										<SortHead
											label="Vendor"
											active={sortKey === "vendor"}
											onClick={() => toggleSort("vendor")}
										/>
									</TableHead>
									<TableHead>Type</TableHead>
									<TableHead className="text-right">
										<SortHead
											label="Claims"
											active={sortKey === "records"}
											onClick={() => toggleSort("records")}
											className="ml-auto"
										/>
									</TableHead>
									<TableHead>Received</TableHead>
									<TableHead>
										<SortHead
											label="Wait"
											active={sortKey === "wait"}
											onClick={() => toggleSort("wait")}
										/>
									</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="pr-3 sm:pr-4">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => (
									<InboundRow key={row.id} row={row} />
								))}
								{pageRows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-24 text-center text-muted-foreground"
										>
											No inbound files match the current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
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
				</CardContent>
			</Card>

			{/* Analytics — below review queue */}
			<div className="grid gap-3 lg:grid-cols-3">
				<ClaimSectionCard
					title="Queue age mix"
					description="Where pending (not yet reviewed) files sit relative to the 48h SLA"
					className="lg:col-span-1"
				>
					<div className="h-[180px]">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={analytics.ageBuckets}
									dataKey="files"
									nameKey="name"
									innerRadius={48}
									outerRadius={72}
									paddingAngle={2}
								>
									{analytics.ageBuckets.map((b) => (
										<Cell key={b.name} fill={b.fill} />
									))}
								</Pie>
								<Tooltip
									formatter={(value: number, name: string) => [
										`${value} files`,
										name,
									]}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-1 space-y-1.5">
						{analytics.ageBuckets.map((b) => (
							<button
								key={b.name}
								type="button"
								className={cn(
									"flex w-full items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-muted/50",
									waitBucket !== "all" &&
										((waitBucket === "fresh" && b.name.startsWith("<")) ||
											(waitBucket === "aging" && b.name.startsWith("24")) ||
											(waitBucket === "sla" && b.name.includes("SLA"))) &&
										"bg-muted/60"
								)}
								onClick={() => {
									const next = b.name.startsWith("<")
										? "fresh"
										: b.name.startsWith("24")
											? "aging"
											: "sla";
									setWaitBucket((cur) => (cur === next ? "all" : next));
									setPage(1);
								}}
							>
								<span className="flex items-center gap-2">
									<span
										className="size-2 rounded-full"
										style={{ background: b.fill }}
									/>
									{b.name}
								</span>
								<span className="tabular-nums font-medium">{b.files}</span>
							</button>
						))}
					</div>
				</ClaimSectionCard>

				<ClaimSectionCard
					title="Vendor backlog"
					description="Claims waiting by vendor — click a bar filter"
					className="lg:col-span-1"
				>
					<div className="h-[200px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={analytics.byVendor.slice(0, 6)}
								layout="vertical"
								margin={{ left: 4, right: 8, top: 4, bottom: 4 }}
							>
								<CartesianGrid strokeDasharray="3 3" horizontal={false} />
								<XAxis type="number" hide />
								<YAxis
									type="category"
									dataKey="name"
									width={78}
									tick={{ fontSize: 11 }}
								/>
								<Tooltip
									formatter={(value: number, name: string) => [
										value,
										name === "claims" ? "Claims" : "Files",
									]}
								/>
								<Bar
									dataKey="claims"
									radius={[0, 4, 4, 0]}
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
											fill={vendor === v.name ? "#13446c" : "#13446c99"}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</ClaimSectionCard>

				<ClaimSectionCard
					title="Needs attention"
					description="Prioritize review on aging and high-volume files"
					className="lg:col-span-1"
				>
					<div className="space-y-2.5">
						{analytics.oldest ? (
							<AttentionRow
								icon={Hourglass}
								tone="text-amber-700 bg-amber-500/10"
								title="Oldest waiting"
								meta={`${analytics.oldest.vendor} · ${formatWaitLabel(hoursSince(analytics.oldest.receivedAt))}`}
								detail={analytics.oldest.fileId}
								href={`/admin/claim-encounter/files/${encodeURIComponent(analytics.oldest.fileId)}/review`}
							/>
						) : null}
						{analytics.largest ? (
							<AttentionRow
								icon={ScrollText}
								tone="text-sky-700 bg-sky-500/10"
								title="Largest file"
								meta={`${formatCount(analytics.largest.records)} claims · ${analytics.largest.vendor}`}
								detail={analytics.largest.fileId}
								href={`/admin/claim-encounter/files/${encodeURIComponent(analytics.largest.fileId)}/review`}
							/>
						) : null}
						{analytics.slaRisk[0] ? (
							<AttentionRow
								icon={AlertTriangle}
								tone="text-red-700 bg-red-500/10"
								title="SLA breach"
								meta={`${analytics.slaRisk.length} file(s) past ${SLA_HOURS}h`}
								detail={analytics.slaRisk[0].fileId}
								href={`/admin/claim-encounter/files/${encodeURIComponent(analytics.slaRisk[0].fileId)}/review`}
							/>
						) : (
							<div className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2 text-xs text-primary">
								No files past the {SLA_HOURS}h review SLA.
							</div>
						)}
						<div className="rounded-md border border-border/50 bg-background/50 px-2.5 py-2">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">
									Outbound accept rate
								</span>
								<span className="font-semibold tabular-nums">
									{analytics.acceptRate}%
								</span>
							</div>
							<Progress value={analytics.acceptRate} className="mt-1.5 h-1.5" />
						</div>
					</div>
				</ClaimSectionCard>
			</div>

			<div className="grid gap-3 md:grid-cols-3">
				<ClaimSectionCard
					title="Review workflow"
					description="How inbound files move through MFC"
				>
					<ol className="space-y-2 text-xs text-muted-foreground">
						<li className="flex gap-2">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
								1
							</span>
							Open a file, inspect 837 claim loops in the EDI reader
						</li>
						<li className="flex gap-2">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
								2
							</span>
							Accept clean claims or reject with catalog reason codes
						</li>
						<li className="flex gap-2">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
								3
							</span>
							Accepted packages go outbound; full MFC rejects stay inbound for
							vendor rework
						</li>
					</ol>
				</ClaimSectionCard>
				<ClaimSectionCard title="Vendor share of queue">
					<div className="space-y-2">
						{analytics.byVendor.slice(0, 5).map((v) => (
							<button
								key={v.name}
								type="button"
								className="w-full text-left"
								onClick={() => {
									setVendor(v.name);
									setPage(1);
								}}
							>
								<MetricBar
									label={v.name}
									value={v.claims}
									max={analytics.maxVendorClaims}
									suffix="claims"
									tone={vendor === v.name ? "bg-primary" : "bg-primary/50"}
								/>
							</button>
						))}
						{analytics.byVendor.length === 0 ? (
							<p className="text-xs text-muted-foreground">Queue is empty.</p>
						) : null}
					</div>
				</ClaimSectionCard>
				<ClaimSectionCard
					title="Program snapshot"
					description={`${programFilter} inbound volume`}
				>
					<div className="grid grid-cols-2 gap-2">
						<div className="rounded-md border border-border/40 bg-background/50 px-2.5 py-2">
							<p className="text-[10px] uppercase text-muted-foreground">
								Inbound files
							</p>
							<p className="text-lg font-semibold tabular-nums">
								{formatCount(inboundQueue.length)}
							</p>
						</div>
						<div className="rounded-md border border-border/40 bg-background/50 px-2.5 py-2">
							<p className="text-[10px] uppercase text-muted-foreground">
								Pending claims
							</p>
							<p className="text-lg font-semibold tabular-nums">
								{formatCount(analytics.claimsPending)}
							</p>
						</div>
						<div className="rounded-md border border-border/40 bg-background/50 px-2.5 py-2">
							<p className="text-[10px] uppercase text-muted-foreground">
								Avg claims / file
							</p>
							<p className="text-lg font-semibold tabular-nums">
								{pending.length
									? formatCount(
											Math.round(analytics.claimsPending / pending.length)
										)
									: "0"}
							</p>
						</div>
						<div className="rounded-md border border-border/40 bg-background/50 px-2.5 py-2">
							<p className="text-[10px] uppercase text-muted-foreground">
								File types
							</p>
							<p className="text-lg font-semibold tabular-nums">
								{formatCount(fileTypes.length)}
							</p>
						</div>
					</div>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="mt-3 h-8 w-full text-xs"
					>
						<Link href="/admin/claim-encounter/acceptance-analytics">
							<FileSearch className="mr-1.5 size-3.5" />
							Open acceptance analytics
						</Link>
					</Button>
				</ClaimSectionCard>
			</div>
		</div>
	);
}

function SortHead({
	label,
	active,
	onClick,
	className,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"inline-flex items-center gap-1 text-xs font-medium hover:text-foreground",
				active ? "text-foreground" : "text-muted-foreground",
				className
			)}
		>
			{label}
			<ArrowUpDown className="size-3 opacity-60" />
		</button>
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
	icon: typeof Hourglass;
	tone: string;
	title: string;
	meta: string;
	detail: string;
	href: string;
}) {
	return (
		<Link
			href={href}
			className="flex items-start gap-2 rounded-md border border-border/50 bg-background/40 px-2.5 py-2 transition-colors hover:bg-muted/40"
		>
			<span
				className={cn(
					"mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
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
		</Link>
	);
}

function InboundRow({ row }: { row: ClaimVendorFile }) {
	const wait = hoursSince(row.receivedAt);
	const sla = wait >= SLA_HOURS;
	const aging = wait >= 24 && wait < SLA_HOURS;

	return (
		<TableRow className="hover:bg-muted/30">
			<TableCell className="pl-3 sm:pl-4">
				<div className="min-w-0">
					<p className="font-mono text-xs font-medium">{row.fileId}</p>
					<p className="truncate text-[11px] text-muted-foreground">
						{row.fileName}
					</p>
				</div>
			</TableCell>
			<TableCell className="text-sm">{row.vendor}</TableCell>
			<TableCell>
				<div className="flex flex-col gap-0.5">
					<span className="w-fit rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
						837
					</span>
					<span className="text-[10px] text-muted-foreground">
						{row.fileTypeLabel}
					</span>
				</div>
			</TableCell>
			<TableCell className="text-right text-sm tabular-nums">
				{formatCount(row.records)}
			</TableCell>
			<TableCell className="text-xs tabular-nums text-muted-foreground">
				{row.receivedAt}
			</TableCell>
			<TableCell>
				<span
					className={cn(
						"rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
						sla
							? "bg-red-100 text-red-800"
							: aging
								? "bg-amber-100 text-amber-900"
								: "bg-sky-100 text-sky-900"
					)}
				>
					{formatWaitLabel(wait)}
				</span>
			</TableCell>
			<TableCell>
				<span
					className={cn(
						"rounded-full px-2 py-0.5 text-[10px] font-medium",
						row.reviewStatus === "rejected"
							? "bg-red-100 text-red-800"
							: "bg-amber-100 text-amber-900"
					)}
				>
					{row.reviewStatus === "rejected" ? "MFC rejected" : "Pending review"}
				</span>
			</TableCell>
			<TableCell className="pr-3 sm:pr-4">
				<div className="flex flex-wrap gap-1">
					{row.reviewStatus === "pending" ? (
						<Button asChild size="sm" className="h-7 text-xs">
							<Link
								href={`/admin/claim-encounter/files/${encodeURIComponent(row.fileId)}/review`}
							>
								Review
							</Link>
						</Button>
					) : null}
					<Button asChild variant="outline" size="sm" className="h-7 text-xs">
						<Link
							href={`/admin/claim-encounter/files/${encodeURIComponent(row.fileId)}`}
						>
							{row.reviewStatus === "rejected" ? "View" : "Open EDI"}
						</Link>
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}

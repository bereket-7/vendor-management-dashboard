"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowDownUp,
	Ban,
	Bell,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Download,
	ExternalLink,
	MoreVertical,
	Plus,
	RefreshCw,
	Search,
	Users,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { liveVendorsToDirectoryRows } from "@/features/admin/features/vendors/live-directory";
import { VendorActionsMenu } from "@/features/admin/features/vendors/components/VendorActionsMenu";
import {
	VENDOR_DIRECTORY,
	type VendorDirectoryRow,
	type VendorListHealth,
	type VendorListStatus,
	summarizeVendorDirectory,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import {
	useInvalidateVendorCore,
	useVendorCoreAccounts,
	useVendorCoreConnections,
	useVendorCoreInboundFiles,
	useVendorCoreJobs,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";

function StatusPill({ status }: { status: VendorListStatus }) {
	return <StatusBadge status={status} />;
}

function HealthDot({ health }: { health: VendorListHealth }) {
	const label =
		health === "healthy"
			? "Healthy"
			: health === "warning"
				? "Warning"
				: "Critical";
	const color =
		health === "healthy"
			? "bg-emerald-500"
			: health === "warning"
				? "bg-amber-500"
				: "bg-red-500";
	return (
		<span className="inline-flex items-center gap-1.5 text-xs">
			<span className={cn("size-1.5 rounded-full", color)} />
			{label}
		</span>
	);
}

function detailHref(row: VendorDirectoryRow) {
	return `/admin/vendors/${row.id}`;
}

type SortKey =
	| "name"
	| "vendorCode"
	| "vendorType"
	| "status"
	| "linkedAccounts"
	| "activeJobs"
	| "lastFileReceived"
	| "health"
	| "createdAt";

export function VendorsPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Vendors">
				<VendorsDirectoryPage />
			</VendorCoreGate>
		);
	}
	return <VendorsDirectoryPage />;
}

function VendorsDirectoryPage() {
	const router = useRouter();
	const useLive = !isMockEnabled();
	const invalidate = useInvalidateVendorCore();
	const vendorsQ = useVendorCoreVendors();
	const connectionsQ = useVendorCoreConnections();
	const jobsQ = useVendorCoreJobs();
	const accountsQ = useVendorCoreAccounts();
	const filesQ = useVendorCoreInboundFiles();

	const directory = useMemo(() => {
		if (!useLive) return VENDOR_DIRECTORY;
		return liveVendorsToDirectoryRows(
			vendorsQ.data ?? [],
			connectionsQ.data ?? [],
			jobsQ.data ?? [],
			accountsQ.data ?? [],
			filesQ.data ?? []
		);
	}, [
		useLive,
		vendorsQ.data,
		connectionsQ.data,
		jobsQ.data,
		accountsQ.data,
		filesQ.data,
	]);

	const loading =
		useLive &&
		(vendorsQ.isLoading ||
			connectionsQ.isLoading ||
			jobsQ.isLoading ||
			accountsQ.isLoading);

	const liveError = useLive
		? vendorsQ.error?.message ||
			connectionsQ.error?.message ||
			jobsQ.error?.message ||
			accountsQ.error?.message
		: null;

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [vendorType, setVendorType] = useState("all");
	const [health, setHealth] = useState("all");
	const [activity, setActivity] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [sortKey, setSortKey] = useState<SortKey>(
		useLive ? "createdAt" : "name"
	);
	const [sortDir, setSortDir] = useState<"asc" | "desc">(
		useLive ? "desc" : "asc"
	);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const vendorTypes = useMemo(
		() =>
			Array.from(new Set(directory.map((row) => row.vendorType))).sort(),
		[directory]
	);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		let rows = directory.filter((row) => {
			if (status !== "all" && row.status !== status) return false;
			if (vendorType !== "all" && row.vendorType !== vendorType) return false;
			if (health !== "all" && row.health !== health) return false;
			if (activity === "today" && row.lastFileRelative !== "Today")
				return false;
			if (activity === "yesterday" && row.lastFileRelative !== "Yesterday")
				return false;
			if (
				activity === "older" &&
				(row.lastFileRelative === "Today" ||
					row.lastFileRelative === "Yesterday")
			)
				return false;
			if (!q) return true;
			return [row.name, row.vendorCode, row.vendorType]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});

		rows = [...rows].sort((a, b) => {
			const av = a[sortKey];
			const bv = b[sortKey];
			if (typeof av === "number" && typeof bv === "number") {
				return sortDir === "asc" ? av - bv : bv - av;
			}
			const as = String(av);
			const bs = String(bv);
			return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
		});
		return rows;
	}, [activity, directory, health, search, sortDir, sortKey, status, vendorType]);

	const summary = useMemo(() => summarizeVendorDirectory(filtered), [filtered]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = filtered.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize
	);

	const allPageSelected =
		pageRows.length > 0 && pageRows.every((row) => selectedIds.has(row.id));

	function toggleAllPage() {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (allPageSelected) {
				for (const row of pageRows) next.delete(row.id);
			} else {
				for (const row of pageRows) next.add(row.id);
			}
			return next;
		});
	}

	function toggleOne(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function clearFilters() {
		setSearch("");
		setStatus("all");
		setVendorType("all");
		setHealth("all");
		setActivity("all");
		setPage(1);
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
	}

	function SortableHead({
		label,
		column,
		className,
	}: {
		label: string;
		column: SortKey;
		className?: string;
	}) {
		return (
			<TableHead className={cn("h-8 px-2 font-normal", className)}>
				<button
					type="button"
					className="inline-flex items-center gap-1 hover:text-foreground"
					onClick={() => toggleSort(column)}
				>
					{label}
					<ArrowDownUp className="size-3 text-muted-foreground" />
				</button>
			</TableHead>
		);
	}

	const kpis = [
		{
			label: "Total Vendors",
			value: summary.total,
			trend: "↗ 2 vs last 30 days",
			trendTone: "text-primary",
			icon: Users,
			tone: "text-primary bg-primary/10",
		},
		{
			label: "Active",
			value: summary.active,
			trend: "↗ 1 vs last 30 days",
			trendTone: "text-primary",
			icon: CheckCircle2,
			tone: "text-emerald-700 bg-emerald-500/10",
		},
		{
			label: "At Risk",
			value: summary.atRisk,
			trend: "— No change",
			trendTone: "text-muted-foreground",
			icon: AlertTriangle,
			tone: "text-amber-700 bg-amber-500/10",
		},
		{
			label: "Inactive",
			value: summary.inactive,
			trend: "↗ 1 vs last 30 days",
			trendTone: "text-primary",
			icon: Ban,
			tone: "text-zinc-700 bg-zinc-500/10",
		},
		{
			label: "Vendors with Alerts",
			value: summary.withAlerts,
			trend: "↗ 1 vs last 30 days",
			trendTone: "text-primary",
			icon: Bell,
			tone: "text-red-700 bg-red-500/10",
		},
	];

	if (loading && !directory.length) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-20 rounded-lg" />
					))}
				</div>
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{liveError ? (
				<p className="text-sm text-destructive">{liveError}</p>
			) : null}
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
				<div className="min-w-0 space-y-1">
					<nav className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						<span>Vendor Management</span>
						<span className="text-border">/</span>
						<span className="text-foreground">Vendors</span>
					</nav>
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Vendors
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Manage trading partners, monitor vendor health, and access
						vendor-level operations.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button size="sm" className="h-9" asChild>
						<Link href="/admin/vendors/create">
							<Plus className="mr-1.5 size-3.5" />
							Add Vendor
						</Link>
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-9">
								<Download className="mr-1.5 size-3.5" />
								Export
								<ChevronDown className="ml-1.5 size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem>Export CSV</DropdownMenuItem>
							<DropdownMenuItem>Export Excel</DropdownMenuItem>
							<DropdownMenuItem>Export PDF</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-[240px] flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						placeholder="Search vendor name, ID, or contact"
						className="h-9 pl-8"
					/>
				</div>
				<Select
					value={status}
					onValueChange={(v) => {
						setStatus(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="h-9 w-[140px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="active">Active / Prospect</SelectItem>
						<SelectItem value="at_risk">At Risk</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={vendorType}
					onValueChange={(v) => {
						setVendorType(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="h-9 w-[160px]">
						<SelectValue placeholder="Vendor Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						{vendorTypes.map((t) => (
							<SelectItem key={t} value={t}>
								{t}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={health}
					onValueChange={(v) => {
						setHealth(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="h-9 w-[140px]">
						<SelectValue placeholder="Health" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Health</SelectItem>
						<SelectItem value="healthy">Healthy</SelectItem>
						<SelectItem value="warning">Warning</SelectItem>
						<SelectItem value="critical">Critical</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={activity}
					onValueChange={(v) => {
						setActivity(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="h-9 w-[170px]">
						<SelectValue placeholder="Last File Activity" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Activity</SelectItem>
						<SelectItem value="today">Today</SelectItem>
						<SelectItem value="yesterday">Yesterday</SelectItem>
						<SelectItem value="older">Older</SelectItem>
					</SelectContent>
				</Select>
				<div className="ml-auto flex gap-2">
					{useLive ? (
						<Button
							variant="outline"
							size="sm"
							className="h-9"
							onClick={() => void invalidate()}
						>
							<RefreshCw className="mr-1.5 size-3.5" />
							Refresh
						</Button>
					) : null}
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						onClick={clearFilters}
					>
						<RefreshCw className="mr-1.5 size-3.5" />
						Clear Filters
					</Button>
				</div>
			</div>

			{/* KPIs */}
			<SummaryCardsGrid>
				{kpis.map((k) => (
					<SummaryCard
						key={k.label}
						label={k.label}
						value={k.value}
						hint={k.trend}
						icon={k.icon}
						tone={k.tone}
						hintClassName={cn("font-medium", k.trendTone)}
					/>
				))}

				<div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						Health Distribution
					</p>
					<div className="mt-2 flex items-center gap-3">
						<ul className="min-w-0 flex-1 space-y-1.5 text-xs">
							{summary.healthPie.map((item) => (
								<li
									key={item.name}
									className="flex items-center justify-between gap-2"
								>
									<span className="flex items-center gap-1.5 font-medium">
										<span
											className="size-2 rounded-full"
											style={{ backgroundColor: item.color }}
										/>
										{item.name}
									</span>
									<span className="tabular-nums text-muted-foreground">
										{item.pct}%
									</span>
								</li>
							))}
						</ul>
						<div className="h-16 w-16 shrink-0">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={summary.healthPie.filter((d) => d.value > 0)}
										dataKey="value"
										nameKey="name"
										innerRadius={18}
										outerRadius={28}
										paddingAngle={2}
									>
										{summary.healthPie
											.filter((d) => d.value > 0)
											.map((entry) => (
												<Cell key={entry.name} fill={entry.color} />
											))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			</SummaryCardsGrid>

			{/* Vendor List */}
			<BulkActionsToolbar
				selectedCount={selectedIds.size}
				entityLabel="vendor"
				onClear={() => setSelectedIds(new Set())}
				onExport={() => {
					toast.success(`Exported ${selectedIds.size} vendor(s).`);
					setSelectedIds(new Set());
				}}
				onArchive={() => {
					toast.success(`Archived ${selectedIds.size} vendor(s).`);
					setSelectedIds(new Set());
				}}
			/>
			<Card className="min-w-0 bg-card">
				<CardHeader className="px-3 pb-1 pt-3">
					<CardTitle className="text-sm font-medium">Vendor List</CardTitle>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="w-full overflow-x-auto border-t border-border/50">
						<Table className="w-full min-w-[1100px] text-xs">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-8 w-10 px-2 pl-3">
										<Checkbox
											checked={allPageSelected}
											onCheckedChange={toggleAllPage}
											aria-label="Select all vendors on page"
										/>
									</TableHead>
									<SortableHead label="Vendor" column="name" />
									<SortableHead label="Vendor ID" column="vendorCode" />
									<SortableHead label="Vendor Type" column="vendorType" />
									<SortableHead label="Status" column="status" />
									<SortableHead
										label="Linked Accounts"
										column="linkedAccounts"
										className="text-right"
									/>
									<SortableHead
										label="Active Jobs"
										column="activeJobs"
										className="text-right"
									/>
									<SortableHead
										label="Last File Received"
										column="lastFileReceived"
									/>
									<SortableHead label="Health" column="health" />
									<TableHead className="h-8 px-3 pr-3 text-right font-normal">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => (
									<TableRow
										key={row.id}
										className="cursor-pointer hover:bg-muted/30"
										onClick={() => router.push(detailHref(row))}
									>
										<TableCell
											className="px-2 py-1.5 pl-3"
											onClick={(e) => e.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.has(row.id)}
												onCheckedChange={() => toggleOne(row.id)}
												aria-label={`Select ${row.name}`}
											/>
										</TableCell>
										<TableCell className="px-2 py-1.5">
											<div className="flex min-w-0 items-center gap-1.5">
												<span
													className={cn(
														"inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
														row.avatarBg
													)}
												>
													{row.mark}
												</span>
												<span className="truncate font-medium">{row.name}</span>
											</div>
										</TableCell>
										<TableCell className="px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
											{row.vendorCode}
										</TableCell>
										<TableCell className="px-2 py-1.5">
											{row.vendorType}
										</TableCell>
										<TableCell className="px-2 py-1.5">
											<StatusPill status={row.status} />
										</TableCell>
										<TableCell className="px-2 py-1.5 text-right tabular-nums">
											{row.linkedAccounts}
										</TableCell>
										<TableCell className="px-2 py-1.5 text-right tabular-nums">
											{row.activeJobs}
										</TableCell>
										<TableCell className="px-2 py-1.5">
											<div className="leading-tight">
												<p>{row.lastFileReceived}</p>
												<p className="text-[10px] text-muted-foreground">
													({row.lastFileRelative})
												</p>
											</div>
										</TableCell>
										<TableCell className="px-2 py-1.5">
											<HealthDot health={row.health} />
										</TableCell>
										<TableCell
											className="px-2 py-1.5 pr-3 text-right"
											onClick={(e) => e.stopPropagation()}
										>
											<div className="inline-flex items-center gap-0.5">
												<Button
													variant="link"
													size="sm"
													className="h-7 px-1.5 text-xs text-primary"
													asChild
												>
													<Link href={detailHref(row)}>
														View Vendor
														<ExternalLink className="ml-1 size-3" />
													</Link>
												</Button>
												<VendorActionsMenu
													vendor={{
														id: row.id,
														name: row.name,
														legalName: row.name,
														status:
															row.status === "inactive"
																? "suspended"
																: row.status === "at_risk"
																	? "onboarding"
																	: "active",
													}}
													redirectOnDelete={undefined}
													trigger={
														<Button
															variant="ghost"
															size="icon"
															className="size-7"
														>
															<MoreVertical className="size-3.5" />
														</Button>
													}
													extraItems={
														<>
															<DropdownMenuItem asChild>
																<Link href="/admin/file-monitoring">
																	View file activity
																</Link>
															</DropdownMenuItem>
															<DropdownMenuItem asChild>
																<Link href="/admin/schedules">
																	View schedules
																</Link>
															</DropdownMenuItem>
														</>
													}
												/>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
						<span>
							Showing{" "}
							{filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to{" "}
							{Math.min(safePage * pageSize, filtered.length)} of{" "}
							{filtered.length} vendors
						</span>
						<div className="flex flex-wrap items-center gap-2">
							<Select
								value={String(pageSize)}
								onValueChange={(v) => {
									setPageSize(Number(v));
									setPage(1);
								}}
							>
								<SelectTrigger className="h-8 w-[120px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="7">7 per page</SelectItem>
									<SelectItem value="10">10 per page</SelectItem>
									<SelectItem value="25">25 per page</SelectItem>
								</SelectContent>
							</Select>
							<div className="flex items-center gap-1">
								<Button
									variant="outline"
									size="icon"
									className="size-8"
									disabled={safePage <= 1}
									onClick={() => setPage(1)}
								>
									<ChevronsLeft className="size-3.5" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="size-8"
									disabled={safePage <= 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
								>
									<ChevronLeft className="size-3.5" />
								</Button>
								{Array.from({ length: Math.min(pageCount, 3) }, (_, i) => {
									const n = i + 1;
									return (
										<Button
											key={n}
											variant={safePage === n ? "default" : "outline"}
											size="icon"
											className="size-8"
											onClick={() => setPage(n)}
										>
											{n}
										</Button>
									);
								})}
								<Button
									variant="outline"
									size="icon"
									className="size-8"
									disabled={safePage >= pageCount}
									onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
								>
									<ChevronRight className="size-3.5" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="size-8"
									disabled={safePage >= pageCount}
									onClick={() => setPage(pageCount)}
								>
									<ChevronsRight className="size-3.5" />
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

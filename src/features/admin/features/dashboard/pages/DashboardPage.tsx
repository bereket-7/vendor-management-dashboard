"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	Calendar,
	CheckCircle2,
	Clock3,
	FileText,
	Info,
	LayoutGrid,
	MoreHorizontal,
	Plus,
	RefreshCw,
	ScrollText,
	Upload,
	XCircle,
} from "lucide-react";
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { FILE_RUNS } from "@/features/admin/features/file-management/mock-data";
import { inboundFilesToRuns } from "@/features/admin/features/dashboard/live-file-runs";
import { VendorAvatarBadge } from "@/features/admin/features/file-management/vendor-avatars";
import {
	PROCESSING_TREND,
	VENDOR_ALERTS,
	getVendorIntegration,
	runBucket,
	summarizeRuns,
	vendorIdForRun,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { useVendorsList } from "@/features/shared/vms/queries";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import {
	useInvalidateVendorCore,
	useVendorCoreInboundFiles,
} from "@/lib/vendor-core/hooks";
import { useAdminModuleStore } from "@/stores/admin-module-store";
import {
	DASHBOARD_WIDGET_LABELS,
	type DashboardWidgetId,
	useDashboardWidgetsStore,
} from "@/stores/dashboard-widgets-store";

function ActivityStatus({
	status,
}: {
	status: (typeof FILE_RUNS)[0]["status"];
}) {
	const bucket = runBucket(status);
	if (bucket === "success") {
		return (
			<span className="inline-flex items-center rounded-md border border-transparent bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
				Success
			</span>
		);
	}
	if (bucket === "failed") {
		return (
			<span className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-1.5 py-0 text-[10px] font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
				Failed
			</span>
		);
	}
	if (bucket === "warning") {
		return (
			<span className="inline-flex items-center rounded-md border border-transparent bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
				Warning
			</span>
		);
	}
	if (bucket === "in_progress") {
		return (
			<span className="inline-flex items-center rounded-md border border-transparent bg-sky-100 px-1.5 py-0 text-[10px] font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-200">
				In Progress
			</span>
		);
	}
	return <StatusBadge status={status} />;
}

export function DashboardPage() {
	const router = useRouter();
	const { vendors, isLoading, error, refetch } = useVendorsList();
	const live = !isMockEnabled();
	const filesQ = useVendorCoreInboundFiles();
	const invalidateVendorCore = useInvalidateVendorCore();
	const { enabledWidgets, toggleWidget, resetWidgets, isEnabled } =
		useDashboardWidgetsStore();
	const [dateFilter, setDateFilter] = useState("today");
	const [vendorFilter, setVendorFilter] = useState("all");
	const [ediTypeFilter, setEdiTypeFilter] = useState("all");
	const [refreshing, setRefreshing] = useState(false);
	const [trendRange, setTrendRange] = useState("7");
	const lastUpdated = "9:28 AM";
	const programFilter = useAdminModuleStore((s) => s.fileType);

	const nameById = useMemo(
		() => new Map(vendors.map((v) => [v.id, v.legalName])),
		[vendors]
	);

	const allRuns = useMemo(() => {
		// No mock FILE_RUNS when USE_MOCK=false — remote inbound files only
		if (live) {
			return inboundFilesToRuns(filesQ.data ?? [], nameById);
		}
		return FILE_RUNS;
	}, [live, filesQ.data, nameById]);

	const filteredRuns = useMemo(() => {
		return allRuns.filter((run) => {
			if (!live && run.program !== programFilter) return false;
			if (vendorFilter !== "all") {
				if (live) {
					const selected = vendors.find((v) => v.id === vendorFilter);
					if (selected && run.vendor !== selected.legalName) return false;
				} else {
					const vid = vendorIdForRun(run);
					if (vid !== vendorFilter) return false;
				}
			}
			if (ediTypeFilter !== "all" && run.fileType !== ediTypeFilter)
				return false;
			return true;
		});
	}, [allRuns, vendorFilter, ediTypeFilter, programFilter, live, vendors]);

	const summary = useMemo(() => summarizeRuns(filteredRuns), [filteredRuns]);

	const fileTypes = useMemo(
		() =>
			Array.from(
				new Set(
					allRuns
						.filter((r) => live || r.program === programFilter)
						.map((r) => r.fileType)
				)
			).sort(),
		[allRuns, programFilter, live]
	);

	const vendorStatusPie = useMemo(() => {
		const counts = { healthy: 0, warning: 0, failed: 0, in_progress: 0 };
		for (const v of vendors) {
			const health = getVendorIntegration(v.id).health;
			counts[health] += 1;
		}
		const total = vendors.length || 1;
		return [
			{
				name: "Healthy",
				value: counts.healthy,
				pct: Math.round((counts.healthy / total) * 100),
				color: "#059669",
			},
			{
				name: "Warning",
				value: counts.warning,
				pct: Math.round((counts.warning / total) * 100),
				color: "#d97706",
			},
			{
				name: "Failed",
				value: counts.failed,
				pct: Math.round((counts.failed / total) * 100),
				color: "#dc2626",
			},
			{
				name: "In Progress",
				value: counts.in_progress,
				pct: Math.round((counts.in_progress / total) * 100),
				color: "#0284c7",
			},
		];
	}, [vendors]);

	async function handleRefresh() {
		setRefreshing(true);
		try {
			await Promise.all([refetch(), invalidateVendorCore()]);
		} finally {
			setRefreshing(false);
		}
	}

	if (isLoading || (live && filesQ.isLoading && !filesQ.data)) {
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

	const kpis = [
		{
			label: "Total Files",
			value: String(summary.total),
			pct: null as string | null,
			hint: `Expected: ${summary.expected}`,
			icon: FileText,
			tone: "text-primary bg-primary/10",
		},
		{
			label: "Successful",
			value: String(summary.successful),
			pct: `${summary.successPct}%`,
			hint: "View Details →",
			icon: CheckCircle2,
			tone: "text-emerald-700 bg-emerald-500/10",
		},
		{
			label: "Warnings",
			value: String(summary.warnings),
			pct: `${summary.warningPct}%`,
			hint: "View Details →",
			icon: AlertTriangle,
			tone: "text-amber-700 bg-amber-500/10",
		},
		{
			label: "Failed",
			value: String(summary.failed),
			pct: `${summary.failedPct}%`,
			hint: "View Details →",
			icon: XCircle,
			tone: "text-red-700 bg-red-500/10",
		},
		{
			label: "In Progress",
			value: String(summary.inProgress),
			pct: null as string | null,
			hint: "View Details →",
			icon: Clock3,
			tone: "text-violet-700 bg-violet-500/10",
		},
		{
			label: "Pending",
			value: String(summary.pending),
			pct: null as string | null,
			hint: "View Details →",
			icon: Calendar,
			tone: "text-zinc-700 bg-zinc-500/10",
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Dashboard
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Monitor vendor file exchanges, health, and alerts across trading
						partners.
					</p>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="h-9">
							<LayoutGrid className="mr-1.5 size-3.5" />
							Customize
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>Dashboard widgets</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{(Object.keys(DASHBOARD_WIDGET_LABELS) as DashboardWidgetId[]).map(
							(id) => (
								<DropdownMenuCheckboxItem
									key={id}
									checked={enabledWidgets.includes(id)}
									onCheckedChange={() => toggleWidget(id)}
								>
									{DASHBOARD_WIDGET_LABELS[id]}
								</DropdownMenuCheckboxItem>
							)
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={resetWidgets}>
							Reset to default
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{error ? (
				<p className="text-sm text-destructive">{error.message}</p>
			) : null}

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<Select value={dateFilter} onValueChange={setDateFilter}>
					<SelectTrigger className="h-9 w-[200px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="today">Today (Jul 28, 2026)</SelectItem>
						<SelectItem value="7">Last 7 Days</SelectItem>
						<SelectItem value="30">Last 30 Days</SelectItem>
					</SelectContent>
				</Select>
				<Select value={vendorFilter} onValueChange={setVendorFilter}>
					<SelectTrigger className="h-9 w-[200px]">
						<SelectValue placeholder="All Vendors" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Vendors</SelectItem>
						{vendors.map((v) => (
							<SelectItem key={v.id} value={v.id}>
								{v.tradeName ?? v.legalName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={ediTypeFilter} onValueChange={setEdiTypeFilter}>
					<SelectTrigger className="h-9 w-[200px]">
						<SelectValue placeholder="All EDI Types" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All EDI Types</SelectItem>
						{fileTypes.map((t) => (
							<SelectItem key={t} value={t}>
								{t}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="ml-auto flex items-center gap-2">
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
					<span className="text-xs text-muted-foreground">
						Last updated: {lastUpdated}
					</span>
				</div>
			</div>

			{/* KPI cards */}
			{isEnabled("kpis") ? (
				<SummaryCardsGrid>
					{kpis.map((k) => {
						const Icon = k.icon;
						return (
							<SummaryCard
								key={k.label}
								label={k.label}
								value={
									<>
										{k.value}
										{k.pct ? (
											<span className="ml-1 text-sm font-medium text-muted-foreground">
												({k.pct})
											</span>
										) : null}
									</>
								}
								hint={k.hint}
								icon={Icon}
								tone={k.tone}
								hintClassName={
									k.label === "Total Files"
										? undefined
										: "font-medium text-primary"
								}
							/>
						);
					})}
				</SummaryCardsGrid>
			) : null}

			{/* Main + right column — 2/3 table, 1/3 sidebar */}
			<div className="grid min-w-0 gap-2 xl:grid-cols-3">
				<div className="min-w-0 space-y-2 xl:col-span-2">
					{/* Recent File Activity */}
					{isEnabled("recentActivity") ? (
						<Card className="min-w-0 bg-card">
							<CardHeader className="px-3 pb-1 pt-3">
								<CardTitle className="text-sm font-medium">
									Recent File Activity
								</CardTitle>
							</CardHeader>
							<CardContent className="px-0 pb-0">
								<ScrollArea className="w-full border-t border-border/50">
									<div className="min-w-[920px]">
										<Table className="w-full text-xs">
											<TableHeader>
												<TableRow className="hover:bg-transparent">
													<TableHead className="h-8 w-[17%] px-2 pl-3 font-normal">
														Vendor
													</TableHead>
													<TableHead className="h-8 w-[11%] px-1 font-normal">
														Type
													</TableHead>
													<TableHead className="h-8 w-[18%] px-1 font-normal">
														File Name
													</TableHead>
													<TableHead className="h-8 w-[8%] px-1 font-normal">
														Freq
													</TableHead>
													<TableHead className="h-8 w-[11%] px-1 font-normal">
														Status
													</TableHead>
													<TableHead className="h-8 w-[7%] px-1 text-right font-normal">
														Rec
													</TableHead>
													<TableHead className="h-8 w-[7%] px-1 font-normal">
														Recv
													</TableHead>
													<TableHead className="h-8 w-[7%] px-1 font-normal">
														Proc
													</TableHead>
													<TableHead className="h-8 w-[7%] px-1 font-normal">
														Dur
													</TableHead>
													<TableHead className="h-8 w-[7%] px-1 pr-3 text-right font-normal">
														Act
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredRuns.slice(0, 8).map((run) => {
													const vid = vendorIdForRun(run);
													return (
														<TableRow
															key={run.id}
															className="cursor-pointer hover:bg-muted/30"
															onClick={() =>
																router.push(
																	vid
																		? `/admin/vendors/${vid}`
																		: "/admin/vendors"
																)
															}
														>
															<TableCell className="px-2 py-1.5 pl-3">
																<div className="flex min-w-0 items-center gap-1.5">
																	<VendorAvatarBadge
																		vendorId={vid}
																		vendorName={run.vendor}
																		size="sm"
																	/>
																	{vid ? (
																		<Link
																			href={`/admin/vendors/${vid}`}
																			className="truncate font-medium hover:underline"
																			onClick={(e) => e.stopPropagation()}
																		>
																			{run.vendor}
																		</Link>
																	) : (
																		<span className="truncate font-medium">
																			{run.vendor}
																		</span>
																	)}
																</div>
															</TableCell>
															<TableCell className="truncate px-1 py-1.5">
																{run.fileType}
															</TableCell>
															<TableCell className="truncate px-1 py-1.5 font-mono text-[10px]">
																{run.fileName ?? "—"}
															</TableCell>
															<TableCell className="truncate px-1 py-1.5 text-muted-foreground">
																{run.frequency}
															</TableCell>
															<TableCell className="px-1 py-1.5">
																<ActivityStatus status={run.status} />
															</TableCell>
															<TableCell className="px-1 py-1.5 text-right tabular-nums">
																{run.records ?? "—"}
															</TableCell>
															<TableCell className="px-1 py-1.5 tabular-nums text-muted-foreground">
																{run.receivedAt?.slice(11, 16) ?? "—"}
															</TableCell>
															<TableCell className="px-1 py-1.5 tabular-nums text-muted-foreground">
																{run.completedAt?.slice(11, 16) ?? "—"}
															</TableCell>
															<TableCell className="px-1 py-1.5 tabular-nums text-muted-foreground">
																{run.duration ?? "—"}
															</TableCell>
															<TableCell
																className="px-1 py-1.5 pr-3 text-right"
																onClick={(e) => e.stopPropagation()}
															>
																<DropdownMenu>
																	<DropdownMenuTrigger asChild>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="size-7"
																		>
																			<MoreHorizontal className="size-3.5" />
																		</Button>
																	</DropdownMenuTrigger>
																	<DropdownMenuContent align="end">
																		<DropdownMenuItem asChild>
																			<Link
																				href={`/admin/file-monitoring/${run.id}`}
																			>
																				View run detail
																			</Link>
																		</DropdownMenuItem>
																		{vid ? (
																			<DropdownMenuItem asChild>
																				<Link href={`/admin/vendors/${vid}`}>
																					Open vendor
																				</Link>
																			</DropdownMenuItem>
																		) : null}
																	</DropdownMenuContent>
																</DropdownMenu>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</div>
								</ScrollArea>
								<div className="border-t border-border/50 px-3 py-2">
									<Link
										href="/admin/file-monitoring"
										className="text-sm font-medium text-primary hover:underline"
									>
										View All File Activity →
									</Link>
								</div>
							</CardContent>
						</Card>
					) : null}

					{/* Processing Trend */}
					{isEnabled("processingTrend") ? (
						<Card className="bg-card">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div>
									<CardTitle className="text-sm font-medium">
										Processing Trend
									</CardTitle>
								</div>
								<Select value={trendRange} onValueChange={setTrendRange}>
									<SelectTrigger className="h-8 w-[130px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="7">Last 7 Days</SelectItem>
										<SelectItem value="14">Last 14 Days</SelectItem>
										<SelectItem value="30">Last 30 Days</SelectItem>
									</SelectContent>
								</Select>
							</CardHeader>
							<CardContent className="h-64 pt-2">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={PROCESSING_TREND}>
										<CartesianGrid
											strokeDasharray="3 3"
											className="stroke-border"
										/>
										<XAxis dataKey="day" tick={{ fontSize: 11 }} />
										<YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
										<Tooltip />
										<Legend />
										<Line
											type="monotone"
											dataKey="successful"
											name="Successful"
											stroke="#059669"
											strokeWidth={2}
											dot={false}
										/>
										<Line
											type="monotone"
											dataKey="warnings"
											name="Warnings"
											stroke="#d97706"
											strokeWidth={2}
											dot={false}
										/>
										<Line
											type="monotone"
											dataKey="failed"
											name="Failed"
											stroke="#dc2626"
											strokeWidth={2}
											dot={false}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					) : null}
				</div>

				{/* Right column — 1/3 */}
				<div className="min-w-0 space-y-2 xl:col-span-1">
					{isEnabled("vendorStatus") ? (
						<Card className="bg-card">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">
									Vendor Status Overview
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-3">
									<div className="relative h-32 w-32 shrink-0">
										<ResponsiveContainer width="100%" height="100%">
											<PieChart>
												<Pie
													data={vendorStatusPie}
													dataKey="value"
													nameKey="name"
													innerRadius={38}
													outerRadius={58}
													paddingAngle={2}
												>
													{vendorStatusPie.map((entry) => (
														<Cell key={entry.name} fill={entry.color} />
													))}
												</Pie>
												<Tooltip />
											</PieChart>
										</ResponsiveContainer>
										<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
											<span className="text-base font-medium tabular-nums leading-none">
												{vendors.length}
											</span>
											<span className="mt-1 text-[10px] font-medium text-muted-foreground">
												Vendors
											</span>
										</div>
									</div>
									<ul className="min-w-0 flex-1 space-y-2.5">
										{vendorStatusPie.map((item) => (
											<li
												key={item.name}
												className="flex items-center justify-between gap-3 text-sm"
											>
												<span className="flex min-w-0 items-center gap-2">
													<span
														className="size-2.5 shrink-0 rounded-full"
														style={{ backgroundColor: item.color }}
													/>
													<span className="truncate font-medium">
														{item.name}
													</span>
												</span>
												<span className="shrink-0 tabular-nums">
													{item.value}{" "}
													<span className="text-xs text-muted-foreground">
														({item.pct}%)
													</span>
												</span>
											</li>
										))}
									</ul>
								</div>
								<div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
									<span>All vendors</span>
									<span>Last 24 hours</span>
								</div>
							</CardContent>
						</Card>
					) : null}

					{isEnabled("alerts") ? (
						<Card className="bg-card">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Alerts</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{VENDOR_ALERTS.slice(0, 5).map((alert) => (
									<Link
										key={alert.id}
										href={
											alert.runId
												? `/admin/file-monitoring/${alert.runId}`
												: `/admin/vendors/${alert.vendorId}`
										}
										className={cn(
											"flex items-start gap-2.5 rounded-lg border p-3 transition-colors",
											alert.severity === "error" &&
												"border-red-200 bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/30",
											alert.severity === "warning" &&
												"border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/30",
											alert.severity !== "error" &&
												alert.severity !== "warning" &&
												"border-sky-200 bg-sky-50 hover:border-sky-300 dark:border-sky-900/50 dark:bg-sky-950/30"
										)}
									>
										{alert.severity === "error" ? (
											<XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
										) : alert.severity === "warning" ? (
											<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
										) : (
											<Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
										)}
										<div className="min-w-0 flex-1">
											<p className="text-sm font-medium leading-snug">
												{alert.title}
											</p>
											<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
												{alert.vendorName}
											</p>
											<p className="mt-1 text-[11px] text-muted-foreground">
												{alert.when}
											</p>
										</div>
									</Link>
								))}
								<Link
									href="/admin/file-monitoring"
									className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
								>
									View All Alerts →
								</Link>
							</CardContent>
						</Card>
					) : null}

					{isEnabled("quickActions") ? (
						<Card className="bg-card">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">
									Quick Actions
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
									{[
										{
											label: "Add Vendor",
											href: "/admin/vendors/create",
											icon: Plus,
										},
										{
											label: "Upload File",
											href: "/admin/file-monitoring",
											icon: Upload,
										},
										{
											label: "View Schedules",
											href: "/admin/schedules",
											icon: Calendar,
										},
										{
											label: "Vendor Reports",
											href: "/admin/reports",
											icon: FileText,
										},
										{
											label: "Audit Trail",
											href: "/admin/audit-trail",
											icon: ScrollText,
										},
									].map((action) => {
										const Icon = action.icon;
										return (
											<Button
												key={action.label}
												variant="outline"
												className="h-auto flex-col gap-1.5 px-2 py-3 text-xs"
												asChild
											>
												<Link href={action.href}>
													<Icon className="size-4 text-primary" />
													{action.label}
												</Link>
											</Button>
										);
									})}
								</div>
							</CardContent>
						</Card>
					) : null}

					{isEnabled("expiringDocs") ? (
						<Card className="bg-card">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">
									Expiring documents
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-xs">
								<p className="text-muted-foreground">
									Track certifications and insurance nearing expiry.
								</p>
								<Button
									variant="outline"
									size="sm"
									className="h-8 w-full"
									asChild
								>
									<Link href="/admin/documents">Open documents</Link>
								</Button>
							</CardContent>
						</Card>
					) : null}

					{isEnabled("activityFeed") ? (
						<Card className="bg-card">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">
									Activity feed
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-xs">
								<p className="text-muted-foreground">
									Live operational events across file runs and alerts.
								</p>
								<Button
									variant="outline"
									size="sm"
									className="h-8 w-full"
									asChild
								>
									<Link href="/admin/activity">Open command center</Link>
								</Button>
							</CardContent>
						</Card>
					) : null}
				</div>
			</div>
		</div>
	);
}

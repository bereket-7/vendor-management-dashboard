"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	CheckCircle2,
	Clock3,
	Download,
	Filter,
	PieChart as PieChartIcon,
	RefreshCw,
	Search,
	TrendingUp,
	XCircle,
} from "lucide-react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
	FILE_RUNS,
	displayRunStatus,
} from "@/features/admin/features/file-management/mock-data";
import { ProcessingStatusLivePage } from "@/features/admin/features/processing-status/pages/ProcessingStatusLivePage";
import {
	PROCESSING_TREND,
	VENDOR_ALERTS,
	VENDOR_TREND_BY_ID,
	getVendorIntegration,
	runBucket,
	vendorIdForRun,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { isVendorCoreLive } from "@/lib/vendor-core";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const STATUS_COLORS = {
	success: "#10b981",
	warning: "#f59e0b",
	failed: "#ef4444",
	in_progress: "#8b5cf6",
	pending: "#94a3b8",
} as const;

export function ProcessingStatusPage() {
	if (isVendorCoreLive()) return <ProcessingStatusLivePage />;
	return <ProcessingStatusMockPage />;
}

function ProcessingStatusMockPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [search, setSearch] = useState("");
	const [vendorFilter, setVendorFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [directionFilter, setDirectionFilter] = useState("all");
	const [ediTypeFilter, setEdiTypeFilter] = useState("all");

	const programRuns = useMemo(
		() => FILE_RUNS.filter((run) => run.program === programFilter),
		[programFilter]
	);

	const vendors = useMemo(
		() =>
			Array.from(
				new Map(
					programRuns.map((run) => [
						vendorIdForRun(run) ?? run.vendor,
						{
							id: vendorIdForRun(run) ?? run.vendor,
							name: run.vendor,
						},
					])
				).values()
			),
		[programRuns]
	);

	const fileTypes = useMemo(
		() => Array.from(new Set(programRuns.map((run) => run.fileType))).sort(),
		[programRuns]
	);

	const filteredRuns = useMemo(
		() =>
			programRuns.filter((run) => {
				const id = vendorIdForRun(run) ?? run.vendor;
				if (vendorFilter !== "all" && id !== vendorFilter) return false;
				if (statusFilter !== "all" && run.status !== statusFilter) return false;
				if (directionFilter !== "all" && run.direction !== directionFilter)
					return false;
				if (ediTypeFilter !== "all" && run.fileType !== ediTypeFilter)
					return false;
				if (!search.trim()) return true;
				return [run.vendor, run.fileType, run.fileName, run.runId]
					.join(" ")
					.toLowerCase()
					.includes(search.trim().toLowerCase());
			}),
		[
			directionFilter,
			ediTypeFilter,
			programRuns,
			search,
			statusFilter,
			vendorFilter,
		]
	);

	const summary = useMemo(() => {
		const successful = filteredRuns.filter(
			(run) => runBucket(run.status) === "success"
		).length;
		const warnings = filteredRuns.filter(
			(run) => runBucket(run.status) === "warning"
		).length;
		const failed = filteredRuns.filter(
			(run) => runBucket(run.status) === "failed"
		).length;
		const inProgress = filteredRuns.filter(
			(run) => runBucket(run.status) === "in_progress"
		).length;
		const pending = filteredRuns.filter(
			(run) => runBucket(run.status) === "pending"
		).length;
		const avgLatency = filteredRuns.length
			? Math.round(
					filteredRuns.reduce(
						(sum, run) => sum + (run.latencyMinutes ?? 0),
						0
					) / filteredRuns.length
				)
			: 0;
		return {
			successful,
			warnings,
			failed,
			inProgress,
			pending,
			total: filteredRuns.length,
			avgLatency,
		};
	}, [filteredRuns]);

	const pieData = [
		{
			name: "Successful",
			value: summary.successful,
			color: STATUS_COLORS.success,
		},
		{ name: "Warnings", value: summary.warnings, color: STATUS_COLORS.warning },
		{ name: "Failed", value: summary.failed, color: STATUS_COLORS.failed },
		{
			name: "In Progress",
			value: summary.inProgress,
			color: STATUS_COLORS.in_progress,
		},
	].filter((item) => item.value > 0);

	const trendData = useMemo(() => {
		if (vendorFilter !== "all" && VENDOR_TREND_BY_ID[vendorFilter]) {
			return VENDOR_TREND_BY_ID[vendorFilter];
		}
		return PROCESSING_TREND;
	}, [vendorFilter]);

	const attentionRuns = useMemo(
		() =>
			filteredRuns
				.filter((run) => runBucket(run.status) !== "success")
				.sort((a, b) => (b.latencyMinutes ?? 0) - (a.latencyMinutes ?? 0))
				.slice(0, 8),
		[filteredRuns]
	);

	const alerts = useMemo(
		() =>
			VENDOR_ALERTS.filter(
				(alert) => vendorFilter === "all" || alert.vendorId === vendorFilter
			).slice(0, 5),
		[vendorFilter]
	);

	const vendorHealth = useMemo(
		() =>
			vendors
				.map((vendor) => {
					const vendorRuns = programRuns.filter(
						(run) => (vendorIdForRun(run) ?? run.vendor) === vendor.id
					);
					const successful = vendorRuns.filter(
						(run) => runBucket(run.status) === "success"
					).length;
					const warnings = vendorRuns.filter(
						(run) => runBucket(run.status) === "warning"
					).length;
					const failed = vendorRuns.filter(
						(run) => runBucket(run.status) === "failed"
					).length;
					const healthScore = vendorRuns.length
						? Math.round((successful / vendorRuns.length) * 100)
						: 0;
					const integration = vendor.id.startsWith("vnd-")
						? getVendorIntegration(vendor.id)
						: null;
					return {
						...vendor,
						expected: vendorRuns.length,
						successful,
						warnings,
						failed,
						alerts: alerts.filter((alert) => alert.vendorId === vendor.id)
							.length,
						healthScore,
						vendorType: integration?.vendorType ?? "Connected Vendor",
					};
				})
				.filter((row) => vendorFilter === "all" || row.id === vendorFilter),
		[alerts, programRuns, vendorFilter, vendors]
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Processing Status Dashboard
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Track processing throughput, vendor health, and exception patterns.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild size="sm" className="h-9">
						<Link href="/admin/processing-logs">View processing logs</Link>
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<RefreshCw className="mr-1.5 size-3.5" />
						Refresh
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Export dashboard
					</Button>
				</div>
			</div>

			<Card className="gap-0 border border-primary/15 bg-gradient-to-r from-primary/[0.05] via-card to-sky-50/60 py-0">
				<CardContent className="flex flex-wrap items-center gap-3 px-4 py-3">
					<div className="flex items-center gap-2 text-sm font-medium">
						<Filter className="size-4 text-primary" />
						Filters
					</div>
					<div className="relative min-w-[220px] flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Vendor, file, run ID..."
							className="h-9 bg-background/70 pl-8"
						/>
					</div>
					<Select value={vendorFilter} onValueChange={setVendorFilter}>
						<SelectTrigger className="h-9 w-[220px] bg-background/70">
							<SelectValue placeholder="All Vendors" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Vendors</SelectItem>
							{vendors.map((vendor) => (
								<SelectItem key={vendor.id} value={vendor.id}>
									{vendor.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={ediTypeFilter} onValueChange={setEdiTypeFilter}>
						<SelectTrigger className="h-9 w-[180px] bg-background/70">
							<SelectValue placeholder="All EDI Types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All EDI Types</SelectItem>
							{fileTypes.map((fileType) => (
								<SelectItem key={fileType} value={fileType}>
									{fileType}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={directionFilter} onValueChange={setDirectionFilter}>
						<SelectTrigger className="h-9 w-[140px] bg-background/70">
							<SelectValue placeholder="Direction" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="inbound">Inbound</SelectItem>
							<SelectItem value="outbound">Outbound</SelectItem>
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="h-9 w-[160px] bg-background/70">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="success">Success</SelectItem>
							<SelectItem value="warning">Warning</SelectItem>
							<SelectItem value="late">Late</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
							<SelectItem value="processing">Processing</SelectItem>
							<SelectItem value="missing">Missing</SelectItem>
						</SelectContent>
					</Select>
					<div className="text-xs text-muted-foreground">
						Showing {summary.total} tracked runs in the current monitoring
						window.
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{[
					{
						label: "Successful",
						value: summary.successful,
						hint: "Completed cleanly",
						icon: CheckCircle2,
						tone: "text-emerald-700 bg-emerald-500/10",
					},
					{
						label: "Warnings",
						value: summary.warnings,
						hint: "Needs review",
						icon: AlertTriangle,
						tone: "text-amber-700 bg-amber-500/10",
					},
					{
						label: "Failed",
						value: summary.failed,
						hint: "Stopped early",
						icon: XCircle,
						tone: "text-red-700 bg-red-500/10",
					},
					{
						label: "In Progress",
						value: summary.inProgress,
						hint: "Still running",
						icon: Clock3,
						tone: "text-violet-700 bg-violet-500/10",
					},
					{
						label: "Avg. Latency",
						value: `${summary.avgLatency} min`,
						hint: "Average delay",
						icon: TrendingUp,
						tone: "text-sky-700 bg-sky-500/10",
					},
				].map((item) => {
					const Icon = item.icon;
					return (
						<div
							key={item.label}
							className="rounded-xl border border-border/50 bg-card/70 p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{item.label}
									</p>
									<p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
										{item.value}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{item.hint}
									</p>
								</div>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg",
										item.tone
									)}
								>
									<Icon className="size-4" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid gap-4 xl:grid-cols-12">
				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-5">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="flex items-center gap-2 text-base">
							<PieChartIcon className="size-4 text-primary" />
							Exception trend
						</CardTitle>
					</CardHeader>
					<CardContent className="h-72 px-4 pt-2">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={trendData}>
								<defs>
									<linearGradient
										id="processing-success"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
										<stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
									</linearGradient>
									<linearGradient
										id="processing-warning"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
									</linearGradient>
									<linearGradient
										id="processing-failed"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border/50"
								/>
								<XAxis
									dataKey="day"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									allowDecimals={false}
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip />
								<Area
									type="monotone"
									dataKey="successful"
									stroke="#10b981"
									strokeWidth={2.5}
									fill="url(#processing-success)"
									fillOpacity={1}
								/>
								<Area
									type="monotone"
									dataKey="warnings"
									stroke="#f59e0b"
									strokeWidth={2.5}
									fill="url(#processing-warning)"
									fillOpacity={1}
								/>
								<Area
									type="monotone"
									dataKey="failed"
									stroke="#ef4444"
									strokeWidth={2.5}
									fill="url(#processing-failed)"
									fillOpacity={1}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-7">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">
							Vendor processing health
						</CardTitle>
					</CardHeader>
					<CardContent className="px-0 pb-0">
						<div className="border-t border-border/50">
							<Table className="table-fixed w-full">
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="w-[32%] pl-4 sm:pl-6">
											Vendor
										</TableHead>
										<TableHead className="w-[10%] text-right">Exp</TableHead>
										<TableHead className="w-[10%] text-right">Ok</TableHead>
										<TableHead className="w-[10%] text-right">Warn</TableHead>
										<TableHead className="w-[10%] text-right">Fail</TableHead>
										<TableHead className="w-[28%] pr-4 sm:pr-6">
											Health
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{vendorHealth.map((row) => (
										<TableRow key={row.id} className="hover:bg-muted/30">
											<TableCell className="pl-4 sm:pl-6">
												<div className="min-w-0">
													<p className="truncate text-sm font-medium">
														{row.name}
													</p>
													<p className="truncate text-[11px] text-muted-foreground">
														{row.vendorType}
													</p>
												</div>
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{row.expected}
											</TableCell>
											<TableCell className="text-right tabular-nums text-emerald-700">
												{row.successful}
											</TableCell>
											<TableCell className="text-right tabular-nums text-amber-700">
												{row.warnings}
											</TableCell>
											<TableCell className="text-right tabular-nums text-red-700">
												{row.failed}
											</TableCell>
											<TableCell className="pr-4 sm:pr-6">
												<div className="flex items-center gap-2">
													<Progress
														value={row.healthScore}
														className={cn(
															"h-1.5 flex-1",
															row.healthScore >= 85
																? "bg-emerald-500/20"
																: row.healthScore >= 70
																	? "bg-amber-500/20"
																	: "bg-red-500/20"
														)}
														indicatorClassName={
															row.healthScore >= 85
																? "bg-emerald-500"
																: row.healthScore >= 70
																	? "bg-amber-500"
																	: "bg-red-500"
														}
													/>
													<span
														className={cn(
															"w-8 text-right text-xs font-semibold tabular-nums",
															row.healthScore >= 85
																? "text-emerald-700"
																: row.healthScore >= 70
																	? "text-amber-700"
																	: "text-red-700"
														)}
													>
														{row.healthScore}
													</span>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 xl:grid-cols-5">
				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-3">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">Processing overview</CardTitle>
					</CardHeader>
					<CardContent className="px-4 pt-2">
						<div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
							<div className="relative h-56">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={
												pieData.length
													? pieData
													: [{ name: "No Data", value: 1, color: "#cbd5e1" }]
											}
											dataKey="value"
											nameKey="name"
											innerRadius={58}
											outerRadius={82}
											paddingAngle={2}
										>
											{(pieData.length
												? pieData
												: [{ name: "No Data", value: 1, color: "#cbd5e1" }]
											).map((entry) => (
												<Cell key={entry.name} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
								<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
									<span className="text-2xl font-semibold tabular-nums">
										{summary.total}
									</span>
									<span className="text-[11px] font-medium text-muted-foreground">
										Total Runs
									</span>
								</div>
							</div>
							<div className="space-y-2">
								{[
									{
										label: "Successful",
										value: summary.successful,
										color: STATUS_COLORS.success,
									},
									{
										label: "Warnings",
										value: summary.warnings,
										color: STATUS_COLORS.warning,
									},
									{
										label: "Failed",
										value: summary.failed,
										color: STATUS_COLORS.failed,
									},
									{
										label: "In Progress",
										value: summary.inProgress,
										color: STATUS_COLORS.in_progress,
									},
								].map((item) => (
									<div
										key={item.label}
										className="flex items-center justify-between border-b border-border/40 py-2 last:border-b-0"
									>
										<div className="flex items-center gap-2">
											<span
												className="size-2.5 rounded-full"
												style={{ backgroundColor: item.color }}
											/>
											<span className="text-sm font-medium">{item.label}</span>
										</div>
										<div className="text-right">
											<p className="text-sm font-semibold tabular-nums">
												{item.value}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{summary.total
													? `${Math.round((item.value / summary.total) * 100)}%`
													: "0%"}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-2">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">Operational alerts</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-4">
						{alerts.map((alert) => (
							<Link
								key={alert.id}
								href={
									alert.runId
										? `/admin/file-monitoring/${alert.runId}`
										: "/admin/file-monitoring"
								}
								className="block rounded-lg border border-border/50 bg-background/50 p-2.5 transition-colors hover:border-primary/30 hover:bg-background"
							>
								<div className="flex items-start gap-2">
									<div
										className={cn(
											"mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10",
											alert.severity === "error" &&
												"bg-red-500/10 text-red-700",
											alert.severity === "warning" &&
												"bg-amber-500/10 text-amber-700",
											alert.severity === "info" && "bg-sky-500/10 text-sky-700"
										)}
									>
										<AlertTriangle className="size-4" />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-2">
											<p className="text-sm font-semibold leading-snug">
												{alert.title}
											</p>
											<span className="shrink-0 text-[10px] text-muted-foreground">
												{alert.when}
											</span>
										</div>
										<p className="mt-1 text-xs text-muted-foreground">
											{alert.vendorName}
										</p>
									</div>
								</div>
							</Link>
						))}
					</CardContent>
				</Card>
			</div>

			<Card className="bg-card/70">
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Runs requiring attention</CardTitle>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4 sm:pl-6">Vendor</TableHead>
									<TableHead>Run</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>File Type</TableHead>
									<TableHead>Latency</TableHead>
									<TableHead>Errors</TableHead>
									<TableHead>Warnings</TableHead>
									<TableHead className="pr-4 text-right sm:pr-6">
										Open
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{attentionRuns.map((run) => {
									const vendorId = vendorIdForRun(run);
									return (
										<TableRow key={run.id} className="hover:bg-muted/30">
											<TableCell className="pl-4 font-medium sm:pl-6">
												{vendorId ? (
													<Link
														href={`/admin/vendors/${vendorId}`}
														className="hover:underline"
													>
														{run.vendor}
													</Link>
												) : (
													run.vendor
												)}
											</TableCell>
											<TableCell className="font-mono text-xs">
												{run.runId}
											</TableCell>
											<TableCell>{displayRunStatus(run.status)}</TableCell>
											<TableCell>{run.fileType}</TableCell>
											<TableCell className="tabular-nums text-muted-foreground">
												{run.latencyMinutes ?? 0} min
											</TableCell>
											<TableCell className="tabular-nums text-red-700">
												{run.errorCount}
											</TableCell>
											<TableCell className="tabular-nums text-amber-700">
												{run.warningCount}
											</TableCell>
											<TableCell className="pr-4 text-right sm:pr-6">
												<Button variant="ghost" size="sm" asChild>
													<Link href={`/admin/file-monitoring/${run.id}`}>
														Open
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

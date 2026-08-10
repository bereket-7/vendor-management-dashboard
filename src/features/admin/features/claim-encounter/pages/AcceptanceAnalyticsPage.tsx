"use client";

import { useMemo, useState } from "react";

import {
	Activity,
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	BarChart3,
	CheckCircle2,
	CircleDollarSign,
	Clock3,
	Download,
	FileWarning,
	Info,
	Percent,
	RefreshCw,
	TrendingUp,
	XCircle,
} from "lucide-react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
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
	ClaimKpiGrid,
	ClaimPageHeader,
} from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import {
	exceptionsForProgram,
	filesForProgram,
	formatCount,
} from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const PIE_COLORS: Record<string, string> = {
	Accepted: "#13446c",
	Partial: "#f59e0b",
	Rejected: "#ef4444",
	Exception: "#8b5cf6",
	Pending: "#94a3b8",
	Paid: "#0ea5e9",
	Denied: "#f43f5e",
};

const OUTCOME_COLORS = {
	accepted: "#13446c",
	partial: "#f59e0b",
	rejected: "#ef4444",
};

function pct(n: number, d: number) {
	return d ? Math.round((n / d) * 1000) / 10 : 0;
}

function formatDayLabel(isoDate: string) {
	const day = isoDate.slice(8, 10);
	return `Jul ${Number(day)}`;
}

export function AcceptanceAnalyticsPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [vendor, setVendor] = useState("all");
	const [direction, setDirection] = useState("all");
	const [claimType, setClaimType] = useState("all");
	const [dateFrom, setDateFrom] = useState("2026-07-20");
	const [dateTo, setDateTo] = useState("2026-07-27");
	const [refreshing, setRefreshing] = useState(false);

	const baseRows = useMemo(
		() => filesForProgram(programFilter),
		[programFilter]
	);
	const exceptionRows = useMemo(
		() => exceptionsForProgram(programFilter),
		[programFilter]
	);

	const vendors = VENDOR_NAMES;
	const claimTypes = useMemo(
		() => Array.from(new Set(baseRows.map((r) => r.fileTypeLabel))).sort(),
		[baseRows]
	);

	const filteredRows = useMemo(() => {
		return baseRows.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (direction !== "all" && row.direction !== direction) return false;
			if (claimType !== "all" && row.fileTypeLabel !== claimType) return false;
			const day = row.receivedAt.slice(0, 10);
			if (day < dateFrom || day > dateTo) return false;
			return true;
		});
	}, [baseRows, claimType, dateFrom, dateTo, direction, vendor]);

	const analytics = useMemo(() => {
		const submitted = filteredRows.reduce((s, f) => s + f.submitted, 0);
		const accepted = filteredRows.reduce((s, f) => s + f.accepted, 0);
		const rejected = filteredRows.reduce((s, f) => s + f.rejected, 0);
		const partial = filteredRows.reduce((s, f) => s + f.partial, 0);
		const paid = filteredRows.reduce((s, f) => s + f.paid, 0);
		const denied = filteredRows.reduce((s, f) => s + f.denied, 0);
		const records = filteredRows.reduce((s, f) => s + f.records, 0);

		const acceptanceRate = pct(accepted, submitted);
		const rejectionRate = pct(rejected, submitted);
		const partialRate = pct(partial, submitted);
		const paymentRate = pct(paid, submitted);

		const responseTimes = filteredRows
			.map((f) => f.avgResponseMinutes)
			.filter((m): m is number => m != null);
		const avgResponseMinutes = responseTimes.length
			? Math.round(
					responseTimes.reduce((s, m) => s + m, 0) / responseTimes.length
				)
			: 0;

		const byVendor = Array.from(
			filteredRows.reduce(
				(map, file) => {
					const current = map.get(file.vendor) ?? {
						vendor: file.vendor,
						files: 0,
						submitted: 0,
						accepted: 0,
						rejected: 0,
						partial: 0,
						paid: 0,
						responseSum: 0,
						responseCount: 0,
					};
					current.files += 1;
					current.submitted += file.submitted;
					current.accepted += file.accepted;
					current.rejected += file.rejected;
					current.partial += file.partial;
					current.paid += file.paid;
					if (file.avgResponseMinutes != null) {
						current.responseSum += file.avgResponseMinutes;
						current.responseCount += 1;
					}
					map.set(file.vendor, current);
					return map;
				},
				new Map<
					string,
					{
						vendor: string;
						files: number;
						submitted: number;
						accepted: number;
						rejected: number;
						partial: number;
						paid: number;
						responseSum: number;
						responseCount: number;
					}
				>()
			)
		)
			.map(([, row]) => ({
				...row,
				rate: pct(row.accepted, row.submitted),
				rejectionRate: pct(row.rejected, row.submitted),
				avgMinutes: row.responseCount
					? Math.round(row.responseSum / row.responseCount)
					: 0,
			}))
			.sort((a, b) => b.rate - a.rate);

		const byDirection = (["inbound", "outbound"] as const).map((dir) => {
			const rows = filteredRows.filter((f) => f.direction === dir);
			const sub = rows.reduce((s, f) => s + f.submitted, 0);
			const acc = rows.reduce((s, f) => s + f.accepted, 0);
			const rej = rows.reduce((s, f) => s + f.rejected, 0);
			const par = rows.reduce((s, f) => s + f.partial, 0);
			return {
				direction: dir,
				files: rows.length,
				submitted: sub,
				accepted: acc,
				rejected: rej,
				partial: par,
				rate: pct(acc, sub),
				rejectionRate: pct(rej, sub),
			};
		});

		const dailyMap = new Map<
			string,
			{
				date: string;
				accepted: number;
				rejected: number;
				partial: number;
				submitted: number;
			}
		>();
		for (const file of filteredRows) {
			const date = file.receivedAt.slice(0, 10);
			const current = dailyMap.get(date) ?? {
				date,
				accepted: 0,
				rejected: 0,
				partial: 0,
				submitted: 0,
			};
			current.accepted += file.accepted;
			current.rejected += file.rejected;
			current.partial += file.partial;
			current.submitted += file.submitted;
			dailyMap.set(date, current);
		}
		const dailyTrend = Array.from(dailyMap.values())
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((d) => ({
				...d,
				label: formatDayLabel(d.date),
				rate: pct(d.accepted, d.submitted),
			}));

		const statusPie = [
			{
				name: "Accepted",
				value: filteredRows.filter((f) => f.status === "accepted").length,
			},
			{
				name: "Partial",
				value: filteredRows.filter((f) => f.status === "partial").length,
			},
			{
				name: "Rejected",
				value: filteredRows.filter((f) => f.status === "rejected").length,
			},
			{
				name: "Exception",
				value: filteredRows.filter((f) => f.status === "exception").length,
			},
			{
				name: "Pending",
				value: filteredRows.filter((f) => f.status === "pending").length,
			},
			{
				name: "Paid",
				value: filteredRows.filter((f) => f.status === "paid").length,
			},
			{
				name: "Denied",
				value: filteredRows.filter((f) => f.status === "denied").length,
			},
		].filter((d) => d.value > 0);

		const outcomeVolume = [
			{ name: "Accepted", value: accepted, fill: OUTCOME_COLORS.accepted },
			{ name: "Partial", value: partial, fill: OUTCOME_COLORS.partial },
			{ name: "Rejected", value: rejected, fill: OUTCOME_COLORS.rejected },
		];

		const vendorBars = byVendor.map((v) => ({
			vendor: v.vendor.length > 10 ? `${v.vendor.slice(0, 9)}…` : v.vendor,
			fullName: v.vendor,
			accepted: v.accepted,
			partial: v.partial,
			rejected: v.rejected,
			rate: v.rate,
		}));

		const rejectCodes = Array.from(
			exceptionRows
				.filter((e) => {
					if (vendor !== "all" && e.vendor !== vendor) return false;
					const day = e.detectedAt.slice(0, 10);
					return day >= dateFrom && day <= dateTo;
				})
				.reduce((map, e) => {
					const current = map.get(e.code) ?? {
						code: e.code,
						count: 0,
						severity: e.severity,
						sample: e.message,
					};
					current.count += 1;
					map.set(e.code, current);
					return map;
				}, new Map<string, { code: string; count: number; severity: string; sample: string }>())
		)
			.map(([, row]) => row)
			.sort((a, b) => b.count - a.count)
			.slice(0, 6);

		const topPerformer = byVendor[0];
		const bottomPerformer = byVendor[byVendor.length - 1];
		const firstRate = dailyTrend[0]?.rate ?? acceptanceRate;
		const lastRate = dailyTrend[dailyTrend.length - 1]?.rate ?? acceptanceRate;
		const rateDelta = Math.round((lastRate - firstRate) * 10) / 10;

		const insights: {
			tone: string;
			icon: typeof TrendingUp;
			title: string;
			body: string;
		}[] = [];

		if (topPerformer) {
			insights.push({
				tone: "border-primary/25 bg-primary/5 text-primary",
				icon: CheckCircle2,
				title: "Strongest vendor",
				body: `${topPerformer.vendor} leads at ${topPerformer.rate}% acceptance across ${formatCount(topPerformer.submitted)} submitted claims.`,
			});
		}
		if (bottomPerformer && byVendor.length > 1) {
			insights.push({
				tone: "border-amber-500/25 bg-amber-500/5 text-amber-950 dark:text-amber-100",
				icon: AlertTriangle,
				title: "Needs attention",
				body: `${bottomPerformer.vendor} is at ${bottomPerformer.rate}% with ${formatCount(bottomPerformer.rejected)} rejected claims — review reject codes below.`,
			});
		}
		insights.push({
			tone:
				rateDelta >= 0
					? "border-sky-500/25 bg-sky-500/5 text-sky-950 dark:text-sky-100"
					: "border-red-500/25 bg-red-500/5 text-red-950 dark:text-red-100",
			icon: rateDelta >= 0 ? TrendingUp : ArrowDownRight,
			title: rateDelta >= 0 ? "Trend improving" : "Trend softening",
			body: `Acceptance moved ${rateDelta >= 0 ? "+" : ""}${rateDelta} pts from ${firstRate}% to ${lastRate}% over the selected window.`,
		});
		if (rejectCodes[0]) {
			insights.push({
				tone: "border-violet-500/25 bg-violet-500/5 text-violet-950 dark:text-violet-100",
				icon: FileWarning,
				title: "Top reject driver",
				body: `${rejectCodes[0].code} appears ${rejectCodes[0].count}× — ${rejectCodes[0].sample}`,
			});
		}

		return {
			submitted,
			accepted,
			rejected,
			partial,
			paid,
			denied,
			records,
			acceptanceRate,
			rejectionRate,
			partialRate,
			paymentRate,
			avgResponseMinutes,
			byVendor,
			byDirection,
			dailyTrend,
			statusPie,
			outcomeVolume,
			vendorBars,
			rejectCodes,
			topPerformer,
			bottomPerformer,
			rateDelta,
			insights,
			fileCount: filteredRows.length,
		};
	}, [dateFrom, dateTo, exceptionRows, filteredRows, vendor]);

	const kpis = useMemo(
		() => [
			{
				label: "Acceptance rate",
				value: `${analytics.acceptanceRate}%`,
				hint: `${formatCount(analytics.accepted)} / ${formatCount(analytics.submitted)}`,
				icon: Percent,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Rejection rate",
				value: `${analytics.rejectionRate}%`,
				hint: `${formatCount(analytics.rejected)} rejected`,
				icon: XCircle,
				tone: "text-red-700 bg-red-500/10",
			},
			{
				label: "Partial rate",
				value: `${analytics.partialRate}%`,
				hint: `${formatCount(analytics.partial)} partial`,
				icon: FileWarning,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Payment rate",
				value: `${analytics.paymentRate}%`,
				hint: `${formatCount(analytics.paid)} paid`,
				icon: CircleDollarSign,
				tone: "text-sky-700 bg-sky-500/10",
			},
			{
				label: "Avg response",
				value: `${analytics.avgResponseMinutes}m`,
				hint: "Gainwell turnaround",
				icon: Clock3,
				tone: "text-violet-700 bg-violet-500/10",
			},
			{
				label: "Files analyzed",
				value: formatCount(analytics.fileCount),
				hint: `${formatCount(analytics.records)} records`,
				icon: BarChart3,
				tone: "text-primary bg-primary/10",
			},
		],
		[analytics]
	);

	function clearFilters() {
		setVendor("all");
		setDirection("all");
		setClaimType("all");
		setDateFrom("2026-07-20");
		setDateTo("2026-07-27");
	}

	async function handleRefresh() {
		setRefreshing(true);
		await new Promise((r) => setTimeout(r, 500));
		setRefreshing(false);
	}

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Acceptance Analytics"
				description={`Deep acceptance, rejection, and payment analysis across claim & encounter files · ${programFilter}`}
				actions={
					<>
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
						<Button variant="outline" size="sm" className="h-9">
							<Download className="mr-1.5 size-3.5" />
							Export dashboard
						</Button>
					</>
				}
			/>

			<div className="flex flex-col gap-2">
				<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
					<div className="space-y-1">
						<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							From
						</label>
						<Input
							type="date"
							value={dateFrom}
							onChange={(e) => setDateFrom(e.target.value)}
							className="h-9"
						/>
					</div>
					<div className="space-y-1">
						<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							To
						</label>
						<Input
							type="date"
							value={dateTo}
							onChange={(e) => setDateTo(e.target.value)}
							className="h-9"
						/>
					</div>
					<div className="space-y-1">
						<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							Vendor
						</label>
						<Select value={vendor} onValueChange={setVendor}>
							<SelectTrigger className="h-9">
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
					</div>
					<div className="space-y-1">
						<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							Direction
						</label>
						<Select value={direction} onValueChange={setDirection}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Direction" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="inbound">Inbound</SelectItem>
								<SelectItem value="outbound">Outbound</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							Claim type
						</label>
						<Select value={claimType} onValueChange={setClaimType}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Claim type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{claimTypes.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-end gap-2 xl:col-span-2">
						<Button className="h-9 flex-1">Apply filters</Button>
						<Button variant="ghost" className="h-9" onClick={clearFilters}>
							Clear
						</Button>
					</div>
				</div>
			</div>

			<ClaimKpiGrid items={kpis} />

			{/* Narrative insights */}
			<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
				{analytics.insights.map((insight) => {
					const Icon = insight.icon;
					return (
						<div
							key={insight.title}
							className={cn("rounded-lg border px-3 py-2.5", insight.tone)}
						>
							<div className="flex items-center gap-1.5">
								<Icon className="size-3.5 shrink-0 opacity-80" />
								<p className="text-xs font-semibold">{insight.title}</p>
							</div>
							<p className="mt-1 text-xs leading-snug opacity-90">
								{insight.body}
							</p>
						</div>
					);
				})}
			</div>

			{/* Trend + outcome funnel */}
			<div className="grid gap-2 xl:grid-cols-5">
				<Card className="min-w-0 gap-1 bg-card/70 py-2 xl:col-span-3">
					<CardHeader className="flex flex-row items-center justify-between px-3 pb-0.5 pt-0">
						<div>
							<CardTitle className="text-sm font-medium">
								Acceptance trend
							</CardTitle>
							<p className="text-[11px] text-muted-foreground">
								Daily accepted / rejected / partial volume
							</p>
						</div>
						<div
							className={cn(
								"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
								analytics.rateDelta >= 0
									? "bg-primary/15 text-primary"
									: "bg-red-100 text-red-800"
							)}
						>
							{analytics.rateDelta >= 0 ? (
								<ArrowUpRight className="size-3" />
							) : (
								<ArrowDownRight className="size-3" />
							)}
							{analytics.rateDelta >= 0 ? "+" : ""}
							{analytics.rateDelta} pts
						</div>
					</CardHeader>
					<CardContent className="h-64 px-2 pt-1 sm:px-3">
						{analytics.dailyTrend.length === 0 ? (
							<p className="flex h-full items-center justify-center text-xs text-muted-foreground">
								No trend data for current filters.
							</p>
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={analytics.dailyTrend}>
									<defs>
										<linearGradient
											id="aa-accepted"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="#13446c"
												stopOpacity={0.35}
											/>
											<stop
												offset="95%"
												stopColor="#13446c"
												stopOpacity={0.02}
											/>
										</linearGradient>
										<linearGradient
											id="aa-rejected"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
											<stop
												offset="95%"
												stopColor="#ef4444"
												stopOpacity={0.02}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border/50"
									/>
									<XAxis
										dataKey="label"
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: 11 }}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: 11 }}
										width={40}
									/>
									<Tooltip
										contentStyle={{
											fontSize: 12,
											borderRadius: 8,
											border: "1px solid hsl(var(--border))",
										}}
									/>
									<Legend wrapperStyle={{ fontSize: 11 }} />
									<Area
										type="monotone"
										dataKey="accepted"
										name="Accepted"
										stroke="#13446c"
										strokeWidth={2}
										fill="url(#aa-accepted)"
										stackId="1"
									/>
									<Area
										type="monotone"
										dataKey="partial"
										name="Partial"
										stroke="#f59e0b"
										strokeWidth={2}
										fill="#f59e0b33"
										stackId="1"
									/>
									<Area
										type="monotone"
										dataKey="rejected"
										name="Rejected"
										stroke="#ef4444"
										strokeWidth={2}
										fill="url(#aa-rejected)"
										stackId="1"
									/>
								</AreaChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-1 bg-card/70 py-2 xl:col-span-2">
					<CardHeader className="px-3 pb-0.5 pt-0">
						<CardTitle className="text-sm font-medium">Outcome mix</CardTitle>
						<p className="text-[11px] text-muted-foreground">
							Claim-level disposition of submitted volume
						</p>
					</CardHeader>
					<CardContent className="px-3">
						<div className="h-40">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={
											analytics.outcomeVolume.some((d) => d.value > 0)
												? analytics.outcomeVolume
												: [{ name: "No Data", value: 1, fill: "#cbd5e1" }]
										}
										dataKey="value"
										nameKey="name"
										innerRadius={42}
										outerRadius={64}
										paddingAngle={2}
									>
										{(analytics.outcomeVolume.some((d) => d.value > 0)
											? analytics.outcomeVolume
											: [{ name: "No Data", value: 1, fill: "#cbd5e1" }]
										).map((entry) => (
											<Cell key={entry.name} fill={entry.fill} />
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="mt-1 space-y-1.5">
							{[
								{
									label: "Accepted",
									value: analytics.accepted,
									rate: analytics.acceptanceRate,
									track: "bg-primary/15",
									indicator: "bg-primary",
								},
								{
									label: "Partial",
									value: analytics.partial,
									rate: analytics.partialRate,
									track: "bg-amber-500/15",
									indicator: "bg-amber-500",
								},
								{
									label: "Rejected",
									value: analytics.rejected,
									rate: analytics.rejectionRate,
									track: "bg-red-500/15",
									indicator: "bg-red-500",
								},
							].map((row) => (
								<div key={row.label} className="space-y-0.5">
									<div className="flex items-center justify-between text-xs">
										<div className="flex items-center gap-1.5">
											<span
												className={cn("size-2 rounded-full", row.indicator)}
											/>
											{row.label}
										</div>
										<span className="tabular-nums font-medium">
											{formatCount(row.value)} · {row.rate}%
										</span>
									</div>
									<Progress
										value={row.rate}
										className={cn("h-1", row.track)}
										indicatorClassName={row.indicator}
									/>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Vendor stacked bars + file status */}
			<div className="grid gap-2 xl:grid-cols-5">
				<Card className="min-w-0 gap-1 bg-card/70 py-2 xl:col-span-3">
					<CardHeader className="px-3 pb-0.5 pt-0">
						<CardTitle className="text-sm font-medium">
							Vendor outcome volume
						</CardTitle>
						<p className="text-[11px] text-muted-foreground">
							Accepted vs partial vs rejected claims by vendor
						</p>
					</CardHeader>
					<CardContent className="h-60 px-2 pt-1 sm:px-3">
						{analytics.vendorBars.length === 0 ? (
							<p className="flex h-full items-center justify-center text-xs text-muted-foreground">
								No vendor data.
							</p>
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={analytics.vendorBars}
									barGap={0}
									barCategoryGap="35%"
									barSize={14}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border/50"
										vertical={false}
									/>
									<XAxis
										dataKey="vendor"
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: 11 }}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: 11 }}
										width={40}
									/>
									<Tooltip
										formatter={(value) => formatCount(Number(value))}
										labelFormatter={(_, payload) =>
											String(payload?.[0]?.payload?.fullName ?? "")
										}
										contentStyle={{
											fontSize: 12,
											borderRadius: 8,
											border: "1px solid hsl(var(--border))",
										}}
									/>
									<Legend wrapperStyle={{ fontSize: 11 }} />
									<Bar
										dataKey="accepted"
										name="Accepted"
										stackId="a"
										fill={OUTCOME_COLORS.accepted}
										radius={[0, 0, 0, 0]}
									/>
									<Bar
										dataKey="partial"
										name="Partial"
										stackId="a"
										fill={OUTCOME_COLORS.partial}
									/>
									<Bar
										dataKey="rejected"
										name="Rejected"
										stackId="a"
										fill={OUTCOME_COLORS.rejected}
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-1 bg-card/70 py-2 xl:col-span-2">
					<CardHeader className="px-3 pb-0.5 pt-0">
						<CardTitle className="text-sm font-medium">
							File status mix
						</CardTitle>
						<p className="text-[11px] text-muted-foreground">
							Files by Gainwell disposition status
						</p>
					</CardHeader>
					<CardContent className="px-3">
						<div className="h-36">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={
											analytics.statusPie.length
												? analytics.statusPie
												: [{ name: "No Data", value: 1 }]
										}
										dataKey="value"
										nameKey="name"
										innerRadius={36}
										outerRadius={56}
										paddingAngle={2}
									>
										{(analytics.statusPie.length
											? analytics.statusPie
											: [{ name: "No Data", value: 1 }]
										).map((entry) => (
											<Cell
												key={entry.name}
												fill={PIE_COLORS[entry.name] ?? "#cbd5e1"}
											/>
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="mt-1 max-h-28 space-y-1 overflow-y-auto">
							{analytics.statusPie.map((item) => (
								<div
									key={item.name}
									className="flex items-center justify-between text-xs"
								>
									<div className="flex items-center gap-2">
										<span
											className="size-2 rounded-full"
											style={{
												backgroundColor: PIE_COLORS[item.name] ?? "#cbd5e1",
											}}
										/>
										{item.name}
									</div>
									<span className="font-semibold tabular-nums">
										{item.value}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Direction + reject codes */}
			<div className="grid gap-2 lg:grid-cols-2">
				<Card className="min-w-0 gap-1 bg-card/70 py-2">
					<CardHeader className="px-3 pb-0.5 pt-0">
						<CardTitle className="text-sm font-medium">
							Inbound vs outbound
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-3">
						{analytics.byDirection.map((row) => (
							<div
								key={row.direction}
								className="rounded-lg border border-border/50 bg-background/50 p-2.5"
							>
								<div className="flex items-center justify-between gap-2">
									<p className="text-sm font-medium capitalize">
										{row.direction}
									</p>
									<span className="text-sm font-semibold tabular-nums text-primary">
										{row.rate}%
									</span>
								</div>
								<p className="mt-0.5 text-[11px] text-muted-foreground">
									{row.files} files · {formatCount(row.submitted)} submitted
								</p>
								<div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
									<div className="rounded-md bg-primary/10 px-1 py-1">
										<p className="text-[10px] text-muted-foreground">
											Accepted
										</p>
										<p className="text-xs font-semibold tabular-nums text-primary">
											{formatCount(row.accepted)}
										</p>
									</div>
									<div className="rounded-md bg-amber-500/10 px-1 py-1">
										<p className="text-[10px] text-muted-foreground">Partial</p>
										<p className="text-xs font-semibold tabular-nums text-amber-800">
											{formatCount(row.partial)}
										</p>
									</div>
									<div className="rounded-md bg-red-500/10 px-1 py-1">
										<p className="text-[10px] text-muted-foreground">
											Rejected
										</p>
										<p className="text-xs font-semibold tabular-nums text-red-700">
											{formatCount(row.rejected)}
										</p>
									</div>
								</div>
								<Progress
									value={row.rate}
									className="mt-2 h-1.5 bg-primary/15"
									indicatorClassName="bg-primary"
								/>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-1 bg-card/70 py-2">
					<CardHeader className="px-3 pb-0.5 pt-0">
						<CardTitle className="flex items-center gap-1.5 text-sm font-medium">
							<Activity className="size-3.5 text-muted-foreground" />
							Top reject codes
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1.5 px-3">
						{analytics.rejectCodes.length === 0 ? (
							<p className="py-6 text-center text-xs text-muted-foreground">
								No reject codes for current filters.
							</p>
						) : (
							analytics.rejectCodes.map((row, index) => (
								<div
									key={row.code}
									className="flex items-start gap-2 rounded-md border border-border/40 px-2 py-1.5"
								>
									<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
										{index + 1}
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<p className="font-mono text-xs font-semibold">
												{row.code}
											</p>
											<span
												className={cn(
													"rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
													row.severity === "error"
														? "bg-red-100 text-red-800"
														: "bg-amber-100 text-amber-900"
												)}
											>
												{row.count}×
											</span>
										</div>
										<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
											{row.sample}
										</p>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			{/* Vendor leaderboard table */}
			<Card className="min-w-0 gap-1 bg-card/70 py-2">
				<CardHeader className="px-3 pb-0.5 pt-0">
					<CardTitle className="text-sm font-medium">
						Vendor acceptance leaderboard
					</CardTitle>
					<p className="text-[11px] text-muted-foreground">
						Ranked by acceptance rate · includes rejection load and response
						time
					</p>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="w-10 pl-3 sm:pl-4">#</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead className="text-right">Files</TableHead>
									<TableHead className="text-right">Submitted</TableHead>
									<TableHead className="text-right">Accepted</TableHead>
									<TableHead className="text-right">Rejected</TableHead>
									<TableHead className="text-right">Partial</TableHead>
									<TableHead className="text-right">Avg resp.</TableHead>
									<TableHead className="pr-3 sm:pr-4">Acceptance</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{analytics.byVendor.map((row, index) => (
									<TableRow key={row.vendor} className="hover:bg-muted/30">
										<TableCell className="pl-3 text-xs tabular-nums text-muted-foreground sm:pl-4">
											{index + 1}
										</TableCell>
										<TableCell className="font-medium">{row.vendor}</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											{row.files}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											{formatCount(row.submitted)}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums text-primary">
											{formatCount(row.accepted)}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums text-red-700">
											{formatCount(row.rejected)}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums text-amber-800">
											{formatCount(row.partial)}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums text-muted-foreground">
											{row.avgMinutes ? `${row.avgMinutes}m` : "—"}
										</TableCell>
										<TableCell className="pr-3 sm:pr-4">
											<div className="flex min-w-0 items-center gap-1.5">
												<Progress
													value={row.rate}
													className={cn(
														"h-1.5 min-w-0 flex-1",
														row.rate >= 95
															? "bg-primary/20"
															: row.rate >= 90
																? "bg-amber-500/20"
																: "bg-red-500/20"
													)}
													indicatorClassName={
														row.rate >= 95
															? "bg-primary"
															: row.rate >= 90
																? "bg-amber-500"
																: "bg-red-500"
													}
												/>
												<span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">
													{row.rate}%
												</span>
											</div>
										</TableCell>
									</TableRow>
								))}
								{analytics.byVendor.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={9}
											className="h-20 text-center text-muted-foreground"
										>
											No analytics for current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Metric definitions */}
			<Card className="gap-1 border-dashed bg-card/50 py-2">
				<CardHeader className="px-3 pb-0.5 pt-0">
					<CardTitle className="flex items-center gap-1.5 text-sm font-medium">
						<Info className="size-3.5 text-muted-foreground" />
						How rates are calculated
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-2 px-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						{
							label: "Acceptance Rate",
							formula: "(Accepted / Submitted) × 100",
							icon: CheckCircle2,
							tone: "text-primary bg-primary/10",
						},
						{
							label: "Rejection Rate",
							formula: "(Rejected / Submitted) × 100",
							icon: XCircle,
							tone: "text-red-700 bg-red-500/10",
						},
						{
							label: "Partial Rate",
							formula: "(Partial / Submitted) × 100",
							icon: FileWarning,
							tone: "text-amber-700 bg-amber-500/10",
						},
						{
							label: "Payment Rate",
							formula: "(Paid / Submitted) × 100",
							icon: CircleDollarSign,
							tone: "text-sky-700 bg-sky-500/10",
						},
					].map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.label}
								className="flex items-start gap-2 rounded-lg border border-border/40 p-2"
							>
								<div
									className={cn(
										"flex size-7 shrink-0 items-center justify-center rounded-md",
										item.tone
									)}
								>
									<Icon className="size-3.5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-semibold">{item.label}</p>
									<p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
										{item.formula}
									</p>
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	CheckCircle2,
	Clock3,
	Download,
	Filter,
	RefreshCw,
	Search,
	ShieldAlert,
	TrendingUp,
} from "lucide-react";

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
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type VendorSlaRow = {
	vendor: string;
	total: number;
	onTime: number;
	atRisk: number;
	breached: number;
	score: number;
};

export function SlaMonitoringPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [search, setSearch] = useState("");
	const [vendor, setVendor] = useState("all");
	const [status, setStatus] = useState("all");

	const programRuns = useMemo(
		() => FILE_RUNS.filter((run) => run.program === programFilter),
		[programFilter]
	);

	const vendors = useMemo(
		() => Array.from(new Set(programRuns.map((run) => run.vendor))).sort(),
		[programRuns]
	);

	const filteredRuns = useMemo(() => {
		const query = search.trim().toLowerCase();
		return programRuns.filter((run) => {
			if (vendor !== "all" && run.vendor !== vendor) return false;
			if (status !== "all" && run.status !== status) return false;
			if (!query) return true;
			return [run.vendor, run.fileType, run.runId, run.scheduleId]
				.join(" ")
				.toLowerCase()
				.includes(query);
		});
	}, [programRuns, search, status, vendor]);

	const summary = useMemo(() => {
		const monitored = filteredRuns.length;
		const onTime = filteredRuns.filter(
			(run) => (run.latencyMinutes ?? 0) <= 0
		).length;
		const atRisk = filteredRuns.filter(
			(run) =>
				(run.latencyMinutes ?? 0) > 0 &&
				(run.latencyMinutes ?? 0) <= run.slaMinutes
		).length;
		const breached = filteredRuns.filter(
			(run) => (run.latencyMinutes ?? 0) > run.slaMinutes
		).length;
		const avgLatency = monitored
			? Math.round(
					filteredRuns.reduce(
						(sum, run) => sum + (run.latencyMinutes ?? 0),
						0
					) / monitored
				)
			: 0;
		const attainment = monitored ? Math.round((onTime / monitored) * 100) : 0;
		return { monitored, onTime, atRisk, breached, avgLatency, attainment };
	}, [filteredRuns]);

	const vendorScores = useMemo<VendorSlaRow[]>(() => {
		const grouped = new Map<string, VendorSlaRow>();
		for (const run of filteredRuns) {
			if (!grouped.has(run.vendor)) {
				grouped.set(run.vendor, {
					vendor: run.vendor,
					total: 0,
					onTime: 0,
					atRisk: 0,
					breached: 0,
					score: 0,
				});
			}
			const row = grouped.get(run.vendor)!;
			row.total += 1;
			if ((run.latencyMinutes ?? 0) <= 0) row.onTime += 1;
			else if ((run.latencyMinutes ?? 0) <= run.slaMinutes) row.atRisk += 1;
			else row.breached += 1;
		}
		return Array.from(grouped.values())
			.map((row) => ({
				...row,
				score: row.total ? Math.round((row.onTime / row.total) * 100) : 0,
			}))
			.sort((a, b) => a.score - b.score);
	}, [filteredRuns]);

	const watchlist = filteredRuns
		.filter((run) => (run.latencyMinutes ?? 0) > 0)
		.sort((a, b) => (b.latencyMinutes ?? 0) - (a.latencyMinutes ?? 0))
		.slice(0, 5);

	function clearFilters() {
		setSearch("");
		setVendor("all");
		setStatus("all");
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						SLA Monitoring
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Track delivery performance, breach risk, and vendor SLA attainment.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild size="sm" className="h-9">
						<Link href="/admin/file-monitoring">Open File Monitoring</Link>
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<RefreshCw className="mr-1.5 size-3.5" />
						Refresh
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Export SLA report
					</Button>
				</div>
			</div>

			<Card className="border border-primary/15 bg-gradient-to-r from-primary/[0.05] via-card to-sky-50/60 gap-0 py-0">
				<CardContent className="flex flex-col gap-1.5 px-3 py-2">
					<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
						<Filter className="size-3.5 text-primary" />
						Filters
					</div>
					<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
						<div className="space-y-1 2xl:col-span-2">
							<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Search
							</label>
							<div className="relative">
								<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Vendor, schedule, run ID..."
									className="h-9 pl-8"
								/>
							</div>
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
									{vendors.map((item) => (
										<SelectItem key={item} value={item}>
											{item}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Status
							</label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All statuses</SelectItem>
									<SelectItem value="success">Success</SelectItem>
									<SelectItem value="warning">Warning</SelectItem>
									<SelectItem value="late">Late</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
									<SelectItem value="processing">Processing</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-end gap-2 2xl:col-span-2">
							<Button className="h-9 flex-1">Apply filters</Button>
							<Button variant="ghost" className="h-9" onClick={clearFilters}>
								Clear
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{[
					{
						label: "Monitored runs",
						value: summary.monitored,
						hint: "Current scope",
						icon: Clock3,
						tone: "text-primary bg-primary/10",
					},
					{
						label: "On time",
						value: summary.onTime,
						hint: "Within window",
						icon: CheckCircle2,
						tone: "text-emerald-700 bg-emerald-500/10",
					},
					{
						label: "At risk",
						value: summary.atRisk,
						hint: "Monitor closely",
						icon: AlertTriangle,
						tone: "text-amber-700 bg-amber-500/10",
					},
					{
						label: "Breached",
						value: summary.breached,
						hint: "Outside SLA",
						icon: ShieldAlert,
						tone: "text-red-700 bg-red-500/10",
					},
					{
						label: "Attainment",
						value: `${summary.attainment}%`,
						hint: "On-time ratio",
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

			<div className="grid gap-4 xl:grid-cols-5">
				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-2">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">Breach watchlist</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-4">
						{watchlist.map((run) => (
							<Link
								key={run.id}
								href={`/admin/file-monitoring/${run.id}`}
								className="block rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:border-primary/30 hover:bg-background"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="truncate text-sm font-semibold">
											{run.vendor}
										</p>
										<p className="text-xs text-muted-foreground">
											{run.fileType} · SLA {run.slaMinutes} min
										</p>
									</div>
									<span className="text-sm font-semibold text-red-700">
										+{run.latencyMinutes ?? 0} min
									</span>
								</div>
							</Link>
						))}
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-3">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">Vendor SLA score</CardTitle>
					</CardHeader>
					<CardContent className="px-0 pb-0">
						<div className="border-t border-border/50">
							<Table>
								<TableHeader>
									<TableRow className="bg-primary/[0.04] hover:bg-primary/[0.04]">
										<TableHead className="pl-4 text-primary sm:pl-6">
											Vendor
										</TableHead>
										<TableHead className="text-primary">Runs</TableHead>
										<TableHead className="text-primary">On Time</TableHead>
										<TableHead className="text-primary">At Risk</TableHead>
										<TableHead className="text-primary">Breached</TableHead>
										<TableHead className="pr-4 text-primary sm:pr-6">
											Score
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{vendorScores.map((row) => (
										<TableRow key={row.vendor} className="hover:bg-muted/30">
											<TableCell className="pl-4 font-medium sm:pl-6">
												{row.vendor}
											</TableCell>
											<TableCell className="tabular-nums">
												{row.total}
											</TableCell>
											<TableCell className="tabular-nums text-emerald-700">
												{row.onTime}
											</TableCell>
											<TableCell className="tabular-nums text-amber-700">
												{row.atRisk}
											</TableCell>
											<TableCell className="tabular-nums text-red-700">
												{row.breached}
											</TableCell>
											<TableCell className="pr-4 sm:pr-6">
												<div className="flex items-center gap-2">
													<Progress
														value={row.score}
														className={cn(
															"h-1.5 flex-1",
															row.score >= 85
																? "bg-emerald-500/20"
																: row.score >= 70
																	? "bg-amber-500/20"
																	: "bg-red-500/20"
														)}
														indicatorClassName={
															row.score >= 85
																? "bg-emerald-500"
																: row.score >= 70
																	? "bg-amber-500"
																	: "bg-red-500"
														}
													/>
													<span className="w-8 text-right text-xs font-semibold tabular-nums">
														{row.score}
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

			<Card className="bg-card/70">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<div>
						<CardTitle className="text-base">SLA event register</CardTitle>
					</div>
					<p className="text-xs text-muted-foreground">
						Showing {filteredRuns.length} monitored events
					</p>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="bg-primary/[0.04] hover:bg-primary/[0.04]">
									<TableHead className="pl-4 text-primary sm:pl-6">
										Vendor
									</TableHead>
									<TableHead className="text-primary">File Type</TableHead>
									<TableHead className="text-primary">Expected</TableHead>
									<TableHead className="text-primary">Received</TableHead>
									<TableHead className="text-primary">SLA</TableHead>
									<TableHead className="text-primary">Latency</TableHead>
									<TableHead className="text-primary">Status</TableHead>
									<TableHead className="pr-4 text-right text-primary sm:pr-6">
										Open
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredRuns.map((run) => (
									<TableRow key={run.id} className="hover:bg-muted/30">
										<TableCell className="pl-4 font-medium sm:pl-6">
											{run.vendor}
										</TableCell>
										<TableCell>{run.fileType}</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{run.expectedAt}
										</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{run.receivedAt ?? "—"}
										</TableCell>
										<TableCell className="tabular-nums">
											{run.slaMinutes} min
										</TableCell>
										<TableCell
											className={cn(
												"tabular-nums font-medium",
												(run.latencyMinutes ?? 0) <= 0 && "text-emerald-700",
												(run.latencyMinutes ?? 0) > 0 &&
													(run.latencyMinutes ?? 0) <= run.slaMinutes &&
													"text-amber-700",
												(run.latencyMinutes ?? 0) > run.slaMinutes &&
													"text-red-700"
											)}
										>
											{run.latencyMinutes == null
												? "—"
												: `${run.latencyMinutes} min`}
										</TableCell>
										<TableCell>{displayRunStatus(run.status)}</TableCell>
										<TableCell className="pr-4 text-right sm:pr-6">
											<Button variant="ghost" size="sm" asChild>
												<Link href={`/admin/file-monitoring/${run.id}`}>
													Open
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

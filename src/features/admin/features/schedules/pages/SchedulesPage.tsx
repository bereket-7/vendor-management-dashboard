"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	Clock3,
	Download,
	FileArchive,
	Filter,
	RefreshCw,
	Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	FILE_RUNS,
	type ProcessStatus,
	displayRunStatus,
} from "@/features/admin/features/file-management/mock-data";
import { SchedulesLivePage } from "@/features/admin/features/schedules/pages/SchedulesLivePage";
import { Link } from "@/i18n/navigation";
import { isVendorCoreLive } from "@/lib/vendor-core";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type ScheduleRow = {
	id: string;
	vendor: string;
	fileType: string;
	frequency: string;
	direction: string;
	protocol: string;
	expectedAt: string;
	lastReceived: string | null;
	slaMinutes: number;
	status: ProcessStatus;
	errorCount: number;
	warningCount: number;
	runId: string;
	fileRunId: string;
};

function statusTone(status: string) {
	if (status === "success") return "bg-emerald-500/10 text-emerald-700";
	if (status === "failed") return "bg-red-500/10 text-red-700";
	if (status === "warning" || status === "late")
		return "bg-amber-500/10 text-amber-700";
	return "bg-sky-500/10 text-sky-700";
}

export function SchedulesPage() {
	if (isVendorCoreLive()) return <SchedulesLivePage />;
	return <SchedulesMockPage />;
}

function SchedulesMockPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [search, setSearch] = useState("");
	const [vendor, setVendor] = useState("all");
	const [frequency, setFrequency] = useState("all");
	const [status, setStatus] = useState("all");

	const programRuns = useMemo(
		() => FILE_RUNS.filter((run) => run.program === programFilter),
		[programFilter]
	);

	const vendors = useMemo(
		() => Array.from(new Set(programRuns.map((run) => run.vendor))).sort(),
		[programRuns]
	);
	const frequencies = useMemo(
		() => Array.from(new Set(programRuns.map((run) => run.frequency))).sort(),
		[programRuns]
	);

	const schedules = useMemo<ScheduleRow[]>(() => {
		const grouped = new Map<string, ScheduleRow>();
		for (const run of programRuns) {
			if (!grouped.has(run.scheduleId)) {
				grouped.set(run.scheduleId, {
					id: run.scheduleId,
					vendor: run.vendor,
					fileType: run.fileType,
					frequency: run.frequency,
					direction: run.direction,
					protocol: run.protocol,
					expectedAt: run.expectedAt,
					lastReceived: run.receivedAt,
					slaMinutes: run.slaMinutes,
					status: run.status,
					errorCount: run.errorCount,
					warningCount: run.warningCount,
					runId: run.runId,
					fileRunId: run.id,
				});
			}
		}
		return Array.from(grouped.values()).sort((a, b) =>
			a.vendor.localeCompare(b.vendor)
		);
	}, [programRuns]);

	const filteredSchedules = useMemo(() => {
		const query = search.trim().toLowerCase();
		return schedules.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (frequency !== "all" && row.frequency !== frequency) return false;
			if (status !== "all" && row.status !== status) return false;
			if (!query) return true;
			return [row.vendor, row.fileType, row.id, row.runId]
				.join(" ")
				.toLowerCase()
				.includes(query);
		});
	}, [frequency, schedules, search, status, vendor]);

	const summary = useMemo(() => {
		const active = filteredSchedules.length;
		const healthy = filteredSchedules.filter(
			(row) => row.status === "success"
		).length;
		const warning = filteredSchedules.filter(
			(row) => row.status === "warning" || row.status === "late"
		).length;
		const failed = filteredSchedules.filter(
			(row) => row.status === "failed"
		).length;
		const avgSla = filteredSchedules.length
			? Math.round(
					filteredSchedules.reduce((sum, row) => sum + row.slaMinutes, 0) /
						filteredSchedules.length
				)
			: 0;
		return { active, healthy, warning, failed, avgSla };
	}, [filteredSchedules]);

	const upcoming = filteredSchedules.slice(0, 4);
	const watchlist = filteredSchedules
		.filter((row) => row.status !== "success")
		.slice(0, 5);

	function clearFilters() {
		setSearch("");
		setVendor("all");
		setFrequency("all");
		setStatus("all");
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Schedules
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Manage delivery windows, cadence, and schedule health across
						vendors.
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
						Export schedules
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
									placeholder="Vendor, file type, schedule ID..."
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
								Frequency
							</label>
							<Select value={frequency} onValueChange={setFrequency}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Frequency" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All frequencies</SelectItem>
									{frequencies.map((item) => (
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
						label: "Active schedules",
						value: summary.active,
						hint: "Current monitoring set",
						icon: CalendarDays,
						tone: "text-primary bg-primary/10",
					},
					{
						label: "Healthy",
						value: summary.healthy,
						hint: "On cadence",
						icon: CheckCircle2,
						tone: "text-emerald-700 bg-emerald-500/10",
					},
					{
						label: "Warnings",
						value: summary.warning,
						hint: "Needs follow-up",
						icon: AlertTriangle,
						tone: "text-amber-700 bg-amber-500/10",
					},
					{
						label: "Failed",
						value: summary.failed,
						hint: "Missed or broken",
						icon: FileArchive,
						tone: "text-red-700 bg-red-500/10",
					},
					{
						label: "Avg. SLA",
						value: `${summary.avgSla} min`,
						hint: "Target window",
						icon: Clock3,
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
				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-3">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">
							Upcoming schedule windows
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-4">
						{upcoming.map((row) => (
							<div
								key={row.id}
								className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2.5"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold">{row.vendor}</p>
									<p className="truncate text-xs text-muted-foreground">
										{row.fileType} · {row.frequency} · {row.expectedAt}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-semibold text-primary">{row.id}</p>
									<p className="text-[11px] text-muted-foreground">
										SLA {row.slaMinutes} min
									</p>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-2">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">Schedule watchlist</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-4">
						{watchlist.length === 0 ? (
							<div className="rounded-lg border border-border/50 bg-background/50 p-3 text-sm text-muted-foreground">
								No schedules currently require attention.
							</div>
						) : (
							watchlist.map((row) => (
								<Link
									key={row.id}
									href={`/admin/file-monitoring/${row.fileRunId}`}
									className="block rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:border-primary/30 hover:bg-background"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold">
												{row.vendor}
											</p>
											<p className="text-xs text-muted-foreground">
												{row.fileType} · {row.id}
											</p>
										</div>
										<span
											className={cn(
												"rounded-full px-2 py-0.5 text-[11px] font-semibold",
												statusTone(row.status)
											)}
										>
											{displayRunStatus(row.status)}
										</span>
									</div>
								</Link>
							))
						)}
					</CardContent>
				</Card>
			</div>

			<Card className="bg-card/70">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<div>
						<CardTitle className="text-base">Schedule register</CardTitle>
					</div>
					<p className="text-xs text-muted-foreground">
						Showing {filteredSchedules.length} schedules
					</p>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="bg-primary/[0.04] hover:bg-primary/[0.04]">
									<TableHead className="pl-4 text-primary sm:pl-6">
										Schedule
									</TableHead>
									<TableHead className="text-primary">Vendor</TableHead>
									<TableHead className="text-primary">Type</TableHead>
									<TableHead className="text-primary">Frequency</TableHead>
									<TableHead className="text-primary">Expected</TableHead>
									<TableHead className="text-primary">Status</TableHead>
									<TableHead className="text-primary">SLA</TableHead>
									<TableHead className="pr-4 text-right text-primary sm:pr-6">
										Open
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredSchedules.map((row) => (
									<TableRow key={row.id} className="hover:bg-muted/30">
										<TableCell className="pl-4 sm:pl-6">
											<div className="min-w-0">
												<p className="font-medium">{row.id}</p>
												<p className="text-[11px] text-muted-foreground">
													{row.direction} · {row.protocol}
												</p>
											</div>
										</TableCell>
										<TableCell>{row.vendor}</TableCell>
										<TableCell>{row.fileType}</TableCell>
										<TableCell>{row.frequency}</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{row.expectedAt}
										</TableCell>
										<TableCell>
											<span
												className={cn(
													"inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
													statusTone(row.status)
												)}
											>
												{displayRunStatus(row.status)}
											</span>
										</TableCell>
										<TableCell className="tabular-nums">
											{row.slaMinutes} min
										</TableCell>
										<TableCell className="pr-4 text-right sm:pr-6">
											<Button variant="ghost" size="sm" asChild>
												<Link href={`/admin/file-monitoring/${row.fileRunId}`}>
													Open
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
								{filteredSchedules.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-24 text-center text-muted-foreground"
										>
											No schedules match the current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

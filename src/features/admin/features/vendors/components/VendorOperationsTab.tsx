"use client";

import { Fragment, useMemo, useState } from "react";

import {
	AlertTriangle,
	Bell,
	CheckCircle2,
	ChevronDown,
	Clock3,
	FileText,
	MoreHorizontal,
	RefreshCw,
	ScrollText,
	Search,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import type { FileRun } from "@/features/admin/features/file-management/mock-data";
import {
	VENDOR_ALERTS,
	type VendorAlert,
	type VendorConfigJob,
	type VendorIntegrationProfile,
	getVendorConfigJobs,
	runBucket,
	summarizeRuns,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const OPS_TABS = [
	["history", "File History"],
	["jobs", "Jobs"],
	["logs", "Processing Logs"],
	["alerts", "Alerts"],
] as const;

type OpsTab = (typeof OPS_TABS)[number][0];

type VendorOperationsTabProps = {
	vendorId: string;
	vendorName: string;
	integration: VendorIntegrationProfile;
	runs: FileRun[];
};

function ActivityStatus({ status }: { status: string }) {
	const bucket = runBucket(status as FileRun["status"]);
	if (bucket === "success")
		return (
			<span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
				Success
			</span>
		);
	if (bucket === "failed")
		return (
			<span className="inline-flex items-center rounded-md border border-red-200/80 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-900">
				Failed
			</span>
		);
	if (bucket === "warning")
		return (
			<span className="inline-flex items-center rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
				Warning
			</span>
		);
	if (bucket === "in_progress")
		return (
			<span className="inline-flex items-center rounded-md border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-900">
				In Progress
			</span>
		);
	return (
		<span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
			{status}
		</span>
	);
}

function severityTone(severity: VendorAlert["severity"]) {
	if (severity === "error")
		return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
	if (severity === "warning")
		return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
	return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200";
}

function logLevelTone(level: string) {
	const value = level.toLowerCase();
	if (value === "error") return "bg-red-100 text-red-800";
	if (value === "warn" || value === "warning")
		return "bg-amber-100 text-amber-900";
	if (value === "debug") return "bg-slate-100 text-slate-700";
	return "bg-sky-100 text-sky-800";
}

function buildFallbackAlerts(
	vendorId: string,
	vendorName: string,
	runs: FileRun[]
): VendorAlert[] {
	const failed = runs.filter((run) => runBucket(run.status) === "failed");
	const warnings = runs.filter((run) => runBucket(run.status) === "warning");
	const items: VendorAlert[] = [];

	failed.slice(0, 2).forEach((run, index) => {
		items.push({
			id: `${vendorId}-alert-fail-${index}`,
			vendorId,
			vendorName,
			title: `${run.fileType} processing failed for ${run.runId}`,
			fileName: run.fileName ?? undefined,
			when: run.completedAt ?? run.startedAt ?? run.expectedAt,
			severity: "error",
			runId: run.id,
		});
	});

	warnings.slice(0, 2).forEach((run, index) => {
		items.push({
			id: `${vendorId}-alert-warn-${index}`,
			vendorId,
			vendorName,
			title: `${run.fileType} completed with warnings`,
			fileName: run.fileName ?? undefined,
			when: run.completedAt ?? run.startedAt ?? run.expectedAt,
			severity: "warning",
			runId: run.id,
		});
	});

	if (items.length === 0 && runs[0]) {
		items.push({
			id: `${vendorId}-alert-info`,
			vendorId,
			vendorName,
			title: `Latest ${runs[0].fileType} run completed successfully`,
			fileName: runs[0].fileName ?? undefined,
			when: runs[0].completedAt ?? runs[0].expectedAt,
			severity: "info",
			runId: runs[0].id,
		});
	}

	return items;
}

export function VendorOperationsTab({
	vendorId,
	vendorName,
	integration,
	runs,
}: VendorOperationsTabProps) {
	const [opsTab, setOpsTab] = useState<OpsTab>("history");
	const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [fileTypeFilter, setFileTypeFilter] = useState("all");
	const [jobs, setJobs] = useState<VendorConfigJob[]>(() =>
		getVendorConfigJobs(vendorId, vendorName)
	);
	const [alerts, setAlerts] = useState<VendorAlert[]>(() => {
		const existing = VENDOR_ALERTS.filter((a) => a.vendorId === vendorId);
		return existing.length
			? existing
			: buildFallbackAlerts(vendorId, vendorName, runs);
	});

	const summary = useMemo(() => summarizeRuns(runs), [runs]);
	const activeJobs = jobs.filter((job) => job.status === "Active").length;
	const openAlerts = alerts.filter((a) => a.severity !== "info").length;

	const fileTypes = useMemo(
		() => Array.from(new Set(runs.map((run) => run.fileType))).sort(),
		[runs]
	);

	const filteredRuns = useMemo(() => {
		const q = search.trim().toLowerCase();
		return runs.filter((run) => {
			const bucket = runBucket(run.status);
			if (statusFilter !== "all" && bucket !== statusFilter) return false;
			if (fileTypeFilter !== "all" && run.fileType !== fileTypeFilter)
				return false;
			if (!q) return true;
			return [run.runId, run.fileType, run.fileName, run.status]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [fileTypeFilter, runs, search, statusFilter]);

	const logRows = useMemo(() => {
		return runs.flatMap((run) =>
			(run.logs ?? []).slice(0, 4).map((log, index) => ({
				id: `${run.id}-log-${index}`,
				at: log.at,
				level: log.level,
				message: log.message,
				runId: run.runId,
				fileRunId: run.id,
				component: log.component,
			}))
		);
	}, [runs]);

	const filteredLogs = useMemo(() => {
		const q = search.trim().toLowerCase();
		return logRows.filter((log) => {
			if (!q) return true;
			return [log.message, log.level, log.runId, log.component]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [logRows, search]);

	function toggleRun(runId: string) {
		setExpandedRunId((prev) => (prev === runId ? null : runId));
	}

	function toggleJob(job: VendorConfigJob) {
		const next = job.status === "Active" ? "Paused" : "Active";
		setJobs((prev) =>
			prev.map((row) => (row.id === job.id ? { ...row, status: next } : row))
		);
		toast.success(
			next === "Paused" ? `Paused “${job.name}”.` : `Resumed “${job.name}”.`
		);
	}

	function dismissAlert(alertId: string) {
		setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
		toast.success("Alert dismissed.");
	}

	return (
		<section className="min-w-0 space-y-4">
			<div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
				<div>
					<h2 className="text-lg font-semibold tracking-tight text-foreground">
						Operations Summary
					</h2>
					<p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
						Monitor file runs, jobs, logs, and alerts for {vendorName}.
					</p>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
					{[
						{
							label: "Total Runs",
							value: summary.total,
							icon: FileText,
							tone: "text-primary bg-primary/15 ring-primary/20",
						},
						{
							label: "Successful",
							value: summary.successful,
							icon: CheckCircle2,
							tone: "text-emerald-700 bg-emerald-500/15 ring-emerald-500/20",
						},
						{
							label: "Warnings",
							value: summary.warnings,
							icon: AlertTriangle,
							tone: "text-amber-700 bg-amber-500/15 ring-amber-500/20",
						},
						{
							label: "Failed",
							value: summary.failed,
							icon: XCircle,
							tone: "text-red-700 bg-red-500/15 ring-red-500/20",
						},
						{
							label: "Active Jobs",
							value: activeJobs,
							icon: Clock3,
							tone: "text-sky-700 bg-sky-500/15 ring-sky-500/20",
						},
						{
							label: "Open Alerts",
							value: openAlerts || alerts.length,
							icon: Bell,
							tone: "text-violet-700 bg-violet-500/15 ring-violet-500/20",
						},
					].map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.label}
								className="flex items-center gap-3 rounded-xl border border-border bg-card shadow-sm p-3.5"
							>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10",
										item.tone
									)}
								>
									<Icon className="size-4" />
								</div>
								<div className="min-w-0">
									<p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
										{item.value}
									</p>
									<p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
										{item.label}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<nav
				className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-4"
				aria-label="Operations sections"
			>
				{OPS_TABS.map(([id, label]) => (
					<button
						key={id}
						type="button"
						onClick={() => {
							setOpsTab(id);
							setSearch("");
							setStatusFilter("all");
							setFileTypeFilter("all");
						}}
						className={cn(
							"rounded-lg border px-2.5 py-2.5 text-center text-xs font-semibold transition-colors shadow-sm",
							opsTab === id
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
						)}
					>
						{label}
						{id === "jobs" ? (
							<span className="ml-1 font-normal opacity-80">
								({jobs.length || integration.jobsCount})
							</span>
						) : null}
						{id === "alerts" ? (
							<span className="ml-1 font-normal opacity-80">
								({alerts.length})
							</span>
						) : null}
						{id === "history" ? (
							<span className="ml-1 font-normal opacity-80">
								({runs.length})
							</span>
						) : null}
						{id === "logs" ? (
							<span className="ml-1 font-normal opacity-80">
								({logRows.length})
							</span>
						) : null}
					</button>
				))}
			</nav>

			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 p-3.5">
					{(opsTab === "history" || opsTab === "logs") && (
						<div className="relative min-w-[200px] flex-1">
							<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder={
									opsTab === "history"
										? "Search runs, files, statuses..."
										: "Search logs..."
								}
								className="h-9 pl-8"
							/>
						</div>
					)}
					{opsTab === "history" ? (
						<>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="h-9 w-[150px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="success">Successful</SelectItem>
									<SelectItem value="warning">Warnings</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
									<SelectItem value="in_progress">In Progress</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
								</SelectContent>
							</Select>
							<Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
								<SelectTrigger className="h-9 w-[170px]">
									<SelectValue placeholder="EDI type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All EDI Types</SelectItem>
									{fileTypes.map((type) => (
										<SelectItem key={type} value={type}>
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</>
					) : null}
					<div className="ml-auto flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-9"
							onClick={() => toast.success("Operations data refreshed.")}
						>
							<RefreshCw className="mr-1.5 size-3.5" />
							Refresh
						</Button>
					</div>
				</div>

				{opsTab === "history" ? (
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[980px] text-xs">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4">Run</TableHead>
									<TableHead>File Type</TableHead>
									<TableHead>File Name</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Records</TableHead>
									<TableHead className="text-right">Errors</TableHead>
									<TableHead>When</TableHead>
									<TableHead className="pr-4 text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredRuns.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-24 text-center text-muted-foreground"
										>
											No file history matches the current filters.
										</TableCell>
									</TableRow>
								) : (
									filteredRuns.map((run) => {
										const expanded = expandedRunId === run.id;
										return (
											<Fragment key={run.id}>
												<TableRow
													className={cn(
														"cursor-pointer hover:bg-muted/30",
														expanded && "bg-sky-50 dark:bg-sky-950/30"
													)}
													onClick={() => toggleRun(run.id)}
												>
													<TableCell className="pl-4">
														<span className="inline-flex items-center gap-1.5">
															<ChevronDown
																className={cn(
																	"size-3.5 text-muted-foreground transition-transform",
																	expanded && "rotate-180"
																)}
															/>
															<span className="font-mono text-xs text-primary">
																{run.runId}
															</span>
														</span>
													</TableCell>
													<TableCell className="font-medium">
														{run.fileType}
													</TableCell>
													<TableCell className="max-w-[200px] truncate font-mono text-[11px] text-muted-foreground">
														{run.fileName ?? "—"}
													</TableCell>
													<TableCell>
														<ActivityStatus status={run.status} />
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{run.records ?? "—"}
													</TableCell>
													<TableCell
														className={cn(
															"text-right tabular-nums",
															run.errorCount > 0 && "text-red-700"
														)}
													>
														{run.errorCount}
													</TableCell>
													<TableCell className="text-muted-foreground">
														{run.startedAt ?? run.expectedAt}
													</TableCell>
													<TableCell
														className="pr-4 text-right"
														onClick={(e) => e.stopPropagation()}
													>
														<div className="inline-flex items-center gap-1">
															<Button
																type="button"
																variant="outline"
																size="sm"
																className="h-7 text-xs"
																onClick={() => toggleRun(run.id)}
															>
																{expanded ? "Hide" : "View"}
															</Button>
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button
																		type="button"
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
																	<DropdownMenuItem asChild>
																		<Link
																			href={`/admin/file-monitoring/${run.id}/processing-logs`}
																		>
																			Processing logs
																		</Link>
																	</DropdownMenuItem>
																	{run.issues?.[0] ? (
																		<DropdownMenuItem asChild>
																			<Link
																				href={`/admin/file-monitoring/${run.id}/investigate/${run.issues[0].id}`}
																			>
																				Investigate
																			</Link>
																		</DropdownMenuItem>
																	) : null}
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
													</TableCell>
												</TableRow>
												{expanded ? (
													<TableRow className="bg-muted/20 hover:bg-muted/20">
														<TableCell colSpan={8} className="p-0">
															<div className="grid gap-3 border-t border-border/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
																{[
																	["Direction", run.direction],
																	["Frequency", run.frequency],
																	["Duration", run.duration ?? "—"],
																	["Protocol", run.protocol],
																	[
																		"Valid / Rejected",
																		`${run.recordsValid ?? 0} / ${run.recordsRejected ?? 0}`,
																	],
																	["Warnings", String(run.warningCount ?? 0)],
																	["Source", run.sourcePath ?? "—"],
																	["Destination", run.destinationPath ?? "—"],
																].map(([label, value]) => (
																	<div key={label}>
																		<p className="text-[11px] text-muted-foreground">
																			{label}
																		</p>
																		<p className="mt-0.5 truncate text-sm font-medium">
																			{value}
																		</p>
																	</div>
																))}
																<div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-2 pt-1">
																	<Button
																		type="button"
																		size="sm"
																		className="h-8 text-xs"
																		asChild
																	>
																		<Link
																			href={`/admin/file-monitoring/${run.id}`}
																		>
																			Open run detail
																		</Link>
																	</Button>
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		className="h-8 text-xs"
																		asChild
																	>
																		<Link
																			href={`/admin/file-monitoring/${run.id}/processing-logs`}
																		>
																			<ScrollText className="mr-1.5 size-3.5" />
																			View logs
																		</Link>
																	</Button>
																</div>
															</div>
														</TableCell>
													</TableRow>
												) : null}
											</Fragment>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				) : null}

				{opsTab === "jobs" ? (
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[920px] text-xs">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4">Job Name</TableHead>
									<TableHead>File Type</TableHead>
									<TableHead>Direction</TableHead>
									<TableHead>Frequency</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Last Run</TableHead>
									<TableHead>Next Run</TableHead>
									<TableHead className="pr-4 text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{jobs.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-24 text-center text-muted-foreground"
										>
											No jobs configured for this vendor.
										</TableCell>
									</TableRow>
								) : (
									jobs.map((job) => (
										<TableRow key={job.id} className="hover:bg-muted/30">
											<TableCell className="pl-4 font-medium">
												{job.name}
											</TableCell>
											<TableCell>{job.fileType}</TableCell>
											<TableCell>{job.direction}</TableCell>
											<TableCell>{job.frequency}</TableCell>
											<TableCell>
												<span
													className={cn(
														"inline-flex rounded-full px-1.5 py-0 text-[10px] font-medium",
														job.status === "Active"
															? "bg-emerald-100 text-emerald-800"
															: "bg-amber-100 text-amber-900"
													)}
												>
													{job.status}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{job.lastRun}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{job.nextRun}
											</TableCell>
											<TableCell className="pr-4 text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="size-8"
														>
															<MoreHorizontal className="size-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onSelect={() =>
																toast.message(`Job details for ${job.name}`)
															}
														>
															View details
														</DropdownMenuItem>
														<DropdownMenuItem onSelect={() => toggleJob(job)}>
															{job.status === "Active"
																? "Pause job"
																: "Resume job"}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onSelect={() =>
																toast.success(`Triggered “${job.name}”.`)
															}
														>
															Run now
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				) : null}

				{opsTab === "logs" ? (
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[860px] text-xs">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4">Timestamp</TableHead>
									<TableHead>Level</TableHead>
									<TableHead>Component</TableHead>
									<TableHead>Message</TableHead>
									<TableHead className="pr-4">Run</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredLogs.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-24 text-center text-muted-foreground"
										>
											No processing logs available.
										</TableCell>
									</TableRow>
								) : (
									filteredLogs.map((log) => (
										<TableRow key={log.id} className="hover:bg-muted/30">
											<TableCell className="pl-4 tabular-nums text-muted-foreground">
												{log.at}
											</TableCell>
											<TableCell>
												<span
													className={cn(
														"inline-flex rounded-full px-1.5 py-0 text-[10px] font-medium uppercase",
														logLevelTone(log.level)
													)}
												>
													{log.level}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{log.component ?? "—"}
											</TableCell>
											<TableCell className="max-w-[420px] truncate">
												{log.message}
											</TableCell>
											<TableCell className="pr-4">
												<Link
													href={`/admin/file-monitoring/${log.fileRunId}/processing-logs`}
													className="font-mono text-[11px] text-primary hover:underline"
												>
													{log.runId}
												</Link>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				) : null}

				{opsTab === "alerts" ? (
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[820px] text-xs">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4">Severity</TableHead>
									<TableHead>Alert</TableHead>
									<TableHead>File</TableHead>
									<TableHead>When</TableHead>
									<TableHead className="pr-4 text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{alerts.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-24 text-center text-muted-foreground"
										>
											No active alerts.
										</TableCell>
									</TableRow>
								) : (
									alerts.map((alert) => (
										<TableRow key={alert.id} className="hover:bg-muted/30">
											<TableCell className="pl-4">
												<span
													className={cn(
														"inline-flex rounded-full px-1.5 py-0 text-[10px] font-medium capitalize",
														severityTone(alert.severity)
													)}
												>
													{alert.severity}
												</span>
											</TableCell>
											<TableCell className="max-w-[360px] font-medium">
												{alert.title}
											</TableCell>
											<TableCell className="font-mono text-[11px] text-muted-foreground">
												{alert.fileName ?? "—"}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{alert.when}
											</TableCell>
											<TableCell className="pr-4 text-right">
												<div className="inline-flex items-center gap-1">
													{alert.runId ? (
														<Button
															type="button"
															variant="outline"
															size="sm"
															className="h-7 text-xs"
															asChild
														>
															<Link
																href={`/admin/file-monitoring/${alert.runId}`}
															>
																View run
															</Link>
														</Button>
													) : null}
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="size-7"
															>
																<MoreHorizontal className="size-3.5" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onSelect={() =>
																	toast.message("Alert assigned to ops queue")
																}
															>
																Assign
															</DropdownMenuItem>
															<DropdownMenuItem
																onSelect={() => dismissAlert(alert.id)}
															>
																Dismiss
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				) : null}

				<div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
					{opsTab === "history"
						? `Showing ${filteredRuns.length} of ${runs.length} runs`
						: opsTab === "jobs"
							? `Showing ${jobs.length} jobs · ${activeJobs} active`
							: opsTab === "logs"
								? `Showing ${filteredLogs.length} log entries`
								: `Showing ${alerts.length} alerts`}
				</div>
			</div>
		</section>
	);
}

"use client";

import { useMemo, useState } from "react";

import {
	CheckCircle2,
	Clock3,
	Download,
	FileArchive,
	FileWarning,
	Filter,
	FolderSearch,
	RefreshCw,
	Search,
	Sparkles,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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
import { inboundFilesToRuns } from "@/features/admin/features/dashboard/live-file-runs";
import {
	FILE_RUNS,
	displayRunStatus,
} from "@/features/admin/features/file-management/mock-data";
import { Link } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import {
	useInvalidateVendorCore,
	useVendorCoreInboundFiles,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#94a3b8"];

export function FileHistoryPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="File history">
				<FileHistoryDashboard />
			</VendorCoreGate>
		);
	}
	return <FileHistoryDashboard />;
}

function FileHistoryDashboard() {
	const useLive = !isMockEnabled();
	const invalidate = useInvalidateVendorCore();
	const filesQ = useVendorCoreInboundFiles();
	const vendorsQ = useVendorCoreVendors();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [search, setSearch] = useState("");
	const [vendor, setVendor] = useState("all");
	const [status, setStatus] = useState("all");
	const [direction, setDirection] = useState("all");

	const nameById = useMemo(
		() => new Map((vendorsQ.data ?? []).map((v) => [v.id, v.name])),
		[vendorsQ.data]
	);

	const programRuns = useMemo(() => {
		if (useLive) return inboundFilesToRuns(filesQ.data ?? [], nameById);
		return FILE_RUNS.filter((run) => run.program === programFilter);
	}, [useLive, filesQ.data, nameById, programFilter]);

	const vendors = useMemo(
		() => Array.from(new Set(programRuns.map((run) => run.vendor))).sort(),
		[programRuns]
	);

	const filteredRuns = useMemo(() => {
		const query = search.trim().toLowerCase();
		return programRuns
			.filter((run) => {
				if (vendor !== "all" && run.vendor !== vendor) return false;
				if (status !== "all" && run.status !== status) return false;
				if (direction !== "all" && run.direction !== direction) return false;
				if (!query) return true;
				return [
					run.vendor,
					run.fileName,
					run.fileType,
					run.runId,
					run.account,
					run.client,
				]
					.join(" ")
					.toLowerCase()
					.includes(query);
			})
			.sort(
				(a, b) =>
					new Date(b.receivedAt ?? b.expectedAt).getTime() -
					new Date(a.receivedAt ?? a.expectedAt).getTime()
			);
	}, [direction, programRuns, search, status, vendor]);

	const summary = useMemo(() => {
		const successful = filteredRuns.filter(
			(run) => run.status === "success"
		).length;
		const failed = filteredRuns.filter((run) => run.status === "failed").length;
		const warnings = filteredRuns.filter(
			(run) => run.status === "warning" || run.status === "late"
		).length;
		const processing = filteredRuns.filter(
			(run) => run.status === "processing"
		).length;
		const reviewed = filteredRuns.filter((run) => run.reviewed).length;
		const avgSize = filteredRuns.length
			? Math.round(
					filteredRuns.reduce((sum, run) => sum + (run.fileSizeKb ?? 0), 0) /
						filteredRuns.length
				)
			: 0;
		return {
			successful,
			failed,
			warnings,
			processing,
			reviewed,
			avgSize,
			total: filteredRuns.length,
		};
	}, [filteredRuns]);

	const pieData = [
		{ name: "Successful", value: summary.successful },
		{ name: "Warnings", value: summary.warnings },
		{ name: "Failed", value: summary.failed },
		{ name: "Processing", value: summary.processing },
	].filter((item) => item.value > 0);

	const recentArchive = filteredRuns.slice(0, 4);

	function clearFilters() {
		setSearch("");
		setVendor("all");
		setStatus("all");
		setDirection("all");
	}

	async function handleRefresh() {
		if (useLive) await invalidate();
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						File History
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Browse archived files and trace processing history across vendors.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild size="sm" className="h-9">
						<Link href="/admin/file-monitoring">Open File Monitoring</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						onClick={() => void handleRefresh()}
					>
						<RefreshCw className="mr-1.5 size-3.5" />
						Refresh
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Export history
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
									placeholder="File, vendor, run ID..."
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
									<SelectItem value="missing">Missing</SelectItem>
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
						label: "Archived files",
						value: summary.total,
						hint: "Total in current view",
						icon: FileArchive,
						tone: "text-primary bg-primary/10",
					},
					{
						label: "Successful",
						value: summary.successful,
						hint: "Completed cleanly",
						icon: CheckCircle2,
						tone: "text-emerald-700 bg-emerald-500/10",
					},
					{
						label: "Exceptions",
						value: summary.failed + summary.warnings,
						hint: "Warnings and failures",
						icon: FileWarning,
						tone: "text-amber-700 bg-amber-500/10",
					},
					{
						label: "Reviewed",
						value: summary.reviewed,
						hint: "Marked reviewed",
						icon: FolderSearch,
						tone: "text-sky-700 bg-sky-500/10",
					},
					{
						label: "Avg. size",
						value: `${summary.avgSize} KB`,
						hint: "Average file weight",
						icon: Clock3,
						tone: "text-violet-700 bg-violet-500/10",
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
						<CardTitle className="flex items-center gap-2 text-base">
							<Sparkles className="size-4 text-primary" />
							History distribution
						</CardTitle>
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
													: [{ name: "No Data", value: 1 }]
											}
											dataKey="value"
											nameKey="name"
											innerRadius={58}
											outerRadius={82}
											paddingAngle={2}
										>
											{(pieData.length
												? pieData
												: [{ name: "No Data", value: 1 }]
											).map((entry, index) => (
												<Cell
													key={entry.name}
													fill={PIE_COLORS[index] ?? "#cbd5e1"}
												/>
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
										Files
									</span>
								</div>
							</div>
							<div className="space-y-2">
								{pieData.map((item, index) => (
									<div
										key={item.name}
										className="flex items-center justify-between border-b border-border/40 py-2 last:border-b-0"
									>
										<div className="flex items-center gap-2">
											<span
												className="size-2.5 rounded-full"
												style={{
													backgroundColor: PIE_COLORS[index] ?? "#cbd5e1",
												}}
											/>
											<span className="text-sm font-medium">{item.name}</span>
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
						<CardTitle className="text-base">Recent archive activity</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-4">
						{recentArchive.map((run) => (
							<Link
								key={run.id}
								href={`/admin/file-monitoring/${run.id}`}
								className="block rounded-lg border border-border/50 bg-gradient-to-r from-background to-background/70 p-3 transition-colors hover:border-primary/30 hover:bg-background"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="truncate text-sm font-semibold">
											{run.fileName ?? run.runId}
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											{run.vendor} · {run.fileType}
										</p>
									</div>
									<span className="shrink-0 text-[10px] text-muted-foreground">
										{run.receivedAt ?? run.expectedAt}
									</span>
								</div>
								<div className="mt-2 flex items-center justify-between gap-3">
									<span className="text-xs text-muted-foreground">
										{run.direction} · {run.protocol}
									</span>
									<span
										className={cn(
											"inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
											run.status === "success" &&
												"bg-emerald-500/10 text-emerald-700",
											run.status === "failed" && "bg-red-500/10 text-red-700",
											run.status !== "success" &&
												run.status !== "failed" &&
												"bg-amber-500/10 text-amber-700"
										)}
									>
										{displayRunStatus(run.status)}
									</span>
								</div>
							</Link>
						))}
					</CardContent>
				</Card>
			</div>

			<Card className="bg-card/70">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<div>
						<CardTitle className="text-base">Archived file register</CardTitle>
					</div>
					<p className="text-xs text-muted-foreground">
						Showing {filteredRuns.length} files
					</p>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="bg-primary/[0.04] hover:bg-primary/[0.04]">
									<TableHead className="pl-4 text-primary sm:pl-6">
										File
									</TableHead>
									<TableHead className="text-primary">Vendor</TableHead>
									<TableHead className="text-primary">Type</TableHead>
									<TableHead className="text-primary">Status</TableHead>
									<TableHead className="text-primary">Records</TableHead>
									<TableHead className="text-primary">Size</TableHead>
									<TableHead className="text-primary">Received</TableHead>
									<TableHead className="pr-4 text-right text-primary sm:pr-6">
										Open
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredRuns.map((run) => (
									<TableRow key={run.id} className="hover:bg-muted/30">
										<TableCell className="pl-4 sm:pl-6">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">
													{run.fileName ?? run.runId}
												</p>
												<p className="truncate font-mono text-[11px] text-muted-foreground">
													{run.runId}
												</p>
											</div>
										</TableCell>
										<TableCell>{run.vendor}</TableCell>
										<TableCell>{run.fileType}</TableCell>
										<TableCell>
											<span
												className={cn(
													"inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
													run.status === "success" &&
														"bg-emerald-500/10 text-emerald-700",
													run.status === "failed" &&
														"bg-red-500/10 text-red-700",
													run.status !== "success" &&
														run.status !== "failed" &&
														"bg-amber-500/10 text-amber-700"
												)}
											>
												{displayRunStatus(run.status)}
											</span>
										</TableCell>
										<TableCell className="tabular-nums">
											{run.records ?? "—"}
										</TableCell>
										<TableCell className="tabular-nums">
											{run.fileSizeKb ?? "—"} KB
										</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{run.receivedAt ?? run.expectedAt}
										</TableCell>
										<TableCell className="pr-4 text-right sm:pr-6">
											<Button variant="ghost" size="sm" asChild>
												<Link href={`/admin/file-monitoring/${run.id}`}>
													Open
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
								{filteredRuns.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-24 text-center text-muted-foreground"
										>
											No archived files match the current filters.
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

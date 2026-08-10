"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowDownLeft,
	ArrowUpRight,
	Bell,
	CheckCircle2,
	Clock3,
	Download,
	ExternalLink,
	FileWarning,
	Files,
	MoreHorizontal,
	RefreshCw,
	XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { inboundFilesToRuns } from "@/features/admin/features/dashboard/live-file-runs";
import { vendorIdForRun } from "@/features/admin/features/vendors/vendor-integration-mock";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core";
import {
	useInvalidateVendorCore,
	useVendorCoreInboundFiles,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

import { FILE_RUNS, type FileRun } from "../mock-data";
import { VendorAvatarBadge, getVendorAvatar } from "../vendor-avatars";

type VendorHealth = {
	vendor: string;
	vendorId: string;
	expected: number;
	onTime: number;
	late: number;
	missing: number;
	errors: number;
	alerts: number;
	health: number;
};

type ActiveAlert = {
	id: string;
	title: string;
	detail: string;
	when: string;
	severity: "missing" | "late" | "warning";
	runId?: string;
};

function timeOnly(value: string | null) {
	if (!value) return null;
	const parts = value.split(" ");
	return parts.length > 1 ? parts[1]!.slice(0, 5) : value;
}

const VENDOR_HEALTH: VendorHealth[] = [
	{
		vendor: "Apex Industrial Supply",
		vendorId: "vnd-1",
		expected: 24,
		onTime: 21,
		late: 2,
		missing: 1,
		errors: 0,
		alerts: 1,
		health: 92,
	},
	{
		vendor: "Horizon Logistics",
		vendorId: "vnd-2",
		expected: 18,
		onTime: 12,
		late: 3,
		missing: 2,
		errors: 1,
		alerts: 3,
		health: 71,
	},
	{
		vendor: "NovaTech Components",
		vendorId: "vnd-3",
		expected: 30,
		onTime: 26,
		late: 2,
		missing: 1,
		errors: 1,
		alerts: 2,
		health: 86,
	},
	{
		vendor: "GreenField Organics",
		vendorId: "vnd-4",
		expected: 12,
		onTime: 7,
		late: 2,
		missing: 3,
		errors: 0,
		alerts: 3,
		health: 58,
	},
	{
		vendor: "Summit Packaging Co.",
		vendorId: "vnd-1",
		expected: 20,
		onTime: 18,
		late: 1,
		missing: 0,
		errors: 1,
		alerts: 1,
		health: 94,
	},
	{
		vendor: "BluePeak Medical",
		vendorId: "vnd-5",
		expected: 16,
		onTime: 14,
		late: 1,
		missing: 1,
		errors: 0,
		alerts: 1,
		health: 88,
	},
	{
		vendor: "Cedar Freight Partners",
		vendorId: "vnd-6",
		expected: 22,
		onTime: 15,
		late: 4,
		missing: 2,
		errors: 2,
		alerts: 4,
		health: 64,
	},
	{
		vendor: "Orbit Dental Network",
		vendorId: "vnd-7",
		expected: 10,
		onTime: 9,
		late: 1,
		missing: 0,
		errors: 0,
		alerts: 0,
		health: 96,
	},
	{
		vendor: "Riverbank Pharma",
		vendorId: "vnd-8",
		expected: 14,
		onTime: 10,
		late: 2,
		missing: 1,
		errors: 1,
		alerts: 2,
		health: 73,
	},
];

const ALERTS: ActiveAlert[] = [
	{
		id: "a1",
		title: "NovaTech Catalog – Missing",
		detail: "Weekly catalog feed not received past SLA window.",
		when: "12 minutes ago",
		severity: "missing",
		runId: "f3",
	},
	{
		id: "a2",
		title: "Horizon ASN – Late",
		detail: "Arrived 41 minutes after expected cutoff.",
		when: "28 minutes ago",
		severity: "late",
		runId: "f2",
	},
	{
		id: "a3",
		title: "GreenField Inventory – Warning",
		detail: "Schema drift detected on 4 columns.",
		when: "1 hour ago",
		severity: "warning",
		runId: "f5",
	},
	{
		id: "a4",
		title: "Horizon Claims – Missing",
		detail: "Daily claims file not delivered.",
		when: "1 hour ago",
		severity: "missing",
		runId: "f7",
	},
	{
		id: "a5",
		title: "Apex Remittance – Processing",
		detail: "Outbound remittance still in validation queue.",
		when: "2 hours ago",
		severity: "warning",
		runId: "f6",
	},
	{
		id: "a6",
		title: "BluePeak Eligibility – Late",
		detail: "834 feed arrived 22 minutes past SLA.",
		when: "3 hours ago",
		severity: "late",
		runId: "f2",
	},
	{
		id: "a7",
		title: "Cedar Freight ASN – Errors",
		detail: "7 lines failed SKU validation.",
		when: "4 hours ago",
		severity: "warning",
		runId: "f2",
	},
	{
		id: "a8",
		title: "Riverbank Claims – Missing",
		detail: "No claims file detected in the morning window.",
		when: "5 hours ago",
		severity: "missing",
		runId: "f7",
	},
];

function AlertIcon({ severity }: { severity: ActiveAlert["severity"] }) {
	if (severity === "missing")
		return <XCircle className="size-4 text-red-600" />;
	if (severity === "late") return <Clock3 className="size-4 text-amber-600" />;
	return <AlertTriangle className="size-4 text-orange-500" />;
}

function displayStatusTitle(status: FileRun["status"]) {
	if (status === "failed") return "Failed";
	if (status === "missing") return "Missing";
	if (status === "late") return "Late";
	if (status === "warning") return "Warning";
	if (status === "processing") return "Processing";
	return "Attention";
}

export function FileManagementPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="File monitoring">
				<FileManagementDashboard />
			</VendorCoreGate>
		);
	}
	return <FileManagementDashboard />;
}

function FileManagementDashboard() {
	const router = useRouter();
	const useLive = !isMockEnabled();
	const invalidate = useInvalidateVendorCore();
	const filesQ = useVendorCoreInboundFiles();
	const vendorsQ = useVendorCoreVendors();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [vendor, setVendor] = useState("all");
	const [ediType, setEdiType] = useState("all");
	const [direction, setDirection] = useState("all");
	const [status, setStatus] = useState("all");
	const [dateFrom, setDateFrom] = useState("2026-07-20");
	const [dateTo, setDateTo] = useState("2026-07-27");
	const [refreshing, setRefreshing] = useState(false);
	const [reprocessingId, setReprocessingId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 8;

	const nameById = useMemo(
		() => new Map((vendorsQ.data ?? []).map((v) => [v.id, v.name])),
		[vendorsQ.data]
	);

	const allRuns: FileRun[] = useMemo(() => {
		if (!useLive) return FILE_RUNS;
		return inboundFilesToRuns(filesQ.data ?? [], nameById);
	}, [useLive, filesQ.data, nameById]);

	const vendorHealthRows: VendorHealth[] = useMemo(() => {
		if (!useLive) return VENDOR_HEALTH;
		const byVendor = new Map<string, VendorHealth>();
		for (const run of allRuns) {
			const key = run.vendorId || run.vendor;
			const existing = byVendor.get(key) ?? {
				vendor: run.vendor,
				vendorId: run.vendorId || key,
				expected: 0,
				onTime: 0,
				late: 0,
				missing: 0,
				errors: 0,
				alerts: 0,
				health: 100,
			};
			existing.expected += 1;
			if (run.status === "success") existing.onTime += 1;
			else if (run.status === "late") existing.late += 1;
			else if (run.status === "missing") existing.missing += 1;
			if (run.errorCount > 0 || run.status === "failed") {
				existing.errors += 1;
				existing.alerts += 1;
			} else if (run.status === "warning") {
				existing.alerts += 1;
			}
			byVendor.set(key, existing);
		}
		return Array.from(byVendor.values())
			.map((row) => ({
				...row,
				health:
					row.expected === 0
						? 100
						: Math.max(
								0,
								Math.round(
									((row.onTime + row.late * 0.5) / row.expected) * 100
								)
							),
			}))
			.sort((a, b) => a.vendor.localeCompare(b.vendor));
	}, [useLive, allRuns]);

	const alerts: ActiveAlert[] = useMemo(() => {
		if (!useLive) return ALERTS;
		return allRuns
			.filter(
				(r) =>
					r.status === "failed" ||
					r.status === "missing" ||
					r.status === "late" ||
					r.status === "warning"
			)
			.slice(0, 8)
			.map((r) => ({
				id: r.id,
				title: `${r.vendor} – ${displayStatusTitle(r.status)}`,
				detail: r.fileName
					? `${r.fileName}${r.notes ? ` · ${r.notes}` : ""}`
					: (r.notes ?? "Inbound file needs attention"),
				when: r.receivedAt
					? new Date(r.receivedAt).toLocaleString()
					: "—",
				severity:
					r.status === "missing"
						? "missing"
						: r.status === "late"
							? "late"
							: "warning",
				runId: r.id,
			}));
	}, [useLive, allRuns]);

	const kpis = useMemo(() => {
		const expected = vendorHealthRows.reduce((s, v) => s + v.expected, 0);
		const onTime = vendorHealthRows.reduce((s, v) => s + v.onTime, 0);
		const late = vendorHealthRows.reduce((s, v) => s + v.late, 0);
		const missing = vendorHealthRows.reduce((s, v) => s + v.missing, 0);
		const errors = vendorHealthRows.reduce((s, v) => s + v.errors, 0);
		const alertCount = alerts.length;
		const denom = expected || 1;
		return [
			{
				label: "Total expected files",
				value: String(expected),
				hint: useLive ? "Inbound files" : "Monitored",
				icon: Files,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Received on time",
				value: `${onTime}`,
				hint: `${((onTime / denom) * 100).toFixed(1)}%`,
				icon: CheckCircle2,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Received late",
				value: String(late),
				hint: `${((late / denom) * 100).toFixed(1)}%`,
				icon: Clock3,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Missing files",
				value: String(missing),
				hint: `${((missing / denom) * 100).toFixed(1)}%`,
				icon: FileWarning,
				tone: "text-red-700 bg-red-500/10",
			},
			{
				label: "Processing errors",
				value: String(errors),
				hint: `${((errors / denom) * 100).toFixed(1)}%`,
				icon: AlertTriangle,
				tone: "text-violet-700 bg-violet-500/10",
			},
			{
				label: "Active alerts",
				value: String(alertCount),
				hint: "Needs attention",
				icon: Bell,
				tone: "text-orange-700 bg-orange-500/10",
			},
		];
	}, [vendorHealthRows, alerts.length, useLive]);

	const filteredFiles = useMemo(() => {
		return allRuns.filter((f) => {
			if (!useLive && f.program !== programFilter) return false;
			if (vendor !== "all" && f.vendor !== vendor) return false;
			if (ediType !== "all" && f.fileType !== ediType) return false;
			if (direction !== "all" && f.direction !== direction) return false;
			if (status !== "all" && f.status !== status) return false;
			return true;
		});
	}, [allRuns, vendor, ediType, direction, status, programFilter, useLive]);

	const pageCount = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
	const pageRows = filteredFiles.slice((page - 1) * pageSize, page * pageSize);

	function clearFilters() {
		setVendor("all");
		setEdiType("all");
		setDirection("all");
		setStatus("all");
		setDateFrom("2026-07-20");
		setDateTo("2026-07-27");
		setPage(1);
	}

	async function handleRefresh() {
		setRefreshing(true);
		try {
			if (useLive) await invalidate();
			else await new Promise((r) => setTimeout(r, 500));
		} finally {
			setRefreshing(false);
		}
	}

	async function handleReprocess(id: string) {
		setReprocessingId(id);
		try {
			await vendorCoreApi.reprocessInboundFile(id);
			toast.success("Reprocess queued");
			invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Reprocess failed");
		} finally {
			setReprocessingId(null);
		}
	}

	const vendors = Array.from(
		new Set(
			allRuns
				.filter((f) => useLive || f.program === programFilter)
				.map((f) => f.vendor)
		)
	);
	const types = Array.from(
		new Set(
			allRuns
				.filter((f) => useLive || f.program === programFilter)
				.map((f) => f.fileType)
		)
	);

	if (useLive && filesQ.isLoading && !filesQ.data) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-72" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Title */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						File Monitoring Dashboard
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Track file exchanges, SLAs, processing health, and active
						exceptions.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild size="sm" className="h-9">
						<Link href="/admin/file-monitoring/select">Browse file runs</Link>
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
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Export dashboard
					</Button>
				</div>
			</div>

			{/* Filters */}
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
							EDI type
						</label>
						<Select value={ediType} onValueChange={setEdiType}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{types.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
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
							Status
						</label>
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								<SelectItem value="success">Success</SelectItem>
								<SelectItem value="failed">Failed</SelectItem>
								<SelectItem value="late">Late</SelectItem>
								<SelectItem value="missing">Missing</SelectItem>
								<SelectItem value="warning">Warning</SelectItem>
								<SelectItem value="processing">Processing</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-end gap-2 xl:col-span-2">
						<Button className="h-9 flex-1" onClick={() => setPage(1)}>
							Apply filters
						</Button>
						<Button variant="ghost" className="h-9" onClick={clearFilters}>
							Clear
						</Button>
					</div>
				</div>
			</div>

			{/* KPIs — icon on the right */}
			<SummaryCardsGrid>
				{kpis.map((k) => (
					<SummaryCard
						key={k.label}
						label={k.label}
						value={k.value}
						hint={k.hint}
						icon={k.icon}
						tone={k.tone}
					/>
				))}
			</SummaryCardsGrid>

			{/* Vendor health + alerts */}
			<div className="grid gap-2 xl:grid-cols-5">
				<Card className="min-w-0 gap-1 bg-card/70 py-2 xl:col-span-3">
					<CardHeader className="px-3 pb-0.5 pt-0">
						<CardTitle className="text-sm font-medium">
							Vendor file health
						</CardTitle>
					</CardHeader>
					<CardContent className="px-0 pb-0">
						<div className="border-t border-border/50">
							<Table className="table-fixed w-full">
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="w-[28%] pl-3 sm:pl-4">
											<span className="inline-flex items-center gap-1">
												<Files className="size-3.5 shrink-0 text-primary" />
												<span className="truncate">Vendor</span>
											</span>
										</TableHead>
										<TableHead className="w-[9%] px-1 text-right">
											<span
												className="inline-flex items-center justify-end gap-0.5"
												title="Expected"
											>
												<Clock3 className="size-3.5 shrink-0 text-sky-600" />
												<span className="hidden lg:inline">Exp</span>
											</span>
										</TableHead>
										<TableHead className="w-[9%] px-1 text-right">
											<span
												className="inline-flex items-center justify-end gap-0.5"
												title="On time"
											>
												<CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
												<span className="hidden lg:inline">On</span>
											</span>
										</TableHead>
										<TableHead className="w-[9%] px-1 text-right">
											<span
												className="inline-flex items-center justify-end gap-0.5"
												title="Late"
											>
												<Clock3 className="size-3.5 shrink-0 text-amber-600" />
												<span className="hidden lg:inline">Late</span>
											</span>
										</TableHead>
										<TableHead className="w-[9%] px-1 text-right">
											<span
												className="inline-flex items-center justify-end gap-0.5"
												title="Missing"
											>
												<XCircle className="size-3.5 shrink-0 text-red-600" />
												<span className="hidden lg:inline">Miss</span>
											</span>
										</TableHead>
										<TableHead className="w-[9%] px-1 text-right">
											<span
												className="inline-flex items-center justify-end gap-0.5"
												title="Errors"
											>
												<FileWarning className="size-3.5 shrink-0 text-orange-600" />
												<span className="hidden lg:inline">Err</span>
											</span>
										</TableHead>
										<TableHead className="w-[9%] px-1 text-right">
											<span
												className="inline-flex items-center justify-end gap-0.5"
												title="Alerts"
											>
												<Bell className="size-3.5 shrink-0 text-violet-600" />
												<span className="hidden lg:inline">Alert</span>
											</span>
										</TableHead>
										<TableHead className="w-[18%] pr-3 sm:pr-4">
											<span className="inline-flex items-center gap-1">
												<CheckCircle2 className="size-3.5 shrink-0 text-primary" />
												<span className="truncate">Health</span>
											</span>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{vendorHealthRows.map((row) => {
										const avatar = getVendorAvatar({
											vendorId: row.vendorId,
											vendorName: row.vendor,
										});
										return (
											<TableRow
												key={row.vendor}
												className="cursor-pointer hover:bg-muted/30"
												onClick={() =>
													router.push(
														`/admin/file-monitoring/select?vendor=${row.vendorId}`
													)
												}
											>
												<TableCell className="pl-3 sm:pl-4">
													<div className="flex min-w-0 items-center gap-2">
														<VendorAvatarBadge
															vendorId={row.vendorId}
															vendorName={row.vendor}
															size="sm"
														/>
														<div className="min-w-0">
															<p className="truncate text-sm font-medium">
																{row.vendor}
															</p>
															<p className="truncate text-[11px] text-muted-foreground">
																{avatar.category}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums">
													{row.expected}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums text-emerald-700">
													{row.onTime}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums text-amber-700">
													{row.late}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums text-red-700">
													{row.missing}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums">
													{row.errors}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums">
													{row.alerts}
												</TableCell>
												<TableCell className="pr-3 sm:pr-4">
													<div className="flex min-w-0 items-center gap-1.5">
														<Progress
															value={row.health}
															className={cn(
																"h-1.5 min-w-0 flex-1",
																row.health >= 85
																	? "bg-emerald-500/20"
																	: row.health >= 70
																		? "bg-amber-500/20"
																		: "bg-red-500/20"
															)}
															indicatorClassName={
																row.health >= 85
																	? "bg-emerald-500"
																	: row.health >= 70
																		? "bg-amber-500"
																		: "bg-red-500"
															}
														/>
														<span
															className={cn(
																"w-7 shrink-0 text-right text-xs font-semibold tabular-nums",
																row.health >= 85
																	? "text-emerald-700"
																	: row.health >= 70
																		? "text-amber-700"
																		: "text-red-700"
															)}
														>
															{row.health}
														</span>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-1 bg-card/70 py-2 xl:col-span-2">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-sm font-medium">
							Active alerts ({alerts.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-4">
						{alerts.length === 0 ? (
							<div className="rounded-lg border border-border/50 bg-background/50 p-3 text-sm text-muted-foreground">
								No active alerts.
							</div>
						) : null}
						{alerts.map((alert) => {
							const content = (
								<div className="flex items-start gap-2">
									<div className="mt-0.5 shrink-0">
										<AlertIcon severity={alert.severity} />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-1">
											<p className="text-sm font-semibold leading-snug">
												{alert.title}
											</p>
											<span className="shrink-0 text-[10px] text-muted-foreground">
												{alert.when}
											</span>
										</div>
										<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
											{alert.detail}
										</p>
									</div>
								</div>
							);

							return alert.runId ? (
								<Link
									key={alert.id}
									href={`/admin/file-monitoring/${alert.runId}`}
									className="block rounded-lg border border-border/50 bg-background/50 p-2.5 transition-colors hover:border-primary/30 hover:bg-background"
								>
									{content}
								</Link>
							) : (
								<div
									key={alert.id}
									className="rounded-lg border border-border/50 bg-background/50 p-2.5"
								>
									{content}
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>

			{/* Recent file activity table */}
			<Card className="bg-card/70">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<div>
						<CardTitle className="text-sm font-medium">
							Recent file activity
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4 sm:pl-6">Vendor</TableHead>
									<TableHead>Account</TableHead>
									<TableHead>File type</TableHead>
									<TableHead>Direction</TableHead>
									<TableHead>Frequency</TableHead>
									<TableHead>Expected</TableHead>
									<TableHead>Received</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>File name</TableHead>
									<TableHead className="text-right">Records</TableHead>
									<TableHead className="pr-4 text-right sm:pr-6">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => {
									const vendorId = vendorIdForRun(row);
									const detailHref = `/admin/file-monitoring/${row.id}`;
									const vendorHref = vendorId
										? useLive
											? `/admin/vendors/${vendorId}`
											: `/admin/file-monitoring/select?vendor=${vendorId}`
										: "/admin/file-monitoring/select";
									return (
										<TableRow
											key={row.id}
											className="cursor-pointer hover:bg-muted/30"
											onClick={() => router.push(detailHref)}
										>
											<TableCell className="pl-4 sm:pl-6">
												<div className="flex items-center gap-2.5">
													<VendorAvatarBadge
														vendorId={vendorId}
														vendorName={row.vendor}
														size="sm"
													/>
													<span className="font-medium">{row.vendor}</span>
												</div>
											</TableCell>
											<TableCell className="font-mono text-xs text-muted-foreground">
												{row.account}
											</TableCell>
											<TableCell>{row.fileType}</TableCell>
											<TableCell>
												<span className="inline-flex items-center gap-1 text-xs capitalize text-muted-foreground">
													{row.direction === "inbound" ? (
														<ArrowDownLeft className="size-3.5 text-sky-600" />
													) : (
														<ArrowUpRight className="size-3.5 text-violet-600" />
													)}
													{row.direction}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{row.frequency}
											</TableCell>
											<TableCell className="tabular-nums">
												{useLive
													? row.expectedAt
														? new Date(row.expectedAt).toLocaleString()
														: "—"
													: timeOnly(row.expectedAt)}
											</TableCell>
											<TableCell className="tabular-nums text-muted-foreground">
												{useLive
													? row.receivedAt
														? new Date(row.receivedAt).toLocaleString()
														: "—"
													: (timeOnly(row.receivedAt) ?? "—")}
											</TableCell>
											<TableCell>
												<StatusBadge status={row.status} />
											</TableCell>
											<TableCell className="max-w-[180px] truncate font-mono text-xs">
												{row.fileName ?? "—"}
											</TableCell>
											<TableCell className="text-right tabular-nums text-muted-foreground">
												{row.records ?? "—"}
											</TableCell>
											<TableCell
												className="pr-4 text-right sm:pr-6"
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-8"
														>
															<MoreHorizontal className="size-4" />
															<span className="sr-only">Actions</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link href={detailHref}>
																<ExternalLink className="mr-2 size-3.5" />
																View run detail
															</Link>
														</DropdownMenuItem>
														{vendorId ? (
															<DropdownMenuItem asChild>
																<Link href={vendorHref}>
																	<ExternalLink className="mr-2 size-3.5" />
																	View vendor
																</Link>
															</DropdownMenuItem>
														) : null}
														{useLive ? (
															<DropdownMenuItem
																disabled={reprocessingId === row.id}
																onClick={() => void handleReprocess(row.id)}
															>
																<RefreshCw className="mr-2 size-3.5" />
																{reprocessingId === row.id
																	? "Reprocessing…"
																	: "Reprocess"}
															</DropdownMenuItem>
														) : null}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
								{pageRows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={11}
											className="h-24 text-center text-muted-foreground"
										>
											No files match the current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground sm:px-6">
						<span>
							Showing{" "}
							{filteredFiles.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
							{Math.min(page * pageSize, filteredFiles.length)} of{" "}
							{filteredFiles.length} results
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							{Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
								<Button
									key={p}
									variant={p === page ? "default" : "outline"}
									size="sm"
									className="size-8 p-0"
									onClick={() => setPage(p)}
								>
									{p}
								</Button>
							))}
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								disabled={page >= pageCount}
								onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
							>
								Next
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	CheckCircle2,
	Clock3,
	Download,
	FileWarning,
	Files,
	MoreHorizontal,
	RefreshCw,
	XCircle,
} from "lucide-react";

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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type ClaimFileStatus,
	type ClaimVendorFile,
	displayClaimStatus,
	filesForProgram,
} from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type Props = {
	direction?: "inbound" | "outbound";
	title: string;
	description: string;
};

type VendorHealthRow = {
	vendor: string;
	expected: number;
	accepted: number;
	rejected: number;
	pending: number;
	exceptions: number;
	health: number;
};

type KpiItem = {
	label: string;
	value: string;
	hint: string;
	icon: typeof Files;
	tone: string;
};

function statusBadge(status: ClaimFileStatus) {
	const tone: Record<ClaimFileStatus, string> = {
		accepted:
			"bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
		rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
		pending:
			"bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
		partial:
			"bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
		exception:
			"bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
		paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
		denied: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
	};
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-[10px] font-medium capitalize",
				tone[status]
			)}
		>
			{displayClaimStatus(status)}
		</span>
	);
}

function timeOnly(value: string | null) {
	if (!value) return "—";
	const parts = value.split(" ");
	return parts.length > 1 ? parts[1]!.slice(0, 5) : value;
}

export function ClaimVendorFilePage({ direction, title, description }: Props) {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [vendor, setVendor] = useState("all");
	const [txnType, setTxnType] = useState("all");
	const [status, setStatus] = useState("all");
	const [dateFrom, setDateFrom] = useState("2026-07-20");
	const [dateTo, setDateTo] = useState("2026-07-27");
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const pageSize = 8;

	const baseRows = useMemo(
		() => filesForProgram(programFilter, direction),
		[direction, programFilter]
	);

	const vendors = VENDOR_NAMES;

	const txnTypes = useMemo(
		() => Array.from(new Set(baseRows.map((r) => r.transactionType))).sort(),
		[baseRows]
	);

	const filteredRows = useMemo(() => {
		return baseRows.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (txnType !== "all" && row.transactionType !== txnType) return false;
			if (status !== "all" && row.status !== status) return false;
			return true;
		});
	}, [baseRows, status, txnType, vendor]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

	const kpis = useMemo((): KpiItem[] => {
		const total = filteredRows.length;
		const accepted = filteredRows.filter((r) => r.status === "accepted").length;
		const rejected = filteredRows.filter((r) => r.status === "rejected").length;
		const pending = filteredRows.filter((r) => r.status === "pending").length;
		const exceptions = filteredRows.filter(
			(r) => r.status === "exception" || r.status === "partial"
		).length;
		const records = filteredRows.reduce((s, r) => s + r.records, 0);
		const pct = (n: number) =>
			total ? `${((n / total) * 100).toFixed(1)}%` : "0%";
		return [
			{
				label: "Total files",
				value: String(total),
				hint: `${programFilter} · ${direction}`,
				icon: Files,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Accepted",
				value: String(accepted),
				hint: pct(accepted),
				icon: CheckCircle2,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Rejected",
				value: String(rejected),
				hint: pct(rejected),
				icon: XCircle,
				tone: "text-red-700 bg-red-500/10",
			},
			{
				label: "Pending",
				value: String(pending),
				hint: pct(pending),
				icon: Clock3,
				tone: "text-slate-700 bg-slate-500/10",
			},
			{
				label: "Exceptions",
				value: String(exceptions),
				hint: pct(exceptions),
				icon: FileWarning,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Total records",
				value: String(records),
				hint: "Across filtered files",
				icon: AlertTriangle,
				tone: "text-violet-700 bg-violet-500/10",
			},
		];
	}, [direction, filteredRows, programFilter]);

	const vendorHealth = useMemo((): VendorHealthRow[] => {
		const map = new Map<string, VendorHealthRow>();
		for (const row of filteredRows) {
			const current = map.get(row.vendor) ?? {
				vendor: row.vendor,
				expected: 0,
				accepted: 0,
				rejected: 0,
				pending: 0,
				exceptions: 0,
				health: 0,
			};
			current.expected += 1;
			if (row.status === "accepted") current.accepted += 1;
			else if (row.status === "rejected") current.rejected += 1;
			else if (row.status === "pending") current.pending += 1;
			else current.exceptions += 1;
			map.set(row.vendor, current);
		}
		return Array.from(map.values())
			.map((row) => ({
				...row,
				health: row.expected
					? Math.round((row.accepted / row.expected) * 100)
					: 0,
			}))
			.sort((a, b) => a.vendor.localeCompare(b.vendor));
	}, [filteredRows]);

	const alerts = useMemo(
		() =>
			filteredRows
				.filter(
					(r) =>
						r.status === "rejected" ||
						r.status === "exception" ||
						r.status === "partial"
				)
				.slice(0, 8),
		[filteredRows]
	);

	function clearFilters() {
		setVendor("all");
		setTxnType("all");
		setStatus("all");
		setDateFrom("2026-07-20");
		setDateTo("2026-07-27");
		setPage(1);
	}

	async function handleRefresh() {
		setRefreshing(true);
		await new Promise((r) => setTimeout(r, 500));
		setRefreshing(false);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						{title}
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{description} · Filtered to {programFilter}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
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
							Transaction
						</label>
						<Select value={txnType} onValueChange={setTxnType}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{txnTypes.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
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
								<SelectItem value="accepted">Accepted</SelectItem>
								<SelectItem value="rejected">Rejected</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="partial">Partial</SelectItem>
								<SelectItem value="exception">Exception</SelectItem>
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

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{kpis.map((k) => {
					const Icon = k.icon;
					return (
						<div
							key={k.label}
							className="rounded-xl border border-border bg-card p-3.5 shadow-sm"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{k.label}
									</p>
									<p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
										{k.value}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
								</div>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10",
										k.tone
									)}
								>
									<Icon className="size-4" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

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
										<TableHead className="w-[34%] pl-3 sm:pl-4">
											Vendor
										</TableHead>
										<TableHead className="w-[11%] px-1 text-right">
											Exp
										</TableHead>
										<TableHead className="w-[11%] px-1 text-right">
											Acc
										</TableHead>
										<TableHead className="w-[11%] px-1 text-right">
											Rej
										</TableHead>
										<TableHead className="w-[11%] px-1 text-right">
											Pend
										</TableHead>
										<TableHead className="w-[22%] pr-3 sm:pr-4">
											Health
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{vendorHealth.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="h-20 text-center text-muted-foreground"
											>
												No vendor data for current filters.
											</TableCell>
										</TableRow>
									) : (
										vendorHealth.map((row) => (
											<TableRow key={row.vendor} className="hover:bg-muted/30">
												<TableCell className="pl-3 font-medium sm:pl-4">
													{row.vendor}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums">
													{row.expected}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums text-emerald-700">
													{row.accepted}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums text-red-700">
													{row.rejected}
												</TableCell>
												<TableCell className="px-1 text-right text-sm tabular-nums text-slate-600">
													{row.pending}
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
										))
									)}
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
							<p className="py-6 text-center text-xs text-muted-foreground">
								No active alerts for {programFilter}.
							</p>
						) : (
							alerts.map((alert) => (
								<div
									key={alert.id}
									className="rounded-lg border border-border/50 bg-background/50 p-2.5"
								>
									<div className="flex items-start gap-2">
										<div className="mt-0.5 shrink-0">
											{alert.status === "rejected" ? (
												<XCircle className="size-4 text-red-600" />
											) : (
												<AlertTriangle className="size-4 text-amber-600" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-1">
												<p className="text-sm font-semibold leading-snug">
													{alert.vendor} · {alert.transactionType}
												</p>
												<span className="shrink-0 text-[10px] text-muted-foreground">
													{timeOnly(alert.receivedAt)}
												</span>
											</div>
											<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
												{alert.notes ??
													`${alert.rejected} rejected of ${alert.records} records · ${alert.fileId}`}
											</p>
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			<FileActivityTable
				title={`Recent ${direction} file activity`}
				rows={pageRows}
				total={filteredRows.length}
				page={page}
				pageSize={pageSize}
				pageCount={pageCount}
				onPageChange={setPage}
				emptyLabel={`No ${direction} files match the current filters.`}
			/>
		</div>
	);
}

function FileActivityTable({
	title,
	rows,
	total,
	page,
	pageSize,
	pageCount,
	onPageChange,
	emptyLabel,
}: {
	title: string;
	rows: ClaimVendorFile[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
	onPageChange: (page: number | ((p: number) => number)) => void;
	emptyLabel: string;
}) {
	return (
		<Card className="bg-card/70">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
			</CardHeader>
			<CardContent className="px-0 pb-0">
				<div className="overflow-x-auto border-t border-border/50">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="pl-4 sm:pl-6">Vendor</TableHead>
								<TableHead>File ID</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Received</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>File name</TableHead>
								<TableHead className="text-right">Records</TableHead>
								<TableHead className="text-right">Accepted</TableHead>
								<TableHead className="text-right">Rejected</TableHead>
								<TableHead className="pr-4 text-right sm:pr-6">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id} className="hover:bg-muted/30">
									<TableCell className="pl-4 font-medium sm:pl-6">
										{row.vendor}
									</TableCell>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{row.fileId}
									</TableCell>
									<TableCell>{row.transactionType}</TableCell>
									<TableCell className="tabular-nums text-muted-foreground">
										{timeOnly(row.receivedAt)}
									</TableCell>
									<TableCell>{statusBadge(row.status)}</TableCell>
									<TableCell className="max-w-[180px] truncate font-mono text-xs">
										{row.fileName}
									</TableCell>
									<TableCell className="text-right tabular-nums text-muted-foreground">
										{row.records}
									</TableCell>
									<TableCell className="text-right tabular-nums text-emerald-700">
										{row.accepted}
									</TableCell>
									<TableCell className="text-right tabular-nums text-red-700">
										{row.rejected}
									</TableCell>
									<TableCell className="pr-4 text-right sm:pr-6">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="size-8">
													<MoreHorizontal className="size-4" />
													<span className="sr-only">Actions</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem>View file detail</DropdownMenuItem>
												<DropdownMenuItem>View responses</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{rows.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={10}
										className="h-24 text-center text-muted-foreground"
									>
										{emptyLabel}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground sm:px-6">
					<span>
						Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
						{Math.min(page * pageSize, total)} of {total} results
					</span>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="sm"
							className="h-8"
							disabled={page <= 1}
							onClick={() => onPageChange((p) => Math.max(1, p - 1))}
						>
							Previous
						</Button>
						<span className="px-2 text-xs">
							{page} / {pageCount}
						</span>
						<Button
							variant="outline"
							size="sm"
							className="h-8"
							disabled={page >= pageCount}
							onClick={() => onPageChange((p) => Math.min(pageCount, p + 1))}
						>
							Next
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

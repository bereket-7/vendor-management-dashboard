"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	CheckCircle2,
	Download,
	MoreHorizontal,
	RefreshCw,
	ShieldAlert,
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
	REJECT_REASON_CATALOG,
	exceptionsForProgram,
} from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

function timeOnly(value: string) {
	const parts = value.split(" ");
	return parts.length > 1 ? parts[1]!.slice(0, 5) : value;
}

export function ExceptionsRejectionsPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [vendor, setVendor] = useState("all");
	const [severity, setSeverity] = useState("all");
	const [status, setStatus] = useState("all");
	const [dateFrom, setDateFrom] = useState("2026-07-20");
	const [dateTo, setDateTo] = useState("2026-07-27");
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const pageSize = 8;

	const baseRows = useMemo(
		() => exceptionsForProgram(programFilter),
		[programFilter]
	);

	const vendors = VENDOR_NAMES;

	const filteredRows = useMemo(() => {
		return baseRows.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (severity !== "all" && row.severity !== severity) return false;
			if (status !== "all" && row.status !== status) return false;
			return true;
		});
	}, [baseRows, severity, status, vendor]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

	const kpis = useMemo(() => {
		const total = filteredRows.length;
		const open = filteredRows.filter((r) => r.status === "open").length;
		const inProgress = filteredRows.filter(
			(r) => r.status === "in_progress"
		).length;
		const resolved = filteredRows.filter((r) => r.status === "resolved").length;
		const errors = filteredRows.filter((r) => r.severity === "error").length;
		const warnings = filteredRows.filter(
			(r) => r.severity === "warning"
		).length;
		const pct = (n: number) =>
			total ? `${((n / total) * 100).toFixed(1)}%` : "0%";
		return [
			{
				label: "Total exceptions",
				value: String(total),
				hint: programFilter,
				icon: AlertTriangle,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Open",
				value: String(open),
				hint: pct(open),
				icon: ShieldAlert,
				tone: "text-red-700 bg-red-500/10",
			},
			{
				label: "In progress",
				value: String(inProgress),
				hint: pct(inProgress),
				icon: AlertTriangle,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Resolved",
				value: String(resolved),
				hint: pct(resolved),
				icon: CheckCircle2,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Errors",
				value: String(errors),
				hint: pct(errors),
				icon: XCircle,
				tone: "text-violet-700 bg-violet-500/10",
			},
			{
				label: "Warnings",
				value: String(warnings),
				hint: pct(warnings),
				icon: AlertTriangle,
				tone: "text-orange-700 bg-orange-500/10",
			},
		];
	}, [filteredRows, programFilter]);

	const alertPreview = filteredRows
		.filter((r) => r.status === "open")
		.slice(0, 8);

	function clearFilters() {
		setVendor("all");
		setSeverity("all");
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
			<ClaimPageHeader
				title="Exceptions / Rejections"
				description={`Claim and encounter exceptions requiring review · Filtered to ${programFilter}`}
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
							Severity
						</label>
						<Select value={severity} onValueChange={setSeverity}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Severity" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All severity</SelectItem>
								<SelectItem value="error">Error</SelectItem>
								<SelectItem value="warning">Warning</SelectItem>
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
								<SelectItem value="open">Open</SelectItem>
								<SelectItem value="in_progress">In progress</SelectItem>
								<SelectItem value="resolved">Resolved</SelectItem>
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

			<ClaimKpiGrid items={kpis} />

			<div className="grid gap-2 xl:grid-cols-5">
				<Card className="min-w-0 gap-1 bg-card/70 py-2 xl:col-span-3">
					<CardHeader className="px-3 pb-0.5 pt-0">
						<CardTitle className="text-sm font-medium">
							Exception queue
						</CardTitle>
					</CardHeader>
					<CardContent className="px-0 pb-0">
						<div className="overflow-x-auto border-t border-border/50">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="pl-3 sm:pl-4">Exception</TableHead>
										<TableHead>Vendor</TableHead>
										<TableHead>Severity</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="pr-3 sm:pr-4">Detected</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pageRows.map((row) => (
										<TableRow key={row.id} className="hover:bg-muted/30">
											<TableCell className="pl-3 sm:pl-4">
												<div className="min-w-0">
													<p className="font-mono text-xs font-medium">
														{row.exceptionId}
													</p>
													<p className="truncate text-[11px] text-muted-foreground">
														{row.message}
													</p>
												</div>
											</TableCell>
											<TableCell className="text-sm">{row.vendor}</TableCell>
											<TableCell>
												<span
													className={cn(
														"inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
														row.severity === "error"
															? "bg-red-100 text-red-800"
															: "bg-amber-100 text-amber-900"
													)}
												>
													{row.severity}
												</span>
											</TableCell>
											<TableCell className="font-mono text-xs">
												{row.code}
											</TableCell>
											<TableCell className="capitalize text-sm">
												{row.status.replace("_", " ")}
											</TableCell>
											<TableCell className="pr-3 tabular-nums text-muted-foreground sm:pr-4">
												{timeOnly(row.detectedAt)}
											</TableCell>
										</TableRow>
									))}
									{pageRows.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="h-20 text-center text-muted-foreground"
											>
												No exceptions match the current filters.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
						<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground">
							<span>
								Showing{" "}
								{filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
								{Math.min(page * pageSize, filteredRows.length)} of{" "}
								{filteredRows.length} results
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
								<span className="px-2 text-xs">
									{page} / {pageCount}
								</span>
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

				<Card className="min-w-0 gap-1 bg-card/70 py-2 xl:col-span-2">
					<CardHeader className="px-3 pb-0.5 pt-0">
						<CardTitle className="text-sm font-medium">
							Open alerts ({alertPreview.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1.5 px-3">
						{alertPreview.length === 0 ? (
							<p className="py-4 text-center text-xs text-muted-foreground">
								No open alerts for {programFilter}.
							</p>
						) : (
							alertPreview.map((alert) => (
								<div
									key={alert.id}
									className="rounded-md border border-border/50 bg-background/50 px-2 py-1.5"
								>
									<div className="flex items-start gap-2">
										<div className="mt-0.5 shrink-0">
											{alert.severity === "error" ? (
												<XCircle className="size-3.5 text-red-600" />
											) : (
												<AlertTriangle className="size-3.5 text-amber-600" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-1">
												<p className="truncate text-xs font-semibold leading-tight">
													{alert.code} · {alert.vendor}
												</p>
												<div className="flex shrink-0 items-center gap-0.5">
													<span className="text-[10px] tabular-nums text-muted-foreground">
														{timeOnly(alert.detectedAt)}
													</span>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="size-6"
															>
																<MoreHorizontal className="size-3" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem>Investigate</DropdownMenuItem>
															<DropdownMenuItem>Mark resolved</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>
											<p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
												{alert.message}
											</p>
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			<Card className="gap-1 bg-card/70 py-2">
				<CardHeader className="px-3 pb-0.5 pt-0">
					<CardTitle className="text-sm font-medium">
						MFC reject reason catalog
					</CardTitle>
					<p className="text-[11px] text-muted-foreground">
						Required codes when rejecting inbound claims during review.
					</p>
				</CardHeader>
				<CardContent className="px-3">
					<div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
						{REJECT_REASON_CATALOG.map((reason) => (
							<div
								key={reason.code}
								className="rounded-md border border-border/40 px-2.5 py-1.5"
							>
								<p className="font-mono text-xs font-semibold">{reason.code}</p>
								<p className="text-[11px] text-muted-foreground">
									{reason.description}
								</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
	AlertTriangle,
	CheckCircle2,
	Download,
	MoreHorizontal,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
import { ErrorDiagnosticDetailPanel } from "@/features/admin/features/claim-encounter/components/ErrorDiagnosticDetailPanel";
import {
	type ClaimException,
	REJECT_REASON_CATALOG,
	exceptionsForProgram,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import {
	useAssignClaimExceptionMutation,
	useClaimExceptionsQuery,
	useResolveClaimExceptionMutation,
} from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { vendorCoreMe } from "@/lib/vendor-core/client";
import { useAdminModuleStore } from "@/stores/admin-module-store";

function timeOnly(value: string) {
	const parts = value.split(" ");
	return parts.length > 1 ? parts[1]!.slice(0, 5) : value;
}

export function ExceptionsRejectionsPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const mockMode = isMockEnabled();
	const exceptionsQuery = useClaimExceptionsQuery();
	const resolveMutation = useResolveClaimExceptionMutation();
	const assignMutation = useAssignClaimExceptionMutation();
	const [vendor, setVendor] = useState("all");
	const [severity, setSeverity] = useState("all");
	const [status, setStatus] = useState("all");
	const [dateFrom, setDateFrom] = useState("2026-07-20");
	const [dateTo, setDateTo] = useState("2026-07-27");
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [statusOverrides, setStatusOverrides] = useState<
		Record<string, ClaimException["status"]>
	>({});
	const [notesOverrides, setNotesOverrides] = useState<Record<string, string>>(
		{}
	);
	const [assignOverrides, setAssignOverrides] = useState<
		Record<string, string>
	>({});
	const [isXl, setIsXl] = useState(false);
	const pageSize = 8;
	const detailDismissedRef = useRef(false);

	useEffect(() => {
		const mq = window.matchMedia("(min-width: 1280px)");
		const sync = () => setIsXl(mq.matches);
		sync();
		mq.addEventListener("change", sync);
		return () => mq.removeEventListener("change", sync);
	}, []);

	const sourceRows = useMemo(() => {
		if (mockMode) return exceptionsForProgram(programFilter);
		const rows = exceptionsQuery.data ?? [];
		return rows.filter(
			(e) => e.program === programFilter || programFilter === "MDH"
		);
	}, [exceptionsQuery.data, mockMode, programFilter]);

	const baseRows = useMemo(() => {
		return sourceRows.map((row) => ({
			...row,
			status: statusOverrides[row.id] ?? row.status,
			resolutionNotes: notesOverrides[row.id] ?? row.resolutionNotes,
			assignedTo: assignOverrides[row.id] ?? row.assignedTo,
		}));
	}, [assignOverrides, notesOverrides, sourceRows, statusOverrides]);

	const vendors = VENDOR_NAMES;

	const filteredRows = useMemo(() => {
		return baseRows.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (severity !== "all" && row.severity !== severity) return false;
			if (status !== "all" && row.status !== status) return false;
			return true;
		});
	}, [baseRows, severity, status, vendor]);

	useEffect(() => {
		setPage(1);
		detailDismissedRef.current = false;
	}, [programFilter, vendor, severity, status]);

	// Open by default with the top matching exception; keep selection valid across filter changes.
	useEffect(() => {
		if (detailDismissedRef.current) return;
		if (filteredRows.length === 0) {
			setSelectedId(null);
			return;
		}
		setSelectedId((current) => {
			if (current && filteredRows.some((r) => r.id === current)) return current;
			return filteredRows[0]!.id;
		});
	}, [filteredRows]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

	const selected = useMemo(
		() => filteredRows.find((r) => r.id === selectedId) ?? null,
		[filteredRows, selectedId]
	);

	const kpis = useMemo(() => {
		const total = filteredRows.length;
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
				label: "Errors",
				value: String(errors),
				hint: pct(errors),
				icon: XCircle,
				tone: "text-red-700 bg-red-500/10",
			},
			{
				label: "Warnings",
				value: String(warnings),
				hint: pct(warnings),
				icon: AlertTriangle,
				tone: "text-orange-700 bg-orange-500/10",
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
		];
	}, [filteredRows, programFilter]);

	const alertPreview = filteredRows
		.filter((r) => r.status === "open")
		.slice(0, 8);

	const showDetail = Boolean(selected);

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
		try {
			if (!mockMode) {
				await exceptionsQuery.refetch();
			} else {
				await new Promise((r) => setTimeout(r, 500));
			}
		} finally {
			setRefreshing(false);
		}
	}

	async function handleStatusChange(
		id: string,
		nextStatus: ClaimException["status"],
		notes?: string
	) {
		if (!mockMode) {
			try {
				if (nextStatus === "resolved") {
					await resolveMutation.mutateAsync({ id, notes });
					toast.success("Exception resolved.");
				} else if (nextStatus === "in_progress") {
					const me = await vendorCoreMe();
					await assignMutation.mutateAsync({
						id,
						assigned_to_id: me.id,
					});
					const label =
						me.full_name?.trim() ||
						[me.first_name, me.last_name].filter(Boolean).join(" ").trim() ||
						me.username ||
						me.id;
					setAssignOverrides((prev) => ({ ...prev, [id]: label }));
					toast.success("Exception assigned.");
				}
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Exception update failed"
				);
				throw err;
			}
		} else if (nextStatus === "resolved") {
			toast.success("Exception marked resolved.");
		} else if (nextStatus === "in_progress") {
			toast.success("Exception marked in progress.");
		}
		setStatusOverrides((prev) => ({ ...prev, [id]: nextStatus }));
		if (notes != null) {
			setNotesOverrides((prev) => ({ ...prev, [id]: notes }));
		}
	}

	async function handleAssign(id: string) {
		if (mockMode) {
			setAssignOverrides((prev) => ({ ...prev, [id]: "You" }));
			setStatusOverrides((prev) => ({ ...prev, [id]: "in_progress" }));
			toast.success("Exception assigned (mock).");
			return;
		}
		try {
			const me = await vendorCoreMe();
			await assignMutation.mutateAsync({ id, assigned_to_id: me.id });
			const label =
				me.full_name?.trim() ||
				[me.first_name, me.last_name].filter(Boolean).join(" ").trim() ||
				me.username ||
				me.id;
			setAssignOverrides((prev) => ({ ...prev, [id]: label }));
			setStatusOverrides((prev) => ({ ...prev, [id]: "in_progress" }));
			toast.success("Exception assigned to you.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Assign failed");
		}
	}

	function closeDetail() {
		detailDismissedRef.current = true;
		setSelectedId(null);
	}

	function openDetail(id: string) {
		detailDismissedRef.current = false;
		setSelectedId(id);
	}

	const queueCard = (
		<Card className="min-w-0 gap-1 bg-card/70 py-2">
			<CardHeader className="px-3 pb-0.5 pt-0">
				<CardTitle className="text-sm font-medium">Exception queue</CardTitle>
			</CardHeader>
			<CardContent className="px-0 pb-0">
				<div className="group border-t border-border/50">
					<ScrollArea
						className="w-full"
						viewportClassName="[&>div]:!block [&>div]:w-max [&>div]:min-w-full"
						scrollbarClassName="opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=visible]:opacity-100"
						thumbClassName="bg-foreground/20 hover:bg-foreground/30"
					>
						<div className="min-w-[820px]">
							<Table containerClassName="overflow-visible">
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="pl-3 sm:pl-4">Exception</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Vendor</TableHead>
										<TableHead>Severity</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Detected</TableHead>
										<TableHead className="pr-3 sm:pr-4">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pageRows.map((row) => (
										<TableRow
											key={row.id}
											className={cn(
												"cursor-pointer hover:bg-muted/30",
												selectedId === row.id && "bg-primary/5"
											)}
											onClick={() => openDetail(row.id)}
										>
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
											<TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
												{row.category}
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
											<TableCell>
												<span
													className={cn(
														"inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
														row.status === "resolved"
															? "bg-emerald-100 text-emerald-800"
															: row.status === "in_progress"
																? "bg-sky-100 text-sky-800"
																: "bg-amber-100 text-amber-900"
													)}
												>
													{row.status.replace("_", " ")}
												</span>
											</TableCell>
											<TableCell className="tabular-nums text-muted-foreground">
												{timeOnly(row.detectedAt)}
											</TableCell>
											<TableCell className="pr-3 sm:pr-4">
												<Button
													variant="outline"
													size="sm"
													className="h-7 text-xs"
													onClick={(e) => {
														e.stopPropagation();
														openDetail(row.id);
													}}
												>
													View
												</Button>
											</TableCell>
										</TableRow>
									))}
									{pageRows.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={8}
												className="h-20 text-center text-muted-foreground"
											>
												No exceptions match the current filters.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</ScrollArea>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground">
					<span>
						Showing {filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1}{" "}
						to {Math.min(page * pageSize, filteredRows.length)} of{" "}
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
	);

	const alertsCard = (
		<Card className="min-w-0 gap-1 bg-card/70 py-2">
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
							className={cn(
								"cursor-pointer rounded-md border border-border/50 bg-background/50 px-2 py-1.5",
								selectedId === alert.id && "border-primary/40 bg-primary/5"
							)}
							onClick={() => openDetail(alert.id)}
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
														onClick={(e) => e.stopPropagation()}
													>
														<MoreHorizontal className="size-3" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															openDetail(alert.id);
														}}
													>
														Investigate
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															void handleStatusChange(alert.id, "resolved");
														}}
													>
														Mark resolved
													</DropdownMenuItem>
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
	);

	const catalogCard = (
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
	);

	return (
		<div>
			{/* Header, filters, stats and queue on the left; the diagnostic panel
			    spans the full page height starting at the very top of this row. */}
			<div
				className={cn(
					"grid items-start gap-3",
					showDetail
						? "xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,0.95fr)]"
						: ""
				)}
			>
				<div className="min-w-0 space-y-4">
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
										className={cn(
											"mr-1.5 size-3.5",
											refreshing && "animate-spin"
										)}
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

					<ClaimKpiGrid items={kpis} columns={5} />

					<div
						className={cn(
							"grid gap-2",
							showDetail ? "grid-cols-1" : "xl:grid-cols-5"
						)}
					>
						<div className={cn(showDetail ? "" : "xl:col-span-3")}>
							{queueCard}
						</div>
						<div className={cn(showDetail ? "" : "xl:col-span-2")}>
							{alertsCard}
						</div>
					</div>

					{catalogCard}
				</div>

				{selected ? (
					<div className="hidden min-h-0 xl:block">
						<div className="sticky top-3 h-[calc(100vh-4.5rem)] min-h-[640px]">
							<ErrorDiagnosticDetailPanel
								key={selected.id}
								exception={selected}
								onClose={closeDetail}
								onStatusChange={handleStatusChange}
								onAssign={handleAssign}
							/>
						</div>
					</div>
				) : null}
			</div>

			{/* Mobile / tablet sheet */}
			<Sheet
				open={Boolean(selected) && !isXl}
				onOpenChange={(open) => {
					if (!open) closeDetail();
				}}
			>
				<SheetContent
					side="right"
					className="w-full gap-0 overflow-hidden p-0 sm:max-w-lg"
				>
					<SheetHeader className="sr-only">
						<SheetTitle>Error Diagnostic Detail</SheetTitle>
					</SheetHeader>
					{selected ? (
						<div className="h-full">
							<ErrorDiagnosticDetailPanel
								key={`sheet-${selected.id}`}
								exception={selected}
								onClose={closeDetail}
								onStatusChange={handleStatusChange}
								onAssign={handleAssign}
							/>
						</div>
					) : null}
				</SheetContent>
			</Sheet>
		</div>
	);
}

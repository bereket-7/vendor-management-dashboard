"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowDownLeft,
	ArrowLeft,
	ArrowUpRight,
	CheckCircle2,
	Copy,
	Download,
	Filter,
	Info,
	RefreshCw,
	ScrollText,
	Upload,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Button } from "@/components/ui/button";
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
import {
	inboundFileToRun,
	inboundFilesToRuns,
} from "@/features/admin/features/dashboard/live-file-runs";
import { enrichLiveFileRun } from "@/features/admin/features/file-management/live-processing";
import { runBucket } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core";
import {
	useInvalidateVendorCore,
	useVendorCoreInboundFile,
	useVendorCoreInboundFiles,
	useVendorCoreValidationResults,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

import {
	FILE_RUNS,
	type FileRun,
	type ProcessStatus,
	type ValidationIssue,
	displayRunStatus,
	getFileRun,
	markFileRunReviewed,
} from "../mock-data";

function downloadTextFile(
	filename: string,
	content: string,
	mime = "text/plain"
) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

function StatusPill({ status }: { status: ProcessStatus }) {
	const bucket = runBucket(status);
	if (bucket === "success") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-800">
				<CheckCircle2 className="size-3" />
				Success
			</span>
		);
	}
	if (bucket === "failed") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0 text-[10px] font-medium text-red-800">
				<XCircle className="size-3" />
				Failed
			</span>
		);
	}
	if (bucket === "warning") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-900">
				<AlertTriangle className="size-3" />
				Warning
			</span>
		);
	}
	return (
		<span className="inline-flex items-center rounded-md border border-transparent bg-muted px-1.5 py-0 text-[10px] font-medium capitalize">
			{displayRunStatus(status)}
		</span>
	);
}

function Panel({
	title,
	children,
	action,
	className,
	id,
}: {
	title: string;
	children: ReactNode;
	action?: ReactNode;
	className?: string;
	id?: string;
}) {
	return (
		<section
			id={id}
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			<div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
				<h2 className="text-sm font-medium">{title}</h2>
				{action}
			</div>
			<div className="p-3">{children}</div>
		</section>
	);
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-0">
			<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
				{label}
			</p>
			<div className="mt-0.5 text-xs font-normal">{value}</div>
		</div>
	);
}

export function FileRunDetailPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="File run">
				<FileRunDetailBody />
			</VendorCoreGate>
		);
	}
	return <FileRunDetailBody />;
}

function FileRunDetailBody() {
	const params = useParams<{ runId: string }>();
	const router = useRouter();
	const useLive = !isMockEnabled();
	const invalidate = useInvalidateVendorCore();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const fileQ = useVendorCoreInboundFile(useLive ? params.runId : "");
	const validationQ = useVendorCoreValidationResults(
		useLive ? { inbound_file_id: params.runId } : undefined
	);
	const filesQ = useVendorCoreInboundFiles();
	const vendorsQ = useVendorCoreVendors();
	const nameById = useMemo(
		() => new Map((vendorsQ.data ?? []).map((v) => [v.id, v.name])),
		[vendorsQ.data]
	);

	const selected = useMemo(() => {
		if (!useLive) return getFileRun(params.runId);
		if (!fileQ.data) return undefined;
		const base = inboundFileToRun(fileQ.data, nameById);
		if (!validationQ.data?.length) return base;
		return enrichLiveFileRun(base, validationQ.data);
	}, [useLive, params.runId, fileQ.data, validationQ.data, nameById]);

	const liveRuns = useMemo(() => {
		if (!useLive) return FILE_RUNS;
		return inboundFilesToRuns(filesQ.data ?? [], nameById);
	}, [useLive, filesQ.data, nameById]);

	const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
	const [reviewed, setReviewed] = useState(false);
	const [page, setPage] = useState(1);
	const [showAllErrors, setShowAllErrors] = useState(false);
	const [dateRange, setDateRange] = useState("7");
	const [statusFilter, setStatusFilter] = useState("all");
	const [reprocessing, setReprocessing] = useState(false);
	const pageSize = 5;

	useEffect(() => {
		if (!selected) return;
		setReviewed(selected.reviewed);
		setSelectedIssueId(selected.issues[0]?.id ?? null);
		setPage(1);
		setShowAllErrors(false);
	}, [selected]);

	const selectHref = "/admin/file-monitoring/select";

	const recentRuns = useMemo(() => {
		if (!selected) return [];
		return liveRuns
			.filter((run) => {
				if (!useLive && run.program !== programFilter) return false;
				if (run.vendor !== selected.vendor) return false;
				if (statusFilter !== "all" && runBucket(run.status) !== statusFilter) {
					return false;
				}
				return true;
			})
			.sort((a, b) => {
				const aDate = a.startedAt ?? a.expectedAt;
				const bDate = b.startedAt ?? b.expectedAt;
				return bDate.localeCompare(aDate);
			});
	}, [selected, statusFilter, programFilter, liveRuns, useLive]);

	const selectedIssue = useMemo(
		() =>
			selected?.issues.find((i) => i.id === selectedIssueId) ??
			selected?.issues[0] ??
			null,
		[selected, selectedIssueId]
	);

	const pageCount = Math.max(
		1,
		Math.ceil((selected?.issues.length ?? 0) / pageSize)
	);
	const pageIssues =
		selected?.issues.slice((page - 1) * pageSize, page * pageSize) ?? [];
	const visibleIssues = showAllErrors ? (selected?.issues ?? []) : pageIssues;

	function selectIssue(issue: ValidationIssue) {
		setSelectedIssueId(issue.id);
		requestAnimationFrame(() => {
			document
				.getElementById("investigation-details")
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	}

	function copyGuid(run: FileRun) {
		void navigator.clipboard.writeText(run.correlationId);
		toast.success("Run GUID copied");
	}

	function downloadOriginalFile() {
		if (!selected?.fileName) return;
		const lines = [
			`# Original file: ${selected.fileName}`,
			`# Vendor: ${selected.vendor}`,
			`# Type: ${selected.fileType}`,
			`# Run: ${selected.runId}`,
			`# Correlation: ${selected.correlationId}`,
			"",
			...selected.issues.map(
				(issue, i) =>
					`${i + 1}. [${issue.severity}] ${issue.code} — ${issue.message}`
			),
		];
		downloadTextFile(
			`${selected.fileName.replace(/\.[^.]+$/, "")}.txt`,
			lines.join("\n")
		);
		toast.success("Original file download started.");
	}

	function exportErrors() {
		if (!selected) return;
		const header = "code,severity,message,field,memberId,line";
		const rows = selected.issues.map((issue) =>
			[
				issue.code,
				issue.severity,
				`"${issue.message.replace(/"/g, '""')}"`,
				issue.field ?? "",
				issue.memberId ?? "",
				issue.line ?? "",
			].join(",")
		);
		downloadTextFile(
			`${selected.runId}-errors.csv`,
			[header, ...rows].join("\n"),
			"text/csv"
		);
		toast.success("Errors exported.");
	}

	async function handleReprocess() {
		if (!selected || !useLive) return;
		setReprocessing(true);
		try {
			await vendorCoreApi.reprocessInboundFile(selected.id);
			toast.success("Reprocess queued");
			invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Reprocess failed");
		} finally {
			setReprocessing(false);
		}
	}

	if (useLive && (fileQ.isLoading || validationQ.isLoading) && !fileQ.data) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!selected) {
		return (
			<div className="space-y-4">
				<div className="rounded-lg border border-border/50 p-10 text-center">
					<p className="text-base font-medium">File run not found</p>
					{fileQ.error ? (
						<p className="mt-2 text-sm text-destructive">
							{fileQ.error.message}
						</p>
					) : null}
					<Button asChild className="mt-4" size="sm">
						<Link href="/admin/file-monitoring">Back to File Monitoring</Link>
					</Button>
				</div>
			</div>
		);
	}

	const dateRangeLabel =
		dateRange === "7"
			? "Last 7 Days (07/18/2026 - 07/24/2026)"
			: dateRange === "14"
				? "Last 14 Days"
				: "Last 30 Days";

	return (
		<div className="space-y-3 pb-20">
			{/* Header */}
			<div>
				<h1 className="text-base font-medium tracking-tight">
					File Run Details
				</h1>
				<p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">
					View detailed processing, validation results, and investigation
					information for the selected file run.
				</p>
			</div>

			{/* How to proceed */}
			<div className="flex gap-2.5 rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
				<div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-medium text-white">
					i
				</div>
				<div>
					<p className="text-xs font-medium">How to proceed</p>
					<p className="mt-0.5 text-xs text-sky-900/80 dark:text-sky-200/90">
						Select a file run from the list above to view detailed processing
						information, validation results, and investigation details.
					</p>
				</div>
			</div>

			{/* File Runs (Last 7 Days) */}
			<section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
					<h2 className="text-sm font-medium">
						File Runs (Last {dateRange} Days)
					</h2>
					<div className="flex flex-wrap items-center gap-1.5">
						<Select value={dateRange} onValueChange={setDateRange}>
							<SelectTrigger className="h-8 w-auto min-w-[220px] text-xs">
								<SelectValue>{dateRangeLabel}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7">
									Last 7 Days (07/18/2026 - 07/24/2026)
								</SelectItem>
								<SelectItem value="14">Last 14 Days</SelectItem>
								<SelectItem value="30">Last 30 Days</SelectItem>
							</SelectContent>
						</Select>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-8 w-[120px] text-xs">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								<SelectItem value="success">Success</SelectItem>
								<SelectItem value="failed">Failed</SelectItem>
								<SelectItem value="warning">Warning</SelectItem>
							</SelectContent>
						</Select>
						<Button variant="outline" size="sm" className="h-8 text-xs">
							<Filter className="mr-1.5 size-3.5" />
							Filters
						</Button>
					</div>
				</div>
				<div className="overflow-x-auto">
					<Table className="min-w-[960px] text-xs">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-8 w-10 pl-3 font-normal" />
								<TableHead className="h-8 font-normal">File Type</TableHead>
								<TableHead className="h-8 font-normal">Direction</TableHead>
								<TableHead className="h-8 font-normal">Frequency</TableHead>
								<TableHead className="h-8 font-normal">Run Date/Time</TableHead>
								<TableHead className="h-8 font-normal">Status</TableHead>
								<TableHead className="h-8 text-right font-normal">
									Records
								</TableHead>
								<TableHead className="h-8 text-right font-normal">
									Errors
								</TableHead>
								<TableHead className="h-8 text-right font-normal">
									Warnings
								</TableHead>
								<TableHead className="h-8 font-normal">File Name</TableHead>
								<TableHead className="h-8 pr-3 font-normal">Run GUID</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{recentRuns.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={11}
										className="h-16 text-center text-muted-foreground"
									>
										No file runs for this vendor in the selected window.
									</TableCell>
								</TableRow>
							) : (
								recentRuns.map((run) => {
									const isActive = run.id === selected.id;
									return (
										<TableRow
											key={run.id}
											className={cn(
												"cursor-pointer hover:bg-muted/30",
												isActive && "bg-primary/[0.06]"
											)}
											onClick={() =>
												router.push(`/admin/file-monitoring/${run.id}`)
											}
										>
											<TableCell className="pl-3">
												<input
													type="radio"
													name="file-run"
													checked={isActive}
													onChange={() =>
														router.push(`/admin/file-monitoring/${run.id}`)
													}
													className="size-3.5 accent-primary"
													aria-label={`Select run ${run.runId}`}
												/>
											</TableCell>
											<TableCell className="font-medium">
												{run.fileType}
											</TableCell>
											<TableCell>
												<span className="inline-flex items-center gap-1 text-sky-700">
													{run.direction === "inbound" ? (
														<>
															<ArrowDownLeft className="size-3" />
															Incoming
														</>
													) : (
														<>
															<ArrowUpRight className="size-3" />
															Outgoing
														</>
													)}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{run.frequency}
											</TableCell>
											<TableCell className="tabular-nums">
												{run.startedAt ?? run.expectedAt}
											</TableCell>
											<TableCell>
												<StatusPill status={run.status} />
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{run.records?.toLocaleString() ?? "—"}
											</TableCell>
											<TableCell
												className={cn(
													"text-right tabular-nums",
													run.errorCount > 0 && "font-medium text-red-700"
												)}
											>
												{run.errorCount}
											</TableCell>
											<TableCell
												className={cn(
													"text-right tabular-nums",
													run.warningCount > 0 && "font-medium text-amber-700"
												)}
											>
												{run.warningCount}
											</TableCell>
											<TableCell className="max-w-[140px] truncate font-mono text-[10px]">
												{run.fileName ?? "—"}
											</TableCell>
											<TableCell className="pr-3">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														copyGuid(run);
													}}
													className="inline-flex max-w-[120px] items-center gap-1 font-mono text-[10px] hover:text-primary"
												>
													<span className="truncate">{run.correlationId}</span>
													<Copy className="size-3 shrink-0" />
												</button>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</section>

			{/* Detailed Processing Information */}
			<Panel title="Detailed Processing Information">
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<div className="space-y-4">
						<DetailField label="Vendor" value={selected.vendor} />
						<DetailField label="Account" value={selected.account} />
						<DetailField
							label="File Name"
							value={
								<span className="font-mono text-[10px]">
									{selected.fileName ?? "—"}
								</span>
							}
						/>
						<DetailField label="File Type" value={selected.fileType} />
					</div>
					<div className="space-y-4">
						<DetailField
							label="Direction"
							value={
								<span className="inline-flex items-center gap-1">
									{selected.direction === "inbound" ? (
										<>
											<ArrowDownLeft className="size-3 text-sky-600" />
											Incoming
										</>
									) : (
										<>
											<ArrowUpRight className="size-3 text-violet-600" />
											Outgoing
										</>
									)}
								</span>
							}
						/>
						<DetailField
							label="Status"
							value={<StatusPill status={selected.status} />}
						/>
						<DetailField
							label="Run GUID"
							value={
								<button
									type="button"
									onClick={() => copyGuid(selected)}
									className="inline-flex items-center gap-1 font-mono text-[10px] hover:text-primary"
								>
									{selected.correlationId}
									<Copy className="size-3" />
								</button>
							}
						/>
						<DetailField
							label="Process Date/Time"
							value={selected.startedAt ?? selected.expectedAt}
						/>
					</div>
					<div className="space-y-4">
						<DetailField
							label="Records Received"
							value={
								<span className="tabular-nums">
									{selected.records?.toLocaleString() ?? "—"}
								</span>
							}
						/>
						<DetailField
							label="Records Loaded"
							value={
								<span className="tabular-nums">
									{selected.recordsLoaded?.toLocaleString() ?? "—"}
								</span>
							}
						/>
						<DetailField
							label="Errors"
							value={
								<span
									className={cn(
										"tabular-nums",
										selected.errorCount > 0 && "font-medium text-red-700"
									)}
								>
									{selected.errorCount}
								</span>
							}
						/>
					</div>
					<div className="space-y-4">
						<DetailField
							label="Warnings"
							value={
								<span
									className={cn(
										"tabular-nums",
										selected.warningCount > 0 && "font-medium text-amber-700"
									)}
								>
									{selected.warningCount}
								</span>
							}
						/>
						<DetailField label="Duration" value={selected.duration ?? "—"} />
					</div>
				</div>
			</Panel>

			{/* Validation Results */}
			<section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
					<h2 className="text-sm font-medium">
						Validation Results{" "}
						{selected.issues.length > 0 && (
							<span className="font-normal text-muted-foreground">
								(Showing first{" "}
								{showAllErrors
									? selected.issues.length
									: Math.min(pageSize, selected.issues.length)}{" "}
								of {selected.issues.length} errors)
							</span>
						)}
					</h2>
					{selected.issues.length > pageSize && !showAllErrors ? (
						<Button
							variant="link"
							className="h-auto p-0 text-xs text-primary"
							onClick={() => setShowAllErrors(true)}
						>
							View all errors
						</Button>
					) : null}
				</div>
				{selected.issues.length === 0 ? (
					<div className="flex items-center gap-2 px-3 py-6 text-xs text-emerald-800">
						<CheckCircle2 className="size-4 text-emerald-600" />
						No validation errors or warnings for this run.
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<Table className="text-xs">
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-8 pl-3 font-normal">
											Line #
										</TableHead>
										<TableHead className="h-8 font-normal">Member ID</TableHead>
										<TableHead className="h-8 font-normal">
											Field Name
										</TableHead>
										<TableHead className="h-8 font-normal">
											Error Code
										</TableHead>
										<TableHead className="h-8 font-normal">
											Error Description
										</TableHead>
										<TableHead className="h-8 font-normal">Severity</TableHead>
										<TableHead className="h-8 pr-3 text-right font-normal">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{visibleIssues.map((issue) => {
										const isSelected =
											(selectedIssueId ?? selected.issues[0]?.id) === issue.id;
										return (
											<TableRow
												key={issue.id}
												className={cn(
													"cursor-pointer hover:bg-muted/30",
													isSelected && "bg-primary/[0.05]"
												)}
												onClick={() => selectIssue(issue)}
											>
												<TableCell className="pl-3 tabular-nums">
													{issue.line ?? "—"}
												</TableCell>
												<TableCell className="font-mono text-[10px]">
													{issue.memberId ?? "—"}
												</TableCell>
												<TableCell>{issue.field ?? "—"}</TableCell>
												<TableCell className="font-mono text-[10px] font-medium">
													{issue.code}
												</TableCell>
												<TableCell className="max-w-[240px] text-muted-foreground">
													{issue.message}
												</TableCell>
												<TableCell>
													{issue.severity === "error" ? (
														<span className="inline-flex items-center gap-1 text-red-700">
															<XCircle className="size-3" />
															Error
														</span>
													) : issue.severity === "warning" ? (
														<span className="inline-flex items-center gap-1 text-amber-700">
															<AlertTriangle className="size-3" />
															Warning
														</span>
													) : (
														<span className="inline-flex items-center gap-1 text-sky-700">
															<Info className="size-3" />
															Info
														</span>
													)}
												</TableCell>
												<TableCell
													className="pr-3 text-right"
													onClick={(e) => e.stopPropagation()}
												>
													<Button
														variant="outline"
														size="sm"
														className="h-7 text-xs"
														asChild
													>
														<Link
															href={`/admin/file-monitoring/${selected.id}/investigate/${issue.id}`}
														>
															Investigate
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
						{!showAllErrors && pageCount > 1 ? (
							<div className="flex items-center justify-end gap-1 border-t border-border/50 px-3 py-2">
								<Button
									variant="outline"
									size="sm"
									className="h-7 w-7 p-0"
									disabled={page <= 1}
									onClick={() => setPage((p) => p - 1)}
								>
									‹
								</Button>
								{Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
									<Button
										key={p}
										variant={p === page ? "default" : "outline"}
										size="sm"
										className="h-7 w-7 p-0 text-xs"
										onClick={() => setPage(p)}
									>
										{p}
									</Button>
								))}
								<Button
									variant="outline"
									size="sm"
									className="h-7 w-7 p-0"
									disabled={page >= pageCount}
									onClick={() => setPage((p) => p + 1)}
								>
									›
								</Button>
							</div>
						) : null}
					</>
				)}
			</section>

			{/* Investigation Details */}
			{selectedIssue ? (
				<Panel
					id="investigation-details"
					title="Investigation Details"
					action={
						<Button size="sm" className="h-7 text-xs" asChild>
							<Link
								href={`/admin/file-monitoring/${selected.id}/investigate/${selectedIssue.id}`}
							>
								Open full investigation
							</Link>
						</Button>
					}
				>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Received Value
							</p>
							<p className="mt-1 font-mono text-xs font-medium text-red-700">
								{selectedIssue.receivedValue ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Expected Value
							</p>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{selectedIssue.expectedValue ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Validation Rule
							</p>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{selectedIssue.validationRule ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Recommended Resolution
							</p>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{selectedIssue.recommendedResolution ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Related Information
							</p>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{selectedIssue.relatedInformation ?? "—"}
							</p>
						</div>
					</div>
				</Panel>
			) : null}

			{/* Footer action bar */}
			<div className="sticky bottom-0 z-20 -mx-2 border-t border-border/50 bg-background/95 px-3 py-2 backdrop-blur supports-backdrop-filter:bg-background/80 sm:-mx-3">
				<div className="mx-auto flex w-full flex-wrap items-center justify-between gap-2">
					<Button variant="outline" size="sm" className="h-8 text-xs" asChild>
						<Link href={selectHref}>
							<ArrowLeft className="mr-1.5 size-3.5" />
							Back to File Runs
						</Link>
					</Button>
					<div className="flex flex-wrap items-center gap-1.5">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={downloadOriginalFile}
							disabled={!selected.fileName}
						>
							<Download className="mr-1.5 size-3.5" />
							Download Original File
						</Button>
						<Button variant="outline" size="sm" className="h-8 text-xs" asChild>
							<Link
								href={`/admin/file-monitoring/${selected.id}/processing-logs`}
							>
								<ScrollText className="mr-1.5 size-3.5" />
								Download Log
							</Link>
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={exportErrors}
							disabled={
								selected.errorCount === 0 && selected.warningCount === 0
							}
						>
							<Upload className="mr-1.5 size-3.5" />
							Export Errors
						</Button>
						{useLive ? (
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-xs"
								disabled={reprocessing}
								onClick={() => void handleReprocess()}
							>
								<RefreshCw
									className={cn(
										"mr-1.5 size-3.5",
										reprocessing && "animate-spin"
									)}
								/>
								{reprocessing ? "Reprocessing…" : "Reprocess"}
							</Button>
						) : null}
						<Button
							size="sm"
							className="h-8 text-xs"
							disabled={reviewed}
							onClick={() => {
								if (!useLive) markFileRunReviewed(selected.id, true);
								setReviewed(true);
								toast.success("File run marked as reviewed.");
							}}
						>
							<CheckCircle2 className="mr-1.5 size-3.5" />
							{reviewed ? "Reviewed" : "Mark as Reviewed"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

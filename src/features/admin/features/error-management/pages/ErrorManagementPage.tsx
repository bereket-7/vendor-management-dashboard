"use client";

import { type ReactNode, useMemo, useState } from "react";

import { Download, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Button } from "@/components/ui/button";
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
	type FileRun,
	type ValidationIssue,
} from "@/features/admin/features/file-management/mock-data";
import {
	type ErrorQueueRow,
	errorRecordsToRows,
	validationResultsToErrorRows,
} from "@/features/admin/features/error-management/live-errors";
import { Link } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { vendorCoreApi } from "@/lib/vendor-core";
import {
	useInvalidateVendorCore,
	useVendorCoreErrors,
	useVendorCoreInboundFiles,
	useVendorCoreValidationResults,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type ErrorRow = ErrorQueueRow;

function severityTone(severity: ValidationIssue["severity"]) {
	if (severity === "error") return "bg-red-600 text-white border-red-600";
	if (severity === "warning") return "bg-amber-500 text-white border-amber-500";
	return "bg-sky-600 text-white border-sky-600";
}

function rowTone(severity: ValidationIssue["severity"]) {
	return "hover:bg-muted/30";
}

function SeverityBadge({
	severity,
}: {
	severity: ValidationIssue["severity"];
}) {
	return (
		<span
			className={cn(
				"inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
				severityTone(severity)
			)}
		>
			{severity}
		</span>
	);
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-0">
			<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<div className="mt-1 truncate text-sm font-medium">{value}</div>
		</div>
	);
}

function buildErrors(runs: FileRun[]) {
	return runs.flatMap((run) =>
		run.issues.map((issue) => ({
			...issue,
			rowId: `${run.id}-${issue.id}`,
			runId: run.runId,
			vendor: run.vendor,
			fileType: run.fileType,
			timestamp: run.startedAt ?? run.expectedAt,
			statusLabel: run.status.replace(/_/g, " "),
		}))
	);
}

export function ErrorManagementPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Error management">
				<ErrorManagementBody useLive />
			</VendorCoreGate>
		);
	}
	return <ErrorManagementBody useLive={false} />;
}

function ErrorManagementBody({ useLive }: { useLive: boolean }) {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const invalidate = useInvalidateVendorCore();
	const errorsQ = useVendorCoreErrors("all", useLive);
	const validationQ = useVendorCoreValidationResults(useLive ? {} : undefined);
	const filesQ = useVendorCoreInboundFiles();
	const vendorsQ = useVendorCoreVendors();
	const [severity, setSeverity] = useState("all");
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const [refreshing, setRefreshing] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);
	const pageSize = 12;

	const nameById = useMemo(
		() => new Map((vendorsQ.data ?? []).map((v) => [v.id, v.name])),
		[vendorsQ.data]
	);
	const fileById = useMemo(
		() => new Map((filesQ.data ?? []).map((file) => [file.id, file])),
		[filesQ.data]
	);

	const rows = useMemo(() => {
		if (!useLive) {
			return buildErrors(
				FILE_RUNS.filter((run) => run.program === programFilter)
			);
		}
		const errorRows = errorRecordsToRows(errorsQ.data ?? [], {
			nameById,
			fileById,
		});
		if (errorRows.length > 0) return errorRows;
		return validationResultsToErrorRows(validationQ.data ?? [], {
			nameById,
			fileById,
		});
	}, [
		useLive,
		errorsQ.data,
		validationQ.data,
		nameById,
		fileById,
		programFilter,
	]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return rows.filter((row) => {
			if (severity !== "all" && row.severity !== severity) return false;
			if (!q) return true;
			return [
				row.vendor,
				row.runId,
				row.fileType,
				row.code,
				row.message,
				row.field,
				row.timestamp,
				row.statusLabel,
			]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [query, rows, severity]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

	const pageButtons = useMemo(() => {
		if (pageCount <= 7)
			return Array.from({ length: pageCount }, (_, i) => i + 1);
		const set = new Set(
			[1, 2, 3, 4, 5, page, pageCount, pageCount - 1].filter(
				(p) => p >= 1 && p <= pageCount
			)
		);
		return Array.from(set).sort((a, b) => a - b);
	}, [page, pageCount]);

	const errorCount = rows.filter((row) => row.severity === "error").length;
	const warningCount = rows.filter((row) => row.severity === "warning").length;
	const infoCount = rows.filter((row) => row.severity === "info").length;
	const affectedVendors = new Set(rows.map((row) => row.vendor)).size;

	async function handleRefresh() {
		setRefreshing(true);
		try {
			if (useLive) {
				await invalidate();
			} else {
				await new Promise((resolve) => setTimeout(resolve, 400));
			}
			toast.success("Error queue refreshed");
		} finally {
			setRefreshing(false);
		}
	}

	async function onRetry(id: string) {
		setBusyId(id);
		try {
			await vendorCoreApi.retryError(id);
			toast.success("Retry queued");
			await invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Retry failed");
		} finally {
			setBusyId(null);
		}
	}

	async function onResolve(id: string) {
		setBusyId(id);
		try {
			await vendorCoreApi.resolveError(id, "Resolved from error management");
			toast.success("Marked resolved");
			await invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Resolve failed");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Error Management
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Central queue for validation failures, warnings, and review items.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="h-9 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
					asChild
				>
					<Link
						href="/admin/file-monitoring"
						className="inline-flex items-center gap-1.5"
					>
						<span>Back to File Monitoring</span>
					</Link>
				</Button>
			</div>

			{useLive && (errorsQ.error ?? validationQ.error) ? (
				<div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Could not load errors:{" "}
					{(errorsQ.error ?? validationQ.error)?.message}
				</div>
			) : null}

			{useLive &&
			!errorsQ.isLoading &&
			!validationQ.isLoading &&
			(errorsQ.data?.length ?? 0) === 0 &&
			(validationQ.data?.length ?? 0) > 0 ? (
				<div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
					No error records returned yet. Showing validation results from the
					API. Run{" "}
					<code className="rounded bg-muted px-1 py-0.5 text-xs">
						pnpm seed:errors
					</code>{" "}
					after vendor-core seed endpoints are deployed.
				</div>
			) : null}

			<div className="grid gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-card to-sky-50/80 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				<MetaItem
					label="Open Errors"
					value={
						<span className="font-semibold text-red-700">{errorCount}</span>
					}
				/>
				<MetaItem
					label="Warnings"
					value={
						<span className="font-semibold text-amber-700">{warningCount}</span>
					}
				/>
				<MetaItem
					label="Info Flags"
					value={
						<span className="font-semibold text-sky-700">{infoCount}</span>
					}
				/>
				<MetaItem label="Affected Vendors" value={affectedVendors} />
				<MetaItem label="Total Cases" value={rows.length} />
				<MetaItem label="Scope" value="Validation pipeline" />
			</div>

			<div className="flex flex-wrap gap-2">
				{[
					{
						key: "all",
						label: "All",
						count: rows.length,
						className: "bg-primary text-primary-foreground border-primary",
					},
					{
						key: "error",
						label: "ERROR",
						count: errorCount,
						className: "bg-red-600 text-white border-red-600",
					},
					{
						key: "warning",
						label: "WARNING",
						count: warningCount,
						className: "bg-amber-500 text-white border-amber-500",
					},
					{
						key: "info",
						label: "INFO",
						count: infoCount,
						className: "bg-sky-600 text-white border-sky-600",
					},
				].map((chip) => (
					<button
						key={chip.key}
						type="button"
						onClick={() => {
							setSeverity(chip.key);
							setPage(1);
						}}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-opacity",
							severity === chip.key
								? chip.className
								: "border-border bg-card text-muted-foreground hover:border-primary/40",
							severity === chip.key && "ring-2 ring-offset-1 ring-primary/30"
						)}
					>
						{chip.label}
						<span
							className={cn(
								"rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
								severity === chip.key
									? "bg-white/20"
									: "bg-muted text-foreground"
							)}
						>
							{chip.count}
						</span>
					</button>
				))}
			</div>

			<div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200/70 bg-sky-50/50 p-3">
				<Select
					value={severity}
					onValueChange={(value) => {
						setSeverity(value);
						setPage(1);
					}}
				>
					<SelectTrigger className="h-9 w-[140px] border-sky-200 bg-card">
						<SelectValue placeholder="All" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="error">ERROR</SelectItem>
						<SelectItem value="warning">WARNING</SelectItem>
						<SelectItem value="info">INFO</SelectItem>
					</SelectContent>
				</Select>

				<div className="relative min-w-[220px] flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-sky-700" />
					<Input
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setPage(1);
						}}
						placeholder="Search errors..."
						className="h-9 border-sky-200 bg-card pl-8"
					/>
				</div>

				<div className="ml-auto flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-9 border-primary/30 bg-card text-primary hover:bg-primary/5"
						onClick={() => toast.message("Error export started.")}
					>
						<span className="inline-flex items-center gap-1.5">
							<Download className="size-3.5 shrink-0" />
							<span>Export Queue</span>
						</span>
					</Button>
					<Button
						size="sm"
						className="h-9"
						onClick={() => void handleRefresh()}
						disabled={refreshing || (useLive && errorsQ.isLoading && validationQ.isLoading)}
					>
						<span className="inline-flex items-center gap-1.5">
							<RefreshCw
								className={cn(
									"size-3.5 shrink-0",
									(refreshing ||
										(useLive && errorsQ.isLoading && validationQ.isLoading)) &&
										"animate-spin"
								)}
							/>
							<span>Refresh</span>
						</span>
					</Button>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="border-b-primary/20 bg-primary/[0.04] hover:bg-primary/[0.04]">
								<TableHead className="pl-4 font-semibold text-primary sm:pl-6">
									Timestamp
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Severity
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Vendor
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Code
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Message
								</TableHead>
								<TableHead className="font-semibold text-primary">
									Details
								</TableHead>
								<TableHead className="pr-4 font-semibold text-primary sm:pr-6">
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((row) => {
								const run = useLive
									? undefined
									: FILE_RUNS.find((item) => item.runId === row.runId);
								const openHref = useLive
									? row.inboundFileId
										? `/admin/file-monitoring/${row.inboundFileId}`
										: "/admin/file-monitoring"
									: run
										? `/admin/file-monitoring/${run.id}/investigate/${row.id}`
										: "/admin/file-monitoring";

								return (
									<TableRow key={row.rowId} className={rowTone(row.severity)}>
										<TableCell className="pl-4 font-mono text-xs tabular-nums text-muted-foreground sm:pl-6">
											{row.timestamp}
										</TableCell>
										<TableCell>
											<SeverityBadge severity={row.severity} />
										</TableCell>
										<TableCell>
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">
													{row.vendor}
												</p>
												<p className="truncate text-[11px] text-muted-foreground">
													{row.fileType}
												</p>
											</div>
										</TableCell>
										<TableCell className="font-mono text-xs">
											{row.code}
										</TableCell>
										<TableCell className="max-w-[340px] text-sm font-medium">
											{row.message}
										</TableCell>
										<TableCell className="max-w-[260px] text-sm text-muted-foreground">
											{[
												row.field ? `Field ${row.field}` : null,
												row.line ? `Line ${row.line}` : null,
												row.status ? `Status ${row.status}` : null,
												row.statusLabel ? `Run ${row.statusLabel}` : null,
											]
												.filter(Boolean)
												.join(" · ") || "Pending review"}
										</TableCell>
										<TableCell className="pr-4 text-right sm:pr-6">
											<div className="inline-flex flex-wrap items-center justify-end gap-1">
												<Button variant="ghost" size="sm" asChild>
													<Link href={openHref}>Open</Link>
												</Button>
												{useLive && row.retryEligible ? (
													<Button
														variant="ghost"
														size="sm"
														disabled={busyId === row.id}
														onClick={() => void onRetry(row.id)}
													>
														Retry
													</Button>
												) : null}
												{useLive && row.recordStatus === "open" ? (
													<Button
														variant="ghost"
														size="sm"
														disabled={busyId === row.id}
														onClick={() => void onResolve(row.id)}
													>
														Resolve
													</Button>
												) : null}
											</div>
										</TableCell>
									</TableRow>
								);
							})}
							{pageRows.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-24 text-center text-muted-foreground"
									>
										{useLive &&
										errorsQ.isLoading &&
										validationQ.isLoading &&
										rows.length === 0
											? "Loading errors from vendor-core…"
											: "No errors match the current filters."}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 bg-primary/[0.03] px-4 py-3 text-sm text-muted-foreground sm:px-6">
					<span>
						Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
						{Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
						queue items
					</span>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="sm"
							className="h-8 px-2"
							disabled={page <= 1}
							onClick={() => setPage((current) => Math.max(1, current - 1))}
						>
							‹
						</Button>
						{pageButtons.map((button, index) => {
							const prev = pageButtons[index - 1];
							const showEllipsis = prev != null && button - prev > 1;
							return (
								<span key={button} className="contents">
									{showEllipsis ? (
										<span className="px-1 text-muted-foreground">…</span>
									) : null}
									<Button
										variant={button === page ? "default" : "outline"}
										size="sm"
										className="size-8 p-0"
										onClick={() => setPage(button)}
									>
										{button}
									</Button>
								</span>
							);
						})}
						<Button
							variant="outline"
							size="sm"
							className="h-8 px-2"
							disabled={page >= pageCount}
							onClick={() =>
								setPage((current) => Math.min(pageCount, current + 1))
							}
						>
							›
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

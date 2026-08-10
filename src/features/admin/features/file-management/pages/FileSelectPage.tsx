"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowDownLeft,
	ArrowRight,
	ArrowUpRight,
	CheckCircle2,
	ExternalLink,
	Filter,
	MoreHorizontal,
	Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	getVendorIntegration,
	runBucket,
	runsForVendor,
	summarizeRuns,
	vendorIdForRun,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { useVendorsList } from "@/features/shared/vms/queries";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

import { FILE_RUNS, type FileRun, displayRunStatus } from "../mock-data";
import { VendorAvatarBadge, getVendorAvatar } from "../vendor-avatars";

type SelectMode = "vendor" | "filetype" | "failed";

function StatusPill({ status }: { status: FileRun["status"] }) {
	const bucket = runBucket(status);
	if (bucket === "success") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
				<CheckCircle2 className="size-3" />
				Success
			</span>
		);
	}
	if (bucket === "failed") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
				<AlertTriangle className="size-3" />
				Failed
			</span>
		);
	}
	if (bucket === "warning") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
				<AlertTriangle className="size-3" />
				Warning
			</span>
		);
	}
	if (bucket === "in_progress") {
		return (
			<span className="inline-flex items-center rounded-md border border-transparent bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
				In Progress
			</span>
		);
	}
	return (
		<span className="inline-flex items-center rounded-md border border-transparent bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
			{displayRunStatus(status)}
		</span>
	);
}

function RunActions({ run }: { run: FileRun }) {
	return (
		<div className="flex items-center justify-end gap-1">
			<Button variant="link" className="h-auto p-0 text-primary" asChild>
				<Link href={`/admin/file-monitoring/${run.id}`}>
					View Details
					<ArrowRight className="ml-1 size-3.5" />
				</Link>
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="size-8">
						<MoreHorizontal className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem asChild>
						<Link href={`/admin/file-monitoring/${run.id}`}>
							Open run details
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href={`/admin/file-monitoring/${run.id}/processing-logs`}>
							Processing logs
						</Link>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export function FileSelectPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const vendorFromUrl = searchParams.get("vendor");
	const { vendors } = useVendorsList();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [mode, setMode] = useState<SelectMode>("vendor");
	const [vendorFilter, setVendorFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [dateRange, setDateRange] = useState("7");
	const [selectedVendorId, setSelectedVendorId] = useState<string | null>(
		vendorFromUrl
	);
	const [selectedFileType, setSelectedFileType] = useState<string | null>(null);

	useEffect(() => {
		if (vendorFromUrl) {
			setSelectedVendorId(vendorFromUrl);
			setMode("vendor");
		}
	}, [vendorFromUrl]);

	const vendorCards = useMemo(() => {
		const q = search.trim().toLowerCase();
		return vendors
			.filter((v) => {
				if (vendorFilter !== "all" && v.id !== vendorFilter) return false;
				if (!q) return true;
				return (
					v.legalName.toLowerCase().includes(q) ||
					(v.tradeName ?? "").toLowerCase().includes(q) ||
					v.categories.some((c) => c.toLowerCase().includes(q))
				);
			})
			.map((v) => {
				const runs = runsForVendor(v.id, programFilter);
				const summary = summarizeRuns(runs);
				const integration = getVendorIntegration(v.id);
				return {
					vendor: v,
					runs,
					summary,
					integration,
					success: summary.successful,
					warnings: summary.warnings,
					failed: summary.failed,
				};
			});
	}, [vendors, vendorFilter, search, programFilter]);

	const activeVendorId = selectedVendorId ?? vendorCards[0]?.vendor.id ?? null;

	const activeVendorCard = vendorCards.find(
		(c) => c.vendor.id === activeVendorId
	);

	const fileTypes = useMemo(() => {
		const map = new Map<string, FileRun[]>();
		for (const run of FILE_RUNS.filter((r) => r.program === programFilter)) {
			const list = map.get(run.fileType) ?? [];
			list.push(run);
			map.set(run.fileType, list);
		}
		return Array.from(map.entries()).map(([type, runs]) => ({
			type,
			runs,
			summary: summarizeRuns(runs),
		}));
	}, [programFilter]);

	const activeFileType = selectedFileType ?? fileTypes[0]?.type ?? null;
	const activeFileTypeRuns =
		fileTypes.find((f) => f.type === activeFileType)?.runs ?? [];

	const failedRuns = useMemo(
		() =>
			FILE_RUNS.filter((r) => {
				if (r.program !== programFilter) return false;
				const bucket = runBucket(r.status);
				if (bucket !== "failed" && bucket !== "warning") return false;
				if (vendorFilter !== "all" && vendorIdForRun(r) !== vendorFilter)
					return false;
				const q = search.trim().toLowerCase();
				if (!q) return true;
				return (
					r.vendor.toLowerCase().includes(q) ||
					r.fileType.toLowerCase().includes(q) ||
					(r.fileName ?? "").toLowerCase().includes(q) ||
					r.runId.toLowerCase().includes(q)
				);
			}),
		[vendorFilter, search, programFilter]
	);

	const tabs: { id: SelectMode; label: string }[] = [
		{ id: "vendor", label: "Select by Vendor" },
		{ id: "filetype", label: "Select by EDI Type" },
		{ id: "failed", label: "Select Failed Run" },
	];

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
					Select Vendor, File, or Failed Run
				</h1>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Choose a vendor or file context, then open a recent run for details.
				</p>
			</div>

			{/* Mode tabs */}
			<nav className="flex gap-1 overflow-x-auto border-b border-border/60">
				{tabs.map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setMode(t.id)}
						className={cn(
							"shrink-0 border-b-2 px-4 pb-3 text-sm font-medium",
							mode === t.id
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground"
						)}
					>
						{t.label}
					</button>
				))}
			</nav>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-2">
				<Select value={vendorFilter} onValueChange={setVendorFilter}>
					<SelectTrigger className="h-9 w-[180px]">
						<SelectValue placeholder="All Vendors" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Vendors</SelectItem>
						{vendors.map((v) => (
							<SelectItem key={v.id} value={v.id}>
								{v.tradeName ?? v.legalName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="relative min-w-[200px] flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={
							mode === "failed"
								? "Search failed runs…"
								: mode === "filetype"
									? "Search file types…"
									: "Search vendors…"
						}
						className="h-9 pl-8"
					/>
				</div>
				<Select value={dateRange} onValueChange={setDateRange}>
					<SelectTrigger className="h-9 w-[240px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7">
							Last 7 Days (07/18/2026 - 07/24/2026)
						</SelectItem>
						<SelectItem value="14">Last 14 Days</SelectItem>
						<SelectItem value="30">Last 30 Days</SelectItem>
					</SelectContent>
				</Select>
				<Button variant="outline" size="sm" className="h-9">
					<Filter className="mr-1.5 size-3.5" />
					Filters
				</Button>
			</div>

			{/* Select by Vendor */}
			{mode === "vendor" && (
				<div className="grid gap-3 md:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
					<Card className="min-w-0 border-border/50 bg-card/70">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">
								Vendors ({vendorCards.length})
							</CardTitle>
							<CardDescription>Select a trading partner</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							{vendorCards.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No vendors match your filters.
								</p>
							) : (
								vendorCards.map((card) => {
									const selected = card.vendor.id === activeVendorId;
									const name = card.vendor.tradeName ?? card.vendor.legalName;
									const avatar = getVendorAvatar({
										vendorId: card.vendor.id,
										vendorName: name,
									});
									return (
										<button
											key={card.vendor.id}
											type="button"
											onClick={() => setSelectedVendorId(card.vendor.id)}
											className={cn(
												"flex w-full items-center gap-2 rounded-xl border p-2.5 text-left transition-colors",
												selected
													? "border-primary bg-primary/[0.06] ring-1 ring-primary/20"
													: "border-border/50 bg-background/50 hover:border-primary/30"
											)}
										>
											<VendorAvatarBadge
												vendorId={card.vendor.id}
												vendorName={name}
												size="sm"
											/>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-semibold">{name}</p>
												<p className="truncate text-[11px] text-muted-foreground">
													{avatar.category}
												</p>
											</div>
											<div
												className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold tabular-nums"
												onClick={(e) => e.stopPropagation()}
												onKeyDown={(e) => e.stopPropagation()}
											>
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="inline-flex cursor-help items-center gap-0.5 text-emerald-700">
															<span className="size-1.5 rounded-full bg-emerald-500" />
															{card.success}
														</span>
													</TooltipTrigger>
													<TooltipContent side="top">
														{card.success} successful run
														{card.success === 1 ? "" : "s"}
													</TooltipContent>
												</Tooltip>
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="inline-flex cursor-help items-center gap-0.5 text-amber-700">
															<span className="size-1.5 rounded-full bg-amber-500" />
															{card.warnings}
														</span>
													</TooltipTrigger>
													<TooltipContent side="top">
														{card.warnings} warning
														{card.warnings === 1 ? "" : "s"}
													</TooltipContent>
												</Tooltip>
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="inline-flex cursor-help items-center gap-0.5 text-red-700">
															<span className="size-1.5 rounded-full bg-red-500" />
															{card.failed}
														</span>
													</TooltipTrigger>
													<TooltipContent side="top">
														{card.failed} failed run
														{card.failed === 1 ? "" : "s"}
													</TooltipContent>
												</Tooltip>
											</div>
										</button>
									);
								})
							)}
						</CardContent>
					</Card>

					<Card className="min-w-0 border-border/50 bg-card/70">
						{activeVendorCard ? (
							<>
								<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
									<div className="flex items-center gap-3">
										<VendorAvatarBadge
											vendorId={activeVendorCard.vendor.id}
											vendorName={
												activeVendorCard.vendor.tradeName ??
												activeVendorCard.vendor.legalName
											}
											size="lg"
										/>
										<div>
											<CardTitle className="text-lg">
												{activeVendorCard.vendor.tradeName ??
													activeVendorCard.vendor.legalName}
											</CardTitle>
											<CardDescription>
												{
													getVendorAvatar({
														vendorId: activeVendorCard.vendor.id,
														vendorName:
															activeVendorCard.vendor.tradeName ??
															activeVendorCard.vendor.legalName,
													}).category
												}
											</CardDescription>
										</div>
									</div>
									<div className="flex flex-wrap gap-4 text-xs sm:text-sm">
										<span>
											<span className="text-muted-foreground">
												Total Files:{" "}
											</span>
											<span className="font-semibold">
												{activeVendorCard.summary.total}
											</span>
										</span>
										<span>
											<span className="text-muted-foreground">
												Successful:{" "}
											</span>
											<span className="font-semibold text-emerald-700">
												{activeVendorCard.summary.successful}
											</span>
										</span>
										<span>
											<span className="text-muted-foreground">Warnings: </span>
											<span className="font-semibold text-amber-700">
												{activeVendorCard.summary.warnings}
											</span>
										</span>
										<span>
											<span className="text-muted-foreground">Failed: </span>
											<span className="font-semibold text-red-700">
												{activeVendorCard.summary.failed}
											</span>
										</span>
									</div>
								</CardHeader>
								<CardContent className="px-0 pb-0">
									<div className="border-t border-border/50 px-4 py-3 sm:px-6">
										<p className="text-sm font-semibold">
											Recent File Runs (Last {dateRange} Days)
										</p>
									</div>
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow className="hover:bg-transparent">
													<TableHead className="pl-4 sm:pl-6">
														File Type
													</TableHead>
													<TableHead>Direction</TableHead>
													<TableHead>Frequency</TableHead>
													<TableHead>Last Run</TableHead>
													<TableHead>Status</TableHead>
													<TableHead className="text-right">Records</TableHead>
													<TableHead className="pr-4 text-right sm:pr-6">
														Actions
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{activeVendorCard.runs.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={7}
															className="h-20 text-center text-muted-foreground"
														>
															No runs for this vendor in the selected window.
														</TableCell>
													</TableRow>
												) : (
													activeVendorCard.runs.map((run) => (
														<TableRow
															key={run.id}
															className="cursor-pointer hover:bg-muted/30"
															onClick={() =>
																router.push(`/admin/file-monitoring/${run.id}`)
															}
														>
															<TableCell className="pl-4 font-medium sm:pl-6">
																{run.fileType}
															</TableCell>
															<TableCell>
																<span className="inline-flex items-center gap-1 text-xs capitalize">
																	{run.direction === "inbound" ? (
																		<>
																			<ArrowDownLeft className="size-3.5 text-sky-600" />
																			<span className="text-sky-700">
																				Incoming
																			</span>
																		</>
																	) : (
																		<>
																			<ArrowUpRight className="size-3.5 text-violet-600" />
																			<span className="text-violet-700">
																				Outgoing
																			</span>
																		</>
																	)}
																</span>
															</TableCell>
															<TableCell className="text-muted-foreground">
																{run.frequency}
															</TableCell>
															<TableCell className="tabular-nums text-sm">
																{run.startedAt ?? run.expectedAt}
															</TableCell>
															<TableCell>
																<StatusPill status={run.status} />
															</TableCell>
															<TableCell className="text-right tabular-nums">
																{run.records?.toLocaleString() ?? "—"}
															</TableCell>
															<TableCell
																className="pr-4 sm:pr-6"
																onClick={(e) => e.stopPropagation()}
															>
																<RunActions run={run} />
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</div>
									<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground sm:px-6">
										<span>
											Showing 1 to {activeVendorCard.runs.length} of{" "}
											{activeVendorCard.runs.length} file runs
										</span>
										<Link
											href={`/admin/vendors/${activeVendorCard.vendor.id}`}
											className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
										>
											Open vendor profile
											<ExternalLink className="size-3.5" />
										</Link>
									</div>
									<div className="mx-4 mb-4 flex gap-3 rounded-xl border border-sky-200/80 bg-sky-50/80 px-4 py-3 text-sky-950 sm:mx-6 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
										<div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
											i
										</div>
										<div>
											<p className="text-sm font-semibold">How to proceed</p>
											<p className="mt-0.5 text-sm text-sky-900/80 dark:text-sky-200/90">
												Select a file run from the list above to view processing
												information, validation results, and investigation
												details.
											</p>
										</div>
									</div>
								</CardContent>
							</>
						) : (
							<CardContent className="py-16 text-center text-sm text-muted-foreground">
								Select a vendor from the list.
							</CardContent>
						)}
					</Card>
				</div>
			)}

			{/* Select by File Type */}
			{mode === "filetype" && (
				<div className="grid gap-3 md:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
					<Card className="min-w-0 border-border/50 bg-card/70">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">
								File Types ({fileTypes.length})
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{fileTypes
								.filter((f) =>
									!search.trim()
										? true
										: f.type.toLowerCase().includes(search.trim().toLowerCase())
								)
								.map((f) => (
									<button
										key={f.type}
										type="button"
										onClick={() => setSelectedFileType(f.type)}
										className={cn(
											"flex w-full items-center justify-between rounded-xl border p-3 text-left",
											f.type === activeFileType
												? "border-primary bg-primary/[0.06] ring-1 ring-primary/20"
												: "border-border/50 hover:border-primary/30"
										)}
									>
										<div>
											<p className="text-sm font-semibold">{f.type}</p>
											<p className="text-xs text-muted-foreground">
												{f.runs.length} runs
											</p>
										</div>
										<div className="flex gap-2 text-[11px] font-semibold">
											<span className="text-emerald-700">
												{f.summary.successful}
											</span>
											<span className="text-amber-700">
												{f.summary.warnings}
											</span>
											<span className="text-red-700">{f.summary.failed}</span>
										</div>
									</button>
								))}
						</CardContent>
					</Card>
					<Card className="min-w-0 border-border/50 bg-card/70">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">
								{activeFileType} — Recent Runs
							</CardTitle>
						</CardHeader>
						<CardContent className="px-0 pb-0">
							<div className="overflow-x-auto border-t border-border/50">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="pl-4 sm:pl-6">Vendor</TableHead>
											<TableHead>Direction</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Last Run</TableHead>
											<TableHead className="pr-4 text-right sm:pr-6">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{activeFileTypeRuns.map((run) => (
											<TableRow key={run.id}>
												<TableCell className="pl-4 font-medium sm:pl-6">
													{run.vendor}
												</TableCell>
												<TableCell className="capitalize">
													{run.direction === "inbound"
														? "Incoming"
														: "Outgoing"}
												</TableCell>
												<TableCell>
													<StatusPill status={run.status} />
												</TableCell>
												<TableCell className="tabular-nums text-sm">
													{run.startedAt ?? run.expectedAt}
												</TableCell>
												<TableCell className="pr-4 sm:pr-6">
													<RunActions run={run} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Select Failed Run */}
			{mode === "failed" && (
				<Card className="border-border/50 bg-card/70">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">
							Failed & Warning Runs ({failedRuns.length})
						</CardTitle>
						<CardDescription>
							Select a failed or warning run to continue to File Run Details
						</CardDescription>
					</CardHeader>
					<CardContent className="px-0 pb-0">
						<div className="overflow-x-auto border-t border-border/50">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="pl-4 sm:pl-6">Vendor</TableHead>
										<TableHead>File Type</TableHead>
										<TableHead>File Name</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Errors</TableHead>
										<TableHead>When</TableHead>
										<TableHead className="pr-4 text-right sm:pr-6">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{failedRuns.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={7}
												className="h-24 text-center text-muted-foreground"
											>
												No failed or warning runs match your filters.
											</TableCell>
										</TableRow>
									) : (
										failedRuns.map((run) => (
											<TableRow key={run.id} className="hover:bg-muted/30">
												<TableCell className="pl-4 font-medium sm:pl-6">
													{run.vendor}
												</TableCell>
												<TableCell>{run.fileType}</TableCell>
												<TableCell className="font-mono text-xs">
													{run.fileName ?? "—"}
												</TableCell>
												<TableCell>
													<StatusPill status={run.status} />
												</TableCell>
												<TableCell className="text-right font-semibold tabular-nums text-red-700">
													{run.errorCount}
												</TableCell>
												<TableCell className="tabular-nums text-sm text-muted-foreground">
													{run.startedAt ?? run.expectedAt}
												</TableCell>
												<TableCell className="pr-4 sm:pr-6">
													<RunActions run={run} />
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* How to proceed (file type / failed modes) */}
			{mode !== "vendor" && (
				<div className="flex gap-3 rounded-xl border border-sky-200/80 bg-sky-50/80 px-4 py-3 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
					<div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
						i
					</div>
					<div>
						<p className="text-sm font-semibold">How to proceed</p>
						<p className="mt-0.5 text-sm text-sky-900/80 dark:text-sky-200/90">
							Select a file run from the list above to open File Run Details
							(processing, validation results, and investigation).
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

"use client";

import { useMemo, useState } from "react";

import {
	ArrowRight,
	Banknote,
	CheckCircle2,
	CircleDollarSign,
	ClipboardList,
	Clock3,
	Database,
	Download,
	FileText,
	FileWarning,
	Files,
	Info,
	MoreHorizontal,
	Percent,
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
	type ClaimKpiItem,
	ClaimPageHeader,
} from "@/features/admin/features/claim-encounter/components/ClaimPageChrome";
import {
	type ClaimResponse,
	downloadTextFile,
	exportRowsAsCsv,
	filesForProgram,
	formatCount,
	responsesForProgram,
	vendorPerformanceForProgram,
} from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type ResponseTab =
	| "all"
	| "paid"
	| "rejected"
	| "partial"
	| "pending"
	| "exceptions";

const RESPONSE_TABS: { id: ResponseTab; label: string }[] = [
	{ id: "all", label: "All Responses" },
	{ id: "paid", label: "Paid" },
	{ id: "rejected", label: "Rejected" },
	{ id: "partial", label: "Partially Paid" },
	{ id: "pending", label: "Pending" },
	{ id: "exceptions", label: "Exceptions" },
];

function matchesResponseTab(row: ClaimResponse, tab: ResponseTab) {
	if (tab === "all") return true;
	if (tab === "paid") return row.status === "paid";
	if (tab === "rejected") return row.status === "rejected";
	if (tab === "partial") return row.status === "partial";
	if (tab === "pending") return row.status === "pending";
	return row.status === "exception";
}

function acceptancePct(row: ClaimResponse) {
	if (!row.totalSubmitted) return 0;
	return (
		Math.round(((row.paid + row.partialPaid) / row.totalSubmitted) * 1000) / 10
	);
}

type ClaimDirectionFileDashboardProps = {
	direction: "inbound" | "outbound";
	title: string;
	description: string;
};

export function ClaimDirectionFileDashboard({
	direction,
	title,
	description,
}: ClaimDirectionFileDashboardProps) {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [vendor, setVendor] = useState("all");
	const [fileType, setFileType] = useState("all");
	const [status, setStatus] = useState("all");
	const [dateFrom, setDateFrom] = useState("2026-07-20");
	const [dateTo, setDateTo] = useState("2026-07-27");
	const [refreshing, setRefreshing] = useState(false);
	const [responseTab, setResponseTab] = useState<ResponseTab>("all");
	const [page, setPage] = useState(1);
	const pageSize = 8;

	const directionFiles = useMemo(
		() => filesForProgram(programFilter, direction),
		[direction, programFilter]
	);

	const vendors = VENDOR_NAMES;

	const fileTypes = useMemo(
		() =>
			Array.from(new Set(directionFiles.map((r) => r.fileTypeLabel))).sort(),
		[directionFiles]
	);

	const filteredFiles = useMemo(() => {
		return directionFiles.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (fileType !== "all" && row.fileTypeLabel !== fileType) return false;
			if (status !== "all" && row.status !== status) return false;
			return true;
		});
	}, [directionFiles, fileType, status, vendor]);

	const vendorSummary = useMemo(() => {
		const rows = vendorPerformanceForProgram(programFilter, direction);
		return rows.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (fileType !== "all" && row.fileType !== fileType) return false;
			return true;
		});
	}, [direction, fileType, programFilter, vendor]);

	const responseRows = useMemo(() => {
		return responsesForProgram(programFilter, direction).filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (fileType !== "all" && row.claimType !== fileType) return false;
			return matchesResponseTab(row, responseTab);
		});
	}, [direction, fileType, programFilter, responseTab, vendor]);

	const pageCount = Math.max(1, Math.ceil(responseRows.length / pageSize));
	const pageRows = responseRows.slice((page - 1) * pageSize, page * pageSize);

	const isInbound = direction === "inbound";
	const filesLabel = isInbound
		? "Total Vendor Files Received"
		: "Total Vendor Files Sent";
	const filesHint = isInbound
		? "Inbound vendor files"
		: "Outbound vendor files";
	const submittedHint = isInbound
		? "Submitted to Gainwell"
		: "Sent to trading partners";
	const filesColumnLabel = isInbound ? "Files Received" : "Files Sent";
	const submittedColumnLabel = isInbound
		? "Submitted to Gainwell"
		: "Sent / Submitted";
	const responseFocus = isInbound
		? "Focus on Gainwell response files only."
		: "Focus on outbound response and remittance files.";
	const analyticsScope = isInbound
		? "Core rate formulas used across inbound claim monitoring."
		: "Core rate formulas used across outbound claim monitoring.";
	const level1RecordsLabel = isInbound
		? "Records received"
		: "Records prepared";
	const level1SubmitLabel = isInbound ? "Sent to Gainwell" : "Sent outbound";
	const level1AcceptedLabel = isInbound
		? "Accepted by Gainwell"
		: "Accepted / acknowledged";

	const kpis = useMemo((): ClaimKpiItem[] => {
		const filesCount = filteredFiles.length;
		const submitted = filteredFiles.reduce((s, f) => s + f.submitted, 0);
		const accepted = filteredFiles.reduce((s, f) => s + f.accepted, 0);
		const rejected = filteredFiles.reduce((s, f) => s + f.rejected, 0);
		const partial = filteredFiles.reduce((s, f) => s + f.partial, 0);
		const paid = filteredFiles.reduce((s, f) => s + f.paid, 0);
		const denied = filteredFiles.reduce((s, f) => s + f.denied, 0);
		const acceptanceRate = submitted
			? Math.round((accepted / submitted) * 1000) / 10
			: 0;
		const rejectionRate = submitted
			? Math.round((rejected / submitted) * 1000) / 10
			: 0;
		const avgResponse = filteredFiles.length
			? Math.round(
					filteredFiles.reduce((s, f) => s + (f.avgResponseMinutes ?? 0), 0) /
						filteredFiles.length
				)
			: 0;

		return [
			{
				label: filesLabel,
				value: formatCount(filesCount),
				hint: `${programFilter} · ${filesHint}`,
				icon: Files,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Total Claims / Encounters Submitted",
				value: formatCount(submitted),
				hint: submittedHint,
				icon: ClipboardList,
				tone: "text-sky-700 bg-sky-500/10",
			},
			{
				label: isInbound
					? "Total Accepted by Gainwell"
					: "Total Accepted / Acknowledged",
				value: formatCount(accepted),
				hint: `${acceptanceRate}% of submitted`,
				icon: CheckCircle2,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Total Rejected",
				value: formatCount(rejected),
				hint: `${rejectionRate}% of submitted`,
				icon: XCircle,
				tone: "text-red-700 bg-red-500/10",
			},
			{
				label: "Total Partially Paid / Partial Accepted",
				value: formatCount(partial),
				hint: "Partial outcomes",
				icon: FileWarning,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Total Paid",
				value: formatCount(paid),
				hint: "Paid claims",
				icon: CircleDollarSign,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Total Denied",
				value: formatCount(denied),
				hint: "Denied after accept",
				icon: Banknote,
				tone: "text-violet-700 bg-violet-500/10",
			},
			{
				label: "Acceptance Rate",
				value: `${acceptanceRate}%`,
				hint: "Accepted / Submitted",
				icon: Percent,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Rejection Rate",
				value: `${rejectionRate}%`,
				hint: "Rejected / Submitted",
				icon: Percent,
				tone: "text-red-700 bg-red-500/10",
			},
			{
				label: "Avg Response Time",
				value: `${avgResponse}m`,
				hint: "Mean acknowledgement latency",
				icon: Clock3,
				tone: "text-orange-700 bg-orange-500/10",
			},
		];
	}, [
		filesHint,
		filesLabel,
		filteredFiles,
		isInbound,
		programFilter,
		submittedHint,
	]);

	function clearFilters() {
		setVendor("all");
		setFileType("all");
		setStatus("all");
		setDateFrom("2026-07-20");
		setDateTo("2026-07-27");
		setPage(1);
	}

	async function handleRefresh() {
		setRefreshing(true);
		await new Promise((r) => setTimeout(r, 500));
		setRefreshing(false);
		toast.success("Dashboard refreshed");
	}

	function handleExportDashboard() {
		exportRowsAsCsv(
			`${direction}-${programFilter.toLowerCase()}-responses.csv`,
			[
				"Response File",
				"Submission Batch",
				"Vendor",
				"Claim Type",
				"Total Submitted",
				"Paid",
				"Rejected",
				"Partial Paid",
				"Pending",
				"Acceptance %",
				"Response Date",
			],
			responseRows.map((row) => [
				row.responseFile,
				row.submissionBatch,
				row.vendor,
				row.claimType,
				row.totalSubmitted,
				row.paid,
				row.rejected,
				row.partialPaid,
				row.pending,
				acceptancePct(row),
				row.receivedAt,
			])
		);
		toast.success("Dashboard exported");
	}

	function handleDownloadResponse(row: ClaimResponse) {
		downloadTextFile(
			row.responseFile,
			[
				`ISA*00*          *00*          *ZZ*GAINWELL       *ZZ*${row.vendor.toUpperCase()}*`,
				`GS*HP*GAINWELL*${row.vendor.toUpperCase()}*20260725*1200*1*X*005010X221A1~`,
				`ST*835*0001~`,
				`BPR*I*${row.paid}*C*ACH*CCP*01*999999999*DA*123456789*`,
				`REF*F2*${row.responseId}~`,
				`SE*4*0001~`,
				`GE*1*1~`,
				`IEA*1*000000001~`,
			].join("\n")
		);
		toast.success(`Downloaded ${row.responseFile}`);
	}

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title={title}
				description={`${description} · Filtered to ${programFilter}`}
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
						<Button
							variant="outline"
							size="sm"
							className="h-9"
							onClick={handleExportDashboard}
						>
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
							File type
						</label>
						<Select value={fileType} onValueChange={setFileType}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{fileTypes.map((t) => (
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
								<SelectItem value="paid">Paid</SelectItem>
								<SelectItem value="denied">Denied</SelectItem>
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

			<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

			{/* Vendor Summary Table */}
			<Card className="min-w-0 gap-1 bg-card/70 py-2">
				<CardHeader className="px-3 pb-0.5 pt-0">
					<CardTitle className="text-sm font-medium">Vendor summary</CardTitle>
					<p className="text-xs text-muted-foreground">
						Quick view of which vendor is having problems.
					</p>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-3 sm:pl-4">Vendor</TableHead>
									<TableHead>File Type</TableHead>
									<TableHead className="text-right">
										{filesColumnLabel}
									</TableHead>
									<TableHead className="text-right">
										{submittedColumnLabel}
									</TableHead>
									<TableHead className="text-right">Accepted</TableHead>
									<TableHead className="text-right">Rejected</TableHead>
									<TableHead className="text-right">Partial</TableHead>
									<TableHead className="pr-3 sm:pr-4">
										Acceptance Rate
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{vendorSummary.map((row) => (
									<TableRow
										key={`${row.vendor}-${row.fileType}`}
										className="hover:bg-muted/30"
									>
										<TableCell className="pl-3 font-medium sm:pl-4">
											{row.vendor}
										</TableCell>
										<TableCell>{row.fileType}</TableCell>
										<TableCell className="text-right tabular-nums">
											{formatCount(row.filesReceived)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{formatCount(row.submittedToGainwell)}
										</TableCell>
										<TableCell className="text-right tabular-nums text-emerald-700">
											{formatCount(row.accepted)}
										</TableCell>
										<TableCell className="text-right tabular-nums text-red-700">
											{formatCount(row.rejected)}
										</TableCell>
										<TableCell className="text-right tabular-nums text-amber-700">
											{formatCount(row.partial)}
										</TableCell>
										<TableCell className="pr-3 sm:pr-4">
											<div className="flex min-w-0 items-center gap-1.5">
												<Progress
													value={row.acceptanceRate}
													className={cn(
														"h-1.5 min-w-0 flex-1",
														row.acceptanceRate >= 96
															? "bg-emerald-500/20"
															: row.acceptanceRate >= 90
																? "bg-amber-500/20"
																: "bg-red-500/20"
													)}
													indicatorClassName={
														row.acceptanceRate >= 96
															? "bg-emerald-500"
															: row.acceptanceRate >= 90
																? "bg-amber-500"
																: "bg-red-500"
													}
												/>
												<span
													className={cn(
														"w-12 shrink-0 text-right text-xs font-semibold tabular-nums",
														row.acceptanceRate >= 96
															? "text-emerald-700"
															: row.acceptanceRate >= 90
																? "text-amber-700"
																: "text-red-700"
													)}
												>
													{row.acceptanceRate}%
												</span>
											</div>
										</TableCell>
									</TableRow>
								))}
								{vendorSummary.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-20 text-center text-muted-foreground"
										>
											No vendor summary for current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* C. Response Dashboard */}
			<Card className="bg-card/70">
				<CardHeader className="space-y-3 pb-3">
					<div>
						<CardTitle className="text-sm font-medium">
							Response dashboard
						</CardTitle>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{responseFocus}
						</p>
					</div>
					<div className="flex flex-wrap gap-1.5">
						{RESPONSE_TABS.map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => {
									setResponseTab(tab.id);
									setPage(1);
								}}
								className={cn(
									"rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
									responseTab === tab.id
										? "bg-primary text-primary-foreground"
										: "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
								)}
							>
								{tab.label}
							</button>
						))}
					</div>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4 sm:pl-6">Response File</TableHead>
									<TableHead>Submission Batch</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Claim Type</TableHead>
									<TableHead className="text-right">Total Submitted</TableHead>
									<TableHead className="text-right">Paid</TableHead>
									<TableHead className="text-right">Rejected</TableHead>
									<TableHead className="text-right">Partial Paid</TableHead>
									<TableHead className="text-right">Pending</TableHead>
									<TableHead className="text-right">Acceptance %</TableHead>
									<TableHead>Response Date</TableHead>
									<TableHead className="pr-4 text-right sm:pr-6">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => (
									<TableRow
										key={row.id}
										className="cursor-pointer hover:bg-muted/30"
									>
										<TableCell className="max-w-[180px] truncate pl-4 font-mono text-xs sm:pl-6">
											<Link
												href={`/admin/claim-encounter/responses/${row.id}`}
												className="text-primary hover:underline"
												onClick={(e) => e.stopPropagation()}
											>
												{row.responseFile}
											</Link>
										</TableCell>
										<TableCell className="font-mono text-xs text-muted-foreground">
											<Link
												href={`/admin/claim-encounter/batches/${encodeURIComponent(row.submissionBatch)}`}
												className="hover:text-foreground hover:underline"
												onClick={(e) => e.stopPropagation()}
											>
												{row.submissionBatch}
											</Link>
										</TableCell>
										<TableCell className="font-medium">{row.vendor}</TableCell>
										<TableCell>{row.claimType}</TableCell>
										<TableCell className="text-right tabular-nums">
											{formatCount(row.totalSubmitted)}
										</TableCell>
										<TableCell className="text-right tabular-nums text-emerald-700">
											{formatCount(row.paid)}
										</TableCell>
										<TableCell className="text-right tabular-nums text-red-700">
											{formatCount(row.rejected)}
										</TableCell>
										<TableCell className="text-right tabular-nums text-amber-700">
											{formatCount(row.partialPaid)}
										</TableCell>
										<TableCell className="text-right tabular-nums text-slate-600">
											{formatCount(row.pending)}
										</TableCell>
										<TableCell className="text-right font-semibold tabular-nums text-emerald-700">
											{acceptancePct(row)}%
										</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{row.receivedAt}
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
														<Link
															href={`/admin/claim-encounter/responses/${row.id}`}
														>
															View response
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem asChild>
														<Link
															href={`/admin/claim-encounter/batches/${encodeURIComponent(row.submissionBatch)}`}
														>
															View submission batch
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleDownloadResponse(row)}
													>
														Download file
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
								{pageRows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={12}
											className="h-24 text-center text-muted-foreground"
										>
											No responses match the current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground sm:px-6">
						<span>
							Showing{" "}
							{responseRows.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
							{Math.min(page * pageSize, responseRows.length)} of{" "}
							{responseRows.length} results
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

			{/* D. Claims Display Levels */}
			<Card className="bg-card/70">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-medium">
						D. Claims display levels
					</CardTitle>
					<p className="text-xs text-muted-foreground">
						Drill from file → batch/submission → individual claim.
					</p>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
						<DisplayLevelCard
							step="1"
							title="Level 1 — File Level"
							icon={FileText}
							iconTone="text-sky-700 bg-sky-500/10"
						>
							<p className="mb-2 text-sm font-semibold">
								UST Healthcare Medical Claims File
							</p>
							<ul className="space-y-1 text-xs text-muted-foreground">
								<li>
									{level1RecordsLabel}: {formatCount(22125)}
								</li>
								<li>Validated: {formatCount(21990)}</li>
								<li>
									{level1SubmitLabel}: {formatCount(21980)}
								</li>
								<li className="font-medium text-emerald-700">
									{level1AcceptedLabel}: {formatCount(21200)}
								</li>
								<li className="font-medium text-red-700">
									Rejected: {formatCount(780)}
								</li>
								<li className="font-medium text-emerald-700">
									Acceptance rate: 96.45%
								</li>
							</ul>
						</DisplayLevelCard>

						<div className="hidden items-center justify-center lg:flex">
							<ArrowRight className="size-5 text-sky-600" />
						</div>

						<DisplayLevelCard
							step="2"
							title="Level 2 — Batch / Submission Level"
							icon={Database}
							iconTone="text-emerald-700 bg-emerald-500/10"
						>
							<ul className="space-y-1 text-xs text-muted-foreground">
								<li>
									Batch ID:{" "}
									<span className="font-mono text-foreground">
										GW_SUB_20260725_001
									</span>
								</li>
								<li>Vendor: UST Healthcare</li>
								<li>Claims submitted: {formatCount(21980)}</li>
								<li>Response received: Yes</li>
								<li className="font-medium text-emerald-700">
									Accepted: {formatCount(21200)}
								</li>
								<li className="font-medium text-red-700">
									Rejected: {formatCount(780)}
								</li>
							</ul>
						</DisplayLevelCard>

						<div className="hidden items-center justify-center lg:flex">
							<ArrowRight className="size-5 text-sky-600" />
						</div>

						<DisplayLevelCard
							step="3"
							title="Level 3 — Claim Level"
							icon={ClipboardList}
							iconTone="text-violet-700 bg-violet-500/10"
						>
							<div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
								<span>Claim ID</span>
								<span>Amount billed</span>
								<span>Member ID</span>
								<span>Amount paid</span>
								<span>Provider</span>
								<span>Submission status</span>
								<span>Vendor</span>
								<span>Gainwell response status</span>
								<span>Account</span>
								<span>Reject reason</span>
								<span>Claim type</span>
								<span>Response file name</span>
								<span>Date of service</span>
								<span>Trace ID / control number</span>
							</div>
						</DisplayLevelCard>
					</div>
				</CardContent>
			</Card>

			{/* E. Acceptance Analytics */}
			<Card className="bg-card/70">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-medium">
						E. Acceptance analytics
					</CardTitle>
					<p className="text-xs text-muted-foreground">{analyticsScope}</p>
				</CardHeader>
				<CardContent className="space-y-2">
					{[
						{
							label: "Acceptance Rate",
							formula: "(Accepted Claims / Total Submitted Claims) × 100",
							icon: CheckCircle2,
							tone: "text-emerald-700 bg-emerald-500/10",
						},
						{
							label: "Rejection Rate",
							formula: "(Rejected Claims / Total Submitted Claims) × 100",
							icon: XCircle,
							tone: "text-red-700 bg-red-500/10",
						},
						{
							label: "Partial Acceptance Rate",
							formula:
								"(Partially Paid / Partially Accepted Claims / Total Submitted Claims) × 100",
							icon: FileWarning,
							tone: "text-amber-700 bg-amber-500/10",
						},
						{
							label: "Payment Rate",
							formula: "(Paid Claims / Total Submitted Claims) × 100",
							icon: CircleDollarSign,
							tone: "text-sky-700 bg-sky-500/10",
						},
					].map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.label}
								className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-2.5"
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
									<p className="text-sm font-semibold">{item.label}</p>
									<p className="mt-0.5 font-mono text-xs text-muted-foreground">
										{item.formula}
									</p>
								</div>
							</div>
						);
					})}
					<div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs text-sky-800 dark:text-sky-200">
						<Info className="mt-0.5 size-3.5 shrink-0" />
						<span>
							Can be calculated by vendor, file, account, date range, or claim
							type.
						</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function DisplayLevelCard({
	step,
	title,
	icon: Icon,
	iconTone,
	children,
}: {
	step: string;
	title: string;
	icon: typeof FileText;
	iconTone: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-lg border border-border/50 bg-background/50 p-3">
			<div className="mb-2 flex items-center gap-2">
				<div
					className={cn(
						"flex size-8 items-center justify-center rounded-lg",
						iconTone
					)}
				>
					<Icon className="size-4" />
				</div>
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
						{step}.
					</p>
					<p className="text-sm font-semibold leading-tight">{title}</p>
				</div>
			</div>
			{children}
		</div>
	);
}

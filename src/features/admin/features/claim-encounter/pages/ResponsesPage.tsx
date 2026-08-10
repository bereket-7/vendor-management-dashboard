"use client";

import { useMemo, useState } from "react";

import {
	CheckCircle2,
	Download,
	MessageSquareReply,
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
	type ClaimFileStatus,
	displayClaimStatus,
	exportRowsAsCsv,
	responsesForProgram,
} from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

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

function timeOnly(value: string) {
	const parts = value.split(" ");
	return parts.length > 1 ? parts[1]!.slice(0, 5) : value;
}

export function ResponsesPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [vendor, setVendor] = useState("all");
	const [responseType, setResponseType] = useState("all");
	const [status, setStatus] = useState("all");
	const [dateFrom, setDateFrom] = useState("2026-07-20");
	const [dateTo, setDateTo] = useState("2026-07-27");
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const pageSize = 8;

	const baseRows = useMemo(
		() => responsesForProgram(programFilter),
		[programFilter]
	);

	const vendors = VENDOR_NAMES;

	const filteredRows = useMemo(() => {
		return baseRows.filter((row) => {
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (responseType !== "all" && row.responseType !== responseType)
				return false;
			if (status !== "all" && row.status !== status) return false;
			return true;
		});
	}, [baseRows, responseType, status, vendor]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

	const kpis = useMemo(() => {
		const total = filteredRows.length;
		const accepted = filteredRows.filter((r) => r.status === "accepted").length;
		const rejected = filteredRows.filter((r) => r.status === "rejected").length;
		const acceptedRecords = filteredRows.reduce(
			(s, r) => s + r.acceptedCount,
			0
		);
		const rejectedRecords = filteredRows.reduce(
			(s, r) => s + r.rejectedCount,
			0
		);
		const pending = filteredRows.filter((r) => r.status === "pending").length;
		const pct = (n: number) =>
			total ? `${((n / total) * 100).toFixed(1)}%` : "0%";
		return [
			{
				label: "Total responses",
				value: String(total),
				hint: programFilter,
				icon: MessageSquareReply,
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
				icon: MessageSquareReply,
				tone: "text-slate-700 bg-slate-500/10",
			},
			{
				label: "Accepted claims",
				value: String(acceptedRecords),
				hint: "Across responses",
				icon: CheckCircle2,
				tone: "text-sky-700 bg-sky-500/10",
			},
			{
				label: "Rejected claims",
				value: String(rejectedRecords),
				hint: "Across responses",
				icon: XCircle,
				tone: "text-orange-700 bg-orange-500/10",
			},
		];
	}, [filteredRows, programFilter]);

	function clearFilters() {
		setVendor("all");
		setResponseType("all");
		setStatus("all");
		setDateFrom("2026-07-20");
		setDateTo("2026-07-27");
		setPage(1);
	}

	async function handleRefresh() {
		setRefreshing(true);
		await new Promise((r) => setTimeout(r, 500));
		setRefreshing(false);
		toast.success("Responses refreshed");
	}

	function handleExportDashboard() {
		exportRowsAsCsv(
			`responses-${programFilter.toLowerCase()}.csv`,
			[
				"Vendor",
				"Response ID",
				"Related File",
				"Type",
				"Received",
				"Status",
				"Accepted",
				"Rejected",
				"Summary",
			],
			filteredRows.map((row) => [
				row.vendor,
				row.responseId,
				row.relatedFileId,
				row.responseType,
				row.receivedAt,
				row.status,
				row.acceptedCount,
				row.rejectedCount,
				row.summary,
			])
		);
		toast.success("Responses exported");
	}

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Responses"
				description={`277CA, 999, TA1, and 835 acknowledgements · Filtered to ${programFilter}`}
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
							Response type
						</label>
						<Select value={responseType} onValueChange={setResponseType}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								<SelectItem value="277CA">277CA</SelectItem>
								<SelectItem value="999">999</SelectItem>
								<SelectItem value="TA1">TA1</SelectItem>
								<SelectItem value="835">835</SelectItem>
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

			<ClaimKpiGrid items={kpis} />

			<Card className="bg-card/70">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<CardTitle className="text-sm font-medium">
						Recent response activity
					</CardTitle>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4 sm:pl-6">Vendor</TableHead>
									<TableHead>Response ID</TableHead>
									<TableHead>Related file</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Received</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Accepted</TableHead>
									<TableHead className="text-right">Rejected</TableHead>
									<TableHead>Summary</TableHead>
									<TableHead className="pr-4 text-right sm:pr-6">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => (
									<TableRow key={row.id} className="hover:bg-muted/30">
										<TableCell className="pl-4 font-medium sm:pl-6">
											{row.vendor}
										</TableCell>
										<TableCell className="font-mono text-xs text-muted-foreground">
											{row.responseId}
										</TableCell>
										<TableCell className="font-mono text-xs">
											{row.relatedFileId}
										</TableCell>
										<TableCell>{row.responseType}</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{timeOnly(row.receivedAt)}
										</TableCell>
										<TableCell>{statusBadge(row.status)}</TableCell>
										<TableCell className="text-right tabular-nums text-emerald-700">
											{row.acceptedCount}
										</TableCell>
										<TableCell className="text-right tabular-nums text-red-700">
											{row.rejectedCount}
										</TableCell>
										<TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
											{row.summary}
										</TableCell>
										<TableCell className="pr-4 text-right sm:pr-6">
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
															href={`/admin/claim-encounter/responses/${row.id}`}
														>
															View EDI
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem asChild>
														<Link
															href={`/admin/claim-encounter/batches/${encodeURIComponent(row.submissionBatch)}`}
														>
															View submission batch
														</Link>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
								{pageRows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={10}
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
		</div>
	);
}

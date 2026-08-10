"use client";

import { useCallback, useMemo, useState } from "react";

import {
	ArrowLeft,
	ArrowUpDown,
	CheckCircle2,
	FileOutput,
	Radio,
	RefreshCw,
	Send,
	Timer,
	XCircle,
} from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
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
	ClaimFilterBar,
	ClaimSectionCard,
	ClaimTablePagination,
	FilterField,
	MetricBar,
	pct,
	usePagedRows,
} from "@/features/admin/features/claim-encounter/components/ClaimQueueChrome";
import {
	EdiViewerLoader,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import {
	type ClaimLine,
	type ClaimVendorFile,
	REJECT_REASON_CATALOG,
	claimsForFile,
	filesForProgram,
	formatCount,
	formatCurrency,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const WORKSPACE_H = "h-[calc(100svh-5rem)]";

type SortKey = "reviewedAt" | "records" | "vendor" | "decision";

export function OutboundVendorFilePage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [vendor, setVendor] = useState("all");
	const [decision, setDecision] = useState("all");
	const [sendStatus, setSendStatus] = useState("all");
	const [reasonCode, setReasonCode] = useState("all");
	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("reviewedAt");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

	const base = useMemo(
		() => filesForProgram(programFilter, "outbound"),
		[programFilter]
	);

	const vendors = VENDOR_NAMES;

	const rows = useMemo(() => {
		const filtered = base.filter((f) => {
			if (vendor !== "all" && f.vendor !== vendor) return false;
			if (decision === "accepted" && f.reviewStatus !== "accepted")
				return false;
			if (decision === "denied" && f.reviewStatus !== "denied") return false;
			if (sendStatus !== "all" && f.outboundSendStatus !== sendStatus)
				return false;
			if (
				reasonCode !== "all" &&
				!f.rejectReasons.some((r) => r.code === reasonCode)
			)
				return false;
			const q = search.trim().toLowerCase();
			if (!q) return true;
			return [
				f.fileId,
				f.fileName,
				f.vendor,
				f.sourceInboundFileId,
				f.reviewedBy,
				...f.rejectReasons.map((r) => `${r.code} ${r.description}`),
			]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});

		return [...filtered].sort((a, b) => {
			let cmp = 0;
			if (sortKey === "records") cmp = a.records - b.records;
			else if (sortKey === "vendor") cmp = a.vendor.localeCompare(b.vendor);
			else if (sortKey === "decision")
				cmp = a.reviewStatus.localeCompare(b.reviewStatus);
			else
				cmp = (a.reviewedAt ?? a.receivedAt).localeCompare(
					b.reviewedAt ?? b.receivedAt
				);
			return sortDir === "asc" ? cmp : -cmp;
		});
	}, [
		base,
		vendor,
		decision,
		sendStatus,
		reasonCode,
		search,
		sortKey,
		sortDir,
	]);

	const { pageRows, pageCount, safePage } = usePagedRows(
		rows,
		pageSize,
		page,
		setPage
	);

	const selectedFile = useMemo(
		() => (selectedFileId ? getVendorFile(selectedFileId) : null),
		[selectedFileId]
	);

	const analytics = useMemo(() => {
		const accepted = base.filter((f) => f.reviewStatus === "accepted");
		const denied = base.filter((f) => f.reviewStatus === "denied");
		const sent = base.filter((f) => f.outboundSendStatus === "sent");
		const queued = base.filter((f) => f.outboundSendStatus === "queued");
		const notified = base.filter((f) => f.outboundSendStatus === "notified");
		const claimsAccepted = base.reduce((s, f) => s + f.accepted, 0);
		const claimsDenied = base.reduce((s, f) => s + f.denied, 0);
		const claimsTotal = claimsAccepted + claimsDenied;
		const acceptRate = pct(claimsAccepted, claimsTotal || 1);
		const avgTurnaround =
			base.filter((f) => f.avgResponseMinutes != null).length === 0
				? 0
				: Math.round(
						base.reduce((s, f) => s + (f.avgResponseMinutes ?? 0), 0) /
							base.filter((f) => f.avgResponseMinutes != null).length
					);

		const decisionPie = [
			{ name: "Accepted", value: accepted.length, fill: "#13446c" },
			{ name: "Denied", value: denied.length, fill: "#ef4444" },
		];

		const sendPipeline = [
			{ name: "Queued", value: queued.length, fill: "#13446c66" },
			{ name: "Sent", value: sent.length, fill: "#13446c" },
			{ name: "Notified", value: notified.length, fill: "#13446caa" },
		];

		const reasonCounts = REJECT_REASON_CATALOG.map((r) => ({
			code: r.code,
			description: r.description,
			count: base.filter((f) => f.rejectReasons.some((x) => x.code === r.code))
				.length,
		}))
			.filter((r) => r.count > 0)
			.sort((a, b) => b.count - a.count);

		const byReviewer = Object.entries(
			base.reduce<
				Record<string, { files: number; accepted: number; denied: number }>
			>((acc, f) => {
				const name = f.reviewedBy ?? "Unknown";
				const cur = acc[name] ?? { files: 0, accepted: 0, denied: 0 };
				cur.files += 1;
				if (f.reviewStatus === "accepted") cur.accepted += 1;
				else if (f.reviewStatus === "denied") cur.denied += 1;
				acc[name] = cur;
				return acc;
			}, {})
		)
			.map(([name, v]) => ({ name, ...v }))
			.sort((a, b) => b.files - a.files);

		const vendorAccept = Object.entries(
			base.reduce<Record<string, { accepted: number; denied: number }>>(
				(acc, f) => {
					const cur = acc[f.vendor] ?? { accepted: 0, denied: 0 };
					cur.accepted += f.accepted;
					cur.denied += f.denied;
					acc[f.vendor] = cur;
					return acc;
				},
				{}
			)
		)
			.map(([name, v]) => ({
				name,
				accepted: v.accepted,
				denied: v.denied,
				rate: pct(v.accepted, v.accepted + v.denied || 1),
			}))
			.sort((a, b) => b.accepted + b.denied - (a.accepted + a.denied));

		return {
			accepted,
			denied,
			sent,
			queued,
			notified,
			claimsAccepted,
			claimsDenied,
			claimsTotal,
			acceptRate,
			avgTurnaround,
			decisionPie,
			sendPipeline,
			reasonCounts,
			byReviewer,
			vendorAccept,
			maxReason: Math.max(1, ...reasonCounts.map((r) => r.count)),
		};
	}, [base]);

	const hasActiveFilters =
		vendor !== "all" ||
		decision !== "all" ||
		sendStatus !== "all" ||
		reasonCode !== "all" ||
		search.trim().length > 0;

	function clearFilters() {
		setVendor("all");
		setDecision("all");
		setSendStatus("all");
		setReasonCode("all");
		setSearch("");
		setSortKey("reviewedAt");
		setSortDir("desc");
		setPage(1);
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir(key === "vendor" ? "asc" : "desc");
		}
		setPage(1);
	}

	async function handleRefresh() {
		setRefreshing(true);
		await new Promise((r) => setTimeout(r, 400));
		setRefreshing(false);
		toast.success("Outbound list refreshed");
	}

	const kpis = [
		{
			label: "Reviewed packages",
			value: formatCount(base.length),
			hint: programFilter,
			icon: FileOutput,
			tone: "text-primary bg-primary/10",
		},
		{
			label: "Accept rate",
			value: `${analytics.acceptRate}%`,
			hint: `${formatCount(analytics.claimsAccepted)} / ${formatCount(analytics.claimsTotal)} claims`,
			icon: CheckCircle2,
			tone: "text-emerald-700 bg-emerald-500/10",
		},
		{
			label: "Denied pkgs",
			value: formatCount(analytics.denied.length),
			hint: "Gainwell denials",
			icon: XCircle,
			tone: "text-red-700 bg-red-500/10",
		},
		{
			label: "Queued send",
			value: formatCount(analytics.queued.length),
			hint: "Awaiting Gainwell",
			icon: Send,
			tone: "text-amber-700 bg-amber-500/10",
		},
		{
			label: "Sent",
			value: formatCount(analytics.sent.length),
			hint: "Delivered",
			icon: Radio,
			tone: "text-sky-700 bg-sky-500/10",
		},
		{
			label: "Avg turnaround",
			value: `${analytics.avgTurnaround}m`,
			hint: "Review → outbound",
			icon: Timer,
			tone: "text-violet-700 bg-violet-500/10",
		},
	];

	if (selectedFile) {
		return (
			<OutboundFileWorkspace
				file={selectedFile}
				onBack={() => setSelectedFileId(null)}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<ClaimPageHeader
				title="Outbound Vendor File"
				description={`Accepted to Gainwell + denied claims · ${programFilter}`}
				actions={
					<div className="flex flex-wrap gap-1.5">
						<Button asChild variant="outline" size="sm" className="h-9">
							<Link href="/admin/claim-encounter/inbound">Inbound queue</Link>
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
					</div>
				}
			/>

			<ClaimKpiGrid items={kpis} />

			{/* Review queue — directly under stats */}
			<ClaimFilterBar
				search={search}
				onSearchChange={(v) => {
					setSearch(v);
					setPage(1);
				}}
				searchPlaceholder="File ID, inbound source, vendor, reviewer, reason…"
				hasActiveFilters={hasActiveFilters}
				onClear={clearFilters}
			>
				<FilterField label="Vendor">
					<Select
						value={vendor}
						onValueChange={(v) => {
							setVendor(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-[150px]">
							<SelectValue />
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
				</FilterField>
				<FilterField label="Decision">
					<Select
						value={decision}
						onValueChange={(v) => {
							setDecision(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-[140px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="accepted">Accepted</SelectItem>
							<SelectItem value="denied">Denied</SelectItem>
						</SelectContent>
					</Select>
				</FilterField>
				<FilterField label="Send status">
					<Select
						value={sendStatus}
						onValueChange={(v) => {
							setSendStatus(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-[140px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="queued">Queued</SelectItem>
							<SelectItem value="sent">Sent</SelectItem>
							<SelectItem value="notified">Notified</SelectItem>
						</SelectContent>
					</Select>
				</FilterField>
				<FilterField label="Reason">
					<Select
						value={reasonCode}
						onValueChange={(v) => {
							setReasonCode(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-[150px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All reasons</SelectItem>
							{REJECT_REASON_CATALOG.map((r) => (
								<SelectItem key={r.code} value={r.code}>
									{r.code}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</FilterField>
				<FilterField label="Sort">
					<Select
						value={`${sortKey}:${sortDir}`}
						onValueChange={(v) => {
							const [k, d] = v.split(":") as [SortKey, "asc" | "desc"];
							setSortKey(k);
							setSortDir(d);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="reviewedAt:desc">Reviewed (newest)</SelectItem>
							<SelectItem value="reviewedAt:asc">Reviewed (oldest)</SelectItem>
							<SelectItem value="records:desc">Claims (high→low)</SelectItem>
							<SelectItem value="records:asc">Claims (low→high)</SelectItem>
							<SelectItem value="decision:asc">Decision A–Z</SelectItem>
							<SelectItem value="vendor:asc">Vendor A–Z</SelectItem>
						</SelectContent>
					</Select>
				</FilterField>
			</ClaimFilterBar>

			<Card className="gap-1 bg-card/70 py-2">
				<CardHeader className="px-3 pb-0.5 pt-0">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div>
							<CardTitle className="text-sm font-medium">
								Reviewed outbound
							</CardTitle>
							<p className="text-[11px] text-muted-foreground">
								{rows.length} matching · open a package for claims + EDI
							</p>
						</div>
						<span className="text-[11px] tabular-nums text-muted-foreground">
							{formatCount(rows.reduce((s, f) => s + f.records, 0))} claims in
							view
						</span>
					</div>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="overflow-x-auto border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-3 sm:pl-4">Outbound file</TableHead>
									<TableHead>
										<button
											type="button"
											className="inline-flex items-center gap-1"
											onClick={() => toggleSort("vendor")}
										>
											Vendor
											<ArrowUpDown className="size-3 opacity-60" />
										</button>
									</TableHead>
									<TableHead>
										<button
											type="button"
											className="inline-flex items-center gap-1"
											onClick={() => toggleSort("decision")}
										>
											Decision
											<ArrowUpDown className="size-3 opacity-60" />
										</button>
									</TableHead>
									<TableHead className="text-right">
										<button
											type="button"
											className="ml-auto inline-flex items-center gap-1"
											onClick={() => toggleSort("records")}
										>
											Claims
											<ArrowUpDown className="size-3 opacity-60" />
										</button>
									</TableHead>
									<TableHead>Rejection reasons</TableHead>
									<TableHead>Send status</TableHead>
									<TableHead>
										<button
											type="button"
											className="inline-flex items-center gap-1"
											onClick={() => toggleSort("reviewedAt")}
										>
											Reviewed
											<ArrowUpDown className="size-3 opacity-60" />
										</button>
									</TableHead>
									<TableHead className="pr-3 sm:pr-4">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => (
									<TableRow
										key={row.id}
										className="cursor-pointer hover:bg-muted/30"
										onClick={() => setSelectedFileId(row.fileId)}
									>
										<TableCell className="pl-3 sm:pl-4">
											<div className="min-w-0">
												<p className="font-mono text-xs font-medium">
													{row.fileId}
												</p>
												<p className="truncate text-[11px] text-muted-foreground">
													{row.sourceInboundFileId
														? `From ${row.sourceInboundFileId}`
														: row.fileName}
												</p>
											</div>
										</TableCell>
										<TableCell className="text-sm">{row.vendor}</TableCell>
										<TableCell>
											<span
												className={cn(
													"rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
													row.reviewStatus === "accepted"
														? "bg-primary/15 text-primary"
														: "bg-red-100 text-red-800"
												)}
											>
												{row.reviewStatus}
											</span>
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											<div>
												<p>{formatCount(row.records)}</p>
												<p className="text-[10px] text-muted-foreground">
													<span className="text-primary">
														{row.accepted} ok
													</span>
													{" · "}
													<span className="text-red-700">{row.denied} dn</span>
												</p>
											</div>
										</TableCell>
										<TableCell className="max-w-[220px]">
											{row.rejectReasons.length === 0 ? (
												<span className="text-xs text-muted-foreground">—</span>
											) : (
												<div className="space-y-0.5">
													{row.rejectReasons.map((r) => (
														<p
															key={r.code}
															className="truncate text-xs"
															title={r.description}
														>
															<span className="font-mono font-semibold text-red-800">
																{r.code}
															</span>
															<span className="text-muted-foreground">
																{" "}
																· {r.description}
															</span>
														</p>
													))}
												</div>
											)}
										</TableCell>
										<TableCell>
											<span
												className={cn(
													"rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
													row.outboundSendStatus === "sent"
														? "bg-sky-100 text-sky-900"
														: row.outboundSendStatus === "queued"
															? "bg-amber-100 text-amber-900"
															: "bg-violet-100 text-violet-900"
												)}
											>
												{row.outboundSendStatus ?? "—"}
											</span>
										</TableCell>
										<TableCell className="text-xs tabular-nums text-muted-foreground">
											<div>
												<p>{row.reviewedAt ?? "—"}</p>
												<p className="text-[10px]">{row.reviewedBy}</p>
											</div>
										</TableCell>
										<TableCell
											className="pr-3 sm:pr-4"
											onClick={(e) => e.stopPropagation()}
										>
											<div className="flex gap-1">
												<Button
													variant="outline"
													size="sm"
													className="h-7 text-xs"
													onClick={() => setSelectedFileId(row.fileId)}
												>
													Open claims
												</Button>
												<Button
													asChild
													variant="ghost"
													size="sm"
													className="h-7 text-xs"
												>
													<Link
														href={`/admin/claim-encounter/files/${encodeURIComponent(row.fileId)}`}
													>
														Full page
													</Link>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
								{pageRows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-24 text-center text-muted-foreground"
										>
											No reviewed outbound files match the current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<ClaimTablePagination
						total={rows.length}
						page={safePage}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={setPage}
						onPageSizeChange={(size) => {
							setPageSize(size);
							setPage(1);
						}}
						noun="packages"
					/>
				</CardContent>
			</Card>

			{/* Analytics — below review queue */}
			<div className="grid gap-3 lg:grid-cols-3">
				<ClaimSectionCard
					title="Decision mix"
					description="Package-level MFC outcomes"
				>
					<div className="h-[160px]">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={analytics.decisionPie}
									dataKey="value"
									nameKey="name"
									innerRadius={44}
									outerRadius={68}
									paddingAngle={3}
								>
									{analytics.decisionPie.map((d) => (
										<Cell key={d.name} fill={d.fill} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-1 grid grid-cols-2 gap-2">
						<button
							type="button"
							className={cn(
								"rounded-md border px-2 py-1.5 text-left text-xs",
								decision === "accepted"
									? "border-primary/30 bg-primary/10"
									: "border-border/50 hover:bg-muted/40"
							)}
							onClick={() => {
								setDecision((d) => (d === "accepted" ? "all" : "accepted"));
								setPage(1);
							}}
						>
							<p className="text-muted-foreground">Accepted</p>
							<p className="text-base font-semibold tabular-nums text-primary">
								{analytics.accepted.length}
							</p>
						</button>
						<button
							type="button"
							className={cn(
								"rounded-md border px-2 py-1.5 text-left text-xs",
								decision === "denied"
									? "border-red-300 bg-red-50 dark:bg-red-950/30"
									: "border-border/50 hover:bg-muted/40"
							)}
							onClick={() => {
								setDecision((d) => (d === "denied" ? "all" : "denied"));
								setPage(1);
							}}
						>
							<p className="text-muted-foreground">Denied</p>
							<p className="text-base font-semibold tabular-nums text-red-700">
								{analytics.denied.length}
							</p>
						</button>
					</div>
					<div className="mt-2">
						<div className="mb-1 flex justify-between text-[11px]">
							<span className="text-muted-foreground">Claim accept rate</span>
							<span className="font-medium tabular-nums">
								{analytics.acceptRate}%
							</span>
						</div>
						<Progress value={analytics.acceptRate} className="h-1.5" />
					</div>
				</ClaimSectionCard>

				<ClaimSectionCard
					title="Transmission pipeline"
					description="Where accepted / denied packages stand"
				>
					<div className="h-[160px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={analytics.sendPipeline}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="name" tick={{ fontSize: 11 }} />
								<YAxis
									allowDecimals={false}
									width={28}
									tick={{ fontSize: 11 }}
								/>
								<Tooltip />
								<Bar dataKey="value" radius={[4, 4, 0, 0]}>
									{analytics.sendPipeline.map((s) => (
										<Cell key={s.name} fill={s.fill} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-2 flex flex-wrap gap-1.5">
						{(
							[
								{ id: "all", label: "All" },
								{ id: "queued", label: "Queued" },
								{ id: "sent", label: "Sent" },
								{ id: "notified", label: "Notified" },
							] as const
						).map((chip) => (
							<button
								key={chip.id}
								type="button"
								onClick={() => {
									setSendStatus(chip.id);
									setPage(1);
								}}
								className={cn(
									"rounded-full border px-2.5 py-1 text-[11px] font-medium",
									sendStatus === chip.id
										? "border-primary/40 bg-primary/10 text-primary"
										: "border-border/60 text-muted-foreground hover:bg-muted/40"
								)}
							>
								{chip.label}
							</button>
						))}
					</div>
				</ClaimSectionCard>

				<ClaimSectionCard
					title="Top rejection reasons"
					description="Most frequent codes on outbound packages"
				>
					<div className="space-y-2">
						{analytics.reasonCounts.slice(0, 5).map((r) => (
							<button
								key={r.code}
								type="button"
								className="w-full text-left"
								onClick={() => {
									setReasonCode((cur) => (cur === r.code ? "all" : r.code));
									setDecision("denied");
									setPage(1);
								}}
								title={r.description}
							>
								<MetricBar
									label={r.code}
									value={r.count}
									max={analytics.maxReason}
									suffix="pkgs"
									tone={reasonCode === r.code ? "bg-red-600" : "bg-red-400/80"}
								/>
								<p className="mt-0.5 truncate text-[10px] text-muted-foreground">
									{r.description}
								</p>
							</button>
						))}
						{analytics.reasonCounts.length === 0 ? (
							<p className="text-xs text-muted-foreground">
								No rejection reasons in this program view.
							</p>
						) : null}
					</div>
				</ClaimSectionCard>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<ClaimSectionCard
					title="Reviewer throughput"
					description="Who signed off outbound packages"
				>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-0">Reviewer</TableHead>
									<TableHead className="text-right">Files</TableHead>
									<TableHead className="text-right">Accepted</TableHead>
									<TableHead className="pr-0 text-right">Denied</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{analytics.byReviewer.map((r) => (
									<TableRow key={r.name} className="hover:bg-muted/30">
										<TableCell className="pl-0 text-sm font-medium">
											{r.name}
										</TableCell>
										<TableCell className="text-right tabular-nums text-sm">
											{r.files}
										</TableCell>
										<TableCell className="text-right tabular-nums text-sm text-primary">
											{r.accepted}
										</TableCell>
										<TableCell className="pr-0 text-right tabular-nums text-sm text-red-700">
											{r.denied}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</ClaimSectionCard>

				<ClaimSectionCard
					title="Vendor claim outcomes"
					description="Accepted vs denied claim volume by vendor"
				>
					<div className="h-[200px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={analytics.vendorAccept.slice(0, 6)}
								margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
							>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
								<YAxis
									allowDecimals={false}
									width={32}
									tick={{ fontSize: 11 }}
								/>
								<Tooltip />
								<Bar
									dataKey="accepted"
									stackId="a"
									fill="#13446c"
									radius={[0, 0, 0, 0]}
									cursor="pointer"
									onClick={(data) => {
										const name = (data as { name?: string })?.name;
										if (!name) return;
										setVendor((cur) => (cur === name ? "all" : name));
										setPage(1);
									}}
								/>
								<Bar
									dataKey="denied"
									stackId="a"
									fill="#ef4444"
									radius={[4, 4, 0, 0]}
									cursor="pointer"
									onClick={(data) => {
										const name = (data as { name?: string })?.name;
										if (!name) return;
										setVendor((cur) => (cur === name ? "all" : name));
										setPage(1);
									}}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</ClaimSectionCard>
			</div>
		</div>
	);
}

function OutboundFileWorkspace({
	file,
	onBack,
}: {
	file: ClaimVendorFile;
	onBack: () => void;
}) {
	const claims = useMemo(() => claimsForFile(file.fileId), [file.fileId]);
	const [focusedClaimId, setFocusedClaimId] = useState<string | null>(
		() => claims[0]?.claimId ?? null
	);

	const focusClaimIndex = useMemo(() => {
		if (!focusedClaimId) return 0;
		const idx = claims.findIndex((c) => c.claimId === focusedClaimId);
		return idx >= 0 ? idx : 0;
	}, [claims, focusedClaimId]);

	const focused = claims[focusClaimIndex] ?? null;
	const acceptedCount = claims.filter(
		(c) => c.mfcReviewStatus === "accepted"
	).length;
	const deniedCount = claims.filter(
		(c) => c.mfcReviewStatus === "denied"
	).length;

	const load = useCallback(
		() => loadEdiFixture(file.ediFixture ?? "837I"),
		[file]
	);

	return (
		<div className={cn(WORKSPACE_H, "flex min-h-0 flex-col")}>
			<header className="shrink-0 border-b border-border/50 pb-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="min-w-0">
						<button
							type="button"
							onClick={onBack}
							className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="size-3" />
							Outbound list
						</button>
						<div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
							<h1 className="truncate text-sm font-medium tracking-tight">
								{file.fileName}
							</h1>
							<span
								className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
									file.reviewStatus === "accepted"
										? "bg-emerald-100 text-emerald-800"
										: "bg-red-100 text-red-800"
								)}
							>
								{file.reviewStatus}
							</span>
						</div>
						<p className="truncate text-[11px] text-muted-foreground">
							{file.vendor} · {file.fileId}
							{" · "}
							<span className="text-emerald-700">{acceptedCount} accepted</span>
							{" · "}
							<span className="text-red-700">{deniedCount} denied</span>
							{focused ? (
								<>
									{" · "}
									<span className="font-mono text-foreground">
										{focused.claimId}
									</span>
								</>
							) : null}
						</p>
					</div>
				</div>
			</header>

			<div className="mt-2 min-h-0 flex-1">
				<ResizablePanelGroup
					direction="horizontal"
					className="h-full rounded-lg border border-border/50"
				>
					<ResizablePanel
						defaultSize={28}
						minSize={16}
						maxSize={42}
						className="bg-card/70"
					>
						<div className="flex h-full min-h-0 flex-col">
							<div className="shrink-0 border-b border-border/50 px-2.5 py-1.5">
								<p className="text-xs font-medium">Claims ({claims.length})</p>
								<p className="text-[10px] text-muted-foreground">
									Accepted & denied · EDI updates per selection
								</p>
							</div>
							<ScrollArea className="min-h-0 flex-1" scrollbarClassName="w-1.5">
								<div className="divide-y divide-border/40 p-1">
									{claims.map((c, index) => (
										<ClaimDecisionCard
											key={c.id}
											claim={c}
											index={index}
											active={
												(focusedClaimId ?? claims[0]?.claimId) === c.claimId
											}
											onSelect={() => setFocusedClaimId(c.claimId)}
										/>
									))}
								</div>
							</ScrollArea>
						</div>
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel defaultSize={72} minSize={45} className="min-w-0">
						<div className="flex h-full min-h-0 flex-col">
							<EdiViewerLoader
								load={load}
								fileName={file.fileName}
								focusClaimIndex={focusClaimIndex}
								className="h-full min-h-0 rounded-none border-0"
							/>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
		</div>
	);
}

function ClaimDecisionCard({
	claim,
	index,
	active,
	onSelect,
}: {
	claim: ClaimLine;
	index: number;
	active: boolean;
	onSelect: () => void;
}) {
	const isDenied = claim.mfcReviewStatus === "denied";
	const isRejected = claim.mfcReviewStatus === "rejected";
	const isAccepted = claim.mfcReviewStatus === "accepted";
	const isNegative = isDenied || isRejected;

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/40",
				active && "bg-primary/8 ring-1 ring-primary/20 hover:bg-primary/10"
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="font-mono text-[11px] font-semibold">{claim.claimId}</p>
					<p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
						#{index + 1} · {claim.memberId}
					</p>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-1">
					<span
						className={cn(
							"inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
							isAccepted && "bg-emerald-100 text-emerald-800",
							isNegative && "bg-red-100 text-red-800",
							!isAccepted && !isNegative && "bg-amber-100 text-amber-900"
						)}
					>
						{isAccepted ? (
							<CheckCircle2 className="size-2.5" />
						) : isNegative ? (
							<XCircle className="size-2.5" />
						) : null}
						{claim.mfcReviewStatus}
					</span>
					<span className="text-[10px] tabular-nums text-muted-foreground">
						{formatCurrency(claim.amountBilled)}
					</span>
				</div>
			</div>

			{isNegative && claim.rejectReasons.length > 0 ? (
				<div className="mt-2 space-y-1 border-t border-border/40 pt-2">
					<p className="text-[9px] font-semibold uppercase tracking-wide text-red-700/80">
						{isDenied ? "Denial reasons" : "Rejection reasons"}
					</p>
					<ul className="space-y-1">
						{claim.rejectReasons.map((r) => (
							<li
								key={r.code}
								className="rounded border border-red-200/60 bg-red-50/80 px-1.5 py-1 dark:border-red-900/40 dark:bg-red-950/30"
							>
								<p className="font-mono text-[10px] font-semibold text-red-800 dark:text-red-300">
									{r.code}
								</p>
								<p className="text-[10px] leading-snug text-red-700/90 dark:text-red-400/90">
									{r.description}
								</p>
							</li>
						))}
					</ul>
				</div>
			) : null}

			{isAccepted ? (
				<p className="mt-1.5 text-[10px] text-emerald-700/90">
					Accepted · ready for Gainwell
				</p>
			) : null}
		</button>
	);
}

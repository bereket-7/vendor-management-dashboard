"use client";

import { useMemo, useState } from "react";

import {
	ArrowUpDown,
	CheckCircle2,
	Download,
	ExternalLink,
	Eye,
	FileOutput,
	Inbox,
	type LucideIcon,
	MoreHorizontal,
	Radio,
	RefreshCw,
	Search,
	Send,
	X,
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
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgeSectionPanel,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	ClaimTablePagination,
	pct,
	usePagedRows,
} from "@/features/admin/features/claim-encounter/components/ClaimQueueChrome";
import { VendorFileWorkspace } from "@/features/admin/features/claim-encounter/components/VendorFileWorkspace";
import {
	type ClaimVendorFile,
	REJECT_REASON_CATALOG,
	downloadClaimVendorFile,
	filesForProgram,
	formatCount,
	getVendorFile,
	saveVendorCoreBlob,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import {
	useProgramFilesQuery,
	useSendClaimVendorFileMutation,
} from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { CLAIM_VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { isClaimVendorFilesMockEnabled, isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const PANEL = CMS_EDGE_PANEL_CLASS;

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const selectField = cn(
	"h-8 w-auto min-w-[7.5rem] rounded-sm border border-border bg-background text-xs shadow-none transition-colors duration-200",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

const th =
	"h-9 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-3 py-2.5 text-[12px] align-middle text-foreground";

type SortKey = "reviewedAt" | "records" | "vendor" | "decision";

function DecisionPill({ status }: { status: ClaimVendorFile["reviewStatus"] }) {
	const accepted = status === "accepted";
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
				accepted
					? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
					: "border-rose-200/80 bg-rose-50 text-rose-800"
			)}
		>
			{accepted ? (
				<CheckCircle2 className="size-2.5" />
			) : (
				<XCircle className="size-2.5" />
			)}
			{status}
		</span>
	);
}

function SendStatusPill({
	status,
}: {
	status: ClaimVendorFile["outboundSendStatus"];
}) {
	if (!status) {
		return <span className="text-xs text-muted-foreground">—</span>;
	}
	const styles =
		status === "sent"
			? "border-sky-200/80 bg-sky-50 text-sky-900"
			: status === "queued"
				? "border-amber-200/80 bg-amber-50 text-amber-950"
				: "border-violet-200/80 bg-violet-50 text-violet-900";
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
				styles
			)}
		>
			<span
				className={cn(
					"size-1.5 rounded-full",
					status === "sent" && "bg-sky-500",
					status === "queued" && "bg-amber-500",
					status === "notified" && "bg-violet-500"
				)}
			/>
			{status}
		</span>
	);
}

function TxBadge({ type }: { type: ClaimVendorFile["transactionType"] }) {
	return (
		<span className="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-muted-foreground">
			{type}
		</span>
	);
}

export function OutboundVendorFilePage() {
	const useFixtures = isMockEnabled() || isClaimVendorFilesMockEnabled();
	if (!useFixtures) {
		return (
			<VendorCoreGate title="Outbound Vendor Files">
				<OutboundVendorFileBody useLive />
			</VendorCoreGate>
		);
	}
	return <OutboundVendorFileBody useLive={false} />;
}

function OutboundVendorFileBody({ useLive }: { useLive: boolean }) {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const outboundQuery = useProgramFilesQuery(
		programFilter,
		"outbound",
		useLive
	);
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

	const base = useMemo(() => {
		if (useLive) return outboundQuery.data ?? [];
		return filesForProgram(programFilter, "outbound");
	}, [useLive, outboundQuery.data, programFilter]);

	const vendors = CLAIM_VENDOR_NAMES;

	const rows = useMemo(() => {
		const filtered = base.filter((f) => {
			if (vendor !== "all" && f.vendor !== vendor) return false;
			if (decision === "accepted" && f.reviewStatus !== "accepted")
				return false;
			if (
				decision === "denied" &&
				f.reviewStatus !== "denied" &&
				f.reviewStatus !== "rejected"
			)
				return false;
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
				f.program,
				f.transactionType,
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

	const sendMutation = useSendClaimVendorFileMutation();

	const selectedFile = useMemo(() => {
		if (!selectedFileId) return null;
		return (
			base.find((f) => f.id === selectedFileId) ??
			getVendorFile(selectedFileId) ??
			null
		);
	}, [selectedFileId, base]);

	async function handleSend(row: ClaimVendorFile) {
		if (!useLive) {
			toast.message("Send requires live vendor-core");
			return;
		}
		const canSend =
			row.reviewStatus === "accepted" || row.outboundSendStatus === "queued";
		if (!canSend) {
			toast.message("Send only available for accepted or queued packages");
			return;
		}
		try {
			await sendMutation.mutateAsync({ id: row.id });
			toast.success("Send requested");
			await outboundQuery.refetch();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Send failed");
		}
	}

	async function handleDownloadEdi(row: ClaimVendorFile) {
		if (!useLive) {
			toast.message("EDI download requires live vendor-core");
			return;
		}
		try {
			const result = await downloadClaimVendorFile(row.id);
			saveVendorCoreBlob(result, row.fileName || `${row.fileId}.edi`);
			toast.success("EDI download started");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "EDI download failed");
		}
	}

	const analytics = useMemo(() => {
		const accepted = base.filter((f) => f.reviewStatus === "accepted");
		const denied = base.filter(
			(f) => f.reviewStatus === "denied" || f.reviewStatus === "rejected"
		);
		const sent = base.filter((f) => f.outboundSendStatus === "sent");
		const queued = base.filter((f) => f.outboundSendStatus === "queued");
		const notified = base.filter((f) => f.outboundSendStatus === "notified");
		const claimsAccepted = base.reduce((s, f) => s + f.accepted, 0);
		const claimsDenied = base.reduce((s, f) => s + f.denied, 0);
		const claimsTotal = claimsAccepted + claimsDenied;
		const acceptRate = pct(claimsAccepted, claimsTotal || 1);
		const withTurnaround = base.filter((f) => f.avgResponseMinutes != null);
		const avgTurnaround =
			withTurnaround.length === 0
				? 0
				: Math.round(
						withTurnaround.reduce(
							(s, f) => s + (f.avgResponseMinutes ?? 0),
							0
						) / withTurnaround.length
					);

		const decisionPie = [
			{ name: "Accepted", value: accepted.length, fill: "#059669" },
			{ name: "Denied", value: denied.length, fill: "#f43f5e" },
		].filter((d) => d.value > 0);

		const sendPipeline = [
			{
				id: "queued" as const,
				name: "Queued",
				value: queued.length,
				fill: "#f59e0b",
				tone: "bg-amber-500",
			},
			{
				id: "sent" as const,
				name: "Sent",
				value: sent.length,
				fill: "#0ea5e9",
				tone: "bg-sky-500",
			},
			{
				id: "notified" as const,
				name: "Notified",
				value: notified.length,
				fill: "#8b5cf6",
				tone: "bg-violet-500",
			},
		];
		const pipelineTotal = Math.max(
			1,
			sendPipeline.reduce((s, row) => s + row.value, 0)
		);

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
				else if (f.reviewStatus === "denied" || f.reviewStatus === "rejected")
					cur.denied += 1;
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
				short: name.length > 14 ? `${name.slice(0, 12).trimEnd()}…` : name,
				accepted: v.accepted,
				denied: v.denied,
				total: v.accepted + v.denied,
				rate: pct(v.accepted, v.accepted + v.denied || 1),
			}))
			.sort((a, b) => b.total - a.total);

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
			decisionTotal: accepted.length + denied.length,
			sendPipeline,
			pipelineTotal,
			reasonCounts,
			byReviewer,
			vendorAccept,
			maxReason: Math.max(1, ...reasonCounts.map((r) => r.count)),
			maxReviewer: Math.max(1, ...byReviewer.map((r) => r.files)),
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
		if (useLive) {
			await outboundQuery.refetch();
		} else {
			await new Promise((r) => setTimeout(r, 400));
		}
		setRefreshing(false);
		toast.success("Outbound refreshed");
	}

	const STAT_SHADOW =
		"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";
	const STAT_SHADOW_HOVER =
		"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)]";

	const packageTotal = Math.max(base.length, 1);
	const outboundKpis: {
		id: string;
		label: string;
		value: number;
		hint: string;
		icon: LucideIcon;
		accent: string;
		valueTone: string;
		iconTone: string;
		ring: string;
		active: boolean;
		onClick: () => void;
	}[] = [
		{
			id: "packages",
			label: "Total packages",
			value: base.length,
			hint: `${programFilter} reviewed`,
			icon: FileOutput,
			accent: "from-sky-500/80 to-sky-400/40",
			valueTone: "text-sky-700 dark:text-sky-300",
			iconTone: "text-sky-700 bg-sky-500/10 dark:text-sky-300",
			ring: "ring-sky-500/20",
			active:
				sendStatus === "all" &&
				decision === "all" &&
				reasonCode === "all" &&
				!search.trim(),
			onClick: () => {
				clearFilters();
			},
		},
		{
			id: "queued",
			label: "Queued",
			value: analytics.queued.length,
			hint: `${pct(analytics.queued.length, packageTotal)}% awaiting send`,
			icon: Send,
			accent: "from-amber-500/80 to-amber-400/40",
			valueTone: "text-amber-700 dark:text-amber-300",
			iconTone: "text-amber-700 bg-amber-500/10 dark:text-amber-200",
			ring: "ring-amber-500/20",
			active: sendStatus === "queued",
			onClick: () => {
				setSendStatus((s) => (s === "queued" ? "all" : "queued"));
				setDecision("all");
				setPage(1);
			},
		},
		{
			id: "sent",
			label: "Sent",
			value: analytics.sent.length,
			hint: `${pct(analytics.sent.length, packageTotal)}% in flight`,
			icon: Radio,
			accent: "from-emerald-500/80 to-emerald-400/40",
			valueTone: "text-emerald-700 dark:text-emerald-300",
			iconTone: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300",
			ring: "ring-emerald-500/20",
			active: sendStatus === "sent",
			onClick: () => {
				setSendStatus((s) => (s === "sent" ? "all" : "sent"));
				setPage(1);
			},
		},
		{
			id: "denied",
			label: "Denied",
			value: analytics.denied.length,
			hint: `${pct(analytics.denied.length, packageTotal)}% vendor notified`,
			icon: XCircle,
			accent: "from-rose-500/80 to-rose-400/40",
			valueTone: "text-rose-700 dark:text-rose-300",
			iconTone: "text-rose-700 bg-rose-500/10 dark:text-rose-300",
			ring: "ring-rose-500/20",
			active: decision === "denied",
			onClick: () => {
				setDecision((d) => (d === "denied" ? "all" : "denied"));
				setSendStatus("notified");
				setPage(1);
			},
		},
	];

	if (selectedFile) {
		return (
			<OutboundFileWorkspace
				file={selectedFile}
				useLive={useLive}
				onBack={() => setSelectedFileId(null)}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header — CMS EDGE Reporting rhythm */}
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Outbound
					</h1>
					<p className="text-sm text-muted-foreground">
						Reviewed packages ready to send
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						asChild
						size="sm"
						className={cn(
							toolbarBtn,
							"bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
						)}
					>
						<Link href="/admin/claim-encounter/inbound">
							<Inbox className="size-3.5" />
							Inbound
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={handleRefresh}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{useLive && outboundQuery.error ? (
				<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
					Could not load outbound files: {outboundQuery.error.message}
				</p>
			) : null}
			{useLive && outboundQuery.isLoading ? (
				<p className="text-sm text-muted-foreground">
					Loading outbound packages…
				</p>
			) : null}
			{useLive &&
			!outboundQuery.isLoading &&
			!outboundQuery.error &&
			base.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No outbound vendor files for this program yet.
				</p>
			) : null}

			{/* KPI grid — reporting submissions pattern */}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{outboundKpis.map((kpi) => {
					const Icon = kpi.icon;
					return (
						<button
							key={kpi.id}
							type="button"
							onClick={kpi.onClick}
							className={cn(
								"group relative overflow-hidden rounded-sm border bg-card p-4 text-left transition-all duration-200 ease-out",
								STAT_SHADOW,
								STAT_SHADOW_HOVER,
								"hover:-translate-y-px hover:border-border",
								kpi.active
									? cn("border-transparent ring-1", kpi.ring)
									: "border-border/70"
							)}
						>
							<span
								aria-hidden
								className={cn(
									"absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
									kpi.accent
								)}
							/>
							<div className="flex items-start justify-between gap-3 pl-1.5">
								<div className="min-w-0">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{kpi.label}
									</p>
									<p
										className={cn(
											"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
											kpi.valueTone
										)}
									>
										{kpi.value.toLocaleString()}
									</p>
									<p className="mt-1.5 text-xs text-muted-foreground">
										{kpi.hint}
									</p>
								</div>
								<span
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-sm ring-1 ring-inset ring-black/5 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10",
										kpi.iconTone
									)}
								>
									<Icon className="size-[18px]" aria-hidden />
								</span>
							</div>
						</button>
					);
				})}
			</div>

			{/* Filters — reporting-style panel */}
			<section className={cn(PANEL, "px-3 py-2.5 sm:px-3")}>
				<div className="flex flex-col gap-2.5">
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search file ID, vendor, TX type, reviewer…"
							className="h-8 rounded-sm border-border bg-background pl-8 text-xs shadow-none focus-visible:ring-primary/15"
						/>
						{search ? (
							<button
								type="button"
								aria-label="Clear search"
								className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								onClick={() => {
									setSearch("");
									setPage(1);
								}}
							>
								<X className="size-3.5" />
							</button>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={vendor}
							onValueChange={(v) => {
								setVendor(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-[8.5rem]")}>
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
						<Select
							value={decision}
							onValueChange={(v) => {
								setDecision(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={selectField}>
								<SelectValue placeholder="Decision" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All decisions</SelectItem>
								<SelectItem value="accepted">Accepted</SelectItem>
								<SelectItem value="denied">Denied</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={sendStatus}
							onValueChange={(v) => {
								setSendStatus(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={selectField}>
								<SelectValue placeholder="Send" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All send</SelectItem>
								<SelectItem value="queued">Queued</SelectItem>
								<SelectItem value="sent">Sent</SelectItem>
								<SelectItem value="notified">Notified</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={reasonCode}
							onValueChange={(v) => {
								setReasonCode(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-[8rem]")}>
								<SelectValue placeholder="Reason" />
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
						<Select
							value={`${sortKey}:${sortDir}`}
							onValueChange={(v) => {
								const [k, d] = v.split(":") as [SortKey, "asc" | "desc"];
								setSortKey(k);
								setSortDir(d);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(selectField, "min-w-[10rem]")}>
								<SelectValue placeholder="Sort" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="reviewedAt:desc">Newest reviewed</SelectItem>
								<SelectItem value="reviewedAt:asc">Oldest reviewed</SelectItem>
								<SelectItem value="records:desc">Most claims</SelectItem>
								<SelectItem value="records:asc">Fewest claims</SelectItem>
								<SelectItem value="decision:asc">Decision A–Z</SelectItem>
								<SelectItem value="vendor:asc">Vendor A–Z</SelectItem>
							</SelectContent>
						</Select>
						{hasActiveFilters ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 px-2.5 text-xs text-muted-foreground"
								onClick={clearFilters}
							>
								Clear
							</Button>
						) : null}
					</div>
				</div>
			</section>

			{/* Table — CMS EDGE reporting layout */}
			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
					<p className="text-sm font-semibold text-foreground">
						Reviewed outbound{" "}
						<span className="font-normal text-muted-foreground">
							({rows.length})
						</span>
					</p>
					<span className="text-xs tabular-nums text-muted-foreground">
						{formatCount(rows.reduce((s, f) => s + f.records, 0))} claims
					</span>
				</div>

				<CmsEdgeTableScroll>
					<Table
						containerClassName={CMS_EDGE_TABLE_CONTAINER}
						className="w-full min-w-[1080px] text-xs"
					>
						<TableHeader>
							<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
								<TableHead className={cn(th, "w-12 pl-4 text-center")}>
									#
								</TableHead>
								<TableHead className={th}>File ID</TableHead>
								<TableHead className={th}>
									<button
										type="button"
										className="inline-flex items-center gap-1"
										onClick={() => toggleSort("vendor")}
									>
										Vendor
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={th}>
									<button
										type="button"
										className="inline-flex items-center gap-1"
										onClick={() => toggleSort("decision")}
									>
										Decision
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={cn(th, "text-right")}>
									<button
										type="button"
										className="ml-auto inline-flex items-center gap-1"
										onClick={() => toggleSort("records")}
									>
										Claims
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={th}>Reasons</TableHead>
								<TableHead className={th}>Send</TableHead>
								<TableHead className={th}>
									<button
										type="button"
										className="inline-flex items-center gap-1"
										onClick={() => toggleSort("reviewedAt")}
									>
										Reviewed
										<ArrowUpDown className="size-3 opacity-60" />
									</button>
								</TableHead>
								<TableHead className={cn(th, "pr-4 text-right")}>
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={9}
										className="px-4 py-12 text-center text-sm text-muted-foreground"
									>
										{hasActiveFilters
											? "No outbound packages match your filters."
											: "No outbound packages for this program."}
									</TableCell>
								</TableRow>
							) : (
								pageRows.map((row, index) => (
									<TableRow
										key={row.id}
										className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/25"
										onClick={() => setSelectedFileId(row.id)}
									>
										<TableCell
											className={cn(
												td,
												"w-12 pl-4 text-center tabular-nums text-muted-foreground"
											)}
										>
											{(safePage - 1) * pageSize + index + 1}
										</TableCell>
										<TableCell className={td}>
											<div className="min-w-0 space-y-0.5">
												<div className="flex flex-wrap items-center gap-1.5">
													<span className="font-mono text-[11px] font-medium text-primary">
														{row.fileId}
													</span>
													<TxBadge type={row.transactionType} />
													<span className="text-[10px] text-muted-foreground">
														{row.program}
													</span>
												</div>
												<p className="max-w-[260px] truncate text-[11px] text-muted-foreground">
													{row.sourceInboundFileId
														? `From ${row.sourceInboundFileId}`
														: row.fileName}
												</p>
											</div>
										</TableCell>
										<TableCell className={cn(td, "font-medium")}>
											{row.vendor}
										</TableCell>
										<TableCell className={td}>
											<DecisionPill status={row.reviewStatus} />
										</TableCell>
										<TableCell
											className={cn(td, "text-right font-medium tabular-nums")}
										>
											<div>
												{formatCount(row.records)}
												<p className="text-[10px] font-normal text-muted-foreground">
													<span className="text-emerald-700">
														{row.accepted} ok
													</span>
													{" · "}
													<span className="text-rose-700">{row.denied} dn</span>
												</p>
											</div>
										</TableCell>
										<TableCell className={td}>
											{row.rejectReasons.length === 0 ? (
												<span className="text-muted-foreground">—</span>
											) : (
												<div className="flex flex-wrap gap-1">
													{row.rejectReasons.map((r) => (
														<span
															key={r.code}
															title={r.description}
															className="rounded-sm border border-rose-200/80 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-800"
														>
															{r.code}
														</span>
													))}
												</div>
											)}
										</TableCell>
										<TableCell className={td}>
											<SendStatusPill status={row.outboundSendStatus} />
										</TableCell>
										<TableCell
											className={cn(td, "tabular-nums text-muted-foreground")}
										>
											<div>
												<p>{row.reviewedAt ?? "—"}</p>
												<p className="text-[10px]">{row.reviewedBy}</p>
											</div>
										</TableCell>
										<TableCell
											className={cn(td, "pr-4 text-right")}
											onClick={(e) => e.stopPropagation()}
										>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-7 text-muted-foreground hover:text-foreground"
														aria-label={`Actions for ${row.fileId}`}
													>
														<MoreHorizontal className="size-3.5" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-48">
													<DropdownMenuItem
														onClick={() => setSelectedFileId(row.id)}
													>
														<Eye className="mr-2 size-3.5" />
														Open claims
													</DropdownMenuItem>
													<DropdownMenuItem asChild>
														<Link
															href={`/admin/claim-encounter/files/${encodeURIComponent(row.id)}`}
														>
															<ExternalLink className="mr-2 size-3.5" />
															Full page
														</Link>
													</DropdownMenuItem>
													{useLive &&
													(row.reviewStatus === "accepted" ||
														row.outboundSendStatus === "queued") ? (
														<DropdownMenuItem
															onClick={() => void handleSend(row)}
															disabled={sendMutation.isPending}
														>
															<Send className="mr-2 size-3.5" />
															Send
														</DropdownMenuItem>
													) : null}
													{useLive ? (
														<DropdownMenuItem
															onClick={() => void handleDownloadEdi(row)}
														>
															<Download className="mr-2 size-3.5" />
															Download EDI
														</DropdownMenuItem>
													) : null}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CmsEdgeTableScroll>

				<div className="border-t border-border/50">
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
				</div>
			</section>

			<div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
				<CmsEdgeSectionPanel
					title="Decision mix"
					subtitle="Package-level MFC outcomes"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					{analytics.decisionPie.length === 0 ? (
						<div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
							No packages in scope
						</div>
					) : (
						<div className="flex flex-1 flex-col justify-center gap-4">
							<div className="flex items-center gap-3">
								<div className="relative h-[112px] w-[112px] shrink-0">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={analytics.decisionPie}
												dataKey="value"
												nameKey="name"
												innerRadius="58%"
												outerRadius="88%"
												paddingAngle={2}
												stroke="none"
												isAnimationActive={false}
											>
												{analytics.decisionPie.map((d) => (
													<Cell key={d.name} fill={d.fill} />
												))}
											</Pie>
											<Tooltip content={<OutboundChartTooltip />} />
										</PieChart>
									</ResponsiveContainer>
									<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
										<p className="text-lg font-bold tabular-nums leading-none text-foreground">
											{analytics.decisionTotal}
										</p>
										<p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
											Packages
										</p>
									</div>
								</div>
								<div className="min-w-0 flex-1 space-y-1.5">
									{analytics.decisionPie.map((d) => {
										const isAccepted = d.name === "Accepted";
										const active = isAccepted
											? decision === "accepted"
											: decision === "denied";
										return (
											<button
												key={d.name}
												type="button"
												onClick={() => {
													setDecision((cur) =>
														cur === (isAccepted ? "accepted" : "denied")
															? "all"
															: isAccepted
																? "accepted"
																: "denied"
													);
													setPage(1);
												}}
												className={cn(
													"flex w-full items-center justify-between gap-2 rounded-sm border px-2 py-1.5 text-left text-xs transition",
													active
														? isAccepted
															? "border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/30"
															: "border-rose-300/80 bg-rose-50 dark:bg-rose-950/30"
														: "border-border/60 hover:bg-muted/40"
												)}
											>
												<span className="flex min-w-0 items-center gap-1.5 font-medium">
													<span
														className="size-2 shrink-0 rounded-full"
														style={{ backgroundColor: d.fill }}
													/>
													<span className="truncate">{d.name}</span>
												</span>
												<span className="shrink-0 tabular-nums text-muted-foreground">
													{d.value}
													<span className="ml-1 text-[10px]">
														(
														{pct(d.value, Math.max(1, analytics.decisionTotal))}
														%)
													</span>
												</span>
											</button>
										);
									})}
								</div>
							</div>
							<div className="space-y-1.5 border-t border-border/40 pt-3">
								<div className="flex items-center justify-between text-[10px]">
									<span className="text-muted-foreground">
										Claim accept rate
									</span>
									<span className="font-semibold tabular-nums text-foreground">
										{analytics.acceptRate}%
									</span>
								</div>
								<div className="h-1.5 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
										style={{ width: `${analytics.acceptRate}%` }}
									/>
								</div>
							</div>
						</div>
					)}
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Transmission pipeline"
					subtitle="Where packages stand after review"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					<div className="flex flex-1 flex-col gap-3">
						<div className="flex h-9 shrink-0 overflow-hidden rounded-sm ring-1 ring-inset ring-border/60">
							{analytics.sendPipeline.map((stage) => {
								const widthPct = Math.max(
									stage.value > 0 ? 14 : 0,
									(stage.value / analytics.pipelineTotal) * 100
								);
								if (stage.value === 0) return null;
								return (
									<button
										key={stage.id}
										type="button"
										title={`${stage.name}: ${stage.value}`}
										onClick={() => {
											setSendStatus((s) => (s === stage.id ? "all" : stage.id));
											setPage(1);
										}}
										className={cn(
											"relative flex min-w-0 items-center justify-center text-[11px] font-semibold text-white transition hover:brightness-110",
											stage.tone,
											sendStatus === stage.id &&
												"ring-2 ring-inset ring-white/40"
										)}
										style={{ width: `${widthPct}%` }}
									>
										<span className="truncate px-1 tabular-nums">
											{stage.value}
										</span>
									</button>
								);
							})}
							{analytics.sendPipeline.every((s) => s.value === 0) ? (
								<div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
									No pipeline volume
								</div>
							) : null}
						</div>
						<ul className="flex flex-1 flex-col justify-evenly gap-1.5">
							{analytics.sendPipeline.map((stage) => {
								const share = pct(stage.value, analytics.pipelineTotal);
								const active = sendStatus === stage.id;
								return (
									<li key={stage.id} className="min-h-0">
										<button
											type="button"
											onClick={() => {
												setSendStatus((s) =>
													s === stage.id ? "all" : stage.id
												);
												setPage(1);
											}}
											className={cn(
												"flex h-full w-full flex-col justify-center rounded-sm border px-2 py-2 text-left transition",
												active
													? "border-primary/30 bg-primary/5"
													: "border-transparent hover:bg-muted/40"
											)}
										>
											<div className="mb-1 flex items-center justify-between gap-2 text-xs">
												<span className="flex items-center gap-1.5 font-medium">
													<span
														className="size-2 rounded-full"
														style={{ backgroundColor: stage.fill }}
													/>
													{stage.name}
												</span>
												<span className="tabular-nums text-muted-foreground">
													{stage.value}{" "}
													<span className="text-[10px]">({share}%)</span>
												</span>
											</div>
											<div className="h-1.5 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full transition-all"
													style={{
														width: `${Math.max(stage.value > 0 ? 4 : 0, share)}%`,
														backgroundColor: stage.fill,
													}}
												/>
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Top rejection reasons"
					subtitle="Codes on denied / partial packages"
					className="flex h-full flex-col"
					bodyClassName="flex flex-1 flex-col p-4"
				>
					{analytics.reasonCounts.length === 0 ? (
						<p className="flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
							No rejection reasons in this program view.
						</p>
					) : (
						<ul className="flex flex-1 flex-col justify-evenly gap-1.5">
							{analytics.reasonCounts.slice(0, 3).map((r, index) => {
								const share = pct(r.count, analytics.maxReason);
								const active = reasonCode === r.code;
								return (
									<li key={r.code} className="min-h-0">
										<button
											type="button"
											className={cn(
												"flex h-full w-full flex-col justify-center rounded-sm border px-2 py-2 text-left transition",
												active
													? "border-rose-300/70 bg-rose-50/80 dark:bg-rose-950/25"
													: "border-transparent hover:bg-muted/40"
											)}
											onClick={() => {
												setReasonCode((cur) =>
													cur === r.code ? "all" : r.code
												);
												setDecision("denied");
												setPage(1);
											}}
											title={r.description}
										>
											<div className="mb-1 flex items-center justify-between gap-2">
												<span className="flex min-w-0 items-center gap-1.5">
													<span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">
														{index + 1}
													</span>
													<span className="truncate font-mono text-[11px] font-semibold tracking-tight">
														{r.code}
													</span>
												</span>
												<span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
													{r.count} pkgs
												</span>
											</div>
											<p className="mb-1 truncate text-[10px] text-muted-foreground">
												{r.description}
											</p>
											<div className="h-1.5 overflow-hidden rounded-full bg-muted">
												<div
													className={cn(
														"h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all",
														active && "from-rose-700 to-rose-500"
													)}
													style={{
														width: `${Math.max(8, share)}%`,
													}}
												/>
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</CmsEdgeSectionPanel>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<CmsEdgeSectionPanel
					title="Reviewer throughput"
					subtitle="Who signed off outbound packages"
					bodyClassName="p-4"
				>
					{analytics.byReviewer.length === 0 ? (
						<p className="py-8 text-center text-xs text-muted-foreground">
							No reviewer activity in scope.
						</p>
					) : (
						<ul className="space-y-3">
							{analytics.byReviewer.map((r) => {
								const acceptShare =
									r.files > 0 ? (r.accepted / r.files) * 100 : 0;
								const denyShare = r.files > 0 ? (r.denied / r.files) * 100 : 0;
								const otherShare = Math.max(0, 100 - acceptShare - denyShare);
								return (
									<li key={r.name} className="space-y-1.5">
										<div className="flex items-baseline justify-between gap-2 text-xs">
											<span className="truncate font-medium text-foreground">
												{r.name}
											</span>
											<span className="shrink-0 tabular-nums text-muted-foreground">
												{r.files} files ·{" "}
												<span className="text-emerald-700 dark:text-emerald-400">
													{r.accepted} ok
												</span>
												{" · "}
												<span className="text-rose-700 dark:text-rose-400">
													{r.denied} denied
												</span>
											</span>
										</div>
										<div className="flex h-2 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-black/5 dark:ring-white/10">
											{acceptShare > 0 ? (
												<div
													className="h-full bg-emerald-500"
													style={{ width: `${acceptShare}%` }}
													title={`Accepted ${r.accepted}`}
												/>
											) : null}
											{denyShare > 0 ? (
												<div
													className="h-full bg-rose-500"
													style={{ width: `${denyShare}%` }}
													title={`Denied ${r.denied}`}
												/>
											) : null}
											{otherShare > 0 ? (
												<div
													className="h-full bg-slate-300/80 dark:bg-slate-600/60"
													style={{ width: `${otherShare}%` }}
													title="Other"
												/>
											) : null}
										</div>
										<div
											className="h-1 overflow-hidden rounded-full bg-muted/60"
											title="Share of program volume"
										>
											<div
												className="h-full rounded-full bg-foreground/20"
												style={{
													width: `${pct(r.files, analytics.maxReviewer)}%`,
												}}
											/>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Vendor claim outcomes"
					subtitle="Accepted vs denied claim volume by vendor"
					bodyClassName="px-2 pb-3 pt-2"
				>
					{analytics.vendorAccept.length === 0 ? (
						<p className="py-8 text-center text-xs text-muted-foreground">
							No vendor outcomes in scope.
						</p>
					) : (
						<>
							<div className="mb-1 flex items-center justify-end gap-3 px-2 text-[10px] text-muted-foreground">
								<span className="inline-flex items-center gap-1.5">
									<span className="size-2 rounded-full bg-emerald-500" />
									Accepted
								</span>
								<span className="inline-flex items-center gap-1.5">
									<span className="size-2 rounded-full bg-rose-500" />
									Denied
								</span>
							</div>
							<div className="h-[220px]">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										layout="vertical"
										data={analytics.vendorAccept.slice(0, 6)}
										margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
										barCategoryGap={10}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											horizontal={false}
											stroke="hsl(var(--border))"
											strokeOpacity={0.55}
										/>
										<XAxis
											type="number"
											allowDecimals={false}
											tick={{
												fontSize: 10,
												fill: "hsl(var(--muted-foreground))",
											}}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											type="category"
											dataKey="short"
											width={96}
											tick={{
												fontSize: 11,
												fill: "hsl(var(--muted-foreground))",
											}}
											axisLine={false}
											tickLine={false}
										/>
										<Tooltip
											cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
											content={<OutboundChartTooltip />}
										/>
										<Bar
											dataKey="accepted"
											name="Accepted"
											stackId="a"
											fill="#059669"
											barSize={14}
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
											name="Denied"
											stackId="a"
											fill="#f43f5e"
											radius={[0, 4, 4, 0]}
											barSize={14}
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
						</>
					)}
				</CmsEdgeSectionPanel>
			</div>
		</div>
	);
}

function OutboundChartTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{
		name?: string;
		value?: number | string;
		color?: string;
		payload?: { name?: string };
	}>;
	label?: string | number;
}) {
	if (!active || !payload?.length) return null;
	const title =
		typeof label === "string" || typeof label === "number"
			? String(label)
			: (payload[0]?.payload?.name ?? "");

	return (
		<div className="rounded-sm border border-border/70 bg-card px-2.5 py-1.5 text-xs shadow-md">
			{title ? (
				<p className="mb-1 font-medium text-foreground">{title}</p>
			) : null}
			<ul className="space-y-0.5">
				{payload.map((entry) => (
					<li
						key={`${entry.name}-${entry.value}`}
						className="flex items-center justify-between gap-4 tabular-nums text-muted-foreground"
					>
						<span className="inline-flex items-center gap-1.5">
							<span
								className="size-1.5 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							{entry.name}
						</span>
						<span className="font-medium text-foreground">
							{typeof entry.value === "number"
								? entry.value.toLocaleString()
								: entry.value}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function OutboundFileWorkspace({
	file,
	useLive,
	onBack,
}: {
	file: ClaimVendorFile;
	useLive: boolean;
	onBack: () => void;
}) {
	return (
		<VendorFileWorkspace
			file={file}
			useLive={useLive}
			backLabel="Outbound"
			onBack={onBack}
			negativeLabel="denied"
			statusPills={
				<>
					<DecisionPill status={file.reviewStatus} />
					<SendStatusPill status={file.outboundSendStatus} />
				</>
			}
			metaExtra={
				file.sourceInboundFileId ? (
					<>
						<span className="text-border">·</span>
						<span className="font-mono tabular-nums">
							← {file.sourceInboundFileId}
						</span>
					</>
				) : null
			}
		/>
	);
}

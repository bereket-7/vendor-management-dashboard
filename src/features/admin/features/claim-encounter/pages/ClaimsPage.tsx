"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowRight,
	Banknote,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Code2,
	Download,
	FileInput,
	MessageSquareReply,
	MoreHorizontal,
	RefreshCw,
	Search,
	SlidersHorizontal,
	XCircle,
} from "lucide-react";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	CMS_EDGE_KPI_CARD_CLASS,
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { EdiViewerDialog } from "@/features/admin/features/claim-encounter/edi";
import {
	type ClaimLine,
	SHOWCASE_CLAIM_DETAIL,
	formatCount,
	formatCurrency,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import {
	useDeleteClaimLine,
	useVendorCoreClaimLines,
} from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { claimLineDtosToClaimLines } from "@/features/admin/features/claim-encounter/live-claims";
import { CLAIM_LINES } from "@/features/admin/features/claim-encounter/mock-data";
import { VENDOR_NAMES } from "@/features/admin/features/vendors/vendor-integration-mock";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { Link, useRouter } from "@/i18n/navigation";
import { downloadCsv, stampFilename } from "@/lib/export/csv";
import { isClaimVendorFilesMockEnabled, isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const PANEL = CMS_EDGE_PANEL_CLASS;

const MEMBER_NAMES = [
	"Jordan Lee",
	"Ava Patel",
	"Marcus Chen",
	"Sofia Ramirez",
	"Noah Brooks",
	"Amara Wells",
	"Liam Ortiz",
	"Harper Diaz",
];
const PAYERS = ["MDH Medicaid", "DHCF QHP", "BHP Commercial", "Gainwell"];
const GROUPS = ["GRP-4401", "GRP-5510", "GRP-6622", "GRP-7733"];
const PLANS = ["MDH Standard", "DHCF Plus", "BHP Select", "Essential Care"];

type ClaimWorkbenchRow = ClaimLine & {
	memberName: string;
	providerNpi: string;
	payer: string;
	group: string;
	plan: string;
	authNumber: string;
	rxNumber: string;
	priority: "Normal" | "High" | "Urgent";
	claimStatus: string;
	responseStatus: string;
	receivedAt: string;
	fileName: string;
	displayClaimType: string;
};

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const compactFieldClass = cn(
	"h-8 rounded-sm border border-border bg-background text-xs shadow-none transition-colors duration-200",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

const th =
	"h-9 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-3 py-2.5 text-[12px] align-middle text-foreground";

function toClaimType(label: string) {
	const value = label.toLowerCase();
	if (value.includes("pharm")) return "Pharmacy";
	if (value.includes("dental") || value.includes("vision")) return "Dental";
	if (value.includes("encounter")) return "Encounter";
	return "Medical";
}

function claimStatusFrom(line: ClaimLine) {
	if (line.gainwellStatus === "paid") return "Paid";
	if (line.gainwellStatus === "denied") return "Denied";
	if (line.gainwellStatus === "rejected") return "Rejected";
	if (line.gainwellStatus === "partial") return "Partial";
	return "Pending";
}

function responseStatusFrom(line: ClaimLine) {
	if (line.mfcReviewStatus === "accepted") return "Accepted";
	if (line.mfcReviewStatus === "rejected") return "Rejected";
	if (line.mfcReviewStatus === "denied") return "Denied";
	return "Pending";
}

function enrichClaim(line: ClaimLine, index: number): ClaimWorkbenchRow {
	const file = getVendorFile(line.fileId);
	const seq = Number(line.claimId.replace(/\D/g, "")) || index;
	return {
		...line,
		memberName: MEMBER_NAMES[seq % MEMBER_NAMES.length]!,
		providerNpi: String(1000000000 + ((seq * 17) % 899999999)),
		payer: PAYERS[seq % PAYERS.length]!,
		group: GROUPS[seq % GROUPS.length]!,
		plan: PLANS[seq % PLANS.length]!,
		authNumber: seq % 3 === 0 ? `AUTH-${600000 + seq}` : "",
		rxNumber:
			toClaimType(line.claimType) === "Pharmacy" ? `RX-${800000 + seq}` : "",
		priority: seq % 11 === 0 ? "Urgent" : seq % 5 === 0 ? "High" : "Normal",
		claimStatus: claimStatusFrom(line),
		responseStatus: responseStatusFrom(line),
		receivedAt: file?.receivedAt ?? `${line.dateOfService} 09:00`,
		fileName: file?.fileName ?? `${line.fileId}.edi`,
		displayClaimType: toClaimType(line.claimType),
	};
}

function showcaseRow(): ClaimWorkbenchRow {
	return {
		id: SHOWCASE_CLAIM_DETAIL.id,
		claimId: SHOWCASE_CLAIM_DETAIL.claimId,
		memberId: SHOWCASE_CLAIM_DETAIL.memberId,
		provider: SHOWCASE_CLAIM_DETAIL.provider,
		vendor: SHOWCASE_CLAIM_DETAIL.vendor,
		account: "MED-ACC-1",
		claimType: SHOWCASE_CLAIM_DETAIL.claimType,
		dateOfService: SHOWCASE_CLAIM_DETAIL.dateOfService,
		amountBilled: SHOWCASE_CLAIM_DETAIL.amountBilled,
		amountPaid: SHOWCASE_CLAIM_DETAIL.amountPaid,
		submissionStatus: "accepted",
		gainwellStatus: "paid",
		mfcReviewStatus: "accepted",
		rejectReason: null,
		rejectReasons: [],
		responseFileName: SHOWCASE_CLAIM_DETAIL.edi835FileName,
		traceId: SHOWCASE_CLAIM_DETAIL.traceId,
		batchId: SHOWCASE_CLAIM_DETAIL.batchId,
		fileId: SHOWCASE_CLAIM_DETAIL.fileId,
		responseId: SHOWCASE_CLAIM_DETAIL.responseId,
		program: SHOWCASE_CLAIM_DETAIL.program,
		direction: "inbound",
		memberName: SHOWCASE_CLAIM_DETAIL.memberName,
		providerNpi: SHOWCASE_CLAIM_DETAIL.providerNpi,
		payer: SHOWCASE_CLAIM_DETAIL.payer,
		group: SHOWCASE_CLAIM_DETAIL.group,
		plan: SHOWCASE_CLAIM_DETAIL.plan,
		authNumber: SHOWCASE_CLAIM_DETAIL.authNumber,
		rxNumber: "",
		priority: SHOWCASE_CLAIM_DETAIL.priority,
		claimStatus: SHOWCASE_CLAIM_DETAIL.status,
		responseStatus: "Accepted",
		receivedAt: SHOWCASE_CLAIM_DETAIL.receivedAt,
		fileName: SHOWCASE_CLAIM_DETAIL.fileName,
		displayClaimType: "Medical",
	};
}

function needsAttention(row: ClaimWorkbenchRow) {
	return (
		row.claimStatus === "Denied" ||
		row.claimStatus === "Rejected" ||
		row.claimStatus === "Partial" ||
		row.priority === "Urgent"
	);
}

function PriorityPill({
	priority,
}: {
	priority: ClaimWorkbenchRow["priority"];
}) {
	if (priority === "Normal") return null;
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold",
				priority === "Urgent"
					? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
					: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
			)}
		>
			{priority}
		</span>
	);
}

/** Prefer claim-file fixtures (default on) so Claims mirrors inbound/outbound mock seed. */
export function ClaimsPage() {
	const useFixtures = isMockEnabled() || isClaimVendorFilesMockEnabled();
	if (!useFixtures) {
		return (
			<VendorCoreGate title="Claims">
				<ClaimsBody useLive />
			</VendorCoreGate>
		);
	}
	return <ClaimsBody useLive={false} />;
}

function ClaimsBody({ useLive }: { useLive: boolean }) {
	const router = useRouter();
	const program = useAdminModuleStore((s) => s.fileType);
	const liveQuery = useVendorCoreClaimLines(useLive);
	const deleteClaimLine = useDeleteClaimLine();

	const [search, setSearch] = useState("");
	const [vendor, setVendor] = useState("all");
	const [claimStatus, setClaimStatus] = useState("all");
	const [claimType, setClaimType] = useState("all");
	const [payer, setPayer] = useState("all");
	const [responseStatus, setResponseStatus] = useState("all");
	const [priority, setPriority] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [ediRow, setEdiRow] = useState<ClaimWorkbenchRow | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	const allRows = useMemo(() => {
		if (useLive) {
			return claimLineDtosToClaimLines(liveQuery.data ?? [], program).map(
				enrichClaim
			);
		}

		const rows = CLAIM_LINES.filter((line) => line.program === program).map(
			enrichClaim
		);
		if (program === SHOWCASE_CLAIM_DETAIL.program) {
			return [showcaseRow(), ...rows];
		}
		return rows;
	}, [useLive, liveQuery.data, program]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return allRows.filter((row) => {
			if (q) {
				const hay = [
					row.claimId,
					row.memberId,
					row.memberName,
					row.provider,
					row.providerNpi,
					row.vendor,
					row.payer,
				]
					.join(" ")
					.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			if (vendor !== "all" && row.vendor !== vendor) return false;
			if (claimStatus !== "all" && row.claimStatus !== claimStatus)
				return false;
			if (claimType !== "all" && row.displayClaimType !== claimType)
				return false;
			if (payer !== "all" && row.payer !== payer) return false;
			if (responseStatus !== "all" && row.responseStatus !== responseStatus)
				return false;
			if (priority !== "all" && row.priority !== priority) return false;
			return true;
		});
	}, [
		allRows,
		search,
		vendor,
		claimStatus,
		claimType,
		payer,
		responseStatus,
		priority,
	]);

	const stats = useMemo(() => {
		const paid = filtered.filter((r) => r.claimStatus === "Paid").length;
		const pending = filtered.filter((r) => r.claimStatus === "Pending").length;
		const denied = filtered.filter((r) => r.claimStatus === "Denied").length;
		const rejected = filtered.filter(
			(r) => r.claimStatus === "Rejected"
		).length;
		const partial = filtered.filter((r) => r.claimStatus === "Partial").length;
		const attentionRows = filtered.filter(needsAttention);
		const billed = filtered.reduce((s, r) => s + r.amountBilled, 0);
		const paidAmt = filtered.reduce((s, r) => s + r.amountPaid, 0);
		const payRate = billed > 0 ? Math.round((paidAmt / billed) * 1000) / 10 : 0;
		const health =
			denied + rejected > filtered.length * 0.15
				? ("At Risk" as const)
				: attentionRows.length > 0
					? ("Watch" as const)
					: ("On Track" as const);
		return {
			total: filtered.length,
			paid,
			pending,
			denied,
			rejected,
			partial,
			attention: attentionRows.length,
			attentionRows,
			billed,
			paidAmt,
			payRate,
			health,
		};
	}, [filtered]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = filtered.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize
	);
	const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const rangeEnd = Math.min(safePage * pageSize, filtered.length);

	const hasFilters =
		Boolean(search.trim()) ||
		vendor !== "all" ||
		claimStatus !== "all" ||
		claimType !== "all" ||
		payer !== "all" ||
		responseStatus !== "all" ||
		priority !== "all";

	const extraFilterCount =
		(payer !== "all" ? 1 : 0) +
		(responseStatus !== "all" ? 1 : 0) +
		(priority !== "all" ? 1 : 0);

	const loading = useLive && liveQuery.isLoading;

	const kpis = [
		{
			id: "paid",
			label: "Paid",
			value: stats.paid,
			hint: `${formatCurrency(stats.paidAmt)} settled`,
			icon: CheckCircle2,
			well: "bg-emerald-600",
			accent: "from-emerald-600 to-emerald-400",
			valueTone: "text-emerald-700 dark:text-emerald-300",
			ring: "ring-emerald-500/25",
			active: claimStatus === "Paid",
			onClick: () => {
				setClaimStatus((s) => (s === "Paid" ? "all" : "Paid"));
				setPage(1);
			},
		},
		{
			id: "pending",
			label: "Pending",
			value: stats.pending,
			hint: `${stats.partial} partial in flight`,
			icon: Clock3,
			well: "bg-primary",
			accent: "from-primary to-primary/50",
			valueTone: "text-primary",
			ring: "ring-primary/25",
			active: claimStatus === "Pending",
			onClick: () => {
				setClaimStatus((s) => (s === "Pending" ? "all" : "Pending"));
				setPage(1);
			},
		},
		{
			id: "attention",
			label: "Attention",
			value: stats.attention,
			hint: `${stats.denied} denied · ${stats.rejected} rejected`,
			icon: AlertTriangle,
			well: "bg-amber-500",
			accent: "from-amber-500 to-amber-400",
			valueTone: "text-amber-700 dark:text-amber-300",
			ring: "ring-amber-500/25",
			active: claimStatus === "Denied",
			onClick: () => {
				setClaimStatus((s) => (s === "Denied" ? "all" : "Denied"));
				setPage(1);
			},
		},
		{
			id: "billed",
			label: "Billed",
			value: formatCurrency(stats.billed),
			hint: `${stats.payRate}% paid ratio`,
			icon: Banknote,
			well: "bg-primary",
			accent: "from-primary to-primary/40",
			valueTone: "text-primary",
			ring: "ring-primary/25",
			active: false,
			onClick: undefined as (() => void) | undefined,
		},
	] as const;

	const lifecycle = [
		{
			id: "received",
			label: "Received",
			detail: `${formatCount(stats.total)} in queue`,
			icon: FileInput,
			state: "done" as const,
		},
		{
			id: "review",
			label: "Under review",
			detail: `${formatCount(stats.pending + stats.partial)} open`,
			icon: Clock3,
			state:
				stats.pending + stats.partial > 0
					? ("active" as const)
					: ("done" as const),
		},
		{
			id: "response",
			label: "Response",
			detail: `${formatCount(stats.denied + stats.rejected)} adverse`,
			icon: MessageSquareReply,
			state:
				stats.denied + stats.rejected > 0
					? ("active" as const)
					: ("pending" as const),
		},
		{
			id: "settled",
			label: "Settled",
			detail: `${formatCount(stats.paid)} paid`,
			icon: CheckCircle2,
			state: stats.paid > 0 ? ("done" as const) : ("pending" as const),
		},
	];

	function clearFilters() {
		setSearch("");
		setVendor("all");
		setClaimStatus("all");
		setClaimType("all");
		setPayer("all");
		setResponseStatus("all");
		setPriority("all");
		setPage(1);
	}

	function openClaim(row: ClaimWorkbenchRow) {
		router.push(
			`/admin/claim-encounter/claims/${encodeURIComponent(row.claimId)}`
		);
	}

	async function handleRefresh() {
		setRefreshing(true);
		try {
			if (useLive) await liveQuery.refetch();
			toast.success("Claims refreshed");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Refresh failed");
		} finally {
			setRefreshing(false);
		}
	}

	function exportCsv() {
		if (filtered.length === 0) {
			toast.message("No claims to export with the current filters.");
			return;
		}
		downloadCsv(
			stampFilename("claims"),
			[
				"Claim ID",
				"Member",
				"Member ID",
				"Provider",
				"Vendor",
				"Payer",
				"Claim Type",
				"Claim Status",
				"Response Status",
				"Amount Billed",
				"Amount Paid",
				"DOS",
				"Received At",
			],
			filtered.map((row) => [
				row.claimId,
				row.memberName,
				row.memberId,
				row.provider,
				row.vendor,
				row.payer,
				row.displayClaimType,
				row.claimStatus,
				row.responseStatus,
				row.amountBilled,
				row.amountPaid,
				row.dateOfService,
				row.receivedAt,
			])
		);
		toast.success(`Downloaded CSV for ${filtered.length} claim(s).`);
	}

	async function softDelete(row: ClaimWorkbenchRow) {
		try {
			await deleteClaimLine.mutateAsync(row.id);
			toast.success("Claim line soft-deleted.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Delete failed.");
		}
	}

	if (loading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full max-w-md" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-72 w-full" />
			</div>
		);
	}

	return (
		<div className={CMS_EDGE_PAGE_STACK}>
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Claims
					</h1>
					<p className="text-sm text-muted-foreground">
						Claim workbench · {program} · {formatCount(stats.total)}{" "}
						{stats.total === 1 ? "claim" : "claims"}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={exportCsv}
					>
						<Download className="size-3.5" />
						Export
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={() => void handleRefresh()}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{useLive && liveQuery.error ? (
				<div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
					Could not load claims: {liveQuery.error.message}
				</div>
			) : null}

			{useLive && !liveQuery.isLoading && allRows.length === 0 ? (
				<div className="rounded-sm border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
					No claim lines yet. Seed with{" "}
					<code className="rounded bg-muted px-1 py-0.5 text-xs">
						npm run seed:claim-lines
					</code>
					, then refresh.
				</div>
			) : null}

			{/* Primary health banner — CMS reporting */}
			<section className="rounded-sm border border-primary/20 bg-primary px-4 py-4 text-primary-foreground shadow-[0_1px_3px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.06)] sm:px-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="min-w-0 space-y-1.5">
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
								Workbench status
							</p>
							<span className="inline-flex items-center gap-1.5 rounded-sm border border-primary-foreground/25 bg-primary-foreground/10 px-2 py-0.5 text-[11px] font-medium">
								<span
									className={cn(
										"size-1.5 rounded-full",
										stats.health === "On Track"
											? "bg-emerald-300"
											: stats.health === "Watch"
												? "bg-amber-300"
												: "bg-rose-300"
									)}
								/>
								{stats.health}
							</span>
						</div>
						<p className="text-base font-semibold tracking-tight sm:text-lg">
							{formatCount(stats.total)} claims · {program}
						</p>
						<p className="text-xs text-primary-foreground/75">
							{formatCount(stats.paid)} paid · {formatCount(stats.pending)}{" "}
							pending · {formatCount(stats.attention)} need attention
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-5 sm:gap-6">
						<div className="min-w-34">
							<p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
								Paid ratio
							</p>
							<p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
								{stats.payRate}%
							</p>
							<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary-foreground/20">
								<div
									className="h-full rounded-full bg-primary-foreground transition-all"
									style={{ width: `${Math.min(stats.payRate, 100)}%` }}
								/>
							</div>
						</div>
						{stats.attention > 0 ? (
							<Button
								size="sm"
								className="h-9 gap-1.5 rounded-sm border-0 bg-primary-foreground text-primary shadow-none hover:bg-primary-foreground/90"
								onClick={() => {
									setClaimStatus("Denied");
									setPage(1);
								}}
							>
								Work attention
								<ArrowRight className="size-3.5" />
							</Button>
						) : null}
					</div>
				</div>
			</section>

			{/* KPI cards — CMS reporting style */}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					const interactive = Boolean(kpi.onClick);
					const className = cn(
						CMS_EDGE_KPI_CARD_CLASS,
						"text-left",
						kpi.active
							? cn("border-transparent ring-1", kpi.ring)
							: "border-border/70"
					);
					const body = (
						<>
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
										{typeof kpi.value === "number"
											? kpi.value.toLocaleString()
											: kpi.value}
									</p>
									<p className="mt-1.5 text-xs text-muted-foreground">
										{kpi.hint}
									</p>
								</div>
								<span
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm",
										kpi.well
									)}
								>
									<Icon className="size-[18px] text-white" aria-hidden />
								</span>
							</div>
						</>
					);
					return interactive ? (
						<button
							key={kpi.id}
							type="button"
							onClick={kpi.onClick}
							className={className}
						>
							{body}
						</button>
					) : (
						<div key={kpi.id} className={className}>
							{body}
						</div>
					);
				})}
			</div>

			{/* Lifecycle strip */}
			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
					<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						Claim lifecycle
					</p>
					<span className="text-[11px] text-muted-foreground">{program}</span>
				</div>
				<ol className="grid gap-0 sm:grid-cols-4">
					{lifecycle.map((step, index) => {
						const Icon = step.icon;
						const isLast = index === lifecycle.length - 1;
						return (
							<li
								key={step.id}
								className={cn(
									"relative flex gap-3 px-4 py-4",
									!isLast && "sm:border-r sm:border-border/50"
								)}
							>
								<span
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-full",
										step.state === "done" && "bg-emerald-600 text-white",
										step.state === "active" &&
											"bg-primary text-primary-foreground ring-4 ring-primary/20",
										step.state === "pending" && "bg-muted text-muted-foreground"
									)}
								>
									<Icon className="size-4" />
								</span>
								<div className="min-w-0">
									<p className="text-[12px] font-semibold text-foreground">
										{step.label}
									</p>
									<p className="mt-0.5 text-[11px] text-muted-foreground">
										{step.detail}
									</p>
								</div>
							</li>
						);
					})}
				</ol>
			</section>

			{/* Filters */}
			<section className={cn(PANEL, "px-3 py-2.5")}>
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative min-w-40 flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search claim, member, provider, NPI…"
							className={cn(compactFieldClass, "w-full pl-8")}
						/>
					</div>
					<div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
						<Select
							value={vendor}
							onValueChange={(v) => {
								setVendor(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(compactFieldClass, "w-37.5")}>
								<SelectValue placeholder="Vendor" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All vendors</SelectItem>
								{VENDOR_NAMES.map((name) => (
									<SelectItem key={name} value={name}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={claimStatus}
							onValueChange={(v) => {
								setClaimStatus(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(compactFieldClass, "w-35")}>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								{(
									["Paid", "Pending", "Partial", "Denied", "Rejected"] as const
								).map((status) => (
									<SelectItem key={status} value={status}>
										{status}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={claimType}
							onValueChange={(v) => {
								setClaimType(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(compactFieldClass, "w-32.5")}>
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All types</SelectItem>
								{(["Medical", "Pharmacy", "Dental", "Encounter"] as const).map(
									(type) => (
										<SelectItem key={type} value={type}>
											{type}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									className={cn(
										compactFieldClass,
										"h-8 gap-1.5 px-2.5 shadow-none",
										extraFilterCount > 0 && "border-primary/40 bg-primary/5"
									)}
								>
									<SlidersHorizontal className="size-3.5 shrink-0" />
									More
									{extraFilterCount > 0 ? (
										<span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
											{extraFilterCount}
										</span>
									) : null}
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-72 space-y-3 p-3">
								<div className="space-y-1">
									<p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
										Payer
									</p>
									<Select
										value={payer}
										onValueChange={(v) => {
											setPayer(v);
											setPage(1);
										}}
									>
										<SelectTrigger className={cn(compactFieldClass, "w-full")}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All payers</SelectItem>
											{PAYERS.map((p) => (
												<SelectItem key={p} value={p}>
													{p}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
										Response
									</p>
									<Select
										value={responseStatus}
										onValueChange={(v) => {
											setResponseStatus(v);
											setPage(1);
										}}
									>
										<SelectTrigger className={cn(compactFieldClass, "w-full")}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All responses</SelectItem>
											{(
												["Accepted", "Rejected", "Denied", "Pending"] as const
											).map((status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
										Priority
									</p>
									<Select
										value={priority}
										onValueChange={(v) => {
											setPriority(v);
											setPage(1);
										}}
									>
										<SelectTrigger className={cn(compactFieldClass, "w-full")}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All priorities</SelectItem>
											{(["Normal", "High", "Urgent"] as const).map((p) => (
												<SelectItem key={p} value={p}>
													{p}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</PopoverContent>
						</Popover>
						{hasFilters ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2 text-xs text-muted-foreground"
								onClick={clearFilters}
							>
								Clear
							</Button>
						) : null}
					</div>
				</div>
			</section>

			{/* Claim table */}
			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
					<p className="text-sm font-semibold text-foreground">
						{formatCount(filtered.length)}{" "}
						{filtered.length === 1 ? "claim" : "claims"}
					</p>
				</div>

				{pageRows.length === 0 ? (
					<p className="px-4 py-16 text-center text-sm text-muted-foreground">
						{hasFilters
							? "No claims match your filters."
							: useLive
								? "No claims yet. Run npm run seed:claim-lines."
								: "No mock claims for this program."}
					</p>
				) : (
					<>
						<div className={CMS_EDGE_TABLE_CONTAINER}>
							<CmsEdgeTableScroll>
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead
												className={cn(th, "w-12 pl-3 text-right tabular-nums")}
											>
												#
											</TableHead>
											<TableHead className={th}>Claim</TableHead>
											<TableHead className={th}>Member</TableHead>
											<TableHead className={th}>Provider</TableHead>
											<TableHead className={th}>DOS</TableHead>
											<TableHead className={th}>Status</TableHead>
											<TableHead className={cn(th, "text-right")}>
												Charge
											</TableHead>
											<TableHead className={th}>Vendor</TableHead>
											<TableHead className={cn(th, "pr-3")} />
										</TableRow>
									</TableHeader>
									<TableBody>
										{pageRows.map((row, index) => (
											<TableRow
												key={row.id}
												className="cursor-pointer hover:bg-muted/30"
												onClick={() => openClaim(row)}
											>
												<TableCell
													className={cn(
														td,
														"w-12 pl-3 text-right tabular-nums text-muted-foreground"
													)}
												>
													{(safePage - 1) * pageSize + index + 1}
												</TableCell>
												<TableCell className={td}>
													<div className="flex flex-wrap items-center gap-1.5">
														<Link
															href={`/admin/claim-encounter/claims/${encodeURIComponent(row.claimId)}`}
															className="font-mono text-xs font-semibold text-primary hover:underline"
															onClick={(e) => e.stopPropagation()}
														>
															{row.claimId}
														</Link>
														<PriorityPill priority={row.priority} />
													</div>
													<p className="mt-0.5 text-[10px] text-muted-foreground">
														{row.displayClaimType}
													</p>
												</TableCell>
												<TableCell className={td}>
													<p className="truncate text-xs font-medium">
														{row.memberName}
													</p>
													<p className="font-mono text-[10px] text-muted-foreground">
														{row.memberId}
													</p>
												</TableCell>
												<TableCell className={cn(td, "max-w-35")}>
													<p className="truncate">{row.provider}</p>
													<p className="font-mono text-[10px] text-muted-foreground">
														{row.providerNpi}
													</p>
												</TableCell>
												<TableCell
													className={cn(
														td,
														"tabular-nums text-muted-foreground"
													)}
												>
													{row.dateOfService}
												</TableCell>
												<TableCell className={td}>
													<div className="flex flex-col items-start gap-1">
														<StatusBadge status={row.claimStatus} />
														<span className="text-[10px] text-muted-foreground">
															{row.responseStatus}
														</span>
													</div>
												</TableCell>
												<TableCell
													className={cn(td, "text-right tabular-nums")}
												>
													<p className="font-medium">
														{formatCurrency(row.amountBilled)}
													</p>
													<p className="text-[10px] text-muted-foreground">
														paid {formatCurrency(row.amountPaid)}
													</p>
												</TableCell>
												<TableCell className={cn(td, "max-w-30")}>
													<p className="truncate">{row.vendor}</p>
													<p className="truncate text-[10px] text-muted-foreground">
														{row.payer}
													</p>
												</TableCell>
												<TableCell
													className={cn(td, "pr-3 text-right")}
													onClick={(e) => e.stopPropagation()}
												>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="size-7"
															>
																<MoreHorizontal className="size-3.5" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem onClick={() => openClaim(row)}>
																Open claim
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => setEdiRow(row)}>
																<Code2 className="mr-2 size-3.5" />
																View EDI
															</DropdownMenuItem>
															{useLive ? (
																<DropdownMenuItem
																	onClick={() => void softDelete(row)}
																>
																	Soft delete
																</DropdownMenuItem>
															) : null}
															<DropdownMenuItem
																onClick={() =>
																	toast.message("Claim ID", {
																		description: row.claimId,
																	})
																}
															>
																Copy claim ID
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CmsEdgeTableScroll>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-3 py-2.5 text-xs text-muted-foreground">
							<p>
								Showing{" "}
								<span className="font-medium tabular-nums text-foreground">
									{rangeStart}
								</span>
								–
								<span className="font-medium tabular-nums text-foreground">
									{rangeEnd}
								</span>{" "}
								of{" "}
								<span className="font-medium tabular-nums text-foreground">
									{formatCount(filtered.length)}
								</span>
							</p>
							<div className="flex items-center gap-1.5">
								<span className="mr-1">Rows</span>
								<Select
									value={String(pageSize)}
									onValueChange={(v) => {
										setPageSize(Number(v));
										setPage(1);
									}}
								>
									<SelectTrigger className={cn(compactFieldClass, "w-18")}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[10, 25, 50, 100].map((size) => (
											<SelectItem key={size} value={String(size)}>
												{size}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="icon"
									className="size-8"
									disabled={safePage <= 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
								>
									<ChevronLeft className="size-3.5" />
								</Button>
								<span className="min-w-12 text-center tabular-nums">
									{safePage} / {pageCount}
								</span>
								<Button
									variant="outline"
									size="icon"
									className="size-8"
									disabled={safePage >= pageCount}
									onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
								>
									<ChevronRight className="size-3.5" />
								</Button>
							</div>
						</div>
					</>
				)}
			</section>

			{/* Needs attention — below table */}
			<section className={cn(PANEL, "overflow-hidden")}>
				<div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
					<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						Needs attention
					</p>
					<span className="rounded-sm border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
						{stats.attention}
					</span>
				</div>
				{stats.attentionRows.length === 0 ? (
					<p className="px-4 py-10 text-center text-sm text-muted-foreground">
						Nothing needs attention right now.
					</p>
				) : (
					<ul className="grid sm:grid-cols-2">
						{stats.attentionRows.slice(0, 8).map((row) => (
							<li
								key={row.id}
								className="border-b border-border/50 sm:odd:border-r"
							>
								<button
									type="button"
									onClick={() => openClaim(row)}
									className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
								>
									<span
										className={cn(
											"mt-0.5 inline-flex shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white",
											row.claimStatus === "Denied" ||
												row.claimStatus === "Rejected"
												? "bg-red-600"
												: row.priority === "Urgent"
													? "bg-orange-500"
													: "bg-amber-500"
										)}
									>
										{row.claimStatus === "Denied" ||
										row.claimStatus === "Rejected"
											? row.claimStatus
											: row.priority === "Urgent"
												? "Urgent"
												: "Partial"}
									</span>
									<div className="min-w-0 flex-1">
										<p className="font-mono text-[12px] font-semibold text-foreground">
											{row.claimId}
										</p>
										<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
											{row.vendor} · {row.memberName} ·{" "}
											{formatCurrency(row.amountBilled)}
										</p>
									</div>
									{row.claimStatus === "Denied" ||
									row.claimStatus === "Rejected" ? (
										<XCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
									) : (
										<AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
									)}
								</button>
							</li>
						))}
					</ul>
				)}
			</section>

			<EdiViewerDialog
				open={Boolean(ediRow)}
				onOpenChange={(open) => {
					if (!open) setEdiRow(null);
				}}
				fixture="837I"
				fileName={ediRow?.fileName}
				title={ediRow ? `EDI · ${ediRow.claimId}` : "EDI Viewer"}
			/>
		</div>
	);
}

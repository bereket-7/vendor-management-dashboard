"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";

import {
	ArrowLeft,
	CheckCircle2,
	Download,
	ExternalLink,
	FileText,
	MessageSquareReply,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CMS_EDGE_PAGE_STACK,
	CMS_EDGE_PANEL_CLASS,
	CMS_EDGE_STATUS_PILL_CLASS,
	CMS_EDGE_TABLE_CONTAINER,
	CmsEdgeTableScroll,
} from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	EdiViewerDialog,
	EdiViewerLoader,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import {
	type ClaimFileStatus,
	type ClaimLine,
	claimsForResponse,
	displayClaimStatus,
	downloadTextFile,
	exportRowsAsCsv,
	formatCount,
	formatCurrency,
	getClaimResponse,
	getSubmissionBatch,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PANEL = CMS_EDGE_PANEL_CLASS;
const WORKSPACE_H = "h-[calc(100svh-6.5rem)]";

const TABS = ["Overview", "Claims", "EDI"] as const;
type Tab = (typeof TABS)[number];

const STATUS_TONE: Record<ClaimFileStatus, string> = {
	accepted:
		"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
	paid: "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
	rejected:
		"border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
	denied:
		"border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
	pending:
		"border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
	partial:
		"border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
	exception:
		"border-orange-200/80 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
};

const th =
	"h-9 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-3 py-2.5 text-[12px] align-middle text-foreground";

function StatusPill({ status }: { status: ClaimFileStatus }) {
	return (
		<span className={cn(CMS_EDGE_STATUS_PILL_CLASS, STATUS_TONE[status])}>
			{displayClaimStatus(status)}
		</span>
	);
}

function GainwellPill({ status }: { status: ClaimLine["gainwellStatus"] }) {
	const tone =
		status === "paid"
			? STATUS_TONE.paid
			: status === "partial"
				? STATUS_TONE.partial
				: status === "denied" || status === "rejected"
					? STATUS_TONE.rejected
					: STATUS_TONE.pending;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
				tone
			)}
		>
			{status}
		</span>
	);
}

function SurfaceDecor({
	children,
	className,
	accent = "from-primary via-sky-500/70 to-emerald-500/60",
}: {
	children: ReactNode;
	className?: string;
	accent?: string;
}) {
	return (
		<section
			className={cn(
				"relative overflow-hidden rounded-sm border border-border/70 bg-card",
				"shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]",
				className
			)}
		>
			<span
				aria-hidden
				className={cn(
					"pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r",
					accent
				)}
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-primary/[0.06] blur-3xl"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -bottom-14 left-1/4 size-32 rounded-full bg-sky-500/[0.05] blur-3xl"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-emerald-500/[0.025]"
			/>
			<div className="relative">{children}</div>
		</section>
	);
}

function PanelShell({
	title,
	action,
	children,
	className,
	tone = "primary",
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	tone?: "primary" | "emerald" | "rose" | "sky" | "amber";
}) {
	const bar =
		tone === "emerald"
			? "from-emerald-500 to-emerald-400/40"
			: tone === "rose"
				? "from-rose-500 to-rose-400/40"
				: tone === "sky"
					? "from-sky-500 to-sky-400/40"
					: tone === "amber"
						? "from-amber-500 to-amber-400/40"
						: "from-primary to-primary/40";

	const head =
		tone === "emerald"
			? "from-emerald-500/[0.08] to-transparent"
			: tone === "rose"
				? "from-rose-500/[0.07] to-transparent"
				: tone === "sky"
					? "from-sky-500/[0.08] to-transparent"
					: tone === "amber"
						? "from-amber-500/[0.08] to-transparent"
						: "from-primary/[0.06] to-transparent";

	return (
		<section className={cn(PANEL, "relative overflow-hidden", className)}>
			<span
				aria-hidden
				className={cn("absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b", bar)}
			/>
			<div
				className={cn(
					"flex items-center justify-between border-b border-border/50 bg-gradient-to-r px-5 py-3",
					head
				)}
			>
				<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
					{title}
				</p>
				{action}
			</div>
			{children}
		</section>
	);
}

export function ResponseDetailPage() {
	const params = useParams<{ responseId: string }>();
	const response = useMemo(
		() => getClaimResponse(params.responseId),
		[params.responseId]
	);
	const [tab, setTab] = useState<Tab>("Overview");
	const [ediOpen, setEdiOpen] = useState(false);
	const [focusedClaimId, setFocusedClaimId] = useState<string | null>(null);

	const claims = useMemo(
		() => (response ? claimsForResponse(response.id) : []),
		[response]
	);
	const batch = response
		? getSubmissionBatch(response.submissionBatch)
		: undefined;
	const relatedFile = response
		? getVendorFile(response.relatedFileId)
		: undefined;

	const paidAmount = useMemo(
		() => claims.reduce((sum, c) => sum + c.amountPaid, 0),
		[claims]
	);
	const billedAmount = useMemo(
		() => claims.reduce((sum, c) => sum + c.amountBilled, 0),
		[claims]
	);
	const acceptRate = response?.totalSubmitted
		? Math.round(
				((response.paid + response.partialPaid) / response.totalSubmitted) *
					1000
			) / 10
		: 0;

	const focusClaimIndex = useMemo(() => {
		if (!claims.length) return 0;
		const id = focusedClaimId ?? claims[0]?.claimId;
		const idx = claims.findIndex((c) => c.claimId === id);
		return idx >= 0 ? idx : 0;
	}, [claims, focusedClaimId]);

	const focused = claims[focusClaimIndex] ?? null;

	const load = useCallback(
		() => loadEdiFixture(response?.ediFixture ?? "835"),
		[response]
	);

	const topPaid = useMemo(
		() =>
			[...claims]
				.filter((c) => c.amountPaid > 0)
				.sort((a, b) => b.amountPaid - a.amountPaid)
				.slice(0, 5),
		[claims]
	);

	const rejectedClaims = useMemo(
		() =>
			claims.filter(
				(c) => c.gainwellStatus === "rejected" || c.gainwellStatus === "denied"
			),
		[claims]
	);

	if (!response) {
		return (
			<div className={cn(CMS_EDGE_PAGE_STACK, "px-1")}>
				<Link
					href="/admin/claim-encounter/responses"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Responses
				</Link>
				<section className={cn(PANEL, "px-4 py-10 text-center")}>
					<p className="text-sm font-semibold text-foreground">
						Response not found
					</p>
				</section>
			</div>
		);
	}

	async function handleDownload() {
		if (!response) return;
		try {
			const raw = await loadEdiFixture(response.ediFixture ?? "835");
			downloadTextFile(response.responseFile, raw);
			toast.success("EDI downloaded");
		} catch {
			toast.error("Failed to load EDI");
		}
	}

	function handleExportClaims() {
		if (!response) return;
		exportRowsAsCsv(
			`${response.responseId}-outcomes.csv`,
			[
				"Claim ID",
				"Member ID",
				"Provider",
				"Amount Billed",
				"Amount Paid",
				"Gainwell Status",
				"Reject Reason",
				"Trace ID",
			],
			claims.map((c) => [
				c.claimId,
				c.memberId,
				c.provider,
				c.amountBilled,
				c.amountPaid,
				c.gainwellStatus,
				c.rejectReason ?? "",
				c.traceId,
			])
		);
		toast.success("Outcomes exported");
	}

	const adjustments = Math.max(0, billedAmount - paidAmount);
	const typeMark = response.responseType.slice(0, 3).toUpperCase();

	const metrics = [
		{ label: "Paid", value: formatCount(response.paid), sub: "claims" },
		{ label: "Rejected", value: formatCount(response.rejected), sub: "claims" },
		{
			label: "Partial",
			value: formatCount(response.partialPaid),
			sub: "claims",
		},
		{ label: "Pending", value: formatCount(response.pending), sub: "claims" },
		{ label: "Accept", value: `${acceptRate}%`, sub: "rate", accent: true },
		{
			label: "Paid",
			value: formatCurrency(paidAmount),
			sub: "amount",
			accent: true,
		},
		{ label: "Billed", value: formatCurrency(billedAmount), sub: "amount" },
		{ label: "Adj.", value: formatCurrency(adjustments), sub: "gap" },
	];

	return (
		<div className={cn(CMS_EDGE_PAGE_STACK, "relative w-full max-w-none px-0")}>
			{/* Page atmosphere */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 -top-6 h-56 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.09),_transparent_62%)]"
			/>

			<Link
				href="/admin/claim-encounter/responses"
				className="relative inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Responses
			</Link>

			{/* Identity + quiet metrics */}
			<SurfaceDecor>
				<div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
					<div className="flex min-w-0 items-start gap-4">
						<div className="relative shrink-0">
							<div className="flex size-14 items-center justify-center rounded-sm bg-primary text-sm font-bold tracking-wide text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]">
								{typeMark}
							</div>
							<span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-sky-500 text-white shadow-sm">
								<MessageSquareReply className="size-2.5" />
							</span>
						</div>
						<div className="min-w-0 space-y-2">
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="truncate font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
									{response.responseFile}
								</h1>
								<StatusPill status={response.status} />
								<span className="rounded-sm border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
									{response.responseType}
								</span>
							</div>
							<p className="text-sm text-muted-foreground">
								<span className="font-mono font-medium text-primary">
									{response.responseId}
								</span>
								<span className="mx-1.5 text-border">·</span>
								{response.vendor}
								<span className="mx-1.5 text-border">·</span>
								{response.program}
								<span className="mx-1.5 text-border">·</span>
								{response.receivedAt}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2 lg:justify-end">
						<Button
							size="sm"
							onClick={handleDownload}
							className={cn(
								"h-9 gap-1.5 rounded-sm bg-primary px-3.5 text-[11px] font-semibold text-primary-foreground shadow-none",
								"hover:bg-primary/90"
							)}
						>
							<Download className="size-3.5" />
							Download
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-9 gap-1.5 rounded-sm border-border/80 bg-background/80 text-[11px] shadow-none backdrop-blur-sm"
							onClick={() => setEdiOpen(true)}
						>
							View EDI
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-9 gap-1.5 rounded-sm border-border/80 bg-background/80 text-[11px] shadow-none backdrop-blur-sm"
							onClick={handleExportClaims}
						>
							Export claims
						</Button>
						{batch ? (
							<Button
								asChild
								variant="outline"
								size="sm"
								className="h-9 gap-1.5 rounded-sm border-border/80 bg-background/80 text-[11px] shadow-none backdrop-blur-sm"
							>
								<Link
									href={`/admin/claim-encounter/batches/${encodeURIComponent(batch.batchId)}`}
								>
									<ExternalLink className="size-3.5" />
									Batch
								</Link>
							</Button>
						) : null}
					</div>
				</div>

				{/* Compact quiet metrics — provider-style strip */}
				<div className="border-t border-border/40 bg-muted/20">
					<div className="flex w-full overflow-x-auto">
						<div className="flex min-w-max flex-1 lg:min-w-0">
							{metrics.map((item, index) => (
								<div
									key={`${item.label}-${item.sub}`}
									className={cn(
										"min-w-[6.5rem] flex-1 px-4 py-3.5 sm:min-w-0 sm:px-5",
										index > 0 && "border-l border-border/30"
									)}
								>
									<p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{item.label}
										<span className="ml-1 font-medium normal-case tracking-normal text-muted-foreground/70">
											{item.sub}
										</span>
									</p>
									<p
										className={cn(
											"mt-1.5 truncate text-[15px] font-semibold tabular-nums tracking-tight",
											item.accent ? "text-primary" : "text-foreground"
										)}
									>
										{item.value}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</SurfaceDecor>

			{/* Files */}
			<SurfaceDecor accent="from-sky-500 via-primary/70 to-violet-500/50">
				<div className="border-b border-border/40 bg-gradient-to-r from-sky-500/[0.06] to-transparent px-5 py-2.5">
					<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
						Files
					</p>
				</div>
				<ul className="grid gap-px bg-border/30 lg:grid-cols-2">
					<li className="group flex items-center gap-3 bg-card/80 px-5 py-4 transition-colors hover:bg-sky-500/[0.03]">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-primary/15 to-sky-500/10 text-primary ring-1 ring-primary/10 transition group-hover:scale-105">
							<FileText className="size-4.5" />
						</span>
						<div className="min-w-0 flex-1">
							<div className="flex min-w-0 items-center gap-1.5">
								<p className="truncate font-mono text-[12px] font-medium text-foreground">
									{response.responseFile}
								</p>
								<span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-px text-[9px] font-semibold text-primary">
									Primary
								</span>
							</div>
							<p className="truncate text-[11px] text-muted-foreground">
								{response.responseType} · Gainwell · {response.direction}
							</p>
						</div>
						<button
							type="button"
							aria-label="Download response file"
							className="flex size-8 shrink-0 items-center justify-center rounded-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
							onClick={handleDownload}
						>
							<Download className="size-3.5" />
						</button>
					</li>
					{relatedFile ? (
						<li className="group flex items-center gap-3 bg-card/80 px-5 py-4 transition-colors hover:bg-emerald-500/[0.03]">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-700 ring-1 ring-emerald-500/10 transition group-hover:scale-105 dark:text-emerald-300">
								<FileText className="size-4.5" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate font-mono text-[12px] font-medium text-foreground">
									{relatedFile.fileName}
								</p>
								<p className="truncate text-[11px] text-muted-foreground">
									Source package · {relatedFile.fileId}
								</p>
							</div>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="h-8 shrink-0 rounded-sm px-2 text-[11px]"
							>
								<Link
									href={`/admin/claim-encounter/files/${encodeURIComponent(relatedFile.fileId)}`}
								>
									Open
								</Link>
							</Button>
						</li>
					) : (
						<li className="flex items-center bg-card/80 px-5 py-4 text-[12px] text-muted-foreground">
							No linked source file
						</li>
					)}
				</ul>
			</SurfaceDecor>

			{/* Tabs */}
			<div className="relative flex flex-wrap gap-1 border-b border-border/50">
				{TABS.map((item) => {
					const active = tab === item;
					return (
						<button
							key={item}
							type="button"
							onClick={() => setTab(item)}
							className={cn(
								"relative rounded-t-sm px-4 py-2.5 text-xs font-semibold transition-colors",
								active
									? "bg-primary/[0.06] text-foreground"
									: "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
							)}
						>
							{item}
							{item === "Claims" ? (
								<span className="ml-1.5 rounded-sm bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
									{claims.length}
								</span>
							) : null}
							{active ? (
								<span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
							) : null}
						</button>
					);
				})}
			</div>

			{tab === "Overview" && (
				<div className="space-y-3">
					<div className="grid gap-3 xl:grid-cols-12">
						<PanelShell
							title="Response summary"
							tone="primary"
							className="xl:col-span-8"
						>
							<p className="border-b border-border/40 bg-gradient-to-r from-primary/[0.03] to-transparent px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
								{response.summary}
							</p>
							<dl className="grid gap-0 sm:grid-cols-2 xl:grid-cols-3">
								{(
									[
										["Response ID", response.responseId, true],
										["Type", response.responseType, false],
										["Vendor", response.vendor, false],
										["Program", response.program, false],
										["Received", response.receivedAt, false],
										["Status", displayClaimStatus(response.status), false],
										["Related file", response.relatedFileId, true],
										["Batch", response.submissionBatch, true],
										["Direction", response.direction, false],
									] as const
								).map(([label, value, mono]) => (
									<div
										key={label}
										className="border-b border-border/40 px-5 py-3.5 transition-colors hover:bg-muted/20 sm:border-r sm:border-border/40"
									>
										<dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
											{label}
										</dt>
										<dd
											className={cn(
												"mt-1.5 text-[13px] font-medium text-foreground",
												mono && "break-all font-mono text-[12px] text-primary"
											)}
										>
											{value}
										</dd>
									</div>
								))}
							</dl>
						</PanelShell>

						<div className="flex flex-col gap-3 xl:col-span-4">
							<PanelShell title="Links & context" tone="sky">
								<ul className="divide-y divide-border/50">
									{(
										[
											["Response type", response.responseType],
											["Direction", response.direction],
											["Related file", response.relatedFileId],
											["Batch", response.submissionBatch],
											["Vendor", response.vendor],
											["Program", response.program],
										] as const
									).map(([label, value]) => (
										<li
											key={label}
											className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-sky-500/[0.03]"
										>
											<span className="text-[11px] font-medium text-muted-foreground">
												{label}
											</span>
											<span className="max-w-[60%] truncate text-right font-mono text-[12px] font-semibold text-foreground">
												{value}
											</span>
										</li>
									))}
								</ul>
							</PanelShell>

							<PanelShell title="Linked batch" tone="amber">
								{batch ? (
									<div className="space-y-3 bg-gradient-to-br from-amber-500/[0.04] to-transparent px-5 py-4">
										<div>
											<p className="font-mono text-sm font-semibold text-foreground">
												{batch.batchId}
											</p>
											<p className="mt-1 text-[12px] text-muted-foreground">
												{batch.vendor} · {formatCount(batch.claimsSubmitted)}{" "}
												claims · {batch.submittedAt}
											</p>
										</div>
										<Button
											asChild
											size="sm"
											variant="outline"
											className="h-8 w-full rounded-sm border-amber-200/60 bg-background/80 text-[11px] shadow-none dark:border-amber-900/40"
										>
											<Link
												href={`/admin/claim-encounter/batches/${encodeURIComponent(batch.batchId)}`}
											>
												Open batch detail
											</Link>
										</Button>
									</div>
								) : (
									<p className="px-5 py-8 text-center text-sm text-muted-foreground">
										No linked batch
									</p>
								)}
							</PanelShell>
						</div>
					</div>

					<div className="grid gap-3 lg:grid-cols-2">
						<PanelShell
							title="Top paid claims"
							tone="emerald"
							action={
								<button
									type="button"
									className="text-[11px] font-medium text-primary hover:underline"
									onClick={() => setTab("Claims")}
								>
									View all
								</button>
							}
						>
							{topPaid.length === 0 ? (
								<p className="px-5 py-10 text-center text-sm text-muted-foreground">
									No paid lines
								</p>
							) : (
								<ul className="divide-y divide-border/50">
									{topPaid.map((c, i) => (
										<li
											key={c.id}
											className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-emerald-500/[0.03]"
										>
											<div className="flex min-w-0 items-center gap-3">
												<span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-emerald-500/10 text-[10px] font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
													{i + 1}
												</span>
												<div className="min-w-0">
													<p className="font-mono text-[11px] font-medium text-primary">
														{c.claimId}
													</p>
													<p className="truncate text-[11px] text-muted-foreground">
														{c.provider}
													</p>
												</div>
											</div>
											<p className="shrink-0 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
												{formatCurrency(c.amountPaid)}
											</p>
										</li>
									))}
								</ul>
							)}
						</PanelShell>

						<PanelShell
							title="Reject spotlight"
							tone="rose"
							action={
								<span className="rounded-sm bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-rose-700 dark:text-rose-300">
									{rejectedClaims.length}
								</span>
							}
						>
							{rejectedClaims.length === 0 ? (
								<p className="flex items-center justify-center gap-1.5 px-5 py-10 text-sm text-muted-foreground">
									<CheckCircle2 className="size-3.5 text-emerald-600" />
									No rejected claims
								</p>
							) : (
								<ul className="divide-y divide-border/50">
									{rejectedClaims.slice(0, 5).map((c) => (
										<li
											key={c.id}
											className="flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-rose-500/[0.03]"
										>
											<div className="min-w-0">
												<p className="font-mono text-[11px] font-medium text-foreground">
													{c.claimId}
												</p>
												<p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
													{c.rejectReason ?? "No reason coded"}
												</p>
											</div>
											<GainwellPill status={c.gainwellStatus} />
										</li>
									))}
								</ul>
							)}
						</PanelShell>
					</div>
				</div>
			)}

			{tab === "Claims" && (
				<PanelShell
					title={`Claim outcomes · ${claims.length}`}
					tone="sky"
					action={
						<div className="flex items-center gap-3 text-[11px] tabular-nums text-muted-foreground">
							<span className="text-emerald-700 dark:text-emerald-400">
								{formatCount(response.paid)} paid
							</span>
							<span className="text-border">·</span>
							<span className="text-rose-700 dark:text-rose-400">
								{formatCount(response.rejected)} rejected
							</span>
							<Button
								variant="outline"
								size="sm"
								className="h-8 rounded-sm text-[11px] shadow-none"
								onClick={handleExportClaims}
							>
								Export
							</Button>
						</div>
					}
				>
					<CmsEdgeTableScroll>
						<Table
							containerClassName={CMS_EDGE_TABLE_CONTAINER}
							className="w-full min-w-[1180px] text-xs"
						>
							<TableHeader>
								<TableRow className="border-b border-border/50 bg-sky-500/[0.04] hover:bg-sky-500/[0.04]">
									<TableHead className={cn(th, "pl-5")}>Claim</TableHead>
									<TableHead className={th}>Member</TableHead>
									<TableHead className={th}>Provider</TableHead>
									<TableHead className={th}>DOS</TableHead>
									<TableHead className={cn(th, "text-right")}>Billed</TableHead>
									<TableHead className={cn(th, "text-right")}>Paid</TableHead>
									<TableHead className={th}>Status</TableHead>
									<TableHead className={th}>Reason</TableHead>
									<TableHead className={cn(th, "pr-5")}>Trace</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{claims.length === 0 ? (
									<TableRow className="hover:bg-transparent">
										<TableCell
											colSpan={9}
											className="px-5 py-14 text-center text-sm text-muted-foreground"
										>
											No claims on this response.
										</TableCell>
									</TableRow>
								) : (
									claims.map((c) => (
										<TableRow
											key={c.id}
											className="border-b border-border/40 hover:bg-sky-500/[0.03]"
										>
											<TableCell
												className={cn(
													td,
													"pl-5 font-mono text-[11px] font-medium text-primary"
												)}
											>
												{c.claimId}
											</TableCell>
											<TableCell
												className={cn(
													td,
													"font-mono text-[11px] text-muted-foreground"
												)}
											>
												{c.memberId}
											</TableCell>
											<TableCell className={cn(td, "font-medium")}>
												{c.provider}
											</TableCell>
											<TableCell
												className={cn(td, "tabular-nums text-muted-foreground")}
											>
												{c.dateOfService}
											</TableCell>
											<TableCell className={cn(td, "text-right tabular-nums")}>
												{formatCurrency(c.amountBilled)}
											</TableCell>
											<TableCell
												className={cn(
													td,
													"text-right font-medium tabular-nums",
													c.amountPaid > 0
														? "text-emerald-700 dark:text-emerald-400"
														: "text-muted-foreground"
												)}
											>
												{formatCurrency(c.amountPaid)}
											</TableCell>
											<TableCell className={td}>
												<GainwellPill status={c.gainwellStatus} />
											</TableCell>
											<TableCell className={cn(td, "max-w-56")}>
												<span className="line-clamp-2 text-[11px] text-muted-foreground">
													{c.rejectReason ?? "—"}
												</span>
											</TableCell>
											<TableCell
												className={cn(
													td,
													"pr-5 font-mono text-[10px] text-muted-foreground"
												)}
											>
												{c.traceId}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CmsEdgeTableScroll>
				</PanelShell>
			)}

			{tab === "EDI" && (
				<div
					className={cn(WORKSPACE_H, "relative flex min-h-0 w-full flex-col")}
				>
					<span
						aria-hidden
						className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 rounded-t-sm bg-gradient-to-r from-violet-500 via-primary to-sky-500"
					/>
					<ResizablePanelGroup
						direction="horizontal"
						className={cn(PANEL, "h-full min-h-0 overflow-hidden")}
					>
						<ResizablePanel
							defaultSize={24}
							minSize={16}
							maxSize={36}
							className="bg-gradient-to-b from-violet-500/[0.04] to-muted/10"
						>
							<div className="flex h-full min-h-0 flex-col">
								<div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
									<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
										Claims
									</p>
									<span className="rounded-sm bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-violet-700 dark:text-violet-300">
										{claims.length}
									</span>
								</div>
								<ScrollArea
									className="min-h-0 flex-1"
									scrollbarClassName="w-1.5"
								>
									<div className="space-y-0.5 p-1.5">
										{claims.map((c, index) => {
											const active =
												(focusedClaimId ?? claims[0]?.claimId) === c.claimId;
											const negative =
												c.gainwellStatus === "rejected" ||
												c.gainwellStatus === "denied";
											return (
												<button
													key={c.id}
													type="button"
													onClick={() => setFocusedClaimId(c.claimId)}
													className={cn(
														"w-full rounded-sm border border-transparent px-2.5 py-2.5 text-left transition",
														"hover:border-border/50 hover:bg-card",
														active &&
															"border-primary/20 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-primary/15"
													)}
												>
													<div className="flex items-start justify-between gap-2">
														<div className="min-w-0">
															<p className="truncate font-mono text-[11px] font-semibold">
																{c.claimId}
															</p>
															<p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
																#{index + 1} · {c.memberId}
															</p>
														</div>
														{negative ? (
															<XCircle className="size-3.5 shrink-0 text-rose-600" />
														) : c.gainwellStatus === "paid" ? (
															<CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
														) : null}
													</div>
												</button>
											);
										})}
									</div>
								</ScrollArea>
								{focused ? (
									<div className="shrink-0 border-t border-border/50 bg-primary/[0.03] px-3 py-2 font-mono text-[10px] text-muted-foreground">
										{focused.claimId}
									</div>
								) : null}
							</div>
						</ResizablePanel>
						<ResizableHandle withHandle />
						<ResizablePanel defaultSize={76} minSize={50} className="min-w-0">
							<EdiViewerLoader
								load={load}
								fileName={response.responseFile}
								focusClaimIndex={focusClaimIndex}
								className="h-full min-h-0 rounded-none border-0"
							/>
						</ResizablePanel>
					</ResizablePanelGroup>
				</div>
			)}

			<EdiViewerDialog
				open={ediOpen}
				onOpenChange={setEdiOpen}
				fixture={response.ediFixture ?? "835"}
				fileName={response.responseFile}
				title={response.responseFile}
			/>
		</div>
	);
}

"use client";

import { type ReactNode, useCallback, useMemo, useState } from "react";

import {
	ArrowLeft,
	CheckCircle2,
	Clock3,
	ExternalLink,
	XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CMS_EDGE_PANEL_CLASS } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	EdiViewerLoader,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import {
	type ClaimLine,
	type ClaimVendorFile,
	claimsForFile,
	downloadClaimVendorFile,
	formatCurrency,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import { useClaimsForVendorFileQuery } from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const WORKSPACE_H = "h-[calc(100svh-5rem)]";
const PANEL = CMS_EDGE_PANEL_CLASS;

export const vendorFileToolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

export function VendorFileTxBadge({
	type,
}: {
	type: ClaimVendorFile["transactionType"];
}) {
	return (
		<span className="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-muted-foreground">
			{type}
		</span>
	);
}

export function VendorFileClaimCard({
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
	const isPending = !isAccepted && !isNegative;
	const reasonCodes = isNegative
		? claim.rejectReasons.map((r) => r.code).slice(0, 3)
		: [];

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"w-full rounded-sm border border-transparent px-2.5 py-2 text-left transition",
				"hover:border-border/50 hover:bg-card",
				active &&
					"border-primary/20 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-primary/15"
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="truncate font-mono text-[11px] font-semibold tracking-tight">
						{claim.claimId}
					</p>
					<p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
						#{index + 1}
						{claim.lineNumber != null ? ` · L${claim.lineNumber}` : ""} ·{" "}
						{claim.memberId}
					</p>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-1">
					<span
						className={cn(
							"inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold capitalize",
							isAccepted &&
								"border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
							isNegative &&
								"border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
							isPending &&
								"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
						)}
					>
						{isAccepted ? (
							<CheckCircle2 className="size-2.5" />
						) : isNegative ? (
							<XCircle className="size-2.5" />
						) : (
							<Clock3 className="size-2.5" />
						)}
						{claim.mfcReviewStatus || "pending"}
					</span>
					<span className="text-[10px] tabular-nums text-muted-foreground">
						{formatCurrency(claim.amountBilled)}
					</span>
				</div>
			</div>

			{reasonCodes.length > 0 ? (
				<div className="mt-1.5 flex flex-wrap gap-1">
					{reasonCodes.map((code) => (
						<span
							key={code}
							className="rounded-sm border border-rose-200/60 bg-rose-50/90 px-1 py-0.5 font-mono text-[9px] font-medium text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
							title={
								claim.rejectReasons.find((r) => r.code === code)?.description
							}
						>
							{code}
						</span>
					))}
				</div>
			) : null}
		</button>
	);
}

type VendorFileWorkspaceProps = {
	file: ClaimVendorFile;
	useLive: boolean;
	backLabel: string;
	onBack: () => void;
	/** Pills next to the title (status / wait / send). Tx badge is always appended. */
	statusPills?: ReactNode;
	/** Extra meta chips after vendor · program · fileId */
	metaExtra?: ReactNode;
	/** Right-side header actions (Review, Download, …). Open full page is always included last unless hideOpenLink. */
	actions?: ReactNode;
	hideOpenLink?: boolean;
	/** When false, only EDI viewer (no claims rail). Default true. */
	showClaimsPanel?: boolean;
	/** Negative outcome label for header chips: rejected (inbound) vs denied (outbound). */
	negativeLabel?: "rejected" | "denied";
	className?: string;
};

/**
 * Shared inbound / outbound package workspace — CMS EDGE detail rhythm.
 * Header + claims rail + EDI viewer.
 */
export function VendorFileWorkspace({
	file,
	useLive,
	backLabel,
	onBack,
	statusPills,
	metaExtra,
	actions,
	hideOpenLink = false,
	showClaimsPanel = true,
	negativeLabel = "rejected",
	className,
}: VendorFileWorkspaceProps) {
	const program = useAdminModuleStore((s) => s.fileType);
	const liveClaimsQ = useClaimsForVendorFileQuery(file.id, program, useLive);
	const fixtureClaims = useMemo(
		() => (useLive ? [] : claimsForFile(file.fileId)),
		[useLive, file.fileId]
	);
	const claims = useLive ? (liveClaimsQ.data ?? []) : fixtureClaims;
	const [focusedLineId, setFocusedLineId] = useState<string | null>(null);

	const focusClaimIndex = useMemo(() => {
		if (!showClaimsPanel) return null;
		const active = focusedLineId ?? claims[0]?.id ?? null;
		if (!active) return 0;
		const idx = claims.findIndex((c) => c.id === active);
		return idx >= 0 ? idx : 0;
	}, [claims, focusedLineId, showClaimsPanel]);

	const focused =
		focusClaimIndex != null ? (claims[focusClaimIndex] ?? null) : null;

	const pendingCount = claims.filter(
		(c) => c.mfcReviewStatus === "pending" || !c.mfcReviewStatus
	).length;
	const acceptedCount = claims.filter(
		(c) => c.mfcReviewStatus === "accepted"
	).length;
	const rejectedCount = claims.filter(
		(c) => c.mfcReviewStatus === "rejected"
	).length;
	const deniedCount = claims.filter(
		(c) => c.mfcReviewStatus === "denied"
	).length;
	const negativeCount =
		negativeLabel === "denied" ? deniedCount : rejectedCount;

	const load = useCallback(async () => {
		if (useLive && file.id) {
			try {
				const result = await downloadClaimVendorFile(file.id);
				const text = await result.blob.text();
				if (text.trim()) return text;
			} catch {
				/* fall through */
			}
		}
		return loadEdiFixture(file.ediFixture ?? "837I");
	}, [useLive, file]);

	const isLoading = useLive && liveClaimsQ.isLoading;

	return (
		<div className={cn(WORKSPACE_H, "flex min-h-0 flex-col gap-3", className)}>
			<header className="shrink-0 border-b border-border/60 pb-3">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-2">
						<button
							type="button"
							onClick={onBack}
							className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground"
						>
							<ArrowLeft className="size-3" />
							{backLabel}
						</button>
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
								{file.fileName}
							</h1>
							{statusPills}
							<VendorFileTxBadge type={file.transactionType} />
						</div>
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
							<span className="truncate">{file.vendor}</span>
							<span className="text-border">·</span>
							<span>{file.program}</span>
							<span className="text-border">·</span>
							<span className="font-mono tabular-nums">{file.fileId}</span>
							{metaExtra}
						</div>
						{showClaimsPanel ? (
							<div className="flex flex-wrap items-center gap-1.5">
								{pendingCount > 0 ? (
									<span className="inline-flex items-center gap-1 rounded-sm border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
										<Clock3 className="size-2.5" />
										{pendingCount} pending
									</span>
								) : null}
								<span className="inline-flex items-center gap-1 rounded-sm border border-emerald-200/70 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
									<CheckCircle2 className="size-2.5" />
									{acceptedCount} ok
								</span>
								<span className="inline-flex items-center gap-1 rounded-sm border border-rose-200/70 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
									<XCircle className="size-2.5" />
									{negativeCount} {negativeLabel}
								</span>
								{focused ? (
									<span className="inline-flex items-center gap-1 rounded-sm border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
										{focused.claimId}
										{focused.lineNumber != null
											? ` · L${focused.lineNumber}`
											: ""}
									</span>
								) : null}
							</div>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{actions}
						{!hideOpenLink ? (
							<Button
								asChild
								variant="outline"
								size="sm"
								className={cn(vendorFileToolbarBtn, "border-border/80")}
							>
								<Link
									href={`/admin/claim-encounter/files/${encodeURIComponent(file.id)}`}
								>
									<ExternalLink className="size-3.5" />
									Open
								</Link>
							</Button>
						) : null}
					</div>
				</div>
			</header>

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Loading claims…</p>
			) : null}

			<div className="min-h-0 flex-1">
				{showClaimsPanel ? (
					<ResizablePanelGroup
						direction="horizontal"
						className={cn(PANEL, "h-full overflow-hidden")}
					>
						<ResizablePanel
							defaultSize={28}
							minSize={16}
							maxSize={40}
							className="bg-muted/10"
						>
							<div className="flex h-full min-h-0 flex-col">
								<div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
									<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
										Claims
									</p>
									<span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
										{claims.length}
									</span>
								</div>
								<ScrollArea
									className="min-h-0 flex-1"
									scrollbarClassName="w-1.5"
								>
									<div className="space-y-0.5 p-1.5">
										{claims.map((c, index) => (
											<VendorFileClaimCard
												key={c.id}
												claim={c}
												index={index}
												active={(focusedLineId ?? claims[0]?.id) === c.id}
												onSelect={() => setFocusedLineId(c.id)}
											/>
										))}
										{claims.length === 0 ? (
											<p className="px-2 py-8 text-center text-xs text-muted-foreground">
												No claims on this package
											</p>
										) : null}
									</div>
								</ScrollArea>
							</div>
						</ResizablePanel>

						<ResizableHandle withHandle />

						<ResizablePanel defaultSize={72} minSize={48} className="min-w-0">
							<EdiViewerLoader
								load={load}
								fileName={file.fileName}
								focusClaimIndex={focusClaimIndex}
								className="h-full min-h-0 rounded-none border-0"
							/>
						</ResizablePanel>
					</ResizablePanelGroup>
				) : (
					<div
						className={cn(
							PANEL,
							"flex h-full min-h-0 flex-col overflow-hidden"
						)}
					>
						<EdiViewerLoader
							load={load}
							fileName={file.fileName}
							className="h-full min-h-0 rounded-none border-0"
						/>
					</div>
				)}
			</div>
		</div>
	);
}

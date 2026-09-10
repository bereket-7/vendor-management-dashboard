"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { ArrowLeft, CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";

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
	fixtureKeyForTransaction,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import {
	type ClaimLine,
	claimsForFile,
	formatCurrency,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PAGE_H = "h-[calc(100svh-5rem)]";
const PANEL = CMS_EDGE_PANEL_CLASS;

export function ClaimFileDetailPage() {
	const params = useParams<{ fileId: string }>();
	const fileId = decodeURIComponent(params.fileId);
	const file = useMemo(() => getVendorFile(fileId), [fileId]);
	const claims = useMemo(
		() => (file ? claimsForFile(file.fileId) : []),
		[file]
	);
	const [focusedClaimId, setFocusedClaimId] = useState<string | null>(null);

	const showClaimsPanel =
		Boolean(file) &&
		(file!.direction === "outbound" || file!.reviewStatus !== "pending");

	const activeClaimId =
		focusedClaimId ?? (showClaimsPanel ? (claims[0]?.claimId ?? null) : null);

	const focusClaimIndex = useMemo(() => {
		if (!activeClaimId || !showClaimsPanel) return null;
		const idx = claims.findIndex((c) => c.claimId === activeClaimId);
		return idx >= 0 ? idx : 0;
	}, [activeClaimId, claims, showClaimsPanel]);

	const focusedClaim =
		focusClaimIndex != null ? (claims[focusClaimIndex] ?? null) : null;

	const load = useCallback(() => {
		const key = fixtureKeyForTransaction(
			file?.transactionType === "835" ? "835" : "837"
		);
		return loadEdiFixture(file?.ediFixture ?? key);
	}, [file]);

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
		file?.direction === "outbound" ? deniedCount : rejectedCount;
	const negativeLabel = file?.direction === "outbound" ? "denied" : "rejected";

	if (!file) {
		return (
			<div className="space-y-3">
				<Link
					href="/admin/claim-encounter/inbound"
					className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3" />
					Back
				</Link>
				<p className="text-sm text-destructive">File not found</p>
			</div>
		);
	}

	const backHref =
		file.direction === "outbound"
			? "/admin/claim-encounter/outbound"
			: "/admin/claim-encounter/inbound";
	const backLabel = file.direction === "outbound" ? "Outbound" : "Inbound";

	return (
		<div className={cn(PAGE_H, "flex min-h-0 flex-col gap-3")}>
			<header className="shrink-0 border-b border-border/60 pb-3">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-2">
						<Link
							href={backHref}
							className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="size-3" />
							{backLabel}
						</Link>
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
								{file.fileName}
							</h1>
							<span className="rounded-sm border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-muted-foreground">
								{file.transactionType}
							</span>
							{file.reviewStatus !== "pending" ? (
								<span
									className={cn(
										"inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
										file.reviewStatus === "accepted"
											? "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
											: "border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
									)}
								>
									{file.reviewStatus === "accepted" ? (
										<CheckCircle2 className="size-2.5" />
									) : (
										<XCircle className="size-2.5" />
									)}
									{file.reviewStatus}
								</span>
							) : null}
						</div>
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
							<span className="truncate">{file.vendor}</span>
							<span className="text-border">·</span>
							<span className="font-mono tabular-nums">{file.fileId}</span>
							<span className="text-border">·</span>
							<span className="tabular-nums">{file.records} claims</span>
						</div>
						{showClaimsPanel ? (
							<div className="flex flex-wrap items-center gap-1.5">
								<span className="inline-flex items-center gap-1 rounded-sm border border-emerald-200/70 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
									<CheckCircle2 className="size-2.5" />
									{acceptedCount} ok
								</span>
								<span className="inline-flex items-center gap-1 rounded-sm border border-rose-200/70 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
									<XCircle className="size-2.5" />
									{negativeCount} {negativeLabel}
								</span>
								{focusedClaim ? (
									<span className="inline-flex items-center gap-1 rounded-sm border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
										{focusedClaim.claimId}
									</span>
								) : null}
							</div>
						) : null}
					</div>
					{file.reviewStatus === "pending" ? (
						<Button
							asChild
							size="sm"
							className="h-9 gap-1.5 rounded-sm text-xs"
						>
							<Link
								href={`/admin/claim-encounter/files/${encodeURIComponent(file.fileId)}/review`}
							>
								<ClipboardCheck className="size-3.5" />
								Review
							</Link>
						</Button>
					) : null}
				</div>
			</header>

			<div className="min-h-0 flex-1">
				{showClaimsPanel ? (
					<ResizablePanelGroup
						direction="horizontal"
						className={cn(PANEL, "h-full overflow-hidden")}
					>
						<ResizablePanel
							defaultSize={26}
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
											<DetailClaimCard
												key={c.id}
												claim={c}
												index={index}
												active={activeClaimId === c.claimId}
												onSelect={() => setFocusedClaimId(c.claimId)}
											/>
										))}
									</div>
								</ScrollArea>
							</div>
						</ResizablePanel>

						<ResizableHandle withHandle />

						<ResizablePanel defaultSize={74} minSize={48} className="min-w-0">
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

function DetailClaimCard({
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
						#{index + 1} · {claim.memberId}
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
							!isAccepted &&
								!isNegative &&
								"border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
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

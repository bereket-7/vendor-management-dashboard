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
import {
	EdiViewerLoader,
	fixtureKeyForTransaction,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import {
	type ClaimLine,
	claimsForFile,
	formatCount,
	formatCurrency,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PAGE_H = "h-[calc(100svh-5rem)]";

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

	if (!file) {
		return (
			<div className="space-y-4">
				<Link
					href="/admin/claim-encounter/inbound"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back
				</Link>
				<p className="text-sm text-destructive">File not found.</p>
			</div>
		);
	}

	const backHref =
		file.direction === "outbound"
			? "/admin/claim-encounter/outbound"
			: "/admin/claim-encounter/inbound";

	return (
		<div className={cn(PAGE_H, "flex min-h-0 flex-col")}>
			<header className="shrink-0 border-b border-border/50 pb-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="min-w-0">
						<Link
							href={backHref}
							className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="size-3" />
							{file.direction === "outbound" ? "Outbound" : "Inbound"} files
						</Link>
						<div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
							<h1 className="truncate text-sm font-medium tracking-tight">
								{file.fileName}
							</h1>
							<span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
								{file.direction} · {file.transactionType}
							</span>
						</div>
						<p className="truncate text-[11px] text-muted-foreground">
							{file.fileId} · {file.vendor} · {formatCount(file.records)} claims
							{showClaimsPanel ? (
								<>
									{" "}
									·{" "}
									<span className="text-emerald-700">
										{acceptedCount} accepted
									</span>
									{" · "}
									{file.direction === "outbound" ? (
										<span className="text-red-700">{deniedCount} denied</span>
									) : (
										<span className="text-red-700">
											{rejectedCount} rejected
										</span>
									)}
								</>
							) : null}
							{focusedClaim ? (
								<>
									{" "}
									· Viewing{" "}
									<span className="font-mono text-foreground">
										{focusedClaim.claimId}
									</span>
								</>
							) : null}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						{file.reviewStatus === "pending" ? (
							<Button asChild size="sm" className="h-7 text-xs">
								<Link
									href={`/admin/claim-encounter/files/${encodeURIComponent(file.fileId)}/review`}
								>
									<ClipboardCheck className="mr-1 size-3.5" />
									Review claims
								</Link>
							</Button>
						) : (
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
						)}
					</div>
				</div>
			</header>

			<div className="mt-2 min-h-0 flex-1">
				{showClaimsPanel ? (
					<ResizablePanelGroup
						direction="horizontal"
						className="h-full rounded-lg border border-border/50"
					>
						<ResizablePanel
							defaultSize={26}
							minSize={16}
							maxSize={42}
							className="bg-card/70"
						>
							<div className="flex h-full min-h-0 flex-col">
								<div className="shrink-0 border-b border-border/50 px-2.5 py-1.5">
									<p className="text-xs font-medium">
										Claims ({claims.length})
									</p>
									<p className="text-[10px] text-muted-foreground">
										Accepted and{" "}
										{file.direction === "outbound" ? "denied" : "rejected"} ·
										select to load claim EDI
									</p>
								</div>
								<ScrollArea
									className="min-h-0 flex-1"
									scrollbarClassName="w-1.5"
								>
									<div className="divide-y divide-border/40 p-1">
										{claims.map((c, index) => (
											<OutboundClaimCard
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

						<ResizablePanel defaultSize={74} minSize={45} className="min-w-0">
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
				) : (
					/* No left claims list — EDI fills height; stats + search stay sticky in viewer chrome */
					<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border/50">
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

function OutboundClaimCard({
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
					<p className="font-mono text-[11px] font-semibold leading-tight">
						{claim.claimId}
					</p>
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
					Accepted · queued / sent to Gainwell
				</p>
			) : null}
		</button>
	);
}

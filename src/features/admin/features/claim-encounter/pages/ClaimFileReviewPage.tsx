"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, History, RefreshCw, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { EdiViewerLoader } from "@/features/admin/features/claim-encounter/edi";
import {
	type ClaimLine,
	REJECT_REASON_CATALOG,
	type RejectReason,
	applyClaimReviews,
	formatCurrency,
	getVendorFile,
	loadVendorFileEdiBody,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import {
	useAcceptClaimVendorFileMutation,
	useClaimVendorFileDetailQuery,
	useClaimsForVendorFileQuery,
	useInboundFileEventsQuery,
	useRejectClaimVendorFileMutation,
	useReprocessInboundFileMutation,
	useSendClaimVendorFileMutation,
} from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { featureQueryKey } from "@/features/admin/shared/feature-contract";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

/** Fill shell under admin header + GeneralShell padding */
const PAGE_H = "h-[calc(100svh-5rem)]";

export function ClaimFileReviewPage() {
	const params = useParams<{ fileId: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();
	const fileId = decodeURIComponent(params.fileId);
	const mockMode = isMockEnabled();
	const fileQuery = useClaimVendorFileDetailQuery(fileId);
	const claimsQuery = useClaimsForVendorFileQuery(
		fileId,
		Boolean(fileQuery.data)
	);
	const acceptMutation = useAcceptClaimVendorFileMutation();
	const rejectMutation = useRejectClaimVendorFileMutation();
	const sendMutation = useSendClaimVendorFileMutation();
	const reprocessMutation = useReprocessInboundFileMutation();
	const file = fileQuery.data;
	const inboundId = file?.sourceInboundFileId ?? null;
	const [claims, setClaims] = useState<ClaimLine[]>([]);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [focusedClaimId, setFocusedClaimId] = useState<string | null>(null);
	const [rejectOpen, setRejectOpen] = useState(false);
	const [reasonCodes, setReasonCodes] = useState<Set<string>>(new Set());
	const [note, setNote] = useState("");
	const [showEvents, setShowEvents] = useState(false);
	const eventsQuery = useInboundFileEventsQuery(
		inboundId,
		Boolean(inboundId) && showEvents && !mockMode
	);

	useEffect(() => {
		const next = claimsQuery.data ?? [];
		setClaims(next);
		setSelected(new Set());
		setFocusedClaimId(next[0]?.claimId ?? null);
	}, [claimsQuery.data]);

	const load = useCallback(
		() =>
			loadVendorFileEdiBody({
				id: file?.id,
				fileId: file?.fileId,
				vendor: file?.vendor,
				sourceInboundFileId: file?.sourceInboundFileId,
				ediFixture: file?.ediFixture,
				transactionType: file?.transactionType ?? "837",
				downloadAvailable: file?.downloadAvailable,
			}),
		[file]
	);

	const focusClaimIndex = useMemo(() => {
		if (!focusedClaimId) return 0;
		const idx = claims.findIndex((c) => c.claimId === focusedClaimId);
		return idx >= 0 ? idx : 0;
	}, [claims, focusedClaimId]);

	const focusedClaim = claims[focusClaimIndex] ?? null;
	const reviewPending =
		!file || file.reviewStatus === "pending" || file.reviewStatus === "partial";
	const writePending =
		acceptMutation.isPending ||
		rejectMutation.isPending ||
		sendMutation.isPending;

	function selectedClaimLineIds(): string[] | undefined {
		if (selected.size === 0) return undefined;
		const ids = claims
			.filter((c) => selected.has(c.claimId))
			.map((c) => c.id)
			.filter(Boolean);
		return ids.length > 0 ? ids : undefined;
	}

	async function invalidateAfterReview() {
		await queryClient.invalidateQueries({
			queryKey: featureQueryKey("claim-encounter"),
		});
	}

	async function handleReprocess() {
		if (!inboundId) {
			toast.message("No linked inbound file to reprocess.");
			return;
		}
		try {
			await reprocessMutation.mutateAsync(inboundId);
			toast.success("Reprocess queued for linked inbound file");
			void fileQuery.refetch();
			void eventsQuery.refetch();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Reprocess failed");
		}
	}

	async function handleSendOutbound() {
		if (!file) return;
		try {
			const result = await sendMutation.mutateAsync({
				id: file.id,
				notes: note.trim() || undefined,
				sync: true,
			});
			const outboundId = result.outbound_vendor_file_id
				? String(result.outbound_vendor_file_id)
				: null;
			toast.success(
				outboundId
					? `Outbound sent · ${outboundId}`
					: result.job_id
						? `Outbound send queued · job ${String(result.job_id)}`
						: "Outbound send completed"
			);
			await invalidateAfterReview();
			router.push("/admin/claim-encounter/outbound");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Send failed");
		}
	}

	if (fileQuery.isLoading) {
		return (
			<div className="space-y-4">
				<Link
					href="/admin/claim-encounter/inbound"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back
				</Link>
				<p className="text-sm text-muted-foreground">Loading file…</p>
			</div>
		);
	}

	if (!file) {
		return (
			<div className="space-y-4">
				<Link
					href="/admin/claim-encounter/inbound"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back
				</Link>
				<p className="text-sm text-destructive">File not found.</p>
			</div>
		);
	}

	function toggleAll(checked: boolean) {
		if (checked) setSelected(new Set(claims.map((c) => c.claimId)));
		else setSelected(new Set());
	}

	function toggleOne(claimId: string, checked: boolean) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (checked) next.add(claimId);
			else next.delete(claimId);
			return next;
		});
	}

	async function acceptSelected() {
		if (!mockMode) {
			try {
				const claim_line_ids = selectedClaimLineIds();
				// Core routes use <uuid:id>; fileId is display reference_id (VM-CVF-…).
				const result = await acceptMutation.mutateAsync({
					id: file!.id,
					notes: note.trim() || undefined,
					claim_line_ids,
				});
				toast.success(
					claim_line_ids?.length
						? `Accepted ${claim_line_ids.length} claim line(s)`
						: "Vendor file accepted"
				);
				await invalidateAfterReview();

				// Full-file accept → attempt outbound send when BE queued it.
				const isPartial = Boolean(claim_line_ids?.length);
				if (!isPartial) {
					try {
						await sendMutation.mutateAsync({
							id: file!.id,
							sync: true,
						});
						toast.success("Outbound package sent");
						router.push("/admin/claim-encounter/outbound");
						return;
					} catch (sendErr) {
						toast.message(
							sendErr instanceof Error
								? `Accepted; send later: ${sendErr.message}`
								: "Accepted; outbound send not completed"
						);
					}
				}
				void result;
				router.push("/admin/claim-encounter/inbound");
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Accept failed");
			}
			return;
		}
		if (selected.size === 0) {
			toast.message("Select at least one claim");
			return;
		}
		const count = selected.size;
		const updated = applyClaimReviews(
			file!.fileId,
			Array.from(selected).map((claimId) => ({
				claimId,
				status: "accepted" as const,
			}))
		);
		setClaims([...updated]);
		setSelected(new Set());
		toast.success(`Accepted ${count} claim(s)`);
		const refreshed = getVendorFile(file!.fileId);
		if (refreshed && refreshed.reviewStatus !== "pending") {
			if (refreshed.direction === "outbound") {
				toast.message("File review complete — moved to outbound");
				router.push("/admin/claim-encounter/outbound");
			} else {
				toast.message("File review complete — rejected package stays inbound");
				router.push("/admin/claim-encounter/inbound");
			}
		}
	}

	function openReject() {
		if (mockMode && selected.size === 0) {
			toast.message("Select at least one claim");
			return;
		}
		setReasonCodes(new Set());
		setNote("");
		setRejectOpen(true);
	}

	async function confirmReject() {
		if (reasonCodes.size === 0 && !note.trim()) {
			toast.error("Select at least one reject reason or add notes");
			return;
		}
		const reasons: RejectReason[] = REJECT_REASON_CATALOG.filter((r) =>
			reasonCodes.has(r.code)
		);

		if (!mockMode) {
			try {
				const claim_line_ids = selectedClaimLineIds();
				// Core routes use <uuid:id>; fileId is display reference_id (VM-CVF-…).
				await rejectMutation.mutateAsync({
					id: file!.id,
					reasons: reasons.map((r) => r.code),
					notes: note.trim() || undefined,
					claim_line_ids,
				});
				toast.success(
					claim_line_ids?.length
						? `Rejected ${claim_line_ids.length} claim line(s)`
						: "Vendor file rejected"
				);
				setRejectOpen(false);
				await invalidateAfterReview();
				router.push("/admin/claim-encounter/inbound");
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Reject failed");
			}
			return;
		}

		const count = selected.size;
		const updated = applyClaimReviews(
			file!.fileId,
			Array.from(selected).map((claimId) => ({
				claimId,
				status: "rejected" as const,
				reasons,
			}))
		);
		setClaims([...updated]);
		setSelected(new Set());
		setRejectOpen(false);
		toast.success(`Rejected ${count} claim(s) with reasons`);
		const refreshed = getVendorFile(file!.fileId);
		if (refreshed && refreshed.reviewStatus !== "pending") {
			if (refreshed.direction === "outbound") {
				router.push("/admin/claim-encounter/outbound");
			} else {
				toast.message("All claims rejected — package stays on inbound");
				router.push("/admin/claim-encounter/inbound");
			}
		}
	}

	const allSelected =
		claims.length > 0 && claims.every((c) => selected.has(c.claimId));
	const acceptDisabled =
		writePending || !reviewPending || (mockMode && selected.size === 0);
	const rejectDisabled =
		writePending || !reviewPending || (mockMode && selected.size === 0);
	const events = eventsQuery.data ?? [];

	return (
		<div className={cn(PAGE_H, "flex min-h-0 flex-col")}>
			<header className="shrink-0 border-b border-border/50 pb-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="min-w-0">
						<Link
							href={`/admin/claim-encounter/files/${encodeURIComponent(file.fileId)}`}
							className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="size-3" />
							File detail
						</Link>
						<div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
							<h1 className="truncate text-sm font-medium tracking-tight">
								{file.fileName}
							</h1>
							<span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
								MFC review
							</span>
						</div>
						<p className="truncate text-[11px] text-muted-foreground">
							{file.vendor} ·{" "}
							{mockMode
								? "Reject requires reason codes"
								: selected.size > 0
									? `Live review · ${selected.size} line(s) selected`
									: "Live accept/reject · whole file (or select lines)"}
							{focusedClaim ? (
								<>
									{" "}
									·{" "}
									<span className="font-mono text-foreground">
										{focusedClaim.claimId}
									</span>
								</>
							) : null}
						</p>
					</div>
					<div className="flex flex-wrap gap-1.5">
						{inboundId && !mockMode ? (
							<>
								<Button
									variant="outline"
									size="sm"
									className="h-7 text-xs"
									disabled={reprocessMutation.isPending}
									onClick={() => void handleReprocess()}
								>
									<RefreshCw
										className={cn(
											"mr-1 size-3.5",
											reprocessMutation.isPending && "animate-spin"
										)}
									/>
									{reprocessMutation.isPending ? "Reprocessing…" : "Reprocess"}
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="h-7 text-xs"
									onClick={() => setShowEvents((v) => !v)}
								>
									<History className="mr-1 size-3.5" />
									{showEvents ? "Hide events" : "Events"}
								</Button>
							</>
						) : null}
						{!mockMode &&
						file.reviewStatus === "accepted" &&
						(file.outboundSendStatus === "queued" ||
							file.outboundSendStatus === "failed" ||
							file.outboundSendStatus == null) ? (
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								disabled={sendMutation.isPending}
								onClick={() => void handleSendOutbound()}
							>
								<Send
									className={cn(
										"mr-1 size-3.5",
										sendMutation.isPending && "animate-pulse"
									)}
								/>
								{sendMutation.isPending ? "Sending…" : "Send outbound"}
							</Button>
						) : null}
						<Button
							size="sm"
							className="h-7 text-xs"
							onClick={() => void acceptSelected()}
							disabled={acceptDisabled}
						>
							<Check className="mr-1 size-3.5" />
							{mockMode
								? `Accept selected (${selected.size})`
								: acceptMutation.isPending
									? "Accepting…"
									: "Accept file"}
						</Button>
						<Button
							size="sm"
							variant="destructive"
							className="h-7 text-xs"
							onClick={openReject}
							disabled={rejectDisabled}
						>
							<X className="mr-1 size-3.5" />
							Reject with reasons
						</Button>
					</div>
				</div>
				{showEvents && inboundId && !mockMode ? (
					<div className="mt-2 rounded-md border border-border/60 bg-card/70 px-3 py-2">
						<p className="text-[11px] font-medium">Inbound processing events</p>
						{eventsQuery.isLoading ? (
							<p className="mt-1 text-[11px] text-muted-foreground">
								Loading events…
							</p>
						) : events.length === 0 ? (
							<p className="mt-1 text-[11px] text-muted-foreground">
								No events for this inbound file.
							</p>
						) : (
							<ul className="mt-1 max-h-28 space-y-1 overflow-y-auto text-[11px]">
								{events.map((evt, i) => (
									<li
										key={String(evt.id ?? i)}
										className="flex flex-wrap gap-x-2 border-b border-border/40 py-1 last:border-0"
									>
										<span className="font-medium text-foreground">
											{String(
												evt.event_type ?? evt.type ?? evt.status ?? "event"
											)}
										</span>
										<span className="text-muted-foreground">
											{String(
												evt.message ?? evt.detail ?? evt.description ?? ""
											)}
										</span>
										<span className="ml-auto tabular-nums text-muted-foreground">
											{String(evt.created_at ?? evt.occurred_at ?? "")}
										</span>
									</li>
								))}
							</ul>
						)}
					</div>
				) : null}
			</header>

			<div className="mt-2 min-h-0 flex-1">
				<ResizablePanelGroup
					direction="horizontal"
					className="h-full rounded-lg border border-border/50"
				>
					<ResizablePanel
						defaultSize={22}
						minSize={14}
						maxSize={40}
						className="bg-card/70"
					>
						<div className="flex h-full min-h-0 flex-col">
							<div className="shrink-0 border-b border-border/50 px-2.5 py-1.5">
								<p className="text-xs font-medium">
									Claims ({claims.length})
									{claimsQuery.isLoading ? " · loading…" : ""}
								</p>
								<p className="text-[10px] text-muted-foreground">
									Select to focus EDI claim loop
								</p>
							</div>
							<ScrollArea className="min-h-0 flex-1" scrollbarClassName="w-1.5">
								<div className="divide-y divide-border/40">
									<div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/40 bg-card px-2.5 py-1.5">
										<Checkbox
											checked={allSelected}
											onCheckedChange={(v) => toggleAll(Boolean(v))}
										/>
										<span className="text-[10px] font-medium uppercase text-muted-foreground">
											Select all
										</span>
									</div>
									{claims.map((c, index) => {
										const isFocused =
											(focusedClaimId ?? claims[0]?.claimId) === c.claimId;
										return (
											<div
												key={c.id}
												role="button"
												tabIndex={0}
												onClick={() => setFocusedClaimId(c.claimId)}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														setFocusedClaimId(c.claimId);
													}
												}}
												className={cn(
													"flex w-full cursor-pointer items-start gap-2 px-2.5 py-2 text-left hover:bg-muted/30",
													isFocused && "bg-primary/8 hover:bg-primary/12"
												)}
											>
												<div
													className="pt-0.5"
													onClick={(e) => e.stopPropagation()}
													onKeyDown={(e) => e.stopPropagation()}
												>
													<Checkbox
														checked={selected.has(c.claimId)}
														onCheckedChange={(v) =>
															toggleOne(c.claimId, Boolean(v))
														}
														disabled={c.mfcReviewStatus !== "pending"}
													/>
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center justify-between gap-1">
														<span className="font-mono text-[11px] font-medium">
															{c.claimId}
														</span>
														<span
															className={cn(
																"rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
																c.mfcReviewStatus === "accepted"
																	? "bg-emerald-100 text-emerald-800"
																	: c.mfcReviewStatus === "rejected"
																		? "bg-red-100 text-red-800"
																		: "bg-amber-100 text-amber-900"
															)}
														>
															{c.mfcReviewStatus}
														</span>
													</div>
													<div className="mt-0.5 flex justify-between gap-1 text-[10px] text-muted-foreground">
														<span className="font-mono">
															#{index + 1} · {c.memberId}
														</span>
														<span className="tabular-nums">
															{formatCurrency(c.amountBilled)}
														</span>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</ScrollArea>
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={78} minSize={50} className="min-w-0">
						<div className="flex h-full min-h-0 flex-col">
							<EdiViewerLoader
								load={load}
								fileName={file.fileName}
								focusClaimIndex={focusClaimIndex}
								jumpTo={null}
								className="h-full min-h-0 rounded-none border-0"
							/>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>

			<Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{mockMode
								? "Reject claims — reason required"
								: "Reject vendor file — reason required"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-xs text-muted-foreground">
							{mockMode
								? `Select one or more reason codes for ${selected.size} claim(s). These are returned to the vendor.`
								: "Select one or more reason codes for this vendor file. With lines selected, reject applies only to those claim lines."}
						</p>
						<div className="max-h-56 space-y-2 overflow-y-auto">
							{REJECT_REASON_CATALOG.map((reason) => {
								const checked = reasonCodes.has(reason.code);
								return (
									<label
										key={reason.code}
										className={cn(
											"flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-1.5 hover:bg-muted/50",
											checked && "border-border bg-muted/40"
										)}
									>
										<Checkbox
											checked={checked}
											onCheckedChange={(v) => {
												setReasonCodes((prev) => {
													const next = new Set(prev);
													if (v) next.add(reason.code);
													else next.delete(reason.code);
													return next;
												});
											}}
										/>
										<div className="min-w-0">
											<p className="font-mono text-xs font-semibold">
												{reason.code}
											</p>
											<p className="text-xs text-muted-foreground">
												{reason.description}
											</p>
										</div>
									</label>
								);
							})}
						</div>
						<div className="space-y-1">
							<Label className="text-xs">Optional note</Label>
							<Textarea
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder="Additional context for the vendor…"
								className="min-h-16 text-xs"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRejectOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={rejectMutation.isPending}
							onClick={() => void confirmReject()}
						>
							{rejectMutation.isPending ? "Rejecting…" : "Confirm reject"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

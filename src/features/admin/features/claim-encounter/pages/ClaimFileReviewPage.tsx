"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { ArrowLeft, Check, X } from "lucide-react";
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
import {
	EdiViewerLoader,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import {
	REJECT_REASON_CATALOG,
	type RejectReason,
	applyClaimReviews,
	claimsForFile,
	formatCurrency,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/mock-data";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Fill shell under admin header + GeneralShell padding */
const PAGE_H = "h-[calc(100svh-5rem)]";

export function ClaimFileReviewPage() {
	const params = useParams<{ fileId: string }>();
	const router = useRouter();
	const fileId = decodeURIComponent(params.fileId);
	const file = useMemo(() => getVendorFile(fileId), [fileId]);
	const [claims, setClaims] = useState(() =>
		file ? claimsForFile(file.fileId) : []
	);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [focusedClaimId, setFocusedClaimId] = useState<string | null>(() =>
		file ? (claimsForFile(file.fileId)[0]?.claimId ?? null) : null
	);
	const [rejectOpen, setRejectOpen] = useState(false);
	const [reasonCodes, setReasonCodes] = useState<Set<string>>(new Set());
	const [note, setNote] = useState("");

	const load = useCallback(
		() => loadEdiFixture(file?.ediFixture ?? "837I"),
		[file]
	);

	const focusClaimIndex = useMemo(() => {
		if (!focusedClaimId) return 0;
		const idx = claims.findIndex((c) => c.claimId === focusedClaimId);
		return idx >= 0 ? idx : 0;
	}, [claims, focusedClaimId]);

	const focusedClaim = claims[focusClaimIndex] ?? null;

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

	function acceptSelected() {
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
		if (selected.size === 0) {
			toast.message("Select at least one claim");
			return;
		}
		setReasonCodes(new Set());
		setNote("");
		setRejectOpen(true);
	}

	function confirmReject() {
		if (reasonCodes.size === 0) {
			toast.error("Select at least one reject reason");
			return;
		}
		const reasons: RejectReason[] = REJECT_REASON_CATALOG.filter((r) =>
			reasonCodes.has(r.code)
		);
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
							{file.vendor} · Reject requires reason codes
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
						<Button
							size="sm"
							className="h-7 text-xs"
							onClick={acceptSelected}
							disabled={selected.size === 0}
						>
							<Check className="mr-1 size-3.5" />
							Accept selected ({selected.size})
						</Button>
						<Button
							size="sm"
							variant="destructive"
							className="h-7 text-xs"
							onClick={openReject}
							disabled={selected.size === 0}
						>
							<X className="mr-1 size-3.5" />
							Reject with reasons
						</Button>
					</div>
				</div>
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
								<p className="text-xs font-medium">Claims ({claims.length})</p>
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
						<DialogTitle>Reject claims — reason required</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-xs text-muted-foreground">
							Select one or more reason codes for {selected.size} claim(s).
							These are returned to the vendor.
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
						<Button variant="destructive" onClick={confirmReject}>
							Confirm reject
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

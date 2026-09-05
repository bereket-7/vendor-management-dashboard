"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { Gavel, MoreHorizontal, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCreateContractMutation } from "@/features/admin/features/contracts/feature/queries/useContractsQuery";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import type { BidModel } from "@/features/shared/vms/types";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

import { RecordBidDialog } from "../feature/components/RecordBidDialog";
import {
	useAwardRfxMutation,
	useBidsList,
	useRfx,
	useUpdateRfxMutation,
} from "../feature/queries/useSourcingQuery";

export function RfxDetailPage() {
	const params = useParams<{ rfxId: string }>();
	const { rfx, isLoading } = useRfx(params.rfxId);
	const { bids } = useBidsList(params.rfxId);
	const updateRfx = useUpdateRfxMutation();
	const awardRfx = useAwardRfxMutation();
	const createContract = useCreateContractMutation();
	const [recordBidOpen, setRecordBidOpen] = useState(false);

	async function publish() {
		if (!rfx) return;
		try {
			await updateRfx.mutateAsync({
				id: rfx.id,
				patch: { status: "published" },
			});
			toast.success("RFX published.");
		} catch {
			toast.error("Could not publish RFX.");
		}
	}

	async function award(bid: BidModel, createDraft = true) {
		if (!rfx) return;
		try {
			await awardRfx.mutateAsync({ id: rfx.id, bidId: bid.id });
			if (createDraft) {
				const today = new Date();
				const end = new Date(today);
				end.setFullYear(end.getFullYear() + 1);
				await createContract.mutateAsync({
					number: `CTR-${new Date().getFullYear()}-${rfx.number.split("-").at(-1)}`,
					title: `${rfx.title} Agreement`,
					vendorId: bid.vendorId,
					vendorName: bid.vendorName,
					status: "draft",
					value: bid.amount,
					currency: bid.currency,
					startDate: today.toISOString().slice(0, 10),
					endDate: end.toISOString().slice(0, 10),
					slaSummary: `Awarded from ${rfx.number}`,
				});
			}
			toast.success(
				createDraft ? "Bid awarded and contract draft created." : "Bid awarded."
			);
		} catch {
			toast.error("Could not award bid.");
		}
	}

	if (isLoading)
		return (
			<div className="container py-8">
				<Skeleton className="h-96 w-full" />
			</div>
		);
	if (!rfx)
		return <div className="container py-8">Sourcing event not found.</div>;
	return (
		<div className="container space-y-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						href="/admin/sourcing"
						className="text-sm text-muted-foreground hover:underline"
					>
						← Sourcing
					</Link>
					<div className="mt-2 flex items-center gap-3">
						<h1 className="text-2xl font-bold">{rfx.number}</h1>
						<StatusBadge status={rfx.status} />
					</div>
					<p className="text-muted-foreground">{rfx.title}</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{rfx.status === "draft" && (
						<Button onClick={publish} disabled={updateRfx.isPending}>
							Publish
						</Button>
					)}
					{rfx.status !== "awarded" && rfx.status !== "cancelled" ? (
						<Button variant="outline" onClick={() => setRecordBidOpen(true)}>
							<Gavel className="mr-2 size-4" />
							Record bid
						</Button>
					) : null}
				</div>
			</div>
			<section className="grid gap-5 rounded-xl border border-border bg-card shadow-sm p-6 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<p className="text-xs uppercase text-muted-foreground">Type</p>
					<p className="font-medium">{rfx.type}</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">Category</p>
					<p className="font-medium">{rfx.category}</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">Closes</p>
					<p className="font-medium">{formatDate(rfx.closesAt)}</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">Budget</p>
					<p className="font-medium">
						{rfx.budget == null
							? "Not set"
							: formatMoney(rfx.budget, rfx.currency)}
					</p>
				</div>
				<p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">
					{rfx.description}
				</p>
			</section>
			<section className="space-y-4">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 className="font-semibold">Vendor bids</h2>
						<p className="text-sm text-muted-foreground">
							{bids.length} responses received
						</p>
					</div>
				</div>
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Vendor</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Submitted</TableHead>
								<TableHead>Notes</TableHead>
								<TableHead className="w-12 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{bids.map((bid) => (
								<TableRow key={bid.id}>
									<TableCell className="font-medium">
										{bid.vendorName}
									</TableCell>
									<TableCell>{formatMoney(bid.amount, bid.currency)}</TableCell>
									<TableCell>
										<StatusBadge status={bid.status} />
									</TableCell>
									<TableCell>{formatDate(bid.submittedAt)}</TableCell>
									<TableCell className="max-w-xs truncate">
										{bid.notes || "—"}
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="size-8">
													<MoreHorizontal className="size-4" />
													<span className="sr-only">Bid actions</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													disabled={
														rfx.status === "awarded" ||
														rfx.status === "cancelled" ||
														awardRfx.isPending ||
														createContract.isPending
													}
													onClick={() => void award(bid, true)}
												>
													<Trophy className="mr-2 size-3.5" />
													Award + contract draft
												</DropdownMenuItem>
												<DropdownMenuItem
													disabled={
														rfx.status === "awarded" ||
														rfx.status === "cancelled" ||
														awardRfx.isPending
													}
													onClick={() => void award(bid, false)}
												>
													<Trophy className="mr-2 size-3.5" />
													Award only
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{bids.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={6}
										className="h-24 text-center text-muted-foreground"
									>
										No bids received.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</section>
			<RecordBidDialog
				open={recordBidOpen}
				onOpenChange={setRecordBidOpen}
				rfx={rfx}
			/>
		</div>
	);
}

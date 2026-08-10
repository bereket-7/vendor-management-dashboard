"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useBidsList,
	useCreateContractMutation,
	useRfx,
	useUpdateRfxMutation,
} from "@/features/shared/vms/queries";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

export function RfxDetailPage() {
	const params = useParams<{ rfxId: string }>();
	const { rfx, isLoading } = useRfx(params.rfxId);
	const { bids } = useBidsList(params.rfxId);
	const updateRfx = useUpdateRfxMutation();
	const createContract = useCreateContractMutation();
	const [selectedBidId, setSelectedBidId] = useState("");
	const [createDraft, setCreateDraft] = useState(true);

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
	async function award() {
		if (!rfx) return;
		const bid = bids.find((item) => item.id === selectedBidId);
		if (!bid) return toast.error("Select a bid to award.");
		try {
			await updateRfx.mutateAsync({ id: rfx.id, patch: { status: "awarded" } });
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
				{rfx.status === "draft" && (
					<Button onClick={publish} disabled={updateRfx.isPending}>
						Publish
					</Button>
				)}
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
					{rfx.status !== "awarded" && bids.length > 0 && (
						<div className="flex flex-wrap items-center gap-3">
							<Select value={selectedBidId} onValueChange={setSelectedBidId}>
								<SelectTrigger className="w-60">
									<SelectValue placeholder="Select winning bid" />
								</SelectTrigger>
								<SelectContent>
									{bids
										.filter((bid) => bid.status === "submitted")
										.map((bid) => (
											<SelectItem key={bid.id} value={bid.id}>
												{bid.vendorName}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={createDraft}
									onChange={(e) => setCreateDraft(e.target.checked)}
								/>{" "}
								Create contract draft
							</label>
							<Button
								onClick={award}
								disabled={updateRfx.isPending || createContract.isPending}
							>
								Award
							</Button>
						</div>
					)}
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
								</TableRow>
							))}
							{bids.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={5}
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
		</div>
	);
}

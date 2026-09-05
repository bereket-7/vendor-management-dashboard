"use client";

import { useState } from "react";

import {
	ExternalLink,
	Gavel,
	MoreHorizontal,
	Plus,
	Send,
	Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
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
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import type { RfxModel } from "@/features/shared/vms/types";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link, useRouter } from "@/i18n/navigation";

import { RecordBidDialog } from "../feature/components/RecordBidDialog";
import { RfxCreateDialog } from "../feature/components/RfxCreateDialog";
import {
	useAwardRfxMutation,
	useBidsList,
	useRfxList,
	useUpdateRfxMutation,
} from "../feature/queries/useSourcingQuery";

export function SourcingPage() {
	const router = useRouter();
	const { events, isLoading, error } = useRfxList();
	const [createOpen, setCreateOpen] = useState(false);
	const [bidRfx, setBidRfx] = useState<RfxModel | null>(null);

	return (
		<div className="container space-y-6 py-8">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Sourcing</h1>
					<p className="text-sm text-muted-foreground">
						Manage RFI, RFP, and RFQ events.
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<Plus className="mr-2 size-4" /> Create RFX
				</Button>
			</div>
			{isLoading ? (
				<Skeleton className="h-72 w-full" />
			) : error ? (
				<p className="text-sm text-destructive">
					Unable to load sourcing events.
				</p>
			) : (
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Event</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Closes</TableHead>
								<TableHead>Bids</TableHead>
								<TableHead>Budget</TableHead>
								<TableHead className="w-12 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{events.map((event) => (
								<TableRow key={event.id}>
									<TableCell>
										<Link
											href={`/admin/sourcing/${event.id}`}
											className="font-medium hover:underline"
										>
											{event.number}
										</Link>
										<div className="text-xs text-muted-foreground">
											{event.title}
										</div>
									</TableCell>
									<TableCell>{event.type}</TableCell>
									<TableCell>
										<StatusBadge status={event.status} />
									</TableCell>
									<TableCell>{event.category || "—"}</TableCell>
									<TableCell>{formatDate(event.closesAt)}</TableCell>
									<TableCell>{event.bidCount}</TableCell>
									<TableCell>
										{event.budget == null
											? "—"
											: formatMoney(event.budget, event.currency)}
									</TableCell>
									<TableCell className="text-right">
										<RfxRowActions
											event={event}
											onRecordBid={() => setBidRfx(event)}
										/>
									</TableCell>
								</TableRow>
							))}
							{events.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={8}
										className="h-24 text-center text-muted-foreground"
									>
										No sourcing events.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}

			<RfxCreateDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={(id) => router.push(`/admin/sourcing/${id}`)}
			/>
			<RecordBidDialog
				open={Boolean(bidRfx)}
				onOpenChange={(open) => {
					if (!open) setBidRfx(null);
				}}
				rfx={bidRfx}
			/>
		</div>
	);
}

function RfxRowActions({
	event,
	onRecordBid,
}: {
	event: RfxModel;
	onRecordBid: () => void;
}) {
	const router = useRouter();
	const updateRfx = useUpdateRfxMutation();
	const awardRfx = useAwardRfxMutation();
	const { bids } = useBidsList(event.id);
	const canPublish = event.status === "draft";
	const canBid =
		event.status === "published" ||
		event.status === "evaluating" ||
		event.status === "closed";
	const awardable = bids.filter(
		(bid) => bid.status === "submitted" || bid.status === "draft"
	);
	const canAward =
		event.status === "published" ||
		event.status === "evaluating" ||
		event.status === "closed";

	async function publish() {
		try {
			await updateRfx.mutateAsync({
				id: event.id,
				patch: { status: "published" },
			});
			toast.success("RFX published.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not publish RFX."
			);
		}
	}

	async function award(bidId: string) {
		try {
			await awardRfx.mutateAsync({ id: event.id, bidId });
			toast.success("Bid awarded.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not award bid.");
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="size-8">
					<MoreHorizontal className="size-4" />
					<span className="sr-only">Actions</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => router.push(`/admin/sourcing/${event.id}`)}
				>
					<ExternalLink className="mr-2 size-3.5" />
					View detail
				</DropdownMenuItem>
				{canPublish ? (
					<DropdownMenuItem
						disabled={updateRfx.isPending}
						onClick={() => void publish()}
					>
						<Send className="mr-2 size-3.5" />
						Publish
					</DropdownMenuItem>
				) : null}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					disabled={!canBid && !canPublish}
					onClick={onRecordBid}
				>
					<Gavel className="mr-2 size-3.5" />
					Record bid
				</DropdownMenuItem>
				{canAward ? (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger disabled={awardRfx.isPending}>
							<Trophy className="mr-2 size-3.5" />
							Award bid
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							{awardable.length === 0 ? (
								<DropdownMenuItem disabled>No bids to award</DropdownMenuItem>
							) : (
								awardable.map((bid) => (
									<DropdownMenuItem
										key={bid.id}
										onClick={() => void award(bid.id)}
									>
										{bid.vendorName || bid.vendorId.slice(0, 8)} ·{" "}
										{formatMoney(bid.amount, bid.currency)}
									</DropdownMenuItem>
								))
							)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useRfxList } from "@/features/shared/vms/queries";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

export function SourcingPage() {
	const { events, isLoading, error } = useRfxList();
	return (
		<div className="container space-y-6 py-8">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Sourcing</h1>
					<p className="text-sm text-muted-foreground">
						Manage RFI, RFP, and RFQ events.
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/sourcing/create">
						<Plus className="mr-2 size-4" /> Create RFX
					</Link>
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
									<TableCell>{event.category}</TableCell>
									<TableCell>{formatDate(event.closesAt)}</TableCell>
									<TableCell>{event.bidCount}</TableCell>
									<TableCell>
										{event.budget == null
											? "—"
											: formatMoney(event.budget, event.currency)}
									</TableCell>
								</TableRow>
							))}
							{events.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={7}
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
		</div>
	);
}

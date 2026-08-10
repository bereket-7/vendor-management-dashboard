"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useInvoicesList,
	useUpdateInvoiceMutation,
} from "@/features/shared/vms/queries";
import type { InvoiceStatus } from "@/features/shared/vms/types";
import { formatMoney } from "@/features/shared/vms/utils";

export function InvoiceMatchPage() {
	const { invoices, isLoading } = useInvoicesList();
	const updateInvoice = useUpdateInvoiceMutation();
	const queue = invoices.filter((invoice) =>
		["submitted", "exception"].includes(invoice.status)
	);
	async function act(id: string, status: InvoiceStatus) {
		try {
			await updateInvoice.mutateAsync({
				id,
				patch: { status, ...(status === "matched" ? { matchScore: 100 } : {}) },
			});
			toast.success(`Invoice ${status.replaceAll("_", " ")}.`);
		} catch {
			toast.error("Could not update invoice.");
		}
	}
	return (
		<div className="container space-y-6 py-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Invoice match queue
				</h1>
				<p className="text-sm text-muted-foreground">
					Resolve three-way match exceptions before payment approval.
				</p>
			</div>
			{isLoading ? (
				<Skeleton className="h-72 w-full" />
			) : (
				<div className="space-y-4">
					{queue.map((invoice) => (
						<article
							key={invoice.id}
							className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border bg-card shadow-sm p-5"
						>
							<div className="min-w-52">
								<div className="flex items-center gap-2">
									<h2 className="font-semibold">{invoice.number}</h2>
									<StatusBadge status={invoice.status} />
								</div>
								<p className="text-sm text-muted-foreground">
									{invoice.vendorName} · {invoice.poNumber || "No PO"}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">
									Invoice amount
								</p>
								<p className="font-semibold">
									{formatMoney(invoice.amount, invoice.currency)}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">
									Match score
								</p>
								<p className="font-semibold">
									{invoice.matchScore == null
										? "Not evaluated"
										: `${invoice.matchScore}%`}
								</p>
							</div>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => act(invoice.id, "disputed")}
									disabled={updateInvoice.isPending}
								>
									Dispute
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => act(invoice.id, "matched")}
									disabled={updateInvoice.isPending}
								>
									Match
								</Button>
								<Button
									size="sm"
									onClick={() => act(invoice.id, "approved")}
									disabled={updateInvoice.isPending}
								>
									Approve
								</Button>
							</div>
						</article>
					))}
					{queue.length === 0 && (
						<div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
							The match queue is clear.
						</div>
					)}
				</div>
			)}
		</div>
	);
}

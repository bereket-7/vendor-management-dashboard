"use client";

import { useParams } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useInvoice,
	useUpdateInvoiceMutation,
} from "@/features/shared/vms/queries";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

export function InvoiceDetailPage() {
	const params = useParams<{ invoiceId: string }>();
	const { invoice, isLoading } = useInvoice(params.invoiceId);
	const updateInvoice = useUpdateInvoiceMutation();
	async function approve() {
		if (!invoice) return;
		try {
			await updateInvoice.mutateAsync({
				id: invoice.id,
				patch: { status: "approved" },
			});
			toast.success("Invoice approved.");
		} catch {
			toast.error("Could not approve invoice.");
		}
	}
	if (isLoading)
		return (
			<div className="container py-8">
				<Skeleton className="h-80 w-full" />
			</div>
		);
	if (!invoice) return <div className="container py-8">Invoice not found.</div>;
	const items = [
		["Vendor", invoice.vendorName],
		["Purchase order", invoice.poNumber || "Not linked"],
		["Submitted", formatDate(invoice.submittedAt)],
		["Due date", formatDate(invoice.dueDate)],
		[
			"Match score",
			invoice.matchScore == null ? "Not evaluated" : `${invoice.matchScore}%`,
		],
		["Last updated", formatDate(invoice.updatedAt)],
	];
	return (
		<div className="container max-w-5xl space-y-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						href="/admin/invoices"
						className="text-sm text-muted-foreground hover:underline"
					>
						← Invoices
					</Link>
					<div className="mt-2 flex items-center gap-3">
						<h1 className="text-2xl font-bold">{invoice.number}</h1>
						<StatusBadge status={invoice.status} />
					</div>
					<p className="mt-1 text-2xl font-semibold">
						{formatMoney(invoice.amount, invoice.currency)}
					</p>
				</div>
				{["matched", "exception", "submitted"].includes(invoice.status) && (
					<Button onClick={approve} disabled={updateInvoice.isPending}>
						Approve invoice
					</Button>
				)}
			</div>
			<section className="rounded-xl border border-border bg-card shadow-sm p-6">
				<h2 className="mb-5 font-semibold">Invoice details</h2>
				<dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{items.map(([label, value]) => (
						<div key={label}>
							<dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								{label}
							</dt>
							<dd className="mt-1">{value}</dd>
						</div>
					))}
				</dl>
			</section>
			{invoice.status === "exception" && (
				<section className="rounded-lg border border-orange-300 bg-orange-50 p-5 text-orange-950 dark:bg-orange-950/30 dark:text-orange-100">
					<h2 className="font-semibold">Match exception</h2>
					<p className="mt-1 text-sm">
						This invoice requires review because its amount or receipt data
						differs from the purchase order.
					</p>
					<Button className="mt-4" variant="outline" asChild>
						<Link href="/admin/invoices/match">Open match queue</Link>
					</Button>
				</section>
			)}
		</div>
	);
}

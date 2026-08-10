"use client";

import { useParams } from "next/navigation";

import { toast } from "sonner";

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
import {
	usePurchaseOrder,
	useUpdatePoMutation,
} from "@/features/shared/vms/queries";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

export function PoDetailPage() {
	const params = useParams<{ poId: string }>();
	const { order, isLoading } = usePurchaseOrder(params.poId);
	const updatePo = useUpdatePoMutation();
	async function update(status: "sent" | "received") {
		if (!order) return;
		try {
			await updatePo.mutateAsync({
				id: order.id,
				patch:
					status === "received"
						? {
								status,
								lines: order.lines.map((line) => ({
									...line,
									receivedQty: line.quantity,
								})),
							}
						: { status },
			});
			toast.success(
				status === "sent"
					? "Purchase order sent to vendor."
					: "Purchase order marked received."
			);
		} catch {
			toast.error("Could not update purchase order.");
		}
	}
	if (isLoading)
		return (
			<div className="container py-8">
				<Skeleton className="h-96 w-full" />
			</div>
		);
	if (!order)
		return <div className="container py-8">Purchase order not found.</div>;
	return (
		<div className="container space-y-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						href="/admin/purchase-orders"
						className="text-sm text-muted-foreground hover:underline"
					>
						← Purchase orders
					</Link>
					<div className="mt-2 flex items-center gap-3">
						<h1 className="text-2xl font-bold">{order.number}</h1>
						<StatusBadge status={order.status} />
					</div>
					<p className="text-muted-foreground">{order.vendorName}</p>
				</div>
				<div className="flex gap-3">
					{order.status === "draft" && (
						<Button
							onClick={() => update("sent")}
							disabled={updatePo.isPending}
						>
							Send to vendor
						</Button>
					)}
					{!["draft", "received", "cancelled"].includes(order.status) && (
						<Button
							onClick={() => update("received")}
							disabled={updatePo.isPending}
						>
							Mark received
						</Button>
					)}
				</div>
			</div>
			<div className="grid gap-4 rounded-xl border border-border bg-card shadow-sm p-5 sm:grid-cols-4">
				<div>
					<p className="text-xs uppercase text-muted-foreground">Ordered</p>
					<p>{formatDate(order.orderedAt)}</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">
						Acknowledged
					</p>
					<p>{formatDate(order.acknowledgedAt)}</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">Contract</p>
					<p>{order.contractId || "—"}</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">Total</p>
					<p className="font-semibold">
						{formatMoney(order.total, order.currency)}
					</p>
				</div>
			</div>
			<div className="rounded-xl border border-border bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Description</TableHead>
							<TableHead>Quantity</TableHead>
							<TableHead>Received</TableHead>
							<TableHead>Unit price</TableHead>
							<TableHead>Line total</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{order.lines.map((line) => (
							<TableRow key={line.id}>
								<TableCell className="font-medium">
									{line.description}
								</TableCell>
								<TableCell>{line.quantity}</TableCell>
								<TableCell>{line.receivedQty}</TableCell>
								<TableCell>
									{formatMoney(line.unitPrice, order.currency)}
								</TableCell>
								<TableCell>
									{formatMoney(line.quantity * line.unitPrice, order.currency)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

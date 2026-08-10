"use client";

import { useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePurchaseOrdersList } from "@/features/shared/vms/queries";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

export function PurchaseOrdersPage() {
	const { orders, isLoading, error } = usePurchaseOrdersList();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const allSelected =
		orders.length > 0 && orders.every((row) => selectedIds.has(row.id));

	function toggleAll() {
		if (allSelected) setSelectedIds(new Set());
		else setSelectedIds(new Set(orders.map((row) => row.id)));
	}

	function toggleOne(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	return (
		<div className="container space-y-6 py-8">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Purchase orders</h1>
					<p className="text-sm text-muted-foreground">
						Track orders from draft through receipt.
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/purchase-orders/create">
						<Plus className="mr-2 size-4" /> Create PO
					</Link>
				</Button>
			</div>
			<BulkActionsToolbar
				selectedCount={selectedIds.size}
				entityLabel="purchase order"
				onClear={() => setSelectedIds(new Set())}
				onApprove={() => {
					toast.success(`Approved ${selectedIds.size} PO(s).`);
					setSelectedIds(new Set());
				}}
				onArchive={() => {
					toast.success(`Archived ${selectedIds.size} PO(s).`);
					setSelectedIds(new Set());
				}}
				onExport={() => {
					toast.success(`Exported ${selectedIds.size} PO(s).`);
					setSelectedIds(new Set());
				}}
			/>
			{isLoading ? (
				<Skeleton className="h-72 w-full" />
			) : error ? (
				<p className="text-sm text-destructive">
					Unable to load purchase orders.
				</p>
			) : (
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">
									<Checkbox
										checked={allSelected}
										onCheckedChange={toggleAll}
										aria-label="Select all purchase orders"
									/>
								</TableHead>
								<TableHead>PO number</TableHead>
								<TableHead>Vendor</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Ordered</TableHead>
								<TableHead>Lines</TableHead>
								<TableHead>Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => (
								<TableRow key={order.id}>
									<TableCell>
										<Checkbox
											checked={selectedIds.has(order.id)}
											onCheckedChange={() => toggleOne(order.id)}
											aria-label={`Select ${order.number}`}
										/>
									</TableCell>
									<TableCell>
										<Link
											href={`/admin/purchase-orders/${order.id}`}
											className="font-medium hover:underline"
										>
											{order.number}
										</Link>
									</TableCell>
									<TableCell>{order.vendorName}</TableCell>
									<TableCell>
										<StatusBadge status={order.status} />
									</TableCell>
									<TableCell>{formatDate(order.orderedAt)}</TableCell>
									<TableCell>{order.lines.length}</TableCell>
									<TableCell>
										{formatMoney(order.total, order.currency)}
									</TableCell>
								</TableRow>
							))}
							{orders.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-24 text-center text-muted-foreground"
									>
										No purchase orders.
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

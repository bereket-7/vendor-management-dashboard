"use client";

import { useMemo, useState } from "react";

import {
	CheckCircle2,
	ClipboardList,
	ExternalLink,
	MoreHorizontal,
	PackageCheck,
	Plus,
	Send,
	Timer,
} from "lucide-react";
import { toast } from "sonner";

import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import type { PurchaseOrderModel } from "@/features/shared/vms/types";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { PoCreateDialog } from "../feature/components/PoCreateDialog";
import {
	usePurchaseOrdersList,
	useUpdatePoMutation,
} from "../feature/queries/usePurchaseOrdersQuery";

export function PurchaseOrdersPage() {
	const router = useRouter();
	const { orders, isLoading, error } = usePurchaseOrdersList();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [createOpen, setCreateOpen] = useState(false);

	const allSelected =
		orders.length > 0 && orders.every((row) => selectedIds.has(row.id));

	const kpis = useMemo(() => {
		const draft = orders.filter((o) => o.status === "draft").length;
		const open = orders.filter((o) =>
			["sent", "acknowledged", "pending_approval"].includes(o.status)
		).length;
		const received = orders.filter((o) => o.status === "received").length;
		const totalValue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
		return [
			{
				label: "Purchase orders",
				value: String(orders.length),
				hint: "Live orders",
				icon: ClipboardList,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Open",
				value: String(open),
				hint: `${draft} draft`,
				icon: Timer,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Received",
				value: String(received),
				hint: "Fully received",
				icon: PackageCheck,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Total value",
				value: formatMoney(totalValue, orders[0]?.currency || "USD"),
				hint: "Across listed POs",
				icon: CheckCircle2,
				tone: "text-sky-700 bg-sky-500/10",
			},
		];
	}, [orders]);

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
				<Button onClick={() => setCreateOpen(true)}>
					<Plus className="mr-2 size-4" /> Create PO
				</Button>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					return (
						<Card key={kpi.label} className="shadow-sm">
							<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{kpi.label}
								</CardTitle>
								<span
									className={cn(
										"inline-flex size-8 items-center justify-center rounded-lg",
										kpi.tone
									)}
								>
									<Icon className="size-4" />
								</span>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-semibold tabular-nums">
									{kpi.value}
								</p>
								<CardDescription className="mt-1">{kpi.hint}</CardDescription>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<BulkActionsToolbar
				selectedCount={selectedIds.size}
				entityLabel="purchase order"
				onClear={() => setSelectedIds(new Set())}
				onApprove={() => {
					toast.info("Use row actions to send, acknowledge, or receive.");
				}}
				onArchive={() => {
					toast.info("Bulk archive is not available yet.");
				}}
				onExport={() => {
					toast.info("Bulk export is not available yet.");
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
								<TableHead className="w-12 text-right">Actions</TableHead>
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
									<TableCell className="text-right">
										<PoRowActions order={order} />
									</TableCell>
								</TableRow>
							))}
							{orders.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={8}
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
			<PoCreateDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={(id) => router.push(`/admin/purchase-orders/${id}`)}
			/>
		</div>
	);
}

function PoRowActions({ order }: { order: PurchaseOrderModel }) {
	const router = useRouter();
	const updatePo = useUpdatePoMutation();

	async function setStatus(
		status: "sent" | "acknowledged" | "received" | "cancelled"
	) {
		try {
			await updatePo.mutateAsync({ id: order.id, patch: { status } });
			toast.success(
				status === "sent"
					? "Purchase order sent."
					: status === "acknowledged"
						? "Purchase order acknowledged."
						: status === "received"
							? "Marked received."
							: "Purchase order cancelled."
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
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
					onClick={() => router.push(`/admin/purchase-orders/${order.id}`)}
				>
					<ExternalLink className="mr-2 size-3.5" />
					View detail
				</DropdownMenuItem>
				{order.status === "draft" ? (
					<DropdownMenuItem
						disabled={updatePo.isPending}
						onClick={() => void setStatus("sent")}
					>
						<Send className="mr-2 size-3.5" />
						Send to vendor
					</DropdownMenuItem>
				) : null}
				{order.status === "sent" ? (
					<DropdownMenuItem
						disabled={updatePo.isPending}
						onClick={() => void setStatus("acknowledged")}
					>
						<CheckCircle2 className="mr-2 size-3.5" />
						Acknowledge
					</DropdownMenuItem>
				) : null}
				{["sent", "acknowledged", "partially_received"].includes(
					order.status
				) ? (
					<DropdownMenuItem
						disabled={updatePo.isPending}
						onClick={() => void setStatus("received")}
					>
						<PackageCheck className="mr-2 size-3.5" />
						Mark received
					</DropdownMenuItem>
				) : null}
				{order.status !== "cancelled" && order.status !== "received" ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							disabled={updatePo.isPending}
							onClick={() => void setStatus("cancelled")}
						>
							Cancel PO
						</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

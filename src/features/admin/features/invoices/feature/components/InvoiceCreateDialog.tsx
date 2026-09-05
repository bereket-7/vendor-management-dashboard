"use client";

import { type FormEvent, useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePurchaseOrdersList } from "@/features/admin/features/purchase-orders/feature/queries/usePurchaseOrdersQuery";
import { useVendorsList } from "@/features/shared/vms/queries";
import type { InvoiceStatus } from "@/features/shared/vms/types";

import { useCreateInvoiceMutation } from "../queries/useInvoicesQuery";

function defaultInvoiceNumber() {
	const year = new Date().getFullYear();
	const seq = String(Math.floor(Math.random() * 9000) + 1000);
	return `INV-${year}-${seq}`;
}

export function InvoiceCreateDialog({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated?: (id: string) => void;
}) {
	const { vendors } = useVendorsList();
	const { orders } = usePurchaseOrdersList();
	const createInvoice = useCreateInvoiceMutation();
	const [form, setForm] = useState({
		number: defaultInvoiceNumber(),
		vendorId: "",
		poId: "none",
		amount: "",
		currency: "USD",
		dueDate: "",
		status: "submitted" as InvoiceStatus,
	});

	useEffect(() => {
		if (open) {
			setForm({
				number: defaultInvoiceNumber(),
				vendorId: "",
				poId: "none",
				amount: "",
				currency: "USD",
				dueDate: "",
				status: "submitted",
			});
		}
	}, [open]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		const vendor = vendors.find((item) => item.id === form.vendorId);
		if (!vendor || !form.number || !form.amount || !form.dueDate) {
			toast.error("Complete all required fields.");
			return;
		}
		const po = orders.find((item) => item.id === form.poId);
		try {
			const invoice = await createInvoice.mutateAsync({
				number: form.number,
				vendorId: vendor.id,
				vendorName: vendor.legalName,
				poId: po?.id ?? null,
				poNumber: po?.number ?? null,
				status: form.status,
				amount: Number(form.amount),
				currency: form.currency,
				matchScore: null,
				submittedAt: new Date().toISOString(),
				dueDate: form.dueDate,
			});
			toast.success("Invoice created.");
			onOpenChange(false);
			onCreated?.(invoice.id);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not create invoice."
			);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add invoice</DialogTitle>
					<DialogDescription>
						Create a vendor invoice against an optional purchase order.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-4">
					<label className="space-y-2 text-sm font-medium">
						Invoice number
						<Input
							required
							value={form.number}
							onChange={(e) =>
								setForm((current) => ({ ...current, number: e.target.value }))
							}
						/>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Vendor
						<Select
							value={form.vendorId}
							onValueChange={(value) =>
								setForm((current) => ({ ...current, vendorId: value }))
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select vendor" />
							</SelectTrigger>
							<SelectContent>
								{vendors.map((vendor) => (
									<SelectItem key={vendor.id} value={vendor.id}>
										{vendor.legalName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Purchase order
						<Select
							value={form.poId}
							onValueChange={(value) =>
								setForm((current) => ({ ...current, poId: value }))
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No PO</SelectItem>
								{orders.map((order) => (
									<SelectItem key={order.id} value={order.id}>
										{order.number} · {order.vendorName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</label>
					<div className="grid grid-cols-[1fr_110px] gap-3">
						<label className="space-y-2 text-sm font-medium">
							Amount
							<Input
								required
								min="0.01"
								step="0.01"
								type="number"
								value={form.amount}
								onChange={(e) =>
									setForm((current) => ({ ...current, amount: e.target.value }))
								}
							/>
						</label>
						<label className="space-y-2 text-sm font-medium">
							Currency
							<Select
								value={form.currency}
								onValueChange={(value) =>
									setForm((current) => ({ ...current, currency: value }))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{["USD", "EUR", "GBP", "ETB"].map((currency) => (
										<SelectItem key={currency} value={currency}>
											{currency}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</label>
					</div>
					<label className="space-y-2 text-sm font-medium">
						Due date
						<Input
							required
							type="date"
							value={form.dueDate}
							onChange={(e) =>
								setForm((current) => ({ ...current, dueDate: e.target.value }))
							}
						/>
					</label>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button disabled={createInvoice.isPending}>
							{createInvoice.isPending ? "Creating…" : "Create invoice"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

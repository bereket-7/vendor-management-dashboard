"use client";

import { type FormEvent, useMemo, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useCreatePoMutation,
	useVendorsList,
} from "@/features/shared/vms/queries";
import { formatMoney } from "@/features/shared/vms/utils";
import { useRouter } from "@/i18n/navigation";

export function PoCreatePage() {
	const router = useRouter();
	const { vendors } = useVendorsList();
	const createPo = useCreatePoMutation();
	const [form, setForm] = useState({
		number: "",
		vendorId: "",
		currency: "USD",
		description: "",
		quantity: "1",
		unitPrice: "",
		send: true,
	});
	const total = useMemo(
		() => Number(form.quantity || 0) * Number(form.unitPrice || 0),
		[form.quantity, form.unitPrice]
	);
	const set = (key: keyof typeof form, value: string | boolean) =>
		setForm((current) => ({ ...current, [key]: value }));

	async function submit(event: FormEvent) {
		event.preventDefault();
		const vendor = vendors.find((item) => item.id === form.vendorId);
		if (!vendor || !form.number || !form.description || total <= 0)
			return toast.error("Complete all required fields.");
		try {
			const order = await createPo.mutateAsync({
				number: form.number,
				vendorId: vendor.id,
				vendorName: vendor.legalName,
				contractId: null,
				rfxId: null,
				status: form.send ? "sent" : "draft",
				currency: form.currency,
				total,
				lines: [
					{
						id: `line-${Date.now()}`,
						description: form.description,
						quantity: Number(form.quantity),
						unitPrice: Number(form.unitPrice),
						receivedQty: 0,
					},
				],
				orderedAt: new Date().toISOString(),
			});
			toast.success(
				form.send
					? "Purchase order created and sent."
					: "Purchase order draft created."
			);
			router.push(`/admin/purchase-orders/${order.id}`);
		} catch {
			toast.error("Could not create purchase order.");
		}
	}

	return (
		<div className="container max-w-4xl space-y-6 py-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Create purchase order
				</h1>
				<p className="text-sm text-muted-foreground">
					Create a single-line order and optionally send it immediately.
				</p>
			</div>
			<form
				onSubmit={submit}
				className="space-y-6 rounded-xl border border-border bg-card shadow-sm p-6"
			>
				<div className="grid gap-5 md:grid-cols-2">
					<label className="space-y-2 text-sm font-medium">
						PO number
						<Input
							required
							value={form.number}
							onChange={(e) => set("number", e.target.value)}
							placeholder="PO-2026-1109"
						/>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Vendor
						<Select
							value={form.vendorId}
							onValueChange={(value) => set("vendorId", value)}
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
					<label className="space-y-2 text-sm font-medium md:col-span-2">
						Line description
						<Input
							required
							value={form.description}
							onChange={(e) => set("description", e.target.value)}
						/>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Quantity
						<Input
							required
							type="number"
							min="1"
							step="1"
							value={form.quantity}
							onChange={(e) => set("quantity", e.target.value)}
						/>
					</label>
					<div className="grid grid-cols-[1fr_110px] gap-3">
						<label className="space-y-2 text-sm font-medium">
							Unit price
							<Input
								required
								type="number"
								min="0.01"
								step="0.01"
								value={form.unitPrice}
								onChange={(e) => set("unitPrice", e.target.value)}
							/>
						</label>
						<label className="space-y-2 text-sm font-medium">
							Currency
							<Select
								value={form.currency}
								onValueChange={(value) => set("currency", value)}
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
				</div>
				<div className="flex items-center justify-between rounded-md bg-muted p-4">
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={form.send}
							onChange={(e) => set("send", e.target.checked)}
						/>{" "}
						Send to vendor after creation
					</label>
					<p className="font-semibold">
						Total: {formatMoney(total, form.currency)}
					</p>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/admin/purchase-orders")}
					>
						Cancel
					</Button>
					<Button disabled={createPo.isPending}>
						{createPo.isPending
							? "Creating…"
							: form.send
								? "Create and send"
								: "Save draft"}
					</Button>
				</div>
			</form>
		</div>
	);
}

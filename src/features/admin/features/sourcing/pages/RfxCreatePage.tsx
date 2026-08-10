"use client";

import { FormEvent, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateRfxMutation,
	useVendorsList,
} from "@/features/shared/vms/queries";
import type { RfxType } from "@/features/shared/vms/types";
import { useRouter } from "@/i18n/navigation";

export function RfxCreatePage() {
	const router = useRouter();
	const { vendors } = useVendorsList();
	const createRfx = useCreateRfxMutation();
	const [form, setForm] = useState({
		type: "RFQ" as RfxType,
		number: "",
		title: "",
		category: "",
		closesAt: "",
		budget: "",
		currency: "USD",
		description: "",
		vendorId: "",
	});
	const set = (key: keyof typeof form, value: string) =>
		setForm((current) => ({ ...current, [key]: value }));

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (
			!form.number ||
			!form.title ||
			!form.category ||
			!form.closesAt ||
			!form.description
		)
			return toast.error("Complete all required fields.");
		try {
			const rfx = await createRfx.mutateAsync({
				number: form.number,
				title: form.title,
				type: form.type,
				status: "draft",
				category: form.category,
				closesAt: new Date(form.closesAt).toISOString(),
				invitedVendorIds: form.vendorId ? [form.vendorId] : [],
				budget: form.budget ? Number(form.budget) : null,
				currency: form.currency,
				description: form.description,
			});
			toast.success("Sourcing event created.");
			router.push(`/admin/sourcing/${rfx.id}`);
		} catch {
			toast.error("Could not create sourcing event.");
		}
	}

	return (
		<div className="container max-w-4xl space-y-6 py-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Create sourcing event
				</h1>
				<p className="text-sm text-muted-foreground">
					Prepare an RFI, RFP, or RFQ for vendors.
				</p>
			</div>
			<form
				onSubmit={submit}
				className="space-y-6 rounded-xl border border-border bg-card shadow-sm p-6"
			>
				<div className="grid gap-5 md:grid-cols-2">
					<label className="space-y-2 text-sm font-medium">
						Event type
						<Select
							value={form.type}
							onValueChange={(value: RfxType) =>
								setForm((current) => ({ ...current, type: value }))
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{["RFI", "RFP", "RFQ"].map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Event number
						<Input
							required
							value={form.number}
							onChange={(e) => set("number", e.target.value)}
							placeholder="RFQ-2026-019"
						/>
					</label>
					<label className="space-y-2 text-sm font-medium md:col-span-2">
						Title
						<Input
							required
							value={form.title}
							onChange={(e) => set("title", e.target.value)}
						/>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Category
						<Input
							required
							value={form.category}
							onChange={(e) => set("category", e.target.value)}
						/>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Closing date
						<Input
							required
							type="datetime-local"
							value={form.closesAt}
							onChange={(e) => set("closesAt", e.target.value)}
						/>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Invite vendor
						<Select
							value={form.vendorId || "none"}
							onValueChange={(value) =>
								set("vendorId", value === "none" ? "" : value)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Invite later</SelectItem>
								{vendors.map((vendor) => (
									<SelectItem key={vendor.id} value={vendor.id}>
										{vendor.legalName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</label>
					<div className="grid grid-cols-[1fr_110px] gap-3">
						<label className="space-y-2 text-sm font-medium">
							Budget
							<Input
								min="0"
								type="number"
								value={form.budget}
								onChange={(e) => set("budget", e.target.value)}
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
				<label className="block space-y-2 text-sm font-medium">
					Description
					<Textarea
						required
						rows={5}
						value={form.description}
						onChange={(e) => set("description", e.target.value)}
					/>
				</label>
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/admin/sourcing")}
					>
						Cancel
					</Button>
					<Button disabled={createRfx.isPending}>
						{createRfx.isPending ? "Creating…" : "Create draft"}
					</Button>
				</div>
			</form>
		</div>
	);
}

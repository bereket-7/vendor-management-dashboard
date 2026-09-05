"use client";

import { type FormEvent, useEffect, useState } from "react";

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
import { useVendorsList } from "@/features/shared/vms/queries";
import type { RfxType } from "@/features/shared/vms/types";

import { useCreateRfxMutation } from "../queries/useSourcingQuery";

type RfxCreateFormState = {
	type: RfxType;
	number: string;
	title: string;
	category: string;
	closesAt: string;
	budget: string;
	currency: string;
	description: string;
	vendorId: string;
};

function defaultNumber(type: RfxType) {
	const year = new Date().getFullYear();
	const seq = String(Math.floor(Math.random() * 900) + 100);
	return `${type}-${year}-${seq}`;
}

function emptyForm(): RfxCreateFormState {
	return {
		type: "RFQ",
		number: defaultNumber("RFQ"),
		title: "",
		category: "",
		closesAt: "",
		budget: "",
		currency: "USD",
		description: "",
		vendorId: "",
	};
}

export function RfxCreateForm({
	onCancel,
	onCreated,
}: {
	onCancel: () => void;
	onCreated: (id: string) => void;
}) {
	const { vendors } = useVendorsList();
	const createRfx = useCreateRfxMutation();
	const [form, setForm] = useState(emptyForm);
	const set = (key: keyof RfxCreateFormState, value: string) =>
		setForm((current) => ({ ...current, [key]: value }));

	useEffect(() => {
		setForm(emptyForm());
	}, []);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!form.number || !form.title || !form.closesAt || !form.description) {
			toast.error("Complete all required fields.");
			return;
		}
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
			onCreated(rfx.id);
		} catch {
			toast.error("Could not create sourcing event.");
		}
	}

	return (
		<form onSubmit={submit} className="space-y-5">
			<div className="grid gap-4 md:grid-cols-2">
				<label className="space-y-2 text-sm font-medium">
					Event type
					<Select
						value={form.type}
						onValueChange={(value: RfxType) =>
							setForm((current) => ({
								...current,
								type: value,
								number: current.number.startsWith(current.type)
									? defaultNumber(value)
									: current.number,
							}))
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
				<label className="space-y-2 text-sm font-medium md:col-span-2">
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
				<div className="grid grid-cols-[1fr_110px] gap-3 md:col-span-2">
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
					rows={4}
					value={form.description}
					onChange={(e) => set("description", e.target.value)}
				/>
			</label>
			<div className="flex justify-end gap-3">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button disabled={createRfx.isPending}>
					{createRfx.isPending ? "Creating…" : "Create draft"}
				</Button>
			</div>
		</form>
	);
}

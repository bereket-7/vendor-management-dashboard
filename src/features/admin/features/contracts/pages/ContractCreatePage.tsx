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
	useCreateContractMutation,
	useVendorsList,
} from "@/features/shared/vms/queries";
import { useRouter } from "@/i18n/navigation";

export function ContractCreatePage() {
	const router = useRouter();
	const { vendors, isLoading } = useVendorsList();
	const createContract = useCreateContractMutation();
	const [form, setForm] = useState({
		number: "",
		title: "",
		vendorId: "",
		value: "",
		currency: "USD",
		startDate: "",
		endDate: "",
		slaSummary: "",
	});

	async function submit(event: FormEvent) {
		event.preventDefault();
		const vendor = vendors.find((item) => item.id === form.vendorId);
		if (
			!vendor ||
			!form.number ||
			!form.title ||
			!form.startDate ||
			!form.endDate
		) {
			toast.error("Complete all required fields.");
			return;
		}
		try {
			const contract = await createContract.mutateAsync({
				number: form.number,
				title: form.title,
				vendorId: vendor.id,
				vendorName: vendor.legalName,
				status: "draft",
				value: Number(form.value),
				currency: form.currency,
				startDate: form.startDate,
				endDate: form.endDate,
				slaSummary: form.slaSummary || null,
			});
			toast.success("Contract created.");
			router.push(`/admin/contracts/${contract.id}`);
		} catch {
			toast.error("Could not create contract.");
		}
	}

	const field = (key: keyof typeof form) => ({
		value: form[key],
		onChange: (
			event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => setForm((current) => ({ ...current, [key]: event.target.value })),
	});

	return (
		<div className="container max-w-4xl space-y-6 py-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Create contract</h1>
				<p className="text-sm text-muted-foreground">
					Create a draft agreement for review.
				</p>
			</div>
			<form
				onSubmit={submit}
				className="space-y-6 rounded-xl border border-border bg-card shadow-sm p-6"
			>
				<div className="grid gap-5 md:grid-cols-2">
					<label className="space-y-2 text-sm font-medium">
						Contract number
						<Input required placeholder="CTR-2026-0012" {...field("number")} />
					</label>
					<label className="space-y-2 text-sm font-medium">
						Title
						<Input required placeholder="Agreement title" {...field("title")} />
					</label>
					<label className="space-y-2 text-sm font-medium">
						Vendor
						<Select
							value={form.vendorId}
							onValueChange={(vendorId) =>
								setForm((current) => ({ ...current, vendorId }))
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={isLoading ? "Loading vendors…" : "Select vendor"}
								/>
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
					<div className="grid grid-cols-[1fr_120px] gap-3">
						<label className="space-y-2 text-sm font-medium">
							Value
							<Input
								required
								min="0"
								step="0.01"
								type="number"
								{...field("value")}
							/>
						</label>
						<label className="space-y-2 text-sm font-medium">
							Currency
							<Select
								value={form.currency}
								onValueChange={(currency) =>
									setForm((current) => ({ ...current, currency }))
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
						Start date
						<Input required type="date" {...field("startDate")} />
					</label>
					<label className="space-y-2 text-sm font-medium">
						End date
						<Input
							required
							type="date"
							min={form.startDate}
							{...field("endDate")}
						/>
					</label>
				</div>
				<label className="block space-y-2 text-sm font-medium">
					SLA summary
					<Textarea
						placeholder="Service levels, response times, and delivery targets"
						{...field("slaSummary")}
					/>
				</label>
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/admin/contracts")}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={createContract.isPending}>
						{createContract.isPending ? "Creating…" : "Create draft"}
					</Button>
				</div>
			</form>
		</div>
	);
}

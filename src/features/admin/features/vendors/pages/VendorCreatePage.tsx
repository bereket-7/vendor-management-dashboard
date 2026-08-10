"use client";

import { FormEvent, useState } from "react";

import { toast } from "sonner";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateVendorMutation } from "@/features/shared/vms/queries";
import { useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { useInvalidateVendorCore } from "@/lib/vendor-core/hooks";

export function VendorCreatePage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Add vendor">
				<VendorCreateForm />
			</VendorCoreGate>
		);
	}
	return <VendorCreateForm />;
}

function VendorCreateForm() {
	const router = useRouter();
	const createVendor = useCreateVendorMutation();
	const invalidateVendorCore = useInvalidateVendorCore();
	const [form, setForm] = useState({
		legalName: "",
		tradeName: "",
		country: "US",
		city: "",
		categories: "",
		description: "",
	});

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		try {
			const vendor = await createVendor.mutateAsync({
				legalName: form.legalName.trim(),
				tradeName: form.tradeName.trim() || null,
				status: "active",
				categories: form.categories
					.split(",")
					.map((item) => item.trim())
					.filter(Boolean),
				tags: [],
				country: form.country.trim() || "US",
				city: form.city.trim(),
				taxId: null,
				website: null,
				description: form.description.trim() || null,
				riskLevel: "medium",
			});
			await invalidateVendorCore();
			toast.success("Vendor created");
			router.push(`/admin/vendors/${vendor.id}`);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to create vendor"
			);
		}
	}

	return (
		<div className="w-full space-y-3">
			<div>
				<h1 className="text-lg font-medium tracking-tight">Add vendor</h1>
				<p className="text-sm text-muted-foreground">
					Create a supplier master record on vendor-core.
				</p>
			</div>
			<form
				onSubmit={submit}
				className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
			>
				<div className="grid gap-3 sm:grid-cols-2">
					<Field label="Legal name" required>
						<Input
							required
							value={form.legalName}
							onChange={(e) => setForm({ ...form, legalName: e.target.value })}
						/>
					</Field>
					<Field label="Trade name">
						<Input
							value={form.tradeName}
							onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
						/>
					</Field>
					<Field label="Country" required>
						<Input
							required
							value={form.country}
							onChange={(e) => setForm({ ...form, country: e.target.value })}
						/>
					</Field>
					<Field label="City" required>
						<Input
							required
							value={form.city}
							onChange={(e) => setForm({ ...form, city: e.target.value })}
						/>
					</Field>
				</div>
				<Field
					label="Categories"
					hint="Separate multiple categories with commas."
				>
					<Input
						placeholder="Logistics, Packaging"
						value={form.categories}
						onChange={(e) => setForm({ ...form, categories: e.target.value })}
					/>
				</Field>
				<Field label="Description">
					<Textarea
						rows={5}
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
					/>
				</Field>
				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={() => router.back()}>
						Cancel
					</Button>
					<Button type="submit" disabled={createVendor.isPending}>
						{createVendor.isPending ? "Creating…" : "Create vendor"}
					</Button>
				</div>
			</form>
		</div>
	);
}

function Field({
	label,
	hint,
	required,
	children,
}: {
	label: string;
	hint?: string;
	required?: boolean;
	children: React.ReactNode;
}) {
	return (
		<label className="grid gap-2 text-sm font-medium">
			<span>
				{label}
				{required && <span className="text-destructive"> *</span>}
			</span>
			{children}
			{hint && (
				<span className="text-xs font-normal text-muted-foreground">
					{hint}
				</span>
			)}
		</label>
	);
}

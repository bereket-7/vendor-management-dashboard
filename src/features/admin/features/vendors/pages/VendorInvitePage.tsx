"use client";

import { FormEvent, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInviteVendorMutation } from "@/features/shared/vms/queries";
import { useRouter } from "@/i18n/navigation";

export function VendorInvitePage() {
	const router = useRouter();
	const inviteVendor = useInviteVendorMutation();
	const [legalName, setLegalName] = useState("");
	const [email, setEmail] = useState("");
	const [categories, setCategories] = useState("");

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		try {
			await inviteVendor.mutateAsync({
				legalName: legalName.trim(),
				email: email.trim(),
				categories: categories
					.split(",")
					.map((item) => item.trim())
					.filter(Boolean),
			});
			toast.success("Vendor invitation sent");
			router.push("/admin/vendors");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to invite vendor"
			);
		}
	}

	return (
		<div className="w-full space-y-3">
			<div>
				<h1 className="text-lg font-medium tracking-tight">Invite vendor</h1>
				<p className="text-sm text-muted-foreground">
					Send a supplier an invitation to begin onboarding.
				</p>
			</div>
			<form
				onSubmit={submit}
				className="space-y-3 rounded-xl border border-border bg-card shadow-sm p-4"
			>
				<label className="grid gap-2 text-sm font-medium">
					Legal name
					<Input
						required
						value={legalName}
						onChange={(event) => setLegalName(event.target.value)}
					/>
				</label>
				<label className="grid gap-2 text-sm font-medium">
					Contact email
					<Input
						type="email"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</label>
				<label className="grid gap-2 text-sm font-medium">
					Categories
					<Input
						placeholder="IT Services, Consulting"
						value={categories}
						onChange={(event) => setCategories(event.target.value)}
					/>
					<span className="text-xs font-normal text-muted-foreground">
						Separate categories with commas.
					</span>
				</label>
				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={() => router.back()}>
						Cancel
					</Button>
					<Button type="submit" disabled={inviteVendor.isPending}>
						{inviteVendor.isPending ? "Sending…" : "Send invitation"}
					</Button>
				</div>
			</form>
		</div>
	);
}

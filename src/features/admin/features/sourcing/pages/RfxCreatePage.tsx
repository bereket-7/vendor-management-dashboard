"use client";

import { useRouter } from "@/i18n/navigation";

import { RfxCreateForm } from "../feature/components/RfxCreateForm";

export function RfxCreatePage() {
	const router = useRouter();
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
			<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<RfxCreateForm
					onCancel={() => router.push("/admin/sourcing")}
					onCreated={(id) => router.push(`/admin/sourcing/${id}`)}
				/>
			</div>
		</div>
	);
}

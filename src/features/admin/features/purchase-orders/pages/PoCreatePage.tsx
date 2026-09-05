"use client";

import { useRouter } from "@/i18n/navigation";

import { PoCreateForm } from "../feature/components/PoCreateForm";

export function PoCreatePage() {
	const router = useRouter();
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
			<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<PoCreateForm
					onCancel={() => router.push("/admin/purchase-orders")}
					onCreated={(id) => router.push(`/admin/purchase-orders/${id}`)}
				/>
			</div>
		</div>
	);
}

"use client";

import { useParams } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useContract,
	useUpdateContractMutation,
} from "@/features/shared/vms/queries";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

export function ContractDetailPage() {
	const params = useParams<{ contractId: string }>();
	const { contract, isLoading } = useContract(params.contractId);
	const updateContract = useUpdateContractMutation();

	async function approve() {
		if (!contract) return;
		try {
			await updateContract.mutateAsync({
				id: contract.id,
				patch: { status: "active" },
			});
			toast.success("Contract approved and activated.");
		} catch {
			toast.error("Could not approve contract.");
		}
	}

	if (isLoading)
		return (
			<div className="container py-8">
				<Skeleton className="h-80 w-full" />
			</div>
		);
	if (!contract)
		return (
			<div className="container py-8">
				<p>Contract not found.</p>
			</div>
		);
	const details = [
		["Vendor", contract.vendorName],
		["Value", formatMoney(contract.value, contract.currency)],
		["Start date", formatDate(contract.startDate)],
		["End date", formatDate(contract.endDate)],
		["Last updated", formatDate(contract.updatedAt)],
	];

	return (
		<div className="container max-w-5xl space-y-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						href="/admin/contracts"
						className="text-sm text-muted-foreground hover:underline"
					>
						← Contracts
					</Link>
					<div className="mt-2 flex items-center gap-3">
						<h1 className="text-2xl font-bold">{contract.number}</h1>
						<StatusBadge status={contract.status} />
					</div>
					<p className="text-muted-foreground">{contract.title}</p>
				</div>
				{contract.status === "pending_approval" && (
					<Button onClick={approve} disabled={updateContract.isPending}>
						{updateContract.isPending ? "Approving…" : "Approve contract"}
					</Button>
				)}
			</div>
			<div className="grid gap-6 md:grid-cols-[2fr_1fr]">
				<section className="rounded-xl border border-border bg-card shadow-sm p-6">
					<h2 className="mb-5 font-semibold">Agreement details</h2>
					<dl className="grid gap-5 sm:grid-cols-2">
						{details.map(([label, value]) => (
							<div key={label}>
								<dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									{label}
								</dt>
								<dd className="mt-1 text-sm">{value}</dd>
							</div>
						))}
					</dl>
				</section>
				<section className="rounded-xl border border-border bg-card shadow-sm p-6">
					<h2 className="mb-3 font-semibold">Service level agreement</h2>
					<p className="text-sm text-muted-foreground">
						{contract.slaSummary || "No SLA has been specified."}
					</p>
				</section>
			</div>
		</div>
	);
}

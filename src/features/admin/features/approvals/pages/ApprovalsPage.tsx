"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useApprovalMutation,
	useApprovalsList,
} from "@/features/shared/vms/queries";
import type { ApprovalRequestModel } from "@/features/shared/vms/types";
import { formatDate } from "@/features/shared/vms/utils";

export function ApprovalsPage() {
	const { approvals, isLoading, error } = useApprovalsList();
	const decision = useApprovalMutation();
	const pending = approvals.filter((item) => item.status === "pending");
	const decided = approvals.filter((item) => item.status !== "pending");

	async function decide(id: string, status: "approved" | "rejected") {
		try {
			await decision.mutateAsync({ id, status });
			toast.success(`Request ${status}`);
		} catch (mutationError) {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to save decision"
			);
		}
	}

	if (isLoading)
		return (
			<div className="container space-y-5 py-8">
				<Skeleton className="h-10 w-56" />
				<Skeleton className="h-72 w-full" />
			</div>
		);

	return (
		<div className="container space-y-8 py-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
				<p className="text-sm text-muted-foreground">
					Review procurement requests awaiting a decision.
				</p>
			</div>
			{error ? (
				<p className="text-sm text-destructive">{error.message}</p>
			) : (
				<>
					<ApprovalSection
						title={`Pending (${pending.length})`}
						items={pending}
						actions={(item) => (
							<div className="flex gap-2">
								<Button
									size="sm"
									onClick={() => decide(item.id, "approved")}
									disabled={decision.isPending}
								>
									Approve
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => decide(item.id, "rejected")}
									disabled={decision.isPending}
								>
									Reject
								</Button>
							</div>
						)}
					/>
					<ApprovalSection title="Decision history" items={decided} />
				</>
			)}
		</div>
	);
}

function ApprovalSection({
	title,
	items,
	actions,
}: {
	title: string;
	items: ApprovalRequestModel[];
	actions?: (item: ApprovalRequestModel) => React.ReactNode;
}) {
	return (
		<section className="space-y-4">
			<h2 className="text-sm font-semibold">{title}</h2>
			<div className="divide-y rounded-xl border border-border bg-card shadow-sm">
				{items.map((item) => (
					<div
						key={item.id}
						className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
					>
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-medium">{item.title}</p>
								<StatusBadge status={item.type} />
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								{item.vendorName} · Requested by {item.requestedBy} on{" "}
								{formatDate(item.requestedAt)}
							</p>
						</div>
						{actions ? actions(item) : <StatusBadge status={item.status} />}
					</div>
				))}
				{items.length === 0 && (
					<p className="px-5 py-8 text-sm text-muted-foreground">
						No requests in this section.
					</p>
				)}
			</div>
		</section>
	);
}

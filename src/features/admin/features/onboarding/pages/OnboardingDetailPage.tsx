"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useApprovalMutation,
	useApprovalsList,
	useUpdateVendorMutation,
} from "@/features/shared/vms/queries";
import type { OnboardingStatus } from "@/features/shared/vms/types";
import { formatDate } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

import {
	useOnboardingCase,
	useUpdateOnboardingMutation,
} from "../feature/queries/useOnboardingQuery";

export function OnboardingDetailPage() {
	const params = useParams<{ caseId: string }>();
	const caseId = params.caseId;
	const { caseItem, isLoading, error } = useOnboardingCase(caseId);
	const { approvals } = useApprovalsList();
	const updateOnboarding = useUpdateOnboardingMutation();
	const updateApproval = useApprovalMutation();
	const updateVendor = useUpdateVendorMutation();
	const [note, setNote] = useState("");

	if (isLoading) {
		return (
			<div className="container space-y-5 py-8">
				<Skeleton className="h-10 w-72" />
				<Skeleton className="h-72 w-full" />
			</div>
		);
	}

	if (error || !caseItem) {
		return (
			<div className="container space-y-4 py-8">
				<Link
					href="/admin/onboarding"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back to queue
				</Link>
				<p className="text-sm text-destructive">
					{error?.message ?? "Onboarding case not found."}
				</p>
			</div>
		);
	}

	async function decide(
		status: Extract<
			OnboardingStatus,
			"approved" | "rejected" | "changes_requested"
		>
	) {
		if (!caseItem) return;
		try {
			await updateOnboarding.mutateAsync({
				id: caseItem.id,
				patch: {
					status,
					progress: status === "approved" ? 100 : caseItem.progress,
					reviewerNote: note.trim() || null,
					reviewedAt: new Date().toISOString(),
				},
			});
			const approval = approvals.find(
				(item) =>
					item.type === "onboarding" &&
					item.entityId === caseItem.id &&
					item.status === "pending"
			);
			if (approval)
				await updateApproval.mutateAsync({ id: approval.id, status });
			if (status === "approved") {
				await updateVendor.mutateAsync({
					id: caseItem.vendorId,
					patch: { status: "active", onboardingProgress: 100 },
				});
			}
			toast.success(
				status === "approved"
					? "Vendor onboarding approved"
					: "Review decision saved"
			);
		} catch (mutationError) {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to save decision"
			);
		}
	}

	const pending =
		updateOnboarding.isPending ||
		updateApproval.isPending ||
		updateVendor.isPending;

	const checklist = caseItem.checklist ?? [];

	return (
		<div className="container space-y-6 py-8">
			<Link
				href="/admin/onboarding"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Back to queue
			</Link>

			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{caseItem.vendorName || "Onboarding case"}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Submitted {formatDate(caseItem.submittedAt)} · {caseItem.progress}%
						complete
					</p>
					<p className="mt-1 font-mono text-xs text-muted-foreground">
						{caseItem.id}
					</p>
				</div>
				<StatusBadge status={caseItem.status} />
			</div>

			<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
				<div className="mb-2 flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Progress</span>
					<span className="font-medium tabular-nums">{caseItem.progress}%</span>
				</div>
				<Progress
					value={Math.min(100, Math.max(0, caseItem.progress))}
					className="h-2"
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
				<section className="rounded-xl border border-border bg-card shadow-sm">
					<div className="border-b px-5 py-4">
						<h2 className="font-semibold">Required checklist</h2>
					</div>
					{checklist.length === 0 ? (
						<p className="px-5 py-8 text-sm text-muted-foreground">
							No checklist items returned for this case yet.
						</p>
					) : (
						<ul className="divide-y">
							{checklist.map((item) => (
								<li
									key={item.id}
									className="flex items-center justify-between gap-4 px-5 py-4 text-sm"
								>
									<div className="flex items-center gap-3">
										<span
											className={`flex size-5 items-center justify-center rounded-full border text-xs ${item.completed ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}
										>
											{item.completed ? "✓" : ""}
										</span>
										<span>{item.label}</span>
									</div>
									<span className="text-xs text-muted-foreground">
										{item.required ? "Required" : "Optional"}
									</span>
								</li>
							))}
						</ul>
					)}
				</section>
				<aside className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
					<div>
						<h2 className="font-semibold">Review decision</h2>
						<p className="mt-1 text-xs text-muted-foreground">
							Add a note when requesting changes or rejecting.
						</p>
					</div>
					<Textarea
						rows={5}
						placeholder="Reviewer note"
						value={note}
						onChange={(event) => setNote(event.target.value)}
					/>
					<div className="grid gap-2">
						<Button onClick={() => decide("approved")} disabled={pending}>
							Approve onboarding
						</Button>
						<Button
							variant="outline"
							onClick={() => decide("changes_requested")}
							disabled={pending}
						>
							Request changes
						</Button>
						<Button
							variant="destructive"
							onClick={() => decide("rejected")}
							disabled={pending}
						>
							Reject
						</Button>
					</div>
				</aside>
			</div>
		</div>
	);
}

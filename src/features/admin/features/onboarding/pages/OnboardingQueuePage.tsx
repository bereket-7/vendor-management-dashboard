"use client";

import { useState } from "react";

import { toast } from "sonner";

import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { useOnboardingList } from "@/features/shared/vms/queries";
import { formatDate } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function OnboardingQueuePage() {
	const { cases, isLoading, error } = useOnboardingList();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const allSelected =
		cases.length > 0 && cases.every((row) => selectedIds.has(row.id));

	function toggleAll() {
		if (allSelected) setSelectedIds(new Set());
		else setSelectedIds(new Set(cases.map((row) => row.id)));
	}

	function toggleOne(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	if (isLoading) {
		return (
			<div className="container space-y-5 py-8">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-72 w-full" />
			</div>
		);
	}

	return (
		<div className="container space-y-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Onboarding queue
					</h1>
					<p className="text-sm text-muted-foreground">
						Review supplier readiness and outstanding requirements.
					</p>
				</div>
				<label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
					<Checkbox
						checked={allSelected}
						onCheckedChange={toggleAll}
						aria-label="Select all onboarding cases"
					/>
					Select all
				</label>
			</div>
			<BulkActionsToolbar
				selectedCount={selectedIds.size}
				entityLabel="case"
				onClear={() => setSelectedIds(new Set())}
				onApprove={() => {
					toast.success(`Approved ${selectedIds.size} onboarding case(s).`);
					setSelectedIds(new Set());
				}}
				onReject={() => {
					toast.message(`Sent back ${selectedIds.size} case(s) for revision.`);
					setSelectedIds(new Set());
				}}
				onExport={() => {
					toast.success(`Exported ${selectedIds.size} case(s).`);
					setSelectedIds(new Set());
				}}
			/>
			{error ? (
				<p className="text-sm text-destructive">{error.message}</p>
			) : (
				<div className="divide-y rounded-xl border border-border bg-card shadow-sm">
					{cases.map((item) => (
						<div
							key={item.id}
							className={cn(
								"flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/40",
								selectedIds.has(item.id) && "bg-primary/5"
							)}
						>
							<Checkbox
								className="mt-1"
								checked={selectedIds.has(item.id)}
								onCheckedChange={() => toggleOne(item.id)}
								aria-label={`Select ${item.vendorName}`}
							/>
							<Link
								href={`/admin/onboarding/${item.id}`}
								className="min-w-0 flex-1"
							>
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div>
										<p className="font-medium">{item.vendorName}</p>
										<p className="text-xs text-muted-foreground">
											Updated {formatDate(item.updatedAt)}
										</p>
									</div>
									<StatusBadge status={item.status} />
								</div>
								<div className="mt-4 flex items-center gap-3">
									<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary"
											style={{
												width: `${Math.min(100, Math.max(0, item.progress))}%`,
											}}
										/>
									</div>
									<span className="w-10 text-right text-xs font-medium tabular-nums">
										{item.progress}%
									</span>
								</div>
							</Link>
						</div>
					))}
					{cases.length === 0 && (
						<p className="px-5 py-10 text-center text-sm text-muted-foreground">
							No onboarding cases.
						</p>
					)}
				</div>
			)}
		</div>
	);
}

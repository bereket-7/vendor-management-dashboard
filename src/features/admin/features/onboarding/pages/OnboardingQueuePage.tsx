"use client";

import { useMemo, useState } from "react";

import {
	CheckCircle2,
	ClipboardList,
	ExternalLink,
	MoreHorizontal,
	Timer,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import type {
	OnboardingCaseModel,
	OnboardingStatus,
} from "@/features/shared/vms/types";
import { formatDate } from "@/features/shared/vms/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isVendorCoreLive } from "@/lib/vendor-core/client";

import {
	useOnboardingList,
	useSeedOnboardingMutation,
	useUpdateOnboardingMutation,
} from "../feature/queries/useOnboardingQuery";

function needsSubmitBeforeReview(status: OnboardingStatus) {
	return (
		status === "not_started" ||
		status === "in_progress" ||
		status === "changes_requested"
	);
}

function canReview(status: OnboardingStatus) {
	return status !== "approved" && status !== "rejected";
}

export function OnboardingQueuePage() {
	const router = useRouter();
	const { cases, isLoading, error, refetch } = useOnboardingList();
	const seed = useSeedOnboardingMutation();
	const updateOnboarding = useUpdateOnboardingMutation();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [bulkPending, setBulkPending] = useState(false);
	const [rowActionId, setRowActionId] = useState<string | null>(null);

	const allSelected =
		cases.length > 0 && cases.every((row) => selectedIds.has(row.id));
	const someSelected = selectedIds.size > 0 && !allSelected;

	const selectedCases = useMemo(
		() => cases.filter((row) => selectedIds.has(row.id)),
		[cases, selectedIds]
	);

	const kpis = useMemo(() => {
		const awaiting = cases.filter(
			(c) =>
				c.status === "submitted" ||
				c.status === "not_started" ||
				c.status === "in_progress" ||
				c.status === "changes_requested"
		).length;
		const approved = cases.filter((c) => c.status === "approved").length;
		const rejected = cases.filter((c) => c.status === "rejected").length;
		const avgProgress =
			cases.length === 0
				? 0
				: Math.round(
						cases.reduce((sum, c) => sum + (c.progress ?? 0), 0) / cases.length
					);
		return [
			{
				label: "Total cases",
				value: String(cases.length),
				hint: "Live onboarding queue",
				icon: ClipboardList,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Awaiting review",
				value: String(awaiting),
				hint: "Not yet decided",
				icon: Timer,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Approved",
				value: String(approved),
				hint: `${rejected} rejected`,
				icon: CheckCircle2,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
			{
				label: "Avg progress",
				value: `${avgProgress}%`,
				hint: "Across all cases",
				icon: Timer,
				tone: "text-sky-700 bg-sky-500/10",
			},
		];
	}, [cases]);

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

	async function applyDecision(
		item: OnboardingCaseModel,
		status: "approved" | "rejected"
	) {
		if (needsSubmitBeforeReview(item.status)) {
			await updateOnboarding.mutateAsync({
				id: item.id,
				patch: { status: "submitted" },
			});
		}
		await updateOnboarding.mutateAsync({
			id: item.id,
			patch: {
				status,
				progress: status === "approved" ? 100 : item.progress,
			},
		});
	}

	async function runBulk(status: "approved" | "rejected") {
		if (selectedCases.length === 0) return;
		setBulkPending(true);
		let ok = 0;
		let failed = 0;
		try {
			for (const item of selectedCases) {
				if (!canReview(item.status)) {
					failed += 1;
					continue;
				}
				try {
					await applyDecision(item, status);
					ok += 1;
				} catch {
					failed += 1;
				}
			}
			if (ok) {
				toast.success(
					status === "approved"
						? `Accepted ${ok} case(s)`
						: `Rejected ${ok} case(s)`
				);
			}
			if (failed) toast.error(`${failed} case(s) failed to update`);
			setSelectedIds(new Set());
			await refetch();
		} finally {
			setBulkPending(false);
		}
	}

	async function runRowAction(
		item: OnboardingCaseModel,
		status: "approved" | "rejected"
	) {
		setRowActionId(item.id);
		try {
			await applyDecision(item, status);
			toast.success(
				status === "approved"
					? `Accepted ${item.vendorName || "case"}`
					: `Rejected ${item.vendorName || "case"}`
			);
			await refetch();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		} finally {
			setRowActionId(null);
		}
	}

	if (isLoading) {
		return (
			<div className="container space-y-5 py-8">
				<Skeleton className="h-10 w-64" />
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-xl" />
					))}
				</div>
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
				{isVendorCoreLive() ? (
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						disabled={seed.isPending}
						onClick={() =>
							seed.mutate(false, {
								onSuccess: (res) => {
									const files = res.files_written ?? 0;
									toast.success(
										files > 0
											? `Seeded ${res.created} onboarding case(s), wrote ${files} file(s)`
											: `Seeded ${res.created} onboarding case(s)`
									);
									if (files === 0 && res.created === 0) {
										toast.message("All vendors already have onboarding cases.");
									}
								},
								onError: (err) =>
									toast.error(
										err instanceof Error ? err.message : "Seed failed"
									),
							})
						}
					>
						{seed.isPending ? "Seeding…" : "Seed"}
					</Button>
				) : null}
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					return (
						<Card key={kpi.label} className="shadow-sm">
							<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{kpi.label}
								</CardTitle>
								<span
									className={cn(
										"inline-flex size-8 items-center justify-center rounded-lg",
										kpi.tone
									)}
								>
									<Icon className="size-4" />
								</span>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-semibold tabular-nums">
									{kpi.value}
								</p>
								<CardDescription className="mt-1">{kpi.hint}</CardDescription>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<BulkActionsToolbar
				selectedCount={selectedIds.size}
				entityLabel="case"
				onClear={() => setSelectedIds(new Set())}
				onApprove={() => {
					void runBulk("approved");
				}}
				onReject={() => {
					void runBulk("rejected");
				}}
				onExport={() => {
					toast.info("Bulk export is not available yet.");
				}}
			/>

			{error ? (
				<p className="text-sm text-destructive">{error.message}</p>
			) : (
				<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="w-12 pl-4 sm:pl-6">
										<Checkbox
											checked={
												allSelected
													? true
													: someSelected
														? "indeterminate"
														: false
											}
											onCheckedChange={toggleAll}
											aria-label="Select all onboarding cases"
											disabled={cases.length === 0 || bulkPending}
										/>
									</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="min-w-[160px]">Progress</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead className="pr-4 text-right sm:pr-6">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{cases.map((item) => {
									const selected = selectedIds.has(item.id);
									const busy = rowActionId === item.id || bulkPending;
									const reviewable = canReview(item.status);
									return (
										<TableRow
											key={item.id}
											className={cn(
												"cursor-pointer",
												selected && "bg-primary/5"
											)}
											onClick={() =>
												router.push(`/admin/onboarding/${item.id}`)
											}
										>
											<TableCell
												className="pl-4 sm:pl-6"
												onClick={(e) => e.stopPropagation()}
											>
												<Checkbox
													checked={selected}
													onCheckedChange={() => toggleOne(item.id)}
													aria-label={`Select ${item.vendorName || item.id}`}
													disabled={busy}
												/>
											</TableCell>
											<TableCell>
												<div className="min-w-0">
													<p className="font-medium">
														{item.vendorName || "—"}
													</p>
													<p className="truncate font-mono text-[11px] text-muted-foreground">
														{item.id}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<StatusBadge status={item.status} />
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													<Progress
														value={Math.min(100, Math.max(0, item.progress))}
														className="h-1.5 flex-1"
													/>
													<span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">
														{item.progress}%
													</span>
												</div>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{formatDate(item.updatedAt)}
											</TableCell>
											<TableCell
												className="pr-4 text-right sm:pr-6"
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-8"
															disabled={busy}
														>
															<MoreHorizontal className="size-4" />
															<span className="sr-only">Actions</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link href={`/admin/onboarding/${item.id}`}>
																<ExternalLink className="mr-2 size-3.5" />
																View detail
															</Link>
														</DropdownMenuItem>
														{reviewable ? (
															<>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	disabled={busy}
																	onClick={() =>
																		void runRowAction(item, "approved")
																	}
																>
																	<CheckCircle2 className="mr-2 size-3.5 text-emerald-600" />
																	Accept
																</DropdownMenuItem>
																<DropdownMenuItem
																	disabled={busy}
																	className="text-destructive focus:text-destructive"
																	onClick={() =>
																		void runRowAction(item, "rejected")
																	}
																>
																	<XCircle className="mr-2 size-3.5" />
																	Reject
																</DropdownMenuItem>
															</>
														) : null}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
								{cases.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-24 text-center text-muted-foreground"
										>
											No onboarding cases.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-sm text-muted-foreground sm:px-6">
						<span>
							{cases.length} case{cases.length === 1 ? "" : "s"}
							{selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}

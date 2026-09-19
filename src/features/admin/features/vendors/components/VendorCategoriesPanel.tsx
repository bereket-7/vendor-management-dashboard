"use client";

import { useMemo, useState } from "react";

import { Loader2, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import {
	useCreateVendorCategoryAssignmentMutation,
	useDeleteVendorCategoryAssignmentMutation,
	useVendorCategoriesQuery,
	useVendorCategoryAssignmentsQuery,
} from "../feature/queries/useVendorsQuery";

type VendorCategoriesPanelProps = {
	vendorId: string;
};

export function VendorCategoriesPanel({ vendorId }: VendorCategoriesPanelProps) {
	const categoriesQ = useVendorCategoriesQuery(true);
	const assignmentsQ = useVendorCategoryAssignmentsQuery(vendorId, true);
	const createMutation = useCreateVendorCategoryAssignmentMutation(vendorId);
	const deleteMutation = useDeleteVendorCategoryAssignmentMutation();
	const [pickId, setPickId] = useState("");

	const assignments = useMemo(
		() => assignmentsQ.data ?? [],
		[assignmentsQ.data]
	);
	const assignedCategoryIds = useMemo(() => {
		const ids = new Set<string>();
		for (const row of assignments) {
			const id = row.category?.id || row.category_id;
			if (id) ids.add(String(id));
		}
		return ids;
	}, [assignments]);

	const available = (categoriesQ.data ?? []).filter(
		(c) => !assignedCategoryIds.has(c.id)
	);

	async function handleAdd() {
		if (!pickId) {
			toast.message("Select a category first");
			return;
		}
		try {
			await createMutation.mutateAsync({
				category_id: pickId,
				is_primary: assignments.length === 0,
			});
			toast.success("Category assigned");
			setPickId("");
			await assignmentsQ.refetch();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not assign category"
			);
		}
	}

	async function handleRemove(assignmentId: string) {
		try {
			await deleteMutation.mutateAsync(assignmentId);
			toast.success("Category removed");
			await assignmentsQ.refetch();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not remove category"
			);
		}
	}

	return (
		<div className="rounded-xl border border-border bg-card p-4 shadow-sm">
			<div className="mb-3 flex items-center gap-2">
				<Tags className="size-4 text-muted-foreground" />
				<div>
					<h3 className="text-sm font-semibold tracking-tight">Categories</h3>
					<p className="text-xs text-muted-foreground">
						Assign catalog categories to this vendor.
					</p>
				</div>
			</div>

			{assignmentsQ.isLoading ? (
				<p className="text-sm text-muted-foreground">Loading categories…</p>
			) : assignments.length === 0 ? (
				<p className="mb-3 text-sm text-muted-foreground">
					No categories assigned yet.
				</p>
			) : (
				<ul className="mb-3 space-y-2">
					{assignments.map((row) => {
						const name =
							row.category?.name ||
							row.category?.code ||
							row.category_id ||
							"Category";
						const code = row.category?.code;
						return (
							<li
								key={row.id}
								className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">
										{name}
										{row.is_primary ? (
											<span className="ml-2 text-[11px] font-semibold text-primary">
												Primary
											</span>
										) : null}
									</p>
									{code ? (
										<p className="font-mono text-[11px] text-muted-foreground">
											{code}
										</p>
									) : null}
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-8 text-destructive"
									disabled={deleteMutation.isPending}
									onClick={() => void handleRemove(row.id)}
									title="Remove category"
								>
									<Trash2 className="size-3.5" />
								</Button>
							</li>
						);
					})}
				</ul>
			)}

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<Select value={pickId || "__none__"} onValueChange={(v) => setPickId(v === "__none__" ? "" : v)}>
					<SelectTrigger className="h-9 flex-1">
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__none__">Select category</SelectItem>
						{available.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name} ({c.code})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					type="button"
					size="sm"
					className="h-9"
					disabled={!pickId || createMutation.isPending || available.length === 0}
					onClick={() => void handleAdd()}
				>
					{createMutation.isPending ? (
						<Loader2 className="mr-1.5 size-3.5 animate-spin" />
					) : (
						<Plus className="mr-1.5 size-3.5" />
					)}
					Add
				</Button>
			</div>
		</div>
	);
}

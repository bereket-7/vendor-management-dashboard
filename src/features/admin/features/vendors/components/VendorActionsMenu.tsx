"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useDeleteVendorMutation,
	useHardDeleteVendorMutation,
	useRestoreVendorMutation,
	useUpdateVendorMutation,
} from "@/features/shared/vms/queries";
import type { VendorModel, VendorStatus } from "@/features/shared/vms/types";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

const STATUSES: VendorStatus[] = [
	"prospect",
	"invited",
	"onboarding",
	"under_review",
	"active",
	"suspended",
	"offboarded",
];

type VendorActionsTarget = {
	id: string;
	name: string;
	legalName?: string;
	tradeName?: string | null;
	country?: string;
	city?: string;
	status?: VendorStatus | string;
	isDeleted?: boolean;
};

type VendorActionsMenuProps = {
	vendor: VendorActionsTarget;
	/** Optional trigger element; defaults to children-less menu for composition */
	trigger: React.ReactNode;
	/** After delete/hard-delete, navigate away from detail */
	redirectOnDelete?: string;
	/** Extra menu items rendered above API actions */
	extraItems?: React.ReactNode;
	align?: "start" | "end" | "center";
	menuClassName?: string;
	/** Controlled edit dialog (e.g. detail page Edit button) */
	editOpen?: boolean;
	onEditOpenChange?: (open: boolean) => void;
};

export function VendorActionsMenu({
	vendor,
	trigger,
	redirectOnDelete = "/admin/vendors",
	extraItems,
	align = "end",
	menuClassName,
	editOpen: editOpenProp,
	onEditOpenChange,
}: VendorActionsMenuProps) {
	const router = useRouter();
	const live = !isMockEnabled();
	const updateVendor = useUpdateVendorMutation();
	const deleteVendor = useDeleteVendorMutation();
	const hardDeleteVendor = useHardDeleteVendorMutation();
	const restoreVendor = useRestoreVendorMutation();

	const [editOpenUncontrolled, setEditOpenUncontrolled] = useState(false);
	const editOpen = editOpenProp ?? editOpenUncontrolled;
	const setEditOpen = onEditOpenChange ?? setEditOpenUncontrolled;
	const [busy, setBusy] = useState(false);
	const [confirmMode, setConfirmMode] = useState<"soft" | "hard" | null>(
		null
	);
	const [form, setForm] = useState({
		legalName: vendor.legalName || vendor.name,
		tradeName: vendor.tradeName ?? "",
		country: vendor.country ?? "US",
		city: vendor.city ?? "",
		status: (vendor.status as VendorStatus) || "active",
	});

	function openEdit() {
		setEditOpen(true);
	}

	useEffect(() => {
		if (!editOpen) return;
		setForm({
			legalName: vendor.legalName || vendor.name,
			tradeName: vendor.tradeName ?? "",
			country: vendor.country ?? "US",
			city: vendor.city ?? "",
			status: (vendor.status as VendorStatus) || "active",
		});
	}, [editOpen, vendor]);

	async function saveEdit() {
		setBusy(true);
		try {
			await updateVendor.mutateAsync({
				id: vendor.id,
				patch: {
					legalName: form.legalName.trim(),
					tradeName: form.tradeName.trim() || null,
					country: form.country.trim(),
					city: form.city.trim(),
					status: form.status,
				},
			});
			toast.success("Vendor updated");
			setEditOpen(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		} finally {
			setBusy(false);
		}
	}

	async function confirmDelete() {
		if (!confirmMode) return;
		const mode = confirmMode;
		setConfirmMode(null);
		setBusy(true);
		try {
			if (mode === "soft") {
				await deleteVendor.mutateAsync(vendor.id);
				toast.success("Vendor deleted");
			} else {
				await hardDeleteVendor.mutateAsync(vendor.id);
				toast.success("Vendor permanently deleted");
			}
			if (redirectOnDelete) router.push(redirectOnDelete);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: mode === "hard"
						? "Hard delete failed"
						: "Delete failed"
			);
		} finally {
			setBusy(false);
		}
	}

	async function onRestore() {
		setBusy(true);
		try {
			await restoreVendor.mutateAsync(vendor.id);
			toast.success("Vendor restored");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Restore failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild disabled={busy}>
					{trigger}
				</DropdownMenuTrigger>
				<DropdownMenuContent align={align} className={menuClassName}>
					{extraItems}
					{extraItems ? <DropdownMenuSeparator /> : null}
					<DropdownMenuItem asChild>
						<Link href={`/admin/vendors/${vendor.id}`}>Open detail</Link>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={openEdit}>
						Edit / update vendor
					</DropdownMenuItem>
					{live ? (
						<>
							<DropdownMenuSeparator />
							{vendor.isDeleted ? (
								<DropdownMenuItem onClick={() => void onRestore()}>
									Restore vendor
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									className="text-amber-700 focus:text-amber-700"
									onClick={() => setConfirmMode("soft")}
								>
									Delete (soft)
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => setConfirmMode("hard")}
							>
								Hard delete
							</DropdownMenuItem>
						</>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Update vendor</DialogTitle>
					</DialogHeader>
					<div className="grid gap-3 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="vendor-legal-name">Legal name</Label>
							<Input
								id="vendor-legal-name"
								value={form.legalName}
								onChange={(e) =>
									setForm((f) => ({ ...f, legalName: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="vendor-trade-name">Trade name</Label>
							<Input
								id="vendor-trade-name"
								value={form.tradeName}
								onChange={(e) =>
									setForm((f) => ({ ...f, tradeName: e.target.value }))
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="vendor-country">Country</Label>
								<Input
									id="vendor-country"
									value={form.country}
									onChange={(e) =>
										setForm((f) => ({ ...f, country: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="vendor-city">City</Label>
								<Input
									id="vendor-city"
									value={form.city}
									onChange={(e) =>
										setForm((f) => ({ ...f, city: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label>Status</Label>
							<Select
								value={form.status}
								onValueChange={(v) =>
									setForm((f) => ({ ...f, status: v as VendorStatus }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{STATUSES.map((s) => (
										<SelectItem key={s} value={s}>
											{s.replace(/_/g, " ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={busy || !form.legalName.trim()}
							onClick={() => void saveEdit()}
						>
							{busy ? "Saving…" : "Save changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={confirmMode !== null}
				onOpenChange={(open) => {
					if (!open) setConfirmMode(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirmMode === "hard"
								? "Permanently delete vendor?"
								: "Soft-delete vendor?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmMode === "hard" ? (
								<>
									Permanently delete{" "}
									<span className="font-medium text-foreground">
										“{vendor.name}”
									</span>
									? This cannot be undone.
								</>
							) : (
								<>
									Soft-delete{" "}
									<span className="font-medium text-foreground">
										“{vendor.name}”
									</span>
									? You can restore it later.
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={busy}
							className={cn(
								confirmMode === "hard" &&
									"bg-destructive text-destructive-foreground hover:bg-destructive/90"
							)}
							onClick={(e) => {
								e.preventDefault();
								void confirmDelete();
							}}
						>
							{busy
								? "Deleting…"
								: confirmMode === "hard"
									? "Delete permanently"
									: "Soft delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

/** Map a full VendorModel into the actions target shape. */
export function vendorModelToActionsTarget(
	vendor: VendorModel
): VendorActionsTarget {
	return {
		id: vendor.id,
		name: vendor.tradeName || vendor.legalName,
		legalName: vendor.legalName,
		tradeName: vendor.tradeName,
		country: vendor.country,
		city: vendor.city,
		status: vendor.status,
	};
}

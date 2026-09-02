"use client";

import { useMemo, useState } from "react";

import { Mail, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { VendorContact } from "@/features/shared/vms/types";

import {
	useCreateVendorContactMutation,
	useDeleteVendorContactMutation,
	useUpdateVendorContactMutation,
} from "../feature/queries/useVendorsQuery";

type ContactDraft = {
	name: string;
	email: string;
	phone: string;
	role: string;
	is_primary: boolean;
};

function emptyContactDraft(isPrimary = false): ContactDraft {
	return {
		name: "",
		email: "",
		phone: "",
		role: "",
		is_primary: isPrimary,
	};
}

function contactToDraft(contact: VendorContact): ContactDraft {
	return {
		name: contact.name,
		email: contact.email,
		phone: contact.phone ?? "",
		role: contact.role,
		is_primary: contact.isPrimary,
	};
}

type VendorContactsTabProps = {
	vendorId: string;
	contacts: VendorContact[];
};

export function VendorContactsTab({
	vendorId,
	contacts,
}: VendorContactsTabProps) {
	const createContactMutation = useCreateVendorContactMutation(vendorId);
	const updateContactMutation = useUpdateVendorContactMutation();
	const deleteContactMutation = useDeleteVendorContactMutation();

	const [contactDialog, setContactDialog] = useState<
		{ mode: "create" } | { mode: "edit"; contact: VendorContact } | null
	>(null);
	const [contactDraft, setContactDraft] = useState<ContactDraft | null>(null);
	const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
	const [contactSaving, setContactSaving] = useState(false);

	const sortedContacts = useMemo(
		() =>
			[...contacts].sort((a, b) => {
				if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
				return a.name.localeCompare(b.name);
			}),
		[contacts]
	);

	const primaryCount = contacts.filter((contact) => contact.isPrimary).length;

	function openCreateContact() {
		setContactDialog({ mode: "create" });
		setContactDraft(emptyContactDraft(primaryCount === 0));
	}

	function openEditContact(contact: VendorContact) {
		setContactDialog({ mode: "edit", contact });
		setContactDraft(contactToDraft(contact));
	}

	function closeContactDialog() {
		if (contactSaving) return;
		setContactDialog(null);
		setContactDraft(null);
	}

	async function saveContact() {
		if (!contactDraft) return;
		const name = contactDraft.name.trim();
		const email = contactDraft.email.trim();
		if (!name || !email) {
			toast.error("Name and email are required.");
			return;
		}
		setContactSaving(true);
		try {
			const body = {
				name,
				email,
				phone: contactDraft.phone.trim() || undefined,
				role: contactDraft.role.trim() || undefined,
				is_primary: contactDraft.is_primary,
			};
			if (contactDialog?.mode === "edit") {
				await updateContactMutation.mutateAsync({
					id: contactDialog.contact.id,
					body,
				});
				toast.success("Contact updated.");
			} else {
				await createContactMutation.mutateAsync(body);
				toast.success("Contact added.");
			}
			closeContactDialog();
		} catch {
			toast.error("Could not save contact.");
		} finally {
			setContactSaving(false);
		}
	}

	async function confirmDeleteContact() {
		if (!deleteContactId) return;
		try {
			await deleteContactMutation.mutateAsync(deleteContactId);
			toast.success("Contact removed.");
			setDeleteContactId(null);
		} catch {
			toast.error("Could not delete contact.");
		}
	}

	const deleteContactTarget =
		contacts.find((contact) => contact.id === deleteContactId) ?? null;

	return (
		<div className="min-w-0 space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-sm font-semibold tracking-tight text-foreground">
						Contacts
					</h2>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Vendor points of contact for operations, technical, and billing.
					</p>
				</div>
				<Button type="button" size="sm" onClick={openCreateContact}>
					<Plus className="mr-1.5 size-4" />
					Add contact
				</Button>
			</div>

			<div className="grid gap-3 sm:grid-cols-3">
				<div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						Total contacts
					</p>
					<p className="mt-1 text-2xl font-semibold tabular-nums">
						{contacts.length}
					</p>
				</div>
				<div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						Primary
					</p>
					<p className="mt-1 text-2xl font-semibold tabular-nums">
						{primaryCount}
					</p>
				</div>
				<div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						Additional
					</p>
					<p className="mt-1 text-2xl font-semibold tabular-nums">
						{Math.max(contacts.length - primaryCount, 0)}
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/40 hover:bg-muted/40">
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Role</TableHead>
							<TableHead className="w-[100px]">Primary</TableHead>
							<TableHead className="w-[100px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedContacts.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-sm text-muted-foreground"
								>
									No contacts yet. Add the first contact for this vendor.
								</TableCell>
							</TableRow>
						) : (
							sortedContacts.map((contact) => (
								<TableRow key={contact.id}>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
												{contact.name
													.split(/\s+/)
													.filter(Boolean)
													.slice(0, 2)
													.map((part) => part[0]?.toUpperCase() ?? "")
													.join("")}
											</div>
											{contact.name}
										</div>
									</TableCell>
									<TableCell>
										{contact.email ? (
											<a
												href={`mailto:${contact.email}`}
												className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
											>
												<Mail className="size-3.5 shrink-0" />
												{contact.email}
											</a>
										) : (
											"—"
										)}
									</TableCell>
									<TableCell>
										{contact.phone ? (
											<span className="inline-flex items-center gap-1.5 text-sm">
												<Phone className="size-3.5 shrink-0 text-muted-foreground" />
												{contact.phone}
											</span>
										) : (
											"—"
										)}
									</TableCell>
									<TableCell className="capitalize text-muted-foreground">
										{contact.role?.replace(/_/g, " ") || "—"}
									</TableCell>
									<TableCell>
										{contact.isPrimary ? (
											<span className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
												<Star className="size-3 fill-current" />
												Primary
											</span>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-0.5">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-8"
												onClick={() => openEditContact(contact)}
											>
												<Pencil className="size-3.5" />
												<span className="sr-only">Edit contact</span>
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-8 text-destructive hover:text-destructive"
												onClick={() => setDeleteContactId(contact.id)}
											>
												<Trash2 className="size-3.5" />
												<span className="sr-only">Delete contact</span>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog
				open={Boolean(contactDialog && contactDraft)}
				onOpenChange={(open) => {
					if (!open) closeContactDialog();
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{contactDialog?.mode === "edit" ? "Edit contact" : "Add contact"}
						</DialogTitle>
						<DialogDescription>
							{contactDialog?.mode === "edit"
								? "Update this vendor contact."
								: "Add a contact for this vendor."}
						</DialogDescription>
					</DialogHeader>
					{contactDraft ? (
						<div className="grid gap-3 py-1">
							<div className="space-y-1.5">
								<Label htmlFor="contact-name">Name</Label>
								<Input
									id="contact-name"
									value={contactDraft.name}
									onChange={(e) =>
										setContactDraft((prev) =>
											prev ? { ...prev, name: e.target.value } : prev
										)
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="contact-email">Email</Label>
								<Input
									id="contact-email"
									type="email"
									value={contactDraft.email}
									onChange={(e) =>
										setContactDraft((prev) =>
											prev ? { ...prev, email: e.target.value } : prev
										)
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="contact-phone">Phone</Label>
								<Input
									id="contact-phone"
									value={contactDraft.phone}
									onChange={(e) =>
										setContactDraft((prev) =>
											prev ? { ...prev, phone: e.target.value } : prev
										)
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="contact-role">Role</Label>
								<Input
									id="contact-role"
									placeholder="e.g. primary, technical, billing"
									value={contactDraft.role}
									onChange={(e) =>
										setContactDraft((prev) =>
											prev ? { ...prev, role: e.target.value } : prev
										)
									}
								/>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="contact-primary"
									checked={contactDraft.is_primary}
									onCheckedChange={(checked) =>
										setContactDraft((prev) =>
											prev ? { ...prev, is_primary: checked === true } : prev
										)
									}
								/>
								<Label htmlFor="contact-primary">Primary contact</Label>
							</div>
						</div>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={contactSaving}
							onClick={closeContactDialog}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={contactSaving}
							onClick={() => void saveContact()}
						>
							{contactSaving ? "Saving…" : "Save contact"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={Boolean(deleteContactId)}
				onOpenChange={(open) => {
					if (!open) setDeleteContactId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete contact?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes{" "}
							<span className="font-medium text-foreground">
								{deleteContactTarget?.name ?? "this contact"}
							</span>{" "}
							from the vendor.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => void confirmDeleteContact()}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

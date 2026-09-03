"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
	useDeleteProviderCredentialMutation,
	useDeleteProviderExceptionMutation,
	useDeleteProviderIdentifierMutation,
	useDeleteProviderLocationMutation,
	useDeleteProviderNetworkMutation,
} from "@/features/admin/features/providers/feature/queries/useProvidersQuery";
import { isProviderUuid } from "@/features/admin/features/providers/live-providers";
import type {
	CredentialItem,
	NetworkParticipation,
	ProviderException,
	ProviderIdentifier,
	ProviderLocation,
} from "@/features/admin/features/providers/mock-data";
import {
	type ProviderSectionId,
	providerSectionEditHref,
} from "@/features/admin/features/providers/pages/provider-section-editor";
import { Link } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

const addBtnClass = cn(
	"h-8 gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 text-xs font-semibold text-primary",
	"shadow-none transition-all duration-200",
	"hover:border-primary/40 hover:bg-primary hover:text-primary-foreground hover:shadow-sm",
	"active:scale-[0.97]"
);

const editBtnClass = cn(
	"inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 text-xs font-medium text-foreground",
	"shadow-none transition-all duration-200",
	"hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
	"active:scale-[0.97]"
);

const deleteBtnClass = cn(
	"inline-flex size-8 items-center justify-center rounded-full border border-transparent text-muted-foreground",
	"transition-all duration-200",
	"hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive",
	"active:scale-[0.97]"
);

export function ProviderSectionAddButton({
	providerId,
	section,
	label,
}: {
	providerId: string;
	section: ProviderSectionId;
	label: string;
}) {
	if (isMockEnabled()) return null;
	return (
		<Button asChild size="sm" variant="ghost" className={addBtnClass}>
			<Link href={providerSectionEditHref(providerId, section)}>
				<Plus className="size-3.5" strokeWidth={2.5} />
				{label}
			</Link>
		</Button>
	);
}

function RowEditDelete({
	providerId,
	section,
	itemId,
	kind,
	onDelete,
	deleting,
}: {
	providerId: string;
	section: ProviderSectionId;
	itemId: string;
	kind: string;
	onDelete: () => void;
	deleting?: boolean;
}) {
	const confirm = useConfirm();

	if (isMockEnabled() || !isProviderUuid(itemId)) return null;

	async function handleDelete() {
		const ok = await confirm({
			title: `Delete this ${kind}?`,
			description: "This cannot be undone.",
			confirmLabel: `Delete ${kind}`,
			cancelLabel: "Cancel",
			variant: "destructive",
			icon: "delete",
		});
		if (!ok) return;
		onDelete();
	}

	return (
		<div
			className="flex items-center justify-end gap-1"
			onClick={(e) => e.stopPropagation()}
		>
			<Link
				href={providerSectionEditHref(providerId, section, itemId)}
				className={editBtnClass}
				title={`Edit ${kind}`}
			>
				<Pencil className="size-3.5" />
				Edit
			</Link>
			<button
				type="button"
				className={deleteBtnClass}
				title={`Delete ${kind}`}
				disabled={deleting}
				onClick={() => void handleDelete()}
			>
				<Trash2 className="size-3.5" />
				<span className="sr-only">Delete</span>
			</button>
		</div>
	);
}

export function ProviderCreateIdentifierButton({
	providerId,
}: {
	providerId: string;
}) {
	return (
		<ProviderSectionAddButton
			providerId={providerId}
			section="identifiers"
			label="Add identifier"
		/>
	);
}

export function ProviderIdentifierRowActions({
	providerId,
	row,
}: {
	providerId: string;
	row: ProviderIdentifier;
}) {
	const remove = useDeleteProviderIdentifierMutation(providerId);
	if (row.synthetic) return null;
	return (
		<RowEditDelete
			providerId={providerId}
			section="identifiers"
			itemId={row.id}
			kind="identifier"
			deleting={remove.isPending}
			onDelete={() => {
				remove.mutate(row.id, {
					onSuccess: () => toast.success("Identifier deleted"),
					onError: (err) =>
						toast.error(err instanceof Error ? err.message : "Delete failed"),
				});
			}}
		/>
	);
}

export function ProviderCreateLocationButton({
	providerId,
}: {
	providerId: string;
}) {
	return (
		<ProviderSectionAddButton
			providerId={providerId}
			section="locations"
			label="Add location"
		/>
	);
}

export function ProviderLocationRowActions({
	providerId,
	row,
}: {
	providerId: string;
	row: ProviderLocation;
}) {
	const remove = useDeleteProviderLocationMutation(providerId);
	return (
		<RowEditDelete
			providerId={providerId}
			section="locations"
			itemId={row.id}
			kind="location"
			deleting={remove.isPending}
			onDelete={() => {
				remove.mutate(row.id, {
					onSuccess: () => toast.success("Location deleted"),
					onError: (err) =>
						toast.error(err instanceof Error ? err.message : "Delete failed"),
				});
			}}
		/>
	);
}

export function ProviderCreateNetworkButton({
	providerId,
}: {
	providerId: string;
}) {
	return (
		<ProviderSectionAddButton
			providerId={providerId}
			section="networks"
			label="Add network"
		/>
	);
}

export function ProviderNetworkRowActions({
	providerId,
	row,
}: {
	providerId: string;
	row: NetworkParticipation;
}) {
	const remove = useDeleteProviderNetworkMutation(providerId);
	return (
		<RowEditDelete
			providerId={providerId}
			section="networks"
			itemId={row.id}
			kind="network"
			deleting={remove.isPending}
			onDelete={() => {
				remove.mutate(row.id, {
					onSuccess: () => toast.success("Network deleted"),
					onError: (err) =>
						toast.error(err instanceof Error ? err.message : "Delete failed"),
				});
			}}
		/>
	);
}

export function ProviderCreateCredentialButton({
	providerId,
}: {
	providerId: string;
}) {
	return (
		<ProviderSectionAddButton
			providerId={providerId}
			section="credentials"
			label="Add credential"
		/>
	);
}

export function ProviderCredentialRowActions({
	providerId,
	row,
}: {
	providerId: string;
	row: CredentialItem;
}) {
	const remove = useDeleteProviderCredentialMutation(providerId);
	return (
		<RowEditDelete
			providerId={providerId}
			section="credentials"
			itemId={row.id}
			kind="credential"
			deleting={remove.isPending}
			onDelete={() => {
				remove.mutate(row.id, {
					onSuccess: () => toast.success("Credential deleted"),
					onError: (err) =>
						toast.error(err instanceof Error ? err.message : "Delete failed"),
				});
			}}
		/>
	);
}

export function ProviderCreateExceptionButton({
	providerId,
}: {
	providerId: string;
}) {
	return (
		<ProviderSectionAddButton
			providerId={providerId}
			section="exceptions"
			label="Add exception"
		/>
	);
}

export function ProviderExceptionRowActions({
	providerId,
	row,
}: {
	providerId: string;
	row: ProviderException;
}) {
	const remove = useDeleteProviderExceptionMutation(providerId);
	return (
		<RowEditDelete
			providerId={providerId}
			section="exceptions"
			itemId={row.id}
			kind="exception"
			deleting={remove.isPending}
			onDelete={() => {
				remove.mutate(row.id, {
					onSuccess: () => toast.success("Exception deleted"),
					onError: (err) =>
						toast.error(err instanceof Error ? err.message : "Delete failed"),
				});
			}}
		/>
	);
}

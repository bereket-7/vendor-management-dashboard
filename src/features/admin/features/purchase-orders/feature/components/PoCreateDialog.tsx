"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { PoCreateForm } from "./PoCreateForm";

export function PoCreateDialog({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated?: (id: string) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Create purchase order</DialogTitle>
					<DialogDescription>
						Create a single-line order and optionally send it immediately.
					</DialogDescription>
				</DialogHeader>
				{open ? (
					<PoCreateForm
						onCancel={() => onOpenChange(false)}
						onCreated={(id) => {
							onOpenChange(false);
							onCreated?.(id);
						}}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

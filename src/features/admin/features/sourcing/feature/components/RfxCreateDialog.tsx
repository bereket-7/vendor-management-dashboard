"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { RfxCreateForm } from "./RfxCreateForm";

export function RfxCreateDialog({
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
					<DialogTitle>Create sourcing event</DialogTitle>
					<DialogDescription>
						Prepare an RFI, RFP, or RFQ for vendors.
					</DialogDescription>
				</DialogHeader>
				{open ? (
					<RfxCreateForm
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

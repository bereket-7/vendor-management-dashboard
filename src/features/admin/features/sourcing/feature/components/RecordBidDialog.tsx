"use client";

import { type FormEvent, useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useVendorsList } from "@/features/shared/vms/queries";
import type { RfxModel } from "@/features/shared/vms/types";

import { useSubmitBidMutation } from "../queries/useSourcingQuery";

export function RecordBidDialog({
	open,
	onOpenChange,
	rfx,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	rfx: RfxModel | null;
}) {
	const { vendors } = useVendorsList();
	const submitBid = useSubmitBidMutation();
	const [vendorId, setVendorId] = useState("");
	const [amount, setAmount] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (open) {
			setVendorId("");
			setAmount("");
			setNotes("");
		}
	}, [open]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!rfx || !vendorId || !amount) {
			toast.error("Select a vendor and enter an amount.");
			return;
		}
		const vendor = vendors.find((item) => item.id === vendorId);
		try {
			await submitBid.mutateAsync({
				rfxId: rfx.id,
				rfxTitle: rfx.title,
				vendorId,
				vendorName: vendor?.legalName ?? "",
				amount: Number(amount),
				currency: rfx.currency || "USD",
				notes: notes || null,
			});
			toast.success("Bid recorded.");
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not record bid.");
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Record bid</DialogTitle>
					<DialogDescription>
						{rfx
							? `Add a vendor response for ${rfx.number}.`
							: "Add a vendor response."}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-4">
					<label className="space-y-2 text-sm font-medium">
						Vendor
						<Select value={vendorId} onValueChange={setVendorId}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select vendor" />
							</SelectTrigger>
							<SelectContent>
								{vendors.map((vendor) => (
									<SelectItem key={vendor.id} value={vendor.id}>
										{vendor.legalName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Amount ({rfx?.currency || "USD"})
						<Input
							required
							min="0"
							type="number"
							step="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</label>
					<label className="space-y-2 text-sm font-medium">
						Notes
						<Textarea
							rows={3}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</label>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button disabled={submitBid.isPending}>
							{submitBid.isPending ? "Saving…" : "Record bid"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

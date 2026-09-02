"use client";

import { type FormEvent, useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useVendorsList } from "@/features/shared/vms/queries";
import { useRouter } from "@/i18n/navigation";
import { VendorCoreApiError } from "@/lib/vendor-core/client";

import { CONTRACT_TYPE_OPTIONS } from "../feature/mappers/contractCoreMappers";
import { useCreateContractMutation } from "../feature/queries/useContractsQuery";

type CreateContractForm = {
	number: string;
	title: string;
	vendorId: string;
	contractType: string;
	value: string;
	currency: string;
	startDate: string;
	endDate: string;
	slaSummary: string;
};

function emptyForm(defaultVendorId = ""): CreateContractForm {
	return {
		number: "",
		title: "",
		vendorId: defaultVendorId,
		contractType: "msa",
		value: "",
		currency: "USD",
		startDate: "",
		endDate: "",
		slaSummary: "",
	};
}

type CreateContractDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultVendorId?: string;
	lockVendor?: boolean;
	onCreated?: (contractId: string) => void;
};

export function CreateContractDialog({
	open,
	onOpenChange,
	defaultVendorId = "",
	lockVendor = false,
	onCreated,
}: CreateContractDialogProps) {
	const router = useRouter();
	const { vendors, isLoading } = useVendorsList();
	const createContract = useCreateContractMutation();
	const [form, setForm] = useState(() => emptyForm(defaultVendorId));

	useEffect(() => {
		if (open) {
			setForm(emptyForm(defaultVendorId));
		}
	}, [open, defaultVendorId]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		const vendor = vendors.find((item) => item.id === form.vendorId);
		if (
			!vendor ||
			!form.number ||
			!form.title ||
			!form.startDate ||
			!form.endDate
		) {
			toast.error("Complete all required fields.");
			return;
		}
		try {
			const contract = await createContract.mutateAsync({
				number: form.number,
				title: form.title,
				vendorId: vendor.id,
				vendorName: vendor.legalName,
				status: "draft",
				value: Number(form.value),
				currency: form.currency,
				startDate: form.startDate,
				endDate: form.endDate,
				slaSummary: form.slaSummary || null,
				contractType: form.contractType,
				paymentModel: "Contracted Rate",
				paymentTerms: "Net 30",
				vendorType: "Provider",
				terms: [
					{
						id: "term-initial",
						label: "Initial Term",
						startDate: form.startDate,
						endDate: form.endDate,
						status: "upcoming",
					},
				],
				rateSchedule: [],
				slaMetrics: form.slaSummary
					? [
							{
								id: "sla-summary",
								name: "Agreed SLA",
								target: form.slaSummary,
								tone: "sky",
							},
						]
					: [],
				documents: [],
			});
			toast.success("Contract created.");
			onOpenChange(false);
			if (onCreated) {
				onCreated(contract.id);
			} else {
				router.push(`/admin/contracts/${contract.id}`);
			}
		} catch (error) {
			toast.error(
				error instanceof VendorCoreApiError
					? error.message
					: "Could not create contract."
			);
		}
	}

	const field = (key: keyof CreateContractForm) => ({
		value: form[key],
		onChange: (
			event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => setForm((current) => ({ ...current, [key]: event.target.value })),
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Create contract</DialogTitle>
					<DialogDescription>
						Create a draft agreement for review.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="grid gap-4 py-1">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="contract-number">Contract number</Label>
							<Input
								id="contract-number"
								required
								placeholder="CTR-2026-0012"
								{...field("number")}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="contract-title">Title</Label>
							<Input
								id="contract-title"
								required
								placeholder="Agreement title"
								{...field("title")}
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label>Vendor</Label>
						<Select
							value={form.vendorId}
							disabled={lockVendor && Boolean(defaultVendorId)}
							onValueChange={(vendorId) =>
								setForm((current) => ({ ...current, vendorId }))
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={isLoading ? "Loading vendors…" : "Select vendor"}
								/>
							</SelectTrigger>
							<SelectContent>
								{vendors.map((vendor) => (
									<SelectItem key={vendor.id} value={vendor.id}>
										{vendor.legalName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label>Contract type</Label>
						<Select
							value={form.contractType}
							onValueChange={(contractType) =>
								setForm((current) => ({ ...current, contractType }))
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CONTRACT_TYPE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-[1fr_120px] gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="contract-value">Value</Label>
							<Input
								id="contract-value"
								required
								min="0"
								step="0.01"
								type="number"
								{...field("value")}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Currency</Label>
							<Select
								value={form.currency}
								onValueChange={(currency) =>
									setForm((current) => ({ ...current, currency }))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{["USD", "EUR", "GBP", "ETB"].map((currency) => (
										<SelectItem key={currency} value={currency}>
											{currency}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="contract-start">Start date</Label>
							<Input
								id="contract-start"
								required
								type="date"
								{...field("startDate")}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="contract-end">End date</Label>
							<Input
								id="contract-end"
								required
								type="date"
								min={form.startDate}
								{...field("endDate")}
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="contract-sla">SLA summary</Label>
						<Textarea
							id="contract-sla"
							placeholder="Service levels, response times, and delivery targets"
							{...field("slaSummary")}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={createContract.isPending}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createContract.isPending}>
							{createContract.isPending ? "Creating…" : "Create draft"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

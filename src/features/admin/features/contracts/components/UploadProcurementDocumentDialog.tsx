"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Upload } from "lucide-react";
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
import { VendorCoreApiError } from "@/lib/vendor-core/client";

import { PROCUREMENT_DOCUMENT_TYPE_OPTIONS } from "../feature/api/documentsApi";
import { useCreateProcurementDocumentMutation } from "../feature/queries/useContractsQuery";

type UploadProcurementDocumentDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	vendorId: string;
	defaultDocumentType?: string;
};

export function UploadProcurementDocumentDialog({
	open,
	onOpenChange,
	vendorId,
	defaultDocumentType = "msa",
}: UploadProcurementDocumentDialogProps) {
	const uploadDocument = useCreateProcurementDocumentMutation();
	const [file, setFile] = useState<File | null>(null);
	const [title, setTitle] = useState("");
	const [documentType, setDocumentType] = useState(defaultDocumentType);

	useEffect(() => {
		if (open) {
			setFile(null);
			setTitle("");
			setDocumentType(defaultDocumentType);
		}
	}, [open, defaultDocumentType]);

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const nextFile = event.target.files?.[0] ?? null;
		setFile(nextFile);
		if (nextFile && !title.trim()) {
			setTitle(nextFile.name.replace(/\.[^.]+$/, ""));
		}
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!file) {
			toast.error("Choose a file to upload.");
			return;
		}
		try {
			await uploadDocument.mutateAsync({
				vendorId,
				file,
				title,
				documentType,
			});
			toast.success("Document registered.");
			onOpenChange(false);
		} catch (error) {
			toast.error(
				error instanceof VendorCoreApiError
					? error.message
					: "Could not register document."
			);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Upload document</DialogTitle>
					<DialogDescription>
						Register contract document metadata for this vendor. Files are stored
						in object storage using the generated storage key.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="grid gap-4 py-1">
					<div className="space-y-1.5">
						<Label htmlFor="document-file">File</Label>
						<Input
							id="document-file"
							required
							type="file"
							accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
							onChange={handleFileChange}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="document-title">Title</Label>
						<Input
							id="document-title"
							required
							placeholder="Executed MSA"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>Document type</Label>
						<Select value={documentType} onValueChange={setDocumentType}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PROCUREMENT_DOCUMENT_TYPE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={uploadDocument.isPending}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={uploadDocument.isPending || !file}>
							<Upload className="mr-2 size-4" />
							{uploadDocument.isPending ? "Uploading…" : "Upload"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

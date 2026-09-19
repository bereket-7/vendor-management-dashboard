"use client";

import { useMemo, useState } from "react";

import { Loader2, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import {
	useCreateVendorCertificateMutation,
	useUpdateVendorCertificateMutation,
	useVendorCertificatesQuery,
} from "../feature/queries/useVendorsQuery";

const CERT_TYPES = [
	{ value: "iso_9001", label: "ISO 9001 (Quality)" },
	{ value: "iso_27001", label: "ISO 27001 (InfoSec)" },
	{ value: "soc_2_type_ii", label: "SOC 2 Type II" },
	{ value: "hipaa_attestation", label: "HIPAA attestation" },
	{ value: "hitrust", label: "HITRUST CSF" },
	{ value: "pci_dss", label: "PCI-DSS" },
	{ value: "w9_on_file", label: "W-9 on file" },
	{ value: "business_license", label: "Business license" },
	{ value: "other", label: "Other" },
] as const;

const CERT_STATUSES = [
	{ value: "valid", label: "Valid" },
	{ value: "expiring_soon", label: "Expiring soon" },
	{ value: "expired", label: "Expired" },
	{ value: "revoked", label: "Revoked" },
	{ value: "pending_verification", label: "Pending verification" },
] as const;

type VendorCertificatesTabProps = {
	vendorId: string;
};

function labelForType(value: string) {
	return CERT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function labelForStatus(value: string) {
	return CERT_STATUSES.find((t) => t.value === value)?.label ?? value;
}

export function VendorCertificatesTab({ vendorId }: VendorCertificatesTabProps) {
	const certsQ = useVendorCertificatesQuery(vendorId, true);
	const createMutation = useCreateVendorCertificateMutation(vendorId);
	const updateMutation = useUpdateVendorCertificateMutation();
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState({
		certification_type: "iso_27001",
		certifying_body: "",
		certificate_number: "",
		scope_description: "",
		issued_at: "",
		expires_at: "",
		status: "pending_verification",
	});

	const rows = useMemo(() => certsQ.data ?? [], [certsQ.data]);

	async function handleCreate() {
		try {
			await createMutation.mutateAsync({
				certification_type: form.certification_type,
				certifying_body: form.certifying_body.trim() || undefined,
				certificate_number: form.certificate_number.trim() || undefined,
				scope_description: form.scope_description.trim() || undefined,
				issued_at: form.issued_at || undefined,
				expires_at: form.expires_at || undefined,
				status: form.status,
			});
			toast.success("Certificate added");
			setOpen(false);
			await certsQ.refetch();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not create certificate"
			);
		}
	}

	async function handleStatusChange(id: string, status: string) {
		try {
			await updateMutation.mutateAsync({ id, body: { status } });
			toast.success("Certificate updated");
			await certsQ.refetch();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not update certificate"
			);
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex items-start gap-2">
					<ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
					<div>
						<h2 className="text-sm font-semibold tracking-tight">
							Certificates
						</h2>
						<p className="text-xs text-muted-foreground">
							Compliance certifications on file for this vendor.
						</p>
					</div>
				</div>
				<Button type="button" size="sm" className="h-8" onClick={() => setOpen(true)}>
					<Plus className="mr-1.5 size-3.5" />
					Add certificate
				</Button>
			</div>

			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				{certsQ.isLoading ? (
					<p className="p-4 text-sm text-muted-foreground">Loading…</p>
				) : rows.length === 0 ? (
					<p className="p-6 text-sm text-muted-foreground">
						No certificates yet. Add ISO, SOC 2, HIPAA, or license records.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Body / number</TableHead>
								<TableHead>Issued</TableHead>
								<TableHead>Expires</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.id}>
									<TableCell className="font-medium">
										{labelForType(row.certification_type)}
									</TableCell>
									<TableCell>
										<div className="text-sm">
											{row.certifying_body || "—"}
										</div>
										<div className="font-mono text-[11px] text-muted-foreground">
											{row.certificate_number || "—"}
										</div>
									</TableCell>
									<TableCell>{row.issued_at || "—"}</TableCell>
									<TableCell>{row.expires_at || "—"}</TableCell>
									<TableCell>
										<Select
											value={row.status}
											onValueChange={(status) =>
												void handleStatusChange(row.id, status)
											}
										>
											<SelectTrigger className="h-8 w-[180px]">
												<SelectValue>
													{labelForStatus(row.status)}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{CERT_STATUSES.map((s) => (
													<SelectItem key={s.value} value={s.value}>
														{s.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Add certificate</DialogTitle>
					</DialogHeader>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="sm:col-span-2 space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Type
							</p>
							<Select
								value={form.certification_type}
								onValueChange={(certification_type) =>
									setForm((f) => ({ ...f, certification_type }))
								}
							>
								<SelectTrigger className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CERT_TYPES.map((t) => (
										<SelectItem key={t.value} value={t.value}>
											{t.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Certifying body
							</p>
							<Input
								value={form.certifying_body}
								onChange={(e) =>
									setForm((f) => ({ ...f, certifying_body: e.target.value }))
								}
								className="h-9"
							/>
						</div>
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Certificate number
							</p>
							<Input
								value={form.certificate_number}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										certificate_number: e.target.value,
									}))
								}
								className="h-9 font-mono text-xs"
							/>
						</div>
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Issued
							</p>
							<Input
								type="date"
								value={form.issued_at}
								onChange={(e) =>
									setForm((f) => ({ ...f, issued_at: e.target.value }))
								}
								className="h-9"
							/>
						</div>
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Expires
							</p>
							<Input
								type="date"
								value={form.expires_at}
								onChange={(e) =>
									setForm((f) => ({ ...f, expires_at: e.target.value }))
								}
								className="h-9"
							/>
						</div>
						<div className="sm:col-span-2 space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Scope
							</p>
							<Input
								value={form.scope_description}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										scope_description: e.target.value,
									}))
								}
								className="h-9"
							/>
						</div>
						<div className="sm:col-span-2 space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Status
							</p>
							<Select
								value={form.status}
								onValueChange={(status) =>
									setForm((f) => ({ ...f, status }))
								}
							>
								<SelectTrigger className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CERT_STATUSES.map((s) => (
										<SelectItem key={s.value} value={s.value}>
											{s.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={createMutation.isPending}
							onClick={() => void handleCreate()}
						>
							{createMutation.isPending ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : null}
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

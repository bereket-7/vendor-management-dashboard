"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	CheckCircle2,
	ExternalLink,
	FileText,
	GitMerge,
	MoreHorizontal,
	Plus,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import type { InvoiceModel } from "@/features/shared/vms/types";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isVendorCoreLive } from "@/lib/vendor-core/client";

import { InvoiceCreateDialog } from "../feature/components/InvoiceCreateDialog";
import {
	useInvoicesList,
	useSeedInvoicesMutation,
	useUpdateInvoiceMutation,
} from "../feature/queries/useInvoicesQuery";

export function InvoicesPage() {
	const router = useRouter();
	const { invoices, isLoading, error } = useInvoicesList();
	const seed = useSeedInvoicesMutation();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [createOpen, setCreateOpen] = useState(false);
	const exceptions = invoices.filter((invoice) =>
		["exception", "submitted"].includes(invoice.status)
	).length;

	const allSelected =
		invoices.length > 0 && invoices.every((row) => selectedIds.has(row.id));

	const kpis = useMemo(() => {
		const matched = invoices.filter((i) => i.status === "matched").length;
		const approved = invoices.filter((i) => i.status === "approved").length;
		const open = invoices.filter((i) =>
			["draft", "submitted", "exception"].includes(i.status)
		).length;
		const total = invoices.reduce((sum, i) => sum + (i.amount ?? 0), 0);
		return [
			{
				label: "Invoices",
				value: String(invoices.length),
				hint: "Live vendor invoices",
				icon: FileText,
				tone: "text-primary bg-primary/10",
			},
			{
				label: "Needs review",
				value: String(open),
				hint: `${exceptions} in match queue`,
				icon: AlertTriangle,
				tone: "text-amber-700 bg-amber-500/10",
			},
			{
				label: "Matched",
				value: String(matched),
				hint: `${approved} approved`,
				icon: GitMerge,
				tone: "text-sky-700 bg-sky-500/10",
			},
			{
				label: "Amount",
				value: formatMoney(total, invoices[0]?.currency || "USD"),
				hint: "Listed invoices",
				icon: CheckCircle2,
				tone: "text-emerald-700 bg-emerald-500/10",
			},
		];
	}, [exceptions, invoices]);

	function toggleAll() {
		if (allSelected) setSelectedIds(new Set());
		else setSelectedIds(new Set(invoices.map((row) => row.id)));
	}

	function toggleOne(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	return (
		<div className="container space-y-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
					<p className="text-sm text-muted-foreground">
						Review invoices, matching results, and payment status.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{isVendorCoreLive() ? (
						<Button
							variant="outline"
							size="sm"
							className="h-9"
							disabled={seed.isPending}
							onClick={() =>
								seed.mutate(undefined, {
									onSuccess: (res) => {
										toast.success(
											res.created > 0
												? `Seeded ${res.created} invoice(s)`
												: "All vendors/POs already have invoices."
										);
									},
									onError: (err) =>
										toast.error(
											err instanceof Error ? err.message : "Seed failed"
										),
								})
							}
						>
							{seed.isPending ? "Seeding…" : "Seed"}
						</Button>
					) : null}
					<Button variant={exceptions ? "default" : "outline"} asChild>
						<Link href="/admin/invoices/match">Match queue ({exceptions})</Link>
					</Button>
					<Button onClick={() => setCreateOpen(true)}>
						<Plus className="mr-2 size-4" /> Add invoice
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					return (
						<Card key={kpi.label} className="shadow-sm">
							<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{kpi.label}
								</CardTitle>
								<span
									className={cn(
										"inline-flex size-8 items-center justify-center rounded-lg",
										kpi.tone
									)}
								>
									<Icon className="size-4" />
								</span>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-semibold tabular-nums">
									{kpi.value}
								</p>
								<CardDescription className="mt-1">{kpi.hint}</CardDescription>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<BulkActionsToolbar
				selectedCount={selectedIds.size}
				entityLabel="invoice"
				onClear={() => setSelectedIds(new Set())}
				onApprove={() => {
					toast.info("Use row actions to match, approve, or dispute.");
				}}
				onReject={() => {
					toast.info("Use row actions to dispute an invoice.");
				}}
				onExport={() => {
					toast.info("Bulk export is not available yet.");
				}}
			/>
			{isLoading ? (
				<Skeleton className="h-72 w-full" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load invoices.</p>
			) : (
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">
									<Checkbox
										checked={allSelected}
										onCheckedChange={toggleAll}
										aria-label="Select all invoices"
									/>
								</TableHead>
								<TableHead>Invoice</TableHead>
								<TableHead>Vendor</TableHead>
								<TableHead>PO</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Match</TableHead>
								<TableHead>Due</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead className="w-12 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invoices.map((invoice) => (
								<TableRow key={invoice.id}>
									<TableCell>
										<Checkbox
											checked={selectedIds.has(invoice.id)}
											onCheckedChange={() => toggleOne(invoice.id)}
											aria-label={`Select ${invoice.number}`}
										/>
									</TableCell>
									<TableCell>
										<Link
											href={`/admin/invoices/${invoice.id}`}
											className="font-medium hover:underline"
										>
											{invoice.number}
										</Link>
									</TableCell>
									<TableCell>{invoice.vendorName}</TableCell>
									<TableCell>{invoice.poNumber || "—"}</TableCell>
									<TableCell>
										<StatusBadge status={invoice.status} />
									</TableCell>
									<TableCell>
										{invoice.matchScore == null
											? "—"
											: `${invoice.matchScore}%`}
									</TableCell>
									<TableCell>{formatDate(invoice.dueDate)}</TableCell>
									<TableCell>
										{formatMoney(invoice.amount, invoice.currency)}
									</TableCell>
									<TableCell className="text-right">
										<InvoiceRowActions invoice={invoice} />
									</TableCell>
								</TableRow>
							))}
							{invoices.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={9}
										className="h-24 text-center text-muted-foreground"
									>
										No invoices. Use Seed or Add invoice.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}
			<InvoiceCreateDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={(id) => router.push(`/admin/invoices/${id}`)}
			/>
		</div>
	);
}

function InvoiceRowActions({ invoice }: { invoice: InvoiceModel }) {
	const router = useRouter();
	const updateInvoice = useUpdateInvoiceMutation();

	async function setStatus(status: "matched" | "approved" | "disputed") {
		try {
			await updateInvoice.mutateAsync({ id: invoice.id, patch: { status } });
			toast.success(
				status === "matched"
					? "Invoice matched."
					: status === "approved"
						? "Invoice approved."
						: "Invoice disputed."
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		}
	}

	const canMatch = ["draft", "submitted", "exception"].includes(invoice.status);
	const canApprove = invoice.status === "matched";
	const canDispute = ["draft", "submitted", "matched", "exception"].includes(
		invoice.status
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="size-8">
					<MoreHorizontal className="size-4" />
					<span className="sr-only">Actions</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
				>
					<ExternalLink className="mr-2 size-3.5" />
					View detail
				</DropdownMenuItem>
				{canMatch ? (
					<DropdownMenuItem
						disabled={updateInvoice.isPending}
						onClick={() => void setStatus("matched")}
					>
						<GitMerge className="mr-2 size-3.5" />
						Match
					</DropdownMenuItem>
				) : null}
				{canApprove ? (
					<DropdownMenuItem
						disabled={updateInvoice.isPending}
						onClick={() => void setStatus("approved")}
					>
						<CheckCircle2 className="mr-2 size-3.5" />
						Approve
					</DropdownMenuItem>
				) : null}
				{canDispute ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							disabled={updateInvoice.isPending}
							onClick={() => void setStatus("disputed")}
						>
							<XCircle className="mr-2 size-3.5" />
							Dispute
						</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

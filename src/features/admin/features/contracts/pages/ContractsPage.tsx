"use client";

import { useMemo, useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { useContractsList } from "@/features/shared/vms/queries";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";

export function ContractsPage() {
	const { contracts, isLoading, error } = useContractsList();
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const filtered = useMemo(() => {
		const query = search.toLowerCase().trim();
		return contracts.filter(
			(contract) =>
				(status === "all" || contract.status === status) &&
				(!query ||
					contract.number.toLowerCase().includes(query) ||
					contract.title.toLowerCase().includes(query) ||
					contract.vendorName.toLowerCase().includes(query))
		);
	}, [contracts, search, status]);

	const allSelected =
		filtered.length > 0 && filtered.every((row) => selectedIds.has(row.id));

	function toggleAll() {
		if (allSelected) setSelectedIds(new Set());
		else setSelectedIds(new Set(filtered.map((row) => row.id)));
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
					<h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
					<p className="text-sm text-muted-foreground">
						Manage agreements, renewals, and approval status.
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/contracts/create">
						<Plus className="mr-2 size-4" /> Create contract
					</Link>
				</Button>
			</div>
			<div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card shadow-sm p-4">
				<Input
					className="max-w-sm"
					placeholder="Search number, title, or vendor"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
				<Select value={status} onValueChange={setStatus}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{[
							"draft",
							"pending_approval",
							"active",
							"expired",
							"terminated",
						].map((value) => (
							<SelectItem key={value} value={value}>
								{value.replaceAll("_", " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<BulkActionsToolbar
				selectedCount={selectedIds.size}
				entityLabel="contract"
				onClear={() => setSelectedIds(new Set())}
				onApprove={() => {
					toast.success(`Approved ${selectedIds.size} contract(s).`);
					setSelectedIds(new Set());
				}}
				onArchive={() => {
					toast.success(`Archived ${selectedIds.size} contract(s).`);
					setSelectedIds(new Set());
				}}
				onExport={() => {
					toast.success(`Exported ${selectedIds.size} contract(s).`);
					setSelectedIds(new Set());
				}}
			/>
			{isLoading ? (
				<Skeleton className="h-72 w-full" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load contracts.</p>
			) : (
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">
									<Checkbox
										checked={allSelected}
										onCheckedChange={toggleAll}
										aria-label="Select all contracts"
									/>
								</TableHead>
								<TableHead>Contract</TableHead>
								<TableHead>Vendor</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Value</TableHead>
								<TableHead>Term</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.map((contract) => (
								<TableRow key={contract.id}>
									<TableCell>
										<Checkbox
											checked={selectedIds.has(contract.id)}
											onCheckedChange={() => toggleOne(contract.id)}
											aria-label={`Select ${contract.number}`}
										/>
									</TableCell>
									<TableCell>
										<Link
											href={`/admin/contracts/${contract.id}`}
											className="font-medium hover:underline"
										>
											{contract.number}
										</Link>
										<div className="text-xs text-muted-foreground">
											{contract.title}
										</div>
									</TableCell>
									<TableCell>{contract.vendorName}</TableCell>
									<TableCell>
										<StatusBadge status={contract.status} />
									</TableCell>
									<TableCell>
										{formatMoney(contract.value, contract.currency)}
									</TableCell>
									<TableCell>
										{formatDate(contract.startDate)} –{" "}
										{formatDate(contract.endDate)}
									</TableCell>
								</TableRow>
							))}
							{filtered.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={6}
										className="h-24 text-center text-muted-foreground"
									>
										No contracts found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}

"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
	AlertTriangle,
	Banknote,
	CheckCircle2,
	Clock3,
	Plus,
	Search,
} from "lucide-react";
import { toast } from "sonner";

import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard, TableShell } from "@/components/admin/SectionCard";
import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
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
import type { ContractStatus } from "@/features/shared/vms/types";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link, useRouter } from "@/i18n/navigation";

import { CreateContractDialog } from "../components/CreateContractDialog";
import {
	useContractsList,
	useProcurementDocumentsList,
} from "../feature/queries/useContractsQuery";

const STATUS_OPTIONS: ContractStatus[] = [
	"draft",
	"pending_approval",
	"active",
	"expired",
	"terminated",
];

export function ContractsPage({
	vendorId,
	embedded,
	initialCreateOpen = false,
}: {
	vendorId?: string;
	embedded?: boolean;
	initialCreateOpen?: boolean;
} = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { contracts, isLoading, error } = useContractsList(vendorId);
	const { documents: procurementDocuments } =
		useProcurementDocumentsList(vendorId);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [createOpen, setCreateOpen] = useState(initialCreateOpen);

	function handleCreateOpenChange(open: boolean) {
		setCreateOpen(open);
		if (!open && searchParams.get("create") === "1") {
			router.replace("/admin/contracts");
		}
	}

	const filtered = useMemo(() => {
		const query = search.toLowerCase().trim();
		return contracts.filter(
			(contract) =>
				(status === "all" || contract.status === status) &&
				(!query ||
					contract.number.toLowerCase().includes(query) ||
					contract.title.toLowerCase().includes(query) ||
					contract.vendorName.toLowerCase().includes(query) ||
					(contract.contractType ?? "").toLowerCase().includes(query))
		);
	}, [contracts, search, status]);

	const docsByVendorId = useMemo(() => {
		const counts = new Map<string, number>();
		for (const document of procurementDocuments) {
			if (!document.vendorId) continue;
			counts.set(document.vendorId, (counts.get(document.vendorId) ?? 0) + 1);
		}
		return counts;
	}, [procurementDocuments]);

	function documentCountForContract(contractVendorId: string) {
		if (vendorId) return procurementDocuments.length;
		return docsByVendorId.get(contractVendorId) ?? 0;
	}

	const summary = useMemo(() => {
		const active = filtered.filter((c) => c.status === "active");
		const pending = filtered.filter((c) => c.status === "pending_approval");
		const expiringSoon = filtered.filter((c) => {
			if (c.status !== "active") return false;
			const end = new Date(c.endDate).getTime();
			const in90 = Date.now() + 90 * 24 * 60 * 60 * 1000;
			return end <= in90;
		});
		const totalValue = active.reduce((sum, c) => sum + c.value, 0);
		const docsCount = filtered.reduce(
			(sum, contract) => sum + documentCountForContract(contract.vendorId),
			0
		);
		const slaCoverage = filtered.filter(
			(c) => (c.slaMetrics?.length ?? 0) > 0 || Boolean(c.slaSummary)
		).length;
		return {
			total: filtered.length,
			active: active.length,
			pending: pending.length,
			expiringSoon: expiringSoon.length,
			totalValue,
			docsCount,
			slaCoverage,
		};
	}, [filtered, docsByVendorId, procurementDocuments.length, vendorId]);

	const renewalsDue = useMemo(
		() =>
			filtered
				.filter((c) => {
					if (c.status !== "active") return false;
					const end = new Date(c.endDate).getTime();
					return end <= Date.now() + 120 * 24 * 60 * 60 * 1000;
				})
				.sort(
					(a, b) =>
						new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
				)
				.slice(0, 5),
		[filtered]
	);

	const openApprovals = useMemo(
		() => filtered.filter((c) => c.status === "pending_approval").slice(0, 5),
		[filtered]
	);

	const recentActivity = useMemo(
		() =>
			[...filtered]
				.sort(
					(a, b) =>
						new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
				)
				.slice(0, 6),
		[filtered]
	);

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
		<div className="space-y-3">
			{embedded ? null : (
				<PageHeader
					eyebrow="Contracts"
					title="Contracts Overview"
					description="Portfolio-level agreement health, renewals, approvals, and activity."
					actions={
						<Button type="button" onClick={() => setCreateOpen(true)}>
							<Plus className="mr-2 size-4" />
							Create contract
						</Button>
					}
				/>
			)}
			{embedded ? (
				<div className="flex justify-end">
					<Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
						<Plus className="mr-2 size-4" />
						Create contract
					</Button>
				</div>
			) : null}

			<CreateContractDialog
				open={createOpen}
				onOpenChange={handleCreateOpenChange}
				defaultVendorId={vendorId}
				lockVendor={Boolean(vendorId)}
			/>

			<SummaryCardsGrid columns={4}>
				<SummaryCard
					label="Active"
					value={summary.active}
					icon={CheckCircle2}
					tone="text-emerald-700 bg-emerald-500/10"
					hint="In force agreements"
				/>
				<SummaryCard
					label="Pending approval"
					value={summary.pending}
					icon={Clock3}
					tone="text-amber-700 bg-amber-500/10"
					hint="Awaiting review"
				/>
				<SummaryCard
					label="Expiring ≤ 90 days"
					value={summary.expiringSoon}
					icon={AlertTriangle}
					tone="text-orange-700 bg-orange-500/10"
					hint="Active terms ending soon"
				/>
				<SummaryCard
					label="Active value"
					value={formatMoney(summary.totalValue, "USD")}
					icon={Banknote}
					tone="text-sky-700 bg-sky-500/10"
					hint="Sum of active agreements"
				/>
			</SummaryCardsGrid>

			<div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
				<div className="relative min-w-[180px] max-w-sm flex-1">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						className="h-8 pl-8 text-sm"
						placeholder="Search number, title, vendor, or type"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				<Select value={status} onValueChange={setStatus}>
					<SelectTrigger className="h-8 w-44 text-sm">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{STATUS_OPTIONS.map((value) => (
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
					toast.info("Bulk approve is not available yet.");
				}}
				onArchive={() => {
					toast.info("Bulk archive is not available yet.");
				}}
				onExport={() => {
					toast.info("Bulk export is not available yet.", {
						description: "Open a contract to work with it individually.",
					});
				}}
			/>

			{isLoading ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load contracts.</p>
			) : (
				<TableShell>
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
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Value</TableHead>
								<TableHead>Term</TableHead>
								<TableHead>Docs</TableHead>
								<TableHead className="pr-4 text-right">Action</TableHead>
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
											className="font-medium text-foreground hover:underline"
										>
											{contract.number}
										</Link>
										<div className="text-xs text-muted-foreground">
											{contract.title}
										</div>
									</TableCell>
									<TableCell>
										<div className="text-sm">{contract.vendorName}</div>
										{contract.vendorType ? (
											<div className="text-xs text-muted-foreground">
												{contract.vendorType}
											</div>
										) : null}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{contract.contractType ?? "—"}
									</TableCell>
									<TableCell>
										<StatusBadge status={contract.status} />
									</TableCell>
									<TableCell className="tabular-nums">
										{formatMoney(contract.value, contract.currency)}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{formatDate(contract.startDate)} –{" "}
										{formatDate(contract.endDate)}
									</TableCell>
									<TableCell className="tabular-nums text-muted-foreground">
										{documentCountForContract(contract.vendorId)}
									</TableCell>
									<TableCell className="pr-4 text-right">
										<Button asChild variant="outline" size="sm" className="h-8">
											<Link href={`/admin/contracts/${contract.id}`}>
												View detail
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
							{filtered.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={9}
										className="h-24 text-center text-muted-foreground"
									>
										No contracts found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableShell>
			)}

			<div className="grid gap-3 lg:grid-cols-3">
				<SectionCard
					title="Renewals due"
					description="Active contracts ending within 120 days."
					action={
						<Link
							href="/admin/contracts/effective-dates"
							className="text-xs font-semibold text-primary hover:underline"
						>
							View dates
						</Link>
					}
				>
					{renewalsDue.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No renewals in the next 120 days.
						</p>
					) : (
						<ul className="space-y-1.5">
							{renewalsDue.map((c) => (
								<li
									key={c.id}
									className="flex items-start justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5"
								>
									<div className="min-w-0">
										<Link
											href={`/admin/contracts/${c.id}?tab=effective-dates`}
											className="text-sm font-medium hover:underline"
										>
											{c.number}
										</Link>
										<p className="truncate text-xs text-muted-foreground">
											{c.vendorName}
										</p>
									</div>
									<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
										{formatDate(c.endDate)}
									</span>
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard
					title="Open approvals"
					description="Contracts waiting for activation."
				>
					{openApprovals.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No contracts pending approval.
						</p>
					) : (
						<ul className="space-y-1.5">
							{openApprovals.map((c) => (
								<li
									key={c.id}
									className="flex items-start justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5"
								>
									<div className="min-w-0">
										<Link
											href={`/admin/contracts/${c.id}`}
											className="text-sm font-medium hover:underline"
										>
											{c.number}
										</Link>
										<p className="truncate text-xs text-muted-foreground">
											{c.title}
										</p>
									</div>
									<StatusBadge status={c.status} />
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard
					title="Recent activity"
					description="Latest contract updates."
					action={
						<Link
							href="/admin/contracts/rate-fee-schedule"
							className="text-xs font-semibold text-primary hover:underline"
						>
							Fee schedules
						</Link>
					}
				>
					<ul className="space-y-1.5">
						{recentActivity.map((c) => (
							<li
								key={c.id}
								className="flex items-start justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5"
							>
								<div className="min-w-0">
									<Link
										href={`/admin/contracts/${c.id}`}
										className="text-sm font-medium hover:underline"
									>
										{c.number}
									</Link>
									<p className="truncate text-xs text-muted-foreground">
										{c.vendorName} · {c.contractType ?? "Agreement"}
									</p>
								</div>
								<span className="shrink-0 text-[11px] text-muted-foreground">
									{formatDate(c.updatedAt)}
								</span>
							</li>
						))}
						{recentActivity.length === 0 && (
							<p className="text-sm text-muted-foreground">
								No recent activity.
							</p>
						)}
					</ul>
				</SectionCard>
			</div>
		</div>
	);
}

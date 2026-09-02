"use client";

import { useMemo, useState } from "react";

import { CalendarDays, DollarSign, FileText, Plus, Timer } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { SectionCard, TableShell } from "@/components/admin/SectionCard";
import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
import { Button } from "@/components/ui/button";
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
import type { ContractTermStatus } from "@/features/shared/vms/types";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { UploadProcurementDocumentDialog } from "../components/UploadProcurementDocumentDialog";
import {
	useContractsList,
	useProcurementDocumentsList,
} from "../feature/queries/useContractsQuery";

const TERM_STATUS_CLASS: Record<ContractTermStatus, string> = {
	completed:
		"bg-emerald-500/15 text-emerald-800 ring-1 ring-inset ring-emerald-500/25",
	current: "bg-sky-500/15 text-sky-800 ring-1 ring-inset ring-sky-500/25",
	upcoming: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

export type ContractsEmbeddedProps = {
	vendorId?: string;
	embedded?: boolean;
};

function contractsShellClass(embedded?: boolean) {
	return embedded ? "space-y-3" : "container space-y-4 py-6";
}

export function ContractsEffectiveDatesPage({
	vendorId,
	embedded,
}: ContractsEmbeddedProps = {}) {
	const { contracts, isLoading, error } = useContractsList(vendorId);

	const rows = useMemo(
		() =>
			contracts.flatMap((c) =>
				(c.terms?.length
					? c.terms
					: [
							{
								id: `${c.id}-default`,
								label: "Primary Term",
								startDate: c.startDate,
								endDate: c.endDate,
								status: "current" as const,
							},
						]
				).map((term) => ({
					...term,
					contractId: c.id,
					contractNumber: c.number,
					vendorName: c.vendorName,
					contractStatus: c.status,
				}))
			),
		[contracts]
	);

	const summary = useMemo(() => {
		const current = rows.filter((r) => r.status === "current").length;
		const upcoming = rows.filter((r) => r.status === "upcoming").length;
		const completed = rows.filter((r) => r.status === "completed").length;
		return { total: rows.length, current, upcoming, completed };
	}, [rows]);

	return (
		<div className={contractsShellClass(embedded)}>
			{embedded ? null : (
				<PageHeader
					title="Effective Dates"
					description="Term periods and renewal windows across all contracts."
				/>
			)}
			<SummaryCardsGrid columns={3}>
				<SummaryCard
					label="Current"
					value={summary.current}
					icon={CalendarDays}
					tone="text-sky-700 bg-sky-500/10"
				/>
				<SummaryCard
					label="Upcoming"
					value={summary.upcoming}
					icon={CalendarDays}
					tone="text-amber-700 bg-amber-500/10"
				/>
				<SummaryCard
					label="Completed"
					value={summary.completed}
					icon={CalendarDays}
					tone="text-emerald-700 bg-emerald-500/10"
				/>
			</SummaryCardsGrid>

			{isLoading ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load contracts.</p>
			) : (
				<SectionCard title="Term schedule">
					<TableShell className="border-0 shadow-none">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Contract</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Period</TableHead>
									<TableHead>Start</TableHead>
									<TableHead>End</TableHead>
									<TableHead>Term status</TableHead>
									<TableHead>Contract status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={`${row.contractId}-${row.id}`}>
										<TableCell>
											<Link
												href={`/admin/contracts/${row.contractId}?tab=effective-dates`}
												className="font-medium hover:underline"
											>
												{row.contractNumber}
											</Link>
										</TableCell>
										<TableCell>{row.vendorName}</TableCell>
										<TableCell>{row.label}</TableCell>
										<TableCell>{formatDate(row.startDate)}</TableCell>
										<TableCell>{formatDate(row.endDate)}</TableCell>
										<TableCell>
											<span
												className={cn(
													"inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
													TERM_STATUS_CLASS[row.status]
												)}
											>
												{row.status}
											</span>
										</TableCell>
										<TableCell>
											<StatusBadge status={row.contractStatus} />
										</TableCell>
									</TableRow>
								))}
								{rows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-24 text-center text-muted-foreground"
										>
											No term periods found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableShell>
				</SectionCard>
			)}
		</div>
	);
}

export function ContractsRateFeeSchedulePage({
	vendorId,
	embedded,
}: ContractsEmbeddedProps = {}) {
	const { contracts, isLoading, error } = useContractsList(vendorId);

	const rows = useMemo(
		() =>
			contracts.flatMap((c) =>
				(c.rateSchedule ?? []).map((line) => ({
					...line,
					contractId: c.id,
					contractNumber: c.number,
					vendorName: c.vendorName,
					currency: c.currency,
				}))
			),
		[contracts]
	);

	const summary = useMemo(() => {
		const avg =
			rows.length === 0
				? 0
				: rows.reduce((sum, r) => sum + r.contractedRate, 0) / rows.length;
		const contractsWithRates = new Set(rows.map((r) => r.contractId)).size;
		return {
			lines: rows.length,
			contractsWithRates,
			avg,
		};
	}, [rows]);

	return (
		<div className={contractsShellClass(embedded)}>
			{embedded ? null : (
				<PageHeader
					title="Rate / Fee Schedule"
					description="Contracted service rates across the vendor portfolio."
				/>
			)}
			<SummaryCardsGrid columns={3}>
				<SummaryCard
					label="Rate lines"
					value={summary.lines}
					icon={DollarSign}
					tone="text-emerald-700 bg-emerald-500/10"
				/>
				<SummaryCard
					label="Contracts with rates"
					value={summary.contractsWithRates}
					icon={FileText}
					tone="text-primary bg-primary/10"
				/>
				<SummaryCard
					label="Avg contracted rate"
					value={formatMoney(summary.avg, "USD")}
					icon={DollarSign}
					tone="text-sky-700 bg-sky-500/10"
					hint="Across all rate lines"
				/>
			</SummaryCardsGrid>

			{isLoading ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load contracts.</p>
			) : (
				<SectionCard title="Fee schedule inventory">
					<TableShell className="border-0 shadow-none">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Contract</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Service / Code</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>Rate</TableHead>
									<TableHead>Unit</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={`${row.contractId}-${row.id}`}>
										<TableCell>
											<Link
												href={`/admin/contracts/${row.contractId}?tab=rate-fee-schedule`}
												className="font-medium hover:underline"
											>
												{row.contractNumber}
											</Link>
										</TableCell>
										<TableCell>{row.vendorName}</TableCell>
										<TableCell className="font-mono text-xs">
											{row.serviceCode}
										</TableCell>
										<TableCell>{row.description}</TableCell>
										<TableCell className="tabular-nums">
											{formatMoney(row.contractedRate, row.currency)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{row.unit}
										</TableCell>
									</TableRow>
								))}
								{rows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-24 text-center text-muted-foreground"
										>
											No rate lines found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableShell>
				</SectionCard>
			)}
		</div>
	);
}

export function ContractsSlaTermsPage({
	vendorId,
	embedded,
}: ContractsEmbeddedProps = {}) {
	const { contracts, isLoading, error } = useContractsList(vendorId);

	const rows = useMemo(
		() =>
			contracts.flatMap((c) =>
				(c.slaMetrics ?? []).map((metric) => ({
					...metric,
					contractId: c.id,
					contractNumber: c.number,
					vendorName: c.vendorName,
					slaSummary: c.slaSummary,
				}))
			),
		[contracts]
	);

	const summary = useMemo(
		() => ({
			metrics: rows.length,
			contractsWithSla: new Set(rows.map((r) => r.contractId)).size,
		}),
		[rows]
	);

	return (
		<div className={contractsShellClass(embedded)}>
			{embedded ? null : (
				<PageHeader
					title="SLA Terms"
					description="Service-level commitments across active and pending contracts."
				/>
			)}
			<SummaryCardsGrid columns={2}>
				<SummaryCard
					label="SLA metrics"
					value={summary.metrics}
					icon={Timer}
					tone="text-violet-700 bg-violet-500/10"
				/>
				<SummaryCard
					label="Contracts with SLA"
					value={summary.contractsWithSla}
					icon={FileText}
					tone="text-primary bg-primary/10"
				/>
			</SummaryCardsGrid>

			{isLoading ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load contracts.</p>
			) : (
				<SectionCard title="SLA inventory">
					<TableShell className="border-0 shadow-none">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Contract</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Metric</TableHead>
									<TableHead>Target</TableHead>
									<TableHead>Summary</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={`${row.contractId}-${row.id}`}>
										<TableCell>
											<Link
												href={`/admin/contracts/${row.contractId}?tab=sla-terms`}
												className="font-medium hover:underline"
											>
												{row.contractNumber}
											</Link>
										</TableCell>
										<TableCell>{row.vendorName}</TableCell>
										<TableCell className="font-medium">{row.name}</TableCell>
										<TableCell className="tabular-nums">{row.target}</TableCell>
										<TableCell className="max-w-xs truncate text-muted-foreground">
											{row.slaSummary ?? "—"}
										</TableCell>
									</TableRow>
								))}
								{rows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-24 text-center text-muted-foreground"
										>
											No SLA metrics found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableShell>
				</SectionCard>
			)}
		</div>
	);
}

export function ContractsDocumentsPage({
	vendorId,
	embedded,
}: ContractsEmbeddedProps = {}) {
	const [uploadOpen, setUploadOpen] = useState(false);
	const {
		contracts,
		isLoading: contractsLoading,
		error: contractsError,
	} = useContractsList(vendorId);
	const {
		documents,
		isLoading: documentsLoading,
		error: documentsError,
	} = useProcurementDocumentsList(vendorId);

	const isLoading = contractsLoading || documentsLoading;
	const error = contractsError ?? documentsError;

	const rows = useMemo(() => {
		if (documents.length > 0) {
			const defaultContract = vendorId ? contracts[0] : undefined;
			return documents.map((doc) => ({
				...doc,
				contractId: defaultContract?.id ?? "",
				contractNumber: defaultContract?.number ?? "—",
				vendorName: defaultContract?.vendorName ?? "—",
				contractStatus: defaultContract?.status ?? "active",
			}));
		}
		return contracts.flatMap((c) =>
			(c.documents ?? []).map((doc) => ({
				...doc,
				contractId: c.id,
				contractNumber: c.number,
				vendorName: c.vendorName,
				contractStatus: c.status,
			}))
		);
	}, [contracts, documents, vendorId]);

	const summary = useMemo(
		() => ({
			total: rows.length,
			contracts: new Set(rows.map((r) => r.contractId)).size,
		}),
		[rows]
	);

	return (
		<div className={contractsShellClass(embedded)}>
			{embedded ? null : (
				<PageHeader
					title="Contract Documents"
					description="Executed agreements, exhibits, and supporting files."
				/>
			)}
			{vendorId ? (
				<div className="flex justify-end">
					<Button type="button" size="sm" onClick={() => setUploadOpen(true)}>
						<Plus className="mr-2 size-4" />
						Upload document
					</Button>
				</div>
			) : null}
			<SummaryCardsGrid columns={2}>
				<SummaryCard
					label="Documents on file"
					value={summary.total}
					icon={FileText}
					tone="text-rose-700 bg-rose-500/10"
				/>
				<SummaryCard
					label="Contracts with docs"
					value={summary.contracts}
					icon={FileText}
					tone="text-primary bg-primary/10"
				/>
			</SummaryCardsGrid>

			{isLoading ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load contracts.</p>
			) : (
				<SectionCard title="Document inventory">
					<TableShell className="border-0 shadow-none">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Document</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Contract</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Uploaded</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={`${row.contractId}-${row.id}`}>
										<TableCell>
											<div className="flex items-center gap-2">
												<span className="flex size-7 items-center justify-center rounded-md bg-rose-500/10 text-[10px] font-bold uppercase text-rose-700">
													{row.fileExtension ?? "file"}
												</span>
												<span className="text-sm font-medium">{row.name}</span>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{row.type}
										</TableCell>
										<TableCell>
											<Link
												href={`/admin/contracts/${row.contractId}?tab=documents`}
												className="font-medium hover:underline"
											>
												{row.contractNumber}
											</Link>
										</TableCell>
										<TableCell>{row.vendorName}</TableCell>
										<TableCell>{formatDate(row.uploadedOn)}</TableCell>
										<TableCell>
											<StatusBadge status={row.contractStatus} />
										</TableCell>
									</TableRow>
								))}
								{rows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-24 text-center text-muted-foreground"
										>
											No documents found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableShell>
				</SectionCard>
			)}
			{vendorId ? (
				<UploadProcurementDocumentDialog
					open={uploadOpen}
					onOpenChange={setUploadOpen}
					vendorId={vendorId}
				/>
			) : null}
		</div>
	);
}

export function ContractsDetailsHubPage({
	vendorId,
	embedded,
}: ContractsEmbeddedProps = {}) {
	const { contracts, isLoading, error } = useContractsList(vendorId);

	return (
		<div className={contractsShellClass(embedded)}>
			{embedded ? null : (
				<PageHeader
					eyebrow="Contracts"
					title="Contract Details"
					description="Open a contract to review summary, terms, rates, SLA, and documents."
				/>
			)}

			{isLoading ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load contracts.</p>
			) : (
				<SectionCard title="Select a contract">
					<TableShell className="border-0 shadow-none">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Contract</TableHead>
									<TableHead>Vendor</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Term</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{contracts.map((contract) => (
									<TableRow key={contract.id}>
										<TableCell>
											<div className="font-medium">{contract.number}</div>
											<div className="text-xs text-muted-foreground">
												{contract.title}
											</div>
										</TableCell>
										<TableCell>{contract.vendorName}</TableCell>
										<TableCell className="text-muted-foreground">
											{contract.contractType ?? "—"}
										</TableCell>
										<TableCell>
											<StatusBadge status={contract.status} />
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{formatDate(contract.startDate)} –{" "}
											{formatDate(contract.endDate)}
										</TableCell>
										<TableCell className="text-right">
											<Button asChild size="sm" className="h-8">
												<Link href={`/admin/contracts/${contract.id}`}>
													View detail
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
								{contracts.length === 0 && (
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
					</TableShell>
				</SectionCard>
			)}
		</div>
	);
}

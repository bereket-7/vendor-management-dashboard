"use client";

import { useParams, useSearchParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";

import {
	ArrowLeft,
	Building2,
	CalendarDays,
	ChevronDown,
	DollarSign,
	Download,
	FileText,
	Pencil,
	ScrollText,
	Shield,
	Timer,
	User,
} from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/admin/SectionCard";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import type {
	ContractDocumentItem,
	ContractModel,
	ContractRateLine,
	ContractSlaMetric,
	ContractTermPeriod,
	ContractTermStatus,
} from "@/features/shared/vms/types";
import { formatDate, formatMoney } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
	useContract,
	useProcurementDocumentsList,
	useUpdateContractMutation,
} from "../feature/queries/useContractsQuery";
import { UploadProcurementDocumentDialog } from "../components/UploadProcurementDocumentDialog";

const TABS = [
	"Contract Details",
	"Effective Dates",
	"Rate / Fee Schedule",
	"SLA Terms",
	"Documents",
] as const;

type Tab = (typeof TABS)[number];

const TAB_QUERY: Record<string, Tab> = {
	"contract-details": "Contract Details",
	"effective-dates": "Effective Dates",
	"rate-fee-schedule": "Rate / Fee Schedule",
	"sla-terms": "SLA Terms",
	documents: "Documents",
};

function formatVendorDisplayId(vendorId: string) {
	return vendorId.slice(0, 8).toUpperCase();
}

function tabFromQuery(value: string | null): Tab {
	if (!value) return "Contract Details";
	return TAB_QUERY[value] ?? "Contract Details";
}

const TAB_ICONS: Record<Tab, typeof FileText> = {
	"Contract Details": FileText,
	"Effective Dates": CalendarDays,
	"Rate / Fee Schedule": DollarSign,
	"SLA Terms": Shield,
	Documents: ScrollText,
};

const SLA_TONES: Record<NonNullable<ContractSlaMetric["tone"]>, string> = {
	emerald: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
	sky: "bg-sky-500/15 text-sky-700 ring-sky-500/20",
	amber: "bg-amber-500/15 text-amber-700 ring-amber-500/20",
	violet: "bg-violet-500/15 text-violet-700 ring-violet-500/20",
	rose: "bg-rose-500/15 text-rose-700 ring-rose-500/20",
};

const TERM_STATUS_CLASS: Record<ContractTermStatus, string> = {
	completed:
		"bg-emerald-500/15 text-emerald-800 ring-1 ring-inset ring-emerald-500/25",
	current: "bg-sky-500/15 text-sky-800 ring-1 ring-inset ring-sky-500/25",
	upcoming: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

function TermStatusBadge({ status }: { status: ContractTermStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
				TERM_STATUS_CLASS[status]
			)}
		>
			{status}
		</span>
	);
}

function OverviewInfoCard({
	icon: Icon,
	tone,
	rows,
}: {
	icon: typeof Building2;
	tone: string;
	rows: Array<{ label: string; value: ReactNode }>;
}) {
	return (
		<div className="rounded-xl border border-border bg-card p-4 shadow-sm">
			<div className="flex items-start gap-3">
				<div
					className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
						tone
					)}
				>
					<Icon className="size-4" />
				</div>
				<div className="min-w-0 flex-1 space-y-2.5">
					{rows.map((row) => (
						<div key={row.label}>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								{row.label}
							</p>
							<div className="mt-0.5 text-sm font-medium text-foreground">
								{row.value}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function SummaryDl({ items }: { items: Array<[string, ReactNode]> }) {
	return (
		<dl className="space-y-3">
			{items.map(([label, value]) => (
				<div
					key={label}
					className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
				>
					<dt className="text-sm text-muted-foreground">{label}</dt>
					<dd className="max-w-[60%] text-right text-sm font-medium text-foreground">
						{value}
					</dd>
				</div>
			))}
		</dl>
	);
}

function EffectiveDatesPanel({
	contract,
	terms,
}: {
	contract: ContractModel;
	terms: ContractTermPeriod[];
}) {
	return (
		<div className="space-y-5">
			<div className="rounded-lg border border-border bg-muted/20 px-4 py-5">
				<div className="relative mx-auto flex max-w-xl items-center justify-between">
					<div className="absolute inset-x-8 top-3 h-0.5 bg-emerald-500/70" />
					<div className="relative z-10 flex flex-col items-start gap-2">
						<span className="size-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Start Date
							</p>
							<p className="text-sm font-semibold">
								{formatDate(contract.startDate)}
							</p>
						</div>
					</div>
					<div className="relative z-10 flex flex-col items-end gap-2 text-right">
						<span className="size-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								End Date
							</p>
							<p className="text-sm font-semibold">
								{formatDate(contract.endDate)}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Period</TableHead>
							<TableHead>Start Date</TableHead>
							<TableHead>End Date</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{terms.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="h-20 text-center text-muted-foreground"
								>
									No term periods defined.
								</TableCell>
							</TableRow>
						) : (
							terms.map((term) => (
								<TableRow key={term.id}>
									<TableCell className="font-medium">{term.label}</TableCell>
									<TableCell>{formatDate(term.startDate)}</TableCell>
									<TableCell>{formatDate(term.endDate)}</TableCell>
									<TableCell>
										<TermStatusBadge status={term.status} />
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function RateScheduleTable({
	rows,
	currency,
	limit,
}: {
	rows: ContractRateLine[];
	currency: string;
	limit?: number;
}) {
	const visible = limit != null ? rows.slice(0, limit) : rows;
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Service / Code</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Contracted Rate</TableHead>
						<TableHead>Unit</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{visible.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={4}
								className="h-20 text-center text-muted-foreground"
							>
								No rate lines on this contract.
							</TableCell>
						</TableRow>
					) : (
						visible.map((row) => (
							<TableRow key={row.id}>
								<TableCell className="font-mono text-xs font-medium">
									{row.serviceCode}
								</TableCell>
								<TableCell>{row.description}</TableCell>
								<TableCell className="tabular-nums">
									{formatMoney(row.contractedRate, currency)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{row.unit}
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}

function SlaMetricsList({ metrics }: { metrics: ContractSlaMetric[] }) {
	if (metrics.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No SLA metrics have been specified.
			</p>
		);
	}
	return (
		<ul className="space-y-3">
			{metrics.map((metric) => (
				<li
					key={metric.id}
					className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
				>
					<div className="flex min-w-0 items-center gap-2.5">
						<span
							className={cn(
								"flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
								SLA_TONES[metric.tone ?? "sky"]
							)}
						>
							<Timer className="size-3.5" />
						</span>
						<span className="truncate text-sm font-medium">{metric.name}</span>
					</div>
					<span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
						{metric.target}
					</span>
				</li>
			))}
		</ul>
	);
}

function DocumentsTable({
	documents,
	limit,
}: {
	documents: ContractDocumentItem[];
	limit?: number;
}) {
	const visible = limit != null ? documents.slice(0, limit) : documents;
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Document Name</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Uploaded On</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{visible.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={3}
								className="h-20 text-center text-muted-foreground"
							>
								No documents uploaded.
							</TableCell>
						</TableRow>
					) : (
						visible.map((doc) => (
							<TableRow key={doc.id}>
								<TableCell>
									<div className="flex items-center gap-2">
										<span className="flex size-7 items-center justify-center rounded-md bg-rose-500/10 text-[10px] font-bold uppercase text-rose-700">
											{doc.fileExtension ?? "file"}
										</span>
										<span className="text-sm font-medium">{doc.name}</span>
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{doc.type}
								</TableCell>
								<TableCell>{formatDate(doc.uploadedOn)}</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}

export function ContractDetailPage() {
	const params = useParams<{ contractId: string }>();
	const searchParams = useSearchParams();
	const { contract, isLoading } = useContract(params.contractId);
	const updateContract = useUpdateContractMutation();
	const { documents: procurementDocuments } = useProcurementDocumentsList(
		contract?.vendorId,
		Boolean(contract?.vendorId)
	);
	const [tab, setTab] = useState<Tab>(() =>
		tabFromQuery(searchParams.get("tab"))
	);
	const [uploadOpen, setUploadOpen] = useState(false);

	const terms = useMemo(() => contract?.terms ?? [], [contract]);
	const rates = useMemo(() => contract?.rateSchedule ?? [], [contract]);
	const slaMetrics = useMemo(() => contract?.slaMetrics ?? [], [contract]);
	const documents = useMemo(
		() =>
			procurementDocuments.length > 0
				? procurementDocuments
				: (contract?.documents ?? []),
		[contract, procurementDocuments]
	);

	async function approve() {
		if (!contract) return;
		try {
			await updateContract.mutateAsync({
				id: contract.id,
				patch: { status: "active" },
			});
			toast.success("Contract approved and activated.");
		} catch {
			toast.error("Could not approve contract.");
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-80 w-full" />
			</div>
		);
	}

	if (!contract) {
		return (
			<div className="space-y-4">
				<Link
					href="/admin/contracts"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					Back to Contracts
				</Link>
				<p className="text-sm">Contract not found.</p>
			</div>
		);
	}

	const summaryItems: Array<[string, ReactNode]> = [
		["Contract ID", contract.number],
		["Contract Name", contract.title],
		["Vendor", contract.vendorName],
		["Contract Type", contract.contractType ?? "—"],
		["Payment Model", contract.paymentModel ?? "—"],
		["Payment Terms", contract.paymentTerms ?? "—"],
		["Governing Law", contract.governingLaw ?? "—"],
		[
			"Executed On",
			contract.executedOn ? formatDate(contract.executedOn) : "—",
		],
		["Notes", contract.notes || "—"],
	];

	const remainingRates = Math.max(0, rates.length - 4);

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="space-y-2 border-b border-border pb-3">
				<Link
					href="/admin/contracts"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					Contracts
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
								{contract.vendorName}
							</h1>
							<StatusBadge status={contract.status} />
						</div>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
							<span>
								<span className="font-medium text-foreground">
									Contract ID:
								</span>{" "}
								{contract.number}
							</span>
							<span className="hidden text-border sm:inline">|</span>
							<span>
								<span className="font-medium text-foreground">
									Vendor Type:
								</span>{" "}
								{contract.vendorType ?? "—"}
							</span>
							<span className="hidden text-border sm:inline">|</span>
							<span>
								<span className="font-medium text-foreground">
									Contract Type:
								</span>{" "}
								{contract.contractType ?? "—"}
							</span>
							<span className="hidden text-border sm:inline">|</span>
							<span>
								<span className="font-medium text-foreground">
									Executed On:
								</span>{" "}
								{contract.executedOn
									? formatDate(contract.executedOn)
									: "Not executed"}
							</span>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{contract.status === "pending_approval" ? (
							<Button
								onClick={approve}
								disabled={updateContract.isPending}
								size="sm"
							>
								{updateContract.isPending ? "Approving…" : "Approve contract"}
							</Button>
						) : null}
						<Button
							variant="outline"
							size="sm"
							className="border-primary/30 text-primary"
							onClick={() =>
								toast.message("Edit contract", {
									description: "Editing will be available after API cutover.",
								})
							}
						>
							<Pencil className="mr-1.5 size-3.5" />
							Edit Contract
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="sm">
									<Download className="mr-1.5 size-3.5" />
									Export
									<ChevronDown className="ml-1.5 size-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() =>
										toast.success("Exported contract summary PDF.")
									}
								>
									Export summary (PDF)
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => toast.success("Exported fee schedule CSV.")}
								>
									Export fee schedule (CSV)
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										toast.success("Exported full contract package.")
									}
								>
									Export full package
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<nav
				className="-mx-1 flex gap-1 overflow-x-auto border-b border-border pb-px"
				aria-label="Contract sections"
			>
				{TABS.map((item) => {
					const Icon = TAB_ICONS[item];
					const active = tab === item;
					return (
						<button
							key={item}
							type="button"
							onClick={() => setTab(item)}
							className={cn(
								"inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
								active
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							)}
						>
							<Icon className="size-3.5" />
							{item}
						</button>
					);
				})}
			</nav>

			{tab === "Contract Details" && (
				<div className="space-y-5">
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<OverviewInfoCard
							icon={Building2}
							tone="bg-sky-500/15 text-sky-700 ring-sky-500/20"
							rows={[
								{ label: "Vendor Name", value: contract.vendorName },
								{
									label: "Vendor ID",
									value: formatVendorDisplayId(contract.vendorId),
								},
							]}
						/>
						<OverviewInfoCard
							icon={FileText}
							tone="bg-violet-500/15 text-violet-700 ring-violet-500/20"
							rows={[
								{
									label: "Contract Type",
									value: contract.contractType ?? "—",
								},
								{
									label: "Payment Model",
									value: contract.paymentModel ?? "—",
								},
							]}
						/>
						<OverviewInfoCard
							icon={DollarSign}
							tone="bg-emerald-500/15 text-emerald-700 ring-emerald-500/20"
							rows={[
								{ label: "Currency", value: contract.currency },
								{
									label: "Payment Terms",
									value: contract.paymentTerms ?? "—",
								},
							]}
						/>
						<OverviewInfoCard
							icon={User}
							tone="bg-amber-500/15 text-amber-700 ring-amber-500/20"
							rows={[
								{
									label: "Account Manager",
									value: contract.accountManager ?? "—",
								},
								{
									label: "Status",
									value: <StatusBadge status={contract.status} />,
								},
							]}
						/>
					</div>

					<div className="grid gap-4 lg:grid-cols-2">
						<SectionCard title="Contract Summary">
							<SummaryDl items={summaryItems} />
						</SectionCard>
						<SectionCard title="Effective Dates">
							<EffectiveDatesPanel contract={contract} terms={terms} />
						</SectionCard>
					</div>

					<div className="grid gap-4 lg:grid-cols-3">
						<SectionCard
							title="Rate / Fee Schedule"
							action={
								<button
									type="button"
									className="text-xs font-semibold text-primary hover:underline"
									onClick={() => setTab("Rate / Fee Schedule")}
								>
									View Full Schedule
								</button>
							}
						>
							<RateScheduleTable
								rows={rates}
								currency={contract.currency}
								limit={4}
							/>
							{remainingRates > 0 ? (
								<button
									type="button"
									className="mt-3 text-xs font-semibold text-primary hover:underline"
									onClick={() => setTab("Rate / Fee Schedule")}
								>
									+ {remainingRates} more service
									{remainingRates === 1 ? "" : "s"}
								</button>
							) : null}
						</SectionCard>

						<SectionCard
							title="SLA Terms"
							action={
								<button
									type="button"
									className="text-xs font-semibold text-primary hover:underline"
									onClick={() => setTab("SLA Terms")}
								>
									View All
								</button>
							}
						>
							<SlaMetricsList metrics={slaMetrics.slice(0, 4)} />
							{contract.slaSummary ? (
								<p className="mt-3 text-xs text-muted-foreground">
									{contract.slaSummary}
								</p>
							) : null}
						</SectionCard>

						<SectionCard
							title="Documents"
							action={
								<button
									type="button"
									className="text-xs font-semibold text-primary hover:underline"
									onClick={() => setTab("Documents")}
								>
									View All
								</button>
							}
						>
							<DocumentsTable documents={documents} limit={4} />
						</SectionCard>
					</div>
				</div>
			)}

			{tab === "Effective Dates" && (
				<SectionCard
					title="Effective Dates & Term Periods"
					description="Contract start/end timeline and renewal periods."
				>
					<EffectiveDatesPanel contract={contract} terms={terms} />
				</SectionCard>
			)}

			{tab === "Rate / Fee Schedule" && (
				<SectionCard
					title="Rate / Fee Schedule"
					description="Contracted rates by service code."
					action={
						<Button
							variant="outline"
							size="sm"
							onClick={() => toast.success("Exported fee schedule CSV.")}
						>
							<Download className="mr-1.5 size-3.5" />
							Export
						</Button>
					}
				>
					<RateScheduleTable rows={rates} currency={contract.currency} />
				</SectionCard>
			)}

			{tab === "SLA Terms" && (
				<SectionCard
					title="SLA Terms"
					description="Service-level commitments for this agreement."
				>
					<div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
						<SlaMetricsList metrics={slaMetrics} />
						<div className="rounded-lg border border-border bg-muted/20 p-4">
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Summary
							</p>
							<p className="mt-2 text-sm leading-relaxed text-foreground">
								{contract.slaSummary || "No SLA summary has been specified."}
							</p>
						</div>
					</div>
				</SectionCard>
			)}

			{tab === "Documents" && (
				<SectionCard
					title="Documents"
					description="Executed agreements, exhibits, and supporting files."
					action={
						<Button
							variant="outline"
							size="sm"
							onClick={() => setUploadOpen(true)}
						>
							Upload
						</Button>
					}
				>
					<DocumentsTable documents={documents} />
					<UploadProcurementDocumentDialog
						open={uploadOpen}
						onOpenChange={setUploadOpen}
						vendorId={contract.vendorId}
						defaultDocumentType={
							contract.contractType === "sow" ? "sow" : "msa"
						}
					/>
				</SectionCard>
			)}
		</div>
	);
}

"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
	ArrowLeft,
	Banknote,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronDown,
	ClipboardList,
	Download,
	ExternalLink,
	FileText,
	Percent,
	ScrollText,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ClaimsTable,
	MetaItem,
	StatusPill,
} from "@/features/admin/features/claim-encounter/components/ClaimDetailShared";
import {
	EdiViewerDialog,
	EdiViewerLoader,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import {
	claimsForResponse,
	downloadTextFile,
	exportRowsAsCsv,
	formatCount,
	formatCurrency,
	getClaimResponse,
	getSubmissionBatch,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
	"Overview",
	"Claim Outcomes",
	"Remittance",
	"EDI",
	"Linked Batch",
] as const;
type Tab = (typeof TABS)[number];

export function ResponseDetailPage() {
	const params = useParams<{ responseId: string }>();
	const response = useMemo(
		() => getClaimResponse(params.responseId),
		[params.responseId]
	);
	const [tab, setTab] = useState<Tab>("Overview");
	const [ediOpen, setEdiOpen] = useState(false);

	const claims = useMemo(
		() => (response ? claimsForResponse(response.id) : []),
		[response]
	);
	const batch = response
		? getSubmissionBatch(response.submissionBatch)
		: undefined;
	const relatedFile = response
		? getVendorFile(response.relatedFileId)
		: undefined;

	const paidAmount = useMemo(
		() => claims.reduce((sum, c) => sum + c.amountPaid, 0),
		[claims]
	);
	const billedAmount = useMemo(
		() => claims.reduce((sum, c) => sum + c.amountBilled, 0),
		[claims]
	);

	const acceptanceRate = response?.totalSubmitted
		? Math.round(
				((response.paid + response.partialPaid) / response.totalSubmitted) *
					1000
			) / 10
		: 0;

	const backHref =
		response?.direction === "outbound"
			? "/admin/claim-encounter/outbound"
			: "/admin/claim-encounter/inbound";

	if (!response) {
		return (
			<div className="space-y-4">
				<Link
					href="/admin/claim-encounter/inbound"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back
				</Link>
				<p className="text-sm text-destructive">Response not found.</p>
			</div>
		);
	}

	async function handleDownload() {
		try {
			const raw = await loadEdiFixture(response!.ediFixture ?? "835");
			downloadTextFile(response!.responseFile, raw);
			toast.success("Response EDI downloaded");
		} catch {
			toast.error("Failed to load EDI fixture");
		}
	}

	function handleExportClaims() {
		exportRowsAsCsv(
			`${response!.responseId}-outcomes.csv`,
			[
				"Claim ID",
				"Member ID",
				"Provider",
				"Amount Billed",
				"Amount Paid",
				"Gainwell Status",
				"Reject Reason",
				"Trace ID",
			],
			claims.map((c) => [
				c.claimId,
				c.memberId,
				c.provider,
				c.amountBilled,
				c.amountPaid,
				c.gainwellStatus,
				c.rejectReason ?? "",
				c.traceId,
			])
		);
		toast.success("Claim outcomes exported");
	}

	return (
		<div className="space-y-4">
			<div className="space-y-3 border-b border-border/50 pb-3">
				<Link
					href={backHref}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					{response.direction === "outbound" ? "Outbound" : "Inbound"} files
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">
							GW
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
								Gainwell response file
							</p>
							<div className="mt-0.5 flex flex-wrap items-center gap-2">
								<h1 className="text-base font-medium tracking-tight">
									{response.responseFile}
								</h1>
								<StatusPill status={response.status} />
								<span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
									{response.responseType}
								</span>
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								What Gainwell returned for {response.vendor} ·{" "}
								{response.program}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={() => setEdiOpen(true)}
						>
							<FileText className="mr-1.5 size-3.5" />
							View EDI
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={handleDownload}
						>
							<Download className="mr-1.5 size-3.5" />
							Download EDI
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={handleExportClaims}
						>
							<ScrollText className="mr-1.5 size-3.5" />
							Export outcomes
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="h-8 text-xs">
									More Actions
									<ChevronDown className="ml-1.5 size-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-52">
								<DropdownMenuItem asChild>
									<Link
										href={`/admin/claim-encounter/batches/${encodeURIComponent(response.submissionBatch)}`}
									>
										<ExternalLink className="mr-2 size-3.5" />
										Open source batch
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										toast.message(
											relatedFile
												? `Vendor file ${relatedFile.fileName}`
												: "Related file unavailable"
										)
									}
								>
									<FileText className="mr-2 size-3.5" />
									View vendor source file
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className="grid gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					<MetaItem label="Vendor" value={response.vendor} icon={Building2} />
					<MetaItem
						label="Response type"
						value={response.responseType}
						icon={ScrollText}
					/>
					<MetaItem
						label="Received from Gainwell"
						value={response.receivedAt}
						icon={Calendar}
					/>
					<MetaItem
						label="Paid amount"
						value={
							<span className="text-emerald-700">
								{formatCurrency(paidAmount)}
							</span>
						}
						icon={Banknote}
					/>
					<MetaItem
						label="Billed amount"
						value={formatCurrency(billedAmount)}
						icon={ClipboardList}
					/>
					<MetaItem
						label="Paid claims"
						value={formatCount(response.paid)}
						icon={CheckCircle2}
					/>
					<MetaItem
						label="Rejected claims"
						value={
							<span className="text-red-700">
								{formatCount(response.rejected)}
							</span>
						}
						icon={XCircle}
					/>
					<MetaItem
						label="Partial paid"
						value={formatCount(response.partialPaid)}
					/>
					<MetaItem label="Pending" value={formatCount(response.pending)} />
					<MetaItem
						label="Acceptance %"
						value={`${acceptanceRate}%`}
						icon={Percent}
					/>
				</div>
			</div>

			<div className="flex flex-wrap gap-1 border-b border-border/50">
				{TABS.map((item) => (
					<button
						key={item}
						type="button"
						onClick={() => setTab(item)}
						className={cn(
							"border-b-2 px-3 py-2 text-xs font-medium transition-colors",
							tab === item
								? "border-emerald-600 text-emerald-700"
								: "border-transparent text-muted-foreground hover:text-foreground"
						)}
					>
						{item}
						{item === "Claim Outcomes" ? (
							<span className="ml-1.5 text-[10px] text-muted-foreground">
								{claims.length}
							</span>
						) : null}
					</button>
				))}
			</div>

			{tab === "Overview" && (
				<div className="space-y-4">
					<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
						{[
							{
								label: "Paid claims",
								value: formatCount(response.paid),
								hint: formatCurrency(paidAmount),
							},
							{
								label: "Rejected claims",
								value: formatCount(response.rejected),
								hint: "Needs investigation",
							},
							{
								label: "Partial paid",
								value: formatCount(response.partialPaid),
								hint: "Underpaid lines",
							},
							{
								label: "Acceptance",
								value: `${acceptanceRate}%`,
								hint: "Paid + partial / submitted",
							},
						].map((card) => (
							<div
								key={card.label}
								className="rounded-xl border border-border bg-card shadow-sm p-3"
							>
								<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
									{card.label}
								</p>
								<p className="mt-1 text-xl font-medium tabular-nums">
									{card.value}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{card.hint}
								</p>
							</div>
						))}
					</div>
					<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
						<h2 className="text-sm font-medium">Response summary</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							{response.summary} This page shows Gainwell outcomes for claims
							already submitted in batch{" "}
							<span className="font-mono text-foreground">
								{response.submissionBatch}
							</span>
							.
						</p>
					</div>
				</div>
			)}

			{tab === "Claim Outcomes" && (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">
						Claim-level results returned by Gainwell (paid, rejected, partial,
						pending).
					</p>
					<ClaimsTable rows={claims} mode="response" />
				</div>
			)}

			{tab === "Remittance" && (
				<div className="space-y-4">
					<div className="rounded-xl border border-border bg-card shadow-sm p-4">
						<h2 className="text-sm font-medium">
							Remittance / acknowledgement
						</h2>
						<p className="mt-1 text-xs text-muted-foreground">
							Payment and adjustment detail derived from the{" "}
							{response.responseType} response.
						</p>
						<div className="mt-3 grid gap-2 sm:grid-cols-3">
							<div className="rounded-md border border-border/50 p-2.5">
								<p className="text-[10px] uppercase text-muted-foreground">
									Check / EFT total
								</p>
								<p className="text-lg font-medium tabular-nums text-emerald-700">
									{formatCurrency(paidAmount)}
								</p>
							</div>
							<div className="rounded-md border border-border/50 p-2.5">
								<p className="text-[10px] uppercase text-muted-foreground">
									Adjustments
								</p>
								<p className="text-lg font-medium tabular-nums">
									{formatCurrency(Math.max(0, billedAmount - paidAmount))}
								</p>
							</div>
							<div className="rounded-md border border-border/50 p-2.5">
								<p className="text-[10px] uppercase text-muted-foreground">
									Trace prefix
								</p>
								<p className="font-mono text-sm">
									TRC-{response.submissionBatch.slice(-6)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl border border-border bg-card shadow-sm p-4">
						<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Top paid claims
						</h3>
						<div className="mt-2 space-y-2">
							{claims
								.filter((c) => c.amountPaid > 0)
								.sort((a, b) => b.amountPaid - a.amountPaid)
								.slice(0, 6)
								.map((c) => (
									<div
										key={c.id}
										className="flex items-center justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-b-0"
									>
										<div className="min-w-0">
											<p className="font-mono text-xs font-medium">
												{c.claimId}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{c.provider} · {c.memberId}
											</p>
										</div>
										<p className="shrink-0 font-medium tabular-nums text-emerald-700">
											{formatCurrency(c.amountPaid)}
										</p>
									</div>
								))}
							{claims.every((c) => c.amountPaid === 0) ? (
								<p className="text-sm text-muted-foreground">
									No paid claim lines in this response.
								</p>
							) : null}
						</div>
					</div>
				</div>
			)}

			{tab === "EDI" && (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">
						Full X12 remittance / acknowledgement viewer.
					</p>
					<ResponseEdiPanel
						fixture={response.ediFixture ?? "835"}
						fileName={response.responseFile}
					/>
				</div>
			)}

			{tab === "Linked Batch" && (
				<div className="rounded-xl border border-border bg-card shadow-sm p-4">
					{batch ? (
						<div className="space-y-4">
							<p className="text-xs text-muted-foreground">
								This response answers the MFC submission batch below. Open the
								batch to inspect what was sent to Gainwell.
							</p>
							<div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-background/60 p-3">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
										MFC submission batch
									</p>
									<p className="mt-0.5 font-mono text-sm font-medium">
										{batch.batchId}
									</p>
									<p className="text-xs text-muted-foreground">
										{batch.vendor} · {formatCount(batch.claimsSubmitted)} claims
										submitted · {batch.submittedAt}
									</p>
								</div>
								<Button asChild size="sm" className="h-8 text-xs">
									<Link
										href={`/admin/claim-encounter/batches/${encodeURIComponent(batch.batchId)}`}
									>
										Open batch detail
									</Link>
								</Button>
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							No linked submission batch.
						</p>
					)}
				</div>
			)}

			<EdiViewerDialog
				open={ediOpen}
				onOpenChange={setEdiOpen}
				fixture={response.ediFixture ?? "835"}
				fileName={response.responseFile}
				title={response.responseFile}
			/>
		</div>
	);
}

function ResponseEdiPanel({
	fixture,
	fileName,
}: {
	fixture: "835" | "837I";
	fileName: string;
}) {
	const load = useCallback(() => loadEdiFixture(fixture), [fixture]);
	return (
		<EdiViewerLoader
			load={load}
			fileName={fileName}
			className="min-h-[520px]"
		/>
	);
}

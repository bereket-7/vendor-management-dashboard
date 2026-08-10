"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
	ArrowLeft,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronDown,
	ClipboardList,
	Download,
	ExternalLink,
	FileText,
	Percent,
	Radio,
	Send,
	Server,
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
	claimsForBatch,
	downloadTextFile,
	exportRowsAsCsv,
	formatCount,
	getClaimResponse,
	getSubmissionBatch,
	getVendorFile,
} from "@/features/admin/features/claim-encounter/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
	"Overview",
	"Submitted Claims",
	"Transmission",
	"Linked Response",
] as const;
type Tab = (typeof TABS)[number];

export function SubmissionBatchDetailPage() {
	const params = useParams<{ batchId: string }>();
	const batch = useMemo(
		() => getSubmissionBatch(params.batchId),
		[params.batchId]
	);
	const [tab, setTab] = useState<Tab>("Overview");

	const claims = useMemo(
		() => (batch ? claimsForBatch(batch.batchId) : []),
		[batch]
	);
	const response = batch ? getClaimResponse(batch.responseId) : undefined;
	const relatedFile = batch ? getVendorFile(batch.relatedFileId) : undefined;

	const acceptanceRate = batch?.claimsSubmitted
		? Math.round((batch.accepted / batch.claimsSubmitted) * 1000) / 10
		: 0;

	const backHref =
		batch?.direction === "outbound"
			? "/admin/claim-encounter/outbound"
			: "/admin/claim-encounter/inbound";

	if (!batch) {
		return (
			<div className="space-y-4">
				<Link
					href="/admin/claim-encounter/inbound"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back
				</Link>
				<p className="text-sm text-destructive">Submission batch not found.</p>
			</div>
		);
	}

	function handleDownloadManifest() {
		downloadTextFile(
			`${batch!.batchId}-manifest.txt`,
			[
				`Batch: ${batch!.batchId}`,
				`Vendor: ${batch!.vendor}`,
				`Program: ${batch!.program}`,
				`Direction: ${batch!.direction}`,
				`Claim type: ${batch!.claimType}`,
				`Claims submitted: ${batch!.claimsSubmitted}`,
				`ISA control: 000000${String(batch!.batchId.length).padStart(3, "0")}`,
				`GS control: ${1000 + (batch!.claimsSubmitted % 900)}`,
				`Submitted at: ${batch!.submittedAt}`,
				`Response received: ${batch!.responseReceived ? "Yes" : "No"}`,
			].join("\n")
		);
		toast.success("Batch manifest downloaded");
	}

	function handleExportClaims() {
		exportRowsAsCsv(
			`${batch!.batchId}-submitted-claims.csv`,
			[
				"Claim ID",
				"Member ID",
				"Provider",
				"Amount Billed",
				"Submission Status",
				"Batch ID",
				"Trace ID",
			],
			claims.map((c) => [
				c.claimId,
				c.memberId,
				c.provider,
				c.amountBilled,
				c.submissionStatus,
				c.batchId,
				c.traceId,
			])
		);
		toast.success("Submitted claims exported");
	}

	const transmissionEvents = [
		{
			at: batch.submittedAt,
			title: "Batch packaged",
			detail: `${formatCount(batch.claimsSubmitted)} claims assembled from ${relatedFile?.fileName ?? batch.relatedFileId}`,
			ok: true,
		},
		{
			at: batch.submittedAt,
			title: "SFTP / gateway send",
			detail: `Delivered to Gainwell intake (${batch.program})`,
			ok: true,
		},
		{
			at: batch.submittedAt,
			title: "TA1 / 999 technical ACK",
			detail: batch.responseReceived
				? "Interchange accepted"
				: "Awaiting technical acknowledgement",
			ok: batch.responseReceived,
		},
		{
			at: batch.submittedAt,
			title: "Business response",
			detail: batch.responseFile
				? `Linked response ${batch.responseFile}`
				: "No 835/277CA response yet",
			ok: Boolean(batch.responseFile),
		},
	];

	return (
		<div className="space-y-4">
			<div className="space-y-3 border-b border-border/50 pb-3">
				<Link
					href={backHref}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					{batch.direction === "outbound" ? "Outbound" : "Inbound"} files
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-medium text-white">
							MF
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
								MFC submission batch
							</p>
							<div className="mt-0.5 flex flex-wrap items-center gap-2">
								<h1 className="text-base font-medium tracking-tight">
									{batch.batchId}
								</h1>
								<span
									className={cn(
										"inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
										batch.responseReceived
											? "bg-emerald-100 text-emerald-800"
											: "bg-amber-100 text-amber-900"
									)}
								>
									{batch.responseReceived
										? "Response received"
										: "Awaiting response"}
								</span>
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								What MFC sent to Gainwell for {batch.vendor} · {batch.program}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						{relatedFile ? (
							<Button
								asChild
								variant="outline"
								size="sm"
								className="h-8 text-xs"
							>
								<Link
									href={`/admin/claim-encounter/files/${encodeURIComponent(relatedFile.fileId)}`}
								>
									<FileText className="mr-1.5 size-3.5" />
									View EDI
								</Link>
							</Button>
						) : null}
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={handleDownloadManifest}
						>
							<Download className="mr-1.5 size-3.5" />
							Download manifest
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={handleExportClaims}
						>
							<ClipboardList className="mr-1.5 size-3.5" />
							Export submitted claims
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="h-8 text-xs">
									More Actions
									<ChevronDown className="ml-1.5 size-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-52">
								{response ? (
									<DropdownMenuItem asChild>
										<Link
											href={`/admin/claim-encounter/responses/${response.id}`}
										>
											<ExternalLink className="mr-2 size-3.5" />
											Open Gainwell response
										</Link>
									</DropdownMenuItem>
								) : null}
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
								<DropdownMenuItem
									onClick={() => toast.success("Resubmission queued")}
								>
									Queue resubmission
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className="grid gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					<MetaItem label="Vendor" value={batch.vendor} icon={Building2} />
					<MetaItem
						label="Claim type"
						value={batch.claimType}
						icon={ClipboardList}
					/>
					<MetaItem
						label="Submitted at"
						value={batch.submittedAt}
						icon={Calendar}
					/>
					<MetaItem
						label="Claims submitted"
						value={formatCount(batch.claimsSubmitted)}
						icon={Send}
					/>
					<MetaItem
						label="Gateway"
						value={`${batch.program} intake`}
						icon={Server}
					/>
					<MetaItem
						label="Accepted (post-response)"
						value={
							<span className="text-emerald-700">
								{formatCount(batch.accepted)}
							</span>
						}
						icon={CheckCircle2}
					/>
					<MetaItem
						label="Rejected (post-response)"
						value={
							<span className="text-red-700">
								{formatCount(batch.rejected)}
							</span>
						}
						icon={XCircle}
					/>
					<MetaItem label="Partial" value={formatCount(batch.partial)} />
					<MetaItem
						label="Response received"
						value={batch.responseReceived ? "Yes" : "No"}
						icon={Radio}
					/>
					<MetaItem
						label="Acceptance rate"
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
								? "border-sky-600 text-sky-700"
								: "border-transparent text-muted-foreground hover:text-foreground"
						)}
					>
						{item}
						{item === "Submitted Claims" ? (
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
								label: "Claims in batch",
								value: formatCount(batch.claimsSubmitted),
								hint: "Packaged for Gainwell",
							},
							{
								label: "Source vendor file",
								value: relatedFile?.fileId ?? batch.relatedFileId,
								hint: relatedFile?.fileName ?? "—",
							},
							{
								label: "Send status",
								value: batch.responseReceived ? "Acknowledged" : "In flight",
								hint: batch.program,
							},
							{
								label: "Post-response rate",
								value: `${acceptanceRate}%`,
								hint: "Once Gainwell responds",
							},
						].map((card) => (
							<div
								key={card.label}
								className="rounded-xl border border-border bg-card shadow-sm p-3"
							>
								<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
									{card.label}
								</p>
								<p className="mt-1 truncate text-lg font-medium tabular-nums">
									{card.value}
								</p>
								<p className="mt-1 truncate text-xs text-muted-foreground">
									{card.hint}
								</p>
							</div>
						))}
					</div>
					<div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
						<h2 className="text-sm font-medium">Submission context</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							This batch is the package MFC sent to Gainwell. Use{" "}
							<strong>Submitted Claims</strong> to inspect claim content as
							sent, and <strong>Transmission</strong> for gateway / ACK status.
							Open the linked Gainwell response for payment and rejection
							outcomes.
						</p>
					</div>
				</div>
			)}

			{tab === "Submitted Claims" && (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">
						Claims as packaged and submitted to Gainwell (before remittance
						outcomes).
					</p>
					<ClaimsTable rows={claims} mode="batch" />
				</div>
			)}

			{tab === "Transmission" && (
				<div className="space-y-4">
					<div className="grid gap-2 sm:grid-cols-3">
						<div className="rounded-xl border border-border bg-card shadow-sm p-3">
							<p className="text-[10px] uppercase text-muted-foreground">
								ISA control
							</p>
							<p className="mt-1 font-mono text-sm">
								000000{String(batch.batchId.length).padStart(3, "0")}
							</p>
						</div>
						<div className="rounded-xl border border-border bg-card shadow-sm p-3">
							<p className="text-[10px] uppercase text-muted-foreground">
								GS control
							</p>
							<p className="mt-1 font-mono text-sm">
								{1000 + (batch.claimsSubmitted % 900)}
							</p>
						</div>
						<div className="rounded-xl border border-border bg-card shadow-sm p-3">
							<p className="text-[10px] uppercase text-muted-foreground">
								ST count
							</p>
							<p className="mt-1 font-mono text-sm">
								{Math.max(1, Math.ceil(batch.claimsSubmitted / 5000))}
							</p>
						</div>
					</div>
					<div className="space-y-2 rounded-xl border border-border bg-card shadow-sm p-4">
						{transmissionEvents.map((event) => (
							<div
								key={event.title}
								className="flex gap-3 border-b border-border/40 py-2 last:border-b-0"
							>
								<div
									className={cn(
										"mt-1 size-2 shrink-0 rounded-full",
										event.ok ? "bg-emerald-500" : "bg-amber-500"
									)}
								/>
								<div>
									<p className="text-sm font-medium">{event.title}</p>
									<p className="text-xs text-muted-foreground">
										{event.detail}
									</p>
									<p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
										{event.at}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{tab === "Linked Response" && (
				<div className="rounded-xl border border-border bg-card shadow-sm p-4">
					{response ? (
						<div className="space-y-4">
							<p className="text-xs text-muted-foreground">
								Gainwell returned a business response for this batch. Open it to
								review paid / rejected claim outcomes and remittance detail.
							</p>
							<div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-background/60 p-3">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
										Gainwell response file
									</p>
									<div className="mt-0.5 flex items-center gap-2">
										<p className="font-mono text-sm font-medium">
											{response.responseFile}
										</p>
										<StatusPill status={response.status} />
									</div>
									<p className="text-xs text-muted-foreground">
										{response.responseType} · {response.summary}
									</p>
								</div>
								<Button asChild size="sm" className="h-8 text-xs">
									<Link
										href={`/admin/claim-encounter/responses/${response.id}`}
									>
										Open response detail
									</Link>
								</Button>
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							No Gainwell response has been received for this batch yet.
						</p>
					)}
				</div>
			)}
		</div>
	);
}

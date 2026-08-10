"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useCallback, useMemo, useState } from "react";

import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	EdiViewerLoader,
	loadEdiFixture,
} from "@/features/admin/features/claim-encounter/edi";
import { findClaimLineByClaimId } from "@/features/admin/features/claim-encounter/live-claims";
import {
	type ClaimDetail,
	buildClaimDetailFromLine,
	exportRowsAsCsv,
	formatCurrency,
	getClaimDetail,
} from "@/features/admin/features/claim-encounter/mock-data";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Link } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { useVendorCoreClaimLines } from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";

const MAIN_TABS = ["Overview", "Operations & Audit"] as const;
type MainTab = (typeof MAIN_TABS)[number];

const RELATED_FILTERS = ["All", "Adjustments", "Voids", "Reversals"] as const;

function formatDos(iso: string) {
	const [y, m, d] = iso.split("-");
	if (!y || !m || !d) return iso;
	return `${m}/${d}/${y}`;
}

function Panel({
	title,
	children,
	footer,
	className,
	bodyClassName,
}: {
	title: string;
	children: ReactNode;
	footer?: { label: string; href?: string; onClick?: () => void };
	className?: string;
	bodyClassName?: string;
}) {
	return (
		<section
			className={cn(
				"flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			<div className="shrink-0 border-b border-border bg-muted/30 px-4 py-3">
				<h2 className="text-sm font-semibold tracking-tight text-foreground">
					{title}
				</h2>
			</div>
			<div className={cn("min-h-0 flex-1 px-4 py-3.5", bodyClassName)}>
				{children}
			</div>
			{footer ? (
				<div className="shrink-0 border-t border-border px-4 py-2.5">
					{footer.href ? (
						<Link
							href={footer.href}
							className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
						>
							{footer.label}
							<ChevronRight className="size-3.5" />
						</Link>
					) : (
						<button
							type="button"
							onClick={footer.onClick}
							className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
						>
							{footer.label}
							<ChevronRight className="size-3.5" />
						</button>
					)}
				</div>
			) : null}
		</section>
	);
}

function MetaChip({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-0">
			<span className="text-muted-foreground">{label}: </span>
			<span className="font-medium text-foreground">{value}</span>
		</div>
	);
}

function FileTable({ rows }: { rows: ClaimDetail["responseFiles"] }) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="h-9 pl-0 text-[11px]">File Type</TableHead>
						<TableHead className="h-9 text-[11px]">File Name</TableHead>
						<TableHead className="h-9 text-[11px]">Received Date</TableHead>
						<TableHead className="h-9 pr-0 text-[11px]">Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.fileName} className="hover:bg-muted/20">
							<TableCell className="py-2.5 pl-0 text-xs">
								{row.fileType}
							</TableCell>
							<TableCell className="max-w-[180px] truncate py-2.5 font-mono text-[11px] text-primary">
								{row.fileName}
							</TableCell>
							<TableCell className="py-2.5 text-xs tabular-nums text-muted-foreground">
								{row.receivedDate}
							</TableCell>
							<TableCell className="py-2.5 pr-0">
								<StatusBadge status={row.status} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function OverviewTab({ claim }: { claim: ClaimDetail }) {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 lg:grid-cols-4">
				{[
					["Amount Billed", formatCurrency(claim.amountBilled)],
					["Amount Allowed", formatCurrency(claim.amountAllowed)],
					["Amount Paid", formatCurrency(claim.amountPaid)],
					[
						"Patient Responsibility",
						formatCurrency(claim.patientResponsibility),
					],
				].map(([label, value]) => (
					<div
						key={label}
						className="rounded-lg border border-border/60 bg-card px-4 py-3.5"
					>
						<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							{label}
						</p>
						<p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
							{value}
						</p>
					</div>
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<Panel title="Claim Summary">
					<dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2.5 text-xs">
						{[
							["Claim ID", claim.claimId],
							["Claim Type", claim.claimType],
							["Priority", claim.priority],
							["Status", claim.status],
							["Trace ID", claim.traceId],
							["Auth #", claim.authNumber || "—"],
						].map(([k, v]) => (
							<div key={k} className="contents">
								<dt className="text-muted-foreground">{k}</dt>
								<dd className="font-medium break-all">{v}</dd>
							</div>
						))}
					</dl>
				</Panel>

				<Panel title="Member">
					<dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2.5 text-xs">
						{[
							["Member ID", claim.memberId],
							["Name", claim.memberName],
							["Group", claim.group],
							["Plan", claim.plan],
							["Payer", claim.payer],
						].map(([k, v]) => (
							<div key={k} className="contents">
								<dt className="text-muted-foreground">{k}</dt>
								<dd className="font-medium break-all">{v}</dd>
							</div>
						))}
					</dl>
				</Panel>

				<Panel title="Provider & Vendor">
					<dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2.5 text-xs">
						{[
							["Provider", claim.provider],
							["NPI", claim.providerNpi],
							["Vendor", claim.vendor],
							["Program", claim.program],
							["DOS", formatDos(claim.dateOfService)],
							["Paid Date", claim.paidDate ?? "—"],
							["Check / EFT", claim.checkEft ?? "—"],
						].map(([k, v]) => (
							<div key={k} className="contents">
								<dt className="text-muted-foreground">{k}</dt>
								<dd className="font-medium break-all">{v}</dd>
							</div>
						))}
					</dl>
				</Panel>
			</div>

			<Panel title="Service Lines">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-9 pl-0 text-[11px]">Code</TableHead>
								<TableHead className="h-9 text-[11px]">Mod</TableHead>
								<TableHead className="h-9 text-[11px]">Diagnosis</TableHead>
								<TableHead className="h-9 text-right text-[11px]">
									Units
								</TableHead>
								<TableHead className="h-9 text-right text-[11px]">
									Charge
								</TableHead>
								<TableHead className="h-9 text-right text-[11px]">
									Allowed
								</TableHead>
								<TableHead className="h-9 text-right text-[11px]">
									Paid
								</TableHead>
								<TableHead className="h-9 pr-0 text-[11px]">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{claim.serviceLines.map((line) => (
								<TableRow key={line.id} className="hover:bg-muted/20">
									<TableCell className="py-2.5 pl-0 font-mono text-xs">
										{line.code}
									</TableCell>
									<TableCell className="py-2.5 text-xs">
										{line.modifier || "—"}
									</TableCell>
									<TableCell className="py-2.5 font-mono text-xs">
										{line.diagnosis}
									</TableCell>
									<TableCell className="py-2.5 text-right text-xs tabular-nums">
										{line.units}
									</TableCell>
									<TableCell className="py-2.5 text-right text-xs tabular-nums">
										{formatCurrency(line.charge)}
									</TableCell>
									<TableCell className="py-2.5 text-right text-xs tabular-nums">
										{formatCurrency(line.allowed)}
									</TableCell>
									<TableCell className="py-2.5 text-right text-xs tabular-nums text-emerald-700">
										{formatCurrency(line.paid)}
									</TableCell>
									<TableCell className="py-2.5 pr-0">
										<StatusBadge status={line.status} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Panel>
		</div>
	);
}

function OperationsAuditTab({ claim }: { claim: ClaimDetail }) {
	const [ediTab, setEdiTab] = useState<"837I" | "835">("837I");
	const [relatedFilter, setRelatedFilter] =
		useState<(typeof RELATED_FILTERS)[number]>("All");
	const [notesTab, setNotesTab] = useState<"notes" | "attachments">("notes");
	const [ediFullscreen, setEdiFullscreen] = useState(false);

	const load837 = useCallback(() => loadEdiFixture("837I"), []);
	const load835 = useCallback(() => loadEdiFixture("835"), []);

	const relatedCounts = useMemo(() => {
		const all = claim.relatedClaims.length;
		const adjustments = claim.relatedClaims.filter(
			(c) => c.relationship === "Adjustment"
		).length;
		const voids = claim.relatedClaims.filter(
			(c) => c.relationship === "Void"
		).length;
		const reversals = claim.relatedClaims.filter(
			(c) => c.relationship === "Reversal"
		).length;
		return {
			All: all,
			Adjustments: adjustments,
			Voids: voids,
			Reversals: reversals,
		};
	}, [claim.relatedClaims]);

	const filteredRelated = useMemo(() => {
		if (relatedFilter === "All") return claim.relatedClaims;
		const map: Record<
			string,
			ClaimDetail["relatedClaims"][number]["relationship"]
		> = {
			Adjustments: "Adjustment",
			Voids: "Void",
			Reversals: "Reversal",
		};
		const rel = map[relatedFilter];
		return claim.relatedClaims.filter((c) => c.relationship === rel);
	}, [claim.relatedClaims, relatedFilter]);

	return (
		<div className="space-y-4">
			{/* Top row: Response Files | Validation */}
			<div className="grid gap-4 xl:grid-cols-2">
				<Panel
					title="Response Files"
					footer={{
						label: "View all response files",
						href: "/admin/claim-encounter/responses",
					}}
				>
					<FileTable rows={claim.responseFiles} />
				</Panel>

				<Panel
					title="Validation Results"
					footer={{
						label: "View validation details",
						onClick: () =>
							toast.message("Validation details", {
								description: `${claim.validation.passed} of ${claim.validation.total} passed`,
							}),
					}}
				>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{[
							{
								label: "Total Validations",
								value: claim.validation.total,
								className: "text-foreground",
							},
							{
								label: "Passed",
								value: claim.validation.passed,
								className: "text-emerald-700",
							},
							{
								label: "Warnings",
								value: claim.validation.warnings,
								className: "text-amber-700",
							},
							{
								label: "Errors",
								value: claim.validation.errors,
								className: "text-red-700",
							},
						].map((item) => (
							<div
								key={item.label}
								className="rounded-md border border-border/50 bg-muted/20 px-3 py-3"
							>
								<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
									{item.label}
								</p>
								<p
									className={cn(
										"mt-1 text-xl font-semibold tabular-nums",
										item.className
									)}
								>
									{item.value}
								</p>
							</div>
						))}
					</div>
				</Panel>
			</div>

			{/* EDI | File History + Batch + Related Claims */}
			<div className="grid items-stretch gap-4 xl:grid-cols-2">
				<Panel
					title="EDI Viewer"
					footer={{
						label: "View in full screen",
						onClick: () => setEdiFullscreen(true),
					}}
					className="h-full min-h-[640px]"
					bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden !p-0"
				>
					<div className="shrink-0 px-4 pt-3.5">
						<div className="flex items-center gap-1 border-b border-border/50">
							{(
								[
									["837I", "837 Professional"],
									["835", "835 Remittance"],
								] as const
							).map(([key, label]) => (
								<button
									key={key}
									type="button"
									onClick={() => setEdiTab(key)}
									className={cn(
										"border-b-2 px-3 py-2 text-xs font-medium transition-colors",
										ediTab === key
											? "border-primary text-primary"
											: "border-transparent text-muted-foreground hover:text-foreground"
									)}
								>
									{label}
								</button>
							))}
						</div>
					</div>
					<div className="relative min-h-0 flex-1">
						<div className="absolute inset-0 overflow-hidden px-4 py-3.5">
							<EdiViewerLoader
								key={ediTab}
								load={ediTab === "837I" ? load837 : load835}
								fileName={
									ediTab === "837I"
										? claim.edi837FileName
										: claim.edi835FileName
								}
								compact
								showInspector={false}
								className="h-full min-h-0 !rounded-md"
							/>
						</div>
					</div>
				</Panel>

				<div className="flex h-full min-h-[640px] flex-col gap-4">
					<Panel
						title="File History"
						footer={{
							label: "View full file history",
							href: "/admin/file-history",
						}}
					>
						<FileTable rows={claim.fileHistory} />
					</Panel>

					<Panel
						title="Batch Information"
						footer={{
							label: "View batch details",
							href: claim.batchId
								? `/admin/claim-encounter/batches/${encodeURIComponent(claim.batch.inboundBatch)}`
								: "/admin/claim-encounter/inbound",
						}}
					>
						<dl className="space-y-3 text-xs">
							{[
								[
									"Inbound Batch",
									claim.batch.inboundBatch,
									claim.batch.inboundAt,
								],
								[
									"Outbound Batch",
									claim.batch.outboundBatch,
									claim.batch.outboundAt,
								],
								["Run ID", claim.batch.runId, null],
								["Processing Job", claim.batch.processingJob, null],
							].map(([label, value, sub]) => (
								<div
									key={label}
									className="flex items-start justify-between gap-3 border-b border-border/40 pb-2.5 last:border-0 last:pb-0"
								>
									<dt className="text-muted-foreground">{label}</dt>
									<dd className="text-right">
										<p className="font-mono font-medium text-primary">
											{value}
										</p>
										{sub ? (
											<p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
												{sub}
											</p>
										) : null}
									</dd>
								</div>
							))}
						</dl>
					</Panel>

					<Panel
						title="Related Claims"
						footer={{
							label: "View all related claims",
							href: "/admin/claim-encounter/claims",
						}}
						className="flex min-h-0 flex-1 flex-col"
						bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
					>
						<div className="mb-2 flex shrink-0 flex-wrap gap-0 border-b border-border/50">
							{RELATED_FILTERS.map((filter) => (
								<button
									key={filter}
									type="button"
									onClick={() => setRelatedFilter(filter)}
									className={cn(
										"border-b-2 px-2.5 py-2 text-[11px] font-medium transition-colors",
										relatedFilter === filter
											? "border-primary text-primary"
											: "border-transparent text-muted-foreground hover:text-foreground"
									)}
								>
									{filter} ({relatedCounts[filter]})
								</button>
							))}
						</div>
						<div className="min-h-0 flex-1 overflow-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 pl-0 text-[11px]">
											Claim ID
										</TableHead>
										<TableHead className="h-9 text-[11px]">
											Relationship
										</TableHead>
										<TableHead className="h-9 text-[11px]">
											Service Date
										</TableHead>
										<TableHead className="h-9 text-[11px]">Status</TableHead>
										<TableHead className="h-9 pr-0 text-right text-[11px]">
											Paid Amount
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredRelated.map((row) => (
										<TableRow key={row.claimId} className="hover:bg-muted/20">
											<TableCell className="py-2.5 pl-0">
												{row.claimId === claim.claimId ? (
													<span className="font-mono text-xs font-medium text-primary">
														{row.claimId}
													</span>
												) : (
													<Link
														href={`/admin/claim-encounter/claims/${encodeURIComponent(row.claimId)}`}
														className="font-mono text-xs font-medium text-primary hover:underline"
													>
														{row.claimId}
													</Link>
												)}
											</TableCell>
											<TableCell className="py-2.5 text-xs">
												{row.relationship}
											</TableCell>
											<TableCell className="py-2.5 text-xs tabular-nums">
												{formatDos(row.serviceDate)}
											</TableCell>
											<TableCell className="py-2.5">
												<StatusBadge status={row.status} />
											</TableCell>
											<TableCell className="py-2.5 pr-0 text-right text-xs tabular-nums">
												{formatCurrency(row.paidAmount)}
											</TableCell>
										</TableRow>
									))}
									{filteredRelated.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="py-6 text-center text-xs text-muted-foreground"
											>
												No related claims in this category.
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</div>
					</Panel>
				</div>
			</div>

			{/* Processing Logs — full width */}
			<Panel
				title="Processing Logs"
				footer={{
					label: "View full processing logs",
					href: "/admin/processing-logs",
				}}
			>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-9 pl-0 text-[11px]">
									Timestamp
								</TableHead>
								<TableHead className="h-9 text-[11px]">Step</TableHead>
								<TableHead className="h-9 text-[11px]">Message</TableHead>
								<TableHead className="h-9 text-[11px]">Status</TableHead>
								<TableHead className="h-9 pr-0 text-[11px]">Details</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{claim.processingLogs.map((row) => (
								<TableRow
									key={`${row.timestamp}-${row.step}`}
									className="hover:bg-muted/20"
								>
									<TableCell className="py-2.5 pl-0 text-[11px] tabular-nums text-muted-foreground">
										{row.timestamp}
									</TableCell>
									<TableCell className="py-2.5 text-xs font-medium">
										{row.step}
									</TableCell>
									<TableCell className="max-w-[320px] truncate py-2.5 text-xs">
										{row.message}
									</TableCell>
									<TableCell className="py-2.5">
										<StatusBadge status={row.status} />
									</TableCell>
									<TableCell className="max-w-[240px] truncate py-2.5 pr-0 text-[11px] text-muted-foreground">
										{row.details}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Panel>

			{/* Bottom row */}
			<div className="grid gap-4 lg:grid-cols-3">
				<Panel
					title="Audit Trail"
					footer={{
						label: "View full audit trail",
						href: "/admin/audit-trail",
					}}
				>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-9 pl-0 text-[11px]">
										Date / Time
									</TableHead>
									<TableHead className="h-9 text-[11px]">Action</TableHead>
									<TableHead className="h-9 text-[11px]">
										User / System
									</TableHead>
									<TableHead className="h-9 pr-0 text-[11px]">
										Details
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{claim.auditTrail.map((row) => (
									<TableRow
										key={`${row.dateTime}-${row.action}`}
										className="hover:bg-muted/20"
									>
										<TableCell className="py-2.5 pl-0 text-[11px] tabular-nums text-muted-foreground">
											{row.dateTime}
										</TableCell>
										<TableCell className="py-2.5 text-xs font-medium">
											{row.action}
										</TableCell>
										<TableCell className="py-2.5 text-xs">
											{row.userSystem}
										</TableCell>
										<TableCell className="max-w-[160px] truncate py-2.5 pr-0 text-xs text-muted-foreground">
											{row.details}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</Panel>

				<Panel title="Reprocessing History">
					{claim.reprocessingHistory.length === 0 ? (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 pl-0 text-[11px]">
											Date / Time
										</TableHead>
										<TableHead className="h-9 text-[11px]">Reason</TableHead>
										<TableHead className="h-9 text-[11px]">Status</TableHead>
										<TableHead className="h-9 pr-0 text-[11px]">User</TableHead>
									</TableRow>
								</TableHeader>
							</Table>
							<p className="py-10 text-center text-xs text-muted-foreground">
								No reprocessing history found for this claim.
							</p>
						</div>
					) : (
						<ul className="space-y-2 text-xs">
							{claim.reprocessingHistory.map((row) => (
								<li
									key={`${row.timestamp}-${row.step}`}
									className="rounded-md border border-border/50 px-2.5 py-2"
								>
									<p className="font-medium">{row.step}</p>
									<p className="mt-0.5 text-muted-foreground">{row.message}</p>
								</li>
							))}
						</ul>
					)}
				</Panel>

				<Panel
					title="Notes & Attachments"
					footer={{
						label: "View all notes & attachments",
						onClick: () =>
							toast.message("Notes & attachments", {
								description: `${claim.notes.length} notes · ${claim.attachments.length} attachments`,
							}),
					}}
				>
					<div className="mb-2 flex items-center gap-1 border-b border-border/50">
						<button
							type="button"
							onClick={() => setNotesTab("notes")}
							className={cn(
								"border-b-2 px-3 py-2 text-xs font-medium",
								notesTab === "notes"
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground"
							)}
						>
							Notes ({claim.notes.length})
						</button>
						<button
							type="button"
							onClick={() => setNotesTab("attachments")}
							className={cn(
								"border-b-2 px-3 py-2 text-xs font-medium",
								notesTab === "attachments"
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground"
							)}
						>
							Attachments ({claim.attachments.length})
						</button>
					</div>

					{notesTab === "notes" ? (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 pl-0 text-[11px]">Note</TableHead>
										<TableHead className="h-9 text-[11px]">Added By</TableHead>
										<TableHead className="h-9 pr-0 text-[11px]">Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{claim.notes.map((note) => (
										<TableRow key={note.id} className="hover:bg-muted/20">
											<TableCell className="py-2.5 pl-0 text-xs">
												{note.text}
											</TableCell>
											<TableCell className="py-2.5 text-xs">
												{note.addedBy}
											</TableCell>
											<TableCell className="py-2.5 pr-0 text-xs tabular-nums text-muted-foreground">
												{note.date}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 pl-0 text-[11px]">
											File Name
										</TableHead>
										<TableHead className="h-9 text-[11px]">Type</TableHead>
										<TableHead className="h-9 text-[11px]">
											Uploaded By
										</TableHead>
										<TableHead className="h-9 pr-0 text-[11px]">Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{claim.attachments.map((att) => (
										<TableRow key={att.id} className="hover:bg-muted/20">
											<TableCell className="py-2.5 pl-0 font-mono text-[11px] text-primary">
												{att.fileName}
											</TableCell>
											<TableCell className="py-2.5 text-xs">
												{att.type}
											</TableCell>
											<TableCell className="py-2.5 text-xs">
												{att.uploadedBy}
											</TableCell>
											<TableCell className="py-2.5 pr-0 text-xs tabular-nums text-muted-foreground">
												{att.date}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</Panel>
			</div>

			{ediFullscreen ? (
				<div className="fixed inset-0 z-50 flex flex-col bg-background">
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<div>
							<p className="text-sm font-semibold">
								EDI ·{" "}
								{ediTab === "837I" ? "837 Professional" : "835 Remittance"}
							</p>
							<p className="text-xs text-muted-foreground">
								{ediTab === "837I"
									? claim.edi837FileName
									: claim.edi835FileName}
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEdiFullscreen(false)}
						>
							Close
						</Button>
					</div>
					<div className="min-h-0 flex-1 p-4">
						<EdiViewerLoader
							key={`fs-${ediTab}`}
							load={ediTab === "837I" ? load837 : load835}
							fileName={
								ediTab === "837I" ? claim.edi837FileName : claim.edi835FileName
							}
							className="h-full"
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}

export function ClaimDetailPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Claim Overview">
				<ClaimDetailBody useLive />
			</VendorCoreGate>
		);
	}
	return <ClaimDetailBody useLive={false} />;
}

function ClaimDetailBody({ useLive }: { useLive: boolean }) {
	const params = useParams<{ claimId: string }>();
	const claimLinesQ = useVendorCoreClaimLines(useLive);
	const claim = useMemo(() => {
		if (useLive) {
			const line = findClaimLineByClaimId(
				claimLinesQ.data ?? [],
				params.claimId
			);
			return line ? buildClaimDetailFromLine(line) : undefined;
		}
		return getClaimDetail(params.claimId);
	}, [useLive, claimLinesQ.data, params.claimId]);
	const [tab, setTab] = useState<MainTab>("Operations & Audit");

	if (useLive && claimLinesQ.isLoading && !claim) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Loading claim from vendor-core…
				</p>
			</div>
		);
	}

	if (useLive && claimLinesQ.error && !claim) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-destructive">
					Could not load claim: {claimLinesQ.error.message}
				</p>
				<Link
					href="/admin/claim-encounter/claims"
					className="text-sm text-primary hover:underline"
				>
					Back to Claims
				</Link>
			</div>
		);
	}

	if (!claim) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-destructive">Claim not found.</p>
				<Link
					href="/admin/claim-encounter/claims"
					className="text-sm text-primary hover:underline"
				>
					Back to Claims
				</Link>
			</div>
		);
	}

	function handleExport() {
		exportRowsAsCsv(
			`${claim!.claimId}-overview.csv`,
			[
				"Claim ID",
				"Member ID",
				"Member Name",
				"Provider",
				"Vendor",
				"Payer",
				"DOS",
				"Status",
				"Amount Billed",
				"Amount Paid",
			],
			[
				[
					claim!.claimId,
					claim!.memberId,
					claim!.memberName,
					claim!.provider,
					claim!.vendor,
					claim!.payer,
					claim!.dateOfService,
					claim!.status,
					claim!.amountBilled,
					claim!.amountPaid,
				],
			]
		);
		toast.success("Claim exported");
	}

	function handlePrint() {
		window.print();
		toast.message("Print dialog opened");
	}

	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-1.5">
					<h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
						Claim Overview
					</h1>
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-sm">
							<span className="text-muted-foreground">Claim ID: </span>
							<span className="font-mono font-semibold text-primary">
								{claim.claimId}
							</span>
						</p>
						<StatusBadge status={claim.status} />
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-9">
								Export
								<ChevronDown className="ml-1.5 size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleExport}>
								Export CSV
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									toast.message("PDF export", {
										description: "Queued for generation",
									})
								}
							>
								Export PDF
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						onClick={handlePrint}
					>
						<Printer className="mr-1.5 size-3.5" />
						Print
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm" className="h-9">
								Actions
								<ChevronDown className="ml-1.5 size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() =>
									toast.message("Reprocess claim", {
										description: claim.claimId,
									})
								}
							>
								Reprocess claim
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									toast.message("Add note", { description: claim.claimId })
								}
							>
								Add note
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									void navigator.clipboard.writeText(claim.claimId);
									toast.success("Claim ID copied");
								}}
							>
								Copy claim ID
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link
									href="/admin/claim-encounter/claims"
									className="cursor-pointer"
								>
									Back to claims list
								</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Meta strip */}
			<div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3.5 text-xs">
				<MetaChip
					label="Member"
					value={`${claim.memberId} - ${claim.memberName}`}
				/>
				<MetaChip label="DOS" value={formatDos(claim.dateOfService)} />
				<MetaChip label="Provider" value={claim.provider} />
				<MetaChip label="Vendor" value={claim.vendor} />
				<MetaChip label="Payer" value={claim.payer} />
			</div>

			{/* Tabs */}
			<div className="border-b border-border/60">
				<div className="flex gap-0">
					{MAIN_TABS.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => setTab(item)}
							className={cn(
								"border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
								tab === item
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							)}
						>
							{item}
						</button>
					))}
				</div>
			</div>

			{tab === "Overview" ? (
				<OverviewTab claim={claim} />
			) : (
				<OperationsAuditTab claim={claim} />
			)}
		</div>
	);
}

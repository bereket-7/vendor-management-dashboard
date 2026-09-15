"use client";

import { type ReactNode, useState } from "react";

import { ExternalLink, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EdiViewerDialog } from "@/features/admin/features/claim-encounter/edi/EdiViewerDialog";
import type { ClaimException } from "@/features/admin/features/claim-encounter/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function formatDisplayDate(value: string) {
	if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
		const [y, m, d] = value.slice(0, 10).split("-");
		return `${m}/${d}/${y}`;
	}
	return value;
}

function PanelSection({
	title,
	children,
	className,
	bodyClassName,
}: {
	title: string;
	children: ReactNode;
	className?: string;
	bodyClassName?: string;
}) {
	return (
		<section
			className={cn(
				"rounded-lg border border-border/70 bg-card p-3 shadow-sm",
				className
			)}
		>
			<h4 className="mb-2.5 text-xs font-semibold text-foreground">{title}</h4>
			<div className={bodyClassName}>{children}</div>
		</section>
	);
}

/** Label on the left, value on the right — matches the reference detail rows. */
function DetailRow({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: ReactNode;
	valueClassName?: string;
}) {
	return (
		<div className="flex items-start justify-between gap-3">
			<span className="shrink-0 text-[11px] text-muted-foreground">
				{label}
			</span>
			<span
				className={cn(
					"min-w-0 text-right text-[11px] font-medium text-foreground",
					valueClassName
				)}
			>
				{value}
			</span>
		</div>
	);
}

function SeverityPill({ severity }: { severity: ClaimException["severity"] }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
				severity === "error"
					? "bg-red-100 text-red-800"
					: "bg-amber-100 text-amber-900"
			)}
		>
			{severity === "error" ? "High" : "Medium"}
		</span>
	);
}

function EdiLines({
	snippet,
	highlight,
}: {
	snippet: string;
	highlight?: string;
}) {
	const lines = snippet.split("\n").filter(Boolean);
	const padded = [...lines];
	while (padded.length < 5) padded.push("· · · · ·");

	return (
		<pre className="overflow-x-auto rounded-md border border-border bg-muted/30 p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
			{padded.map((line, index) => {
				const highlightIdx =
					highlight && highlight.length > 0 ? line.indexOf(highlight) : -1;
				return (
					<div key={`${index}-${line}`} className="flex gap-3">
						<span className="w-3 shrink-0 select-none text-right text-muted-foreground">
							{index + 1}
						</span>
						<span className="min-w-0 whitespace-pre">
							{highlightIdx >= 0 && highlight ? (
								<>
									{line.slice(0, highlightIdx)}
									<span className="font-semibold text-red-600">
										{highlight}
									</span>
									{line.slice(highlightIdx + highlight.length)}
								</>
							) : (
								line
							)}
						</span>
					</div>
				);
			})}
		</pre>
	);
}

export function ErrorDiagnosticDetailPanel({
	exception,
	onClose,
	onStatusChange,
	onAssign,
}: {
	exception: ClaimException;
	onClose: () => void;
	onStatusChange: (
		id: string,
		status: ClaimException["status"],
		notes?: string
	) => void | Promise<void>;
	onAssign?: (id: string) => void | Promise<void>;
}) {
	const [status, setStatus] = useState<ClaimException["status"]>(
		exception.status
	);
	const [ediOpen, setEdiOpen] = useState(false);
	const [attachments, setAttachments] = useState(exception.attachmentsCount);

	async function markInProgress() {
		try {
			await onStatusChange(
				exception.id,
				"in_progress",
				exception.resolutionNotes
			);
			setStatus("in_progress");
		} catch {
			/* toast already shown by parent */
		}
	}

	async function markResolved() {
		try {
			await onStatusChange(exception.id, "resolved", exception.resolutionNotes);
			setStatus("resolved");
		} catch {
			/* toast already shown by parent */
		}
	}

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
			<div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
				<div className="min-w-0 space-y-1.5">
					<h3 className="text-base font-semibold tracking-tight">
						Error Diagnostic Detail
					</h3>
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<span
							className={cn(
								"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
								exception.severity === "error"
									? "bg-red-100 text-red-800"
									: "bg-amber-100 text-amber-900"
							)}
						>
							{exception.severity === "error" ? "Error" : "Warning"}
						</span>
						<span className="text-muted-foreground">
							Code:{" "}
							<span className="font-medium text-foreground">
								{exception.code}
							</span>
						</span>
						<span className="text-muted-foreground">
							Category:{" "}
							<span className="font-medium text-foreground">
								{exception.category}
							</span>
						</span>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<Button
						asChild
						variant="outline"
						size="sm"
						className="h-8 text-[11px]"
					>
						<Link
							href={`/admin/claim-encounter/exceptions/${encodeURIComponent(exception.id)}`}
						>
							View details
						</Link>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={onClose}
						aria-label="Close diagnostic detail"
					>
						<X className="size-4" />
					</Button>
				</div>
			</div>

			<ScrollArea
				className="min-h-0 flex-1"
				scrollbarClassName="w-1.5"
				thumbClassName="bg-foreground/15 hover:bg-foreground/25"
			>
				<div className="space-y-3 p-3">
					<div className="grid gap-3 lg:grid-cols-2">
						<PanelSection title="Summary" bodyClassName="space-y-2">
							<DetailRow label="Claim ID" value={exception.claimId ?? "—"} />
							<DetailRow label="Service Line" value={exception.serviceLine} />
							<DetailRow
								label="Member"
								value={`${exception.memberId} · ${exception.memberName}`}
							/>
							<DetailRow label="Provider" value={exception.provider} />
							<DetailRow
								label="DOS"
								value={formatDisplayDate(exception.dateOfService)}
							/>
							<DetailRow label="Vendor" value={exception.vendor} />
							<DetailRow label="Source" value={exception.source} />
							<DetailRow
								label="Detected"
								value={formatDisplayDate(exception.detectedAt)}
							/>
							<DetailRow
								label="Severity"
								value={<SeverityPill severity={exception.severity} />}
							/>
						</PanelSection>

						<div className="space-y-3">
							<PanelSection title="What Failed">
								<p className="text-[11px] leading-relaxed text-foreground">
									{exception.whatFailed}
								</p>
							</PanelSection>
							<PanelSection title="Why it Matters">
								<p className="text-[11px] leading-relaxed text-muted-foreground">
									{exception.whyItMatters}
								</p>
							</PanelSection>
						</div>
					</div>

					<div className="grid gap-3 lg:grid-cols-2">
						<PanelSection title="Values" bodyClassName="space-y-2">
							<DetailRow
								label="Received Value"
								value={exception.receivedValue}
								valueClassName="font-mono text-red-600"
							/>
							<DetailRow
								label="Expected Value"
								value={exception.expectedValue}
								valueClassName="font-normal text-muted-foreground"
							/>
						</PanelSection>
						<PanelSection title="Location" bodyClassName="space-y-2">
							<DetailRow label="Loop / Segment" value={exception.loopSegment} />
							<DetailRow
								label="Element"
								value={exception.element}
								valueClassName="font-mono"
							/>
							<DetailRow
								label="Element Description"
								value={exception.elementDescription}
							/>
							<DetailRow label="Usage" value={exception.usage} />
							<DetailRow label="Max Use" value={exception.maxUse} />
						</PanelSection>
					</div>

					<div className="grid gap-3 lg:grid-cols-2">
						<PanelSection title="Validation Rule" bodyClassName="space-y-2">
							<DetailRow
								label="Rule ID"
								value={exception.ruleId}
								valueClassName="font-mono"
							/>
							<DetailRow
								label="Rule Description"
								value={exception.ruleDescription}
								valueClassName="font-normal text-muted-foreground"
							/>
						</PanelSection>
						<PanelSection title="Recommended Action">
							<p className="text-[11px] leading-relaxed text-foreground">
								{exception.recommendedAction}
							</p>
						</PanelSection>
					</div>

					<div className="grid gap-3 lg:grid-cols-2">
						<PanelSection
							title={`EDI Segment Viewer (${exception.loopSegment})`}
						>
							<EdiLines
								snippet={exception.ediSnippet}
								highlight={exception.receivedValue}
							/>
							<Button
								variant="outline"
								size="sm"
								className="mt-2.5 h-7 text-[11px] text-primary"
								onClick={() => setEdiOpen(true)}
							>
								View full EDI
								<ExternalLink className="ml-1.5 size-3" />
							</Button>
						</PanelSection>

						<PanelSection title="Responsible Party" bodyClassName="space-y-3">
							<div className="flex items-center gap-1.5 text-[11px] font-medium">
								<UserRound className="size-3.5 text-muted-foreground" />
								{exception.responsibleParty}
							</div>
							<div className="rounded-md border border-border/70 bg-muted/20 p-2.5">
								<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
									Assigned To
								</p>
								<div className="mt-1 flex flex-wrap items-center justify-between gap-2">
									<span className="text-[11px] font-medium">
										{exception.assignedTo}
									</span>
									<Button
										variant="outline"
										size="sm"
										className="h-7 text-[11px]"
										onClick={() => {
											if (onAssign) {
												void onAssign(exception.id);
												return;
											}
											toast.message("Reassign", {
												description:
													"Reassignment will connect in a later cutover.",
											});
										}}
									>
										<UserRound className="mr-1.5 size-3" />
										Reassign
									</Button>
								</div>
							</div>
						</PanelSection>
					</div>

					<PanelSection title="Resolution">
						<div className="flex flex-wrap items-end justify-between gap-3">
							<div className="space-y-1">
								<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
									Attachments ({attachments})
								</p>
								<Button
									variant="outline"
									size="sm"
									className="h-8 text-[11px]"
									onClick={() => {
										setAttachments((n) => n + 1);
										toast.success("Attachment added (mock).");
									}}
								>
									+ Add attachment
								</Button>
							</div>
							<div className="flex flex-col gap-2">
								<Button
									variant="outline"
									size="sm"
									className="h-8 min-w-32 text-[11px]"
									onClick={markInProgress}
									disabled={status === "in_progress"}
								>
									Mark In Progress
								</Button>
								<Button
									size="sm"
									className="h-8 min-w-32 text-[11px]"
									onClick={markResolved}
									disabled={status === "resolved"}
								>
									Mark Resolved
								</Button>
							</div>
						</div>
					</PanelSection>
				</div>
			</ScrollArea>

			<EdiViewerDialog
				open={ediOpen}
				onOpenChange={setEdiOpen}
				fixture={exception.ediFixture}
				fileName={exception.fileName}
				title={`EDI · ${exception.fileName}`}
			/>
		</div>
	);
}

"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { ArrowLeft, Download, Eye, FileText, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	assignClaimException,
	resolveClaimException,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import { useClaimExceptionsQuery } from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { Link } from "@/i18n/navigation";
import { isClaimVendorFilesMockEnabled, isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

function DetailRows({
	rows,
}: {
	rows: Array<[string, React.ReactNode, string?]>;
}) {
	return (
		<dl className="space-y-2 text-xs">
			{rows.map(([label, value, className]) => (
				<div key={label} className="grid grid-cols-[128px_minmax(0,1fr)] gap-3">
					<dt className="text-muted-foreground">{label}</dt>
					<dd className={cn("min-w-0 font-medium", className)}>{value}</dd>
				</div>
			))}
		</dl>
	);
}

function DetailCard({
	title,
	children,
	className,
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Card className={cn("gap-0 py-0 shadow-sm", className)}>
			<CardHeader className="border-b border-border/60 px-4 py-3">
				<CardTitle className="text-sm font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-4">{children}</CardContent>
		</Card>
	);
}

export function ExceptionDetailPage() {
	const { exceptionId } = useParams<{ exceptionId: string }>();
	const exceptionsQ = useClaimExceptionsQuery();
	const exception = (exceptionsQ.data ?? []).find(
		(row) => row.id === decodeURIComponent(exceptionId)
	);
	const [busy, setBusy] = useState(false);
	const useLive = !(isMockEnabled() || isClaimVendorFilesMockEnabled());

	if (!exception) {
		return (
			<div className="space-y-3">
				<p className="text-sm text-destructive">Exception not found.</p>
				<Button asChild variant="outline" size="sm">
					<Link href="/admin/claim-encounter/exceptions">
						Back to Exceptions
					</Link>
				</Button>
			</div>
		);
	}

	const isError = exception.severity === "error";
	const exceptionKey = exception.id;
	const resolutionNotes = exception.resolutionNotes || undefined;

	async function handleAssign() {
		if (!useLive) {
			toast.message("Assignment opened");
			return;
		}
		setBusy(true);
		try {
			await assignClaimException(exceptionKey, { assigned_to_id: null });
			toast.success("Exception assignment updated");
			await exceptionsQ.refetch();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Assign failed");
		} finally {
			setBusy(false);
		}
	}

	async function handleResolve() {
		if (!useLive) {
			toast.success("Exception marked resolved");
			return;
		}
		setBusy(true);
		try {
			await resolveClaimException(exceptionKey, resolutionNotes);
			toast.success("Exception marked resolved");
			await exceptionsQ.refetch();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Resolve failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-2">
					<Button asChild variant="outline" size="sm" className="h-8">
						<Link href="/admin/claim-encounter/exceptions">
							<ArrowLeft className="mr-1.5 size-3.5" />
							Back to Exceptions / Rejections
						</Link>
					</Button>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-xl font-semibold tracking-tight">
								Error Diagnostic Detail
							</h1>
							<span
								className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-semibold",
									isError
										? "bg-red-100 text-red-800"
										: "bg-amber-100 text-amber-900"
								)}
							>
								{isError ? "High" : "Medium"}
							</span>
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							Error Category:{" "}
							<span className="font-medium text-foreground">
								{exception.category}
							</span>
							<span className="px-2">·</span>
							Error Code:{" "}
							<span className="font-medium text-foreground">
								{exception.code}
							</span>
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline" size="sm">
						<Link
							href={`/admin/claim-encounter/claims/${encodeURIComponent(exception.claimId ?? "clm-1")}`}
						>
							<Eye className="mr-1.5 size-3.5" /> View Claim
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => toast.message("Opening EDI segment viewer")}
					>
						<FileText className="mr-1.5 size-3.5" /> View EDI Segment
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={busy}
						onClick={() => void handleAssign()}
					>
						<UserRound className="mr-1.5 size-3.5" /> Assign
					</Button>
					<Button
						size="sm"
						onClick={() => toast.success("Resolution note added")}
					>
						Add Resolution Note
					</Button>
				</div>
			</div>

			<Card className="gap-0 py-0 shadow-sm">
				<CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
					{[
						["Claim ID", exception.claimId ?? "—"],
						["Service Line", String(exception.serviceLine)],
						["Member", `${exception.memberName} · ${exception.memberId}`],
						["Provider", exception.provider],
						["DOS", exception.dateOfService],
						["Received Date", exception.detectedAt],
						["Source", exception.source],
						["Status", exception.status.replace("_", " ")],
						["Validation Result", "Failed"],
						["Severity", isError ? "High" : "Medium"],
					].map(([label, value]) => (
						<div key={label} className="min-w-0">
							<p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
								{label}
							</p>
							<p
								className={cn(
									"mt-1 truncate text-xs font-semibold capitalize",
									label === "Severity" &&
										(isError ? "text-red-700" : "text-amber-700")
								)}
							>
								{value}
							</p>
						</div>
					))}
				</CardContent>
			</Card>

			<div className="grid gap-3 xl:grid-cols-3">
				<DetailCard title="Error Details">
					<DetailRows
						rows={[
							["Error Category", exception.category],
							["Error Code", exception.code],
							["Description", exception.message],
							["Location", exception.loopSegment],
							["Segment / Element", exception.element],
							["Claim Type", exception.source],
							["Rule ID", exception.ruleId],
							[
								"Severity",
								<span key="severity" className="text-red-700">
									{isError ? "High" : "Medium"}
								</span>,
							],
						]}
					/>
				</DetailCard>
				<DetailCard title="Diagnostic Detail">
					<DetailRows
						rows={[
							["What failed", exception.whatFailed],
							["Received Value", exception.receivedValue, "text-red-600"],
							["Expected Value", exception.expectedValue],
							["Why it matters", exception.whyItMatters],
							["Recommended Action", exception.recommendedAction],
							[
								"Responsible Party",
								<span
									key="responsible-party"
									className="inline-flex items-center gap-1"
								>
									<UserRound className="size-3" />
									{exception.responsibleParty}
								</span>,
							],
						]}
					/>
				</DetailCard>
				<DetailCard title={`EDI Segment Viewer (${exception.loopSegment})`}>
					<pre className="rounded-md border border-border bg-muted/30 p-3 font-mono text-[11px] leading-6">
						{exception.ediSnippet}
					</pre>
					<DetailRows
						rows={[
							["Element", exception.element],
							["Description", exception.elementDescription],
							["Usage", exception.usage],
							["Max Use", String(exception.maxUse)],
						]}
					/>
					<Button
						variant="outline"
						size="sm"
						className="mt-3 h-8 text-xs"
						onClick={() => toast.message("Opening full EDI")}
					>
						View Full EDI <Download className="ml-1.5 size-3" />
					</Button>
				</DetailCard>
			</div>

			<div className="grid gap-3 xl:grid-cols-2">
				<DetailCard title="Service Line Information">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Line</TableHead>
								<TableHead>Procedure Code</TableHead>
								<TableHead>Diagnosis Code</TableHead>
								<TableHead>Units</TableHead>
								<TableHead>Charge</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[1, 2].map((line) => (
								<TableRow key={line}>
									<TableCell>{line}</TableCell>
									<TableCell>992{line + 2}</TableCell>
									<TableCell className={line === 1 ? "text-red-600" : ""}>
										{line === 1 ? exception.receivedValue : "I10"}
									</TableCell>
									<TableCell>1</TableCell>
									<TableCell>$1,450.00</TableCell>
									<TableCell>
										<span
											className={
												line === 1 ? "text-red-700" : "text-emerald-700"
											}
										>
											{line === 1 ? "Rejected" : "Accepted"}
										</span>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="mt-3 h-8 text-xs"
					>
						<Link
							href={`/admin/claim-encounter/claims/${encodeURIComponent(exception.claimId ?? "clm-1")}`}
						>
							View All Service Lines
						</Link>
					</Button>
				</DetailCard>
				<DetailCard title="Error History">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date / Time</TableHead>
								<TableHead>Source</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Notes</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[
								"Validation Engine",
								"Business Rules",
								"Reprocessing",
								"Manual Review",
							].map((source, index) => (
								<TableRow key={source}>
									<TableCell className="text-xs">
										{exception.detectedAt}
									</TableCell>
									<TableCell>{source}</TableCell>
									<TableCell>
										<span
											className={index < 3 ? "text-red-700" : "text-amber-700"}
										>
											{index < 3 ? "Failed" : "In Progress"}
										</span>
									</TableCell>
									<TableCell className="text-xs">
										{index === 0 ? exception.whatFailed : "Error persists"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<Button
						variant="outline"
						size="sm"
						className="mt-3 h-8 text-xs"
						onClick={() => toast.message("Full history opened")}
					>
						View Full History
					</Button>
				</DetailCard>
			</div>

			<DetailCard title="Resolution & Workflow">
				<div className="grid gap-4 lg:grid-cols-[1fr_minmax(180px,0.7fr)_auto]">
					<div className="flex flex-wrap items-center gap-3 text-xs">
						{["New", "Assigned", "In Progress", "Resolved", "Closed"].map(
							(step, index) => (
								<div key={step} className="flex items-center gap-2">
									<span
										className={cn(
											"flex size-7 items-center justify-center rounded-full",
											index < 3
												? "bg-primary/10 text-primary"
												: "bg-muted text-muted-foreground"
										)}
									>
										{index + 1}
									</span>
									<span className="font-medium">{step}</span>
								</div>
							)
						)}
					</div>
					<DetailRows
						rows={[
							["Resolution Notes", exception.resolutionNotes || "—"],
							["Resolved By", "—"],
							["Resolved Date", "—"],
						]}
					/>
					<Button disabled={busy} onClick={() => void handleResolve()}>
						Mark Resolved
					</Button>
				</div>
			</DetailCard>
		</div>
	);
}

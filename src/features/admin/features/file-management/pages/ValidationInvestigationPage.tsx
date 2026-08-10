"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowDownLeft,
	ArrowLeft,
	ArrowUpRight,
	CheckCircle2,
	Copy,
	Download,
	FileDown,
	FileText,
	Info,
	ListOrdered,
	MessageSquarePlus,
	MinusCircle,
	ScrollText,
	User,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { displayRunStatus, getValidationIssue } from "../mock-data";

function SummaryItem({
	label,
	value,
	icon,
}: {
	label: string;
	value: ReactNode;
	icon?: ReactNode;
}) {
	return (
		<div className="min-w-0 flex-1 basis-0 px-4 py-3">
			<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
				{label}
			</p>
			<div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
				{icon}
				<span className="truncate">{value}</span>
			</div>
		</div>
	);
}

function Panel({
	title,
	children,
	className,
}: {
	title: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			<div className="border-b border-border/50 px-3 py-2">
				<h2 className="text-sm font-medium">{title}</h2>
			</div>
			<div className="p-3">{children}</div>
		</section>
	);
}

export function ValidationInvestigationPage() {
	const params = useParams<{ runId: string; issueId: string }>();
	const { run, issue } = useMemo(
		() => getValidationIssue(params.runId, params.issueId),
		[params.runId, params.issueId]
	);
	const [notes, setNotes] = useState("");
	const [status, setStatus] = useState<"open" | "in_progress" | "resolved">(
		() => issue?.status ?? "open"
	);

	if (!run || !issue) {
		return (
			<div className="space-y-4">
				<Link
					href={`/admin/file-monitoring/${params.runId}`}
					className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Back to File Run Details
				</Link>
				<div className="rounded-lg border border-border/50 p-10 text-center">
					<p className="text-base font-medium">Investigation not found</p>
					<Button asChild className="mt-4" size="sm">
						<Link href={`/admin/file-monitoring/${params.runId}`}>
							Return to run details
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const steps = [
		{ n: 1, title: "Error Summary", body: issue.message },
		{
			n: 2,
			title: "Received Value",
			highlight: issue.receivedValue,
			field: issue.field,
		},
		{ n: 3, title: "Expected Value", body: issue.expectedValue ?? "—" },
		{ n: 4, title: "Validation Rule", body: issue.validationRule ?? "—" },
		{
			n: 5,
			title: "Recommended Resolution",
			bullets: issue.resolutionSteps?.length
				? issue.resolutionSteps
				: issue.recommendedResolution
					? [issue.recommendedResolution]
					: ["—"],
		},
		{
			n: 6,
			title: "Related Information",
			body: issue.relatedInformation ?? "—",
			mono: true,
		},
	];

	const contextFields = issue.contextFields ?? [
		{
			label: "Subscriber Name",
			value: issue.memberContext?.subscriberName ?? "—",
		},
		{
			label: "Date of Birth",
			value: issue.memberContext?.dateOfBirth ?? "—",
		},
		{ label: "Gender", value: issue.memberContext?.gender ?? "—" },
		{
			label: "Member ID",
			value: issue.memberContext?.memberId ?? issue.memberId ?? "—",
		},
		{
			label: "Group Number",
			value: issue.memberContext?.groupNumber ?? "—",
		},
		{
			label: "Coverage Start",
			value: issue.memberContext?.coverageStart ?? "—",
		},
		{
			label: "Coverage End",
			value: issue.memberContext?.coverageEnd ?? "—",
		},
	];

	function copyGuid() {
		if (!run) return;
		void navigator.clipboard.writeText(run.correlationId);
		toast.success("Run GUID copied");
	}

	function handleExport() {
		toast.success("Error details exported");
	}

	function handleDownload(type: "file" | "log") {
		toast.success(
			type === "file"
				? "Original file download started"
				: "Log download started"
		);
	}

	return (
		<div className="space-y-3 pb-20">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<h1 className="text-base font-medium tracking-tight">
						Validation Error Investigation
					</h1>
					<p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
						Review error details, related context, and recommended resolution to
						determine next steps.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="outline" size="sm" className="h-8 text-xs" asChild>
						<Link href={`/admin/file-monitoring/${run.id}/processing-logs`}>
							<ListOrdered className="mr-1.5 size-3.5" />
							View Processing Log
						</Link>
					</Button>
					<Button variant="outline" size="sm" className="h-8 text-xs" asChild>
						<Link href={`/admin/file-monitoring/${run.id}`}>
							<ArrowLeft className="mr-1.5 size-3.5" />
							Back to File Run Details
						</Link>
					</Button>
				</div>
			</div>

			{/* Summary bar */}
			<div className="rounded-lg border border-border/50 bg-card">
				<div className="flex w-full divide-x divide-border/40">
					<SummaryItem
						label="File Type"
						value={run.fileType}
						icon={<FileText className="size-3.5 shrink-0 text-primary" />}
					/>
					<SummaryItem
						label="File Name"
						value={
							<span className="font-mono text-xs font-medium">
								{run.fileName ?? "—"}
							</span>
						}
					/>
					<SummaryItem
						label="Run GUID"
						value={
							<button
								type="button"
								onClick={copyGuid}
								className="inline-flex max-w-full min-w-0 items-center gap-1 font-mono text-xs hover:text-primary"
							>
								<span className="truncate">{run.correlationId}</span>
								<Copy className="size-3 shrink-0" />
							</button>
						}
					/>
					<SummaryItem
						label="Member ID"
						value={
							<span className="font-mono text-xs font-medium">
								{issue.memberId ?? "—"}
							</span>
						}
					/>
					<SummaryItem label="Line Number" value={issue.line ?? "—"} />
					<SummaryItem label="Field Name" value={issue.field ?? "—"} />
					<SummaryItem
						label="Error Code"
						value={
							<span className="font-mono text-xs font-medium">
								{issue.code}
							</span>
						}
					/>
					<SummaryItem
						label="Severity"
						value={
							issue.severity === "error" ? (
								<span className="inline-flex items-center gap-1 text-red-700">
									<XCircle className="size-3" />
									Error
								</span>
							) : (
								<span className="inline-flex items-center gap-1 text-amber-700">
									<AlertTriangle className="size-3" />
									Warning
								</span>
							)
						}
					/>
					<SummaryItem
						label="Status"
						value={
							<span
								className={cn(
									"inline-flex items-center gap-1 capitalize",
									status === "resolved" ? "text-emerald-700" : "text-red-700"
								)}
							>
								<span
									className={cn(
										"size-1.5 rounded-full",
										status === "resolved" ? "bg-emerald-500" : "bg-red-500"
									)}
								/>
								{status === "open" ? "Open" : status.replace(/_/g, " ")}
							</span>
						}
					/>
				</div>
			</div>

			{/* Three-column main area */}
			<div className="grid gap-2 xl:grid-cols-12">
				{/* Left — Investigation Workspace */}
				<div className="space-y-0 xl:col-span-5">
					<Panel title="Investigation Workspace">
						<ol className="space-y-4">
							{steps.map((step) => (
								<li key={step.n} className="flex gap-2.5">
									<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
										{step.n}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs font-medium">{step.title}</p>
										{step.highlight !== undefined ? (
											<p className="mt-1 text-xs text-muted-foreground">
												Field: {step.field ?? "—"}{" "}
												<span className="rounded bg-red-100 px-1 py-0.5 font-mono text-[10px] text-red-800 dark:bg-red-950 dark:text-red-200">
													[{step.highlight ?? "—"}]
												</span>
											</p>
										) : step.bullets ? (
											<ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
												{step.bullets.map((b) => (
													<li key={b}>{b}</li>
												))}
											</ul>
										) : (
											<p
												className={cn(
													"mt-1 text-xs leading-relaxed text-muted-foreground",
													step.mono && "font-mono text-[10px]"
												)}
											>
												{step.body}
											</p>
										)}
									</div>
								</li>
							))}
						</ol>
					</Panel>
				</div>

				{/* Middle — Member + Record context */}
				<div className="space-y-2 xl:col-span-4">
					<Panel title={issue.contextTitle ?? "Member Context"}>
						<div className="space-y-1.5 text-xs">
							{contextFields.map((row) => (
								<div
									key={row.label}
									className="flex items-start justify-between gap-2 border-b border-border/30 pb-1.5 last:border-0"
								>
									<span className="text-muted-foreground">{row.label}</span>
									<span className="max-w-[58%] text-right font-normal break-words">
										{row.value || "—"}
									</span>
								</div>
							))}
						</div>
					</Panel>

					<Panel title={`Record Context (Line ${issue.line ?? "—"})`}>
						<pre className="overflow-x-auto rounded-md border border-border/40 bg-muted/25 p-2 font-mono text-[10px] leading-5">
							{(
								issue.recordSnippet ?? ["No raw record snippet available."]
							).map((line) => {
								const highlight =
									!!issue.receivedValue &&
									line.includes(String(issue.receivedValue));
								return (
									<div
										key={line}
										className={cn(
											"rounded px-0.5",
											highlight &&
												"bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100"
										)}
									>
										{line}
									</div>
								);
							})}
						</pre>
					</Panel>
				</div>

				{/* Right — Processing info + log */}
				<div className="space-y-2 xl:col-span-3">
					<Panel title="Processing Information">
						<div className="space-y-1.5 text-xs">
							<div className="flex justify-between gap-2">
								<span className="text-muted-foreground">Direction</span>
								<span className="inline-flex items-center gap-1 font-normal">
									{run.direction === "inbound" ? (
										<>
											<ArrowDownLeft className="size-3 text-sky-600" />
											Incoming
										</>
									) : (
										<>
											<ArrowUpRight className="size-3 text-violet-600" />
											Outgoing
										</>
									)}
								</span>
							</div>
							<div className="flex justify-between gap-2">
								<span className="text-muted-foreground">Run Date/Time</span>
								<span className="font-normal tabular-nums">
									{run.startedAt ?? run.expectedAt}
								</span>
							</div>
							<div className="flex justify-between gap-2">
								<span className="text-muted-foreground">Records</span>
								<span className="font-normal tabular-nums">
									{(run.records ?? 0).toLocaleString()} /{" "}
									{(run.recordsLoaded ?? 0).toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between gap-2">
								<span className="text-muted-foreground">Errors / Warnings</span>
								<span className="font-normal tabular-nums">
									<span className="text-red-700">{run.errorCount}</span>
									{" / "}
									<span className="text-amber-700">{run.warningCount}</span>
								</span>
							</div>
							<div className="flex justify-between gap-2">
								<span className="text-muted-foreground">Duration</span>
								<span className="font-normal">{run.duration ?? "—"}</span>
							</div>
							<div className="flex justify-between gap-2">
								<span className="text-muted-foreground">Status</span>
								<span className="inline-flex items-center gap-1 font-normal text-red-700">
									<span className="size-1.5 rounded-full bg-red-500" />
									{displayRunStatus(run.status)}
								</span>
							</div>
						</div>
					</Panel>

					<Panel title="Processing Log">
						<ol className="space-y-0">
							{run.logs.slice(0, 6).map((log, index) => {
								const isLast = index === Math.min(5, run.logs.length - 1);
								return (
									<li
										key={log.id}
										className="relative flex gap-2 pb-2.5 last:pb-0"
									>
										{!isLast && (
											<span className="absolute top-4 left-[5px] h-[calc(100%-6px)] w-px bg-border" />
										)}
										<div className="relative z-10 mt-0.5 shrink-0 bg-card">
											{log.level === "error" ? (
												<XCircle className="size-3.5 text-red-600" />
											) : log.level === "warn" ? (
												<AlertTriangle className="size-3.5 text-amber-600" />
											) : log.level === "debug" ? (
												<MinusCircle className="size-3.5 text-muted-foreground" />
											) : (
												<Info className="size-3.5 text-sky-600" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="font-mono text-[10px] tabular-nums text-muted-foreground">
												{log.at}
											</p>
											<p className="mt-0.5 text-xs leading-snug">
												{log.message}
											</p>
										</div>
									</li>
								);
							})}
						</ol>
					</Panel>
				</div>
			</div>

			{/* Bottom — Resolution notes + Investigation history */}
			<div className="grid gap-2 xl:grid-cols-2">
				<Panel title="Resolution Notes">
					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
						placeholder="Add notes about your investigation, findings, and actions taken…"
						className="min-h-28 resize-none text-xs"
					/>
					<div className="mt-1.5 flex justify-end">
						<span className="text-[10px] text-muted-foreground">
							{notes.length} / 2000
						</span>
					</div>
				</Panel>

				<section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					<div className="border-b border-border/50 px-3 py-2">
						<h2 className="text-sm font-medium">Investigation History</h2>
					</div>
					<div className="overflow-x-auto">
						<Table className="text-xs">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-8 pl-3 font-normal">
										Date/Time
									</TableHead>
									<TableHead className="h-8 font-normal">User</TableHead>
									<TableHead className="h-8 font-normal">Action</TableHead>
									<TableHead className="h-8 pr-3 font-normal">Notes</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(issue.investigationHistory ?? []).map((entry) => (
									<TableRow key={entry.id}>
										<TableCell className="py-1.5 pl-3 font-mono text-[10px] tabular-nums text-muted-foreground">
											{entry.at}
										</TableCell>
										<TableCell className="py-1.5">
											<span className="inline-flex items-center gap-1">
												<User className="size-3 text-muted-foreground" />
												{entry.user}
											</span>
										</TableCell>
										<TableCell className="py-1.5">{entry.action}</TableCell>
										<TableCell className="py-1.5 pr-3 text-muted-foreground">
											{entry.notes ?? "—"}
										</TableCell>
									</TableRow>
								))}
								{(issue.investigationHistory ?? []).length === 0 && (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-14 text-center text-muted-foreground"
										>
											No investigation history yet.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</section>
			</div>

			{/* Footer action bar */}
			<div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/50 bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
				<div className="mx-auto flex w-full flex-wrap items-center justify-between gap-2">
					<Button variant="outline" size="sm" className="h-8 text-xs" asChild>
						<Link href={`/admin/file-monitoring/${run.id}`}>
							<ArrowLeft className="mr-1.5 size-3.5" />
							Back to File Run Details
						</Link>
					</Button>
					<div className="flex flex-wrap items-center gap-1.5">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={() => handleDownload("file")}
						>
							<Download className="mr-1.5 size-3.5" />
							Download Original File
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={() => handleDownload("log")}
						>
							<ScrollText className="mr-1.5 size-3.5" />
							Download Log
						</Button>
						<Button variant="outline" size="sm" className="h-8 text-xs" asChild>
							<Link href={`/admin/file-monitoring/${run.id}/processing-logs`}>
								<ListOrdered className="mr-1.5 size-3.5" />
								View Processing Log
							</Link>
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={handleExport}
						>
							<FileDown className="mr-1.5 size-3.5" />
							Export Error Details
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={() => {
								setStatus((s) => (s === "open" ? "in_progress" : s));
								toast.success("Resolution note added.");
							}}
						>
							<MessageSquarePlus className="mr-1.5 size-3.5" />
							Add Resolution Note
						</Button>
						<Button
							size="sm"
							className="h-8 text-xs"
							onClick={() => {
								setStatus("resolved");
								toast.success("Error marked as reviewed.");
							}}
						>
							<CheckCircle2 className="mr-1.5 size-3.5" />
							Mark as Reviewed
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

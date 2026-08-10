"use client";

import { useParams, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowDown,
	ArrowDownLeft,
	ArrowDownToLine,
	ArrowLeft,
	Check,
	CheckCircle2,
	ClipboardCopy,
	Copy,
	Download,
	ExternalLink,
	FileText,
	Filter,
	Info,
	RotateCcw,
	Search,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	FILE_RUNS,
	type FileRun,
	type LogEntry,
	displayRunStatus,
	getFileRun,
	markFileRunReviewed,
} from "@/features/admin/features/file-management/mock-data";
import {
	type ProcessingLogRow,
	processingEventsToLogs,
	validationResultsToLogs,
} from "@/features/admin/features/file-management/live-processing";
import { inboundFileToRun } from "@/features/admin/features/dashboard/live-file-runs";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import {
	useVendorCoreInboundFile,
	useVendorCoreInboundFileEvents,
	useVendorCoreInboundFiles,
	useVendorCoreValidationResults,
	useVendorCoreVendors,
} from "@/lib/vendor-core/hooks";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type LogSource = "File Receiver" | "Parser" | "Validation" | "Processor";

type ViewerLog = ProcessingLogRow;

function pad2(n: number) {
	return String(n).padStart(2, "0");
}

function formatTime12h(h: number, m: number, s: number) {
	const period = h >= 12 ? "PM" : "AM";
	const hour12 = h % 12 || 12;
	return `${pad2(hour12)}:${pad2(m)}:${pad2(s)} ${period}`;
}

function formatProcessDateTime(run: FileRun) {
	const raw = run.startedAt ?? run.expectedAt;
	if (!raw) return "—";
	if (raw.includes("T")) {
		const date = new Date(raw);
		if (!Number.isNaN(date.getTime())) {
			return date.toLocaleString(undefined, {
				month: "2-digit",
				day: "2-digit",
				year: "numeric",
				hour: "numeric",
				minute: "2-digit",
				second: "2-digit",
			});
		}
	}
	const [datePart, timePart] = raw.split(" ");
	if (!datePart || !timePart) return raw;
	const [y, mo, d] = datePart.split("-");
	const [h, mi] = timePart.split(":").map(Number);
	const period = (h ?? 0) >= 12 ? "PM" : "AM";
	const hour12 = (h ?? 0) % 12 || 12;
	return `${mo}/${d}/${y} ${hour12}:${pad2(mi ?? 0)} ${period}`;
}

function buildTimestamp(
	datePart: string,
	h: number,
	m: number,
	s: number
): { display: string; sort: number } {
	return {
		display: formatTime12h(h, m, s),
		sort: h * 3600 + m * 60 + s,
	};
}

function seedLogsForRun(run: FileRun): ViewerLog[] {
	const datePart = (run.startedAt ?? run.expectedAt).slice(0, 10);
	const start = run.startedAt ?? run.expectedAt;
	const timeBits = start.includes(" ")
		? start.split(" ")[1]!.split(":").map(Number)
		: [6, 0, 0];
	let h = timeBits[0] ?? 6;
	let m = timeBits[1] ?? 0;
	let s = timeBits[2] ?? 0;

	const next = (addSec = 1) => {
		s += addSec;
		while (s >= 60) {
			s -= 60;
			m += 1;
		}
		while (m >= 60) {
			m -= 60;
			h += 1;
		}
		return buildTimestamp(datePart, h, m, s);
	};

	const logs: ViewerLog[] = [];
	const push = (
		level: LogEntry["level"],
		source: LogSource,
		message: string,
		opts: {
			relatedRecord?: string | null;
			errorCode?: string;
			memberId?: string;
			lineNumber?: number;
			addSec?: number;
		} = {}
	) => {
		const ts = next(opts.addSec ?? 1);
		logs.push({
			id: `${run.id}-v-${logs.length + 1}`,
			timestamp: ts.display,
			timeSort: ts.sort,
			level,
			source,
			message,
			relatedRecord: opts.relatedRecord ?? null,
			errorCode: opts.errorCode,
			memberId: opts.memberId,
			lineNumber: opts.lineNumber,
		});
	};

	push("info", "File Receiver", "File received successfully", { addSec: 0 });
	push("info", "File Receiver", "Checksum verification started");
	push("info", "File Receiver", "Checksum verified");
	push("info", "Parser", "Parsing control segments");
	push("info", "Parser", "Parsing ISA / header segment");
	push(
		"info",
		"Parser",
		`Header parse complete — ${(run.records ?? 0).toLocaleString()} records detected`
	);
	push("info", "Validation", "File validation started");
	push("info", "Validation", "Schema validation started");

	for (const step of run.pipeline) {
		const level =
			step.status === "failed"
				? "error"
				: step.status === "running"
					? "warn"
					: "info";
		push(level, "Processor", `Pipeline step: ${step.label}`, {
			relatedRecord: step.detail ? null : null,
		});
	}

	for (const issue of run.issues) {
		if (issue.severity === "error" || issue.severity === "warning") {
			push(
				issue.severity === "error" ? "warn" : "warn",
				"Validation",
				`Reference check: ${issue.message}`,
				{
					relatedRecord: issue.memberId ?? null,
					memberId: issue.memberId,
					lineNumber: issue.line,
				}
			);
		}
		if (issue.severity === "error") {
			push("error", "Validation", issue.message, {
				relatedRecord: issue.memberId ?? null,
				errorCode: issue.code,
				memberId: issue.memberId,
				lineNumber: issue.line,
			});
			push("info", "Processor", "Row quarantined", {
				relatedRecord: issue.memberId ?? null,
				memberId: issue.memberId,
				lineNumber: issue.line,
			});
		} else if (issue.severity === "warning") {
			push("warn", "Validation", issue.message, {
				relatedRecord: issue.memberId ?? null,
				errorCode: issue.code,
				memberId: issue.memberId,
				lineNumber: issue.line,
			});
		}
	}

	const fillers: Array<[LogEntry["level"], LogSource, string, string | null]> =
		[
			["info", "Processor", "Business rules evaluation started", null],
			["info", "Processor", "Cross-reference lookup complete", "MBR-100234"],
			["info", "Parser", "Segment buffer flushed", null],
			["info", "File Receiver", "Watch folder poll complete", null],
			["info", "Processor", "Quarantine store write", null],
			["warn", "Validation", "Soft validation threshold approaching", null],
			["info", "Processor", "Partial commit checkpoint", "MBR-100235"],
			["info", "Parser", "Character encoding detected (UTF-8)", null],
			["info", "Validation", "Companion guide checks applied", null],
			["info", "Processor", "Downstream handoff prepared", null],
			["warn", "Validation", "Missing optional segment REF", "MBR-100236"],
			["info", "Processor", "Duplicate detection scan", "MBR-100237"],
			[
				"error",
				"Validation",
				"Invalid date format in segment DTP*356",
				"MBR-100234",
			],
			["info", "File Receiver", "Archive copy stored", null],
			["debug", "Parser", "Token stream checkpoint", null],
		];

	let i = 0;
	while (logs.length < 128) {
		const [level, source, message, relatedRecord] =
			fillers[i % fillers.length]!;
		push(level, source, message, { relatedRecord });
		i += 1;
	}

	push(
		run.errorCount > 0 ? "error" : "info",
		"Processor",
		run.errorCount > 0
			? "File processing completed with errors"
			: "File processing completed successfully",
		{ addSec: 3 }
	);

	return logs;
}

const LOG_CACHE = new Map<string, ViewerLog[]>();

function logsForRun(run: FileRun): ViewerLog[] {
	const cached = LOG_CACHE.get(run.id);
	if (cached) return cached;
	const built = seedLogsForRun(run);
	LOG_CACHE.set(run.id, built);
	return built;
}

function LevelCell({ level }: { level: LogEntry["level"] }) {
	if (level === "error") {
		return (
			<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
				<XCircle className="size-3.5 shrink-0" />
				ERROR
			</span>
		);
	}
	if (level === "warn") {
		return (
			<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
				<AlertTriangle className="size-3.5 shrink-0" />
				WARNING
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600">
			<Info className="size-3.5 shrink-0" />
			INFO
		</span>
	);
}

function RunStatus({ status }: { status: FileRun["status"] }) {
	const label = displayRunStatus(status);
	if (label === "Success") {
		return (
			<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
				<CheckCircle2 className="size-4 text-emerald-600" />
				Success
			</span>
		);
	}
	if (label === "Failed") {
		return (
			<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
				<XCircle className="size-4 text-red-600" />
				Failed
			</span>
		);
	}
	if (label === "Warning") {
		return (
			<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600">
				<AlertTriangle className="size-4 text-amber-500" />
				Warning
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
			{label}
		</span>
	);
}

function MetaField({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-0">
			<p className="text-[11px] font-medium text-muted-foreground">{label}</p>
			<div className="mt-0.5 truncate text-sm font-semibold text-foreground">
				{value}
			</div>
		</div>
	);
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-3 border-b border-border/40 py-2 last:border-0">
			<span className="shrink-0 text-xs text-muted-foreground">{label}</span>
			<span className="min-w-0 text-right text-xs font-medium">{value}</span>
		</div>
	);
}

function downloadTextFile(
	filename: string,
	content: string,
	mime = "text/plain"
) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

const outlineBtn =
	"h-9 border-primary/30 bg-card text-primary hover:bg-primary/5 hover:text-primary";

export function ProcessingLogsPage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Processing logs">
				<ProcessingLogsBody />
			</VendorCoreGate>
		);
	}
	return <ProcessingLogsBody />;
}

function ProcessingLogsBody() {
	const useLive = !isMockEnabled();
	const params = useParams();
	const searchParams = useSearchParams();
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const runIdFromPath = typeof params?.runId === "string" ? params.runId : null;
	const runFilter = runIdFromPath ?? searchParams.get("run");
	const filesQ = useVendorCoreInboundFiles();
	const fileQ = useVendorCoreInboundFile(
		useLive && runFilter ? runFilter : ""
	);
	const eventsQ = useVendorCoreInboundFileEvents(
		useLive && runFilter ? runFilter : ""
	);
	const validationQ = useVendorCoreValidationResults(
		useLive && runFilter ? { inbound_file_id: runFilter } : undefined
	);
	const vendorsQ = useVendorCoreVendors();
	const nameById = useMemo(
		() => new Map((vendorsQ.data ?? []).map((v) => [v.id, v.name])),
		[vendorsQ.data]
	);

	const programRuns = FILE_RUNS.filter((r) => r.program === programFilter);
	const mockRun =
		(runFilter ? getFileRun(runFilter) : undefined) ??
		programRuns.find((r) => r.status === "failed") ??
		programRuns[0] ??
		FILE_RUNS[0]!;

	const liveRun = useMemo(() => {
		if (!useLive) return undefined;
		const id = runFilter ?? filesQ.data?.[0]?.id;
		if (!id) return undefined;
		const file =
			fileQ.data ?? filesQ.data?.find((candidate) => candidate.id === id);
		if (!file) return undefined;
		return inboundFileToRun(file, nameById);
	}, [useLive, runFilter, fileQ.data, filesQ.data, nameById]);

	const run = useLive ? liveRun : mockRun;

	const runHref = run ? `/admin/file-monitoring/${run.id}` : "/admin/file-monitoring";
	const firstErrorIssue = run?.issues.find((i) => i.severity === "error");
	const investigationHref = run
		? firstErrorIssue
			? `/admin/file-monitoring/${run.id}/investigate/${firstErrorIssue.id}`
			: runHref
		: "/admin/file-monitoring";

	const logDataSource = useMemo(() => {
		if (!useLive) return "mock" as const;
		if ((eventsQ.data?.length ?? 0) > 0) return "events" as const;
		if ((validationQ.data?.length ?? 0) > 0) return "validation" as const;
		return "empty" as const;
	}, [useLive, eventsQ.data, validationQ.data]);

	const allLogs = useMemo(() => {
		if (!run) return [];
		if (!useLive) return logsForRun(run);
		const eventLogs = processingEventsToLogs(eventsQ.data ?? []);
		if (eventLogs.length > 0) return eventLogs;
		return validationResultsToLogs(validationQ.data ?? []);
	}, [run, useLive, eventsQ.data, validationQ.data]);

	const [reviewed, setReviewed] = useState(false);
	const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 50;

	const [draftQuery, setDraftQuery] = useState("");
	const [draftLevel, setDraftLevel] = useState("all");
	const [draftSection, setDraftSection] = useState("all");
	const [draftTimeRange, setDraftTimeRange] = useState("entire");

	const [query, setQuery] = useState("");
	const [level, setLevel] = useState("all");
	const [section, setSection] = useState("all");
	const [timeRange, setTimeRange] = useState("entire");

	useEffect(() => {
		if (!run) return;
		setReviewed(run.reviewed);
		const logs = useLive
			? (() => {
					const eventLogs = processingEventsToLogs(eventsQ.data ?? []);
					return eventLogs.length > 0
						? eventLogs
						: validationResultsToLogs(validationQ.data ?? []);
				})()
			: logsForRun(run);
		setSelectedLogId(
			logs.find((l) => l.level === "error")?.id ?? logs[0]?.id ?? null
		);
		setPage(1);
	}, [run, useLive, eventsQ.data, validationQ.data]);

	const filtered = useMemo(() => {
		if (!run) return [];
		const q = query.trim().toLowerCase();
		const minSort =
			timeRange === "first5"
				? (allLogs[0]?.timeSort ?? 0)
				: timeRange === "last5"
					? (allLogs[allLogs.length - 1]?.timeSort ?? 0) - 300
					: 0;
		const maxSort =
			timeRange === "first5" ? (allLogs[0]?.timeSort ?? 0) + 300 : Infinity;

		return allLogs.filter((log) => {
			if (level !== "all" && log.level !== level) return false;
			if (section !== "all" && log.source !== section) return false;
			if (timeRange === "first5" && log.timeSort > maxSort) return false;
			if (timeRange === "last5" && log.timeSort < minSort) return false;
			if (!q) return true;
			return [
				log.message,
				log.source,
				log.relatedRecord,
				log.errorCode,
				log.memberId,
				run.correlationId,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [allLogs, level, query, run, section, timeRange]);

	const summary = useMemo(() => {
		const errors = allLogs.filter((l) => l.level === "error");
		const warnings = allLogs.filter((l) => l.level === "warn");
		const infos = allLogs.filter((l) => l.level === "info");
		const firstError = errors[0];
		const lastEvent = allLogs[allLogs.length - 1];
		return {
			total: allLogs.length,
			info: infos.length,
			warnings: warnings.length,
			errors: errors.length,
			firstErrorTime: firstError?.timestamp ?? "—",
			lastEventTime: lastEvent?.timestamp ?? "—",
		};
	}, [allLogs]);

	if (
		useLive &&
		(filesQ.isLoading ||
			(runFilter && fileQ.isLoading) ||
			(runFilter && eventsQ.isLoading) ||
			(runFilter && validationQ.isLoading)) &&
		!run
	) {
		return (
			<div className="space-y-4 p-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!run) {
		return (
			<div className="space-y-4 p-6">
				<h1 className="text-xl font-semibold">Processing Log Viewer</h1>
				<p className="text-sm text-muted-foreground">
					No inbound files found. Open a file run from{" "}
					<Link href="/admin/file-monitoring" className="text-primary underline">
						File Monitoring
					</Link>
					.
				</p>
				{(eventsQ.error ?? filesQ.error) ? (
					<p className="text-sm text-destructive">
						{(eventsQ.error ?? filesQ.error)?.message}
					</p>
				) : null}
			</div>
		);
	}

	const fileRun = run;

	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

	const selectedLog =
		filtered.find((l) => l.id === selectedLogId) ??
		allLogs.find((l) => l.id === selectedLogId) ??
		pageRows[0] ??
		allLogs[0] ??
		null;

	function applyFilters() {
		setQuery(draftQuery);
		setLevel(draftLevel);
		setSection(draftSection);
		setTimeRange(draftTimeRange);
		setPage(1);
	}

	function clearFilters() {
		setDraftQuery("");
		setDraftLevel("all");
		setDraftSection("all");
		setDraftTimeRange("entire");
		setQuery("");
		setLevel("all");
		setSection("all");
		setTimeRange("entire");
		setPage(1);
	}

	function copyLog() {
		const text = filtered
			.map(
				(l) =>
					`${l.timestamp}\t${l.level.toUpperCase()}\t${l.source}\t${l.message}\t${l.relatedRecord ?? ""}`
			)
			.join("\n");
		void navigator.clipboard.writeText(text);
		toast.success("Log copied to clipboard");
	}

	function downloadLog() {
		const text = filtered
			.map(
				(l) =>
					`[${l.timestamp}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}${l.relatedRecord ? ` | ${l.relatedRecord}` : ""}`
			)
			.join("\n");
		downloadTextFile(`${fileRun.runId}-processing.log`, text);
		toast.success("Log download started");
	}

	function exportLogResults() {
		const header =
			"timestamp,level,source,message,related_record,error_code,member_id,line";
		const rows = filtered.map((l) =>
			[
				l.timestamp,
				l.level,
				l.source,
				`"${l.message.replace(/"/g, '""')}"`,
				l.relatedRecord ?? "",
				l.errorCode ?? "",
				l.memberId ?? "",
				l.lineNumber ?? "",
			].join(",")
		);
		downloadTextFile(
			`${fileRun.runId}-log-export.csv`,
			[header, ...rows].join("\n"),
			"text/csv"
		);
		toast.success("Log results exported");
	}

	return (
		<div className="space-y-5 pb-4">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-primary">
						<Link href="/admin/file-monitoring" className="hover:underline">
							File Monitoring
						</Link>
						<span className="text-muted-foreground">&gt;</span>
						<Link
							href="/admin/file-monitoring/select"
							className="hover:underline"
						>
							Select
						</Link>
						<span className="text-muted-foreground">&gt;</span>
						<Link href={runHref} className="hover:underline">
							File Run Details
						</Link>
						<span className="text-muted-foreground">&gt;</span>
						<span className="text-foreground">Processing Log</span>
					</nav>
					<div className="mt-2 flex items-center gap-3">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
							4
						</div>
						<div>
							<h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
								Processing Log Viewer
							</h1>
							<p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
								(From &quot;View Processing Log&quot;)
							</p>
						</div>
					</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					className={cn(outlineBtn, "shrink-0")}
					asChild
				>
					<Link href={runHref} className="inline-flex items-center gap-1.5">
						<ArrowLeft className="size-3.5 shrink-0" />
						Back to File Run Details
					</Link>
				</Button>
			</div>

			{/* Metadata summary */}
			<div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
				<div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-5">
					<MetaField label="Vendor" value={run.vendor} />
					<MetaField label="Account" value={run.account} />
					<MetaField label="File Type" value={run.fileType} />
					<MetaField
						label="File Name"
						value={
							<span className="font-mono text-xs font-semibold">
								{run.fileName ?? "—"}
							</span>
						}
					/>
					<MetaField
						label="Run GUID"
						value={
							<span className="font-mono text-xs font-semibold">
								{run.correlationId}
							</span>
						}
					/>
				</div>
				<div className="mt-4 grid gap-x-6 gap-y-4 border-t border-border/40 pt-4 sm:grid-cols-2 lg:grid-cols-4">
					<MetaField
						label="Direction"
						value={
							<span className="inline-flex items-center gap-1.5 text-sky-600">
								{run.direction === "inbound" ? (
									<>
										<ArrowDownLeft className="size-3.5" />
										Incoming
									</>
								) : (
									<>
										<ArrowDownToLine className="size-3.5 rotate-180" />
										Outgoing
									</>
								)}
							</span>
						}
					/>
					<MetaField label="Status" value={<RunStatus status={run.status} />} />
					<MetaField
						label="Process Date/Time"
						value={formatProcessDateTime(run)}
					/>
					<MetaField
						label="Duration"
						value={
							<span className="font-mono tabular-nums">
								{run.duration ?? "—"}
							</span>
						}
					/>
				</div>
			</div>

			{useLive && eventsQ.error ? (
				<div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Could not load processing events: {eventsQ.error.message}
				</div>
			) : null}

			{useLive &&
			!eventsQ.isLoading &&
			!validationQ.isLoading &&
			logDataSource === "validation" ? (
				<div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
					No processing events were returned for this file. Showing validation
					results from the API instead.
				</div>
			) : null}

			{useLive &&
			!eventsQ.isLoading &&
			!validationQ.isLoading &&
			logDataSource === "empty" ? (
				<div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
					No processing events or validation results exist for this inbound file
					yet. Run{" "}
					<code className="rounded bg-muted px-1 py-0.5 text-xs">
						pnpm seed:inbound-processing
					</code>{" "}
					(after vendor-core seed endpoints are deployed), or wait for the
					intake pipeline to record events.
				</div>
			) : null}

			{/* Filters */}
			<div className="flex flex-wrap items-end gap-3">
				<div className="min-w-[220px] flex-1">
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={draftQuery}
							onChange={(e) => setDraftQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && applyFilters()}
							placeholder="Search log text, member ID, error code, or Run GUID"
							className="h-10 border-border/60 bg-card pl-9 text-sm"
						/>
					</div>
				</div>

				<div className="space-y-1">
					<Label className="text-[11px] font-medium text-muted-foreground">
						Log Level
					</Label>
					<Select value={draftLevel} onValueChange={setDraftLevel}>
						<SelectTrigger className="h-10 w-[120px] border-border/60 bg-card text-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="info">Info</SelectItem>
							<SelectItem value="warn">Warning</SelectItem>
							<SelectItem value="error">Error</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label className="text-[11px] font-medium text-muted-foreground">
						Section
					</Label>
					<Select value={draftSection} onValueChange={setDraftSection}>
						<SelectTrigger className="h-10 w-[140px] border-border/60 bg-card text-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="File Receiver">File Receiver</SelectItem>
							<SelectItem value="Parser">Parser</SelectItem>
							<SelectItem value="Validation">Validation</SelectItem>
							<SelectItem value="Processor">Processor</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label className="text-[11px] font-medium text-muted-foreground">
						Time Range
					</Label>
					<Select value={draftTimeRange} onValueChange={setDraftTimeRange}>
						<SelectTrigger className="h-10 w-[140px] border-border/60 bg-card text-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="entire">Entire Run</SelectItem>
							<SelectItem value="first5">First 5 min</SelectItem>
							<SelectItem value="last5">Last 5 min</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						size="sm"
						className="h-10 gap-1.5 px-4"
						onClick={applyFilters}
					>
						<Filter className="size-3.5" />
						Apply Filters
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={outlineBtn}
						onClick={clearFilters}
					>
						<RotateCcw className="size-3.5" />
						Clear
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={outlineBtn}
						onClick={copyLog}
					>
						<ClipboardCopy className="size-3.5" />
						Copy Log
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={outlineBtn}
						onClick={downloadLog}
					>
						<Download className="size-3.5" />
						Download Log
					</Button>
				</div>
			</div>

			{/* Main content: table + sidebar */}
			<div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
				{/* Log entries table */}
				<div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
					<div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
						<h2 className="text-sm font-semibold text-primary">
							Processing Log Entries
						</h2>
						<span className="text-xs text-muted-foreground">
							{filtered.length} entries
						</span>
					</div>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
									<TableHead className="h-10 pl-4 text-xs font-semibold text-foreground sm:pl-5">
										<span className="inline-flex items-center gap-1">
											Time
											<ArrowDown className="size-3 text-muted-foreground" />
										</span>
									</TableHead>
									<TableHead className="h-10 text-xs font-semibold text-foreground">
										Level
									</TableHead>
									<TableHead className="h-10 text-xs font-semibold text-foreground">
										Source
									</TableHead>
									<TableHead className="h-10 text-xs font-semibold text-foreground">
										Message
									</TableHead>
									<TableHead className="h-10 pr-4 text-xs font-semibold text-foreground sm:pr-5">
										Related Record
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((row) => {
									const isSelected = row.id === selectedLog?.id;
									return (
										<TableRow
											key={row.id}
											className={cn(
												"cursor-pointer border-b border-border/30 text-sm",
												isSelected
													? "bg-sky-50 hover:bg-sky-50"
													: "hover:bg-muted/20"
											)}
											onClick={() => setSelectedLogId(row.id)}
										>
											<TableCell className="pl-4 font-mono text-xs tabular-nums text-muted-foreground sm:pl-5">
												{row.timestamp}
											</TableCell>
											<TableCell>
												<LevelCell level={row.level} />
											</TableCell>
											<TableCell className="text-xs font-medium">
												{row.source}
											</TableCell>
											<TableCell className="max-w-[280px] text-xs">
												{row.message}
											</TableCell>
											<TableCell className="pr-4 font-mono text-xs text-muted-foreground sm:pr-5">
												{row.relatedRecord ?? "—"}
											</TableCell>
										</TableRow>
									);
								})}
								{pageRows.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-24 text-center text-sm text-muted-foreground"
										>
											{useLive &&
											(eventsQ.isLoading || validationQ.isLoading) ? (
												"Loading log entries from vendor-core…"
											) : useLive &&
											  logDataSource === "empty" &&
											  !query &&
											  level === "all" &&
											  section === "all" ? (
												"No log entries returned from vendor-core for this file."
											) : (
												"No log entries match the current filters."
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3 sm:px-5">
						<span className="text-xs text-muted-foreground">
							Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
							{Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
							entries
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								className="h-8 w-8 p-0"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								‹
							</Button>
							{Array.from(
								{ length: Math.min(pageCount, 5) },
								(_, i) => i + 1
							).map((p) => (
								<Button
									key={p}
									variant={p === page ? "default" : "outline"}
									size="sm"
									className="h-8 w-8 p-0"
									onClick={() => setPage(p)}
								>
									{p}
								</Button>
							))}
							<Button
								variant="outline"
								size="sm"
								className="h-8 w-8 p-0"
								disabled={page >= pageCount}
								onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
							>
								›
							</Button>
						</div>
					</div>
				</div>

				{/* Right sidebar */}
				<div className="space-y-4 md:sticky md:top-0 md:self-start">
					<Card className="gap-0 border-border/60 py-0 shadow-sm">
						<CardHeader className="border-b border-border/40 px-4 py-3">
							<CardTitle className="text-sm font-semibold text-primary">
								Log Summary
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-0 px-4 py-2">
							<DetailRow label="Total Entries" value={summary.total} />
							<DetailRow label="Info" value={summary.info} />
							<DetailRow label="Warnings" value={summary.warnings} />
							<DetailRow
								label="Errors"
								value={
									<span className="font-semibold text-red-600">
										{summary.errors}
									</span>
								}
							/>
							<DetailRow
								label="First Error Time"
								value={summary.firstErrorTime}
							/>
							<DetailRow
								label="Last Event Time"
								value={summary.lastEventTime}
							/>
						</CardContent>
					</Card>

					<Card className="gap-0 border-border/60 py-0 shadow-sm">
						<CardHeader className="border-b border-border/40 px-4 py-3">
							<CardTitle className="text-sm font-semibold text-primary">
								Selected Log Details
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-0 px-4 py-2">
							{selectedLog ? (
								<>
									<DetailRow label="Timestamp" value={selectedLog.timestamp} />
									<DetailRow
										label="Level"
										value={
											selectedLog.level === "error" ? (
												<span className="inline-flex items-center gap-1 text-red-600">
													<XCircle className="size-3" />
													Error
												</span>
											) : selectedLog.level === "warn" ? (
												<span className="inline-flex items-center gap-1 text-amber-600">
													<AlertTriangle className="size-3" />
													Warning
												</span>
											) : (
												<span className="inline-flex items-center gap-1 text-sky-600">
													<Info className="size-3" />
													Info
												</span>
											)
										}
									/>
									<DetailRow label="Source" value={selectedLog.source} />
									<DetailRow
										label="Error Code"
										value={
											<span className="font-mono">
												{selectedLog.errorCode ?? "—"}
											</span>
										}
									/>
									<DetailRow
										label="Member ID"
										value={
											<span className="font-mono">
												{selectedLog.memberId ?? "—"}
											</span>
										}
									/>
									<DetailRow
										label="Line Number"
										value={selectedLog.lineNumber ?? "—"}
									/>
									<DetailRow label="Message" value={selectedLog.message} />
									<DetailRow
										label="Related File"
										value={
											<span className="font-mono text-[11px]">
												{run.fileName ?? "—"}
											</span>
										}
									/>
									<DetailRow
										label="Run GUID"
										value={
											<span className="font-mono text-[10px] leading-tight">
												{run.correlationId}
											</span>
										}
									/>
								</>
							) : (
								<p className="py-4 text-xs text-muted-foreground">
									Select a log entry to view details.
								</p>
							)}
						</CardContent>
					</Card>

					<Card className="gap-0 border-border/60 py-0 shadow-sm">
						<CardHeader className="border-b border-border/40 px-4 py-3">
							<CardTitle className="text-sm font-semibold text-primary">
								Related Actions
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 px-4 py-3">
							<Button
								variant="outline"
								size="sm"
								className={cn(outlineBtn, "h-9 w-full justify-start gap-2")}
								asChild
							>
								<Link href={investigationHref}>
									<ExternalLink className="size-3.5" />
									Open Investigation
								</Link>
							</Button>
							<Button
								variant="outline"
								size="sm"
								className={cn(outlineBtn, "h-9 w-full justify-start gap-2")}
								onClick={() => toast.message("Raw record viewer opened.")}
							>
								<FileText className="size-3.5" />
								View Raw Record
							</Button>
							<Button
								variant="outline"
								size="sm"
								className={cn(outlineBtn, "h-9 w-full justify-start gap-2")}
								onClick={exportLogResults}
							>
								<Copy className="size-3.5" />
								Export Matching Entries
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Bottom action bar */}
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm">
				<Button variant="outline" size="sm" className={outlineBtn} asChild>
					<Link href={runHref} className="inline-flex items-center gap-1.5">
						<ArrowLeft className="size-3.5" />
						Back to File Run Details
					</Link>
				</Button>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className={outlineBtn}
						onClick={() => toast.message("Original file download started.")}
					>
						<Download className="size-3.5" />
						Download Original File
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={outlineBtn}
						onClick={downloadLog}
					>
						<Download className="size-3.5" />
						Download Log
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={outlineBtn}
						onClick={exportLogResults}
					>
						<Download className="size-3.5" />
						Export Log Results
					</Button>
					<Button variant="outline" size="sm" className={outlineBtn} asChild>
						<Link
							href={investigationHref}
							className="inline-flex items-center gap-1.5"
						>
							<ExternalLink className="size-3.5" />
							Open Investigation
						</Link>
					</Button>
					<Button
						size="sm"
						className="h-9 gap-1.5 px-4"
						disabled={reviewed}
						onClick={() => {
							markFileRunReviewed(run.id, true);
							setReviewed(true);
							toast.success("File run marked as reviewed.");
						}}
					>
						<Check className="size-3.5" />
						{reviewed ? "Reviewed" : "Mark as Reviewed"}
					</Button>
				</div>
			</div>
		</div>
	);
}

"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	FileUp,
	Filter,
	Info,
	Radio,
	RefreshCw,
	Search,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	FILE_RUNS,
	displayRunStatus,
} from "@/features/admin/features/file-management/mock-data";
import {
	VENDOR_ALERTS,
	vendorIdForRun,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";
import type { ProgramFileType } from "@/types/UI/system.types";

type EventType =
	| "file_arrival"
	| "processing_complete"
	| "error"
	| "alert"
	| "status_change";

type Severity = "error" | "warning" | "info" | "success";

type TimelineEvent = {
	id: string;
	type: EventType;
	severity: Severity;
	timestamp: string;
	vendor: string;
	vendorId?: string | null;
	message: string;
	runId?: string;
	fileRunId?: string;
};

function eventIcon(type: EventType) {
	if (type === "file_arrival") return FileUp;
	if (type === "processing_complete") return CheckCircle2;
	if (type === "error") return XCircle;
	if (type === "alert") return AlertTriangle;
	return Info;
}

function severityTone(severity: Severity) {
	if (severity === "error") return "bg-red-500/10 text-red-700";
	if (severity === "warning") return "bg-amber-500/10 text-amber-700";
	if (severity === "success") return "bg-emerald-500/10 text-emerald-700";
	return "bg-sky-500/10 text-sky-700";
}

function typeLabel(type: EventType) {
	return type.replaceAll("_", " ");
}

function buildTimelineEvents(program: ProgramFileType): TimelineEvent[] {
	const events: TimelineEvent[] = [];

	for (const run of FILE_RUNS.filter((r) => r.program === program)) {
		const vendorId = vendorIdForRun(run);

		if (run.receivedAt) {
			events.push({
				id: `${run.id}-arrival`,
				type: "file_arrival",
				severity: "info",
				timestamp: run.receivedAt,
				vendor: run.vendor,
				vendorId,
				message: `${run.fileType} file arrived via ${run.protocol}${
					run.fileName ? `: ${run.fileName}` : ""
				}`,
				runId: run.runId,
				fileRunId: run.id,
			});
		}

		if (run.completedAt && run.status === "success") {
			events.push({
				id: `${run.id}-complete`,
				type: "processing_complete",
				severity: "success",
				timestamp: run.completedAt,
				vendor: run.vendor,
				vendorId,
				message: `Processing completed for ${run.runId} (${run.records ?? 0} records)`,
				runId: run.runId,
				fileRunId: run.id,
			});
		}

		if (run.status === "failed" || run.errorCount > 0) {
			events.push({
				id: `${run.id}-error`,
				type: "error",
				severity: "error",
				timestamp: run.completedAt ?? run.startedAt ?? run.expectedAt,
				vendor: run.vendor,
				vendorId,
				message: `${run.runId} reported ${run.errorCount} error(s)${
					run.notes ? ` — ${run.notes}` : ""
				}`,
				runId: run.runId,
				fileRunId: run.id,
			});
		}

		if (
			run.status === "late" ||
			run.status === "warning" ||
			run.status === "missing" ||
			run.status === "processing"
		) {
			events.push({
				id: `${run.id}-status`,
				type: "status_change",
				severity:
					run.status === "processing"
						? "info"
						: run.status === "late" || run.status === "missing"
							? "warning"
							: "warning",
				timestamp: run.startedAt ?? run.expectedAt,
				vendor: run.vendor,
				vendorId,
				message: `Status changed to ${displayRunStatus(run.status)} for ${run.runId}`,
				runId: run.runId,
				fileRunId: run.id,
			});
		}
	}

	for (const alert of VENDOR_ALERTS) {
		events.push({
			id: `alert-${alert.id}`,
			type: "alert",
			severity: alert.severity,
			timestamp: alert.when,
			vendor: alert.vendorName,
			vendorId: alert.vendorId,
			message: alert.title,
			runId: alert.runId,
			fileRunId: alert.runId,
		});
	}

	return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function ActivityFeedPage() {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [search, setSearch] = useState("");
	const [vendor, setVendor] = useState("all");
	const [eventType, setEventType] = useState("all");
	const [severity, setSeverity] = useState("all");
	const [refreshKey, setRefreshKey] = useState(0);
	const [live, setLive] = useState(true);

	const events = useMemo(() => {
		void refreshKey;
		return buildTimelineEvents(programFilter);
	}, [refreshKey, programFilter]);

	const vendors = useMemo(
		() => Array.from(new Set(events.map((event) => event.vendor))).sort(),
		[events]
	);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return events.filter((event) => {
			if (vendor !== "all" && event.vendor !== vendor) return false;
			if (eventType !== "all" && event.type !== eventType) return false;
			if (severity !== "all" && event.severity !== severity) return false;
			if (!query) return true;
			return [event.message, event.vendor, event.type, event.runId ?? ""]
				.join(" ")
				.toLowerCase()
				.includes(query);
		});
	}, [eventType, events, search, severity, vendor]);

	function clearFilters() {
		setSearch("");
		setVendor("all");
		setEventType("all");
		setSeverity("all");
	}

	function refresh() {
		setRefreshKey((key) => key + 1);
		setLive(true);
		toast.success("Command Center refreshed.");
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Command Center
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Live operational timeline across file arrivals, processing outcomes,
						alerts, and status changes.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{live ? (
						<Badge className="h-9 gap-1.5 border border-emerald-500/20 bg-emerald-500/10 px-3 text-emerald-700 hover:bg-emerald-500/10">
							<span className="relative flex size-2">
								<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
								<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
							</span>
							Live
						</Badge>
					) : (
						<Badge variant="outline" className="h-9 gap-1.5 px-3">
							<Radio className="size-3.5" />
							Paused
						</Badge>
					)}
					<Button variant="outline" size="sm" className="h-9" onClick={refresh}>
						<RefreshCw className="mr-1.5 size-3.5" />
						Refresh
					</Button>
				</div>
			</div>

			<Card className="border border-primary/15 bg-gradient-to-r from-primary/[0.05] via-card to-sky-50/60 gap-0 py-0">
				<CardContent className="flex flex-col gap-1.5 px-3 py-2">
					<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
						<Filter className="size-3.5 text-primary" />
						Filters
					</div>
					<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
						<div className="space-y-1 2xl:col-span-2">
							<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Search
							</label>
							<div className="relative">
								<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Message, vendor, run ID..."
									className="h-9 pl-8"
								/>
							</div>
						</div>
						<div className="space-y-1">
							<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Vendor
							</label>
							<Select value={vendor} onValueChange={setVendor}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Vendor" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All vendors</SelectItem>
									{vendors.map((item) => (
										<SelectItem key={item} value={item}>
											{item}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Type
							</label>
							<Select value={eventType} onValueChange={setEventType}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All types</SelectItem>
									<SelectItem value="file_arrival">File arrival</SelectItem>
									<SelectItem value="processing_complete">
										Processing complete
									</SelectItem>
									<SelectItem value="error">Error</SelectItem>
									<SelectItem value="alert">Alert</SelectItem>
									<SelectItem value="status_change">Status change</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Severity
							</label>
							<Select value={severity} onValueChange={setSeverity}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Severity" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All severities</SelectItem>
									<SelectItem value="error">Error</SelectItem>
									<SelectItem value="warning">Warning</SelectItem>
									<SelectItem value="info">Info</SelectItem>
									<SelectItem value="success">Success</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-end gap-2 2xl:col-span-2">
							<Button className="h-9 flex-1">Apply filters</Button>
							<Button variant="ghost" className="h-9" onClick={clearFilters}>
								Clear
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="rounded-xl border border-border/50 bg-card/70 p-4">
				<p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{filtered.length} event{filtered.length === 1 ? "" : "s"}
				</p>
				<div className="relative space-y-0">
					<div className="absolute top-2 bottom-2 left-[19px] w-px bg-border/70" />
					{filtered.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No events match the current filters.
						</p>
					) : (
						filtered.map((event) => {
							const Icon = eventIcon(event.type);
							return (
								<div
									key={event.id}
									className="relative flex gap-4 pb-5 last:pb-0"
								>
									<div
										className={cn(
											"relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-background shadow-sm",
											severityTone(event.severity)
										)}
									>
										<Icon className="size-4" />
									</div>
									<div className="min-w-0 flex-1 rounded-lg border border-border/50 bg-background/50 px-3 py-3">
										<div className="flex flex-wrap items-start justify-between gap-2">
											<div className="min-w-0 space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<span className="text-xs font-medium capitalize text-muted-foreground">
														{typeLabel(event.type)}
													</span>
													<span
														className={cn(
															"inline-flex rounded-full px-1.5 py-0 text-[10px] font-medium capitalize",
															severityTone(event.severity)
														)}
													>
														{event.severity}
													</span>
												</div>
												<p className="text-sm font-medium leading-snug">
													{event.message}
												</p>
												<p className="text-xs text-muted-foreground">
													{event.timestamp}
													<span className="mx-1.5 text-border">·</span>
													{event.vendorId ? (
														<Link
															href={`/admin/vendors/${event.vendorId}`}
															className="text-primary hover:underline"
														>
															{event.vendor}
														</Link>
													) : (
														event.vendor
													)}
												</p>
											</div>
											{event.fileRunId ? (
												<Button
													asChild
													variant="ghost"
													size="sm"
													className="h-8 shrink-0"
												>
													<Link
														href={`/admin/file-monitoring/${event.fileRunId}`}
													>
														View run
														<ArrowRight className="ml-1.5 size-3.5" />
													</Link>
												</Button>
											) : null}
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}

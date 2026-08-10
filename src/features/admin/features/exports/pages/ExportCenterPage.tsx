"use client";

import { useMemo, useState } from "react";

import {
	CalendarClock,
	Download,
	FileSpreadsheet,
	FileText,
	Loader2,
	Plus,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ExportType = "CSV" | "PDF" | "XLSX";
type ExportStatus = "ready" | "running" | "failed";

type PastExport = {
	id: string;
	name: string;
	type: ExportType;
	createdAt: string;
	status: ExportStatus;
	size: string;
	schedule?: string;
};

type ScheduledExport = {
	id: string;
	name: string;
	description: string;
	cadence: string;
	format: ExportType;
	enabled: boolean;
	nextRun: string;
};

const INITIAL_EXPORTS: PastExport[] = [
	{
		id: "exp-1",
		name: "Vendor portfolio snapshot",
		type: "XLSX",
		createdAt: "2026-07-29 08:12",
		status: "ready",
		size: "2.4 MB",
	},
	{
		id: "exp-2",
		name: "File monitoring errors",
		type: "CSV",
		createdAt: "2026-07-28 16:40",
		status: "ready",
		size: "840 KB",
	},
	{
		id: "exp-3",
		name: "Monthly SLA summary",
		type: "PDF",
		createdAt: "2026-07-28 09:05",
		status: "ready",
		size: "1.1 MB",
		schedule: "Monthly",
	},
	{
		id: "exp-4",
		name: "Invoice aging report",
		type: "CSV",
		createdAt: "2026-07-27 14:22",
		status: "failed",
		size: "—",
	},
	{
		id: "exp-5",
		name: "Weekly vendor report",
		type: "PDF",
		createdAt: "2026-07-27 07:00",
		status: "ready",
		size: "960 KB",
		schedule: "Weekly",
	},
	{
		id: "exp-6",
		name: "Onboarding queue export",
		type: "XLSX",
		createdAt: "2026-07-26 11:18",
		status: "running",
		size: "—",
	},
];

const INITIAL_SCHEDULES: ScheduledExport[] = [
	{
		id: "sched-1",
		name: "Weekly vendor report",
		description: "Health, file success rate, and open alerts by vendor.",
		cadence: "Every Monday 7:00 AM",
		format: "PDF",
		enabled: true,
		nextRun: "Aug 3, 2026",
	},
	{
		id: "sched-2",
		name: "Monthly SLA summary",
		description: "Latency, breach counts, and recovery trends across feeds.",
		cadence: "1st of each month",
		format: "PDF",
		enabled: true,
		nextRun: "Aug 1, 2026",
	},
];

function statusTone(status: ExportStatus) {
	if (status === "ready") return "bg-emerald-500/10 text-emerald-700";
	if (status === "running") return "bg-sky-500/10 text-sky-700";
	return "bg-red-500/10 text-red-700";
}

function typeIcon(type: ExportType) {
	if (type === "PDF") return FileText;
	return FileSpreadsheet;
}

export function ExportCenterPage() {
	const [exports, setExports] = useState<PastExport[]>(INITIAL_EXPORTS);
	const [schedules, setSchedules] =
		useState<ScheduledExport[]>(INITIAL_SCHEDULES);

	const summary = useMemo(() => {
		const ready = exports.filter((item) => item.status === "ready").length;
		const running = exports.filter((item) => item.status === "running").length;
		const failed = exports.filter((item) => item.status === "failed").length;
		const scheduled = schedules.filter((item) => item.enabled).length;
		return { ready, running, failed, scheduled };
	}, [exports, schedules]);

	function toggleSchedule(id: string) {
		setSchedules((prev) =>
			prev.map((item) => {
				if (item.id !== id) return item;
				const enabled = !item.enabled;
				toast.success(
					enabled
						? `"${item.name}" schedule enabled.`
						: `"${item.name}" schedule paused.`
				);
				return { ...item, enabled };
			})
		);
	}

	function reDownload(item: PastExport) {
		if (item.status !== "ready") {
			toast.error("Export is not ready to download yet.");
			return;
		}
		toast.success(`Re-download started for "${item.name}".`);
	}

	function createExport() {
		const id = `exp-${Date.now()}`;
		const running: PastExport = {
			id,
			name: "Ad-hoc operations export",
			type: "CSV",
			createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
			status: "running",
			size: "—",
		};
		setExports((prev) => [running, ...prev]);
		toast.message("New export started…");

		window.setTimeout(() => {
			setExports((prev) =>
				prev.map((item) =>
					item.id === id ? { ...item, status: "ready", size: "1.3 MB" } : item
				)
			);
			toast.success("Export ready for download.");
		}, 1600);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Export Center
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Generate, schedule, and re-download operational reports across
						vendors and file monitoring.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button size="sm" className="h-9" onClick={createExport}>
						<Plus className="mr-1.5 size-3.5" />
						New export
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{
						label: "Ready",
						value: summary.ready,
						hint: "Available downloads",
						icon: Download,
						tone: "text-emerald-700 bg-emerald-500/10",
					},
					{
						label: "Running",
						value: summary.running,
						hint: "In progress",
						icon: Loader2,
						tone: "text-sky-700 bg-sky-500/10",
					},
					{
						label: "Failed",
						value: summary.failed,
						hint: "Needs retry",
						icon: XCircle,
						tone: "text-red-700 bg-red-500/10",
					},
					{
						label: "Scheduled",
						value: summary.scheduled,
						hint: "Active recurring jobs",
						icon: CalendarClock,
						tone: "text-primary bg-primary/10",
					},
				].map((item) => {
					const Icon = item.icon;
					return (
						<div
							key={item.label}
							className="rounded-xl border border-border/50 bg-card/70 p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{item.label}
									</p>
									<p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
										{item.value}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{item.hint}
									</p>
								</div>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg",
										item.tone
									)}
								>
									<Icon className="size-4" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<section className="space-y-4">
				<div>
					<h2 className="text-base font-semibold tracking-tight">
						Scheduled exports
					</h2>
					<p className="text-sm text-muted-foreground">
						Recurring deliveries that land in Export Center automatically.
					</p>
				</div>
				<div className="grid gap-3 md:grid-cols-2">
					{schedules.map((item) => (
						<Card
							key={item.id}
							className="gap-0 border-border/50 bg-card/70 py-0"
						>
							<CardContent className="flex flex-col gap-4 px-4 py-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 space-y-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-medium">{item.name}</p>
											<span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
												{item.format}
											</span>
										</div>
										<p className="text-sm text-muted-foreground">
											{item.description}
										</p>
										<p className="text-xs text-muted-foreground">
											{item.cadence} · Next {item.nextRun}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Label
											htmlFor={`sched-${item.id}`}
											className="text-xs text-muted-foreground"
										>
											{item.enabled ? "On" : "Off"}
										</Label>
										<Switch
											id={`sched-${item.id}`}
											checked={item.enabled}
											onCheckedChange={() => toggleSchedule(item.id)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Card className="min-w-0 gap-2 bg-card/70 py-4">
				<CardHeader className="px-4 pb-1 pt-0">
					<CardTitle className="text-base">Past exports</CardTitle>
				</CardHeader>
				<CardContent className="px-4">
					<div className="overflow-x-auto rounded-lg border border-border/50">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Size</TableHead>
									<TableHead>Schedule</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{exports.map((item) => {
									const TypeIcon = typeIcon(item.type);
									return (
										<TableRow key={item.id}>
											<TableCell className="font-medium">{item.name}</TableCell>
											<TableCell>
												<span className="inline-flex items-center gap-1.5 text-sm">
													<TypeIcon className="size-3.5 text-muted-foreground" />
													{item.type}
												</span>
											</TableCell>
											<TableCell className="tabular-nums text-muted-foreground">
												{item.createdAt}
											</TableCell>
											<TableCell>
												<span
													className={cn(
														"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
														statusTone(item.status)
													)}
												>
													{item.status === "running" ? (
														<Loader2 className="size-3 animate-spin" />
													) : null}
													{item.status}
												</span>
											</TableCell>
											<TableCell className="tabular-nums text-muted-foreground">
												{item.size}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{item.schedule ?? "—"}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="outline"
													size="sm"
													className="h-8"
													disabled={item.status !== "ready"}
													onClick={() => reDownload(item)}
												>
													<Download className="mr-1.5 size-3.5" />
													Re-download
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

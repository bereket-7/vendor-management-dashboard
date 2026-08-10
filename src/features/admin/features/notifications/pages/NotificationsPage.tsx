"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	Bell,
	CheckCircle2,
	Download,
	Filter,
	Info,
	RefreshCw,
	Search,
	XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { FILE_RUNS } from "@/features/admin/features/file-management/mock-data";
import { VENDOR_ALERTS } from "@/features/admin/features/vendors/vendor-integration-mock";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type NotificationRow = {
	id: string;
	title: string;
	vendorName: string;
	severity: "error" | "warning" | "info";
	when: string;
	runId?: string;
	channel: "In-app" | "Email" | "Ops Queue";
	status: "New" | "Acknowledged" | "Escalated";
	audience: string;
};

function severityIcon(severity: NotificationRow["severity"]) {
	if (severity === "error") return XCircle;
	if (severity === "warning") return AlertTriangle;
	return Info;
}

function severityTone(severity: NotificationRow["severity"]) {
	if (severity === "error") return "bg-red-500/10 text-red-700";
	if (severity === "warning") return "bg-amber-500/10 text-amber-700";
	return "bg-sky-500/10 text-sky-700";
}

export function NotificationsPage() {
	const [search, setSearch] = useState("");
	const [severity, setSeverity] = useState("all");
	const [channel, setChannel] = useState("all");

	const notifications = useMemo<NotificationRow[]>(
		() =>
			VENDOR_ALERTS.map((alert, index) => ({
				id: alert.id,
				title: alert.title,
				vendorName: alert.vendorName,
				severity: alert.severity,
				when: alert.when,
				runId: alert.runId,
				channel:
					index % 3 === 0 ? "In-app" : index % 3 === 1 ? "Email" : "Ops Queue",
				status:
					index % 3 === 0
						? "New"
						: index % 3 === 1
							? "Acknowledged"
							: "Escalated",
				audience:
					alert.severity === "error"
						? "Ops + Vendor Manager"
						: alert.severity === "warning"
							? "Operations"
							: "Treasury / AP",
			})),
		[]
	);

	const filteredNotifications = useMemo(() => {
		const query = search.trim().toLowerCase();
		return notifications.filter((item) => {
			if (severity !== "all" && item.severity !== severity) return false;
			if (channel !== "all" && item.channel !== channel) return false;
			if (!query) return true;
			return [item.title, item.vendorName, item.channel, item.audience]
				.join(" ")
				.toLowerCase()
				.includes(query);
		});
	}, [channel, notifications, search, severity]);

	const summary = useMemo(() => {
		const total = filteredNotifications.length;
		const errors = filteredNotifications.filter(
			(item) => item.severity === "error"
		).length;
		const warnings = filteredNotifications.filter(
			(item) => item.severity === "warning"
		).length;
		const unread = filteredNotifications.filter(
			(item) => item.status === "New"
		).length;
		const escalated = filteredNotifications.filter(
			(item) => item.status === "Escalated"
		).length;
		return { total, errors, warnings, unread, escalated };
	}, [filteredNotifications]);

	const programFilter = useAdminModuleStore((s) => s.fileType);
	const recentRuns = FILE_RUNS.filter((r) => r.program === programFilter).slice(
		0,
		4
	);

	function clearFilters() {
		setSearch("");
		setSeverity("all");
		setChannel("all");
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Notifications
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Track operational alerts, acknowledgements, and escalation flow.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild size="sm" className="h-9">
						<Link href="/admin/error-management">Open Error Management</Link>
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<RefreshCw className="mr-1.5 size-3.5" />
						Refresh
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Export notifications
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
									placeholder="Title, vendor, audience..."
									className="h-9 pl-8"
								/>
							</div>
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
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								Channel
							</label>
							<Select value={channel} onValueChange={setChannel}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Channel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All channels</SelectItem>
									<SelectItem value="In-app">In-app</SelectItem>
									<SelectItem value="Email">Email</SelectItem>
									<SelectItem value="Ops Queue">Ops Queue</SelectItem>
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

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{[
					{
						label: "Notifications",
						value: summary.total,
						hint: "Current queue",
						icon: Bell,
						tone: "text-primary bg-primary/10",
					},
					{
						label: "Unread",
						value: summary.unread,
						hint: "Needs triage",
						icon: CheckCircle2,
						tone: "text-sky-700 bg-sky-500/10",
					},
					{
						label: "Errors",
						value: summary.errors,
						hint: "Critical alerts",
						icon: XCircle,
						tone: "text-red-700 bg-red-500/10",
					},
					{
						label: "Warnings",
						value: summary.warnings,
						hint: "Monitor closely",
						icon: AlertTriangle,
						tone: "text-amber-700 bg-amber-500/10",
					},
					{
						label: "Escalated",
						value: summary.escalated,
						hint: "Directed to ops",
						icon: Info,
						tone: "text-violet-700 bg-violet-500/10",
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

			<div className="grid gap-4 xl:grid-cols-5">
				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-3">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">Priority inbox</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-4">
						{filteredNotifications.slice(0, 4).map((item) => {
							const Icon = severityIcon(item.severity);
							return (
								<Link
									key={item.id}
									href={
										item.runId
											? `/admin/file-monitoring/${item.runId}`
											: "/admin/file-monitoring"
									}
									className="block rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:border-primary/30 hover:bg-background"
								>
									<div className="flex items-start gap-3">
										<div
											className={cn(
												"flex size-9 shrink-0 items-center justify-center rounded-lg",
												severityTone(item.severity)
											)}
										>
											<Icon className="size-4" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-2">
												<p className="text-sm font-semibold leading-snug">
													{item.title}
												</p>
												<span className="shrink-0 text-[10px] text-muted-foreground">
													{item.when}
												</span>
											</div>
											<p className="mt-1 text-xs text-muted-foreground">
												{item.vendorName} · {item.channel} · {item.audience}
											</p>
										</div>
									</div>
								</Link>
							);
						})}
					</CardContent>
				</Card>

				<Card className="min-w-0 gap-2 bg-card/70 py-4 xl:col-span-2">
					<CardHeader className="px-4 pb-1 pt-0">
						<CardTitle className="text-base">Recent file events</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 px-4">
						{recentRuns.map((run) => (
							<Link
								key={run.id}
								href={`/admin/file-monitoring/${run.id}`}
								className="block rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:border-primary/30 hover:bg-background"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="truncate text-sm font-semibold">
											{run.fileName ?? run.runId}
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											{run.vendor} · {run.fileType}
										</p>
									</div>
									<span className="shrink-0 text-[10px] text-muted-foreground">
										{run.receivedAt ?? run.expectedAt}
									</span>
								</div>
							</Link>
						))}
					</CardContent>
				</Card>
			</div>

			<Card className="bg-card/70">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<div>
						<CardTitle className="text-base">Notification register</CardTitle>
					</div>
					<p className="text-xs text-muted-foreground">
						Showing {filteredNotifications.length} notifications
					</p>
				</CardHeader>
				<CardContent className="px-0 pb-0">
					<div className="border-t border-border/50">
						<Table>
							<TableHeader>
								<TableRow className="bg-primary/[0.04] hover:bg-primary/[0.04]">
									<TableHead className="pl-4 text-primary sm:pl-6">
										Notification
									</TableHead>
									<TableHead className="text-primary">Severity</TableHead>
									<TableHead className="text-primary">Channel</TableHead>
									<TableHead className="text-primary">Audience</TableHead>
									<TableHead className="text-primary">Status</TableHead>
									<TableHead className="text-primary">When</TableHead>
									<TableHead className="pr-4 text-right text-primary sm:pr-6">
										Open
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredNotifications.map((item) => (
									<TableRow key={item.id} className="hover:bg-muted/30">
										<TableCell className="pl-4 sm:pl-6">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">
													{item.title}
												</p>
												<p className="truncate text-[11px] text-muted-foreground">
													{item.vendorName}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<span
												className={cn(
													"inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
													severityTone(item.severity)
												)}
											>
												{item.severity}
											</span>
										</TableCell>
										<TableCell>{item.channel}</TableCell>
										<TableCell>{item.audience}</TableCell>
										<TableCell>{item.status}</TableCell>
										<TableCell className="text-muted-foreground">
											{item.when}
										</TableCell>
										<TableCell className="pr-4 text-right sm:pr-6">
											<Button variant="ghost" size="sm" asChild>
												<Link
													href={
														item.runId
															? `/admin/file-monitoring/${item.runId}`
															: "/admin/file-monitoring"
													}
												>
													Open
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

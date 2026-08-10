"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
	Activity,
	AlertTriangle,
	Cable,
	CheckCircle2,
	Clock3,
	FileStack,
	Loader2,
	Play,
	RefreshCw,
	ServerCrash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import { cn } from "@/lib/utils";
import {
	type ConnectionDto,
	type ErrorRecordDto,
	type IntakeJobDto,
	type IntakeJobRunDto,
	type MonitoringDashboardDto,
	clearTokens,
	getStoredAccessToken,
	getVendorCoreBaseUrl,
	isVendorCoreLive,
	vendorCoreApi,
	vendorCoreLogin,
} from "@/lib/vendor-core";

function StatCard({
	title,
	value,
	hint,
	icon: Icon,
}: {
	title: string;
	value: string | number;
	hint?: string;
	icon: typeof Activity;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-semibold tracking-tight">{value}</div>
				{hint ? (
					<p className="text-xs text-muted-foreground mt-1">{hint}</p>
				) : null}
			</CardContent>
		</Card>
	);
}

export function IntegrationOverviewPage() {
	const live = isVendorCoreLive();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [monitoring, setMonitoring] = useState<MonitoringDashboardDto | null>(
		null
	);
	const [connections, setConnections] = useState<ConnectionDto[]>([]);
	const [jobs, setJobs] = useState<IntakeJobDto[]>([]);
	const [jobRuns, setJobRuns] = useState<IntakeJobRunDto[]>([]);
	const [errors, setErrors] = useState<ErrorRecordDto[]>([]);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [authed, setAuthed] = useState(false);

	const refresh = useCallback(async () => {
		if (!live) return;
		setLoading(true);
		setError(null);
		try {
			const settled = await Promise.allSettled([
				vendorCoreApi.getMonitoring(),
				vendorCoreApi.listConnections(),
				vendorCoreApi.listIntakeJobs(),
				vendorCoreApi.listIntakeJobRuns(),
				vendorCoreApi.listErrors({ status: "open" }),
			]);

			const [mon, conns, jobPage, runsPage, errPage] = settled;
			const failures: string[] = [];

			if (mon.status === "fulfilled") {
				setMonitoring(mon.value);
			} else {
				failures.push(`monitoring: ${mon.reason?.message ?? mon.reason}`);
			}
			if (conns.status === "fulfilled") {
				setConnections(conns.value.results ?? []);
			} else {
				setConnections([]);
				failures.push(`connections: ${conns.reason?.message ?? conns.reason}`);
			}
			if (jobPage.status === "fulfilled") {
				setJobs(jobPage.value.results ?? []);
			} else {
				setJobs([]);
				failures.push(`intake-jobs: ${jobPage.reason?.message ?? jobPage.reason}`);
			}
			if (runsPage.status === "fulfilled") {
				setJobRuns(runsPage.value.results ?? []);
			} else {
				setJobRuns([]);
				failures.push(
					`intake-job-runs: ${runsPage.reason?.message ?? runsPage.reason}`
				);
			}
			if (errPage.status === "fulfilled") {
				setErrors(errPage.value.results ?? []);
			} else {
				setErrors([]);
				failures.push(`errors: ${errPage.reason?.message ?? errPage.reason}`);
			}

			const authFailed = settled.some((r) => {
				if (r.status !== "rejected") return false;
				const reason = r.reason as { status?: number; message?: string };
				if (reason?.status === 401 || reason?.status === 403) return true;
				const message = String(reason?.message ?? reason).toLowerCase();
				return /401|unauthor|credent/.test(message);
			});
			if (authFailed) {
				setAuthed(false);
				clearTokens();
				setError("Authentication required — sign in with a Django user.");
				return;
			}

			setAuthed(true);
			if (failures.length && mon.status !== "fulfilled") {
				setError(failures.join(" · "));
			} else if (failures.length) {
				// Partial success — keep dashboard usable
				setError(`Some endpoints unavailable: ${failures.join(" · ")}`);
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load vendor-core data";
			setError(message);
			if (
				message.toLowerCase().includes("401") ||
				message.includes("credent")
			) {
				setAuthed(false);
				clearTokens();
			}
		} finally {
			setLoading(false);
		}
	}, [live]);

	useEffect(() => {
		if (!live) return;
		if (getStoredAccessToken()) {
			void refresh();
		}
	}, [live, refresh]);

	const stageTotal = useMemo(() => {
		if (!monitoring) return 0;
		return monitoring.inbound_file_stages.reduce((sum, s) => sum + s.count, 0);
	}, [monitoring]);

	async function onLogin(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			await vendorCoreLogin({ username, password });
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
			setAuthed(false);
		} finally {
			setLoading(false);
		}
	}

	async function onTestConnection(id: string) {
		setLoading(true);
		try {
			await vendorCoreApi.testConnection(id);
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Connection test failed");
		} finally {
			setLoading(false);
		}
	}

	async function onRunJob(id: string) {
		setLoading(true);
		try {
			await vendorCoreApi.runIntakeJob(id);
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Job run failed");
		} finally {
			setLoading(false);
		}
	}

	async function onRetryError(id: string) {
		setLoading(true);
		try {
			await vendorCoreApi.retryError(id);
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Retry failed");
		} finally {
			setLoading(false);
		}
	}

	if (!live) {
		return (
			<div className="space-y-4 p-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Integration & File Intake
					</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Connect this dashboard to{" "}
						<code className="rounded bg-muted px-1">
							vendor-management-core
						</code>{" "}
						to visualize connections, intake jobs, monitoring, and errors.
					</p>
				</div>
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
						<p>
							Set in <code>.env</code>:
						</p>
						<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
							{`NEXT_PUBLIC_VENDOR_CORE_API_URL=https://api.vm.tillahealth.com
# Nest stays mocked; remote vendor-core enables live intake:
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_DEV_ADMIN=true`}
						</pre>
						<p>
							Restart <code>pnpm dev</code>, open this page, and sign in with a
							Django JWT user from{" "}
							<a
								className="underline"
								href="https://api.vm.tillahealth.com/admin/"
								target="_blank"
								rel="noreferrer"
							>
								Django admin
							</a>
							.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!authed && !getStoredAccessToken()) {
		return (
			<div className="mx-auto flex max-w-md flex-col gap-4 p-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Vendor Core API
					</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Sign in to {getVendorCoreBaseUrl()}
					</p>
				</div>
				<form onSubmit={onLogin} className="space-y-4">
					<Input
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="username"
						required
					/>
					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						required
					/>
					{error ? <p className="text-sm text-destructive">{error}</p> : null}
					<Button type="submit" disabled={loading} className="w-full">
						{loading ? (
							<>
								<Loader2 className="animate-spin" /> Connecting…
							</>
						) : (
							"Connect"
						)}
					</Button>
				</form>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Integration & File Intake
					</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Live view of {getVendorCoreBaseUrl()}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => void refresh()}
						disabled={loading}
					>
						<RefreshCw className={cn(loading && "animate-spin")} />
						Refresh
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							clearTokens();
							setAuthed(false);
							setMonitoring(null);
						}}
					>
						Disconnect
					</Button>
				</div>
			</div>

			{error ? (
				<div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
					{error}
				</div>
			) : null}

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Connections"
					value={connections.length}
					hint={`${connections.filter((c) => c.status === "active").length} active`}
					icon={Cable}
				/>
				<StatCard
					title="Active jobs"
					value={monitoring?.active_jobs.length ?? jobs.length}
					hint="Scheduled / enabled intake jobs"
					icon={Clock3}
				/>
				<StatCard
					title="Inbound files"
					value={stageTotal}
					hint="All stages in warehouse"
					icon={FileStack}
				/>
				<StatCard
					title="Open errors"
					value={errors.length}
					hint="Retryable and blocking"
					icon={AlertTriangle}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">File stages</CardTitle>
					</CardHeader>
					<CardContent>
						{monitoring?.inbound_file_stages?.length ? (
							<ul className="space-y-2">
								{monitoring.inbound_file_stages.map((s) => (
									<li
										key={s.stage}
										className="flex items-center justify-between text-sm"
									>
										<span className="capitalize text-muted-foreground">
											{s.stage.replaceAll("_", " ")}
										</span>
										<span className="font-medium">{s.count}</span>
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-muted-foreground">
								No file stage data yet.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Recent job runs</CardTitle>
					</CardHeader>
					<CardContent className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Job</TableHead>
									<TableHead>Stage</TableHead>
									<TableHead>Processed</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{jobRuns.slice(0, 8).map((run) => {
									const jobName =
										jobs.find((j) => j.id === run.job_id)?.name ||
										run.job_id.slice(0, 8);
									return (
										<TableRow key={run.id}>
											<TableCell className="font-medium">{jobName}</TableCell>
											<TableCell>
												<StatusBadge status={run.stage} />
											</TableCell>
											<TableCell>
												{run.files_processed}/{run.files_found}
											</TableCell>
										</TableRow>
									);
								})}
								{!jobRuns.length ? (
									<TableRow>
										<TableCell colSpan={3} className="text-muted-foreground">
											No runs yet — trigger an intake job below.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Connections</CardTitle>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Health</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{connections.map((c) => (
								<TableRow key={c.id}>
									<TableCell className="font-medium">{c.name}</TableCell>
									<TableCell>{c.method}</TableCell>
									<TableCell>
										<StatusBadge status={c.status} />
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{c.health?.current_status ?? "—"}
										{c.health?.last_error ? (
											<span className="block text-destructive">
												{c.health.last_error}
											</span>
										) : null}
									</TableCell>
									<TableCell className="text-right">
										<Button
											size="sm"
											variant="outline"
											onClick={() => void onTestConnection(c.id)}
											disabled={loading}
										>
											<CheckCircle2 />
											Test
										</Button>
									</TableCell>
								</TableRow>
							))}
							{!connections.length ? (
								<TableRow>
									<TableCell colSpan={5} className="text-muted-foreground">
										No connections — run <code>seed_phase1</code> on the API.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Intake jobs</CardTitle>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Schedule</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{jobs.map((job) => (
								<TableRow key={job.id}>
									<TableCell className="font-medium">{job.name}</TableCell>
									<TableCell>{job.file_type}</TableCell>
									<TableCell className="text-xs">
										{job.schedule_cron || "—"}{" "}
										<span className="text-muted-foreground">
											{job.schedule_timezone}
										</span>
									</TableCell>
									<TableCell>
										<StatusBadge status={job.status} />
									</TableCell>
									<TableCell className="text-right">
										<Button
											size="sm"
											onClick={() => void onRunJob(job.id)}
											disabled={loading}
										>
											<Play />
											Run
										</Button>
									</TableCell>
								</TableRow>
							))}
							{!jobs.length ? (
								<TableRow>
									<TableCell colSpan={5} className="text-muted-foreground">
										No intake jobs configured.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<ServerCrash className="size-4" />
						Open errors
					</CardTitle>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Category</TableHead>
								<TableHead>Code</TableHead>
								<TableHead>Message</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{errors.map((err) => (
								<TableRow key={err.id}>
									<TableCell>{err.category}</TableCell>
									<TableCell className="font-mono text-xs">
										{err.code}
									</TableCell>
									<TableCell className="max-w-md truncate text-sm">
										{err.business_explanation || err.technical_message}
									</TableCell>
									<TableCell className="text-right">
										{err.retry_eligible ? (
											<Button
												size="sm"
												variant="outline"
												onClick={() => void onRetryError(err.id)}
												disabled={loading}
											>
												Retry
											</Button>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</TableCell>
								</TableRow>
							))}
							{!errors.length ? (
								<TableRow>
									<TableCell colSpan={4} className="text-muted-foreground">
										No open errors.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

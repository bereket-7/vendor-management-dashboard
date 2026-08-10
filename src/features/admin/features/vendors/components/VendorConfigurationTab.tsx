"use client";

import { useMemo, useState } from "react";

import {
	Bell,
	CheckCircle2,
	Copy,
	FolderOpen,
	KeyRound,
	Lock,
	MoreHorizontal,
	Pencil,
	Plus,
	Server,
	Settings2,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	type VendorConfigJob,
	type VendorIntegrationProfile,
	getVendorConfigJobs,
	getVendorSftpConnection,
} from "@/features/admin/features/vendors/vendor-integration-mock";
import { cn } from "@/lib/utils";

const JOB_SUBTABS = [
	"Jobs",
	"File Mapping",
	"Schedules",
	"Alerts",
	"PGP / Encryption",
] as const;

const FILE_TYPES = [
	"Eligibility (834)",
	"Medical Claims (837)",
	"Pharmacy Claims (835)",
	"Accumulator",
] as const;

type JobSubtab = (typeof JOB_SUBTABS)[number];
type JobDialogMode = "create" | "edit" | "view";

type JobDraft = {
	name: string;
	fileType: string;
	direction: VendorConfigJob["direction"];
	frequency: VendorConfigJob["frequency"];
	status: VendorConfigJob["status"];
};

type VendorConfigurationTabProps = {
	vendorId: string;
	vendorName: string;
	integration: VendorIntegrationProfile;
};

function emptyDraft(vendorName: string): JobDraft {
	return {
		name: `${vendorName.split(/\s+/).slice(0, 2).join(" ")} - New Import`,
		fileType: FILE_TYPES[0],
		direction: "Incoming",
		frequency: "Daily",
		status: "Active",
	};
}

function draftFromJob(job: VendorConfigJob): JobDraft {
	return {
		name: job.name,
		fileType: job.fileType,
		direction: job.direction,
		frequency: job.frequency,
		status: job.status,
	};
}

export function VendorConfigurationTab({
	vendorId,
	vendorName,
	integration,
}: VendorConfigurationTabProps) {
	const [activeStep, setActiveStep] = useState(1);
	const [jobSubtab, setJobSubtab] = useState<JobSubtab>("Jobs");
	const [jobs, setJobs] = useState(() =>
		getVendorConfigJobs(vendorId, vendorName)
	);
	const [jobDialog, setJobDialog] = useState<{
		mode: JobDialogMode;
		jobId?: string;
	} | null>(null);
	const [draft, setDraft] = useState<JobDraft | null>(null);
	const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
	const [connectionDraftOpen, setConnectionDraftOpen] = useState(false);
	const [connectionHost, setConnectionHost] = useState("");

	const connection = useMemo(
		() => getVendorSftpConnection(vendorId, vendorName),
		[vendorId, vendorName]
	);

	const connected = connection.status === "Connected";
	const alertsEnabled = Math.max(integration.alertsCount, 3);
	const fileTypesCount = new Set(jobs.map((j) => j.fileType)).size;
	const pgpEnabled = integration.encryption.toLowerCase().includes("pgp");
	const activeJobs = jobs.filter((job) => job.status === "Active").length;
	const deleteTarget = jobs.find((job) => job.id === deleteJobId) ?? null;
	const dialogJob =
		jobDialog?.jobId != null
			? (jobs.find((job) => job.id === jobDialog.jobId) ?? null)
			: null;

	const steps = [
		{
			id: 1,
			title: "SFTP Connection",
			description: "Set up secure connection",
		},
		{
			id: 2,
			title: "Job Configuration",
			description: "Define jobs and file processing",
		},
		{
			id: 3,
			title: "Review & Activate",
			description: "Review settings and activate",
		},
	];

	const connectionFields = [
		{
			label: "SFTP Host",
			value: connectionHost || connection.host,
			icon: Server,
		},
		{ label: "Port", value: String(connection.port) },
		{ label: "Username", value: connection.username },
		{ label: "Authentication", value: connection.authMethod, icon: KeyRound },
		{ label: "Authentication Key", value: connection.authKey, icon: KeyRound },
		{ label: "Last Verified", value: connection.lastVerified },
		{
			label: "Remote Directory",
			value: connection.remoteDirectory,
			icon: FolderOpen,
		},
		{
			label: "Status",
			value: connection.status,
			tone: connected ? "success" : "danger",
		},
		{
			label: "Test Connection",
			value: connection.testConnection,
			tone: connection.testConnection === "Successful" ? "success" : "danger",
		},
		{ label: "Connection Name", value: connection.connectionName },
	] as const;

	function goToStep(step: number) {
		setActiveStep(step);
		requestAnimationFrame(() => {
			document
				.getElementById(`config-step-${step}`)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	}

	function openCreateJob() {
		setJobDialog({ mode: "create" });
		setDraft(emptyDraft(vendorName));
		setJobSubtab("Jobs");
	}

	function openEditJob(job: VendorConfigJob) {
		setJobDialog({ mode: "edit", jobId: job.id });
		setDraft(draftFromJob(job));
	}

	function openViewJob(job: VendorConfigJob) {
		setJobDialog({ mode: "view", jobId: job.id });
		setDraft(draftFromJob(job));
	}

	function closeJobDialog() {
		setJobDialog(null);
		setDraft(null);
	}

	function saveJobDialog() {
		if (!jobDialog || !draft) return;
		const name = draft.name.trim();
		if (!name) {
			toast.error("Job name is required.");
			return;
		}

		if (jobDialog.mode === "create") {
			const created: VendorConfigJob = {
				id: `${vendorId}-job-${Date.now()}`,
				name,
				fileType: draft.fileType,
				direction: draft.direction,
				frequency: draft.frequency,
				status: draft.status,
				lastRun: "—",
				nextRun:
					draft.frequency === "Weekly" ? "Mon, 6:00 AM" : "Tomorrow, 6:00 AM",
				lastFileReceived: "—",
			};
			setJobs((prev) => [created, ...prev]);
			toast.success(`Created job “${created.name}”.`);
			closeJobDialog();
			return;
		}

		if (jobDialog.mode === "edit" && jobDialog.jobId) {
			setJobs((prev) =>
				prev.map((job) =>
					job.id === jobDialog.jobId
						? {
								...job,
								name,
								fileType: draft.fileType,
								direction: draft.direction,
								frequency: draft.frequency,
								status: draft.status,
								nextRun:
									draft.frequency === "Weekly" ? "Mon, 6:00 AM" : job.nextRun,
							}
						: job
				)
			);
			toast.success(`Updated job “${name}”.`);
			closeJobDialog();
		}
	}

	function duplicateJob(job: VendorConfigJob) {
		const copy: VendorConfigJob = {
			...job,
			id: `${vendorId}-job-${Date.now()}`,
			name: `${job.name} (Copy)`,
			status: "Paused",
			lastRun: "—",
			lastFileReceived: "—",
		};
		setJobs((prev) => [copy, ...prev]);
		toast.success(`Duplicated “${job.name}”.`);
	}

	function togglePauseJob(job: VendorConfigJob) {
		const nextStatus = job.status === "Active" ? "Paused" : "Active";
		setJobs((prev) =>
			prev.map((row) =>
				row.id === job.id ? { ...row, status: nextStatus } : row
			)
		);
		toast.success(
			nextStatus === "Paused"
				? `Paused “${job.name}”.`
				: `Resumed “${job.name}”.`
		);
	}

	function confirmDeleteJob() {
		if (!deleteJobId) return;
		const removed = jobs.find((job) => job.id === deleteJobId);
		setJobs((prev) => prev.filter((job) => job.id !== deleteJobId));
		setDeleteJobId(null);
		toast.success(removed ? `Deleted “${removed.name}”.` : "Job deleted.");
	}

	function saveConnectionHost() {
		const next = connectionHost.trim() || connection.host;
		setConnectionHost(next);
		setConnectionDraftOpen(false);
		toast.success(`SFTP host updated to ${next}.`);
	}

	return (
		<section className="min-w-0 space-y-4">
			<div className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
				<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-inset ring-primary/20">
					<Settings2 className="size-5" />
				</div>
				<div className="min-w-0">
					<h2 className="text-lg font-semibold tracking-tight text-foreground">
						Configuration Setup
					</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						Configure connections, jobs, mappings, schedules and alerts to
						process vendor files.
					</p>
				</div>
			</div>

			<div className="grid gap-2 sm:grid-cols-3">
				{steps.map((step) => {
					const active = activeStep === step.id;
					const complete = activeStep > step.id;
					return (
						<button
							key={step.id}
							type="button"
							onClick={() => goToStep(step.id)}
							className={cn(
								"rounded-lg border px-3 py-3 text-left transition-colors",
								active
									? "border-primary bg-primary/10 shadow-sm"
									: "border-border bg-card shadow-sm hover:border-primary/30 hover:bg-primary/5"
							)}
						>
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
										active
											? "bg-primary text-primary-foreground"
											: complete
												? "bg-emerald-100 text-emerald-800"
												: "bg-muted text-muted-foreground"
									)}
								>
									{complete && !active ? (
										<CheckCircle2 className="size-3.5" />
									) : (
										step.id
									)}
								</span>
								<p className="text-sm font-semibold tracking-tight text-foreground">
									{step.title}
								</p>
							</div>
							<p className="mt-1.5 pl-8 text-xs text-muted-foreground">
								{step.description}
							</p>
						</button>
					);
				})}
			</div>

			<div className="min-w-0 space-y-4">
				{/* Step 1 */}
				<div
					id="config-step-1"
					className="rounded-xl border border-border bg-card shadow-sm"
				>
					<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-sky-500/10 px-4 py-3.5">
						<div>
							<h3 className="text-sm font-semibold tracking-tight text-foreground">
								Step 1: SFTP Connection
							</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Secure file transfer credentials and remote path for this
								vendor.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
									connected
										? "border-emerald-200/80 bg-emerald-50 text-emerald-900"
										: "border-red-200/80 bg-red-50 text-red-900"
								)}
							>
								{connection.status}
							</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8 text-xs"
								onClick={() => {
									setConnectionHost(connectionHost || connection.host);
									setConnectionDraftOpen(true);
								}}
							>
								<Pencil className="mr-1.5 size-3.5" />
								Edit Connection
							</Button>
						</div>
					</div>

					<div className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
						{connectionFields.map((field) => {
							const Icon =
								"icon" in field && field.icon ? field.icon : undefined;
							const tone = "tone" in field ? field.tone : undefined;
							return (
								<div key={field.label} className="min-w-0">
									<p className="text-[11px] font-medium text-muted-foreground">
										{field.label}
									</p>
									<div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
										{Icon ? (
											<Icon className="size-3.5 shrink-0 text-muted-foreground" />
										) : null}
										{tone === "success" ? (
											<span className="inline-flex items-center gap-1.5 text-emerald-700">
												<span className="size-1.5 rounded-full bg-emerald-500" />
												{field.value}
												{field.label === "Test Connection" ? (
													<CheckCircle2 className="size-3.5" />
												) : null}
											</span>
										) : tone === "danger" ? (
											<span className="text-red-700">{field.value}</span>
										) : (
											<span className="truncate">{field.value}</span>
										)}
									</div>
								</div>
							);
						})}
					</div>

					<div
						className={cn(
							"mx-4 mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm",
							connected
								? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
								: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
						)}
					>
						<CheckCircle2 className="size-4 shrink-0" />
						{connected
							? "Connection established successfully"
							: "Connection could not be verified — update credentials and retry."}
					</div>
				</div>

				{/* Step 2 */}
				<div
					id="config-step-2"
					className="rounded-xl border border-border bg-card shadow-sm"
				>
					<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-emerald-500/10 px-4 py-3.5">
						<div>
							<h3 className="text-sm font-semibold tracking-tight text-foreground">
								Step 2: Job Configuration
							</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Define processing jobs, mappings, schedules, alerts, and
								encryption.
							</p>
						</div>
						<Button
							type="button"
							size="sm"
							className="h-8 text-xs"
							onClick={openCreateJob}
						>
							<Plus className="mr-1.5 size-3.5" />
							New Job
						</Button>
					</div>

					<div className="px-4 pt-3">
						<nav className="flex gap-1 overflow-x-auto border-b border-border">
							{JOB_SUBTABS.map((item) => (
								<button
									key={item}
									type="button"
									onClick={() => setJobSubtab(item)}
									className={cn(
										"shrink-0 border-b-2 px-2.5 pb-2 text-xs font-medium whitespace-nowrap",
										jobSubtab === item
											? "border-primary text-foreground"
											: "border-transparent text-muted-foreground hover:text-foreground"
									)}
								>
									{item}
								</button>
							))}
						</nav>
					</div>

					<div className="p-4">
						{jobSubtab === "Jobs" ? (
							<>
								<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
									<div className="w-full overflow-x-auto">
										<Table className="min-w-[980px] text-xs">
											<TableHeader>
												<TableRow className="hover:bg-transparent">
													<TableHead className="pl-3">Job Name</TableHead>
													<TableHead>File Type</TableHead>
													<TableHead>Direction</TableHead>
													<TableHead>Frequency</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Last Run</TableHead>
													<TableHead>Next Run</TableHead>
													<TableHead>Last File Received</TableHead>
													<TableHead className="pr-3 text-right">
														Actions
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{jobs.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={9}
															className="h-20 text-center text-muted-foreground"
														>
															No jobs configured. Click New Job to add one.
														</TableCell>
													</TableRow>
												) : (
													jobs.map((job) => (
														<TableRow
															key={job.id}
															className="hover:bg-muted/30"
														>
															<TableCell className="pl-3 font-medium">
																{job.name}
															</TableCell>
															<TableCell>{job.fileType}</TableCell>
															<TableCell>{job.direction}</TableCell>
															<TableCell>{job.frequency}</TableCell>
															<TableCell>
																<span
																	className={cn(
																		"inline-flex items-center rounded-md border border-transparent px-1.5 py-0 text-[10px] font-medium",
																		job.status === "Active"
																			? "bg-emerald-100 text-emerald-800"
																			: "bg-amber-100 text-amber-900"
																	)}
																>
																	{job.status}
																</span>
															</TableCell>
															<TableCell className="text-muted-foreground">
																{job.lastRun}
															</TableCell>
															<TableCell className="text-muted-foreground">
																{job.nextRun}
															</TableCell>
															<TableCell className="text-muted-foreground">
																{job.lastFileReceived}
															</TableCell>
															<TableCell className="pr-3 text-right">
																<div className="inline-flex items-center gap-0.5">
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="size-7"
																		title="Edit job"
																		onClick={() => openEditJob(job)}
																	>
																		<Pencil className="size-3.5" />
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="size-7"
																		title="Duplicate job"
																		onClick={() => duplicateJob(job)}
																	>
																		<Copy className="size-3.5" />
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="size-7 text-destructive"
																		title="Delete job"
																		onClick={() => setDeleteJobId(job.id)}
																	>
																		<Trash2 className="size-3.5" />
																	</Button>
																	<DropdownMenu>
																		<DropdownMenuTrigger asChild>
																			<Button
																				type="button"
																				variant="ghost"
																				size="icon"
																				className="size-7"
																			>
																				<MoreHorizontal className="size-3.5" />
																			</Button>
																		</DropdownMenuTrigger>
																		<DropdownMenuContent align="end">
																			<DropdownMenuItem
																				onSelect={() => openViewJob(job)}
																			>
																				View details
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onSelect={() => openEditJob(job)}
																			>
																				Edit job
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onSelect={() => duplicateJob(job)}
																			>
																				Duplicate job
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onSelect={() => togglePauseJob(job)}
																			>
																				{job.status === "Active"
																					? "Pause job"
																					: "Resume job"}
																			</DropdownMenuItem>
																			<DropdownMenuSeparator />
																			<DropdownMenuItem
																				className="text-destructive"
																				onSelect={() => setDeleteJobId(job.id)}
																			>
																				Delete job
																			</DropdownMenuItem>
																		</DropdownMenuContent>
																	</DropdownMenu>
																</div>
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</div>
								</div>
								<p className="mt-2 text-xs text-muted-foreground">
									Showing 1 to {jobs.length} of {jobs.length} jobs
								</p>
							</>
						) : null}

						{jobSubtab === "File Mapping" ? (
							<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
								<Table className="text-xs">
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="pl-3">File Type</TableHead>
											<TableHead>Source Path</TableHead>
											<TableHead>Target Schema</TableHead>
											<TableHead className="pr-3">Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{jobs.map((job) => (
											<TableRow key={job.id}>
												<TableCell className="pl-3 font-medium">
													{job.fileType}
												</TableCell>
												<TableCell className="font-mono text-[11px]">
													{connection.remoteDirectory}/
													{job.fileType.split(" ")[0]?.toLowerCase()}
												</TableCell>
												<TableCell>
													{job.fileType.includes("834")
														? "Member Eligibility v2"
														: job.fileType.includes("837")
															? "Medical Claims v3"
															: job.fileType.includes("835")
																? "Pharmacy Claims v2"
																: "Accumulator Balance v1"}
												</TableCell>
												<TableCell className="pr-3">
													<span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
														Mapped
													</span>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						) : null}

						{jobSubtab === "Schedules" ? (
							<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
								<Table className="text-xs">
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="pl-3">Job</TableHead>
											<TableHead>Frequency</TableHead>
											<TableHead>Next Run</TableHead>
											<TableHead className="pr-3">Timezone</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{jobs.map((job) => (
											<TableRow key={job.id}>
												<TableCell className="pl-3 font-medium">
													{job.name}
												</TableCell>
												<TableCell>{job.frequency}</TableCell>
												<TableCell>{job.nextRun}</TableCell>
												<TableCell className="pr-3">
													{integration.timezone}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						) : null}

						{jobSubtab === "Alerts" ? (
							<div className="space-y-2">
								{[
									"File late / missing SLA breach",
									"Validation failure threshold exceeded",
									"SFTP connection failure",
								]
									.slice(0, alertsEnabled)
									.map((label) => (
										<div
											key={label}
											className="flex items-center justify-between rounded-xl border border-border shadow-sm px-3 py-2.5"
										>
											<div className="flex items-center gap-2">
												<Bell className="size-4 text-muted-foreground" />
												<div>
													<p className="text-sm font-semibold tracking-tight text-foreground">
														{label}
													</p>
													<p className="text-xs text-muted-foreground">
														Email notification
													</p>
												</div>
											</div>
											<span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
												Enabled
											</span>
										</div>
									))}
							</div>
						) : null}

						{jobSubtab === "PGP / Encryption" ? (
							<div className="grid gap-3 rounded-xl border border-border shadow-sm p-4 sm:grid-cols-2">
								{[
									["Encryption", integration.encryption],
									["Protocol", integration.protocol],
									["PGP Status", pgpEnabled ? "Enabled" : "Not configured"],
									["Key Rotation", "Every 90 days"],
								].map(([label, value]) => (
									<div key={label}>
										<p className="text-[11px] text-muted-foreground">{label}</p>
										<p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
											{label === "PGP Status" && pgpEnabled ? (
												<Lock className="size-3.5 text-emerald-600" />
											) : null}
											{value}
										</p>
									</div>
								))}
							</div>
						) : null}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-9"
							onClick={() => goToStep(1)}
						>
							Back
						</Button>
						<Button
							type="button"
							size="sm"
							className="h-9"
							onClick={() => goToStep(3)}
						>
							Continue to Review
						</Button>
					</div>
				</div>

				{/* Step 3 */}
				<div
					id="config-step-3"
					className="rounded-xl border border-border bg-card shadow-sm"
				>
					<div className="border-b border-border bg-amber-500/10 px-4 py-3.5">
						<h3 className="text-sm font-semibold tracking-tight text-foreground">
							Step 3: Review & Activate
						</h3>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Confirm connection, jobs, and notification settings before going
							live.
						</p>
					</div>

					<div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5">
						{[
							{
								label: "Connection Status",
								value: connection.status,
								hint: connected ? "Verified" : "Needs attention",
								tone: connected ? "text-emerald-700" : "text-red-700",
							},
							{
								label: "Jobs Configured",
								value: String(jobs.length),
								hint: `${activeJobs} active`,
							},
							{
								label: "File Types",
								value: String(fileTypesCount),
								hint: "834, 837, 835, Accumulator",
							},
							{
								label: "Schedules",
								value: String(jobs.length),
								hint: Array.from(new Set(jobs.map((j) => j.frequency))).join(
									", "
								),
							},
							{
								label: "Alerts",
								value: String(alertsEnabled),
								hint: "Email notification",
							},
						].map((card) => (
							<div
								key={card.label}
								className="rounded-xl border border-border shadow-sm bg-muted/20 p-3"
							>
								<p className="text-[11px] font-medium text-muted-foreground">
									{card.label}
								</p>
								<p
									className={cn(
										"mt-1 text-lg font-semibold tracking-tight",
										card.tone
									)}
								>
									{card.value}
								</p>
								<p className="mt-1 truncate text-xs text-muted-foreground">
									{card.hint}
								</p>
							</div>
						))}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-9"
							onClick={() => goToStep(2)}
						>
							Back
						</Button>
						<Button
							type="button"
							size="sm"
							className="h-9"
							onClick={() =>
								toast.success("Configuration reviewed and activated.")
							}
						>
							Review & Activate
						</Button>
					</div>
				</div>

				<aside className="rounded-xl border border-border bg-card shadow-sm">
					<div className="border-b border-border bg-primary/10 px-4 py-3.5">
						<h3 className="text-sm font-semibold tracking-tight text-foreground">
							Configuration Summary
						</h3>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Final checklist before activating this vendor configuration.
						</p>
					</div>
					<ul className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
						{[
							{ label: "SFTP Connection", value: connection.status },
							{
								label: "Jobs Configured",
								value: `${activeJobs} Active`,
							},
							{
								label: "File Mappings",
								value: `${jobs.length} Mapped`,
							},
							{
								label: "Schedules",
								value: `${jobs.length} Scheduled`,
							},
							{
								label: "Alerts",
								value: `${alertsEnabled} Enabled`,
							},
							{
								label: "PGP Encryption",
								value: pgpEnabled ? "Enabled" : "Disabled",
							},
						].map((item) => (
							<li
								key={item.label}
								className="flex items-start justify-between gap-3 rounded-md border border-border/50 px-3 py-2.5"
							>
								<span className="text-muted-foreground">{item.label}</span>
								<span className="text-right font-medium text-emerald-700">
									{item.value}
								</span>
							</li>
						))}
					</ul>
					<div className="border-t border-border p-4">
						<Button
							type="button"
							className="h-10 w-full sm:w-auto sm:min-w-[220px]"
							onClick={() =>
								toast.success("Configuration reviewed and activated.")
							}
						>
							Review & Activate
						</Button>
					</div>
				</aside>
			</div>

			{/* Job dialog */}
			<Dialog
				open={Boolean(jobDialog && draft)}
				onOpenChange={(open) => {
					if (!open) closeJobDialog();
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{jobDialog?.mode === "create"
								? "Create job"
								: jobDialog?.mode === "edit"
									? "Edit job"
									: "Job details"}
						</DialogTitle>
						<DialogDescription>
							{jobDialog?.mode === "view"
								? "Review this processing job configuration."
								: "Configure how vendor files are ingested and scheduled."}
						</DialogDescription>
					</DialogHeader>
					{draft ? (
						<div className="grid gap-3 py-1">
							<div className="space-y-1.5">
								<Label htmlFor="job-name">Job name</Label>
								<Input
									id="job-name"
									value={draft.name}
									disabled={jobDialog?.mode === "view"}
									onChange={(e) =>
										setDraft((prev) =>
											prev ? { ...prev, name: e.target.value } : prev
										)
									}
								/>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="space-y-1.5">
									<Label>File type</Label>
									<Select
										value={draft.fileType}
										disabled={jobDialog?.mode === "view"}
										onValueChange={(value) =>
											setDraft((prev) =>
												prev ? { ...prev, fileType: value } : prev
											)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{FILE_TYPES.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label>Direction</Label>
									<Select
										value={draft.direction}
										disabled={jobDialog?.mode === "view"}
										onValueChange={(value) =>
											setDraft((prev) =>
												prev
													? {
															...prev,
															direction: value as VendorConfigJob["direction"],
														}
													: prev
											)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Incoming">Incoming</SelectItem>
											<SelectItem value="Outgoing">Outgoing</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label>Frequency</Label>
									<Select
										value={draft.frequency}
										disabled={jobDialog?.mode === "view"}
										onValueChange={(value) =>
											setDraft((prev) =>
												prev
													? {
															...prev,
															frequency: value as VendorConfigJob["frequency"],
														}
													: prev
											)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Hourly">Hourly</SelectItem>
											<SelectItem value="Daily">Daily</SelectItem>
											<SelectItem value="Weekly">Weekly</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label>Status</Label>
									<Select
										value={draft.status}
										disabled={jobDialog?.mode === "view"}
										onValueChange={(value) =>
											setDraft((prev) =>
												prev
													? {
															...prev,
															status: value as VendorConfigJob["status"],
														}
													: prev
											)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Active">Active</SelectItem>
											<SelectItem value="Paused">Paused</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							{jobDialog?.mode === "view" && dialogJob ? (
								<div className="grid gap-2 rounded-md border border-border/50 p-3 text-sm sm:grid-cols-2">
									<div>
										<p className="text-[11px] text-muted-foreground">
											Last run
										</p>
										<p className="font-medium">{dialogJob.lastRun}</p>
									</div>
									<div>
										<p className="text-[11px] text-muted-foreground">
											Next run
										</p>
										<p className="font-medium">{dialogJob.nextRun}</p>
									</div>
									<div>
										<p className="text-[11px] text-muted-foreground">
											Last file received
										</p>
										<p className="font-medium">{dialogJob.lastFileReceived}</p>
									</div>
									<div>
										<p className="text-[11px] text-muted-foreground">Job ID</p>
										<p className="font-mono text-xs">{dialogJob.id}</p>
									</div>
								</div>
							) : null}
						</div>
					) : null}
					<DialogFooter>
						<Button type="button" variant="outline" onClick={closeJobDialog}>
							{jobDialog?.mode === "view" ? "Close" : "Cancel"}
						</Button>
						{jobDialog?.mode !== "view" ? (
							<Button type="button" onClick={saveJobDialog}>
								{jobDialog?.mode === "create" ? "Create job" : "Save changes"}
							</Button>
						) : (
							<Button
								type="button"
								onClick={() => {
									if (dialogJob) openEditJob(dialogJob);
								}}
							>
								Edit job
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<AlertDialog
				open={Boolean(deleteJobId)}
				onOpenChange={(open) => {
					if (!open) setDeleteJobId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete job?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes{" "}
							<span className="font-medium text-foreground">
								{deleteTarget?.name ?? "this job"}
							</span>{" "}
							from the mock configuration. You can recreate it anytime.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDeleteJob}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Connection edit */}
			<Dialog open={connectionDraftOpen} onOpenChange={setConnectionDraftOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit SFTP connection</DialogTitle>
						<DialogDescription>
							Update the mock host used for this vendor connection.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-1.5 py-1">
						<Label htmlFor="sftp-host">SFTP host</Label>
						<Input
							id="sftp-host"
							value={connectionHost}
							onChange={(e) => setConnectionHost(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setConnectionDraftOpen(false)}
						>
							Cancel
						</Button>
						<Button type="button" onClick={saveConnectionHost}>
							Save connection
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}

"use client";

import { useEffect, useRef, useState } from "react";

import {
	Bell,
	CheckCircle2,
	Copy,
	FolderOpen,
	KeyRound,
	Loader2,
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
import { VendorCategoriesPanel } from "@/features/admin/features/vendors/components/VendorCategoriesPanel";
import {
	type ConnectionFormDraft,
	credentialOptionLabel,
	draftFromSftpConnection,
	emptyConnectionFormDraft,
	isLocalSftpHost,
	portAfterHostChange,
	validateConnectionDraft,
} from "@/features/admin/features/vendors/connection-form";
import {
	discoverVendorHostKey,
	discoverVendorHostKeyById,
} from "@/features/admin/features/vendors/feature/api/vendorsApi";
import {
	type VendorConfigJob,
	type VendorIntegrationProfile,
	type VendorSftpConnection,
} from "@/features/admin/features/vendors/vendor-types";
import { cn } from "@/lib/utils";
import type {
	CredentialDto,
	VendorIntegrationProfileUpdateInput,
} from "@/lib/vendor-core/types";

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
	configJobs: VendorConfigJob[];
	connection: VendorSftpConnection;
	connectionId?: string | null;
	onCreateJob?: (draft: JobDraft) => Promise<void>;
	onUpdateJob?: (jobId: string, draft: JobDraft) => Promise<void>;
	onDisableJob?: (jobId: string) => Promise<void>;
	onTestConnection?: () => Promise<void>;
	onSaveConnection?: (
		draft: ConnectionFormDraft,
		mode: "create" | "update"
	) => Promise<void>;
	/** Soft-delete the current SFTP connection. */
	onDeleteConnection?: () => Promise<void>;
	/** Called after Discover & pin persists fingerprint (refetch detail). */
	onHostKeyPinned?: () => Promise<void> | void;
	credentials?: CredentialDto[];
	onRegisterCredential?: (input: {
		name: string;
		kind: "password" | "private_key";
		secret_ref: string;
	}) => Promise<CredentialDto>;
	onSaveIntegrationProfile?: (
		patch: VendorIntegrationProfileUpdateInput
	) => Promise<void>;
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
	configJobs,
	connection,
	connectionId,
	onCreateJob,
	onUpdateJob,
	onDisableJob,
	onTestConnection,
	onSaveConnection,
	onDeleteConnection,
	onHostKeyPinned,
	credentials = [],
	onRegisterCredential,
	onSaveIntegrationProfile,
}: VendorConfigurationTabProps) {
	const [activeStep, setActiveStep] = useState(1);
	const [jobSubtab, setJobSubtab] = useState<JobSubtab>("Jobs");
	const [jobs, setJobs] = useState(configJobs);
	const [jobDialog, setJobDialog] = useState<{
		mode: JobDialogMode;
		jobId?: string;
	} | null>(null);
	const [draft, setDraft] = useState<JobDraft | null>(null);
	const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
	const [deleteConnectionOpen, setDeleteConnectionOpen] = useState(false);
	const [connectionDraftOpen, setConnectionDraftOpen] = useState(false);
	const [connectionDraft, setConnectionDraft] = useState<ConnectionFormDraft>(
		() => emptyConnectionFormDraft(vendorName)
	);
	const [connectionSaving, setConnectionSaving] = useState(false);
	const [discoveringHostKey, setDiscoveringHostKey] = useState(false);
	const [credMiniOpen, setCredMiniOpen] = useState(false);
	const [credMini, setCredMini] = useState({
		name: "",
		kind: "password" as "password" | "private_key",
		secret_ref: "",
	});
	const [profileDraftOpen, setProfileDraftOpen] = useState(false);
	const [profileDraft, setProfileDraft] = useState({
		timezone: integration.timezone,
		transmission_method: integration.transmissionMethod,
		encryption: integration.encryption,
		health: integration.health,
	});
	const [profileSaving, setProfileSaving] = useState(false);
	const [jobSaving, setJobSaving] = useState(false);
	const jobSavingRef = useRef(false);

	useEffect(() => {
		setJobs(configJobs);
	}, [configJobs]);

	useEffect(() => {
		setProfileDraft({
			timezone: integration.timezone,
			transmission_method: integration.transmissionMethod,
			encryption: integration.encryption,
			health: integration.health,
		});
	}, [
		integration.timezone,
		integration.transmissionMethod,
		integration.encryption,
		integration.health,
	]);

	const connected = connection.status === "Connected";
	const needsAuth =
		connection.method !== "sftp_hosted" &&
		connection.authMethod === "Not configured";
	const needsFingerprint =
		connection.method !== "sftp_hosted" &&
		Boolean(connectionId) &&
		!connection.hostKeyFingerprint?.trim();
	const localPortHint =
		isLocalSftpHost(connection.host) && connection.port === 22;
	const alertsEnabled = Math.max(integration.alertsCount, 3);
	const fileTypesCount = new Set(jobs.map((j) => j.fileType)).size;
	const pgpEnabled = (integration.encryption ?? "")
		.toLowerCase()
		.includes("pgp");
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
		{ label: "Connection Name", value: connection.connectionName || "—" },
		{
			label: "Method",
			value:
				connection.method === "sftp_hosted"
					? "SFTP Hosted"
					: connection.method === "sftp_pull"
						? "SFTP Pull"
						: connection.method || "—",
		},
		{ label: "Environment", value: connection.environment || "—" },
		{ label: "Lifecycle", value: connection.lifecycleStatus || "—" },
		...(connection.method === "sftp_hosted"
			? [
					{
						label: "Landing user",
						value: connection.landingUser || "—",
						icon: Server,
					},
					{
						label: "Inbound path",
						value: connection.inboundPath || "—",
						icon: FolderOpen,
					},
					{ label: "Archive path", value: connection.archivePath || "—" },
					{ label: "Error path", value: connection.errorPath || "—" },
					{
						label: "Processing path",
						value: connection.processingPath || "—",
					},
				]
			: [
					{
						label: "SFTP Host",
						value: connection.host || "—",
						icon: Server,
					},
					{ label: "Port", value: String(connection.port || "—") },
					{ label: "Username", value: connection.username || "—" },
					{
						label: "Authentication",
						value: connection.authMethod,
						icon: KeyRound,
					},
					{ label: "Credential", value: connection.authKey, icon: KeyRound },
					{
						label: "Host key fingerprint",
						value: connection.hostKeyFingerprint || "—",
					},
					{
						label: "Remote Directory",
						value: connection.remoteDirectory || "—",
						icon: FolderOpen,
					},
				]),
		{ label: "Last Verified", value: connection.lastVerified || "—" },
		{
			label: "Health",
			value: connection.healthStatus || "—",
		},
		{
			label: "Status",
			value: connection.status,
			tone: connected ? "success" : "danger",
		},
		{
			label: "Last test",
			value: connection.testConnection,
			tone:
				connection.testConnection === "Successful"
					? "success"
					: connection.testConnection === "Failed"
						? "danger"
						: undefined,
		},
		...(connection.lastError
			? [{ label: "Last error", value: connection.lastError }]
			: []),
	];

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
		if (!jobDialog || !draft || jobSavingRef.current) return;
		const name = draft.name.trim();
		if (!name) {
			toast.error("Job name is required.");
			return;
		}

		const mode = jobDialog.mode;
		const jobId = jobDialog.jobId;
		const draftSnapshot = { ...draft };

		jobSavingRef.current = true;
		setJobSaving(true);

		if (mode === "create") {
			closeJobDialog();
		}

		const persist = async () => {
			if (mode === "create") {
				if (onCreateJob) {
					await onCreateJob(draftSnapshot);
				} else {
					const created: VendorConfigJob = {
						id: `${vendorId}-job-${Date.now()}`,
						name,
						fileType: draftSnapshot.fileType,
						direction: draftSnapshot.direction,
						frequency: draftSnapshot.frequency,
						status: draftSnapshot.status,
						lastRun: "—",
						nextRun:
							draftSnapshot.frequency === "Weekly"
								? "Mon, 6:00 AM"
								: "Tomorrow, 6:00 AM",
						lastFileReceived: "—",
					};
					setJobs((prev) => [created, ...prev]);
				}
				toast.success(`Created job “${name}”.`);
				return;
			}

			if (mode === "edit" && jobId) {
				if (onUpdateJob) {
					await onUpdateJob(jobId, draftSnapshot);
				} else {
					setJobs((prev) =>
						prev.map((job) =>
							job.id === jobId
								? {
										...job,
										name,
										fileType: draftSnapshot.fileType,
										direction: draftSnapshot.direction,
										frequency: draftSnapshot.frequency,
										status: draftSnapshot.status,
										nextRun:
											draftSnapshot.frequency === "Weekly"
												? "Mon, 6:00 AM"
												: job.nextRun,
									}
								: job
						)
					);
				}
				toast.success(`Updated job “${name}”.`);
				closeJobDialog();
			}
		};

		void persist()
			.catch(() => toast.error("Could not save job."))
			.finally(() => {
				jobSavingRef.current = false;
				setJobSaving(false);
			});
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
		const finish = () => {
			setJobs((prev) => prev.filter((job) => job.id !== deleteJobId));
			setDeleteJobId(null);
			toast.success(removed ? `Disabled “${removed.name}”.` : "Job disabled.");
		};
		if (onDisableJob) {
			void onDisableJob(deleteJobId)
				.then(finish)
				.catch(() => toast.error("Could not disable job."));
			return;
		}
		finish();
	}

	function openConnectionDraft() {
		const base = connectionId
			? {
					...draftFromSftpConnection(connection),
					privateKeyCredentialId: connection.privateKeyCredentialId || "",
				}
			: emptyConnectionFormDraft(vendorName);
		// Local Docker: bump leftover wizard default 22 → 2222 when editing.
		if (isLocalSftpHost(base.host) && base.port.trim() === "22") {
			base.port = "2222";
		}
		setConnectionDraft(base);
		setConnectionDraftOpen(true);
	}

	async function discoverAndPinHostKey() {
		if (!connectionId) {
			toast.error("Save the connection first, then pin the host key.");
			return;
		}
		if (connection.method === "sftp_hosted") return;
		const host = connection.host.trim();
		let port = connection.port;
		if (isLocalSftpHost(host) && port === 22) {
			port = 2222;
		}
		setDiscoveringHostKey(true);
		try {
			let result: Awaited<ReturnType<typeof discoverVendorHostKeyById>>;
			try {
				result = await discoverVendorHostKeyById(connectionId, {
					host: host || undefined,
					port: port > 0 ? port : undefined,
					pin: true,
				});
			} catch (firstErr) {
				// Fallback: discover by host/port then PATCH config (older BE without pin).
				const discovered = await discoverVendorHostKey({
					host: host || "localhost",
					port: port > 0 ? port : 2222,
				});
				if (!discovered.fingerprint?.trim()) {
					throw firstErr;
				}
				if (!onSaveConnection) throw firstErr;
				const draft = draftFromSftpConnection(connection);
				draft.hostKeyFingerprint = discovered.fingerprint;
				draft.port = String(discovered.port || port);
				await onSaveConnection(draft, "update");
				result = { ...discovered, pinned: true };
			}

			if (!result.fingerprint?.trim()) {
				throw new Error("Discover returned an empty fingerprint.");
			}

			// pin=true already wrote config; still PATCH if older BE ignored pin.
			if (!result.pinned && onSaveConnection) {
				const draft = draftFromSftpConnection(connection);
				draft.hostKeyFingerprint = result.fingerprint;
				draft.port = String(result.port || port);
				await onSaveConnection(draft, "update");
			}

			await onHostKeyPinned?.();
			toast.success(
				`Host key pinned (${result.fingerprint.slice(0, 12)}…). Set lifecycle Active, then Test.`
			);
		} catch (err) {
			const status =
				err && typeof err === "object" && "status" in err
					? Number((err as { status?: number }).status)
					: undefined;
			const message =
				err instanceof Error ? err.message : "Could not discover host key.";
			if (status === 404) {
				toast.error(
					"Discover API not found (404). Restart vendor-management-core so /connections/.../discover-host-key/ is loaded."
				);
			} else {
				toast.error(message);
			}
		} finally {
			setDiscoveringHostKey(false);
		}
	}

	async function discoverHostKey() {
		if (connectionDraft.method !== "sftp_pull") return;
		const host = connectionDraft.host.trim();
		if (!host && !connectionId) {
			toast.error("Enter a host before discovering the fingerprint.");
			return;
		}
		const portNum = Number(connectionDraft.port);
		const port = Number.isFinite(portNum) && portNum > 0 ? portNum : undefined;
		setDiscoveringHostKey(true);
		try {
			const result =
				connectionId && !host
					? await discoverVendorHostKeyById(connectionId, {
							port,
						})
					: connectionId
						? await discoverVendorHostKeyById(connectionId, {
								host,
								port,
							})
						: await discoverVendorHostKey({
								host,
								port,
							});
			setConnectionDraft((p) => ({
				...p,
				hostKeyFingerprint: result.fingerprint,
			}));
			toast.success(
				result.key_type
					? `Discovered ${result.key_type} host key. Confirm before save.`
					: "Discovered host key. Confirm before save."
			);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not discover host key."
			);
		} finally {
			setDiscoveringHostKey(false);
		}
	}

	async function saveConnectionDraft() {
		const error = validateConnectionDraft(connectionDraft);
		if (error) {
			toast.error(error);
			return;
		}
		if (!onSaveConnection) {
			setConnectionDraftOpen(false);
			toast.success("Connection saved.");
			return;
		}
		setConnectionSaving(true);
		try {
			await onSaveConnection(
				connectionDraft,
				connectionId ? "update" : "create"
			);
			setConnectionDraftOpen(false);
			toast.success(
				connectionId ? "Connection updated." : "Connection created."
			);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not save connection."
			);
		} finally {
			setConnectionSaving(false);
		}
	}

	async function registerCredentialMini() {
		if (!onRegisterCredential) return;
		if (!credMini.name.trim() || !credMini.secret_ref.trim()) {
			toast.error("Credential name and secret_ref are required.");
			return;
		}
		try {
			const created = await onRegisterCredential({
				name: credMini.name.trim(),
				kind: credMini.kind,
				secret_ref: credMini.secret_ref.trim(),
			});
			setConnectionDraft((prev) =>
				credMini.kind === "private_key"
					? { ...prev, privateKeyCredentialId: created.id }
					: { ...prev, passwordCredentialId: created.id }
			);
			setCredMiniOpen(false);
			setCredMini({ name: "", kind: "password", secret_ref: "" });
			toast.success(
				"Credential reference registered. Ensure the secret exists in .secrets.yml."
			);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Could not register credential."
			);
		}
	}

	function openProfileDraft() {
		setProfileDraft({
			timezone: integration.timezone,
			transmission_method: integration.transmissionMethod,
			encryption: integration.encryption,
			health: integration.health,
		});
		setProfileDraftOpen(true);
	}

	async function saveIntegrationProfile() {
		if (!onSaveIntegrationProfile) {
			setProfileDraftOpen(false);
			toast.success("Integration profile updated.");
			return;
		}
		setProfileSaving(true);
		try {
			await onSaveIntegrationProfile({
				timezone: profileDraft.timezone.trim() || undefined,
				transmission_method: profileDraft.transmission_method.trim() || null,
				encryption: profileDraft.encryption.trim() || null,
				health: profileDraft.health,
			});
			setProfileDraftOpen(false);
		} catch {
			toast.error("Could not update integration profile.");
		} finally {
			setProfileSaving(false);
		}
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

			<div className="rounded-xl border border-border bg-card shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-violet-500/10 px-4 py-3.5">
					<div>
						<h3 className="text-sm font-semibold tracking-tight text-foreground">
							Integration Profile
						</h3>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Timezone, transmission, and encryption settings for this vendor.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-8 text-xs"
						disabled={!onSaveIntegrationProfile}
						onClick={openProfileDraft}
					>
						<Pencil className="mr-1.5 size-3.5" />
						Edit profile
					</Button>
				</div>
				<div className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
					{[
						["Timezone", integration.timezone],
						["Transmission method", integration.transmissionMethod],
						["Encryption", integration.encryption],
						["Health", integration.health],
					].map(([label, value]) => (
						<div key={label}>
							<p className="text-[11px] font-medium text-muted-foreground">
								{label}
							</p>
							<p className="mt-1 text-sm font-medium">{value}</p>
						</div>
					))}
				</div>
			</div>

			<VendorCategoriesPanel vendorId={vendorId} />

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
						<div className="flex flex-wrap items-center gap-2">
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
							{needsFingerprint ? (
								<Button
									type="button"
									variant="default"
									size="sm"
									className="h-8 text-xs"
									disabled={discoveringHostKey}
									onClick={() => void discoverAndPinHostKey()}
								>
									{discoveringHostKey ? (
										<Loader2 className="mr-1.5 size-3.5 animate-spin" />
									) : null}
									Discover &amp; pin host key
								</Button>
							) : null}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8 text-xs"
								disabled={!connectionId || !onTestConnection}
								onClick={() => {
									if (!onTestConnection) return;
									void onTestConnection().catch(() =>
										toast.error("Connection test failed.")
									);
								}}
							>
								Test Connection
							</Button>
							{connectionId && onDeleteConnection ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-8 text-xs text-destructive hover:text-destructive"
									onClick={() => setDeleteConnectionOpen(true)}
								>
									Delete connection
								</Button>
							) : null}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8 text-xs"
								disabled={!onSaveConnection}
								onClick={openConnectionDraft}
							>
								<Pencil className="mr-1.5 size-3.5" />
								{connectionId ? "Edit Connection" : "Create Connection"}
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
							: needsAuth
								? "Authentication not configured — attach a password credential, then retry."
								: needsFingerprint
									? localPortHint
										? "Host key not pinned, and port is 22 on localhost — use Discover & pin (sets fingerprint; edit port to 2222 for Docker SFTP)."
										: "Host key not pinned — click Discover & pin host key, then set lifecycle Active and Test."
									: localPortHint
										? "Not verified yet — localhost often needs port 2222 for Docker SFTP. Edit Connection, then Test."
										: "Connection not verified yet — set Active after pinning host key, then Test."}
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
							disabled={jobSaving}
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
					if (!open && !jobSaving) closeJobDialog();
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
						<Button
							type="button"
							variant="outline"
							disabled={jobSaving}
							onClick={closeJobDialog}
						>
							{jobDialog?.mode === "view" ? "Close" : "Cancel"}
						</Button>
						{jobDialog?.mode !== "view" ? (
							<Button
								type="button"
								disabled={jobSaving}
								onClick={saveJobDialog}
							>
								{jobSaving
									? jobDialog?.mode === "create"
										? "Creating…"
										: "Saving…"
									: jobDialog?.mode === "create"
										? "Create job"
										: "Save changes"}
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

			{/* Delete connection confirm */}
			<AlertDialog
				open={deleteConnectionOpen}
				onOpenChange={setDeleteConnectionOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete connection?</AlertDialogTitle>
						<AlertDialogDescription>
							Soft-deletes this SFTP connection. Intake jobs that use it may
							stop working until you create a new connection.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => {
								if (!onDeleteConnection) return;
								void onDeleteConnection()
									.then(() => {
										setDeleteConnectionOpen(false);
										toast.success("Connection deleted.");
									})
									.catch((err) =>
										toast.error(
											err instanceof Error
												? err.message
												: "Could not delete connection."
										)
									);
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

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
							from this vendor configuration. You can recreate it anytime.
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

			{/* Connection create/edit */}
			<Dialog open={connectionDraftOpen} onOpenChange={setConnectionDraftOpen}>
				<DialogContent className="flex max-h-[85vh] w-[min(96vw,56rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
					<DialogHeader className="shrink-0 border-b border-border px-6 py-4 text-left">
						<DialogTitle>
							{connectionId ? "Edit SFTP connection" : "Create SFTP connection"}
						</DialogTitle>
						<DialogDescription>
							Aligned with vendor-core Connection API (`sftp_pull` /
							`sftp_hosted`). Secrets are referenced by `secret_ref` only.
						</DialogDescription>
					</DialogHeader>
					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
							<Label htmlFor="conn-name">Connection name</Label>
							<Input
								id="conn-name"
								value={connectionDraft.name}
								onChange={(e) =>
									setConnectionDraft((p) => ({ ...p, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Method</Label>
							<Select
								value={connectionDraft.method}
								onValueChange={(method: "sftp_pull" | "sftp_hosted") =>
									setConnectionDraft((p) => ({ ...p, method }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="sftp_pull">SFTP Pull</SelectItem>
									<SelectItem value="sftp_hosted">SFTP Hosted</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Direction</Label>
							<Select
								value={connectionDraft.direction}
								onValueChange={(direction) =>
									setConnectionDraft((p) => ({ ...p, direction }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="inbound">Inbound</SelectItem>
									<SelectItem value="outbound">Outbound</SelectItem>
									<SelectItem value="both">Both</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Environment</Label>
							<Select
								value={connectionDraft.environment}
								onValueChange={(environment) =>
									setConnectionDraft((p) => ({ ...p, environment }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="development">Development</SelectItem>
									<SelectItem value="test">Test</SelectItem>
									<SelectItem value="uat">UAT</SelectItem>
									<SelectItem value="production">Production</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Status</Label>
							<Select
								value={connectionDraft.status}
								onValueChange={(status) =>
									setConnectionDraft((p) => ({ ...p, status }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="testing">Testing</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
									<SelectItem value="expired">Expired</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{connectionDraft.method === "sftp_pull" ? (
							<>
								<div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
									<Label htmlFor="conn-host">Host</Label>
									<Input
										id="conn-host"
										value={connectionDraft.host}
										onChange={(e) => {
											const host = e.target.value;
											setConnectionDraft((p) => ({
												...p,
												host,
												port: portAfterHostChange(host, p.port),
											}));
										}}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="conn-port">Port</Label>
									{isLocalSftpHost(connectionDraft.host) ? (
										<p className="text-xs text-muted-foreground">
											Localhost → use 2222 for Docker SFTP.
										</p>
									) : null}
									<Input
										id="conn-port"
										value={connectionDraft.port}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												port: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="conn-user">Username</Label>
									<Input
										id="conn-user"
										value={connectionDraft.username}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												username: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="conn-inbound">Inbound path</Label>
									<Input
										id="conn-inbound"
										value={connectionDraft.inboundPath}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												inboundPath: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="conn-archive">Archive path</Label>
									<Input
										id="conn-archive"
										value={connectionDraft.archivePath}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												archivePath: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
									<Label htmlFor="conn-fp">
										Host key fingerprint (SHA-256 hex)
									</Label>
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
										<Input
											id="conn-fp"
											value={connectionDraft.hostKeyFingerprint}
											onChange={(e) =>
												setConnectionDraft((p) => ({
													...p,
													hostKeyFingerprint: e.target.value,
												}))
											}
											placeholder="Required before status=active"
											className="font-mono text-xs"
										/>
										<Button
											type="button"
											variant="outline"
											disabled={discoveringHostKey}
											onClick={() => void discoverHostKey()}
											className="shrink-0"
										>
											{discoveringHostKey ? (
												<Loader2 className="mr-2 size-4 animate-spin" />
											) : null}
											Discover
										</Button>
									</div>
									<p className="text-xs text-muted-foreground">
										Fetches the live host key. Confirm the value, then Save.
										Required to set status Active.
									</p>
								</div>
								<div className="space-y-1.5">
									<Label>Password credential</Label>
									<p className="text-xs text-muted-foreground">
										Password auth — pick a credential whose secret_ref is in
										.secrets.yml.
									</p>
									<Select
										value={connectionDraft.passwordCredentialId || "__none__"}
										onValueChange={(v) =>
											setConnectionDraft((p) => ({
												...p,
												passwordCredentialId: v === "__none__" ? "" : v,
											}))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="None" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__none__">None</SelectItem>
											{credentials
												.filter((c) => c.kind === "password")
												.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{credentialOptionLabel(c)}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label>Private key credential</Label>
									<p className="text-xs text-muted-foreground">
										Only if key auth — leave None for password-only.
									</p>
									<Select
										value={connectionDraft.privateKeyCredentialId || "__none__"}
										onValueChange={(v) =>
											setConnectionDraft((p) => ({
												...p,
												privateKeyCredentialId: v === "__none__" ? "" : v,
											}))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="None" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__none__">None</SelectItem>
											{credentials
												.filter((c) => c.kind === "private_key")
												.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{credentialOptionLabel(c)}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</>
						) : (
							<>
								<div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
									<Label htmlFor="conn-landing">Landing user</Label>
									<Input
										id="conn-landing"
										value={connectionDraft.landingUser}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												landingUser: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="conn-hin">Inbound path</Label>
									<Input
										id="conn-hin"
										value={connectionDraft.inboundPath}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												inboundPath: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="conn-ha">Archive path</Label>
									<Input
										id="conn-ha"
										value={connectionDraft.archivePath}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												archivePath: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="conn-he">Error path</Label>
									<Input
										id="conn-he"
										value={connectionDraft.errorPath}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												errorPath: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="conn-hp">Processing path</Label>
									<Input
										id="conn-hp"
										value={connectionDraft.processingPath}
										onChange={(e) =>
											setConnectionDraft((p) => ({
												...p,
												processingPath: e.target.value,
											}))
										}
										className="font-mono"
									/>
								</div>
							</>
						)}
					</div>
					{onRegisterCredential ? (
						<div className="rounded-lg border border-border/70 bg-muted/30 p-3">
							<div className="mb-2 flex items-center justify-between gap-2">
								<p className="text-xs font-medium text-foreground">
									Register credential reference
								</p>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 text-xs"
									onClick={() => setCredMiniOpen((o) => !o)}
								>
									{credMiniOpen ? "Hide" : "Add"}
								</Button>
							</div>
							{credMiniOpen ? (
								<div className="grid gap-2 sm:grid-cols-3">
									<Input
										placeholder="Name"
										value={credMini.name}
										onChange={(e) =>
											setCredMini((p) => ({ ...p, name: e.target.value }))
										}
									/>
									<Select
										value={credMini.kind}
										onValueChange={(kind: "password" | "private_key") =>
											setCredMini((p) => ({ ...p, kind }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="password">password</SelectItem>
											<SelectItem value="private_key">private_key</SelectItem>
										</SelectContent>
									</Select>
									<Input
										placeholder="secret_ref"
										value={credMini.secret_ref}
										onChange={(e) =>
											setCredMini((p) => ({
												...p,
												secret_ref: e.target.value,
											}))
										}
										className="font-mono text-xs"
									/>
									<Button
										type="button"
										size="sm"
										className="sm:col-span-3"
										onClick={() => void registerCredentialMini()}
									>
										Register secret_ref
									</Button>
								</div>
							) : (
								<p className="text-[11px] text-muted-foreground">
									Creates a CredentialReference row only — the secret value must
									already exist under `.secrets.yml`.
								</p>
							)}
						</div>
					) : null}
					</div>
					<DialogFooter className="shrink-0 border-t border-border px-6 py-4 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setConnectionDraftOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={connectionSaving}
							onClick={() => void saveConnectionDraft()}
						>
							{connectionSaving ? "Saving…" : "Save connection"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={profileDraftOpen} onOpenChange={setProfileDraftOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit integration profile</DialogTitle>
						<DialogDescription>
							Update timezone, transmission, encryption, and health status.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 py-1">
						<div className="space-y-1.5">
							<Label htmlFor="profile-timezone">Timezone</Label>
							<Input
								id="profile-timezone"
								value={profileDraft.timezone}
								onChange={(e) =>
									setProfileDraft((prev) => ({
										...prev,
										timezone: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="profile-transmission">Transmission method</Label>
							<Input
								id="profile-transmission"
								value={profileDraft.transmission_method}
								onChange={(e) =>
									setProfileDraft((prev) => ({
										...prev,
										transmission_method: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="profile-encryption">Encryption</Label>
							<Input
								id="profile-encryption"
								value={profileDraft.encryption}
								onChange={(e) =>
									setProfileDraft((prev) => ({
										...prev,
										encryption: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Health</Label>
							<Select
								value={profileDraft.health}
								onValueChange={(value) =>
									setProfileDraft((prev) => ({
										...prev,
										health: value as typeof prev.health,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="healthy">Healthy</SelectItem>
									<SelectItem value="warning">Warning</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
									<SelectItem value="in_progress">In progress</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={profileSaving}
							onClick={() => setProfileDraftOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={profileSaving || !onSaveIntegrationProfile}
							onClick={() => void saveIntegrationProfile()}
						>
							{profileSaving ? "Saving…" : "Save profile"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}

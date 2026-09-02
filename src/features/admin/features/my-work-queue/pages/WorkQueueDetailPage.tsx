"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	Calendar,
	ChevronRight,
	Clock3,
	ExternalLink,
	FileText,
	History,
	Link2,
	Mail,
	Phone,
	Save,
	Server,
	ShieldCheck,
	Trash2,
	Upload,
	UserCog,
	UserRound,
	Waves,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { useVendorCoreUsersQuery } from "@/features/admin/features/users/feature/queries/useUsersQuery";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { WorkQueueProgressEditor } from "../components/work-queue-progress";
import {
	dateToApi,
	formatDisplayDateTime,
	vendorTypeToApi,
} from "../feature/mappers/workQueueMappers";
import {
	useDeleteMigrationCaseDocumentMutation,
	useDeleteMigrationCaseMutation,
	useInvalidateVendorCore,
	useMarkMigrationCaseExceptionMutation,
	useMarkMigrationCaseProductionReadyMutation,
	useMarkMigrationCaseReadyMutation,
	useMarkMigrationCaseTestingMutation,
	useMarkMigrationCaseWaitingOnVendorMutation,
	useMigrationCaseDetailQuery,
	useMigrationCaseDocumentsQuery,
	useMigrationCaseHistoryQuery,
	useSetMigrationCaseWhitelistMutation,
	useTransitionMigrationCaseBlockerMutation,
	useUpdateMigrationCaseMutation,
	useUpdateMigrationCaseProgressMutation,
	useUploadMigrationCaseDocumentMutation,
} from "../feature/queries/useWorkQueueQuery";
import { workQueueErrorMessage } from "../feature/workQueueErrors";
import {
	ESCALATED_TO_LABEL,
	ESCALATED_TO_OPTIONS,
	ESCALATION_REASON_LABEL,
	ESCALATION_REASON_OPTIONS,
	ESCALATION_WORKFLOW_LABEL,
	ESCALATION_WORKFLOW_OPTIONS,
	type EscalatedTo,
	type EscalationReason,
	type EscalationWorkflowStatus,
	IP_WHITELISTING_LABEL,
	IP_WHITELISTING_OPTIONS,
	type IpWhitelistingStatus,
	OPERATIONAL_STATUS_LABEL,
	OPERATIONAL_STATUS_OPTIONS,
	type OperationalStatus,
	mergeCaseMetadata,
	whitelistStatusFromIpWhitelisting,
} from "../lib/work-queue-detail-tabs";
import type { ConnectionProgress, ProgressTrack } from "../progress-data";
import {
	MIGRATION_STATUS_LABEL,
	type MigrationStatus,
	type TpaTpvRow,
} from "../work-queue-types";

type DetailTab =
	| "overview"
	| "info"
	| "contacts"
	| "sftp"
	| "edi"
	| "escalation"
	| "status"
	| "ip_whitelisting"
	| "edi_analyst"
	| "documents"
	| "history";

const FLAT_CARD_CLASS =
	"overflow-hidden rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]";

const fieldClass =
	"h-9 rounded-sm border-border bg-background text-sm shadow-none hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

function tabFromQuery(value: string | null): DetailTab {
	if (
		value === "overview" ||
		value === "info" ||
		value === "contacts" ||
		value === "sftp" ||
		value === "edi" ||
		value === "escalation" ||
		value === "status" ||
		value === "ip_whitelisting" ||
		value === "edi_analyst" ||
		value === "documents" ||
		value === "history"
	) {
		return value;
	}
	if (value === "migration") return "status";
	return "overview";
}

const TABS: { id: DetailTab; label: string; icon: typeof UserRound }[] = [
	{ id: "overview", label: "Overview", icon: UserRound },
	{ id: "info", label: "Information", icon: UserRound },
	{ id: "contacts", label: "Contacts", icon: Link2 },
	{ id: "sftp", label: "SFTP Progress", icon: Server },
	{ id: "edi", label: "EDI", icon: Server },
	{ id: "escalation", label: "Escalation", icon: AlertTriangle },
	{ id: "status", label: "Status", icon: Clock3 },
	{ id: "ip_whitelisting", label: "IP Whitelisting", icon: ShieldCheck },
	{ id: "edi_analyst", label: "EDI Analyst", icon: UserCog },
	{ id: "documents", label: "Documents", icon: FileText },
	{ id: "history", label: "History", icon: History },
];

const HISTORY_DOT: Record<string, string> = {
	orange: "bg-orange-500",
	purple: "bg-violet-500",
	green: "bg-emerald-500",
	blue: "bg-sky-500",
	red: "bg-red-500",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
			{children}
		</label>
	);
}

function formatDocumentSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MigrationStatusPill({ status }: { status: MigrationStatus }) {
	const styles: Record<MigrationStatus, string> = {
		waiting_on_vendor:
			"bg-orange-500/15 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
		testing:
			"bg-violet-500/15 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
		need_testing:
			"bg-violet-500/15 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
		ready:
			"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
		production_ready:
			"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
		not_started: "bg-muted text-muted-foreground",
		exception:
			"bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300",
	};

	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
				styles[status]
			)}
		>
			{MIGRATION_STATUS_LABEL[status]}
		</span>
	);
}

function SectionCard({
	title,
	description,
	action,
	children,
	className,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section className={cn(FLAT_CARD_CLASS, className)}>
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
				<div className="min-w-0">
					<h2 className="text-sm font-semibold tracking-tight text-foreground">
						{title}
					</h2>
					{description ? (
						<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
							{description}
						</p>
					) : null}
				</div>
				{action}
			</div>
			<div className="p-4">{children}</div>
		</section>
	);
}

function StatTile({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: React.ReactNode;
	icon?: React.ComponentType<{ className?: string }>;
}) {
	return (
		<div className="rounded-sm border border-border/50 bg-muted/10 p-3.5">
			<div className="flex items-start justify-between gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
					{label}
				</p>
				{Icon ? (
					<Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
				) : null}
			</div>
			<div className="mt-2 text-sm font-medium leading-snug text-foreground">
				{value}
			</div>
		</div>
	);
}

function QuickMetric({
	label,
	value,
	sub,
	tone = "default",
}: {
	label: string;
	value: React.ReactNode;
	sub?: string;
	tone?: "default" | "blue" | "green";
}) {
	const toneClass = {
		default: "text-foreground",
		blue: "text-blue-600 dark:text-blue-400",
		green: "text-green-600 dark:text-green-400",
	}[tone];

	return (
		<div className="border-r border-border/50 px-4 py-3 last:border-r-0">
			<p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
				{label}
			</p>
			<p
				className={cn(
					"mt-1 text-xl font-bold tabular-nums tracking-tight",
					toneClass
				)}
			>
				{value}
			</p>
			{sub ? (
				<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
					{sub}
				</p>
			) : null}
		</div>
	);
}

function DetailProgressCard({
	label,
	progress,
	track,
	onEdit,
}: {
	label: string;
	progress: ConnectionProgress;
	track: ProgressTrack;
	onEdit: () => void;
}) {
	const barClass = track === "sftp" ? "bg-blue-600" : "bg-green-600";

	return (
		<div className={cn(FLAT_CARD_CLASS, "p-4")}>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-foreground">{label}</p>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-3xl font-bold tabular-nums text-foreground">
							{progress.percent}%
						</span>
						<span className="text-xs text-muted-foreground">complete</span>
					</div>
					<div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className={cn(
								"h-full rounded-full transition-[width] duration-500 ease-out",
								barClass
							)}
							style={{ width: `${progress.percent}%` }}
						/>
					</div>
					<p className="mt-2.5 text-xs font-medium text-foreground">
						{progress.currentMilestone}
					</p>
					<p className="mt-0.5 text-[11px] text-muted-foreground">
						Last updated {progress.lastUpdated || "—"}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="h-8 shrink-0 rounded-sm border-border/50 text-xs shadow-none"
					onClick={onEdit}
				>
					Update
				</Button>
			</div>
		</div>
	);
}

function ContactBlock({
	title,
	name,
	email,
	phone,
}: {
	title: string;
	name: string;
	email: string;
	phone: string;
}) {
	return (
		<div className="rounded-sm border border-border/50 bg-muted/10 p-3.5">
			<p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
				{title}
			</p>
			<p className="mt-2 text-sm font-semibold text-foreground">
				{name || "—"}
			</p>
			<div className="mt-2.5 space-y-1.5">
				<p className="flex items-center gap-2 text-xs text-muted-foreground">
					<Mail className="size-3.5 shrink-0" />
					<span className="truncate">{email || "No email"}</span>
				</p>
				<p className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
					<Phone className="size-3.5 shrink-0" />
					<span>{phone || "No phone"}</span>
				</p>
			</div>
		</div>
	);
}

export function WorkQueueDetailPage({ caseId }: { caseId: string }) {
	return (
		<VendorCoreGate title="Migration case">
			<WorkQueueDetailBody caseId={caseId} />
		</VendorCoreGate>
	);
}

function WorkQueueDetailBody({ caseId }: { caseId: string }) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const invalidate = useInvalidateVendorCore();
	const documentInputRef = useRef<HTMLInputElement>(null);
	const detailQ = useMigrationCaseDetailQuery(caseId, true);
	const historyQ = useMigrationCaseHistoryQuery(caseId, true);
	const documentsQ = useMigrationCaseDocumentsQuery(caseId, true);
	const usersQ = useVendorCoreUsersQuery();
	const updateCase = useUpdateMigrationCaseMutation();
	const updateProgress = useUpdateMigrationCaseProgressMutation();
	const setWhitelist = useSetMigrationCaseWhitelistMutation();
	const transitionBlocker = useTransitionMigrationCaseBlockerMutation();
	const markTesting = useMarkMigrationCaseTestingMutation();
	const markReady = useMarkMigrationCaseReadyMutation();
	const markWaiting = useMarkMigrationCaseWaitingOnVendorMutation();
	const markException = useMarkMigrationCaseExceptionMutation();
	const markProductionReady = useMarkMigrationCaseProductionReadyMutation();
	const deleteCase = useDeleteMigrationCaseMutation();
	const uploadDoc = useUploadMigrationCaseDocumentMutation();
	const deleteDoc = useDeleteMigrationCaseDocumentMutation();

	const { data: session } = authClient.useSession();

	const row: TpaTpvRow | null = detailQ.data ?? null;

	const loading = detailQ.isLoading;

	const [tab, setTab] = useState<DetailTab>(() =>
		tabFromQuery(searchParams.get("tab"))
	);
	const [saving, setSaving] = useState(false);
	const [panelKey, setPanelKey] = useState(0);
	const [progressOverrides, setProgressOverrides] = useState<
		Partial<Record<ProgressTrack, ConnectionProgress>>
	>({});

	useEffect(() => {
		setTab(tabFromQuery(searchParams.get("tab")));
	}, [searchParams]);

	const displayRow = useMemo(() => {
		if (!row) return null;
		return {
			...row,
			sftpProgress: progressOverrides.sftp ?? row.sftpProgress,
			ediProgress: progressOverrides.edi ?? row.ediProgress,
		};
	}, [row, progressOverrides]);

	const [infoForm, setInfoForm] = useState({
		name: "",
		code: "",
		type: "TPA",
		wave: "1",
		serverType: "",
		notes: "",
	});
	const [contactsForm, setContactsForm] = useState({
		primaryContact: "",
		primaryEmail: "",
		primaryPhone: "",
		secondaryContact: "",
		secondaryEmail: "",
		secondaryPhone: "",
		lastCommunicationAt: "",
	});
	const [escalationForm, setEscalationForm] = useState({
		escalated: "no" as "yes" | "no",
		escalationReason: "" as EscalationReason | "",
		escalatedTo: "" as EscalatedTo | "",
		escalationWorkflowStatus: "submitted" as EscalationWorkflowStatus,
		blockerNotes: "",
	});
	const [statusForm, setStatusForm] = useState({
		operationalStatus: "not_started" as OperationalStatus,
	});
	const [ipWhitelistingForm, setIpWhitelistingForm] = useState({
		ipWhitelistingStatus: "not_started" as IpWhitelistingStatus,
	});
	const [ediAnalystForm, setEdiAnalystForm] = useState({
		assignedToId: "",
	});

	useEffect(() => {
		if (!row) return;
		setInfoForm({
			name: row.name,
			code: row.code,
			type: row.type,
			wave: String(row.wave),
			serverType: row.serverType,
			notes: row.notes,
		});
		setContactsForm({
			primaryContact: row.primaryContact,
			primaryEmail: row.primaryEmail,
			primaryPhone: row.primaryPhone,
			secondaryContact: row.secondaryContact,
			secondaryEmail: row.secondaryEmail,
			secondaryPhone: row.secondaryPhone,
			lastCommunicationAt: row.lastCommunication,
		});
		setEscalationForm({
			escalated: row.escalated ? "yes" : "no",
			escalationReason: row.escalationReason ?? "",
			escalatedTo: row.escalatedTo ?? "",
			escalationWorkflowStatus: row.escalationWorkflowStatus ?? "submitted",
			blockerNotes: row.blockerNotes ?? "",
		});
		setStatusForm({
			operationalStatus: row.operationalStatus ?? "not_started",
		});
		setIpWhitelistingForm({
			ipWhitelistingStatus: row.ipWhitelistingStatus ?? "not_started",
		});
		setEdiAnalystForm({
			assignedToId: row.ediAnalystId ?? "",
		});
	}, [row]);

	function changeTab(next: DetailTab) {
		setTab(next);
		setPanelKey((k) => k + 1);
	}

	async function saveProgress(
		rowId: string,
		track: ProgressTrack,
		progress: ConnectionProgress
	) {
		setSaving(true);
		try {
			await updateProgress.mutateAsync({ id: rowId, track, progress });
			await invalidate();
			await detailQ.refetch();
			setProgressOverrides((prev) => {
				const next = { ...prev };
				delete next[track];
				return next;
			});
			toast.success(`${track === "sftp" ? "SFTP" : "EDI"} progress saved`);
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to save progress"));
		} finally {
			setSaving(false);
		}
	}

	const historyEvents = historyQ.data ?? [];

	async function saveInfo() {
		if (!row) return;
		setSaving(true);
		try {
			await updateCase.mutateAsync({
				id: row.id,
				body: {
					name: infoForm.name,
					code: infoForm.code,
					vendor_type: vendorTypeToApi(infoForm.type),
					wave: Number(infoForm.wave) || 1,
					server_type: infoForm.serverType,
					notes: infoForm.notes,
				},
			});
			await invalidate();
			toast.success("TPA/TPV information saved");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to save"));
		} finally {
			setSaving(false);
		}
	}

	async function saveContacts() {
		if (!row) return;
		setSaving(true);
		try {
			await updateCase.mutateAsync({
				id: row.id,
				body: {
					primary_contact: contactsForm.primaryContact,
					primary_email: contactsForm.primaryEmail,
					primary_phone: contactsForm.primaryPhone,
					secondary_contact: contactsForm.secondaryContact,
					secondary_email: contactsForm.secondaryEmail,
					secondary_phone: contactsForm.secondaryPhone,
					last_communication_at: (() => {
						const d = dateToApi(contactsForm.lastCommunicationAt);
						return d ? `${d}T12:00:00Z` : null;
					})(),
				},
			});
			await invalidate();
			toast.success("Contacts saved");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to save contacts"));
		} finally {
			setSaving(false);
		}
	}

	async function saveEscalation() {
		if (!row) return;
		if (escalationForm.escalated === "yes") {
			if (!escalationForm.escalationReason) {
				toast.error("Select an escalation reason");
				return;
			}
			if (!escalationForm.escalatedTo) {
				toast.error("Select who this was escalated to");
				return;
			}
			if (
				escalationForm.escalationReason === "other" &&
				!escalationForm.blockerNotes.trim()
			) {
				toast.error("Add notes when escalation reason is Other");
				return;
			}
		}
		setSaving(true);
		try {
			const metadataPatch: Record<string, unknown> = {
				escalated: escalationForm.escalated === "yes",
				escalation_workflow_status: escalationForm.escalationWorkflowStatus,
				escalated_to:
					escalationForm.escalated === "yes" && escalationForm.escalatedTo
						? escalationForm.escalatedTo
						: null,
				escalation_reason:
					escalationForm.escalated === "yes" && escalationForm.escalationReason
						? escalationForm.escalationReason
						: null,
			};
			await updateCase.mutateAsync({
				id: row.id,
				body: {
					metadata: mergeCaseMetadata(row.metadata, metadataPatch),
				},
			});

			const currentBlocker = row.blockerStatus ?? "none";
			if (escalationForm.escalated === "yes") {
				const reason =
					escalationForm.escalationReason &&
					escalationForm.escalationReason !== "other"
						? escalationForm.escalationReason
						: null;
				const notes =
					escalationForm.escalationReason === "other"
						? escalationForm.blockerNotes
						: escalationForm.blockerNotes;
				if (currentBlocker !== "escalated") {
					await transitionBlocker.mutateAsync({
						id: row.id,
						blocker_status: "escalated",
						blocker_reason: reason,
						blocker_notes: notes,
					});
				} else if (
					reason !== (row.blockerReason || null) ||
					notes !== row.blockerNotes
				) {
					await transitionBlocker.mutateAsync({
						id: row.id,
						blocker_status: "escalated",
						blocker_reason: reason,
						blocker_notes: notes,
					});
				}
			} else if (currentBlocker === "escalated") {
				await transitionBlocker.mutateAsync({
					id: row.id,
					blocker_status: "resolved",
					blocker_reason: null,
					blocker_notes: "",
				});
			} else if (
				currentBlocker === "escalation_required" ||
				currentBlocker === "attention"
			) {
				await transitionBlocker.mutateAsync({
					id: row.id,
					blocker_status: "none",
					blocker_reason: null,
					blocker_notes: "",
				});
			}

			await invalidate();
			await detailQ.refetch();
			toast.success("Escalation saved");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to save escalation"));
		} finally {
			setSaving(false);
		}
	}

	async function saveStatus() {
		if (!row) return;
		setSaving(true);
		try {
			await updateCase.mutateAsync({
				id: row.id,
				body: {
					metadata: mergeCaseMetadata(row.metadata, {
						operational_status: statusForm.operationalStatus,
					}),
				},
			});
			await invalidate();
			await detailQ.refetch();
			toast.success("Status saved");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to save status"));
		} finally {
			setSaving(false);
		}
	}

	async function saveIpWhitelisting() {
		if (!row) return;
		setSaving(true);
		try {
			const nextWhitelist = whitelistStatusFromIpWhitelisting(
				ipWhitelistingForm.ipWhitelistingStatus
			);
			await updateCase.mutateAsync({
				id: row.id,
				body: {
					metadata: mergeCaseMetadata(row.metadata, {
						ip_whitelisting_status: ipWhitelistingForm.ipWhitelistingStatus,
						ip_whitelisting_not_required:
							ipWhitelistingForm.ipWhitelistingStatus === "not_required",
					}),
				},
			});
			if (nextWhitelist !== row.whitelistStatus) {
				await setWhitelist.mutateAsync({
					id: row.id,
					whitelist_status: nextWhitelist,
				});
			}
			await invalidate();
			await detailQ.refetch();
			toast.success("IP whitelisting saved");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to save IP whitelisting"));
		} finally {
			setSaving(false);
		}
	}

	function analystLabelFromId(userId: string): string {
		const user = (usersQ.data ?? []).find((u) => u.id === userId);
		if (!user) return "";
		return (
			user.full_name?.trim() ||
			[user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
			user.username ||
			user.email ||
			""
		);
	}

	async function saveEdiAnalyst() {
		if (!row) return;
		setSaving(true);
		try {
			const nextId = ediAnalystForm.assignedToId || "";
			const currentId = row.ediAnalystId ?? "";
			if (nextId !== currentId) {
				const assignedBy =
					session?.user?.name?.trim() ||
					session?.user?.email?.trim() ||
					"System";
				const previousName =
					row.ediAnalystName ||
					(currentId ? analystLabelFromId(currentId) : "");
				const nextName = nextId ? analystLabelFromId(nextId) : "";
				await updateCase.mutateAsync({
					id: row.id,
					body: {
						metadata: mergeCaseMetadata(row.metadata, {
							edi_analyst_id: nextId || null,
							edi_analyst_name: nextName || null,
							edi_analyst_assigned_at: new Date().toISOString(),
							edi_analyst_assigned_by: assignedBy,
							edi_analyst_previous_id: currentId || null,
							edi_analyst_previous_name: previousName || null,
						}),
					},
				});
			}
			await invalidate();
			await detailQ.refetch();
			toast.success("EDI analyst saved");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to save EDI analyst"));
		} finally {
			setSaving(false);
		}
	}

	async function runQuickMark(label: string, action: () => Promise<unknown>) {
		if (!row) return;
		setSaving(true);
		try {
			await action();
			await invalidate();
			await detailQ.refetch();
			toast.success(label);
		} catch (err) {
			toast.error(workQueueErrorMessage(err, `${label} failed`));
		} finally {
			setSaving(false);
		}
	}

	async function handleDeleteCase() {
		if (!row) return;
		if (
			!window.confirm(
				`Remove "${row.name}" from the work queue? This soft-deletes the case.`
			)
		) {
			return;
		}
		setSaving(true);
		try {
			await deleteCase.mutateAsync({ id: row.id });
			invalidate();
			toast.success("Case removed");
			router.push("/admin/my-work-queue");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to remove case"));
		} finally {
			setSaving(false);
		}
	}

	async function handleDocumentUpload(file: File) {
		if (!row) return;
		setSaving(true);
		try {
			await uploadDoc.mutateAsync({ id: row.id, file });
			await documentsQ.refetch();
			toast.success("Document uploaded");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Document upload failed"));
		} finally {
			setSaving(false);
		}
	}

	async function handleDocumentDelete(documentId: string) {
		if (!row) return;
		setSaving(true);
		try {
			await deleteDoc.mutateAsync({ caseId: row.id, documentId });
			await documentsQ.refetch();
			toast.success("Document removed");
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to remove document"));
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="space-y-4 p-1">
				<Skeleton className="h-10 w-full max-w-md" />
				<Skeleton className="h-11 w-full border border-border" />
				<Skeleton className="h-72 w-full border border-border" />
			</div>
		);
	}

	if (!row || !displayRow) {
		return (
			<div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
				<p className="text-sm font-medium text-foreground">
					Migration case not found
				</p>
				<p className="max-w-sm text-xs text-muted-foreground">
					This TPA/TPV may have been removed or the link is invalid.
				</p>
				<Button asChild variant="outline" size="sm">
					<Link href="/admin/my-work-queue">Back to Work Queue</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Link
				href="/admin/my-work-queue"
				className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Back to My Work Queue
			</Link>

			<div className={FLAT_CARD_CLASS}>
				<div className="border-b border-border/50 px-4 py-4 sm:px-5">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="text-2xl font-semibold tracking-tight text-foreground">
									{row.name}
								</h1>
								<span className="rounded-sm border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
									{row.type}
								</span>
								<MigrationStatusPill status={row.status} />
							</div>
							<p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
								<span className="font-mono text-foreground/90">{row.code}</span>
								<span className="text-border">·</span>
								<span className="inline-flex items-center gap-1">
									<Waves className="size-3.5" />
									Wave {row.wave}
								</span>
								<span className="text-border">·</span>
								<span className="inline-flex items-center gap-1">
									<Server className="size-3.5" />
									{row.serverType || "No connection type"}
								</span>
							</p>
							<p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
								<span className="inline-flex items-center gap-1">
									<UserRound className="size-3.5" />
									{row.assignedAnalyst || "Unassigned"}
								</span>
								<span className="text-border">·</span>
								<span className="inline-flex items-center gap-1">
									<Clock3 className="size-3.5" />
									Updated {row.lastUpdated || "—"}
								</span>
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-1.5">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-9 gap-1.5 rounded-sm border-border/50 bg-background px-3 text-xs font-medium shadow-none"
										disabled={saving}
									>
										Quick status
										<ChevronRight className="size-3.5 rotate-90" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() =>
											void runQuickMark("Marked testing", () =>
												markTesting.mutateAsync({ id: row.id })
											)
										}
									>
										Mark testing
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											void runQuickMark("Marked ready", () =>
												markReady.mutateAsync({ id: row.id })
											)
										}
									>
										Mark ready
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											void runQuickMark("Marked waiting on vendor", () =>
												markWaiting.mutateAsync({ id: row.id })
											)
										}
									>
										Mark waiting on vendor
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											void runQuickMark("Marked exception", () =>
												markException.mutateAsync({ id: row.id })
											)
										}
									>
										Mark exception
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											void runQuickMark("Marked production ready", () =>
												markProductionReady.mutateAsync({ id: row.id })
											)
										}
									>
										Mark production ready
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<Button
								variant="outline"
								size="sm"
								className="h-9 gap-1.5 rounded-sm border-border/50 bg-background px-3 text-xs font-medium shadow-none"
								onClick={() => changeTab("status")}
							>
								<Clock3 className="size-3.5" />
								Update status
							</Button>
							<Button
								size="sm"
								className="h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none"
								onClick={() => changeTab("info")}
							>
								Edit details
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-9 gap-1.5 rounded-sm border-destructive/40 px-3 text-xs font-medium text-destructive shadow-none hover:bg-destructive/5"
								disabled={saving || deleteCase.isPending}
								onClick={() => void handleDeleteCase()}
							>
								<Trash2 className="size-3.5" />
								Remove
							</Button>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-4">
					<QuickMetric
						label="SFTP Progress"
						value={`${displayRow.sftpProgress.percent}%`}
						sub={displayRow.sftpProgress.currentMilestone}
						tone="blue"
					/>
					<QuickMetric
						label="EDI Progress"
						value={`${displayRow.ediProgress.percent}%`}
						sub={displayRow.ediProgress.currentMilestone}
						tone="green"
					/>
					<QuickMetric
						label="Current Stage"
						value={row.currentStage || "—"}
						sub={MIGRATION_STATUS_LABEL[row.status]}
					/>
					<QuickMetric
						label="IP Whitelisting"
						value={
							IP_WHITELISTING_LABEL[row.ipWhitelistingStatus ?? "not_started"]
						}
						sub={
							row.escalated
								? ESCALATION_WORKFLOW_LABEL[
										row.escalationWorkflowStatus ?? "submitted"
									]
								: "No active escalation"
						}
					/>
				</div>
			</div>

			<nav className="flex gap-1 overflow-x-auto rounded-sm bg-card p-1 shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)] [scrollbar-width:thin]">
				{TABS.map((t) => {
					const Icon = t.icon;
					const active = tab === t.id;
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => changeTab(t.id)}
							className={cn(
								"inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors",
								active
									? "bg-foreground text-background shadow-sm"
									: "text-foreground/75 hover:bg-muted/50 hover:text-foreground"
							)}
						>
							<Icon className="size-3.5 opacity-80" />
							{t.label}
						</button>
					);
				})}
			</nav>

			<div key={panelKey} className="space-y-4">
				{tab === "overview" ? (
					<div className="grid gap-4 lg:grid-cols-3">
						<div className="space-y-4 lg:col-span-2">
							<div className="grid gap-3 sm:grid-cols-2">
								<DetailProgressCard
									label="SFTP Completion"
									progress={displayRow.sftpProgress}
									track="sftp"
									onEdit={() => changeTab("sftp")}
								/>
								<DetailProgressCard
									label="EDI Completion"
									progress={displayRow.ediProgress}
									track="edi"
									onEdit={() => changeTab("edi")}
								/>
							</div>

							<SectionCard
								title="Migration snapshot"
								description="Status, stage, and connection details"
							>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									<StatTile
										label="Operational status"
										icon={Clock3}
										value={
											OPERATIONAL_STATUS_LABEL[
												row.operationalStatus ?? "not_started"
											]
										}
									/>
									<StatTile
										label="Stage"
										icon={Server}
										value={row.currentStage || "—"}
									/>
									<StatTile
										label="EDI analyst"
										icon={UserCog}
										value={
											row.ediAnalystName ||
											(row.ediAnalystId
												? analystLabelFromId(row.ediAnalystId)
												: "—") ||
											"—"
										}
									/>
									<StatTile
										label="Escalation"
										icon={AlertTriangle}
										value={
											row.escalated
												? ESCALATION_WORKFLOW_LABEL[
														row.escalationWorkflowStatus ?? "submitted"
													]
												: "No"
										}
									/>
									<StatTile
										label="IP whitelisting"
										icon={ShieldCheck}
										value={
											IP_WHITELISTING_LABEL[
												row.ipWhitelistingStatus ?? "not_started"
											]
										}
									/>
									<StatTile
										label="Last communication"
										icon={Mail}
										value={row.lastCommunication || "—"}
									/>
									<StatTile
										label="Migration start"
										icon={Calendar}
										value={row.migrationStartDate || "—"}
									/>
									{row.sourceSystem ? (
										<StatTile
											label="Data source"
											icon={Link2}
											value={row.sourceSystem}
										/>
									) : null}
									{row.lastSyncedAt ? (
										<StatTile
											label="Last synchronized"
											icon={Clock3}
											value={row.lastSyncedAt}
										/>
									) : null}
								</div>
							</SectionCard>

							<SectionCard
								title="Next step"
								description="Current action item for this vendor"
							>
								<p className="rounded-sm border border-border/40 bg-muted/10 px-3.5 py-3 text-sm leading-relaxed text-foreground">
									{row.nextStep || (
										<span className="text-muted-foreground">
											No next step recorded yet.
										</span>
									)}
								</p>
								{row.notes ? (
									<div className="mt-3 border-t border-border/50 pt-3">
										<p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
											Notes
										</p>
										<p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
											{row.notes}
										</p>
									</div>
								) : null}
							</SectionCard>
						</div>

						<div className="space-y-4">
							<SectionCard
								title="Contacts"
								description="Vendor points of contact"
							>
								<div className="space-y-3">
									<ContactBlock
										title="Primary"
										name={row.primaryContact}
										email={row.primaryEmail}
										phone={row.primaryPhone}
									/>
									<ContactBlock
										title="Secondary"
										name={row.secondaryContact}
										email={row.secondaryEmail}
										phone={row.secondaryPhone}
									/>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="mt-3 h-8 px-0 text-xs text-primary"
									onClick={() => changeTab("contacts")}
								>
									Manage contacts →
								</Button>
							</SectionCard>

							<SectionCard
								title="Recent history"
								description="Latest migration events"
							>
								{historyEvents.length === 0 ? (
									<p className="text-xs text-muted-foreground">
										No events yet.
									</p>
								) : (
									<ol className="space-y-3">
										{historyEvents.slice(0, 5).map((event) => (
											<li key={event.id} className="flex gap-2.5">
												<span
													className={cn(
														"mt-1.5 size-2 shrink-0 rounded-full",
														HISTORY_DOT[event.tone] ?? "bg-muted-foreground"
													)}
												/>
												<div className="min-w-0">
													<p className="text-[11px] font-semibold text-foreground">
														{event.at}
													</p>
													<p className="text-xs leading-relaxed text-muted-foreground">
														{event.message}
													</p>
												</div>
											</li>
										))}
									</ol>
								)}
								<Button
									variant="ghost"
									size="sm"
									className="mt-3 h-8 px-0 text-xs text-primary"
									onClick={() => changeTab("history")}
								>
									View full history →
								</Button>
							</SectionCard>
						</div>
					</div>
				) : null}

				{tab === "info" ? (
					<SectionCard
						title="TPA/TPV information"
						description="Identity, wave, and connection details"
						action={
							<Button
								size="sm"
								className="h-8"
								disabled={saving || updateCase.isPending}
								onClick={() => void saveInfo()}
							>
								<Save className="mr-1.5 size-3.5" />
								Save
							</Button>
						}
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<FieldLabel>TPA/TPV Name</FieldLabel>
								<Input
									value={infoForm.name}
									onChange={(e) =>
										setInfoForm((f) => ({ ...f, name: e.target.value }))
									}
									className={fieldClass}
								/>
							</div>
							<div>
								<FieldLabel>TPA/TPV ID</FieldLabel>
								<Input
									value={infoForm.code}
									onChange={(e) =>
										setInfoForm((f) => ({ ...f, code: e.target.value }))
									}
									className={cn(fieldClass, "font-mono")}
								/>
							</div>
							<div>
								<FieldLabel>Type</FieldLabel>
								<Select
									value={infoForm.type}
									onValueChange={(v) => setInfoForm((f) => ({ ...f, type: v }))}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="TPA">TPA</SelectItem>
										<SelectItem value="TPV">TPV</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<FieldLabel>Wave</FieldLabel>
								<Select
									value={infoForm.wave}
									onValueChange={(v) => setInfoForm((f) => ({ ...f, wave: v }))}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{["1", "2", "3", "4"].map((w) => (
											<SelectItem key={w} value={w}>
												{w}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="sm:col-span-2">
								<FieldLabel>Server / Connection Type</FieldLabel>
								<Select
									value={infoForm.serverType}
									onValueChange={(v) =>
										setInfoForm((f) => ({ ...f, serverType: v }))
									}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="New SFTP">New SFTP</SelectItem>
										<SelectItem value="Legacy SFTP">Legacy SFTP</SelectItem>
										<SelectItem value="API Feed">API Feed</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="sm:col-span-2">
								<FieldLabel>Notes</FieldLabel>
								<Textarea
									value={infoForm.notes}
									onChange={(e) =>
										setInfoForm((f) => ({ ...f, notes: e.target.value }))
									}
									rows={4}
									className="min-h-[100px] resize-none rounded-sm border-border bg-background text-sm shadow-none"
								/>
							</div>
						</div>
					</SectionCard>
				) : null}

				{tab === "contacts" ? (
					<SectionCard
						title="Contacts"
						description="Primary and secondary vendor contacts"
						action={
							<Button
								size="sm"
								className="h-8"
								disabled={saving || updateCase.isPending}
								onClick={() => void saveContacts()}
							>
								<Save className="mr-1.5 size-3.5" />
								Save
							</Button>
						}
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<FieldLabel>Primary Contact</FieldLabel>
								<Input
									value={contactsForm.primaryContact}
									onChange={(e) =>
										setContactsForm((f) => ({
											...f,
											primaryContact: e.target.value,
										}))
									}
									className={fieldClass}
								/>
							</div>
							<div>
								<FieldLabel>Email</FieldLabel>
								<Input
									value={contactsForm.primaryEmail}
									onChange={(e) =>
										setContactsForm((f) => ({
											...f,
											primaryEmail: e.target.value,
										}))
									}
									className={fieldClass}
								/>
							</div>
							<div>
								<FieldLabel>Phone</FieldLabel>
								<Input
									value={contactsForm.primaryPhone}
									onChange={(e) =>
										setContactsForm((f) => ({
											...f,
											primaryPhone: e.target.value,
										}))
									}
									className={fieldClass}
								/>
							</div>
							<div className="sm:col-span-2 border-t border-border pt-4">
								<FieldLabel>Secondary Contact</FieldLabel>
								<Input
									value={contactsForm.secondaryContact}
									onChange={(e) =>
										setContactsForm((f) => ({
											...f,
											secondaryContact: e.target.value,
										}))
									}
									className={fieldClass}
								/>
							</div>
							<div>
								<FieldLabel>Email</FieldLabel>
								<Input
									value={contactsForm.secondaryEmail}
									onChange={(e) =>
										setContactsForm((f) => ({
											...f,
											secondaryEmail: e.target.value,
										}))
									}
									className={fieldClass}
								/>
							</div>
							<div>
								<FieldLabel>Phone</FieldLabel>
								<Input
									value={contactsForm.secondaryPhone}
									onChange={(e) =>
										setContactsForm((f) => ({
											...f,
											secondaryPhone: e.target.value,
										}))
									}
									className={fieldClass}
								/>
							</div>
							<div className="sm:col-span-2 border-t border-border pt-4">
								<FieldLabel>Last communication</FieldLabel>
								<Input
									value={contactsForm.lastCommunicationAt}
									onChange={(e) =>
										setContactsForm((f) => ({
											...f,
											lastCommunicationAt: e.target.value,
										}))
									}
									placeholder="MM/DD/YYYY"
									className={fieldClass}
								/>
							</div>
						</div>
					</SectionCard>
				) : null}

				{tab === "sftp" ? (
					<SectionCard
						title="SFTP progress"
						description="Milestone dates and completion for SFTP onboarding"
					>
						<WorkQueueProgressEditor
							key={`sftp-${panelKey}`}
							row={displayRow}
							track="sftp"
							variant="inline"
							saving={saving}
							onSave={(rowId, progress) =>
								void saveProgress(rowId, "sftp", progress)
							}
						/>
					</SectionCard>
				) : null}

				{tab === "edi" ? (
					<SectionCard
						title="EDI progress"
						description="Milestone dates and completion for EDI setup"
					>
						<WorkQueueProgressEditor
							key={`edi-${panelKey}`}
							row={displayRow}
							track="edi"
							variant="inline"
							saving={saving}
							onSave={(rowId, progress) =>
								void saveProgress(rowId, "edi", progress)
							}
						/>
					</SectionCard>
				) : null}

				{tab === "escalation" ? (
					<SectionCard
						title="Escalation"
						description="Track escalations when migration progress is blocked"
						action={
							<Button
								size="sm"
								className="h-8"
								disabled={
									saving || updateCase.isPending || transitionBlocker.isPending
								}
								onClick={() => void saveEscalation()}
							>
								<Save className="mr-1.5 size-3.5" />
								Save
							</Button>
						}
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<FieldLabel>Escalated</FieldLabel>
								<Select
									value={escalationForm.escalated}
									onValueChange={(v) =>
										setEscalationForm((f) => ({
											...f,
											escalated: v as "yes" | "no",
										}))
									}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="no">No</SelectItem>
										<SelectItem value="yes">Yes</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{escalationForm.escalated === "yes" ? (
								<>
									<div>
										<FieldLabel>Escalation reason</FieldLabel>
										<Select
											value={escalationForm.escalationReason || undefined}
											onValueChange={(v) =>
												setEscalationForm((f) => ({
													...f,
													escalationReason: v as EscalationReason,
												}))
											}
										>
											<SelectTrigger className={fieldClass}>
												<SelectValue placeholder="Select reason" />
											</SelectTrigger>
											<SelectContent>
												{ESCALATION_REASON_OPTIONS.map((key) => (
													<SelectItem key={key} value={key}>
														{ESCALATION_REASON_LABEL[key]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<FieldLabel>Escalated to</FieldLabel>
										<Select
											value={escalationForm.escalatedTo || undefined}
											onValueChange={(v) =>
												setEscalationForm((f) => ({
													...f,
													escalatedTo: v as EscalatedTo,
												}))
											}
										>
											<SelectTrigger className={fieldClass}>
												<SelectValue placeholder="Select team" />
											</SelectTrigger>
											<SelectContent>
												{ESCALATED_TO_OPTIONS.map((key) => (
													<SelectItem key={key} value={key}>
														{ESCALATED_TO_LABEL[key]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="sm:col-span-2">
										<FieldLabel>Escalation status</FieldLabel>
										<Select
											value={escalationForm.escalationWorkflowStatus}
											onValueChange={(v) =>
												setEscalationForm((f) => ({
													...f,
													escalationWorkflowStatus:
														v as EscalationWorkflowStatus,
												}))
											}
										>
											<SelectTrigger className={fieldClass}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{ESCALATION_WORKFLOW_OPTIONS.map((key) => (
													<SelectItem key={key} value={key}>
														{ESCALATION_WORKFLOW_LABEL[key]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="sm:col-span-2">
										<FieldLabel>Notes</FieldLabel>
										<Textarea
											value={escalationForm.blockerNotes}
											onChange={(e) =>
												setEscalationForm((f) => ({
													...f,
													blockerNotes: e.target.value,
												}))
											}
											rows={3}
											placeholder={
												escalationForm.escalationReason === "other"
													? "Describe escalation reason"
													: "Additional escalation context"
											}
											className="min-h-[88px] resize-none rounded-sm border-border bg-background text-sm shadow-none"
										/>
									</div>
								</>
							) : (
								<p className="sm:col-span-2 text-xs text-muted-foreground">
									Set Escalated to Yes when progress is blocked and needs
									assistance.
								</p>
							)}
						</div>
					</SectionCard>
				) : null}

				{tab === "status" ? (
					<SectionCard
						title="Status"
						description="Overall operational status of this TPA/TPV"
						action={
							<Button
								size="sm"
								className="h-8"
								disabled={saving || updateCase.isPending}
								onClick={() => void saveStatus()}
							>
								<Save className="mr-1.5 size-3.5" />
								Save
							</Button>
						}
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<FieldLabel>Status</FieldLabel>
								<Select
									value={statusForm.operationalStatus}
									onValueChange={(v) =>
										setStatusForm({
											operationalStatus: v as OperationalStatus,
										})
									}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{OPERATIONAL_STATUS_OPTIONS.map((key) => (
											<SelectItem key={key} value={key}>
												{OPERATIONAL_STATUS_LABEL[key]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="sm:col-span-2 rounded-sm border border-border/50 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
								Migration workflow status:{" "}
								<span className="font-medium text-foreground">
									{MIGRATION_STATUS_LABEL[row.status]}
								</span>
								{row.currentStage ? (
									<>
										{" "}
										· Stage:{" "}
										<span className="font-medium text-foreground">
											{row.currentStage}
										</span>
									</>
								) : null}
							</div>
						</div>
					</SectionCard>
				) : null}

				{tab === "ip_whitelisting" ? (
					<SectionCard
						title="IP whitelisting"
						description="Current IP whitelisting stage for this vendor"
						action={
							<Button
								size="sm"
								className="h-8"
								disabled={
									saving || updateCase.isPending || setWhitelist.isPending
								}
								onClick={() => void saveIpWhitelisting()}
							>
								<Save className="mr-1.5 size-3.5" />
								Save
							</Button>
						}
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<FieldLabel>IP whitelisting</FieldLabel>
								<Select
									value={ipWhitelistingForm.ipWhitelistingStatus}
									onValueChange={(v) =>
										setIpWhitelistingForm({
											ipWhitelistingStatus: v as IpWhitelistingStatus,
										})
									}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{IP_WHITELISTING_OPTIONS.map((key) => (
											<SelectItem key={key} value={key}>
												{IP_WHITELISTING_LABEL[key]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</SectionCard>
				) : null}

				{tab === "edi_analyst" ? (
					<SectionCard
						title="EDI analyst"
						description="Assign the EDI analyst responsible for this TPA/TPV"
						action={
							<Button
								size="sm"
								className="h-8"
								disabled={saving || updateCase.isPending}
								onClick={() => void saveEdiAnalyst()}
							>
								<Save className="mr-1.5 size-3.5" />
								Save
							</Button>
						}
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<FieldLabel>Assigned EDI analyst</FieldLabel>
								<Select
									value={ediAnalystForm.assignedToId || "__none__"}
									onValueChange={(value) =>
										setEdiAnalystForm({
											assignedToId: value === "__none__" ? "" : value,
										})
									}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue placeholder="Unassigned" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">Unassigned</SelectItem>
										{(usersQ.data ?? []).map((user) => (
											<SelectItem key={user.id} value={user.id}>
												{user.full_name?.trim() ||
													[user.first_name, user.last_name]
														.filter(Boolean)
														.join(" ")
														.trim() ||
													user.username ||
													user.email}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<FieldLabel>Assignment date</FieldLabel>
								<Input
									readOnly
									value={
										row.ediAnalystAssignedAt
											? formatDisplayDateTime(row.ediAnalystAssignedAt)
											: "—"
									}
									className={cn(fieldClass, "bg-muted/20")}
								/>
							</div>
							<div>
								<FieldLabel>Assigned by</FieldLabel>
								<Input
									readOnly
									value={row.ediAnalystAssignedBy || "—"}
									className={cn(fieldClass, "bg-muted/20")}
								/>
							</div>
							<div className="sm:col-span-2">
								<FieldLabel>Previous analyst</FieldLabel>
								<Input
									readOnly
									value={
										row.ediAnalystPreviousName ||
										(row.ediAnalystPreviousId
											? analystLabelFromId(row.ediAnalystPreviousId)
											: "—") ||
										"—"
									}
									className={cn(fieldClass, "bg-muted/20")}
								/>
							</div>
						</div>
					</SectionCard>
				) : null}

				{tab === "documents" ? (
					<SectionCard
						title="Documents"
						description="Files uploaded for this migration case"
						action={
							<>
								<input
									ref={documentInputRef}
									type="file"
									className="hidden"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) void handleDocumentUpload(file);
										e.target.value = "";
									}}
								/>
								<Button
									size="sm"
									className="h-8"
									disabled={saving || uploadDoc.isPending}
									onClick={() => documentInputRef.current?.click()}
								>
									<Upload className="mr-1.5 size-3.5" />
									Upload
								</Button>
							</>
						}
					>
						{documentsQ.isLoading ? (
							<p className="text-xs text-muted-foreground">
								Loading documents…
							</p>
						) : (documentsQ.data ?? []).length === 0 ? (
							<div className="rounded-sm border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center">
								<FileText className="mx-auto size-8 text-muted-foreground/40" />
								<p className="mt-2 text-sm font-medium text-foreground">
									No documents yet
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									Upload feed files or supporting documents for this case.
								</p>
							</div>
						) : (
							<ul className="divide-y divide-border/50 rounded-sm border border-border/40">
								{(documentsQ.data ?? []).map((doc) => (
									<li
										key={doc.id}
										className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
									>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">{doc.name}</p>
											<p className="text-[11px] text-muted-foreground">
												{doc.created_at
													? new Date(doc.created_at).toLocaleString()
													: "—"}
												{doc.size_bytes != null
													? ` · ${formatDocumentSize(doc.size_bytes)}`
													: ""}
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-1">
											{doc.web_url ? (
												<Button
													variant="ghost"
													size="sm"
													className="h-8"
													asChild
												>
													<a
														href={doc.web_url}
														target="_blank"
														rel="noopener noreferrer"
													>
														<ExternalLink className="mr-1 size-3.5" />
														Open
													</a>
												</Button>
											) : null}
											<Button
												variant="ghost"
												size="sm"
												className="h-8 text-destructive hover:text-destructive"
												disabled={saving || deleteDoc.isPending}
												onClick={() => void handleDocumentDelete(doc.id)}
											>
												<Trash2 className="mr-1 size-3.5" />
												Remove
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</SectionCard>
				) : null}

				{tab === "history" ? (
					<SectionCard
						title="Activity history"
						description="Full timeline of migration updates and status changes"
					>
						{historyQ.isLoading ? (
							<p className="text-xs text-muted-foreground">Loading history…</p>
						) : historyEvents.length === 0 ? (
							<div className="rounded-sm border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center">
								<History className="mx-auto size-8 text-muted-foreground/40" />
								<p className="mt-2 text-sm font-medium text-foreground">
									No history yet
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									Status changes and migration events will appear here.
								</p>
							</div>
						) : (
							<ol className="relative space-y-5 border-l border-border/60 pl-5">
								{historyEvents.map((event, index) => (
									<li key={event.id} className="relative">
										<span
											className={cn(
												"absolute -left-[23px] top-1 size-2.5 rounded-full ring-4 ring-card",
												HISTORY_DOT[event.tone] ?? "bg-muted-foreground"
											)}
										/>
										<div
											className={cn(
												"rounded-sm border border-border/40 bg-muted/5 px-3.5 py-3",
												index === 0 && "border-primary/20 bg-primary/5"
											)}
										>
											<p className="text-[11px] font-semibold tabular-nums text-foreground">
												{event.at}
											</p>
											<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
												{event.message}
											</p>
										</div>
									</li>
								))}
							</ol>
						)}
					</SectionCard>
				) : null}
			</div>
		</div>
	);
}

"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowLeft,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronDown,
	Clock3,
	Copy,
	Download,
	ExternalLink,
	Link2,
	Mail,
	MoreHorizontal,
	NotebookPen,
	Pencil,
	Phone,
	ScrollText,
	Send,
	Server,
	Upload,
	User,
	XCircle,
} from "lucide-react";
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { AuditTrailView } from "@/features/admin/features/audit-trail/components/AuditTrailView";
import { useContractsList } from "@/features/admin/features/contracts/feature/queries/useContractsQuery";
import type { FileRun } from "@/features/admin/features/file-management/mock-data";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useUpdateVendorMutation,
	useVendor,
} from "@/features/shared/vms/queries";
import type { VendorStatus } from "@/features/shared/vms/types";
import { formatDate } from "@/features/shared/vms/utils";
import { Link } from "@/i18n/navigation";
import {
	buildAcceptUrl,
	getPendingInviteByVendorId,
} from "@/lib/auth/vendor-invites";
import { cn } from "@/lib/utils";
import type {
	ConnectionDto,
	InboundFileDto,
	IntakeJobDto,
} from "@/lib/vendor-core/types";
import { useAdminModuleStore } from "@/stores/admin-module-store";

import { VendorAccountsTab } from "../components/VendorAccountsTab";
import {
	VendorActionsMenu,
	vendorModelToActionsTarget,
} from "../components/VendorActionsMenu";
import { VendorConfigurationTab } from "../components/VendorConfigurationTab";
import { VendorContractsTab } from "../components/VendorContractsTab";
import { VendorNotesTab } from "../components/VendorNotesTab";
import { VendorOperationsTab } from "../components/VendorOperationsTab";
import {
	accountDtoToRow,
	mergeAccountOpsSummary,
} from "../feature/mappers/accountMappers";
import {
	listInboundFileEvents,
	useCreateIntakeJobMutation,
	useCreateVendorAccountMutation,
	useCreateVendorNoteMutation,
	useDeleteVendorAccountMutation,
	useInvalidateVendorCore,
	useReprocessInboundFileMutation,
	useRunIntakeJobMutation,
	useTestConnectionMutation,
	useUpdateConnectionMutation,
	useUpdateIntakeJobMutation,
	useUpdateVendorAccountMutation,
	useVendorAccountOpsQuery,
	useVendorAccountsQuery,
	useVendorConnectionsQuery,
	useVendorInboundFilesQuery,
	useVendorJobsQuery,
} from "../feature/queries/useVendorsQuery";
import {
	buildTrendFromRuns,
	buildVendorAlerts,
	buildVendorIntegrationProfile,
	connectionToSftp,
	inboundFilesToRuns,
	intakeJobsToConfigJobs,
} from "../live-vendor-detail";
import { runBucket } from "../vendor-types";

const TABS = [
	"Overview",
	"Operations",
	"Configuration",
	"Accounts",
	"Contracts",
	"Audit Trail",
	"Notes",
] as const;

const EMPTY_CONNECTIONS: ConnectionDto[] = [];
const EMPTY_JOBS: IntakeJobDto[] = [];
const EMPTY_INBOUND_FILES: InboundFileDto[] = [];

type Tab = (typeof TABS)[number];

const STATUSES: VendorStatus[] = [
	"prospect",
	"invited",
	"onboarding",
	"under_review",
	"active",
	"suspended",
	"offboarded",
];

function formatVendorCode(id: string, code?: string | null) {
	if (code?.trim()) return code.trim();
	if (/^VND-/i.test(id)) return id;
	const digits = id.replace(/\D/g, "");
	if (digits && digits.length <= 6) {
		return `VND-${digits.padStart(4, "0")}`;
	}
	return id.slice(0, 8).toUpperCase();
}

function initials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 1)
		.map((p) => p[0]?.toUpperCase() ?? "")
		.join("");
}

function HealthIndicator({ health }: { health: string }) {
	const label =
		health === "healthy"
			? "Healthy"
			: health === "failed"
				? "Failed"
				: health === "warning"
					? "Warning"
					: "In Progress";
	const Icon =
		health === "healthy"
			? CheckCircle2
			: health === "failed"
				? XCircle
				: health === "warning"
					? AlertTriangle
					: Clock3;
	const tone =
		health === "healthy"
			? "emerald"
			: health === "failed"
				? "red"
				: health === "warning"
					? "amber"
					: "sky";

	return (
		<div className="flex items-center gap-1.5">
			<Icon
				className={cn(
					"size-4 shrink-0",
					tone === "emerald" && "text-emerald-600",
					tone === "amber" && "text-amber-600",
					tone === "red" && "text-red-600",
					tone === "sky" && "text-sky-600"
				)}
			/>
			<span
				className={cn(
					"text-sm font-semibold",
					tone === "emerald" && "text-emerald-800",
					tone === "amber" && "text-amber-900",
					tone === "red" && "text-red-800",
					tone === "sky" && "text-sky-800"
				)}
			>
				{label}
			</span>
		</div>
	);
}

function ActiveStatusPill({ status }: { status: string }) {
	if (status === "active") {
		return (
			<span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
				Active
			</span>
		);
	}
	return <StatusBadge status={status} />;
}

function ActivityStatus({ status }: { status: string }) {
	const bucket = runBucket(status as never);
	if (bucket === "success")
		return (
			<span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
				Success
			</span>
		);
	if (bucket === "failed")
		return (
			<span className="inline-flex items-center rounded-md border border-red-200/80 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-900">
				Failed
			</span>
		);
	if (bucket === "warning")
		return (
			<span className="inline-flex items-center rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
				Warning
			</span>
		);
	if (bucket === "in_progress")
		return (
			<span className="inline-flex items-center rounded-md border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-900">
				In Progress
			</span>
		);
	return <StatusBadge status={status} />;
}

const META_ICON_TONES = [
	"bg-sky-500/15 text-sky-700 ring-sky-500/20",
	"bg-violet-500/15 text-violet-700 ring-violet-500/20",
	"bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
	"bg-amber-500/15 text-amber-700 ring-amber-500/20",
	"bg-primary/15 text-primary ring-primary/20",
] as const;

function MetaItem({
	label,
	value,
	icon: Icon,
	toneIndex = 0,
}: {
	label: string;
	value: ReactNode;
	icon?: React.ComponentType<{ className?: string }>;
	toneIndex?: number;
}) {
	const tone = META_ICON_TONES[toneIndex % META_ICON_TONES.length];
	return (
		<div className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
			{Icon ? (
				<div
					className={cn(
						"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
						tone
					)}
				>
					<Icon className="size-3.5" />
				</div>
			) : null}
			<div className="min-w-0">
				<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
					{label}
				</p>
				<div className="mt-1 text-sm font-semibold break-words text-foreground">
					{value ?? "—"}
				</div>
			</div>
		</div>
	);
}

export function VendorDetailPage() {
	return (
		<VendorCoreGate title="Vendor">
			<VendorDetailView />
		</VendorCoreGate>
	);
}

function VendorDetailView() {
	const params = useParams<{
		id?: string;
		vendorId?: string;
		locale?: string;
	}>();
	const vendorId = params.vendorId ?? params.id;
	const locale = params.locale ?? "en";
	const { vendor, isLoading, error } = useVendor(vendorId);
	const connectionsQuery = useVendorConnectionsQuery(vendorId);
	const jobsQuery = useVendorJobsQuery(vendorId);
	const inboundFilesQuery = useVendorInboundFilesQuery(
		vendorId ? { vendor_id: vendorId } : undefined
	);
	const accountsQuery = useVendorAccountsQuery(vendorId, Boolean(vendorId));
	const accountOpsQuery = useVendorAccountOpsQuery(vendorId, Boolean(vendorId));
	const updateAccountMutation = useUpdateVendorAccountMutation();
	const createAccountMutation = useCreateVendorAccountMutation(
		String(vendorId)
	);
	const deleteAccountMutation = useDeleteVendorAccountMutation();
	const runJobMutation = useRunIntakeJobMutation();
	const updateJobMutation = useUpdateIntakeJobMutation();
	const createJobMutation = useCreateIntakeJobMutation();
	const reprocessMutation = useReprocessInboundFileMutation();
	const testConnectionMutation = useTestConnectionMutation();
	const updateConnectionMutation = useUpdateConnectionMutation();
	const invalidateVendorCore = useInvalidateVendorCore();
	const { contracts } = useContractsList(vendorId);
	const updateVendor = useUpdateVendorMutation();
	const [editOpen, setEditOpen] = useState(false);
	const [tab, setTab] = useState<Tab>("Overview");
	const [status, setStatus] = useState<VendorStatus>("prospect");
	const [trendRange, setTrendRange] = useState("7");
	const [inviteTick, setInviteTick] = useState(0);
	const [pendingInvite, setPendingInvite] = useState(() =>
		vendorId ? getPendingInviteByVendorId(String(vendorId)) : null
	);

	useEffect(() => {
		if (vendor) setStatus(vendor.status);
	}, [vendor]);

	useEffect(() => {
		if (!vendor) {
			setPendingInvite(null);
			return;
		}
		setPendingInvite(getPendingInviteByVendorId(vendor.id));
	}, [vendor, inviteTick]);

	const displayName = vendor?.tradeName ?? vendor?.legalName ?? "Vendor";
	const primary =
		vendor?.contacts.find((c) => c.isPrimary) ?? vendor?.contacts[0];

	const connections = connectionsQuery.data ?? EMPTY_CONNECTIONS;
	const jobs = jobsQuery.data ?? EMPTY_JOBS;
	const inboundFiles = inboundFilesQuery.data ?? EMPTY_INBOUND_FILES;

	const accounts = useMemo(() => {
		const opsByAccount = new Map(
			(accountOpsQuery.data ?? []).map((row) => [row.account_id, row])
		);
		return (accountsQuery.data ?? []).map((dto) =>
			mergeAccountOpsSummary(accountDtoToRow(dto), opsByAccount.get(dto.id))
		);
	}, [accountsQuery.data, accountOpsQuery.data]);

	const integration = useMemo(() => {
		if (!vendor) return null;
		return buildVendorIntegrationProfile(
			vendor,
			connections,
			jobs,
			accounts.length
		);
	}, [vendor, connections, jobs, accounts.length]);

	const configJobs = useMemo(() => intakeJobsToConfigJobs(jobs), [jobs]);

	const sftpConnection = useMemo(() => {
		if (!vendor || !integration) return null;
		return connectionToSftp(connections[0], displayName, integration.health);
	}, [vendor, integration, connections, displayName]);

	const programFilter = useAdminModuleStore((s) => s.fileType);
	const [runLogs, setRunLogs] = useState<
		Record<string, Awaited<ReturnType<typeof listInboundFileEvents>>>
	>({});

	useEffect(() => {
		const files = inboundFilesQuery.data;
		if (!files?.length) {
			setRunLogs({});
			return;
		}
		let cancelled = false;
		const top = files.slice(0, 8);
		Promise.all(
			top.map((file) =>
				listInboundFileEvents(file.id).then(
					(events) => [file.id, events] as const
				)
			)
		)
			.then((entries) => {
				if (!cancelled) setRunLogs(Object.fromEntries(entries));
			})
			.catch(() => {
				if (!cancelled) setRunLogs({});
			});
		return () => {
			cancelled = true;
		};
	}, [inboundFilesQuery.data]);

	const runs = useMemo((): FileRun[] => {
		if (!vendor) return [];
		const all = inboundFilesToRuns(inboundFiles, vendor.id, displayName).map(
			(run) => ({
				...run,
				logs: (runLogs[run.id] ?? []).map((event, index) => {
					const rawLevel = (event.level ?? "info").toLowerCase();
					let level: "error" | "info" | "warn" | "debug" = "info";
					if (rawLevel === "error") level = "error";
					else if (rawLevel === "warn" || rawLevel === "warning")
						level = "warn";
					else if (rawLevel === "debug") level = "debug";
					return {
						id: `${run.id}-log-${index}`,
						at: event.occurred_at ?? event.created_at ?? "—",
						level,
						message: event.message,
						component: event.source ?? event.stage ?? "pipeline",
					};
				}),
			})
		);
		if (programFilter) {
			return all.filter((run) => run.program === programFilter);
		}
		return all;
	}, [vendor, inboundFiles, displayName, programFilter, runLogs]);

	const alerts = useMemo(() => {
		if (!vendor) return [];
		return buildVendorAlerts(
			vendor.id,
			displayName,
			connections,
			inboundFiles,
			runs
		);
	}, [vendor, displayName, connections, inboundFiles, runs]);

	const fileTypePie = useMemo(() => {
		if (runs.length === 0) return [];
		const counts = new Map<string, number>();
		for (const run of runs) {
			counts.set(run.fileType, (counts.get(run.fileType) ?? 0) + 1);
		}
		const colors = ["#13446c", "#059669", "#d97706", "#0284c7", "#7c3aed"];
		const rawTotal = runs.length;
		return Array.from(counts.entries()).map(([name, value], i) => ({
			name,
			value,
			pct: ((value / rawTotal) * 100).toFixed(1),
			color: colors[i % colors.length]!,
		}));
	}, [runs]);

	const totalFiles30 = fileTypePie.reduce((sum, item) => sum + item.value, 0);

	const trend = useMemo(() => buildTrendFromRuns(runs), [runs]);

	const inviteHref = useMemo(() => {
		if (!vendor) return "/admin/vendors/invite";
		const params = new URLSearchParams();
		params.set("legalName", vendor.legalName);
		if (primary?.email) params.set("email", primary.email);
		if (vendor.categories.length) {
			params.set("categories", vendor.categories.join(", "));
		}
		return `/admin/vendors/invite?${params.toString()}`;
	}, [vendor, primary]);

	async function copyPendingInviteLink() {
		if (!pendingInvite) {
			toast.info("No pending invite link for this vendor.", {
				description: "Create one with Invite contact.",
			});
			return;
		}
		try {
			await navigator.clipboard.writeText(
				buildAcceptUrl(locale, pendingInvite.token)
			);
			toast.success("Accept link copied");
			setInviteTick((n) => n + 1);
		} catch {
			toast.error("Could not copy invite link");
		}
	}

	async function saveStatus() {
		if (!vendor) return;
		try {
			await updateVendor.mutateAsync({ id: vendor.id, patch: { status } });
			toast.success("Vendor status updated");
		} catch (mutationError) {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update vendor"
			);
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-40 w-full rounded-xl" />
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	if (error || !vendor || !integration) {
		return (
			<div className="space-y-4">
				<Link
					href="/admin/vendors"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					Vendors
				</Link>
				<p className="text-sm text-destructive">
					{error?.message ?? "Vendor not found."}
				</p>
			</div>
		);
	}

	const tabCounts: Partial<Record<Tab, number>> = {
		Accounts: accounts.length || integration.accountsCount,
		Contracts: contracts.length,
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="space-y-4 rounded-xl border border-primary/20 bg-card p-5 shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex min-w-0 items-center gap-3">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm ring-4 ring-primary/15">
							{initials(displayName)}
						</div>
						<div className="min-w-0 space-y-1">
							<div className="flex flex-wrap items-center gap-2.5">
								<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
									{displayName}
								</h1>
								<ActiveStatusPill status={vendor.status} />
							</div>
							<p className="font-mono text-xs font-medium text-primary">
								{formatVendorCode(vendor.id, vendor.tags[0])} ·{" "}
								{integration.vendorType}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{(vendor.status === "invited" || vendor.status === "prospect") &&
						pendingInvite ? (
							<Button
								variant="outline"
								size="sm"
								className="h-9 border-primary/25 text-xs font-semibold"
								onClick={copyPendingInviteLink}
							>
								<Link2 className="mr-1.5 size-3.5" />
								Copy invite link
							</Button>
						) : null}
						<Button
							variant="outline"
							size="sm"
							className="h-9 border-primary/25 text-xs font-semibold"
							onClick={() => setEditOpen(true)}
						>
							<Pencil className="mr-1.5 size-3.5" />
							Edit Vendor
						</Button>
						<VendorActionsMenu
							vendor={vendorModelToActionsTarget(vendor)}
							redirectOnDelete="/admin/vendors"
							menuClassName="w-56"
							editOpen={editOpen}
							onEditOpenChange={setEditOpen}
							trigger={
								<Button
									variant="outline"
									size="sm"
									className="h-9 border-primary/25 text-xs font-semibold"
								>
									More Actions
									<ChevronDown className="ml-1.5 size-3.5" />
								</Button>
							}
							extraItems={
								<>
									<div className="px-2 py-1.5">
										<p className="mb-1 text-xs font-medium text-muted-foreground">
											Set status
										</p>
										<Select
											value={status}
											onValueChange={(v) => setStatus(v as VendorStatus)}
										>
											<SelectTrigger className="h-8 w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{STATUSES.map((s) => (
													<SelectItem key={s} value={s}>
														{s.replace(/_/g, " ")}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button
											size="sm"
											className="mt-2 h-8 w-full"
											onClick={saveStatus}
											disabled={
												updateVendor.isPending || status === vendor.status
											}
										>
											Save status
										</Button>
									</div>
									<DropdownMenuItem asChild>
										<Link href="/admin/file-monitoring">
											View file monitoring
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/admin/processing-logs">
											View processing logs
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href={inviteHref}>Invite contact</Link>
									</DropdownMenuItem>
									{pendingInvite ? (
										<DropdownMenuItem onClick={copyPendingInviteLink}>
											<Copy className="mr-2 size-3.5" />
											Copy invite link
										</DropdownMenuItem>
									) : null}
								</>
							}
						/>
					</div>
				</div>

				{/* Metadata */}
				<div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					<MetaItem
						label="Vendor Type"
						value={integration.vendorType}
						icon={Building2}
						toneIndex={0}
					/>
					<MetaItem
						label="Primary Contact"
						value={
							primary ? (
								<div>
									<p>{primary.name}</p>
									{primary.email ? (
										<p className="mt-0.5 text-xs font-normal text-muted-foreground">
											{primary.email}
										</p>
									) : null}
									{primary.phone ? (
										<p className="text-xs font-normal text-muted-foreground">
											{primary.phone}
										</p>
									) : null}
								</div>
							) : (
								"—"
							)
						}
						icon={User}
						toneIndex={1}
					/>
					<MetaItem
						label="Phone"
						value={primary?.phone ?? "—"}
						icon={Phone}
						toneIndex={2}
					/>
					<MetaItem
						label="Email"
						value={primary?.email ?? "—"}
						icon={Mail}
						toneIndex={3}
					/>
					<MetaItem
						label="SFTP Server"
						value={
							<span className="font-mono text-xs">{integration.sftpHost}</span>
						}
						icon={Server}
						toneIndex={4}
					/>
					<MetaItem
						label="Time Zone"
						value={integration.timezone}
						icon={Clock3}
						toneIndex={0}
					/>
					<MetaItem
						label="Created On"
						value={formatDate(vendor.createdAt)}
						icon={Calendar}
						toneIndex={1}
					/>
					<MetaItem
						label="Created By"
						value={integration.createdBy}
						icon={User}
						toneIndex={2}
					/>
					<MetaItem
						label="Last Updated"
						value={formatDate(vendor.updatedAt)}
						icon={Calendar}
						toneIndex={3}
					/>
					<div className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
						<div
							className={cn(
								"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
								integration.health === "healthy"
									? "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20"
									: integration.health === "failed"
										? "bg-red-500/15 text-red-700 ring-red-500/20"
										: integration.health === "warning"
											? "bg-amber-500/15 text-amber-700 ring-amber-500/20"
											: "bg-sky-500/15 text-sky-700 ring-sky-500/20"
							)}
						>
							<CheckCircle2 className="size-3.5" />
						</div>
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Health Indicator
							</p>
							<div className="mt-1">
								<HealthIndicator health={integration.health} />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<nav
				className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
				aria-label="Vendor sections"
			>
				{TABS.map((item) => (
					<button
						key={item}
						type="button"
						onClick={() => setTab(item)}
						className={cn(
							"rounded-lg border px-2.5 py-2.5 text-center text-xs font-semibold transition-colors shadow-sm",
							tab === item
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
						)}
					>
						{item}
						{tabCounts[item] != null && (
							<span
								className={cn(
									"ml-1 text-xs font-medium",
									tab === item
										? "text-primary-foreground/80"
										: "text-muted-foreground"
								)}
							>
								({tabCounts[item]})
							</span>
						)}
					</button>
				))}
			</nav>

			{tab === "Overview" && (
				<div className="min-w-0 space-y-5">
					<section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3.5">
							<div>
								<h2 className="text-sm font-semibold tracking-tight text-foreground">
									Recent File Activity
								</h2>
								<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
									Latest inbound and outbound file runs for this vendor.
								</p>
							</div>
							<button
								type="button"
								className="text-xs font-semibold text-primary hover:underline"
								onClick={() => setTab("Operations")}
							>
								View all file history →
							</button>
						</div>
						<ScrollArea className="w-full">
							<div className="min-w-[900px]">
								<Table className="text-xs">
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="pl-4">File Type</TableHead>
											<TableHead>File Name</TableHead>
											<TableHead>Frequency</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Records</TableHead>
											<TableHead>Received</TableHead>
											<TableHead>Processed</TableHead>
											<TableHead>Duration</TableHead>
											<TableHead className="pr-4 text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{runs.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={9}
													className="h-24 text-center text-muted-foreground"
												>
													No file activity for this vendor yet.
												</TableCell>
											</TableRow>
										) : (
											runs.slice(0, 6).map((run) => (
												<TableRow key={run.id} className="hover:bg-muted/30">
													<TableCell className="pl-4 font-medium">
														{run.fileType}
													</TableCell>
													<TableCell className="max-w-[220px] truncate font-mono text-[11px] text-muted-foreground">
														{run.fileName ?? "—"}
													</TableCell>
													<TableCell className="text-muted-foreground">
														{run.frequency}
													</TableCell>
													<TableCell>
														<ActivityStatus status={run.status} />
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{run.records ?? "—"}
													</TableCell>
													<TableCell className="tabular-nums text-muted-foreground">
														{run.receivedAt?.slice(11, 16) ?? "—"}
													</TableCell>
													<TableCell className="tabular-nums text-muted-foreground">
														{run.completedAt?.slice(11, 16) ?? "—"}
													</TableCell>
													<TableCell className="tabular-nums text-muted-foreground">
														{run.duration ?? "—"}
													</TableCell>
													<TableCell className="pr-4 text-right">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="size-8"
																>
																	<MoreHorizontal className="size-3.5" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem asChild>
																	<Link
																		href={`/admin/file-monitoring/${run.id}`}
																	>
																		View run detail
																	</Link>
																</DropdownMenuItem>
																{run.issues?.[0] ? (
																	<DropdownMenuItem asChild>
																		<Link
																			href={`/admin/file-monitoring/${run.id}/investigate/${run.issues[0].id}`}
																		>
																			Investigate
																		</Link>
																	</DropdownMenuItem>
																) : null}
																<DropdownMenuItem asChild>
																	<Link
																		href={`/admin/file-monitoring/${run.id}/processing-logs`}
																	>
																		Processing logs
																	</Link>
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</ScrollArea>
					</section>

					<div className="grid min-w-0 gap-4 lg:grid-cols-2">
						<section className="rounded-xl border border-border bg-card shadow-sm">
							<div className="border-b border-border bg-sky-500/10 px-4 py-3.5">
								<h2 className="text-sm font-semibold tracking-tight text-foreground">
									File Type Summary
								</h2>
								<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
									Distribution of processed files over the last 30 days.
								</p>
							</div>
							<div className="flex items-center gap-5 p-4">
								<div className="relative h-36 w-36 shrink-0">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={
													fileTypePie.length
														? fileTypePie
														: [{ name: "None", value: 1, color: "#e2e8f0" }]
												}
												dataKey="value"
												nameKey="name"
												innerRadius={40}
												outerRadius={62}
												paddingAngle={fileTypePie.length ? 2 : 0}
											>
												{(fileTypePie.length
													? fileTypePie
													: [{ name: "None", value: 1, color: "#e2e8f0" }]
												).map((entry) => (
													<Cell key={entry.name} fill={entry.color} />
												))}
											</Pie>
											{fileTypePie.length ? <Tooltip /> : null}
										</PieChart>
									</ResponsiveContainer>
									<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
										<span className="text-lg font-semibold tabular-nums leading-none">
											{totalFiles30}
										</span>
										<span className="mt-1 text-[10px] font-medium text-muted-foreground">
											Total
										</span>
									</div>
								</div>
								<ul className="min-w-0 flex-1 space-y-2.5">
									{fileTypePie.length === 0 ? (
										<li className="text-sm text-muted-foreground">
											No file types recorded yet.
										</li>
									) : (
										fileTypePie.map((item) => (
											<li
												key={item.name}
												className="flex items-center justify-between gap-3 text-sm"
											>
												<span className="flex min-w-0 items-center gap-2">
													<span
														className="size-2 shrink-0 rounded-full"
														style={{ backgroundColor: item.color }}
													/>
													<span className="truncate">{item.name}</span>
												</span>
												<span className="shrink-0 tabular-nums text-muted-foreground">
													{item.value}{" "}
													<span className="text-xs">({item.pct}%)</span>
												</span>
											</li>
										))
									)}
								</ul>
							</div>
						</section>

						<section
							id="trend"
							className="rounded-xl border border-border bg-card shadow-sm"
						>
							<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-emerald-500/10 px-4 py-3.5">
								<div>
									<h2 className="text-sm font-semibold tracking-tight text-foreground">
										Processing Trend
									</h2>
									<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
										Successful, warning, and failed runs over time.
									</p>
								</div>
								<Select value={trendRange} onValueChange={setTrendRange}>
									<SelectTrigger className="h-8 w-32 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="7">Last 7 Days</SelectItem>
										<SelectItem value="14">Last 14 Days</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="h-52 p-4 pt-2">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={trend}>
										<CartesianGrid
											strokeDasharray="3 3"
											className="stroke-border/50"
										/>
										<XAxis dataKey="day" tick={{ fontSize: 11 }} />
										<YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
										<Tooltip />
										<Legend wrapperStyle={{ fontSize: 11 }} />
										<Line
											type="monotone"
											dataKey="successful"
											name="Successful"
											stroke="#059669"
											strokeWidth={2}
											dot={false}
										/>
										<Line
											type="monotone"
											dataKey="warnings"
											name="Warnings"
											stroke="#d97706"
											strokeWidth={2}
											dot={false}
										/>
										<Line
											type="monotone"
											dataKey="failed"
											name="Failed"
											stroke="#dc2626"
											strokeWidth={2}
											dot={false}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</section>
					</div>

					<div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
						<section className="rounded-xl border border-border bg-card shadow-sm">
							<div className="flex items-center justify-between gap-2 border-b border-border bg-primary/10 px-4 py-3.5">
								<div>
									<h2 className="text-sm font-semibold tracking-tight text-foreground">
										Vendor Details
									</h2>
									<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
										Core profile and integration settings.
									</p>
								</div>
								<span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
									{formatVendorCode(vendor.id)}
								</span>
							</div>
							<div className="grid gap-x-8 gap-y-0 p-2 sm:grid-cols-2">
								{[
									["Vendor ID", formatVendorCode(vendor.id)],
									["Vendor Type", integration.vendorType],
									["Status", vendor.status.replace(/_/g, " ")],
									[
										"Contracts",
										contracts.length
											? `${contracts.length} active`
											: "None linked",
									],
									["SLA", `${integration.slaPercent.toFixed(2)}%`],
									["File Transmission Method", integration.transmissionMethod],
									["Encryption", integration.encryption],
									["File Format", integration.fileFormats.join(", ") || "—"],
									["Communication Protocol", integration.protocol],
									["Trading Partner ID", integration.tradingPartnerId],
									["Time Zone", integration.timezone],
								].map(([label, value]) => (
									<div
										key={label}
										className="flex items-start justify-between gap-3 border-b border-border/40 px-2 py-2.5 last:border-b sm:[&:nth-last-child(-n+2)]:border-b-0"
									>
										<span className="text-xs text-muted-foreground">
											{label}
										</span>
										<span className="max-w-[58%] text-right text-xs font-medium capitalize">
											{label === "Status" ? (
												<ActiveStatusPill status={vendor.status} />
											) : label === "Contracts" && contracts[0] ? (
												<Link
													href={`/admin/contracts/${contracts[0].id}`}
													className="inline-flex items-center gap-1 text-primary normal-case hover:underline"
												>
													View Document
													<ExternalLink className="size-3" />
												</Link>
											) : (
												value
											)}
										</span>
									</div>
								))}
							</div>
							{integration.notes ? (
								<div className="border-t border-border/50 px-4 py-3">
									<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
										Notes
									</p>
									<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
										{integration.notes}
									</p>
								</div>
							) : null}
						</section>

						<section className="rounded-xl border border-border bg-card shadow-sm">
							<div className="border-b border-border bg-violet-500/10 px-4 py-3.5">
								<h2 className="text-sm font-semibold tracking-tight text-foreground">
									Quick Actions
								</h2>
								<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
									Common tasks for this vendor.
								</p>
							</div>
							<div className="grid gap-2 p-4 sm:grid-cols-2">
								{[
									{
										label: "Upload File",
										href: "/admin/file-monitoring",
										icon: Upload,
									},
									{
										label: "View Schedules",
										href: "/admin/schedules",
										icon: Calendar,
									},
									{
										label: "View Processing Logs",
										href: "/admin/processing-logs",
										icon: ScrollText,
									},
									{
										label: "Send Test File",
										href: "/admin/file-monitoring",
										icon: Send,
									},
									{
										label: "Export Data",
										href: "#",
										icon: Download,
										onClick: () => {
											toast.success("Vendor data export started.");
										},
									},
									{
										label: "Add Note",
										href: "#",
										icon: NotebookPen,
										onClick: () => {
											setTab("Notes");
											toast.message("Switched to Notes tab");
										},
									},
								].map((action, index) => {
									const Icon = action.icon;
									const tones = [
										"bg-sky-500/15 text-sky-700 ring-sky-500/20",
										"bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
										"bg-amber-500/15 text-amber-700 ring-amber-500/20",
										"bg-violet-500/15 text-violet-700 ring-violet-500/20",
										"bg-primary/15 text-primary ring-primary/20",
										"bg-rose-500/15 text-rose-700 ring-rose-500/20",
									] as const;
									const tone = tones[index % tones.length];
									const className =
										"flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5";
									const content = (
										<>
											<div
												className={cn(
													"flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
													tone
												)}
											>
												<Icon className="size-4" />
											</div>
											<p className="text-sm font-semibold">{action.label}</p>
										</>
									);
									if (action.onClick) {
										return (
											<button
												key={action.label}
												type="button"
												className={className}
												onClick={action.onClick}
											>
												{content}
											</button>
										);
									}
									return (
										<Link
											key={action.label}
											href={action.href}
											className={className}
										>
											{content}
										</Link>
									);
								})}
							</div>
						</section>
					</div>
				</div>
			)}

			{tab === "Accounts" && (
				<VendorAccountsTab
					accounts={accounts}
					onUpdateAccount={async (id, patch) => {
						await updateAccountMutation.mutateAsync({ id, patch });
					}}
					onCreateAccount={async (input) => {
						await createAccountMutation.mutateAsync(input);
					}}
					onDeleteAccount={async (id) => {
						await deleteAccountMutation.mutateAsync(id);
					}}
				/>
			)}

			{tab === "Operations" && integration && (
				<VendorOperationsTab
					vendorId={vendor.id}
					vendorName={displayName}
					integration={integration}
					runs={runs}
					configJobs={configJobs}
					alerts={alerts}
					onRefresh={async () => {
						invalidateVendorCore();
						toast.success("Operations data refreshed.");
					}}
					onToggleJob={async (jobId, active) => {
						await updateJobMutation.mutateAsync({
							id: jobId,
							body: { status: active ? "active" : "paused" },
						});
						toast.success(active ? "Job resumed." : "Job paused.");
					}}
					onRunJob={async (jobId) => {
						await runJobMutation.mutateAsync(jobId);
						toast.success("Job run triggered.");
					}}
					onReprocessRun={async (runId) => {
						await reprocessMutation.mutateAsync(runId);
						toast.success("File reprocess queued.");
					}}
				/>
			)}

			{tab === "Configuration" && integration && sftpConnection && (
				<VendorConfigurationTab
					vendorId={vendor.id}
					vendorName={displayName}
					integration={integration}
					configJobs={configJobs}
					connection={sftpConnection}
					connectionId={connections[0]?.id ?? null}
					onCreateJob={async (draft) => {
						if (!connections[0]?.id) {
							throw new Error("Create a connection before adding jobs.");
						}
						await createJobMutation.mutateAsync({
							name: draft.name,
							vendor: vendor.id,
							connection: connections[0].id,
							file_type: draft.fileType.includes("837")
								? "837"
								: draft.fileType.includes("835")
									? "835"
									: draft.fileType.toLowerCase().includes("accum")
										? "accumulator"
										: "834",
							direction:
								draft.direction === "Outgoing" ? "outbound" : "inbound",
							schedule_cron:
								draft.frequency === "Hourly"
									? "0 * * * *"
									: draft.frequency === "Weekly"
										? "0 6 * * 1"
										: "0 6 * * *",
							schedule_timezone: "UTC",
							status: draft.status === "Active" ? "active" : "paused",
						});
					}}
					onUpdateJob={async (jobId, draft) => {
						await updateJobMutation.mutateAsync({
							id: jobId,
							body: {
								name: draft.name,
								status: draft.status === "Active" ? "active" : "paused",
								schedule_cron:
									draft.frequency === "Hourly"
										? "0 * * * *"
										: draft.frequency === "Weekly"
											? "0 6 * * 1"
											: "0 6 * * *",
							},
						});
					}}
					onDisableJob={async (jobId) => {
						await updateJobMutation.mutateAsync({
							id: jobId,
							body: { status: "disabled" },
						});
					}}
					onTestConnection={async () => {
						if (!connections[0]?.id) return;
						await testConnectionMutation.mutateAsync(connections[0].id);
						toast.success("Connection test completed.");
					}}
					onUpdateConnectionHost={async (host) => {
						if (!connections[0]?.id) return;
						const config = {
							...(connections[0].config ?? {}),
							host,
						};
						await updateConnectionMutation.mutateAsync({
							id: connections[0].id,
							body: { config },
						});
					}}
				/>
			)}

			{tab === "Contracts" && <VendorContractsTab vendorId={vendor.id} />}

			{tab === "Notes" && (
				<VendorNotesTab vendorId={vendor.id} vendorName={displayName} />
			)}

			{tab === "Audit Trail" && (
				<AuditTrailView vendorId={vendor.id} vendorName={displayName} />
			)}
		</div>
	);
}

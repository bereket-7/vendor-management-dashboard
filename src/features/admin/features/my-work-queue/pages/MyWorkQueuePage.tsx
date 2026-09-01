"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
	AlertTriangle,
	Beaker,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Link2,
	MoreHorizontal,
	Plus,
	RefreshCw,
	Search,
	SlidersHorizontal,
	StickyNote,
	Truck,
	Upload,
	Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import { useVendorCoreUsersQuery } from "@/features/admin/features/users/feature/queries/useUsersQuery";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type {
	MigrationCaseListQuery,
	WorkQueueImportResultDto,
} from "@/lib/vendor-core/types";

import { WorkQueueImportResultDialog } from "../components/WorkQueueImportResultDialog";
import {
	EdiAnalystProgressSection,
	EscalationStatusPill,
	EscalationSummarySection,
} from "../components/work-queue-analyst-escalation";
import {
	ProgressTrackCell,
	WorkQueueProgressOverview,
	WorkQueueRowActions,
} from "../components/work-queue-progress";
import {
	CURRENT_STAGE_OPTIONS,
	kpisToProgressSummary,
} from "../feature/mappers/workQueueMappers";
import {
	useBulkSetMigrationCaseStatusMutation,
	useImportWorkQueueSpreadsheetMutation,
	useInvalidateVendorCore,
	useUpdateMigrationCaseMutation,
	useUploadMigrationCaseDocumentMutation,
	useWorkQueueAnalystStatsQuery,
	useWorkQueueBlockersQuery,
	useWorkQueueEscalationSummaryQuery,
	useWorkQueueKpisQuery,
	useWorkQueueKpisRawQuery,
	useWorkQueueProgressSummaryQuery,
	useWorkQueueRowsPageQuery,
} from "../feature/queries/useWorkQueueQuery";
import { workQueueErrorMessage } from "../feature/workQueueErrors";
import { emptyProgressSummary } from "../progress-data";
import {
	type EscalationStatus,
	ESCALATION_STATUS_SELECT_OPTIONS,
	ESCALATION_STATUS_LABEL,
} from "../work-queue-analyst-escalation";
import {
	MIGRATION_STATUS_LABEL,
	type MigrationStatus,
	type TpaTpvRow,
	WORK_QUEUE_KPI,
	WHITELIST_STATUS_LABEL,
	type WhitelistStatus,
} from "../work-queue-types";
import type { WorkQueueFilterQuery } from "@/lib/vendor-core/types";

type ActionModal = "contacts" | null;

const KPI_ICON = {
	blue: Users,
	green: Link2,
	orange: Truck,
	purple: Beaker,
	red: AlertTriangle,
	slate: Clock3,
} as const;

const KPI_VALUE_TONE = {
	blue: "text-sky-700 dark:text-sky-400",
	green: "text-emerald-700 dark:text-emerald-400",
	orange: "text-orange-700 dark:text-orange-400",
	purple: "text-violet-700 dark:text-violet-400",
	red: "text-red-700 dark:text-red-400",
	slate: "text-muted-foreground",
} as const;

const th =
	"h-9 px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground";
const td = "px-2 py-2 text-[12px] align-middle text-foreground";

const compactFieldClass = cn(
	"h-8 rounded-md border border-border bg-background text-xs shadow-none",
	"hover:border-foreground/20",
	"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
);

const compactLabelClass =
	"text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label className={cn(compactLabelClass, "mb-1 block")}>{children}</label>
	);
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
				"inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
				styles[status]
			)}
			title={MIGRATION_STATUS_LABEL[status]}
		>
			{MIGRATION_STATUS_LABEL[status]}
		</span>
	);
}

function WhitelistStatusPill({ status }: { status: WhitelistStatus }) {
	const styles: Record<WhitelistStatus, string> = {
		complete:
			"bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300",
		pending:
			"bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/20 dark:text-amber-200",
		not_started: "bg-muted text-muted-foreground ring-1 ring-border/60",
	};

	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
				styles[status]
			)}
			title={WHITELIST_STATUS_LABEL[status]}
		>
			{WHITELIST_STATUS_LABEL[status]}
		</span>
	);
}

function WorkQueueNotesCell({ notes }: { notes: string }) {
	const trimmed = notes.trim();
	if (!trimmed) {
		return <span className="text-muted-foreground">—</span>;
	}

	return (
		<HoverCard openDelay={180} closeDelay={100}>
			<HoverCardTrigger asChild>
				<span
					className={cn(
						"block w-full max-w-[140px] cursor-help truncate text-left",
						"text-muted-foreground underline decoration-dotted decoration-border/80 underline-offset-[3px]",
						"transition-colors hover:text-foreground"
					)}
				>
					{trimmed}
				</span>
			</HoverCardTrigger>
			<HoverCardContent
				align="start"
				side="top"
				className="w-80 overflow-hidden border-border/60 p-0 shadow-lg"
			>
				<div className="overflow-hidden rounded-md border-l-[3px] border-l-primary bg-card">
					<div className="flex items-center gap-2 border-b border-border/50 bg-muted/35 px-3 py-2">
						<span className="flex size-6 items-center justify-center rounded-sm bg-primary/10 text-primary">
							<StickyNote className="size-3.5" />
						</span>
						<div className="min-w-0">
							<p className="text-xs font-semibold text-foreground">Notes</p>
							<p className="text-[10px] text-muted-foreground">
								Case note preview
							</p>
						</div>
					</div>
					<div className="max-h-44 overflow-y-auto px-3 py-3">
						<p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/90">
							{trimmed}
						</p>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}

function ModalShell({
	open,
	onOpenChange,
	title,
	icon: Icon,
	children,
	footer,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	icon: React.ComponentType<{ className?: string }>;
	children: React.ReactNode;
	footer: React.ReactNode;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
				<DialogHeader className="border-b border-border px-4 py-3">
					<DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
						<span
							aria-hidden
							className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary"
						>
							<Icon className="size-3.5 shrink-0" />
						</span>
						{title}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-3 px-4 py-4">{children}</div>
				<DialogFooter className="border-t border-border px-4 py-3 sm:justify-end">
					{footer}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function MyWorkQueuePage() {
	return (
		<VendorCoreGate title="My Work Queue">
			<MyWorkQueueBody />
		</VendorCoreGate>
	);
}

function MyWorkQueueBody() {
	const searchParams = useSearchParams();
	const invalidate = useInvalidateVendorCore();
	const importInputRef = useRef<HTMLInputElement>(null);
	const feedInputRef = useRef<HTMLInputElement>(null);

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [analystFilter, setAnalystFilter] = useState("all");
	const [escalationFilter, setEscalationFilter] = useState<
		EscalationStatus | "all"
	>("all");
	const [waveFilter, setWaveFilter] = useState("all");
	const [whitelistFilter, setWhitelistFilter] = useState("all");
	const [stageFilter, setStageFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [activeRow, setActiveRow] = useState<TpaTpvRow | null>(null);
	const [modal, setModal] = useState<ActionModal>(null);
	const [importResultOpen, setImportResultOpen] = useState(false);
	const [importResult, setImportResult] =
		useState<WorkQueueImportResultDto | null>(null);
	const [importFilename, setImportFilename] = useState<string | undefined>();
	const [saving, setSaving] = useState(false);

	const [contactsForm, setContactsForm] = useState({
		primaryContact: "",
		primaryEmail: "",
		primaryPhone: "",
		secondaryContact: "",
		secondaryEmail: "",
		secondaryPhone: "",
	});
	const usersQ = useVendorCoreUsersQuery();

	useEffect(() => {
		const analyst = searchParams.get("analyst")?.trim();
		if (analyst) {
			setAnalystFilter(analyst);
		}
	}, [searchParams]);

	const analystIdByName = useMemo(() => {
		const map = new Map<string, string>();
		for (const user of usersQ.data ?? []) {
			const label =
				user.full_name?.trim() ||
				[user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
				user.username?.trim() ||
				user.email?.trim();
			if (label) map.set(label, user.id);
		}
		return map;
	}, [usersQ.data]);

	const listParams = useMemo((): MigrationCaseListQuery => {
		return {
			limit: pageSize,
			offset: (page - 1) * pageSize,
			search: search.trim() || undefined,
			migration_status: statusFilter !== "all" ? statusFilter : undefined,
			escalation_status:
				escalationFilter !== "all" ? escalationFilter : undefined,
			assigned_to_id:
				analystFilter !== "all"
					? analystIdByName.get(analystFilter)
					: undefined,
			wave: waveFilter !== "all" ? Number(waveFilter) : undefined,
			whitelist_status:
				whitelistFilter !== "all" ? whitelistFilter : undefined,
			current_stage: stageFilter !== "all" ? stageFilter : undefined,
		};
	}, [
		pageSize,
		page,
		search,
		statusFilter,
		escalationFilter,
		analystFilter,
		analystIdByName,
		waveFilter,
		whitelistFilter,
		stageFilter,
	]);

	const aggregateFilterParams = useMemo((): WorkQueueFilterQuery => {
		return {
			wave: waveFilter !== "all" ? Number(waveFilter) : undefined,
			migration_status: statusFilter !== "all" ? statusFilter : undefined,
			escalation_status:
				escalationFilter !== "all" ? escalationFilter : undefined,
			assigned_to_id:
				analystFilter !== "all"
					? analystIdByName.get(analystFilter)
					: undefined,
			search: search.trim() || undefined,
		};
	}, [
		waveFilter,
		statusFilter,
		escalationFilter,
		analystFilter,
		analystIdByName,
		search,
	]);

	const rowsPageQ = useWorkQueueRowsPageQuery(listParams);
	const kpisQ = useWorkQueueKpisQuery(true);
	const kpisRawQ = useWorkQueueKpisRawQuery(aggregateFilterParams);
	const progressSummaryQ = useWorkQueueProgressSummaryQuery(
		aggregateFilterParams,
		waveFilter !== "all"
	);
	const analystStatsQ = useWorkQueueAnalystStatsQuery(aggregateFilterParams);
	const escalationSummaryQ = useWorkQueueEscalationSummaryQuery(
		aggregateFilterParams
	);
	const blockersQ = useWorkQueueBlockersQuery(
		{ ...aggregateFilterParams, limit: 100, offset: 0 },
		escalationFilter !== "all"
	);

	const updateCase = useUpdateMigrationCaseMutation();
	const setStatus = useBulkSetMigrationCaseStatusMutation();
	const importCsv = useImportWorkQueueSpreadsheetMutation();
	const uploadDoc = useUploadMigrationCaseDocumentMutation();

	const totalCount = rowsPageQ.data?.count ?? 0;
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = rowsPageQ.data?.results ?? [];
	const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const rangeEnd = Math.min(safePage * pageSize, totalCount);

	const kpiCards = kpisQ.data ?? WORK_QUEUE_KPI;
	const loading =
		rowsPageQ.isLoading ||
		kpisQ.isLoading ||
		kpisRawQ.isLoading ||
		analystStatsQ.isLoading ||
		escalationSummaryQ.isLoading;

	const waves = useMemo(() => {
		const fromRows = pageRows.map((r) => String(r.wave));
		return Array.from(new Set([...fromRows, "1", "2", "3", "4"])).sort(
			(a, b) => Number(a) - Number(b)
		);
	}, [pageRows]);

	const progressSummary = useMemo(() => {
		if (waveFilter === "all" && kpisRawQ.data) {
			return kpisToProgressSummary(kpisRawQ.data);
		}
		if (progressSummaryQ.data) {
			return progressSummaryQ.data;
		}
		return emptyProgressSummary();
	}, [waveFilter, kpisRawQ.data, progressSummaryQ.data]);

	const hasFilters =
		Boolean(search.trim()) ||
		statusFilter !== "all" ||
		analystFilter !== "all" ||
		escalationFilter !== "all" ||
		waveFilter !== "all" ||
		whitelistFilter !== "all" ||
		stageFilter !== "all";

	const extraFilterCount =
		(whitelistFilter !== "all" ? 1 : 0) + (stageFilter !== "all" ? 1 : 0);

	const listLoadError = rowsPageQ.error;
	const waveSummaryUnavailable =
		waveFilter !== "all" && Boolean(progressSummaryQ.error);

	const tableEmptyMessage = useMemo(() => {
		if (listLoadError) {
			return "Could not load cases. Try refreshing the page.";
		}
		if (hasFilters) {
			return "No TPA/TPV records match your filters.";
		}
		return "No TPA/TPV records yet.";
	}, [listLoadError, hasFilters]);

	const statusEstimatedProgress = false;

	useEffect(() => {
		setPage(1);
	}, [
		search,
		statusFilter,
		analystFilter,
		escalationFilter,
		waveFilter,
		whitelistFilter,
		stageFilter,
		pageSize,
	]);

	useEffect(() => {
		if (!activeRow) return;
		setContactsForm({
			primaryContact: activeRow.primaryContact,
			primaryEmail: activeRow.primaryEmail,
			primaryPhone: activeRow.primaryPhone,
			secondaryContact: activeRow.secondaryContact,
			secondaryEmail: activeRow.secondaryEmail,
			secondaryPhone: activeRow.secondaryPhone,
		});
	}, [activeRow]);

	const analysts = useMemo(
		() =>
			Array.from(
				new Set(
					(analystStatsQ.data ?? []).map((row) => row.analyst).filter(Boolean)
				)
			).sort(),
		[analystStatsQ.data]
	);

	function applyKpiFilter(id: string) {
		setPage(1);
		if (id === "assigned") setStatusFilter("all");
		else if (id === "connected") setStatusFilter("ready");
		else if (id === "migration") setStatusFilter("waiting_on_vendor");
		else if (id === "testing") setStatusFilter("testing");
		else if (id === "exceptions") setStatusFilter("exception");
		else if (id === "escalations") {
			setStatusFilter("all");
			setEscalationFilter("escalated");
		} else if (id === "not_started") setStatusFilter("not_started");
	}

	function clearFilters() {
		setSearch("");
		setStatusFilter("all");
		setAnalystFilter("all");
		setEscalationFilter("all");
		setWaveFilter("all");
		setWhitelistFilter("all");
		setStageFilter("all");
		setPage(1);
	}

	async function handleRefresh() {
		setRefreshing(true);
		try {
			invalidate();
			await Promise.all([
				rowsPageQ.refetch(),
				kpisQ.refetch(),
				kpisRawQ.refetch(),
				progressSummaryQ.refetch(),
				analystStatsQ.refetch(),
				escalationSummaryQ.refetch(),
				blockersQ.refetch(),
			]);
		} finally {
			setRefreshing(false);
		}
	}

	function openContactsModal(row: TpaTpvRow) {
		setActiveRow(row);
		setModal("contacts");
	}

	function closeModal() {
		setModal(null);
		setActiveRow(null);
	}

	async function saveContacts() {
		if (!activeRow) return;
		setSaving(true);
		try {
			await updateCase.mutateAsync({
				id: activeRow.id,
				body: {
					primary_contact: contactsForm.primaryContact,
					primary_email: contactsForm.primaryEmail,
					primary_phone: contactsForm.primaryPhone,
					secondary_contact: contactsForm.secondaryContact,
					secondary_email: contactsForm.secondaryEmail,
					secondary_phone: contactsForm.secondaryPhone,
				},
			});
			toast.success(`Contacts Information saved for ${activeRow.name}`);
			closeModal();
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Failed to save contacts"));
		} finally {
			setSaving(false);
		}
	}

	async function runBulkStatus(migration_status: MigrationStatus) {
		const ids = selectedIds.length ? selectedIds : pageRows.map((r) => r.id);
		if (!ids.length) {
			toast.message("No rows to update");
			return;
		}
		try {
			const result = await setStatus.mutateAsync({ ids, migration_status });
			const ok = result.succeeded?.length ?? 0;
			const fail = result.failed?.length ?? 0;
			if (fail) {
				const rawError = result.failed?.[0]?.error;
				const firstError = typeof rawError === "string" ? rawError.trim() : "";
				toast.warning(
					firstError
						? `Updated ${ok}, failed ${fail}. ${firstError}`
						: `Updated ${ok}, failed ${fail}`
				);
			} else {
				toast.success(
					`Marked ${ok} as ${MIGRATION_STATUS_LABEL[migration_status]}`
				);
			}
			setSelectedIds([]);
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Bulk status update failed"));
		}
	}

	async function handleImportFile(file: File | undefined) {
		if (!file) return;
		try {
			const result = await importCsv.mutateAsync(file);
			setImportResult(result);
			setImportFilename(file.name);
			setImportResultOpen(true);
			if (result.error_count > 0) {
				toast.warning(
					`Import finished with ${result.error_count} error(s) — see details`
				);
			} else {
				toast.success(
					`Import done — created ${result.created_count}, updated ${result.updated_count}`
				);
			}
			invalidate();
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Import failed"));
		}
	}

	async function handleFeedFile(file: File | undefined) {
		if (!file) return;
		const targetId = selectedIds[0] ?? activeRow?.id ?? pageRows[0]?.id;
		if (!targetId) {
			toast.message("Select a row (or open one) before uploading a feed");
			return;
		}
		try {
			await uploadDoc.mutateAsync({ id: targetId, file });
			toast.success(`Uploaded ${file.name}`);
		} catch (err) {
			toast.error(workQueueErrorMessage(err, "Document upload failed"));
		}
	}

	function toggleSelected(id: string) {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	}

	if (loading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full max-w-md" />
				<Skeleton className="h-11 w-full border border-border" />
				<Skeleton className="h-72 w-full border border-border" />
			</div>
		);
	}

	const bulkTargetCount = selectedIds.length || pageRows.length;
	const toolbarBtn =
		"h-9 gap-1.5 rounded-md px-3 text-xs font-medium shadow-none";

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						My Work Queue
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						TPA/TPV migration tracking · {totalCount.toLocaleString()}{" "}
						{totalCount === 1 ? "case" : "cases"}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<input
						ref={importInputRef}
						type="file"
						accept=".csv,text/csv"
						className="hidden"
						onChange={(e) => {
							void handleImportFile(e.target.files?.[0]);
							e.target.value = "";
						}}
					/>
					<input
						ref={feedInputRef}
						type="file"
						className="hidden"
						onChange={(e) => {
							void handleFeedFile(e.target.files?.[0]);
							e.target.value = "";
						}}
					/>
					<Button size="sm" className={toolbarBtn} asChild>
						<Link href="/admin/my-work-queue/new">
							<Plus className="size-3.5" />
							Add TPA/TPV
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn(toolbarBtn, "border-border bg-background")}
						disabled={importCsv.isPending}
						onClick={() => importInputRef.current?.click()}
					>
						<Upload className="size-3.5" />
						Import
					</Button>
					<span className="mx-0.5 hidden h-5 w-px bg-border sm:inline-block" />
					<Button
						variant="outline"
						size="sm"
						className={cn(toolbarBtn, "border-border bg-background")}
						onClick={() => void handleRefresh()}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									toolbarBtn,
									"border-border bg-background",
									selectedIds.length > 0 &&
										"border-primary/40 bg-primary/5 text-primary"
								)}
								disabled={setStatus.isPending || bulkTargetCount === 0}
							>
								Update status
								{selectedIds.length > 0 ? (
									<span className="rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold tabular-nums">
										{selectedIds.length}
									</span>
								) : null}
								<ChevronDown className="size-3.5 opacity-70" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-52">
							<p className="px-2 py-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
								{selectedIds.length > 0
									? `Apply to ${selectedIds.length} selected`
									: `Apply to ${pageRows.length} on this page`}
							</p>
							<DropdownMenuItem onClick={() => void runBulkStatus("testing")}>
								Mark as Testing
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => void runBulkStatus("ready")}>
								Mark as Ready
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => void runBulkStatus("waiting_on_vendor")}
							>
								Waiting on Vendor
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="size-9 border-border bg-background shadow-none"
								aria-label="More actions"
							>
								<MoreHorizontal className="size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem
								disabled={uploadDoc.isPending}
								onClick={() => feedInputRef.current?.click()}
							>
								<Upload className="mr-2 size-3.5" />
								Add feed document
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{listLoadError ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
					<p>{listLoadError.message}</p>
					<p className="mt-1 text-xs font-normal text-destructive/90">
						Could not load cases. KPI counts may still reflect backend data.
					</p>
				</div>
			) : null}

			{!listLoadError && !rowsPageQ.isLoading && totalCount === 0 && !hasFilters ? (
				<div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
					No migration cases yet. Use{" "}
					<span className="font-medium text-foreground">Import</span> or{" "}
					<span className="font-medium text-foreground">Add TPA/TPV</span>, then
					refresh.
				</div>
			) : null}

			<WorkQueueProgressOverview
				summary={progressSummary}
				waveFilter={waveFilter}
				waves={waves}
				waveSummaryUnavailable={waveSummaryUnavailable}
				onWaveFilterChange={(value) => {
					setWaveFilter(value);
					setPage(1);
				}}
			/>

			<section className="overflow-hidden rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]">
				<div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-3 sm:divide-x xl:grid-cols-7 xl:divide-y-0">
					{kpiCards.map((kpi) => {
						const Icon = KPI_ICON[kpi.tone];
						const tone = KPI_VALUE_TONE[kpi.tone];
						const active =
							(kpi.id === "assigned" &&
								statusFilter === "all" &&
								escalationFilter === "all") ||
							(kpi.id === "connected" && statusFilter === "ready") ||
							(kpi.id === "migration" &&
								statusFilter === "waiting_on_vendor") ||
							(kpi.id === "testing" && statusFilter === "testing") ||
							(kpi.id === "exceptions" && statusFilter === "exception") ||
							(kpi.id === "escalations" &&
								escalationFilter !== "all" &&
								statusFilter === "all") ||
							(kpi.id === "not_started" && statusFilter === "not_started");
						return (
							<button
								key={kpi.id}
								type="button"
								onClick={() => applyKpiFilter(kpi.id)}
								className={cn(
									"px-4 py-3.5 text-left transition-colors hover:bg-muted/40",
									active && "bg-primary/5"
								)}
							>
								<div className="flex items-start justify-between gap-2">
									<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
										{kpi.label}
									</p>
									<Icon className={cn("size-3.5 shrink-0 opacity-70", tone)} />
								</div>
								<p
									className={cn(
										"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
										tone
									)}
								>
									{kpisQ.isLoading ? "—" : kpi.count.toLocaleString()}
								</p>
							</button>
						);
					})}
				</div>
			</section>

			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_min(100%,260px)]">
				<EdiAnalystProgressSection
					rows={pageRows}
					analysts={analystStatsQ.data}
					loading={analystStatsQ.isLoading}
					activeAnalyst={analystFilter}
					statusEstimated={statusEstimatedProgress}
					onAnalystSelect={(analyst) => {
						setAnalystFilter(analyst);
						setPage(1);
					}}
				/>
				<EscalationSummarySection
					rows={pageRows}
					summary={escalationSummaryQ.data}
					blockerRows={blockersQ.data}
					loading={escalationSummaryQ.isLoading}
					activeFilter={escalationFilter}
					onFilterChange={(status) => {
						setEscalationFilter(status);
						if (status !== "all") setStatusFilter("all");
						setPage(1);
					}}
				/>
			</div>

			<section className="overflow-hidden rounded-sm bg-card shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(15,23,42,0.04)]">
				<div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-3 py-2.5">
					<div className="relative min-w-[160px] flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search name, code, server, email…"
							className={cn(compactFieldClass, "w-full pl-8")}
						/>
					</div>
					<div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
						<Select
							value={statusFilter}
							onValueChange={(v) => {
								setStatusFilter(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(compactFieldClass, "w-[160px]")}>
								<SelectValue placeholder="All status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All migration status</SelectItem>
								{(Object.keys(MIGRATION_STATUS_LABEL) as MigrationStatus[]).map(
									(key) => (
										<SelectItem key={key} value={key}>
											{MIGRATION_STATUS_LABEL[key]}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
						<Select
							value={analystFilter}
							onValueChange={(v) => {
								setAnalystFilter(v);
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(compactFieldClass, "w-[140px]")}>
								<SelectValue placeholder="All analysts" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All analysts</SelectItem>
								{analysts.map((name) => (
									<SelectItem key={name} value={name}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={escalationFilter}
							onValueChange={(v) => {
								setEscalationFilter(v as EscalationStatus | "all");
								setPage(1);
							}}
						>
							<SelectTrigger className={cn(compactFieldClass, "w-[160px]")}>
								<SelectValue placeholder="Escalation status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All escalation status</SelectItem>
								{ESCALATION_STATUS_SELECT_OPTIONS.map((key) => (
									<SelectItem key={key} value={key}>
										{ESCALATION_STATUS_LABEL[key]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									className={cn(
										compactFieldClass,
										"h-8 gap-1.5 px-2.5 shadow-none",
										extraFilterCount > 0 && "border-primary/40 bg-primary/5"
									)}
								>
									<SlidersHorizontal className="size-3.5 shrink-0" />
									More filters
									{extraFilterCount > 0 ? (
										<span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
											{extraFilterCount}
										</span>
									) : null}
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-72 space-y-3 p-3">
								<div className="space-y-1">
									<p className="text-xs font-medium text-foreground">
										Whitelist
									</p>
									<Select
										value={whitelistFilter}
										onValueChange={(v) => {
											setWhitelistFilter(v);
											setPage(1);
										}}
									>
										<SelectTrigger className={cn(compactFieldClass, "w-full")}>
											<SelectValue placeholder="All whitelist" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All whitelist</SelectItem>
											{(
												Object.keys(
													WHITELIST_STATUS_LABEL
												) as WhitelistStatus[]
											).map((key) => (
												<SelectItem key={key} value={key}>
													{WHITELIST_STATUS_LABEL[key]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<p className="text-xs font-medium text-foreground">
										Current stage
									</p>
									<Select
										value={stageFilter}
										onValueChange={(v) => {
											setStageFilter(v);
											setPage(1);
										}}
									>
										<SelectTrigger className={cn(compactFieldClass, "w-full")}>
											<SelectValue placeholder="All stages" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All stages</SelectItem>
											{CURRENT_STAGE_OPTIONS.map((stage) => (
												<SelectItem key={stage.value} value={stage.value}>
													{stage.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{extraFilterCount > 0 ? (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-8 w-full text-xs text-primary"
										onClick={() => {
											setWhitelistFilter("all");
											setStageFilter("all");
											setPage(1);
										}}
									>
										Reset extra filters
									</Button>
								) : null}
							</PopoverContent>
						</Popover>
						{hasFilters ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 px-2 text-xs text-primary"
								onClick={clearFilters}
							>
								Clear
							</Button>
						) : null}
					</div>
				</div>

				<div className="w-full overflow-x-auto">
					<Table className="w-full min-w-[1320px] table-fixed">
						<TableHeader>
							<TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
								<TableHead className={cn(th, "w-[3%] text-center")}>
									<span className="sr-only">Select</span>
								</TableHead>
								<TableHead className={cn(th, "w-[4%]")}>Wave</TableHead>
								<TableHead className={cn(th, "w-[12%]")}>TPA/TPV</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>Server</TableHead>
								<TableHead className={cn(th, "w-[10%]")}>Email</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>IP Whitelist</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>Last Comm</TableHead>
								<TableHead className={cn(th, "w-[10%]")}>Notes</TableHead>
								<TableHead className={cn(th, "w-[9%]")}>
									SFTP Progress
								</TableHead>
								<TableHead className={cn(th, "w-[9%]")}>
									EDI Progress
								</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>Status</TableHead>
								<TableHead className={cn(th, "w-[7%]")}>Analyst</TableHead>
								<TableHead className={cn(th, "w-[7%]")}>Escalation</TableHead>
								<TableHead className={cn(th, "w-[7%]")}>Updated</TableHead>
								<TableHead className={cn(th, "w-[5%] text-right")}>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={15}
										className="h-20 text-center text-sm text-muted-foreground"
									>
										{tableEmptyMessage}
									</TableCell>
								</TableRow>
							) : (
								pageRows.map((row) => (
									<TableRow
										key={row.id}
										className="border-b border-border/70 hover:bg-muted/50"
									>
										<TableCell className={cn(td, "text-center")}>
											<Checkbox
												checked={selectedIds.includes(row.id)}
												onCheckedChange={() => toggleSelected(row.id)}
												aria-label={`Select ${row.name}`}
											/>
										</TableCell>
										<TableCell className={cn(td, "tabular-nums")}>
											{row.wave}
										</TableCell>
										<TableCell className={td}>
											<Link
												href={`/admin/my-work-queue/${row.id}`}
												className="block w-full truncate text-left font-medium text-primary hover:underline"
												title={row.name}
											>
												{row.name}
											</Link>
											<span
												className="mt-0.5 block truncate text-[11px] text-muted-foreground"
												title={row.code}
											>
												{row.code} · {row.type}
											</span>
										</TableCell>
										<TableCell
											className={cn(td, "truncate")}
											title={row.serverType}
										>
											{row.serverType}
										</TableCell>
										<TableCell
											className={cn(td, "truncate text-muted-foreground")}
											title={row.contactEmail}
										>
											{row.contactEmail}
										</TableCell>
										<TableCell className={td}>
											<WhitelistStatusPill status={row.whitelistStatus} />
										</TableCell>
										<TableCell
											className={cn(
												td,
												"truncate tabular-nums text-muted-foreground"
											)}
											title={row.lastCommunication || undefined}
										>
											{row.lastCommunication || "—"}
										</TableCell>
										<TableCell className={cn(td, "max-w-[140px]")}>
											<WorkQueueNotesCell notes={row.notes} />
										</TableCell>
										<TableCell className={td}>
											<ProgressTrackCell
												progress={row.sftpProgress}
												track="sftp"
											/>
										</TableCell>
										<TableCell className={td}>
											<ProgressTrackCell
												progress={row.ediProgress}
												track="edi"
											/>
										</TableCell>
										<TableCell className={td}>
											<MigrationStatusPill status={row.status} />
										</TableCell>
										<TableCell
											className={cn(td, "truncate")}
											title={row.assignedAnalyst}
										>
											{row.assignedAnalyst}
										</TableCell>
										<TableCell className={td}>
											<EscalationStatusPill
												status={row.escalationStatus ?? "none"}
											/>
										</TableCell>
										<TableCell
											className={cn(
												td,
												"truncate tabular-nums text-muted-foreground"
											)}
											title={row.lastUpdated}
										>
											{row.lastUpdated || "—"}
										</TableCell>
										<TableCell className={cn(td, "text-right")}>
											<WorkQueueRowActions
												row={row}
												onOpenContacts={() => openContactsModal(row)}
											/>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
					<p>
						Showing{" "}
						<span className="font-medium text-foreground">{rangeStart}</span> to{" "}
						<span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
						<span className="font-medium text-foreground">
							{totalCount.toLocaleString()}
						</span>{" "}
						entries
						{selectedIds.length > 0 ? (
							<>
								{" "}
								·{" "}
								<span className="font-medium text-foreground">
									{selectedIds.length}
								</span>{" "}
								selected
							</>
						) : null}
					</p>
					<div className="flex items-center gap-1.5">
						<Button
							variant="outline"
							size="icon"
							className="size-7"
							disabled={safePage <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							<ChevronLeft className="size-3.5" />
						</Button>
						{Array.from({ length: pageCount }, (_, i) => i + 1)
							.slice(0, 5)
							.map((n) => (
								<Button
									key={n}
									variant={n === safePage ? "default" : "outline"}
									size="icon"
									className="size-7 text-xs"
									onClick={() => setPage(n)}
								>
									{n}
								</Button>
							))}
						<Button
							variant="outline"
							size="icon"
							className="size-7"
							disabled={safePage >= pageCount}
							onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
						>
							<ChevronRight className="size-3.5" />
						</Button>
						<Select
							value={String(pageSize)}
							onValueChange={(v) => {
								setPageSize(Number(v));
								setPage(1);
							}}
						>
							<SelectTrigger className="h-7 w-[88px] text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10/page</SelectItem>
								<SelectItem value="20">20/page</SelectItem>
								<SelectItem value="50">50/page</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</section>

			{/* Contacts Information */}
			<ModalShell
				open={modal === "contacts"}
				onOpenChange={(open) => !open && closeModal()}
				title="Contacts Information"
				icon={Link2}
				footer={
					<>
						<Button variant="outline" size="sm" onClick={closeModal}>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={saving || updateCase.isPending}
							onClick={() => void saveContacts()}
						>
							Save
						</Button>
					</>
				}
			>
				<div className="grid gap-3 sm:grid-cols-2">
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
							className="h-9"
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
							className="h-9"
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
							className="h-9"
						/>
					</div>
					<div className="sm:col-span-2">
						<FieldLabel>Secondary Contact</FieldLabel>
						<Input
							value={contactsForm.secondaryContact}
							onChange={(e) =>
								setContactsForm((f) => ({
									...f,
									secondaryContact: e.target.value,
								}))
							}
							className="h-9"
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
							className="h-9"
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
							className="h-9"
						/>
					</div>
				</div>
			</ModalShell>

			<WorkQueueImportResultDialog
				open={importResultOpen}
				onOpenChange={setImportResultOpen}
				result={importResult}
				filename={importFilename}
			/>
		</div>
	);
}

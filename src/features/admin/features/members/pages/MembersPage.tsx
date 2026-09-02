"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Download,
	Filter,
	Loader2,
	PauseCircle,
	RefreshCw,
	Search,
	UserX,
	Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
	type MemberStatus,
	type MemberSummary,
	displayName,
	eligibilityLabelToApi,
	exportMemberListCsv,
	formatDate,
	genderLabelToApi,
	memberStatusLabelToApi,
} from "@/features/admin/features/members/feature/api/membersApi";
import {
	useInvalidateVendorCore,
	useMemberDashboardStatsQuery,
	useMemberSummariesList,
	useMemberSummariesPageQuery,
	useVendorCoreVendors,
} from "@/features/admin/features/members/feature/queries/useMembersQuery";
import { getMember } from "@/features/admin/features/members/mock-data";
import {
	MemberDirectoryActions,
	MemberListRowDelete,
} from "@/features/admin/features/members/pages/member-list-actions";
import { Link, useRouter } from "@/i18n/navigation";
import { downloadBlob, stampFilename } from "@/lib/export/csv";
import { isMembersMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import type {
	MemberDashboardStatsQuery,
	MemberListQuery,
} from "@/lib/vendor-core/types";
import { useAdminModuleStore } from "@/stores/admin-module-store";

type GenderFilter = "all" | "Male" | "Female" | "Other" | "Unknown";

type MemberSearchFilters = {
	memberId: string;
	alternateId: string;
	newtechMemberId: string;
	newtechFamilyId: string;
	firstName: string;
	lastName: string;
	dob: string;
	gender: GenderFilter;
	accountGroup: string;
	groupId: string;
	plan: string;
	eligibilityStatus: string;
	memberStatus: string;
	effectiveFrom: string;
	effectiveTo: string;
	termFrom: string;
	termTo: string;
	search: string;
	lob: string;
	vendorId: string;
};

const EMPTY_MEMBER_FILTERS: MemberSearchFilters = {
	memberId: "",
	alternateId: "",
	newtechMemberId: "",
	newtechFamilyId: "",
	firstName: "",
	lastName: "",
	dob: "",
	gender: "all",
	accountGroup: "all",
	groupId: "",
	plan: "all",
	eligibilityStatus: "all",
	memberStatus: "all",
	effectiveFrom: "",
	effectiveTo: "",
	termFrom: "",
	termTo: "",
	search: "",
	lob: "",
	vendorId: "all",
};

function hasMemberFilters(filters: MemberSearchFilters): boolean {
	return (
		filters.memberId.trim().length > 0 ||
		filters.alternateId.trim().length > 0 ||
		filters.newtechMemberId.trim().length > 0 ||
		filters.newtechFamilyId.trim().length > 0 ||
		filters.firstName.trim().length > 0 ||
		filters.lastName.trim().length > 0 ||
		filters.dob.length > 0 ||
		filters.gender !== "all" ||
		filters.accountGroup !== "all" ||
		filters.groupId.trim().length > 0 ||
		filters.plan !== "all" ||
		filters.eligibilityStatus !== "all" ||
		filters.memberStatus !== "all" ||
		filters.effectiveFrom.length > 0 ||
		filters.effectiveTo.length > 0 ||
		filters.termFrom.length > 0 ||
		filters.termTo.length > 0 ||
		filters.search.trim().length > 0 ||
		filters.lob.trim().length > 0 ||
		filters.vendorId !== "all"
	);
}

function buildMemberListQuery(
	filters: MemberSearchFilters,
	page: number,
	pageSize: number,
	programFilter: string
): MemberListQuery {
	const q: MemberListQuery = {
		limit: pageSize,
		offset: (page - 1) * pageSize,
		order_by: "-updated_at",
	};
	if (filters.memberId.trim()) q.cardholder_id = filters.memberId.trim();
	if (filters.alternateId.trim()) q.alternate_id = filters.alternateId.trim();
	if (filters.newtechMemberId.trim())
		q.newtech_member_id = filters.newtechMemberId.trim();
	if (filters.newtechFamilyId.trim())
		q.newtech_family_id = filters.newtechFamilyId.trim();
	if (filters.firstName.trim()) q.first_name = filters.firstName.trim();
	if (filters.lastName.trim()) q.last_name = filters.lastName.trim();
	if (filters.dob) q.date_of_birth = filters.dob;
	const gender = genderLabelToApi(filters.gender);
	if (gender) q.gender = gender;
	if (filters.groupId.trim()) q.group_id = filters.groupId.trim();
	if (filters.plan !== "all") q.plan_name = filters.plan;
	const elig = eligibilityLabelToApi(filters.eligibilityStatus);
	if (elig) q.eligibility_status = elig;
	const st = memberStatusLabelToApi(filters.memberStatus);
	if (st) q.status = st;
	if (filters.effectiveFrom) q.coverage_effective_from = filters.effectiveFrom;
	if (filters.effectiveTo) q.coverage_effective_to = filters.effectiveTo;
	if (programFilter) q.program = programFilter;
	if (filters.search.trim()) q.search = filters.search.trim();
	if (filters.lob.trim()) q.lob = filters.lob.trim();
	if (filters.vendorId !== "all") q.vendor_id = filters.vendorId;
	if (filters.accountGroup !== "all") q.account_group = filters.accountGroup;
	return q;
}

function buildMemberStatsQuery(
	filters: MemberSearchFilters,
	programFilter: string
): MemberDashboardStatsQuery {
	const {
		limit: _l,
		offset: _o,
		order_by: _ob,
		...rest
	} = buildMemberListQuery(filters, 1, 1, programFilter);
	return rest;
}


function filterLiveNewTechRows(
	members: MemberSummary[],
	filters: MemberSearchFilters
): MemberSummary[] {
	return members.filter((m) => {
		if (
			filters.newtechMemberId &&
			!(m.newtechMemberId ?? "")
				.toLowerCase()
				.includes(filters.newtechMemberId.toLowerCase())
		)
			return false;
		if (
			filters.newtechFamilyId &&
			!(m.newtechFamilyId ?? "")
				.toLowerCase()
				.includes(filters.newtechFamilyId.toLowerCase())
		)
			return false;
		return true;
	});
}

function filterMockMembers(
	members: MemberSummary[],
	filters: MemberSearchFilters,
	programFilter: string
): MemberSummary[] {
	return members
		.filter((m) => m.program === programFilter)
		.filter((m) => {
			if (
				filters.memberId &&
				!m.memberId.toLowerCase().includes(filters.memberId.toLowerCase())
			)
				return false;
			if (
				filters.alternateId &&
				!(m.alternateId ?? "")
					.toLowerCase()
					.includes(filters.alternateId.toLowerCase())
			)
				return false;
			if (
				filters.newtechMemberId &&
				!(m.newtechMemberId ?? "")
					.toLowerCase()
					.includes(filters.newtechMemberId.toLowerCase())
			)
				return false;
			if (
				filters.newtechFamilyId &&
				!(m.newtechFamilyId ?? "")
					.toLowerCase()
					.includes(filters.newtechFamilyId.toLowerCase())
			)
				return false;
			if (
				filters.firstName &&
				!m.firstName.toLowerCase().includes(filters.firstName.toLowerCase())
			)
				return false;
			if (
				filters.lastName &&
				!m.lastName.toLowerCase().includes(filters.lastName.toLowerCase())
			)
				return false;
			if (filters.dob && m.dob !== filters.dob) return false;
			if (filters.gender !== "all" && m.gender !== filters.gender) return false;
			if (
				filters.accountGroup !== "all" &&
				m.accountGroup !== filters.accountGroup
			)
				return false;
			if (filters.groupId.trim()) {
				const detail = getMember(m.id);
				const gid = detail?.groupId ?? m.accountGroup ?? "";
				if (!gid.toLowerCase().includes(filters.groupId.trim().toLowerCase()))
					return false;
			}
			if (filters.plan !== "all" && m.planName !== filters.plan) return false;
			if (
				filters.eligibilityStatus !== "all" &&
				(m.eligibilityLabel ?? "") !== filters.eligibilityStatus
			)
				return false;
			if (filters.memberStatus !== "all") {
				const memberStatusLabel =
					m.status === "active"
						? "Active"
						: m.status === "inactive"
							? "Inactive"
							: m.status === "pending"
								? "Pending"
								: "Termed";
				if (memberStatusLabel !== filters.memberStatus) return false;
			}
			if (
				filters.effectiveFrom &&
				(m.coverageEffectiveDate ?? "") < filters.effectiveFrom
			)
				return false;
			if (
				filters.effectiveTo &&
				(m.coverageEffectiveDate ?? "") > filters.effectiveTo
			)
				return false;
			if (filters.termFrom || filters.termTo) {
				const detail = getMember(m.id);
				const termDate =
					detail?.statusTermDate ??
					detail?.coverageEnd ??
					(m.status === "termed" ? "2026-06-30" : null);
				if (!termDate) return false;
				if (filters.termFrom && termDate < filters.termFrom) return false;
				if (filters.termTo && termDate > filters.termTo) return false;
			}
			if (filters.search.trim()) {
				const s = filters.search.trim().toLowerCase();
				const hay =
					`${m.memberId} ${m.firstName} ${m.lastName} ${m.alternateId ?? ""} ${m.newtechMemberId ?? ""} ${m.newtechFamilyId ?? ""}`.toLowerCase();
				if (!hay.includes(s)) return false;
			}
			if (
				filters.lob.trim() &&
				!m.lob.toLowerCase().includes(filters.lob.trim().toLowerCase())
			)
				return false;
			return true;
		});
}

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

function CompactField({
	id,
	label,
	children,
	className,
}: {
	id?: string;
	label: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("min-w-0 space-y-0.5", className)}>
			<label htmlFor={id} className={compactLabelClass}>
				{label}
			</label>
			{children}
		</div>
	);
}

const STATUS_TONE: Record<MemberStatus, string> = {
	active:
		"bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
	inactive: "bg-muted text-muted-foreground",
	pending:
		"bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300",
	termed: "bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

function StatusPill({ status }: { status: MemberStatus }) {
	const label =
		status === "active"
			? "Active"
			: status === "inactive"
				? "Inactive"
				: status === "pending"
					? "Pending"
					: "Termed";

	return (
		<span
			className={cn(
				"inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
				STATUS_TONE[status]
			)}
			title={label}
		>
			{label}
		</span>
	);
}

function EligibilityPill({
	label,
}: {
	label?: "Active" | "Inactive" | "Pending" | "Termed" | undefined;
}) {
	if (!label) {
		return <span className="text-[11px] text-muted-foreground">—</span>;
	}
	const map: Record<NonNullable<typeof label>, MemberStatus> = {
		Active: "active",
		Inactive: "inactive",
		Pending: "pending",
		Termed: "termed",
	};
	return <StatusPill status={map[label]} />;
}

export function MembersPage() {
	if (!isMembersMockEnabled()) {
		return (
			<VendorCoreGate title="Members">
				<MembersDirectoryPage />
			</VendorCoreGate>
		);
	}
	return <MembersDirectoryPage />;
}

function MembersDirectoryPage() {
	const router = useRouter();
	const useApi = !isMembersMockEnabled();
	const invalidate = useInvalidateVendorCore();
	const vendorsQ = useVendorCoreVendors();
	const programFilter = useAdminModuleStore((s) => s.fileType);

	const [filters, setFilters] = useState(EMPTY_MEMBER_FILTERS);
	const [debouncedFilters, setDebouncedFilters] =
		useState(EMPTY_MEMBER_FILTERS);
	const [showMoreFilters, setShowMoreFilters] = useState(false);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [refreshing, setRefreshing] = useState(false);
	const [exporting, setExporting] = useState(false);

	const patchFilters = (patch: Partial<MemberSearchFilters>) => {
		setFilters((prev) => ({ ...prev, ...patch }));
		setPage(1);
	};

	useEffect(() => {
		const handle = window.setTimeout(() => setDebouncedFilters(filters), 300);
		return () => window.clearTimeout(handle);
	}, [filters]);

	useEffect(() => {
		setPage(1);
	}, [programFilter]);

	const listQuery = useMemo(
		() => buildMemberListQuery(debouncedFilters, page, pageSize, programFilter),
		[debouncedFilters, page, pageSize, programFilter]
	);

	const statsQuery = useMemo(
		() => buildMemberStatsQuery(debouncedFilters, programFilter),
		[debouncedFilters, programFilter]
	);

	const pageQ = useMemberSummariesPageQuery(listQuery, useApi);
	const statsQ = useMemberDashboardStatsQuery(statsQuery, useApi);
	const mockList = useMemberSummariesList();

	const programMembers = useMemo(
		() => mockList.members.filter((m) => m.program === programFilter),
		[mockList.members, programFilter]
	);

	const mockFiltered = useMemo(() => {
		if (useApi) return [];
		return filterMockMembers(mockList.members, debouncedFilters, programFilter);
	}, [useApi, mockList.members, debouncedFilters, programFilter]);

	const totalCount = useApi ? (pageQ.data?.count ?? 0) : mockFiltered.length;
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = useApi
		? filterLiveNewTechRows(pageQ.data?.results ?? [], debouncedFilters)
		: mockFiltered.slice((safePage - 1) * pageSize, safePage * pageSize);

	const plans = useMemo(
		() =>
			Array.from(
				new Set(
					programMembers
						.map((m) => m.planName)
						.filter((p) => Boolean(p) && p !== "—")
				)
			).sort(),
		[programMembers]
	);

	const accountGroups = useMemo(() => {
		return Array.from(
			new Set(
				programMembers
					.map((m) => m.accountGroup)
					.filter((g): g is string => Boolean(g) && g !== "—")
			)
		).sort();
	}, [programMembers]);

	const kpiStats = useMemo(() => {
		if (useApi && statsQ.data) {
			return {
				total: statsQ.data.total,
				active: statsQ.data.active,
				pending: statsQ.data.pending,
				termed: statsQ.data.termed,
				inactive: statsQ.data.inactive,
			};
		}
		const source = hasMemberFilters(debouncedFilters)
			? mockFiltered
			: programMembers;
		return {
			total: source.length,
			active: source.filter((m) => m.status === "active").length,
			pending: source.filter((m) => m.status === "pending").length,
			termed: source.filter((m) => m.status === "termed").length,
			inactive: source.filter((m) => m.status === "inactive").length,
		};
	}, [useApi, statsQ.data, debouncedFilters, mockFiltered, programMembers]);

	const isLoading = useApi ? pageQ.isLoading && !pageQ.data : false;
	const error = useApi ? pageQ.error : null;
	const hasActiveFilters = hasMemberFilters(debouncedFilters);
	const hasPendingFilterSync = useMemo(
		() => JSON.stringify(filters) !== JSON.stringify(debouncedFilters),
		[filters, debouncedFilters]
	);
	const hasUnsupportedLiveFilters =
		useApi &&
		(debouncedFilters.termFrom.length > 0 ||
			debouncedFilters.termTo.length > 0);

	async function handleRefresh() {
		setRefreshing(true);
		try {
			if (useApi) {
				await invalidate();
			} else await new Promise((r) => setTimeout(r, 250));
			toast.success("Member search refreshed");
		} finally {
			setRefreshing(false);
		}
	}

	async function handleExportList() {
		if (!useApi) {
			toast.message(
				"Export uses the current search results once export API is available"
			);
			return;
		}
		setExporting(true);
		try {
			const { blob, filename } = await exportMemberListCsv(listQuery);
			downloadBlob(filename ?? stampFilename("members-list"), blob);
			toast.success("Member list exported");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Export failed");
		} finally {
			setExporting(false);
		}
	}

	function clearFilters() {
		setFilters(EMPTY_MEMBER_FILTERS);
		setDebouncedFilters(EMPTY_MEMBER_FILTERS);
		setPage(1);
	}

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full max-w-md" />
				<Skeleton className="h-11 w-full border border-border" />
				<Skeleton className="h-72 w-full border border-border" />
			</div>
		);
	}

	const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const rangeEnd = Math.min(safePage * pageSize, totalCount);

	const pageButtons = Array.from({ length: pageCount }, (_, i) => i + 1).slice(
		0,
		5
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Members
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Member directory · {programFilter}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						onClick={() => void handleRefresh()}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-9"
						onClick={() => void handleExportList()}
						disabled={exporting}
					>
						{exporting ? (
							<Loader2 className="mr-1.5 size-3.5 animate-spin" />
						) : (
							<Download className="mr-1.5 size-3.5" />
						)}
						Export
					</Button>
					<MemberDirectoryActions />
				</div>
			</div>

			{error ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
					{error.message}
				</div>
			) : null}

			<section className="overflow-hidden rounded-lg border border-border bg-card">
				<div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-5 sm:divide-x sm:divide-y-0">
					{(
						[
							{
								label: "Total",
								value: kpiStats.total,
								icon: Users,
								tone: "text-foreground",
							},
							{
								label: "Active",
								value: kpiStats.active,
								icon: CheckCircle2,
								tone: "text-emerald-700 dark:text-emerald-400",
							},
							{
								label: "Pending",
								value: kpiStats.pending,
								icon: Clock3,
								tone: "text-amber-700 dark:text-amber-400",
							},
							{
								label: "Termed",
								value: kpiStats.termed,
								icon: UserX,
								tone: "text-red-700 dark:text-red-400",
							},
							{
								label: "Inactive",
								value: kpiStats.inactive,
								icon: PauseCircle,
								tone: "text-muted-foreground",
							},
						] as const
					).map((item) => {
						const Icon = item.icon;
						return (
							<div key={item.label} className="px-4 py-3.5">
								<div className="flex items-start justify-between gap-2">
									<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
										{item.label}
									</p>
									<Icon
										className={cn("size-3.5 shrink-0 opacity-70", item.tone)}
									/>
								</div>
								<p
									className={cn(
										"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
										item.tone
									)}
								>
									{useApi && statsQ.isLoading
										? "—"
										: item.value.toLocaleString()}
								</p>
							</div>
						);
					})}
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-border bg-card">
				<div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
					<div className="relative min-w-[180px] flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={filters.search}
							onChange={(e) => patchFilters({ search: e.target.value })}
							placeholder="Search name, member ID, alternate ID…"
							className={cn(compactFieldClass, "pl-8")}
						/>
					</div>
					<Select
						value={filters.memberStatus}
						onValueChange={(value) => patchFilters({ memberStatus: value })}
					>
						<SelectTrigger className={cn(compactFieldClass, "w-[140px]")}>
							<SelectValue placeholder="All status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All status</SelectItem>
							<SelectItem value="Active">Active</SelectItem>
							<SelectItem value="Pending">Pending</SelectItem>
							<SelectItem value="Inactive">Inactive</SelectItem>
							<SelectItem value="Termed">Termed</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={filters.plan}
						onValueChange={(value) => patchFilters({ plan: value })}
					>
						<SelectTrigger className={cn(compactFieldClass, "w-[150px]")}>
							<SelectValue placeholder="All plans" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All plans</SelectItem>
							{plans.map((planName) => (
								<SelectItem key={planName} value={planName}>
									{planName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className={cn(
							"h-8",
							showMoreFilters && "border-primary/40 bg-primary/5 text-primary"
						)}
						onClick={() => setShowMoreFilters((v) => !v)}
					>
						<Filter className="mr-1.5 size-3.5" />
						Filters
						<ChevronDown
							className={cn(
								"ml-1 size-3.5 transition-transform",
								showMoreFilters && "rotate-180"
							)}
						/>
					</Button>
					{hasActiveFilters || hasPendingFilterSync ? (
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

				{hasUnsupportedLiveFilters ? (
					<div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
						<AlertCircle className="mt-0.5 size-3.5 shrink-0" />
						<p>
							Term date filters are not applied on the live API yet. Results may
							not match until backend ships{" "}
							<code className="rounded bg-background/60 px-1 py-px text-[11px]">
								status_term_from/to
							</code>
							. See{" "}
							<code className="rounded bg-background/60 px-1 py-px text-[11px]">
								docs/api-contracts/members-360.md
							</code>
							.
						</p>
					</div>
				) : null}

				{showMoreFilters ? (
					<div className="grid gap-2 border-b border-border bg-muted/15 p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
						<CompactField id="member-id" label="Member ID">
							<Input
								id="member-id"
								value={filters.memberId}
								onChange={(e) => patchFilters({ memberId: e.target.value })}
								placeholder="Member ID"
								className={compactFieldClass}
							/>
						</CompactField>
						<CompactField id="alternate-id" label="Alternate ID">
							<Input
								id="alternate-id"
								value={filters.alternateId}
								onChange={(e) => patchFilters({ alternateId: e.target.value })}
								placeholder="Alternate ID"
								className={compactFieldClass}
							/>
						</CompactField>
						<CompactField id="newtech-member-id" label="NewTech Member ID">
							<Input
								id="newtech-member-id"
								value={filters.newtechMemberId}
								onChange={(e) =>
									patchFilters({ newtechMemberId: e.target.value })
								}
								placeholder="8-digit ID"
								className={compactFieldClass}
								inputMode="numeric"
							/>
						</CompactField>
						<CompactField id="newtech-family-id" label="NewTech Family ID">
							<Input
								id="newtech-family-id"
								value={filters.newtechFamilyId}
								onChange={(e) =>
									patchFilters({ newtechFamilyId: e.target.value })
								}
								placeholder="8-digit ID"
								className={compactFieldClass}
								inputMode="numeric"
							/>
						</CompactField>
						<CompactField id="first-name" label="First name">
							<Input
								id="first-name"
								value={filters.firstName}
								onChange={(e) => patchFilters({ firstName: e.target.value })}
								placeholder="First"
								className={compactFieldClass}
							/>
						</CompactField>
						<CompactField id="last-name" label="Last name">
							<Input
								id="last-name"
								value={filters.lastName}
								onChange={(e) => patchFilters({ lastName: e.target.value })}
								placeholder="Last"
								className={compactFieldClass}
							/>
						</CompactField>
						<CompactField id="dob" label="DOB">
							<Input
								id="dob"
								type="date"
								value={filters.dob}
								onChange={(e) => patchFilters({ dob: e.target.value })}
								className={cn(
									compactFieldClass,
									"[color-scheme:light] dark:[color-scheme:dark]"
								)}
							/>
						</CompactField>
						<CompactField label="Gender">
							<Select
								value={filters.gender}
								onValueChange={(value: GenderFilter) =>
									patchFilters({ gender: value })
								}
							>
								<SelectTrigger className={compactFieldClass}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="Male">Male</SelectItem>
									<SelectItem value="Female">Female</SelectItem>
									<SelectItem value="Other">Other</SelectItem>
									<SelectItem value="Unknown">Unknown</SelectItem>
								</SelectContent>
							</Select>
						</CompactField>
						<CompactField label="Eligibility">
							<Select
								value={filters.eligibilityStatus}
								onValueChange={(value) =>
									patchFilters({ eligibilityStatus: value })
								}
							>
								<SelectTrigger className={compactFieldClass}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="Active">Active</SelectItem>
									<SelectItem value="Pending">Pending</SelectItem>
									<SelectItem value="Inactive">Inactive</SelectItem>
									<SelectItem value="Termed">Termed</SelectItem>
								</SelectContent>
							</Select>
						</CompactField>
						<CompactField label="Account / group name">
							<Select
								value={filters.accountGroup}
								onValueChange={(value) => patchFilters({ accountGroup: value })}
							>
								<SelectTrigger className={compactFieldClass}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									{accountGroups.map((group) => (
										<SelectItem key={group} value={group}>
											{group}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CompactField>
						<CompactField id="group-id" label="Group ID">
							<Input
								id="group-id"
								value={filters.groupId}
								onChange={(e) => patchFilters({ groupId: e.target.value })}
								placeholder="Employer / group ID"
								className={compactFieldClass}
							/>
						</CompactField>
						<CompactField
							id="coverage-effective-from"
							label="Coverage eff. from"
						>
							<Input
								id="coverage-effective-from"
								type="date"
								value={filters.effectiveFrom}
								onChange={(e) =>
									patchFilters({ effectiveFrom: e.target.value })
								}
								className={cn(
									compactFieldClass,
									"[color-scheme:light] dark:[color-scheme:dark]"
								)}
							/>
						</CompactField>
						<CompactField id="coverage-effective-to" label="Coverage eff. to">
							<Input
								id="coverage-effective-to"
								type="date"
								value={filters.effectiveTo}
								onChange={(e) => patchFilters({ effectiveTo: e.target.value })}
								className={cn(
									compactFieldClass,
									"[color-scheme:light] dark:[color-scheme:dark]"
								)}
							/>
						</CompactField>
						<CompactField id="term-from" label="Term from">
							<Input
								id="term-from"
								type="date"
								value={filters.termFrom}
								onChange={(e) => patchFilters({ termFrom: e.target.value })}
								className={cn(
									compactFieldClass,
									"[color-scheme:light] dark:[color-scheme:dark]"
								)}
							/>
						</CompactField>
						<CompactField id="term-to" label="Term to">
							<Input
								id="term-to"
								type="date"
								value={filters.termTo}
								onChange={(e) => patchFilters({ termTo: e.target.value })}
								className={cn(
									compactFieldClass,
									"[color-scheme:light] dark:[color-scheme:dark]"
								)}
							/>
						</CompactField>
						<CompactField id="lob" label="LOB">
							<Input
								id="lob"
								value={filters.lob}
								onChange={(e) => patchFilters({ lob: e.target.value })}
								placeholder="Line of business"
								className={compactFieldClass}
							/>
						</CompactField>
						<CompactField label="Vendor">
							<Select
								value={filters.vendorId}
								onValueChange={(value) => patchFilters({ vendorId: value })}
							>
								<SelectTrigger className={compactFieldClass}>
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									{(vendorsQ.data ?? [])
										.filter((v) => Boolean(v.id))
										.map((v) => (
											<SelectItem key={v.id} value={v.id}>
												{v.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</CompactField>
					</div>
				) : null}

				<div className="w-full overflow-x-auto">
					<Table className="w-full min-w-[1080px] table-fixed">
						<TableHeader>
							<TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
								<TableHead className={cn(th, "w-[3%] text-center")}>
									#
								</TableHead>
								<TableHead className={cn(th, "w-[11%]")}>Member ID</TableHead>
								<TableHead className={cn(th, "w-[13%]")}>Name</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>Alt ID</TableHead>
								<TableHead className={cn(th, "w-[7%]")}>DOB</TableHead>
								<TableHead className={cn(th, "w-[4%]")}>Sex</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>Eligibility</TableHead>
								<TableHead className={cn(th, "w-[10%]")}>Plan</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>Group</TableHead>
								<TableHead className={cn(th, "w-[5%]")}>LOB</TableHead>
								<TableHead className={cn(th, "w-[7%]")}>Status</TableHead>
								<TableHead className={cn(th, "w-[8%]")}>Cov. eff.</TableHead>
								<TableHead
									className={cn(th, "w-[132px] min-w-[132px] text-right")}
								>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((member, index) => (
								<TableRow
									key={member.id}
									className="cursor-pointer border-b border-border/70 hover:bg-muted/50"
									onClick={() => router.push(`/admin/members/${member.id}`)}
								>
									<TableCell
										className={cn(
											td,
											"text-center tabular-nums text-muted-foreground"
										)}
									>
										{(safePage - 1) * pageSize + index + 1}
									</TableCell>
									<TableCell
										className={cn(
											td,
											"truncate font-mono text-[11px] font-medium text-primary"
										)}
										title={member.memberId}
									>
										{member.memberId}
									</TableCell>
									<TableCell className={td}>
										<span
											className="block truncate font-medium text-primary hover:underline"
											title={displayName(member)}
										>
											{displayName(member)}
										</span>
									</TableCell>
									<TableCell
										className={cn(td, "truncate text-muted-foreground")}
										title={member.alternateId ?? undefined}
									>
										{member.alternateId ?? "—"}
									</TableCell>
									<TableCell className={cn(td, "tabular-nums")}>
										{formatDate(member.dob)}
									</TableCell>
									<TableCell className={cn(td, "text-muted-foreground")}>
										{member.gender === "Male"
											? "M"
											: member.gender === "Female"
												? "F"
												: member.gender === "Other"
													? "O"
													: "U"}
									</TableCell>
									<TableCell className={td}>
										<EligibilityPill label={member.eligibilityLabel} />
									</TableCell>
									<TableCell
										className={cn(td, "truncate")}
										title={member.planName}
									>
										{member.planName}
									</TableCell>
									<TableCell
										className={cn(td, "truncate text-muted-foreground")}
										title={member.accountGroup ?? undefined}
									>
										{member.accountGroup ?? "—"}
									</TableCell>
									<TableCell className={cn(td, "truncate")} title={member.lob}>
										{member.lob}
									</TableCell>
									<TableCell className={td}>
										<StatusPill status={member.status} />
									</TableCell>
									<TableCell
										className={cn(
											td,
											"truncate tabular-nums text-muted-foreground"
										)}
										title={formatDate(
											member.coverageEffectiveDate ?? member.memberSince
										)}
									>
										{formatDate(
											member.coverageEffectiveDate ?? member.memberSince
										)}
									</TableCell>
									<TableCell
										className={cn(td, "w-[132px] min-w-[132px] text-right")}
										onClick={(e) => e.stopPropagation()}
									>
										<div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
											<Button
												asChild
												variant="ghost"
												size="sm"
												className="h-7 shrink-0 px-2 text-xs"
											>
												<Link href={`/admin/members/${member.id}`}>Open</Link>
											</Button>
											<MemberListRowDelete memberId={member.id} />
										</div>
									</TableCell>
								</TableRow>
							))}
							{pageRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={13}
										className="h-20 text-center text-sm text-muted-foreground"
									>
										No members match your filters.
									</TableCell>
								</TableRow>
							) : null}
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
						{pageButtons.map((n) => (
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
		</div>
	);
}

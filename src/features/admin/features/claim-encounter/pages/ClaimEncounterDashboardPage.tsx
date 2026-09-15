"use client";

import { useMemo, useState } from "react";

import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	ClipboardList,
	FileInput,
	FileOutput,
	FileWarning,
	GitCompare,
	Inbox,
	type LucideIcon,
	MessageSquareReply,
	RefreshCw,
	Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { CmsEdgeSectionPanel } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import {
	filesForProgram,
	formatCount,
} from "@/features/admin/features/claim-encounter/feature/api/claimEncounterApi";
import { useProgramFilesQuery } from "@/features/admin/features/claim-encounter/feature/queries/useClaimEncounterQuery";
import { Link } from "@/i18n/navigation";
import { isClaimVendorFilesMockEnabled, isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const toolbarBtn =
	"h-9 gap-1.5 rounded-sm px-3 text-xs font-medium shadow-none transition-all duration-200 ease-out";

const STAT_SHADOW =
	"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]";
const STAT_SHADOW_HOVER =
	"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.10)]";

export function ClaimEncounterDashboardPage() {
	const useFixtures = isMockEnabled() || isClaimVendorFilesMockEnabled();
	if (!useFixtures) {
		return (
			<VendorCoreGate title="Claim Encounter">
				<ClaimEncounterDashboardBody useLive />
			</VendorCoreGate>
		);
	}
	return <ClaimEncounterDashboardBody useLive={false} />;
}

function ClaimEncounterDashboardBody({ useLive }: { useLive: boolean }) {
	const programFilter = useAdminModuleStore((s) => s.fileType);
	const inboundQuery = useProgramFilesQuery(programFilter, "inbound", useLive);
	const outboundQuery = useProgramFilesQuery(
		programFilter,
		"outbound",
		useLive
	);
	const [refreshing, setRefreshing] = useState(false);

	const stats = useMemo(() => {
		const inbound = useLive
			? (inboundQuery.data ?? [])
			: filesForProgram(programFilter, "inbound");
		const outbound = useLive
			? (outboundQuery.data ?? [])
			: filesForProgram(programFilter, "outbound");
		const pending = inbound.filter((f) => f.reviewStatus === "pending");
		const rejected = inbound.filter((f) => f.reviewStatus === "rejected");
		const accepted = outbound.filter((f) => f.reviewStatus === "accepted");
		const denied = outbound.filter(
			(f) => f.reviewStatus === "denied" || f.reviewStatus === "rejected"
		);
		const queued = outbound.filter((f) => f.outboundSendStatus === "queued");
		const sent = outbound.filter((f) => f.outboundSendStatus === "sent");

		return {
			pending: pending.length,
			rejected: rejected.length,
			accepted: accepted.length,
			denied: denied.length,
			queued: queued.length,
			sent: sent.length,
			inboundClaims: inbound.reduce((s, f) => s + f.records, 0),
			outboundClaims: outbound.reduce((s, f) => s + f.records, 0),
			inboundFiles: inbound.length,
			outboundFiles: outbound.length,
		};
	}, [useLive, inboundQuery.data, outboundQuery.data, programFilter]);

	async function handleRefresh() {
		setRefreshing(true);
		if (useLive) {
			await Promise.all([inboundQuery.refetch(), outboundQuery.refetch()]);
		} else {
			await new Promise((r) => setTimeout(r, 300));
		}
		setRefreshing(false);
		toast.success("Dashboard refreshed");
	}

	const kpis: {
		id: string;
		label: string;
		value: number;
		hint: string;
		icon: LucideIcon;
		accent: string;
		valueTone: string;
		iconTone: string;
		href: string;
	}[] = [
		{
			id: "pending",
			label: "Pending inbound",
			value: stats.pending,
			hint: `${formatCount(stats.inboundClaims)} claims in queue`,
			icon: Inbox,
			accent: "from-amber-500/80 to-amber-400/40",
			valueTone: "text-amber-700 dark:text-amber-300",
			iconTone: "text-amber-700 bg-amber-500/10 dark:text-amber-200",
			href: "/admin/claim-encounter/inbound",
		},
		{
			id: "rejected",
			label: "MFC rejected",
			value: stats.rejected,
			hint: "Held for vendor correction",
			icon: FileWarning,
			accent: "from-rose-500/80 to-rose-400/40",
			valueTone: "text-rose-700 dark:text-rose-300",
			iconTone: "text-rose-700 bg-rose-500/10 dark:text-rose-300",
			href: "/admin/claim-encounter/inbound",
		},
		{
			id: "accepted",
			label: "Accepted outbound",
			value: stats.accepted,
			hint: `${formatCount(stats.queued)} queued · ${formatCount(stats.sent)} sent`,
			icon: CheckCircle2,
			accent: "from-emerald-500/80 to-emerald-400/40",
			valueTone: "text-emerald-700 dark:text-emerald-300",
			iconTone: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300",
			href: "/admin/claim-encounter/outbound",
		},
		{
			id: "denied",
			label: "Denied outbound",
			value: stats.denied,
			hint: `${formatCount(stats.outboundClaims)} claims outbound`,
			icon: FileOutput,
			accent: "from-sky-500/80 to-sky-400/40",
			valueTone: "text-sky-700 dark:text-sky-300",
			iconTone: "text-sky-700 bg-sky-500/10 dark:text-sky-300",
			href: "/admin/claim-encounter/outbound",
		},
	];

	const workflows: {
		title: string;
		description: string;
		href: string;
		icon: LucideIcon;
	}[] = [
		{
			title: "Inbound review",
			description: "Accept or reject vendor packages awaiting MFC review",
			href: "/admin/claim-encounter/inbound",
			icon: FileInput,
		},
		{
			title: "Outbound send",
			description: "Queued packages, send status, and EDI download",
			href: "/admin/claim-encounter/outbound",
			icon: Send,
		},
		{
			title: "Claims workbench",
			description: "Search claim headers and open claim detail",
			href: "/admin/claim-encounter/claims",
			icon: ClipboardList,
		},
		{
			title: "Responses",
			description: "277CA / 999 / 835 remittance files",
			href: "/admin/claim-encounter/responses",
			icon: MessageSquareReply,
		},
		{
			title: "Exceptions",
			description: "Assign and resolve claim exceptions / rejections",
			href: "/admin/claim-encounter/exceptions",
			icon: AlertTriangle,
		},
		{
			title: "Vendor comparison",
			description: "Side-by-side vendor performance for this program",
			href: "/admin/claim-encounter/vendor-comparison",
			icon: GitCompare,
		},
	];

	const pipeline = [
		{
			id: "inbound",
			label: "Inbound files",
			value: stats.inboundFiles,
			fill: "#d97706",
		},
		{
			id: "pending",
			label: "Awaiting review",
			value: stats.pending,
			fill: "#f59e0b",
		},
		{
			id: "outbound",
			label: "Outbound packages",
			value: stats.outboundFiles,
			fill: "#0ea5e9",
		},
		{
			id: "queued",
			label: "Queued to send",
			value: stats.queued,
			fill: "#059669",
		},
	];
	const pipelineTotal = Math.max(
		1,
		pipeline.reduce((s, p) => s + p.value, 0)
	);

	return (
		<div className="space-y-4">
			{/* Header — CMS EDGE Reporting rhythm */}
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
				<div className="min-w-0 space-y-1">
					<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						Claims & Encounters
					</h1>
					<p className="text-sm text-muted-foreground">
						Review workspace · {programFilter}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						asChild
						size="sm"
						className={cn(
							toolbarBtn,
							"bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
						)}
					>
						<Link href="/admin/claim-encounter/inbound">
							<Inbox className="size-3.5" />
							Inbound
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
					>
						<Link href="/admin/claim-encounter/outbound">
							<FileOutput className="size-3.5" />
							Outbound
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							toolbarBtn,
							"border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/40 hover:text-foreground"
						)}
						onClick={() => void handleRefresh()}
						disabled={refreshing}
					>
						<RefreshCw
							className={cn("size-3.5", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{useLive && (inboundQuery.error || outboundQuery.error) ? (
				<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
					Could not load queue stats
					{inboundQuery.error
						? `: ${inboundQuery.error.message}`
						: outboundQuery.error
							? `: ${outboundQuery.error.message}`
							: ""}
				</p>
			) : null}
			{useLive && (inboundQuery.isLoading || outboundQuery.isLoading) ? (
				<p className="text-sm text-muted-foreground">Loading program queues…</p>
			) : null}

			{/* KPI grid */}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					return (
						<Link
							key={kpi.id}
							href={kpi.href}
							className={cn(
								"group relative overflow-hidden rounded-sm border border-border/70 bg-card p-4 text-left transition-all duration-200 ease-out",
								STAT_SHADOW,
								STAT_SHADOW_HOVER,
								"hover:-translate-y-px hover:border-border"
							)}
						>
							<span
								aria-hidden
								className={cn(
									"absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
									kpi.accent
								)}
							/>
							<div className="flex items-start justify-between gap-3 pl-1.5">
								<div className="min-w-0">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{kpi.label}
									</p>
									<p
										className={cn(
											"mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
											kpi.valueTone
										)}
									>
										{kpi.value.toLocaleString()}
									</p>
									<p className="mt-1.5 text-xs text-muted-foreground">
										{kpi.hint}
									</p>
								</div>
								<span
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-sm ring-1 ring-inset ring-black/5 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10",
										kpi.iconTone
									)}
								>
									<Icon className="size-[18px]" aria-hidden />
								</span>
							</div>
						</Link>
					);
				})}
			</div>

			{/* Pipeline + program snapshot */}
			<div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
				<CmsEdgeSectionPanel
					title="Queue pipeline"
					subtitle={`${programFilter} files by stage`}
					className="lg:col-span-2"
					bodyClassName="flex flex-1 flex-col gap-4 p-4"
				>
					<div className="flex h-9 shrink-0 overflow-hidden rounded-sm ring-1 ring-inset ring-border/60">
						{pipeline.map((stage) => {
							const widthPct = Math.max(
								stage.value > 0 ? 12 : 0,
								(stage.value / pipelineTotal) * 100
							);
							if (stage.value === 0) return null;
							return (
								<div
									key={stage.id}
									title={`${stage.label}: ${stage.value}`}
									className="relative flex min-w-0 items-center justify-center text-[11px] font-semibold text-white"
									style={{
										width: `${widthPct}%`,
										backgroundColor: stage.fill,
									}}
								>
									<span className="truncate px-1 tabular-nums">
										{stage.value}
									</span>
								</div>
							);
						})}
						{pipeline.every((s) => s.value === 0) ? (
							<div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
								No queue volume for this program
							</div>
						) : null}
					</div>
					<ul className="grid gap-2 sm:grid-cols-2">
						{pipeline.map((stage) => (
							<li key={stage.id}>
								<div className="flex items-center justify-between gap-2 rounded-sm border border-border/60 px-2.5 py-2 text-xs">
									<span className="flex min-w-0 items-center gap-1.5 font-medium">
										<span
											className="size-2 shrink-0 rounded-full"
											style={{ backgroundColor: stage.fill }}
										/>
										<span className="truncate">{stage.label}</span>
									</span>
									<span className="shrink-0 tabular-nums text-muted-foreground">
										{stage.value}
									</span>
								</div>
							</li>
						))}
					</ul>
				</CmsEdgeSectionPanel>

				<CmsEdgeSectionPanel
					title="Program snapshot"
					subtitle="Volume at a glance"
					bodyClassName="flex flex-1 flex-col gap-2 p-4"
				>
					{(
						[
							["Inbound files", stats.inboundFiles],
							["Inbound claims", stats.inboundClaims],
							["Outbound packages", stats.outboundFiles],
							["Outbound claims", stats.outboundClaims],
						] as const
					).map(([label, value]) => (
						<div
							key={label}
							className="flex items-center justify-between rounded-sm border border-border/60 bg-muted/20 px-2.5 py-2"
						>
							<span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
								{label}
							</span>
							<span className="text-sm font-semibold tabular-nums text-foreground">
								{formatCount(value)}
							</span>
						</div>
					))}
				</CmsEdgeSectionPanel>
			</div>

			{/* Workflow destinations — large action buttons */}
			<section className="space-y-2.5">
				<div className="flex flex-wrap items-end justify-between gap-2">
					<div>
						<p className="text-sm font-semibold text-foreground">Workflows</p>
						<p className="text-xs text-muted-foreground">
							Jump to claim encounter tools
						</p>
					</div>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{workflows.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"group relative flex min-h-[7.5rem] flex-col justify-between gap-4 overflow-hidden rounded-sm border border-border/70 bg-card p-5 text-left transition-all duration-200 ease-out",
									"shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)]",
									"hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/20",
									"hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_12px_28px_rgba(15,23,42,0.12)]",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
								)}
							>
								<span
									aria-hidden
									className="absolute inset-y-0 left-0 w-1 bg-primary opacity-80 transition-opacity group-hover:opacity-100"
								/>
								<div className="flex items-start justify-between gap-3 pl-1.5">
									<span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10">
										<Icon className="size-6" aria-hidden />
									</span>
									<span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border/60 bg-background/80 text-muted-foreground transition group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground">
										<ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
									</span>
								</div>
								<div className="min-w-0 space-y-1 pl-1.5">
									<p className="text-base font-semibold tracking-tight text-foreground">
										{item.title}
									</p>
									<p className="text-sm leading-snug text-muted-foreground">
										{item.description}
									</p>
								</div>
							</Link>
						);
					})}
				</div>
			</section>
		</div>
	);
}

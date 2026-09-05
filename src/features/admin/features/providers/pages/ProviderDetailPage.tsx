"use client";

import { useParams, useSearchParams } from "next/navigation";
import {
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	ArrowDownRight,
	ArrowUpRight,
	BadgeCheck,
	Building2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Download,
	Languages,
	MapPin,
	Network,
	PencilLine,
	Stethoscope,
	UserRound,
} from "lucide-react";
import {
	Area,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { VendorCoreLoadingRow } from "@/components/vendor-core/VendorCoreLiveChrome";
import {
	type ClaimActivityStatus,
	type CredentialStatus,
	type ExceptionStatus,
	type FeedStatus,
	type NetworkStatus,
	type ProviderStatus,
	type ProviderSummary,
	displayProviderName,
	formatCompact,
	formatCurrency,
	formatDate,
	getProvider,
	initials,
	providerAge,
} from "@/features/admin/features/providers/feature/api/providersApi";
import {
	useDeleteProviderMutation,
	useHardDeleteProviderMutation,
	useProviderDetailQuery,
	useRestoreProviderMutation,
	useSetProviderStatusMutation,
} from "@/features/admin/features/providers/feature/queries/useProvidersQuery";
import {
	ProviderCreateCredentialButton,
	ProviderCreateExceptionButton,
	ProviderCreateIdentifierButton,
	ProviderCreateLocationButton,
	ProviderCreateNetworkButton,
	ProviderCredentialRowActions,
	ProviderExceptionRowActions,
	ProviderIdentifierRowActions,
	ProviderLocationRowActions,
	ProviderNetworkRowActions,
} from "@/features/admin/features/providers/pages/provider-detail-actions";
import { Link, useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";
import { useAdminModuleStore } from "@/stores/admin-module-store";

const TABS = [
	"Overview",
	"Demographics",
	"Identifiers",
	"Enrollment",
	"Network Participation",
	"Locations",
	"Claims & Encounters",
	"Rejection Trends",
	"Vendors / Sources",
	"Credentialing & Exceptions",
] as const;

type TabId = (typeof TABS)[number];

function statusPillClass(positive: boolean, negative: boolean) {
	if (positive) return "border-chart-2/20 bg-chart-2/10 text-chart-2";
	if (negative)
		return "border-destructive/20 bg-destructive/10 text-destructive";
	return "border-border/60 bg-muted text-muted-foreground";
}

function StatusPill({ status }: { status: ProviderStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				statusPillClass(status === "active", status === "termed")
			)}
		>
			{status}
		</span>
	);
}

function NetworkPill({ status }: { status: NetworkStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold",
				statusPillClass(status === "in_network", status === "out_of_network")
			)}
		>
			{status === "in_network"
				? "In-Network"
				: status === "out_of_network"
					? "Out-of-Network"
					: "Pending"}
		</span>
	);
}

function FeedPill({ status }: { status: FeedStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				statusPillClass(status === "active", status === "inactive")
			)}
		>
			{status}
		</span>
	);
}

function ExceptionPill({ status }: { status: ExceptionStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				statusPillClass(status === "resolved", status === "open")
			)}
		>
			{status.replace("_", " ")}
		</span>
	);
}

function ClaimStatusPill({ status }: { status: ClaimActivityStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				statusPillClass(
					status === "paid" || status === "accepted",
					status === "denied" || status === "rejected"
				)
			)}
		>
			{status}
		</span>
	);
}

const PROVIDER_UI = {
	radius: "rounded-xl",
	radiusSm: "rounded-lg",
	surface: "overflow-hidden border border-border/60 bg-card shadow-sm",
	label:
		"text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
	labelAccent:
		"text-[10px] font-medium uppercase tracking-[0.08em] text-primary/80",
	title: "text-sm font-semibold tracking-tight text-foreground",
} as const;

function SurfaceTopAccent() {
	return (
		<div
			className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-primary/35 to-transparent"
			aria-hidden
		/>
	);
}

function Panel({
	title,
	icon: Icon,
	action,
	children,
	className,
	dense,
	flush,
}: {
	title: string;
	icon?: typeof BadgeCheck;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	dense?: boolean;
	/** Edge-to-edge table body (no side padding) — use for data tables. */
	flush?: boolean;
}) {
	return (
		<section
			className={cn(
				"flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm",
				className
			)}
		>
			<div
				className={cn(
					"relative flex items-center gap-2.5 border-b border-border/50 bg-muted/20",
					dense ? "px-4 py-2.5" : "px-4 py-3"
				)}
			>
				<span
					className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
					aria-hidden
				/>
				{Icon ? (
					<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Icon className="size-3.5" strokeWidth={2.25} />
					</span>
				) : null}
				<h3 className={cn("min-w-0 flex-1", PROVIDER_UI.title)}>{title}</h3>
				{action}
			</div>
			<div
				className={cn(
					"min-h-0 flex-1 bg-card",
					flush ? "p-0" : dense ? "p-3.5" : "p-4"
				)}
			>
				{children}
			</div>
		</section>
	);
}

/** Collapsible panel for Overview / Demographics — keeps Panel chrome, toggle body. */
function CollapsiblePanel({
	title,
	icon: Icon,
	action,
	children,
	className,
	dense,
	defaultOpen = true,
}: {
	title: string;
	icon?: typeof BadgeCheck;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	dense?: boolean;
	defaultOpen?: boolean;
}) {
	return (
		<Accordion
			type="multiple"
			defaultValue={defaultOpen ? ["section"] : []}
			className={cn("min-w-0", className)}
		>
			<AccordionItem
				value="section"
				className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
			>
				<AccordionTrigger
					className={cn(
						"relative items-center gap-2.5 rounded-none border-b border-transparent bg-muted/20 py-0 pr-4 hover:no-underline data-[state=open]:border-border/50",
						dense ? "pl-4" : "pl-4"
					)}
				>
					<span
						className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
						aria-hidden
					/>
					<span
						className={cn(
							"flex min-w-0 flex-1 items-center gap-2.5",
							dense ? "py-2.5" : "py-3"
						)}
					>
						{Icon ? (
							<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Icon className="size-3.5" strokeWidth={2.25} />
							</span>
						) : null}
						<span
							className={cn("min-w-0 truncate text-left", PROVIDER_UI.title)}
						>
							{title}
						</span>
						{action ? (
							<span
								className="ml-auto shrink-0"
								onClick={(event) => event.stopPropagation()}
								onKeyDown={(event) => event.stopPropagation()}
							>
								{action}
							</span>
						) : null}
					</span>
				</AccordionTrigger>
				<AccordionContent className="border-t-0 pb-0">
					<div className={cn("bg-card", dense ? "p-3.5" : "p-4")}>
						{children}
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}

function ViewAllLink({
	onClick,
	label = "View all",
}: {
	onClick?: () => void;
	label?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
		>
			{label}
			<span aria-hidden>→</span>
		</button>
	);
}

/** Table chrome — compact rows, clear field headers. Fixed layout + clamp long text. */
const DETAIL_TH =
	"h-8 bg-muted/45 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";
const DETAIL_TD =
	"min-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2.5 align-middle text-xs text-foreground";
const DETAIL_TD_MUTED = cn(DETAIL_TD, "text-muted-foreground");
const DETAIL_TD_WRAP =
	"min-w-0 overflow-hidden break-words whitespace-normal px-2.5 py-1.5 align-middle text-xs text-foreground";
const DETAIL_TD_ACTIONS =
	"min-w-0 overflow-visible whitespace-normal px-2.5 py-1.5 align-middle text-xs";
const DETAIL_ROW =
	"border-b border-border/40 hover:bg-muted/20 last:border-b-0";

function DetailTableHead({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <TableHead className={cn(DETAIL_TH, className)}>{children}</TableHead>;
}

type AttrColumn = {
	key: string;
	label: string;
	align?: "left" | "right";
	className?: string;
	mono?: boolean;
};

/** Horizontal attribute table — column headers across top, one+ data rows under. */
function AttrTable({
	columns,
	rows,
	className,
}: {
	columns: AttrColumn[];
	rows: Array<Record<string, ReactNode>>;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"overflow-x-auto overflow-y-hidden rounded-lg border border-border/50 bg-background/40",
				className
			)}
		>
			<Table className="w-full table-fixed">
				<TableHeader>
					<TableRow className="border-b border-border/50 hover:bg-transparent">
						{columns.map((col) => (
							<DetailTableHead
								key={col.key}
								className={cn(
									col.align === "right" && "text-right",
									col.className
								)}
							>
								{col.label}
							</DetailTableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row, i) => (
						<TableRow key={i} className={DETAIL_ROW}>
							{columns.map((col) => {
								const value = row[col.key] ?? "—";
								const plain =
									typeof value === "string" || typeof value === "number";
								return (
									<TableCell
										key={col.key}
										title={plain ? String(value) : undefined}
										className={cn(
											DETAIL_TD,
											"font-medium",
											col.align === "right" && "text-right",
											col.mono && "font-mono tabular-nums tracking-tight",
											col.className
										)}
									>
										{plain ? (
											value
										) : (
											<span className="block min-w-0 truncate">{value}</span>
										)}
									</TableCell>
								);
							})}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

/** Shared wrapper for multi-row list tables (locations, claims, etc.). */
function DataTableShell({ children }: { children: ReactNode }) {
	return (
		<div className="overflow-x-auto overflow-y-hidden rounded-lg border border-border/50 bg-background/40">
			{children}
		</div>
	);
}

function ProfileStatusBadge({ status }: { status: ProviderStatus }) {
	const label =
		status === "active"
			? "Active"
			: status === "pending"
				? "Pending"
				: status === "inactive"
					? "Inactive"
					: "Termed";

	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
				status === "active" && "border-chart-2/20 bg-chart-2/10 text-chart-2",
				status === "pending" && "border-chart-3/20 bg-chart-3/10 text-chart-3",
				status === "inactive" &&
					"border-border/60 bg-muted text-muted-foreground",
				status === "termed" &&
					"border-destructive/20 bg-destructive/10 text-destructive"
			)}
		>
			{label}
		</span>
	);
}

function HeaderField({
	label,
	value,
	accent,
	mono,
}: {
	label: string;
	value: ReactNode;
	accent?: boolean;
	mono?: boolean;
}) {
	return (
		<div className="min-w-0 space-y-1.5">
			<p className={accent ? PROVIDER_UI.labelAccent : PROVIDER_UI.label}>
				{label}
			</p>
			<div
				className={cn(
					"text-sm font-medium leading-snug",
					accent ? "text-primary" : "text-foreground",
					mono && "font-mono text-[13px] tabular-nums tracking-tight"
				)}
			>
				{value ?? "—"}
			</div>
		</div>
	);
}

const METRIC_DOT_TONES = [
	"bg-chart-3",
	"bg-primary",
	"bg-chart-5",
	"bg-chart-4",
	"bg-chart-2",
	"bg-primary/70",
	"bg-chart-5/80",
] as const;

function MetricStrip({
	title,
	items,
	compact,
	embedded,
	className,
}: {
	title?: string;
	items: Array<{
		label: string;
		value: ReactNode;
		accent?: boolean;
		mono?: boolean;
		sub?: ReactNode;
	}>;
	compact?: boolean;
	embedded?: boolean;
	className?: string;
}) {
	return (
		<section className={cn(!embedded && "overflow-hidden", className)}>
			{title ? (
				<div className="px-5 pt-4 pb-1 sm:px-6">
					<p className={PROVIDER_UI.label}>{title}</p>
				</div>
			) : null}
			<div className="flex w-full overflow-x-auto lg:overflow-visible">
				<div className="flex min-w-max flex-1 lg:min-w-0">
					{items.map((item, index) => (
						<div
							key={item.label}
							className={cn(
								"min-w-0 flex-1 transition-colors hover:bg-muted/[0.14]",
								compact
									? "min-w-[7.5rem] px-4 py-4 sm:min-w-[8.5rem] sm:px-5"
									: "min-w-[8.5rem] px-5 py-4 sm:px-6",
								index > 0 && "border-l border-border/25"
							)}
						>
							<div className="flex items-center gap-1.5">
								<span
									className={cn(
										"size-1.5 shrink-0 rounded-full",
										METRIC_DOT_TONES[index % METRIC_DOT_TONES.length]
									)}
								/>
								<p className={PROVIDER_UI.label}>{item.label}</p>
							</div>
							<div
								className={cn(
									"mt-1.5 truncate text-sm font-medium",
									item.mono &&
										"font-mono text-[13px] tabular-nums tracking-tight",
									item.accent ? "text-primary" : "text-foreground"
								)}
							>
								{item.value ?? "—"}
							</div>
							{item.sub ? (
								<p className="mt-1 truncate text-[11px] leading-snug text-muted-foreground">
									{item.sub}
								</p>
							) : null}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function Trend({ value }: { value: number }) {
	const up = value >= 0;
	const Icon = up ? ArrowUpRight : ArrowDownRight;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums",
				up ? "text-chart-2" : "text-destructive"
			)}
		>
			<Icon className="size-3" />
			{up ? "+" : ""}
			{value}%
		</span>
	);
}

function ProviderTabsNav({
	tab,
	onTabChange,
}: {
	tab: TabId;
	onTabChange: (next: TabId) => void;
}) {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [canLeft, setCanLeft] = useState(false);
	const [canRight, setCanRight] = useState(false);

	const updateOverflow = useCallback(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const max = el.scrollWidth - el.clientWidth;
		setCanLeft(el.scrollLeft > 2);
		setCanRight(max - el.scrollLeft > 2);
	}, []);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		updateOverflow();
		el.addEventListener("scroll", updateOverflow, { passive: true });
		const ro = new ResizeObserver(updateOverflow);
		ro.observe(el);
		return () => {
			el.removeEventListener("scroll", updateOverflow);
			ro.disconnect();
		};
	}, [updateOverflow]);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const active = el.querySelector<HTMLElement>('[data-active-tab="true"]');
		if (!active) return;
		const parentRect = el.getBoundingClientRect();
		const tabRect = active.getBoundingClientRect();
		const outLeft = tabRect.left < parentRect.left + 4;
		const outRight = tabRect.right > parentRect.right - 4;
		if (outLeft || outRight) {
			active.scrollIntoView({
				behavior: "smooth",
				inline: "nearest",
				block: "nearest",
			});
		}
		requestAnimationFrame(updateOverflow);
	}, [tab, updateOverflow]);

	function scrollByDir(dir: -1 | 1) {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollBy({
			left: dir * Math.max(160, el.clientWidth * 0.55),
			behavior: "smooth",
		});
	}

	return (
		<nav
			className={cn(
				"relative flex items-center gap-1 border border-border/60 bg-card p-1.5 shadow-sm",
				PROVIDER_UI.radius
			)}
		>
			<button
				type="button"
				aria-label="Scroll tabs left"
				disabled={!canLeft}
				onClick={() => scrollByDir(-1)}
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-lg transition-opacity",
					canLeft
						? "text-muted-foreground hover:bg-muted hover:text-foreground"
						: "pointer-events-none opacity-0"
				)}
			>
				<ChevronLeft className="size-3.5" />
			</button>
			<div
				ref={scrollerRef}
				className={cn(
					"flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden",
					"[scrollbar-width:thin] [scrollbar-color:oklch(0.55_0_0_/_0.35)_transparent]",
					"[&::-webkit-scrollbar]:h-1.5",
					"[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/40",
					"[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/25",
					"hover:[&::-webkit-scrollbar-thumb]:bg-foreground/40",
					"[&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent",
					"[&::-webkit-scrollbar-thumb]:bg-clip-padding"
				)}
			>
				{TABS.map((item) => {
					const active = tab === item;
					return (
						<button
							key={item}
							type="button"
							data-active-tab={active ? "true" : undefined}
							onClick={() => onTabChange(item)}
							className={cn(
								"shrink-0 rounded-lg px-3.5 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors",
								active
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
							)}
						>
							{item}
						</button>
					);
				})}
			</div>
			<button
				type="button"
				aria-label="Scroll tabs right"
				disabled={!canRight}
				onClick={() => scrollByDir(1)}
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-lg transition-opacity",
					canRight
						? "text-muted-foreground hover:bg-muted hover:text-foreground"
						: "pointer-events-none opacity-0"
				)}
			>
				<ChevronRight className="size-3.5" />
			</button>
		</nav>
	);
}

export function ProviderDetailPage({
	providerId: providerIdProp,
}: {
	providerId?: string;
}) {
	return (
		<Suspense fallback={<VendorCoreLoadingRow label="Loading provider…" />}>
			<ProviderDetailPageInner providerIdProp={providerIdProp} />
		</Suspense>
	);
}

function ProviderDetailPageInner({
	providerIdProp,
}: {
	providerIdProp?: string;
}) {
	const params = useParams<{ providerId?: string | string[] }>();
	const searchParams = useSearchParams();
	const raw = providerIdProp ?? params.providerId;
	const providerId = decodeURIComponent(
		Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "")
	);
	const useApi = !isMockEnabled();
	const programFilter = useAdminModuleStore(
		(s) => s.fileType
	) as ProviderSummary["program"];
	const detailQuery = useProviderDetailQuery(providerId, useApi, programFilter);
	const mockProvider = useMemo(
		() => (!useApi && providerId ? getProvider(providerId) : undefined),
		[useApi, providerId]
	);
	const provider = useApi ? detailQuery.data : mockProvider;
	const router = useRouter();
	const confirm = useConfirm();
	const tabFromQuery = searchParams.get("tab");
	const [tab, setTab] = useState<TabId>(() => {
		if (tabFromQuery && (TABS as readonly string[]).includes(tabFromQuery)) {
			return tabFromQuery as TabId;
		}
		return "Overview";
	});

	/** Keep tab in sync when arriving from section editor (`?tab=`), not when user clicks tabs. */
	useEffect(() => {
		if (tabFromQuery && (TABS as readonly string[]).includes(tabFromQuery)) {
			setTab(tabFromQuery as TabId);
		}
	}, [tabFromQuery]);

	const handleTabChange = useCallback(
		(next: TabId) => {
			setTab(next);
			if (!providerId) return;
			const qs = new URLSearchParams(searchParams.toString());
			qs.set("tab", next);
			router.replace(`/admin/providers/${providerId}?${qs.toString()}`, {
				scroll: false,
			});
		},
		[providerId, router, searchParams]
	);

	const setStatusMutation = useSetProviderStatusMutation();
	const deleteProviderMutation = useDeleteProviderMutation();
	const restoreProviderMutation = useRestoreProviderMutation();
	const hardDeleteProviderMutation = useHardDeleteProviderMutation();
	const [lifecycleBusy, setLifecycleBusy] = useState(false);

	async function handleSetStatus(status: ProviderStatus): Promise<void> {
		if (!providerId) return;
		if (!useApi) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		setLifecycleBusy(true);
		try {
			await setStatusMutation.mutateAsync({ id: providerId, body: { status } });
			toast.success(`Provider status updated to ${status}.`);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to update status.";
			toast.error(message);
		} finally {
			setLifecycleBusy(false);
		}
	}

	async function handleArchiveProvider(): Promise<void> {
		if (!providerId) return;
		if (!useApi) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		const ok = await confirm({
			title: "Archive this provider?",
			description:
				"It will be removed from the default directory. You can restore it later from archived providers.",
			confirmLabel: "Archive provider",
			cancelLabel: "Keep provider",
			variant: "destructive",
			icon: "archive",
		});
		if (!ok) return;
		setLifecycleBusy(true);
		try {
			await deleteProviderMutation.mutateAsync({ id: providerId });
			toast.success("Provider archived.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to archive provider.";
			toast.error(message);
		} finally {
			setLifecycleBusy(false);
		}
	}

	async function handleRestoreProvider(): Promise<void> {
		if (!providerId) return;
		if (!useApi) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		setLifecycleBusy(true);
		try {
			await restoreProviderMutation.mutateAsync({ id: providerId });
			toast.success("Provider restored.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to restore provider.";
			toast.error(message);
		} finally {
			setLifecycleBusy(false);
		}
	}

	async function handleHardDeleteProvider(): Promise<void> {
		if (!providerId) return;
		if (!useApi) {
			toast.info("Live-only action. Enable vendor-core mode.");
			return;
		}
		const ok = await confirm({
			title: "Permanently delete this provider?",
			description:
				"Hard delete cannot be undone. Prefer archive unless you need to remove the row entirely.",
			confirmLabel: "Hard delete",
			cancelLabel: "Cancel",
			variant: "destructive",
			icon: "delete",
		});
		if (!ok) return;
		setLifecycleBusy(true);
		try {
			await hardDeleteProviderMutation.mutateAsync({ id: providerId });
			toast.success("Provider permanently deleted.");
			router.push("/admin/providers");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to hard-delete provider.";
			toast.error(message);
		} finally {
			setLifecycleBusy(false);
		}
	}

	const body = (() => {
		if (
			useApi &&
			!detailQuery.data &&
			(detailQuery.isPending || detailQuery.isFetching || detailQuery.isLoading)
		) {
			return <VendorCoreLoadingRow label="Loading provider…" />;
		}

		if (useApi && detailQuery.error) {
			return (
				<div className="space-y-3">
					<p className="text-sm text-destructive">
						{detailQuery.error.message}
					</p>
					<Button asChild variant="outline" size="sm">
						<Link href="/admin/providers">Back to providers</Link>
					</Button>
				</div>
			);
		}

		if (!provider) {
			return (
				<div className="space-y-3">
					<p className="text-sm text-destructive">Provider not found.</p>
					<Button asChild variant="outline" size="sm">
						<Link href="/admin/providers">Back to providers</Link>
					</Button>
				</div>
			);
		}

		const credCounts: Record<CredentialStatus, number> = {
			complete: 0,
			expiring: 0,
			expired: 0,
			pending: 0,
		};
		for (const c of provider.credentialing) credCounts[c.status] += 1;

		const name = displayProviderName(provider);

		const credTotal =
			credCounts.complete +
			credCounts.expiring +
			credCounts.expired +
			credCounts.pending;
		const credPct = credTotal
			? Math.round((credCounts.complete / credTotal) * 100)
			: 0;

		const donutData = [
			{ name: "Complete", value: credCounts.complete, fill: "#059669" },
			{ name: "Expiring", value: credCounts.expiring, fill: "#f59e0b" },
			{ name: "Expired", value: credCounts.expired, fill: "#ef4444" },
			{ name: "Pending", value: credCounts.pending, fill: "#94a3b8" },
		].filter((d) => d.value > 0);

		const primaryNetwork = provider.networks[0];
		const age = providerAge(provider.dob);

		return (
			<div className="space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-xs text-muted-foreground">
						<span>Providers</span>
						<span className="mx-1.5 text-border/80">/</span>
						<span className="font-semibold text-foreground">
							Provider Profile
						</span>
					</p>
					<div className="flex flex-wrap items-center gap-1.5">
						<Button
							asChild
							variant="outline"
							size="sm"
							className="h-9 rounded-md border-border/70 bg-card px-3.5 text-xs shadow-none"
						>
							<Link href={`/admin/providers/${providerId}/edit`}>
								<PencilLine className="mr-1 size-3" />
								Edit
							</Link>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="h-9 rounded-md border-border/70 bg-card px-3.5 text-xs shadow-none"
								>
									Provider Summary
									<ChevronDown className="ml-1 size-3 opacity-60" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => toast.message("Opening provider summary…")}
								>
									One-page summary
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => toast.message("Opening enrollment packet…")}
								>
									Enrollment packet
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									size="sm"
									className="h-9 rounded-md px-3.5 text-xs shadow-none"
								>
									<Download className="mr-1 size-3" />
									Export
									<ChevronDown className="ml-1 size-3 opacity-80" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => toast.success("Exported CSV")}>
									Export CSV
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => toast.success("Exported PDF")}>
									Export PDF
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="h-9 rounded-md border-border/70 bg-card px-3.5 text-xs shadow-none"
									disabled={
										lifecycleBusy ||
										setStatusMutation.isPending ||
										deleteProviderMutation.isPending ||
										restoreProviderMutation.isPending ||
										hardDeleteProviderMutation.isPending
									}
								>
									Lifecycle
									<ChevronDown className="ml-1 size-3 opacity-60" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => void handleSetStatus("active")}
								>
									Set status: Active
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => void handleSetStatus("pending")}
								>
									Set status: Pending
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => void handleSetStatus("inactive")}
								>
									Set status: Inactive
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => void handleSetStatus("termed")}
								>
									Set status: Termed
								</DropdownMenuItem>
								{provider.isDeleted ? (
									<DropdownMenuItem
										onClick={() => void handleRestoreProvider()}
									>
										Restore provider
									</DropdownMenuItem>
								) : (
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => void handleArchiveProvider()}
									>
										Archive provider
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={() => void handleHardDeleteProvider()}
								>
									Hard delete…
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Identity header */}
				<section
					className={cn("relative", PROVIDER_UI.surface, PROVIDER_UI.radius)}
				>
					<SurfaceTopAccent />
					<div
						className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-primary/[0.035] blur-2xl"
						aria-hidden
					/>
					<div
						className="pointer-events-none absolute -bottom-8 left-1/4 size-28 rounded-full bg-chart-5/[0.04] blur-2xl"
						aria-hidden
					/>
					<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-chart-5/[0.015]" />

					<div className="relative border-b border-border/30 px-5 py-5 sm:px-6">
						<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6 xl:gap-8">
							<div className="flex min-w-0 items-center gap-4 lg:max-w-[24rem] lg:shrink-0">
								<div className="relative shrink-0">
									<div className="flex size-12 items-center justify-center rounded-full border-2 border-primary/15 bg-primary text-xs font-semibold text-primary-foreground">
										{initials(provider.name)}
									</div>
									{provider.status === "active" ? (
										<span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card bg-chart-2" />
									) : null}
								</div>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2.5">
										<h1 className="text-lg font-semibold tracking-tight text-primary">
											{name}
										</h1>
										<ProfileStatusBadge status={provider.status} />
									</div>
									<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
										{provider.specialty}
										<span className="mx-1.5 text-border/80">·</span>
										{provider.subspecialty}
										<span className="mx-1.5 text-border/80">·</span>
										{provider.providerType}
									</p>
								</div>
							</div>

							<div
								className="relative hidden w-px shrink-0 self-stretch lg:block"
								aria-hidden
							>
								<span className="absolute inset-y-1 left-0 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
							</div>

							<div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 sm:gap-x-8">
								<HeaderField label="NPI" value={provider.npi} accent mono />
								<HeaderField
									label="Tax ID"
									value={provider.taxId}
									accent
									mono
								/>
								<HeaderField label="UPIN" value={provider.upin} accent mono />
								<HeaderField
									label="Medicaid ID"
									value={provider.medicaidId}
									accent
									mono
								/>
							</div>
						</div>
					</div>

					<MetricStrip
						embedded
						compact
						className="relative bg-muted/[0.14]"
						items={[
							{
								label: "Date of Birth",
								value: formatDate(provider.dob),
								sub:
									age != null
										? `Age ${age} · ${provider.gender}`
										: provider.gender,
							},
							{
								label: "Practice",
								value: provider.practiceName,
								sub: provider.practiceCity
									? `${provider.practiceCity}, ${provider.practiceState}`
									: undefined,
								accent: true,
							},
							{
								label: "Years in Practice",
								value: `${provider.yearsInPractice} yrs`,
							},
							{
								label: "Enrollment",
								value:
									provider.enrollmentStatus === "enrolled"
										? "Enrolled"
										: provider.enrollmentStatus,
								sub: `Eff. ${formatDate(provider.enrollmentEffective)}`,
								accent: provider.enrollmentStatus === "enrolled",
							},
							{
								label: "Program",
								value: provider.program,
							},
							{
								label: "Patients",
								value: provider.acceptingNewPatients ? "Accepting" : "Closed",
								accent: provider.acceptingNewPatients,
							},
							{
								label: "Source",
								value: provider.vendors[0]?.vendor ?? "—",
							},
						]}
					/>
				</section>

				<ProviderTabsNav tab={tab} onTabChange={handleTabChange} />

				{tab === "Overview" ? (
					<div className="space-y-5">
						<CollapsiblePanel
							dense
							defaultOpen
							icon={BadgeCheck}
							title="Provider summary"
						>
							<AttrTable
								columns={[
									{ key: "enrollment", label: "Enrollment" },
									{ key: "effective", label: "Effective" },
									{ key: "program", label: "Program" },
									{ key: "status", label: "Provider status" },
									{ key: "org", label: "Organization" },
									{ key: "address", label: "Address" },
									{ key: "phone", label: "Phone" },
									{ key: "email", label: "Email" },
								]}
								rows={[
									{
										enrollment:
											provider.enrollmentStatus === "enrolled" ? (
												<span className="text-chart-2">Enrolled</span>
											) : (
												<span className="capitalize">
													{provider.enrollmentStatus}
												</span>
											),
										effective: (
											<span className="tabular-nums">
												{formatDate(provider.enrollmentEffective)}
											</span>
										),
										program: provider.program,
										status: <ProfileStatusBadge status={provider.status} />,
										org: provider.practiceName,
										address: `${provider.practiceCity}, ${provider.practiceState}`,
										phone: (
											<span className="tabular-nums">
												{provider.practicePhone}
											</span>
										),
										email: (
											<span className="block truncate" title={provider.email}>
												{provider.email}
											</span>
										),
									},
								]}
							/>
						</CollapsiblePanel>

						<CollapsiblePanel
							dense
							icon={Network}
							title="Network & credentialing"
						>
							<AttrTable
								columns={[
									{ key: "plans", label: "Plans" },
									{ key: "primary", label: "Primary network" },
									{ key: "netStatus", label: "Network status" },
									{ key: "locations", label: "Locations" },
									{ key: "credPct", label: "Cred. complete" },
									{ key: "credTotal", label: "Complete / total" },
									{ key: "expiring", label: "Expiring" },
									{ key: "exceptions", label: "Open exceptions" },
								]}
								rows={[
									{
										plans: String(provider.networks.length),
										primary: primaryNetwork?.networkPlan ?? "—",
										netStatus: primaryNetwork ? (
											<NetworkPill status={primaryNetwork.status} />
										) : (
											"—"
										),
										locations: String(provider.locations.length),
										credPct: <span className="tabular-nums">{credPct}%</span>,
										credTotal: (
											<span className="tabular-nums">
												{credCounts.complete} / {credTotal}
											</span>
										),
										expiring: (
											<span className="tabular-nums">
												{credCounts.expiring}
											</span>
										),
										exceptions: (
											<span className="tabular-nums">
												{provider.exceptions.length}
											</span>
										),
									},
								]}
							/>
						</CollapsiblePanel>

						<CollapsiblePanel
							dense
							icon={Stethoscope}
							title="12-month performance"
						>
							<AttrTable
								columns={[
									{ key: "claims", label: "Claims" },
									{ key: "encounters", label: "Encounters" },
									{ key: "billed", label: "Total billed" },
									{ key: "paid", label: "Total paid" },
									{ key: "rejection", label: "Rejection rate" },
									{ key: "net", label: "Net payment" },
								]}
								rows={[
									{
										claims: (
											<span className="inline-flex items-center gap-1.5">
												<span className="tabular-nums">
													{formatCompact(provider.claims12m)}
												</span>
												<Trend value={provider.claimsTrendPct} />
											</span>
										),
										encounters: (
											<span className="inline-flex items-center gap-1.5">
												<span className="tabular-nums">
													{formatCompact(provider.encounters12m)}
												</span>
												<Trend value={provider.encountersTrendPct} />
											</span>
										),
										billed: (
											<span className="inline-flex items-center gap-1.5">
												<span className="tabular-nums">
													{formatCurrency(provider.billed12m)}
												</span>
												<Trend value={provider.billedTrendPct} />
											</span>
										),
										paid: (
											<span className="inline-flex items-center gap-1.5">
												<span className="tabular-nums">
													{formatCurrency(provider.paid12m)}
												</span>
												<Trend value={provider.paidTrendPct} />
											</span>
										),
										rejection: (
											<span className="inline-flex items-center gap-1.5">
												<span className="tabular-nums">
													{provider.rejectionRate}%
												</span>
												<Trend value={provider.rejectionTrendPct} />
											</span>
										),
										net: (
											<span className="inline-flex items-center gap-1.5">
												<span className="tabular-nums">
													{formatCurrency(provider.netPayment12m)}
												</span>
												<Trend value={provider.netPaymentTrendPct} />
											</span>
										),
									},
								]}
							/>
						</CollapsiblePanel>

						<CollapsiblePanel dense icon={MapPin} title="Locations">
							<DataTableShell>
								<Table className="w-full">
									<colgroup>
										<col className="w-auto" />
										<col className="w-[7.5rem]" />
										<col className="w-[5.5rem]" />
									</colgroup>
									<TableHeader>
										<TableRow className="border-b border-border/50 hover:bg-transparent">
											<DetailTableHead>Location</DetailTableHead>
											<DetailTableHead>Status</DetailTableHead>
											<DetailTableHead>Primary</DetailTableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{provider.locations.map((loc) => (
											<TableRow key={loc.id} className={DETAIL_ROW}>
												<TableCell
													className={DETAIL_TD_WRAP}
													title={`${loc.name} — ${loc.address}`}
												>
													<p className="font-medium">{loc.name}</p>
													<p className="break-words text-xs leading-relaxed text-muted-foreground">
														{loc.address}
													</p>
												</TableCell>
												<TableCell
													className={cn(DETAIL_TD, "whitespace-nowrap")}
												>
													<StatusPill status={loc.status} />
												</TableCell>
												<TableCell
													className={cn(DETAIL_TD, "text-xs whitespace-nowrap")}
												>
													{loc.isPrimary ? "Yes" : "No"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</DataTableShell>
							<ViewAllLink
								label={`View all (${provider.locations.length})`}
								onClick={() => handleTabChange("Locations")}
							/>
						</CollapsiblePanel>

						<CollapsiblePanel
							dense
							icon={Network}
							title="Network participation"
						>
							<DataTableShell>
								<Table className="w-full">
									<colgroup>
										<col className="w-auto" />
										<col className="w-[8rem]" />
										<col className="w-[7rem]" />
									</colgroup>
									<TableHeader>
										<TableRow className="border-b border-border/50 hover:bg-transparent">
											<DetailTableHead>Network</DetailTableHead>
											<DetailTableHead>Status</DetailTableHead>
											<DetailTableHead>Effective</DetailTableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{provider.networks.slice(0, 5).map((n) => (
											<TableRow key={n.id} className={DETAIL_ROW}>
												<TableCell className={cn(DETAIL_TD, "min-w-0")}>
													<p className="font-medium">{n.networkPlan}</p>
													<p className="text-xs text-muted-foreground">
														{n.payer}
													</p>
												</TableCell>
												<TableCell
													className={cn(DETAIL_TD, "whitespace-nowrap")}
												>
													<NetworkPill status={n.status} />
												</TableCell>
												<TableCell
													className={cn(
														DETAIL_TD,
														"text-xs whitespace-nowrap tabular-nums"
													)}
												>
													{formatDate(n.effectiveDate)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</DataTableShell>
							<ViewAllLink
								label={`View all (${provider.networks.length})`}
								onClick={() => handleTabChange("Network Participation")}
							/>
						</CollapsiblePanel>

						<CollapsiblePanel
							dense
							icon={BadgeCheck}
							title="Identifiers"
							action={
								<button
									type="button"
									className="text-xs font-medium text-primary hover:underline"
									onClick={() => handleTabChange("Identifiers")}
								>
									View all →
								</button>
							}
						>
							<AttrTable
								columns={provider.identifiers.map((id) => ({
									key: id.id,
									label: id.label,
									mono: true,
								}))}
								rows={[
									Object.fromEntries(
										provider.identifiers.map((id) => [id.id, id.value])
									),
								]}
							/>
						</CollapsiblePanel>

						{/* Charts stay expanded — not dropdowns */}
						<div className="grid gap-5 lg:grid-cols-2">
							<Panel dense icon={Stethoscope} title="Claims & encounters">
								<div className="h-[260px]">
									<ResponsiveContainer width="100%" height="100%">
										<ComposedChart data={provider.monthlyVolume}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} />
											<XAxis dataKey="month" tick={{ fontSize: 10 }} />
											<YAxis tick={{ fontSize: 10 }} width={36} />
											<Tooltip />
											<Legend wrapperStyle={{ fontSize: 11 }} />
											<Bar
												dataKey="claims"
												name="Claims"
												fill="#13446c"
												radius={[3, 3, 0, 0]}
											/>
											<Line
												type="monotone"
												dataKey="encounters"
												name="Encounters"
												stroke="#059669"
												strokeWidth={2}
												dot={{ r: 3 }}
											/>
										</ComposedChart>
									</ResponsiveContainer>
								</div>
								<ViewAllLink
									label="View claims & encounters"
									onClick={() => handleTabChange("Claims & Encounters")}
								/>
							</Panel>
							<Panel dense icon={ArrowDownRight} title="Rejection trends">
								<div className="h-[260px]">
									<ResponsiveContainer width="100%" height="100%">
										<ComposedChart data={provider.monthlyVolume}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} />
											<XAxis dataKey="month" tick={{ fontSize: 10 }} />
											<YAxis
												yAxisId="left"
												tick={{ fontSize: 10 }}
												width={28}
											/>
											<YAxis
												yAxisId="right"
												orientation="right"
												tick={{ fontSize: 10 }}
												width={32}
												unit="%"
											/>
											<Tooltip />
											<Legend wrapperStyle={{ fontSize: 11 }} />
											<Bar
												yAxisId="left"
												dataKey="rejectionCount"
												name="Rejection Count"
												fill="#fecaca"
												radius={[3, 3, 0, 0]}
											/>
											<Area
												yAxisId="right"
												type="monotone"
												dataKey="rejectionRate"
												name="Rejection Rate (%)"
												stroke="#ef4444"
												fill="#ef444422"
												strokeWidth={2}
											/>
										</ComposedChart>
									</ResponsiveContainer>
								</div>
								<ViewAllLink
									label="View rejection details"
									onClick={() => handleTabChange("Rejection Trends")}
								/>
							</Panel>
						</div>

						<CollapsiblePanel
							dense
							icon={ClipboardList}
							title="Top rejection reasons"
						>
							<DataTableShell>
								<Table className="w-full table-fixed">
									<TableHeader>
										<TableRow className="border-b border-border/50 hover:bg-transparent">
											<DetailTableHead>Reason</DetailTableHead>
											<DetailTableHead className="text-right">
												Count
											</DetailTableHead>
											<DetailTableHead className="text-right">
												%
											</DetailTableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{provider.rejectionReasons.map((r) => (
											<TableRow key={r.id} className={DETAIL_ROW}>
												<TableCell className={DETAIL_TD}>{r.reason}</TableCell>
												<TableCell
													className={cn(DETAIL_TD, "text-right tabular-nums")}
												>
													{r.count}
												</TableCell>
												<TableCell
													className={cn(DETAIL_TD, "text-right tabular-nums")}
												>
													{r.pct}%
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</DataTableShell>
						</CollapsiblePanel>

						<CollapsiblePanel dense icon={Building2} title="Vendors / sources">
							<DataTableShell>
								<Table className="w-full">
									<colgroup>
										<col className="w-auto" />
										<col className="w-[8rem]" />
										<col className="w-[7rem]" />
									</colgroup>
									<TableHeader>
										<TableRow className="border-b border-border/50 hover:bg-transparent">
											<DetailTableHead>Vendor</DetailTableHead>
											<DetailTableHead>Feed</DetailTableHead>
											<DetailTableHead>Status</DetailTableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{provider.vendors.map((v) => (
											<TableRow key={v.id} className={DETAIL_ROW}>
												<TableCell className={cn(DETAIL_TD, "min-w-0")}>
													<p className="font-medium">{v.vendor}</p>
													<p className="text-xs text-muted-foreground">
														{v.frequency} · {v.lastReceived}
													</p>
												</TableCell>
												<TableCell className={DETAIL_TD}>
													{v.fileType}
												</TableCell>
												<TableCell
													className={cn(DETAIL_TD, "whitespace-nowrap")}
												>
													<FeedPill status={v.status} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</DataTableShell>
							<ViewAllLink
								label="View all vendors / sources"
								onClick={() => handleTabChange("Vendors / Sources")}
							/>
						</CollapsiblePanel>

						{/* Credentialing donut chart stays expanded */}
						<Panel dense icon={BadgeCheck} title="Credentialing">
							<div className="flex flex-col items-center gap-3 sm:flex-row">
								<div className="relative h-[160px] w-[160px] shrink-0">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={donutData}
												dataKey="value"
												nameKey="name"
												innerRadius={48}
												outerRadius={68}
												paddingAngle={2}
											>
												{donutData.map((d) => (
													<Cell key={d.name} fill={d.fill} />
												))}
											</Pie>
										</PieChart>
									</ResponsiveContainer>
									<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
										<p className="text-lg font-semibold tabular-nums">
											{credPct}%
										</p>
										<p className="text-xs text-muted-foreground">Complete</p>
									</div>
								</div>
								<ul className="w-full space-y-2 text-sm">
									{[
										{
											label: "Complete",
											value: credCounts.complete,
											color: "bg-chart-2",
										},
										{
											label: "Expiring",
											value: credCounts.expiring,
											color: "bg-chart-3",
										},
										{
											label: "Expired",
											value: credCounts.expired,
											color: "bg-destructive",
										},
										{
											label: "Pending",
											value: credCounts.pending,
											color: "bg-muted-foreground/50",
										},
									].map((row) => (
										<li
											key={row.label}
											className="flex items-center justify-between gap-2"
										>
											<span className="flex items-center gap-2">
												<span
													className={cn("size-2.5 rounded-full", row.color)}
												/>
												{row.label}
											</span>
											<span className="font-medium tabular-nums">
												{row.value}
											</span>
										</li>
									))}
								</ul>
							</div>
							<ViewAllLink
								label="View credentialing details"
								onClick={() => handleTabChange("Credentialing & Exceptions")}
							/>
						</Panel>

						<CollapsiblePanel
							dense
							icon={ClipboardList}
							title="Credentialing & enrollment exceptions"
						>
							{provider.exceptions.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No open exceptions.
								</p>
							) : (
								<DataTableShell>
									<Table className="w-full table-fixed">
										<TableHeader>
											<TableRow className="border-b border-border/50 hover:bg-transparent">
												<DetailTableHead>Type</DetailTableHead>
												<DetailTableHead>Status</DetailTableHead>
												<DetailTableHead>Date</DetailTableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{provider.exceptions.map((ex) => (
												<TableRow key={ex.id} className={DETAIL_ROW}>
													<TableCell
														className={DETAIL_TD_WRAP}
														title={`${ex.exceptionType}: ${ex.description}`}
													>
														<p className="truncate font-medium text-chart-3">
															{ex.exceptionType}
														</p>
														<p className="truncate text-xs text-muted-foreground">
															{ex.description}
														</p>
													</TableCell>
													<TableCell className={DETAIL_TD}>
														<ExceptionPill status={ex.status} />
													</TableCell>
													<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
														{formatDate(ex.dateIdentified)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</DataTableShell>
							)}
							<ViewAllLink
								label="View all exceptions"
								onClick={() => handleTabChange("Credentialing & Exceptions")}
							/>
						</CollapsiblePanel>

						<footer className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
							<p>All dates and times are displayed in Eastern Time (ET).</p>
							<p>Data as of {provider.dataAsOf}</p>
						</footer>
					</div>
				) : (
					<>
						{provider.partialLoadErrors?.length ? (
							<div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
								Some sections failed to load:{" "}
								{provider.partialLoadErrors.join(", ")}. Empty tables may be
								errors, not missing data.
							</div>
						) : null}
						<TabBody tab={tab} provider={provider} providerId={providerId} />
					</>
				)}
			</div>
		);
	})();

	if (useApi) {
		return <VendorCoreGate title="Provider">{body}</VendorCoreGate>;
	}
	return body;
}

function ClaimsEncountersTab({
	provider,
}: {
	provider: NonNullable<ReturnType<typeof getProvider>>;
}) {
	const [pane, setPane] = useState<"claims" | "encounters">("claims");
	const rows =
		pane === "claims" ? provider.recentClaims : provider.recentEncounters;

	const totals = provider.monthlyVolume.reduce(
		(acc, m) => {
			acc.claims += m.claims;
			acc.encounters += m.encounters;
			acc.rejections += m.rejectionCount;
			return acc;
		},
		{ claims: 0, encounters: 0, rejections: 0 }
	);
	const avgRejection =
		Math.round(
			(provider.monthlyVolume.reduce((s, m) => s + m.rejectionRate, 0) /
				provider.monthlyVolume.length) *
				100
		) / 100;

	return (
		<div className="space-y-5">
			<Panel dense icon={Stethoscope} title="12-month performance">
				<AttrTable
					columns={[
						{ key: "claims", label: "Claims" },
						{ key: "encounters", label: "Encounters" },
						{ key: "billed", label: "Billed" },
						{ key: "paid", label: "Paid" },
						{ key: "net", label: "Net payment" },
						{ key: "rejection", label: "Rejection rate" },
					]}
					rows={[
						{
							claims: (
								<span className="tabular-nums">
									{formatCompact(provider.claims12m)}
								</span>
							),
							encounters: (
								<span className="tabular-nums">
									{formatCompact(provider.encounters12m)}
								</span>
							),
							billed: (
								<span className="tabular-nums">
									{formatCurrency(provider.billed12m)}
								</span>
							),
							paid: (
								<span className="tabular-nums">
									{formatCurrency(provider.paid12m)}
								</span>
							),
							net: (
								<span className="tabular-nums">
									{formatCurrency(provider.netPayment12m)}
								</span>
							),
							rejection: (
								<span
									className={cn(
										"tabular-nums",
										provider.rejectionRate < 7 && "text-chart-2"
									)}
								>
									{provider.rejectionRate}%
								</span>
							),
						},
					]}
				/>
			</Panel>

			<div className="grid gap-3 lg:grid-cols-5">
				<Panel
					dense
					icon={Stethoscope}
					title="Volume trend"
					className="lg:col-span-3"
					action={
						<span className="text-[11px] text-muted-foreground">
							Claims vs encounters
						</span>
					}
				>
					<div className="h-[260px]">
						<ResponsiveContainer width="100%" height="100%">
							<ComposedChart data={provider.monthlyVolume}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="month" tick={{ fontSize: 10 }} />
								<YAxis tick={{ fontSize: 10 }} width={40} />
								<Tooltip />
								<Legend wrapperStyle={{ fontSize: 11 }} />
								<Bar
									dataKey="claims"
									name="Claims"
									fill="#13446c"
									radius={[3, 3, 0, 0]}
								/>
								<Line
									type="monotone"
									dataKey="encounters"
									name="Encounters"
									stroke="#059669"
									strokeWidth={2}
									dot={{ r: 2.5 }}
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				</Panel>

				<Panel
					dense
					icon={ClipboardList}
					title="Period summary"
					className="lg:col-span-2"
					action={
						<span className="text-[11px] text-muted-foreground">
							Trailing 12 months
						</span>
					}
				>
					<div className="space-y-4">
						<AttrTable
							columns={[
								{ key: "claims", label: "Total claims" },
								{ key: "encounters", label: "Total encounters" },
								{ key: "rejections", label: "Rejections" },
								{ key: "avg", label: "Avg rejection" },
							]}
							rows={[
								{
									claims: (
										<span className="inline-flex items-center gap-1.5">
											<span className="tabular-nums">
												{formatCompact(totals.claims)}
											</span>
											<Trend value={provider.claimsTrendPct} />
										</span>
									),
									encounters: (
										<span className="inline-flex items-center gap-1.5">
											<span className="tabular-nums">
												{formatCompact(totals.encounters)}
											</span>
											<Trend value={provider.encountersTrendPct} />
										</span>
									),
									rejections: (
										<span className="inline-flex items-center gap-1.5">
											<span className="tabular-nums">
												{formatCompact(totals.rejections)}
											</span>
											<Trend value={provider.rejectionTrendPct} />
										</span>
									),
									avg: (
										<span className="inline-flex items-center gap-1.5">
											<span className="tabular-nums">{avgRejection}%</span>
											<Trend value={provider.rejectionTrendPct} />
										</span>
									),
								},
							]}
						/>
						<DataTableShell>
							<Table className="w-full table-fixed">
								<TableHeader>
									<TableRow className="hover:bg-transparent border-0">
										<DetailTableHead>Month</DetailTableHead>
										<DetailTableHead className="text-right">
											Claims
										</DetailTableHead>
										<DetailTableHead className="text-right">
											Enc.
										</DetailTableHead>
										<DetailTableHead className="text-right">
											Rej %
										</DetailTableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{provider.monthlyVolume.slice(-4).map((m) => (
										<TableRow key={m.month} className={DETAIL_ROW}>
											<TableCell className={cn(DETAIL_TD, "font-medium")}>
												{m.month}
											</TableCell>
											<TableCell
												className={cn(DETAIL_TD, "text-right tabular-nums")}
											>
												{m.claims}
											</TableCell>
											<TableCell
												className={cn(DETAIL_TD, "text-right tabular-nums")}
											>
												{m.encounters}
											</TableCell>
											<TableCell
												className={cn(DETAIL_TD, "text-right tabular-nums")}
											>
												{m.rejectionRate}%
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</DataTableShell>
					</div>
				</Panel>
			</div>

			<Panel
				dense
				icon={Stethoscope}
				title="Recent activity"
				action={
					<div className="flex items-center gap-0.5 rounded-sm bg-muted/40 p-0.5">
						{(
							[
								{
									id: "claims" as const,
									label: `Claims (${provider.recentClaims.length})`,
								},
								{
									id: "encounters" as const,
									label: `Encounters (${provider.recentEncounters.length})`,
								},
							] as const
						).map((p) => (
							<button
								key={p.id}
								type="button"
								onClick={() => setPane(p.id)}
								className={cn(
									"rounded-sm px-2.5 py-1 text-xs font-medium transition-all",
									pane === p.id
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-background/80 hover:text-foreground"
								)}
							>
								{p.label}
							</button>
						))}
					</div>
				}
			>
				<DataTableShell>
					<Table className="w-full table-fixed">
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<DetailTableHead>DOS</DetailTableHead>
								<DetailTableHead>Claim #</DetailTableHead>
								<DetailTableHead>Member</DetailTableHead>
								<DetailTableHead>Type</DetailTableHead>
								<DetailTableHead>Code</DetailTableHead>
								<DetailTableHead>Vendor</DetailTableHead>
								<DetailTableHead className="text-right">Billed</DetailTableHead>
								<DetailTableHead className="text-right">Paid</DetailTableHead>
								<DetailTableHead>Status</DetailTableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((r) => (
								<TableRow key={r.id} className={DETAIL_ROW}>
									<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
										{formatDate(r.dos)}
									</TableCell>
									<TableCell className={cn(DETAIL_TD, "font-mono text-xs")}>
										{r.claimNumber}
									</TableCell>
									<TableCell
										className={DETAIL_TD_WRAP}
										title={`${r.memberName} (${r.memberId})`}
									>
										<p className="truncate font-medium">{r.memberName}</p>
										<p className="truncate font-mono text-[11px] text-muted-foreground">
											{r.memberId}
										</p>
									</TableCell>
									<TableCell className={DETAIL_TD}>{r.type}</TableCell>
									<TableCell className={cn(DETAIL_TD, "font-mono text-xs")}>
										{r.procedureCode}
									</TableCell>
									<TableCell className={DETAIL_TD} title={r.vendor}>
										{r.vendor}
									</TableCell>
									<TableCell
										className={cn(DETAIL_TD, "text-right tabular-nums")}
									>
										{formatCurrency(r.billed)}
									</TableCell>
									<TableCell
										className={cn(DETAIL_TD, "text-right tabular-nums")}
									>
										{formatCurrency(r.paid)}
									</TableCell>
									<TableCell className={DETAIL_TD}>
										<ClaimStatusPill status={r.status} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</DataTableShell>
				<p className="mt-3 text-[11px] text-muted-foreground">
					Showing recent {pane} for this provider · Data as of{" "}
					{provider.dataAsOf}
				</p>
			</Panel>
		</div>
	);
}

function CredStatusPill({ status }: { status: CredentialStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-sm border px-1.5 py-px text-[10px] font-semibold capitalize",
				status === "complete" && "border-chart-2/20 bg-chart-2/10 text-chart-2",
				status === "expiring" && "border-chart-3/20 bg-chart-3/10 text-chart-3",
				status === "expired" &&
					"border-destructive/20 bg-destructive/10 text-destructive",
				status === "pending" &&
					"border-border/60 bg-muted text-muted-foreground"
			)}
		>
			{status}
		</span>
	);
}

function CredentialingTab({
	provider,
	providerId,
}: {
	provider: NonNullable<ReturnType<typeof getProvider>>;
	providerId: string;
}) {
	const counts = {
		complete: 0,
		expiring: 0,
		expired: 0,
		pending: 0,
	} as Record<CredentialStatus, number>;
	for (const c of provider.credentialing) counts[c.status] += 1;
	const total =
		counts.complete + counts.expiring + counts.expired + counts.pending;
	const completePct = total ? Math.round((counts.complete / total) * 100) : 0;
	const openExceptions = provider.exceptions.filter(
		(e) => e.status === "open" || e.status === "in_progress"
	).length;
	const actionNeeded = provider.credentialing.filter(
		(c) =>
			c.status === "expiring" ||
			c.status === "expired" ||
			c.status === "pending"
	);

	return (
		<div className="space-y-5">
			<Panel dense icon={ClipboardList} title="Credentialing health">
				<AttrTable
					columns={[
						{ key: "complete", label: "Complete" },
						{ key: "expiring", label: "Expiring" },
						{ key: "expired", label: "Expired" },
						{ key: "pending", label: "Pending" },
						{ key: "pct", label: "Completion" },
						{ key: "exceptions", label: "Open exceptions" },
					]}
					rows={[
						{
							complete: (
								<span className="tabular-nums text-chart-2">
									{counts.complete}
								</span>
							),
							expiring: <span className="tabular-nums">{counts.expiring}</span>,
							expired: <span className="tabular-nums">{counts.expired}</span>,
							pending: <span className="tabular-nums">{counts.pending}</span>,
							pct: (
								<span
									className={cn(
										"tabular-nums",
										completePct >= 85 && "text-chart-2"
									)}
								>
									{completePct}%
								</span>
							),
							exceptions: (
								<span className="tabular-nums">{openExceptions}</span>
							),
						},
					]}
				/>
			</Panel>

			<div className="grid gap-3 lg:grid-cols-5">
				<Panel
					dense
					icon={ClipboardList}
					title="Credentialing checklist"
					className="lg:col-span-3"
					action={
						<div className="flex items-center gap-2">
							<span className="text-[11px] text-muted-foreground">
								{total} items tracked
							</span>
							<ProviderCreateCredentialButton providerId={providerId} />
						</div>
					}
				>
					<DataTableShell>
						<Table className="w-full table-fixed">
							<TableHeader>
								<TableRow className="border-b border-border/50 hover:bg-transparent">
									<DetailTableHead>Requirement</DetailTableHead>
									<DetailTableHead>Issuer</DetailTableHead>
									<DetailTableHead>Verified</DetailTableHead>
									<DetailTableHead>Expires</DetailTableHead>
									<DetailTableHead>Status</DetailTableHead>
									<DetailTableHead className="w-36 min-w-36 text-right">
										Actions
									</DetailTableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{provider.credentialing.map((c) => (
									<TableRow key={c.id}>
										<TableCell className={cn(DETAIL_TD, "font-medium")}>
											{c.label}
										</TableCell>
										<TableCell className={DETAIL_TD_MUTED}>
											{c.issuer}
										</TableCell>
										<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
											{formatDate(c.verifiedDate)}
										</TableCell>
										<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
											{formatDate(c.expirationDate)}
										</TableCell>
										<TableCell className={DETAIL_TD}>
											<CredStatusPill status={c.status} />
										</TableCell>
										<TableCell className={DETAIL_TD_ACTIONS}>
											<ProviderCredentialRowActions
												providerId={providerId}
												row={c}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</DataTableShell>
				</Panel>

				<div className="space-y-3 lg:col-span-2">
					<Panel dense icon={ArrowDownRight} title="Action required">
						{actionNeeded.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No expiring, expired, or pending credentials.
							</p>
						) : (
							<DataTableShell>
								<Table className="w-full table-fixed">
									<TableHeader>
										<TableRow className="border-b border-border/50 hover:bg-transparent">
											<DetailTableHead>Credential</DetailTableHead>
											<DetailTableHead>Issuer</DetailTableHead>
											<DetailTableHead>Expires</DetailTableHead>
											<DetailTableHead>Status</DetailTableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{actionNeeded.map((c) => (
											<TableRow key={c.id} className={DETAIL_ROW}>
												<TableCell className={cn(DETAIL_TD, "font-medium")}>
													{c.label}
												</TableCell>
												<TableCell className={DETAIL_TD_MUTED}>
													{c.issuer}
												</TableCell>
												<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
													{c.expirationDate
														? formatDate(c.expirationDate)
														: "—"}
												</TableCell>
												<TableCell className={DETAIL_TD}>
													<CredStatusPill status={c.status} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</DataTableShell>
						)}
					</Panel>

					<Panel dense icon={BadgeCheck} title="Status mix">
						<AttrTable
							columns={[
								{ key: "complete", label: "Complete" },
								{ key: "expiring", label: "Expiring" },
								{ key: "expired", label: "Expired" },
								{ key: "pending", label: "Pending" },
							]}
							rows={[
								{
									complete: (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-chart-2" />
											<span className="tabular-nums">{counts.complete}</span>
										</span>
									),
									expiring: (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-chart-3" />
											<span className="tabular-nums">{counts.expiring}</span>
										</span>
									),
									expired: (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-destructive" />
											<span className="tabular-nums">{counts.expired}</span>
										</span>
									),
									pending: (
										<span className="inline-flex items-center gap-1.5">
											<span className="size-2 rounded-full bg-muted-foreground/50" />
											<span className="tabular-nums">{counts.pending}</span>
										</span>
									),
								},
							]}
						/>
						<div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-chart-2"
								style={{ width: `${completePct}%` }}
							/>
						</div>
						<p className="mt-1.5 text-[11px] text-muted-foreground">
							{completePct}% of requirements complete
						</p>
					</Panel>
				</div>
			</div>

			<Panel
				dense
				icon={ClipboardList}
				title="Credentialing & enrollment exceptions"
				action={
					<div className="flex items-center gap-2">
						<span className="text-[11px] text-muted-foreground">
							{provider.exceptions.length} total
						</span>
						<ProviderCreateExceptionButton providerId={providerId} />
					</div>
				}
			>
				{provider.exceptions.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No exceptions on file.
					</p>
				) : (
					<DataTableShell>
						<Table className="w-full table-fixed">
							<TableHeader>
								<TableRow className="border-b border-border/50 hover:bg-transparent">
									<DetailTableHead>Type</DetailTableHead>
									<DetailTableHead>Description</DetailTableHead>
									<DetailTableHead>Status</DetailTableHead>
									<DetailTableHead>Identified</DetailTableHead>
									<DetailTableHead className="w-36 min-w-36 text-right">
										Actions
									</DetailTableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{provider.exceptions.map((ex) => (
									<TableRow key={ex.id}>
										<TableCell
											className={cn(DETAIL_TD, "font-medium text-chart-3")}
										>
											{ex.exceptionType}
										</TableCell>
										<TableCell
											className={cn(DETAIL_TD_WRAP, "leading-relaxed")}
											title={ex.description}
										>
											{ex.description}
										</TableCell>
										<TableCell className={DETAIL_TD}>
											<ExceptionPill status={ex.status} />
										</TableCell>
										<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
											{formatDate(ex.dateIdentified)}
										</TableCell>
										<TableCell className={DETAIL_TD_ACTIONS}>
											<ProviderExceptionRowActions
												providerId={providerId}
												row={ex}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</DataTableShell>
				)}
				<p className="mt-3 text-[11px] text-muted-foreground">
					Data as of {provider.dataAsOf}
				</p>
			</Panel>
		</div>
	);
}

function TabBody({
	tab,
	provider,
	providerId,
}: {
	tab: TabId;
	provider: NonNullable<ReturnType<typeof getProvider>>;
	providerId: string;
}) {
	if (tab === "Demographics") {
		const age = providerAge(provider.dob);
		const legalName = [
			provider.firstName,
			provider.middleName,
			provider.lastName,
			provider.suffix,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<div className="space-y-5">
				<CollapsiblePanel dense defaultOpen icon={UserRound} title="Snapshot">
					<AttrTable
						columns={[
							{ key: "status", label: "Status" },
							{ key: "type", label: "Type" },
							{ key: "gender", label: "Gender" },
							{ key: "age", label: "Age" },
							{ key: "practice", label: "Practice yrs" },
							{ key: "program", label: "Program" },
							{ key: "patients", label: "Patients" },
						]}
						rows={[
							{
								status: <StatusPill status={provider.status} />,
								type: provider.providerType,
								gender: provider.gender,
								age: age != null ? `${age} yrs` : "—",
								practice: `${provider.yearsInPractice} yrs`,
								program: provider.program,
								patients: (
									<span
										className={cn(
											"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
											provider.acceptingNewPatients
												? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
												: "bg-muted text-muted-foreground"
										)}
									>
										{provider.acceptingNewPatients ? "Accepting" : "Closed"}
									</span>
								),
							},
						]}
					/>
				</CollapsiblePanel>

				<CollapsiblePanel dense icon={BadgeCheck} title="Identifiers">
					<AttrTable
						columns={provider.identifiers.map((id) => ({
							key: id.id,
							label: id.label,
							mono: true,
						}))}
						rows={[
							Object.fromEntries(
								provider.identifiers.map((id) => [id.id, id.value])
							),
						]}
					/>
				</CollapsiblePanel>

				<CollapsiblePanel dense icon={UserRound} title="Personal identity">
					<AttrTable
						columns={[
							{ key: "legal", label: "Legal name" },
							{ key: "display", label: "Display name" },
							{ key: "preferred", label: "Preferred name" },
							{ key: "creds", label: "Credentials" },
							{ key: "dob", label: "Date of birth" },
							{ key: "gender", label: "Gender" },
							{ key: "race", label: "Race" },
							{ key: "ethnicity", label: "Ethnicity" },
							{ key: "language", label: "Language" },
						]}
						rows={[
							{
								legal: legalName,
								display: displayProviderName(provider),
								preferred: provider.preferredName ?? "—",
								creds: provider.credentials,
								dob: (
									<span className="tabular-nums">
										{formatDate(provider.dob)}
										{age != null ? (
											<span className="ml-1 font-normal text-muted-foreground">
												({age})
											</span>
										) : null}
									</span>
								),
								gender: provider.gender,
								race: provider.race,
								ethnicity: provider.ethnicity,
								language: (
									<span className="inline-flex items-center gap-1">
										<Languages className="size-3 text-muted-foreground" />
										{provider.preferredLanguage}
									</span>
								),
							},
						]}
					/>
				</CollapsiblePanel>

				<CollapsiblePanel dense icon={Stethoscope} title="Professional profile">
					<AttrTable
						columns={[
							{ key: "type", label: "Provider type" },
							{ key: "years", label: "Years in practice" },
							{ key: "specialty", label: "Specialty" },
							{ key: "sub", label: "Subspecialty" },
							{ key: "taxonomy", label: "Taxonomy" },
							{ key: "board", label: "Board certification" },
							{ key: "school", label: "Medical school" },
							{ key: "patients", label: "Accepting patients" },
						]}
						rows={[
							{
								type: provider.providerType,
								years: `${provider.yearsInPractice} years`,
								specialty: provider.specialty,
								sub: provider.subspecialty,
								taxonomy: (
									<span>
										<span className="font-mono">{provider.taxonomyCode}</span>
										<span className="ml-1 font-normal text-muted-foreground">
											· {provider.taxonomyDescription}
										</span>
									</span>
								),
								board: provider.boardCertification,
								school: (
									<span>
										{provider.medicalSchool}
										<span className="text-muted-foreground">
											{" "}
											· Class of {provider.graduationYear}
										</span>
									</span>
								),
								patients: (
									<span
										className={cn(
											"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
											provider.acceptingNewPatients
												? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
												: "bg-muted text-muted-foreground"
										)}
									>
										{provider.acceptingNewPatients
											? "Accepting"
											: "Not accepting"}
									</span>
								),
							},
						]}
					/>
				</CollapsiblePanel>

				<CollapsiblePanel dense icon={BadgeCheck} title="Program & status">
					<AttrTable
						columns={[
							{ key: "program", label: "Program" },
							{ key: "status", label: "Provider status" },
							{ key: "enrollment", label: "Enrollment" },
							{ key: "effective", label: "Effective" },
							{ key: "asOf", label: "Data as of" },
						]}
						rows={[
							{
								program: provider.program,
								status: <StatusPill status={provider.status} />,
								enrollment: (
									<span
										className={cn(
											"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
											provider.enrollmentStatus === "enrolled" &&
												"bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
											provider.enrollmentStatus === "pending" &&
												"bg-amber-500/15 text-amber-800 dark:text-amber-300",
											provider.enrollmentStatus === "terminated" &&
												"bg-destructive/15 text-destructive"
										)}
									>
										{provider.enrollmentStatus}
									</span>
								),
								effective: (
									<span className="tabular-nums">
										{formatDate(provider.enrollmentEffective)}
									</span>
								),
								asOf: provider.dataAsOf,
							},
						]}
					/>
				</CollapsiblePanel>

				<CollapsiblePanel
					dense
					icon={Building2}
					title="Primary practice & contact"
				>
					<AttrTable
						columns={[
							{ key: "org", label: "Practice / organization" },
							{ key: "address", label: "Service address" },
							{ key: "mailing", label: "Mailing address" },
							{ key: "phone", label: "Phone" },
							{ key: "fax", label: "Fax" },
							{ key: "email", label: "Email" },
							...(provider.website
								? [{ key: "website", label: "Website" }]
								: []),
						]}
						rows={[
							{
								org: provider.practiceName,
								address: (
									<span>
										{provider.practiceAddress}
										<span className="block font-normal text-muted-foreground">
											{provider.practiceCity}, {provider.practiceState}{" "}
											{provider.practiceZip}
										</span>
									</span>
								),
								mailing: provider.mailingAddress,
								phone: (
									<span className="tabular-nums">{provider.practicePhone}</span>
								),
								fax: <span className="tabular-nums">{provider.fax}</span>,
								email: (
									<span className="truncate" title={provider.email}>
										{provider.email}
									</span>
								),
								...(provider.website
									? {
											website: (
												<a
													href={provider.website}
													target="_blank"
													rel="noreferrer"
													className="text-primary hover:underline"
												>
													{provider.website.replace(/^https?:\/\//, "")}
												</a>
											),
										}
									: {}),
							},
						]}
					/>
				</CollapsiblePanel>
			</div>
		);
	}

	if (tab === "Identifiers") {
		return (
			<Panel
				dense
				icon={BadgeCheck}
				title="Identifier details"
				action={<ProviderCreateIdentifierButton providerId={providerId} />}
			>
				<DataTableShell>
					<Table className="w-full table-fixed">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<DetailTableHead>Label</DetailTableHead>
								<DetailTableHead>Value</DetailTableHead>
								<DetailTableHead className="w-36 min-w-36 text-right">
									Actions
								</DetailTableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{provider.identifiers.map((id) => (
								<TableRow key={id.id} className={DETAIL_ROW}>
									<TableCell
										className={cn(DETAIL_TD, "font-medium")}
										title={id.label}
									>
										{id.label}
										{id.synthetic ? (
											<span className="ml-1 text-[10px] text-muted-foreground">
												(core)
											</span>
										) : null}
									</TableCell>
									<TableCell
										className={cn(DETAIL_TD, "font-mono text-xs")}
										title={id.value}
									>
										{id.value}
									</TableCell>
									<TableCell className={DETAIL_TD_ACTIONS}>
										<ProviderIdentifierRowActions
											providerId={providerId}
											row={id}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</DataTableShell>
			</Panel>
		);
	}

	if (tab === "Enrollment") {
		return (
			<Panel dense icon={BadgeCheck} title="Enrollment">
				<AttrTable
					columns={[
						{ key: "status", label: "Status" },
						{ key: "effective", label: "Effective date" },
						{ key: "program", label: "Program" },
					]}
					rows={[
						{
							status: (
								<span className="capitalize">{provider.enrollmentStatus}</span>
							),
							effective: formatDate(provider.enrollmentEffective),
							program: provider.program,
						},
					]}
				/>
			</Panel>
		);
	}

	if (tab === "Network Participation") {
		return (
			<Panel
				dense
				icon={Network}
				title="Network Participation"
				action={<ProviderCreateNetworkButton providerId={providerId} />}
			>
				<DataTableShell>
					<Table className="w-full table-fixed">
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<DetailTableHead>Network / Plan</DetailTableHead>
								<DetailTableHead>Payer</DetailTableHead>
								<DetailTableHead>Status</DetailTableHead>
								<DetailTableHead>Effective</DetailTableHead>
								<DetailTableHead>End</DetailTableHead>
								<DetailTableHead className="w-36 min-w-36 text-right">
									Actions
								</DetailTableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{provider.networks.map((n) => (
								<TableRow key={n.id} className={DETAIL_ROW}>
									<TableCell
										className={cn(DETAIL_TD, "font-medium")}
										title={n.networkPlan}
									>
										{n.networkPlan}
									</TableCell>
									<TableCell className={DETAIL_TD} title={n.payer}>
										{n.payer}
									</TableCell>
									<TableCell className={DETAIL_TD}>
										<NetworkPill status={n.status} />
									</TableCell>
									<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
										{formatDate(n.effectiveDate)}
									</TableCell>
									<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
										{formatDate(n.endDate)}
									</TableCell>
									<TableCell className={DETAIL_TD_ACTIONS}>
										<ProviderNetworkRowActions
											providerId={providerId}
											row={n}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</DataTableShell>
			</Panel>
		);
	}

	if (tab === "Locations") {
		return (
			<Panel
				dense
				icon={MapPin}
				title="Locations"
				action={<ProviderCreateLocationButton providerId={providerId} />}
			>
				<DataTableShell>
					<Table className="w-full table-fixed">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<DetailTableHead className="w-[18%]">Location</DetailTableHead>
								<DetailTableHead className="w-[34%]">Address</DetailTableHead>
								<DetailTableHead className="w-[16%]">Phone</DetailTableHead>
								<DetailTableHead className="w-[12%]">Status</DetailTableHead>
								<DetailTableHead className="w-[8%]">Primary</DetailTableHead>
								<DetailTableHead className="w-36 min-w-36 text-right">
									Actions
								</DetailTableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{provider.locations.map((loc) => (
								<TableRow key={loc.id} className={DETAIL_ROW}>
									<TableCell
										className={cn(DETAIL_TD, "font-medium")}
										title={loc.name}
									>
										{loc.name}
									</TableCell>
									<TableCell className={DETAIL_TD} title={loc.address}>
										{loc.address}
									</TableCell>
									<TableCell className={DETAIL_TD} title={loc.phone}>
										{loc.phone}
									</TableCell>
									<TableCell className={DETAIL_TD}>
										<StatusPill status={loc.status} />
									</TableCell>
									<TableCell className={DETAIL_TD}>
										{loc.isPrimary ? "Yes" : "No"}
									</TableCell>
									<TableCell className={DETAIL_TD_ACTIONS}>
										<ProviderLocationRowActions
											providerId={providerId}
											row={loc}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</DataTableShell>
			</Panel>
		);
	}

	if (tab === "Claims & Encounters") {
		return <ClaimsEncountersTab provider={provider} />;
	}

	if (tab === "Rejection Trends") {
		return (
			<div className="grid gap-5 lg:grid-cols-2">
				<Panel dense icon={ArrowDownRight} title="Rejection Trends">
					<div className="h-[280px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={provider.monthlyVolume}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="month" tick={{ fontSize: 11 }} />
								<YAxis tick={{ fontSize: 11 }} width={36} />
								<Tooltip />
								<Bar
									dataKey="rejectionCount"
									name="Rejections"
									fill="#ef4444"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Panel>
				<Panel dense icon={ClipboardList} title="Rejection Reasons">
					<DataTableShell>
						<Table className="w-full table-fixed">
							<TableHeader>
								<TableRow className="border-b border-border/50 hover:bg-transparent">
									<DetailTableHead>Reason</DetailTableHead>
									<DetailTableHead className="text-right">
										Count
									</DetailTableHead>
									<DetailTableHead className="text-right">
										% of total
									</DetailTableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{provider.rejectionReasons.map((r) => (
									<TableRow key={r.id} className={DETAIL_ROW}>
										<TableCell className={DETAIL_TD}>{r.reason}</TableCell>
										<TableCell
											className={cn(DETAIL_TD, "text-right tabular-nums")}
										>
											{r.count}
										</TableCell>
										<TableCell
											className={cn(DETAIL_TD, "text-right tabular-nums")}
										>
											{r.pct}%
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</DataTableShell>
				</Panel>
			</div>
		);
	}

	if (tab === "Vendors / Sources") {
		return (
			<Panel dense icon={Building2} title="Vendors / Source Associations">
				<DataTableShell>
					<Table className="w-full table-fixed">
						<TableHeader>
							<TableRow className="border-b border-border/50 hover:bg-transparent">
								<DetailTableHead>Vendor / Source</DetailTableHead>
								<DetailTableHead>File type</DetailTableHead>
								<DetailTableHead>Data sent</DetailTableHead>
								<DetailTableHead>Frequency</DetailTableHead>
								<DetailTableHead>Last received</DetailTableHead>
								<DetailTableHead>Status</DetailTableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{provider.vendors.map((v) => (
								<TableRow key={v.id} className={DETAIL_ROW}>
									<TableCell className={cn(DETAIL_TD, "font-medium")}>
										{v.vendor}
									</TableCell>
									<TableCell className={DETAIL_TD}>{v.fileType}</TableCell>
									<TableCell className={DETAIL_TD}>{v.dataSent}</TableCell>
									<TableCell className={DETAIL_TD}>{v.frequency}</TableCell>
									<TableCell className={cn(DETAIL_TD, "tabular-nums")}>
										{v.lastReceived}
									</TableCell>
									<TableCell className={DETAIL_TD}>
										<FeedPill status={v.status} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</DataTableShell>
			</Panel>
		);
	}

	return <CredentialingTab provider={provider} providerId={providerId} />;
}

"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";

import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	BadgeCheck,
	Building2,
	CheckCircle2,
	ChevronDown,
	ClipboardList,
	Download,
	FileWarning,
	Globe,
	GraduationCap,
	IdCard,
	Languages,
	Mail,
	MapPin,
	Network,
	Phone,
	Printer,
	Receipt,
	Stethoscope,
	TrendingDown,
	UserRound,
	Users,
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
import {
	type ClaimActivityStatus,
	type CredentialStatus,
	type ExceptionStatus,
	type FeedStatus,
	type NetworkStatus,
	type ProviderStatus,
	displayProviderName,
	formatCompact,
	formatCurrency,
	formatDate,
	getProvider,
	initials,
	providerAge,
} from "@/features/admin/features/providers/mock-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
	{ id: "Overview", icon: Activity },
	{ id: "Demographics", icon: Users },
	{ id: "Identifiers", icon: IdCard },
	{ id: "Enrollment", icon: BadgeCheck },
	{ id: "Network Participation", icon: Network },
	{ id: "Locations", icon: MapPin },
	{ id: "Claims & Encounters", icon: Receipt },
	{ id: "Rejection Trends", icon: TrendingDown },
	{ id: "Vendors / Sources", icon: Building2 },
	{ id: "Credentialing & Exceptions", icon: ClipboardList },
] as const;

type TabId = (typeof TABS)[number]["id"];

function StatusPill({ status }: { status: ProviderStatus }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "active" && "bg-emerald-100 text-emerald-800",
				status === "pending" && "bg-amber-100 text-amber-900",
				status === "inactive" && "bg-slate-100 text-slate-700",
				status === "termed" && "bg-red-100 text-red-800"
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
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
				status === "in_network" && "bg-emerald-100 text-emerald-800",
				status === "out_of_network" && "bg-red-100 text-red-800",
				status === "pending" && "bg-amber-100 text-amber-900"
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
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "active" && "bg-emerald-100 text-emerald-800",
				status === "warning" && "bg-amber-100 text-amber-900",
				status === "inactive" && "bg-slate-100 text-slate-700"
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
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "open" && "bg-amber-100 text-amber-900",
				status === "in_progress" && "bg-sky-100 text-sky-900",
				status === "resolved" && "bg-emerald-100 text-emerald-800"
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
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "paid" && "bg-emerald-100 text-emerald-800",
				status === "accepted" && "bg-emerald-100 text-emerald-800",
				status === "denied" && "bg-red-100 text-red-800",
				status === "rejected" && "bg-red-100 text-red-800",
				status === "pending" && "bg-amber-100 text-amber-900"
			)}
		>
			{status}
		</span>
	);
}

function Panel({
	title,
	action,
	children,
	className,
	dense,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	dense?: boolean;
}) {
	return (
		<section
			className={cn(
				"flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			<div
				className={cn(
					"flex items-center justify-between gap-3 border-b border-border/30",
					dense ? "px-4 py-2.5" : "px-5 py-3.5"
				)}
			>
				<h3 className="text-sm font-semibold tracking-tight">{title}</h3>
				{action}
			</div>
			<div className={cn("min-h-0 flex-1", dense ? "p-4" : "p-5")}>
				{children}
			</div>
		</section>
	);
}

function ViewLink({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="mt-3 text-sm font-medium text-primary hover:underline"
		>
			{label} →
		</button>
	);
}

function MetaField({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<div className="text-sm font-medium text-foreground break-words">
				{value ?? "—"}
			</div>
		</div>
	);
}

function MetricStrip({
	title,
	items,
	compact,
	className,
}: {
	title?: string;
	items: Array<{
		label: string;
		value: ReactNode;
		accent?: boolean;
		mono?: boolean;
	}>;
	compact?: boolean;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card shadow-sm",
				className
			)}
		>
			{title ? (
				<div className="border-b border-border/30 px-3 py-1.5 sm:px-4">
					<p className="text-[11px] font-semibold tracking-tight text-muted-foreground uppercase">
						{title}
					</p>
				</div>
			) : null}
			<div className="flex w-full flex-wrap lg:flex-nowrap">
				{items.map((item, index) => (
					<div
						key={item.label}
						className={cn(
							"min-w-0 flex-1",
							compact
								? "min-w-[5.5rem] basis-[5.5rem] px-2.5 py-2.5 sm:px-3"
								: "min-w-[8.5rem] basis-[8.5rem] px-3 py-3 sm:px-4",
							index > 0 && "border-l border-border/30"
						)}
					>
						<p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
							{item.label}
						</p>
						<div
							className={cn(
								"mt-1 truncate text-sm font-semibold",
								item.mono &&
									"font-mono text-[13px] tabular-nums tracking-tight",
								item.accent ? "text-emerald-700" : "text-foreground"
							)}
						>
							{item.value ?? "—"}
						</div>
					</div>
				))}
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
				"inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
				up ? "text-emerald-700" : "text-red-700"
			)}
		>
			<Icon className="size-3.5" />
			{up ? "+" : ""}
			{value}%
		</span>
	);
}

export function ProviderDetailPage({
	providerId: providerIdProp,
}: {
	providerId?: string;
}) {
	const params = useParams<{ providerId?: string | string[] }>();
	const raw = providerIdProp ?? params.providerId;
	const providerId = decodeURIComponent(
		Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "")
	);
	const provider = useMemo(
		() => (providerId ? getProvider(providerId) : undefined),
		[providerId]
	);
	const [tab, setTab] = useState<TabId>("Overview");

	const credCounts = useMemo(() => {
		const counts: Record<CredentialStatus, number> = {
			complete: 0,
			expiring: 0,
			expired: 0,
			pending: 0,
		};
		if (!provider) return counts;
		for (const c of provider.credentialing) counts[c.status] += 1;
		return counts;
	}, [provider]);

	if (!provider) {
		return (
			<div className="space-y-5">
				<p className="text-sm text-destructive">Provider not found.</p>
				<Button asChild variant="outline" size="sm">
					<Link href="/admin/providers">Back to providers</Link>
				</Button>
			</div>
		);
	}

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

	const kpis = [
		{
			label: "Claims",
			value: formatCompact(provider.claims12m),
			trend: provider.claimsTrendPct,
			icon: Receipt,
		},
		{
			label: "Encounters",
			value: formatCompact(provider.encounters12m),
			trend: provider.encountersTrendPct,
			icon: Activity,
		},
		{
			label: "Total Billed",
			value: formatCurrency(provider.billed12m),
			trend: provider.billedTrendPct,
			icon: Receipt,
		},
		{
			label: "Total Paid",
			value: formatCurrency(provider.paid12m),
			trend: provider.paidTrendPct,
			icon: CheckCircle2,
		},
		{
			label: "Rejection Rate",
			value: `${provider.rejectionRate}%`,
			trend: provider.rejectionTrendPct,
			icon: FileWarning,
		},
		{
			label: "Net Payment",
			value: formatCurrency(provider.netPayment12m),
			trend: provider.netPaymentTrendPct,
			icon: TrendingDown,
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-sm text-muted-foreground">
					<span className="text-foreground/80">Providers</span>
					<span className="mx-1.5 text-border">/</span>
					Provider Profile
				</p>
				<div className="flex flex-wrap gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-9">
								Provider Summary
								<ChevronDown className="ml-1 size-3.5" />
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
							<Button variant="outline" size="sm" className="h-9">
								<Printer className="mr-1.5 size-3.5" />
								Print
								<ChevronDown className="ml-1 size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => toast.success("Print profile")}>
								Print profile
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => toast.success("Print credentialing")}
							>
								Print credentialing
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm" className="h-9">
								<Download className="mr-1.5 size-3.5" />
								Export
								<ChevronDown className="ml-1 size-3.5" />
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
				</div>
			</div>

			{/* Identity header */}
			<section className="rounded-xl border border-border/40 bg-card p-5 shadow-sm">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex min-w-0 gap-4">
						<div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
							{initials(provider.name)}
						</div>
						<div className="min-w-0 space-y-2">
							<div className="flex flex-wrap items-center gap-2.5">
								<h1 className="text-2xl font-semibold tracking-tight">
									{name}
								</h1>
								<StatusPill status={provider.status} />
							</div>
							<p className="text-sm text-muted-foreground">
								<span className="font-medium text-foreground">
									{provider.specialty}
								</span>
								<span className="mx-1.5 text-border">·</span>
								{provider.subspecialty}
							</p>
							<div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
								<span>
									NPI{" "}
									<span className="font-mono font-medium text-foreground">
										{provider.npi}
									</span>
								</span>
								<span>
									Tax ID{" "}
									<span className="font-mono font-medium text-foreground">
										{provider.taxId}
									</span>
								</span>
								<span>
									UPIN{" "}
									<span className="font-mono font-medium text-foreground">
										{provider.upin}
									</span>
								</span>
								<span>
									Medicaid{" "}
									<span className="font-mono font-medium text-foreground">
										{provider.medicaidId}
									</span>
								</span>
							</div>
							<div className="flex flex-col gap-1.5 pt-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
								<span className="inline-flex items-start gap-2">
									<Building2 className="mt-0.5 size-3.5 shrink-0" />
									<span>
										<span className="font-medium text-foreground">
											{provider.practiceName}
										</span>
										<span className="mx-1.5">·</span>
										{provider.practiceAddress}
									</span>
								</span>
								<span className="inline-flex items-center gap-2">
									<MapPin className="size-3.5 shrink-0" />
									{provider.practicePhone}
								</span>
							</div>
						</div>
					</div>

					<div className="grid shrink-0 gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:w-[380px]">
						<MetaField label="Provider type" value={provider.providerType} />
						<MetaField label="Gender" value={provider.gender} />
						<MetaField label="Date of birth" value={formatDate(provider.dob)} />
						<MetaField
							label="Years in practice"
							value={`${provider.yearsInPractice} years`}
						/>
						<div className="col-span-full flex items-center gap-3 border-t border-border/40 pt-4">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
								<CheckCircle2 className="size-5" />
							</span>
							<div className="min-w-0">
								<p className="text-xs font-medium text-muted-foreground">
									Enrollment
								</p>
								<p className="text-sm font-semibold capitalize text-emerald-800">
									{provider.enrollmentStatus === "enrolled"
										? "Enrolled"
										: provider.enrollmentStatus}
									<span className="ml-2 font-normal text-muted-foreground">
										· Effective {formatDate(provider.enrollmentEffective)}
									</span>
								</p>
								<button
									type="button"
									className="mt-0.5 text-xs font-medium text-primary hover:underline"
									onClick={() => setTab("Enrollment")}
								>
									View enrollment details →
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Tabs */}
			<nav className="overflow-x-auto border-b border-border/40">
				<div className="flex min-w-max gap-1">
					{TABS.map((item) => {
						const Icon = item.icon;
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => setTab(item.id)}
								className={cn(
									"inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
									tab === item.id
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground"
								)}
							>
								<Icon className="size-3.5" />
								{item.id}
							</button>
						);
					})}
				</div>
			</nav>

			{tab === "Overview" ? (
				<div className="space-y-5">
					{/* KPIs */}
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
						{kpis.map((k) => {
							const Icon = k.icon;
							return (
								<div
									key={k.label}
									className="rounded-xl border border-border/40 bg-card p-4 shadow-sm"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<p className="text-xs font-medium text-muted-foreground">
												{k.label}
											</p>
											<p className="mt-1.5 truncate text-lg font-semibold tabular-nums tracking-tight">
												{k.value}
											</p>
											<div className="mt-1.5">
												<Trend value={k.trend} />
											</div>
										</div>
										<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<Icon className="size-4" />
										</span>
									</div>
								</div>
							);
						})}
					</div>

					{/* Row 1 */}
					<div className="grid gap-4 lg:grid-cols-2">
						<Panel title="Provider Locations">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-9 text-xs">Location</TableHead>
											<TableHead className="h-9 text-xs">Status</TableHead>
											<TableHead className="h-9 text-xs">Primary</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{provider.locations.map((loc) => (
											<TableRow key={loc.id}>
												<TableCell className="py-2.5">
													<p className="text-sm font-medium">{loc.name}</p>
													<p className="text-sm leading-relaxed text-muted-foreground">
														{loc.address}
													</p>
													<p className="text-sm leading-relaxed text-muted-foreground">
														{loc.phone}
													</p>
												</TableCell>
												<TableCell className="py-2.5">
													<StatusPill status={loc.status} />
												</TableCell>
												<TableCell className="py-2.5 text-sm">
													{loc.isPrimary ? "Yes" : "No"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<ViewLink
								label={`View all locations (${provider.locations.length})`}
								onClick={() => setTab("Locations")}
							/>
						</Panel>

						<Panel title="Network Participation">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-9 text-xs">Network</TableHead>
											<TableHead className="h-9 text-xs">Status</TableHead>
											<TableHead className="h-9 text-xs">Effective</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{provider.networks.slice(0, 5).map((n) => (
											<TableRow key={n.id}>
												<TableCell className="py-2.5">
													<p className="text-sm font-medium">{n.networkPlan}</p>
													<p className="text-sm leading-relaxed text-muted-foreground">
														{n.payer}
													</p>
												</TableCell>
												<TableCell className="py-2.5">
													<NetworkPill status={n.status} />
												</TableCell>
												<TableCell className="py-2.5 text-sm tabular-nums">
													{formatDate(n.effectiveDate)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<ViewLink
								label={`View all networks (${provider.networks.length})`}
								onClick={() => setTab("Network Participation")}
							/>
						</Panel>
					</div>

					<Panel title="Identifiers">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{provider.identifiers.map((id) => (
								<MetaField
									key={id.id}
									label={id.label}
									value={<span className="font-mono text-sm">{id.value}</span>}
								/>
							))}
						</div>
						<ViewLink
							label="View all identifiers"
							onClick={() => setTab("Identifiers")}
						/>
					</Panel>

					{/* Row 2 — charts */}
					<div className="grid gap-4 lg:grid-cols-2">
						<Panel title="Claims & Encounters Volume">
							<div className="h-[220px]">
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
							<ViewLink
								label="View claims & encounters"
								onClick={() => setTab("Claims & Encounters")}
							/>
						</Panel>

						<Panel title="Rejection Trends">
							<div className="h-[220px]">
								<ResponsiveContainer width="100%" height="100%">
									<ComposedChart data={provider.monthlyVolume}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis dataKey="month" tick={{ fontSize: 10 }} />
										<YAxis yAxisId="left" tick={{ fontSize: 10 }} width={28} />
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
							<ViewLink
								label="View rejection details"
								onClick={() => setTab("Rejection Trends")}
							/>
						</Panel>
					</div>

					<Panel title="Top Rejection Reasons">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-9 text-xs">Reason</TableHead>
										<TableHead className="h-9 text-right text-xs">
											Count
										</TableHead>
										<TableHead className="h-9 text-right text-xs">%</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{provider.rejectionReasons.map((r) => (
										<TableRow key={r.id}>
											<TableCell className="py-2.5 text-sm">
												{r.reason}
											</TableCell>
											<TableCell className="py-2.5 text-right text-sm tabular-nums">
												{r.count}
											</TableCell>
											<TableCell className="py-2.5 text-right text-sm tabular-nums">
												{r.pct}%
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
						<ViewLink
							label="View all rejection reasons"
							onClick={() => setTab("Rejection Trends")}
						/>
					</Panel>

					{/* Row 3 */}
					<div className="grid gap-4 lg:grid-cols-2">
						<Panel title="Vendors / Source Associations">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-9 text-xs">Vendor</TableHead>
											<TableHead className="h-9 text-xs">Feed</TableHead>
											<TableHead className="h-9 text-xs">Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{provider.vendors.map((v) => (
											<TableRow key={v.id}>
												<TableCell className="py-2.5">
													<p className="text-sm font-medium">{v.vendor}</p>
													<p className="text-sm leading-relaxed text-muted-foreground">
														{v.frequency} · {v.lastReceived}
													</p>
												</TableCell>
												<TableCell className="py-2.5 text-sm">
													{v.fileType}
												</TableCell>
												<TableCell className="py-2.5">
													<FeedPill status={v.status} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<ViewLink
								label="View all vendors / sources"
								onClick={() => setTab("Vendors / Sources")}
							/>
						</Panel>

						<Panel title="Credentialing Summary">
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
											color: "bg-emerald-500",
										},
										{
											label: "Expiring",
											value: credCounts.expiring,
											color: "bg-amber-500",
										},
										{
											label: "Expired",
											value: credCounts.expired,
											color: "bg-red-500",
										},
										{
											label: "Pending",
											value: credCounts.pending,
											color: "bg-slate-400",
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
							<ViewLink
								label="View credentialing details"
								onClick={() => setTab("Credentialing & Exceptions")}
							/>
						</Panel>
					</div>

					<Panel title="Credentialing & Enrollment Exceptions">
						{provider.exceptions.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No open exceptions.
							</p>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="h-9 text-xs">Type</TableHead>
											<TableHead className="h-9 text-xs">Status</TableHead>
											<TableHead className="h-9 text-xs">Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{provider.exceptions.map((ex) => (
											<TableRow key={ex.id}>
												<TableCell className="py-2.5">
													<p className="text-sm font-medium text-amber-800">
														{ex.exceptionType}
													</p>
													<p className="text-sm leading-relaxed text-muted-foreground">
														{ex.description}
													</p>
												</TableCell>
												<TableCell className="py-2.5">
													<ExceptionPill status={ex.status} />
												</TableCell>
												<TableCell className="py-2.5 text-sm tabular-nums">
													{formatDate(ex.dateIdentified)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
						<ViewLink
							label="View all exceptions"
							onClick={() => setTab("Credentialing & Exceptions")}
						/>
					</Panel>

					<footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
						<p>All dates and times are displayed in Eastern Time (ET).</p>
						<p>Data as of {provider.dataAsOf}</p>
					</footer>
				</div>
			) : (
				<TabBody tab={tab} provider={provider} />
			)}
		</div>
	);
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
		<div className="space-y-4">
			<MetricStrip
				title="12-month performance"
				items={[
					{
						label: "Claims",
						value: formatCompact(provider.claims12m),
					},
					{
						label: "Encounters",
						value: formatCompact(provider.encounters12m),
					},
					{
						label: "Billed",
						value: formatCurrency(provider.billed12m),
					},
					{
						label: "Paid",
						value: formatCurrency(provider.paid12m),
					},
					{
						label: "Net payment",
						value: formatCurrency(provider.netPayment12m),
					},
					{
						label: "Rejection rate",
						value: `${provider.rejectionRate}%`,
						accent: provider.rejectionRate < 7,
					},
				]}
			/>

			<div className="grid gap-3 lg:grid-cols-5">
				<Panel
					dense
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
					title="Period summary"
					className="lg:col-span-2"
					action={
						<span className="text-[11px] text-muted-foreground">
							Trailing 12 months
						</span>
					}
				>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-2.5">
							{[
								{
									label: "Total claims",
									value: formatCompact(totals.claims),
									trend: provider.claimsTrendPct,
								},
								{
									label: "Total encounters",
									value: formatCompact(totals.encounters),
									trend: provider.encountersTrendPct,
								},
								{
									label: "Rejections",
									value: formatCompact(totals.rejections),
									trend: provider.rejectionTrendPct,
								},
								{
									label: "Avg rejection",
									value: `${avgRejection}%`,
									trend: provider.rejectionTrendPct,
								},
							].map((item) => (
								<div
									key={item.label}
									className="rounded-lg border border-border/30 bg-muted/15 px-3 py-2.5"
								>
									<p className="text-[11px] text-muted-foreground">
										{item.label}
									</p>
									<p className="mt-1 text-sm font-semibold tabular-nums">
										{item.value}
									</p>
									<div className="mt-1">
										<Trend value={item.trend} />
									</div>
								</div>
							))}
						</div>
						<div className="overflow-x-auto rounded-lg border border-border/30">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="h-8 text-[11px]">Month</TableHead>
										<TableHead className="h-8 text-right text-[11px]">
											Claims
										</TableHead>
										<TableHead className="h-8 text-right text-[11px]">
											Enc.
										</TableHead>
										<TableHead className="h-8 text-right text-[11px]">
											Rej %
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{provider.monthlyVolume.slice(-4).map((m) => (
										<TableRow key={m.month}>
											<TableCell className="py-1.5 text-xs font-medium">
												{m.month}
											</TableCell>
											<TableCell className="py-1.5 text-right text-xs tabular-nums">
												{m.claims}
											</TableCell>
											<TableCell className="py-1.5 text-right text-xs tabular-nums">
												{m.encounters}
											</TableCell>
											<TableCell className="py-1.5 text-right text-xs tabular-nums">
												{m.rejectionRate}%
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				</Panel>
			</div>

			<Panel
				dense
				title="Recent activity"
				action={
					<div className="flex items-center gap-1 rounded-lg bg-muted/40 p-0.5">
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
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									pane === p.id
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
								)}
							>
								{p.label}
							</button>
						))}
					</div>
				}
			>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="h-9 text-xs">DOS</TableHead>
								<TableHead className="h-9 text-xs">Claim #</TableHead>
								<TableHead className="h-9 text-xs">Member</TableHead>
								<TableHead className="h-9 text-xs">Type</TableHead>
								<TableHead className="h-9 text-xs">Code</TableHead>
								<TableHead className="h-9 text-xs">Vendor</TableHead>
								<TableHead className="h-9 text-right text-xs">Billed</TableHead>
								<TableHead className="h-9 text-right text-xs">Paid</TableHead>
								<TableHead className="h-9 text-xs">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((r) => (
								<TableRow key={r.id}>
									<TableCell className="py-2.5 text-sm tabular-nums">
										{formatDate(r.dos)}
									</TableCell>
									<TableCell className="py-2.5 font-mono text-xs">
										{r.claimNumber}
									</TableCell>
									<TableCell className="py-2.5">
										<p className="text-sm font-medium">{r.memberName}</p>
										<p className="font-mono text-[11px] text-muted-foreground">
											{r.memberId}
										</p>
									</TableCell>
									<TableCell className="py-2.5 text-sm">{r.type}</TableCell>
									<TableCell className="py-2.5 font-mono text-xs">
										{r.procedureCode}
									</TableCell>
									<TableCell className="py-2.5 text-sm">{r.vendor}</TableCell>
									<TableCell className="py-2.5 text-right text-sm tabular-nums">
										{formatCurrency(r.billed)}
									</TableCell>
									<TableCell className="py-2.5 text-right text-sm tabular-nums">
										{formatCurrency(r.paid)}
									</TableCell>
									<TableCell className="py-2.5">
										<ClaimStatusPill status={r.status} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
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
				"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
				status === "complete" && "bg-emerald-100 text-emerald-800",
				status === "expiring" && "bg-amber-100 text-amber-900",
				status === "expired" && "bg-red-100 text-red-800",
				status === "pending" && "bg-slate-100 text-slate-700"
			)}
		>
			{status}
		</span>
	);
}

function CredentialingTab({
	provider,
}: {
	provider: NonNullable<ReturnType<typeof getProvider>>;
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
		<div className="space-y-4">
			<MetricStrip
				title="Credentialing health"
				items={[
					{
						label: "Complete",
						value: `${counts.complete}`,
						accent: true,
					},
					{ label: "Expiring", value: `${counts.expiring}` },
					{ label: "Expired", value: `${counts.expired}` },
					{ label: "Pending", value: `${counts.pending}` },
					{
						label: "Completion",
						value: `${completePct}%`,
						accent: completePct >= 85,
					},
					{
						label: "Open exceptions",
						value: `${openExceptions}`,
					},
				]}
			/>

			<div className="grid gap-3 lg:grid-cols-5">
				<Panel
					dense
					title="Credentialing checklist"
					className="lg:col-span-3"
					action={
						<span className="text-[11px] text-muted-foreground">
							{total} items tracked
						</span>
					}
				>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-9 text-xs">Requirement</TableHead>
									<TableHead className="h-9 text-xs">Issuer</TableHead>
									<TableHead className="h-9 text-xs">Verified</TableHead>
									<TableHead className="h-9 text-xs">Expires</TableHead>
									<TableHead className="h-9 text-xs">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{provider.credentialing.map((c) => (
									<TableRow key={c.id}>
										<TableCell className="py-2.5 text-sm font-medium">
											{c.label}
										</TableCell>
										<TableCell className="py-2.5 text-sm text-muted-foreground">
											{c.issuer}
										</TableCell>
										<TableCell className="py-2.5 text-sm tabular-nums">
											{formatDate(c.verifiedDate)}
										</TableCell>
										<TableCell className="py-2.5 text-sm tabular-nums">
											{formatDate(c.expirationDate)}
										</TableCell>
										<TableCell className="py-2.5">
											<CredStatusPill status={c.status} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</Panel>

				<div className="space-y-3 lg:col-span-2">
					<Panel dense title="Action required">
						{actionNeeded.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No expiring, expired, or pending credentials.
							</p>
						) : (
							<ul className="space-y-2.5">
								{actionNeeded.map((c) => (
									<li
										key={c.id}
										className="flex items-start justify-between gap-3 rounded-lg border border-border/30 bg-muted/15 px-3 py-2.5"
									>
										<div className="min-w-0">
											<p className="text-sm font-medium">{c.label}</p>
											<p className="text-sm leading-relaxed text-muted-foreground">
												{c.issuer}
												{c.expirationDate
													? ` · Exp ${formatDate(c.expirationDate)}`
													: ""}
											</p>
										</div>
										<CredStatusPill status={c.status} />
									</li>
								))}
							</ul>
						)}
					</Panel>

					<Panel dense title="Status mix">
						<ul className="space-y-2.5 text-sm">
							{(
								[
									{
										label: "Complete",
										value: counts.complete,
										color: "bg-emerald-500",
									},
									{
										label: "Expiring",
										value: counts.expiring,
										color: "bg-amber-500",
									},
									{
										label: "Expired",
										value: counts.expired,
										color: "bg-red-500",
									},
									{
										label: "Pending",
										value: counts.pending,
										color: "bg-slate-400",
									},
								] as const
							).map((row) => (
								<li
									key={row.label}
									className="flex items-center justify-between gap-2"
								>
									<span className="flex items-center gap-2">
										<span className={cn("size-2.5 rounded-full", row.color)} />
										{row.label}
									</span>
									<span className="font-medium tabular-nums">{row.value}</span>
								</li>
							))}
						</ul>
						<div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-emerald-500"
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
				title="Credentialing & enrollment exceptions"
				action={
					<span className="text-[11px] text-muted-foreground">
						{provider.exceptions.length} total
					</span>
				}
			>
				{provider.exceptions.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No exceptions on file.
					</p>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-9 text-xs">Type</TableHead>
									<TableHead className="h-9 text-xs">Description</TableHead>
									<TableHead className="h-9 text-xs">Status</TableHead>
									<TableHead className="h-9 text-xs">Identified</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{provider.exceptions.map((ex) => (
									<TableRow key={ex.id}>
										<TableCell className="py-2.5 text-sm font-medium text-amber-800">
											{ex.exceptionType}
										</TableCell>
										<TableCell className="py-2.5 text-sm leading-relaxed">
											{ex.description}
										</TableCell>
										<TableCell className="py-2.5">
											<ExceptionPill status={ex.status} />
										</TableCell>
										<TableCell className="py-2.5 text-sm tabular-nums">
											{formatDate(ex.dateIdentified)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
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
}: {
	tab: TabId;
	provider: NonNullable<ReturnType<typeof getProvider>>;
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
			<div className="space-y-4">
				<div className="grid gap-3 xl:grid-cols-2">
					<MetricStrip
						compact
						title="Snapshot"
						items={[
							{
								label: "Status",
								value: <StatusPill status={provider.status} />,
							},
							{ label: "Type", value: provider.providerType },
							{ label: "Gender", value: provider.gender },
							{
								label: "Age",
								value: age != null ? `${age} yrs` : "—",
							},
							{
								label: "Practice",
								value: `${provider.yearsInPractice} yrs`,
							},
							{ label: "Program", value: provider.program },
							{
								label: "Patients",
								value: provider.acceptingNewPatients ? "Accepting" : "Closed",
								accent: provider.acceptingNewPatients,
							},
						]}
					/>

					<MetricStrip
						compact
						title="Identifiers"
						items={provider.identifiers.map((id) => ({
							label: id.label,
							value: id.value,
							mono: true,
						}))}
					/>
				</div>

				{/* Three equal columns — fills width, stays short */}
				<div className="grid gap-3 lg:grid-cols-3">
					<Panel
						dense
						title="Personal identity"
						action={<UserRound className="size-3.5 text-muted-foreground" />}
					>
						<div className="grid grid-cols-2 gap-x-4 gap-y-3">
							<MetaField label="Legal name" value={legalName} />
							<MetaField
								label="Display name"
								value={displayProviderName(provider)}
							/>
							<MetaField
								label="Preferred name"
								value={provider.preferredName ?? "—"}
							/>
							<MetaField label="Credentials" value={provider.credentials} />
							<MetaField
								label="Date of birth"
								value={
									<span className="tabular-nums">
										{formatDate(provider.dob)}
										{age != null ? (
											<span className="ml-1.5 font-normal text-muted-foreground">
												({age})
											</span>
										) : null}
									</span>
								}
							/>
							<MetaField label="Gender" value={provider.gender} />
							<MetaField label="Race" value={provider.race} />
							<MetaField label="Ethnicity" value={provider.ethnicity} />
							<div className="col-span-2">
								<MetaField
									label="Preferred language"
									value={
										<span className="inline-flex items-center gap-1.5">
											<Languages className="size-3.5 text-muted-foreground" />
											{provider.preferredLanguage}
										</span>
									}
								/>
							</div>
						</div>
					</Panel>

					<Panel
						dense
						title="Professional profile"
						action={<Stethoscope className="size-3.5 text-muted-foreground" />}
					>
						<div className="grid grid-cols-2 gap-x-4 gap-y-3">
							<MetaField label="Provider type" value={provider.providerType} />
							<MetaField
								label="Years in practice"
								value={`${provider.yearsInPractice} years`}
							/>
							<MetaField label="Specialty" value={provider.specialty} />
							<MetaField label="Subspecialty" value={provider.subspecialty} />
							<div className="col-span-2">
								<MetaField
									label="Taxonomy"
									value={
										<span>
											<span className="font-mono">{provider.taxonomyCode}</span>
											<span className="ml-1.5 font-normal text-muted-foreground">
												· {provider.taxonomyDescription}
											</span>
										</span>
									}
								/>
							</div>
							<div className="col-span-2">
								<MetaField
									label="Board certification"
									value={provider.boardCertification}
								/>
							</div>
							<div className="col-span-2">
								<MetaField
									label="Medical school"
									value={
										<span className="inline-flex items-start gap-1.5">
											<GraduationCap className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
											<span>
												{provider.medicalSchool}
												<span className="text-muted-foreground">
													{" "}
													· Class of {provider.graduationYear}
												</span>
											</span>
										</span>
									}
								/>
							</div>
							<MetaField
								label="Accepting patients"
								value={
									<span
										className={cn(
											"inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
											provider.acceptingNewPatients
												? "bg-emerald-100 text-emerald-800"
												: "bg-slate-100 text-slate-700"
										)}
									>
										{provider.acceptingNewPatients
											? "Accepting"
											: "Not accepting"}
									</span>
								}
							/>
						</div>
					</Panel>

					<Panel
						dense
						title="Program & status"
						action={<BadgeCheck className="size-3.5 text-muted-foreground" />}
					>
						<div className="grid grid-cols-2 gap-x-4 gap-y-3">
							<MetaField label="Program" value={provider.program} />
							<MetaField
								label="Provider status"
								value={<StatusPill status={provider.status} />}
							/>
							<MetaField
								label="Enrollment"
								value={
									<span
										className={cn(
											"inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
											provider.enrollmentStatus === "enrolled" &&
												"bg-emerald-100 text-emerald-800",
											provider.enrollmentStatus === "pending" &&
												"bg-amber-100 text-amber-900",
											provider.enrollmentStatus === "terminated" &&
												"bg-red-100 text-red-800"
										)}
									>
										{provider.enrollmentStatus}
									</span>
								}
							/>
							<MetaField
								label="Effective"
								value={
									<span className="tabular-nums">
										{formatDate(provider.enrollmentEffective)}
									</span>
								}
							/>
							<div className="col-span-2 border-t border-border/30 pt-3">
								<p className="text-[11px] leading-relaxed text-muted-foreground">
									Locations and networks are maintained on their dedicated tabs.
									<span className="mt-1 block">
										Data as of {provider.dataAsOf}
									</span>
								</p>
							</div>
						</div>
					</Panel>
				</div>

				{/* Practice & contact — one wide, compact row */}
				<Panel
					dense
					title="Primary practice & contact"
					action={<Building2 className="size-3.5 text-muted-foreground" />}
				>
					<div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
						<MetaField
							label="Practice / organization"
							value={provider.practiceName}
						/>
						<MetaField
							label="Service address"
							value={
								<span className="inline-flex items-start gap-1.5">
									<MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
									<span>
										{provider.practiceAddress}
										<span className="block font-normal text-muted-foreground">
											{provider.practiceCity}, {provider.practiceState}{" "}
											{provider.practiceZip}
										</span>
									</span>
								</span>
							}
						/>
						<MetaField
							label="Mailing address"
							value={provider.mailingAddress}
						/>
						<div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:col-span-2 xl:col-span-1 xl:grid-cols-1">
							<MetaField
								label="Phone"
								value={
									<span className="inline-flex items-center gap-1.5 tabular-nums">
										<Phone className="size-3.5 text-muted-foreground" />
										{provider.practicePhone}
									</span>
								}
							/>
							<MetaField
								label="Fax"
								value={<span className="tabular-nums">{provider.fax}</span>}
							/>
							<MetaField
								label="Email"
								value={
									<span className="inline-flex items-center gap-1.5 truncate">
										<Mail className="size-3.5 shrink-0 text-muted-foreground" />
										<span className="truncate">{provider.email}</span>
									</span>
								}
							/>
							{provider.website ? (
								<MetaField
									label="Website"
									value={
										<a
											href={provider.website}
											target="_blank"
											rel="noreferrer"
											className="inline-flex items-center gap-1.5 text-primary hover:underline"
										>
											<Globe className="size-3.5 shrink-0" />
											{provider.website.replace(/^https?:\/\//, "")}
										</a>
									}
								/>
							) : null}
						</div>
					</div>
				</Panel>
			</div>
		);
	}

	if (tab === "Identifiers") {
		return (
			<div className="space-y-4">
				<MetricStrip
					title="Core identifiers"
					items={provider.identifiers.map((id) => ({
						label: id.label,
						value: id.value,
						mono: true,
					}))}
				/>
				<Panel dense title="Identifier details">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{provider.identifiers.map((id) => (
							<MetaField
								key={id.id}
								label={id.label}
								value={
									<span className="font-mono text-sm tabular-nums tracking-tight">
										{id.value}
									</span>
								}
							/>
						))}
					</div>
				</Panel>
			</div>
		);
	}

	if (tab === "Enrollment") {
		return (
			<Panel title="Enrollment">
				<div className="grid gap-5 sm:grid-cols-3">
					<MetaField
						label="Status"
						value={
							<span className="capitalize">{provider.enrollmentStatus}</span>
						}
					/>
					<MetaField
						label="Effective date"
						value={formatDate(provider.enrollmentEffective)}
					/>
					<MetaField label="Program" value={provider.program} />
				</div>
			</Panel>
		);
	}

	if (tab === "Network Participation") {
		return (
			<Panel title="Network Participation">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Network / Plan</TableHead>
								<TableHead>Payer</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Effective</TableHead>
								<TableHead>End</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{provider.networks.map((n) => (
								<TableRow key={n.id}>
									<TableCell className="text-sm font-medium">
										{n.networkPlan}
									</TableCell>
									<TableCell className="text-sm">{n.payer}</TableCell>
									<TableCell>
										<NetworkPill status={n.status} />
									</TableCell>
									<TableCell className="tabular-nums text-sm">
										{formatDate(n.effectiveDate)}
									</TableCell>
									<TableCell className="tabular-nums text-sm">
										{formatDate(n.endDate)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Panel>
		);
	}

	if (tab === "Locations") {
		return (
			<Panel title="Locations">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Location</TableHead>
								<TableHead>Address</TableHead>
								<TableHead>Phone</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Primary</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{provider.locations.map((loc) => (
								<TableRow key={loc.id}>
									<TableCell className="text-sm font-medium">
										{loc.name}
									</TableCell>
									<TableCell className="text-sm">{loc.address}</TableCell>
									<TableCell className="text-sm">{loc.phone}</TableCell>
									<TableCell>
										<StatusPill status={loc.status} />
									</TableCell>
									<TableCell className="text-sm">
										{loc.isPrimary ? "Yes" : "No"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Panel>
		);
	}

	if (tab === "Claims & Encounters") {
		return <ClaimsEncountersTab provider={provider} />;
	}

	if (tab === "Rejection Trends") {
		return (
			<div className="grid gap-4 lg:grid-cols-2">
				<Panel title="Rejection Trends">
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
				<Panel title="Rejection Reasons">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Reason</TableHead>
									<TableHead className="text-right">Count</TableHead>
									<TableHead className="text-right">% of total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{provider.rejectionReasons.map((r) => (
									<TableRow key={r.id}>
										<TableCell className="text-sm">{r.reason}</TableCell>
										<TableCell className="text-right tabular-nums text-sm">
											{r.count}
										</TableCell>
										<TableCell className="text-right tabular-nums text-sm">
											{r.pct}%
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</Panel>
			</div>
		);
	}

	if (tab === "Vendors / Sources") {
		return (
			<Panel title="Vendors / Source Associations">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Vendor / Source</TableHead>
								<TableHead>File type</TableHead>
								<TableHead>Data sent</TableHead>
								<TableHead>Frequency</TableHead>
								<TableHead>Last received</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{provider.vendors.map((v) => (
								<TableRow key={v.id}>
									<TableCell className="text-sm font-medium">
										{v.vendor}
									</TableCell>
									<TableCell className="text-sm">{v.fileType}</TableCell>
									<TableCell className="text-sm">{v.dataSent}</TableCell>
									<TableCell className="text-sm">{v.frequency}</TableCell>
									<TableCell className="tabular-nums text-sm">
										{v.lastReceived}
									</TableCell>
									<TableCell>
										<FeedPill status={v.status} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Panel>
		);
	}

	return <CredentialingTab provider={provider} />;
}

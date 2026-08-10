"use client";

import { useMemo, useState } from "react";

import {
	ArrowDownUp,
	ChevronLeft,
	ChevronRight,
	CloudUpload,
	FileText,
	MoreHorizontal,
	Pencil,
	Search,
	Shield,
	Users,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type AuditActionType,
	type AuditActivity,
	type AuditModule,
	buildAuditActivities,
	summarizeAuditActivities,
} from "@/features/admin/features/audit-trail/mock-data";
import { cn } from "@/lib/utils";

function ActionBadge({ action }: { action: AuditActionType }) {
	const tone =
		action === "Updated"
			? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
			: action === "Created"
				? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
				: action === "Deleted"
					? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
					: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200";
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-[11px] font-medium",
				tone
			)}
		>
			{action}
		</span>
	);
}

function SortableHead({
	label,
	className,
}: {
	label: string;
	className?: string;
}) {
	return (
		<TableHead className={cn("font-semibold text-foreground", className)}>
			<span className="inline-flex items-center gap-1">
				{label}
				<ArrowDownUp className="size-3 text-muted-foreground" />
			</span>
		</TableHead>
	);
}

type AuditTrailViewProps = {
	vendorId?: string;
	vendorName?: string;
	showPageHeader?: boolean;
};

export function AuditTrailView({
	vendorId,
	vendorName,
	showPageHeader = false,
}: AuditTrailViewProps) {
	const [userFilter, setUserFilter] = useState("all");
	const [actionFilter, setActionFilter] = useState("all");
	const [moduleFilter, setModuleFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const allRows = useMemo(
		() =>
			buildAuditActivities({
				vendorId,
				vendorName,
				count: vendorId ? 48 : 128,
			}),
		[vendorId, vendorName]
	);

	const users = useMemo(
		() => Array.from(new Set(allRows.map((row) => row.user))).sort(),
		[allRows]
	);

	const modules = useMemo(
		() =>
			Array.from(
				new Set(allRows.map((row) => row.module))
			).sort() as AuditModule[],
		[allRows]
	);

	const filteredRows = useMemo(() => {
		const q = search.trim().toLowerCase();
		return allRows.filter((row) => {
			if (userFilter !== "all" && row.user !== userFilter) return false;
			if (actionFilter !== "all" && row.action !== actionFilter) return false;
			if (moduleFilter !== "all" && row.module !== moduleFilter) return false;
			if (!q) return true;
			return [row.details, row.user, row.action, row.module, row.ipAddress]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [actionFilter, allRows, moduleFilter, search, userFilter]);

	const summary = useMemo(() => summarizeAuditActivities(allRows), [allRows]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = filteredRows.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize
	);

	const pageNumbers = useMemo(() => {
		const maxButtons = 5;
		const start = Math.max(
			1,
			Math.min(safePage - 2, pageCount - maxButtons + 1)
		);
		const end = Math.min(pageCount, start + maxButtons - 1);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}, [pageCount, safePage]);

	function onFilterChange(setter: (value: string) => void, value: string) {
		setter(value);
		setPage(1);
	}

	return (
		<div className="min-w-0 space-y-5">
			{showPageHeader ? (
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Audit Trail
					</h1>
					<p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
						Track configuration changes, file activity, and security events
						{vendorName ? ` for ${vendorName}` : " across the platform"}.
					</p>
				</div>
			) : null}

			<section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
				<h2 className="text-lg font-semibold tracking-tight text-foreground">
					Audit Summary
				</h2>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					{[
						{
							label: "Total Activities",
							value: summary.total,
							icon: FileText,
							tone: "text-sky-700 bg-sky-500/15 ring-sky-500/20",
						},
						{
							label: "Users Involved",
							value: summary.users,
							icon: Users,
							tone: "text-emerald-700 bg-emerald-500/15 ring-emerald-500/20",
						},
						{
							label: "Configuration Changes",
							value: summary.configuration,
							icon: Pencil,
							tone: "text-amber-700 bg-amber-500/15 ring-amber-500/20",
						},
						{
							label: "File / Job Activities",
							value: summary.fileJob,
							icon: CloudUpload,
							tone: "text-primary bg-primary/15 ring-primary/20",
						},
						{
							label: "Access / Security",
							value: summary.access,
							icon: Shield,
							tone: "text-violet-700 bg-violet-500/15 ring-violet-500/20",
						},
					].map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.label}
								className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
							>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
										item.tone
									)}
								>
									<Icon className="size-4" />
								</div>
								<div className="min-w-0">
									<p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
										{item.value}
									</p>
									<p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
										{item.label}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			<section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<div className="border-b border-border bg-primary/10 px-4 py-3.5 sm:px-5">
					<h2 className="text-sm font-semibold tracking-tight text-foreground">
						Audit Activities
					</h2>
				</div>
				<div className="border-b border-border px-4 py-3 sm:px-5">
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={userFilter}
							onValueChange={(value) => onFilterChange(setUserFilter, value)}
						>
							<SelectTrigger className="h-9 w-[150px]">
								<SelectValue placeholder="User" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Users</SelectItem>
								{users.map((name) => (
									<SelectItem key={name} value={name}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={actionFilter}
							onValueChange={(value) => onFilterChange(setActionFilter, value)}
						>
							<SelectTrigger className="h-9 w-[150px]">
								<SelectValue placeholder="Action" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Actions</SelectItem>
								{(
									[
										"Updated",
										"Created",
										"Deleted",
										"Login",
									] as AuditActionType[]
								).map((action) => (
									<SelectItem key={action} value={action}>
										{action}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={moduleFilter}
							onValueChange={(value) => onFilterChange(setModuleFilter, value)}
						>
							<SelectTrigger className="h-9 w-[160px]">
								<SelectValue placeholder="Module" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Modules</SelectItem>
								{modules.map((module) => (
									<SelectItem key={module} value={module}>
										{module}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="relative min-w-[220px] flex-1">
							<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(1);
								}}
								placeholder="Search details, changes, etc."
								className="h-9 pl-8"
							/>
						</div>
					</div>
				</div>

				<div className="w-full overflow-x-auto">
					<Table className="min-w-[980px] text-sm">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<SortableHead label="Date / Time" className="pl-4 sm:pl-5" />
								<SortableHead label="User" />
								<SortableHead label="Action" />
								<SortableHead label="Module" />
								<SortableHead label="Details" />
								<SortableHead label="IP Address" />
								<TableHead className="pr-4 text-right font-semibold sm:pr-5">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-24 text-center text-muted-foreground"
									>
										No audit activities match the current filters.
									</TableCell>
								</TableRow>
							) : (
								pageRows.map((row: AuditActivity) => (
									<TableRow key={row.id} className="hover:bg-muted/30">
										<TableCell className="pl-4 whitespace-nowrap text-muted-foreground sm:pl-5">
											{row.at}
										</TableCell>
										<TableCell className="font-medium">{row.user}</TableCell>
										<TableCell>
											<ActionBadge action={row.action} />
										</TableCell>
										<TableCell>{row.module}</TableCell>
										<TableCell className="max-w-[320px] truncate">
											{row.details}
										</TableCell>
										<TableCell className="font-mono text-xs text-muted-foreground">
											{row.ipAddress}
										</TableCell>
										<TableCell className="pr-4 text-right sm:pr-5">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-8"
													>
														<MoreHorizontal className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															toast.message("Activity detail opens here")
														}
													>
														View details
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															toast.success("Activity copied to clipboard")
														}
													>
														Copy details
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

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:px-5">
					<p>
						Showing{" "}
						{filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to{" "}
						{Math.min(safePage * pageSize, filteredRows.length)} of{" "}
						{filteredRows.length} activities
					</p>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon"
							className="size-8"
							disabled={safePage <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							<ChevronLeft className="size-4" />
						</Button>
						{pageNumbers.map((num) => (
							<Button
								key={num}
								variant={num === safePage ? "default" : "outline"}
								size="sm"
								className="size-8 p-0"
								onClick={() => setPage(num)}
							>
								{num}
							</Button>
						))}
						<Button
							variant="outline"
							size="icon"
							className="size-8"
							disabled={safePage >= pageCount}
							onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
						>
							<ChevronRight className="size-4" />
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs">Rows per page</span>
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								setPageSize(Number(value));
								setPage(1);
							}}
						>
							<SelectTrigger className="h-8 w-[72px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[10, 25, 50].map((size) => (
									<SelectItem key={size} value={String(size)}>
										{size}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</section>
		</div>
	);
}

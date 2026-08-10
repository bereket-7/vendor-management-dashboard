"use client";

import { useMemo, useState } from "react";

import {
	Archive,
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Flag,
	MoreHorizontal,
	Paperclip,
	Search,
	Star,
	X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import { cn } from "@/lib/utils";

type NoteCategory =
	| "Configuration"
	| "Operations"
	| "Mapping"
	| "General"
	| "Access";
type NotePriority = "High" | "Medium" | "Low";
type NoteStatus = "Open" | "Closed" | "Archived";

type VendorNote = {
	id: string;
	title: string;
	category: NoteCategory;
	priority: NotePriority;
	status: NoteStatus;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	updatedBy: string;
	body: string;
	starred: boolean;
	actionItem: boolean;
	attachments: { id: string; name: string; size: string }[];
	activity: { id: string; user: string; action: string; at: string }[];
};

type VendorNotesTabProps = {
	vendorName: string;
	integrationNotes?: string;
};

function categoryTone(category: NoteCategory) {
	if (category === "Configuration")
		return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200";
	if (category === "Operations")
		return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
	if (category === "Mapping")
		return "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200";
	if (category === "Access")
		return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
	return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200";
}

function priorityTone(priority: NotePriority) {
	if (priority === "High")
		return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
	if (priority === "Medium")
		return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
	return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200";
}

function statusTone(status: NoteStatus) {
	if (status === "Open")
		return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
	if (status === "Closed")
		return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200";
	return "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300";
}

function initials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function buildNotes(
	vendorName: string,
	integrationNotes?: string
): VendorNote[] {
	const short = vendorName.split(/\s+/).slice(0, 2).join(" ") || "Vendor";
	const seed: Array<Omit<VendorNote, "id" | "activity">> = [
		{
			title: "SFTP port change completed",
			category: "Configuration",
			priority: "High",
			status: "Open",
			createdBy: "Kassie M.",
			createdAt: "07/24/2026 09:15 AM",
			updatedAt: "07/24/2026 09:20 AM",
			updatedBy: "Kassie M.",
			body:
				integrationNotes?.trim() ||
				`Updated ${short} SFTP port from 21 to 22 after connectivity validation. Incoming eligibility and claims jobs resumed successfully.`,
			starred: true,
			actionItem: true,
			attachments: [
				{
					id: "att-1",
					name: `${short.replace(/\s+/g, "_").toUpperCase()}_SFTP_Port_Change_07242026.pdf`,
					size: "245 KB",
				},
			],
		},
		{
			title: "Eligibility import schedule adjusted",
			category: "Operations",
			priority: "Medium",
			status: "Open",
			createdBy: "Brian B.",
			createdAt: "07/23/2026 02:40 PM",
			updatedAt: "07/23/2026 03:05 PM",
			updatedBy: "Brian B.",
			body: "Moved Eligibility (834) job from weekly to daily at 6:00 AM CT after ops request.",
			starred: false,
			actionItem: true,
			attachments: [],
		},
		{
			title: "Medical claims mapping review",
			category: "Mapping",
			priority: "High",
			status: "Open",
			createdBy: "Priya P.",
			createdAt: "07/22/2026 11:10 AM",
			updatedAt: "07/22/2026 04:18 PM",
			updatedBy: "Alex C.",
			body: "Reviewed 837 claim field mappings. Pending confirmation on diagnosis code fallback.",
			starred: false,
			actionItem: true,
			attachments: [
				{
					id: "att-2",
					name: "837_mapping_diff.xlsx",
					size: "128 KB",
				},
			],
		},
		{
			title: "Onboarding kickoff notes",
			category: "General",
			priority: "Low",
			status: "Closed",
			createdBy: "Alex C.",
			createdAt: "07/18/2026 10:00 AM",
			updatedAt: "07/20/2026 01:12 PM",
			updatedBy: "Alex C.",
			body: "Captured initial contacts, file types, and target go-live window for this vendor.",
			starred: false,
			actionItem: false,
			attachments: [],
		},
		{
			title: "PGP key rotation reminder",
			category: "Access",
			priority: "Medium",
			status: "Open",
			createdBy: "Sam O.",
			createdAt: "07/21/2026 08:25 AM",
			updatedAt: "07/21/2026 08:25 AM",
			updatedBy: "Sam O.",
			body: "Vendor encryption key expires in 30 days. Schedule rotation with security contact.",
			starred: true,
			actionItem: false,
			attachments: [],
		},
		{
			title: "Accumulator feed late file follow-up",
			category: "Operations",
			priority: "High",
			status: "Closed",
			createdBy: "Jordan L.",
			createdAt: "07/19/2026 07:05 AM",
			updatedAt: "07/19/2026 05:40 PM",
			updatedBy: "Jordan L.",
			body: "Late accumulator file recovered after vendor rerun. SLA breach acknowledged.",
			starred: false,
			actionItem: false,
			attachments: [
				{
					id: "att-3",
					name: "accumulator_late_file_log.txt",
					size: "18 KB",
				},
			],
		},
		{
			title: "Account LOB cleanup",
			category: "General",
			priority: "Low",
			status: "Archived",
			createdBy: "Taylor B.",
			createdAt: "07/10/2026 03:30 PM",
			updatedAt: "07/15/2026 09:00 AM",
			updatedBy: "Taylor B.",
			body: "Archived obsolete marketplace test accounts after migration.",
			starred: false,
			actionItem: false,
			attachments: [],
		},
		{
			title: "Alert threshold tuning",
			category: "Configuration",
			priority: "Medium",
			status: "Archived",
			createdBy: "Morgan E.",
			createdAt: "07/08/2026 12:45 PM",
			updatedAt: "07/12/2026 10:20 AM",
			updatedBy: "Morgan E.",
			body: "Raised validation failure alert threshold from 1% to 2% for pharmacy claims.",
			starred: false,
			actionItem: false,
			attachments: [],
		},
	];

	// Expand to ~18 notes for summary realism
	const expanded = Array.from({ length: 18 }, (_, index) => {
		const base = seed[index % seed.length]!;
		const statusCycle: NoteStatus[] =
			index < 5 ? ["Open"] : index < 12 ? ["Closed", "Open"] : ["Archived"];
		const status = statusCycle[index % statusCycle.length]!;
		return {
			...base,
			id: `note-${index + 1}`,
			title: index < seed.length ? base.title : `${base.title} (#${index + 1})`,
			status: index < seed.length ? base.status : status,
			starred: index === 0 || index === 4,
			actionItem: index < 3,
			attachments:
				index % 3 === 0 || index < 3
					? base.attachments.length
						? base.attachments
						: [
								{
									id: `att-x-${index}`,
									name: `note_attachment_${index + 1}.pdf`,
									size: `${80 + index * 7} KB`,
								},
							]
					: [],
			activity: [
				{
					id: `act-${index}-1`,
					user: base.createdBy,
					action: "created this note",
					at: base.createdAt,
				},
				{
					id: `act-${index}-2`,
					user: base.updatedBy,
					action: "updated this note",
					at: base.updatedAt,
				},
				...(base.attachments.length || index % 3 === 0
					? [
							{
								id: `act-${index}-3`,
								user: base.updatedBy,
								action: "Added attachment",
								at: base.updatedAt,
							},
						]
					: []),
			],
		} satisfies VendorNote;
	});

	return expanded;
}

export function VendorNotesTab({
	vendorName,
	integrationNotes,
}: VendorNotesTabProps) {
	const [notes, setNotes] = useState(() =>
		buildNotes(vendorName, integrationNotes)
	);
	const [selectedId, setSelectedId] = useState<string | null>(
		() => notes[0]?.id ?? null
	);
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("all");
	const [priority, setPriority] = useState("all");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const summary = useMemo(() => {
		return {
			total: notes.length,
			open: notes.filter((n) => n.status === "Open").length,
			actionItems: notes.filter((n) => n.actionItem && n.status === "Open")
				.length,
			withAttachments: notes.filter((n) => n.attachments.length > 0).length,
			archived: notes.filter((n) => n.status === "Archived").length,
		};
	}, [notes]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return notes.filter((note) => {
			if (category !== "all" && note.category !== category) return false;
			if (priority !== "all" && note.priority !== priority) return false;
			if (status !== "all" && note.status !== status) return false;
			if (!q) return true;
			return [note.title, note.body, note.createdBy, note.category]
				.join(" ")
				.toLowerCase()
				.includes(q);
		});
	}, [category, notes, priority, search, status]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const pageRows = filtered.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize
	);
	const selected = notes.find((n) => n.id === selectedId) ?? null;

	const pageNumbers = useMemo(() => {
		const maxButtons = 5;
		const start = Math.max(
			1,
			Math.min(safePage - 2, pageCount - maxButtons + 1)
		);
		const end = Math.min(pageCount, start + maxButtons - 1);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}, [pageCount, safePage]);

	function clearFilters() {
		setSearch("");
		setCategory("all");
		setPriority("all");
		setStatus("all");
		setPage(1);
	}

	function toggleStar(noteId: string) {
		setNotes((prev) =>
			prev.map((note) =>
				note.id === noteId ? { ...note, starred: !note.starred } : note
			)
		);
	}

	function archiveNote(noteId: string) {
		setNotes((prev) =>
			prev.map((note) =>
				note.id === noteId ? { ...note, status: "Archived" } : note
			)
		);
		toast.success("Note archived.");
	}

	function closeNote(noteId: string) {
		setNotes((prev) =>
			prev.map((note) =>
				note.id === noteId
					? { ...note, status: "Closed", actionItem: false }
					: note
			)
		);
		toast.success("Note closed.");
	}

	return (
		<section className="min-w-0 space-y-4">
			<div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
				<h2 className="text-lg font-semibold tracking-tight text-foreground">
					Notes Summary
				</h2>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					{[
						{
							label: "Total Notes",
							value: summary.total,
							icon: FileText,
							tone: "text-sky-700 bg-sky-500/15 ring-sky-500/20",
						},
						{
							label: "Open Notes",
							value: summary.open,
							icon: FileText,
							tone: "text-emerald-700 bg-emerald-500/15 ring-emerald-500/20",
						},
						{
							label: "Action Items",
							value: summary.actionItems,
							icon: Flag,
							tone: "text-amber-700 bg-amber-500/15 ring-amber-500/20",
						},
						{
							label: "With Attachments",
							value: summary.withAttachments,
							icon: Paperclip,
							tone: "text-violet-700 bg-violet-500/15 ring-violet-500/20",
						},
						{
							label: "Archived Notes",
							value: summary.archived,
							icon: Archive,
							tone: "text-zinc-700 bg-zinc-500/15 ring-zinc-500/20",
						},
					].map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.label}
								className="flex items-center gap-3 rounded-xl border border-border bg-card shadow-sm p-4"
							>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg",
										item.tone
									)}
								>
									<Icon className="size-4" />
								</div>
								<div>
									<p className="text-2xl font-semibold tabular-nums tracking-tight">
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
			</div>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
				<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					<div className="flex flex-wrap items-center gap-2 border-b border-border bg-amber-500/10 p-3.5">
						<div className="relative min-w-[180px] flex-1">
							<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								placeholder="Search notes..."
								className="h-9 pl-8"
							/>
						</div>
						<Select
							value={category}
							onValueChange={(value) => {
								setCategory(value);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9 w-[150px]">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{(
									[
										"Configuration",
										"Operations",
										"Mapping",
										"General",
										"Access",
									] as NoteCategory[]
								).map((item) => (
									<SelectItem key={item} value={item}>
										{item}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={priority}
							onValueChange={(value) => {
								setPriority(value);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9 w-[140px]">
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Priorities</SelectItem>
								{(["High", "Medium", "Low"] as NotePriority[]).map((item) => (
									<SelectItem key={item} value={item}>
										{item}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={status}
							onValueChange={(value) => {
								setStatus(value);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9 w-[140px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								{(["Open", "Closed", "Archived"] as NoteStatus[]).map(
									(item) => (
										<SelectItem key={item} value={item}>
											{item}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-9"
							onClick={clearFilters}
						>
							Clear Filters
						</Button>
					</div>

					<div className="w-full overflow-x-auto">
						<Table className="min-w-[860px] text-sm">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4">Note Title</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Priority</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created By</TableHead>
									<TableHead>Created Date</TableHead>
									<TableHead className="pr-4 text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.map((note) => {
									const active = selectedId === note.id;
									return (
										<TableRow
											key={note.id}
											className={cn(
												"cursor-pointer hover:bg-muted/30",
												active && "bg-sky-50 dark:bg-sky-950/30"
											)}
											onClick={() => setSelectedId(note.id)}
										>
											<TableCell className="pl-4 font-medium">
												<span className="inline-flex items-center gap-1.5">
													{note.starred ? (
														<Star className="size-3.5 fill-amber-400 text-amber-500" />
													) : null}
													{note.title}
												</span>
											</TableCell>
											<TableCell>
												<span
													className={cn(
														"inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
														categoryTone(note.category)
													)}
												>
													{note.category}
												</span>
											</TableCell>
											<TableCell>
												<span
													className={cn(
														"inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
														priorityTone(note.priority)
													)}
												>
													{note.priority}
												</span>
											</TableCell>
											<TableCell>
												<span
													className={cn(
														"inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
														statusTone(note.status)
													)}
												>
													{note.status}
												</span>
											</TableCell>
											<TableCell>{note.createdBy}</TableCell>
											<TableCell className="whitespace-nowrap text-muted-foreground">
												{note.createdAt}
											</TableCell>
											<TableCell
												className="pr-4 text-right"
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="size-8"
														>
															<MoreHorizontal className="size-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onSelect={() => setSelectedId(note.id)}
														>
															View details
														</DropdownMenuItem>
														<DropdownMenuItem
															onSelect={() => toggleStar(note.id)}
														>
															{note.starred ? "Unstar note" : "Star note"}
														</DropdownMenuItem>
														<DropdownMenuItem
															onSelect={() => closeNote(note.id)}
														>
															Mark closed
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onSelect={() => archiveNote(note.id)}
														>
															Archive note
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
								{pageRows.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-24 text-center text-muted-foreground"
										>
											No notes match the current filters.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
						<p>
							Showing{" "}
							{filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to{" "}
							{Math.min(safePage * pageSize, filtered.length)} of{" "}
							{filtered.length} notes
						</p>
						<div className="flex items-center gap-1">
							<Button
								type="button"
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
									type="button"
									variant={num === safePage ? "default" : "outline"}
									size="sm"
									className="size-8 p-0"
									onClick={() => setPage(num)}
								>
									{num}
								</Button>
							))}
							<Button
								type="button"
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
				</div>

				<aside className="h-fit rounded-xl border border-border bg-card shadow-sm xl:sticky xl:top-4">
					{selected ? (
						<>
							<div className="flex items-start justify-between gap-2 border-b border-border bg-violet-500/10 px-4 py-3.5">
								<div>
									<p className="text-sm font-semibold tracking-tight text-foreground">
										Note Details
									</p>
									<div className="mt-1.5 flex flex-wrap items-center gap-2">
										<span
											className={cn(
												"inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
												statusTone(selected.status)
											)}
										>
											{selected.status}
										</span>
										<span className="text-xs text-muted-foreground">
											Created on {selected.createdAt}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-1">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8"
										onClick={() => toggleStar(selected.id)}
									>
										<Star
											className={cn(
												"size-4",
												selected.starred
													? "fill-amber-400 text-amber-500"
													: "text-muted-foreground"
											)}
										/>
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8"
										onClick={() => setSelectedId(null)}
									>
										<X className="size-4" />
									</Button>
								</div>
							</div>

							<div className="space-y-4 p-4">
								<h3 className="text-base font-semibold tracking-tight">
									{selected.title}
								</h3>

								<div className="grid gap-3 sm:grid-cols-2">
									{[
										["Category", selected.category],
										["Priority", selected.priority],
										["Created By", selected.createdBy],
										[
											"Last Updated",
											`${selected.updatedAt} by ${selected.updatedBy}`,
										],
									].map(([label, value]) => (
										<div key={label}>
											<p className="text-[11px] text-muted-foreground">
												{label}
											</p>
											<p className="mt-0.5 text-sm font-medium">{value}</p>
										</div>
									))}
								</div>

								<div>
									<p className="mb-1.5 text-sm font-medium">Note</p>
									<p className="rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
										{selected.body}
									</p>
								</div>

								<div>
									<p className="mb-1.5 text-sm font-medium">
										Attachments ({selected.attachments.length})
									</p>
									{selected.attachments.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No attachments.
										</p>
									) : (
										<div className="space-y-2">
											{selected.attachments.map((file) => (
												<div
													key={file.id}
													className="flex items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2"
												>
													<div className="flex min-w-0 items-center gap-2">
														<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
															<FileText className="size-4" />
														</div>
														<div className="min-w-0">
															<p className="truncate text-sm font-medium">
																{file.name}
															</p>
															<p className="text-xs text-muted-foreground">
																{file.size}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-1">
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="size-8"
															onClick={() =>
																toast.success(`Downloading ${file.name}`)
															}
														>
															<Download className="size-3.5" />
														</Button>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="size-8"
																>
																	<MoreHorizontal className="size-3.5" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem
																	onSelect={() =>
																		toast.message(
																			"Attachment preview opens here"
																		)
																	}
																>
																	Preview
																</DropdownMenuItem>
																<DropdownMenuItem
																	onSelect={() =>
																		toast.success(`Downloading ${file.name}`)
																	}
																>
																	Download
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								<div>
									<p className="mb-2 text-sm font-medium">Activity</p>
									<ul className="space-y-4">
										{selected.activity.map((item) => (
											<li key={item.id} className="flex gap-2.5">
												<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
													{initials(item.user)}
												</div>
												<div className="min-w-0">
													<p className="text-sm">
														<span className="font-medium">{item.user}</span>{" "}
														<span className="text-muted-foreground">
															{item.action}
														</span>
													</p>
													<p className="text-xs text-muted-foreground">
														{item.at}
													</p>
												</div>
											</li>
										))}
									</ul>
								</div>
							</div>
						</>
					) : (
						<div className="px-4 py-10 text-center text-sm text-muted-foreground">
							Select a note to view details, attachments, and activity.
						</div>
					)}
				</aside>
			</div>
		</section>
	);
}

"use client";

import { useEffect, useMemo, useState } from "react";

import {
	Archive,
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Flag,
	Loader2,
	MoreHorizontal,
	Paperclip,
	Plus,
	Search,
	Star,
	X,
} from "lucide-react";
import { toast } from "sonner";

import { SummaryCard, SummaryCardsGrid } from "@/components/admin/SummaryCard";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { vendorNoteDtoToUi } from "../feature/mappers/noteMappers";
import {
	useCreateVendorNoteMutation,
	useDeleteVendorNoteMutation,
	useUpdateVendorNoteMutation,
	useVendorNotesQuery,
} from "../feature/queries/useVendorsQuery";

type NoteCategory =
	| "Configuration"
	| "Operations"
	| "Mapping"
	| "General"
	| "Access";
type NotePriority = "High" | "Medium" | "Low";
type NoteStatus = "Open" | "Closed" | "Archived";

type VendorNotesTabProps = {
	vendorId: string;
	vendorName: string;
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

function formatDisplayUser(value: string) {
	if (!value.includes("@")) return value;
	const [local, domain] = value.split("@");
	if (!domain || local == null) return value;
	if (local.length <= 14) return value;
	return `${local.slice(0, 12)}…@${domain}`;
}

function NoteBadge({ label, className }: { label: string; className: string }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
				className
			)}
		>
			{label}
		</span>
	);
}

export function VendorNotesTab({
	vendorId,
	vendorName: _vendorName,
}: VendorNotesTabProps) {
	const notesQuery = useVendorNotesQuery(vendorId);
	const createNoteMutation = useCreateVendorNoteMutation(vendorId);
	const updateNoteMutation = useUpdateVendorNoteMutation();
	const deleteNoteMutation = useDeleteVendorNoteMutation();
	const notes = useMemo(
		() => (notesQuery.data ?? []).map(vendorNoteDtoToUi),
		[notesQuery.data]
	);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("all");
	const [priority, setPriority] = useState("all");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [createOpen, setCreateOpen] = useState(false);
	const [newBody, setNewBody] = useState("");
	const [newPinned, setNewPinned] = useState(false);

	useEffect(() => {
		const firstId = notesQuery.data?.[0]?.id;
		if (!selectedId && firstId) setSelectedId(firstId);
	}, [notesQuery.data, selectedId]);

	const summary = useMemo(
		() => ({
			total: notes.length,
			open: notes.filter((n) => n.status === "Open").length,
			actionItems: notes.filter((n) => n.actionItem && n.status === "Open")
				.length,
			withAttachments: notes.filter((n) => n.attachments.length > 0).length,
			archived: notes.filter((n) => n.status === "Archived").length,
		}),
		[notes]
	);

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

	async function handleCreateNote() {
		const trimmed = newBody.trim();
		if (!trimmed) {
			toast.message("Enter a note before saving");
			return;
		}
		try {
			const created = await createNoteMutation.mutateAsync({
				body: trimmed,
				is_pinned: newPinned,
			});
			toast.success("Note created");
			setCreateOpen(false);
			setNewBody("");
			setNewPinned(false);
			await notesQuery.refetch();
			if (created?.id) setSelectedId(String(created.id));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not create note");
		}
	}

	function toggleStar(noteId: string) {
		const note = notes.find((row) => row.id === noteId);
		if (!note) return;
		void updateNoteMutation
			.mutateAsync({ id: noteId, body: { is_pinned: !note.starred } })
			.catch(() => toast.error("Could not update note."));
	}

	function archiveNote(noteId: string) {
		void deleteNoteMutation
			.mutateAsync(noteId)
			.then(() => toast.success("Note archived."))
			.catch(() => toast.error("Could not archive note."));
	}

	function closeNote(_noteId: string) {
		toast.message("Close status is not stored on the API yet.");
	}

	return (
		<section className="min-w-0 space-y-4">
			<SummaryCardsGrid columns={5}>
				<SummaryCard
					label="Total notes"
					value={summary.total}
					icon={FileText}
					tone="text-sky-700 bg-sky-500/15 ring-sky-500/20"
				/>
				<SummaryCard
					label="Open notes"
					value={summary.open}
					icon={FileText}
					tone="text-emerald-700 bg-emerald-500/15 ring-emerald-500/20"
				/>
				<SummaryCard
					label="Action items"
					value={summary.actionItems}
					icon={Flag}
					tone="text-amber-700 bg-amber-500/15 ring-amber-500/20"
				/>
				<SummaryCard
					label="With attachments"
					value={summary.withAttachments}
					icon={Paperclip}
					tone="text-violet-700 bg-violet-500/15 ring-violet-500/20"
				/>
				<SummaryCard
					label="Archived"
					value={summary.archived}
					icon={Archive}
					tone="text-zinc-700 bg-zinc-500/15 ring-zinc-500/20"
				/>
			</SummaryCardsGrid>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
				<div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
						<div>
							<h2 className="text-sm font-semibold tracking-tight">Notes</h2>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Vendor notes and operational context.
							</p>
						</div>
						<Button
							type="button"
							size="sm"
							className="h-8"
							onClick={() => setCreateOpen(true)}
						>
							<Plus className="mr-1.5 size-3.5" />
							Add note
						</Button>
					</div>

					<div className="grid gap-2 border-b border-border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] lg:items-center">
						<div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
							<Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								placeholder="Search notes..."
								className="h-9 bg-background pl-8"
							/>
						</div>
						<Select
							value={category}
							onValueChange={(value) => {
								setCategory(value);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9 w-full bg-background lg:w-[140px]">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All categories</SelectItem>
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
							<SelectTrigger className="h-9 w-full bg-background lg:w-[130px]">
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All priorities</SelectItem>
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
							<SelectTrigger className="h-9 w-full bg-background lg:w-[130px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
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
							variant="outline"
							size="sm"
							className="h-9"
							onClick={clearFilters}
						>
							Clear
						</Button>
					</div>

					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30 hover:bg-muted/30">
								<TableHead className="pl-4">Note</TableHead>
								<TableHead className="hidden md:table-cell">Category</TableHead>
								<TableHead className="hidden lg:table-cell">Priority</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="hidden sm:table-cell">Created</TableHead>
								<TableHead className="w-10 pr-4" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageRows.map((note) => {
								const active = selectedId === note.id;
								return (
									<TableRow
										key={note.id}
										className={cn("cursor-pointer", active && "bg-primary/5")}
										onClick={() => setSelectedId(note.id)}
									>
										<TableCell className="max-w-0 pl-4">
											<div className="flex min-w-0 items-start gap-2">
												{note.starred ? (
													<Star className="mt-0.5 size-3.5 shrink-0 fill-amber-400 text-amber-500" />
												) : (
													<span className="mt-0.5 size-3.5 shrink-0" />
												)}
												<div className="min-w-0">
													<p className="truncate text-sm font-medium">
														{note.title}
													</p>
													<p className="truncate text-xs text-muted-foreground">
														{formatDisplayUser(note.createdBy)}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell className="hidden md:table-cell">
											<NoteBadge
												label={note.category}
												className={categoryTone(note.category)}
											/>
										</TableCell>
										<TableCell className="hidden lg:table-cell">
											<NoteBadge
												label={note.priority}
												className={priorityTone(note.priority)}
											/>
										</TableCell>
										<TableCell>
											<NoteBadge
												label={note.status}
												className={statusTone(note.status)}
											/>
										</TableCell>
										<TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">
											{note.createdAt}
										</TableCell>
										<TableCell
											className="pr-4"
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
													<DropdownMenuItem onSelect={() => closeNote(note.id)}>
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
										colSpan={6}
										className="h-24 text-center text-sm text-muted-foreground"
									>
										No notes match the current filters.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
						<p>
							Showing{" "}
							{filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
							{Math.min(safePage * pageSize, filtered.length)} of{" "}
							{filtered.length}
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
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								setPageSize(Number(value));
								setPage(1);
							}}
						>
							<SelectTrigger className="h-8 w-[72px] bg-background">
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

				<aside className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm xl:sticky xl:top-4 xl:self-start">
					{selected ? (
						<>
							<div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
								<div className="min-w-0 flex-1">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										Note detail
									</p>
									<h3 className="mt-1 line-clamp-3 text-sm font-semibold leading-snug">
										{selected.title}
									</h3>
									<div className="mt-2 flex flex-wrap gap-1.5">
										<NoteBadge
											label={selected.category}
											className={categoryTone(selected.category)}
										/>
										<NoteBadge
											label={selected.priority}
											className={priorityTone(selected.priority)}
										/>
										<NoteBadge
											label={selected.status}
											className={statusTone(selected.status)}
										/>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-0.5">
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
								<p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm leading-relaxed text-foreground">
									{selected.body}
								</p>

								<dl className="grid grid-cols-2 gap-3 text-sm">
									<div>
										<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Created by
										</dt>
										<dd className="mt-1 break-all font-medium">
											{selected.createdBy}
										</dd>
									</div>
									<div>
										<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Created
										</dt>
										<dd className="mt-1 font-medium">{selected.createdAt}</dd>
									</div>
									<div className="col-span-2">
										<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Last updated
										</dt>
										<dd className="mt-1 font-medium">
											{selected.updatedAt} · {selected.updatedBy}
										</dd>
									</div>
								</dl>

								<div>
									<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										Attachments ({selected.attachments.length})
									</p>
									{selected.attachments.length === 0 ? (
										<p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
											No attachments
										</p>
									) : (
										<div className="space-y-2">
											{selected.attachments.map((file) => (
												<div
													key={file.id}
													className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
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
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="size-8 shrink-0"
														onClick={() =>
															toast.success(`Downloading ${file.name}`)
														}
													>
														<Download className="size-3.5" />
													</Button>
												</div>
											))}
										</div>
									)}
								</div>

								<div>
									<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										Activity
									</p>
									<ul className="space-y-3 border-l border-border pl-3">
										{selected.activity.map((item) => (
											<li key={item.id} className="relative pl-3">
												<span className="absolute top-2 -left-[7px] size-2 rounded-full bg-primary" />
												<p className="text-sm">
													<span className="font-medium">{item.user}</span>{" "}
													<span className="text-muted-foreground">
														{item.action}
													</span>
												</p>
												<p className="text-xs text-muted-foreground">
													{item.at}
												</p>
											</li>
										))}
									</ul>
								</div>
							</div>
						</>
					) : (
						<div className="flex min-h-[280px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
							<FileText className="size-8 text-muted-foreground/60" />
							<p className="text-sm font-medium text-foreground">
								Select a note
							</p>
							<p className="text-xs text-muted-foreground">
								Choose a row to view details, attachments, and activity.
							</p>
						</div>
					)}
				</aside>
			</div>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Add note</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Textarea
							value={newBody}
							onChange={(e) => setNewBody(e.target.value)}
							placeholder="Write a vendor note…"
							rows={5}
							className="resize-y"
						/>
						<label className="flex items-center gap-2 text-sm text-muted-foreground">
							<input
								type="checkbox"
								checked={newPinned}
								onChange={(e) => setNewPinned(e.target.checked)}
								className="size-4 rounded border-border"
							/>
							Pin this note
						</label>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setCreateOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={createNoteMutation.isPending}
							onClick={() => void handleCreateNote()}
						>
							{createNoteMutation.isPending ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : null}
							Save note
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}

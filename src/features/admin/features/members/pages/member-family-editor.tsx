"use client";

import { useMemo, useRef, useState } from "react";

import {
	ArrowRightLeft,
	Eye,
	Pencil,
	Plus,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	RecordFormChoice,
	RecordFormField,
	RecordFormRow,
	RecordFormSection,
} from "@/components/ui/record-form";
import { createMemberFamilyLink } from "@/features/admin/features/members/feature/api/membersApi";
import {
	useCreateMemberMutation,
	useDeleteMemberFamilyLinkMutation,
	useMemberDetailQuery,
	useMemberFamilyLinkQuery,
	useMemberFamilyLinksQuery,
	useMemberSummariesPageQuery,
	useSyncMemberFamilyLinksMutation,
	useTransferMemberFamilyLinkMutation,
	useUpdateMemberFamilyLinkMutation,
	useUpdateMemberMutation,
} from "@/features/admin/features/members/feature/queries/useMembersQuery";
import type { MemberSummary } from "@/features/admin/features/members/mock-data";
import { memberAge } from "@/features/admin/features/members/mock-data";
import { isMembersMockEnabled } from "@/lib/mock-mode";
import { cn } from "@/lib/utils";

const fieldClass = "h-8 w-full bg-background text-sm";

const REL_PRESETS = [
	{ code: "18", label: "Self" },
	{ code: "01", label: "Spouse" },
	{ code: "19", label: "Child" },
	{ code: "34", label: "Other" },
] as const;

type FamilySubTab = "list" | "add";
type AddMode = "pick" | "create";

function autoCardholder(subscriberCardholderId: string) {
	const base =
		(subscriberCardholderId || "DEP")
			.replace(/[^A-Za-z0-9]/g, "")
			.slice(0, 12) || "DEP";
	const suffix = Date.now().toString(36).slice(-5).toUpperCase();
	return `${base}-D${suffix}`.slice(0, 32);
}

function SectionShell({
	title,
	action,
	children,
	className,
}: {
	title?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-md border border-border/70 bg-card",
				className
			)}
		>
			{title || action ? (
				<div
					className={cn(
						"flex items-center gap-2 border-b border-border/40 px-3.5 py-2",
						className?.includes("shadow-none") ? "bg-background" : "bg-muted/10"
					)}
				>
					{title ? (
						<h3 className="min-w-0 flex-1 text-[13px] font-semibold tracking-tight">
							{title}
						</h3>
					) : (
						<span className="flex-1" />
					)}
					{action}
				</div>
			) : null}
			<div className="p-3.5">{children}</div>
		</section>
	);
}

/** Staged dependent before the primary member exists (create page). */
export type PendingFamilyDependent = {
	key: string;
	kind: "create" | "link";
	dependentId?: string;
	firstName: string;
	lastName: string;
	cardholderId: string;
	relationshipCode: string;
	relationshipLabel: string;
};

export type MemberFamilyDraftHandle = {
	/** Include in-progress add form row if filled; returns full pending list. */
	flush: () => PendingFamilyDependent[];
};

/**
 * Draft family UI for **Add member** — stages dependents locally.
 * Primary create then creates/links them on submit.
 */
export function MemberFamilyDraftEditor({
	vendorId,
	subscriberCardholderId,
	value,
	onChange,
	flushRef,
	variant = "default",
}: {
	vendorId?: string;
	subscriberCardholderId?: string;
	value: PendingFamilyDependent[];
	onChange: (next: PendingFamilyDependent[]) => void;
	flushRef?: React.MutableRefObject<MemberFamilyDraftHandle | null>;
	/** Cleaner neutral layout for the create-member wizard. */
	variant?: "default" | "wizard";
}) {
	const isWizard = variant === "wizard";
	const [subTab, setSubTab] = useState<FamilySubTab>(
		value.length > 0 ? "list" : "add"
	);
	const [addMode, setAddMode] = useState<AddMode>("create");
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<MemberSummary | null>(null);
	const [newFirstName, setNewFirstName] = useState("");
	const [newLastName, setNewLastName] = useState("");
	const [newCardholder, setNewCardholder] = useState("");
	const [relationshipCode, setRelationshipCode] = useState("19");
	const [relationshipLabel, setRelationshipLabel] = useState("Child");

	const q = search.trim();
	const browseFilters = useMemo(() => {
		const base: {
			limit: number;
			offset: number;
			vendor_id?: string;
			search?: string;
		} = { limit: 12, offset: 0 };
		if (vendorId) base.vendor_id = vendorId;
		if (q.length >= 1) base.search = q;
		return base;
	}, [vendorId, q]);

	const browseEnabled =
		!isMembersMockEnabled() && subTab === "add" && addMode === "pick";
	const browseQ = useMemberSummariesPageQuery(browseFilters, browseEnabled);

	const linkedIds = useMemo(() => {
		const ids = new Set<string>();
		for (const row of value) {
			if (row.dependentId) ids.add(row.dependentId);
		}
		return ids;
	}, [value]);

	const candidates = useMemo(() => {
		const rows = browseQ.data?.results ?? [];
		return rows.filter((m) => !linkedIds.has(m.id));
	}, [browseQ.data, linkedIds]);

	function applyPreset(code: string, label: string) {
		setRelationshipCode(code);
		setRelationshipLabel(label);
	}

	function resetAddForm() {
		setSelected(null);
		setSearch("");
		setNewFirstName("");
		setNewLastName("");
		setNewCardholder("");
	}

	function buildCreatePending(): PendingFamilyDependent | null {
		const first = newFirstName.trim();
		const last = newLastName.trim();
		if (!first || !last) return null;
		const cardholder =
			newCardholder.trim() || autoCardholder(subscriberCardholderId || "NEW");
		return {
			key: `create-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			kind: "create",
			firstName: first,
			lastName: last,
			cardholderId: cardholder,
			relationshipCode,
			relationshipLabel,
		};
	}

	function buildPickPending(): PendingFamilyDependent | null {
		if (!selected) return null;
		return {
			key: `link-${selected.id}`,
			kind: "link",
			dependentId: selected.id,
			firstName: selected.firstName || "",
			lastName: selected.lastName || "",
			cardholderId: selected.memberId || "",
			relationshipCode,
			relationshipLabel,
		};
	}

	if (flushRef) {
		flushRef.current = {
			flush: () => {
				let next = value;
				if (addMode === "create") {
					const row = buildCreatePending();
					if (row) {
						next = [...value, row];
						onChange(next);
						resetAddForm();
					}
				} else {
					const row = buildPickPending();
					if (row && !value.some((d) => d.dependentId === row.dependentId)) {
						next = [...value, row];
						onChange(next);
						resetAddForm();
					}
				}
				return next;
			},
		};
	}

	function stageCreate() {
		const row = buildCreatePending();
		if (!row) {
			toast.error("First and last name required");
			return;
		}
		onChange([...value, row]);
		toast.success(`Staged ${row.firstName} ${row.lastName}`);
		resetAddForm();
		setSubTab("list");
	}

	function stagePick() {
		const row = buildPickPending();
		if (!row) {
			toast.error("Select a member from the list");
			return;
		}
		onChange([...value, row]);
		toast.success("Staged existing member");
		resetAddForm();
		setSubTab("list");
	}

	if (isMembersMockEnabled()) {
		return (
			<SectionShell title="Family members">
				<p className="text-sm text-muted-foreground">
					Family dependents need live vendor-core (mock off).
				</p>
			</SectionShell>
		);
	}

	return (
		<div className={cn("space-y-3", isWizard && "space-y-5")}>
			<div className="flex flex-wrap items-center gap-2">
				<div
					className={cn(
						"inline-flex rounded-md border p-0.5",
						isWizard
							? "border-border/50 bg-background"
							: "border-border/70 bg-muted/20"
					)}
				>
					<button
						type="button"
						className={cn(
							"inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
							subTab === "list"
								? isWizard
									? "bg-muted text-foreground"
									: "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						)}
						onClick={() => setSubTab("list")}
					>
						<Users className="size-3.5" />
						Family members
						<span
							className={cn(
								"rounded-sm px-1.5 py-px text-[10px] tabular-nums",
								isWizard ? "bg-background text-muted-foreground" : "bg-muted"
							)}
						>
							{value.length}
						</span>
					</button>
					<button
						type="button"
						className={cn(
							"inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
							subTab === "add"
								? isWizard
									? "bg-muted text-foreground"
									: "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						)}
						onClick={() => setSubTab("add")}
					>
						<UserPlus className="size-3.5" />
						Add dependent
					</button>
				</div>
				<p className="text-xs text-muted-foreground sm:ml-auto">
					{isWizard
						? "Optional — linked after create"
						: "Staged until member is created"}
				</p>
			</div>

			{subTab === "list" ? (
				<SectionShell
					title={isWizard ? undefined : "Family members"}
					className={
						isWizard
							? "rounded-lg border-border/50 bg-background shadow-none"
							: undefined
					}
					action={
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="h-7 text-xs"
							onClick={() => setSubTab("add")}
						>
							<Plus className="mr-1 size-3.5" />
							Add
						</Button>
					}
				>
					{value.length === 0 ? (
						<div
							className={cn(
								"px-4 py-8 text-center",
								isWizard
									? "rounded-lg border border-border/50"
									: "rounded-md border border-dashed border-border/70"
							)}
						>
							{isWizard ? (
								<div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-border/60 bg-muted/20">
									<Users className="size-4 text-muted-foreground" />
								</div>
							) : null}
							<p className="text-sm text-muted-foreground">
								{isWizard
									? "No dependents added yet."
									: "No dependents staged yet."}
							</p>
							<Button
								type="button"
								size="sm"
								variant={isWizard ? "outline" : "default"}
								className="mt-3"
								onClick={() => setSubTab("add")}
							>
								Add dependent
							</Button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border/50 text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
										<th className="px-2 py-2">Name</th>
										<th className="px-2 py-2">Cardholder</th>
										<th className="px-2 py-2">Relationship</th>
										<th className="px-2 py-2">Source</th>
										<th className="px-2 py-2 text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{value.map((row) => (
										<tr
											key={row.key}
											className="border-b border-border/30 last:border-0"
										>
											<td className="px-2 py-2.5 font-medium">
												{[row.firstName, row.lastName]
													.filter(Boolean)
													.join(" ") || "—"}
											</td>
											<td className="px-2 py-2.5 font-mono text-xs">
												{row.cardholderId || "—"}
											</td>
											<td className="px-2 py-2.5">
												{row.relationshipLabel}
												<span className="ml-1 text-xs text-muted-foreground">
													({row.relationshipCode})
												</span>
											</td>
											<td className="px-2 py-2.5 capitalize text-muted-foreground">
												{row.kind === "create" ? "New" : "Existing"}
											</td>
											<td className="px-2 py-2.5">
												<div className="flex justify-end">
													<Button
														type="button"
														size="icon"
														variant="ghost"
														className="size-7 text-destructive"
														title="Remove"
														onClick={() =>
															onChange(value.filter((d) => d.key !== row.key))
														}
													>
														<Trash2 className="size-3.5" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</SectionShell>
			) : isWizard ? (
				<div className="space-y-6">
					<div className="inline-flex rounded-md border border-border/50 bg-background p-0.5">
						<button
							type="button"
							className={cn(
								"rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
								addMode === "create"
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:text-foreground"
							)}
							onClick={() => setAddMode("create")}
						>
							Create new
						</button>
						<button
							type="button"
							className={cn(
								"rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
								addMode === "pick"
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:text-foreground"
							)}
							onClick={() => setAddMode("pick")}
						>
							Link existing
						</button>
					</div>

					<div className="space-y-3">
						<p className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
							Relationship
						</p>
						<div className="flex flex-wrap gap-2">
							{REL_PRESETS.map((preset) => (
								<button
									key={preset.code}
									type="button"
									onClick={() => applyPreset(preset.code, preset.label)}
									className={cn(
										"rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
										relationshipCode === preset.code
											? "border-foreground bg-foreground text-background"
											: "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground"
									)}
								>
									{preset.label}
									<span className="ml-1 font-mono text-[10px] opacity-70">
										{preset.code}
									</span>
								</button>
							))}
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="grid gap-1.5">
								<span className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
									Rel. code
								</span>
								<Input
									className="h-11 font-mono"
									value={relationshipCode}
									onChange={(e) => setRelationshipCode(e.target.value)}
								/>
							</label>
							<label className="grid gap-1.5">
								<span className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
									Rel. label
								</span>
								<Input
									className="h-11"
									value={relationshipLabel}
									onChange={(e) => setRelationshipLabel(e.target.value)}
								/>
							</label>
						</div>
					</div>

					{addMode === "create" ? (
						<div className="rounded-lg border border-border/50 p-4 sm:p-5">
							<p className="text-sm font-medium text-foreground">
								New dependent
							</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Created and linked when you finish the wizard.
							</p>
							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								<label className="grid gap-1.5">
									<span className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
										First name
									</span>
									<Input
										className="h-11"
										value={newFirstName}
										onChange={(e) => setNewFirstName(e.target.value)}
									/>
								</label>
								<label className="grid gap-1.5">
									<span className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
										Last name
									</span>
									<Input
										className="h-11"
										value={newLastName}
										onChange={(e) => setNewLastName(e.target.value)}
									/>
								</label>
								<label className="grid gap-1.5 sm:col-span-2">
									<span className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
										Cardholder ID
									</span>
									<Input
										className="h-11 font-mono"
										value={newCardholder}
										onChange={(e) => setNewCardholder(e.target.value)}
										placeholder="Auto-generated if empty"
									/>
								</label>
							</div>
						</div>
					) : (
						<div className="rounded-lg border border-border/50 p-4 sm:p-5">
							<p className="text-sm font-medium text-foreground">
								Link existing member
							</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Search the directory and stage a match.
							</p>
							<div className="mt-4 space-y-3">
								{!vendorId ? (
									<p className="text-xs text-destructive">
										Select a vendor on the Account step first.
									</p>
								) : null}
								<Input
									className="h-11"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setSelected(null);
									}}
									placeholder="Name or cardholder ID…"
									disabled={!vendorId}
								/>
								{selected ? (
									<div className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 px-3 py-2 text-sm">
										<span className="font-medium">
											{[selected.firstName, selected.lastName]
												.filter(Boolean)
												.join(" ")}
										</span>
										<span className="font-mono text-xs text-muted-foreground">
											{selected.memberId}
										</span>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="ml-auto h-7 text-xs"
											onClick={() => setSelected(null)}
										>
											Clear
										</Button>
									</div>
								) : null}
								<div className="max-h-52 overflow-auto rounded-md border border-border/50">
									{!vendorId ? (
										<p className="px-3 py-3 text-xs text-muted-foreground">
											Vendor required.
										</p>
									) : browseQ.isLoading ? (
										<p className="px-3 py-3 text-xs text-muted-foreground">
											Loading…
										</p>
									) : candidates.length === 0 ? (
										<p className="px-3 py-3 text-xs text-muted-foreground">
											No match. Try Create new instead.
										</p>
									) : (
										<ul className="divide-y divide-border/40 text-sm">
											{candidates.map((m) => {
												const name = [m.firstName, m.lastName]
													.filter(Boolean)
													.join(" ");
												const active = selected?.id === m.id;
												return (
													<li key={m.id}>
														<button
															type="button"
															className={cn(
																"flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
																active && "bg-muted/50"
															)}
															onClick={() => setSelected(m)}
														>
															<span className="min-w-0 flex-1 truncate font-medium">
																{name}
															</span>
															<span className="shrink-0 font-mono text-[10px] text-muted-foreground">
																{m.memberId}
															</span>
														</button>
													</li>
												);
											})}
										</ul>
									)}
								</div>
							</div>
						</div>
					)}

					<div className="flex justify-end gap-2 border-t border-border/40 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setSubTab("list")}
						>
							Cancel
						</Button>
						{addMode === "create" ? (
							<Button
								type="button"
								disabled={!newFirstName.trim() || !newLastName.trim()}
								onClick={stageCreate}
							>
								<UserPlus className="mr-1 size-3.5" />
								Add to list
							</Button>
						) : (
							<Button
								type="button"
								disabled={!selected || !vendorId}
								onClick={stagePick}
							>
								<Plus className="mr-1 size-3.5" />
								Add to list
							</Button>
						)}
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<div className="inline-flex rounded-md border border-border/70 bg-muted/20 p-0.5">
						<button
							type="button"
							className={cn(
								"rounded-sm px-3 py-1.5 text-xs font-medium",
								addMode === "create"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
							onClick={() => setAddMode("create")}
						>
							Create new
						</button>
						<button
							type="button"
							className={cn(
								"rounded-sm px-3 py-1.5 text-xs font-medium",
								addMode === "pick"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
							onClick={() => setAddMode("pick")}
						>
							Link existing
						</button>
					</div>

					<RecordFormSection>
						<RecordFormRow>
							<RecordFormField label="Type">
								<RecordFormChoice
									tone="primary"
									value={relationshipCode}
									onChange={(code) => {
										const preset = REL_PRESETS.find((p) => p.code === code);
										applyPreset(code, preset?.label ?? relationshipLabel);
									}}
									options={REL_PRESETS.map((p) => ({
										value: p.code,
										label: `${p.label} (${p.code})`,
									}))}
								/>
							</RecordFormField>
						</RecordFormRow>
						<RecordFormRow>
							<RecordFormField label="Rel. code">
								<Input
									className={fieldClass}
									value={relationshipCode}
									onChange={(e) => setRelationshipCode(e.target.value)}
								/>
							</RecordFormField>
							<RecordFormField label="Rel. label">
								<Input
									className={fieldClass}
									value={relationshipLabel}
									onChange={(e) => setRelationshipLabel(e.target.value)}
								/>
							</RecordFormField>
						</RecordFormRow>
					</RecordFormSection>

					{addMode === "create" ? (
						<RecordFormSection
							title="New dependent"
							description="Staged now — created and linked when you create the member."
						>
							<RecordFormRow>
								<RecordFormField label="First name">
									<Input
										className={fieldClass}
										value={newFirstName}
										onChange={(e) => setNewFirstName(e.target.value)}
									/>
								</RecordFormField>
							</RecordFormRow>
							<RecordFormRow>
								<RecordFormField label="Last name">
									<Input
										className={fieldClass}
										value={newLastName}
										onChange={(e) => setNewLastName(e.target.value)}
									/>
								</RecordFormField>
							</RecordFormRow>
							<RecordFormRow>
								<RecordFormField label="Cardholder ID">
									<Input
										className={fieldClass}
										value={newCardholder}
										onChange={(e) => setNewCardholder(e.target.value)}
										placeholder="Auto-generated if empty"
									/>
								</RecordFormField>
							</RecordFormRow>
						</RecordFormSection>
					) : (
						<RecordFormSection
							title="Link existing member"
							description="Search and select — staged until member create."
						>
							<RecordFormRow>
								<RecordFormField label="Search" align="start">
									<div className="w-full space-y-2">
										{!vendorId ? (
											<p className="text-xs text-destructive">
												Select a vendor first to search members.
											</p>
										) : null}
										<Input
											className={fieldClass}
											value={search}
											onChange={(e) => {
												setSearch(e.target.value);
												setSelected(null);
											}}
											placeholder="Name or cardholder ID…"
											disabled={!vendorId}
										/>
										{selected ? (
											<div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5 text-sm">
												<span className="font-medium">
													{[selected.firstName, selected.lastName]
														.filter(Boolean)
														.join(" ")}
												</span>
												<span className="font-mono text-xs text-muted-foreground">
													{selected.memberId}
												</span>
												<Button
													type="button"
													size="sm"
													variant="ghost"
													className="h-6 text-xs"
													onClick={() => setSelected(null)}
												>
													Clear
												</Button>
											</div>
										) : null}
										<div className="max-h-48 overflow-auto rounded-md border border-border/60">
											{!vendorId ? (
												<p className="px-3 py-2 text-xs text-muted-foreground">
													Vendor required.
												</p>
											) : browseQ.isLoading ? (
												<p className="px-3 py-2 text-xs text-muted-foreground">
													Loading…
												</p>
											) : candidates.length === 0 ? (
												<p className="px-3 py-2 text-xs text-muted-foreground">
													No match. Try Create new instead.
												</p>
											) : (
												<ul className="divide-y divide-border/40 text-sm">
													{candidates.map((m) => {
														const name = [m.firstName, m.lastName]
															.filter(Boolean)
															.join(" ");
														const active = selected?.id === m.id;
														return (
															<li key={m.id}>
																<button
																	type="button"
																	className={cn(
																		"flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/40",
																		active && "bg-muted/60"
																	)}
																	onClick={() => setSelected(m)}
																>
																	<span className="min-w-0 flex-1 truncate font-medium">
																		{name}
																	</span>
																	<span className="shrink-0 font-mono text-[10px] text-muted-foreground">
																		{m.memberId}
																	</span>
																</button>
															</li>
														);
													})}
												</ul>
											)}
										</div>
									</div>
								</RecordFormField>
							</RecordFormRow>
						</RecordFormSection>
					)}

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setSubTab("list")}
						>
							Cancel
						</Button>
						{addMode === "create" ? (
							<Button
								type="button"
								disabled={!newFirstName.trim() || !newLastName.trim()}
								onClick={stageCreate}
							>
								<UserPlus className="mr-1 size-3.5" />
								Stage dependent
							</Button>
						) : (
							<Button
								type="button"
								disabled={!selected || !vendorId}
								onClick={stagePick}
							>
								<Plus className="mr-1 size-3.5" />
								Stage selected
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export type MemberFamilyLiveHandle = {
	/** Create/link in-progress dependent form if filled (Edit tab Save). */
	flushAndLink: () => Promise<void>;
};

/**
 * Family / Dependents: isolated **Family members** vs **Add dependent** tabs.
 * One members table only (no separate “roster”).
 */
export function MemberFamilyEditor({
	memberId,
	vendorId,
	subscriberCardholderId,
	planName,
	program,
	showSync = true,
	defaultSubTab = "list",
	flushRef,
}: {
	memberId: string;
	vendorId?: string;
	subscriberCardholderId?: string;
	planName?: string;
	program?: string;
	showSync?: boolean;
	defaultSubTab?: FamilySubTab;
	flushRef?: React.MutableRefObject<MemberFamilyLiveHandle | null>;
}) {
	const enabled = Boolean(memberId) && !isMembersMockEnabled();
	const detailQ = useMemberDetailQuery(memberId, enabled && !vendorId);
	const resolvedVendorId = vendorId || detailQ.data?.vendorId || undefined;
	const linksQ = useMemberFamilyLinksQuery(memberId, enabled);
	const createMember = useCreateMemberMutation();
	const updateLink = useUpdateMemberFamilyLinkMutation(memberId);
	const updateMember = useUpdateMemberMutation();
	const transfer = useTransferMemberFamilyLinkMutation(memberId);
	const remove = useDeleteMemberFamilyLinkMutation(memberId);
	const sync = useSyncMemberFamilyLinksMutation(memberId);

	const [subTab, setSubTab] = useState<FamilySubTab>(defaultSubTab);
	const [addMode, setAddMode] = useState<AddMode>("create");
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<MemberSummary | null>(null);
	const [newFirstName, setNewFirstName] = useState("");
	const [newLastName, setNewLastName] = useState("");
	const [newCardholder, setNewCardholder] = useState("");
	const [relationshipCode, setRelationshipCode] = useState("19");
	const [relationshipLabel, setRelationshipLabel] = useState("Child");
	const [editOpen, setEditOpen] = useState(false);
	const [editLinkId, setEditLinkId] = useState("");
	const [editDependentId, setEditDependentId] = useState("");
	const [editFirstName, setEditFirstName] = useState("");
	const [editLastName, setEditLastName] = useState("");
	const [editCode, setEditCode] = useState("");
	const [editLabel, setEditLabel] = useState("");
	const [editBusy, setEditBusy] = useState(false);
	const [viewOpen, setViewOpen] = useState(false);
	const [viewLinkId, setViewLinkId] = useState("");
	const [transferOpen, setTransferOpen] = useState(false);
	const [transferLinkId, setTransferLinkId] = useState("");
	const [newSubscriberId, setNewSubscriberId] = useState("");
	const [busy, setBusy] = useState(false);

	const viewDetailQ = useMemberFamilyLinkQuery(
		memberId,
		viewLinkId,
		viewOpen && Boolean(viewLinkId)
	);
	const viewDetail = viewDetailQ.data;

	const q = search.trim();
	const browseFilters = useMemo(() => {
		const base: {
			limit: number;
			offset: number;
			vendor_id?: string;
			search?: string;
		} = { limit: 12, offset: 0 };
		if (resolvedVendorId) base.vendor_id = resolvedVendorId;
		if (q.length >= 1) base.search = q;
		return base;
	}, [resolvedVendorId, q]);

	const browseQ = useMemberSummariesPageQuery(
		browseFilters,
		enabled && subTab === "add" && addMode === "pick"
	);

	const links = linksQ.data ?? [];
	const linkedDependentIds = useMemo(() => {
		const ids = new Set<string>();
		for (const row of links) {
			if (row.dependentId) ids.add(row.dependentId);
			ids.add(row.id);
		}
		return ids;
	}, [links]);

	const candidates = useMemo(() => {
		const rows = browseQ.data?.results ?? [];
		return rows.filter(
			(m) => m.id !== memberId && !linkedDependentIds.has(m.id)
		);
	}, [browseQ.data, memberId, linkedDependentIds]);

	const activeCovered = links.filter(
		(d) => d.coverageStatus === "active"
	).length;
	const childrenCount = links.filter(
		(d) =>
			d.relationship === "Daughter" ||
			d.relationship === "Son" ||
			(d.relationshipLabel || "").toLowerCase().includes("child") ||
			d.relationshipCode === "19"
	).length;

	function applyPreset(code: string, label: string) {
		setRelationshipCode(code);
		setRelationshipLabel(label);
	}

	function resetAddForm() {
		setSelected(null);
		setSearch("");
		setNewFirstName("");
		setNewLastName("");
		setNewCardholder("");
	}

	function afterLinkSuccess() {
		toast.success("Dependent linked");
		resetAddForm();
		setSubTab("list");
	}

	function linkDependent(dependentId: string) {
		void (async () => {
			try {
				await createMemberFamilyLink(memberId, {
					dependent_id: dependentId,
					relationship_code: relationshipCode,
					relationship_label: relationshipLabel,
				});
				await linksQ.refetch();
				afterLinkSuccess();
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Link failed");
			}
		})();
	}

	function submitPick() {
		if (!selected) {
			toast.error("Select a member from the list");
			return;
		}
		linkDependent(selected.id);
	}

	async function submitCreateNew() {
		if (!resolvedVendorId) {
			throw new Error("Member has no vendor — cannot create dependent");
		}
		const first = newFirstName.trim();
		const last = newLastName.trim();
		if (!first || !last) {
			throw new Error("First and last name required");
		}
		const cardholder =
			newCardholder.trim() ||
			autoCardholder(subscriberCardholderId || memberId);
		setBusy(true);
		try {
			const created = await createMember.mutateAsync({
				vendor_id: resolvedVendorId,
				cardholder_id: cardholder,
				person_code: "02",
				first_name: first,
				last_name: last,
				status: "active",
				relationship_code: relationshipCode,
				demographics: {},
				eligibility: { status: "active" },
				plan_coverage: {},
				employment_group: {},
			});
			const dependentId = created?.id?.trim();
			if (!dependentId) {
				throw new Error("Member created but no id returned — link skipped");
			}
			await createMemberFamilyLink(memberId, {
				dependent_id: dependentId,
				relationship_code: relationshipCode,
				relationship_label: relationshipLabel,
			});
			await linksQ.refetch();
			toast.success(`Created ${first} ${last} and linked`);
			resetAddForm();
			setSubTab("list");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Create failed");
			throw err;
		} finally {
			setBusy(false);
		}
	}

	if (flushRef) {
		flushRef.current = {
			flushAndLink: async () => {
				if (addMode === "create" && newFirstName.trim() && newLastName.trim()) {
					await submitCreateNew();
					return;
				}
				if (addMode === "pick" && selected?.id) {
					await createMemberFamilyLink(memberId, {
						dependent_id: selected.id,
						relationship_code: relationshipCode,
						relationship_label: relationshipLabel,
					});
					await linksQ.refetch();
					afterLinkSuccess();
				}
			},
		};
	}

	if (isMembersMockEnabled()) {
		return (
			<SectionShell title="Family members">
				<p className="text-sm text-muted-foreground">
					Family link create/update needs live vendor-core (mock off).
				</p>
			</SectionShell>
		);
	}

	const pending = createMember.isPending || busy;

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="inline-flex rounded-md border border-border/70 bg-muted/20 p-0.5">
					<button
						type="button"
						className={cn(
							"inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
							subTab === "list"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						)}
						onClick={() => setSubTab("list")}
					>
						<Users className="size-3.5" />
						Family members
						<span className="rounded-sm bg-muted px-1.5 py-px text-[10px] tabular-nums">
							{links.length}
						</span>
					</button>
					<button
						type="button"
						className={cn(
							"inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
							subTab === "add"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						)}
						onClick={() => setSubTab("add")}
					>
						<UserPlus className="size-3.5" />
						Add dependent
					</button>
				</div>
				{showSync && subTab === "list" ? (
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="ml-auto"
						disabled={sync.isPending}
						onClick={() =>
							sync.mutate(undefined, {
								onSuccess: () => toast.success("Family links synced"),
								onError: (err) =>
									toast.error(
										err instanceof Error ? err.message : "Sync failed"
									),
							})
						}
					>
						Sync from source
					</Button>
				) : null}
			</div>

			{subTab === "list" ? (
				<div className="space-y-3">
					<SectionShell>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
							{[
								{ label: "Household size", value: String(links.length) },
								{ label: "Active covered", value: String(activeCovered) },
								{ label: "Children", value: String(childrenCount) },
								{ label: "Shared plan", value: planName || "—" },
								{ label: "Program", value: program || "—" },
								{
									label: "As of",
									value: "Live links",
								},
							].map((item) => (
								<div key={item.label} className="min-w-0">
									<p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
										{item.label}
									</p>
									<p className="mt-1 truncate text-xs font-semibold">
										{item.value}
									</p>
								</div>
							))}
						</div>
					</SectionShell>

					<SectionShell
						title="Family members"
						action={
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="h-7 text-xs"
								onClick={() => setSubTab("add")}
							>
								<Plus className="mr-1 size-3.5" />
								Add
							</Button>
						}
					>
						{linksQ.isLoading ? (
							<p className="text-sm text-muted-foreground">Loading…</p>
						) : linksQ.error ? (
							<p className="text-sm text-destructive">{linksQ.error.message}</p>
						) : links.length === 0 ? (
							<div className="rounded-md border border-dashed border-border/70 px-4 py-8 text-center">
								<p className="text-sm text-muted-foreground">
									No dependents linked yet.
								</p>
								<Button
									type="button"
									size="sm"
									className="mt-3"
									onClick={() => setSubTab("add")}
								>
									Add dependent
								</Button>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border/50 text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
											<th className="px-2 py-2">Name</th>
											<th className="px-2 py-2">Cardholder</th>
											<th className="px-2 py-2">Relationship</th>
											<th className="px-2 py-2">Age</th>
											<th className="px-2 py-2">Status</th>
											<th className="px-2 py-2 text-right">Actions</th>
										</tr>
									</thead>
									<tbody>
										{links.map((row) => {
											const age = memberAge(row.dob);
											return (
												<tr
													key={row.id}
													className="border-b border-border/30 last:border-0"
												>
													<td className="px-2 py-2.5 font-medium">
														{row.name}
													</td>
													<td className="px-2 py-2.5 font-mono text-xs">
														{row.memberId ?? "—"}
													</td>
													<td className="px-2 py-2.5">
														{row.relationshipLabel || row.relationship}
														{row.relationshipCode ? (
															<span className="ml-1 text-xs text-muted-foreground">
																({row.relationshipCode})
															</span>
														) : null}
													</td>
													<td className="px-2 py-2.5 tabular-nums">
														{age != null ? age : "—"}
													</td>
													<td className="px-2 py-2.5 capitalize">
														{row.coverageStatus}
													</td>
													<td className="px-2 py-2.5">
														<div className="flex justify-end gap-0.5">
															<Button
																type="button"
																size="icon"
																variant="ghost"
																className="size-7"
																title="View family link"
																onClick={() => {
																	setViewLinkId(row.id);
																	setViewOpen(true);
																}}
															>
																<Eye className="size-3.5" />
															</Button>
															<Button
																type="button"
																size="icon"
																variant="ghost"
																className="size-7"
																title="Edit dependent"
																onClick={() => {
																	const parts = row.name
																		.split(/\s+/)
																		.filter(Boolean);
																	setEditLinkId(row.id);
																	setEditDependentId(row.dependentId ?? "");
																	setEditFirstName(parts[0] ?? "");
																	setEditLastName(parts.slice(1).join(" "));
																	setEditCode(
																		row.relationshipCode ||
																			String(row.relationship)
																	);
																	setEditLabel(
																		row.relationshipLabel ||
																			String(row.relationship)
																	);
																	setEditOpen(true);
																}}
															>
																<Pencil className="size-3.5" />
															</Button>
															<Button
																type="button"
																size="icon"
																variant="ghost"
																className="size-7"
																title="Transfer"
																onClick={() => {
																	setTransferLinkId(row.id);
																	setNewSubscriberId("");
																	setTransferOpen(true);
																}}
															>
																<ArrowRightLeft className="size-3.5" />
															</Button>
															<Button
																type="button"
																size="icon"
																variant="ghost"
																className="size-7 text-destructive"
																title="Remove"
																disabled={remove.isPending}
																onClick={() => {
																	if (
																		!window.confirm("Remove this family link?")
																	)
																		return;
																	remove.mutate(row.id, {
																		onSuccess: () => toast.success("Removed"),
																		onError: (err) =>
																			toast.error(
																				err instanceof Error
																					? err.message
																					: "Delete failed"
																			),
																	});
																}}
															>
																<Trash2 className="size-3.5" />
															</Button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</SectionShell>
				</div>
			) : (
				<div className="space-y-5">
					<div className="inline-flex rounded-md border border-border/70 bg-muted/20 p-0.5">
						<button
							type="button"
							className={cn(
								"rounded-sm px-3 py-1.5 text-xs font-medium",
								addMode === "create"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
							onClick={() => setAddMode("create")}
						>
							Create new
						</button>
						<button
							type="button"
							className={cn(
								"rounded-sm px-3 py-1.5 text-xs font-medium",
								addMode === "pick"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
							onClick={() => setAddMode("pick")}
						>
							Link existing
						</button>
					</div>

					<RecordFormSection>
						<RecordFormRow>
							<RecordFormField label="Type">
								<RecordFormChoice
									tone="primary"
									value={relationshipCode}
									onChange={(code) => {
										const preset = REL_PRESETS.find((p) => p.code === code);
										applyPreset(code, preset?.label ?? relationshipLabel);
									}}
									options={REL_PRESETS.map((p) => ({
										value: p.code,
										label: `${p.label} (${p.code})`,
									}))}
								/>
							</RecordFormField>
						</RecordFormRow>
						<RecordFormRow>
							<RecordFormField label="Rel. code">
								<Input
									className={fieldClass}
									value={relationshipCode}
									onChange={(e) => setRelationshipCode(e.target.value)}
								/>
							</RecordFormField>
							<RecordFormField label="Rel. label">
								<Input
									className={fieldClass}
									value={relationshipLabel}
									onChange={(e) => setRelationshipLabel(e.target.value)}
								/>
							</RecordFormField>
						</RecordFormRow>
					</RecordFormSection>

					{addMode === "create" ? (
						<RecordFormSection
							title="New dependent"
							description="Creates a member (UUID auto-assigned) then links them. Cardholder auto-fills if blank."
						>
							<RecordFormRow>
								<RecordFormField label="First name">
									<Input
										className={fieldClass}
										value={newFirstName}
										onChange={(e) => setNewFirstName(e.target.value)}
									/>
								</RecordFormField>
								<RecordFormField label="Last name">
									<Input
										className={fieldClass}
										value={newLastName}
										onChange={(e) => setNewLastName(e.target.value)}
									/>
								</RecordFormField>
							</RecordFormRow>
							<RecordFormRow>
								<RecordFormField label="Cardholder ID">
									<Input
										className={fieldClass}
										value={newCardholder}
										onChange={(e) => setNewCardholder(e.target.value)}
										placeholder="Auto-generated if empty"
									/>
								</RecordFormField>
							</RecordFormRow>
							{!resolvedVendorId ? (
								<div className="border-t border-border/60 px-3 py-2 text-xs text-destructive">
									This member has no vendor_id — create needs a live member
									record.
								</div>
							) : null}
						</RecordFormSection>
					) : (
						<RecordFormSection
							title="Link existing member"
							description="Search and select — no UUID typing."
						>
							<RecordFormRow>
								<RecordFormField label="Search" align="start">
									<div className="w-full space-y-2">
										<Input
											className={fieldClass}
											value={search}
											onChange={(e) => {
												setSearch(e.target.value);
												setSelected(null);
											}}
											placeholder="Name or cardholder ID…"
										/>
										{selected ? (
											<div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5 text-sm">
												<span className="font-medium">
													{[selected.firstName, selected.lastName]
														.filter(Boolean)
														.join(" ")}
												</span>
												<span className="font-mono text-xs text-muted-foreground">
													{selected.memberId}
												</span>
												<Button
													type="button"
													size="sm"
													variant="ghost"
													className="h-6 text-xs"
													onClick={() => setSelected(null)}
												>
													Clear
												</Button>
											</div>
										) : null}
										<div className="max-h-48 overflow-auto rounded-md border border-border/60">
											{browseQ.isLoading ? (
												<p className="px-3 py-2 text-xs text-muted-foreground">
													Loading…
												</p>
											) : candidates.length === 0 ? (
												<p className="px-3 py-2 text-xs text-muted-foreground">
													No match. Try Create new instead.
												</p>
											) : (
												<ul className="divide-y divide-border/40 text-sm">
													{candidates.map((m) => {
														const name = [m.firstName, m.lastName]
															.filter(Boolean)
															.join(" ");
														const active = selected?.id === m.id;
														return (
															<li key={m.id}>
																<button
																	type="button"
																	className={cn(
																		"flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/40",
																		active && "bg-muted/60"
																	)}
																	onClick={() => setSelected(m)}
																>
																	<span className="min-w-0 flex-1 truncate font-medium">
																		{name}
																	</span>
																	<span className="shrink-0 font-mono text-[10px] text-muted-foreground">
																		{m.memberId}
																	</span>
																</button>
															</li>
														);
													})}
												</ul>
											)}
										</div>
									</div>
								</RecordFormField>
							</RecordFormRow>
						</RecordFormSection>
					)}

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setSubTab("list")}
						>
							Cancel
						</Button>
						{addMode === "create" ? (
							<Button
								type="button"
								disabled={
									pending ||
									!resolvedVendorId ||
									!newFirstName.trim() ||
									!newLastName.trim()
								}
								onClick={() => void submitCreateNew().catch(() => undefined)}
							>
								<UserPlus className="mr-1 size-3.5" />
								Create &amp; link
							</Button>
						) : (
							<Button
								type="button"
								disabled={pending || !selected}
								onClick={submitPick}
							>
								<Plus className="mr-1 size-3.5" />
								Link selected
							</Button>
						)}
					</div>
				</div>
			)}

			<Dialog open={viewOpen} onOpenChange={setViewOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Family link detail</DialogTitle>
					</DialogHeader>
					{viewDetailQ.isLoading ? (
						<p className="text-sm text-muted-foreground">Loading…</p>
					) : viewDetailQ.error ? (
						<p className="text-sm text-destructive">
							{viewDetailQ.error.message}
						</p>
					) : viewDetail ? (
						<div className="space-y-2 text-sm">
							<div className="grid grid-cols-[8rem_1fr] gap-x-2 gap-y-1.5">
								<span className="text-muted-foreground">Link ID</span>
								<span className="font-mono text-xs break-all">
									{viewDetail.id}
								</span>
								<span className="text-muted-foreground">Subscriber</span>
								<span className="font-mono text-xs break-all">
									{viewDetail.subscriberId}
								</span>
								<span className="text-muted-foreground">Dependent</span>
								<span className="font-mono text-xs break-all">
									{viewDetail.dependentId}
								</span>
								<span className="text-muted-foreground">Name</span>
								<span>
									{[viewDetail.dependentFirstName, viewDetail.dependentLastName]
										.filter(Boolean)
										.join(" ") || "—"}
								</span>
								<span className="text-muted-foreground">Cardholder</span>
								<span className="font-mono text-xs">
									{viewDetail.dependentCardholderId || "—"}
								</span>
								<span className="text-muted-foreground">Status</span>
								<span className="capitalize">
									{viewDetail.dependentStatus || "—"}
								</span>
								<span className="text-muted-foreground">Rel. code</span>
								<span>{viewDetail.relationshipCode || "—"}</span>
								<span className="text-muted-foreground">Rel. label</span>
								<span>{viewDetail.relationshipLabel || "—"}</span>
								<span className="text-muted-foreground">Created</span>
								<span>{viewDetail.createdAt}</span>
							</div>
							<div className="flex justify-end gap-2 pt-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setViewOpen(false);
										setEditLinkId(viewDetail.id);
										setEditDependentId(viewDetail.dependentId);
										setEditFirstName(viewDetail.dependentFirstName);
										setEditLastName(viewDetail.dependentLastName);
										setEditCode(viewDetail.relationshipCode);
										setEditLabel(viewDetail.relationshipLabel);
										setEditOpen(true);
									}}
								>
									Edit dependent
								</Button>
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">No detail.</p>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Edit dependent</DialogTitle>
					</DialogHeader>
					<div className="space-y-5">
						<RecordFormSection title="Name">
							<RecordFormRow>
								<RecordFormField label="First name">
									<Input
										className={fieldClass}
										value={editFirstName}
										onChange={(e) => setEditFirstName(e.target.value)}
										disabled={!editDependentId}
									/>
								</RecordFormField>
							</RecordFormRow>
							<RecordFormRow>
								<RecordFormField label="Last name">
									<Input
										className={fieldClass}
										value={editLastName}
										onChange={(e) => setEditLastName(e.target.value)}
										disabled={!editDependentId}
									/>
								</RecordFormField>
							</RecordFormRow>
							{!editDependentId ? (
								<div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
									No dependent member id on this link — name cannot be updated.
								</div>
							) : null}
						</RecordFormSection>

						<RecordFormSection title="Relationship">
							<RecordFormRow>
								<RecordFormField label="Type">
									<RecordFormChoice
										tone="primary"
										value={editCode}
										onChange={(code) => {
											const preset = REL_PRESETS.find((p) => p.code === code);
											setEditCode(code);
											if (preset) setEditLabel(preset.label);
										}}
										options={REL_PRESETS.map((p) => ({
											value: p.code,
											label: `${p.label} (${p.code})`,
										}))}
									/>
								</RecordFormField>
							</RecordFormRow>
							<RecordFormRow>
								<RecordFormField label="Rel. code">
									<Input
										className={fieldClass}
										value={editCode}
										onChange={(e) => setEditCode(e.target.value)}
									/>
								</RecordFormField>
								<RecordFormField label="Rel. label">
									<Input
										className={fieldClass}
										value={editLabel}
										onChange={(e) => setEditLabel(e.target.value)}
									/>
								</RecordFormField>
							</RecordFormRow>
						</RecordFormSection>

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								disabled={
									editBusy ||
									updateLink.isPending ||
									updateMember.isPending ||
									!editLinkId ||
									(Boolean(editDependentId) &&
										(!editFirstName.trim() || !editLastName.trim()))
								}
								onClick={() => {
									void (async () => {
										setEditBusy(true);
										try {
											if (editDependentId) {
												await updateMember.mutateAsync({
													id: editDependentId,
													body: {
														first_name: editFirstName.trim(),
														last_name: editLastName.trim(),
													},
												});
											}
											await updateLink.mutateAsync({
												linkId: editLinkId,
												body: {
													relationship_code: editCode,
													relationship_label: editLabel,
												},
											});
											toast.success("Dependent updated");
											setEditOpen(false);
										} catch (err) {
											toast.error(
												err instanceof Error ? err.message : "Update failed"
											);
										} finally {
											setEditBusy(false);
										}
									})();
								}}
							>
								Save
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={transferOpen} onOpenChange={setTransferOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Transfer family link</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<p className="text-xs text-muted-foreground">
							Move this dependent under a different subscriber member UUID.
						</p>
						<div className="space-y-1.5">
							<Label>New subscriber UUID</Label>
							<Input
								value={newSubscriberId}
								onChange={(e) => setNewSubscriberId(e.target.value)}
							/>
						</div>
						<Button
							disabled={transfer.isPending || !newSubscriberId.trim()}
							onClick={() =>
								transfer.mutate(
									{
										linkId: transferLinkId,
										body: { new_subscriber_id: newSubscriberId.trim() },
									},
									{
										onSuccess: () => {
											toast.success("Family link transferred");
											setTransferOpen(false);
										},
										onError: (err) =>
											toast.error(
												err instanceof Error ? err.message : "Transfer failed"
											),
									}
								)
							}
						>
							Transfer
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

"use client";

import { useEffect, useMemo, useState } from "react";

import { Pencil, RotateCcw, Trash2 } from "lucide-react";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useCreateMemberAccumulatorMutation,
	useCreateMemberClaimMutation,
	useCreateMemberExceptionMutation,
	useDeleteMemberAccumulatorMutation,
	useDeleteMemberClaimMutation,
	useDeleteMemberExceptionMutation,
	useDeleteMemberMutation,
	useHardDeleteMemberMutation,
	useMemberAccumulatorSummaryQuery,
	useMemberAccumulatorsQuery,
	useMemberClaimsQuery,
	useMemberEligibilityHistoryQuery,
	useMemberExceptionsQuery,
	useMemberFamilyLinksQuery,
	useMemberPlanHistoryQuery,
	useMemberSourceRecordQuery,
	useMemberSourceRecordsQuery,
	useRestoreMemberMutation,
	useUpdateMemberAccumulatorMutation,
	useUpdateMemberClaimMutation,
	useUpdateMemberExceptionMutation,
	useUpdateMemberMutation,
} from "@/features/admin/features/members/feature/queries/useMembersQuery";
import { buildAccumulatorSummaryForMember } from "@/features/admin/features/members/map-member-core";
import type { MemberDetail } from "@/features/admin/features/members/mock-data";
import { MemberWriteForm } from "@/features/admin/features/members/pages/member-write-form";
import { useRouter } from "@/i18n/navigation";
import { isMembersMockEnabled } from "@/lib/mock-mode";

type Tab =
	| "Edit"
	| "Overview"
	| "Demographics"
	| "Employment & Group"
	| "Eligibility"
	| "Coverage & Plan History"
	| "Family / Dependents"
	| "Claims & Encounters"
	| "Accumulators"
	| "Vendor / Source History"
	| "Eligibility Exceptions"
	| "Other Status"
	| "Change Events";

/**
 * Merge nested list API results into the detail payload for the active tab.
 * Detail already includes ~20-row slices; lists replace those when loaded.
 */
export function useMemberTabData(
	memberId: string,
	base: MemberDetail | undefined,
	tab: Tab,
	_claimsPane: "claims" | "encounters"
): MemberDetail | undefined {
	const useApi = !isMembersMockEnabled();
	const elig = useMemberEligibilityHistoryQuery(
		memberId,
		useApi && (tab === "Eligibility" || tab === "Overview")
	);
	const plans = useMemberPlanHistoryQuery(
		memberId,
		useApi && tab === "Coverage & Plan History"
	);
	const exceptions = useMemberExceptionsQuery(
		memberId,
		useApi && (tab === "Eligibility Exceptions" || tab === "Eligibility")
	);
	const accumulators = useMemberAccumulatorsQuery(
		memberId,
		useApi && (tab === "Accumulators" || tab === "Overview")
	);
	const accumulatorSummary = useMemberAccumulatorSummaryQuery(
		memberId,
		useApi && (tab === "Accumulators" || tab === "Overview")
	);
	const claims = useMemberClaimsQuery(
		memberId,
		undefined,
		useApi && (tab === "Claims & Encounters" || tab === "Overview")
	);
	const encounters = useMemberClaimsQuery(
		memberId,
		"encounter",
		useApi && (tab === "Claims & Encounters" || tab === "Overview")
	);
	const sources = useMemberSourceRecordsQuery(
		memberId,
		useApi && (tab === "Vendor / Source History" || tab === "Eligibility")
	);
	const familyLinks = useMemberFamilyLinksQuery(
		memberId,
		useApi &&
			(tab === "Family / Dependents" || tab === "Coverage & Plan History")
	);

	return useMemo(() => {
		if (!base) return undefined;
		if (!useApi) return base;
		const next: MemberDetail = { ...base };
		if (elig.data) next.eligibilityHistory = elig.data;
		if (plans.data) next.planHistory = plans.data;
		if (exceptions.data) next.exceptions = exceptions.data;
		if (accumulators.data) {
			next.accumulators = accumulators.data;
			// Rebuild buckets/KPIs from the latest nested list so modal create/update
			// shows immediately — do not wait on a slower/stale summary query.
			const rebuilt = buildAccumulatorSummaryForMember({
				...next,
				accumulators: accumulators.data,
				accumulatorSummary: undefined,
			});
			next.accumulatorSummary = {
				...rebuilt,
				recentTransactions:
					accumulatorSummary.data?.recentTransactions ??
					rebuilt.recentTransactions,
			};
		} else if (accumulatorSummary.data) {
			next.accumulatorSummary = accumulatorSummary.data;
		}
		if (claims.data) {
			next.claims = claims.data.filter((c) => c.type !== "Encounter");
		}
		if (encounters.data) next.encounters = encounters.data;
		if (familyLinks.data !== undefined) next.dependents = familyLinks.data;
		if (sources.data?.length) {
			next.vendorHistory = sources.data.map((s) => ({
				id: s.id,
				vendor: s.originalFilename || s.sourceSystem,
				fileFeedType: s.sourceSystem || "Eligibility",
				lastReceived: s.fileReceivedAt,
				status: String(s.recordStatus || "")
					.toLowerCase()
					.includes("process")
					? ("success" as const)
					: ("warning" as const),
				frequency: s.recordEffectiveDate || "—",
				recordsProcessed: 1,
				direction: "Inbound" as const,
			}));
			next.sourceFileName =
				sources.data[0]?.originalFilename ?? next.sourceFileName;
			next.sourceFileReceived =
				sources.data[0]?.fileReceivedAt ?? next.sourceFileReceived;
			next.recordStatus = sources.data[0]?.recordStatus ?? next.recordStatus;
			next.changeDetected =
				sources.data[0]?.changeSummary ?? next.changeDetected;
		}
		return next;
	}, [
		base,
		useApi,
		elig.data,
		plans.data,
		exceptions.data,
		accumulators.data,
		accumulatorSummary.data,
		claims.data,
		encounters.data,
		familyLinks.data,
		sources.data,
	]);
}

export function MemberCreateExceptionButton({
	memberId,
}: {
	memberId: string;
}) {
	const [open, setOpen] = useState(false);
	const [exceptionType, setExceptionType] = useState("");
	const [description, setDescription] = useState("");
	const mutation = useCreateMemberExceptionMutation(memberId);

	if (isMembersMockEnabled()) return null;

	return (
		<>
			<Button size="sm" variant="outline" onClick={() => setOpen(true)}>
				Add exception
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create eligibility exception</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<Label>
								Type{" "}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>
							</Label>
							<Input
								value={exceptionType}
								onChange={(e) => setExceptionType(e.target.value)}
								required
								aria-required
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Description</Label>
							<Input
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>
						<Button
							disabled={mutation.isPending}
							onClick={() => {
								if (!exceptionType.trim()) {
									toast.error("Type is required");
									return;
								}
								mutation.mutate(
									{
										exception_type: exceptionType.trim(),
										description,
										status: "open",
										source: "ops",
									},
									{
										onSuccess: () => {
											toast.success("Exception created");
											setOpen(false);
											setExceptionType("");
											setDescription("");
										},
										onError: (err) =>
											toast.error(
												err instanceof Error ? err.message : "Create failed"
											),
									}
								);
							}}
						>
							Save
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

export function MemberCreateAccumulatorButton({
	memberId,
}: {
	memberId: string;
}) {
	const [open, setOpen] = useState(false);
	const [label, setLabel] = useState("");
	const [individual, setIndividual] = useState("0");
	const [family, setFamily] = useState("0");
	const [limit, setLimit] = useState("1500");
	const [remaining, setRemaining] = useState("1500");
	const mutation = useCreateMemberAccumulatorMutation(memberId);

	if (isMembersMockEnabled()) return null;

	return (
		<>
			<Button size="sm" variant="outline" onClick={() => setOpen(true)}>
				Add accumulator
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create / upsert accumulator</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<Label>
								Label{" "}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>
							</Label>
							<Input
								value={label}
								onChange={(e) => setLabel(e.target.value)}
								placeholder="e.g. Medical Deductible"
								required
								aria-required
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Individual applied</Label>
							<Input
								type="number"
								value={individual}
								onChange={(e) => setIndividual(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Family applied</Label>
							<Input
								type="number"
								value={family}
								onChange={(e) => setFamily(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Limit</Label>
							<Input
								type="number"
								value={limit}
								onChange={(e) => setLimit(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Remaining</Label>
							<Input
								type="number"
								value={remaining}
								onChange={(e) => setRemaining(e.target.value)}
							/>
						</div>
						<Button
							disabled={mutation.isPending}
							onClick={() => {
								if (!label.trim()) {
									toast.error("Label is required");
									return;
								}
								mutation.mutate(
									{
										label: label.trim(),
										limit: Number(limit) || 0,
										remaining: Number(remaining) || 0,
										individual: Number(individual) || 0,
										family: Number(family) || 0,
									},
									{
										onSuccess: () => {
											toast.success("Accumulator saved");
											setOpen(false);
											setLabel("");
											setIndividual("0");
											setFamily("0");
										},
										onError: (err) =>
											toast.error(
												err instanceof Error ? err.message : "Create failed"
											),
									}
								);
							}}
						>
							Save
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

export function MemberCreateClaimButton({ memberId }: { memberId: string }) {
	const [open, setOpen] = useState(false);
	const [claimNumber, setClaimNumber] = useState("");
	const [provider, setProvider] = useState("");
	const [kind, setKind] = useState("medical");
	const mutation = useCreateMemberClaimMutation(memberId);

	if (isMembersMockEnabled()) return null;

	return (
		<>
			<Button size="sm" variant="outline" onClick={() => setOpen(true)}>
				Add claim
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create claim / encounter</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<Label>
								Claim number{" "}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>
							</Label>
							<Input
								value={claimNumber}
								onChange={(e) => setClaimNumber(e.target.value)}
								required
								aria-required
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Provider</Label>
							<Input
								value={provider}
								onChange={(e) => setProvider(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Kind</Label>
							<Input
								value={kind}
								onChange={(e) => setKind(e.target.value)}
								placeholder="medical | pharmacy | encounter | …"
							/>
						</div>
						<Button
							disabled={mutation.isPending}
							onClick={() => {
								if (!claimNumber.trim()) {
									toast.error("Claim number is required");
									return;
								}
								mutation.mutate(
									{
										claim_number: claimNumber.trim(),
										provider_name: provider,
										claim_kind: kind,
										status: "pending",
										billed_amount: 0,
										paid_amount: 0,
									},
									{
										onSuccess: () => {
											toast.success("Claim created");
											setOpen(false);
											setClaimNumber("");
											setProvider("");
										},
										onError: (err) =>
											toast.error(
												err instanceof Error ? err.message : "Create failed"
											),
									}
								);
							}}
						>
							Save
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

function confirmDelete(label: string) {
	return typeof window !== "undefined"
		? window.confirm(`Delete this ${label}?`)
		: false;
}

/** YYYY-MM-DD for date inputs; blank when missing. */
function toDateInputValue(iso: string | null | undefined): string {
	if (!iso || iso === "—") return "";
	const trimmed = String(iso).trim();
	const day = trimmed.includes("T")
		? trimmed.slice(0, 10)
		: trimmed.slice(0, 10);
	if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
	const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	if (us) {
		return `${us[3]}-${us[1]!.padStart(2, "0")}-${us[2]!.padStart(2, "0")}`;
	}
	return "";
}

function blankToNullDate(value: string): string | null {
	const v = value.trim();
	return v ? v : null;
}

export function MemberExceptionRowActions({
	memberId,
	exceptionId,
	exceptionType,
	description,
	startDetected,
	status,
	source,
	resolution,
}: {
	memberId: string;
	exceptionId: string;
	exceptionType: string;
	description: string;
	startDetected: string;
	status: string;
	source: string;
	resolution: string;
}) {
	const [open, setOpen] = useState(false);
	const [nextType, setNextType] = useState(exceptionType);
	const [nextDescription, setNextDescription] = useState(description);
	const [nextStartDetected, setNextStartDetected] = useState(
		toDateInputValue(startDetected)
	);
	const [nextStatus, setNextStatus] = useState(status || "open");
	const [nextSource, setNextSource] = useState(source);
	const [nextResolution, setNextResolution] = useState(resolution);
	const update = useUpdateMemberExceptionMutation(memberId);
	const remove = useDeleteMemberExceptionMutation(memberId);

	useEffect(() => {
		if (!open) return;
		setNextType(exceptionType ?? "");
		setNextDescription(description ?? "");
		setNextStartDetected(toDateInputValue(startDetected));
		setNextStatus(status || "open");
		setNextSource(source ?? "");
		setNextResolution(resolution ?? "");
	}, [
		open,
		exceptionType,
		description,
		startDetected,
		status,
		source,
		resolution,
	]);

	return (
		<div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-7"
				title="Update exception"
				onClick={() => setOpen(true)}
			>
				<Pencil className="size-3.5" />
				<span className="sr-only">Update</span>
			</Button>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-7 text-destructive"
				title="Delete exception"
				disabled={remove.isPending}
				onClick={() => {
					if (!confirmDelete("exception")) return;
					remove.mutate(exceptionId, {
						onSuccess: () => toast.success("Exception deleted"),
						onError: (err) =>
							toast.error(err instanceof Error ? err.message : "Delete failed"),
					});
				}}
			>
				<Trash2 className="size-3.5" />
				<span className="sr-only">Delete</span>
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Update exception</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<Label>Type</Label>
							<Input
								value={nextType}
								onChange={(e) => setNextType(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Description</Label>
							<Input
								value={nextDescription}
								onChange={(e) => setNextDescription(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Detected date</Label>
							<Input
								type="date"
								value={nextStartDetected}
								onChange={(e) => setNextStartDetected(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Status</Label>
							<Select value={nextStatus} onValueChange={setNextStatus}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="open">Open</SelectItem>
									<SelectItem value="in_progress">In progress</SelectItem>
									<SelectItem value="resolved">Resolved</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Source</Label>
							<Input
								value={nextSource}
								onChange={(e) => setNextSource(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Resolution</Label>
							<Input
								value={nextResolution}
								onChange={(e) => setNextResolution(e.target.value)}
							/>
						</div>
						<Button
							disabled={update.isPending}
							onClick={() => {
								if (!nextType.trim()) {
									toast.error("Type is required");
									return;
								}
								update.mutate(
									{
										exceptionId,
										body: {
											exception_type: nextType.trim(),
											description: nextDescription,
											start_detected: blankToNullDate(nextStartDetected),
											status: nextStatus,
											source: nextSource,
											resolution: nextResolution,
										},
									},
									{
										onSuccess: () => {
											toast.success("Exception updated");
											setOpen(false);
										},
										onError: (err) =>
											toast.error(
												err instanceof Error ? err.message : "Update failed"
											),
									}
								);
							}}
						>
							Save
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export function MemberAccumulatorRowActions({
	memberId,
	accumulatorId,
	label,
	individual,
	family,
	limit,
	remaining,
}: {
	memberId: string;
	accumulatorId: string;
	label: string;
	individual: number;
	family: number;
	limit: number;
	remaining: number;
}) {
	const [open, setOpen] = useState(false);
	const [nextLabel, setNextLabel] = useState(label);
	const [nextIndividual, setNextIndividual] = useState(String(individual));
	const [nextFamily, setNextFamily] = useState(String(family));
	const [nextLimit, setNextLimit] = useState(String(limit));
	const [nextRemaining, setNextRemaining] = useState(String(remaining));
	const update = useUpdateMemberAccumulatorMutation(memberId);
	const remove = useDeleteMemberAccumulatorMutation(memberId);

	useEffect(() => {
		if (!open) return;
		setNextLabel(label ?? "");
		setNextIndividual(String(individual ?? 0));
		setNextFamily(String(family ?? 0));
		setNextLimit(String(limit ?? 0));
		setNextRemaining(String(remaining ?? 0));
	}, [open, label, individual, family, limit, remaining]);

	return (
		<div className="flex gap-0.5">
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-7"
				title="Update accumulator"
				onClick={() => setOpen(true)}
			>
				<Pencil className="size-3.5" />
				<span className="sr-only">Update</span>
			</Button>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-7 text-destructive"
				title="Delete accumulator"
				disabled={remove.isPending}
				onClick={() => {
					if (!confirmDelete("accumulator")) return;
					remove.mutate(accumulatorId, {
						onSuccess: () => toast.success("Accumulator deleted"),
						onError: (err) =>
							toast.error(err instanceof Error ? err.message : "Delete failed"),
					});
				}}
			>
				<Trash2 className="size-3.5" />
				<span className="sr-only">Delete</span>
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Update {label || "accumulator"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<Label>
								Label{" "}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>
							</Label>
							<Input
								value={nextLabel}
								onChange={(e) => setNextLabel(e.target.value)}
								required
								aria-required
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Individual</Label>
							<Input
								type="number"
								value={nextIndividual}
								onChange={(e) => setNextIndividual(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Family</Label>
							<Input
								type="number"
								value={nextFamily}
								onChange={(e) => setNextFamily(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Limit</Label>
							<Input
								type="number"
								value={nextLimit}
								onChange={(e) => setNextLimit(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Remaining</Label>
							<Input
								type="number"
								value={nextRemaining}
								onChange={(e) => setNextRemaining(e.target.value)}
							/>
						</div>
						<Button
							disabled={update.isPending}
							onClick={() => {
								if (!nextLabel.trim()) {
									toast.error("Label is required");
									return;
								}
								update.mutate(
									{
										accumulatorId,
										body: {
											label: nextLabel.trim(),
											individual: Number(nextIndividual) || 0,
											family: Number(nextFamily) || 0,
											limit: Number(nextLimit) || 0,
											remaining: Number(nextRemaining) || 0,
										},
									},
									{
										onSuccess: () => {
											toast.success("Accumulator updated");
											setOpen(false);
										},
										onError: (err) =>
											toast.error(
												err instanceof Error ? err.message : "Update failed"
											),
									}
								);
							}}
						>
							Save
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export function MemberClaimRowActions({
	memberId,
	claimId,
	dos,
	claimNumber,
	claimKind,
	provider,
	billed,
	paid,
	status,
}: {
	memberId: string;
	claimId: string;
	dos: string;
	claimNumber: string;
	claimKind: string;
	provider: string;
	billed: number;
	paid: number;
	status: string;
}) {
	const [open, setOpen] = useState(false);
	const [nextDos, setNextDos] = useState(toDateInputValue(dos));
	const [nextClaimNumber, setNextClaimNumber] = useState(claimNumber);
	const [nextKind, setNextKind] = useState(
		(claimKind || "medical").toLowerCase()
	);
	const [nextProvider, setNextProvider] = useState(provider);
	const [nextBilled, setNextBilled] = useState(String(billed));
	const [nextPaid, setNextPaid] = useState(String(paid));
	const [nextStatus, setNextStatus] = useState(status || "pending");
	const update = useUpdateMemberClaimMutation(memberId);
	const remove = useDeleteMemberClaimMutation(memberId);

	useEffect(() => {
		if (!open) return;
		setNextDos(toDateInputValue(dos));
		setNextClaimNumber(claimNumber === "—" ? "" : (claimNumber ?? ""));
		setNextKind((claimKind || "medical").toLowerCase());
		setNextProvider(provider === "—" ? "" : (provider ?? ""));
		setNextBilled(String(billed ?? 0));
		setNextPaid(String(paid ?? 0));
		setNextStatus(status || "pending");
	}, [open, dos, claimNumber, claimKind, provider, billed, paid, status]);

	return (
		<div className="flex gap-0.5">
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-7"
				title="Update claim"
				onClick={() => setOpen(true)}
			>
				<Pencil className="size-3.5" />
				<span className="sr-only">Update</span>
			</Button>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-7 text-destructive"
				title="Delete claim"
				disabled={remove.isPending}
				onClick={() => {
					if (!confirmDelete("claim")) return;
					remove.mutate(claimId, {
						onSuccess: () => toast.success("Claim deleted"),
						onError: (err) =>
							toast.error(err instanceof Error ? err.message : "Delete failed"),
					});
				}}
			>
				<Trash2 className="size-3.5" />
				<span className="sr-only">Delete</span>
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Update claim</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<Label>Service date</Label>
							<Input
								type="date"
								value={nextDos}
								onChange={(e) => setNextDos(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>
								Claim number{" "}
								<span className="text-destructive" aria-hidden="true">
									*
								</span>
							</Label>
							<Input
								value={nextClaimNumber}
								onChange={(e) => setNextClaimNumber(e.target.value)}
								required
								aria-required
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Kind</Label>
							<Select value={nextKind} onValueChange={setNextKind}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Kind" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="medical">Medical</SelectItem>
									<SelectItem value="pharmacy">Pharmacy</SelectItem>
									<SelectItem value="dental">Dental</SelectItem>
									<SelectItem value="vision">Vision</SelectItem>
									<SelectItem value="encounter">Encounter</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Provider</Label>
							<Input
								value={nextProvider}
								onChange={(e) => setNextProvider(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Billed amount</Label>
							<Input
								type="number"
								value={nextBilled}
								onChange={(e) => setNextBilled(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Paid amount</Label>
							<Input
								type="number"
								value={nextPaid}
								onChange={(e) => setNextPaid(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Status</Label>
							<Select value={nextStatus} onValueChange={setNextStatus}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="paid">Paid</SelectItem>
									<SelectItem value="denied">Denied</SelectItem>
									<SelectItem value="partial">Partial</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button
							disabled={update.isPending}
							onClick={() => {
								if (!nextClaimNumber.trim()) {
									toast.error("Claim number is required");
									return;
								}
								update.mutate(
									{
										claimId,
										body: {
											service_date: blankToNullDate(nextDos),
											claim_number: nextClaimNumber.trim(),
											claim_kind: nextKind,
											provider_name: nextProvider,
											billed_amount: Number(nextBilled) || 0,
											paid_amount: Number(nextPaid) || 0,
											status: nextStatus,
										},
									},
									{
										onSuccess: () => {
											toast.success("Claim updated");
											setOpen(false);
										},
										onError: (err) =>
											toast.error(
												err instanceof Error ? err.message : "Update failed"
											),
									}
								);
							}}
						>
							Save
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export { MemberChangeEventsPanel } from "@/features/admin/features/members/components/MemberChangeEventsPanel";

export function MemberSourceRecordViewer({
	memberId,
	recordId,
	open,
	onOpenChange,
}: {
	memberId: string;
	recordId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const q = useMemberSourceRecordQuery(
		memberId,
		recordId,
		open && Boolean(recordId)
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Full source record</DialogTitle>
				</DialogHeader>
				{q.isLoading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : q.error ? (
					<p className="text-sm text-destructive">{q.error.message}</p>
				) : (
					<pre className="max-h-[60vh] overflow-auto rounded-md bg-muted/40 p-3 text-xs">
						{JSON.stringify(q.data ?? {}, null, 2)}
					</pre>
				)}
			</DialogContent>
		</Dialog>
	);
}

export function MemberProfileActions({
	member,
	onEdit,
}: {
	member: MemberDetail;
	onEdit?: () => void;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const update = useUpdateMemberMutation();
	const softDelete = useDeleteMemberMutation();
	const hardDelete = useHardDeleteMemberMutation();
	const restore = useRestoreMemberMutation();
	const memberId = member.id;

	function afterGone() {
		toast.success("Member removed");
		router.push("/admin/members");
	}

	return (
		<div className="flex flex-wrap items-center gap-1">
			<Button
				type="button"
				variant="outline"
				size="icon"
				className="size-8"
				title="Edit member"
				onClick={() => (onEdit ? onEdit() : setOpen(true))}
			>
				<Pencil className="size-3.5" />
				<span className="sr-only">Update member</span>
			</Button>
			{member.status === "active" ? (
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-8 text-destructive"
					title="Delete member"
					disabled={softDelete.isPending}
					onClick={() => {
						if (!confirmDelete("member (soft-delete)")) return;
						softDelete.mutate(memberId, {
							onSuccess: afterGone,
							onError: (err) =>
								toast.error(
									err instanceof Error ? err.message : "Delete failed"
								),
						});
					}}
				>
					<Trash2 className="size-3.5" />
					<span className="sr-only">Delete member</span>
				</Button>
			) : (
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-8"
					title="Restore member"
					disabled={restore.isPending}
					onClick={() =>
						restore.mutate(memberId, {
							onSuccess: () => toast.success("Member restored"),
							onError: (err) =>
								toast.error(
									err instanceof Error ? err.message : "Restore failed"
								),
						})
					}
				>
					<RotateCcw className="size-3.5" />
					<span className="sr-only">Restore member</span>
				</Button>
			)}
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="size-8 text-destructive"
				title="Permanently delete member"
				disabled={hardDelete.isPending}
				onClick={() => {
					if (
						typeof window !== "undefined" &&
						!window.confirm(
							"Permanently delete this member? This cannot be undone."
						)
					) {
						return;
					}
					hardDelete.mutate(memberId, {
						onSuccess: afterGone,
						onError: (err) =>
							toast.error(
								err instanceof Error ? err.message : "Hard delete failed"
							),
					});
				}}
			>
				<Trash2 className="size-3.5" />
				<span className="sr-only">Hard delete member</span>
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="flex max-h-[min(36rem,85vh)] w-[min(72rem,calc(100%-2rem))] flex-col overflow-hidden sm:max-w-5xl">
					<DialogHeader>
						<DialogTitle>Update member</DialogTitle>
					</DialogHeader>
					<MemberWriteForm
						member={member}
						pending={update.isPending}
						submitLabel="Save"
						requireIdentityFields
						onSubmit={(body) =>
							update.mutate(
								{ id: memberId, body },
								{
									onSuccess: () => {
										toast.success("Member updated");
										setOpen(false);
									},
									onError: (err) =>
										toast.error(
											err instanceof Error ? err.message : "Update failed"
										),
								}
							)
						}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}

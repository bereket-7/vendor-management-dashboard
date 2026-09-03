"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
	AlertTriangle,
	BadgeCheck,
	Building2,
	Check,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Link2,
	Loader2,
	Server,
	Sparkles,
	UserCog,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { CURRENT_STAGE_OPTIONS } from "../feature/mappers/workQueueMappers";
import {
	ESCALATED_TO_LABEL,
	ESCALATED_TO_OPTIONS,
	ESCALATION_REASON_LABEL,
	ESCALATION_REASON_OPTIONS,
	ESCALATION_WORKFLOW_LABEL,
	ESCALATION_WORKFLOW_OPTIONS,
	type EscalatedTo,
	type EscalationReason,
	type EscalationWorkflowStatus,
	IP_WHITELISTING_LABEL,
	IP_WHITELISTING_OPTIONS,
	type IpWhitelistingStatus,
	OPERATIONAL_STATUS_LABEL,
	OPERATIONAL_STATUS_OPTIONS,
	type OperationalStatus,
} from "../lib/work-queue-detail-tabs";
import { EDI_MILESTONE_DEFS, SFTP_MILESTONE_DEFS } from "../progress-data";
import { type MilestoneUiStatus, canSetEdiProgress } from "../progress-rules";
import {
	MIGRATION_STATUS_LABEL,
	type MigrationStatus,
	type VendorType,
} from "../work-queue-types";

export const WORK_QUEUE_WIZARD_STEPS = [
	{
		id: "identity",
		title: "Identity",
		hint: "Name, type, wave & server",
		icon: Building2,
	},
	{
		id: "contacts",
		title: "Contacts",
		hint: "Primary & secondary contacts",
		icon: Users,
	},
	{
		id: "migration",
		title: "Migration",
		hint: "Status, stage, dates & analyst",
		icon: ClipboardList,
	},
	{
		id: "connectivity",
		title: "Connectivity",
		hint: "IP whitelist, SFTP & EDI",
		icon: Server,
	},
	{
		id: "operations",
		title: "Operations",
		hint: "Escalation & EDI analyst",
		icon: AlertTriangle,
	},
	{
		id: "review",
		title: "Review",
		hint: "Confirm & create",
		icon: BadgeCheck,
	},
] as const;

export type WorkQueueWizardStepId =
	(typeof WORK_QUEUE_WIZARD_STEPS)[number]["id"];

const WAVE_OPTIONS = ["1", "2", "3", "4"] as const;
const SERVER_OPTIONS = ["New SFTP", "Legacy SFTP", "API Feed"] as const;

const MILESTONE_STATUS_LABEL: Record<MilestoneUiStatus, string> = {
	not_started: "Not Started",
	in_progress: "In Progress",
	complete: "Complete",
};

function emptyTrackStatuses(
	defs: typeof SFTP_MILESTONE_DEFS
): Record<string, MilestoneUiStatus> {
	return Object.fromEntries(
		defs.map((m) => [m.key, "not_started" as MilestoneUiStatus])
	);
}

export type WorkQueueWizardValues = {
	wave: string;
	name: string;
	code: string;
	vendorType: VendorType;
	serverType: string;
	notes: string;
	primaryContact: string;
	primaryEmail: string;
	primaryPhone: string;
	secondaryContact: string;
	secondaryEmail: string;
	secondaryPhone: string;
	lastCommunicationAt: string;
	status: MigrationStatus;
	operationalStatus: OperationalStatus;
	currentStage: string;
	nextStep: string;
	migrationStartDate: string;
	waitingOnVendorDate: string;
	analystId: string;
	ipWhitelistingStatus: IpWhitelistingStatus;
	sftpProgress: number;
	ediProgress: number;
	sftpMilestones: Record<string, MilestoneUiStatus>;
	ediMilestones: Record<string, MilestoneUiStatus>;
	escalated: "yes" | "no";
	escalationReason: EscalationReason | "";
	escalatedTo: EscalatedTo | "";
	escalationWorkflowStatus: EscalationWorkflowStatus;
	blockerNotes: string;
	ediAnalystId: string;
};

export const EMPTY_WORK_QUEUE_WIZARD: WorkQueueWizardValues = {
	wave: "",
	name: "",
	code: "",
	vendorType: "TPA",
	serverType: "",
	notes: "",
	primaryContact: "",
	primaryEmail: "",
	primaryPhone: "",
	secondaryContact: "",
	secondaryEmail: "",
	secondaryPhone: "",
	lastCommunicationAt: "",
	status: "not_started",
	operationalStatus: "not_started",
	currentStage: "not_started",
	nextStep: "",
	migrationStartDate: "",
	waitingOnVendorDate: "",
	analystId: "",
	ipWhitelistingStatus: "not_started",
	sftpProgress: 0,
	ediProgress: 0,
	sftpMilestones: emptyTrackStatuses(SFTP_MILESTONE_DEFS),
	ediMilestones: emptyTrackStatuses(EDI_MILESTONE_DEFS),
	escalated: "no",
	escalationReason: "",
	escalatedTo: "",
	escalationWorkflowStatus: "submitted",
	blockerNotes: "",
	ediAnalystId: "",
};

const fieldClass =
	"h-9 rounded-sm border-border bg-background text-sm shadow-none hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

function FieldLabel({
	children,
	required,
}: {
	children: ReactNode;
	required?: boolean;
}) {
	return (
		<label className="mb-1.5 block text-xs font-medium text-foreground">
			{children}
			{required ? <span className="ml-0.5 text-destructive">*</span> : null}
		</label>
	);
}

function FieldGrid({ children }: { children: ReactNode }) {
	return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function stepIndex(id: WorkQueueWizardStepId) {
	return WORK_QUEUE_WIZARD_STEPS.findIndex((step) => step.id === id);
}

function validateIdentity(values: WorkQueueWizardValues): string | null {
	if (!values.wave) return "Select a wave.";
	if (!values.name.trim()) return "Enter a TPA/TPV name.";
	if (!values.serverType) return "Select a server / connection type.";
	return null;
}

function validateContacts(values: WorkQueueWizardValues): string | null {
	if (!values.primaryContact.trim() && !values.primaryEmail.trim()) {
		return "Add a primary contact name or email.";
	}
	return null;
}

function validateMigration(values: WorkQueueWizardValues): string | null {
	if (!values.status) return "Select a migration status.";
	if (!values.currentStage) return "Select a current stage.";
	return null;
}

function ProgressSliderField({
	label,
	value,
	onChange,
	required,
	disabled,
	helperText,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
	required?: boolean;
	disabled?: boolean;
	helperText?: string;
}) {
	return (
		<div className={disabled ? "opacity-60" : undefined}>
			<FieldLabel required={required}>{label}</FieldLabel>
			<div className="flex items-center gap-3 pt-1">
				<Slider
					value={[value]}
					min={0}
					max={100}
					step={1}
					disabled={disabled}
					onValueChange={(v) => onChange(v[0] ?? 0)}
					className="flex-1"
				/>
				<div className="flex shrink-0 items-center gap-1">
					<Input
						type="number"
						min={0}
						max={100}
						value={value}
						disabled={disabled}
						onChange={(e) => {
							const n = Number(e.target.value);
							onChange(Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);
						}}
						className={cn(fieldClass, "h-8 w-14 px-2 text-center tabular-nums")}
					/>
					<span className="text-xs text-muted-foreground">%</span>
				</div>
			</div>
			{helperText ? (
				<p className="mt-1.5 text-[11px] text-muted-foreground">{helperText}</p>
			) : null}
		</div>
	);
}

export type WorkQueueWizardAnalyst = { id: string; label: string };

export function WorkQueueFormWizard({
	values,
	onChange,
	analysts,
	busy,
	error,
	onCancelHref,
	onSubmit,
	onSaveDraft,
}: {
	values: WorkQueueWizardValues;
	onChange: (patch: Partial<WorkQueueWizardValues>) => void;
	analysts: WorkQueueWizardAnalyst[];
	busy?: boolean;
	error?: string | null;
	onCancelHref: string;
	onSubmit: () => Promise<void>;
	onSaveDraft?: () => void;
}) {
	const [step, setStep] = useState<WorkQueueWizardStepId>("identity");
	const current = stepIndex(step);
	const last = WORK_QUEUE_WIZARD_STEPS.length - 1;

	const identityError = useMemo(() => validateIdentity(values), [values]);
	const contactsError = useMemo(() => validateContacts(values), [values]);
	const migrationError = useMemo(() => validateMigration(values), [values]);

	const stepError = useMemo(() => {
		if (step === "identity") return identityError;
		if (step === "contacts") return contactsError;
		if (step === "migration") return migrationError;
		return null;
	}, [step, identityError, contactsError, migrationError]);

	function canAdvance() {
		if (step === "identity") return !identityError;
		if (step === "contacts") return !contactsError;
		if (step === "migration") return !migrationError;
		return true;
	}

	function goNext() {
		if (!canAdvance()) return;
		const next = WORK_QUEUE_WIZARD_STEPS[current + 1];
		if (next) setStep(next.id);
	}

	function goBack() {
		const prev = WORK_QUEUE_WIZARD_STEPS[current - 1];
		if (prev) setStep(prev.id);
	}

	function selectStep(index: number) {
		if (index <= current) setStep(WORK_QUEUE_WIZARD_STEPS[index]!.id);
	}

	const progressPct = Math.round(
		((current + 1) / WORK_QUEUE_WIZARD_STEPS.length) * 100
	);

	const analystLabel =
		analysts.find((a) => a.id === values.analystId)?.label ?? "Unassigned";
	const ediAnalystLabel =
		analysts.find((a) => a.id === values.ediAnalystId)?.label ?? "Unassigned";

	return (
		<div className="w-full space-y-5 pb-4 lg:space-y-6">
			<header className="relative overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-4 sm:px-5">
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-emerald-500/5"
				/>
				<div className="relative flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0 space-y-1.5">
						<p className="text-xs text-muted-foreground">
							<Link
								href="/admin/my-work-queue"
								className="transition-colors hover:text-foreground"
							>
								TPA/TPV Tracking
							</Link>
							<span className="mx-1.5 text-border/80">/</span>
							<span className="font-medium text-foreground">New TPA/TPV</span>
						</p>
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							Add TPA/TPV registration
						</h1>
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Six-step registration: identity, contacts, migration,
							connectivity, operations, then review.
						</p>
					</div>
					<div className="flex items-center gap-3">
						<div className="hidden rounded-lg border border-border/60 bg-background/80 px-3 py-2 sm:block">
							<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
								Progress
							</p>
							<p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
								{progressPct}%
							</p>
						</div>
						<p className="text-xs tabular-nums text-muted-foreground">
							Step {current + 1} of {WORK_QUEUE_WIZARD_STEPS.length}
						</p>
					</div>
				</div>
			</header>

			<div className="lg:hidden">
				<WizardStepperHorizontal current={current} onSelect={selectStep} />
			</div>

			<div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-6">
				<aside className="hidden lg:sticky lg:top-4 lg:block">
					<WizardStepperVertical current={current} onSelect={selectStep} />
				</aside>

				<section className="flex min-h-140 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
					<div className="border-b border-border/40 px-6 py-5 sm:px-8 sm:py-6">
						<div className="mb-3 h-1 overflow-hidden rounded-full bg-muted lg:hidden">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{ width: `${progressPct}%` }}
							/>
						</div>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex items-center gap-2.5">
								<span
									aria-hidden
									className="h-5 w-0.5 shrink-0 rounded-full bg-primary"
								/>
								<div>
									<h2 className="text-lg font-semibold tracking-tight text-foreground">
										{WORK_QUEUE_WIZARD_STEPS[current]?.title}
									</h2>
									<p className="text-xs text-muted-foreground">
										{WORK_QUEUE_WIZARD_STEPS[current]?.hint}
									</p>
								</div>
							</div>
							{step !== "review" && step !== "operations" ? (
								<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
									<Sparkles className="size-3" />
									Required fields marked *
								</span>
							) : null}
						</div>
					</div>

					<div className="flex-1 px-6 py-7 sm:px-8 sm:py-8">
						{step === "identity" ? (
							<IdentityStep values={values} onChange={onChange} />
						) : null}
						{step === "contacts" ? (
							<ContactsStep values={values} onChange={onChange} />
						) : null}
						{step === "migration" ? (
							<MigrationStep
								values={values}
								analysts={analysts}
								onChange={onChange}
							/>
						) : null}
						{step === "connectivity" ? (
							<ConnectivityStep values={values} onChange={onChange} />
						) : null}
						{step === "operations" ? (
							<OperationsStep
								values={values}
								analysts={analysts}
								onChange={onChange}
							/>
						) : null}
						{step === "review" ? (
							<ReviewStep
								values={values}
								analystLabel={analystLabel}
								ediAnalystLabel={ediAnalystLabel}
							/>
						) : null}
					</div>

					{stepError ? (
						<p className="border-t border-amber-500/20 bg-amber-500/5 px-6 py-3 text-sm text-amber-900 dark:text-amber-200 sm:px-8">
							{stepError}
						</p>
					) : null}

					{error ? (
						<p className="border-t border-destructive/20 bg-destructive/5 px-6 py-3 text-sm text-destructive sm:px-8">
							{error}
						</p>
					) : null}

					<footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 px-6 py-4 sm:px-8">
						<div className="flex flex-wrap items-center gap-2">
							<Button
								asChild
								variant="ghost"
								className="px-0 text-muted-foreground"
							>
								<Link href={onCancelHref}>Cancel</Link>
							</Button>
							{onSaveDraft ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={busy}
									onClick={onSaveDraft}
								>
									Save draft
								</Button>
							) : null}
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={current === 0 || busy}
								onClick={goBack}
							>
								<ChevronLeft className="mr-1 size-4" />
								Back
							</Button>
							{current < last ? (
								<Button type="button" disabled={!canAdvance()} onClick={goNext}>
									Continue
									<ChevronRight className="ml-1 size-4" />
								</Button>
							) : (
								<Button
									type="button"
									disabled={
										busy ||
										Boolean(identityError) ||
										Boolean(contactsError) ||
										Boolean(migrationError)
									}
									onClick={() => void onSubmit()}
								>
									{busy ? (
										<Loader2 className="mr-2 size-4 animate-spin" />
									) : (
										<BadgeCheck className="mr-2 size-4" />
									)}
									Create TPA/TPV
								</Button>
							)}
						</div>
					</footer>
				</section>
			</div>
		</div>
	);
}

function stepMarkClass(done: boolean, active: boolean) {
	return cn(
		"relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
		done && "border-primary bg-primary text-primary-foreground",
		active &&
			"border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]",
		!done && !active && "border-border bg-background text-muted-foreground"
	);
}

function WizardStepperVertical({
	current,
	onSelect,
}: {
	current: number;
	onSelect: (index: number) => void;
}) {
	return (
		<nav
			aria-label="TPA/TPV form steps"
			className="rounded-2xl border border-border/50 bg-card p-3"
		>
			<ol className="space-y-0.5">
				{WORK_QUEUE_WIZARD_STEPS.map((item, index) => {
					const Icon = item.icon;
					const done = index < current;
					const active = index === current;
					const isLast = index === WORK_QUEUE_WIZARD_STEPS.length - 1;
					return (
						<li key={item.id}>
							<button
								type="button"
								disabled={index > current}
								onClick={() => onSelect(index)}
								className={cn(
									"relative flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
									active && "bg-primary/5",
									index <= current && "hover:bg-muted/60",
									index > current && "cursor-default opacity-70"
								)}
							>
								<span className="relative flex flex-col items-center">
									<span className={stepMarkClass(done, active)}>
										{done ? (
											<Check className="size-4" strokeWidth={2.4} />
										) : (
											<Icon className="size-4" strokeWidth={2} />
										)}
									</span>
									{isLast ? null : (
										<span
											aria-hidden
											className={cn(
												"mt-1 h-6 w-px",
												index < current ? "bg-primary" : "bg-border"
											)}
										/>
									)}
								</span>
								<span className="min-w-0 pt-1">
									<p
										className={cn(
											"text-xs font-semibold",
											active || done
												? "text-foreground"
												: "text-muted-foreground"
										)}
									>
										{item.title}
									</p>
									<p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
										{item.hint}
									</p>
								</span>
							</button>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

function WizardStepperHorizontal({
	current,
	onSelect,
}: {
	current: number;
	onSelect: (index: number) => void;
}) {
	return (
		<nav
			aria-label="TPA/TPV form steps"
			className="overflow-x-auto rounded-xl border border-border/50 bg-card p-2"
		>
			<ol className="flex min-w-max items-center gap-1">
				{WORK_QUEUE_WIZARD_STEPS.map((item, index) => {
					const Icon = item.icon;
					const done = index < current;
					const active = index === current;
					return (
						<li key={item.id} className="flex items-center gap-1">
							<button
								type="button"
								disabled={index > current}
								onClick={() => onSelect(index)}
								className={cn(
									"flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
									active && "bg-primary/5",
									index > current && "opacity-60"
								)}
							>
								<span className={stepMarkClass(done, active)}>
									{done ? (
										<Check className="size-3.5" strokeWidth={2.4} />
									) : (
										<Icon className="size-3.5" strokeWidth={2} />
									)}
								</span>
								<span className="hidden sm:block">
									<p className="text-[11px] font-semibold text-foreground">
										{item.title}
									</p>
								</span>
							</button>
							{index < WORK_QUEUE_WIZARD_STEPS.length - 1 ? (
								<span
									aria-hidden
									className={cn(
										"mx-0.5 h-px w-4",
										index < current ? "bg-primary" : "bg-border"
									)}
								/>
							) : null}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

function IdentityStep({
	values,
	onChange,
}: {
	values: WorkQueueWizardValues;
	onChange: (patch: Partial<WorkQueueWizardValues>) => void;
}) {
	return (
		<FieldGrid>
			<div>
				<FieldLabel required>Wave</FieldLabel>
				<Select
					value={values.wave}
					onValueChange={(v) => onChange({ wave: v })}
				>
					<SelectTrigger className={fieldClass}>
						<SelectValue placeholder="Select wave" />
					</SelectTrigger>
					<SelectContent>
						{WAVE_OPTIONS.map((w) => (
							<SelectItem key={w} value={w}>
								Wave {w}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<FieldLabel required>Type</FieldLabel>
				<Select
					value={values.vendorType}
					onValueChange={(v) => onChange({ vendorType: v as VendorType })}
				>
					<SelectTrigger className={fieldClass}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="TPA">TPA</SelectItem>
						<SelectItem value="TPV">TPV</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div>
				<FieldLabel required>TPA/TPV name</FieldLabel>
				<Input
					value={values.name}
					onChange={(e) => onChange({ name: e.target.value })}
					placeholder="Enter TPA/TPV name"
					className={fieldClass}
				/>
			</div>
			<div>
				<FieldLabel>TPA/TPV ID / code</FieldLabel>
				<Input
					value={values.code}
					onChange={(e) => onChange({ code: e.target.value })}
					placeholder="Auto-generated if blank"
					className={cn(fieldClass, "font-mono")}
				/>
			</div>
			<div className="sm:col-span-2">
				<FieldLabel required>Server / connection type</FieldLabel>
				<Select
					value={values.serverType}
					onValueChange={(v) => onChange({ serverType: v })}
				>
					<SelectTrigger className={fieldClass}>
						<SelectValue placeholder="Select server type" />
					</SelectTrigger>
					<SelectContent>
						{SERVER_OPTIONS.map((s) => (
							<SelectItem key={s} value={s}>
								{s}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="sm:col-span-2">
				<FieldLabel>Notes</FieldLabel>
				<Textarea
					value={values.notes}
					onChange={(e) => onChange({ notes: e.target.value })}
					placeholder="Registration notes, context, or special instructions…"
					rows={4}
					className="min-h-[100px] resize-none rounded-sm border-border bg-background text-sm shadow-none"
				/>
			</div>
		</FieldGrid>
	);
}

function ContactsStep({
	values,
	onChange,
}: {
	values: WorkQueueWizardValues;
	onChange: (patch: Partial<WorkQueueWizardValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<section>
				<p className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
					Primary contact
				</p>
				<FieldGrid>
					<div>
						<FieldLabel required>Name</FieldLabel>
						<Input
							value={values.primaryContact}
							onChange={(e) => onChange({ primaryContact: e.target.value })}
							placeholder="Primary contact name"
							className={fieldClass}
						/>
					</div>
					<div>
						<FieldLabel required>Email</FieldLabel>
						<Input
							type="email"
							value={values.primaryEmail}
							onChange={(e) => onChange({ primaryEmail: e.target.value })}
							placeholder="primary@example.com"
							className={fieldClass}
						/>
					</div>
					<div>
						<FieldLabel>Phone</FieldLabel>
						<Input
							value={values.primaryPhone}
							onChange={(e) => onChange({ primaryPhone: e.target.value })}
							placeholder="Primary phone"
							className={fieldClass}
						/>
					</div>
					<div>
						<FieldLabel>Last communication</FieldLabel>
						<Input
							type="date"
							value={values.lastCommunicationAt}
							onChange={(e) =>
								onChange({ lastCommunicationAt: e.target.value })
							}
							className={fieldClass}
						/>
					</div>
				</FieldGrid>
			</section>
			<section>
				<p className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
					Secondary contact
				</p>
				<FieldGrid>
					<div>
						<FieldLabel>Name</FieldLabel>
						<Input
							value={values.secondaryContact}
							onChange={(e) => onChange({ secondaryContact: e.target.value })}
							placeholder="Secondary contact name"
							className={fieldClass}
						/>
					</div>
					<div>
						<FieldLabel>Email</FieldLabel>
						<Input
							type="email"
							value={values.secondaryEmail}
							onChange={(e) => onChange({ secondaryEmail: e.target.value })}
							placeholder="secondary@example.com"
							className={fieldClass}
						/>
					</div>
					<div>
						<FieldLabel>Phone</FieldLabel>
						<Input
							value={values.secondaryPhone}
							onChange={(e) => onChange({ secondaryPhone: e.target.value })}
							placeholder="Secondary phone"
							className={fieldClass}
						/>
					</div>
				</FieldGrid>
			</section>
		</div>
	);
}

function MigrationStep({
	values,
	analysts,
	onChange,
}: {
	values: WorkQueueWizardValues;
	analysts: WorkQueueWizardAnalyst[];
	onChange: (patch: Partial<WorkQueueWizardValues>) => void;
}) {
	return (
		<FieldGrid>
			<div>
				<FieldLabel required>Migration status</FieldLabel>
				<Select
					value={values.status}
					onValueChange={(v) => onChange({ status: v as MigrationStatus })}
				>
					<SelectTrigger className={fieldClass}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{(Object.keys(MIGRATION_STATUS_LABEL) as MigrationStatus[]).map(
							(key) => (
								<SelectItem key={key} value={key}>
									{MIGRATION_STATUS_LABEL[key]}
								</SelectItem>
							)
						)}
					</SelectContent>
				</Select>
			</div>
			<div>
				<FieldLabel>Operational status</FieldLabel>
				<Select
					value={values.operationalStatus}
					onValueChange={(v) =>
						onChange({ operationalStatus: v as OperationalStatus })
					}
				>
					<SelectTrigger className={fieldClass}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{OPERATIONAL_STATUS_OPTIONS.map((key) => (
							<SelectItem key={key} value={key}>
								{OPERATIONAL_STATUS_LABEL[key]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<FieldLabel required>Current stage</FieldLabel>
				<Select
					value={values.currentStage || "not_started"}
					onValueChange={(v) => onChange({ currentStage: v })}
				>
					<SelectTrigger className={fieldClass}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{CURRENT_STAGE_OPTIONS.map((stage) => (
							<SelectItem key={stage.value} value={stage.value}>
								{stage.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<FieldLabel>Assigned analyst</FieldLabel>
				<Select
					value={values.analystId || "__none__"}
					onValueChange={(v) =>
						onChange({ analystId: v === "__none__" ? "" : v })
					}
				>
					<SelectTrigger className={fieldClass}>
						<SelectValue placeholder="Select analyst" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__none__">Unassigned</SelectItem>
						{analysts.map((analyst) => (
							<SelectItem key={analyst.id} value={analyst.id}>
								{analyst.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<FieldLabel>Migration start date</FieldLabel>
				<Input
					type="date"
					value={values.migrationStartDate}
					onChange={(e) => onChange({ migrationStartDate: e.target.value })}
					className={fieldClass}
				/>
			</div>
			<div>
				<FieldLabel>Waiting on vendor date</FieldLabel>
				<Input
					type="date"
					value={values.waitingOnVendorDate}
					onChange={(e) => onChange({ waitingOnVendorDate: e.target.value })}
					className={fieldClass}
				/>
			</div>
			<div className="sm:col-span-2">
				<FieldLabel>Next step</FieldLabel>
				<Textarea
					value={values.nextStep}
					onChange={(e) => onChange({ nextStep: e.target.value })}
					placeholder="Current action item for this vendor…"
					rows={3}
					className="min-h-[88px] resize-none rounded-sm border-border bg-background text-sm shadow-none"
				/>
			</div>
		</FieldGrid>
	);
}

function ConnectivityStep({
	values,
	onChange,
}: {
	values: WorkQueueWizardValues;
	onChange: (patch: Partial<WorkQueueWizardValues>) => void;
}) {
	function setSftpPercent(rawPercent: number) {
		onChange({ sftpProgress: Math.min(100, Math.max(0, rawPercent)) });
	}

	function setEdiPercent(rawPercent: number) {
		if (!canSetEdiProgress(values.sftpProgress)) return;
		onChange({ ediProgress: Math.min(100, Math.max(0, rawPercent)) });
	}

	function patchSftpMilestone(key: string, status: MilestoneUiStatus) {
		onChange({
			sftpMilestones: { ...values.sftpMilestones, [key]: status },
		});
	}

	function patchEdiMilestone(key: string, status: MilestoneUiStatus) {
		if (!canSetEdiProgress(values.sftpProgress)) return;
		onChange({
			ediMilestones: { ...values.ediMilestones, [key]: status },
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<FieldLabel>IP whitelisting</FieldLabel>
				<Select
					value={values.ipWhitelistingStatus}
					onValueChange={(v) =>
						onChange({ ipWhitelistingStatus: v as IpWhitelistingStatus })
					}
				>
					<SelectTrigger className={fieldClass}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{IP_WHITELISTING_OPTIONS.map((key) => (
							<SelectItem key={key} value={key}>
								{IP_WHITELISTING_LABEL[key]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<section>
				<p className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
					SFTP progress
				</p>
				<div className="space-y-4">
					<ProgressSliderField
						label="Overall SFTP %"
						value={values.sftpProgress}
						onChange={setSftpPercent}
					/>
					<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
						{SFTP_MILESTONE_DEFS.map((milestone) => (
							<div key={milestone.key} className="min-w-0">
								<FieldLabel>{milestone.label}</FieldLabel>
								<Select
									value={values.sftpMilestones[milestone.key] ?? "not_started"}
									onValueChange={(v) =>
										patchSftpMilestone(milestone.key, v as MilestoneUiStatus)
									}
								>
									<SelectTrigger className={cn(fieldClass, "text-xs")}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{(
											Object.keys(MILESTONE_STATUS_LABEL) as MilestoneUiStatus[]
										).map((key) => (
											<SelectItem key={key} value={key}>
												{MILESTONE_STATUS_LABEL[key]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						))}
					</div>
				</div>
			</section>

			<section>
				<p className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
					EDI progress
				</p>
				<div className="space-y-4">
					<ProgressSliderField
						label="Overall EDI %"
						value={values.ediProgress}
						onChange={setEdiPercent}
						disabled={!canSetEdiProgress(values.sftpProgress)}
						helperText={
							canSetEdiProgress(values.sftpProgress)
								? undefined
								: "Complete SFTP (100%) before setting EDI milestones."
						}
					/>
					<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
						{EDI_MILESTONE_DEFS.map((milestone) => (
							<div key={milestone.key} className="min-w-0">
								<FieldLabel>{milestone.label}</FieldLabel>
								<Select
									value={values.ediMilestones[milestone.key] ?? "not_started"}
									onValueChange={(v) =>
										patchEdiMilestone(milestone.key, v as MilestoneUiStatus)
									}
									disabled={!canSetEdiProgress(values.sftpProgress)}
								>
									<SelectTrigger className={cn(fieldClass, "text-xs")}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{(
											Object.keys(MILESTONE_STATUS_LABEL) as MilestoneUiStatus[]
										).map((key) => (
											<SelectItem key={key} value={key}>
												{MILESTONE_STATUS_LABEL[key]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}

function OperationsStep({
	values,
	analysts,
	onChange,
}: {
	values: WorkQueueWizardValues;
	analysts: WorkQueueWizardAnalyst[];
	onChange: (patch: Partial<WorkQueueWizardValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<section>
				<div className="mb-3 flex items-center gap-2">
					<AlertTriangle className="size-3.5 text-muted-foreground" />
					<p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						Escalation
					</p>
				</div>
				<FieldGrid>
					<div className="sm:col-span-2">
						<FieldLabel>Escalated</FieldLabel>
						<Select
							value={values.escalated}
							onValueChange={(v) => onChange({ escalated: v as "yes" | "no" })}
						>
							<SelectTrigger className={fieldClass}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="no">No</SelectItem>
								<SelectItem value="yes">Yes</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{values.escalated === "yes" ? (
						<>
							<div>
								<FieldLabel>Escalation reason</FieldLabel>
								<Select
									value={values.escalationReason || undefined}
									onValueChange={(v) =>
										onChange({ escalationReason: v as EscalationReason })
									}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue placeholder="Select reason" />
									</SelectTrigger>
									<SelectContent>
										{ESCALATION_REASON_OPTIONS.map((key) => (
											<SelectItem key={key} value={key}>
												{ESCALATION_REASON_LABEL[key]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<FieldLabel>Escalated to</FieldLabel>
								<Select
									value={values.escalatedTo || undefined}
									onValueChange={(v) =>
										onChange({ escalatedTo: v as EscalatedTo })
									}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue placeholder="Select team" />
									</SelectTrigger>
									<SelectContent>
										{ESCALATED_TO_OPTIONS.map((key) => (
											<SelectItem key={key} value={key}>
												{ESCALATED_TO_LABEL[key]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="sm:col-span-2">
								<FieldLabel>Escalation status</FieldLabel>
								<Select
									value={values.escalationWorkflowStatus}
									onValueChange={(v) =>
										onChange({
											escalationWorkflowStatus: v as EscalationWorkflowStatus,
										})
									}
								>
									<SelectTrigger className={fieldClass}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{ESCALATION_WORKFLOW_OPTIONS.map((key) => (
											<SelectItem key={key} value={key}>
												{ESCALATION_WORKFLOW_LABEL[key]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="sm:col-span-2">
								<FieldLabel>Escalation notes</FieldLabel>
								<Textarea
									value={values.blockerNotes}
									onChange={(e) => onChange({ blockerNotes: e.target.value })}
									rows={3}
									placeholder="Additional escalation context…"
									className="min-h-[88px] resize-none rounded-sm border-border bg-background text-sm shadow-none"
								/>
							</div>
						</>
					) : (
						<p className="sm:col-span-2 text-xs text-muted-foreground">
							Set Escalated to Yes when progress is blocked and needs
							assistance.
						</p>
					)}
				</FieldGrid>
			</section>

			<section>
				<div className="mb-3 flex items-center gap-2">
					<UserCog className="size-3.5 text-muted-foreground" />
					<p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						EDI analyst
					</p>
				</div>
				<div>
					<FieldLabel>Assigned EDI analyst</FieldLabel>
					<Select
						value={values.ediAnalystId || "__none__"}
						onValueChange={(v) =>
							onChange({ ediAnalystId: v === "__none__" ? "" : v })
						}
					>
						<SelectTrigger className={fieldClass}>
							<SelectValue placeholder="Unassigned" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__none__">Unassigned</SelectItem>
							{analysts.map((analyst) => (
								<SelectItem key={analyst.id} value={analyst.id}>
									{analyst.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</section>
		</div>
	);
}

function ReviewStep({
	values,
	analystLabel,
	ediAnalystLabel,
}: {
	values: WorkQueueWizardValues;
	analystLabel: string;
	ediAnalystLabel: string;
}) {
	const stageLabel =
		CURRENT_STAGE_OPTIONS.find((s) => s.value === values.currentStage)?.label ??
		values.currentStage;

	const groups = [
		{
			title: "Identity",
			icon: Building2,
			items: [
				{ label: "Name", value: values.name || "—" },
				{ label: "Code", value: values.code || "Auto" },
				{ label: "Type", value: values.vendorType },
				{ label: "Wave", value: values.wave ? `Wave ${values.wave}` : "—" },
				{ label: "Server", value: values.serverType || "—" },
			],
		},
		{
			title: "Contacts",
			icon: Users,
			items: [
				{
					label: "Primary",
					value:
						[values.primaryContact, values.primaryEmail]
							.filter(Boolean)
							.join(" · ") || "—",
				},
				{
					label: "Secondary",
					value:
						[values.secondaryContact, values.secondaryEmail]
							.filter(Boolean)
							.join(" · ") || "—",
				},
				{
					label: "Last communication",
					value: values.lastCommunicationAt || "—",
				},
			],
		},
		{
			title: "Migration",
			icon: ClipboardList,
			items: [
				{ label: "Status", value: MIGRATION_STATUS_LABEL[values.status] },
				{
					label: "Operational",
					value: OPERATIONAL_STATUS_LABEL[values.operationalStatus],
				},
				{ label: "Stage", value: stageLabel || "—" },
				{ label: "Analyst", value: analystLabel },
				{ label: "Start", value: values.migrationStartDate || "—" },
				{
					label: "Waiting on vendor",
					value: values.waitingOnVendorDate || "—",
				},
			],
		},
		{
			title: "Connectivity",
			icon: Link2,
			items: [
				{
					label: "IP whitelisting",
					value: IP_WHITELISTING_LABEL[values.ipWhitelistingStatus],
				},
				{ label: "SFTP", value: `${values.sftpProgress}%` },
				{ label: "EDI", value: `${values.ediProgress}%` },
			],
		},
		{
			title: "Operations",
			icon: AlertTriangle,
			items: [
				{
					label: "Escalated",
					value: values.escalated === "yes" ? "Yes" : "No",
				},
				{
					label: "Reason",
					value: values.escalationReason
						? ESCALATION_REASON_LABEL[values.escalationReason]
						: "—",
				},
				{ label: "EDI analyst", value: ediAnalystLabel },
			],
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 to-transparent px-4 py-4">
				<div className="flex size-14 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-lg font-bold text-primary">
					{values.vendorType}
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-lg font-semibold text-foreground">
						{values.name || "TPA/TPV name"}
					</p>
					<p className="font-mono text-sm text-muted-foreground">
						{values.code || "Code auto-generated on create"}
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Wave {values.wave || "—"} · {values.serverType || "Server TBD"}
					</p>
				</div>
			</div>

			{groups.map((group) => (
				<section
					key={group.title}
					className="overflow-hidden rounded-lg border border-border/60 bg-card"
				>
					<div className="flex items-center gap-2 border-b border-border/40 px-3 py-2.5">
						<span
							aria-hidden
							className="h-3.5 w-0.5 shrink-0 rounded-full bg-primary"
						/>
						<p className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
							{group.title}
						</p>
					</div>
					<div className="grid gap-x-6 gap-y-0 px-3 py-1 sm:grid-cols-2">
						{group.items.map((row) => (
							<div
								key={`${group.title}-${row.label}`}
								className="flex items-center justify-between gap-4 border-b border-border/30 py-2.5 last:border-b-0"
							>
								<span className="text-xs font-medium text-muted-foreground">
									{row.label}
								</span>
								<span className="max-w-[58%] truncate text-right text-sm font-semibold text-foreground">
									{row.value}
								</span>
							</div>
						))}
					</div>
				</section>
			))}

			{values.nextStep || values.notes ? (
				<section className="rounded-lg border border-border/60 px-3 py-3">
					{values.nextStep ? (
						<div className="mb-2">
							<p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
								Next step
							</p>
							<p className="mt-1 text-sm text-foreground">{values.nextStep}</p>
						</div>
					) : null}
					{values.notes ? (
						<div>
							<p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
								Notes
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{values.notes}
							</p>
						</div>
					) : null}
				</section>
			) : null}
		</div>
	);
}

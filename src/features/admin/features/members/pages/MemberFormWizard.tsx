"use client";

import { type ReactNode, useMemo, useRef, useState } from "react";

import {
	BadgeCheck,
	Building2,
	Check,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	HeartPulse,
	IdCard,
	Loader2,
	MapPin,
	Sparkles,
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
import { Textarea } from "@/components/ui/textarea";
import { displayName } from "@/features/admin/features/members/feature/api/membersApi";
import {
	MemberFamilyDraftEditor,
	type MemberFamilyDraftHandle,
	type PendingFamilyDependent,
} from "@/features/admin/features/members/pages/member-family-editor";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type {
	MemberDemographicsWrite,
	MemberEligibilityWrite,
	MemberEmploymentGroupWrite,
	MemberPlanCoverageWrite,
	MemberWriteBody,
} from "@/lib/vendor-core/types";

export const MEMBER_WIZARD_STEPS = [
	{
		id: "account",
		title: "Account",
		hint: "Vendor, member ID & program",
		icon: Building2,
	},
	{
		id: "profile",
		title: "Profile",
		hint: "Name, status & demographics",
		icon: IdCard,
	},
	{
		id: "contact",
		title: "Contact",
		hint: "Phone, email & addresses",
		icon: MapPin,
	},
	{
		id: "coverage",
		title: "Coverage",
		hint: "Eligibility, plan & group",
		icon: HeartPulse,
	},
	{
		id: "family",
		title: "Family",
		hint: "Optional dependents",
		icon: Users,
	},
	{
		id: "review",
		title: "Review",
		hint: "Confirm & create",
		icon: ClipboardList,
	},
] as const;

export type MemberWizardStepId = (typeof MEMBER_WIZARD_STEPS)[number]["id"];

export type MemberWizardValues = {
	vendor_id: string;
	write: MemberWriteBody;
};

export function emptyMemberWrite(): MemberWriteBody {
	return {
		cardholder_id: "",
		person_code: "01",
		first_name: "",
		middle_name: "",
		last_name: "",
		status: "active",
		relationship_code: "18",
		demographics: {
			gender: "M",
			communication_preference: "phone",
		},
		eligibility: { status: "active", secondary_coverage: false },
		plan_coverage: {},
		employment_group: {},
	};
}

export const EMPTY_MEMBER_WIZARD: MemberWizardValues = {
	vendor_id: "",
	write: emptyMemberWrite(),
};

function patchNested<K extends keyof MemberWriteBody>(
	body: MemberWriteBody,
	key: K,
	patch: Partial<NonNullable<MemberWriteBody[K]>>
): MemberWriteBody {
	const current = (body[key] ?? {}) as object;
	return { ...body, [key]: { ...current, ...patch } };
}

function stepIndex(id: MemberWizardStepId) {
	return MEMBER_WIZARD_STEPS.findIndex((step) => step.id === id);
}

const STATUS_LABELS: Record<string, string> = {
	active: "Active",
	pending: "Pending",
	inactive: "Inactive",
	termed: "Termed",
};

const GENDER_LABELS: Record<string, string> = {
	M: "Male",
	F: "Female",
	O: "Other",
	U: "Unknown",
};

function composeMemberPreview(values: MemberWizardValues) {
	const w = values.write;
	const name =
		[w.first_name, w.middle_name, w.last_name].filter(Boolean).join(" ") ||
		"Member name";
	const initials = [w.first_name?.[0], w.last_name?.[0]]
		.filter(Boolean)
		.join("")
		.toUpperCase();
	return { name, initials: initials || "?" };
}

function validateAccount(values: MemberWizardValues): string | null {
	if (!values.vendor_id.trim()) return "Select a vendor.";
	if (!values.write.cardholder_id?.trim()) return "Cardholder ID is required.";
	if (!values.write.person_code?.trim()) return "Person code is required.";
	if (!values.write.relationship_code?.trim())
		return "Relationship code is required.";
	return null;
}

function validateProfile(values: MemberWizardValues): string | null {
	if (!values.write.first_name?.trim() || !values.write.last_name?.trim()) {
		return "First and last name are required.";
	}
	if (!values.write.status?.trim()) return "Member status is required.";
	const demo = values.write.demographics ?? {};
	if (!demo.date_of_birth) return "Date of birth is required.";
	if (!demo.gender?.trim()) return "Gender is required.";
	return null;
}

function validateContact(values: MemberWizardValues): string | null {
	if (!values.write.demographics?.phone?.trim()) return "Phone is required.";
	return null;
}

function validateCoverage(values: MemberWizardValues): string | null {
	const elig = values.write.eligibility ?? {};
	const plan = values.write.plan_coverage ?? {};
	if (!elig.status?.trim()) return "Eligibility status is required.";
	if (!elig.enrollment_date) return "Enrollment date is required.";
	if (!plan.plan_name?.trim()) return "Plan name is required.";
	if (!plan.plan_code?.trim()) return "Plan code is required.";
	if (!plan.coverage_effective_date)
		return "Coverage effective date is required.";
	return null;
}

export function MemberFormWizard({
	values,
	pendingFamily,
	onChange,
	onPendingFamilyChange,
	vendors,
	busy,
	error,
	onCancelHref,
	onSubmit,
}: {
	values: MemberWizardValues;
	pendingFamily: PendingFamilyDependent[];
	onChange: (patch: Partial<MemberWizardValues>) => void;
	onPendingFamilyChange: (next: PendingFamilyDependent[]) => void;
	vendors: { id: string; name: string }[];
	busy?: boolean;
	error?: string | null;
	onCancelHref: string;
	onSubmit: (pendingFamily: PendingFamilyDependent[]) => Promise<void>;
}) {
	const [step, setStep] = useState<MemberWizardStepId>("account");
	const familyFlushRef = useRef<MemberFamilyDraftHandle | null>(null);
	const current = stepIndex(step);
	const last = MEMBER_WIZARD_STEPS.length - 1;

	const accountError = useMemo(() => validateAccount(values), [values]);
	const profileError = useMemo(() => validateProfile(values), [values]);
	const contactError = useMemo(() => validateContact(values), [values]);
	const coverageError = useMemo(() => validateCoverage(values), [values]);

	const stepError = useMemo(() => {
		if (step === "account") return accountError;
		if (step === "profile") return profileError;
		if (step === "contact") return contactError;
		if (step === "coverage") return coverageError;
		return null;
	}, [step, accountError, profileError, contactError, coverageError]);

	function canAdvance() {
		if (step === "account") return !accountError;
		if (step === "profile") return !profileError;
		if (step === "contact") return !contactError;
		if (step === "coverage") return !coverageError;
		return true;
	}

	function goNext() {
		if (!canAdvance()) return;
		const next = MEMBER_WIZARD_STEPS[current + 1];
		if (next) setStep(next.id);
	}

	function goBack() {
		const prev = MEMBER_WIZARD_STEPS[current - 1];
		if (prev) setStep(prev.id);
	}

	function selectStep(index: number) {
		if (index <= current) setStep(MEMBER_WIZARD_STEPS[index]!.id);
	}

	const progressPct = Math.round(
		((current + 1) / MEMBER_WIZARD_STEPS.length) * 100
	);

	const vendorName =
		vendors.find((v) => v.id === values.vendor_id)?.name ?? "Vendor pending";

	async function handleSubmit() {
		const flushed = familyFlushRef.current?.flush() ?? pendingFamily;
		await onSubmit(flushed);
	}

	function patchWrite(patch: Partial<MemberWriteBody>) {
		onChange({ write: { ...values.write, ...patch } });
	}

	function patchDemo(patch: Partial<MemberDemographicsWrite>) {
		onChange({ write: patchNested(values.write, "demographics", patch) });
	}

	function patchElig(patch: Partial<MemberEligibilityWrite>) {
		onChange({ write: patchNested(values.write, "eligibility", patch) });
	}

	function patchPlan(patch: Partial<MemberPlanCoverageWrite>) {
		onChange({ write: patchNested(values.write, "plan_coverage", patch) });
	}

	function patchGroup(patch: Partial<MemberEmploymentGroupWrite>) {
		onChange({ write: patchNested(values.write, "employment_group", patch) });
	}

	const w = values.write;
	const demo = w.demographics ?? {};
	const elig = w.eligibility ?? {};
	const plan = w.plan_coverage ?? {};
	const group = w.employment_group ?? {};

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
								href="/admin/members"
								className="transition-colors hover:text-foreground"
							>
								Members
							</Link>
							<span className="mx-1.5 text-border/80">/</span>
							<span className="font-medium text-foreground">New member</span>
						</p>
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							Create member
						</h1>
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Six-step enrollment: account, profile, contact, coverage, optional
							family, then review.
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
							Step {current + 1} of {MEMBER_WIZARD_STEPS.length}
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
										{MEMBER_WIZARD_STEPS[current]?.title}
									</h2>
									<p className="text-xs text-muted-foreground">
										{MEMBER_WIZARD_STEPS[current]?.hint}
									</p>
								</div>
							</div>
							{step !== "review" && step !== "family" ? (
								<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
									<Sparkles className="size-3" />
									Required fields marked *
								</span>
							) : null}
						</div>
					</div>

					<div className="flex-1 px-6 py-7 sm:px-8 sm:py-8">
						{step === "account" ? (
							<AccountStep
								values={values}
								vendors={vendors}
								onVendorChange={(vendor_id) => onChange({ vendor_id })}
								onChange={patchWrite}
							/>
						) : null}
						{step === "profile" ? (
							<ProfileStep
								values={values}
								vendorName={vendorName}
								onChange={patchWrite}
								onDemoChange={patchDemo}
							/>
						) : null}
						{step === "contact" ? (
							<ContactStep demo={demo} onDemoChange={patchDemo} />
						) : null}
						{step === "coverage" ? (
							<CoverageStep
								elig={elig}
								plan={plan}
								group={group}
								onEligChange={patchElig}
								onPlanChange={patchPlan}
								onGroupChange={patchGroup}
							/>
						) : null}
						{step === "family" ? (
							<MemberFamilyDraftEditor
								variant="wizard"
								vendorId={values.vendor_id}
								subscriberCardholderId={w.cardholder_id}
								value={pendingFamily}
								onChange={onPendingFamilyChange}
								flushRef={familyFlushRef}
							/>
						) : null}
						{step === "review" ? (
							<ReviewStep
								values={values}
								vendorName={vendorName}
								pendingFamily={pendingFamily}
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
						<Button
							asChild
							variant="ghost"
							className="px-0 text-muted-foreground"
						>
							<Link href={onCancelHref}>Cancel</Link>
						</Button>
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
										Boolean(accountError) ||
										Boolean(profileError) ||
										Boolean(contactError) ||
										Boolean(coverageError)
									}
									onClick={() => void handleSubmit()}
								>
									{busy ? (
										<Loader2 className="mr-2 size-4 animate-spin" />
									) : (
										<BadgeCheck className="mr-2 size-4" />
									)}
									Create member
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
			aria-label="Member form steps"
			className="rounded-2xl border border-border/50 bg-card p-3"
		>
			<ol className="space-y-0.5">
				{MEMBER_WIZARD_STEPS.map((item, index) => {
					const Icon = item.icon;
					const done = index < current;
					const active = index === current;
					const isLast = index === MEMBER_WIZARD_STEPS.length - 1;
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
			aria-label="Member form steps"
			className="overflow-hidden rounded-2xl border border-border/50 bg-card px-3 py-4 sm:px-5"
		>
			<ol className="flex items-start">
				{MEMBER_WIZARD_STEPS.map((item, index) => {
					const Icon = item.icon;
					const done = index < current;
					const active = index === current;
					return (
						<li key={item.id} className="flex min-w-0 flex-1 items-start">
							<button
								type="button"
								disabled={index > current}
								onClick={() => onSelect(index)}
								className="flex min-w-0 flex-col items-center gap-2 text-center disabled:cursor-default"
							>
								<span className={stepMarkClass(done, active)}>
									{done ? (
										<Check className="size-4" strokeWidth={2.4} />
									) : (
										<Icon className="size-4" strokeWidth={2} />
									)}
								</span>
								<span className="min-w-0">
									<p
										className={cn(
											"text-[10px] font-medium sm:text-xs",
											active || done
												? "text-foreground"
												: "text-muted-foreground"
										)}
									>
										{item.title}
									</p>
								</span>
							</button>
							{index < MEMBER_WIZARD_STEPS.length - 1 ? (
								<span
									aria-hidden
									className={cn(
										"mx-1 mt-5 h-px min-w-2 flex-1",
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

function Field({
	label,
	hint,
	required,
	className,
	children,
}: {
	label: string;
	hint?: string;
	required?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<label className={cn("grid gap-1.5", className)}>
			<span className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
				{label}
				{required ? <span className="text-destructive"> *</span> : null}
			</span>
			{children}
			{hint ? (
				<span className="text-xs font-normal text-muted-foreground">
					{hint}
				</span>
			) : null}
		</label>
	);
}

function AccountStep({
	values,
	vendors,
	onVendorChange,
	onChange,
}: {
	values: MemberWizardValues;
	vendors: { id: string; name: string }[];
	onVendorChange: (id: string) => void;
	onChange: (patch: Partial<MemberWriteBody>) => void;
}) {
	const w = values.write;
	return (
		<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
			<div className="grid gap-5 sm:grid-cols-2">
				<Field label="Vendor" required className="sm:col-span-2">
					<Select value={values.vendor_id} onValueChange={onVendorChange}>
						<SelectTrigger className="h-11">
							<SelectValue placeholder="Select vendor" />
						</SelectTrigger>
						<SelectContent>
							{vendors.map((v) => (
								<SelectItem key={v.id} value={v.id}>
									{v.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<Field label="Cardholder ID" required hint="Primary member identifier.">
					<Input
						value={w.cardholder_id ?? ""}
						onChange={(e) => onChange({ cardholder_id: e.target.value })}
						placeholder="MDH-100234"
						className="h-11 font-mono"
					/>
				</Field>
				<Field
					label="Person code"
					required
					hint="01 = subscriber, 02+ = dependent."
				>
					<Input
						value={w.person_code ?? ""}
						onChange={(e) => onChange({ person_code: e.target.value })}
						placeholder="01"
						className="h-11 font-mono"
					/>
				</Field>
				<Field label="External ID">
					<Input
						value={w.external_id ?? ""}
						onChange={(e) => onChange({ external_id: e.target.value })}
						className="h-11 font-mono"
					/>
				</Field>
				<Field label="NewTech Member ID" hint="8-digit numeric.">
					<Input
						value={w.newtech_member_id ?? ""}
						onChange={(e) => onChange({ newtech_member_id: e.target.value })}
						className="h-11 font-mono"
						inputMode="numeric"
						maxLength={8}
						placeholder="12345678"
					/>
				</Field>
				<Field label="NewTech Family ID" hint="8-digit numeric.">
					<Input
						value={w.newtech_family_id ?? ""}
						onChange={(e) => onChange({ newtech_family_id: e.target.value })}
						className="h-11 font-mono"
						inputMode="numeric"
						maxLength={8}
						placeholder="12345678"
					/>
				</Field>
				<Field
					label="Relationship code"
					required
					hint="18 = Self, 01 = Spouse, 19 = Child."
				>
					<Input
						value={w.relationship_code ?? ""}
						onChange={(e) => onChange({ relationship_code: e.target.value })}
						placeholder="18"
						className="h-11 font-mono"
					/>
				</Field>
				<Field label="Program">
					<Input
						value={w.program ?? ""}
						onChange={(e) => onChange({ program: e.target.value })}
						placeholder="MDH"
						className="h-11"
					/>
				</Field>
				<Field label="Line of business">
					<Input
						value={w.lob ?? ""}
						onChange={(e) => onChange({ lob: e.target.value })}
						placeholder="Medicaid"
						className="h-11"
					/>
				</Field>
				<Field label="Source system" className="sm:col-span-2">
					<Input
						value={w.source_system ?? ""}
						onChange={(e) => onChange({ source_system: e.target.value })}
						placeholder="834, manual entry…"
						className="h-11"
					/>
				</Field>
			</div>
			<aside className="h-fit rounded-xl border border-border/60 bg-linear-to-b from-muted/30 to-card p-4 shadow-sm">
				<p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
					Account tip
				</p>
				<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
					Cardholder ID + person code uniquely identify the member under the
					vendor. Use <span className="font-mono text-foreground">01</span> for
					subscribers.
				</p>
			</aside>
		</div>
	);
}

function ProfileStep({
	values,
	vendorName,
	onChange,
	onDemoChange,
}: {
	values: MemberWizardValues;
	vendorName: string;
	onChange: (patch: Partial<MemberWriteBody>) => void;
	onDemoChange: (patch: Partial<MemberDemographicsWrite>) => void;
}) {
	const w = values.write;
	const demo = w.demographics ?? {};
	const preview = composeMemberPreview(values);
	const status = w.status ?? "active";

	return (
		<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
			<div className="grid gap-5 sm:grid-cols-2">
				<Field label="First name" required>
					<Input
						value={w.first_name ?? ""}
						onChange={(e) => onChange({ first_name: e.target.value })}
						className="h-11"
					/>
				</Field>
				<Field label="Last name" required>
					<Input
						value={w.last_name ?? ""}
						onChange={(e) => onChange({ last_name: e.target.value })}
						className="h-11"
					/>
				</Field>
				<Field label="Middle name">
					<Input
						value={w.middle_name ?? ""}
						onChange={(e) => onChange({ middle_name: e.target.value })}
						className="h-11"
					/>
				</Field>
				<Field label="Preferred name">
					<Input
						value={demo.preferred_name ?? ""}
						onChange={(e) => onDemoChange({ preferred_name: e.target.value })}
						className="h-11"
					/>
				</Field>
				<Field label="Date of birth" required>
					<Input
						type="date"
						value={demo.date_of_birth ?? ""}
						onChange={(e) =>
							onDemoChange({ date_of_birth: e.target.value || null })
						}
						className="h-11"
					/>
				</Field>
				<Field label="Gender" required>
					<Select
						value={demo.gender || "M"}
						onValueChange={(gender) => onDemoChange({ gender })}
					>
						<SelectTrigger className="h-11">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(GENDER_LABELS).map(([key, label]) => (
								<SelectItem key={key} value={key}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<Field label="Member status" required>
					<Select
						value={status}
						onValueChange={(status) => onChange({ status })}
					>
						<SelectTrigger className="h-11">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(STATUS_LABELS).map(([key, label]) => (
								<SelectItem key={key} value={key}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<Field label="Member since">
					<Input
						type="date"
						value={w.member_since ?? ""}
						onChange={(e) => onChange({ member_since: e.target.value || null })}
						className="h-11"
					/>
				</Field>
				<Field label="Alternate ID">
					<Input
						value={demo.alternate_id ?? ""}
						onChange={(e) => onDemoChange({ alternate_id: e.target.value })}
						className="h-11 font-mono"
					/>
				</Field>
				<Field label="SSN last 4">
					<Input
						maxLength={4}
						value={demo.ssn_last4 ?? ""}
						onChange={(e) =>
							onDemoChange({
								ssn_last4: e.target.value.replace(/\D/g, "").slice(0, 4),
							})
						}
						className="h-11 font-mono"
					/>
				</Field>
				<Field label="PCP name">
					<Input
						value={w.pcp_name ?? ""}
						onChange={(e) => onChange({ pcp_name: e.target.value })}
						className="h-11"
					/>
				</Field>
				<Field label="PCP NPI">
					<Input
						value={w.pcp_npi ?? ""}
						onChange={(e) => onChange({ pcp_npi: e.target.value })}
						className="h-11 font-mono"
					/>
				</Field>
			</div>

			<aside className="h-fit overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
				<div className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent px-4 py-5">
					<div className="flex items-center gap-3">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-sm font-bold text-primary">
							{preview.initials}
						</div>
						<div className="min-w-0">
							<p className="truncate text-base font-semibold text-foreground">
								{preview.name}
							</p>
							<p className="truncate font-mono text-xs text-muted-foreground">
								{w.cardholder_id || "ID pending"}
							</p>
						</div>
					</div>
				</div>
				<div className="space-y-1.5 p-3">
					<PreviewRow label="Vendor" value={vendorName} />
					<PreviewRow label="Status" value={STATUS_LABELS[status] ?? status} />
					<PreviewRow
						label="Program"
						value={[w.program, w.lob].filter(Boolean).join(" · ") || "—"}
					/>
					<PreviewRow
						label="Gender"
						value={GENDER_LABELS[demo.gender ?? "M"] ?? "—"}
					/>
				</div>
			</aside>
		</div>
	);
}

function PreviewRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-md border border-border/50 px-2.5 py-2">
			<span className="text-[11px] font-medium text-muted-foreground">
				{label}
			</span>
			<span className="truncate text-xs font-semibold text-foreground">
				{value}
			</span>
		</div>
	);
}

function ContactStep({
	demo,
	onDemoChange,
}: {
	demo: MemberDemographicsWrite;
	onDemoChange: (patch: Partial<MemberDemographicsWrite>) => void;
}) {
	return (
		<div className="space-y-8">
			<div className="grid gap-5 sm:grid-cols-2">
				<Field label="Phone" required>
					<Input
						value={demo.phone ?? ""}
						onChange={(e) => onDemoChange({ phone: e.target.value })}
						placeholder="(202) 555-0100"
						className="h-11"
					/>
				</Field>
				<Field label="Email">
					<Input
						type="email"
						value={demo.email ?? ""}
						onChange={(e) => onDemoChange({ email: e.target.value })}
						className="h-11"
					/>
				</Field>
				<Field label="Communication preference">
					<Select
						value={demo.communication_preference || "phone"}
						onValueChange={(v) => onDemoChange({ communication_preference: v })}
					>
						<SelectTrigger className="h-11">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="phone">Phone</SelectItem>
							<SelectItem value="email">Email</SelectItem>
							<SelectItem value="mail">Mail</SelectItem>
							<SelectItem value="sms">SMS</SelectItem>
						</SelectContent>
					</Select>
				</Field>
				<Field label="Preferred language">
					<Input
						value={demo.preferred_language ?? ""}
						onChange={(e) =>
							onDemoChange({ preferred_language: e.target.value })
						}
						placeholder="English"
						className="h-11"
					/>
				</Field>
			</div>

			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Residential address
				</p>
				<div className="grid gap-5 sm:grid-cols-2">
					<Field label="Address line 1" className="sm:col-span-2">
						<Input
							value={demo.address_line1 ?? ""}
							onChange={(e) => onDemoChange({ address_line1: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="Address line 2" className="sm:col-span-2">
						<Input
							value={demo.address_line2 ?? ""}
							onChange={(e) => onDemoChange({ address_line2: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="City">
						<Input
							value={demo.city ?? ""}
							onChange={(e) => onDemoChange({ city: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="State">
						<Input
							value={demo.state ?? ""}
							onChange={(e) => onDemoChange({ state: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="Postal code">
						<Input
							value={demo.postal_code ?? ""}
							onChange={(e) => onDemoChange({ postal_code: e.target.value })}
							className="h-11"
						/>
					</Field>
				</div>
			</div>

			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Emergency contact
				</p>
				<div className="grid gap-5 sm:grid-cols-2">
					<Field label="Name">
						<Input
							value={demo.emergency_contact_name ?? ""}
							onChange={(e) =>
								onDemoChange({ emergency_contact_name: e.target.value })
							}
							className="h-11"
						/>
					</Field>
					<Field label="Phone">
						<Input
							value={demo.emergency_contact_phone ?? ""}
							onChange={(e) =>
								onDemoChange({ emergency_contact_phone: e.target.value })
							}
							className="h-11"
						/>
					</Field>
					<Field label="Relation" className="sm:col-span-2">
						<Input
							value={demo.emergency_contact_relation ?? ""}
							onChange={(e) =>
								onDemoChange({ emergency_contact_relation: e.target.value })
							}
							className="h-11"
						/>
					</Field>
				</div>
			</div>

			<Field
				label="Mailing address"
				hint="If different from residential address."
			>
				<Textarea
					value={
						[
							demo.mailing_address_line1,
							demo.mailing_address_line2,
							[demo.mailing_city, demo.mailing_state, demo.mailing_postal_code]
								.filter(Boolean)
								.join(" "),
						]
							.filter(Boolean)
							.join("\n") || ""
					}
					onChange={(e) => {
						const lines = e.target.value.split("\n");
						onDemoChange({
							mailing_address_line1: lines[0] ?? "",
							mailing_address_line2: lines[1] ?? "",
						});
					}}
					placeholder="PO Box or alternate mailing address"
					rows={3}
				/>
			</Field>
		</div>
	);
}

function CoverageStep({
	elig,
	plan,
	group,
	onEligChange,
	onPlanChange,
	onGroupChange,
}: {
	elig: MemberEligibilityWrite;
	plan: MemberPlanCoverageWrite;
	group: MemberEmploymentGroupWrite;
	onEligChange: (patch: Partial<MemberEligibilityWrite>) => void;
	onPlanChange: (patch: Partial<MemberPlanCoverageWrite>) => void;
	onGroupChange: (patch: Partial<MemberEmploymentGroupWrite>) => void;
}) {
	return (
		<div className="space-y-8">
			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Eligibility
				</p>
				<div className="grid gap-5 sm:grid-cols-2">
					<Field label="Eligibility status" required>
						<Select
							value={elig.status || "active"}
							onValueChange={(status) => onEligChange({ status })}
						>
							<SelectTrigger className="h-11">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
								<SelectItem value="terminated">Terminated</SelectItem>
							</SelectContent>
						</Select>
					</Field>
					<Field label="Enrollment date" required>
						<Input
							type="date"
							value={elig.enrollment_date ?? ""}
							onChange={(e) =>
								onEligChange({ enrollment_date: e.target.value || null })
							}
							className="h-11"
						/>
					</Field>
					<Field label="Status effective">
						<Input
							type="date"
							value={elig.status_effective_date ?? ""}
							onChange={(e) =>
								onEligChange({
									status_effective_date: e.target.value || null,
								})
							}
							className="h-11"
						/>
					</Field>
					<Field label="Disenrollment date">
						<Input
							type="date"
							value={elig.disenrollment_date ?? ""}
							onChange={(e) =>
								onEligChange({
									disenrollment_date: e.target.value || null,
								})
							}
							className="h-11"
						/>
					</Field>
				</div>
			</div>

			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Plan assignment
				</p>
				<div className="grid gap-5 sm:grid-cols-2">
					<Field label="Plan name" required>
						<Input
							value={plan.plan_name ?? ""}
							onChange={(e) => onPlanChange({ plan_name: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="Plan code" required>
						<Input
							value={plan.plan_code ?? ""}
							onChange={(e) => onPlanChange({ plan_code: e.target.value })}
							className="h-11 font-mono"
						/>
					</Field>
					<Field label="Benefit package">
						<Input
							value={plan.benefit_package ?? ""}
							onChange={(e) =>
								onPlanChange({ benefit_package: e.target.value })
							}
							className="h-11"
						/>
					</Field>
					<Field label="Coverage level">
						<Input
							value={plan.coverage_level ?? ""}
							onChange={(e) => onPlanChange({ coverage_level: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="Coverage effective" required>
						<Input
							type="date"
							value={plan.coverage_effective_date ?? ""}
							onChange={(e) =>
								onPlanChange({
									coverage_effective_date: e.target.value || null,
								})
							}
							className="h-11"
						/>
					</Field>
					<Field label="Coverage term">
						<Input
							type="date"
							value={plan.coverage_term_date ?? ""}
							onChange={(e) =>
								onPlanChange({
									coverage_term_date: e.target.value || null,
								})
							}
							className="h-11"
						/>
					</Field>
				</div>
			</div>

			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Employment / group
				</p>
				<div className="grid gap-5 sm:grid-cols-2">
					<Field label="Group ID">
						<Input
							value={group.group_id ?? ""}
							onChange={(e) => onGroupChange({ group_id: e.target.value })}
							className="h-11 font-mono"
						/>
					</Field>
					<Field label="Group name">
						<Input
							value={group.group_name ?? ""}
							onChange={(e) => onGroupChange({ group_name: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="Account type">
						<Input
							value={group.account_type ?? ""}
							onChange={(e) => onGroupChange({ account_type: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="Member type">
						<Input
							value={group.member_type ?? ""}
							onChange={(e) => onGroupChange({ member_type: e.target.value })}
							className="h-11"
						/>
					</Field>
				</div>
			</div>
		</div>
	);
}

function ReviewStep({
	values,
	vendorName,
	pendingFamily,
}: {
	values: MemberWizardValues;
	vendorName: string;
	pendingFamily: PendingFamilyDependent[];
}) {
	const w = values.write;
	const demo = w.demographics ?? {};
	const elig = w.eligibility ?? {};
	const plan = w.plan_coverage ?? {};
	const group = w.employment_group ?? {};
	const preview = composeMemberPreview(values);

	const address = [
		demo.address_line1,
		demo.address_line2,
		[demo.city, demo.state, demo.postal_code].filter(Boolean).join(" "),
	]
		.filter(Boolean)
		.join(", ");

	const groups: Array<{
		title: string;
		items: Array<{ label: string; value: string }>;
	}> = [
		{
			title: "Account",
			items: [
				{ label: "Vendor", value: vendorName },
				{ label: "Cardholder ID", value: w.cardholder_id || "—" },
				{ label: "Person code", value: w.person_code || "—" },
				{ label: "External ID", value: w.external_id || "—" },
				{ label: "NewTech Member ID", value: w.newtech_member_id || "—" },
				{ label: "NewTech Family ID", value: w.newtech_family_id || "—" },
				{ label: "Relationship", value: w.relationship_code || "—" },
				{ label: "Program", value: w.program || "—" },
				{ label: "LOB", value: w.lob || "—" },
			],
		},
		{
			title: "Profile",
			items: [
				{
					label: "Name",
					value: displayName({
						firstName: w.first_name ?? "",
						middleName: w.middle_name ?? "",
						lastName: w.last_name ?? "",
					}),
				},
				{
					label: "Status",
					value: STATUS_LABELS[w.status ?? ""] ?? w.status ?? "—",
				},
				{ label: "Date of birth", value: demo.date_of_birth || "—" },
				{
					label: "Gender",
					value: GENDER_LABELS[demo.gender ?? ""] ?? demo.gender ?? "—",
				},
				{ label: "Alternate ID", value: demo.alternate_id || "—" },
				{ label: "PCP", value: w.pcp_name || "—" },
			],
		},
		{
			title: "Contact",
			items: [
				{ label: "Phone", value: demo.phone || "—" },
				{ label: "Email", value: demo.email || "—" },
				{ label: "Address", value: address || "—" },
				{
					label: "Emergency",
					value: demo.emergency_contact_name
						? `${demo.emergency_contact_name} · ${demo.emergency_contact_phone ?? ""}`
						: "—",
				},
			],
		},
		{
			title: "Coverage",
			items: [
				{
					label: "Eligibility",
					value: elig.status || "—",
				},
				{ label: "Enrollment", value: elig.enrollment_date || "—" },
				{ label: "Plan", value: plan.plan_name || "—" },
				{ label: "Plan code", value: plan.plan_code || "—" },
				{
					label: "Effective",
					value: plan.coverage_effective_date || "—",
				},
				{ label: "Group", value: group.group_name || group.group_id || "—" },
			],
		},
		{
			title: "Family",
			items: [
				{
					label: "Dependents staged",
					value:
						pendingFamily.length === 0
							? "None"
							: `${pendingFamily.length} dependent${pendingFamily.length === 1 ? "" : "s"}`,
				},
				...pendingFamily.slice(0, 4).map((dep) => ({
					label: dep.relationshipLabel,
					value: `${dep.firstName} ${dep.lastName}`.trim() || "—",
				})),
			],
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 to-transparent px-4 py-4">
				<div className="flex size-14 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-lg font-bold text-primary">
					{preview.initials}
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-lg font-semibold text-foreground">
						{preview.name}
					</p>
					<p className="font-mono text-sm text-muted-foreground">
						{w.cardholder_id || "—"}
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{vendorName} · {w.program || "Program TBD"}
					</p>
				</div>
			</div>

			{groups.map((groupSection) => (
				<section
					key={groupSection.title}
					className="overflow-hidden rounded-lg border border-border/60 bg-card"
				>
					<div className="flex items-center gap-2 border-b border-border/40 px-3 py-2.5">
						<span
							aria-hidden
							className="h-3.5 w-0.5 shrink-0 rounded-full bg-primary"
						/>
						<p className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
							{groupSection.title}
						</p>
					</div>
					<div className="grid gap-x-6 gap-y-0 px-3 py-1 sm:grid-cols-2">
						{groupSection.items.map((row) => (
							<div
								key={`${groupSection.title}-${row.label}`}
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
		</div>
	);
}

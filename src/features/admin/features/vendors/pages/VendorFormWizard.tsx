"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
	BadgeCheck,
	Building2,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	FileText,
	Loader2,
	Plus,
	Server,
	Tags,
	Trash2,
	Users,
	Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTRACT_TYPE_OPTIONS } from "@/features/admin/features/contracts/feature/mappers/contractCoreMappers";
import type { RiskLevel, VendorStatus } from "@/features/shared/vms/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type {
	CredentialDto,
	VendorCategoryDto,
} from "@/lib/vendor-core/types";

import { toast } from "sonner";

import {
	discoverVendorHostKey,
	listVendorCredentials,
} from "../feature/api/vendorsApi";
import {
	defaultSftpPortForHost,
	isLocalSftpHost,
	portAfterHostChange,
} from "../connection-form";
import {
	EMPTY_VENDOR_WIZARD,
	VENDOR_WIZARD_STEPS,
	type VendorWizardStepId,
	type VendorWizardValues,
	countFilledAccounts,
	countFilledContacts,
	countFilledContracts,
	countFilledNotes,
	emptyAccountDraft,
	emptyContactDraft,
	emptyContractDraft,
	emptyJobDraft,
	emptyNoteDraft,
	validateAccountsStep,
	validateContactsStep,
	validateIdentityStep,
	validateIntegrationStep,
	validateNotesContractsStep,
} from "../feature/types/vendorWizardTypes";

export {
	EMPTY_VENDOR_WIZARD,
	VENDOR_WIZARD_STEPS,
	wizardValuesToVendorCreatePayload,
	type VendorWizardValues,
} from "../feature/types/vendorWizardTypes";

const STEP_ICONS = {
	identity: Building2,
	commercial: Tags,
	contacts: Users,
	accounts: Wallet,
	integration: Server,
	notes_contracts: FileText,
	review: ClipboardList,
} as const;

const STATUS_OPTIONS: VendorStatus[] = [
	"prospect",
	"invited",
	"onboarding",
	"under_review",
	"active",
	"suspended",
	"offboarded",
];

const RISK_OPTIONS: RiskLevel[] = ["low", "medium", "high", "critical"];

const LOB_OPTIONS = [
	{ value: "commercial", label: "Commercial" },
	{ value: "medicare", label: "Medicare" },
	{ value: "medicaid", label: "Medicaid" },
	{ value: "marketplace", label: "Marketplace" },
];

const FILE_TYPES = [
	"Eligibility (834)",
	"Medical Claims (837)",
	"Pharmacy Claims (835)",
	"Accumulator",
] as const;

function stepIndex(id: VendorWizardStepId) {
	return VENDOR_WIZARD_STEPS.findIndex((step) => step.id === id);
}

export function VendorFormWizard({
	values,
	onChange,
	categories,
	busy,
	error,
	statusMessage,
	onCancelHref,
	onSubmit,
}: {
	values: VendorWizardValues;
	onChange: (patch: Partial<VendorWizardValues>) => void;
	categories: VendorCategoryDto[];
	busy?: boolean;
	error?: string | null;
	statusMessage?: string | null;
	onCancelHref: string;
	onSubmit: () => Promise<void>;
}) {
	const [step, setStep] = useState<VendorWizardStepId>("identity");
	const current = stepIndex(step);
	const last = VENDOR_WIZARD_STEPS.length - 1;

	const identityError = useMemo(() => validateIdentityStep(values), [values]);
	const contactsError = useMemo(() => validateContactsStep(values), [values]);
	const accountsError = useMemo(() => validateAccountsStep(values), [values]);
	const integrationError = useMemo(
		() => validateIntegrationStep(values),
		[values]
	);
	const notesContractsError = useMemo(
		() => validateNotesContractsStep(values),
		[values]
	);

	function stepError(id: VendorWizardStepId): string | null {
		if (id === "identity") return identityError;
		if (id === "contacts") return contactsError;
		if (id === "accounts") return accountsError;
		if (id === "integration") return integrationError;
		if (id === "notes_contracts") return notesContractsError;
		return null;
	}

	function canAdvance() {
		return !stepError(step);
	}

	function goNext() {
		if (!canAdvance()) return;
		const next = VENDOR_WIZARD_STEPS[current + 1];
		if (next) setStep(next.id);
	}

	function goBack() {
		const prev = VENDOR_WIZARD_STEPS[current - 1];
		if (prev) setStep(prev.id);
	}

	function selectStep(index: number) {
		if (index <= current) setStep(VENDOR_WIZARD_STEPS[index]!.id);
	}

	const progressPct = Math.round(
		((current + 1) / VENDOR_WIZARD_STEPS.length) * 100
	);

	const displayName =
		values.trade_name.trim() || values.legal_name.trim() || "Vendor";

	return (
		<div className="w-full space-y-5 pb-4 lg:space-y-6">
			<header className="rounded-lg border border-border/50 bg-card/60 px-4 py-4 sm:px-5">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0 space-y-1.5">
						<p className="text-xs text-muted-foreground">
							<Link
								href="/admin/vendors"
								className="transition-colors hover:text-foreground"
							>
								Vendors
							</Link>
							<span className="mx-1.5 text-border/80">/</span>
							<span className="font-medium text-foreground">New vendor</span>
						</p>
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							Create vendor
						</h1>
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Seven-step onboarding: identity, commercial terms, contacts,
							accounts, integration, notes & contracts, then review.
						</p>
					</div>
					<p className="text-xs tabular-nums text-muted-foreground">
						Step {current + 1} of {VENDOR_WIZARD_STEPS.length}
					</p>
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
						<div className="flex items-center gap-2.5">
							<span
								aria-hidden
								className="h-5 w-0.5 shrink-0 rounded-full bg-primary"
							/>
							<h2 className="text-lg font-semibold tracking-tight text-foreground">
								{VENDOR_WIZARD_STEPS[current]?.title}
							</h2>
						</div>
						<p className="mt-1 text-sm text-muted-foreground">
							{VENDOR_WIZARD_STEPS[current]?.hint}
						</p>
					</div>

					<div className="flex-1 px-6 py-7 sm:px-8 sm:py-8">
						{step === "identity" ? (
							<IdentityStep values={values} onChange={onChange} />
						) : null}
						{step === "commercial" ? (
							<CommercialStep
								values={values}
								onChange={onChange}
								categories={categories}
							/>
						) : null}
						{step === "contacts" ? (
							<ContactsStep values={values} onChange={onChange} />
						) : null}
						{step === "accounts" ? (
							<AccountsStep values={values} onChange={onChange} />
						) : null}
						{step === "integration" ? (
							<IntegrationStep
								values={values}
								onChange={onChange}
								vendorName={displayName}
							/>
						) : null}
						{step === "notes_contracts" ? (
							<NotesContractsStep values={values} onChange={onChange} />
						) : null}
						{step === "review" ? (
							<ReviewStep values={values} categories={categories} />
						) : null}
						{stepError(step) ? (
							<p className="mt-4 text-sm text-destructive">{stepError(step)}</p>
						) : null}
					</div>

					{error ? (
						<p className="border-t border-destructive/20 bg-destructive/5 px-6 py-3 text-sm text-destructive sm:px-8">
							{error}
						</p>
					) : null}
					{statusMessage ? (
						<p className="border-t border-border/40 bg-muted/30 px-6 py-3 text-sm text-muted-foreground sm:px-8">
							{statusMessage}
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
										Boolean(identityError) ||
										Boolean(contactsError) ||
										Boolean(accountsError) ||
										Boolean(integrationError) ||
										Boolean(notesContractsError)
									}
									onClick={() => void onSubmit()}
								>
									{busy ? (
										<Loader2 className="mr-2 size-4 animate-spin" />
									) : (
										<BadgeCheck className="mr-2 size-4" />
									)}
									Create vendor
								</Button>
							)}
						</div>
					</footer>
				</section>
			</div>
		</div>
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
		<label className={cn("grid gap-2 text-sm font-medium", className)}>
			<span>
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

function IdentityStep({
	values,
	onChange,
}: {
	values: VendorWizardValues;
	onChange: (patch: Partial<VendorWizardValues>) => void;
}) {
	return (
		<div className="grid gap-5 sm:grid-cols-2">
			<Field
				label="Vendor code"
				hint="Leave blank to auto-generate."
				className="sm:col-span-2"
			>
				<Input
					value={values.vendor_code}
					onChange={(e) => onChange({ vendor_code: e.target.value })}
					className="h-11 font-mono"
				/>
			</Field>
			<Field label="Legal name" required>
				<Input
					required
					value={values.legal_name}
					onChange={(e) => onChange({ legal_name: e.target.value })}
					className="h-11"
				/>
			</Field>
			<Field label="Trade name">
				<Input
					value={values.trade_name}
					onChange={(e) => onChange({ trade_name: e.target.value })}
					className="h-11"
				/>
			</Field>
			<Field label="Status">
				<Select
					value={values.status}
					onValueChange={(status) =>
						onChange({ status: status as VendorStatus })
					}
				>
					<SelectTrigger className="h-11">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{STATUS_OPTIONS.map((option) => (
							<SelectItem key={option} value={option}>
								{option.replace(/_/g, " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>
			<Field label="Country" required>
				<Input
					required
					value={values.country}
					onChange={(e) => onChange({ country: e.target.value })}
					className="h-11"
				/>
			</Field>
			<Field label="City" required>
				<Input
					required
					value={values.city}
					onChange={(e) => onChange({ city: e.target.value })}
					className="h-11"
				/>
			</Field>
			<Field label="Website" className="sm:col-span-2">
				<Input
					type="url"
					value={values.website}
					onChange={(e) => onChange({ website: e.target.value })}
					placeholder="https://"
					className="h-11"
				/>
			</Field>
			<Field label="Tax ID">
				<Input
					value={values.tax_id}
					onChange={(e) => onChange({ tax_id: e.target.value })}
					className="h-11 font-mono"
				/>
			</Field>
			<Field label="Tags" hint="Comma-separated labels.">
				<Input
					value={values.tags}
					onChange={(e) => onChange({ tags: e.target.value })}
					placeholder="edi, pharmacy"
					className="h-11"
				/>
			</Field>
			<Field label="Description" className="sm:col-span-2">
				<Textarea
					rows={4}
					value={values.description}
					onChange={(e) => onChange({ description: e.target.value })}
				/>
			</Field>
		</div>
	);
}

function CommercialStep({
	values,
	onChange,
	categories,
}: {
	values: VendorWizardValues;
	onChange: (patch: Partial<VendorWizardValues>) => void;
	categories: VendorCategoryDto[];
}) {
	function toggleCategory(categoryId: string, checked: boolean) {
		const next = checked
			? [...values.category_ids, categoryId]
			: values.category_ids.filter((id) => id !== categoryId);
		const primary =
			values.primary_category_id && next.includes(values.primary_category_id)
				? values.primary_category_id
				: (next[0] ?? "");
		onChange({ category_ids: next, primary_category_id: primary });
	}

	return (
		<div className="space-y-6">
			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Categories
				</p>
				{categories.length === 0 ? (
					<p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
						No categories on vendor-core yet. You can assign categories later
						from the vendor detail page.
					</p>
				) : (
					<div className="grid gap-2 sm:grid-cols-2">
						{categories.map((category) => {
							const checked = values.category_ids.includes(category.id);
							const isPrimary = values.primary_category_id === category.id;
							return (
								<div
									key={category.id}
									className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-3"
								>
									<Checkbox
										checked={checked}
										onCheckedChange={(next) =>
											toggleCategory(category.id, next === true)
										}
									/>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium">{category.name}</p>
										<p className="text-xs text-muted-foreground">
											{category.code}
										</p>
										{checked ? (
											<label className="mt-2 flex items-center gap-2 text-xs">
												<Checkbox
													checked={isPrimary}
													onCheckedChange={(next) => {
														if (next === true) {
															onChange({
																primary_category_id: category.id,
															});
														}
													}}
												/>
												Primary category
											</label>
										) : null}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div className="grid gap-5 sm:grid-cols-2">
				<Field label="Risk level">
					<Select
						value={values.risk_level}
						onValueChange={(risk_level) =>
							onChange({ risk_level: risk_level as RiskLevel })
						}
					>
						<SelectTrigger className="h-11">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{RISK_OPTIONS.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<Field label="Risk score">
					<Input
						inputMode="decimal"
						value={values.risk_score}
						onChange={(e) => onChange({ risk_score: e.target.value })}
						className="h-11"
					/>
				</Field>
				<Field label="Payment terms (days)">
					<Input
						inputMode="numeric"
						value={values.standard_payment_terms_days}
						onChange={(e) =>
							onChange({ standard_payment_terms_days: e.target.value })
						}
						className="h-11"
					/>
				</Field>
				<Field label="Default currency">
					<Input
						value={values.default_currency}
						onChange={(e) => onChange({ default_currency: e.target.value })}
						className="h-11 uppercase"
						maxLength={3}
					/>
				</Field>
			</div>
		</div>
	);
}

function ContactsStep({
	values,
	onChange,
}: {
	values: VendorWizardValues;
	onChange: (patch: Partial<VendorWizardValues>) => void;
}) {
	function updateContact(
		index: number,
		patch: Partial<VendorWizardValues["contacts"][number]>
	) {
		onChange({
			contacts: values.contacts.map((row, i) =>
				i === index ? { ...row, ...patch } : row
			),
		});
	}

	function setPrimary(index: number) {
		onChange({
			contacts: values.contacts.map((row, i) => ({
				...row,
				is_primary: i === index,
			})),
		});
	}

	function addContact() {
		onChange({
			contacts: [
				...values.contacts,
				emptyContactDraft(values.contacts.length === 0),
			],
		});
	}

	function removeContact(index: number) {
		onChange({
			contacts: values.contacts.filter((_, i) => i !== index),
		});
	}

	return (
		<div className="space-y-4">
			{values.contacts.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No contacts yet. Add at least one primary contact for the vendor
					header.
				</p>
			) : null}
			{values.contacts.map((contact, index) => (
				<div
					key={index}
					className="space-y-4 rounded-lg border border-border/60 p-4"
				>
					<div className="flex items-center justify-between gap-2">
						<p className="text-sm font-medium">Contact {index + 1}</p>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => removeContact(index)}
						>
							<Trash2 className="mr-1 size-4" />
							Remove
						</Button>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Name" required>
							<Input
								value={contact.name}
								onChange={(e) => updateContact(index, { name: e.target.value })}
								className="h-11"
							/>
						</Field>
						<Field label="Email" required>
							<Input
								type="email"
								value={contact.email}
								onChange={(e) =>
									updateContact(index, { email: e.target.value })
								}
								className="h-11"
							/>
						</Field>
						<Field label="Phone">
							<Input
								value={contact.phone}
								onChange={(e) =>
									updateContact(index, { phone: e.target.value })
								}
								className="h-11"
							/>
						</Field>
						<Field label="Role">
							<Input
								value={contact.role}
								onChange={(e) => updateContact(index, { role: e.target.value })}
								className="h-11"
							/>
						</Field>
					</div>
					<label className="flex items-center gap-2 text-sm">
						<Checkbox
							checked={contact.is_primary}
							onCheckedChange={() => setPrimary(index)}
						/>
						Primary contact
					</label>
				</div>
			))}
			<Button type="button" variant="outline" onClick={addContact}>
				<Plus className="mr-2 size-4" />
				Add contact
			</Button>
		</div>
	);
}

function AccountsStep({
	values,
	onChange,
}: {
	values: VendorWizardValues;
	onChange: (patch: Partial<VendorWizardValues>) => void;
}) {
	function updateAccount(
		index: number,
		patch: Partial<VendorWizardValues["accounts"][number]>
	) {
		onChange({
			accounts: values.accounts.map((row, i) =>
				i === index ? { ...row, ...patch } : row
			),
		});
	}

	function addAccount() {
		onChange({ accounts: [...values.accounts, emptyAccountDraft()] });
	}

	function removeAccount(index: number) {
		onChange({ accounts: values.accounts.filter((_, i) => i !== index) });
	}

	return (
		<div className="space-y-4">
			{values.accounts.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					Optional. Add LOB accounts now or from the Accounts tab later.
				</p>
			) : null}
			{values.accounts.map((account, index) => (
				<div
					key={index}
					className="space-y-4 rounded-lg border border-border/60 p-4"
				>
					<div className="flex items-center justify-between gap-2">
						<p className="text-sm font-medium">Account {index + 1}</p>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => removeAccount(index)}
						>
							<Trash2 className="mr-1 size-4" />
							Remove
						</Button>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Account code" required>
							<Input
								value={account.account_code}
								onChange={(e) =>
									updateAccount(index, { account_code: e.target.value })
								}
								className="h-11 font-mono"
							/>
						</Field>
						<Field label="Name" required>
							<Input
								value={account.name}
								onChange={(e) => updateAccount(index, { name: e.target.value })}
								className="h-11"
							/>
						</Field>
						<Field label="Line of business" required>
							<Select
								value={account.line_of_business}
								onValueChange={(line_of_business) =>
									updateAccount(index, { line_of_business })
								}
							>
								<SelectTrigger className="h-11">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{LOB_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<label className="flex items-center gap-2 self-end pb-2 text-sm">
							<Checkbox
								checked={account.active}
								onCheckedChange={(checked) =>
									updateAccount(index, { active: checked === true })
								}
							/>
							Active
						</label>
					</div>
				</div>
			))}
			<Button type="button" variant="outline" onClick={addAccount}>
				<Plus className="mr-2 size-4" />
				Add account
			</Button>
		</div>
	);
}

function IntegrationStep({
	values,
	onChange,
	vendorName,
}: {
	values: VendorWizardValues;
	onChange: (patch: Partial<VendorWizardValues>) => void;
	vendorName: string;
}) {
	function patchIntegration(patch: Partial<VendorWizardValues["integration"]>) {
		onChange({ integration: { ...values.integration, ...patch } });
	}

	function patchConnection(patch: Partial<VendorWizardValues["connection"]>) {
		onChange({ connection: { ...values.connection, ...patch } });
	}

	function updateJob(
		index: number,
		patch: Partial<VendorWizardValues["jobs"][number]>
	) {
		onChange({
			jobs: values.jobs.map((row, i) =>
				i === index ? { ...row, ...patch } : row
			),
		});
	}

	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [credentials, setCredentials] = useState<CredentialDto[]>([]);
	const [discoveringHostKey, setDiscoveringHostKey] = useState(false);

	useEffect(() => {
		if (!vendorName.trim() || values.connection.name.trim()) return;
		patchConnection({ name: `${vendorName.trim()} SFTP` });
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only seed name once vendor name appears
	}, [vendorName]);

	useEffect(() => {
		let cancelled = false;
		void listVendorCredentials()
			.then((rows) => {
				if (!cancelled) setCredentials(rows);
			})
			.catch(() => {
				if (!cancelled) setCredentials([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const passwordCredentials = credentials.filter((c) => c.kind === "password");
	const privateKeyCredentials = credentials.filter(
		(c) => c.kind === "private_key"
	);

	const connectionReady =
		values.connection.name.trim() &&
		(values.connection.method === "sftp_hosted"
			? values.connection.landing_user.trim()
			: values.connection.host.trim() &&
				values.connection.username.trim() &&
				values.connection.host_key_fingerprint.trim());

	async function discoverHostKey() {
		if (values.connection.method !== "sftp_pull") return;
		const host = values.connection.host.trim();
		if (!host) {
			toast.error("Enter a host before discovering the fingerprint.");
			return;
		}
		const portNum = Number(values.connection.port);
		const port =
			Number.isFinite(portNum) && portNum > 0
				? portNum
				: Number(defaultSftpPortForHost(host));
		const effectivePort =
			isLocalSftpHost(host) && port === 22 ? 2222 : port;
		setDiscoveringHostKey(true);
		try {
			const result = await discoverVendorHostKey({
				host,
				port: effectivePort,
			});
			if (!result.fingerprint?.trim()) {
				throw new Error("Discover returned an empty fingerprint.");
			}
			patchConnection({
				host_key_fingerprint: result.fingerprint
					.trim()
					.toLowerCase()
					.replace(/^sha256:/i, "")
					.replace(/:/g, ""),
				port: String(result.port || effectivePort),
			});
			toast.success(
				`Host key discovered (${result.fingerprint.slice(0, 12)}…). Connection will activate and test on create.`
			);
		} catch (err) {
			const status =
				err && typeof err === "object" && "status" in err
					? Number((err as { status?: number }).status)
					: undefined;
			const message =
				err instanceof Error ? err.message : "Could not discover host key.";
			if (status === 404) {
				toast.error(
					"Discover API not found (404). Deploy vendor-management-core discover-host-key, or point FE at an API that has it."
				);
			} else {
				toast.error(message);
			}
		} finally {
			setDiscoveringHostKey(false);
		}
	}

	return (
		<div className="space-y-8">
			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Integration profile
				</p>
				<div className="grid gap-4 sm:grid-cols-2">
					<Field label="Timezone">
						<Input
							value={values.integration.timezone}
							onChange={(e) => patchIntegration({ timezone: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="Transmission method">
						<Input
							value={values.integration.transmission_method}
							onChange={(e) =>
								patchIntegration({ transmission_method: e.target.value })
							}
							className="h-11"
						/>
					</Field>
					<Field label="Encryption">
						<Input
							value={values.integration.encryption}
							onChange={(e) => patchIntegration({ encryption: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field label="Protocol">
						<Input
							value={values.integration.protocol}
							onChange={(e) => patchIntegration({ protocol: e.target.value })}
							className="h-11"
						/>
					</Field>
					<Field
						label="File formats"
						hint="Comma-separated (834, 837, 835)."
						className="sm:col-span-2"
					>
						<Input
							value={values.integration.file_formats}
							onChange={(e) =>
								patchIntegration({ file_formats: e.target.value })
							}
							className="h-11"
						/>
					</Field>
					<Field label="Trading partner ID">
						<Input
							value={values.integration.trading_partner_id}
							onChange={(e) =>
								patchIntegration({ trading_partner_id: e.target.value })
							}
							className="h-11 font-mono"
						/>
					</Field>
					<Field label="Profile notes" className="sm:col-span-2">
						<Textarea
							rows={3}
							value={values.integration.notes}
							onChange={(e) => patchIntegration({ notes: e.target.value })}
						/>
					</Field>
				</div>
			</div>

			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					SFTP connection
				</p>
				<p className="mb-3 text-sm text-muted-foreground">
					Saved as draft. Pin host key and activate later on Configuration.
				</p>
				<div className="grid gap-4 sm:grid-cols-2">
					<Field label="Connection name">
						<Input
							value={values.connection.name}
							onChange={(e) => patchConnection({ name: e.target.value })}
							placeholder={`${vendorName} SFTP`}
							className="h-11"
						/>
					</Field>
					<Field label="Method">
						<Select
							value={values.connection.method}
							onValueChange={(method: "sftp_pull" | "sftp_hosted") =>
								patchConnection({ method })
							}
						>
							<SelectTrigger className="h-11">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="sftp_pull">SFTP Pull</SelectItem>
								<SelectItem value="sftp_hosted">SFTP Hosted</SelectItem>
							</SelectContent>
						</Select>
					</Field>
					{values.connection.method === "sftp_pull" ? (
						<>
							<Field label="Host">
								<Input
									value={values.connection.host}
									onChange={(e) => {
										const host = e.target.value;
										patchConnection({
											host,
											port: portAfterHostChange(
												host,
												values.connection.port
											),
										});
									}}
									placeholder="sftp.example.com"
									className="h-11 font-mono"
								/>
							</Field>
							<Field
								label="Port"
								hint={
									isLocalSftpHost(values.connection.host)
										? "Localhost → 2222 for Docker SFTP (not 22)."
										: "Default 22."
								}
							>
								<Input
									value={values.connection.port}
									onChange={(e) =>
										patchConnection({ port: e.target.value })
									}
									className="h-11 font-mono"
								/>
							</Field>
							<Field label="Username">
								<Input
									value={values.connection.username}
									onChange={(e) =>
										patchConnection({ username: e.target.value })
									}
									className="h-11 font-mono"
								/>
							</Field>
							<Field
								label="Password credential (required)"
								hint={
									passwordCredentials.length === 0
										? "No password credentials yet — register name + secret_ref below. Secret must already exist in .secrets.yml."
										: "Pick an existing password credential, or register a secret_ref below. Required for SFTP pull."
								}
								className="sm:col-span-2"
							>
								<Select
									value={
										values.connection.password_credential_id || "__none__"
									}
									onValueChange={(v) =>
										patchConnection({
											password_credential_id: v === "__none__" ? "" : v,
										})
									}
								>
									<SelectTrigger className="h-11">
										<SelectValue placeholder="Select credential" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">None</SelectItem>
										{passwordCredentials.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name} · {c.secret_ref}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
							{!values.connection.password_credential_id ? (
								<>
									{passwordCredentials.length === 0 ? (
										<p className="sm:col-span-2 text-sm text-muted-foreground">
											Register a CredentialReference that points at a key
											already present in{" "}
											<span className="font-mono text-xs">.secrets.yml</span>.
										</p>
									) : null}
									<Field label="Register credential name">
										<Input
											value={values.connection.credential_name}
											onChange={(e) =>
												patchConnection({
													credential_name: e.target.value,
													credential_kind: "password",
												})
											}
											placeholder="Creates CredentialReference on save"
											className="h-11"
										/>
									</Field>
									<Field
										label="secret_ref"
										hint="Secret value must already exist in .secrets.yml."
									>
										<Input
											value={values.connection.credential_secret_ref}
											onChange={(e) =>
												patchConnection({
													credential_secret_ref: e.target.value,
													credential_kind: "password",
												})
											}
											className="h-11 font-mono text-xs"
										/>
									</Field>
								</>
							) : null}
							<Field
								label="Host key fingerprint (SHA-256 hex)"
								hint="Required for Active SFTP pull. Discover probes the host (no auth)."
								className="sm:col-span-2"
							>
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
									<Input
										value={values.connection.host_key_fingerprint}
										onChange={(e) =>
											patchConnection({
												host_key_fingerprint: e.target.value,
											})
										}
										placeholder="Discover or paste hex fingerprint"
										className="h-11 flex-1 font-mono text-xs"
									/>
									<Button
										type="button"
										variant="secondary"
										className="h-11 shrink-0"
										disabled={
											discoveringHostKey ||
											!values.connection.host.trim()
										}
										onClick={() => void discoverHostKey()}
									>
										{discoveringHostKey ? (
											<Loader2 className="mr-2 size-4 animate-spin" />
										) : null}
										Discover
									</Button>
								</div>
							</Field>
						</>
					) : (
						<Field label="Landing user" className="sm:col-span-2">
							<Input
								value={values.connection.landing_user}
								onChange={(e) =>
									patchConnection({ landing_user: e.target.value })
								}
								className="h-11 font-mono"
							/>
						</Field>
					)}
				</div>

				<Collapsible
					open={advancedOpen}
					onOpenChange={setAdvancedOpen}
					className="mt-4"
				>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="gap-1 px-0 text-muted-foreground"
						>
							<ChevronDown
								className={cn(
									"size-4 transition-transform",
									advancedOpen && "rotate-180"
								)}
							/>
							Advanced
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="mt-3">
						<div className="grid gap-4 sm:grid-cols-2">
							{values.connection.method === "sftp_pull" ? (
								<>
									<Field label="Environment">
										<Select
											value={values.connection.environment}
											onValueChange={(environment) =>
												patchConnection({ environment })
											}
										>
											<SelectTrigger className="h-11">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="development">
													Development
												</SelectItem>
												<SelectItem value="test">Test</SelectItem>
												<SelectItem value="uat">UAT</SelectItem>
												<SelectItem value="production">
													Production
												</SelectItem>
											</SelectContent>
										</Select>
									</Field>
									<Field label="Inbound path">
										<Input
											value={values.connection.inbound_path}
											onChange={(e) =>
												patchConnection({ inbound_path: e.target.value })
											}
											placeholder="upload"
											className="h-11 font-mono"
										/>
									</Field>
									<Field label="Archive path">
										<Input
											value={values.connection.archive_path}
											onChange={(e) =>
												patchConnection({ archive_path: e.target.value })
											}
											className="h-11 font-mono"
										/>
									</Field>
									<Field
										label="Private key credential"
										hint="Only if key auth — leave None for password-only."
										className="sm:col-span-2"
									>
										<Select
											value={
												values.connection.private_key_credential_id ||
												"__none__"
											}
											onValueChange={(v) =>
												patchConnection({
													private_key_credential_id:
														v === "__none__" ? "" : v,
												})
											}
										>
											<SelectTrigger className="h-11">
												<SelectValue placeholder="None" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">None</SelectItem>
												{privateKeyCredentials.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{c.name} · {c.secret_ref}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								</>
							) : (
								<>
									<Field label="Environment">
										<Select
											value={values.connection.environment}
											onValueChange={(environment) =>
												patchConnection({ environment })
											}
										>
											<SelectTrigger className="h-11">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="development">
													Development
												</SelectItem>
												<SelectItem value="test">Test</SelectItem>
												<SelectItem value="uat">UAT</SelectItem>
												<SelectItem value="production">
													Production
												</SelectItem>
											</SelectContent>
										</Select>
									</Field>
									<Field label="Inbound path">
										<Input
											value={values.connection.inbound_path}
											onChange={(e) =>
												patchConnection({ inbound_path: e.target.value })
											}
											className="h-11 font-mono"
										/>
									</Field>
									<Field label="Archive path">
										<Input
											value={values.connection.archive_path}
											onChange={(e) =>
												patchConnection({ archive_path: e.target.value })
											}
											className="h-11 font-mono"
										/>
									</Field>
									<Field label="Error path">
										<Input
											value={values.connection.error_path}
											onChange={(e) =>
												patchConnection({ error_path: e.target.value })
											}
											className="h-11 font-mono"
										/>
									</Field>
									<Field label="Processing path">
										<Input
											value={values.connection.processing_path}
											onChange={(e) =>
												patchConnection({
													processing_path: e.target.value,
												})
											}
											className="h-11 font-mono"
										/>
									</Field>
								</>
							)}
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>

			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Intake jobs
				</p>
				{!connectionReady ? (
					<p className="mb-3 text-sm text-muted-foreground">
						{values.connection.method === "sftp_hosted"
							? "Fill connection name and landing user to enable intake jobs."
							: "Fill connection name, host, username, auth, and host key (Discover) to enable intake jobs."}
					</p>
				) : null}
				{values.jobs.map((job, index) => (
					<div
						key={index}
						className="mb-4 space-y-4 rounded-lg border border-border/60 p-4"
					>
						<div className="flex items-center justify-between gap-2">
							<p className="text-sm font-medium">Job {index + 1}</p>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									onChange({
										jobs: values.jobs.filter((_, i) => i !== index),
									})
								}
							>
								<Trash2 className="mr-1 size-4" />
								Remove
							</Button>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label="Job name" className="sm:col-span-2">
								<Input
									value={job.name}
									onChange={(e) => updateJob(index, { name: e.target.value })}
									className="h-11"
								/>
							</Field>
							<Field label="File type">
								<Select
									value={job.fileType}
									onValueChange={(fileType) => updateJob(index, { fileType })}
								>
									<SelectTrigger className="h-11">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{FILE_TYPES.map((option) => (
											<SelectItem key={option} value={option}>
												{option}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
							<Field label="Direction">
								<Select
									value={job.direction}
									onValueChange={(direction) =>
										updateJob(index, {
											direction: direction as "Incoming" | "Outgoing",
										})
									}
								>
									<SelectTrigger className="h-11">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Incoming">Incoming</SelectItem>
										<SelectItem value="Outgoing">Outgoing</SelectItem>
									</SelectContent>
								</Select>
							</Field>
							<Field label="Frequency">
								<Select
									value={job.frequency}
									onValueChange={(frequency) =>
										updateJob(index, {
											frequency: frequency as "Daily" | "Hourly" | "Weekly",
										})
									}
								>
									<SelectTrigger className="h-11">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Daily">Daily</SelectItem>
										<SelectItem value="Hourly">Hourly</SelectItem>
										<SelectItem value="Weekly">Weekly</SelectItem>
									</SelectContent>
								</Select>
							</Field>
							<Field label="Status">
								<Select
									value={job.status}
									onValueChange={(status) =>
										updateJob(index, {
											status: status as "Active" | "Paused",
										})
									}
								>
									<SelectTrigger className="h-11">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Active">Active</SelectItem>
										<SelectItem value="Paused">Paused</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						</div>
					</div>
				))}
				<Button
					type="button"
					variant="outline"
					disabled={!connectionReady}
					onClick={() =>
						onChange({
							jobs: [...values.jobs, emptyJobDraft(vendorName)],
						})
					}
				>
					<Plus className="mr-2 size-4" />
					Add intake job
				</Button>
			</div>
		</div>
	);
}

function NotesContractsStep({
	values,
	onChange,
}: {
	values: VendorWizardValues;
	onChange: (patch: Partial<VendorWizardValues>) => void;
}) {
	function updateNote(
		index: number,
		patch: Partial<VendorWizardValues["notes"][number]>
	) {
		onChange({
			notes: values.notes.map((row, i) =>
				i === index ? { ...row, ...patch } : row
			),
		});
	}

	function updateContract(
		index: number,
		patch: Partial<VendorWizardValues["contracts"][number]>
	) {
		onChange({
			contracts: values.contracts.map((row, i) =>
				i === index ? { ...row, ...patch } : row
			),
		});
	}

	return (
		<div className="space-y-8">
			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Notes
				</p>
				{values.notes.map((note, index) => (
					<div
						key={index}
						className="mb-4 space-y-3 rounded-lg border border-border/60 p-4"
					>
						<div className="flex items-center justify-between gap-2">
							<p className="text-sm font-medium">Note {index + 1}</p>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									onChange({
										notes: values.notes.filter((_, i) => i !== index),
									})
								}
							>
								<Trash2 className="mr-1 size-4" />
								Remove
							</Button>
						</div>
						<Textarea
							rows={4}
							value={note.body}
							onChange={(e) => updateNote(index, { body: e.target.value })}
						/>
						<label className="flex items-center gap-2 text-sm">
							<Checkbox
								checked={note.is_pinned}
								onCheckedChange={(checked) =>
									updateNote(index, { is_pinned: checked === true })
								}
							/>
							Pinned
						</label>
					</div>
				))}
				<Button
					type="button"
					variant="outline"
					onClick={() =>
						onChange({ notes: [...values.notes, emptyNoteDraft()] })
					}
				>
					<Plus className="mr-2 size-4" />
					Add note
				</Button>
			</div>

			<div>
				<p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
					Contract drafts
				</p>
				{values.contracts.map((contract, index) => (
					<div
						key={index}
						className="mb-4 space-y-4 rounded-lg border border-border/60 p-4"
					>
						<div className="flex items-center justify-between gap-2">
							<p className="text-sm font-medium">Contract {index + 1}</p>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									onChange({
										contracts: values.contracts.filter((_, i) => i !== index),
									})
								}
							>
								<Trash2 className="mr-1 size-4" />
								Remove
							</Button>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label="Contract number" required>
								<Input
									value={contract.number}
									onChange={(e) =>
										updateContract(index, { number: e.target.value })
									}
									className="h-11 font-mono"
								/>
							</Field>
							<Field label="Title" required>
								<Input
									value={contract.title}
									onChange={(e) =>
										updateContract(index, { title: e.target.value })
									}
									className="h-11"
								/>
							</Field>
							<Field label="Type">
								<Select
									value={contract.contractType}
									onValueChange={(contractType) =>
										updateContract(index, { contractType })
									}
								>
									<SelectTrigger className="h-11">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CONTRACT_TYPE_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
							<Field label="Value">
								<Input
									inputMode="decimal"
									value={contract.value}
									onChange={(e) =>
										updateContract(index, { value: e.target.value })
									}
									className="h-11"
								/>
							</Field>
							<Field label="Currency">
								<Input
									value={contract.currency}
									onChange={(e) =>
										updateContract(index, { currency: e.target.value })
									}
									className="h-11 uppercase"
									maxLength={3}
								/>
							</Field>
							<Field label="Start date" required>
								<Input
									type="date"
									value={contract.startDate}
									onChange={(e) =>
										updateContract(index, { startDate: e.target.value })
									}
									className="h-11"
								/>
							</Field>
							<Field label="End date">
								<Input
									type="date"
									value={contract.endDate}
									onChange={(e) =>
										updateContract(index, { endDate: e.target.value })
									}
									className="h-11"
								/>
							</Field>
							<Field label="SLA summary" className="sm:col-span-2">
								<Textarea
									rows={2}
									value={contract.slaSummary}
									onChange={(e) =>
										updateContract(index, { slaSummary: e.target.value })
									}
								/>
							</Field>
						</div>
					</div>
				))}
				<Button
					type="button"
					variant="outline"
					onClick={() =>
						onChange({
							contracts: [...values.contracts, emptyContractDraft()],
						})
					}
				>
					<Plus className="mr-2 size-4" />
					Add contract draft
				</Button>
			</div>
		</div>
	);
}

function ReviewStep({
	values,
	categories,
}: {
	values: VendorWizardValues;
	categories: VendorCategoryDto[];
}) {
	const categoryNames = values.category_ids
		.map((id) => categories.find((row) => row.id === id)?.name ?? id)
		.join(", ");

	const groups: Array<{
		title: string;
		items: Array<{ label: string; value: string }>;
	}> = [
		{
			title: "Identity",
			items: [
				{
					label: "Legal name",
					value: values.legal_name.trim() || "—",
				},
				{
					label: "Trade name",
					value: values.trade_name.trim() || "—",
				},
				{ label: "Vendor code", value: values.vendor_code.trim() || "Auto" },
				{ label: "Status", value: values.status },
				{
					label: "Location",
					value:
						[values.city, values.country].filter(Boolean).join(", ") || "—",
				},
				{ label: "Website", value: values.website.trim() || "—" },
				{ label: "Tax ID", value: values.tax_id.trim() || "—" },
			],
		},
		{
			title: "Commercial",
			items: [
				{ label: "Categories", value: categoryNames || "—" },
				{ label: "Risk", value: values.risk_level },
				{
					label: "Payment terms",
					value: values.standard_payment_terms_days.trim()
						? `${values.standard_payment_terms_days} days`
						: "—",
				},
				{
					label: "Currency",
					value: values.default_currency.trim() || "—",
				},
			],
		},
		{
			title: "Related records",
			items: [
				{
					label: "Contacts",
					value: String(countFilledContacts(values)),
				},
				{
					label: "Accounts",
					value: String(countFilledAccounts(values)),
				},
				{
					label: "Connection",
					value: values.connection.name.trim()
						? `${values.connection.name} (${values.connection.method}${
								values.connection.method === "sftp_hosted"
									? values.connection.landing_user
										? ` · ${values.connection.landing_user}`
										: ""
									: values.connection.host
										? ` · ${values.connection.host}`
										: ""
							}${
								values.connection.method === "sftp_pull"
									? values.connection.host_key_fingerprint.trim()
										? " · fingerprint ready · will activate + test"
										: " · missing fingerprint"
									: " · will activate + test"
							})`
						: "—",
				},
				{ label: "Intake jobs", value: String(values.jobs.length) },
				{ label: "Notes", value: String(countFilledNotes(values)) },
				{
					label: "Contracts",
					value: String(countFilledContracts(values)),
				},
			],
		},
	];

	return (
		<div className="space-y-4">
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
								key={row.label}
								className="flex items-baseline justify-between gap-3 border-b border-border/30 py-2.5 last:border-b-0 sm:block"
							>
								<dt className="text-xs text-muted-foreground">{row.label}</dt>
								<dd className="text-sm font-medium text-foreground sm:mt-0.5">
									{row.value}
								</dd>
							</div>
						))}
					</div>
				</section>
			))}
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
			aria-label="Vendor form steps"
			className="rounded-2xl border border-border/50 bg-card p-3"
		>
			<ol className="space-y-0.5">
				{VENDOR_WIZARD_STEPS.map((item, index) => {
					const Icon = STEP_ICONS[item.id];
					const done = index < current;
					const active = index === current;
					const last = index === VENDOR_WIZARD_STEPS.length - 1;
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
									{last ? null : (
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
		<nav aria-label="Vendor form steps" className="overflow-x-auto pb-1">
			<ol className="flex min-w-max gap-2">
				{VENDOR_WIZARD_STEPS.map((item, index) => {
					const done = index < current;
					const active = index === current;
					return (
						<li key={item.id}>
							<button
								type="button"
								disabled={index > current}
								onClick={() => onSelect(index)}
								className={cn(
									"rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
									active && "border-primary bg-primary/10 text-foreground",
									done && !active && "border-primary/40 text-foreground",
									!done && !active && "border-border text-muted-foreground",
									index > current && "opacity-60"
								)}
							>
								{item.title}
							</button>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

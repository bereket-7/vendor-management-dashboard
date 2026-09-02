import type { RiskLevel, VendorStatus } from "@/features/shared/vms/types";
import type { VendorCreateInput } from "@/lib/vendor-core/types";

export const VENDOR_WIZARD_STEPS = [
	{
		id: "identity",
		title: "Identity",
		hint: "Legal name, location & profile",
	},
	{
		id: "commercial",
		title: "Commercial",
		hint: "Categories, risk & payment terms",
	},
	{
		id: "contacts",
		title: "Contacts",
		hint: "Primary & secondary contacts",
	},
	{
		id: "accounts",
		title: "Accounts",
		hint: "Line-of-business accounts",
	},
	{
		id: "integration",
		title: "Integration",
		hint: "Profile, SFTP & intake jobs",
	},
	{
		id: "notes_contracts",
		title: "Notes & Contracts",
		hint: "Optional notes and contract drafts",
	},
	{
		id: "review",
		title: "Review",
		hint: "Confirm & create",
	},
] as const;

export type VendorWizardStepId = (typeof VENDOR_WIZARD_STEPS)[number]["id"];

export type VendorWizardContactDraft = {
	name: string;
	email: string;
	phone: string;
	role: string;
	is_primary: boolean;
};

export type VendorWizardAccountDraft = {
	account_code: string;
	name: string;
	line_of_business: string;
	active: boolean;
};

export type VendorWizardNoteDraft = {
	body: string;
	is_pinned: boolean;
};

export type VendorWizardJobDraft = {
	name: string;
	fileType: string;
	direction: "Incoming" | "Outgoing";
	frequency: "Daily" | "Hourly" | "Weekly";
	status: "Active" | "Paused";
};

export type VendorWizardContractDraft = {
	number: string;
	title: string;
	contractType: string;
	value: string;
	currency: string;
	startDate: string;
	endDate: string;
	slaSummary: string;
};

export type VendorWizardValues = {
	vendor_code: string;
	legal_name: string;
	trade_name: string;
	status: VendorStatus;
	country: string;
	city: string;
	description: string;
	website: string;
	tax_id: string;
	tags: string;
	category_ids: string[];
	primary_category_id: string;
	risk_level: RiskLevel;
	risk_score: string;
	standard_payment_terms_days: string;
	default_currency: string;
	contacts: VendorWizardContactDraft[];
	accounts: VendorWizardAccountDraft[];
	notes: VendorWizardNoteDraft[];
	jobs: VendorWizardJobDraft[];
	contracts: VendorWizardContractDraft[];
	integration: {
		timezone: string;
		transmission_method: string;
		encryption: string;
		file_formats: string;
		trading_partner_id: string;
		protocol: string;
		notes: string;
	};
	connection: {
		name: string;
		method: string;
		host: string;
		environment: string;
		status: string;
	};
};

export const EMPTY_VENDOR_WIZARD: VendorWizardValues = {
	vendor_code: "",
	legal_name: "",
	trade_name: "",
	status: "active",
	country: "US",
	city: "",
	description: "",
	website: "",
	tax_id: "",
	tags: "",
	category_ids: [],
	primary_category_id: "",
	risk_level: "medium",
	risk_score: "",
	standard_payment_terms_days: "30",
	default_currency: "USD",
	contacts: [],
	accounts: [],
	notes: [],
	jobs: [],
	contracts: [],
	integration: {
		timezone: "UTC",
		transmission_method: "sftp",
		encryption: "pgp",
		file_formats: "",
		trading_partner_id: "",
		protocol: "SFTP",
		notes: "",
	},
	connection: {
		name: "",
		method: "sftp",
		host: "",
		environment: "production",
		status: "active",
	},
};

export function emptyContactDraft(isPrimary = false): VendorWizardContactDraft {
	return {
		name: "",
		email: "",
		phone: "",
		role: "",
		is_primary: isPrimary,
	};
}

export function emptyAccountDraft(): VendorWizardAccountDraft {
	return {
		account_code: "",
		name: "",
		line_of_business: "commercial",
		active: true,
	};
}

export function emptyNoteDraft(): VendorWizardNoteDraft {
	return { body: "", is_pinned: false };
}

export function emptyJobDraft(vendorName: string): VendorWizardJobDraft {
	const prefix = vendorName.trim().split(/\s+/).slice(0, 2).join(" ");
	return {
		name: prefix ? `${prefix} - New Import` : "New Import",
		fileType: "Eligibility (834)",
		direction: "Incoming",
		frequency: "Daily",
		status: "Active",
	};
}

export function emptyContractDraft(): VendorWizardContractDraft {
	return {
		number: "",
		title: "",
		contractType: "msa",
		value: "",
		currency: "USD",
		startDate: "",
		endDate: "",
		slaSummary: "",
	};
}

function mapVendorStatus(status: VendorStatus): string {
	if (status === "offboarded") return "terminated";
	if (status === "invited" || status === "under_review") return "prospect";
	return status;
}

export function wizardValuesToVendorCreatePayload(
	values: VendorWizardValues
): VendorCreateInput {
	const code =
		values.vendor_code.trim() || `VND-${Date.now().toString().slice(-8)}`;
	const riskScore = values.risk_score.trim();
	const paymentTerms = values.standard_payment_terms_days.trim();
	const tags = values.tags
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);

	return {
		vendor_code: code,
		legal_name: values.legal_name.trim(),
		trade_name: values.trade_name.trim() || null,
		country: values.country.trim() || "US",
		city: values.city.trim() || "Unknown",
		status: mapVendorStatus(values.status),
		description: values.description.trim() || null,
		website: values.website.trim() || null,
		tax_id: values.tax_id.trim() || null,
		risk_level: values.risk_level,
		risk_score: riskScore ? Number(riskScore) : undefined,
		tags,
		standard_payment_terms_days: paymentTerms
			? Number(paymentTerms)
			: undefined,
		default_currency: values.default_currency.trim() || undefined,
	};
}

export function countFilledContacts(values: VendorWizardValues): number {
	return values.contacts.filter((row) => row.name.trim() || row.email.trim())
		.length;
}

export function countFilledAccounts(values: VendorWizardValues): number {
	return values.accounts.filter(
		(row) => row.account_code.trim() || row.name.trim()
	).length;
}

export function countFilledNotes(values: VendorWizardValues): number {
	return values.notes.filter((row) => row.body.trim()).length;
}

export function countFilledContracts(values: VendorWizardValues): number {
	return values.contracts.filter((row) => row.number.trim() || row.title.trim())
		.length;
}

export function validateIdentityStep(
	values: VendorWizardValues
): string | null {
	if (!values.legal_name.trim()) return "Legal name is required.";
	if (!values.country.trim()) return "Country is required.";
	if (!values.city.trim()) return "City is required.";
	return null;
}

export function validateContactsStep(
	values: VendorWizardValues
): string | null {
	for (const contact of values.contacts) {
		const started =
			contact.name.trim() ||
			contact.email.trim() ||
			contact.phone.trim() ||
			contact.role.trim();
		if (started && (!contact.name.trim() || !contact.email.trim())) {
			return "Each contact needs a name and email.";
		}
	}
	return null;
}

export function validateAccountsStep(
	values: VendorWizardValues
): string | null {
	for (const account of values.accounts) {
		const started =
			account.account_code.trim() ||
			account.name.trim() ||
			account.line_of_business.trim();
		if (
			started &&
			(!account.account_code.trim() ||
				!account.name.trim() ||
				!account.line_of_business.trim())
		) {
			return "Each account needs code, name, and line of business.";
		}
	}
	return null;
}

export function validateIntegrationStep(
	values: VendorWizardValues
): string | null {
	const connectionStarted =
		values.connection.name.trim() || values.connection.host.trim();
	if (
		connectionStarted &&
		(!values.connection.name.trim() || !values.connection.host.trim())
	) {
		return "Connection needs both name and host.";
	}
	if (values.jobs.length > 0 && !connectionStarted) {
		return "Add a connection before intake jobs.";
	}
	for (const job of values.jobs) {
		if (!job.name.trim()) return "Each job needs a name.";
	}
	return null;
}

export function validateNotesContractsStep(
	values: VendorWizardValues
): string | null {
	for (const contract of values.contracts) {
		const started =
			contract.number.trim() ||
			contract.title.trim() ||
			contract.startDate.trim();
		if (
			started &&
			(!contract.number.trim() ||
				!contract.title.trim() ||
				!contract.startDate.trim())
		) {
			return "Each contract needs number, title, and start date.";
		}
	}
	return null;
}

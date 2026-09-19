import { createContracts } from "@/features/admin/features/contracts/feature/api/contractsApi";
import type {
	ConnectionCreateInput,
	VendorIntegrationProfileUpdateInput,
} from "@/lib/vendor-core/types";

import {
	defaultSftpPortForHost,
	isLocalSftpHost,
} from "../../connection-form";
import type { VendorWizardValues } from "../types/vendorWizardTypes";
import {
	createIntakeJob,
	createVendorAccount,
	createVendorCategoryAssignment,
	createVendorConnection,
	createVendorContact,
	createVendorCredential,
	createVendorNote,
	testVendorConnection,
	updateVendorIntegrationProfile,
} from "./vendorsApi";

export type WizardSyncFailure = {
	section: string;
	label: string;
	message: string;
};

export type WizardSyncResult = {
	failures: WizardSyncFailure[];
	/** True when an SFTP connection was requested and Test returned ok. */
	sftpConnected: boolean;
	/** True when wizard values asked to create an SFTP connection. */
	sftpAttempted: boolean;
};

function rejectionMessage(reason: unknown, fallback: string): string {
	if (reason instanceof Error && reason.message.trim()) return reason.message;
	return fallback;
}

function filledContacts(values: VendorWizardValues) {
	return values.contacts.filter(
		(row) => row.name.trim() || row.email.trim() || row.phone.trim()
	);
}

function filledAccounts(values: VendorWizardValues) {
	return values.accounts.filter(
		(row) =>
			row.account_code.trim() || row.name.trim() || row.line_of_business.trim()
	);
}

function filledNotes(values: VendorWizardValues) {
	return values.notes.filter((row) => row.body.trim());
}

function filledContracts(values: VendorWizardValues) {
	return values.contracts.filter(
		(row) => row.number.trim() || row.title.trim() || row.startDate.trim()
	);
}

function hasIntegrationPatch(values: VendorWizardValues): boolean {
	const profile = values.integration;
	return Boolean(
		profile.timezone.trim() ||
			profile.transmission_method.trim() ||
			profile.encryption.trim() ||
			profile.file_formats.trim() ||
			profile.trading_partner_id.trim() ||
			profile.protocol.trim() ||
			profile.notes.trim()
	);
}

function integrationPatch(
	values: VendorWizardValues
): VendorIntegrationProfileUpdateInput {
	const profile = values.integration;
	const fileFormats = profile.file_formats
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
	return {
		timezone: profile.timezone.trim() || "UTC",
		transmission_method: profile.transmission_method.trim() || null,
		encryption: profile.encryption.trim() || null,
		file_formats: fileFormats.length > 0 ? fileFormats : undefined,
		trading_partner_id: profile.trading_partner_id.trim() || null,
		protocol: profile.protocol.trim() || null,
		notes: profile.notes.trim() || null,
	};
}

function jobFileType(fileType: string): string {
	if (fileType.includes("837")) return "837";
	if (fileType.includes("835")) return "835";
	if (fileType.toLowerCase().includes("accum")) return "accumulator";
	return "834";
}

function jobScheduleCron(frequency: string): string {
	if (frequency === "Hourly") return "0 * * * *";
	if (frequency === "Weekly") return "0 6 * * 1";
	return "0 6 * * *";
}

/** Exported for create-page gating. */
export function shouldCreateConnection(values: VendorWizardValues): boolean {
	const c = values.connection;
	if (!c.name.trim()) return false;
	if (c.method === "sftp_hosted") return Boolean(c.landing_user.trim());
	return Boolean(c.host.trim() && c.username.trim());
}

function buildWizardConnectionConfig(
	values: VendorWizardValues
): Record<string, unknown> {
	const c = values.connection;
	if (c.method === "sftp_hosted") {
		return {
			landing_user: c.landing_user.trim(),
			inbound_path: c.inbound_path.trim() || "inbound",
			archive_path: c.archive_path.trim() || "archive",
			error_path: c.error_path.trim() || "error",
			processing_path: c.processing_path.trim() || "processing",
		};
	}
	const port = Number(c.port);
	const resolvedPort =
		Number.isFinite(port) && port > 0
			? port
			: Number(defaultSftpPortForHost(c.host));
	// Local Docker SFTP: wizard often leaves default 22; coerce localhost → 2222.
	const effectivePort =
		isLocalSftpHost(c.host) && resolvedPort === 22 ? 2222 : resolvedPort;
	const config: Record<string, unknown> = {
		host: c.host.trim(),
		port: effectivePort,
		username: c.username.trim(),
	};
	if (c.inbound_path.trim()) config.inbound_path = c.inbound_path.trim();
	else config.inbound_path = "upload";
	if (c.archive_path.trim()) config.archive_path = c.archive_path.trim();
	else config.archive_path = "archive";
	if (c.host_key_fingerprint.trim()) {
		config.host_key_fingerprint = c.host_key_fingerprint
			.trim()
			.toLowerCase()
			.replace(/^sha256:/i, "")
			.replace(/:/g, "");
	}
	return config;
}

function wizardConnectionStatus(values: VendorWizardValues): "active" | "draft" {
	const c = values.connection;
	if (c.method === "sftp_hosted") {
		return c.landing_user.trim() ? "active" : "draft";
	}
	// ACTIVE sftp_pull requires fingerprint on BE; only activate when present.
	return c.host_key_fingerprint.trim() ? "active" : "draft";
}

function buildWizardConnectionInput(
	vendorId: string,
	values: VendorWizardValues,
	credentialIds: {
		password_credential_id: string | null;
		private_key_credential_id: string | null;
	}
): ConnectionCreateInput {
	const c = values.connection;
	return {
		name: c.name.trim(),
		vendor_id: vendorId,
		method: c.method || "sftp_pull",
		direction: "inbound",
		environment: c.environment || "test",
		status: wizardConnectionStatus(values),
		password_credential_id: credentialIds.password_credential_id,
		private_key_credential_id: credentialIds.private_key_credential_id,
		config: buildWizardConnectionConfig(values),
	};
}

function formatTestFailureMessage(result: {
	message?: string;
	path?: string;
	entry_count?: number;
	landing_user?: string;
}): string {
	const parts = [result.message?.trim() || "SFTP connection test failed"];
	if (result.path) parts.push(`path=${result.path}`);
	if (typeof result.entry_count === "number") {
		parts.push(`entries=${result.entry_count}`);
	}
	if (result.landing_user) parts.push(`landing_user=${result.landing_user}`);
	return parts.join(" · ");
}

export async function syncVendorWizardExtras(
	vendorId: string,
	values: VendorWizardValues,
	vendorName: string
): Promise<WizardSyncResult> {
	const failures: WizardSyncFailure[] = [];
	const sftpAttempted = shouldCreateConnection(values);
	let sftpConnected = false;

	if (values.category_ids.length > 0) {
		const primaryId =
			values.primary_category_id.trim() || values.category_ids[0] || "";
		const results = await Promise.allSettled(
			values.category_ids.map((categoryId) =>
				createVendorCategoryAssignment({
					vendor_id: vendorId,
					category_id: categoryId,
					is_primary: categoryId === primaryId,
				})
			)
		);
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				failures.push({
					section: "categories",
					label: values.category_ids[index] ?? "category",
					message: rejectionMessage(
						result.reason,
						"Category assignment failed"
					),
				});
			}
		});
	}

	const contacts = filledContacts(values);
	if (contacts.length > 0) {
		const results = await Promise.allSettled(
			contacts.map((contact) =>
				createVendorContact({
					vendor_id: vendorId,
					name: contact.name.trim(),
					email: contact.email.trim(),
					phone: contact.phone.trim() || undefined,
					role: contact.role.trim() || undefined,
					is_primary: contact.is_primary,
				})
			)
		);
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				failures.push({
					section: "contacts",
					label:
						contacts[index]?.name.trim() ||
						contacts[index]?.email.trim() ||
						"contact",
					message: rejectionMessage(result.reason, "Contact create failed"),
				});
			}
		});
	}

	const accounts = filledAccounts(values);
	if (accounts.length > 0) {
		const results = await Promise.allSettled(
			accounts.map((account) =>
				createVendorAccount({
					vendor_id: vendorId,
					account_code: account.account_code.trim(),
					name: account.name.trim(),
					line_of_business: account.line_of_business,
					active: account.active,
				})
			)
		);
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				failures.push({
					section: "accounts",
					label:
						accounts[index]?.account_code.trim() ||
						accounts[index]?.name.trim() ||
						"account",
					message: rejectionMessage(result.reason, "Account create failed"),
				});
			}
		});
	}

	if (hasIntegrationPatch(values)) {
		try {
			await updateVendorIntegrationProfile(vendorId, integrationPatch(values));
		} catch (error) {
			failures.push({
				section: "integration",
				label: "Integration profile",
				message: rejectionMessage(error, "Integration profile update failed"),
			});
		}
	}

	let passwordCredentialId =
		values.connection.password_credential_id.trim() || null;
	let privateKeyCredentialId =
		values.connection.private_key_credential_id.trim() || null;

	const registerName = values.connection.credential_name.trim();
	const registerRef = values.connection.credential_secret_ref.trim();
	if (registerName && registerRef) {
		try {
			const created = await createVendorCredential({
				name: registerName,
				kind: values.connection.credential_kind,
				secret_ref: registerRef,
			});
			if (values.connection.credential_kind === "private_key") {
				privateKeyCredentialId = created.id;
			} else {
				passwordCredentialId = created.id;
			}
		} catch (error) {
			failures.push({
				section: "credentials",
				label: registerName,
				message: rejectionMessage(error, "Credential create failed"),
			});
		}
	} else if (registerName || registerRef) {
		failures.push({
			section: "credentials",
			label: registerName || "credential",
			message: "Register credential needs both name and secret_ref.",
		});
	}

	let connectionId: string | null = null;
	if (sftpAttempted) {
		const needsAuth = values.connection.method !== "sftp_hosted";
		const hasAuth = Boolean(passwordCredentialId || privateKeyCredentialId);
		if (needsAuth && !hasAuth) {
			failures.push({
				section: "connection",
				label: values.connection.name.trim(),
				message:
					"Pick a password credential or register name + secret_ref before creating the connection.",
			});
		} else if (
			needsAuth &&
			!values.connection.host_key_fingerprint.trim()
		) {
			failures.push({
				section: "connection",
				label: values.connection.name.trim(),
				message:
					"Host key fingerprint required to activate SFTP pull. Use Discover on the Integration step.",
			});
		} else {
			try {
				const connection = await createVendorConnection(
					buildWizardConnectionInput(vendorId, values, {
						password_credential_id: passwordCredentialId,
						private_key_credential_id: privateKeyCredentialId,
					})
				);
				connectionId = connection.id;
			} catch (error) {
				failures.push({
					section: "connection",
					label: values.connection.name.trim(),
					message: rejectionMessage(error, "Connection create failed"),
				});
			}
		}
	}

	if (connectionId) {
		try {
			const testResult = await testVendorConnection(connectionId);
			if (testResult.ok) {
				sftpConnected = true;
			} else {
				failures.push({
					section: "connection",
					label: values.connection.name.trim() || "SFTP test",
					message: formatTestFailureMessage(testResult),
				});
			}
		} catch (error) {
			failures.push({
				section: "connection",
				label: values.connection.name.trim() || "SFTP test",
				message: rejectionMessage(error, "SFTP connection test failed"),
			});
		}
	}

	if (connectionId && values.jobs.length > 0) {
		const results = await Promise.allSettled(
			values.jobs.map((job) =>
				createIntakeJob({
					name: job.name.trim(),
					vendor: vendorId,
					connection: connectionId,
					file_type: jobFileType(job.fileType),
					direction: job.direction === "Outgoing" ? "outbound" : "inbound",
					schedule_cron: jobScheduleCron(job.frequency),
					schedule_timezone: values.integration.timezone.trim() || "UTC",
					status: job.status === "Active" ? "active" : "paused",
				})
			)
		);
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				failures.push({
					section: "jobs",
					label: values.jobs[index]?.name.trim() || "job",
					message: rejectionMessage(result.reason, "Intake job create failed"),
				});
			}
		});
	}

	const notes = filledNotes(values);
	if (notes.length > 0) {
		const results = await Promise.allSettled(
			notes.map((note) =>
				createVendorNote({
					vendor_id: vendorId,
					body: note.body.trim(),
					is_pinned: note.is_pinned,
				})
			)
		);
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				failures.push({
					section: "notes",
					label: `Note ${index + 1}`,
					message: rejectionMessage(result.reason, "Note create failed"),
				});
			}
		});
	}

	const contracts = filledContracts(values);
	for (const contract of contracts) {
		try {
			await createContracts({
				number: contract.number.trim(),
				title: contract.title.trim(),
				vendorId,
				vendorName: vendorName.trim(),
				status: "draft",
				value: Number(contract.value) || 0,
				currency: contract.currency.trim() || "USD",
				startDate: contract.startDate,
				endDate: contract.endDate,
				slaSummary: contract.slaSummary.trim() || null,
				contractType: contract.contractType,
			});
		} catch (error) {
			failures.push({
				section: "contracts",
				label: contract.number.trim() || contract.title.trim() || "contract",
				message: rejectionMessage(error, "Contract create failed"),
			});
		}
	}

	return { failures, sftpConnected, sftpAttempted };
}

export function formatWizardSyncFailures(
	failures: WizardSyncFailure[]
): string {
	if (failures.length === 0) return "";
	const grouped = failures.reduce<Record<string, number>>((acc, row) => {
		acc[row.section] = (acc[row.section] ?? 0) + 1;
		return acc;
	}, {});
	return Object.entries(grouped)
		.map(([section, count]) => `${count} ${section}`)
		.join(", ");
}

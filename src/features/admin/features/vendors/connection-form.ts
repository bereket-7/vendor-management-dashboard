import type {
	ConnectionCreateInput,
	ConnectionDirection,
	ConnectionEnvironment,
	ConnectionMethod,
	ConnectionStatus,
	ConnectionUpdateInput,
	CredentialDto,
} from "@/lib/vendor-core/types";

import type { VendorSftpConnection } from "./vendor-types";

/** Local Docker SFTP maps host port 2222 → container 22. */
export function isLocalSftpHost(host: string): boolean {
	const h = host.trim().toLowerCase();
	return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

/** Default SFTP port: 2222 for localhost, else 22. */
export function defaultSftpPortForHost(host: string): string {
	return isLocalSftpHost(host) ? "2222" : "22";
}

/**
 * When host changes, keep an explicit non-default port; otherwise apply host default.
 * Treats empty / "22" / "2222" as auto-managed defaults.
 */
export function portAfterHostChange(
	host: string,
	currentPort: string
): string {
	const trimmed = currentPort.trim();
	const autoManaged = !trimmed || trimmed === "22" || trimmed === "2222";
	if (autoManaged) return defaultSftpPortForHost(host);
	return trimmed;
}

export type ConnectionFormDraft = {
	name: string;
	method: "sftp_pull" | "sftp_hosted";
	direction: ConnectionDirection | string;
	environment: ConnectionEnvironment | string;
	status: ConnectionStatus | string;
	host: string;
	port: string;
	username: string;
	inboundPath: string;
	archivePath: string;
	hostKeyFingerprint: string;
	landingUser: string;
	errorPath: string;
	processingPath: string;
	passwordCredentialId: string;
	privateKeyCredentialId: string;
};

export function emptyVendorSftpConnection(
	name = ""
): VendorSftpConnection {
	return {
		id: null,
		connectionName: name,
		method: "",
		direction: "inbound",
		environment: "test",
		lifecycleStatus: "draft",
		host: "",
		port: 22,
		username: "",
		inboundPath: "",
		archivePath: "",
		hostKeyFingerprint: "",
		landingUser: "",
		errorPath: "",
		processingPath: "",
		passwordCredentialId: null,
		passwordCredentialName: "",
		privateKeyCredentialId: null,
		privateKeyCredentialName: "",
		authMethod: "Not configured",
		authKey: "—",
		lastVerified: "—",
		lastError: "",
		healthStatus: "—",
		remoteDirectory: "",
		status: "Disconnected",
		testConnection: "Unknown",
	};
}

export function draftFromSftpConnection(
	connection: VendorSftpConnection
): ConnectionFormDraft {
	const method =
		connection.method === "sftp_hosted" ? "sftp_hosted" : "sftp_pull";
	return {
		name: connection.connectionName || "",
		method,
		direction: connection.direction || "inbound",
		environment: connection.environment || "test",
		status: connection.lifecycleStatus || "draft",
		host: connection.host || "",
		port: String(connection.port || 22),
		username: connection.username || "",
		inboundPath: connection.inboundPath || connection.remoteDirectory || "",
		archivePath: connection.archivePath || "",
		hostKeyFingerprint: connection.hostKeyFingerprint || "",
		landingUser: connection.landingUser || "",
		errorPath: connection.errorPath || "",
		processingPath: connection.processingPath || "",
		passwordCredentialId: connection.passwordCredentialId || "",
		privateKeyCredentialId: connection.privateKeyCredentialId || "",
	};
}

export function emptyConnectionFormDraft(
	vendorName: string
): ConnectionFormDraft {
	return {
		name: vendorName ? `${vendorName} SFTP` : "SFTP Connection",
		method: "sftp_pull",
		direction: "inbound",
		environment: "test",
		status: "draft",
		host: "",
		port: "22",
		username: "",
		inboundPath: "upload",
		archivePath: "archive",
		hostKeyFingerprint: "",
		landingUser: "",
		errorPath: "error",
		processingPath: "processing",
		passwordCredentialId: "",
		privateKeyCredentialId: "",
	};
}

export function validateConnectionDraft(
	draft: ConnectionFormDraft
): string | null {
	if (!draft.name.trim()) return "Connection name is required.";
	if (draft.method === "sftp_pull") {
		if (!draft.host.trim()) return "Host is required for SFTP pull.";
		if (!draft.username.trim()) return "Username is required for SFTP pull.";
		if (
			draft.status === "active" &&
			!draft.hostKeyFingerprint.trim()
		) {
			return "An ACTIVE sftp_pull connection requires host_key_fingerprint.";
		}
	}
	if (draft.method === "sftp_hosted" && !draft.landingUser.trim()) {
		return "landing_user is required for SFTP hosted landing.";
	}
	return null;
}

export function buildConnectionConfig(
	draft: ConnectionFormDraft
): Record<string, unknown> {
	if (draft.method === "sftp_hosted") {
		return {
			landing_user: draft.landingUser.trim(),
			inbound_path: draft.inboundPath.trim() || "inbound",
			archive_path: draft.archivePath.trim() || "archive",
			error_path: draft.errorPath.trim() || "error",
			processing_path: draft.processingPath.trim() || "processing",
		};
	}
	const port = Number(draft.port);
	const resolvedPort =
		Number.isFinite(port) && port > 0
			? port
			: Number(defaultSftpPortForHost(draft.host));
	const effectivePort =
		isLocalSftpHost(draft.host) && resolvedPort === 22 ? 2222 : resolvedPort;
	const config: Record<string, unknown> = {
		host: draft.host.trim(),
		port: effectivePort,
		username: draft.username.trim(),
	};
	if (draft.inboundPath.trim()) config.inbound_path = draft.inboundPath.trim();
	else config.inbound_path = "upload";
	if (draft.archivePath.trim()) config.archive_path = draft.archivePath.trim();
	else config.archive_path = "archive";
	if (draft.hostKeyFingerprint.trim()) {
		config.host_key_fingerprint = draft.hostKeyFingerprint
			.trim()
			.toLowerCase()
			.replace(/^sha256:/i, "")
			.replace(/:/g, "");
	}
	return config;
}

export function buildConnectionCreateInput(
	draft: ConnectionFormDraft,
	vendorId: string
): ConnectionCreateInput {
	return {
		name: draft.name.trim(),
		vendor_id: vendorId,
		method: draft.method as ConnectionMethod,
		direction: draft.direction || "inbound",
		environment: draft.environment || "test",
		status: draft.status || "draft",
		password_credential_id: draft.passwordCredentialId || null,
		private_key_credential_id: draft.privateKeyCredentialId || null,
		config: buildConnectionConfig(draft),
	};
}

export function buildConnectionUpdateInput(
	draft: ConnectionFormDraft
): ConnectionUpdateInput {
	return {
		name: draft.name.trim(),
		method: draft.method as ConnectionMethod,
		direction: draft.direction || "inbound",
		environment: draft.environment || "test",
		status: draft.status || "draft",
		password_credential_id: draft.passwordCredentialId || null,
		private_key_credential_id: draft.privateKeyCredentialId || null,
		config: buildConnectionConfig(draft),
	};
}

export function credentialOptionLabel(c: CredentialDto) {
	return `${c.name} (${c.kind}) · ${c.secret_ref}`;
}

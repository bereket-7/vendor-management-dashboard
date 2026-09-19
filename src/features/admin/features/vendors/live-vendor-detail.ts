import type {
	FileRun,
	ProcessStatus,
} from "@/features/admin/features/file-management/mock-data";
import type { VendorModel } from "@/features/shared/vms/types";
import type {
	ConnectionDto,
	InboundFileDto,
	IntakeJobDto,
	VendorIntegrationProfileDto,
} from "@/lib/vendor-core/types";
import type { ProgramFileType } from "@/types/UI/system.types";

import type {
	VendorAlert,
	VendorConfigJob,
	VendorHealth,
	VendorIntegrationProfile,
	VendorSftpConnection,
	VendorTrendPoint,
} from "./vendor-types";
import { runBucket } from "./vendor-types";

const FILE_TYPE_LABELS: Record<string, string> = {
	"837": "Medical Claims (837)",
	"837P": "Medical Claims (837)",
	"834": "Eligibility (834)",
	"835": "Pharmacy Claims (835)",
	accumulator: "Accumulator",
	provider_roster: "Provider Roster",
	eligibility: "Eligibility (834)",
};

function formatWhen(iso?: string | null): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(undefined, {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function mapFileType(raw?: string | null): string {
	if (!raw) return "Unknown";
	return FILE_TYPE_LABELS[raw] ?? raw;
}

function mapCronToFrequency(
	cron?: string | null
): VendorConfigJob["frequency"] {
	const value = (cron ?? "").trim();
	if (!value) return "Daily";
	if (value.includes("* * *")) return "Hourly";
	if (value.split(/\s+/).length >= 5 && !value.includes("* *")) return "Weekly";
	return "Daily";
}

function mapJobStatus(status?: string | null): VendorConfigJob["status"] {
	const value = (status ?? "").toLowerCase();
	if (value === "disabled" || value === "paused") return "Paused";
	return "Active";
}

function mapInboundStageToRunStatus(stage?: string | null): ProcessStatus {
	const value = (stage ?? "").toLowerCase();
	if (value.includes("fail") || value.includes("error")) return "failed";
	if (value.includes("warn")) return "warning";
	if (value.includes("process") || value.includes("pars")) return "processing";
	if (value.includes("complete") || value.includes("loaded")) return "success";
	if (value.includes("pending") || value.includes("received"))
		return "processing";
	return "processing";
}

function mapProfileHealth(health?: string | null): VendorHealth {
	const value = (health ?? "").toLowerCase();
	if (value === "healthy") return "healthy";
	if (value === "warning") return "warning";
	if (value === "failed") return "failed";
	return "in_progress";
}

function formatProcessingTime(seconds?: number | null): string {
	if (seconds == null || Number.isNaN(seconds)) return "—";
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;
	return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function inferInboundProgram(file: InboundFileDto): ProgramFileType {
	const metadata = (file as { metadata?: Record<string, unknown> }).metadata;
	const parseResult = file.parse_result;
	const raw =
		(typeof metadata?.program === "string" ? metadata.program : null) ??
		(typeof parseResult?.program === "string" ? parseResult.program : null);
	if (raw === "MDH" || raw === "DHCF" || raw === "BHP") return raw;
	return "MDH";
}

export function mapIntegrationProfileDto(
	dto: VendorIntegrationProfileDto,
	vendor: VendorModel,
	connections: ConnectionDto[],
	jobs: IntakeJobDto[],
	accountsCount: number
): VendorIntegrationProfile {
	const fallback = buildVendorIntegrationProfile(
		vendor,
		connections,
		jobs,
		accountsCount
	);
	return {
		...fallback,
		vendorId: dto.vendor_id,
		timezone: dto.timezone || fallback.timezone,
		transmissionMethod:
			dto.transmission_method?.trim() || fallback.transmissionMethod,
		encryption: dto.encryption?.trim() || fallback.encryption,
		fileFormats: dto.file_formats?.length
			? dto.file_formats
			: fallback.fileFormats,
		tradingPartnerId:
			dto.trading_partner_id?.trim() || fallback.tradingPartnerId,
		protocol: dto.protocol?.trim() || fallback.protocol,
		accountsCount: dto.accounts_count ?? fallback.accountsCount,
		jobsCount: dto.jobs_count ?? fallback.jobsCount,
		avgProcessingTime: formatProcessingTime(dto.avg_processing_time_seconds),
		health: mapProfileHealth(dto.health),
		notes: dto.notes?.trim() || fallback.notes,
	};
}

function connectionHealth(connections: ConnectionDto[]): VendorHealth {
	const failed = connections.some(
		(c) =>
			c.status === "failed" ||
			c.health?.current_status === "failed" ||
			Boolean(c.health?.last_error)
	);
	if (failed) return "failed";
	const warning = connections.some(
		(c) => c.status === "testing" || c.status === "draft"
	);
	if (warning) return "warning";
	if (connections.length === 0) return "in_progress";
	return "healthy";
}

export function buildVendorIntegrationProfile(
	vendor: VendorModel,
	connections: ConnectionDto[],
	jobs: IntakeJobDto[],
	accountsCount: number
): VendorIntegrationProfile {
	const meta = (
		vendor.description ? { notes: vendor.description } : {}
	) as Record<string, unknown>;
	const primary = connections[0];
	const health = connectionHealth(connections);
	const host =
		typeof primary?.config?.host === "string"
			? primary.config.host
			: primary?.name
				? `${primary.name.toLowerCase().replace(/\s+/g, "-")}.partner`
				: "—";

	return {
		vendorId: vendor.id,
		vendorType: vendor.categories[0] ?? "Vendor",
		sftpHost: host,
		timezone: "UTC",
		transmissionMethod: primary?.method?.toUpperCase() ?? "SFTP",
		encryption:
			typeof primary?.config?.encryption === "string"
				? primary.config.encryption
				: "PGP",
		fileFormats: Array.from(
			new Set(jobs.map((j) => mapFileType(j.file_type)).filter(Boolean))
		),
		tradingPartnerId: vendor.tags[0] ?? vendor.id.slice(0, 8).toUpperCase(),
		slaPercent: 99,
		protocol: primary?.method?.toUpperCase() ?? "SFTP",
		createdBy: "System",
		accountsCount,
		jobsCount: jobs.filter((j) => j.status !== "disabled").length,
		alertsCount: connections.filter((c) => c.status === "failed").length,
		avgProcessingTime: "—",
		health,
		notes:
			(typeof meta.notes === "string" && meta.notes) ||
			vendor.description ||
			"Live vendor profile from vendor-core.",
	};
}

export function connectionToSftp(
	connection: ConnectionDto | undefined,
	_vendorName: string,
	_health: VendorHealth
): VendorSftpConnection {
	const cfg = (connection?.config ?? {}) as Record<string, unknown>;
	const host = typeof cfg.host === "string" ? cfg.host : "";
	const username = typeof cfg.username === "string" ? cfg.username : "";
	const inboundPath =
		typeof cfg.inbound_path === "string"
			? cfg.inbound_path
			: typeof cfg.remote_path === "string"
				? cfg.remote_path
				: "";
	const archivePath =
		typeof cfg.archive_path === "string" ? cfg.archive_path : "";
	const fingerprint =
		typeof cfg.host_key_fingerprint === "string"
			? cfg.host_key_fingerprint
			: "";
	const landingUser =
		typeof cfg.landing_user === "string" ? cfg.landing_user : "";
	const errorPath = typeof cfg.error_path === "string" ? cfg.error_path : "";
	const processingPath =
		typeof cfg.processing_path === "string" ? cfg.processing_path : "";
	const portRaw = cfg.port;
	const port =
		typeof portRaw === "number"
			? portRaw
			: typeof portRaw === "string" && portRaw.trim()
				? Number(portRaw)
				: 22;

	const passwordCred = connection?.password_credential ?? null;
	const keyCred = connection?.private_key_credential ?? null;
	let authMethod = "Not configured";
	let authKey = "—";
	if (keyCred && passwordCred) {
		authMethod = "Password + private key";
		authKey = [passwordCred.name, keyCred.name].filter(Boolean).join(" · ");
	} else if (keyCred) {
		authMethod = "Private key";
		authKey = keyCred.name || "—";
	} else if (passwordCred) {
		authMethod = "Password";
		authKey = passwordCred.name || "—";
	}

	const current = connection?.health?.current_status ?? "";
	const healthy =
		current === "healthy" ||
		(connection?.status === "active" && current !== "failed");
	const failed =
		current === "failed" ||
		connection?.status === "failed" ||
		Boolean(connection?.health?.last_error);

	return {
		id: connection?.id ?? null,
		connectionName: connection?.name ?? "",
		method: connection?.method ?? "",
		direction: connection?.direction ?? "inbound",
		environment: connection?.environment ?? "test",
		lifecycleStatus: connection?.status ?? "draft",
		host,
		port: Number.isFinite(port) ? port : 22,
		username,
		inboundPath,
		archivePath,
		hostKeyFingerprint: fingerprint,
		landingUser,
		errorPath,
		processingPath,
		passwordCredentialId: passwordCred?.id ?? null,
		passwordCredentialName: passwordCred?.name ?? "",
		privateKeyCredentialId: keyCred?.id ?? null,
		privateKeyCredentialName: keyCred?.name ?? "",
		authMethod,
		authKey,
		lastVerified: formatWhen(connection?.health?.last_success_at),
		lastError: connection?.health?.last_error
			? String(connection.health.last_error)
			: "",
		healthStatus: current || "—",
		remoteDirectory: inboundPath,
		status: healthy && !failed ? "Connected" : "Disconnected",
		testConnection: failed ? "Failed" : healthy ? "Successful" : "Unknown",
	};
}

export function intakeJobsToConfigJobs(
	jobs: IntakeJobDto[]
): VendorConfigJob[] {
	return jobs.map((job) => ({
		id: job.id,
		name: job.name,
		fileType: mapFileType(job.file_type),
		direction:
			job.direction?.toLowerCase() === "outbound" ? "Outgoing" : "Incoming",
		frequency: mapCronToFrequency(job.schedule_cron),
		status: mapJobStatus(job.status),
		lastRun: formatWhen(job.updated_at),
		nextRun: "—",
		lastFileReceived: "—",
	}));
}

function formatDurationSeconds(
	seconds: number | null | undefined
): string | null {
	if (seconds == null || !Number.isFinite(seconds)) return null;
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds % 60;
	return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export function inboundFilesToRuns(
	files: InboundFileDto[],
	vendorId: string,
	vendorName: string
): FileRun[] {
	return files
		.filter((f) => f.vendor_id === vendorId)
		.map((file) => ({
			id: file.id,
			runId: file.id.slice(0, 8).toUpperCase(),
			vendor: vendorName,
			vendorId,
			account: "—",
			client: "—",
			fileType: mapFileType(file.detected_type ?? file.destination_module),
			program: inferInboundProgram(file),
			direction: "inbound" as const,
			frequency: "—",
			expectedAt: formatWhen(file.created_at),
			receivedAt: file.created_at ?? null,
			startedAt: file.created_at ?? null,
			completedAt: file.updated_at ?? null,
			status: mapInboundStageToRunStatus(file.stage),
			fileName: file.original_filename,
			records: file.record_count ?? null,
			recordsValid: null,
			recordsRejected: null,
			recordsLoaded: null,
			errorCount: file.error_count ?? 0,
			warningCount: 0,
			duration: formatDurationSeconds(file.duration_seconds),
			fileSizeKb: null,
			checksum: null,
			protocol: "SFTP",
			sourcePath: null,
			destinationPath: null,
			slaMinutes: 0,
			latencyMinutes: null,
			scheduleId: "",
			correlationId: file.id,
			operator: "System",
			notes: null,
			reviewed: false,
			pipeline: [],
			issues: [],
			logs: [],
		}));
}

export function buildTrendFromRuns(runs: FileRun[]): VendorTrendPoint[] {
	const buckets = new Map<string, VendorTrendPoint>();
	for (const run of runs) {
		const at = run.receivedAt ?? run.completedAt ?? run.expectedAt;
		const d = at ? new Date(at) : null;
		const key =
			d && !Number.isNaN(d.getTime())
				? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
				: "Unknown";
		const row = buckets.get(key) ?? {
			day: key,
			successful: 0,
			warnings: 0,
			failed: 0,
		};
		const bucket = runBucket(run.status);
		if (bucket === "success") row.successful += 1;
		else if (bucket === "warning") row.warnings += 1;
		else if (bucket === "failed") row.failed += 1;
		buckets.set(key, row);
	}
	return Array.from(buckets.values()).slice(-7);
}

export function buildVendorAlerts(
	vendorId: string,
	vendorName: string,
	connections: ConnectionDto[],
	files: InboundFileDto[],
	runs: FileRun[]
): VendorAlert[] {
	const alerts: VendorAlert[] = [];

	for (const conn of connections) {
		if (conn.status !== "failed" && !conn.health?.last_error) continue;
		alerts.push({
			id: `conn-${conn.id}`,
			vendorId,
			vendorName,
			title: `Connection issue: ${conn.name}`,
			when: formatWhen(conn.health?.last_failure_at ?? conn.updated_at),
			severity: "error",
		});
	}

	for (const file of files.filter((f) => f.vendor_id === vendorId)) {
		if (!(file.stage ?? "").toLowerCase().includes("fail")) continue;
		alerts.push({
			id: `file-${file.id}`,
			vendorId,
			vendorName,
			title: `File processing failed`,
			fileName: file.original_filename,
			when: formatWhen(file.updated_at ?? file.created_at),
			severity: "warning",
			runId: file.id.slice(0, 8).toUpperCase(),
		});
	}

	if (alerts.length === 0) {
		const failedRuns = runs.filter((r) => runBucket(r.status) === "failed");
		for (const run of failedRuns.slice(0, 3)) {
			alerts.push({
				id: `run-${run.id}`,
				vendorId,
				vendorName,
				title: `Run failed: ${run.fileType}`,
				fileName: run.fileName ?? undefined,
				when: formatWhen(run.receivedAt),
				severity: "error",
				runId: run.runId,
			});
		}
	}

	return alerts;
}

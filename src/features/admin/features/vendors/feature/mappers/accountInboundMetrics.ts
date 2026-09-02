import type {
	ConnectionDto,
	InboundFileDto,
	IntakeJobDto,
} from "@/lib/vendor-core/types";
import { refId } from "@/lib/vendor-core/types";

const FILE_TYPE_LABELS: Record<string, string> = {
	"837": "Medical Claims (837)",
	"837P": "Medical Claims (837)",
	"834": "Eligibility (834)",
	"835": "Pharmacy Claims (835)",
	accumulator: "Accumulator",
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

function isVendorFile(file: InboundFileDto, vendorId: string): boolean {
	return file.vendor_id === vendorId || refId(file.vendor) === vendorId;
}

function startOfLocalDay(date: Date): Date {
	const next = new Date(date);
	next.setHours(0, 0, 0, 0);
	return next;
}

function isSameLocalDay(a: Date, b: Date): boolean {
	return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

export function mapInboundFileTypeLabel(raw?: string | null): string {
	if (!raw) return "Unknown";
	return FILE_TYPE_LABELS[raw] ?? raw;
}

export function mapInboundStageStatus(
	stage?: string | null
): "success" | "warning" | "error" | "processing" {
	const value = (stage ?? "").toLowerCase();
	if (
		value.includes("fail") ||
		value.includes("error") ||
		value.includes("exception")
	) {
		return "error";
	}
	if (value.includes("warn")) return "warning";
	if (value.includes("complete") || value.includes("loaded")) return "success";
	return "processing";
}

export function countVendorInboundFilesOnDay(
	files: InboundFileDto[],
	vendorId: string,
	day: Date
): number {
	return files.filter((file) => {
		if (!isVendorFile(file, vendorId) || !file.created_at) return false;
		const at = new Date(file.created_at);
		return !Number.isNaN(at.getTime()) && isSameLocalDay(at, day);
	}).length;
}

export function formatDayOverDayHint(today: number, yesterday: number): string {
	if (today === 0 && yesterday === 0) return "No files today";
	if (yesterday === 0) {
		return today > 0 ? "New activity today" : "No files today";
	}
	const pct = ((today - yesterday) / yesterday) * 100;
	const sign = pct >= 0 ? "+" : "";
	return `${sign}${pct.toFixed(0)}% vs yesterday`;
}

export function latestVendorInboundFile(
	files: InboundFileDto[],
	vendorId: string
): InboundFileDto | null {
	let latest: InboundFileDto | null = null;
	let latestAt = Number.NEGATIVE_INFINITY;

	for (const file of files) {
		if (!isVendorFile(file, vendorId) || !file.created_at) continue;
		const at = new Date(file.created_at).getTime();
		if (Number.isNaN(at) || at <= latestAt) continue;
		latestAt = at;
		latest = file;
	}

	return latest;
}

function buildJobAccountMap(jobs: IntakeJobDto[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const job of jobs) {
		const accountId = refId(job.account);
		if (accountId) map.set(job.id, accountId);
	}
	return map;
}

function buildConnectionAccountMap(
	connections: ConnectionDto[]
): Map<string, string> {
	const map = new Map<string, string>();
	for (const conn of connections) {
		const accountId = refId(conn.account);
		if (accountId) map.set(conn.id, accountId);
	}
	return map;
}

export function resolveInboundFileAccountId(
	file: InboundFileDto,
	jobAccounts: Map<string, string>,
	connectionAccounts: Map<string, string>
): string | null {
	const jobId = refId(file.job);
	if (jobId) {
		const accountId = jobAccounts.get(jobId);
		if (accountId) return accountId;
	}
	const connectionId = refId(file.connection);
	if (connectionId) {
		const accountId = connectionAccounts.get(connectionId);
		if (accountId) return accountId;
	}
	return null;
}

export function listAccountInboundFiles(
	files: InboundFileDto[],
	accountId: string,
	jobs: IntakeJobDto[],
	connections: ConnectionDto[],
	limit = 10
): InboundFileDto[] {
	const jobAccounts = buildJobAccountMap(jobs);
	const connectionAccounts = buildConnectionAccountMap(connections);

	return files
		.filter(
			(file) =>
				resolveInboundFileAccountId(file, jobAccounts, connectionAccounts) ===
				accountId
		)
		.sort((a, b) => {
			const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
			const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
			return bTime - aTime;
		})
		.slice(0, limit);
}

export type AccountActivityRow = {
	key: string;
	fileType: string;
	direction: "Incoming";
	status: "success" | "warning" | "error" | "processing" | "no_data";
	timestamp: string;
};

export function buildAccountActivityRows(
	accountId: string,
	inboundFiles: InboundFileDto[],
	jobs: IntakeJobDto[],
	connections: ConnectionDto[],
	feedRows: ReadonlyArray<
		readonly [string, "success" | "none" | "warning" | "error"]
	>,
	lastFileType: string,
	lastFileReceived: string
): AccountActivityRow[] {
	const recentFiles = listAccountInboundFiles(
		inboundFiles,
		accountId,
		jobs,
		connections,
		8
	);

	if (recentFiles.length > 0) {
		return recentFiles.map((file) => ({
			key: file.id,
			fileType: mapInboundFileTypeLabel(
				file.detected_type ?? file.destination_module
			),
			direction: "Incoming",
			status: mapInboundStageStatus(file.stage),
			timestamp: formatWhen(file.created_at),
		}));
	}

	return feedRows.map(([type, status]) => ({
		key: type,
		fileType: type,
		direction: "Incoming",
		status:
			status === "none" ? "no_data" : status === "success" ? "success" : status,
		timestamp:
			status === "none" || !fileTypeLabelMatches(lastFileType, type)
				? "—"
				: lastFileReceived,
	}));
}

export function fileTypeLabelMatches(
	lastFileType: string,
	label: string
): boolean {
	const norm = lastFileType.toLowerCase();
	if (label.includes("834")) {
		return norm.includes("834") || norm.includes("eligibility");
	}
	if (label.includes("837")) {
		return norm.includes("837") || norm.includes("medical");
	}
	if (label.includes("835")) {
		return norm.includes("835") || norm.includes("pharmacy");
	}
	if (label.includes("Accumulator")) {
		return norm.includes("accumulator");
	}
	return (
		label.toLowerCase().includes(norm) || norm.includes(label.toLowerCase())
	);
}

export function latestAccountLastInboundIso(
	rows: ReadonlyArray<{ lastInboundAt?: string | null }>
): string | null {
	let latest: string | null = null;
	let latestAt = Number.NEGATIVE_INFINITY;

	for (const row of rows) {
		if (!row.lastInboundAt) continue;
		const at = new Date(row.lastInboundAt).getTime();
		if (Number.isNaN(at) || at <= latestAt) continue;
		latestAt = at;
		latest = row.lastInboundAt;
	}

	return latest;
}

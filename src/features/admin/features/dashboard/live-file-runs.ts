import type { FileRun } from "@/features/admin/features/file-management/mock-data";
import type { InboundFileDto } from "@/lib/vendor-core/types";
import { refId, vendorLabel } from "@/lib/vendor-core/types";

function stageToStatus(stage: string): FileRun["status"] {
	const s = stage.toLowerCase();
	if (
		s.includes("complete") ||
		s.includes("loaded") ||
		s.includes("delivered") ||
		s === "done" ||
		s === "success"
	) {
		return "success";
	}
	if (s.includes("fail") || s.includes("error") || s.includes("reject")) {
		return "failed";
	}
	if (s.includes("warn")) return "warning";
	if (s.includes("process") || s.includes("parse") || s.includes("validat")) {
		return "processing";
	}
	if (s.includes("late")) return "late";
	return "missing";
}

/** Map vendor-core inbound files into the dashboard FileRun shape (remote UUIDs). */
export function inboundFilesToRuns(
	files: InboundFileDto[],
	nameById?: Map<string, string>
): FileRun[] {
	return files.map((f) => {
		const vendorId = f.vendor_id ?? refId(f.vendor);
		const vendorName = vendorLabel(f.vendor, nameById);
		const received = f.created_at ?? null;
		const status = stageToStatus(f.stage);
		const errors = Number(f.error_count ?? 0);
		return {
			id: f.id,
			runId: f.id.slice(0, 8).toUpperCase(),
			vendor: vendorName,
			vendorId,
			account: "—",
			client: "—",
			fileType: f.detected_type || "unknown",
			program: "DHCF",
			direction: "inbound",
			frequency: "ad-hoc",
			expectedAt: received ?? new Date().toISOString(),
			receivedAt: received,
			startedAt: received,
			completedAt: status === "success" ? received : null,
			status,
			fileName: f.original_filename,
			records: null,
			recordsValid: null,
			recordsRejected: null,
			recordsLoaded: null,
			errorCount: errors,
			warningCount: 0,
			duration: null,
			fileSizeKb: f.size_bytes != null ? Math.round(f.size_bytes / 1024) : null,
			checksum: f.checksum_sha256 ?? null,
			protocol: f.source ?? "API",
			sourcePath: null,
			destinationPath: f.destination_module ?? null,
			slaMinutes: 60,
			latencyMinutes: null,
			scheduleId: "—",
			correlationId: f.dispatch_correlation_id || f.id,
			operator: "system",
			notes: f.stage ? `Stage: ${f.stage}` : null,
			reviewed: false,
			pipeline: [],
			issues: [],
			logs: [],
		};
	});
}

export function inboundFileToRun(
	file: InboundFileDto,
	nameById?: Map<string, string>
): FileRun {
	return inboundFilesToRuns([file], nameById)[0]!;
}

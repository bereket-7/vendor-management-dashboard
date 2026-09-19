import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { InboundFileDto, IntakeJobRunDto } from "@/lib/vendor-core/types";

/**
 * Ops file surface backed by Phase-1 intake artifacts (not parallel FileRun table).
 * Use when `NEXT_PUBLIC_USE_VENDOR_CORE_API=true`.
 */
export const fileOpsLiveApi = {
	listInboundFiles: (params?: { stage?: string; vendor_id?: string }) =>
		vendorCoreApi.listInboundFiles(params),

	getInboundFile: (id: string) => vendorCoreApi.getInboundFile(id),

	reprocessInboundFile: (id: string) => vendorCoreApi.reprocessInboundFile(id),

	listJobRuns: (params?: { job_id?: string; stage?: string }) =>
		vendorCoreApi.listIntakeJobRuns(params),

	listValidationResults: (inboundFileId: string) =>
		vendorCoreApi.listValidationResults({ inbound_file_id: inboundFileId }),

	listEvents: (inboundFileId: string) =>
		vendorCoreApi.listInboundFileEvents(inboundFileId),

	/** Lightweight map inbound file → FileRun-like summary for ops UIs. */
	toFileRunSummary: (file: InboundFileDto, run?: IntakeJobRunDto | null) => ({
		id: file.id,
		runId: run?.id ?? file.run ?? file.id,
		fileName: file.original_filename,
		vendor: file.vendor ?? "",
		status: file.stage,
		direction: "inbound" as const,
		receivedAt: file.created_at ?? null,
		checksum: file.checksum_sha256,
		fileSizeKb: Math.round((file.size_bytes ?? 0) / 1024),
		errorCount: file.error_count ?? 0,
		detectedType: file.detected_type,
		destinationModule: file.destination_module,
		source: file.source,
	}),
};

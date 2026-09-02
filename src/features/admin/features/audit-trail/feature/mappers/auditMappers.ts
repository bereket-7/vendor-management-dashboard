import type {
	AuditActionType,
	AuditActivity,
	AuditModule,
} from "@/features/admin/features/audit-trail/mock-data";
import type { AuditRecordDto } from "@/lib/vendor-core/types";

function formatAuditWhen(iso?: string): string {
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

function mapAction(action?: string): AuditActionType {
	const value = (action ?? "").toLowerCase();
	if (value.includes("login")) return "Login";
	if (value.includes("create")) return "Created";
	if (value.includes("delete")) return "Deleted";
	return "Updated";
}

function mapModule(resourceType?: string): AuditModule {
	const value = (resourceType ?? "").toLowerCase();
	if (value.includes("job")) return "Job";
	if (value.includes("account")) return "Account";
	if (value.includes("file") || value.includes("inbound")) return "File";
	if (value.includes("mapping") || value.includes("route")) return "Mapping";
	if (value.includes("login") || value.includes("access")) return "Access";
	return "Configuration";
}

function actorLabel(actor?: AuditRecordDto["actor"]): string {
	if (!actor) return "System";
	if (typeof actor === "string") return actor;
	return actor.name ?? actor.email ?? "System";
}

/** Map vendor-core audit row → audit trail table row. */
export function auditRecordToActivity(row: AuditRecordDto): AuditActivity {
	return {
		id: row.id,
		at: formatAuditWhen(row.created_at),
		user: actorLabel(row.actor),
		action: mapAction(row.action),
		module: mapModule(row.resource_type),
		details: row.summary ?? row.action ?? "—",
		ipAddress: "—",
		vendorId: row.resource_type === "vendor" ? row.resource_id : undefined,
	};
}

/**
 * Wire-shape aliases for vendor detail parallel load.
 * Canonical API types live in `@/lib/vendor-core/types`.
 */
import type {
	AccountDto,
	AccountOpsSummaryDto,
	AuditRecordDto,
	ConnectionDto,
	ContractDto,
	InboundFileDto,
	IntakeJobDto,
	VendorContactDto,
	VendorDto,
	VendorIntegrationProfileDto,
	VendorNoteDto,
} from "@/lib/vendor-core/types";

export type VendorDetailRawBundleDto = {
	vendor: VendorDto;
	integrationProfile: VendorIntegrationProfileDto | null;
	connections: ConnectionDto[];
	jobs: IntakeJobDto[];
	inboundFiles: InboundFileDto[];
	accounts: AccountDto[];
	accountOps: AccountOpsSummaryDto[];
	contacts: VendorContactDto[];
	contracts: ContractDto[];
	notes: VendorNoteDto[];
	auditRecords: AuditRecordDto[];
};

export type VendorDetailResourceKey = keyof Omit<
	VendorDetailRawBundleDto,
	"vendor"
>;

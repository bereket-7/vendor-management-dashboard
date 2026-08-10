/**
 * Seed payload mirrored from vendor-management frontend mocks
 * (VENDOR_DIRECTORY + VENDOR_INTEGRATION + generated accounts/jobs/SFTP).
 * Kept as plain JS so seeding does not depend on NEXT_PUBLIC_USE_MOCK.
 */
export const MOCK_VENDORS = [
	{
		mockId: "vnd-1",
		code: "VND-0003",
		name: "UST Healthcare",
		vendorType: "Clearinghouse",
		status: "active",
		linkedAccounts: 12,
		jobsCount: 8,
		sftpHost: "sftp.ust-healthcare.example",
		timezone: "America/New_York",
		health: "healthy",
		city: "Columbia",
		country: "US",
	},
	{
		mockId: "vnd-2",
		code: "VND-0011",
		name: "CVS Caremark",
		vendorType: "PBM",
		status: "active",
		linkedAccounts: 9,
		jobsCount: 6,
		sftpHost: "sftp.cvs-caremark.example",
		timezone: "America/New_York",
		health: "failed",
		city: "Woonsocket",
		country: "US",
	},
	{
		mockId: "vnd-3",
		code: "VND-0007",
		name: "Labcorp",
		vendorType: "Laboratory",
		status: "active",
		linkedAccounts: 6,
		jobsCount: 10,
		sftpHost: "as2.labcorp.example",
		timezone: "America/New_York",
		health: "warning",
		city: "Burlington",
		country: "US",
	},
	{
		mockId: "vnd-4",
		code: "VND-0014",
		name: "Avesis",
		vendorType: "Dental",
		status: "active",
		linkedAccounts: 5,
		jobsCount: 3,
		sftpHost: "sftp.avesis.example",
		timezone: "America/New_York",
		health: "warning",
		city: "Phoenix",
		country: "US",
	},
	{
		mockId: "vnd-5",
		code: "VND-0002",
		name: "Optum",
		vendorType: "PBM",
		status: "active",
		linkedAccounts: 11,
		jobsCount: 10,
		sftpHost: "sftp.optum.example",
		timezone: "America/New_York",
		health: "healthy",
		city: "Eden Prairie",
		country: "US",
	},
	{
		mockId: "vnd-6",
		code: "VND-0009",
		name: "Quest Diagnostics",
		vendorType: "Laboratory",
		status: "active",
		linkedAccounts: 8,
		jobsCount: 6,
		sftpHost: "sftp.questdiagnostics.example",
		timezone: "America/New_York",
		health: "healthy",
		city: "Secaucus",
		country: "US",
	},
	{
		mockId: "vnd-7",
		code: "VND-0001",
		name: "Change Healthcare",
		vendorType: "Clearinghouse",
		status: "inactive",
		linkedAccounts: 3,
		jobsCount: 0,
		sftpHost: "sftp.changehealthcare.example",
		timezone: "America/New_York",
		health: "warning",
		city: "Nashville",
		country: "US",
	},
	{
		mockId: "vnd-8",
		code: "VND-0018",
		name: "Express Scripts",
		vendorType: "PBM",
		status: "active",
		linkedAccounts: 7,
		jobsCount: 9,
		sftpHost: "sftp.express-scripts.example",
		timezone: "America/New_York",
		health: "healthy",
		city: "St. Louis",
		country: "US",
	},
	{
		mockId: "vnd-9",
		code: "VND-0020",
		name: "Cotviti",
		vendorType: "Clearinghouse",
		status: "active",
		linkedAccounts: 10,
		jobsCount: 11,
		sftpHost: "sftp.cotiviti.example",
		timezone: "America/New_York",
		health: "healthy",
		city: "Atlanta",
		country: "US",
	},
	{
		mockId: "vnd-10",
		code: "VND-0015",
		name: "Delta Dental",
		vendorType: "Dental",
		status: "active",
		linkedAccounts: 4,
		jobsCount: 5,
		sftpHost: "sftp.deltadental.example",
		timezone: "America/New_York",
		health: "healthy",
		city: "San Francisco",
		country: "US",
	},
];

export const ACCOUNT_NAMES = [
	"Alpha Benefits Group",
	"Beta Health Partners",
	"Cascade Care Network",
	"Delta Employer Trust",
	"Evergreen Health Plan",
	"Frontier Mutual",
	"Gateway Benefits Co",
	"Harbor Group Benefits",
	"Ironwood Insurance",
	"Juniper Health Alliance",
	"Keystone Coverage",
	"Lakeside Employer Plan",
];

export const LOBS = ["commercial", "medicare", "medicaid", "marketplace"];

export const CONFIG_FILE_TYPES = [
	{
		label: "Eligibility (834)",
		fileType: "834",
		destination: "members_eligibility",
		pattern: "*_834_*.edi",
	},
	{
		label: "Medical Claims (837)",
		fileType: "837",
		destination: "claims_encounters",
		pattern: "*_837_*.edi",
	},
	{
		label: "Pharmacy Claims (835)",
		fileType: "835",
		destination: "financial_responses",
		pattern: "*_835_*.edi",
	},
	{
		label: "Accumulator",
		fileType: "auto",
		destination: "exceptions",
		pattern: "*ACCUM*",
	},
];

/** Sample inbound filenames from mock alerts / ops UI */
export const SAMPLE_FILES = [
	{
		vendorCode: "VND-0011",
		name: "NCPDP_CVS_20260724.edi",
		content:
			"ISA*00*          *00*          *ZZ*CVSCAREMARK  *ZZ*TILLAMFC     *260724*0825*^*00501*000000001*0*P*:~",
	},
	{
		vendorCode: "VND-0007",
		name: "LAB_LABCORP_W30.csv",
		content: "member_id,result_code,collected_at\nM001,OK,2026-07-23\n",
	},
	{
		vendorCode: "VND-0003",
		name: "837P_UST_20260724.edi",
		content:
			"ISA*00*          *00*          *ZZ*USTHEALTHCARE*ZZ*TILLAMFC     *260724*0602*^*00501*000000002*0*P*:~",
	},
	{
		vendorCode: "VND-0014",
		name: "837D_AVESIS_DAILY.edi",
		content:
			"ISA*00*          *00*          *ZZ*AVESIS       *ZZ*TILLAMFC     *260724*0750*^*00501*000000003*0*P*:~",
	},
	{
		vendorCode: "VND-0001",
		name: "837I_CHANGE_20260723.edi",
		content:
			"ISA*00*          *00*          *ZZ*CHANGEHC     *ZZ*TILLAMFC     *260723*0915*^*00501*000000004*0*P*:~",
	},
	{
		vendorCode: "VND-0002",
		name: "NCPDP_OPTUM_20260724.edi",
		content:
			"ISA*00*          *00*          *ZZ*OPTUM        *ZZ*TILLAMFC     *260724*0412*^*00501*000000005*0*P*:~",
	},
	{
		vendorCode: "VND-0009",
		name: "LAB_QUEST_20260724.csv",
		content: "member_id,result_code,collected_at\nM010,OK,2026-07-24\n",
	},
	{
		vendorCode: "VND-0018",
		name: "NCPDP_ESI_20260724.edi",
		content:
			"ISA*00*          *00*          *ZZ*EXPRESSCRIPTS*ZZ*TILLAMFC     *260724*0240*^*00501*000000006*0*P*:~",
	},
	{
		vendorCode: "VND-0020",
		name: "837P_COTIVITI_20260724.edi",
		content:
			"ISA*00*          *00*          *ZZ*COTIVITI     *ZZ*TILLAMFC     *260724*0118*^*00501*000000007*0*P*:~",
	},
	{
		vendorCode: "VND-0015",
		name: "837D_DELTA_20260723.edi",
		content:
			"ISA*00*          *00*          *ZZ*DELTADENTAL  *ZZ*TILLAMFC     *260723*2302*^*00501*000000008*0*P*:~",
	},
];

export const DEFAULT_ROUTING_RULES = [
	{
		name: "837 → claims_encounters",
		priority: 10,
		destination_module: "claims_encounters",
		edi_type: "837",
	},
	{
		name: "834 → members_eligibility",
		priority: 20,
		destination_module: "members_eligibility",
		edi_type: "834",
	},
	{
		name: "835 → financial_responses",
		priority: 30,
		destination_module: "financial_responses",
		edi_type: "835",
	},
	{
		name: "999 → claims_encounters",
		priority: 40,
		destination_module: "claims_encounters",
		edi_type: "999",
	},
	{
		name: "unknown → exceptions",
		priority: 1000,
		destination_module: "exceptions",
		edi_type: null,
	},
];

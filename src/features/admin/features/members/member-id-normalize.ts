/**
 * Strip legacy demo decorations and apply synthetic Ethiopian demo PII for live API rows.
 * Mirrors vendor-management-core `member_demo_ids.py` for identifiers; PII overlay is FE-only.
 */

const LEGACY_PREFIX_RE = /^(?:EXT-|ALT-|IN-|INT-)/i;
const PERSON_CODE_SUFFIX_RE = /-\d{2}$/;

export const DEMO_NEWTECH_MEMBER_ID = "12345678";
export const DEMO_NEWTECH_FAMILY_ID = "12345678";

/** Correct legacy 7-digit demo typo and empty values to the 8-digit demo IDs. */
export function fixNewtechId(value: string | undefined, fallback = ""): string {
	const trimmed = (value ?? "").trim();
	if (!trimmed) return fallback;
	if (trimmed === "1234567") return DEMO_NEWTECH_MEMBER_ID;
	return trimmed;
}

const LEGACY_CARDHOLDER_TO_DEMO: Record<string, string> = {
	DEMO0001: "099898779",
	"DEMO-ET-0001": "099898779",
	DEMO0002: "099876543",
	"DEMO-ET-0002": "099876543",
};

const DEMO_CARDHOLDER_IDS = new Set(["099898779", "099876543"]);

const DEMO_SUBSCRIBER_IDS: Record<
	string,
	{ external: string; alternate: string }
> = {
	"099898779": { external: "87654321", alternate: "64987572" },
	"099876543": { external: "87654324", alternate: "64981234" },
};

const DEMO_DEPENDENT_IDS: Record<
	string,
	{ external: string; alternate: string }
> = {
	"099898779": { external: "87654322", alternate: "72986543" },
};

type DemoGender = "Male" | "Female";

export type DemoMemberOverlay = {
	firstName: string;
	lastName: string;
	dob: string;
	gender: DemoGender;
	ssnLast4: string;
	memberId: string;
	externalId: string;
	alternateId: string;
	newtechMemberId: string;
	newtechFamilyId: string;
	email: string;
	preferredName: string;
};

const DEMO_FAMILY_1_SUBSCRIBER: Omit<
	DemoMemberOverlay,
	"memberId" | "externalId" | "alternateId"
> = {
	firstName: "Abebe",
	lastName: "Kebede",
	dob: "1990-03-15",
	gender: "Male",
	ssnLast4: "0001",
	newtechMemberId: DEMO_NEWTECH_MEMBER_ID,
	newtechFamilyId: DEMO_NEWTECH_FAMILY_ID,
	email: "abebe.kebede.demo@example.invalid",
	preferredName: "Abebe",
};

const DEMO_FAMILY_1_DEPENDENT: Omit<
	DemoMemberOverlay,
	"memberId" | "externalId" | "alternateId"
> = {
	firstName: "Bethel",
	lastName: "Abebe",
	dob: "2015-06-03",
	gender: "Female",
	ssnLast4: "0003",
	newtechMemberId: DEMO_NEWTECH_MEMBER_ID,
	newtechFamilyId: DEMO_NEWTECH_FAMILY_ID,
	email: "bethel.abebe.demo@example.invalid",
	preferredName: "Bethel",
};

const DEMO_FAMILY_2_SUBSCRIBER: Omit<
	DemoMemberOverlay,
	"memberId" | "externalId" | "alternateId"
> = {
	firstName: "Tigist",
	lastName: "Hailemariam",
	dob: "1985-11-22",
	gender: "Female",
	ssnLast4: "0002",
	newtechMemberId: DEMO_NEWTECH_MEMBER_ID,
	newtechFamilyId: DEMO_NEWTECH_FAMILY_ID,
	email: "tigist.hailemariam.demo@example.invalid",
	preferredName: "Tigist",
};

function looksLegacyDecorated(value: string): boolean {
	const v = value.trim();
	if (!v) return false;
	if (LEGACY_PREFIX_RE.test(v)) return true;
	if (PERSON_CODE_SUFFIX_RE.test(v)) return true;
	if (v.startsWith("DEMO")) return true;
	return false;
}

export function stripLegacyMemberIdDecorations(value: string): string {
	let cleaned = (value || "").trim();
	if (!cleaned) return "";
	cleaned = cleaned.replace(LEGACY_PREFIX_RE, "");
	cleaned = cleaned.replace(PERSON_CODE_SUFFIX_RE, "");
	return cleaned;
}

export function resolveDemoCardholderId(cardholderId: string): string {
	const raw = (cardholderId || "").trim();
	if (!raw) return "";
	const stripped = stripLegacyMemberIdDecorations(raw);
	return (
		LEGACY_CARDHOLDER_TO_DEMO[raw] ??
		LEGACY_CARDHOLDER_TO_DEMO[stripped] ??
		stripped
	);
}

export function isLegacyDemoMember(cardholderId: string): boolean {
	const raw = (cardholderId || "").trim();
	if (!raw) return false;
	if (raw in LEGACY_CARDHOLDER_TO_DEMO) return true;
	if (raw.startsWith("DEMO")) return true;
	const resolved = resolveDemoCardholderId(raw);
	return DEMO_CARDHOLDER_IDS.has(resolved);
}

export function normalizeMemberWireIds(input: {
	cardholderId?: string;
	personCode?: string;
	externalId?: string;
	alternateId?: string;
}): {
	cardholderId: string;
	externalId: string;
	alternateId: string;
} {
	const resolvedCh = resolveDemoCardholderId(input.cardholderId ?? "");
	const personCode = (input.personCode ?? "01").trim();
	const externalRaw = (input.externalId ?? "").trim();
	const alternateRaw = (input.alternateId ?? "").trim();

	let externalId = externalRaw;
	let alternateId = alternateRaw;

	if (personCode === "01" && DEMO_SUBSCRIBER_IDS[resolvedCh]) {
		if (looksLegacyDecorated(externalRaw)) {
			externalId = DEMO_SUBSCRIBER_IDS[resolvedCh]!.external;
		}
		if (looksLegacyDecorated(alternateRaw)) {
			alternateId = DEMO_SUBSCRIBER_IDS[resolvedCh]!.alternate;
		}
	}
	if (personCode === "02" && DEMO_DEPENDENT_IDS[resolvedCh]) {
		if (looksLegacyDecorated(externalRaw)) {
			externalId = DEMO_DEPENDENT_IDS[resolvedCh]!.external;
		}
		if (looksLegacyDecorated(alternateRaw)) {
			alternateId = DEMO_DEPENDENT_IDS[resolvedCh]!.alternate;
		}
	}

	if (looksLegacyDecorated(externalId)) {
		externalId = stripLegacyMemberIdDecorations(externalId);
	}
	if (looksLegacyDecorated(alternateId)) {
		alternateId = stripLegacyMemberIdDecorations(alternateId);
	}

	return {
		cardholderId: resolvedCh,
		externalId,
		alternateId,
	};
}

export function getDemoMemberOverlay(input: {
	cardholderId: string;
	personCode?: string;
	externalId?: string;
	alternateId?: string;
	newtechMemberId?: string;
	newtechFamilyId?: string;
}): DemoMemberOverlay | null {
	if (!isLegacyDemoMember(input.cardholderId)) return null;

	const personCode = (input.personCode ?? "01").trim();
	const ids = normalizeMemberWireIds({
		cardholderId: input.cardholderId,
		personCode,
		externalId: input.externalId,
		alternateId: input.alternateId,
	});

	let template: Omit<
		DemoMemberOverlay,
		"memberId" | "externalId" | "alternateId"
	> | null = null;

	if (ids.cardholderId === "099898779") {
		template =
			personCode === "02" ? DEMO_FAMILY_1_DEPENDENT : DEMO_FAMILY_1_SUBSCRIBER;
	} else if (ids.cardholderId === "099876543" && personCode === "01") {
		template = DEMO_FAMILY_2_SUBSCRIBER;
	}

	if (!template) return null;

	return {
		...template,
		memberId: ids.cardholderId,
		externalId: ids.externalId,
		alternateId: ids.alternateId,
		newtechMemberId: fixNewtechId(
			input.newtechMemberId,
			DEMO_NEWTECH_MEMBER_ID
		),
		newtechFamilyId: fixNewtechId(
			input.newtechFamilyId,
			DEMO_NEWTECH_FAMILY_ID
		),
	};
}

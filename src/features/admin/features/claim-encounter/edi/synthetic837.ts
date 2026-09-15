/**
 * Build a minimal parseable 837 X12 body from claim-line rows when no
 * quarantined/outbound EDI bytes exist (common for seed demo CVFs).
 * Not a Magellan fixture — claim ids/amounts come from live API data.
 */

export type Synthetic837Line = {
	claimId: string;
	amountBilled: number;
	dateOfService?: string | null;
	procedureCode?: string | null;
	provider?: string | null;
};

function money(n: number): string {
	if (!Number.isFinite(n)) return "0";
	return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "");
}

function yyyymmdd(raw?: string | null): string {
	if (!raw || raw === "—") {
		const d = new Date();
		return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
	}
	const digits = raw.replace(/\D/g, "");
	if (digits.length >= 8) return digits.slice(0, 8);
	const parsed = Date.parse(raw);
	if (!Number.isNaN(parsed)) {
		const d = new Date(parsed);
		return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
	}
	return yyyymmdd(null);
}

function seg(...elements: string[]): string {
	return `${elements.join("*")}~`;
}

/** Minimal 837P-shaped interchange for the EDI viewer. */
export function buildSynthetic837FromClaimLines(
	lines: Synthetic837Line[],
	opts?: { vendor?: string | null; controlNumber?: string | null }
): string {
	if (!lines.length) {
		throw new Error("No claim lines available to build EDI preview.");
	}

	const vendor = (opts?.vendor?.trim() || "DEMO VENDOR").slice(0, 60);
	const ctrl =
		(opts?.controlNumber?.trim() || "0001").replace(/\W/g, "").slice(0, 9) ||
		"0001";
	const stamp = yyyymmdd(null);
	const time = "1200";

	const byClaim = new Map<string, Synthetic837Line[]>();
	for (const line of lines) {
		const key = line.claimId || "UNKNOWN";
		const bucket = byClaim.get(key) ?? [];
		bucket.push(line);
		byClaim.set(key, bucket);
	}

	const body: string[] = [];
	body.push(
		seg(
			"ISA",
			"00",
			"          ",
			"00",
			"          ",
			"ZZ",
			"SENDER         ",
			"ZZ",
			"RECEIVER       ",
			stamp.slice(2),
			time,
			"^",
			"00501",
			ctrl.padStart(9, "0"),
			"0",
			"T",
			":"
		)
	);
	body.push(
		seg(
			"GS",
			"HC",
			"SENDER",
			"RECEIVER",
			stamp,
			time,
			ctrl,
			"X",
			"005010X222A1"
		)
	);
	body.push(seg("ST", "837", "0001", "005010X222A1"));
	body.push(seg("BHT", "0019", "00", ctrl, stamp, time, "CH"));
	body.push(seg("NM1", "41", "2", vendor, "", "", "", "", "46", "SEED001"));
	body.push(
		seg("NTE", "ADD", "SYNTHETIC EDI PREVIEW FROM CLAIM LINES - NO STORED FILE")
	);

	let hl = 0;
	let claimIndex = 0;
	for (const [claimId, claimLines] of byClaim) {
		claimIndex += 1;
		const total = claimLines.reduce((s, l) => s + (l.amountBilled || 0), 0);
		const dos = yyyymmdd(claimLines[0]?.dateOfService);
		const npi =
			(claimLines[0]?.provider || "").replace(/\D/g, "").slice(0, 10) ||
			"1999999999";

		hl += 1;
		const billingHl = hl;
		body.push(seg("HL", String(billingHl), "", "20", "1"));
		body.push(seg("NM1", "85", "2", vendor, "", "", "", "", "XX", npi));

		hl += 1;
		body.push(seg("HL", String(hl), String(billingHl), "22", "0"));
		body.push(
			seg(
				"NM1",
				"IL",
				"1",
				"SEED",
				"MEMBER",
				"",
				"",
				"",
				"MI",
				`M${claimIndex}`
			)
		);
		body.push(
			seg(
				"CLM",
				claimId.slice(0, 38),
				money(total),
				"",
				"",
				"11:B:1",
				"Y",
				"A",
				"Y",
				"Y"
			)
		);
		body.push(seg("HI", "ABK:Z0000"));

		claimLines.forEach((line, idx) => {
			const proc = (line.procedureCode || "99213").slice(0, 8);
			body.push(seg("LX", String(idx + 1)));
			body.push(
				seg(
					"SV1",
					`HC:${proc}`,
					money(line.amountBilled || 0),
					"UN",
					"1",
					"",
					"",
					"1"
				)
			);
			body.push(seg("DTP", "472", "D8", yyyymmdd(line.dateOfService) || dos));
		});
	}

	const stIndex = body.findIndex((s) => s.startsWith("ST*"));
	const stSegCount = body.length - stIndex + 1;
	body.push(seg("SE", String(stSegCount), "0001"));
	body.push(seg("GE", "1", ctrl));
	body.push(seg("IEA", "1", ctrl.padStart(9, "0")));

	return body.join("");
}

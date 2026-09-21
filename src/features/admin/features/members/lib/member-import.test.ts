import {
	detectDelimiter,
	normalizeDateOfBirth,
	normalizeGender,
	parseMemberImportFile,
	sampleDownloadSpec,
} from "./member-import";

describe("member-import", () => {
	it("normalizes dates and gender", () => {
		expect(normalizeDateOfBirth("19880412")).toBe("1988-04-12");
		expect(normalizeDateOfBirth("4/12/1988")).toBe("1988-04-12");
		expect(normalizeGender("female")).toBe("F");
		expect(normalizeGender("M")).toBe("M");
	});

	it("detects pipe vs comma delimiter", () => {
		expect(detectDelimiter("a|b|c")).toBe("|");
		expect(detectDelimiter("a,b,c")).toBe(",");
	});

	it("parses eligibility sample headers", () => {
		const spec = sampleDownloadSpec("eligibility");
		const csv = [
			spec.headers.join(","),
			...spec.rows.map((r) => r.join(",")),
		].join("\n");
		const parsed = parseMemberImportFile(csv, "eligibility");
		expect(parsed.fileErrors).toEqual([]);
		expect(parsed.rows).toHaveLength(3);
		expect(parsed.rows[0]?.cardholder_id).toBe("ELIG-10001");
		expect(parsed.rows[0]?.first_name).toBe("Ava");
	});

	it("collapses duplicate claim rows into unique members", () => {
		const csv = [
			"CardholderID,PersonCode,PatientFirstName,PatientLastName,DateOfBirth,Gender",
			"CLM-1,01,Jordan,Patel,1991-02-18,M",
			"CLM-1,01,Jordan,Patel,1991-02-18,M",
			"CLM-2,01,Elena,Brooks,1984-09-30,F",
		].join("\n");
		const parsed = parseMemberImportFile(csv, "claim");
		expect(parsed.fileErrors).toEqual([]);
		expect(parsed.rawRowCount).toBe(3);
		expect(parsed.rows).toHaveLength(2);
		expect(parsed.rows[0]?.sourceHits).toBe(2);
		expect(parsed.dedupedCount).toBe(1);
	});

	it("maps accumulator-style spaced headers", () => {
		const spec = sampleDownloadSpec("accumulator");
		const csv = [
			spec.headers.join(","),
			...spec.rows.map((r) => r.join(",")),
		].join("\n");
		const parsed = parseMemberImportFile(csv, "accumulator");
		expect(parsed.fileErrors).toEqual([]);
		expect(parsed.rows.length).toBeGreaterThanOrEqual(3);
		expect(parsed.mappings.some((m) => m.field === "cardholder_id")).toBe(true);
		expect(parsed.mappings.some((m) => m.field === "first_name")).toBe(true);
	});
});

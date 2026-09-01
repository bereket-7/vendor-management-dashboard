import {
	applyEdiPercentChange,
	applyMilestoneDateChange,
	applyMilestoneStatusChange,
	applySftpPercentChange,
	canSetEdiProgress,
	completedKeysForPercent,
	percentFromCompletedKeys,
	snapPercentToCatalog,
	toggleMilestoneCompletion,
	validateEdiMilestoneSave,
} from "./progress-rules";
import { EDI_MILESTONE_DEFS, SFTP_MILESTONE_DEFS } from "./progress-data";

describe("snapPercentToCatalog (SFTP)", () => {
	it("snaps to highest milestone weight not exceeding input", () => {
		expect(snapPercentToCatalog(SFTP_MILESTONE_DEFS, 0)).toBe(0);
		expect(snapPercentToCatalog(SFTP_MILESTONE_DEFS, 9)).toBe(0);
		expect(snapPercentToCatalog(SFTP_MILESTONE_DEFS, 10)).toBe(10);
		expect(snapPercentToCatalog(SFTP_MILESTONE_DEFS, 45)).toBe(30);
		expect(snapPercentToCatalog(SFTP_MILESTONE_DEFS, 50)).toBe(50);
		expect(snapPercentToCatalog(SFTP_MILESTONE_DEFS, 74)).toBe(50);
		expect(snapPercentToCatalog(SFTP_MILESTONE_DEFS, 75)).toBe(75);
		expect(snapPercentToCatalog(SFTP_MILESTONE_DEFS, 100)).toBe(100);
	});
});

describe("percentFromCompletedKeys", () => {
	it("uses highest completed milestone weight", () => {
		expect(
			percentFromCompletedKeys(SFTP_MILESTONE_DEFS, [
				"initial_contact_sent",
				"second_contact_sent",
			])
		).toBe(20);
		expect(
			percentFromCompletedKeys(SFTP_MILESTONE_DEFS, ["sftp_confirmed"])
		).toBe(100);
	});
});

describe("completedKeysForPercent", () => {
	it("includes all milestones up to snapped weight", () => {
		expect(completedKeysForPercent(SFTP_MILESTONE_DEFS, 75)).toEqual([
			"initial_contact_sent",
			"second_contact_sent",
			"response_received",
			"ip_whitelisted",
			"credentials_provided",
		]);
	});
});

describe("applyMilestoneStatusChange", () => {
	it("completing a milestone fills earlier and clears later", () => {
		const next = applyMilestoneStatusChange(
			SFTP_MILESTONE_DEFS,
			new Set(["initial_contact_sent"]),
			"response_received",
			"complete"
		);
		expect(Array.from(next)).toEqual([
			"initial_contact_sent",
			"second_contact_sent",
			"response_received",
		]);
	});

	it("clearing a milestone clears it and all later", () => {
		const next = applyMilestoneStatusChange(
			SFTP_MILESTONE_DEFS,
			new Set([
				"initial_contact_sent",
				"second_contact_sent",
				"response_received",
			]),
			"second_contact_sent",
			"not_started"
		);
		expect(Array.from(next)).toEqual(["initial_contact_sent"]);
	});
});

describe("EDI prerequisites", () => {
	it("blocks EDI until SFTP is 100%", () => {
		expect(canSetEdiProgress(99)).toBe(false);
		expect(canSetEdiProgress(100)).toBe(true);
		expect(applyEdiPercentChange(50, {}, 50)).toBeNull();
	});

	it("allows EDI percents when SFTP complete", () => {
		const result = applyEdiPercentChange(
			100,
			Object.fromEntries(
				EDI_MILESTONE_DEFS.map((m) => [m.key, "not_started" as const])
			),
			50
		);
		expect(result?.ediProgress).toBe(50);
	});
});

describe("applySftpPercentChange", () => {
	it("clears EDI when SFTP drops below 100%", () => {
		const result = applySftpPercentChange(
			{
				sftpProgress: 100,
				ediProgress: 50,
				sftpMilestones: {},
				ediMilestones: Object.fromEntries(
					EDI_MILESTONE_DEFS.map((m) => [m.key, "complete" as const])
				),
			},
			75
		);
		expect(result.sftpProgress).toBe(75);
		expect(result.ediProgress).toBe(0);
	});
});

describe("toggleMilestoneCompletion", () => {
	it("completing a milestone fills earlier and clears later", () => {
		const defs = SFTP_MILESTONE_DEFS;
		const base = defs.map((d) => ({ key: d.key, completedAt: null as string | null }));
		const next = toggleMilestoneCompletion(
			defs,
			base,
			"response_received",
			true,
			"01/15/2026"
		);
		expect(next.filter((m) => m.completedAt).map((m) => m.key)).toEqual([
			"initial_contact_sent",
			"second_contact_sent",
			"response_received",
		]);
	});

	it("unchecking clears that milestone and all later", () => {
		const defs = SFTP_MILESTONE_DEFS;
		const base = defs.map((d) => ({
			key: d.key,
			completedAt: "01/15/2026",
		}));
		const next = toggleMilestoneCompletion(
			defs,
			base,
			"second_contact_sent",
			false,
			"01/15/2026"
		);
		expect(next.filter((m) => m.completedAt).map((m) => m.key)).toEqual([
			"initial_contact_sent",
		]);
	});
});

describe("applyMilestoneDateChange", () => {
	it("setting a date completes through that index", () => {
		const defs = SFTP_MILESTONE_DEFS;
		const base = defs.map((d) => ({ key: d.key, completedAt: null as string | null }));
		const next = applyMilestoneDateChange(
			defs,
			base,
			"ip_whitelisted",
			"02/01/2026",
			"01/01/2026"
		);
		expect(next.filter((m) => m.completedAt).map((m) => m.key)).toEqual([
			"initial_contact_sent",
			"second_contact_sent",
			"response_received",
			"ip_whitelisted",
		]);
	});
});

describe("validateEdiMilestoneSave", () => {
	it("rejects EDI completion when SFTP below 100%", () => {
		expect(
			validateEdiMilestoneSave(75, [{ completedAt: "01/01/2026" }])
		).toMatch(/SFTP at 100%/);
		expect(validateEdiMilestoneSave(100, [{ completedAt: null }])).toBeNull();
	});
});

import type { MilestoneDefinition } from "./progress-data";
import { EDI_MILESTONE_DEFS, SFTP_MILESTONE_DEFS } from "./progress-data";

/** UI-only status for registration milestone pickers. */
export type MilestoneUiStatus = "not_started" | "in_progress" | "complete";

export const SFTP_PROGRESS_WEIGHTS = SFTP_MILESTONE_DEFS.map(
	(m) => m.weightPercent
);
export const EDI_PROGRESS_WEIGHTS = EDI_MILESTONE_DEFS.map(
	(m) => m.weightPercent
);

export const SFTP_COMPLETE_PERCENT = 100;
export const EDI_COMPLETE_PERCENT = 100;

/**
 * Percent equals the weight of the highest completed milestone in catalog order
 * (matches backend `compute_track_percent`).
 */
export function percentFromCompletedKeys(
	defs: MilestoneDefinition[],
	completedKeys: ReadonlySet<string> | readonly string[]
): number {
	const completed =
		completedKeys instanceof Set ? completedKeys : new Set(completedKeys);
	let percent = 0;
	for (const milestone of defs) {
		if (completed.has(milestone.key)) {
			percent = milestone.weightPercent;
		}
	}
	return percent;
}

/**
 * Snap a raw slider/input value to the highest milestone weight not exceeding it.
 * Example: SFTP 45 → 30 (Response Received), SFTP 50 → 50 (IP Whitelisted).
 */
export function snapPercentToCatalog(
	defs: MilestoneDefinition[],
	rawPercent: number
): number {
	const clamped = Math.min(100, Math.max(0, Math.round(rawPercent)));
	if (clamped <= 0) return 0;

	let snapped = 0;
	for (const milestone of defs) {
		if (milestone.weightPercent <= clamped) {
			snapped = milestone.weightPercent;
		} else {
			break;
		}
	}
	return snapped;
}

/** Milestone keys that should be complete for a snapped catalog percent. */
export function completedKeysForPercent(
	defs: MilestoneDefinition[],
	percent: number
): string[] {
	const snapped = snapPercentToCatalog(defs, percent);
	if (snapped <= 0) return [];
	return defs.filter((m) => m.weightPercent <= snapped).map((m) => m.key);
}

export function canSetEdiProgress(sftpPercent: number): boolean {
	return sftpPercent >= SFTP_COMPLETE_PERCENT;
}

export function milestoneStatusesFromCompletedKeys(
	defs: MilestoneDefinition[],
	completedKeys: ReadonlySet<string>
): Record<string, MilestoneUiStatus> {
	const highestCompleteIndex = defs.reduce(
		(max, milestone, index) => (completedKeys.has(milestone.key) ? index : max),
		-1
	);

	const statuses: Record<string, MilestoneUiStatus> = {};
	defs.forEach((milestone, index) => {
		if (completedKeys.has(milestone.key)) {
			statuses[milestone.key] = "complete";
		} else if (index === highestCompleteIndex + 1) {
			statuses[milestone.key] = "in_progress";
		} else {
			statuses[milestone.key] = "not_started";
		}
	});
	return statuses;
}

export function completedKeysFromStatuses(
	defs: MilestoneDefinition[],
	statuses: Record<string, MilestoneUiStatus | undefined>
): Set<string> {
	return new Set(
		defs.filter((m) => statuses[m.key] === "complete").map((m) => m.key)
	);
}

/**
 * Apply registration milestone picker change with ordering rules:
 * - complete → this + all earlier complete; later cleared
 * - in_progress → all earlier complete; this + later not complete
 * - not_started → this + all later cleared
 */
export function applyMilestoneStatusChange(
	defs: MilestoneDefinition[],
	currentCompleted: ReadonlySet<string>,
	key: string,
	status: MilestoneUiStatus
): Set<string> {
	const index = defs.findIndex((m) => m.key === key);
	if (index < 0) return new Set(currentCompleted);

	const next = new Set(currentCompleted);

	if (status === "complete") {
		for (let i = 0; i <= index; i += 1) {
			const milestone = defs[i];
			if (milestone) next.add(milestone.key);
		}
		for (let i = index + 1; i < defs.length; i += 1) {
			const milestone = defs[i];
			if (milestone) next.delete(milestone.key);
		}
	} else if (status === "in_progress") {
		for (let i = 0; i < index; i += 1) {
			const milestone = defs[i];
			if (milestone) next.add(milestone.key);
		}
		for (let i = index; i < defs.length; i += 1) {
			const milestone = defs[i];
			if (milestone) next.delete(milestone.key);
		}
	} else {
		for (let i = index; i < defs.length; i += 1) {
			const milestone = defs[i];
			if (milestone) next.delete(milestone.key);
		}
	}

	return next;
}

export function syncTrackFromCompletedKeys(
	defs: MilestoneDefinition[],
	completedKeys: ReadonlySet<string>
): { percent: number; statuses: Record<string, MilestoneUiStatus> } {
	const percent = percentFromCompletedKeys(defs, completedKeys);
	return {
		percent,
		statuses: milestoneStatusesFromCompletedKeys(defs, completedKeys),
	};
}

export function applySftpPercentChange(
	current: {
		sftpProgress: number;
		ediProgress: number;
		sftpMilestones: Record<string, MilestoneUiStatus>;
		ediMilestones: Record<string, MilestoneUiStatus>;
	},
	rawPercent: number
) {
	const snapped = snapPercentToCatalog(SFTP_MILESTONE_DEFS, rawPercent);
	const completed = new Set(
		completedKeysForPercent(SFTP_MILESTONE_DEFS, snapped)
	);
	const sftpMilestones = milestoneStatusesFromCompletedKeys(
		SFTP_MILESTONE_DEFS,
		completed
	);

	if (snapped < SFTP_COMPLETE_PERCENT) {
		const emptyEdi = milestoneStatusesFromCompletedKeys(
			EDI_MILESTONE_DEFS,
			new Set()
		);
		return {
			sftpProgress: snapped,
			sftpMilestones,
			ediProgress: 0,
			ediMilestones: emptyEdi,
		};
	}

	return {
		sftpProgress: snapped,
		sftpMilestones,
		ediProgress: current.ediProgress,
		ediMilestones: current.ediMilestones,
	};
}

export function applyEdiPercentChange(
	sftpProgress: number,
	currentEdiMilestones: Record<string, MilestoneUiStatus>,
	rawPercent: number
): {
	ediProgress: number;
	ediMilestones: Record<string, MilestoneUiStatus>;
} | null {
	if (!canSetEdiProgress(sftpProgress)) return null;

	const snapped = snapPercentToCatalog(EDI_MILESTONE_DEFS, rawPercent);
	const completed = new Set(
		completedKeysForPercent(EDI_MILESTONE_DEFS, snapped)
	);
	return {
		ediProgress: snapped,
		ediMilestones: milestoneStatusesFromCompletedKeys(
			EDI_MILESTONE_DEFS,
			completed
		),
	};
}

export function applySftpMilestoneStatusChange(
	currentStatuses: Record<string, MilestoneUiStatus>,
	key: string,
	status: MilestoneUiStatus
) {
	const completed = applyMilestoneStatusChange(
		SFTP_MILESTONE_DEFS,
		completedKeysFromStatuses(SFTP_MILESTONE_DEFS, currentStatuses),
		key,
		status
	);
	const synced = syncTrackFromCompletedKeys(SFTP_MILESTONE_DEFS, completed);

	const result: {
		sftpProgress: number;
		sftpMilestones: Record<string, MilestoneUiStatus>;
		ediProgress?: number;
		ediMilestones?: Record<string, MilestoneUiStatus>;
	} = {
		sftpProgress: synced.percent,
		sftpMilestones: synced.statuses,
	};

	if (synced.percent < SFTP_COMPLETE_PERCENT) {
		result.ediProgress = 0;
		result.ediMilestones = milestoneStatusesFromCompletedKeys(
			EDI_MILESTONE_DEFS,
			new Set()
		);
	}

	return result;
}

export function applyEdiMilestoneStatusChange(
	sftpProgress: number,
	currentStatuses: Record<string, MilestoneUiStatus>,
	key: string,
	status: MilestoneUiStatus
): {
	ediProgress: number;
	ediMilestones: Record<string, MilestoneUiStatus>;
} | null {
	if (!canSetEdiProgress(sftpProgress)) return null;

	const completed = applyMilestoneStatusChange(
		EDI_MILESTONE_DEFS,
		completedKeysFromStatuses(EDI_MILESTONE_DEFS, currentStatuses),
		key,
		status
	);
	const synced = syncTrackFromCompletedKeys(EDI_MILESTONE_DEFS, completed);
	return {
		ediProgress: synced.percent,
		ediMilestones: synced.statuses,
	};
}

/**
 * Toggle/check milestone in detail editor — enforces contiguous completion order.
 */
export type MilestoneCompletionRow = {
	key: string;
	completedAt: string | null;
};

export function toggleMilestoneCompletion(
	defs: MilestoneDefinition[],
	milestones: MilestoneCompletionRow[],
	targetKey: string,
	checked: boolean,
	defaultDate: string
): MilestoneCompletionRow[] {
	const index = defs.findIndex((m) => m.key === targetKey);
	if (index < 0) return milestones;

	return milestones.map((milestone, i) => {
		if (checked) {
			if (i <= index) {
				return {
					...milestone,
					completedAt: milestone.completedAt || defaultDate,
				};
			}
			return { ...milestone, completedAt: null };
		}
		if (i >= index) {
			return { ...milestone, completedAt: null };
		}
		return milestone;
	});
}

/** Set/clear milestone date with contiguous completion order (matches backend normalize). */
export function applyMilestoneDateChange(
	defs: MilestoneDefinition[],
	milestones: MilestoneCompletionRow[],
	targetKey: string,
	date: string,
	defaultDate: string
): MilestoneCompletionRow[] {
	const trimmed = date.trim();
	if (!trimmed) {
		return toggleMilestoneCompletion(
			defs,
			milestones,
			targetKey,
			false,
			defaultDate
		);
	}

	const index = defs.findIndex((m) => m.key === targetKey);
	if (index < 0) return milestones;

	return milestones.map((milestone, i) => {
		if (i <= index) {
			return {
				key: milestone.key,
				completedAt: i === index ? trimmed : milestone.completedAt || trimmed,
			};
		}
		return { key: milestone.key, completedAt: null };
	});
}

export function validateEdiMilestoneSave(
	sftpPercent: number,
	ediMilestones: Array<{ completedAt: string | null }>
): string | null {
	const hasEdiCompletion = ediMilestones.some((m) => Boolean(m.completedAt));
	if (hasEdiCompletion && !canSetEdiProgress(sftpPercent)) {
		return "EDI milestones require SFTP at 100% before any EDI milestone is set.";
	}
	return null;
}

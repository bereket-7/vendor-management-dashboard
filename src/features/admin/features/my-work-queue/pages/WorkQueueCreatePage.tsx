"use client";

import { useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import { useVendorCoreUsersQuery } from "@/features/admin/features/users/feature/queries/useUsersQuery";
import { useRouter } from "@/i18n/navigation";
import { isMockEnabled } from "@/lib/mock-mode";

import {
	dateToApi,
	vendorTypeToApi,
} from "../feature/mappers/workQueueMappers";
import {
	useCreateMigrationCaseMutation,
	useInvalidateVendorCore,
	useSetMigrationCaseStatusMutation,
	useSetMigrationCaseWhitelistMutation,
	useTransitionMigrationCaseBlockerMutation,
	useUpdateMigrationCaseProgressMutation,
} from "../feature/queries/useWorkQueueQuery";
import { workQueueErrorMessage } from "../feature/workQueueErrors";
import {
	mergeCaseMetadata,
	whitelistStatusFromIpWhitelisting,
} from "../lib/work-queue-detail-tabs";
import {
	EDI_MILESTONE_DEFS,
	SFTP_MILESTONE_DEFS,
	buildMilestones,
	progressFromMilestones,
} from "../progress-data";
import {
	type MilestoneUiStatus,
	applyEdiMilestoneStatusChange,
	applyEdiPercentChange,
	applySftpMilestoneStatusChange,
	applySftpPercentChange,
	completedKeysForPercent,
	completedKeysFromStatuses,
} from "../progress-rules";
import {
	EMPTY_WORK_QUEUE_WIZARD,
	WorkQueueFormWizard,
	type WorkQueueWizardValues,
} from "./WorkQueueFormWizard";

const DRAFT_STORAGE_KEY = "work-queue-tpa-tpv-registration-draft";

function WorkQueueCreateBody() {
	const router = useRouter();
	const useLive = !isMockEnabled();
	const invalidate = useInvalidateVendorCore();
	const createCase = useCreateMigrationCaseMutation();
	const setStatus = useSetMigrationCaseStatusMutation();
	const setWhitelist = useSetMigrationCaseWhitelistMutation();
	const transitionBlocker = useTransitionMigrationCaseBlockerMutation();
	const updateProgress = useUpdateMigrationCaseProgressMutation();
	const usersQ = useVendorCoreUsersQuery();

	const [values, setValues] = useState<WorkQueueWizardValues>(
		EMPTY_WORK_QUEUE_WIZARD
	);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analysts = useMemo(() => {
		return (usersQ.data ?? [])
			.map((user) => {
				const label =
					user.full_name?.trim() ||
					[user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
					user.username?.trim() ||
					user.email?.trim() ||
					user.id;
				return { id: user.id, label };
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [usersQ.data]);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<WorkQueueWizardValues>;
			setValues((prev) => ({
				...prev,
				...parsed,
				sftpMilestones: {
					...prev.sftpMilestones,
					...parsed.sftpMilestones,
				},
				ediMilestones: {
					...prev.ediMilestones,
					...parsed.ediMilestones,
				},
			}));
		} catch {
			/* ignore corrupt draft */
		}
	}, []);

	function patchValues(patch: Partial<WorkQueueWizardValues>) {
		setValues((prev) => {
			let next = { ...prev, ...patch };

			if (
				patch.sftpProgress !== undefined &&
				patch.sftpMilestones === undefined
			) {
				next = {
					...next,
					...applySftpPercentChange(prev, patch.sftpProgress),
				};
			}

			if (
				patch.ediProgress !== undefined &&
				patch.ediMilestones === undefined
			) {
				const applied = applyEdiPercentChange(
					next.sftpProgress,
					prev.ediMilestones,
					patch.ediProgress
				);
				if (!applied) {
					toast.error(
						"EDI progress requires SFTP at 100% before any EDI milestone is set."
					);
					return prev;
				}
				next = { ...next, ...applied };
			}

			if (patch.sftpMilestones) {
				const changedKey = Object.keys(patch.sftpMilestones).find(
					(key) => patch.sftpMilestones?.[key] !== prev.sftpMilestones[key]
				);
				if (changedKey && patch.sftpMilestones[changedKey]) {
					next = {
						...next,
						...applySftpMilestoneStatusChange(
							prev.sftpMilestones,
							changedKey,
							patch.sftpMilestones[changedKey]!
						),
					};
				}
			}

			if (patch.ediMilestones) {
				const changedKey = Object.keys(patch.ediMilestones).find(
					(key) => patch.ediMilestones?.[key] !== prev.ediMilestones[key]
				);
				if (changedKey && patch.ediMilestones[changedKey]) {
					const applied = applyEdiMilestoneStatusChange(
						next.sftpProgress,
						prev.ediMilestones,
						changedKey,
						patch.ediMilestones[changedKey]!
					);
					if (!applied) {
						toast.error(
							"EDI milestones require SFTP at 100% before any EDI milestone is set."
						);
						return prev;
					}
					next = { ...next, ...applied };
				}
			}

			return next;
		});
	}

	function buildInitialProgress(
		defs: typeof SFTP_MILESTONE_DEFS,
		statuses: Record<string, MilestoneUiStatus>,
		percent: number
	) {
		let completedKeys = Array.from(completedKeysFromStatuses(defs, statuses));
		if (!completedKeys.length && percent > 0) {
			completedKeys = completedKeysForPercent(defs, percent);
		}
		if (!completedKeys.length) return null;
		const today = new Date().toISOString().slice(0, 10);
		const dates = Object.fromEntries(completedKeys.map((k) => [k, today]));
		const milestones = buildMilestones(defs, completedKeys, dates);
		return progressFromMilestones(milestones, {
			updatedBy: "",
			updatedAt: today,
		});
	}

	function saveDraft() {
		try {
			localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
			toast.success("Draft saved locally");
		} catch {
			toast.error("Could not save draft");
		}
	}

	async function handleSubmit() {
		if (!values.wave) {
			setError("Select a wave.");
			toast.error("Select a wave");
			return;
		}
		if (!values.name.trim()) {
			setError("Enter a TPA/TPV name.");
			toast.error("Enter a TPA/TPV name");
			return;
		}
		if (!values.serverType) {
			setError("Select a server / connection type.");
			toast.error("Select a server / connection type");
			return;
		}

		setBusy(true);
		setError(null);
		try {
			if (!useLive) {
				localStorage.removeItem(DRAFT_STORAGE_KEY);
				toast.success(`${values.name.trim()} registered (mock)`);
				router.push("/admin/my-work-queue");
				return;
			}

			const prefix = values.vendorType === "TPV" ? "TPV" : "TPA";
			const code =
				values.code.trim() || `${prefix}-${Date.now().toString().slice(-6)}`;

			const ediAnalystLabel =
				analysts.find((a) => a.id === values.ediAnalystId)?.label ?? "";

			const metadata = mergeCaseMetadata(null, {
				operational_status: values.operationalStatus,
				ip_whitelisting_status: values.ipWhitelistingStatus,
				ip_whitelisting_not_required:
					values.ipWhitelistingStatus === "not_required",
				escalated: values.escalated === "yes",
				escalation_reason: values.escalationReason || null,
				escalated_to: values.escalatedTo || null,
				escalation_workflow_status: values.escalationWorkflowStatus,
				edi_analyst_id: values.ediAnalystId || null,
				edi_analyst_name: ediAnalystLabel || null,
				edi_analyst_assigned_at: values.ediAnalystId
					? new Date().toISOString()
					: null,
			});

			const created = await createCase.mutateAsync({
				name: values.name.trim(),
				code,
				vendor_type: vendorTypeToApi(values.vendorType),
				wave: Number(values.wave) || 1,
				server_type: values.serverType,
				notes: values.notes.trim(),
				next_step: values.nextStep.trim(),
				current_stage: values.currentStage || "not_started",
				assigned_to_id: values.analystId || null,
				migration_start_date: dateToApi(values.migrationStartDate),
				waiting_on_vendor_date: dateToApi(values.waitingOnVendorDate),
				last_communication_at: dateToApi(values.lastCommunicationAt),
				primary_contact: values.primaryContact.trim(),
				primary_email: values.primaryEmail.trim(),
				primary_phone: values.primaryPhone.trim(),
				secondary_contact: values.secondaryContact.trim(),
				secondary_email: values.secondaryEmail.trim(),
				secondary_phone: values.secondaryPhone.trim(),
				metadata,
			});

			if (formNeedsStatusUpdate(values) && created.id) {
				try {
					await setStatus.mutateAsync({
						id: created.id,
						migration_status: values.status,
					});
				} catch {
					/* case created; status can be set on detail */
				}
			}

			const whitelist = whitelistStatusFromIpWhitelisting(
				values.ipWhitelistingStatus
			);
			if (whitelist !== "not_started" && created.id) {
				try {
					await setWhitelist.mutateAsync({
						id: created.id,
						whitelist_status: whitelist,
					});
				} catch {
					/* optional follow-up */
				}
			}

			if (values.escalated === "yes" && created.id) {
				try {
					await transitionBlocker.mutateAsync({
						id: created.id,
						blocker_status: "escalated",
						blocker_reason: values.escalationReason || null,
						blocker_notes: values.blockerNotes.trim(),
					});
				} catch {
					/* metadata already carries escalation flags */
				}
			}

			const sftpProgress = buildInitialProgress(
				SFTP_MILESTONE_DEFS,
				values.sftpMilestones,
				values.sftpProgress
			);
			if (sftpProgress && created.id) {
				try {
					await updateProgress.mutateAsync({
						id: created.id,
						track: "sftp",
						progress: sftpProgress,
					});
				} catch {
					/* optional */
				}
			}

			const ediProgress = buildInitialProgress(
				EDI_MILESTONE_DEFS,
				values.ediMilestones,
				values.ediProgress
			);
			if (ediProgress && created.id) {
				try {
					await updateProgress.mutateAsync({
						id: created.id,
						track: "edi",
						progress: ediProgress,
					});
				} catch {
					/* optional */
				}
			}

			localStorage.removeItem(DRAFT_STORAGE_KEY);
			invalidate();
			toast.success(`${created.name} registered`);
			router.push(`/admin/my-work-queue/${created.id}`);
		} catch (err) {
			const message = workQueueErrorMessage(err, "Registration failed");
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}

	const pending =
		busy ||
		createCase.isPending ||
		setStatus.isPending ||
		setWhitelist.isPending ||
		transitionBlocker.isPending ||
		updateProgress.isPending;

	return (
		<WorkQueueFormWizard
			values={values}
			onChange={patchValues}
			analysts={analysts}
			busy={pending}
			error={error}
			onCancelHref="/admin/my-work-queue"
			onSaveDraft={saveDraft}
			onSubmit={handleSubmit}
		/>
	);
}

function formNeedsStatusUpdate(values: WorkQueueWizardValues) {
	return values.status !== "not_started";
}

export function WorkQueueCreatePage() {
	if (!isMockEnabled()) {
		return (
			<VendorCoreGate title="Add TPA/TPV">
				<WorkQueueCreateBody />
			</VendorCoreGate>
		);
	}
	return <WorkQueueCreateBody />;
}

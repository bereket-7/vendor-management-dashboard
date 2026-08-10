"use client";

import { useMemo, useState } from "react";

import {
	Activity,
	PauseCircle,
	Pencil,
	PlayCircle,
	Plus,
	RotateCcw,
	Sparkles,
	Workflow,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type RuleStatus = "active" | "paused";

type AutomationRule = {
	id: string;
	name: string;
	trigger: string;
	action: string;
	status: RuleStatus;
	lastRun: string;
	runsCount: number;
};

const INITIAL_RULES: AutomationRule[] = [
	{
		id: "rule-1",
		name: "Auto-escalate SLA breaches",
		trigger: "SLA breach detected",
		action: "Escalate to ops lead",
		status: "active",
		lastRun: "Today 9:14 AM",
		runsCount: 42,
	},
	{
		id: "rule-2",
		name: "Auto-notify on file processing failures",
		trigger: "File run failed",
		action: "Notify ops + vendor manager",
		status: "active",
		lastRun: "Today 8:02 AM",
		runsCount: 128,
	},
	{
		id: "rule-3",
		name: "Auto-approve invoices under $500",
		trigger: "Invoice submitted",
		action: "Approve if amount < threshold",
		status: "active",
		lastRun: "Yesterday 4:40 PM",
		runsCount: 310,
	},
	{
		id: "rule-4",
		name: "Auto-assign onboarding cases",
		trigger: "New onboarding case",
		action: "Assign round-robin reviewer",
		status: "paused",
		lastRun: "Jul 24, 2:18 PM",
		runsCount: 56,
	},
	{
		id: "rule-5",
		name: "Weekly vendor health digest",
		trigger: "Weekly schedule",
		action: "Email digest to stakeholders",
		status: "active",
		lastRun: "Mon 7:00 AM",
		runsCount: 18,
	},
];

const TRIGGER_TYPES = [
	"SLA breach detected",
	"File run failed",
	"Invoice submitted",
	"New onboarding case",
	"Weekly schedule",
	"Vendor status change",
] as const;

const ACTION_TYPES = [
	"Escalate to ops lead",
	"Notify ops + vendor manager",
	"Approve if amount < threshold",
	"Assign round-robin reviewer",
	"Email digest to stakeholders",
	"Create follow-up task",
] as const;

export function AutomationsPage() {
	const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
	const [builderTrigger, setBuilderTrigger] = useState<string>(
		TRIGGER_TYPES[0]
	);
	const [builderAction, setBuilderAction] = useState<string>(ACTION_TYPES[0]);
	const [builderThreshold, setBuilderThreshold] = useState("500");

	const summary = useMemo(() => {
		const active = rules.filter((rule) => rule.status === "active").length;
		const paused = rules.filter((rule) => rule.status === "paused").length;
		const runsToday = rules
			.filter((rule) => rule.lastRun.toLowerCase().includes("today"))
			.reduce((sum, rule) => sum + Math.min(rule.runsCount, 24), 0);
		const failures =
			rules.filter((rule) => rule.status === "paused").length + 2;
		return { active, paused, runsToday, failures };
	}, [rules]);

	function toggleRule(id: string) {
		setRules((prev) =>
			prev.map((rule) => {
				if (rule.id !== id) return rule;
				const nextStatus: RuleStatus =
					rule.status === "active" ? "paused" : "active";
				toast.success(
					nextStatus === "active"
						? `"${rule.name}" enabled.`
						: `"${rule.name}" paused.`
				);
				return { ...rule, status: nextStatus };
			})
		);
	}

	function createRule() {
		const draft: AutomationRule = {
			id: `rule-${Date.now()}`,
			name: "Draft automation rule",
			trigger: builderTrigger,
			action: builderAction,
			status: "paused",
			lastRun: "Never",
			runsCount: 0,
		};
		setRules((prev) => [draft, ...prev]);
		toast.success("Draft rule created. Configure and enable when ready.");
	}

	function saveBuilder() {
		const name = `${builderTrigger} → ${builderAction}`;
		const rule: AutomationRule = {
			id: `rule-${Date.now()}`,
			name,
			trigger: builderTrigger,
			action: builderAction.includes("threshold")
				? `${builderAction} ($${builderThreshold})`
				: builderAction,
			status: "paused",
			lastRun: "Never",
			runsCount: 0,
		};
		setRules((prev) => [rule, ...prev]);
		toast.success("Automation rule saved as draft.");
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Workflow Automations
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						Define triggers and actions that keep vendor operations moving
						without manual chase-downs.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button size="sm" className="h-9" onClick={createRule}>
						<Plus className="mr-1.5 size-3.5" />
						Create Rule
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{
						label: "Active rules",
						value: summary.active,
						hint: "Currently enabled",
						icon: PlayCircle,
						tone: "text-emerald-700 bg-emerald-500/10",
					},
					{
						label: "Paused",
						value: summary.paused,
						hint: "Temporarily disabled",
						icon: PauseCircle,
						tone: "text-amber-700 bg-amber-500/10",
					},
					{
						label: "Runs today",
						value: summary.runsToday,
						hint: "Triggered executions",
						icon: Activity,
						tone: "text-sky-700 bg-sky-500/10",
					},
					{
						label: "Failures",
						value: summary.failures,
						hint: "Needs attention",
						icon: XCircle,
						tone: "text-red-700 bg-red-500/10",
					},
				].map((item) => {
					const Icon = item.icon;
					return (
						<div
							key={item.label}
							className="rounded-xl border border-border/50 bg-card/70 p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{item.label}
									</p>
									<p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
										{item.value}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{item.hint}
									</p>
								</div>
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-lg",
										item.tone
									)}
								>
									<Icon className="size-4" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid gap-3">
				{rules.map((rule) => (
					<Card
						key={rule.id}
						className="gap-0 border-border/50 bg-card/70 py-0"
					>
						<CardContent className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex min-w-0 items-start gap-3">
								<div
									className={cn(
										"mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg",
										rule.status === "active"
											? "bg-emerald-500/10 text-emerald-700"
											: "bg-muted text-muted-foreground"
									)}
								>
									<Workflow className="size-4" />
								</div>
								<div className="min-w-0 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-medium leading-tight">{rule.name}</p>
										<span
											className={cn(
												"inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
												rule.status === "active"
													? "bg-emerald-500/10 text-emerald-700"
													: "bg-amber-500/10 text-amber-700"
											)}
										>
											{rule.status}
										</span>
									</div>
									<p className="text-sm text-muted-foreground">
										<span className="font-medium text-foreground/80">When</span>{" "}
										{rule.trigger}
										<span className="mx-1.5 text-border">·</span>
										<span className="font-medium text-foreground/80">
											Then
										</span>{" "}
										{rule.action}
									</p>
									<p className="text-xs text-muted-foreground">
										Last run {rule.lastRun} · {rule.runsCount} total runs
									</p>
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-3 sm:justify-end">
								<div className="flex items-center gap-2">
									<Label
										htmlFor={`toggle-${rule.id}`}
										className="text-xs text-muted-foreground"
									>
										{rule.status === "active" ? "Enabled" : "Paused"}
									</Label>
									<Switch
										id={`toggle-${rule.id}`}
										checked={rule.status === "active"}
										onCheckedChange={() => toggleRule(rule.id)}
									/>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="h-8"
									onClick={() =>
										toast.message(`Edit "${rule.name}" opens here.`)
									}
								>
									<Pencil className="mr-1.5 size-3.5" />
									Edit
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card className="border border-primary/15 bg-gradient-to-r from-primary/[0.05] via-card to-sky-50/60 gap-2 py-4">
				<CardHeader className="px-4 pb-1 pt-0">
					<CardTitle className="flex items-center gap-2 text-base">
						<Sparkles className="size-4 text-primary" />
						Rule builder
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Pick a trigger, action, and optional threshold, then save a draft
						rule.
					</p>
				</CardHeader>
				<CardContent className="grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="space-y-1.5">
						<Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							Trigger type
						</Label>
						<Select value={builderTrigger} onValueChange={setBuilderTrigger}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Trigger" />
							</SelectTrigger>
							<SelectContent>
								{TRIGGER_TYPES.map((item) => (
									<SelectItem key={item} value={item}>
										{item}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							Action type
						</Label>
						<Select value={builderAction} onValueChange={setBuilderAction}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Action" />
							</SelectTrigger>
							<SelectContent>
								{ACTION_TYPES.map((item) => (
									<SelectItem key={item} value={item}>
										{item}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label
							htmlFor="rule-threshold"
							className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
						>
							Threshold
						</Label>
						<div className="relative">
							<span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
								$
							</span>
							<Input
								id="rule-threshold"
								type="number"
								min={0}
								value={builderThreshold}
								onChange={(event) => setBuilderThreshold(event.target.value)}
								className="h-9 pl-6"
								placeholder="500"
							/>
						</div>
					</div>
					<div className="flex items-end gap-2">
						<Button className="h-9 flex-1" onClick={saveBuilder}>
							Save rule
						</Button>
						<Button
							variant="ghost"
							className="h-9"
							onClick={() => {
								setBuilderTrigger(TRIGGER_TYPES[0]);
								setBuilderAction(ACTION_TYPES[0]);
								setBuilderThreshold("500");
								toast.message("Builder reset.");
							}}
						>
							<RotateCcw className="mr-1.5 size-3.5" />
							Reset
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

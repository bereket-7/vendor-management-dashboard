"use client";

import { useMemo, useState } from "react";

import {
	Download,
	Filter,
	RefreshCw,
	Settings2,
	ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ModeToggle } from "@/components/shared/DropDown/modeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { SettingsTable } from "../components/SettingsTable";
import { useSettingsList } from "../service/queries/setting.query";

export function SettingsPage() {
	const t = useTranslations("Settings");
	const { settings, isInitialLoading, isRefreshing, isEmpty, error } =
		useSettingsList();
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("all");

	const categories = useMemo(
		() =>
			Array.from(new Set(settings.map((setting) => setting.category))).sort(),
		[settings]
	);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return settings.filter((s) => {
			if (category !== "all" && s.category !== category) return false;
			if (!q) return true;
			return (
				s.key.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
			);
		});
	}, [category, settings, search]);

	if (isInitialLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="py-8">
				<p className="text-sm text-destructive">{error.message}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						{t("title")}
					</h1>
					<p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
						{t("subtitle")} {isRefreshing ? t("refreshing") : ""}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" size="sm" className="h-9">
						<RefreshCw className="mr-1.5 size-3.5" />
						Refresh
					</Button>
					<Button variant="outline" size="sm" className="h-9">
						<Download className="mr-1.5 size-3.5" />
						Export settings
					</Button>
				</div>
			</div>

			<Card className="border border-border/60 bg-card">
				<CardHeader className="pb-2">
					<CardTitle className="text-base">Appearance</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-sm font-medium">Theme</p>
						<p className="text-xs text-muted-foreground">
							Switch between light, dark, or system preference. Preference is
							saved in your browser.
						</p>
					</div>
					<ModeToggle />
				</CardContent>
			</Card>

			<Card className="border border-primary/15 bg-gradient-to-r from-primary/[0.05] via-card to-sky-50/60 gap-0 py-0">
				<CardContent className="flex flex-col gap-1.5 px-3 py-2">
					<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
						<Filter className="size-3.5 text-primary" />
						Filters
					</div>
					<div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
						<Input
							placeholder={t("searchPlaceholder")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-9"
						/>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger className="h-9">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All categories</SelectItem>
								{categories.map((item) => (
									<SelectItem key={item} value={item}>
										{item}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{
						label: "Settings",
						value: settings.length,
						hint: "Configured keys",
						icon: Settings2,
						tone: "text-primary bg-primary/10",
					},
					{
						label: "Categories",
						value: categories.length,
						hint: "Functional groups",
						icon: ShieldCheck,
						tone: "text-sky-700 bg-sky-500/10",
					},
					{
						label: "Filtered",
						value: filtered.length,
						hint: "Current result set",
						icon: Settings2,
						tone: "text-emerald-700 bg-emerald-500/10",
					},
					{
						label: "Refresh state",
						value: isRefreshing ? "Syncing" : "Current",
						hint: "Source health",
						icon: RefreshCw,
						tone: "text-violet-700 bg-violet-500/10",
					},
				].map((item) => {
					const Icon = item.icon;
					return (
						<div
							key={item.label}
							className="rounded-xl border border-border/50 bg-card/70 p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{item.label}
									</p>
									<p className="mt-2 text-2xl font-semibold tracking-tight">
										{item.value}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{item.hint}
									</p>
								</div>
								<div
									className={cn(
										"flex size-10 items-center justify-center rounded-lg",
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

			{isEmpty ? (
				<p className="text-sm text-muted-foreground">{t("emptyList")}</p>
			) : (
				<Card className="bg-card/70">
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Configuration register</CardTitle>
					</CardHeader>
					<CardContent className="px-0 pb-0">
						<div className="border-t border-border/50 px-0 pb-0">
							<SettingsTable settings={filtered} />
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

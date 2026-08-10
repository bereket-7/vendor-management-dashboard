"use client";

import { useMemo, useState } from "react";

import { Search } from "lucide-react";

import { VendorCoreGate } from "@/components/vendor-core/VendorCoreGate";
import {
	VendorCoreErrorBanner,
	VendorCoreLiveChrome,
	VendorCoreLoadingRow,
} from "@/components/vendor-core/VendorCoreLiveChrome";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/features/shared/vms/StatusBadge";
import {
	useInvalidateVendorCore,
	useVendorCoreLoginEvents,
	useVendorCoreUsers,
} from "@/lib/vendor-core/hooks";
import type { LoginEventDto } from "@/lib/vendor-core/types";

function rolesForUser(u: {
	is_superuser?: boolean;
	is_admin?: boolean;
	is_staff?: boolean;
}): string[] {
	const roles: string[] = [];
	if (u.is_superuser) roles.push("superuser");
	if (u.is_admin) roles.push("admin");
	if (u.is_staff) roles.push("staff");
	if (!roles.length) roles.push("user");
	return roles;
}

function eventUserLabel(ev: LoginEventDto): string {
	if (ev.user && typeof ev.user === "object") {
		return ev.user.full_name || ev.user.username || ev.username;
	}
	return ev.username;
}

function UsersLiveBody() {
	const invalidate = useInvalidateVendorCore();
	const usersQ = useVendorCoreUsers();
	const [eventScope, setEventScope] = useState<"all" | "me">("all");
	const eventsQ = useVendorCoreLoginEvents(eventScope);
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<"users" | "login-events">("users");

	const users = useMemo(() => {
		const q = search.trim().toLowerCase();
		return (usersQ.data ?? []).filter((u) => {
			if (!q) return true;
			return `${u.full_name} ${u.username} ${u.email}`
				.toLowerCase()
				.includes(q);
		});
	}, [usersQ.data, search]);

	const events = useMemo(() => {
		const q = search.trim().toLowerCase();
		return (eventsQ.data ?? []).filter((e) => {
			if (!q) return true;
			return `${e.username} ${e.login_type} ${e.remote_ip ?? ""} ${eventUserLabel(e)}`
				.toLowerCase()
				.includes(q);
		});
	}, [eventsQ.data, search]);

	const loading =
		tab === "users"
			? usersQ.isLoading
			: eventsQ.isLoading;
	const error =
		tab === "users"
			? usersQ.error?.message
			: eventsQ.error?.message;

	return (
		<VendorCoreLiveChrome
			title="Users"
			subtitle="Directory and login events from vendor-core"
			onRefresh={() => void invalidate()}
			refreshing={loading}
		>
			{error ? <VendorCoreErrorBanner message={error} /> : null}

			<div className="flex flex-wrap items-center gap-2">
				<div className="flex rounded-md border p-0.5">
					<button
						type="button"
						className={`rounded px-3 py-1.5 text-sm ${
							tab === "users"
								? "bg-muted font-medium"
								: "text-muted-foreground"
						}`}
						onClick={() => setTab("users")}
					>
						Users
					</button>
					<button
						type="button"
						className={`rounded px-3 py-1.5 text-sm ${
							tab === "login-events"
								? "bg-muted font-medium"
								: "text-muted-foreground"
						}`}
						onClick={() => setTab("login-events")}
					>
						Login events
					</button>
				</div>
				<div className="relative max-w-sm flex-1">
					<Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder={
							tab === "users" ? "Search users…" : "Search login events…"
						}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				{tab === "login-events" ? (
					<Select
						value={eventScope}
						onValueChange={(v) => setEventScope(v as "all" | "me")}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All users</SelectItem>
							<SelectItem value="me">My events</SelectItem>
						</SelectContent>
					</Select>
				) : null}
			</div>

			{loading && !(tab === "users" ? usersQ.data : eventsQ.data) ? (
				<VendorCoreLoadingRow />
			) : tab === "users" ? (
				<div className="overflow-x-auto rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Username</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Roles</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((u) => (
								<TableRow key={u.id}>
									<TableCell className="font-medium">
										{u.full_name || `${u.first_name} ${u.last_name}`.trim()}
									</TableCell>
									<TableCell className="font-mono text-xs">{u.username}</TableCell>
									<TableCell>{u.email}</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{rolesForUser(u).map((role) => (
												<Badge key={role} variant="secondary">
													{role}
												</Badge>
											))}
										</div>
									</TableCell>
									<TableCell>
										<StatusBadge
											status={u.is_active ? "active" : "inactive"}
										/>
									</TableCell>
								</TableRow>
							))}
							{!users.length ? (
								<TableRow>
									<TableCell colSpan={5} className="text-muted-foreground">
										No users returned from the API.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</div>
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>When</TableHead>
								<TableHead>User</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>IP</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{events.map((ev) => (
								<TableRow key={String(ev.id)}>
									<TableCell className="whitespace-nowrap text-xs text-muted-foreground">
										{ev.datetime
											? new Date(ev.datetime).toLocaleString()
											: "—"}
									</TableCell>
									<TableCell className="font-medium">
										{eventUserLabel(ev)}
										<span className="ml-2 font-mono text-xs text-muted-foreground">
											{ev.username}
										</span>
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{ev.login_type_label || ev.login_type}
										</Badge>
									</TableCell>
									<TableCell className="font-mono text-xs">
										{ev.remote_ip || "—"}
									</TableCell>
								</TableRow>
							))}
							{!events.length ? (
								<TableRow>
									<TableCell colSpan={4} className="text-muted-foreground">
										No login events returned from the API.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</div>
			)}
		</VendorCoreLiveChrome>
	);
}

export function UsersLivePage() {
	return (
		<VendorCoreGate title="Users">
			<UsersLiveBody />
		</VendorCoreGate>
	);
}

"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
	AlertTriangle,
	BadgeCheck,
	ClipboardList,
	IdCard,
	Loader2,
	MapPin,
	Network,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { VendorCoreLoadingRow } from "@/components/vendor-core/VendorCoreLiveChrome";
import {
	createProviderCredential,
	createProviderException,
	createProviderIdentifier,
	createProviderLocation,
	createProviderNetwork,
	updateProviderCredential,
	updateProviderException,
	updateProviderIdentifier,
	updateProviderLocation,
	updateProviderNetwork,
} from "@/features/admin/features/providers/feature/api/providersApi";
import { useInvalidateVendorCore } from "@/features/admin/features/providers/feature/queries/useProvidersQuery";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { vendorCoreApi } from "@/lib/vendor-core/api";

export const PROVIDER_SECTION_IDS = [
	"locations",
	"identifiers",
	"networks",
	"credentials",
	"exceptions",
] as const;

export type ProviderSectionId = (typeof PROVIDER_SECTION_IDS)[number];

const SECTION_META: Record<
	ProviderSectionId,
	{ title: string; hint: string; icon: typeof MapPin; tabLabel: string }
> = {
	locations: {
		title: "Locations",
		hint: "Practice sites & addresses",
		icon: MapPin,
		tabLabel: "Locations",
	},
	identifiers: {
		title: "Identifiers",
		hint: "Tax ID, UPIN & other IDs",
		icon: IdCard,
		tabLabel: "Identifiers",
	},
	networks: {
		title: "Network Participation",
		hint: "Plans, payers & status",
		icon: Network,
		tabLabel: "Network Participation",
	},
	credentials: {
		title: "Credentials",
		hint: "Licenses & verification",
		icon: BadgeCheck,
		tabLabel: "Credentialing & Exceptions",
	},
	exceptions: {
		title: "Exceptions",
		hint: "Credentialing & enrollment issues",
		icon: AlertTriangle,
		tabLabel: "Credentialing & Exceptions",
	},
};

export function isProviderSectionId(
	value: string | null
): value is ProviderSectionId {
	return (
		value != null && (PROVIDER_SECTION_IDS as readonly string[]).includes(value)
	);
}

export function providerSectionEditHref(
	providerId: string,
	section: ProviderSectionId,
	itemId?: string
) {
	const qs = new URLSearchParams({ section });
	if (itemId) qs.set("itemId", itemId);
	return `/admin/providers/${providerId}/edit?${qs.toString()}`;
}

export function providerSectionReturnHref(
	providerId: string,
	section: ProviderSectionId
) {
	return `/admin/providers/${providerId}?tab=${encodeURIComponent(SECTION_META[section].tabLabel)}`;
}

function Field({
	label,
	children,
	required,
}: {
	label: string;
	children: ReactNode;
	required?: boolean;
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs font-medium text-muted-foreground">
				{label}
				{required ? <span className="text-destructive"> *</span> : null}
			</Label>
			{children}
		</div>
	);
}

function emptyToNull(value: string): string | null {
	const v = value.trim();
	return v ? v : null;
}

type LocationForm = {
	name: string;
	address_line1: string;
	address_line2: string;
	city: string;
	state: string;
	postal_code: string;
	phone: string;
	status: string;
	is_primary: boolean;
};

type IdentifierForm = { label: string; value: string; is_primary: boolean };

type NetworkForm = {
	network_plan: string;
	payer: string;
	status: string;
	effective_date: string;
	end_date: string;
};

type CredentialForm = {
	label: string;
	issuer: string;
	status: string;
	verified_date: string;
	expiration_date: string;
};

type ExceptionForm = {
	exception_type: string;
	description: string;
	status: string;
	date_identified: string;
};

const EMPTY_LOCATION: LocationForm = {
	name: "",
	address_line1: "",
	address_line2: "",
	city: "",
	state: "",
	postal_code: "",
	phone: "",
	status: "active",
	is_primary: false,
};

const EMPTY_IDENTIFIER: IdentifierForm = {
	label: "",
	value: "",
	is_primary: false,
};

const EMPTY_NETWORK: NetworkForm = {
	network_plan: "",
	payer: "",
	status: "pending",
	effective_date: "",
	end_date: "",
};

const EMPTY_CREDENTIAL: CredentialForm = {
	label: "",
	issuer: "",
	status: "pending",
	verified_date: "",
	expiration_date: "",
};

const EMPTY_EXCEPTION: ExceptionForm = {
	exception_type: "",
	description: "",
	status: "open",
	date_identified: "",
};

export function ProviderSectionEditor({
	providerId,
	section,
	itemId,
}: {
	providerId: string;
	section: ProviderSectionId;
	itemId?: string | null;
}) {
	const router = useRouter();
	const invalidate = useInvalidateVendorCore();
	const meta = SECTION_META[section];
	const Icon = meta.icon;
	const isEdit = Boolean(itemId);
	const cancelHref = providerSectionReturnHref(providerId, section);

	const [loading, setLoading] = useState(isEdit);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [location, setLocation] = useState<LocationForm>(EMPTY_LOCATION);
	const [identifier, setIdentifier] =
		useState<IdentifierForm>(EMPTY_IDENTIFIER);
	const [network, setNetwork] = useState<NetworkForm>(EMPTY_NETWORK);
	const [credential, setCredential] =
		useState<CredentialForm>(EMPTY_CREDENTIAL);
	const [exception, setException] = useState<ExceptionForm>(EMPTY_EXCEPTION);

	useEffect(() => {
		if (!itemId) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setLoadError(null);

		(async () => {
			try {
				if (section === "locations") {
					const page = await vendorCoreApi.listProviderLocations(providerId);
					const row = page.results?.find((r) => r.id === itemId);
					if (!row) throw new Error("Location not found.");
					if (cancelled) return;
					setLocation({
						name: row.name ?? "",
						address_line1: row.address_line1 ?? "",
						address_line2: row.address_line2 ?? "",
						city: row.city ?? "",
						state: row.state ?? "",
						postal_code: row.postal_code ?? "",
						phone: row.phone ?? "",
						status: row.status || "active",
						is_primary: Boolean(row.is_primary),
					});
				} else if (section === "identifiers") {
					const page = await vendorCoreApi.listProviderIdentifiers(providerId);
					const row = page.results?.find((r) => r.id === itemId);
					if (!row) throw new Error("Identifier not found.");
					if (cancelled) return;
					setIdentifier({
						label: row.label ?? "",
						value: row.value ?? "",
						is_primary: Boolean(row.is_primary),
					});
				} else if (section === "networks") {
					const page = await vendorCoreApi.listProviderNetworks(providerId);
					const row = page.results?.find((r) => r.id === itemId);
					if (!row) throw new Error("Network not found.");
					if (cancelled) return;
					setNetwork({
						network_plan: row.network_plan ?? "",
						payer: row.payer ?? "",
						status: row.status || "pending",
						effective_date: row.effective_date?.slice(0, 10) ?? "",
						end_date: row.end_date?.slice(0, 10) ?? "",
					});
				} else if (section === "credentials") {
					const page = await vendorCoreApi.listProviderCredentials(providerId);
					const row = page.results?.find((r) => r.id === itemId);
					if (!row) throw new Error("Credential not found.");
					if (cancelled) return;
					setCredential({
						label: row.label ?? "",
						issuer: row.issuer ?? "",
						status: row.status || "pending",
						verified_date: row.verified_date?.slice(0, 10) ?? "",
						expiration_date: row.expiration_date?.slice(0, 10) ?? "",
					});
				} else {
					const page = await vendorCoreApi.listProviderExceptions(providerId);
					const row = page.results?.find((r) => r.id === itemId);
					if (!row) throw new Error("Exception not found.");
					if (cancelled) return;
					setException({
						exception_type: row.exception_type ?? "",
						description: row.description ?? "",
						status: row.status || "open",
						date_identified: row.date_identified?.slice(0, 10) ?? "",
					});
				}
			} catch (err) {
				if (!cancelled) {
					setLoadError(
						err instanceof Error ? err.message : "Failed to load record."
					);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [providerId, section, itemId]);

	const heading = useMemo(
		() => (isEdit ? `Edit ${meta.title}` : `Add ${meta.title}`),
		[isEdit, meta.title]
	);

	async function submit() {
		setBusy(true);
		setError(null);
		try {
			if (section === "locations") {
				const body = {
					name: location.name.trim(),
					address_line1: location.address_line1.trim(),
					address_line2: location.address_line2.trim(),
					city: location.city.trim(),
					state: location.state.trim(),
					postal_code: location.postal_code.trim(),
					phone: location.phone.trim(),
					status: location.status,
					is_primary: location.is_primary,
				};
				if (itemId) await updateProviderLocation(providerId, itemId, body);
				else await createProviderLocation(providerId, body);
			} else if (section === "identifiers") {
				if (!identifier.label.trim() || !identifier.value.trim()) {
					throw new Error("Label and value are required.");
				}
				const body = {
					label: identifier.label.trim(),
					value: identifier.value.trim(),
					is_primary: identifier.is_primary,
				};
				if (itemId) await updateProviderIdentifier(providerId, itemId, body);
				else await createProviderIdentifier(providerId, body);
			} else if (section === "networks") {
				const body = {
					network_plan: network.network_plan.trim(),
					payer: network.payer.trim(),
					status: network.status,
					effective_date: emptyToNull(network.effective_date),
					end_date: emptyToNull(network.end_date),
				};
				if (itemId) await updateProviderNetwork(providerId, itemId, body);
				else await createProviderNetwork(providerId, body);
			} else if (section === "credentials") {
				if (!credential.label.trim()) throw new Error("Label is required.");
				const body = {
					label: credential.label.trim(),
					issuer: credential.issuer.trim(),
					status: credential.status,
					verified_date: emptyToNull(credential.verified_date),
					expiration_date: emptyToNull(credential.expiration_date),
				};
				if (itemId) await updateProviderCredential(providerId, itemId, body);
				else await createProviderCredential(providerId, body);
			} else {
				if (!exception.exception_type.trim()) {
					throw new Error("Type is required.");
				}
				const body = {
					exception_type: exception.exception_type.trim(),
					description: exception.description.trim(),
					status: exception.status,
					date_identified: emptyToNull(exception.date_identified),
				};
				if (itemId) await updateProviderException(providerId, itemId, body);
				else await createProviderException(providerId, body);
			}

			await invalidate();
			toast.success(isEdit ? "Saved." : "Created.");
			router.push(cancelHref);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to save changes.";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}

	if (loading) {
		return (
			<VendorCoreLoadingRow label={`Loading ${meta.title.toLowerCase()}…`} />
		);
	}

	if (loadError) {
		return (
			<div className="space-y-3">
				<p className="text-sm text-destructive">{loadError}</p>
				<Button asChild variant="outline" size="sm">
					<Link href={cancelHref}>Back to provider</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full space-y-5 pb-4 lg:space-y-6">
			<header className="rounded-lg border border-border/50 bg-card/60 px-4 py-4 sm:px-5">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0 space-y-1.5">
						<p className="text-xs text-muted-foreground">
							<Link
								href="/admin/providers"
								className="transition-colors hover:text-foreground"
							>
								Providers
							</Link>
							<span className="mx-1.5 text-border/80">/</span>
							<Link
								href={`/admin/providers/${providerId}`}
								className="transition-colors hover:text-foreground"
							>
								Provider
							</Link>
							<span className="mx-1.5 text-border/80">/</span>
							<span className="font-medium text-foreground">{heading}</span>
						</p>
						<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							{heading}
						</h1>
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Focused editor — only the {meta.title.toLowerCase()} step is
							active. Save returns to the provider detail tab.
						</p>
					</div>
					<p className="text-xs tabular-nums text-muted-foreground">
						Step 1 of 1
					</p>
				</div>
			</header>

			<div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-6">
				<aside className="hidden lg:sticky lg:top-4 lg:block">
					<nav
						aria-label="Section step"
						className="rounded-2xl border border-border/50 bg-card p-3"
					>
						<div className="flex items-start gap-2 rounded-lg bg-primary/5 px-2 py-2">
							<span
								className={cn(
									"relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
								)}
							>
								<Icon className="size-4" strokeWidth={2} />
							</span>
							<span className="min-w-0 pt-1">
								<p className="text-xs font-semibold text-foreground">
									{meta.title}
								</p>
								<p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
									{meta.hint}
								</p>
							</span>
						</div>
					</nav>
				</aside>

				<section className="flex min-h-140 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
					<div className="border-b border-border/40 px-6 py-5 sm:px-8 sm:py-6">
						<div className="flex items-center gap-2.5">
							<span
								aria-hidden
								className="h-5 w-0.5 shrink-0 rounded-full bg-primary"
							/>
							<h2 className="text-lg font-semibold tracking-tight text-foreground">
								{meta.title}
							</h2>
						</div>
					</div>

					<div className="flex-1 space-y-4 px-6 py-7 sm:px-8 sm:py-8">
						{section === "locations" ? (
							<>
								<Field label="Name">
									<Input
										value={location.name}
										onChange={(e) =>
											setLocation((p) => ({ ...p, name: e.target.value }))
										}
									/>
								</Field>
								<Field label="Address line 1">
									<Input
										value={location.address_line1}
										onChange={(e) =>
											setLocation((p) => ({
												...p,
												address_line1: e.target.value,
											}))
										}
									/>
								</Field>
								<Field label="Address line 2">
									<Input
										value={location.address_line2}
										onChange={(e) =>
											setLocation((p) => ({
												...p,
												address_line2: e.target.value,
											}))
										}
									/>
								</Field>
								<div className="grid gap-3 sm:grid-cols-3">
									<Field label="City">
										<Input
											value={location.city}
											onChange={(e) =>
												setLocation((p) => ({ ...p, city: e.target.value }))
											}
										/>
									</Field>
									<Field label="State">
										<Input
											value={location.state}
											onChange={(e) =>
												setLocation((p) => ({ ...p, state: e.target.value }))
											}
										/>
									</Field>
									<Field label="Postal">
										<Input
											value={location.postal_code}
											onChange={(e) =>
												setLocation((p) => ({
													...p,
													postal_code: e.target.value,
												}))
											}
										/>
									</Field>
								</div>
								<Field label="Phone">
									<Input
										value={location.phone}
										onChange={(e) =>
											setLocation((p) => ({ ...p, phone: e.target.value }))
										}
									/>
								</Field>
								<Field label="Status">
									<Select
										value={location.status}
										onValueChange={(v) =>
											setLocation((p) => ({ ...p, status: v }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="inactive">Inactive</SelectItem>
											<SelectItem value="pending">Pending</SelectItem>
											<SelectItem value="termed">Termed</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<label className="flex items-center gap-2 text-sm">
									<Checkbox
										checked={location.is_primary}
										onCheckedChange={(v) =>
											setLocation((p) => ({ ...p, is_primary: v === true }))
										}
									/>
									Primary location
								</label>
							</>
						) : null}

						{section === "identifiers" ? (
							<>
								<Field label="Label" required>
									<Input
										value={identifier.label}
										onChange={(e) =>
											setIdentifier((p) => ({ ...p, label: e.target.value }))
										}
										placeholder="e.g. Tax ID"
									/>
								</Field>
								<Field label="Value" required>
									<Input
										value={identifier.value}
										onChange={(e) =>
											setIdentifier((p) => ({ ...p, value: e.target.value }))
										}
									/>
								</Field>
								<label className="flex items-center gap-2 text-sm">
									<Checkbox
										checked={identifier.is_primary}
										onCheckedChange={(v) =>
											setIdentifier((p) => ({ ...p, is_primary: v === true }))
										}
									/>
									Primary identifier
								</label>
							</>
						) : null}

						{section === "networks" ? (
							<>
								<Field label="Network / plan">
									<Input
										value={network.network_plan}
										onChange={(e) =>
											setNetwork((p) => ({
												...p,
												network_plan: e.target.value,
											}))
										}
									/>
								</Field>
								<Field label="Payer">
									<Input
										value={network.payer}
										onChange={(e) =>
											setNetwork((p) => ({ ...p, payer: e.target.value }))
										}
									/>
								</Field>
								<Field label="Status">
									<Select
										value={network.status}
										onValueChange={(v) =>
											setNetwork((p) => ({ ...p, status: v }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="in_network">In-network</SelectItem>
											<SelectItem value="out_of_network">
												Out-of-network
											</SelectItem>
											<SelectItem value="pending">Pending</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<div className="grid gap-3 sm:grid-cols-2">
									<Field label="Effective date">
										<Input
											type="date"
											value={network.effective_date}
											onChange={(e) =>
												setNetwork((p) => ({
													...p,
													effective_date: e.target.value,
												}))
											}
										/>
									</Field>
									<Field label="End date">
										<Input
											type="date"
											value={network.end_date}
											onChange={(e) =>
												setNetwork((p) => ({
													...p,
													end_date: e.target.value,
												}))
											}
										/>
									</Field>
								</div>
							</>
						) : null}

						{section === "credentials" ? (
							<>
								<Field label="Label" required>
									<Input
										value={credential.label}
										onChange={(e) =>
											setCredential((p) => ({ ...p, label: e.target.value }))
										}
									/>
								</Field>
								<Field label="Issuer">
									<Input
										value={credential.issuer}
										onChange={(e) =>
											setCredential((p) => ({ ...p, issuer: e.target.value }))
										}
									/>
								</Field>
								<Field label="Status">
									<Select
										value={credential.status}
										onValueChange={(v) =>
											setCredential((p) => ({ ...p, status: v }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="complete">Complete</SelectItem>
											<SelectItem value="expiring">Expiring</SelectItem>
											<SelectItem value="expired">Expired</SelectItem>
											<SelectItem value="pending">Pending</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<div className="grid gap-3 sm:grid-cols-2">
									<Field label="Verified">
										<Input
											type="date"
											value={credential.verified_date}
											onChange={(e) =>
												setCredential((p) => ({
													...p,
													verified_date: e.target.value,
												}))
											}
										/>
									</Field>
									<Field label="Expires">
										<Input
											type="date"
											value={credential.expiration_date}
											onChange={(e) =>
												setCredential((p) => ({
													...p,
													expiration_date: e.target.value,
												}))
											}
										/>
									</Field>
								</div>
							</>
						) : null}

						{section === "exceptions" ? (
							<>
								<Field label="Type" required>
									<Input
										value={exception.exception_type}
										onChange={(e) =>
											setException((p) => ({
												...p,
												exception_type: e.target.value,
											}))
										}
									/>
								</Field>
								<Field label="Description">
									<Input
										value={exception.description}
										onChange={(e) =>
											setException((p) => ({
												...p,
												description: e.target.value,
											}))
										}
									/>
								</Field>
								<Field label="Status">
									<Select
										value={exception.status}
										onValueChange={(v) =>
											setException((p) => ({ ...p, status: v }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="open">Open</SelectItem>
											<SelectItem value="in_progress">In progress</SelectItem>
											<SelectItem value="resolved">Resolved</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<Field label="Identified">
									<Input
										type="date"
										value={exception.date_identified}
										onChange={(e) =>
											setException((p) => ({
												...p,
												date_identified: e.target.value,
											}))
										}
									/>
								</Field>
							</>
						) : null}
					</div>

					{error ? (
						<p className="border-t border-destructive/20 bg-destructive/5 px-6 py-3 text-sm text-destructive sm:px-8">
							{error}
						</p>
					) : null}

					<footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 px-6 py-4 sm:px-8">
						<Button
							asChild
							variant="ghost"
							className="px-0 text-muted-foreground transition-colors hover:text-foreground"
						>
							<Link href={cancelHref}>Cancel</Link>
						</Button>
						<Button
							type="button"
							disabled={busy}
							onClick={() => void submit()}
							className="min-w-32 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
						>
							{busy ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : (
								<ClipboardList className="mr-2 size-4" />
							)}
							{isEdit ? "Save changes" : "Create"}
						</Button>
					</footer>
				</section>
			</div>
		</div>
	);
}

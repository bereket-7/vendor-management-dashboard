"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

export function InviteAcceptPage() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const [password, setPassword] = useState("");
	const [accepted, setAccepted] = useState(false);

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (token && password.length >= 8) setAccepted(true);
	}

	return (
		<main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
			<div className="w-full rounded-xl border border-border bg-card shadow-sm p-6 shadow-sm">
				{accepted ? (
					<div className="space-y-4 text-center">
						<h1 className="text-xl font-semibold">Invitation accepted</h1>
						<p className="text-sm text-muted-foreground">
							Your account is ready. Sign in to continue vendor onboarding.
						</p>
						<Button asChild className="w-full">
							<Link href="/login">Go to sign in</Link>
						</Button>
					</div>
				) : (
					<form onSubmit={submit} className="space-y-5">
						<div>
							<h1 className="text-xl font-semibold">
								Accept vendor invitation
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Set a password to activate your supplier account.
							</p>
						</div>
						<div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
							Invitation token:{" "}
							<span className="font-mono text-foreground">
								{token ?? "Missing"}
							</span>
						</div>
						<label className="grid gap-2 text-sm font-medium">
							Password
							<Input
								type="password"
								minLength={8}
								required
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
							<span className="text-xs font-normal text-muted-foreground">
								Use at least 8 characters.
							</span>
						</label>
						<Button type="submit" className="w-full" disabled={!token}>
							Accept invitation
						</Button>
						{!token && (
							<p className="text-sm text-destructive">
								This invitation link is missing a token.
							</p>
						)}
					</form>
				)}
			</div>
		</main>
	);
}

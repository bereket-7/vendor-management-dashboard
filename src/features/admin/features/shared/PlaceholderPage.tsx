"use client";

import { Construction } from "lucide-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type PlaceholderPageProps = {
	title: string;
	description?: string;
};

export function PlaceholderPage({
	title,
	description = "This workspace is scaffolded and will be connected to live data in a later release.",
}: PlaceholderPageProps) {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
					{title}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
			<Card className="border-border/50 bg-card shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Construction className="size-4 text-primary" />
						Coming soon
					</CardTitle>
					<CardDescription>
						Navigation is wired to match the product IA. Content for this
						section will land next.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Use the sidebar to continue through Vendor Management, Operations, and
					Administration.
				</CardContent>
			</Card>
		</div>
	);
}

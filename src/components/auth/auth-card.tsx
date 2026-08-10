import type { ReactNode } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardProps = {
	title: string;
	description: string;
	children: ReactNode;
	className?: string;
};

export function AuthCard({
	title,
	description,
	children,
	className,
}: AuthCardProps) {
	return (
		<Card
			className={cn(
				"w-full border-border/80 bg-card/95 shadow-md shadow-primary/5 backdrop-blur-sm",
				className
			)}
		>
			<CardHeader className="space-y-1.5 pb-2">
				<CardTitle className="text-2xl font-semibold tracking-tight">
					{title}
				</CardTitle>
				<CardDescription className="text-sm leading-relaxed">
					{description}
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-4">{children}</CardContent>
		</Card>
	);
}

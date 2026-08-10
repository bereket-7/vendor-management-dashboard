"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useScorecardsList } from "@/features/shared/vms/queries";
import { formatDate } from "@/features/shared/vms/utils";

function scoreColor(score: number) {
	if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
	if (score >= 75) return "text-amber-600 dark:text-amber-400";
	return "text-red-600 dark:text-red-400";
}

export function PerformancePage() {
	const { scorecards, isLoading, error } = useScorecardsList();
	return (
		<div className="container space-y-6 py-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Vendor performance
				</h1>
				<p className="text-sm text-muted-foreground">
					Compare delivery, quality, responsiveness, and compliance scorecards.
				</p>
			</div>
			{isLoading ? (
				<Skeleton className="h-72 w-full" />
			) : error ? (
				<p className="text-sm text-destructive">Unable to load scorecards.</p>
			) : (
				<div className="rounded-xl border border-border bg-card shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Vendor</TableHead>
								<TableHead>Period</TableHead>
								<TableHead>OTIF</TableHead>
								<TableHead>Quality</TableHead>
								<TableHead>Responsiveness</TableHead>
								<TableHead>Compliance</TableHead>
								<TableHead>Overall</TableHead>
								<TableHead>Updated</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{scorecards.map((scorecard) => (
								<TableRow key={scorecard.id}>
									<TableCell className="font-medium">
										{scorecard.vendorName}
									</TableCell>
									<TableCell>{scorecard.period}</TableCell>
									<TableCell>{scorecard.otif}%</TableCell>
									<TableCell>{scorecard.quality}%</TableCell>
									<TableCell>{scorecard.responsiveness}%</TableCell>
									<TableCell>{scorecard.compliance}%</TableCell>
									<TableCell
										className={`text-base font-bold ${scoreColor(scorecard.overall)}`}
									>
										{scorecard.overall}%
									</TableCell>
									<TableCell>{formatDate(scorecard.updatedAt)}</TableCell>
								</TableRow>
							))}
							{scorecards.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={8}
										className="h-24 text-center text-muted-foreground"
									>
										No scorecards available.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}

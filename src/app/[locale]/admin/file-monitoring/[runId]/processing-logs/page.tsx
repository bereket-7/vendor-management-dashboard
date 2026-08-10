import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ProcessingLogsPage } from "@/features/admin/features/processing-logs/pages/ProcessingLogsPage";

export default function Page() {
	return (
		<Suspense
			fallback={
				<div className="space-y-4">
					<Skeleton className="h-10 w-64" />
					<Skeleton className="h-96 w-full rounded-xl" />
				</div>
			}
		>
			<ProcessingLogsPage />
		</Suspense>
	);
}

"use client";

import { CmsEdgeBlankTab } from "@/features/admin/features/claim-encounter/cms-edge/CmsEdgeShared";
import { CMS_EDGE_TAB_META } from "@/features/admin/features/claim-encounter/cms-edge/feature/queries/useCmsEdgeQuery";

export function CmsEdgeConfigurationTab() {
	const meta = CMS_EDGE_TAB_META.configuration;

	return <CmsEdgeBlankTab title={meta.title} description={meta.description} />;
}

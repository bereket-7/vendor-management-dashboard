import { vendorCoreApi } from "@/lib/vendor-core/api";
import type { RoutingRuleDto } from "@/lib/vendor-core/types";

import type { RoutingRulesCreateDto } from "../dto/routingRulesDto";

export async function listRoutingRules(): Promise<RoutingRuleDto[]> {
	const page = await vendorCoreApi.listRoutingRules();
	return page.results ?? [];
}

export async function getRoutingRules(id: string): Promise<RoutingRuleDto> {
	return vendorCoreApi.getRoutingRule(id);
}

export async function createRoutingRules(
	input: RoutingRulesCreateDto
): Promise<RoutingRuleDto> {
	return vendorCoreApi.createRoutingRule(input);
}

export async function updateRoutingRules(
	id: string,
	input: Record<string, unknown>
): Promise<RoutingRuleDto> {
	return vendorCoreApi.updateRoutingRule(id, input);
}

export async function deleteRoutingRules(id: string): Promise<void> {
	await vendorCoreApi.deleteRoutingRule(id);
}

export async function restoreRoutingRules(id: string): Promise<RoutingRuleDto> {
	return vendorCoreApi.restoreRoutingRule(id);
}

export async function hardDeleteRoutingRules(id: string): Promise<void> {
	await vendorCoreApi.hardDeleteRoutingRule(id);
}
